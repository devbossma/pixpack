import type React from 'react'
import type { RegionId } from '@/lib/regions'

export type AgeRange = '18-24' | '25-34' | '35-44' | '45-60'
export type Gender = 'women' | 'men' | 'mixed'
export type Lifestyle = 'urban' | 'luxury' | 'sporty' | 'casual'

export type PipelineStatus = 'idle' | 'extracting' | 'generating_creative' | 'rendering_images' | 'done'

export interface GenerationConfig {
  regionId: RegionId | null
  ageRanges: AgeRange[]
  gender: Gender
  interest: string | null
  productHint: string | null
  language: 'auto' | 'en' | 'fr' | 'ar' | 'es'
  platforms: Platform[]
  angles: Angle[]
}

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
  LucideIcon?: React.ElementType
  width: number
  height: number
  aspectRatio: string
}

export type Angle = 'lifestyle' | 'flatlay' | 'closeup' | 'model' | 'hero'

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

export interface ImagePrompt {
  id: string
  angle: Angle
  platform: Platform
  aspectRatio: string
  prompt: string
  negativePrompt: string
}

export interface AdCopyVariants {
  awareness: string
  consideration: string
  conversion: string
}

export interface EngagementScore {
  score: number
  label: string
  reason: string
  tip: string
}

export interface ProductDescription {
  title: string
  subtitle: string
  bulletFeatures: string[]
  seoMetaTitle: string
  seoMetaDescription: string
}

export interface PostingSchedule {
  platform: Platform
  bestDay: string
  bestTime: string
  timezone: string
  reason: string
}

export interface GeneratedImage {
  id: string
  angle: Angle
  platform: Platform
  platformSpec: PlatformSpec
  imageBase64: string | null
  caption: string
  hashtags: string[]
  adCopy: AdCopyVariants
  engagementScore: EngagementScore
  status: 'done' | 'regenerating' | 'error'
  error?: string
}

export interface GeneratedPack {
  id: string
  images: GeneratedImage[]
  productDescription: ProductDescription
  postingSchedule: PostingSchedule[]
  audience: GenerationConfig // Actually GenerationConfig includes ageRange etc
  generatedAt: string
  totalScore: number
}

export interface GenerationRequest {
  imageBase64: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  config: GenerationConfig
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export type UploadState =
  | { status: 'idle' }
  | { status: 'dragging' }
  | { status: 'processing'; message: string }
  | { status: 'ready'; previewUrl: string; base64: string; mimeType: string }
  | { status: 'error'; message: string }

export type GenerationState =
  | { status: 'idle' }
  | { status: 'generating'; step: number; progress: number }
  | { status: 'done'; pack: GeneratedPack }
  | { status: 'error'; message: string; retryable: boolean }
