# Skill: Architecture & Pipeline Flow

Read this file before implementing any part of the generation pipeline.

---

## THE 6-STEP PIPELINE — CHRONOLOGICAL ORDER

```
[1] UPLOAD          → Client validates + converts to base64
[2] PREPROCESSING   → Server removes background via Photoroom API
[3] VISION ANALYSIS → Server sends clean image to Gemini 1.5 Flash
[4] PROMPT BUILDING → Server builds 6 structured Imagen prompts using lib/regions.ts
[5] PARALLEL RENDER → Server fires 6 Imagen 3 calls simultaneously
[6] CLIENT ZIP      → Client fetches image blobs, assembles ZIP, triggers download
```

Steps 1–5 happen server-side via a single POST to `/api/generate`.
Step 6 happens entirely on the client — never on the server.

---

## STEP 1 — CLIENT UPLOAD

**Location:** `hooks/useUpload.ts` + `components/upload/UploadZone.tsx`

```ts
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const [header, base64] = dataUrl.split(',')
      const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      resolve({ base64, mimeType })
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
```

Do NOT upload to any storage service. Pass base64 directly in the API body.

---

## STEP 2 — BACKGROUND REMOVAL (Photoroom API)

**Location:** `lib/photoroom.ts`

```ts
export async function removeBackground(imageBase64: string): Promise<string> {
  const formData = new FormData()
  const buffer = Buffer.from(imageBase64, 'base64')
  const blob = new Blob([buffer], { type: 'image/jpeg' })
  formData.append('image_file', blob, 'product.jpg')

  const response = await fetch('https://image-api.photoroom.com/v2/segment', {
    method: 'POST',
    headers: { 'x-api-key': process.env.PHOTOROOM_API_KEY! },
    body: formData,
  })

  if (!response.ok) {
    console.warn('Photoroom failed, using original:', response.status)
    return imageBase64
  }

  const resultBuffer = await response.arrayBuffer()
  return Buffer.from(resultBuffer).toString('base64')
}
```

**Failure policy:** Non-blocking. Return original image + UI warning. Never block the pipeline.

---

## STEP 3 — VISION ANALYSIS (Gemini 1.5 Flash)

**Location:** `lib/vertex.ts`

```ts
export async function analyzeProduct(imageBase64: string): Promise<ProductAnalysis> {
  const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/png', data: imageBase64 } },
        { text: `Analyze this product image. Return ONLY valid JSON, no markdown:
{
  "product_type": "string",
  "colors": ["array"],
  "material": "string",
  "style": "casual|formal|sporty|luxury|streetwear|minimalist",
  "gender_target": "unisex|men|women",
  "use_case": "string",
  "key_features": ["array of 3"],
  "suggested_scenes": ["array of 6 diverse global scene descriptions"]
}` }
      ]
    }]
  })

  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim()) as ProductAnalysis
  } catch {
    throw new Error('Product analysis failed. Please try a clearer product photo.')
  }
}
```

---

## STEP 4 — PROMPT BUILDING (lib/regions.ts + lib/prompts.ts)

**This is the core of the product's global value.** All cultural intelligence lives in `lib/regions.ts`.

### `lib/regions.ts` — THE GLOBAL CULTURAL DATABASE

This file is the single source of truth for all geographic and demographic context.
**Adding a new region = adding one entry here. Zero other files change.**

