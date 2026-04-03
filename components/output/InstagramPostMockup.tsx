'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Download, Loader2, ChevronLeft, ChevronRight, Repeat } from 'lucide-react'
import type { GeneratedImage } from '@/types'
import { getImageSrc } from '@/lib/image-src'

interface InstagramPostMockupProps {
  images: GeneratedImage[]
  isGenerating?: boolean
  onDownloadZip?: () => void
}

const FAKE_LIKES = [1842, 3201, 987, 2456]
const FAKE_COMMENTS = [24, 61, 18, 43]

export function InstagramPostMockup({ images, isGenerating, onDownloadZip }: InstagramPostMockupProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsExpanded(false)
  }, [activeIndex])

  const sortedImages = [...images].sort((a, b) => a.variation - b.variation)
  const totalSlots = isGenerating ? 4 : sortedImages.length
  const displaySlots = Array.from({ length: 4 }).map((_, i) => sortedImages[i] || null)

  const activeImage = displaySlots[activeIndex]
  const activeCopy = activeImage?.adCopy?.awareness || 'Handcrafted with love ✨ The everyday essential you didn\'t know you needed.'
  
  function handleScroll() {
    if (!carouselRef.current) return
    const { scrollLeft, clientWidth } = carouselRef.current
    if (clientWidth === 0) return
    const idx = Math.round(scrollLeft / clientWidth)
    if (idx !== activeIndex && idx < totalSlots) setActiveIndex(idx)
  }

  function handleNext() { setActiveIndex(prev => Math.min(prev + 1, totalSlots - 1)) }
  function handlePrev() { setActiveIndex(prev => Math.max(prev - 1, 0)) }

  const likesCount = FAKE_LIKES[activeIndex] ?? 1842
  const commentsCount = FAKE_COMMENTS[activeIndex] ?? 24

  const renderAvatar = () => (
    <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
      <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[12px] font-black tracking-tighter shadow-inner pb-[1px]">
        <span className="text-white relative left-[0.5px]">P</span>
        <span className="text-[#FF6922] relative -left-[0.5px]">P</span>
      </div>
    </div>
  )

  const header = (
    <div className="flex items-center justify-between w-full px-3 py-3 lg:px-4 shrink-0 lg:border-gray-900 border-transparent">
      <div className="flex items-center gap-3">
        {renderAvatar()}
        <div className="flex flex-col leading-tight mt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-white">pixpack_official</span>
            <span className="text-gray-500 text-[10px] hidden lg:block">•</span>
            <button className="text-[#3897F0] text-[14px] font-semibold hover:text-white transition-colors hidden lg:block">Follow</button>
          </div>
          <div className="flex items-center gap-1.5">
             <span className="text-[12px] text-gray-400 lg:hidden">Sponsored</span>
             <span className="text-[12px] text-gray-400 hidden lg:block font-medium">Original audio</span>
          </div>
        </div>
      </div>
      <button className="text-white hover:opacity-70 transition-opacity">
        <MoreHorizontal size={20} />
      </button>
    </div>
  )

  const actions = (
    <div className="flex items-center justify-between px-3 lg:px-4 py-3 shrink-0">
      <div className="flex items-center gap-5">
        <button onClick={() => setLiked(p => !p)} className="hover:opacity-70 transition-opacity">
          <Heart size={26} className={liked ? 'fill-red-500 text-red-500' : 'text-white'} strokeWidth={1.8} />
        </button>
        <button className="flex items-center gap-1.5 hover:opacity-70 transition-opacity text-white">
          <MessageCircle size={26} strokeWidth={1.8} />
          <span className="hidden lg:inline text-[13px] font-semibold">{commentsCount}</span>
        </button>
        <button className="flex items-center gap-1.5 hover:opacity-70 transition-opacity text-white">
          <Repeat size={26} strokeWidth={1.8} />
          <span className="hidden lg:inline text-[13px] font-semibold">1</span>
        </button>
        <button className="hover:opacity-70 transition-opacity text-white">
          <Send size={26} className="-rotate-[15deg] origin-bottom-left" strokeWidth={1.8} />
        </button>
      </div>
      <button onClick={() => setSaved(p => !p)} className="hover:opacity-70 transition-opacity">
        <Bookmark size={26} className={saved ? 'fill-white text-white' : 'text-white'} strokeWidth={1.8} />
      </button>
    </div>
  )

  const likesData = (
    <span className="text-[14px] font-semibold">{(likesCount + (liked ? 1 : 0)).toLocaleString()} likes</span>
  )

  const captionText = (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={activeIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="text-[#F5F5F5]"
      >
        {!isExpanded && activeCopy.length > 90 ? (
          <>
            {activeCopy.slice(0, 90).trim()}...
            <button 
              onClick={() => setIsExpanded(true)} 
              className="text-gray-400 hover:text-white transition-colors ml-1"
            >
              more
            </button>
          </>
        ) : (
          activeCopy
        )}
      </motion.span>
    </AnimatePresence>
  )

  return (
    <div className="w-full h-full bg-[#000000] flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden no-scrollbar md:rounded-2xl border border-gray-800 shadow-sm text-white relative">

      {/* ─── MOBILE HEADER (Hidden on Desktop) ─── */}
      <div className="lg:hidden shrink-0 border-b border-gray-900 bg-black">
        {header}
      </div>

      {/* ─── IMAGE VIEWER (Left on Desktop, Middle on Mobile) ─── */}
      <div className="relative w-full lg:w-[55%] xl:w-[60%] lg:h-full shrink-0 flex flex-col bg-black lg:border-r border-gray-900 border-b lg:border-b-0">
        
        {/* Desktop Carousel Viewer */}
        <div className="hidden lg:flex w-full flex-1 items-center justify-center relative bg-[#0a0a0a]">
          {activeIndex > 0 && (
            <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 z-10 text-white shadow-lg">
              <ChevronLeft size={20} className="mr-0.5" />
            </button>
          )}
          {activeIndex < totalSlots - 1 && displaySlots[activeIndex + 1] && (
            <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 z-10 text-white shadow-lg">
              <ChevronRight size={20} className="ml-0.5" />
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
                className="w-full h-full absolute inset-0 object-contain"
                draggable={false}
                alt={`Variation ${activeIndex + 1}`}
              />
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="text-[#3897F0] animate-spin" />
              <span className="text-xs text-gray-500 font-medium">Rendering…</span>
            </div>
          )}
          
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-none">
             {displaySlots.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-[#3897F0] scale-125' : 'bg-white/70 shadow-sm'}`} />
             ))}
          </div>
        </div>

        {/* Mobile Snap Carousel */}
        <div 
          ref={carouselRef}
          onScroll={handleScroll}
          className="lg:hidden relative w-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
          style={{ aspectRatio: '4/5' }}
        >
          {displaySlots.map((slot, i) => {
            const src = getImageSrc(slot)
            return (
              <div key={i} className="w-full h-full shrink-0 snap-center bg-black flex items-center justify-center relative">
                {src ? (
                   <img src={src} className="w-full h-full absolute inset-0 object-contain" draggable={false} alt={`Variation ${i + 1}`} />
                ) : (
                   <div className="flex flex-col items-center gap-3">
                     <Loader2 size={28} className="text-[#3897F0] animate-spin" />
                     <span className="text-xs text-gray-500 font-medium">Rendering…</span>
                   </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile Carousel Dots */}
        <div className="lg:hidden absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10">
          {displaySlots.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-[#3897F0] scale-125' : 'bg-white/70 shadow-sm'}`} />
          ))}
        </div>
      </div>

      {/* ─── RIGHT SIDEBAR (Desktop Sidebar / Mobile Bottom) ─── */}
      <div className="flex flex-col flex-1 lg:w-[45%] xl:w-[40%] shrink-0 lg:h-full bg-black min-h-0 relative">
        
        {/* Desktop Header */}
        <div className="hidden lg:block shrink-0 border-b border-gray-900 shadow-sm z-10 bg-black">
          {header}
        </div>

        {/* Post Comments Area (Scrollable on Desktop) */}
        <div className="flex flex-col flex-1 lg:overflow-y-auto no-scrollbar lg:pt-4 p-3 gap-5 lg:border-b border-gray-900 bg-black shrink-0 relative">
            
            {/* Desktop Caption */}
            <div className="hidden lg:flex gap-3">
               {renderAvatar()}
               <div className="flex flex-col flex-1">
                  <div className="text-[14px] leading-[1.35] break-words">
                     <span className="font-semibold mr-1.5">pixpack_official</span>
                     {captionText}
                  </div>
                  <span className="text-[12px] text-gray-500 mt-2 block tracking-wide font-medium">6w</span>
               </div>
            </div>

            {/* Simulated Desktop Comment */}
            <div className="hidden lg:flex gap-3 mt-1">
               <div className="w-9 h-9 rounded-full bg-gray-800 shrink-0"><img src="https://i.pravatar.cc/150?img=47" className="w-full h-full rounded-full opacity-90" alt="avatar"/></div>
               <div className="flex flex-col flex-1">
                  <div className="text-[14px] leading-[1.35] break-words pr-4">
                     <span className="font-semibold mr-1.5 text-white">saber.marketing</span>
                     <span className="text-[#F5F5F5]">This creative is absolutely perfect 🔥</span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-gray-500 mt-1.5 font-medium">
                     <span>5w</span>
                     <span>1 like</span>
                     <button className="hover:text-gray-300 transition-colors font-semibold">Reply</button>
                  </div>
               </div>
               <button className="mt-2 h-fit hover:opacity-70 transition-opacity"><Heart size={12} className="text-gray-500" /></button>
            </div>

            {/* Mobile Actions Overlay/Inline */}
            <div className="lg:hidden -mx-3 -mt-3 border-b border-gray-900 bg-black sticky top-0 z-20">
               {actions}
            </div>

            {/* Mobile Caption Block */}
            <div className="lg:hidden flex flex-col gap-1.5 text-white bg-black">
                {likesData}
                <div className="text-[14px] leading-[1.35] break-words">
                   <span className="font-semibold mr-1.5">pixpack_official</span>
                   {captionText}
                </div>
                <button className="text-[14px] text-gray-400 text-left hover:text-gray-300 transition-colors w-fit mt-1">
                   View all {commentsCount} comments
                </button>
                <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-0.5">2 hours ago</p>
            </div>
            
        </div>

        {/* Desktop Fixed Bottom Block */}
        <div className="hidden lg:block shrink-0 bg-black z-10 pb-2 border-t border-gray-900 border-t-0">
           {actions}
           <div className="px-4 pb-3 flex flex-col gap-1 text-white">
              {likesData}
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-medium">February 19</p>
           </div>
        </div>

        {/* Thumbnail Picker (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-3 shrink-0 border-t border-gray-900 bg-black">
          {displaySlots.map((slot, i) => {
            const src = getImageSrc(slot)
            return (
               <button
                key={i}
                onClick={() => slot && setActiveIndex(i)}
                className={`w-11 h-11 rounded border overflow-hidden transition-all flex items-center justify-center bg-[#111] shrink-0
                  ${i === activeIndex ? 'border-white border-2' : 'border-gray-800 opacity-50 hover:opacity-100'}`}
              >
                {src
                  ? <img src={src} className="w-full h-full object-cover" draggable={false} alt={`Thumbnail ${i + 1}`} />
                  : <Loader2 size={12} className="text-gray-600 animate-spin" />
                }
              </button>
            )
          })}
          <span className="ml-auto text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">V.{activeIndex + 1}</span>
        </div>

        {/* Universal Download Button */}
        {onDownloadZip && (
          <div className="px-3 lg:px-4 py-3 shrink-0 lg:border-t border-gray-900 bg-black pb-4 lg:pb-3">
            <button
              onClick={onDownloadZip}
              className="w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white flex items-center justify-center gap-2 font-bold rounded-xl py-3 text-[14px] transition-all hover:opacity-90 shadow-lg"
            >
              <Download size={16} /> Download Your PixPack
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
