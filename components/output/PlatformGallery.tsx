'use client'

import { PlatformSlot } from './PlatformSlot'
import type { GeneratedPack, Platform } from '@/types'
import { PLATFORM_SPECS } from '@/lib/platforms'
import { useGenerationStore } from '@/hooks/useGeneration'

interface PlatformGalleryProps {
  pack: GeneratedPack | null
  isGenerating: boolean
}

export const PLATFORM_ORDER: Platform[] = [
  'instagram_post',
  'instagram_story',
  'tiktok',
  'facebook_post',
  'shopify_product',
  'web_banner',
]

export function PlatformGallery({ pack, isGenerating }: PlatformGalleryProps) {
  const config = useGenerationStore(s => s.config)

  const getSlotState = (platformId: Platform) => {
    // If pack exists, look for it
    if (pack) {
      const img = pack.images.find(i => i.platform === platformId)
      if (img) return { type: img.status as 'done' | 'error', image: img }
      return { type: 'idle' as const }
    }
    
    // If generating, check if it's in config
    if (isGenerating && config.platforms.includes(platformId)) {
      return { type: 'generating' as const }
    }

    return { type: 'idle' as const }
  }

  const renderSlot = (platformId: Platform) => {
    const spec = PLATFORM_SPECS[platformId]
    const state = getSlotState(platformId)
    const orderIndex = PLATFORM_ORDER.indexOf(platformId)

    return (
      <PlatformSlot
        key={platformId}
        platformId={platformId}
        spec={spec}
        state={state}
        orderIndex={orderIndex}
      />
    )
  }

  return (
    <div className="space-y-12 pb-8">
      {/* ROW 1: VERTICAL FORMATS */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--output-muted)] mb-4 flex items-center">
          <span className="w-4 border-t border-[var(--output-border)] mr-2" />
          Stories & Reels
          <span className="flex-1 border-t border-[var(--output-border)] ml-2" />
        </h3>
        {/* Constrained layout for vertical cards */}
        <div className="flex justify-center gap-6">
          <div className="w-full max-w-[300px]">
             {renderSlot('instagram_story')}
          </div>
          <div className="w-full max-w-[300px]">
            {renderSlot('tiktok')}
          </div>
        </div>
      </section>

      {/* ROW 2: SQUARE FORMATS */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--output-muted)] mb-4 flex items-center">
          <span className="w-4 border-t border-[var(--output-border)] mr-2" />
          Feed Posts
          <span className="flex-1 border-t border-[var(--output-border)] ml-2" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="w-full">
            {renderSlot('instagram_post')}
          </div>
          <div className="w-full">
            {renderSlot('shopify_product')}
          </div>
          <div className="w-full">
            {renderSlot('facebook_post')}
          </div>
        </div>
      </section>

      {/* ROW 3: WIDE FORMATS */}
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--output-muted)] mb-4 flex items-center">
          <span className="w-4 border-t border-[var(--output-border)] mr-2" />
          Banners & Wide
          <span className="flex-1 border-t border-[var(--output-border)] ml-2" />
        </h3>
        <div className="w-full">
          {renderSlot('web_banner')}
        </div>
      </section>
    </div>
  )
}
