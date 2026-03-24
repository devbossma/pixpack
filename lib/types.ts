/**
 * lib/types.ts
 *
 * Shared domain types for PixPack.
 *
 * NEW MODEL (v2):
 *   User picks ONE platform.
 *   We generate 4 image variations for that platform.
 *   Each variation gets 3 ad copy variants (awareness / consideration / conversion).
 *   No Shopify listing. No posting schedule.
 *   Focus: A/B testing creative for paid ads.
 */

// ─── Product analysis (output of /api/analyze) ───────────────────────────────

export interface ProductAnalysis {
  physical_features: string[]
  materials: string[]
  style: string
  selling_points: string[]
  product_type?: string
  style_aesthetic?: string
  target_customer?: string
  use_cases?: string[]
  key_selling_points?: string[]
  visual_mood?: string
  competitor_positioning?: string
}

export interface AnalyzeResponse {
  extractedImageUrl: string
  analysis: ProductAnalysis
}

// ─── User config (input to /api/generate) ────────────────────────────────────

export interface UserConfig {
  platform: string    // single platform — e.g. 'instagram_post'
  country?: string
  ageRange?: string
  gender?: string
  interest?: string
  angle?: string
}

export interface ProductProfile extends ProductAnalysis {
  extractedImageUrl: string
  productHint?: string
}

// ─── Ad copy for one variation ────────────────────────────────────────────────

export interface AdCopies {
  awareness: string  // top-of-funnel — emotion/identity hook
  consideration: string  // mid-funnel — full product argument, longest field
  conversion: string  // bottom-funnel — punchy CTA with urgency
}

// ─── Scene: one image variation with its copy ─────────────────────────────────

export interface SceneLayout {
  variation: number  // 1-4
  image_prompt: string  // scene description for the image model
  angle: string  // the visual angle used for this variation
}

export interface Scene extends SceneLayout {
  ad_copies: AdCopies
}

// ─── Creative Director output (Stage 1) ──────────────────────────────────────

export interface CreativeJson {
  platform: string
  variations: SceneLayout[]  // exactly 4, one per A/B test variation
  posting_schedule: {
    best_day: string
    best_time: string
    reasoning: string
  }
}

// ─── Generated image (one variation result) ──────────────────────────────────

export interface GeneratedImage {
  id: string
  variation: number        // 1-4
  platform: string
  angle: string
  imageUrl?: string | null
  adCopy: AdCopies
  status: 'done' | 'error'
  error?: string
}

// ─── Full pack output ─────────────────────────────────────────────────────────

export interface GeneratedPack {
  id: string
  platform: string
  images: GeneratedImage[]  // 4 variations
  audience: UserConfig
  generatedAt: string
}