```ts
// lib/regions.ts

export type RegionId =
  | 'morocco' | 'gulf_uae' | 'saudi' | 'egypt'           // MENA
  | 'france' | 'uk' | 'germany' | 'spain' | 'italy'      // Europe
  | 'usa_urban' | 'usa_suburban' | 'canada'               // North America
  | 'brazil' | 'mexico' | 'colombia' | 'argentina'        // Latin America
  | 'nigeria' | 'south_africa' | 'kenya' | 'ghana'        // Africa
  | 'india_urban' | 'india_tier2'                         // India
  | 'china' | 'japan' | 'south_korea' | 'indonesia'       // East/SE Asia
  | 'australia' | 'global'                                // Other

export interface RegionContext {
  id: RegionId
  label: string          // display name in UI
  flag: string           // emoji flag
  continent: string
  settings: string[]     // scene descriptions for Imagen prompts
  lightDescription: string
  aesthetic: string
  captionLanguage: CaptionLanguage
  captionTone: string
}

export type CaptionLanguage =
  | 'french_darija'    // Morocco
  | 'arabic'           // Gulf/Saudi/Egypt
  | 'french'           // France
  | 'english_uk'       // UK
  | 'german'           // Germany
  | 'spanish_latam'    // Latin America
  | 'spanish_spain'    // Spain
  | 'portuguese_br'    // Brazil
  | 'english_us'       // USA/Canada/Australia/Global
  | 'hindi_english'    // India
  | 'korean'           // South Korea
  | 'japanese'         // Japan
  | 'indonesian'       // Indonesia
  | 'swahili_english'  // Kenya/East Africa
  | 'english_ng'       // Nigeria
  | 'afrikaans_english'// South Africa

export const REGIONS: Record<RegionId, RegionContext> = {
  morocco: {
    id: 'morocco', label: 'Morocco', flag: '🇲🇦', continent: 'Africa',
    settings: ['medina of Marrakech with terracotta walls', 'modern Gueliz café', 'Casablanca corniche', 'rooftop terrace with Atlas mountain views', 'Majorelle garden', 'Moroccan riad courtyard'],
    lightDescription: 'warm golden Mediterranean afternoon light',
    aesthetic: 'North African contemporary urban',
    captionLanguage: 'french_darija',
    captionTone: 'warm, aspirational, community-oriented',
  },
  gulf_uae: {
    id: 'gulf_uae', label: 'UAE / Gulf', flag: '🇦🇪', continent: 'Asia',
    settings: ['Dubai Marina at sunset', 'luxury mall interior with marble floors', 'desert dunes at golden hour', 'Abu Dhabi Corniche', 'sleek hotel rooftop'],
    lightDescription: 'bright high-contrast Gulf sunlight',
    aesthetic: 'luxury Gulf contemporary',
    captionLanguage: 'arabic',
    captionTone: 'premium, exclusive, aspirational',
  },
  france: {
    id: 'france', label: 'France', flag: '🇫🇷', continent: 'Europe',
    settings: ['Parisian café terrace with wicker chairs', 'Haussmann boulevard in autumn', 'French countryside field', 'minimalist white studio'],
    lightDescription: 'soft diffused Parisian morning light',
    aesthetic: 'French minimal chic editorial',
    captionLanguage: 'french',
    captionTone: 'chic, understated, minimal',
  },
  uk: {
    id: 'uk', label: 'United Kingdom', flag: '🇬🇧', continent: 'Europe',
    settings: ['London street with Georgian townhouses', 'rainy Shoreditch alley', 'English countryside village', 'modern Soho café'],
    lightDescription: 'soft overcast British natural light',
    aesthetic: 'British contemporary streetwear meets heritage',
    captionLanguage: 'english_uk',
    captionTone: 'witty, understated, self-aware',
  },
  usa_urban: {
    id: 'usa_urban', label: 'USA — Urban', flag: '🇺🇸', continent: 'Americas',
    settings: ['New York SoHo street', 'LA Venice Beach boardwalk', 'Chicago rooftop at dusk', 'Brooklyn warehouse district', 'Miami Art Deco backdrop'],
    lightDescription: 'golden hour urban American light',
    aesthetic: 'American urban streetwear, bold and confident',
    captionLanguage: 'english_us',
    captionTone: 'bold, direct, energetic, aspirational',
  },
  brazil: {
    id: 'brazil', label: 'Brazil', flag: '🇧🇷', continent: 'Americas',
    settings: ['Rio de Janeiro beachfront', 'São Paulo urban graffiti wall', 'colorful favela staircase', 'Brazilian rainforest edge', 'modern São Paulo rooftop'],
    lightDescription: 'vibrant tropical Brazilian sunlight',
    aesthetic: 'vibrant Brazilian contemporary urban',
    captionLanguage: 'portuguese_br',
    captionTone: 'vibrant, fun, community-driven, warm',
  },
  nigeria: {
    id: 'nigeria', label: 'Nigeria', flag: '🇳🇬', continent: 'Africa',
    settings: ['Lagos Victoria Island skyline', 'colorful Lekki market', 'modern Abuja street', 'Nigerian fabric market', 'Lagos waterfront'],
    lightDescription: 'rich warm West African sunlight',
    aesthetic: 'Afrobeats-inspired modern Lagos fashion',
    captionLanguage: 'english_ng',
    captionTone: 'energetic, bold, culturally proud, viral',
  },
  south_korea: {
    id: 'south_korea', label: 'South Korea', flag: '🇰🇷', continent: 'Asia',
    settings: ['Seoul Gangnam street', 'Hongdae café alley', 'Bukchon Hanok village', 'Korean convenience store night', 'Seoul Han River park'],
    lightDescription: 'clean cool Korean urban light',
    aesthetic: 'K-fashion minimal aesthetic, clean and precise',
    captionLanguage: 'korean',
    captionTone: 'clean, trendy, precise, subtle flex',
  },
  india_urban: {
    id: 'india_urban', label: 'India — Urban', flag: '🇮🇳', continent: 'Asia',
    settings: ['Mumbai marine drive', 'Delhi Hauz Khas Village', 'Bangalore tech park area', 'colorful Jaipur haveli', 'modern Mumbai café'],
    lightDescription: 'warm rich Indian afternoon light',
    aesthetic: 'modern Indian urban fusion — traditional meets contemporary',
    captionLanguage: 'hindi_english',
    captionTone: 'aspirational, warm, family-connected, proud',
  },
  indonesia: {
    id: 'indonesia', label: 'Indonesia', flag: '🇮🇩', continent: 'Asia',
    settings: ['Bali rice terrace', 'Jakarta modern café', 'Bali beach at sunrise', 'Yogyakarta temple alley', 'modern Jakarta skyline'],
    lightDescription: 'lush tropical Southeast Asian light',
    aesthetic: 'Indonesian modern — Bali aesthetic meets urban Jakarta',
    captionLanguage: 'indonesian',
    captionTone: 'friendly, warm, community-first, aspirational',
  },
  global: {
    id: 'global', label: 'Global / Worldwide', flag: '🌍', continent: 'Global',
    settings: ['clean modern studio with soft shadows', 'urban street with bokeh city background', 'bright minimalist apartment', 'outdoor urban terrace', 'rooftop with city skyline'],
    lightDescription: 'clean neutral studio lighting',
    aesthetic: 'international contemporary — universally appealing',
    captionLanguage: 'english_us',
    captionTone: 'contemporary, inclusive, energetic',
  },
  // ... add more regions following this exact pattern
} satisfies Record<RegionId, RegionContext>
```

