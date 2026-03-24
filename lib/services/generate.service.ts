/**
 * lib/services/generate.service.ts
 *
 * NEW MODEL (v2) — single platform, 4 A/B test variations:
 *
 *   Stage 1  gemini-2.5-flash        → 4 scene descriptions for chosen platform
 *   Stage 2  gemini-2.5-flash        → ad copy for all 4 variations
 *   Stage 3  gemini-2.5-flash-image  → 4 images, one per variation
 *
 * Timing budget (Vercel Hobby 180s limit):
 *   Stage 1+2:  ~32s
 *   Image 1:     ~8s  (no gap — fresh quota)
 *   Image 2:     ~8s  (no gap — still in window)
 *   Image 3:    15s gap + 8s = 23s
 *   Image 4:    15s gap + 8s = 23s
 *   Total:      ~94s  — 86s inside limit, retry budget available
 *
 * Each image is streamed to the client via SSE as soon as it completes.
 */

import { Modality } from '@google/genai'
import { createVertexClient } from '../vertex-client'
import { retryOnRateLimit, delay } from '../concurrency'
import { buildCreativeDirectorPrompt } from '../prompts/creative-director.prompt'
import { buildAdCopyPrompt } from '../prompts/ad-copy.prompt'
import { buildImageGenerationPrompt } from '../prompts/image-generation.prompt'
import type {
  CreativeJson, SceneLayout, Scene, AdCopies,
  GeneratedImage, GeneratedPack,
  UserConfig, ProductProfile,
} from '../types'

// ─── Timing ───────────────────────────────────────────────────────────────────

// ─── Timing ───────────────────────────────────────────────────────────────────

const PRE_IMAGE_GAP_MS: Record<number, number> = {
  0: 0,      // image 1: fire immediately — assumes fresh quota
  1: 0, // image 2: always wait 15s to avoid hitting RPM limit
  2: 15_000, // image 3: wait 15s
  3: 15_000, // image 4: wait 15s
}
const DEFAULT_GAP_MS = 15_000

// ─── Aspect ratios ────────────────────────────────────────────────────────────

const ASPECT_RATIOS: Record<string, string> = {
  instagram_post: '1:1',
  instagram_story: '9:16',
  tiktok: '9:16',
  facebook_post: '4:3',
  shopify_product: '1:1',
  web_banner: '16:9',
}

// ─── Streaming callbacks ──────────────────────────────────────────────────────

export interface GenerateCallbacks {
  onStage?: (stage: number, message: string) => Promise<void>
  onImage?: (image: GeneratedImage, base64: string | null) => Promise<void>
}

