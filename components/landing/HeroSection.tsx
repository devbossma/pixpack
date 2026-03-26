'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
} from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Instagram,
  Facebook,
  ShoppingBag,
  Music2,
  Zap,
} from 'lucide-react'

// ─── Platform cycling data ────────────────────────────────────────────────────
const PLATFORMS = [
  { name: 'Instagram Post',  Icon: Instagram,   color: '#E1306C', accent: 'from-[#E1306C]/20 to-[#833AB4]/10' },
  { name: 'TikTok Ad',       Icon: Music2,       color: '#69C9D0', accent: 'from-[#010101]/20 to-[#69C9D0]/10' },
  { name: 'Facebook Ad',     Icon: Facebook,     color: '#1877F2', accent: 'from-[#1877F2]/20 to-[#0C4A99]/10' },
  { name: 'Shopify Product', Icon: ShoppingBag,  color: '#008060', accent: 'from-[#008060]/20 to-[#004C3F]/10' },
]

const AD_ANGLES = ['Lifestyle', 'Hero', 'Context', 'Closeup']

// ─── Noise overlay (SVG data URI, no external file) ──────────────────────────
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = (to / 1400) * 16
    const t = setInterval(() => {
      start += step
      if (start >= to) { setVal(to); clearInterval(t) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(t)
  }, [inView, to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

// ─── "Before" product card ───────────────────────────────────────────────────
function BeforeCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-36 md:w-44 flex-shrink-0"
    >
      {/* Label */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#605c55] mb-2 text-center">Your photo</p>
      {/* Card */}
      <div className="relative rounded-xl border border-[#2a2a25] bg-[#141412] aspect-square overflow-hidden">
        {/* Faux product — gradient shapes */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c19] to-[#0f0f0d]" />
        {/* Centered product silhouette */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-20 rounded-lg bg-gradient-to-b from-[#3a3a30] to-[#2a2a20] border border-[#4a4a38]/40 shadow-xl" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-3 rounded-full bg-[#4a4a38]/60" />
          </div>
        </div>
        {/* Watermark strip (Photoroom-style) */}
        <div className="absolute inset-0 flex flex-col justify-around overflow-hidden pointer-events-none opacity-20">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-6 text-[9px] font-bold text-[#a09c94] whitespace-nowrap"
              style={{ transform: `rotate(-25deg) translateX(${i % 2 === 0 ? '-10px' : '10px'})` }}>
              {[...Array(8)].map((_, j) => <span key={j}>Photoroom</span>)}
            </div>
          ))}
        </div>
        {/* Corner badge */}
        <div className="absolute top-2 right-2 bg-[#2a2a25] rounded px-1.5 py-0.5 text-[8px] font-bold text-[#605c55] uppercase tracking-widest">Raw</div>
      </div>
    </motion.div>
  )
}

// ─── Pipeline connector ───────────────────────────────────────────────────────
function PipelineConnector() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="flex flex-row md:flex-col items-center gap-3 md:gap-2 px-2 flex-shrink-0 py-4 md:py-0"
    >
      {/* AI badge */}
      <div className="bg-[#ff4d1c] rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,77,28,0.4)]">
        <Sparkles size={11} className="text-white" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">AI</span>
      </div>
      {/* Animated dashes */}
      <div className="flex flex-row md:flex-col items-center gap-1">
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#ff4d1c]"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <ArrowRight size={16} className="text-[#ff4d1c] hidden md:block" />
      <ArrowRight size={16} className="text-[#ff4d1c] block md:hidden rotate-90" />
    </motion.div>
  )
}

// ─── After: 4 platform ad cards ──────────────────────────────────────────────
function AfterCards({ activePlatformIdx }: { activePlatformIdx: number }) {
  const platform = PLATFORMS[activePlatformIdx]
  const { Icon } = platform

  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#605c55] mb-0 text-center">4 ad variations</p>
      {AD_ANGLES.map((angle, i) => (
        <motion.div
          key={`${activePlatformIdx}-${i}`}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: i * 0.12 + 0.05, ease: [0.16, 1, 0.3, 1] }}
          className={`relative flex items-center gap-2 rounded-lg border border-[#2a2a25] bg-gradient-to-r ${platform.accent} bg-[#141412] px-3 py-2.5 w-48 md:w-52 overflow-hidden`}
        >
          {/* Platform icon */}
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${platform.color}20`, border: `1px solid ${platform.color}40` }}
          >
            <Icon size={12} style={{ color: platform.color }} />
          </div>
          {/* Labels */}
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#f0ece3] leading-tight">{angle}</p>
            <p className="text-[9px] text-[#605c55] truncate">{platform.name}</p>
          </div>
          {/* Ready dot */}
          <motion.div
            className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: platform.color }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
          />
        </motion.div>
      ))}
    </div>
  )
}

// ─── Transformation demo ──────────────────────────────────────────────────────
function TransformationDemo() {
  const [platIdx, setPlatIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setPlatIdx(i => (i + 1) % PLATFORMS.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6"
    >
      <BeforeCard />
      <PipelineConnector />
      <AnimatePresence mode="wait">
        <motion.div
          key={platIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AfterCards activePlatformIdx={platIdx} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Cycling headline accent ─────────────────────────────────────────────────
function CyclingPlatformWord() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % PLATFORMS.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <span className="inline-block relative">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-[var(--accent)] inline-block whitespace-nowrap"
          style={{ color: PLATFORMS[idx].color }}
        >
          {PLATFORMS[idx].name}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function HeroSection() {
  const router = useRouter()

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden bg-[#0c0c0b]"
      style={{ minHeight: '100svh' }}
    >
      {/* ── Background layers ─────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat', backgroundSize: '256px' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(#f0ece3 1px,transparent 1px),linear-gradient(90deg,#f0ece3 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        {/* Large radial glow — top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,77,28,0.10) 0%, transparent 70%)' }} />
        {/* Soft bottom vignette */}
        <div className="absolute bottom-0 inset-x-0 h-40"
          style={{ background: 'linear-gradient(to top, #0c0c0b, transparent)' }} />
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center gap-12">

        {/* 1 ── Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 rounded-full border border-[#ff4d1c]/25 bg-[#ff4d1c]/8 px-4 py-1.5"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4d1c] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff4d1c]" />
          </span>
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff4d1c]">
            Free Beta — No account needed
          </span>
        </motion.div>

        {/* 2 ── Headline (single h1 for SEO) */}
        <h1
          aria-label="AI product ad generator: turn one photo into a full Instagram, TikTok, Facebook or Shopify ad pack while your coffee brews"
          className="text-center space-y-0.5 max-w-3xl"
        >
          {/* Visually-hidden static text — read by Google, not visible */}
          <span className="sr-only">
            AI product ad generator — one photo to a full ad pack while your coffee brews
          </span>

          {/* Line 1 — static */}
          <div className="overflow-hidden" aria-hidden>
            <motion.span
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.75, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="block font-display font-black text-[var(--text)] leading-[1.05] tracking-[-0.04em]"
              style={{ fontSize: 'clamp(1.75rem, 8vw, 4.5rem)' }}
            >
              One photo.
            </motion.span>
          </div>

          {/* Line 2 — cycling platform */}
          <div className="overflow-hidden" aria-hidden>
            <motion.span
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="block font-display font-black leading-[1.05] tracking-[-0.04em]"
              style={{ fontSize: 'clamp(1.75rem, 8vw, 4.5rem)' }}
            >
              A full{' '}<CyclingPlatformWord />{' '}pack.
            </motion.span>
          </div>

          {/* Line 3 — static */}
          <div className="overflow-hidden" aria-hidden>
            <motion.span
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.75, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="block font-display font-black text-[var(--text-secondary)] leading-[1.05] tracking-[-0.04em]"
              style={{ fontSize: 'clamp(1.75rem, 8vw, 4.5rem)' }}
            >
              While your coffee brews.
            </motion.span>
          </div>
        </h1>

        {/* 3 ── Subline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="text-center text-sm md:text-lg text-[var(--text-secondary)] max-w-md leading-relaxed"
        >
          Upload a product photo. PixPack builds 4 A/B-ready ad creatives,
          platform-native copy, and a full testing kit.
        </motion.p>

        {/* 4 ── Transformation demo */}
        <TransformationDemo />

        {/* 5 ── CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.55 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.button
            onClick={() => router.push('/app')}
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex items-center gap-2.5 overflow-hidden
              bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white
              font-display font-bold text-base md:text-lg
              px-10 py-4 rounded-2xl transition-colors
              shadow-[0_0_50px_rgba(255,77,28,0.28)] hover:shadow-[0_0_70px_rgba(255,77,28,0.42)]"
          >
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '250%' }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
            />
            <Zap size={17} className="relative fill-white" />
            <span className="relative">Generate my pack — free</span>
            <ArrowRight size={17} className="relative transition-transform group-hover:translate-x-1" />
          </motion.button>

          <p className="text-[11px] text-[var(--text-muted)] font-medium tracking-wide uppercase">
            No sign-up · No credit card · Results in &lt; 3 mins
          </p>
        </motion.div>

        {/* 6 ── Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-8 pt-2 border-t border-[#1e1e1c] w-full"
        >
          {[
            { value: 12000, suffix: '+', label: 'Packs generated' },
            { value: 6,     suffix: '',  label: 'Ad platforms' },
            { value: 20,    suffix: '+', label: 'Markets' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-0.5">
              <span className="font-display font-extrabold text-xl text-[var(--text)] tracking-tight">
                <Counter to={s.value} suffix={s.suffix} />
              </span>
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest font-medium">{s.label}</span>
            </div>
          ))}

          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex -space-x-2">
              {['#ff4d1c','#ffb800','#00c27a','#3b82f6','#a855f7'].map((c, i) => (
                <div key={i}
                  className="w-7 h-7 rounded-full border-2 border-[#0c0c0b] flex items-center justify-center text-[10px] font-black text-white"
                  style={{ backgroundColor: c }}>
                  {['M','D','A','S','K'][i]}
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#ffb800">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">Loved by 600+ merchants</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}