'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Loader2, ChevronLeft, ChevronRight, ShoppingCart, Check, Heart, RefreshCw, Truck, BadgeDollarSign, Search, Menu, User } from 'lucide-react'
import type { GeneratedImage } from '@/types'
import { getImageSrc } from '@/lib/image-src'

interface ShopifyMockupGridProps {
  images: GeneratedImage[]
  isGenerating?: boolean
  onDownloadZip?: () => void
}

const SIZES         = ['S', 'M', 'L', 'XL']
const PRICES        = ['$129.00', '$89.00', '$149.00', '$109.00']
const TABS          = ['DETAIL', 'SHIPPING-RETURN', 'SIZE CHART', 'REVIEWS']

export function ShopifyMockupGrid({ images, isGenerating, onDownloadZip }: ShopifyMockupGridProps) {
  const [activeIndex, setActiveIndex]   = useState(0)
  const [selectedSize, setSelectedSize] = useState('M')
  const [qty, setQty]                   = useState(1)
  const [wishlisted, setWishlisted]     = useState(false)
  const [addedToCart, setAddedToCart]   = useState(false)
  const [activeTab, setActiveTab]       = useState(0)
  const carouselRef                     = useRef<HTMLDivElement>(null)

  const sortedImages  = [...images].sort((a, b) => a.variation - b.variation)
  const totalSlots    = isGenerating ? 4 : sortedImages.length
  const displaySlots  = Array.from({ length: 4 }).map((_, i) => sortedImages[i] || null)

  const activeImage = displaySlots[activeIndex]
  const activeCopy  = activeImage?.adCopy?.awareness     || 'Premium Quality Product'
  const activeDesc  = activeImage?.adCopy?.consideration || 'Crafted with precision and care. Designed to elevate your everyday experience with style and function.'
  const price       = PRICES[activeIndex] ?? '$129.00'

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

  /* ── Trust badge data ───────────────────────────────────────── */
  const trustBadges = [
    { Icon: BadgeDollarSign, label: 'Satisfied or Money Back' },
    { Icon: RefreshCw,       label: '30 Day Return Policy'    },
    { Icon: Truck,           label: 'Guaranteed 5 Day Delivery' },
  ]

  /* ── Horizontal thumbnail strip (shared mobile + desktop) ───── */
  function ThumbnailStrip() {
    return (
      <div className="flex items-center gap-2">
        {displaySlots.map((slot, i) => {
          const src = getImageSrc(slot)
          return (
            <button
              key={i}
              onClick={() => slot && setActiveIndex(i)}
              className={`w-[72px] h-[72px] md:w-[80px] md:h-[80px] shrink-0 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center bg-gray-50
                ${i === activeIndex ? 'border-[#1a1a1a]' : 'border-gray-200 hover:border-gray-400'}
                ${!slot ? 'opacity-40 cursor-default' : ''}`}
            >
              {src
                ? <img src={src} className="w-full h-full object-cover" draggable={false} alt="" />
                : <Loader2 size={14} className="text-gray-300 animate-spin" />
              }
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-y-auto no-scrollbar md:rounded-2xl border border-gray-200 shadow-sm text-[#1a1a1a]">

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-gray-200">
        {/* Announcement bar */}
        <div className="bg-[#1a1a1a] text-white text-center py-1.5 text-[11px] font-medium tracking-wide">
          Free shipping on orders over $75 · Limited time offer
        </div>
        {/* Nav bar */}
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          {/* Mobile hamburger */}
          <button className="md:hidden text-gray-700"><Menu size={20} /></button>

          {/* Logo */}
          <div className="text-[18px] font-black tracking-tight flex items-center gap-1">
            <span className="text-[#E53E3E] font-black text-[22px] leading-none border-l-4 border-[#E53E3E] pl-1">THE</span>
            <span>SHOP</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-gray-600">
            <span className="hover:text-black cursor-pointer transition-colors">Collections</span>
            <span className="hover:text-black cursor-pointer transition-colors">New Arrivals</span>
            <span className="hover:text-black cursor-pointer transition-colors">Sale</span>
          </div>

          {/* Icon row */}
          <div className="flex items-center gap-3 text-gray-700">
            <button className="hidden md:block hover:text-black transition-colors"><User size={19} /></button>
            <button className="hover:text-black transition-colors"><Search size={19} /></button>
            <button className="relative hover:text-black transition-colors">
              <ShoppingCart size={19} />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#E53E3E] flex items-center justify-center">
                <span className="text-white text-[8px] font-black">1</span>
              </span>
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 px-8 pb-2.5 text-[12px] text-gray-400">
          <span className="hover:underline cursor-pointer hover:text-gray-600 transition-colors">Home</span>
          <span>›</span>
          <span className="text-gray-700 font-medium truncate max-w-[240px]">{activeCopy}</span>
        </div>
      </div>

      {/* ── PRODUCT AREA ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-12 p-4 md:p-6 lg:px-10 lg:py-8 flex-1">

        {/* ─ LEFT: image + thumbnails ─────────────────────────────── */}
        <div className="flex flex-col gap-3 lg:flex-[1.1] w-full min-w-0 shrink-0">

          {/* Main image — 1:1 square */}
          <div className="relative w-full bg-[#f5f5f5] rounded-xl overflow-hidden" style={{ aspectRatio: '1/1' }}>

            {/* Desktop image with arrows */}
            <div className="hidden lg:flex absolute inset-0 items-center justify-center">
              {activeIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow border border-gray-100 flex items-center justify-center z-10 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={19} />
                </button>
              )}
              {activeIndex < totalSlots - 1 && displaySlots[activeIndex + 1] && (
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow border border-gray-100 flex items-center justify-center z-10 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={19} />
                </button>
              )}
              {getImageSrc(activeImage) ? (
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={activeIndex}
                    src={getImageSrc(activeImage)!}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                    alt="Product"
                  />
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={30} className="text-gray-400 animate-spin" />
                  <span className="text-sm text-gray-400">Rendering…</span>
                </div>
              )}
            </div>

            {/* Mobile snap carousel */}
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="lg:hidden absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
            >
              {displaySlots.map((slot, i) => {
                const src = getImageSrc(slot)
                return (
                  <div key={i} className="w-full h-full shrink-0 snap-center flex items-center justify-center bg-[#f5f5f5]">
                    {src
                      ? <img src={src} className="w-full h-full object-cover" draggable={false} alt={`Product ${i + 1}`} />
                      : <div className="flex flex-col items-center gap-3">
                          <Loader2 size={28} className="text-gray-400 animate-spin" />
                          <span className="text-xs text-gray-400">Rendering…</span>
                        </div>
                    }
                  </div>
                )
              })}
            </div>

            {/* Mobile dots */}
            <div className="absolute bottom-3 left-0 right-0 flex lg:hidden justify-center gap-1.5 pointer-events-none z-10">
              {displaySlots.map((_, i) => (
                <div key={i} className={`rounded-full transition-all ${i === activeIndex ? 'w-4 h-1.5 bg-[#1a1a1a]' : 'w-1.5 h-1.5 bg-gray-400'}`} />
              ))}
            </div>
          </div>

          {/* Thumbnail strip — horizontal, below main image */}
          <div className="flex items-center gap-2 flex-wrap">
            <ThumbnailStrip />
          </div>
        </div>

        {/* ─ RIGHT: product details ───────────────────────────────── */}
        <div className="flex flex-col flex-1 gap-4 lg:gap-3.5 mt-5 lg:mt-0 lg:pt-1 lg:max-w-[420px]">

          {/* In Stock badge */}
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            In Stock
          </div>

          {/* Product title */}
          <h1 className="text-[20px] md:text-[22px] font-black leading-tight text-[#1a1a1a]">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={activeIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="block"
              >
                {activeCopy}
              </motion.span>
            </AnimatePresence>
          </h1>

          {/* Short description */}
          <AnimatePresence mode="popLayout">
            <motion.p
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="text-[13px] text-gray-500 leading-relaxed"
            >
              {activeDesc}
            </motion.p>
          </AnimatePresence>

          <div className="border-t border-gray-200" />

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-semibold text-[#1a1a1a] w-16">Quantity</span>
            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center text-[18px] text-gray-500 hover:bg-gray-100 transition-colors font-light"
              >
                −
              </button>
              <span className="w-10 text-center text-[14px] font-semibold border-x border-gray-300 h-9 flex items-center justify-center">
                {qty}
              </span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-9 h-9 flex items-center justify-center text-[18px] text-gray-500 hover:bg-gray-100 transition-colors font-light"
              >
                +
              </button>
            </div>
          </div>

          {/* Size */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-semibold text-[#1a1a1a] w-16">Size</span>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[38px] px-3 py-1.5 rounded border text-[13px] font-semibold transition-all
                    ${selectedSize === size
                      ? 'border-[#E53E3E] bg-[#E53E3E] text-white'
                      : 'border-gray-300 text-[#1a1a1a] hover:border-gray-500'
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <div className="text-[26px] md:text-[28px] font-black text-[#1a1a1a] leading-none">
              {price}
            </div>
            <p className="text-[12px] text-gray-400 mt-1 italic">Free shipping on order usd $150+</p>
          </div>

          {/* CTA row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center gap-2 font-bold rounded-full py-3 text-[14px] transition-all
                ${addedToCart ? 'bg-green-600 text-white' : 'bg-[#E53E3E] hover:bg-[#c53030] text-white'}`}
            >
              {addedToCart
                ? <><Check size={16} strokeWidth={2.5} /> Added!</>
                : <><ShoppingCart size={16} /> ADD TO CART</>
              }
            </button>
            <button
              onClick={() => setWishlisted(w => !w)}
              className="w-11 h-11 flex items-center justify-center rounded-full border border-gray-300 hover:border-gray-500 transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={18} className={wishlisted ? 'fill-[#E53E3E] text-[#E53E3E]' : 'text-gray-500'} strokeWidth={1.8} />
            </button>
          </div>

          {/* Trust badges — bordered container, 3 columns */}
          <div className="border border-gray-200 rounded-lg grid grid-cols-3 divide-x divide-gray-200 mt-1">
            {trustBadges.map(({ Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 py-3 px-2">
                <Icon size={22} className="text-gray-500" strokeWidth={1.5} />
                <span className="text-[10px] text-gray-500 text-center leading-tight font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Download */}
          {onDownloadZip && (
            <button
              onClick={onDownloadZip}
              className="w-full bg-[#008060] hover:bg-[#006e52] text-white flex items-center justify-center gap-2 font-bold rounded-full py-3 text-[14px] transition-colors"
            >
              <Download size={16} /> Download Your PixPack
            </button>
          )}

          {/* ── Product tabs ──────────────────────────────────────── */}
          <div className="border-t border-gray-200 mt-1 pt-4">
            {/* Tab headers */}
            <div className="flex border-b border-gray-200">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`px-3 py-2 text-[11px] font-bold tracking-wide transition-all whitespace-nowrap
                    ${activeTab === i
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {/* Tab content */}
            <div className="py-4 text-[13px] text-gray-500 leading-relaxed">
              {activeTab === 0 && (
                <AnimatePresence mode="popLayout">
                  <motion.p key={activeIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    {activeDesc}
                  </motion.p>
                </AnimatePresence>
              )}
              {activeTab === 1 && <p>Free standard shipping on orders over $150. Returns accepted within 30 days of delivery in original condition.</p>}
              {activeTab === 2 && (
                <div className="grid grid-cols-4 gap-px border border-gray-200 text-center text-[12px]">
                  {['Size', 'Bust', 'Waist', 'Hip'].map(h => (
                    <div key={h} className="bg-gray-100 font-bold py-1.5 px-2">{h}</div>
                  ))}
                  {[['S','84cm','66cm','90cm'],['M','88cm','70cm','94cm'],['L','92cm','74cm','98cm'],['XL','96cm','78cm','102cm']].map(row =>
                    row.map((cell, ci) => <div key={ci} className="py-1.5 px-2 border-t border-gray-100">{cell}</div>)
                  )}
                </div>
              )}
              {activeTab === 3 && (
                <div className="flex flex-col gap-2">
                  {[['Sarah M.','Perfect fit and great quality! ⭐⭐⭐⭐⭐'],['James K.','Exactly as described, fast shipping. ⭐⭐⭐⭐⭐']].map(([name, text]) => (
                    <div key={name} className="border border-gray-100 rounded-lg p-3">
                      <p className="font-semibold text-[12px] text-gray-700 mb-0.5">{name}</p>
                      <p>{text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
