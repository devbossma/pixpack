# Skill: Types & Validation (V2)

Read this before writing any TypeScript types or Zod schemas.

---

## CORE TYPES (lib/types.ts)

```ts
// ─── User configuration ──────────────────────────────────────────────────────

export interface UserConfig {
  platform:  string    // SINGLE platform — not an array (V2 change)
  country?:  string
  ageRange?: string
  gender?:   string
  interest?: string
  angle?:    string    // optional user hint — server uses all 4 angles regardless
}

// ─── Product analysis ─────────────────────────────────────────────────────────

export interface ProductAnalysis {
  physical_features:       string[]
  materials:               string[]
  style:                   string
  selling_points:          string[]
  product_type?:           string
  style_aesthetic?:        string
  target_customer?:        string
  use_cases?:              string[]
  key_selling_points?:     string[]
  visual_mood?:            string
  competitor_positioning?: string
}

export interface ProductProfile extends ProductAnalysis {
  extractedImageUrl: string
  productHint?:      string
}

// ─── Ad copy ─────────────────────────────────────────────────────────────────

export interface AdCopies {
  awareness:     string  // top-of-funnel hook
  consideration: string  // mid-funnel sales argument (longest)
  conversion:    string  // CTA with urgency
}

// ─── Scene / variation ───────────────────────────────────────────────────────

export interface SceneLayout {
  variation:    number  // 1–4
  image_prompt: string
  angle:        string  // lifestyle | hero | context | closeup
}

export interface Scene extends SceneLayout {
  ad_copies: AdCopies
}

// ─── Creative Director output ─────────────────────────────────────────────────

export interface CreativeJson {
  platform:  string
  variations: SceneLayout[]   // exactly 4
  posting_schedule: {
    best_day:  string
    best_time: string
    reasoning: string
  }
}

// ─── Generated image ──────────────────────────────────────────────────────────

export interface GeneratedImage {
  id:          string
  variation:   number        // 1–4
  platform:    string
  angle:       string        // lifestyle | hero | context | closeup
  imageBase64: string | null
  adCopy:      AdCopies
  status:      'done' | 'error'
  error?:      string
}

// ─── Full pack ────────────────────────────────────────────────────────────────

export interface GeneratedPack {
  id:          string
  platform:    string
  images:      GeneratedImage[]  // exactly 4
  audience:    UserConfig
  generatedAt: string
}

// ─── Generation state machine ─────────────────────────────────────────────────

export type GenerationState =
  | { status: 'idle' }
  | { status: 'analyzing' }
  | { status: 'generating'; stage: number; stageMessage: string; images: GeneratedImage[] }
  | { status: 'done'; pack: GeneratedPack }
  | { status: 'error'; message: string }
```

---

## ZOD SCHEMAS (lib/validation.ts)

```ts
import { z } from 'zod'

// V2: platform is string, not array
export const UserConfigSchema = z.object({
  platform:  z.string().min(1),
  country:   z.string().optional(),
  ageRange:  z.string().optional(),
  gender:    z.string().optional(),
  interest:  z.string().optional(),
  angle:     z.string().optional(),
})

export const GenerateRequestSchema = z.object({
  productProfile:    z.object({
    extractedImageUrl: z.string().url(),
    productHint:       z.string().optional(),
  }).passthrough(),
  userConfig:        UserConfigSchema,
  marketingLanguage: z.string().default('auto'),
})

export const DownloadRequestSchema = z.object({
  email:      z.string().email(),
  packId:     z.string().uuid(),
  imageCount: z.number().int().min(1).max(4),
  platforms:  z.array(z.string()),   // kept for compatibility
})
```

---

## PLATFORM SPECS (lib/platforms.ts)

```ts
export const PLATFORM_SPECS = {
  instagram_post:  { label: 'Instagram Post',   aspectRatio: '1:1',   width: 1080, height: 1080 },
  instagram_story: { label: 'Instagram Story',  aspectRatio: '9:16',  width: 1080, height: 1920 },
  tiktok:          { label: 'TikTok',           aspectRatio: '9:16',  width: 1080, height: 1920 },
  facebook_post:   { label: 'Facebook Post',    aspectRatio: '4:3',   width: 1200, height: 900  },
  shopify_product: { label: 'Shopify Product',  aspectRatio: '1:1',   width: 800,  height: 800  },
  web_banner:      { label: 'Web Banner',       aspectRatio: '16:9',  width: 1920, height: 1080 },
} as const

export type PlatformId = keyof typeof PLATFORM_SPECS
```

---

## VARIATION HELPERS

```ts
export const VARIATION_LETTERS = ['A', 'B', 'C', 'D'] as const

export function variationLetter(n: number): string {
  return VARIATION_LETTERS[n - 1] ?? 'X'
}

export const ANGLE_COLORS = {
  lifestyle: { bg: 'bg-blue-500/20',   text: 'text-blue-300'   },
  hero:      { bg: 'bg-purple-500/20', text: 'text-purple-300' },
  context:   { bg: 'bg-amber-500/20',  text: 'text-amber-300'  },
  closeup:   { bg: 'bg-green-500/20',  text: 'text-green-300'  },
} as const
```

---

## CRITICAL V2 CHANGES FROM V1

| Field | V1 | V2 |
|---|---|---|
| `UserConfig.platforms` | `string[]` (array) | **REMOVED** |
| `UserConfig.platform` | did not exist | `string` (single) |
| `GeneratedImage.platform` | main identifier | supplementary |
| `GeneratedImage.variation` | did not exist | `number` 1–4 |
| `GeneratedImage.angle` | did not exist | `string` |
| `GeneratedImage.adCopy` | on `Scene` | directly on `GeneratedImage` |
| `GeneratedImage.caption` | `string` | **REMOVED** (use `adCopy.awareness`) |
| `GeneratedImage.hashtags` | `string[]` | **REMOVED** |
| `GeneratedImage.engagementScore` | object | **REMOVED** |
| `GeneratedPack.productDescription` | Shopify data | **REMOVED** |
| `GeneratedPack.postingSchedule` | array | **REMOVED** |
| `GeneratedPack.totalScore` | number | **REMOVED** |
| `GeneratedPack.platform` | did not exist | `string` |
| `GeneratedPack.images` | array, 1 per platform | array, 4 variations |