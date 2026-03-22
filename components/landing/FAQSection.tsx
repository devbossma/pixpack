'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'

const FAQS = [
  {
    q: 'How does PixPack generate product images?',
    a: 'PixPack uses Google Imagen 3 to place your product in realistic lifestyle scenes adapted for your chosen target market. Upload one photo, select your audience, pick your platforms — the AI generates six culturally adapted images in under 60 seconds.',
  },
  {
    q: 'Which countries and markets does PixPack support?',
    a: 'PixPack supports 20+ global markets including USA, UK, France, Germany, Brazil, Nigeria, South Korea, Japan, India, Indonesia, Morocco, UAE, Saudi Arabia, South Africa, Mexico, Canada, Australia, Singapore, Portugal, and Turkey. Each market has culturally specific scenes, lighting, colour palettes and caption language built in.',
  },
  {
    q: 'What does the AI ad copy actually include?',
    a: 'For every image, PixPack generates three ad copy variants structured around the marketing funnel: Awareness (grab attention), Consideration (build interest) and Conversion (drive purchase). Each is calibrated to platform length, tone and cultural context — delivered in a structured text file inside your ZIP.',
  },
  {
    q: 'How long does it take to generate a content pack?',
    a: 'The full pack — six images, localised captions, ad copy, engagement scores and a Shopify product description — is ready in under 60 seconds. You spend less time waiting than you do opening a new Canva tab.',
  },
  {
    q: 'What are the exact image dimensions for each platform?',
    a: 'Instagram Post (1080×1080 px), Instagram Story (1080×1920 px), TikTok (1080×1920 px), Facebook Post (1200×630 px), Shopify Product (800×800 px), Web Banner (1920×600 px). Every image is generated at the native platform dimension — no resizing required.',
  },
  {
    q: 'Do I need an account to use PixPack?',
    a: 'No account required during beta. Upload a photo, configure your audience, generate and download your ZIP — no sign-up, no credit card. Your download link is sent by email and remains valid for 24 hours.',
  },
  {
    q: 'Is PixPack free? What happens after beta?',
    a: 'PixPack is 100% free during the public beta. When paid plans launch, early beta users will receive a meaningful discount as a thank-you for supporting us from day one. Generate as many packs as you need now.',
  },
]

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-28 px-6 border-t border-[var(--border)]">
      <div className="max-w-3xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          className="mb-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-4">FAQ</p>
          <h2 id="faq-heading"
            className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold text-[var(--text)] leading-tight">
            Everything you need<br />to know.
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6 }}
          className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-2xl overflow-hidden">
          {FAQS.map(({ q, a }, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left
                  text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                aria-expanded={open === i}>
                <span>{q}</span>
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.2 }}
                  className="flex-shrink-0 w-5 h-5 rounded-full border border-[var(--border)]
                    flex items-center justify-center text-[var(--text-muted)]
                    group-hover:border-[var(--border-hover)]">
                  <Plus size={11} strokeWidth={2.5} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
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
