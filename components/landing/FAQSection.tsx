'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'

const FAQS = [
  {
    k: 'conversion-engine',
    q: 'How is this different from a simple image generator?',
    a: 'Simple generators give you generic images. PixPack is a marketing engine. We analyze your product and audience to generate a full A/B testing kit: 4 visual angles and 3 funnel-staged ad copies (Awareness, Consideration, Conversion), precisely adapted to individual markets like Morocco, Brazil, or Indonesia.',
  },
  {
    k: 'runtime',
    q: 'How long does a full generation take?',
    a: 'While our marketing says 60 seconds (total processing time), the end-to-end wait time—from background removal to 12-variant export—is typically under 3 minutes. It\'s faster than waiting for a freelance copywriter to reply to your email.',
  },
  {
    k: 'pack-contents',
    q: 'What exactly is in the ZIP download?',
    a: 'Your pack includes 6 platform-perfect images (at 1080p, 1200p, etc.), a structured text file with up to 12 distinct ad copy combinations, and a ready-to-use Shopify product description. Everything is labelled for easy import into your ad manager.',
  },
  {
    k: 'platforms',
    q: 'Does it support my specific platform?',
    a: 'We currently optimize for Instagram (Post + Story), TikTok Ads, Facebook (Post + Feed), Shopify Product Pages, and Etsy Product Listings. More professional dimensions are added to our beta weekly.',
  },
  {
    k: 'beta-status',
    q: 'Is it really free? Do I need an account?',
    a: 'During this public beta phase: yes, it is 100% free with no account required. Upload, configure, and download. We only ask for an email to send your secure download link.',
  },
  {
    k: 'technical-quality',
    q: 'What model powers the image generation?',
    a: 'PixPack leverages Google Imagen 3 via Gemini Flash for state-of-the-art visual quality, combined with our proprietary Cultural IQ layer to ensure your products look authentic in every local market.',
  },
]

export function FAQSection() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-28 px-6 border-t border-[var(--border)]">
      <div className="max-w-3xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          className="mb-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">FAQ</p>
          <h2 id="faq-heading"
            className="font-display text-[clamp(1.8rem,4.5vw,3rem)] font-extrabold text-[var(--text)] leading-tight">
            Transparently built<br />
            for merchants.
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6 }}
          className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-2xl overflow-hidden">
          {FAQS.map(({ k, q, a }, i) => (
            <div key={k}>
              <button
                onClick={() => setOpen(open === k ? null : k)}
                className="group w-full flex items-center justify-between gap-4 px-6 py-5 text-left
                  text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                aria-expanded={open === k}>
                <span>{q}</span>
                <motion.span animate={{ rotate: open === k ? 45 : 0 }} transition={{ duration: 0.2 }}
                  className="flex-shrink-0 w-5 h-5 rounded-full border border-[var(--border)]
                    flex items-center justify-center text-[var(--text-muted)]
                    group-hover:border-[var(--border-hover)]">
                  <Plus size={11} strokeWidth={2.5} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {open === k && (
                  <motion.div
                    key="content"
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden">
                    <motion.p
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className="px-6 pb-6 text-sm text-[var(--text-secondary)] leading-relaxed
                        border-t border-[var(--border)] pt-4">
                      {a}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
