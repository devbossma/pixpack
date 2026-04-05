'use client'

import { useRef, useState } from 'react'
import { Download, Loader2, Heart, MessageCircle, Bookmark, Share2, Music, Plus, Search } from 'lucide-react'
import type { GeneratedImage } from '@/types'
import { getImageSrc } from '@/lib/image-src'

interface TikTokMockupProps {
  images: GeneratedImage[]
  isGenerating?: boolean
  onDownloadZip?: () => void
}

const FAKE_LIKES = ['124.8K', '89.3K', '201.5K', '56.2K']
const FAKE_COMMENTS = ['4.2K', '1.8K', '9.1K', '2.3K']
const FAKE_SAVES = ['8.1K', '3.4K', '15.2K', '2.7K']
const FAKE_SHARES = ['12.4K', '8.7K', '31.2K', '5.9K']
const SOUNDS = [
  'Original Sound — pixpack_official',
  'Trending Audio — Saberlabs',
  'Viral Beat — PixPack',
  'Ad Sound — PixPack Official',
]

// Spinning vinyl disc (music indicator)
function MusicDisc({ size = 36 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="rounded-full overflow-hidden border-[3px] border-gray-600 animate-spin"
        style={{ width: size, height: size, animationDuration: '4s' }}
      >
        <div className="w-full h-full bg-gradient-to-br from-gray-500 via-gray-800 to-gray-900" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full bg-black ring-1 ring-gray-500" style={{ width: size * 0.33, height: size * 0.33 }} />
      </div>
    </div>
  )
}

// Profile avatar with pink + follow button
function ProfileAvatar({ size = 44 }: { size?: number }) {
  const plusSize = Math.round(size * 0.45)
  return (
    <div className="relative" style={{ width: size, marginBottom: plusSize * 0.4 }}>
      <div
        className="rounded-full bg-gradient-to-br from-orange-300 to-pink-500 ring-[2px] ring-white"
        style={{ width: size, height: size }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#FE2C55] flex items-center justify-center"
        style={{ width: plusSize, height: plusSize, bottom: -Math.round(plusSize * 0.5) }}
      >
        <Plus size={Math.round(plusSize * 0.65)} className="text-white" strokeWidth={3} />
      </div>
    </div>
  )
}

// TikTok-style create button for bottom nav
function CreateButton() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 52, height: 30 }}>
      <div className="absolute rounded-lg bg-[#69C9D0]" style={{ width: 40, height: 28, left: 0 }} />
      <div className="absolute rounded-lg bg-[#EE1D52]" style={{ width: 40, height: 28, right: 0 }} />
      <div className="relative z-10 rounded-lg bg-white flex items-center justify-center" style={{ width: 42, height: 28 }}>
        <Plus size={18} className="text-black" strokeWidth={3} />
      </div>
    </div>
  )
}

