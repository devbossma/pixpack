import { z } from 'zod'
import { REGIONS } from './regions'

export const AudienceConfigSchema = z.object({
  ageRanges: z.array(z.enum(['18-24', '25-34', '35-44', '45-60'])).min(1),
  gender: z.enum(['women', 'men', 'mixed']),
  geography: z.enum(Object.keys(REGIONS) as [string, ...string[]]),
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
