'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, ShoppingCart, ChevronLeft, ChevronRight, Menu, Download, Star, Loader2 } from 'lucide-react'
import type { GeneratedImage } from '@/types'
import { getImageSrc } from '@/lib/image-src'

interface EtsyMockupGridProps {
  images: GeneratedImage[]
  isGenerating?: boolean
  onDownloadZip?: () => void
}

export function EtsyMockupGrid({ images, isGenerating, onDownloadZip }: EtsyMockupGridProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const sortedImages = [...images].sort((a, b) => a.variation - b.variation)
  const totalSlots = isGenerating ? 4 : sortedImages.length

  // Pad with nulls if generating
  const displaySlots = Array.from({ length: 4 }).map((_, i) => sortedImages[i] || null)

  const activeImage = displaySlots[activeIndex]
  const activeCopy = activeImage?.adCopy?.awareness || 'Premium Quality Product Item'
  const activeDesc = activeImage?.adCopy?.consideration || 'Detailed product description.'

  // Removed the useEffect that invoked `scrollTo` on [activeIndex] changes.
  // Because mobile is strictly native swiping now, programmatic scrolling
  // creates a race condition with the browser's momentum, causing bouncy UX.

  // Sync scroll position to active index (mobile)
  function handleScroll() {
    if (!carouselRef.current) return
    const { scrollLeft, clientWidth } = carouselRef.current
    if (clientWidth === 0) return // Safety check
    const idx = Math.round(scrollLeft / clientWidth)
    if (idx !== activeIndex && idx < totalSlots) {
      setActiveIndex(idx)
    }
  }

  function handleNext() {
    setActiveIndex(prev => Math.min(prev + 1, totalSlots - 1))
  }

  function handlePrev() {
    setActiveIndex(prev => Math.max(prev - 1, 0))
  }

  const ANGLE_COLORS: Record<string, string> = {
    lifestyle: 'bg-blue-500/20 text-blue-300',
    hero:      'bg-purple-500/20 text-purple-300',
    context:   'bg-amber-500/20 text-amber-300',
    closeup:   'bg-green-500/20 text-green-300',
  }

  const angleClass = activeImage?.angle ? ANGLE_COLORS[activeImage.angle] || 'bg-gray-500/20 text-gray-300' : 'bg-gray-500/20 text-gray-300'

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-y-auto no-scrollbar md:rounded-2xl border border-gray-200 shadow-sm relative text-[#222]">
      {/* ─── HEADER ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 md:px-6 md:py-3 border-b border-gray-200 shrink-0">

        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between">
          <div className="flex items-center gap-3">
            <Menu size={20} className="text-gray-700" />
            <span className="text-[#F1641E] text-2xl font-serif tracking-tight font-bold">Etsy</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Heart size={20} />
            <ShoppingCart size={20} />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-[#F1641E] text-3xl font-serif tracking-tight font-bold pr-2">Etsy</span>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-full">
              <Menu size={16} /> Categories
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-700 font-semibold cursor-pointer whitespace-nowrap ml-4">
            <span className="hover:underline">Sign in</span>
            <div className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Heart size={20} /></div>
            <div className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ShoppingCart size={20} /></div>
          </div>
        </div>
      </div>

      {/* ─── BREADCRUMBS (Desktop only) ─────────────────────────────────── */}
      <div className="hidden lg:flex items-center justify-center gap-2 py-4 text-xs font-medium text-gray-600 hover:[&>span]:underline cursor-pointer">
        <span>Homepage</span> <span className="text-gray-400">›</span>
        <span>Bags & Purses</span> <span className="text-gray-400">›</span>
        <span>Handbags</span>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 p-4 lg:px-12 lg:px-8 pb-12 overflow-y-auto no-scrollbar">

        {/* Left Side: Images */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:flex-[1.2] xl:flex-[1.5] w-full min-w-0">

          {/* Thumbnails Grid 1x4 (Desktop only) */}
          <div className="hidden lg:flex flex-col gap-3 w-[72px] shrink-0 pt-1">
            {displaySlots.map((slot, i) => {
              const src = getImageSrc(slot)
              const isActive = i === activeIndex
              return (
                <div
                  key={i}
                  onClick={() => slot && setActiveIndex(i)}
                  className={`w-[72px] h-[72px] rounded-lg overflow-hidden cursor-pointer flex items-center justify-center transition-all bg-gray-50
                    ${isActive ? 'border-2 border-gray-900 shadow-md ring-2 ring-white ring-inset' : 'border border-gray-200 hover:border-gray-400'}
                    ${!slot ? 'opacity-50 cursor-default' : ''}
                  `}
                >
                  {src ? (
                    <img src={src} className="w-full h-full object-cover rounded-md" alt={`Thumbnail ${i}`} draggable={false} />
                  ) : (
                    <Loader2 size={16} className="text-gray-400 animate-spin" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Main Visual Area */}
          <div className="relative w-full aspect-square lg:aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden group">

            {/* ── Desktop Main Image Display ── */}
            <div className="hidden lg:flex w-full h-full items-center justify-center relative">
              {/* Arrows (Desktop) */}
              {activeIndex > 0 && (
                <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 hover:bg-gray-50 z-10 hover:scale-105 transition-transform text-black">
                  <ChevronLeft size={24} />
                </button>
              )}
              {activeIndex < totalSlots - 1 && displaySlots[activeIndex + 1] && (
                <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 hover:bg-gray-50 z-10 hover:scale-105 transition-transform text-black">
                  <ChevronRight size={24} />
                </button>
              )}

              <button className="absolute right-4 top-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 z-10 transition-colors text-gray-700">
                <Heart size={20} />
              </button>

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
                    alt={`Variation ${activeIndex + 1}`} 
                  />
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-[#F1641E] animate-spin" />
                  <span className="text-sm font-semibold tracking-wide text-gray-500">Rendering...</span>
                </div>
              )}
            </div>

            {/* ── Mobile Carousel Container (Snapping) ── */}
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="lg:hidden w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
              style={{ paddingBottom: '0.1px' }} // Fix for some iOS snapping bugs
            >
              {displaySlots.map((slot, i) => {
                const src = getImageSrc(slot)
                return (
                  <div key={i} className="w-full h-full shrink-0 snap-center flex items-center justify-center relative p-0">
                    {src ? (
                      <img src={src} className="w-full h-full object-cover scale-[0.98] transition-transform" draggable={false} alt={`Variation ${i + 1}`} />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="text-[#F1641E] animate-spin" />
                        <span className="text-sm font-semibold tracking-wide text-gray-500">Rendering...</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Mobile Pagination Dots */}
            <div className="absolute bottom-4 left-0 right-0 flex lg:hidden justify-center gap-2 pointer-events-none z-10">
              {displaySlots.map((slot, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === i ? 'bg-gray-900 border border-white scale-125' : 'bg-gray-400 border border-white/50'}`}
                />
              ))}
            </div>

            {/* Floating Details / Info pill (Mobile) */}
            <div className="absolute bottom-4 left-4 lg:hidden z-10">
              <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-gray-900 shadow-sm border border-gray-200 flex items-center gap-1.5">
                <Star size={12} className="text-[#F1641E]" fill="#F1641E" /> Etsy's Pick
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Product Details */}
        <div className="flex flex-col flex-1 lg:max-w-md w-full gap-4 lg:pt-2">

          <div className="flex flex-col gap-1.5">
            <span className="text-[#A61A1A] font-bold text-[13px] tracking-wide uppercase">Low in stock, only 1 left</span>
            <div className="text-[28px] font-bold tracking-tight text-gray-900">Now USD 149.99</div>
            <span className="text-[14px] text-gray-500">Local taxes included (where applicable)</span>
          </div>

          <h1 className="text-gray-900 text-lg font-medium leading-normal block overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={activeIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {activeCopy}
              </motion.span>
            </AnimatePresence>
          </h1>

          <div className="flex items-center gap-2 text-[15px] mt-1 hover:underline cursor-pointer">
            <span className="text-gray-900 font-semibold underline-offset-4 decoration-2">PixPack-Saberlabs</span>
            <span className="bg-[#E4C7FB] text-[#42226B] rounded-full p-0.5"><Star size={10} fill="#42226B" /></span>
            <div className="flex text-black gap-0.5">
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
              <Star size={14} fill="currentColor" />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-start gap-2.5 text-gray-800 text-[14px]">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span className="font-medium">Returns & exchanges accepted</span>
            </div>
            <div className="flex items-start gap-2.5 text-gray-800 text-[14px]">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700 shrink-0 mt-0.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              <div>
                <span className="font-semibold text-green-800 block">Save 15% when you buy 2 items at this shop</span>
                <span className="text-green-800 font-medium underline underline-offset-4 decoration-1 cursor-pointer hover:text-green-900">Shop the sale</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button className="w-full bg-[#111] hover:bg-gray-900 text-white font-bold rounded-full py-3.5 text-base transition-colors shadow-sm">
              Add to cart
            </button>

            {onDownloadZip && (
              <button onClick={onDownloadZip} className="w-full bg-[#FF6922] hover:bg-[#E35D1B] text-white flex items-center justify-center gap-2 font-bold rounded-full py-3.5 text-base transition-all shadow border border-[#FF6922]/20 hover:shadow-md">
                <Download size={18} /> Download Your PixPack
              </button>
            )}
          </div>

          <div className="mt-6 flex items-start gap-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
            <div className="w-10 h-10 shrink-0 bg-[#E4C7FB] rounded-full flex items-center justify-center text-[#42226B]">
              <Star size={20} fill="currentColor" />
            </div>
            <p className="text-sm text-gray-800 leading-snug">
              <span className="font-bold text-gray-900">Star Seller.</span> This seller consistently earned 5-star reviews, shipped on time, and replied quickly to any messages they received.
            </p>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between cursor-pointer">
              <h2 className="text-base font-bold text-gray-900">Item details</h2>
              <ChevronRight size={20} className="-rotate-90 text-gray-900" />
            </div>
            <div className="mt-4 flex flex-col gap-4 text-[15px] text-gray-800 leading-relaxed font-sans">

              <div className="flex items-center gap-3 font-medium">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                Gift wrapping available
              </div>

              <p className="whitespace-pre-wrap mt-2">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={activeIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeDesc}
                  </motion.span>
                </AnimatePresence>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