export function TikTokMockup({ images, isGenerating, onDownloadZip }: TikTokMockupProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const desktopScrollRef = useRef<HTMLDivElement>(null)

  const sortedImages = [...images].sort((a, b) => a.variation - b.variation)
  const totalSlots = isGenerating ? 4 : sortedImages.length
  const displaySlots = Array.from({ length: 4 }).map((_, i) => sortedImages[i] || null)

  const activeImage = displaySlots[activeIndex]
  const activeCopy = activeImage?.adCopy?.awareness || 'You need to see this 👀 #viral #trending'

  // Vertical scroll snap handler — shared logic
  function handleVerticalScroll(ref: React.RefObject<HTMLDivElement | null>) {
    if (!ref.current) return
    const { scrollTop, clientHeight } = ref.current
    if (clientHeight === 0) return
    const idx = Math.round(scrollTop / clientHeight)
    if (idx !== activeIndex && idx >= 0 && idx < totalSlots) setActiveIndex(idx)
  }

  // Programmatically scroll a snap container to a slide index (pill clicks)
  function scrollToSlide(ref: React.RefObject<HTMLDivElement | null>, idx: number) {
    if (!ref.current) return
    ref.current.scrollTo({ top: idx * ref.current.clientHeight, behavior: 'smooth' })
  }

  const likes = FAKE_LIKES[activeIndex] ?? '124.8K'
  const comments = FAKE_COMMENTS[activeIndex] ?? '4.2K'
  const saves = FAKE_SAVES[activeIndex] ?? '8.1K'
  const shares = FAKE_SHARES[activeIndex] ?? '12.4K'

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden md:rounded-2xl text-white">

      {/* ════════════════════════════════════════════════════════════════
           MOBILE  (< md)
           Full-screen vertical snap feed — each slide has its own overlays
         ════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col h-full">

        {/* Vertical snap scroll container */}
        <div
          ref={mobileScrollRef}
          onScroll={() => handleVerticalScroll(mobileScrollRef)}
          className="flex-1 min-h-0 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        >
          {displaySlots.map((slot, i) => {
            const src = getImageSrc(slot)
            const slotCopy = slot?.adCopy?.awareness || activeCopy
            const slotSound = SOUNDS[i] ?? SOUNDS[0]
            const slotLikes = FAKE_LIKES[i] ?? '124.8K'
            const slotCmts = FAKE_COMMENTS[i] ?? '4.2K'
            const slotSaves = FAKE_SAVES[i] ?? '8.1K'
            const slotShares = FAKE_SHARES[i] ?? '12.4K'
            const isActive = i === activeIndex

            return (
              <div key={i} className="w-full h-full snap-start relative bg-black flex-none overflow-hidden">

                {/* Background image */}
                {src
                  ? <img
                    src={src}
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                    alt={`Variation ${i + 1}`}
                  />
                  : <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                    <Loader2 size={36} className="text-white animate-spin" />
                    <span className="text-sm text-white/60 mt-3">Rendering…</span>
                  </div>
                }

                {/* Gradient: top + bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/90 pointer-events-none" />

                {/* ── TOP NAV (per slide) ── */}
                <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-3 pb-2 z-20">
                  <div className="w-6" />
                  <div className="flex gap-5 text-[14px] font-semibold">
                    <span className="text-white/50">Following</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-white font-bold">For You</span>
                      <div className="h-[2px] w-5 bg-white rounded-full" />
                    </div>
                  </div>
                  <Search size={20} className="text-white" />
                </div>

                {/* ── RIGHT ACTION RAIL ── */}
                <div className="absolute right-2 z-20 flex flex-col items-center gap-3"
                  style={{ bottom: 96 }}>
                  <ProfileAvatar size={44} />
                  {/* Like */}
                  <button
                    className="flex flex-col items-center gap-0.5 mt-2"
                    onClick={() => setLiked(p => !p)}
                  >
                    <Heart
                      size={30}
                      className={isActive && liked ? 'fill-[#FE2C55] text-[#FE2C55]' : 'text-white'}
                    />
                    <span className="text-[11px] font-semibold drop-shadow-md">{slotLikes}</span>
                  </button>
                  {/* Comment */}
                  <button className="flex flex-col items-center gap-0.5">
                    <MessageCircle size={30} className="text-white" />
                    <span className="text-[11px] font-semibold drop-shadow-md">{slotCmts}</span>
                  </button>
                  {/* Save/Collect */}
                  <button
                    className="flex flex-col items-center gap-0.5"
                    onClick={() => setSaved(p => !p)}
                  >
                    <Bookmark
                      size={28}
                      className={isActive && saved ? 'fill-white text-white' : 'text-white'}
                    />
                    <span className="text-[11px] font-semibold drop-shadow-md">{slotSaves}</span>
                  </button>
                  {/* Share */}
                  <button className="flex flex-col items-center gap-0.5">
                    <Share2 size={26} className="text-white" />
                    <span className="text-[11px] font-semibold drop-shadow-md">{slotShares}</span>
                  </button>
                  {/* Spinning disc */}
                  <div className="mt-1">
                    <MusicDisc size={36} />
                  </div>
                </div>

                {/* ── BOTTOM LEFT: user info + caption + sound ── */}
                <div className="absolute left-0 right-14 z-20 px-4 pointer-events-none"
                  style={{ bottom: 24 }}>
                  <div className="flex items-center gap-2 mb-1.5 pointer-events-auto">
                    <span className="font-black text-[14px] drop-shadow-md">@pixpack_official</span>
                    <span className="text-[11px] border border-white/70 px-2 py-0.5 rounded font-semibold">
                      Follow
                    </span>
                  </div>
                  <p className="text-white/90 text-[12px] leading-snug mb-1.5 drop-shadow-sm">
                    {slotCopy.length > 75 ? slotCopy.slice(0, 75) + '…' : slotCopy}
                    {' '}<span className="text-white/55">#pixpack #ads</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-white/80 pointer-events-auto">
                    <Music size={12} className="animate-spin shrink-0" style={{ animationDuration: '4s' }} />
                    <span className="text-[11px] truncate">{slotSound}</span>
                  </div>
                  {/* Slide progress dots */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {displaySlots.map((_, j) => (
                      <div
                        key={j}
                        className={`rounded-full transition-all duration-300 ${j === i
                          ? 'w-3 h-1.5 bg-white'
                          : 'w-1.5 h-1.5 bg-white/40'
                          }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Download CTA on active slide */}
                {onDownloadZip && isActive && (
                  <button
                    onClick={onDownloadZip}
                    className="absolute z-20 flex items-center gap-1.5 bg-[#FE2C55] text-white text-[11px] font-bold px-3 py-1.5 rounded-full"
                    style={{ bottom: 28, right: 12 }}
                  >
                    <Download size={12} /> Save
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* ── BOTTOM NAV BAR ── */}
        <div className="shrink-0 flex items-center justify-around px-1 py-2 bg-black border-t border-white/10 z-30">
          <button className="flex flex-col items-center gap-0.5">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-[9px] font-bold text-white">Home</span>
          </button>
          <button className="flex flex-col items-center gap-0.5">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-[9px] font-bold text-white/50">Friends</span>
          </button>
          {/* TikTok create button */}
          <button className="flex flex-col items-center">
            <CreateButton />
          </button>
          <button className="flex flex-col items-center gap-0.5">
            <MessageCircle size={22} className="text-white/50" />
            <span className="text-[9px] font-bold text-white/50">Inbox</span>
          </button>
          <button className="flex flex-col items-center gap-0.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-300 to-pink-500" />
            <span className="text-[9px] font-bold text-white/50">Profile</span>
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
           TABLET + DESKTOP  (md+)
           [lg+: Left sidebar] · Vertical snap scroll center · Right action rail
         ════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex w-full h-full overflow-hidden">

        {/* Left sidebar nav — desktop only (lg+) */}
        <div className="hidden lg:flex w-20 flex-col items-center py-4 gap-5 border-r border-white/10 shrink-0">
          <div className="flex flex-col items-center mb-1">
            <span className="text-white font-black text-[17px] leading-none tracking-tight"><span className="text-[#EE1D52]">Tik</span><span className="text-white">Tok</span></span>
          </div>
          {[
            {
              label: 'Home', active: true,
              icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
            },
            {
              label: 'Explore', active: false,
              icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            },
            {
              label: 'Following', active: false,
              icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            },
            {
              label: 'LIVE', active: false,
              icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="rgba(255,255,255,0.45)" stroke="none" /></svg>
            },
            {
              label: 'Profile', active: false,
              icon: <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-300 to-pink-500" />
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 cursor-pointer">
              {item.icon}
              <span className={`text-[8px] font-semibold ${item.active ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Center: fixed tab nav + vertical snap scroll */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Fixed tab nav */}
          <div className="shrink-0 flex justify-center gap-6 pt-3 pb-2 text-[13px] font-semibold">
            <span className="text-white/40 cursor-pointer hover:text-white/70 transition-colors">Following</span>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-white font-bold">For You</span>
              <div className="h-[2px] w-5 bg-white rounded-full" />
            </div>
            <span className="text-white/40 cursor-pointer hover:text-white/70 transition-colors">Explore</span>
          </div>

          {/* Vertical snap scroll — each slide = one variation */}
          <div
            ref={desktopScrollRef}
            onScroll={() => handleVerticalScroll(desktopScrollRef)}
            className="flex-1 min-h-0 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
          >
            {displaySlots.map((slot, i) => {
              const src = getImageSrc(slot)
              const slotCopy = slot?.adCopy?.awareness || 'You need to see this 👀 #viral #trending'
              const slotSound = SOUNDS[i] ?? SOUNDS[0]

              return (
                <div key={i} className="w-full h-full snap-start flex-none flex flex-col items-center justify-center gap-3 py-3">

                  {/* 9:16 portrait card */}
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <div
                      className="relative rounded-xl overflow-hidden bg-gray-900 shadow-2xl shadow-black/60"
                      style={{ height: '100%', aspectRatio: '9/16' }}
                    >
                      {src
                        ? <img
                          src={src}
                          className="absolute inset-0 w-full h-full object-cover"
                          draggable={false}
                          alt={`TikTok ${i + 1}`}
                        />
                        : <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Loader2 size={32} className="text-white animate-spin" />
                          <span className="text-xs text-white/60 mt-3">Rendering…</span>
                        </div>
                      }

                      {/* Gradients */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />

                      {/* Bottom info */}
                      <div className="absolute bottom-0 inset-x-0 px-3 pb-4 z-10">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-black text-[13px] drop-shadow-md">@pixpack_official</span>
                          <span className="text-[10px] border border-white/60 px-1.5 py-0.5 rounded text-white/80">Follow</span>
                        </div>
                        <p className="text-white/90 text-[11px] leading-snug mb-1.5 max-w-[160px]">
                          {slotCopy.length > 65 ? slotCopy.slice(0, 65) + '…' : slotCopy}
                        </p>
                        <div className="flex items-center gap-1.5 text-white/70">
                          <Music size={11} className="animate-spin shrink-0" style={{ animationDuration: '4s' }} />
                          <span className="text-[10px] truncate max-w-[150px]">{slotSound}</span>
                        </div>
                      </div>

                      {/* Variation badge */}
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
                        {i + 1} / 4
                      </div>
                    </div>
                  </div>

                  {/* Variation pills + Download (on every slide, active pill highlights current) */}
                  <div className="shrink-0 flex items-center gap-2">
                    {displaySlots.map((s, j) => (
                      <button
                        key={j}
                        onClick={() => {
                          if (!s) return
                          setActiveIndex(j)
                          scrollToSlide(desktopScrollRef, j)
                        }}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${j === activeIndex
                          ? 'bg-[#FE2C55] text-white'
                          : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80'
                          }`}
                      >
                        {['A', 'B', 'C', 'D'][j]}
                      </button>
                    ))}
                    {onDownloadZip && (
                      <button
                        onClick={onDownloadZip}
                        className="ml-1 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full transition-colors"
                      >
                        <Download size={12} /> Export
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right action rail — updates reactively with activeIndex */}
        <div className="w-16 flex flex-col items-center justify-center py-4 gap-4 shrink-0">
          <ProfileAvatar size={44} />
          <button className="flex flex-col items-center gap-1 mt-2" onClick={() => setLiked(p => !p)}>
            <Heart size={28} className={liked ? 'fill-[#FE2C55] text-[#FE2C55]' : 'text-white'} />
            <span className="text-[10px] font-semibold">{liked ? '125K' : likes}</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <MessageCircle size={28} className="text-white" />
            <span className="text-[10px] font-semibold">{comments}</span>
          </button>
          <button className="flex flex-col items-center gap-1" onClick={() => setSaved(p => !p)}>
            <Bookmark size={26} className={saved ? 'fill-white text-white' : 'text-white'} />
            <span className="text-[10px] font-semibold">{saves}</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <Share2 size={24} className="text-white" />
            <span className="text-[10px] font-semibold">{shares}</span>
          </button>
          <div className="mt-1">
            <MusicDisc size={38} />
          </div>
        </div>
      </div>
    </div>
  )
}
