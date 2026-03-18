'use client'
import { type Variants, motion } from 'framer-motion'
import {
  Instagram, Facebook, Video, ShoppingBag, Monitor,
  Globe, MapPin,
} from 'lucide-react'

const EASE = [0.16, 1, 0.3, 1] as const

const PLATFORMS = [
  { Icon: Instagram,   name: 'Instagram Post',  dims: '1080 × 1080', accent: '#E1306C' },
  { Icon: Video,       name: 'Instagram Story', dims: '1080 × 1920', accent: '#833AB4' },
  { Icon: Video,       name: 'TikTok',          dims: '1080 × 1920', accent: '#010101' },
  { Icon: Facebook,    name: 'Facebook Post',   dims: '1200 × 630',  accent: '#1877F2' },
  { Icon: ShoppingBag, name: 'Shopify Product', dims: '800 × 800',   accent: '#96BF48' },
  { Icon: Monitor,     name: 'Web Banner',      dims: '1920 × 600',  accent: '#6366F1' },
]

const MARKETS = [
  'USA', 'UK', 'France', 'Germany', 'Brazil', 'Nigeria',
  'S. Korea', 'Japan', 'India', 'Indonesia', 'Morocco', 'UAE',
  'Saudi Arabia', 'S. Africa', 'Mexico', 'Canada', 'Australia',
  'Singapore', 'Portugal', 'Turkey',
]

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

export function PlatformsAndMarkets() {
  return (
    <section aria-labelledby="platforms-heading" className="py-28 px-6 border-t border-[var(--border)] overflow-hidden">
      <div className="max-w-5xl mx-auto">

        {/* ── Platforms ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          className="mb-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Platform-native output</p>
          <h2 id="platforms-heading"
            className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold text-[var(--text)] leading-tight max-w-lg">
            Every platform.<br />Perfect dimensions.
          </h2>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-28">
          {PLATFORMS.map(({ Icon, name, dims, accent }) => (
            <motion.div key={name} variants={fadeUp}
              className="group relative p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]
                overflow-hidden hover:border-[var(--border-hover)] transition-all duration-300">

              <div className="relative z-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${accent}18` }}>
                  <Icon size={17} strokeWidth={1.6} style={{ color: accent }} />
                </div>
                <p className="font-display font-bold text-sm text-[var(--text)] mb-1">{name}</p>
                <p className="font-mono text-[10px] text-[var(--text-muted)]">{dims} px</p>
              </div>

              <div aria-hidden className="absolute bottom-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100
                origin-left transition-transform duration-500"
                style={{ background: accent }} />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Markets ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          className="mb-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Global reach</p>
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold text-[var(--text)] leading-tight">
              20+ markets.<br />
              <span className="text-[var(--accent)]">One tool.</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-sm lg:mb-1.5 lg:pb-1">
              PixPack is the only AI content tool with{' '}
              <strong className="text-[var(--text)]">cultural intelligence</strong> built in.
              The same product styled for Lagos looks nothing like it should for Seoul. We know this.
            </p>
          </div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="flex flex-wrap gap-2">
          {MARKETS.map((label) => (
            <motion.span key={label} variants={fadeUp}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border)]
                bg-[var(--surface)] text-xs font-medium text-[var(--text-secondary)]
                hover:border-[var(--accent)]/40 hover:text-[var(--text)] transition-colors cursor-default">
              <MapPin size={10} strokeWidth={2} className="text-[var(--accent)] opacity-70 flex-shrink-0" />
              {label}
            </motion.span>
          ))}
          <motion.span variants={fadeUp}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-dashed
              border-[var(--accent)]/40 bg-[var(--accent)]/5 text-xs font-medium text-[var(--accent)]">
            <Globe size={10} strokeWidth={2} />
            More coming
          </motion.span>
        </motion.div>

      </div>
    </section>
  )
}
