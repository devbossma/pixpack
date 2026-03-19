import type { AgeRange, Gender, Angle } from '@/types'

export const siteConfig = {
  name: "PixPack",
  description: "Global Audience-Aware Content Engine",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  handle: "@pixpackapp",
}

export const AGE_RANGES: { id: AgeRange; label: string }[] = [
  { id: '18-24', label: '18–24' },
  { id: '25-34', label: '25–34' },
  { id: '35-44', label: '35–44' },
  { id: '45-60', label: '45–60' },
]

export const GENDERS: { id: Gender; label: string }[] = [
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
  { id: 'mixed', label: 'Mixed' },
]

export const INTERESTS: { id: string; label: string }[] = [
  { id: 'fashion',  label: 'Fashion & Style' },
  { id: 'sports',   label: 'Sports & Fitness' },
  { id: 'luxury',   label: 'Luxury & Premium' },
  { id: 'tech',     label: 'Tech & Gadgets' },
  { id: 'home',     label: 'Home & Living' },
  { id: 'beauty',   label: 'Beauty & Wellness' },
  { id: 'outdoor',  label: 'Outdoor & Travel' },
  { id: 'family',   label: 'Family & Kids' },
  { id: 'food',     label: 'Food & Lifestyle' },
  { id: 'business', label: 'Business & Career' },
]

export const ANGLES: { id: Angle; label: string }[] = [
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'flatlay',   label: 'Flat Lay' },
  { id: 'closeup',   label: 'Close-up' },
  { id: 'model',     label: 'Model Shot' },
  { id: 'hero',      label: 'Hero Shot' },
]

export const MARKETING_LANGUAGES: { id: 'auto' | 'en' | 'fr' | 'ar' | 'es'; label: string }[] = [
  { id: 'auto', label: 'Auto (Market Based)' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'French' },
  { id: 'ar', label: 'Arabic' },
  { id: 'es', label: 'Spanish' },
]