export interface GenerateInput {
  productProfile: ProductProfile
  userConfig: UserConfig
  marketingLanguage: string
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function generatePack(
  input: GenerateInput,
  callbacks: GenerateCallbacks = {},
  resumeState?: { scenesWithCopy: any[]; startImageIndex: number } | null
): Promise<{ status: 'done'; pack: GeneratedPack } | { status: 'yield'; scenesWithCopy: any[] }> {
  const { productProfile, userConfig, marketingLanguage } = input
  const { onStage, onImage } = callbacks
  const ai = createVertexClient()

  const platform = userConfig.platform ?? 'instagram_post'
  const language = marketingLanguage === 'auto'
    ? 'the primary language of the target market'
    : marketingLanguage

  let scenesWithCopy = resumeState?.scenesWithCopy

  if (!scenesWithCopy) {
    // ── Stage 1: Creative Director → 4 scene variations ──────────────────────
    console.log(`[generate] Stage 1: Creative Director for ${platform}...`)
    onStage?.(1, 'Building 4 creative concepts...')

    const creativeJson = await runCreativeDirector(ai, productProfile, userConfig, language)
    console.log(`[generate] Stage 1 done — ${creativeJson.variations.length} variations`)

    // ── Stage 2: Ad copy for all 4 variations ─────────────────────────────────
    console.log('[generate] Stage 2: generating ad copy...')
    if (onStage) await onStage(2, 'Writing ad copy for each variation...')

    scenesWithCopy = await generateAdCopy(
      ai, creativeJson.variations, productProfile, userConfig, language
    )
    console.log('[generate] Stage 2 done — copy ready')
  } else {
    console.log('[generate] Resuming from pre-existing scenes and copy...')
  }

  // ── Fetch product image ───────────────────────────────────────────────────
  console.log('[generate] Fetching product image...')
  const { productBase64, productMimeType } = await fetchProductImage(productProfile.extractedImageUrl)
  console.log(`[generate] Image ready — ${productMimeType}, ~${Math.round(productBase64.length / 1024)}KB`)

  // ── Stage 3: Generate 4 images sequentially, stream each one ─────────────
  console.log(`[generate] Stage 3: generating ${scenesWithCopy.length} images...`)
  if (onStage) await onStage(3, `Generating ${scenesWithCopy.length} image variations...`)

  const images: GeneratedImage[] = []

  const startTime = Date.now()
  const VERCEL_SAFE_LIMIT_MS = 165_000 // Stop at 165s to safely write results before 180s hard kill

  const startIndex = resumeState?.startImageIndex ?? 0
  for (let index = startIndex; index < scenesWithCopy.length; index++) {
    const scene = scenesWithCopy[index]
    const label = `image ${index + 1}/${scenesWithCopy.length} (${scene.angle})`

    // Yield cleanly if Vercel is about to kill the lambda
    const timeRemaining = VERCEL_SAFE_LIMIT_MS - (Date.now() - startTime)
    if (timeRemaining < 15_000) {
      console.warn(`[stage3] Vercel timeout approaching (${Math.round((Date.now() - startTime) / 1000)}s elapsed). Yielding to spawn a new lambda.`)
      return { status: 'yield', scenesWithCopy }
    }

    const preGapMs = (index > 0) ? 15_000 : 0 // Wait 15s between images (reduced from 20s)

    if (preGapMs > 0) {
      console.log(`[stage3] Waiting ${preGapMs / 1000}s before ${label}...`)
      await delay(Math.min(preGapMs, timeRemaining - 5000))
    }

    console.log(`[stage3] Starting ${label}`)

    let image: GeneratedImage
    let base64: string | null = null
    try {
      const result = await retryOnRateLimit(
        () => generateSingleImage(ai, scene, platform, productBase64, productMimeType, userConfig),
        {
          maxAttempts: 2, // Reduced from 3
          backoffMs: 15_000, // Reduced from 30s
          label: `variation-${scene.variation}(${scene.angle})`
        },
      )
      image = result.image
      base64 = result.base64
      console.log(`[stage3] Variation ${scene.variation} (${scene.angle}) OK`)
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : 'Image generation failed'
      const is429 = /429|quota|RESOURCE_EXHAUSTED/i.test(reason)
      console.warn(`[stage3] Variation ${scene.variation} failed${is429 ? ' (quota)' : ''}:`, reason)
      const errRes = buildErrorCard(scene, platform, reason)
      image = errRes.image
      base64 = errRes.base64
    }

    images.push(image)
    // Stream this image to the client immediately and await the worker upload
    if (onImage) await onImage(image, base64)
  }

  const successCount = images.filter(img => img.status === 'done').length
  console.log(`[generate] Done — ${successCount}/${images.length} images OK`)

  return {
    status: 'done',
    pack: {
      id: crypto.randomUUID(),
      platform,
      images, // Warning: images here only have the subset appended in THIS session, caller must merge!
      audience: userConfig,
      generatedAt: new Date().toISOString(),
    }
  }
}

// ─── Stage 1: Creative Director ───────────────────────────────────────────────

async function runCreativeDirector(
  ai: ReturnType<typeof createVertexClient>,
  productProfile: ProductProfile,
  userConfig: UserConfig,
  language: string,
): Promise<CreativeJson> {
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
          maxOutputTokens: 4096,
        },
      })

      const raw = response.text ?? ''
      const firstBrace = raw.indexOf('{')
      const lastBrace = raw.lastIndexOf('}')

      if (firstBrace === -1 || lastBrace === -1) {
        console.error('[stage1] No JSON found. Preview:', raw.slice(0, 300))
        throw new Error('Creative Director returned no JSON')
      }

      const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1)) as CreativeJson

      if (!parsed.variations?.length) {
        throw new Error('Creative Director returned empty variations')
      }

      return parsed
    },
    { maxAttempts: 3, backoffMs: 4000, label: 'creative-director' },
  )
}

