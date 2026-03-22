'use client'

import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { PLATFORM_SPECS } from '@/lib/platforms'
import type { Platform } from '@/types'

interface PlatformSelectorProps {
  value: string | null
  onChange: (platform: string) => void
}

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
          Choose your platform
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.values(PLATFORM_SPECS) as typeof PLATFORM_SPECS[Platform][]).map(spec => {
            const active = value === spec.id
            const Icon = spec.LucideIcon
            return (
              <motion.button
                key={spec.id}
                type="button"
                onClick={() => onChange(spec.id)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: active ? 1 : 1.02 }}
                className={[
                  'relative p-3 rounded-xl border text-left transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_14px_rgba(255,77,28,0.12)]'
                    : 'border-[var(--border)] hover:border-[var(--border-hover)] bg-transparent',
                ].join(' ')}
                aria-pressed={active}
                aria-label={`Select ${spec.name}`}
              >
                {/* Checkmark */}
                {active && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-sm"
                  >
                    <Check size={9} className="text-white stroke-[3]" />
                  </motion.span>
                )}

                {/* Icon + Name + Ratio */}
                <div className="flex items-start gap-2 pr-4">
                  <Icon
                    size={15}
                    className={`mt-0.5 flex-shrink-0 transition-colors ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
                  />
                  <div className="min-w-0">
                    <div className={`text-xs font-semibold leading-tight truncate transition-colors ${active ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>
                      {spec.name}
                    </div>
                    <div className="inline-flex mt-1 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded px-1 leading-4">
                      {spec.aspectRatio}
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed text-center">
        We'll generate <span className="font-bold text-[var(--accent)]">4 A/B test variations</span> for your chosen platform
      </p>
    </div>
  )
}
