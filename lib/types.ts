/**
 * lib/types.ts
 *
 * Shared domain types for PixPack API routes.
 * Import from here — never redefine locally.
 */

// ─── Product analysis (output of /api/analyze) ───────────────────────────────

export interface ProductAnalysis {
  physical_features: string[]
  materials: string[]
  style: string
  selling_points: string[]
}

export interface AnalyzeResponse {
  extractedImageUrl: string
  analysis: ProductAnalysis
}

// ─── Pack generation (input to /api/generate) ────────────────────────────────

export interface UserConfig {
  platforms: string[]
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

// ─── Creative Director output (internal) ─────────────────────────────────────

export interface AdCopies {
  awareness: string   // 2-3 sentences for most platforms
  consideration: string   // 4-6 sentences — the full sales argument
  conversion: string   // 1-2 sentences — punchy CTA
}

// SceneLayout is what the Creative Director returns — image prompt only, no copy
export interface SceneLayout {
  platform: string
  image_prompt: string
}

// Scene is the full scene with copy attached (after Stage 3)
export interface Scene extends SceneLayout {
  ad_copies: AdCopies
}

export interface CreativeJson {
  scenes: SceneLayout[]   // ad_copies are NOT in this — added by Stage 3
  shopify_data: {
    title: string
    tagline: string
    description: string
    seo_meta_title: string
    seo_meta_description: string
  }
  posting_schedule: {
    best_day: string
    best_time: string
    reasoning: string
  }
}

// ─── Generated pack (output of /api/generate) ────────────────────────────────

export interface EngagementScore {
  score: number
  label: string
  reason: string
  tip: string
}

export interface GeneratedImage {
  id: string
  platform: string
  imageBase64: string | null
  caption: string
  hashtags: string[]
  adCopy: AdCopies
  engagementScore: EngagementScore
  status: 'done' | 'error'
  error?: string
}

export interface PostingSlot {
  platform: string
  bestDay: string
  bestTime: string
  timezone: string
  reason: string
}

export interface ProductDescription {
  title: string
  subtitle: string
  bulletFeatures: string[]
  seoMetaTitle: string
  seoMetaDescription: string
}

export interface GeneratedPack {
  id: string
  images: GeneratedImage[]
  productDescription: ProductDescription
  postingSchedule: PostingSlot[]
  audience: UserConfig
  totalScore: number
  generatedAt: string
}

// ─── Extended product analysis (richer fields from updated analyze prompt) ───

export interface ProductAnalysis {
  // Original fields
  physical_features: string[]
  materials: string[]
  style: string        // kept for backward compat
  selling_points: string[]      // kept for backward compat

  // New richer fields
  product_type?: string
  style_aesthetic?: string
  target_customer?: string
  use_cases?: string[]
  key_selling_points?: string[]
  visual_mood?: string
  competitor_positioning?: string
}