// ─── Stage 2: Ad copy for all 4 variations ────────────────────────────────────

async function generateAdCopy(
  ai: ReturnType<typeof createVertexClient>,
  variations: SceneLayout[],
  productProfile: ProductProfile,
  userConfig: UserConfig,
  language: string,
): Promise<Scene[]> {
  const prompt = buildAdCopyPrompt({ productProfile, userConfig, variations, language })

  return retryOnRateLimit(
    async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      })

      const raw = response.text ?? ''
      const firstBracket = raw.indexOf('[')
      const lastBracket = raw.lastIndexOf(']')

      if (firstBracket === -1 || lastBracket === -1) {
        throw new Error('Ad copy returned no JSON array')
      }

      const copyData = JSON.parse(raw.slice(firstBracket, lastBracket + 1)) as any[]

      // Merge copy into scenes — robust matching for variation and keys
      return variations.map(scene => {
        // Match by variation ID or falling back to angle (allow string/number mismatch)
        const copy = copyData.find(r =>
          String(r.variation) === String(scene.variation) ||
          String(r.angle).toLowerCase() === String(scene.angle).toLowerCase()
        )

        const emptyAdCopy: AdCopies = { awareness: '', consideration: '', conversion: '' }

        if (!copy) {
          console.warn(`[stage2] No ad copy found for variation ${scene.variation}. Using fallback.`)
          return { ...scene, ad_copies: emptyAdCopy }
        }

        // Case-insensitive key extraction
        const getVal = (keys: string[]) => {
          const key = Object.keys(copy).find(k => keys.includes(k.toLowerCase()))
          return key ? String(copy[key]) : ''
        }

        const ad_copies: AdCopies = {
          awareness: getVal(['awareness', 'awareness_copy']),
          consideration: getVal(['consideration', 'consideration_copy']),
          conversion: getVal(['conversion', 'cta', 'conversion_copy']),
        }

        return { ...scene, ad_copies }
      })
    },
    { maxAttempts: 2, backoffMs: 6000, label: 'ad-copy' },
  )
}

// ─── Stage 3: Single image ────────────────────────────────────────────────────

async function generateSingleImage(
  ai: ReturnType<typeof createVertexClient>,
  scene: Scene,
  platform: string,
  productBase64: string,
  productMimeType: string,
  userConfig?: UserConfig,
): Promise<{ image: GeneratedImage; base64: string | null }> {
  const aspectRatio = ASPECT_RATIOS[platform] ?? '1:1'
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
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      imageConfig: { aspectRatio },
      temperature: 0.7,
      topP: 0.95,
    },
  })

  // Extract image from response parts
  const parts = response.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'))

  if (!imagePart?.inlineData?.data) {
    const textPart = parts.find(p => p.text)
    throw new Error(`No image in response. Model said: ${textPart?.text?.slice(0, 200) ?? 'nothing'}`)
  }

  const { data, mimeType } = imagePart.inlineData
  const imageBase64 = `data:${mimeType ?? 'image/png'};base64,${data}`

  return {
    image: {
      id: `img_${scene.variation}_${Date.now()}`,
      variation: scene.variation,
      platform,
      angle: scene.angle,
      adCopy: scene.ad_copies,
      status: 'done',
    },
    base64: imageBase64,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchProductImage(
  url: string,
): Promise<{ productBase64: string; productMimeType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Failed to fetch product image: ${res.status}`)

  const contentType = res.headers.get('content-type') ?? 'image/png'
  const productMimeType = contentType.startsWith('image/') ? contentType.split(';')[0] : 'image/png'
  const productBase64 = Buffer.from(await res.arrayBuffer()).toString('base64')

  return { productBase64, productMimeType }
}

function buildErrorCard(
  scene: SceneLayout,
  platform: string,
  reason: string,
): { image: GeneratedImage; base64: null } {
  const emptyAdCopy: AdCopies = { awareness: '', consideration: '', conversion: '' }
  return {
    image: {
      id: `img_err_${scene.variation}_${Date.now()}`,
      variation: scene.variation,
      platform,
      angle: scene.angle,
      adCopy: emptyAdCopy,
      status: 'error',
      error: reason,
    },
    base64: null,
  }
}