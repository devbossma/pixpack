'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Download, BadgeCheck, Clipboard, CheckCircle, AlertTriangle, Plus } from 'lucide-react'
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
  /** True when rendered inside the desktop 2×2 grid — removes full-screen height constraints */
  desktopGrid?: boolean
}

export function OutputCard({ image, index, onDownloadZip, desktopGrid }: OutputCardProps) {
  // Social interactions
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 500) + 1200)

  // Auto-rotation state
  const [activeIdx, setActiveIdx] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  // Shopify variant state
  const [selectedSize, setSelectedSize] = useState('M')

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

  const progressBars = (
    <div className="absolute bottom-0 inset-x-0 z-30 px-3 pb-3 pointer-events-none flex flex-col gap-1.5 mt-auto w-full drop-shadow-lg">
       {/* Tab Label */}
       <div className="flex items-center">
          <span className="text-[9px] px-2 py-0.5 rounded bg-[#ff4d1c] font-black uppercase tracking-widest text-white shadow-md pointer-events-auto">
            {COPY_TABS[activeIdx].label}
          </span>
       </div>

       {/* Progress Bars Indicator */}
       <div className="flex items-center gap-1 pointer-events-auto">
         {COPY_TABS.map((tab, i) => (
           <button
             key={tab.id}
             onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setIsPaused(true) }}
             className="h-[3px] flex-1 rounded-full overflow-hidden bg-white/40 cursor-pointer backdrop-blur-sm shadow-sm"
           >
             <motion.div
               className="h-full bg-[#ff4d1c] shadow-[0_0_10px_rgba(255,77,28,0.8)]"
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
  )

  // ─── E-COMMERCE PRODUCT PAGE MOCKUP ────────────────────────────────────────────
  if (image.platform === 'shopify_product' || image.platform === 'etsy_product') {
    const ANGLE_PRODUCT_NAMES: Record<string, string> = {
      lifestyle: 'Everyday Essential',
      hero:      'Premium Edition',
      context:   'Perfect for Any Setting',
      closeup:   'Crafted in Detail',
    }
    const productName = ANGLE_PRODUCT_NAMES[image.angle] ?? 'Featured Product'
    const SIZES = ['XS', 'S', 'M', 'L', 'XL']

    const StoreNav = () => (
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E1E3E5] dark:border-[#3C3C3C] flex-shrink-0 bg-white dark:bg-[#1A1A1A]">
        <button className="p-1 text-[#5C5F62] dark:text-[#A6A6A6]">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded bg-[#008060] flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><path d="M21.9 6.6c-.1-.5-.5-.8-1-.9L8 4.3c-.5-.1-1 .2-1.2.7L3.3 17c-.2.5 0 1 .5 1.3l8 4c.2.1.4.1.6.1.2 0 .5-.1.7-.2l9-5.5c.4-.2.6-.7.5-1.1L21.9 6.6z"/></svg>
          </div>
          <span className="text-[13px] font-bold text-[#1A1A1A] dark:text-white tracking-tight">
            {image.platform === 'etsy_product' ? 'Etsy Shop' : 'PixPack Store'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[#5C5F62] dark:text-[#A6A6A6]">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <div className="relative">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#008060] text-white text-[8px] font-black flex items-center justify-center">1</span>
          </div>
        </div>
      </div>
    )

    const ProductDetails = () => (
      <div className="flex flex-col gap-3 p-4 overflow-y-auto" onClick={() => setIsPaused(true)}>
        {/* Breadcrumb */}
        <p className="text-[10px] text-[#5C5F62] dark:text-[#A6A6A6]">Home / Products / <span className="text-[#1A1A1A] dark:text-white">{productName}</span></p>

        {/* Title */}
        <h1 className="text-[16px] font-bold text-[#1A1A1A] dark:text-white leading-tight">{productName}</h1>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= 4 ? '#FFC453' : 'none'} stroke="#FFC453" strokeWidth={2}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
          </div>
          <span className="text-[11px] text-[#5C5F62] dark:text-[#A6A6A6]">4.8 (243 reviews)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-[20px] font-black text-[#1A1A1A] dark:text-white">$49.99</span>
          <span className="text-[13px] text-[#5C5F62] dark:text-[#A6A6A6] line-through">$79.99</span>
          <span className="text-[11px] font-bold text-[#008060] bg-[#E3F1EC] dark:bg-[#003D2A] px-1.5 py-0.5 rounded">37% OFF</span>
        </div>

        {/* Size selector */}
        <div>
          <p className="text-[11px] font-semibold text-[#5C5F62] dark:text-[#A6A6A6] mb-1.5">SIZE: <span className="text-[#1A1A1A] dark:text-white">{selectedSize}</span></p>
          <div className="flex gap-1.5 flex-wrap">
            {SIZES.map(sz => (
              <button
                key={sz}
                onClick={(e) => { e.stopPropagation(); setSelectedSize(sz) }}
                className={[
                  'w-9 h-9 rounded-lg border text-[11px] font-semibold transition-all pointer-events-auto',
                  selectedSize === sz
                    ? 'border-[#008060] bg-[#008060] text-white shadow-sm'
                    : 'border-[#C9CCCF] dark:border-[#444] text-[#1A1A1A] dark:text-white hover:border-[#008060]',
                ].join(' ')}
              >{sz}</button>
            ))}
          </div>
        </div>

        {/* Add to Cart */}
        <button
          className="w-full py-3 rounded-xl bg-[#008060] hover:bg-[#006B4F] text-white font-bold text-[14px] transition-all shadow-sm active:scale-[0.98] pointer-events-auto mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          Add to Cart
        </button>

        {/* Ad copy as product description — rotating */}
        <div className="border-t border-[#E1E3E5] dark:border-[#3C3C3C] pt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#008060]/10 text-[#008060] font-black uppercase tracking-widest border border-[#008060]/20">
              {COPY_TABS[activeIdx].label}
            </span>
          </div>
          <AnimatePresence mode="popLayout">
            <motion.p
              key={activeIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className={`text-[12px] text-[#5C5F62] dark:text-[#A6A6A6] leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}
            >
              {image.adCopy[activeTabId] || '…'}
            </motion.p>
          </AnimatePresence>
          {!isExpanded && (image.adCopy[activeTabId]?.length ?? 0) > 100 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(true); setIsPaused(true) }}
              className="text-[11px] font-semibold text-[#008060] hover:underline pointer-events-auto text-left"
            >
              Show more ↓
            </button>
          )}
          {/* Progress bars */}
          <div className="flex items-center gap-1.5 mt-1 pointer-events-auto">
            {COPY_TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setIsPaused(true) }}
                className="h-[3px] flex-1 rounded-full overflow-hidden bg-[#E1E3E5] dark:bg-[#3C3C3C] cursor-pointer"
              >
                <motion.div
                  className="h-full bg-[#008060]"
                  initial={{ width: i < activeIdx ? '100%' : '0%' }}
                  animate={{ width: i === activeIdx ? '100%' : i < activeIdx ? '100%' : '0%' }}
                  transition={{ duration: i === activeIdx && !isPaused ? 6 : 0, ease: 'linear' }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-between pt-1 border-t border-[#E1E3E5] dark:border-[#3C3C3C] mt-1">
          {[
            { icon: '🚚', text: 'Free Shipping' },
            { icon: '↩️', text: '30-Day Returns' },
            { icon: '🔒', text: 'Secure Checkout' },
          ].map(b => (
            <div key={b.text} className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-[14px]">{b.icon}</span>
              <span className="text-[8px] font-semibold text-[#5C5F62] dark:text-[#A6A6A6] leading-tight max-w-[60px]">{b.text}</span>
            </div>
          ))}
        </div>
      </div>
    )

    return (
      <motion.div
        {...cardEntrance(index)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={[
          'relative w-full bg-white dark:bg-[#1A1A1A] flex flex-col overflow-hidden group',
          desktopGrid
            ? 'h-full rounded-none border-0'
            : 'h-[100dvh] md:h-full md:rounded-2xl rounded-none md:border border-[var(--output-border)] border-0 snap-center',
        ].join(' ')}
      >
        <StoreNav />

        {/* Download button top-right */}
        {hasImageSrc(image) && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownloadZip?.() }}
            title="Download full pack"
            className="absolute top-10 right-3 z-20 p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-[#008060] transition shadow pointer-events-auto"
          >
            <Download size={12} />
          </button>
        )}

        {/* Var badge */}
        <div className="absolute top-10 left-3 z-20 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-widest pointer-events-none">
          Var {varLetter} · {image.angle}
        </div>

        {desktopGrid ? (
          /* ── Desktop: two-column product layout ─────────────────── */
          <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
            {/* Left: product image */}
            <div className="relative w-[55%] flex-shrink-0 bg-[#F6F6F7] dark:bg-[#2A2A2A] flex items-center justify-center overflow-hidden">
              {image.status === 'error' && !hasImageSrc(image) ? (
                <div className="flex flex-col items-center gap-2 p-4">
                  <AlertTriangle size={28} className="text-red-500" />
                  <p className="text-xs text-[#5C5F62] dark:text-[#A6A6A6]">Generation failed</p>
                </div>
              ) : !hasImageSrc(image) ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-7 h-7 rounded-full border-[3px] border-[#008060]/20 border-t-[#008060] animate-spin" />
                  <span className="text-[10px] font-semibold text-[#008060]/70 tracking-widest uppercase">Rendering...</span>
                </div>
              ) : (
                <img src={getImageSrc(image)!} className="w-full h-full object-contain" alt="Shopify Product" />
              )}
            </div>
            {/* Right: product details */}
            <div className="flex-1 min-w-0 overflow-y-auto bg-white dark:bg-[#1A1A1A]">
              <ProductDetails />
            </div>
          </div>
        ) : (
          /* ── Mobile: stacked layout ──────────────────────────────── */
          <>
            {/* Product image — top 45% */}
            <div className="relative bg-[#F6F6F7] dark:bg-[#2A2A2A] flex-shrink-0" style={{ height: '45%' }}>
              {image.status === 'error' && !hasImageSrc(image) ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 p-4">
                  <AlertTriangle size={28} className="text-red-500" />
                  <p className="text-xs text-[#5C5F62] dark:text-[#A6A6A6]">Generation failed</p>
                </div>
              ) : !hasImageSrc(image) ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-7 h-7 rounded-full border-[3px] border-[#008060]/20 border-t-[#008060] animate-spin" />
                  <span className="text-[10px] font-semibold text-[#008060]/70 tracking-widest uppercase">Rendering...</span>
                </div>
              ) : (
                <img src={getImageSrc(image)!} className="w-full h-full object-contain" alt="Shopify Product" />
              )}
              {/* Image thumbnails strip placeholder */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-[#008060]' : 'bg-[#C9CCCF] dark:bg-[#444]'}`} />
                ))}
              </div>
            </div>
            {/* Product details — bottom 55% scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-[#1A1A1A]">
              <ProductDetails />
            </div>
          </>
        )}
      </motion.div>
    )
  }

  if (image.platform === 'facebook_post') {
    return (
      <motion.div
        {...cardEntrance(index)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={[
          'relative w-full bg-[#F0F2F5] dark:bg-[#18191A] flex flex-col shrink-0 group overflow-hidden',
          desktopGrid
            ? 'h-full rounded-none border-0' // border provided by parent wrapper
            : 'h-[100dvh] md:h-full md:rounded-2xl rounded-none md:border border-[var(--output-border)] border-0 snap-center justify-center md:justify-start pt-safe',
        ].join(' ')}
      >
        <div className={['bg-white dark:bg-[#242526] w-full shadow-sm flex flex-col shrink-0 overflow-hidden', desktopGrid ? 'h-full' : 'h-full md:h-auto'].join(' ')}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 shrink-0 pointer-events-auto">
            <div className="flex items-center gap-2">
               <div className="w-10 h-10 rounded-full bg-[#ff4d1c] text-white flex items-center justify-center font-bold tracking-tighter shadow-inner">PP</div>
               <div className="flex flex-col">
                  <span className="font-bold text-[14px] text-[#050505] dark:text-[#E4E6EB] leading-tight flex items-center gap-1">PixPack <BadgeCheck size={12} className="text-[#0866FF]" fill="currentColor" stroke="white" /></span>
                  <span className="text-[12px] text-[#65676B] dark:text-[#B0B3B8] font-medium flex items-center gap-1">Sponsored <span className="text-[8px]">•</span> <span className="w-2.5 h-2.5 rounded-full border border-[#65676B] dark:border-[#B0B3B8] opacity-60" /></span>
               </div>
            </div>
            <div className="flex gap-4 text-[#65676B] dark:text-[#B0B3B8]">
              <MoreHorizontal size={20} />
            </div>
          </div>
          
          {/* Caption above image */}
          <div 
            className="px-3 pb-3 cursor-pointer shrink-0"
            onClick={() => { setIsExpanded(!isExpanded); setIsPaused(true) }}
            onTouchStart={() => setIsPaused(true)}
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className={`text-[14px] text-[#050505] dark:text-[#E4E6EB] leading-snug whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}
              >
                 {image.adCopy[activeTabId] || '...'}
              </motion.div>
            </AnimatePresence>
            {!isExpanded && (image.adCopy[activeTabId]?.length ?? 0) > 120 && (
               <span className="text-[14px] font-semibold text-[#65676B] dark:text-[#B0B3B8] hover:underline mt-0.5 block">See more</span>
            )}
          </div>

          {/* Image (Dynamically sized to fit without scrolling) */}
          <div className="relative w-full flex-1 min-h-[0px] bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center overflow-hidden">
            {image.status === 'error' && !hasImageSrc(image) ? (
              <div className="flex flex-col items-center justify-center gap-2 p-4">
                <AlertTriangle size={32} className="text-red-500" />
                <p className="text-sm text-zinc-500 font-medium tracking-wide">Generation failed</p>
              </div>
            ) : !hasImageSrc(image) ? (
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 rounded-full border-[3px] border-[#0866FF]/20 border-t-[#0866FF] animate-spin" />
                <span className="text-xs font-semibold text-[#0866FF]/70 tracking-widest uppercase">Rendering...</span>
              </div>
            ) : (
              <img src={getImageSrc(image)!} className="w-full h-full object-cover" alt="Facebook Ad Creative" />
            )}

            {/* Top Right Pack Download */}
            <button
              onClick={(e) => { e.stopPropagation(); onDownloadZip?.() }}
              title="Download full pack"
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-[#0866FF] transition shadow-lg pointer-events-auto"
            >
              <Download size={14} />
            </button>
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none shadow-sm">
               Var {varLetter} <span className="text-white/50 mx-1">•</span> {image.angle}
            </div>
          </div>

          {/* Facebook Link Preview CTA */}
          <div className="bg-[#F0F2F5] dark:bg-[#3A3B3C] px-4 py-2 border-b border-t border-[#E4E6EB] dark:border-[#3E4042] flex flex-col shrink-0">
            <span className="text-[12px] text-[#65676B] dark:text-[#B0B3B8] font-medium uppercase tracking-wider mb-0.5">PIXPACK.CO</span>
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#050505] dark:text-[#E4E6EB] leading-tight line-clamp-1">Transform Your Products Today</span>
              <button className="bg-[#E4E6EB] dark:bg-[#4E4F50] hover:bg-[#D8DADF] dark:hover:bg-[#5E5F60] text-[#050505] dark:text-[#E4E6EB] font-semibold px-4 py-1.5 rounded-md text-[14px] transition ml-2 shrink-0 pointer-events-auto">Shop Now</button>
            </div>
          </div>

          {/* Engagement Row */}
          <div className="px-4 py-2 pointer-events-auto pb-4 shrink-0">
             <div className="flex items-center justify-between text-[#65676B] dark:text-[#B0B3B8] text-[13px] border-b border-[#CED0D4] dark:border-[#3E4042] pb-2 mb-2">
               <div className="flex items-center gap-1"><Heart size={14} className="fill-[#0866FF] text-[#0866FF] bg-white dark:bg-[#242526] rounded-full"/> {likesCount}</div>
               <div className="hover:underline cursor-pointer">84 Comments • 12 Shares</div>
             </div>
             <div className="flex items-center justify-between text-[#65676B] dark:text-[#B0B3B8] px-2 font-semibold text-[14px]">
               <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] rounded-md cursor-pointer transition text-[#65676B] dark:text-[#B0B3B8]" onClick={handleLike}>
                 <Heart size={18} className={liked ? 'fill-[#0866FF] text-[#0866FF]' : ''} /> Like
               </div>
               <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] rounded-md cursor-pointer transition"><MessageCircle size={18}/> Comment</div>
               <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F0F2F5] dark:hover:bg-[#3A3B3C] rounded-md cursor-pointer transition"><Send size={18}/> Share</div>
             </div>
          </div>

          {/* Facebook Ad Copy Type Indicator */}
          <div className="px-4 pb-4 pt-2 border-t border-[#E4E6EB] dark:border-[#3E4042] flex flex-col gap-2 pointer-events-auto shrink-0">
             <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0866FF]/10 text-[#0866FF] font-black uppercase tracking-widest border border-[#0866FF]/20 shadow-sm">
                  {COPY_TABS[activeIdx].label}
                </span>
             </div>
             <div className="flex items-center gap-1 w-full mt-0.5">
               {COPY_TABS.map((tab, i) => (
                 <button
                   key={tab.id}
                   onClick={(e) => { e.stopPropagation(); setActiveIdx(i); setIsPaused(true) }}
                   className="h-[4px] flex-1 rounded-full overflow-hidden bg-[#E4E6EB] dark:bg-[#3E4042] cursor-pointer"
                 >
                   <motion.div
                     className="h-full bg-[#0866FF]"
                     initial={{ width: i < activeIdx ? '100%' : '0%' }}
                     animate={{ width: i === activeIdx ? '100%' : i < activeIdx ? '100%' : '0%' }}
                     transition={{ duration: i === activeIdx && !isPaused ? 6 : 0, ease: "linear" }}
                   />
                 </button>
               ))}
             </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // default return (Instagram Post/Reels/TikTok)
  return (
    <motion.div
      {...cardEntrance(index)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={[
        'relative w-full bg-black overflow-hidden flex flex-col shrink-0 group',
        desktopGrid
          ? 'h-full rounded-none border-0' // border/rounding from parent wrapper
          : 'h-[100dvh] md:h-full md:rounded-2xl rounded-none md:border border-[var(--output-border)] border-0 md:shadow-2xl snap-center',
      ].join(' ')}
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
            className={desktopGrid ? 'w-full h-full object-contain' : 'w-full h-full object-contain md:object-cover'}
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

      {progressBars}
    </motion.div>
  )
}

