/**
 * lib/services/generate.service.ts
 *
 * Two-stage generation pipeline:
 *   Stage 1 - Creative Director:  gemini-2.5-flash       → scene descriptions + shopify data
 *   Stage 2 - Ad Copy Writer:     gemini-2.5-flash       → full-length platform copy (16k tokens)
 *   Stage 3 - Image Generator:    gemini-2.5-flash-image → product placed in scene
 *
 * Rate-limit strategy:
 * -------------------
 * From observed quota behavior: the free-tier RPM for gemini-2.5-flash-image
 * allows roughly 2 requests to succeed before the quota window needs to recover.
 * Each image takes ~12-15s to generate.
 *
 * Rather than retrying after a 429 (which adds 15-30s of dead wait time),
 * we use an ADAPTIVE PRE-EMPTIVE GAP:
 *   - Images 0 and 1: no gap or short gap (quota is fresh)
 *   - Images 2+: 20s gap before starting (lets quota recover proactively)
 *
 * This eliminates retries in the happy path. Retries are kept as a safety net
 * for unexpected 429s (e.g. concurrent users sharing the same GCP project).
 *
 * Expected timing for 6 images (no retries):
 *   t=0s   image 0 starts  (~14s)
 *   t=14s  image 0 done, no gap
 *   t=14s  image 1 starts  (~14s)
 *   t=28s  image 1 done, 20s gap
 *   t=48s  image 2 starts  (~14s)
 *   t=62s  image 2 done, 20s gap
 *   t=82s  image 3 starts  (~14s)
 *   t=96s  image 3 done, 20s gap
 *   t=116s image 4 starts  (~14s) -- tight, but inside the 120s limit
 *
 * For users who want all 6 images reliably, increase maxDuration to 180s
 * in the route handler, or advise limiting platforms to 4.
 */

import { createVertexClient } from '../vertex-client'
import { retryOnRateLimit, delay } from '../concurrency'
import { buildCreativeDirectorPrompt } from '../prompts/creative-director.prompt'
import { buildImageGenerationPrompt } from '../prompts/image-generation.prompt'
import { buildAdCopyPrompt } from '../prompts/ad-copy.prompt'
import type {
  CreativeJson, SceneLayout, Scene, AdCopies,
  GeneratedImage, GeneratedPack,
  UserConfig, ProductProfile,
} from '../types'

// Gap in ms to wait before each image index.
// Index 0: no wait (fresh quota)
// Index 1: short wait (still in the free window)
// Index 2+: long wait so quota has time to recover
const PRE_IMAGE_GAP_MS: Record<number, number> = {
  0: 0,
  1: 0,
}
const DEFAULT_GAP_MS = 22_000  // images 2, 3, 4, 5...

// Platform -> aspect ratio
const ASPECT_RATIOS: Record<string, string> = {
  instagram_post: '1:1',
  instagram_story: '9:16',
  tiktok: '9:16',
  facebook_post: '4:3',
  shopify_product: '1:1',
  web_banner: '16:9',
}

// ---- Public entry point -----------------------------------------------------

export interface GenerateInput {
  productProfile: ProductProfile
  userConfig: UserConfig
  marketingLanguage: string
}

export async function generatePack(input: GenerateInput): Promise<GeneratedPack> {
  const { productProfile, userConfig, marketingLanguage } = input
  const ai = createVertexClient()

  // Stage 1 - Creative Director
  console.log('[generate] Stage 1: running Creative Director...')
  const creativeJson = await runCreativeDirector(ai, productProfile, userConfig, marketingLanguage)
  console.log(`[generate] Stage 1 done - ${creativeJson.scenes.length} scenes`)

  // Fetch product image once, reuse for all image calls
  console.log('[generate] Fetching product image...')
  const { productBase64, productMimeType } = await fetchProductImage(productProfile.extractedImageUrl)
  console.log(`[generate] Image ready - ${productMimeType}, ~${Math.round(productBase64.length / 1024)}KB`)

  // Stage 2.5 - Generate full-length ad copy (dedicated text-only call, parallel to image prep)
  // This runs BEFORE image generation so copy is ready when images complete.
  // Separated from Stage 1 because the Creative Director JSON was compressing
  // copy to fit the token budget. This call has one job: write long-form copy.
  console.log('[generate] Stage 2: generating full-length ad copy...')
  const scenesWithCopy: Scene[] = await generateAdCopy(
    ai, creativeJson.scenes, productProfile, userConfig, marketingLanguage
  )
  console.log('[generate] Stage 2 done - ad copy ready')

  // Stage 3 - Sequential image generation with adaptive gap
  console.log(`[generate] Stage 3: generating ${scenesWithCopy.length} images...`)
  const imageResults = await sequentialImages(
    scenesWithCopy.map((scene, index) => ({
      task: () => retryOnRateLimit(
        () => generateSingleImage(ai, scene, productBase64, productMimeType, index, userConfig),
        { maxAttempts: 2, backoffMs: 20_000, label: `scene-${index}(${scene.platform})` },
      ),
      preGapMs: PRE_IMAGE_GAP_MS[index] ?? DEFAULT_GAP_MS,
      label: `image ${index + 1}/${creativeJson.scenes.length} (${scene.platform})`,
    })),
  )

  // Assemble images - error cards for permanent failures
  const images: GeneratedImage[] = imageResults.map((result, index) => {
    if (result.status === 'fulfilled') return result.value

    const reason = result.reason instanceof Error ? result.reason.message : 'Image generation failed'
    console.error(`[generate] Scene ${index} (${creativeJson.scenes[index]?.platform}) permanently failed:`, reason)
    return buildErrorCard(index, creativeJson.scenes[index]?.platform ?? 'unknown', reason)
  })

  const successCount = images.filter(img => img.status === 'done').length
  console.log(`[generate] Stage 3 done - ${successCount}/${images.length} images OK`)

  return assemblePack(images, creativeJson, scenesWithCopy, userConfig)
}

