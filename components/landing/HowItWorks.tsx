'use client'
import { motion, type Variants } from 'framer-motion'
import {
  Upload, SlidersHorizontal, FlaskConical, FolderDown,
} from 'lucide-react'

const STEPS = [
  {
    Icon: Upload,
    num: '01',
    title: 'Drop your supplier photo',
    body: 'Any JPG, PNG or WEBP up to 10 MB. PixPack strips the background and prepares a clean product cutout — no Photoshop, no manual work.',
  },
  {
    Icon: SlidersHorizontal,
    num: '02',
    title: 'Pick your platform & audience',
    body: 'Choose one ad platform and your target audience. Gen Z women in Casablanca and millennial men in São Paulo need completely different creative — we know the difference.',
  },
  {
    Icon: FlaskConical,
    num: '03',
    title: 'AI builds your A/B testing kit',
    body: 'Gemini generates 4 visual angles (Lifestyle, Hero, Context, Closeup) — each paired with 3 copy stages: Awareness, Consideration and Conversion. 12 ready-to-test combinations, zero effort.',
  },
  {
    Icon: FolderDown,
    num: '04',
    title: 'Download and launch today',
    body: 'Your ZIP contains every image at native platform resolution plus all 12 ad copies, structured and labelled. Import directly into Meta Ads Manager, TikTok Ads, or Shopify.',
  },
]

const EASE = [0.16, 1, 0.3, 1] as const
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading"
      className="py-28 px-6 border-t border-[var(--border)] overflow-hidden">
      <div className="max-w-5xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          className="mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">How it works</p>
          <h2 id="how-it-works-heading"
            className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold text-[var(--text)] leading-tight max-w-xl">
            Four steps to a full<br />
            <span className="text-[var(--accent)]">A/B testing kit.</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-4 max-w-md leading-relaxed">
            Go from one product photo to 12 launch-ready ad combinations — while your coffee brews.
          </p>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map(({ Icon, num, title, body }) => (
            <motion.div key={num} variants={item}
              className="group relative flex flex-col p-6 rounded-2xl border border-[var(--border)]
                bg-[var(--surface)] overflow-hidden hover:border-[var(--border-hover)] transition-colors duration-300">

              <span aria-hidden
                className="absolute top-5 right-5 font-mono text-[10px] font-bold text-[var(--text-muted)]/40
                  group-hover:text-[var(--text-muted)]/70 transition-colors">
                {num}
              </span>

              <div aria-hidden
                className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full bg-[var(--accent)]
                  transition-all duration-500 ease-out" />

              <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] flex items-center justify-center mb-5
                group-hover:bg-[var(--accent)]/10 transition-colors duration-300">
                <Icon size={18} strokeWidth={1.6}
                  className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              </div>

              <h3 className="font-display font-bold text-[0.875rem] text-[var(--text)] mb-2 leading-snug">{title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* A/B matrix callout */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-10 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--text)] mb-1">The A/B math</p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              4 visual angles × 3 funnel stages = <strong className="text-[var(--accent)]">12 ready-to-test ad combinations</strong> per pack.
              Most merchants test 2–3 ads per campaign. PixPack gives you a full quarter's worth of creative in one session.
            </p>
          </div>
          <div className="flex-shrink-0 grid grid-cols-3 gap-1">
            {['Awareness', 'Consideration', 'Conversion'].map(s => (
              <div key={s} className="text-center px-2 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <p className="text-[8px] font-black uppercase tracking-widest text-[var(--accent)]">{s}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
