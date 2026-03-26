'use client'
import { motion, type Variants } from 'framer-motion'
import { Repeat2, Store, Layers, Gem, Shirt, Zap, ShoppingBag } from 'lucide-react'

const PERSONAS = [
  {
    Icon: ShoppingBag,
    market: 'Casablanca, Morocco',
    title: 'The Local E-com Boss',
    body: 'Managing COD stores across MENA. Needs rapid, high-converting ad variations that hook users and scale campaigns in 60-second sessions.',
  },
  {
    Icon: Gem,
    market: 'Lagos, Nigeria',
    title: 'The Beauty Brand Founder',
    body: 'Proving her beauty label is premium. Needs visually elite, culturally relevant scenes that rival luxury brands, without the agency fee.',
  },
  {
    Icon: Store,
    market: 'Jakarta, Indonesia',
    title: 'The Shopify Retailer',
    body: 'Testing new product lines weekly. Needs 12 ad combinations to identify the winning Creative/Copy pair before scaling ad spend.',
  },
  {
    Icon: Layers,
    market: 'Paris, France',
    title: 'The Dropshipping Analyst',
    body: 'Runs 50+ A/B tests per month. Uses PixPack to automate the grunt work of creative production, focusing solely on strategy.',
  },
  {
    Icon: Shirt,
    market: 'Seoul, South Korea',
    title: 'The Streetwear Merchant',
    body: 'Building a cult following on TikTok. Needs aesthetically on-point, platform-native content that fits the local streetwear culture.',
  },
  {
    Icon: Repeat2,
    market: 'Global / Remote',
    title: 'The Portfolio Scaler',
    body: 'Scaling across multiple markets. PixPack translates the creative intent (not just words) for every local audience in parallel.',
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
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">Target Audience</p>
          <h2 id="who-heading"
            className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold text-[var(--text)] leading-tight max-w-lg">
            Built for those who<br />
            <span className="text-[var(--accent)]">scale aggressively.</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-4 max-w-md leading-relaxed">
            From solo merchants to high-volume dropshippers, PixPack is the engine behind winning ad campaigns.
          </p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PERSONAS.map(({ Icon, market, title, body }) => (
            <motion.div key={title} variants={slideUp}
              className="group relative p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)]
                hover:border-[var(--border-hover)] transition-colors duration-300 overflow-hidden">

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
                <h3 className="font-display font-bold text-[0.875rem] text-[var(--text)] mb-2 leading-tight">{title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
