'use client'

import { motion } from 'framer-motion'

interface PillOption<T extends string = string> { id: T; label: string }

interface PillSelectorProps<T extends string = string> {
  options: PillOption<T>[]
  value: T | T[] | null
  onChange: (value: T | null) => void
  single?: boolean
}

export function PillSelector<T extends string = string>({ options, value, onChange, single }: PillSelectorProps<T>) {
  function toggle(id: T): void {
    if (single) {
      // If clicking the already-selected pill, deselect it
      const current = Array.isArray(value) ? value[0] : value
      onChange(current === id ? null : id)
    } else {
      // Multi-select (not used but kept for API completeness)
      onChange(id)
    }
  }

  function isActive(id: T): boolean {
    if (Array.isArray(value)) return value.includes(id)
    return value === id
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <motion.button
          key={opt.id}
          type="button"
          onClick={() => toggle(opt.id)}
          whileTap={{ scale: 0.92 }}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-150
            ${isActive(opt.id)
              ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
              : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text)]'
            }`}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  )
}
