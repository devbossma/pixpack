# Skill: Types & Validation Schemas

Define all types in `types/index.ts` and all Zod schemas in `lib/validation.ts` BEFORE writing any feature code. This file is the contract the entire codebase depends on.

---

## `types/index.ts` — FULL TYPE DEFINITIONS

```ts
// ─── AUDIENCE ───────────────────────────────────────────────────────────────

export type AgeRange = '18-24' | '25-34' | '35-44' | '45-60'
export type Gender = 'women' | 'men' | 'mixed'
export type Geography = 'morocco' | 'gulf' | 'france' | 'global'
export type Lifestyle = 'urban' | 'luxury' | 'sporty' | 'casual'

export interface AudienceConfig {
  ageRange: AgeRange
  gender: Gender
  geography: Geography
  lifestyle: Lifestyle
}

// ─── PLATFORMS ──────────────────────────────────────────────────────────────

export type Platform =
  | 'instagram_post'
  | 'instagram_story'
  | 'tiktok'
  | 'facebook_post'
  | 'shopify_product'
  | 'web_banner'

export interface PlatformSpec {
  id: Platform
  name: string
  icon: string
  width: number
  height: number
  aspectRatio: string   // e.g. "1:1", "9:16", "16:9"
}

// ─── ANGLES ─────────────────────────────────────────────────────────────────

export type Angle = 'lifestyle' | 'flatlay' | 'closeup' | 'model' | 'hero'

// ─── PRODUCT ANALYSIS (from Gemini Vision) ──────────────────────────────────

export interface ProductAnalysis {
  product_type: string
  colors: string[]
  material: string
  style: string
  gender_target: string
  use_case: string
  key_features: string[]
  suggested_scenes: string[]
}

// ─── IMAGE PROMPTS ───────────────────────────────────────────────────────────

export interface ImagePrompt {
  id: string
  angle: Angle
  platform: Platform
  aspectRatio: string
  prompt: string
  negativePrompt: string
}

// ─── GENERATED OUTPUT ───────────────────────────────────────────────────────

export interface GeneratedImage {
  id: string
  angle: Angle
  platform: Platform
  platformSpec: PlatformSpec
  imageBase64: string         // "data:image/png;base64,..."
  caption: string
  hashtags: string[]
  status: 'done' | 'error'
  error?: string
}

// ─── API CONTRACTS ───────────────────────────────────────────────────────────

export interface GenerationRequest {
  imageBase64: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  audience: AudienceConfig
  platforms: Platform[]
  angles: Angle[]
}

export interface GenerationResponse {
  images: GeneratedImage[]
  totalRequested: number
  totalGenerated: number
  generatedAt: string
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// ─── UI STATE MACHINES ───────────────────────────────────────────────────────

export type UploadState =
  | { status: 'idle' }
  | { status: 'dragging' }
  | { status: 'processing'; message: string }
  | { status: 'ready'; previewUrl: string; base64: string; mimeType: string }
  | { status: 'error'; message: string }

export type GenerationState =
  | { status: 'idle' }
  | { status: 'generating'; step: number; progress: number }
  | { status: 'done'; images: GeneratedImage[] }
  | { status: 'error'; message: string; retryable: boolean }
```

---

## `lib/validation.ts` — ZOD SCHEMAS

```ts
import { z } from 'zod'

export const AudienceConfigSchema = z.object({
  ageRange: z.enum(['18-24', '25-34', '35-44', '45-60']),
  gender: z.enum(['women', 'men', 'mixed']),
  geography: z.enum(['morocco', 'gulf', 'france', 'global']),
  lifestyle: z.enum(['urban', 'luxury', 'sporty', 'casual']),
})

export const PlatformSchema = z.enum([
  'instagram_post',
  'instagram_story',
  'tiktok',
  'facebook_post',
  'shopify_product',
  'web_banner',
])

export const AngleSchema = z.enum(['lifestyle', 'flatlay', 'closeup', 'model', 'hero'])

export const GenerationRequestSchema = z.object({
  imageBase64: z.string().min(100, 'Image data is missing or too small'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  audience: AudienceConfigSchema,
  platforms: z.array(PlatformSchema).min(1, 'Select at least one platform').max(6),
  angles: z.array(AngleSchema).min(1, 'Select at least one angle').max(5),
})

// Usage in API route:
// const validated = GenerationRequestSchema.parse(await req.json())
// — throws ZodError with field-level messages if invalid
```

---

## `lib/platforms.ts` — PLATFORM CONFIG

```ts
import type { Platform, PlatformSpec } from '@/types'

export const PLATFORM_SPECS = {
  instagram_post:  { id: 'instagram_post',  name: 'Instagram Post',  icon: '📸', width: 1080, height: 1080, aspectRatio: '1:1'  },
  instagram_story: { id: 'instagram_story', name: 'Instagram Story', icon: '📖', width: 1080, height: 1920, aspectRatio: '9:16' },
  tiktok:          { id: 'tiktok',          name: 'TikTok',          icon: '🎵', width: 1080, height: 1920, aspectRatio: '9:16' },
  facebook_post:   { id: 'facebook_post',   name: 'Facebook Post',   icon: '👤', width: 1200, height: 630,  aspectRatio: '16:9' },
  shopify_product: { id: 'shopify_product', name: 'Shopify Product', icon: '🛍️', width: 800,  height: 800,  aspectRatio: '1:1'  },
  web_banner:      { id: 'web_banner',      name: 'Web Banner',      icon: '🌐', width: 1920, height: 600,  aspectRatio: '16:9' },
} satisfies Record<Platform, PlatformSpec>
```