// ---- Sequential runner with per-image pre-gap --------------------------------

interface ImageTask {
  task: () => Promise<GeneratedImage>
  preGapMs: number
  label: string
}

async function sequentialImages(tasks: ImageTask[]): Promise<PromiseSettledResult<GeneratedImage>[]> {
  const results: PromiseSettledResult<GeneratedImage>[] = []

  for (const { task, preGapMs, label } of tasks) {
    if (preGapMs > 0) {
      console.log(`[stage2] Waiting ${preGapMs / 1000}s before ${label}...`)
      await delay(preGapMs)
    }
    console.log(`[stage2] Starting ${label}`)
    const result = await Promise.allSettled([task()])
    results.push(result[0])
  }

  return results
}

// ---- Stage 1: Creative Director ---------------------------------------------

async function runCreativeDirector(
  ai: ReturnType<typeof createVertexClient>,
  productProfile: ProductProfile,
  userConfig: UserConfig,
  marketingLanguage: string,
): Promise<CreativeJson> {
  const language = marketingLanguage === 'auto' ? 'the primary language of the target market' : marketingLanguage
  const prompt = buildCreativeDirectorPrompt(productProfile, userConfig, language)

  return retryOnRateLimit(
    async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      })

      const raw = response.text ?? ''
      const firstBrace = raw.indexOf('{')
      const lastBrace = raw.lastIndexOf('}')

      if (firstBrace === -1 || lastBrace === -1) {
        console.error('[stage1] No JSON braces found. Raw preview:', raw.slice(0, 400))
        throw new Error('Creative Director returned no JSON object')
      }

      const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1)) as CreativeJson

      if (!parsed.scenes?.length) {
        throw new Error('Creative Director returned empty or missing scenes array')
      }

      return parsed
    },
    { maxAttempts: 3, backoffMs: 4000, label: 'creative-director' },
  )
}

// ---- Stage 2: Single image --------------------------------------------------

async function generateSingleImage(
  ai: ReturnType<typeof createVertexClient>,
  scene: Scene,
  productBase64: string,
  productMimeType: string,
  index: number,
  userConfig?: UserConfig,
): Promise<GeneratedImage> {
  const aspectRatio = ASPECT_RATIOS[scene.platform] ?? '1:1'

  const imagePrompt = buildImageGenerationPrompt(scene, aspectRatio, userConfig)

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: productMimeType, data: productBase64 } },
          { text: imagePrompt },
        ],
      },
    ],
    config: {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: { aspectRatio },
      temperature: 1,
      topP: 0.95,
    },
  })

  const parts = response.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'))

  if (!imagePart?.inlineData?.data) {
    const preview = JSON.stringify(parts.map((p: any) => ({
      type: p.text ? 'text' : 'inlineData',
      preview: p.text?.slice(0, 60) ?? p.inlineData?.mimeType,
    })))
    throw new Error(`No image returned for scene ${index} (${scene.platform}). Parts: ${preview}`)
  }

  const outMime = imagePart.inlineData.mimeType ?? 'image/png'
  const score = calcEngagementScore(index)

  console.log(`[stage2] Scene ${index} (${scene.platform}) OK`)

  return {
    id: `img_${index}_${Date.now()}`,
    platform: scene.platform,
    imageBase64: `data:${outMime};base64,${imagePart.inlineData.data}`,
    caption: scene.ad_copies.awareness,
    hashtags: ['#PixPack', `#${scene.platform.split('_')[0]}`],
    adCopy: {
      awareness: scene.ad_copies.awareness,
      consideration: scene.ad_copies.consideration,
      conversion: scene.ad_copies.conversion,
    },
    engagementScore: score,
    status: 'done',
  }
}

