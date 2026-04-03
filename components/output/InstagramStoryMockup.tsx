'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, X, MoreHorizontal, Heart, Send, ChevronLeft, ChevronRight, VolumeX } from 'lucide-react'
import type { GeneratedImage } from '@/types'
import { getImageSrc } from '@/lib/image-src'

interface InstagramStoryMockupProps {
  images: GeneratedImage[]
  isGenerating?: boolean
  onDownloadZip?: () => void
}

const VARIATION_LABELS = ['A', 'B', 'C', 'D']

export function InstagramStoryMockup({ images, isGenerating, onDownloadZip }: InstagramStoryMockupProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const sortedImages = [...images].sort((a, b) => a.variation - b.variation)
  const totalSlots = isGenerating ? 4 : sortedImages.length
  const displaySlots = Array.from({ length: 4 }).map((_, i) => sortedImages[i] || null)

  const activeImage = displaySlots[activeIndex]
  const activeCopy = activeImage?.adCopy?.awareness || 'Your next favourite thing is here ✨'

  function handleScroll() {
    if (!carouselRef.current) return
    const { scrollLeft, clientWidth } = carouselRef.current
    if (clientWidth === 0) return
    const idx = Math.round(scrollLeft / clientWidth)
    if (idx !== activeIndex && idx < totalSlots) setActiveIndex(idx)
  }

  function handleNext() { setActiveIndex(prev => Math.min(prev + 1, totalSlots - 1)) }
  function handlePrev() { setActiveIndex(prev => Math.max(prev - 1, 0)) }

  const hasPrev = activeIndex > 0
  const hasNext = activeIndex < totalSlots - 1 && !!displaySlots[activeIndex + 1]

  /* ─── Story UI overlay — scales with the card via % padding/sizing ─── */
  function storyOverlay(index: number, copy: string, compact = false) {
    const iconSz = compact ? 16 : 20
    return (
      <>
        {/* top-to-center dark fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75 pointer-events-none" />

        {/* ── TOP: progress bars + profile ── */}
        <div className="absolute inset-x-0 top-0 z-10 flex flex-col" style={{ padding: compact ? '8px 10px 0' : '12px 14px 0' }}>

          {/* progress bars */}
          <div className="flex gap-[3px] mb-2">
            {displaySlots.map((_, i) => (
              <div key={i} className="flex-1 rounded-full bg-white/30 overflow-hidden" style={{ height: 2 }}>
                <div className={`h-full rounded-full ${i < index ? 'bg-white w-full' : i === index ? 'bg-white/90 w-full' : 'w-0'}`} />
              </div>
            ))}
          </div>

          {/* profile row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: compact ? 6 : 8 }}>
              {/* avatar */}
              <div
                className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shrink-0"
                style={{ width: compact ? 26 : 32, height: compact ? 26 : 32, padding: 2 }}
              >
                <div className="w-full h-full rounded-full bg-black" style={{ padding: 1 }}>
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-300 to-pink-400" />
                </div>
              </div>
              <div className="flex flex-col leading-none" style={{ gap: 2 }}>
                <span className="font-semibold text-white drop-shadow" style={{ fontSize: compact ? 10 : 12 }}>pixpack_official</span>
                <span className="text-white/60" style={{ fontSize: compact ? 9 : 11 }}>5h</span>
              </div>
            </div>
            <div className="flex items-center" style={{ gap: compact ? 10 : 14 }}>
              <VolumeX size={iconSz} className="text-white" strokeWidth={1.8} />
              <MoreHorizontal size={iconSz} className="text-white" strokeWidth={1.8} />
              <X size={iconSz - 2} className="text-white" strokeWidth={1.8} />
            </div>
          </div>
        </div>

        {/* ── BOTTOM: caption + reply bar ── */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col"
          style={{ padding: compact ? '0 10px 10px' : '0 14px 16px', gap: compact ? 8 : 12 }}
        >
          {/* ad copy */}
          <AnimatePresence mode="popLayout">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-white font-bold drop-shadow leading-snug"
              style={{ fontSize: compact ? 11 : 13 }}
            >
              {copy}
            </motion.p>
          </AnimatePresence>

          {/* ── Reply input row — matches real Instagram Stories ── */}
          <div className="flex items-center" style={{ gap: compact ? 8 : 10 }}>
            {/*
              Real Instagram: transparent bg, white border ~60% opacity,
              rounded-full pill, "Reply to [user]…" placeholder
            */}
            <div
              className="flex-1 rounded-full border border-white/60 text-white/70 flex items-center"
              style={{
                background: 'transparent',
                padding: compact ? '5px 12px' : '7px 16px',
                fontSize: compact ? 10 : 12,
                minWidth: 0,
              }}
            >
              <span className="truncate">Reply to pixpack_official…</span>
            </div>
            <Heart
              size={compact ? 18 : 22}
              strokeWidth={1.8}
              className="text-white shrink-0"
            />
            <Send
              size={compact ? 16 : 20}
              strokeWidth={1.8}
              className="text-white shrink-0 -rotate-[20deg]"
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden md:rounded-2xl text-white bg-black md:bg-[#262626]">

      {/* ════════════════════════════════════════════════════════════
          MOBILE  (< md) — full-screen snap carousel
      ════════════════════════════════════════════════════════════ */}
      <div className="md:hidden relative flex-1 min-h-0">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >
          {displaySlots.map((slot, i) => {
            const src = getImageSrc(slot)
            const slotCopy = slot?.adCopy?.awareness || activeCopy
            return (
              <div key={i} className="w-full h-full shrink-0 snap-center relative bg-gray-900">
                {src
                  ? <img src={src} className="w-full h-full object-cover" draggable={false} alt={`Story ${i + 1}`} />
                  : <div className="w-full h-full flex flex-col items-center justify-center">
                      <Loader2 size={32} className="text-white animate-spin" />
                      <span className="text-xs text-white/60 mt-3">Rendering…</span>
                    </div>
                }
                {storyOverlay(i, slotCopy, false)}
              </div>
            )
          })}
        </div>
        {onDownloadZip && (
          <div className="absolute bottom-20 right-3 z-20">
            <button
              onClick={onDownloadZip}
              className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-white/30 transition-all"
            >
              <Download size={13} /> Download
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          MD+  — centered portrait card + arrows below
      ════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-1 min-h-0 flex-col items-center py-4 gap-3">

        {/* Card row — flex-1 so it takes all remaining space after dots row */}
        <div className="flex-1 min-h-0 flex items-center justify-center gap-2 md:gap-3 w-full px-4">

          {/* Left arrow */}
          <button
            onClick={handlePrev}
            disabled={!hasPrev}
            className="flex-none w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#3d3d3d] hover:bg-[#4d4d4d] flex items-center justify-center transition-colors shadow-lg disabled:opacity-0 disabled:pointer-events-none"
            aria-label="Previous"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>

          {/* Portrait story card — height drives layout, aspect-ratio drives width */}
          <div
            className="relative rounded-xl md:rounded-2xl overflow-hidden bg-[#111] flex-none"
            style={{ height: '100%', aspectRatio: '9/16' }}
          >
            {getImageSrc(activeImage) ? (
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  src={getImageSrc(activeImage)!}
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                  alt={`Story variation ${VARIATION_LABELS[activeIndex]}`}
                />
              </AnimatePresence>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 size={30} className="text-white animate-spin" />
                <span className="text-xs text-white/50 mt-3">Rendering story…</span>
              </div>
            )}

            {/* overlay — compact=true on md, false on lg+ */}
            <div className="absolute inset-0 md:block lg:hidden">
              {storyOverlay(activeIndex, activeCopy, true)}
            </div>
            <div className="absolute inset-0 hidden lg:block">
              {storyOverlay(activeIndex, activeCopy, false)}
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={handleNext}
            disabled={!hasNext}
            className="flex-none w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#3d3d3d] hover:bg-[#4d4d4d] flex items-center justify-center transition-colors shadow-lg disabled:opacity-0 disabled:pointer-events-none"
            aria-label="Next"
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>

        {/* Variation pills + download — fixed at bottom */}
        <div className="flex-none flex items-center gap-2 md:gap-3">
          {displaySlots.map((slot, i) => (
            <button
              key={i}
              onClick={() => slot && setActiveIndex(i)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                i === activeIndex
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80'
              }`}
            >
              {VARIATION_LABELS[i]}
            </button>
          ))}
          {onDownloadZip && (
            <button
              onClick={onDownloadZip}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full transition-all border border-white/10 ml-2"
            >
              <Download size={11} /> Download
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
