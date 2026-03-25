'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Download, BadgeCheck, Clipboard, CheckCircle, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GeneratedImage, Platform } from '@/types'
import { PLATFORM_SPECS } from '@/lib/platforms'
import { cardEntrance } from '@/lib/animations'
import { getImageSrc, hasImageSrc } from '@/lib/image-src'

type CopyTab = 'awareness' | 'consideration' | 'conversion'

const COPY_TABS: { id: CopyTab; label: string }[] = [
  { id: 'awareness',     label: 'Awareness' },
  { id: 'consideration', label: 'Consideration' },
  { id: 'conversion',    label: 'Conversion' },
]

const VARIATION_LETTERS = ['A', 'B', 'C', 'D'] as const

interface OutputCardProps {
  image: GeneratedImage
  index: number
  onDownloadZip?: () => void
}

export function OutputCard({ image, index, onDownloadZip }: OutputCardProps) {
  // Social interactions
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 500) + 1200)

  // Auto-rotation state
  const [activeIdx, setActiveIdx] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const activeTabId = COPY_TABS[activeIdx].id

  // Auto-rotate effect
  useEffect(() => {
    if (isPaused || !hasImageSrc(image)) return
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % 3)
    }, 6000) // 6 seconds per caption
    return () => clearInterval(timer)
  }, [isPaused, image])

  async function copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadImage(): void {
    const src = getImageSrc(image)
    if (!src) return

    const varLetter = VARIATION_LETTERS[(image.variation - 1)] ?? 'X'

    if (src.startsWith('http') || src.startsWith('/api/image')) {
      const a = document.createElement('a')
      a.href = src
      a.download = `pixpack-variation-${varLetter}-${image.angle}.png`
      a.target = '_blank'
      a.click()
      return
    }

    const base64Data = src.includes(',') ? src.split(',')[1] : src
    const byteChars = atob(base64Data)
    const byteNums = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
    const blob = new Blob([byteNums], { type: 'image/png' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pixpack-variation-${varLetter}-${image.angle}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLike = () => {
    setLiked(!liked)
    setLikesCount(prev => liked ? prev - 1 : prev + 1)
  }

  const spec = PLATFORM_SPECS[image.platform as Platform] ?? PLATFORM_SPECS.instagram_post
  const varLetter = VARIATION_LETTERS[(image.variation - 1)] ?? 'X'

  return (
    <motion.div
      {...cardEntrance(index)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[100dvh] md:h-full bg-black md:rounded-2xl rounded-none md:border border-[var(--output-border)] border-0 overflow-hidden md:shadow-2xl flex flex-col shrink-0 snap-center group"
    >
      {/* ── 1. Image Background (Full Bleed) ── */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#0a0a0a]">
        {image.status === 'error' && !hasImageSrc(image) ? (
          <div className="flex flex-col items-center justify-center gap-2 p-4">
            <AlertTriangle size={32} className="text-red-500" />
            <p className="text-sm text-white/50 font-medium tracking-wide">Generation failed</p>
          </div>
        ) : !hasImageSrc(image) ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 rounded-full border-[3px] border-white/10 border-t-[#ff4d1c] animate-spin" />
            <span className="text-xs font-semibold text-white/50 tracking-widest uppercase">Rendering...</span>
          </div>
        ) : (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={getImageSrc(image)!}
            alt={`Variation ${varLetter}`}
            className="w-full h-full object-contain md:object-cover"
          />
        )}
      </div>

      {/* ── 2. Gradient Overlays for Readability ── */}
      {hasImageSrc(image) && (
        <>
          <div className="absolute inset-x-0 top-0 h-32 z-[1] pointer-events-none bg-gradient-to-b from-black/60 to-transparent opacity-60" />
          <div className="absolute inset-x-0 bottom-0 h-64 z-[1] pointer-events-none bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        </>
      )}

      {/* ── 3. Floating Top Bar ── */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-4 pointer-events-none">
        <div className="flex flex-col drop-shadow-md">
           <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
             Var {varLetter} <span className="text-white/50 mx-1">•</span> {image.angle}
           </span>
        </div>
        {hasImageSrc(image) && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownloadZip?.() }}
            title="Download full pack"
            className="pointer-events-auto p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-[#ff4d1c] transition border border-white/10 shadow-lg"
          >
            <Download size={14} />
          </button>
        )}
      </div>

      {/* ── 4. Floating Right Action Bar (TikTok Style) ── */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">
        <div className="flex flex-col items-center gap-1 cursor-pointer group/btn" onClick={handleLike}>
          <motion.div whileTap={{ scale: 0.8 }} className="p-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-lg transition group-hover/btn:bg-black/50">
            <Heart size={22} className={`transition-colors duration-200 ${liked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </motion.div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">{likesCount >= 1000 ? `${(likesCount/1000).toFixed(1)}k` : likesCount}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1 cursor-pointer group/btn">
          <motion.div whileTap={{ scale: 0.8 }} className="p-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-lg transition group-hover/btn:bg-black/50">
            <MessageCircle size={22} className="text-white fill-white/10" strokeWidth={1.5} />
          </motion.div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">102</span>
        </div>

        <div className="flex flex-col items-center gap-1 cursor-pointer group/btn">
          <motion.div whileTap={{ scale: 0.8 }} className="p-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-lg transition group-hover/btn:bg-black/50">
            <Bookmark 
              size={22} 
              className={`transition-colors duration-200 ${saved ? 'text-amber-500 fill-amber-500' : 'text-white fill-white/10'}`} 
              strokeWidth={1.5} 
              onClick={(e) => { e.stopPropagation(); setSaved(!saved) }}
            />
          </motion.div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">Save</span>
        </div>

        <div className="flex flex-col items-center gap-1 cursor-pointer group/btn">
          <motion.div whileTap={{ scale: 0.8 }} className="p-2.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-lg transition group-hover/btn:bg-black/50">
            <Send size={22} className="text-white fill-white/10" strokeWidth={1.5} />
          </motion.div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">Share</span>
        </div>
      </div>

      {/* ── 5. Floating Bottom Ad Copy (TikTok Caption area) ── */}
      <div className="absolute bottom-0 left-0 right-14 z-20 p-4 pb-4 flex flex-col justify-end pointer-events-none">
        {/* Author Avatar & Username */}
        <div className="flex items-center gap-2 mb-2 pointer-events-auto cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#ff4d1c] to-[#ffb03a] p-[2px] shadow-xl shrink-0">
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center border border-black/20">
              <span className="font-black text-[13px] text-[#ff4d1c] tracking-tighter">PP</span>
            </div>
          </div>
          <div className="flex flex-col drop-shadow-md">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-white tracking-wide">PixPack</span>
              <BadgeCheck size={14} className="text-blue-500 drop-shadow-sm" fill="currentColor" stroke="white" />
            </div>
            <span className="text-[10px] font-medium text-white/70">Sponsored</span>
          </div>
        </div>

        {/* Caption Text Box */}
        <div 
          className="relative pointer-events-auto cursor-pointer min-h-[40px] mb-3"
          onClick={() => { setIsExpanded(!isExpanded); setIsPaused(true) }}
          onTouchStart={() => setIsPaused(true)}
        >
          <AnimatePresence mode="popLayout">
            <motion.p
              key={activeIdx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className={`text-[13px] text-white/95 leading-[1.4] drop-shadow-md tracking-wide ${isExpanded ? '' : 'line-clamp-2'}`}
            >
              {image.adCopy[activeTabId] || '...'}
            </motion.p>
          </AnimatePresence>
          {!isExpanded && (image.adCopy[activeTabId]?.length ?? 0) > 85 && (
             <span className="text-[12px] font-bold text-[#ff4d1c] mt-1 block drop-shadow-sm">Read more</span>
          )}
        </div>
      </div>

      {/* ── 6. Progress Bars & Tab Info at absolute bottom ── */}
      <div className="absolute bottom-0 inset-x-0 z-30 px-3 pb-3 pointer-events-none flex flex-col gap-2">
         {/* Tab Label & Copy Button */}
         <div className="flex items-center justify-between">
            <span className="text-[9px] px-2 py-0.5 rounded bg-[#ff4d1c] font-black uppercase tracking-widest text-white shadow-lg pointer-events-auto">
              {COPY_TABS[activeIdx].label}
            </span>
            {hasImageSrc(image) && (
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard(image.adCopy[activeTabId] ?? '') }}
                className="pointer-events-auto text-white/80 hover:text-white flex items-center gap-1.5 text-[10px] font-bold bg-black/40 px-2 py-1 rounded backdrop-blur-md transition-colors border border-white/10 shadow-sm"
              >
                {copied ? <CheckCircle size={12} className="text-green-500" /> : <Clipboard size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
         </div>

         {/* Progress Bars Indicator */}
         <div className="flex items-center gap-1 pointer-events-auto mt-0.5">
           {COPY_TABS.map((tab, i) => (
             <button
               key={tab.id}
               onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setIsPaused(true) }}
               className="h-[3px] flex-1 rounded-full overflow-hidden bg-white/20 cursor-pointer backdrop-blur-sm"
             >
               <motion.div
                 className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                 initial={{ width: i < activeIdx ? '100%' : '0%' }}
                 animate={{
                   width: i === activeIdx ? '100%' : i < activeIdx ? '100%' : '0%'
                 }}
                 transition={{
                   duration: i === activeIdx && !isPaused ? 6 : 0,
                   ease: "linear"
                 }}
               />
             </button>
           ))}
         </div>
      </div>
    </motion.div>
  )
}

