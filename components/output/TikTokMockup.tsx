'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, Heart, MessageCircle, Bookmark, Share2, Music, Plus } from 'lucide-react'
import type { GeneratedImage } from '@/types'
import { getImageSrc } from '@/lib/image-src'

interface TikTokMockupProps {
  images: GeneratedImage[]
  isGenerating?: boolean
  onDownloadZip?: () => void
}

const FAKE_LIKES   = ['124.8K', '89.3K', '201.5K', '56.2K']
const FAKE_COMMENTS = ['4.2K',   '1.8K',  '9.1K',   '2.3K']
const FAKE_SHARES  = ['12.4K',  '8.7K',  '31.2K',  '5.9K']
const SOUNDS = [
  'Original Sound — pixpack',
  'Trending Audio — Saberlabs',
  'Viral Beat — PixPack Official',
  'Ad Sound — PixPack',
]

export function TikTokMockup({ images, isGenerating, onDownloadZip }: TikTokMockupProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const sortedImages = [...images].sort((a, b) => a.variation - b.variation)
  const totalSlots = isGenerating ? 4 : sortedImages.length
  const displaySlots = Array.from({ length: 4 }).map((_, i) => sortedImages[i] || null)

  const activeImage = displaySlots[activeIndex]
  const activeCopy = activeImage?.adCopy?.awareness || 'You need to see this 👀 #viral #trending'

  function handleScroll() {
    if (!carouselRef.current) return
    const { scrollLeft, clientWidth } = carouselRef.current
    if (clientWidth === 0) return
    const idx = Math.round(scrollLeft / clientWidth)
    if (idx !== activeIndex && idx < totalSlots) setActiveIndex(idx)
  }

  function handleNext() { setActiveIndex(prev => Math.min(prev + 1, totalSlots - 1)) }
  function handlePrev() { setActiveIndex(prev => Math.max(prev - 1, 0)) }

  const likes    = FAKE_LIKES[activeIndex]    ?? '124.8K'
  const comments = FAKE_COMMENTS[activeIndex] ?? '4.2K'
  const shares   = FAKE_SHARES[activeIndex]   ?? '12.4K'
  const sound    = SOUNDS[activeIndex]        ?? SOUNDS[0]

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden md:rounded-2xl text-white relative">

      {/* ─── TOP NAV ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 z-20 relative">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        <div className="flex gap-6 text-[14px] font-semibold">
          <span className="text-white/50">Following</span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white font-bold">For You</span>
            <div className="h-[2px] w-5 bg-white rounded-full" />
          </div>
        </div>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      {/* ─── MAIN CONTENT AREA ─────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">

        {/* Desktop: main video + right rail */}
        <div className="hidden lg:flex w-full h-full">

          {/* Video-style image */}
          <div className="relative flex-1 bg-black overflow-hidden">
            {getImageSrc(activeImage) ? (
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  src={getImageSrc(activeImage)!}
                  className="w-full h-full object-cover"
                  draggable={false}
                  alt={`TikTok ${activeIndex + 1}`}
                />
              </AnimatePresence>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
                <Loader2 size={36} className="text-white animate-spin" />
                <span className="text-sm text-white/60 mt-3">Rendering…</span>
              </div>
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/40 pointer-events-none" />

            {/* Prev/Next click zones */}
            {activeIndex > 0 && (
              <button onClick={handlePrev} className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-w-resize" />
            )}
            {activeIndex < totalSlots - 1 && displaySlots[activeIndex + 1] && (
              <button onClick={handleNext} className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-e-resize" />
            )}

            {/* Bottom user info */}
            <div className="absolute bottom-0 inset-x-0 px-4 pb-5 z-10 pr-20">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-black text-[14px]">@pixpack_official</span>
                <span className="text-[11px] border border-white/60 px-2 py-0.5 rounded text-white/80 font-bold">Follow</span>
              </div>
              <AnimatePresence mode="popLayout">
                <motion.p
                  key={activeIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[13px] text-white/90 leading-snug mb-2 max-w-xs"
                >
                  {activeCopy} <span className="text-white/60">#pixpack #ads #ecommerce</span>
                </motion.p>
              </AnimatePresence>
              <div className="flex items-center gap-1.5 text-[12px] text-white/80">
                <Music size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
                <span className="truncate max-w-[180px]">{sound}</span>
              </div>
            </div>
          </div>

          {/* Right rail: actions + thumbnails */}
          <div className="w-16 flex flex-col items-center py-4 gap-5 bg-black shrink-0">

            {/* Profile */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-pink-500" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#FE2C55] flex items-center justify-center">
                <Plus size={12} className="text-white" strokeWidth={3} />
              </div>
            </div>

            <div className="mt-3 flex flex-col items-center gap-1 cursor-pointer" onClick={() => setLiked(p => !p)}>
              <Heart size={28} className={liked ? 'fill-[#FE2C55] text-[#FE2C55]' : 'text-white'} />
              <span className="text-[10px] font-bold">{liked ? '125K' : likes}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <MessageCircle size={28} className="text-white" />
              <span className="text-[10px] font-bold">{comments}</span>
            </div>

            <div className="flex flex-col items-center gap-1" onClick={() => setSaved(p => !p)}>
              <Bookmark size={26} className={saved ? 'fill-white text-white' : 'text-white'} />
              <span className="text-[10px] font-bold">{shares}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <Share2 size={24} className="text-white" />
              <span className="text-[10px] font-bold">Share</span>
            </div>

            {/* Variation thumbnails */}
            <div className="mt-2 flex flex-col gap-2">
              {displaySlots.map((slot, i) => {
                const src = getImageSrc(slot)
                return (
                  <button
                    key={i}
                    onClick={() => slot && setActiveIndex(i)}
                    className={`w-10 h-14 rounded-md overflow-hidden border-2 transition-all flex items-center justify-center bg-gray-900
                      ${i === activeIndex ? 'border-[#FE2C55] scale-105' : 'border-white/20 opacity-50 hover:opacity-80'}`}
                  >
                    {src
                      ? <img src={src} className="w-full h-full object-cover" draggable={false} alt="" />
                      : <Loader2 size={10} className="text-white animate-spin" />
                    }
                  </button>
                )
              })}
            </div>

            {onDownloadZip && (
              <button onClick={onDownloadZip} className="mt-auto flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                <Download size={22} className="text-white" />
                <span className="text-[10px] font-bold">Save</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile carousel */}
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="lg:hidden absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        >
          {displaySlots.map((slot, i) => {
            const src = getImageSrc(slot)
            return (
              <div key={i} className="w-full h-full shrink-0 snap-center relative bg-black">
                {src
                  ? <img src={src} className="w-full h-full object-cover" draggable={false} alt={`TikTok ${i + 1}`} />
                  : <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
                      <Loader2 size={32} className="text-white animate-spin" />
                      <span className="text-xs text-white/60 mt-3">Rendering…</span>
                    </div>
                }
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />
              </div>
            )
          })}
        </div>

        {/* Mobile overlays */}
        <div className="lg:hidden absolute inset-0 z-10 flex pointer-events-none">
          {/* Right sidebar actions */}
          <div className="ml-auto flex flex-col items-center justify-end gap-5 pr-3 pb-24">
            <div className="flex flex-col items-center gap-1 pointer-events-auto" onClick={() => setLiked(p => !p)}>
              <Heart size={28} className={liked ? 'fill-[#FE2C55] text-[#FE2C55]' : 'text-white'} />
              <span className="text-[10px] font-bold">{likes}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle size={28} className="text-white" />
              <span className="text-[10px] font-bold">{comments}</span>
            </div>
            <div className="flex flex-col items-center gap-1 pointer-events-auto" onClick={() => setSaved(p => !p)}>
              <Bookmark size={26} className={saved ? 'fill-white text-white' : 'text-white'} />
              <span className="text-[10px] font-bold">{shares}</span>
            </div>
          </div>
        </div>

        {/* Mobile bottom info */}
        <div className="lg:hidden absolute bottom-0 inset-x-0 z-10 px-4 pb-4 pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-black text-[13px]">@pixpack_official</span>
          </div>
          <AnimatePresence mode="popLayout">
            <motion.p
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[12px] text-white/90 mb-2 leading-snug"
            >
              {activeCopy}
            </motion.p>
          </AnimatePresence>
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-1.5 text-[11px] text-white/70">
              <Music size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
              <span className="truncate max-w-[180px]">{sound}</span>
            </div>
            {onDownloadZip && (
              <button onClick={onDownloadZip} className="flex items-center gap-1.5 bg-[#FE2C55] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <Download size={12} /> Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── BOTTOM NAV ────────────────────────────────────────────── */}
      <div className="flex items-center justify-around py-3 border-t border-white/10 shrink-0 bg-black z-20">
        {[
          { label: 'Home', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> },
          { label: 'Discover', icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
          { label: '', icon: <div className="w-9 h-7 bg-white rounded-lg flex items-center justify-center"><Plus size={20} className="text-black" strokeWidth={3} /></div> },
          { label: 'Inbox', icon: <MessageCircle size={22} className="text-white/60" /> },
          { label: 'Profile', icon: <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-300 to-pink-500" /> },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            {item.icon}
            {item.label && <span className={`text-[9px] font-bold ${i === 0 ? 'text-white' : 'text-white/50'}`}>{item.label}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
