'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, ChevronLeft, ChevronRight, ShoppingCart, Star, Check } from 'lucide-react'
import type { GeneratedImage } from '@/types'
import { getImageSrc } from '@/lib/image-src'

interface ShopifyMockupGridProps {
  images: GeneratedImage[]
  isGenerating?: boolean
  onDownloadZip?: () => void
}

const SIZES   = ['XS', 'S', 'M', 'L', 'XL']
const COLORS  = ['#1a1a1a', '#4A90D9', '#E8D5B7', '#C8A882']
const PRICES  = ['$129.99', '$89.99', '$149.99', '$109.99']
const REVIEWS = [4.8, 4.6, 4.9, 4.7]
const REVIEW_COUNTS = [2841, 1203, 4512, 987]

export function ShopifyMockupGrid({ images, isGenerating, onDownloadZip }: ShopifyMockupGridProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const sortedImages = [...images].sort((a, b) => a.variation - b.variation)
  const totalSlots = isGenerating ? 4 : sortedImages.length
  const displaySlots = Array.from({ length: 4 }).map((_, i) => sortedImages[i] || null)

  const activeImage = displaySlots[activeIndex]
  const activeCopy = activeImage?.adCopy?.awareness || 'Premium Quality Product'
  const activeDesc = activeImage?.adCopy?.consideration || 'Crafted with precision and care. Designed to elevate your everyday.'

  function handleScroll() {
    if (!carouselRef.current) return
    const { scrollLeft, clientWidth } = carouselRef.current
    if (clientWidth === 0) return
    const idx = Math.round(scrollLeft / clientWidth)
    if (idx !== activeIndex && idx < totalSlots) setActiveIndex(idx)
  }

  function handleNext() { setActiveIndex(prev => Math.min(prev + 1, totalSlots - 1)) }
  function handlePrev() { setActiveIndex(prev => Math.max(prev - 1, 0)) }

  function handleAddToCart() {
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const price       = PRICES[activeIndex]        ?? '$129.99'
  const rating      = REVIEWS[activeIndex]       ?? 4.8
  const reviewCount = REVIEW_COUNTS[activeIndex] ?? 2841

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-y-auto no-scrollbar md:rounded-2xl border border-gray-200 shadow-sm text-[#1a1a1a]">

      {/* ─── SHOPIFY STORE HEADER ─────────────────────────────────── */}
      <div className="border-b border-gray-200 shrink-0">
        {/* Top bar */}
        <div className="bg-[#1a1a1a] text-white text-center py-1.5 text-[11px] font-medium tracking-wide">
          Free shipping on orders over $75 · Limited time offer
        </div>
        {/* Nav */}
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          <div className="text-[18px] font-black tracking-tight">PIXPACK</div>
          <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-gray-600">
            <span className="hover:text-black cursor-pointer">Collections</span>
            <span className="hover:text-black cursor-pointer">New Arrivals</span>
            <span className="hover:text-black cursor-pointer">Sale</span>
          </div>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <div className="relative">
              <ShoppingCart size={20} />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#008060] flex items-center justify-center">
                <span className="text-white text-[8px] font-black">1</span>
              </div>
            </div>
          </div>
        </div>
        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-1 px-8 pb-2 text-[12px] text-gray-400">
          <span className="hover:underline cursor-pointer">Home</span> <span>/</span>
          <span className="hover:underline cursor-pointer">Products</span> <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{activeCopy}</span>
        </div>
      </div>

      {/* ─── PRODUCT AREA ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 p-4 lg:px-8 lg:py-8 pb-10 overflow-y-auto no-scrollbar">

        {/* Left: Images */}
        <div className="flex flex-col lg:flex-row gap-3 lg:flex-[1.2] w-full min-w-0">

          {/* Thumbnail strip (Desktop) */}
          <div className="hidden lg:flex flex-col gap-2 w-[68px] shrink-0">
            {displaySlots.map((slot, i) => {
              const src = getImageSrc(slot)
              return (
                <button
                  key={i}
                  onClick={() => slot && setActiveIndex(i)}
                  className={`w-[68px] h-[68px] rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center bg-gray-50
                    ${i === activeIndex ? 'border-[#1a1a1a]' : 'border-gray-200 hover:border-gray-400'} ${!slot ? 'opacity-40 cursor-default' : ''}`}
                >
                  {src
                    ? <img src={src} className="w-full h-full object-cover" draggable={false} alt="" />
                    : <Loader2 size={14} className="text-gray-300 animate-spin" />
                  }
                </button>
              )
            })}
          </div>

          {/* Main image */}
          <div className="relative flex-1 bg-gray-50 rounded-xl overflow-hidden" style={{ aspectRatio: '1/1' }}>

            {/* Desktop */}
            <div className="hidden lg:flex w-full h-full items-center justify-center relative">
              {activeIndex > 0 && (
                <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow border border-gray-100 z-10 hover:bg-gray-50 text-black">
                  <ChevronLeft size={20} />
                </button>
              )}
              {activeIndex < totalSlots - 1 && displaySlots[activeIndex + 1] && (
                <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow border border-gray-100 z-10 hover:bg-gray-50 text-black">
                  <ChevronRight size={20} />
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
                    alt={`Product ${activeIndex + 1}`}
                  />
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-[#008060] animate-spin" />
                  <span className="text-sm text-gray-400 font-medium">Rendering…</span>
                </div>
              )}
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
                  <div key={i} className="w-full h-full shrink-0 snap-center flex items-center justify-center bg-gray-50">
                    {src
                      ? <img src={src} className="w-full h-full object-cover" draggable={false} alt={`Product ${i + 1}`} />
                      : <div className="flex flex-col items-center gap-3">
                          <Loader2 size={28} className="text-[#008060] animate-spin" />
                          <span className="text-xs text-gray-400">Rendering…</span>
                        </div>
                    }
                  </div>
                )
              })}
            </div>

            {/* Mobile dots */}
            <div className="absolute bottom-3 left-0 right-0 flex lg:hidden justify-center gap-2 pointer-events-none z-10">
              {displaySlots.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? 'bg-[#1a1a1a] scale-125' : 'bg-gray-400'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col flex-1 lg:max-w-sm gap-4 lg:pt-1">

          {/* Brand & Rating */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#008060] mb-1">PixPack Store</div>
            <h1 className="text-[22px] font-black leading-tight text-[#1a1a1a]">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={activeIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {activeCopy}
                </motion.span>
              </AnimatePresence>
            </h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < Math.floor(rating) ? 'fill-[#FACC15] text-[#FACC15]' : 'text-gray-200 fill-gray-200'} />
              ))}
            </div>
            <span className="text-[13px] font-bold text-[#1a1a1a]">{rating}</span>
            <span className="text-[13px] text-gray-400">({reviewCount.toLocaleString()} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-black">{price}</span>
            <span className="text-[14px] text-gray-400 line-through">${(parseFloat(price.replace('$', '')) * 1.33).toFixed(2)}</span>
            <span className="text-[11px] font-bold text-white bg-[#E53E3E] px-2 py-0.5 rounded-full">SAVE 25%</span>
          </div>

          {/* Color picker */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-gray-500 mb-2">Color</p>
            <div className="flex gap-2">
              {COLORS.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedColor(i)}
                  className={`w-7 h-7 rounded-full transition-all border-2 ${i === selectedColor ? 'border-[#1a1a1a] scale-110 shadow-md' : 'border-gray-200'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Size picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-bold uppercase tracking-widest text-gray-500">Size</p>
              <span className="text-[12px] text-[#008060] underline cursor-pointer font-medium">Size guide</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-bold border-2 transition-all
                    ${selectedSize === size
                      ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                      : 'border-gray-200 hover:border-gray-400 text-[#1a1a1a]'
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2.5 mt-2">
            <button
              onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-2 font-bold rounded-xl py-3.5 text-[15px] transition-all
                ${addedToCart ? 'bg-[#008060] text-white' : 'bg-[#1a1a1a] hover:bg-gray-800 text-white'}`}
            >
              {addedToCart ? <><Check size={18} /> Added to Cart</> : <><ShoppingCart size={18} /> Add to Cart</>}
            </button>
            <button className="w-full bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] font-bold rounded-xl py-3.5 text-[15px] hover:bg-gray-50 transition-colors">
              Buy it now
            </button>

            {onDownloadZip && (
              <button
                onClick={onDownloadZip}
                className="w-full bg-[#008060] hover:bg-[#006e52] text-white flex items-center justify-center gap-2 font-bold rounded-xl py-3.5 text-[15px] transition-colors"
              >
                <Download size={18} /> Download Your PixPack
              </button>
            )}
          </div>

          {/* Product description */}
          <div className="border-t border-gray-100 pt-4 mt-1">
            <p className="text-[13px] font-bold text-gray-900 mb-1.5">Product Description</p>
            <AnimatePresence mode="popLayout">
              <motion.p
                key={activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[13px] text-gray-600 leading-relaxed"
              >
                {activeDesc}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 font-medium">
            {['Free returns', 'Secure checkout', 'Ships in 1-2 days'].map(badge => (
              <div key={badge} className="flex items-center gap-1">
                <Check size={12} className="text-[#008060]" strokeWidth={3} />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
