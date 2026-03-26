'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

export function FinalCTA() {
  const router = useRouter()
  return (
    <section
      className="relative flex items-center overflow-hidden border-t border-[var(--border)] bg-[var(--surface)]"
      style={{ minHeight: 'calc(100vh - 44px)' }}>

      {/* Ghost watermark */}
      <p aria-hidden
        className="absolute -bottom-8 -right-6 font-display font-extrabold select-none pointer-events-none
          text-[var(--text)] leading-none"
        style={{ fontSize: 'clamp(8rem,22vw,18rem)', opacity: 0.025 }}>
        TEST
      </p>

      {/* Subtle glow */}
      <div aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-0 pointer-events-none
          w-[600px] h-[400px] rounded-full
          bg-[radial-gradient(ellipse_at_center,rgba(255,77,28,0.09)_0%,transparent_70%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-6">
            Stop guessing. Start testing.
          </p>

          <h2 className="font-display font-extrabold text-[var(--text)] leading-[1.0] tracking-tighter mb-8"
            style={{ fontSize: 'clamp(1.8rem, 6vw, 3.5rem)' }}>
            Your next A/B testing kit<br />
            is <span className="text-[var(--accent)]">ready to launch.</span>
          </h2>

          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-10 max-w-lg">
            Stop paying thousands for agencies. Stop writing ad copy from scratch. 
            Generate your first 12-variant pack for free — while beta lasts.
          </p>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <motion.button
              onClick={() => router.push('/app')}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-2.5 bg-[var(--accent)]
                hover:bg-[var(--accent-hover)] text-white font-display font-bold
                text-xl px-12 py-5 rounded-2xl transition-all
                shadow-[0_0_50px_rgba(255,77,28,0.25)] hover:shadow-[0_0_80px_rgba(255,77,28,0.4)]"
              aria-label="Generate your free A/B testing pack">
              Get my 12 variants free
              <ArrowUpRight size={22}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.button>

            <div className="sm:pt-4 text-[11px] font-medium tracking-wide uppercase text-[var(--text-muted)] leading-relaxed">
              &lt; 3 mins wait time<br />
              No sign-up · No credit card required
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