### `lib/prompts.ts` — PROMPT BUILDER

```ts
import { REGIONS, type RegionContext } from './regions'
import type { ProductAnalysis, AudienceConfig, Angle, Platform, ImagePrompt } from '@/types'

export function buildImagePrompt(params: {
  product: ProductAnalysis
  audience: AudienceConfig
  angle: Angle
  platform: Platform
  sceneIndex: number
}): ImagePrompt {
  const { product, audience, angle, platform, sceneIndex } = params
  const region = REGIONS[audience.regionId]
  const scene = region.settings[sceneIndex % region.settings.length]

  const ANGLE_MODIFIERS: Record<Angle, string> = {
    lifestyle: `in natural use context in ${scene}, person interacting with product, candid feel`,
    flatlay:   'top-down flat lay on clean textured surface, styled with complementary props, editorial',
    closeup:   'extreme close-up showing texture and material detail, macro photography, razor sharp focus',
    model:     `worn by a ${region.aesthetic} model in ${scene}, fashion editorial, 3/4 shot`,
    hero:      'dramatic studio hero shot, perfect lighting, premium commercial photography, isolated',
  }

  const prompt = [
    `Professional product photography of ${product.product_type}`,
    `in ${product.colors.join(' and ')} color`,
    ANGLE_MODIFIERS[angle],
    `${region.lightDescription}`,
    `${region.aesthetic} aesthetic`,
    'highly detailed, photorealistic, commercial quality, 8K resolution',
    'no text, no watermark, no logo overlay',
  ].join(', ')

  const negativePrompt = [
    'ugly, deformed, blurry, low quality, watermark, text overlay, logo',
    'cartoon, illustration, painting, drawing, anime',
    'bad anatomy, extra limbs, distorted product',
    'color-shifted product, wrong product color',
    'amateur photography, overexposed, underexposed',
  ].join(', ')

  return {
    id: `${platform}_${angle}_${sceneIndex}`,
    angle,
    platform,
    aspectRatio: PLATFORM_ASPECT_RATIOS[platform],
    prompt,
    negativePrompt,
  }
}
```

---

## STEP 5 — PARALLEL IMAGE RENDERING

See `ai-concurrency.md` for full implementation. Key rule: `Promise.allSettled()`, never sequential.

---

## STEP 6 — CLIENT-SIDE ZIP

See `client-zip-handling.md`. Key rule: ZIP assembly never touches the server.

---

## DATA FLOW DIAGRAM

```
Client                          Server
  │                               │
  ├─ [1] select file              │
  ├─ validate + base64 convert    │
  ├─ POST /api/generate ─────────►│
  │                               ├─ [2] Photoroom → clean PNG
  │                               ├─ [3] Gemini Flash → ProductAnalysis JSON
  │                               ├─ [4] buildAllPrompts() → ImagePrompt[6]
  │                               │      using lib/regions.ts for cultural context
  │                               ├─ [5] Promise.allSettled(Imagen3 × 6)
  │                               │      + generateAllCaptions()  ← PARALLEL
  │◄──────────── response ────────┤
  │  GeneratedImage[6] + captions │
  ├─ [6] render OutputGrid        │
  ├─ user clicks Download ZIP     │
  ├─ assemble ZIP (jszip)         │
  └─ trigger download             │
```
