import { motion } from 'framer-motion'
import { PLATFORM_SPECS } from '@/lib/platforms'
import { cardEntrance } from '@/lib/animations'
import { Plus } from 'lucide-react'
import type { Platform } from '@/types'

// Map of platform IDs to generic Lucide icons for the top-left badge
import * as Icons from 'lucide-react'

// Simple helper to get a Lucide icon based on platform name, since PLATFORM_SPECS only has emoji strings.
export const PlatformIcons: Record<string, any> = {
  instagram_post: Icons.Instagram,
  instagram_story: Icons.Instagram,
  tiktok: Icons.Video, // TikTok icon doesn't exist in standard lucide sometimes, Video is safe
  facebook_post: Icons.Facebook,
  shopify_product: Icons.ShoppingBag,
  web_banner: Icons.Monitor,
}

interface TemplateCardProps {
  platformId: Platform
  index: number
  onGenerate: (platformId: Platform) => void
}

export function TemplateCard({ platformId, index, onGenerate }: TemplateCardProps) {
  const spec = PLATFORM_SPECS[platformId]
  const Icon = PlatformIcons[platformId] || Icons.Layout

  function ratioToCss(ratio: string): string {
    return ratio.replace(':', '/')
  }

  return (
    <motion.div
      {...cardEntrance(index)}
      className="relative rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-[var(--shadow-sm)] flex flex-col items-center justify-center p-6 text-center transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--surface2)]"
      style={{ aspectRatio: spec?.aspectRatio ? ratioToCss(spec.aspectRatio) : '1/1' }}
    >
      {/* Top Left Icon Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[var(--text-muted)]">
        <Icon size={16} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{spec.name}</span>
      </div>

      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <div className="font-display text-8xl font-extrabold rotate-[-12deg]">
          PixPack
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">{spec.name} Output</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {spec.width} × {spec.height} px
          </p>
        </div>
        <button
          onClick={() => onGenerate(platformId)}
          className="mt-2 flex items-center gap-1.5 bg-[var(--accent)] text-white text-xs font-bold px-4 py-2 rounded-lg hover:brightness-110 transition shadow-sm"
        >
          <Plus size={14} />
          Generate {spec.name.split(' ')[0]}
        </button>
      </div>
    </motion.div>
  )
}
