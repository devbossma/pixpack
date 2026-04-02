import type React from 'react'
import type { Platform, PlatformSpec } from '@/types'
import {
  Instagram,
  Smartphone,
  Music,
  Facebook,
  ShoppingBag,
  Monitor,
} from 'lucide-react'

export type PlatformSpecWithIcon = PlatformSpec & { LucideIcon: React.ElementType }

export const PLATFORM_SPECS: Record<Platform, PlatformSpecWithIcon> = {
  instagram_post: { id: 'instagram_post', name: 'Instagram Post', icon: '📸', LucideIcon: Instagram, width: 1080, height: 1440, aspectRatio: '3:4' },
  instagram_story: { id: 'instagram_story', name: 'Instagram Story', icon: '📖', LucideIcon: Smartphone, width: 1080, height: 1920, aspectRatio: '9:16' },
  tiktok: { id: 'tiktok', name: 'TikTok', icon: '🎵', LucideIcon: Music, width: 1080, height: 1920, aspectRatio: '9:16' },
  facebook_post: { id: 'facebook_post', name: 'Facebook Post', icon: '👤', LucideIcon: Facebook, width: 1080, height: 1080, aspectRatio: '1:1' },
  shopify_product: { id: 'shopify_product', name: 'Shopify Product', icon: '🛍️', LucideIcon: ShoppingBag, width: 2048, height: 2048, aspectRatio: '1:1' },
  etsy_product: { id: 'etsy_product', name: 'Etsy Product', icon: '🛍️', LucideIcon: ShoppingBag, width: 2700, height: 2025, aspectRatio: '4:3' },
}

