'use client'
import { motion } from 'framer-motion'
import { Camera, PenLine, FlaskConical, Timer, TrendingDown, TrendingUp } from 'lucide-react'

const COMPARISON_ITEMS = [
  { 
    Icon: Camera,        
    label: 'Agency Photoshoot',       
    cost: '$2,500+', 
    sub: '10-day lead time for a single styled scene' 
  },
  { 
    Icon: PenLine,       
    label: 'Copywriter (12 variants)',    
    cost: '$600+',     
    sub: 'Professional funnel-staged ad copy per product' 
  },
  { 
    Icon: Timer, 
    label: 'Media Buyer Hours',   
    cost: '$450+',  
    sub: 'Manual resizing and formatting for 6 platforms' 
  },
  { 
    Icon: FlaskConical,      
    label: 'A/B Testing Cycle', 
    cost: '$500+',         
    sub: 'Cost of low-performing creative before finding a winner' 
  },
]

export function ValueSection() {
  return (
    <section aria-labelledby="value-heading"
      className="py-28 px-6 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto">

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 items-start">

          {/* Left — headline */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">The value prop</p>
            <h2 id="value-heading"
              className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold text-[var(--text)] leading-tight mb-6">
              Launch winners,<br />
              <span className="text-[var(--accent)]">not just images.</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed max-w-sm text-sm">
              Agencies charge thousands for creative testing cycles. PixPack gives you the same high-converting variety for free during our beta.
            </p>
          </motion.div>

          {/* Right — saving callout */}
          <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:pt-4 flex flex-col items-center lg:items-end text-center lg:text-right gap-1">
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs mb-1">
              <TrendingDown size={13} className="text-red-400" />
              <span>Full A/B Creative Cycle</span>
            </div>
            <p className="font-display text-5xl font-extrabold text-[var(--text)] tracking-tight">$4,000+</p>
            <p className="text-xs text-[var(--text-muted)] mb-5">per product launch cycle</p>
            <div className="h-px w-24 bg-[var(--border)]" />
            <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs mt-5 mb-1">
              <TrendingUp size={13} className="text-[var(--accent3)]" />
              <span>With PixPack</span>
            </div>
            <p className="font-display text-5xl font-extrabold text-[var(--accent3)] tracking-tight">$0</p>
            <p className="text-[10px] font-bold text-[var(--accent3)] mt-2 uppercase tracking-widest">Free for early adopters</p>
          </motion.div>
        </div>

        {/* Comparison rows */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-14 divide-y divide-[var(--border)] border border-[var(--border)] rounded-2xl overflow-hidden">
          {COMPARISON_ITEMS.map(({ Icon, label, cost, sub }, i) => (
            <div key={label}
              className="group flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 bg-[var(--bg)] hover:bg-[var(--surface2)] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)]/5 transition-colors">
                <Icon size={16} strokeWidth={1.8} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text)] mb-0.5">{label}</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{sub}</p>
              </div>
              <div className="sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 mt-2 sm:mt-0">
                <p className="text-sm font-bold text-red-400/60 line-through font-mono">{cost}</p>
                <p className="text-[11px] font-black text-[var(--accent3)] tracking-wide">FREE</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
