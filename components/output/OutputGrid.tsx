'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { OutputCard } from './OutputCard'
import { EtsyMockupGrid } from './EtsyMockupGrid'
import { ShopifyMockupGrid } from './ShopifyMockupGrid'
import { InstagramPostMockup } from './InstagramPostMockup'
import { InstagramStoryMockup } from './InstagramStoryMockup'
import { TikTokMockup } from './TikTokMockup'
import { FacebookMockup } from './FacebookMockup'
import type { GeneratedImage, Platform } from '@/types'
import { PLATFORM_SPECS } from '@/lib/platforms'
import { useGenerationStore } from '@/hooks/useGeneration'

const PLATFORM_LABELS: Record<string, string> = {
  instagram_post:  'Instagram Post',
  instagram_story: 'Instagram Story',
  tiktok:          'TikTok',
  facebook_post:   'Facebook Post',
  shopify_product: 'Shopify Product',
  etsy_product:    'Etsy Product',
}

const ANGLE_LABELS: Record<string, string> = {
  lifestyle: 'Lifestyle',
  hero:      'Hero',
  context:   'Context',
  closeup:   'Closeup',
}

interface OutputGridProps {
  images: GeneratedImage[]
  platform?: string
  isGenerating?: boolean
  onDownloadZip?: () => void
}

/** Returns a CSS aspect-ratio string for the card based on platform spec */
function getCardAspectRatio(p: Platform | null): string {
  if (!p) return '1 / 1'
  const s = PLATFORM_SPECS[p]
  if (!s) return '1 / 1'
  // Parse "W:H" from aspectRatio like "1:1", "9:16", "4:5"
  const [w, h] = s.aspectRatio.split(':').map(Number)
  if (!w || !h) return `${s.width} / ${s.height}`
  return `${w} / ${h}`
}

