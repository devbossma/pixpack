'use client'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'

const STATS = [
  { value: '12 K+', label: 'Packs generated' },
  { value: '20+',   label: 'Global markets'  },
  { value: '6',     label: 'Platforms'        },
  { value: '< 60s', label: 'Per pack'         },
]

export function HeroSection() {
  const router = useRouter()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const glowY = useTransform(scrollYProgress, [0, 1], ['0%', '35%'])

  return (
    <section ref={ref} aria-labelledby="hero-heading"
      className="relative flex flex-col justify-between overflow-hidden"
      style={{ minHeight: 'calc(100vh - 44px)' }}>

      {/* Parallax glow */}
      <motion.div style={{ y: glowY }} aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -z-10
          w-[800px] h-[500px]
          bg-[radial-gradient(ellipse_at_center,rgba(255,77,28,0.13)_0%,transparent_68%)]" />

      {/* Subtle grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.028]"
        style={{
          backgroundImage: 'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',
          backgroundSize: '56px 56px',
        }} />

      {/* Main content — vertically centered */}
      <div className="flex-1 flex flex-col justify-center px-6 pt-14 pb-8 max-w-5xl mx-auto w-full">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2.5 w-fit rounded-full border border-[var(--accent)]/30
            bg-[var(--accent)]/8 px-4 py-1.5 mb-6">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">
            Free during beta — no account needed
          </span>
        </motion.div>

        {/* H1 — killer keyword front-loaded */}
        <div className="overflow-hidden mb-8">
          <motion.h1 id="hero-heading"
            initial={{ y: '105%' }} animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-extrabold text-[var(--text)] leading-[1.0] tracking-tighter"
            style={{ fontSize: 'clamp(2.25rem, 7vw, 4.5rem)' }}>
            AI product image generator<br />
            <span className="text-[var(--accent)]">for any market,</span><br />
            in 60 seconds.
          </motion.h1>
        </div>

        {/* Body + CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row lg:items-center gap-10">
          <p className="max-w-md text-base lg:text-lg text-[var(--text-secondary)] leading-relaxed">
            Upload 1 product photo → get{' '}
            <span className="text-[var(--text)] font-medium">6 platform-native images</span>,
            localised captions,{' '}
            <span className="text-[var(--text)] font-medium">3 ad variants</span>,
            and a Shopify description.
          </p>

          <div className="flex flex-col gap-4 lg:ml-auto lg:items-end">
            <motion.button
              onClick={() => router.push('/app')}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-2.5 bg-[var(--accent)]
                hover:bg-[var(--accent-hover)] text-white font-display font-bold
                text-base px-10 py-4.5 rounded-2xl transition-all
                shadow-[0_0_40px_rgba(255,77,28,0.2)] hover:shadow-[0_0_60px_rgba(255,77,28,0.35)]"
              aria-label="Generate your AI product content pack for free">
              Start generating free
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </motion.button>
            <span className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-muted)] lg:text-right">
              No sign-up · No credit card required
            </span>
          </div>
        </motion.div>
      </div>

      {/* Stats bar — pinned to bottom of viewport */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[var(--border)]
          border-t border-[var(--border)] bg-[var(--surface)]">
        {STATS.map(({ value, label }) => (
          <div key={label} className="flex flex-col gap-0.5 px-6 py-5">
            <span className="font-display font-extrabold text-xl text-[var(--text)] tracking-tight">{value}</span>
            <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
