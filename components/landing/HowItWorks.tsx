'use client'
import { type Variants, motion } from 'framer-motion'
import { Upload, SlidersHorizontal, Cpu, FolderDown } from 'lucide-react'

const STEPS = [
  {
    Icon: Upload,
    num: '01',
    title: 'Upload your product photo',
    body: 'Drop any JPG, PNG or WEBP up to 10 MB. The AI strips the background and prepares a clean cutout. No Photoshop, no manual masking.',
  },
  {
    Icon: SlidersHorizontal,
    num: '02',
    title: 'Configure your audience',
    body: 'Choose your target country, age group, gender and platform. Gen Z women in Lagos and millennial men in São Paulo get fundamentally different creative.',
  },
  {
    Icon: Cpu,
    num: '03',
    title: 'AI builds every asset',
    body: 'Imagen 3 scenes your product in a culturally-matched environment. Gemini writes localised captions, hashtags and three ad variants per image — in parallel.',
  },
  {
    Icon: FolderDown,
    num: '04',
    title: 'Download your pack as ZIP',
    body: 'Receive six platform-perfect images, all copy, engagement predictions and a Shopify description. Ready to post without a single edit.',
  },
]

const EASE = [0.16, 1, 0.3, 1] as const

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

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
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">The process</p>
          <h2 id="how-it-works-heading"
            className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold text-[var(--text)] leading-tight max-w-lg">
            Four steps.<br />Sixty seconds.
          </h2>
        </motion.div>

        <motion.div variants={container} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map(({ Icon, num, title, body }) => (
            <motion.div key={num} variants={item}
              className="group relative flex flex-col p-6 rounded-2xl border border-[var(--border)]
                bg-[var(--surface)] overflow-hidden
                hover:border-[var(--border-hover)] transition-colors duration-300">

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
      </div>
    </section>
  )
}