export function OutputGrid({ images, platform, isGenerating, onDownloadZip }: OutputGridProps) {
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const generationState   = useGenerationStore(s => s.generationState)
  const isStateGenerating = generationState.status === 'generating'
  const stageMessage      = isStateGenerating ? generationState.stageMessage : null
  const stage             = isStateGenerating ? generationState.stage : 0

  const sortedImages = [...images].sort((a, b) => a.variation - b.variation)
  const totalSlots   = isGenerating ? 4 : sortedImages.length

  const resolvedPlatform = (platform ?? images[0]?.platform ?? null) as Platform | null
  const platformLabel    = resolvedPlatform ? (PLATFORM_LABELS[resolvedPlatform] ?? resolvedPlatform) : null
  const spec             = resolvedPlatform ? PLATFORM_SPECS[resolvedPlatform] : null
  const cardAspect       = getCardAspectRatio(resolvedPlatform)

  // Mobile scroll tracking
  function checkMobileScroll() {
    if (!mobileScrollRef.current) return
    const { scrollTop } = mobileScrollRef.current
    const cards         = mobileScrollRef.current.children
    if (cards.length > 0) {
      const cardH = (cards[0] as HTMLElement).offsetHeight
      const idx   = Math.round(scrollTop / cardH)
      setActiveIndex(Math.min(idx, totalSlots - 1))
    }
  }

  useEffect(() => {
    const el = mobileScrollRef.current
    if (el) el.addEventListener('scroll', checkMobileScroll, { passive: true })
    return () => el?.removeEventListener('scroll', checkMobileScroll)
  }, [images.length, isGenerating, totalSlots])

  const VARIATION_LETTERS = ['A', 'B', 'C', 'D']
  const ANGLE_KEYS        = ['lifestyle', 'hero', 'context', 'closeup']

  function SkeletonCard({ slotIndex }: { slotIndex: number }) {
    const letter     = VARIATION_LETTERS[slotIndex] ?? String(slotIndex + 1)
    const angleKey   = ANGLE_KEYS[slotIndex]
    const angleLabel = angleKey ? ANGLE_LABELS[angleKey] : '…'

    return (
      <div className="w-full h-full rounded-2xl border border-[var(--output-border)] bg-[var(--output-surface)] overflow-hidden flex flex-col opacity-60">
        <div className="flex items-center justify-between border-b border-[var(--output-border)] px-3 py-1.5 flex-shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--output-muted)]">
            Var {letter}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-[var(--output-border)]/20 text-[var(--output-muted)] border-[var(--output-border)]">
            {angleLabel}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 bg-[var(--output-bg)]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--output-border)] border-t-[var(--accent)] animate-spin" />
          <span className="text-[10px] text-[var(--output-muted)]">Generating…</span>
        </div>
      </div>
    )
  }

  const mockupProps = { images, isGenerating, onDownloadZip }

  if (resolvedPlatform === 'etsy_product')      return <EtsyMockupGrid {...mockupProps} />
  if (resolvedPlatform === 'shopify_product')   return <ShopifyMockupGrid {...mockupProps} />
  if (resolvedPlatform === 'instagram_post')    return <InstagramPostMockup {...mockupProps} />
  if (resolvedPlatform === 'instagram_story')   return <InstagramStoryMockup {...mockupProps} />
  if (resolvedPlatform === 'tiktok')            return <TikTokMockup {...mockupProps} />
  if (resolvedPlatform === 'facebook_post')     return <FacebookMockup {...mockupProps} />

  return (
    <div className="flex flex-col h-full gap-0 md:gap-4">

      {/* ── Desktop Header ───────────────────────────────────────── */}
      <div className="hidden md:flex items-center justify-between flex-shrink-0 px-1">
        <div>
          <h2 className="text-sm font-bold text-[var(--output-text)]">
            A/B Test Variations
            {platformLabel && (
              <>
                <span className="text-[var(--output-muted)] mx-2">·</span>
                <span className="text-[var(--accent)]">{platformLabel}</span>
              </>
            )}
          </h2>
          {spec && (
            <p className="text-[10px] text-[var(--output-muted)] mt-0.5 font-mono">
              {spec.width}×{spec.height}px · {spec.aspectRatio}
            </p>
          )}
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--output-muted)] bg-[var(--output-border)]/20 px-2 py-1 rounded-md">
          {sortedImages.filter(i => i.status === 'done').length}/{totalSlots} ready
        </div>
      </div>

      {/* ── Stage banner ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isGenerating && stageMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="hidden md:flex items-center gap-2.5 bg-[var(--accent)]/10 border border-[var(--accent)]/25 rounded-xl px-4 py-2 flex-shrink-0 mx-1"
          >
            <Loader2 size={13} className="text-[var(--accent)] animate-spin flex-shrink-0" />
            <span className="text-xs font-semibold text-[var(--accent)]">
              Stage {stage}/3 — {stageMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────────────
          MOBILE  — full-screen vertical snap scroll
      ────────────────────────────────────────────────────────────────── */}
      <div className="md:hidden relative flex-1 min-h-0">
        <div
          ref={mobileScrollRef}
          className="flex flex-col h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          {sortedImages.map((img, idx) => (
            <div key={img.id} className="flex-shrink-0 w-full h-[100dvh] snap-start">
              <OutputCard image={img} index={idx} onDownloadZip={onDownloadZip} />
            </div>
          ))}

          {isGenerating && Array.from({ length: Math.max(0, 4 - sortedImages.length) }).map((_, i) => {
            const si = sortedImages.length + i
            return (
              <div key={`m-skel-${i}`} className="flex-shrink-0 w-full h-[100dvh] snap-start p-4 flex items-center justify-center">
                <SkeletonCard slotIndex={si} />
              </div>
            )
          })}
        </div>

        {/* Mobile progress dots */}
        <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {Array.from({ length: totalSlots }).map((_, idx) => (
            <div
              key={idx}
              className={[
                'w-1 h-1 rounded-full transition-all duration-300',
                activeIndex === idx ? 'w-4 bg-[var(--accent)]' : 'bg-[var(--output-border)]',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          DESKTOP  — grid, cards keep their natural platform aspect ratio
          The grid is scrollable vertically so cards never get squished.
      ────────────────────────────────────────────────────────────────── */}
      <div className="hidden md:block flex-1 min-h-0 overflow-y-auto pr-1 select-none">
        <div className={[
          'grid gap-6 pb-6',
          'grid-cols-1 lg:grid-cols-2'
        ].join(' ')}>
          {sortedImages.map((img, idx) => (
            <div
              key={img.id}
              className="w-full overflow-hidden rounded-2xl border border-[var(--output-border)] shadow-lg"
              style={{ aspectRatio: cardAspect }}
            >
              <OutputCard image={img} index={idx} onDownloadZip={onDownloadZip} desktopGrid />
            </div>
          ))}

          {isGenerating && Array.from({ length: Math.max(0, 4 - sortedImages.length) }).map((_, i) => {
            const si = sortedImages.length + i
            return (
              <div
                key={`d-skel-${i}`}
                className="w-full overflow-hidden rounded-2xl border border-[var(--output-border)]"
                style={{ aspectRatio: cardAspect }}
              >
                <SkeletonCard slotIndex={si} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
