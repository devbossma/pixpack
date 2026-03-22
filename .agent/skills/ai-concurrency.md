# Skill: AI Concurrency & Performance

Read this file before implementing any code that calls Gemini or Imagen 3.

---

## THE PERFORMANCE BUDGET

```
Step                          Budget    Cumulative
─────────────────────────────────────────────────
Photoroom background removal  5s        5s
Gemini product analysis       8s        13s
Prompt building (CPU)         <1s       14s
gemini 2.5 flash image (PARALLEL)       40s       54s
Caption gen (PARALLEL w/ img) 0s extra  54s  ← fires simultaneously
Response transfer             3s        57s
Client ZIP assembly           3s        60s  ← on client, not server
─────────────────────────────────────────────────
TOTAL TARGET                            < 60s
```

---

## RULE 1 — NEVER `await` INSIDE A LOOP FOR AI CALLS

```ts
// ❌ FORBIDDEN — sequential = 6× slower
for (const prompt of prompts) {
  const image = await generateImage(prompt)
}

// ✅ CORRECT — all 6 fire simultaneously
const results = await Promise.allSettled(prompts.map(p => generateImage(p)))
```

---

## RULE 2 — `Promise.allSettled()` NOT `Promise.all()` FOR IMAGE GENERATION

Imagen 3 has a content safety filter. One blocked image must never crash the other 5.

```ts
// ❌ FORBIDDEN — one safety block = total failure, user gets nothing
const images = await Promise.all(prompts.map(generateImage))

// ✅ CORRECT — one failure = 5 images still delivered
const results = await Promise.allSettled(prompts.map(p => generateImage(p)))

const processedImages = results.map((result, index) => {
  const prompt = prompts[index]
  if (result.status === 'fulfilled') {
    return { ...prompt, imageBase64: result.value, status: 'done' as const, error: null }
  }
  console.error(`Image ${index} failed:`, result.reason)
  return { ...prompt, imageBase64: null, status: 'error' as const, error: 'Blocked by content filter. Try regenerating.' }
})
```

---

## RULE 3 — FIRE CAPTIONS AND IMAGES IN PARALLEL

```ts
const [imageResults, captionResults] = await Promise.all([
  Promise.allSettled(imagePrompts.map(p => generateImage(p))),
  generateAllCaptions({ analysis, audience, prompts: imagePrompts }),
])
```

---

## IMAGEN 3 CALL

```ts
export async function generateImage(prompt: ImagePrompt): Promise<string> {
  const model = vertexAI.getImageGenerationModel({
    model: 'gemini-2.5-flash-image',
  })

  const response = await model.generateImages({
    prompt: prompt.prompt,
    negativePrompt: prompt.negativePrompt,
    numberOfImages: 1,
    aspectRatio: prompt.aspectRatio,
    personGeneration: 'allow_adult',
    safetyFilterLevel: 'block_only_high',
    addWatermark: false,
  })

  const image = response.generatedImages?.[0]
  if (!image?.image?.imageBytes) {
    throw new Error(`Imagen returned no image for: ${prompt.angle}`)
  }

  return `data:image/png;base64,${image.image.imageBytes}`
}
```

---

## CAPTION GENERATION — GLOBAL LANGUAGE RULES

Captions are generated in a single batched Gemini call, parallel to image generation.

**Language assignment comes from `lib/regions.ts` — never hardcode languages.**

```ts
import { REGIONS } from '@/lib/regions'

export async function generateAllCaptions(params: {
  analysis: ProductAnalysis
  audience: AudienceConfig
  prompts: ImagePrompt[]
}): Promise<Array<{ caption: string; hashtags: string[] }>> {
  const region = REGIONS[audience.regionId]

  // Language guide is pulled from region data — not hardcoded
  const LANGUAGE_GUIDES: Record<CaptionLanguage, string> = {
    french_darija:    'French with occasional Darija words. Warm, aspirational, community tone.',
    arabic:           'Arabic (Modern Standard or Gulf dialect). Premium, exclusive tone.',
    french:           'French. Chic, understated, minimal tone.',
    english_uk:       'British English. Witty, understated, self-aware tone.',
    english_us:       'American English. Bold, direct, energetic tone.',
    spanish_latam:    'Latin American Spanish. Warm, fun, community-driven tone.',
    portuguese_br:    'Brazilian Portuguese. Vibrant, fun, energetic tone.',
    german:           'German. Precise, quality-focused, trustworthy tone.',
    hindi_english:    'Mix of Hindi and English (Hinglish). Warm, aspirational, family-connected.',
    korean:           'Korean with occasional English. Clean, trendy, subtle flex.',
    japanese:         'Japanese. Polite, precise, aesthetic-focused.',
    indonesian:       'Indonesian (Bahasa). Friendly, warm, community-first.',
    english_ng:       'Nigerian English with Pidgin words. Energetic, bold, culturally proud.',
    swahili_english:  'Mix of Swahili and English. Warm, community-driven.',
    afrikaans_english:'Mix of Afrikaans and English. Relaxed, lifestyle-focused.',
    spanish_spain:    'Spanish (Spain). Stylish, modern, European tone.',
  }

  const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{
        text: `You are a social media expert for e-commerce brands.

Product: ${analysis.product_type}, colors: ${analysis.colors.join(', ')}, style: ${analysis.style}
Target region: ${region.label} (${region.aesthetic})
Audience: ${audience.gender}, ${audience.ageRange}, ${audience.lifestyle} lifestyle
Language/tone: ${LANGUAGE_GUIDES[region.captionLanguage]}

Generate ${params.prompts.length} captions — one per image.
Rules:
- 1-2 sentences max per caption
- End with 1-2 relevant emojis
- 5 hashtags per image: mix local + global + product-specific
- Match the platform type for length (Story = ultra short, Facebook = longer)

Return ONLY a JSON array, no markdown, no explanation:
[{ "caption": "...", "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5"] }]

Images:
${params.prompts.map((p, i) => `${i + 1}. ${p.angle} for ${p.platform}`).join('\n')}`
      }]
    }]
  })

  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return params.prompts.map(() => ({ caption: '', hashtags: [] }))
  }
}
```

---

## VERCEL TIMEOUT

```ts
// app/api/generate/route.ts
export const maxDuration = 60

// next.config.ts
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
}
```
