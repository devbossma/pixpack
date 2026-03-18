'use client'

import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { PLATFORM_SPECS } from '@/lib/platforms'
import type { Platform } from '@/types'

export function PlatformGrid({ value, onChange }: {
  value: Platform[]
  onChange: (v: Platform[]) => void
}) {
  function toggle(id: Platform) {
    onChange(value.includes(id) ? value.filter(p => p !== id) : [...value, id])
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {Object.values(PLATFORM_SPECS).map(spec => {
        const active = value.includes(spec.id as Platform)
        const Icon = spec.LucideIcon
        return (
          <motion.button
            key={spec.id}
            type="button"
            onClick={() => toggle(spec.id as Platform)}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg border text-left transition-all duration-150 relative
              ${active
                ? 'border-[var(--accent)] bg-[var(--accent-dim)]'
                : 'border-[var(--border)] hover:border-[var(--border-hover)]'
              }`}
          >
            {/* Checkmark top-right */}
            {active && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <Check size={8} className="text-white stroke-[3]" />
              </span>
            )}

            {/* Icon + Name */}
            <div className="flex items-start gap-1.5 pr-4">
              <Icon size={14} className={`mt-px flex-shrink-0 ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
              <div>
                <div className="text-xs font-medium text-[var(--text)] leading-tight truncate max-w-[90px]">
                  {spec.name}
                </div>
                {/* Aspect ratio pill */}
                <div className="inline-flex mt-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded px-1 py-0 leading-4">
                  {spec.aspectRatio}
                </div>
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
