'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { OutputCard } from './OutputCard'
import type { GeneratedImage, Platform } from '@/types'
import { PLATFORM_SPECS } from '@/lib/platforms'
import { useGenerationStore } from '@/hooks/useGeneration'

const PLATFORM_LABELS: Record<string, string> = {
  instagram_post:  'Instagram Post',
  instagram_story: 'Instagram Story',
  tiktok:          'TikTok',
  facebook_post:   'Facebook Post',
  shopify_product: 'Shopify Product',
  web_banner:      'Web Banner',
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
}

export function OutputGrid({ images, platform, isGenerating }: OutputGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const generationState = useGenerationStore(s => s.generationState)
  const isStateGenerating = generationState.status === 'generating'
  const stageMessage = isStateGenerating ? generationState.stageMessage : null
  const stage = isStateGenerating ? generationState.stage : 0

  // Sort images by variation number
  const sortedImages = [...images].sort((a, b) => a.variation - b.variation)
  const totalSlots = isGenerating ? 4 : sortedImages.length

  const resolvedPlatform = platform ?? images[0]?.platform ?? null
  const platformLabel = resolvedPlatform ? (PLATFORM_LABELS[resolvedPlatform] ?? resolvedPlatform) : null
  const spec = resolvedPlatform ? PLATFORM_SPECS[resolvedPlatform as Platform] : null

  function checkScroll(): void {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    
    setCanScrollLeft(scrollLeft > 20)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20)

    // Calculate active slide index based on the first visible card's offset
    const cards = scrollRef.current.children
    if (cards.length > 0) {
      const cardWidth = (cards[0] as HTMLElement).offsetWidth + 20 // width + gap
      const index = Math.round(scrollLeft / cardWidth)
      setActiveIndex(Math.min(index, totalSlots - 1))
    }
  }

  useEffect(() => {
    checkScroll()
    const current = scrollRef.current
    if (current) {
      current.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
    }
    return () => {
      current?.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [images.length, isGenerating, totalSlots])

  function scroll(direction: 'left' | 'right'): void {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.75
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const VARIATION_LETTERS = ['A', 'B', 'C', 'D']
  const ANGLE_KEYS = ['lifestyle', 'hero', 'context', 'closeup']

  return (
    <div className="flex flex-col h-full gap-4 group/grid">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-shrink-0 px-1">
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

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={[
                'p-1.5 rounded-lg border border-[var(--output-border)] bg-[var(--output-surface)] text-[var(--output-muted)] transition-all',
                canScrollLeft ? 'opacity-100 hover:text-[var(--output-text)] hover:border-[var(--accent)] hover:shadow-sm' : 'opacity-30 cursor-not-allowed',
              ].join(' ')}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={[
                'p-1.5 rounded-lg border border-[var(--output-border)] bg-[var(--output-surface)] text-[var(--output-muted)] transition-all',
                canScrollRight ? 'opacity-100 hover:text-[var(--output-text)] hover:border-[var(--accent)] hover:shadow-sm' : 'opacity-30 cursor-not-allowed',
              ].join(' ')}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--output-muted)] bg-[var(--output-border)]/20 px-2 py-1 rounded-md">
            {sortedImages.filter(i => i.status === 'done').length}/{totalSlots} ready
          </div>
        </div>
      </div>

      {/* ── Stage banner ── */}
      <AnimatePresence>
        {isGenerating && stageMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2.5 bg-[var(--accent)]/10 border border-[var(--accent)]/25 rounded-xl px-4 py-2 flex-shrink-0 mx-1"
          >
            <Loader2 size={13} className="text-[var(--accent)] animate-spin flex-shrink-0" />
            <span className="text-xs font-semibold text-[var(--accent)]">
              Stage {stage}/3 — {stageMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Carousel Slider ── */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory gap-5 px-1 pb-4 custom-scrollbar-hide no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Rendered images */}
          {sortedImages.map((img, idx) => (
            <div
              key={img.id}
              className="flex-shrink-0 w-[85%] sm:w-[calc(50%-10px)] md:w-80 lg:w-[360px] h-full snap-start"
            >
              <OutputCard image={img} index={idx} />
            </div>
          ))}

          {/* Skeleton slots */}
          {isGenerating && Array.from({ length: Math.max(0, 4 - sortedImages.length) }).map((_, i) => {
            const slotIndex = sortedImages.length + i
            const letter = VARIATION_LETTERS[slotIndex] ?? String(slotIndex + 1)
            const angleKey = ANGLE_KEYS[slotIndex]
            const angleLabel = angleKey ? ANGLE_LABELS[angleKey] : '…'

            return (
              <div
                key={`skeleton-${i}`}
                className="flex-shrink-0 w-[85%] sm:w-[calc(50%-10px)] md:w-80 lg:w-[360px] h-full snap-start"
              >
                <div className="rounded-xl border border-[var(--output-border)] bg-[var(--output-surface)] overflow-hidden flex flex-col h-full opacity-60">
                  <div className="flex items-center justify-between border-b border-[var(--output-border)] px-3 py-1.5 flex-shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--output-muted)]">
                      Var {letter}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-[var(--output-border)]/20 text-[var(--output-muted)] border-[var(--output-border)]">
                      {angleLabel}
                    </span>
                  </div>
                  <div className="flex-1 bg-[var(--output-bg)] flex flex-col items-center justify-center gap-3 p-4">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--output-border)] border-t-[var(--accent)] animate-spin" />
                    <span className="text-[10px] text-[var(--output-muted)]">Generating…</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Progress Indicators (dots) ── */}
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
    </div>
  )
}
