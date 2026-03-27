'use client'
import { motion } from 'framer-motion'
import { Wand2 } from 'lucide-react'

interface GenerateBarProps {
  disabled?: boolean
  isGenerating?: boolean
  onGenerate: () => void
}

export function GenerateBar({ disabled = false, isGenerating = false, onGenerate }: GenerateBarProps) {
  return (
    <motion.button
      type="button"
      onClick={onGenerate}
      disabled={disabled || isGenerating}
      className={[
        'w-full flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl transition-all',
        (!disabled && !isGenerating)
          ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-[0_0_20px_rgba(255,77,28,0.2)] hover:shadow-[0_0_28px_rgba(255,77,28,0.3)] active:scale-[0.98]'
          : 'bg-[var(--surface2)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed',
      ].join(' ')}
      style={{
        opacity: (disabled || isGenerating) ? 0.5 : 1,
        cursor: (disabled || isGenerating) ? 'not-allowed' : 'pointer'
      }}
      aria-label={disabled ? 'Daily limit reached' : 'Generate your pack'}
    >
      <Wand2 size={14} />
      {disabled ? 'Daily limit reached' : 'Generate your pack'}
    </motion.button>
  )
}
