'use client'
import { motion } from 'framer-motion'
import { Camera, PenLine, CalendarClock, Scissors, TrendingDown, TrendingUp } from 'lucide-react'

const ROWS = [
  { Icon: Camera,        label: 'Professional studio shoot',       cost: '$1,800 – $3,500', sub: '1–2 week lead time, single shoot' },
  { Icon: PenLine,       label: 'Freelance copywriter (6 ads)',    cost: '$400 – $800',     sub: '3–5 business days per project' },
  { Icon: CalendarClock, label: 'Social media scheduling tools',   cost: '$89 – $300 /mo',  sub: 'Doesn\'t generate or write anything' },
  { Icon: Scissors,      label: 'Background removal subscription', cost: '$29 /mo',         sub: 'Manual still required, no styling' },
]

export function ValueSection() {
  return (
    <section aria-labelledby="value-heading"
      className="py-28 px-6 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto">

        <div className="grid lg:grid-cols-[1fr_auto] gap-16 items-start">

          {/* Left — headline */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">The real deal</p>
            <h2 id="value-heading"
              className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold text-[var(--text)] leading-tight mb-6">
              What agencies charge<br />
              <span className="text-[var(--accent)]">thousands for.</span><br />
              PixPack: free.
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed max-w-sm text-sm">
              Every merchant needs professional content. Most can't afford agencies.
              PixPack closes that gap — permanently.
            </p>
          </motion.div>

          {/* Right — saving callout */}
          <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:pt-14 flex flex-col items-center lg:items-end text-center lg:text-right gap-1">
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs mb-1">
              <TrendingDown size={13} className="text-red-400" />
              <span>Typical monthly spend</span>
            </div>
            <p className="font-display text-5xl font-extrabold text-[var(--text)] tracking-tight">$4,700</p>
            <p className="text-xs text-[var(--text-muted)] mb-5">studio + copy + scheduling + tools</p>
            <div className="h-px w-24 bg-[var(--border)]" />
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs mt-5 mb-1">
              <TrendingUp size={13} className="text-[var(--accent3)]" />
              <span>With PixPack during beta</span>
            </div>
            <p className="font-display text-5xl font-extrabold text-[var(--accent3)] tracking-tight">$0</p>
          </motion.div>
        </div>

        {/* Comparison rows */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-14 divide-y divide-[var(--border)] border border-[var(--border)] rounded-2xl overflow-hidden">
          {ROWS.map(({ Icon, label, cost, sub }, i) => (
            <div key={label}
              className="flex items-center gap-4 px-5 py-4 bg-[var(--bg)] hover:bg-[var(--surface2)] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-[var(--surface2)] flex items-center justify-center flex-shrink-0">
                <Icon size={15} strokeWidth={1.6} className="text-[var(--text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">{label}</p>
                <p className="text-xs text-[var(--text-muted)]">{sub}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-red-400 line-through opacity-60 font-mono">{cost}</p>
                <p className="text-[10px] font-bold text-[var(--accent3)] tracking-wide">FREE</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
