import type React from 'react'

export * from '@/lib/types'
import type { GeneratedPack, GeneratedImage } from '@/lib/types'

export type PipelineStatus = 'idle' | 'extracting' | 'generating_creative' | 'rendering_images' | 'done'

export interface GenerationConfig {
  regionId: string | null
  ageRange: string | null
  gender: string | null
  interest: string | null
  productHint: string | null
  language: 'auto' | 'en' | 'fr' | 'ar' | 'es'
  platform: Platform | null
  angle: string | null
}

export type UploadState =
  | { status: 'idle' }
  | { status: 'dragging' }
  | { status: 'processing'; message: string }
  | { status: 'ready'; previewUrl: string; base64: string; mimeType: string }
  | { status: 'error'; message: string }

export type GenerationState =
  | { status: 'idle' }
  | { status: 'analyzing' }
  | { status: 'generating'; stage: number; stageMessage: string; images: GeneratedImage[] }
  | { status: 'done'; pack: GeneratedPack }
  | { status: 'error'; message: string; retryable?: boolean }

// Preserve PLATFORMS for UI rendering
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
