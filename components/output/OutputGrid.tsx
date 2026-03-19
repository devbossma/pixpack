'use client'

import { motion } from 'framer-motion'
import { OutputCard } from './OutputCard'
import { TemplateCard } from './TemplateCard'
import type { GeneratedImage, Platform } from '@/types'
import { staggerContainer, staggerItem } from '@/lib/animations'

interface OutputGridProps {
  images: GeneratedImage[]
  onRegenerate: (imageId: string) => void
}

export function OutputGrid({ images, onRegenerate, onGenerateMissing }: OutputGridProps & { onGenerateMissing?: (platformId: Platform) => void }) {
  // Helper to render a mixed filled/empty card
  const renderCard = (platformId: Platform, index: number) => {
    const img = images.find((i) => i.platform === platformId)
    return (
      <motion.div key={platformId} variants={staggerItem} className="w-full h-full">
        {img ? (
          <OutputCard image={img} index={index} />
        ) : (
          <TemplateCard
            platformId={platformId}
            index={index}
            onGenerate={(id: Platform) => onGenerateMissing?.(id)}
          />
        )}
      </motion.div>
    )
  }

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Top: Full-width row for "Web Banner" (16:9) */}
      <div className="grid grid-cols-1">
        {renderCard('web_banner', 0)}
      </div>

      {/* Middle: 2-column row for "Facebook Post", "Shopify Product" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
        {renderCard('facebook_post', 1)}
        {renderCard('shopify_product', 2)}
      </div>

      {/* Bottom: 3-column row for "Instagram Post", "Instagram Story", "TikTok" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {renderCard('instagram_post', 3)}
        {renderCard('instagram_story', 4)}
        {renderCard('tiktok', 5)}
      </div>
    </motion.div>
  )
}
