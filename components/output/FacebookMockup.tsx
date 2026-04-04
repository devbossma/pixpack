'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, ChevronLeft, ChevronRight, MoreHorizontal, Globe, ThumbsUp, MessageCircle, Share2 } from 'lucide-react'
import type { GeneratedImage } from '@/types'
import { getImageSrc } from '@/lib/image-src'

interface FacebookMockupProps {
  images: GeneratedImage[]
  isGenerating?: boolean
  onDownloadZip?: () => void
}

const FAKE_REACTIONS = [2841, 1203, 4512, 987]
const FAKE_COMMENTS  = [134, 67, 289, 45]
const FAKE_SHARES    = [312, 89, 521, 34]

export function FacebookMockup({ images, isGenerating, onDownloadZip }: FacebookMockupProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const sortedImages = [...images].sort((a, b) => a.variation - b.variation)
  const totalSlots = isGenerating ? 4 : sortedImages.length
  const displaySlots = Array.from({ length: 4 }).map((_, i) => sortedImages[i] || null)

  const activeImage = displaySlots[activeIndex]
  const activeCopy = activeImage?.adCopy?.awareness || 'Discover the product everyone is talking about. Premium quality meets everyday life.'
  const activeDesc = activeImage?.adCopy?.consideration || 'Shop now and experience the difference.'

  function handleScroll() {
    if (!carouselRef.current) return
    const { scrollLeft, clientWidth } = carouselRef.current
    if (clientWidth === 0) return
    const idx = Math.round(scrollLeft / clientWidth)
    if (idx !== activeIndex && idx < totalSlots) setActiveIndex(idx)
  }

  function handleNext() { setActiveIndex(prev => Math.min(prev + 1, totalSlots - 1)) }
  function handlePrev() { setActiveIndex(prev => Math.max(prev - 1, 0)) }

  const reactions = FAKE_REACTIONS[activeIndex] ?? 2841
  const comments  = FAKE_COMMENTS[activeIndex]  ?? 134
  const shares    = FAKE_SHARES[activeIndex]    ?? 312

  return (
    <div className="w-full h-full bg-[#F0F2F5] flex flex-col overflow-y-auto no-scrollbar md:rounded-2xl text-[#050505]">

      {/* ─── FACEBOOK HEADER ──────────────────────────────────────── */}
      <div className="bg-white border-b border-[#CED0D4] px-4 py-2 flex items-center justify-between shrink-0">
        {/* FB wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center">
            <span className="text-white font-black text-xl leading-none" style={{ fontFamily: 'serif' }}>f</span>
          </div>
          <div className="hidden md:flex items-center bg-[#F0F2F5] rounded-full px-3 py-2 gap-2 w-44">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#65676B" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span className="text-[13px] text-[#65676B]">Search Facebook</span>
          </div>
        </div>

        {/* Nav icons */}
        <div className="flex items-center gap-1">
          {[
            <svg key="h" viewBox="0 0 24 24" width="20" height="20" fill="#1877F2"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
            <svg key="f" viewBox="0 0 24 24" width="20" height="20" fill="#65676B"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
            <svg key="m" viewBox="0 0 24 24" width="20" height="20" fill="#65676B"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>,
          ].map((icon, i) => (
            <div key={i} className="w-10 h-10 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center cursor-pointer">{icon}</div>
          ))}
        </div>
      </div>

      {/* ─── FEED ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center py-4 px-2 gap-3">

        {/* Post Card */}
        <div className="w-full max-w-[500px] bg-white rounded-xl shadow-sm overflow-hidden">

          {/* Post header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-lg" style={{ fontFamily: 'serif' }}>P</span>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[14px] font-bold leading-tight">PixPack Official</span>
                  {/* Verified badge */}
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="#1877F2">
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.5 5.5L7 10 4.5 7.5 3 9l4 4 6-7-1.5-1.5z"/>
                  </svg>
                </div>
                <div className="flex items-center gap-1 text-[12px] text-[#65676B]">
                  <span>Sponsored</span>
                  <span>·</span>
                  <Globe size={11} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <MoreHorizontal size={20} className="text-[#65676B]" />
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#65676B"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </div>
          </div>

          {/* Caption */}
          <div className="px-3 pb-2">
            <AnimatePresence mode="popLayout">
              <motion.p
                key={activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[14px] text-[#050505] leading-snug"
              >
                {activeCopy}{' '}
                <span className="text-[#65676B] cursor-pointer hover:underline text-[13px]">See more</span>
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Image area */}
          <div className="relative w-full" style={{ aspectRatio: '1/1' }}>

            {/* Desktop main image + arrows */}
            <div className="hidden lg:flex w-full h-full items-center justify-center bg-[#F0F2F5] relative">
              {activeIndex > 0 && (
                <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow z-10 text-[#050505]">
                  <ChevronLeft size={18} />
                </button>
              )}
              {activeIndex < totalSlots - 1 && displaySlots[activeIndex + 1] && (
                <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow z-10 text-[#050505]">
                  <ChevronRight size={18} />
                </button>
              )}

              {getImageSrc(activeImage) ? (
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={activeIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={getImageSrc(activeImage)!}
                    className="w-full h-full object-cover"
                    draggable={false}
                    alt={`Ad ${activeIndex + 1}`}
                  />
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={28} className="text-[#1877F2] animate-spin" />
                  <span className="text-xs text-[#65676B] font-medium">Rendering…</span>
                </div>
              )}

              {/* Variation indicator */}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeIndex + 1} / 4
              </div>
            </div>

            {/* Mobile carousel */}
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="lg:hidden w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
            >
              {displaySlots.map((slot, i) => {
                const src = getImageSrc(slot)
                return (
                  <div key={i} className="w-full h-full shrink-0 snap-center flex items-center justify-center bg-[#F0F2F5]">
                    {src
                      ? <img src={src} className="w-full h-full object-cover" draggable={false} alt={`Ad ${i + 1}`} />
                      : <div className="flex flex-col items-center gap-3">
                          <Loader2 size={28} className="text-[#1877F2] animate-spin" />
                          <span className="text-xs text-[#65676B]">Rendering…</span>
                        </div>
                    }
                  </div>
                )
              })}
            </div>

            {/* Mobile dots */}
            <div className="absolute bottom-2 left-0 right-0 flex lg:hidden justify-center gap-1.5 pointer-events-none z-10">
              {displaySlots.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-[#1877F2] scale-125' : 'bg-white/80'}`} />
              ))}
            </div>
          </div>

          {/* CTA banner */}
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-[#CED0D4] bg-[#F0F2F5]">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
              <span className="text-[11px] text-[#65676B] uppercase tracking-wide font-medium">pixpack.co</span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[13px] font-bold text-[#050505] leading-tight truncate"
                >
                  {activeDesc}
                </motion.span>
              </AnimatePresence>
              {/* Promo tag */}
              <div className="flex items-center gap-1 mt-0.5">
                <svg viewBox="0 0 16 16" width="11" height="11" fill="#1C7A37">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.28 5.72l-4 4a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06L6.75 8.19l3.47-3.47a.75.75 0 1 1 1.06 1.06z"/>
                </svg>
                <span className="text-[11px] text-[#1C7A37] font-semibold">Get 20% OFF — Limited Time</span>
              </div>
            </div>
            <button className="bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold text-[13px] px-3.5 py-2 rounded-md transition-colors shrink-0 whitespace-nowrap">
              Shop now
            </button>
          </div>

          {/* Reaction counts */}
          <div className="flex items-center justify-between px-3 py-1.5 text-[13px] text-[#65676B]">
            <div className="flex items-center gap-1.5 cursor-pointer hover:underline">
              {/* Stacked reaction badges */}
              <div className="flex items-center">
                <div className="w-[18px] h-[18px] rounded-full bg-[#1877F2] flex items-center justify-center ring-[1.5px] ring-white z-20">
                  <ThumbsUp size={10} className="text-white fill-white" strokeWidth={0} />
                </div>
                <div className="w-[18px] h-[18px] rounded-full bg-[#F7B928] flex items-center justify-center ring-[1.5px] ring-white -ml-1 z-10">
                  {/* Love reaction heart */}
                  <svg viewBox="0 0 16 16" width="10" height="10" fill="white">
                    <path d="M8 13.5C8 13.5 2 9.2 2 5.5A3.5 3.5 0 0 1 8 3.1 3.5 3.5 0 0 1 14 5.5c0 3.7-6 8-6 8z"/>
                  </svg>
                </div>
                <div className="w-[18px] h-[18px] rounded-full bg-[#F02849] flex items-center justify-center ring-[1.5px] ring-white -ml-1 z-0">
                  {/* Haha reaction */}
                  <svg viewBox="0 0 16 16" width="10" height="10" fill="white">
                    <circle cx="8" cy="8" r="7" fill="#F02849"/>
                    <circle cx="5.5" cy="6.5" r="1.2" fill="white"/>
                    <circle cx="10.5" cy="6.5" r="1.2" fill="white"/>
                    <path d="M5 10c.8 1.2 2 1.8 3 1.8s2.2-.6 3-1.8" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                  </svg>
                </div>
              </div>
              <span>{(reactions + (liked ? 1 : 0)).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="cursor-pointer hover:underline">{comments.toLocaleString()} comments</span>
              <span className="cursor-pointer hover:underline">{shares.toLocaleString()} shares</span>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex border-t border-[#CED0D4] mx-3">
            {[
              { icon: <ThumbsUp size={18} className={liked ? 'fill-[#1877F2] text-[#1877F2]' : 'text-[#65676B]'} />, label: 'Like', active: liked, onClick: () => setLiked(p => !p) },
              { icon: <MessageCircle size={18} className="text-[#65676B]" />, label: 'Comment', active: false, onClick: () => {} },
              { icon: <Share2 size={18} className="text-[#65676B]" />, label: 'Share', active: false, onClick: () => {} },
            ].map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-[#F0F2F5] transition-colors text-[13px] font-semibold ${action.active ? 'text-[#1877F2]' : 'text-[#65676B]'}`}
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop thumbnails */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2.5 border-t border-[#CED0D4]">
            {displaySlots.map((slot, i) => {
              const src = getImageSrc(slot)
              return (
                <button
                  key={i}
                  onClick={() => slot && setActiveIndex(i)}
                  className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all flex items-center justify-center bg-[#F0F2F5]
                    ${i === activeIndex ? 'border-[#1877F2]' : 'border-transparent opacity-60 hover:opacity-90'}`}
                >
                  {src
                    ? <img src={src} className="w-full h-full object-cover" draggable={false} alt="" />
                    : <Loader2 size={12} className="text-[#1877F2] animate-spin" />
                  }
                </button>
              )
            })}
            <span className="ml-auto text-[10px] font-bold text-[#65676B] uppercase tracking-widest">A/B Test Variations</span>
          </div>

          {/* Download */}
          {onDownloadZip && (
            <div className="px-3 pb-3 pt-1">
              <button
                onClick={onDownloadZip}
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white flex items-center justify-center gap-2 font-bold rounded-lg py-2.5 text-sm transition-colors"
              >
                <Download size={16} /> Download Your PixPack
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