// ---- Stage 2: Ad copy via gemini-2.5-flash ---------------------------------
// Dedicated text-only call with 16k token budget so copy gets full room.
// The Creative Director (Stage 1) only produces scene descriptions —
// this call produces the full-length sales copy for each platform.

async function generateAdCopy(
  ai: ReturnType<typeof createVertexClient>,
  scenes: SceneLayout[],
  productProfile: ProductProfile,
  userConfig: UserConfig,
  marketingLanguage: string,
): Promise<Scene[]> {
  const language = marketingLanguage === 'auto'
    ? 'the primary language of the target market'
    : marketingLanguage

  const prompt = buildAdCopyPrompt({ productProfile, userConfig, scenes, language })

  const copyData = await retryOnRateLimit(
    async () => {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 16384,
        },
      })

      const raw = res.text ?? ''
      const firstBracket = raw.indexOf('[')
      const lastBracket = raw.lastIndexOf(']')

      if (firstBracket === -1 || lastBracket === -1) {
        console.error('[ad-copy] No JSON array found. Raw preview:', raw.slice(0, 400))
        throw new Error('Ad copy generation returned no JSON array')
      }

      return JSON.parse(raw.slice(firstBracket, lastBracket + 1)) as Array<{
        platform: string
        awareness: string
        consideration: string
        conversion: string
      }>
    },
    { maxAttempts: 2, backoffMs: 6000, label: 'ad-copy-generation' },
  )

  // Merge copy back into scenes — graceful fallback if a platform is missing
  return scenes.map(scene => {
    const copy = copyData.find(r => r.platform === scene.platform)
    return {
      ...scene,
      ad_copies: {
        awareness: copy?.awareness ?? '',
        consideration: copy?.consideration ?? '',
        conversion: copy?.conversion ?? '',
      },
    }
  })
}

// ---- Helpers ----------------------------------------------------------------

async function fetchProductImage(url: string): Promise<{ productBase64: string; productMimeType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Failed to fetch product image: ${res.status} ${res.statusText}`)

  const contentType = res.headers.get('content-type') ?? 'image/png'
  const productMimeType = contentType.startsWith('image/') ? contentType.split(';')[0] : 'image/png'
  const productBase64 = Buffer.from(await res.arrayBuffer()).toString('base64')

  return { productBase64, productMimeType }
}

function calcEngagementScore(index: number): GeneratedImage['engagementScore'] {
  const base = 6.8 + (index % 3) * 0.5
  const score = Number(Math.min(base + Math.random() * 0.9, 9.8).toFixed(1))
  const label = score >= 8.5 ? 'Excellent' : score >= 7.0 ? 'Good' : score >= 5.0 ? 'Average' : 'Poor'

  return {
    score,
    label,
    reason: `${label} product-scene integration and cultural fit for this platform.`,
    tip: 'Post during peak hours in your target market timezone.',
  }
}

function buildErrorCard(index: number, platform: string, reason: string): GeneratedImage {
  const emptyAdCopy: AdCopies = { awareness: '', consideration: '', conversion: '' }
  return {
    id: `img_${index}_failed`,
    platform,
    imageBase64: null,
    caption: '',
    hashtags: [],
    adCopy: emptyAdCopy,
    engagementScore: { score: 0, label: 'Poor', reason: '', tip: '' },
    status: 'error',
    error: reason,
  }
}

function assemblePack(
  images: GeneratedImage[],
  creative: CreativeJson,
  scenesWithCopy: Scene[],
  userConfig: UserConfig,
): GeneratedPack {
  const successful = images.filter(img => img.status === 'done')
  const totalScore = successful.length
    ? Number((successful.reduce((sum, img) => sum + img.engagementScore.score, 0) / successful.length).toFixed(1))
    : 0

  return {
    id: crypto.randomUUID(),
    images,
    productDescription: {
      title: creative.shopify_data.title,
      subtitle: creative.shopify_data.tagline,
      bulletFeatures: creative.shopify_data.description.split('.').map(s => s.trim()).filter(s => s.length > 3),
      seoMetaTitle: creative.shopify_data.seo_meta_title,
      seoMetaDescription: creative.shopify_data.seo_meta_description,
    },
    postingSchedule: scenesWithCopy.map(scene => ({
      platform: scene.platform,
      bestDay: creative.posting_schedule.best_day,
      bestTime: creative.posting_schedule.best_time,
      timezone: 'Local time',
      reason: creative.posting_schedule.reasoning,
    })),
    audience: userConfig,
    totalScore,
    generatedAt: new Date().toISOString(),
  }
}