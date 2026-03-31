'use client'
import { motion } from 'framer-motion'
import { Wand2, Sparkles } from 'lucide-react'

interface GenerateBarProps {
  disabled?: boolean
  isGenerating?: boolean
  onGenerate: () => void
}

export function GenerateBar({ disabled = false, isGenerating = false, onGenerate }: GenerateBarProps) {
  const isReady = !disabled && !isGenerating

  return (
    <div className="relative w-full">
      {/* Ambient glow ring — only when ready */}
      {isReady && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ boxShadow: ['0 0 0px 0px rgba(255,77,28,0)', '0 0 18px 4px rgba(255,77,28,0.2)', '0 0 0px 0px rgba(255,77,28,0)'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <motion.button
        type="button"
        onClick={onGenerate}
        disabled={!isReady}
        whileHover={isReady ? { scale: 1.015 } : {}}
        whileTap={isReady ? { scale: 0.97 } : {}}
        className={[
          'relative w-full flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl transition-colors',
          isReady
            ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-[0_2px_16px_rgba(255,77,28,0.25)]'
            : 'bg-[var(--surface2)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-50',
        ].join(' ')}
        aria-label={disabled ? 'Daily limit reached' : 'Generate your pack'}
      >
        {isReady ? <Sparkles size={14} /> : <Wand2 size={14} />}
        {disabled ? 'Daily limit reached' : isGenerating ? 'Generating…' : 'Generate your pack'}
      </motion.button>
    </div>
  )
}
