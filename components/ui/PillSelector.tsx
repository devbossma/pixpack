'use client'

import { motion } from 'framer-motion'

interface PillOption<T extends string = string> { id: T; label: string }

interface PillSelectorProps<T extends string = string> {
  options: PillOption<T>[]
  value: T | T[]
  onChange: (value: any) => void
  single?: boolean
  multi?: boolean
}

export function PillSelector<T extends string = string>({ options, value, onChange, single }: PillSelectorProps<T>) {
  function toggle(id: T) {
    if (single) {
      onChange(id)
    } else {
      const arr = Array.isArray(value) ? value : []
      onChange(arr.includes(id) ? (arr as T[]).filter((v: T) => v !== id) : [...arr, id])
    }
  }

  function isActive(id: T) {
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
