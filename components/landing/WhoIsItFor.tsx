'use client'
import { motion, Variants } from 'framer-motion'
import { Repeat2, Store, Layers, Gem, Shirt, Package } from 'lucide-react'

const PERSONAS = [
  {
    Icon: Shirt,
    market: 'São Paulo, Brazil',
    title: 'The Sneaker Reseller',
    body: 'Selling exclusive drops on Instagram and TikTok. Needs eye-catching visuals, slang-fluent captions and fast content turnaround for every release day.',
  },
  {
    Icon: Gem,
    market: 'Lagos, Nigeria',
    title: 'The Beauty Brand Founder',
    body: 'Building a DTC cosmetics label for young Nigerian women. Needs culturally resonant imagery — the right setting and aesthetic — without a studio budget.',
  },
  {
    Icon: Store,
    market: 'Jakarta, Indonesia',
    title: 'The Home Decor Store',
    body: 'Sells handmade furnishings on Shopify. Needs product images and Facebook ads adapted to Indonesian family aesthetics and purchasing language.',
  },
  {
    Icon: Layers,
    market: 'Paris, France',
    title: 'The Fashion Boutique',
    body: 'Premium label targeting French minimalists. Needs clean editorial-style images and copy that matches the refined French consumer expectation.',
  },
  {
    Icon: Shirt,
    market: 'Seoul, South Korea',
    title: 'The Streetwear Merchant',
    body: 'Drops monthly to Korean Gen Z. Needs visually loud, culturally on-point content that fits the Seoul aesthetic — instantly on the first upload.',
  },
  {
    Icon: Repeat2,
    market: 'Toronto, Canada',
    title: 'The Dropshipper',
    body: 'Testing dozens of products per month. Needs fast, polished content to validate each product\'s ad performance without committing to production.',
  },
]

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const slideUp: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }

export function WhoIsItFor() {
  return (
    <section aria-labelledby="who-heading"
      className="py-28 px-6 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-5xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          className="mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Who it's for</p>
          <h2 id="who-heading"
            className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold text-[var(--text)] leading-tight max-w-lg">
            Built for merchants<br />who move fast.
          </h2>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PERSONAS.map(({ Icon, market, title, body }) => (
            <motion.div key={title} variants={slideUp}
              className="group relative p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)]
                hover:border-[var(--border-hover)] transition-colors duration-300 overflow-hidden">

              {/* Subtle top-left glow on hover */}
              <div aria-hidden
                className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[var(--accent)] opacity-0
                  group-hover:opacity-[0.04] blur-2xl transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface2)] flex items-center justify-center mb-5
                  group-hover:bg-[var(--accent)]/10 transition-colors duration-300">
                  <Icon size={17} strokeWidth={1.6}
                    className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                </div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--accent)] mb-2">{market}</p>
                <h3 className="font-display font-bold text-sm text-[var(--text)] mb-2 leading-snug">{title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
