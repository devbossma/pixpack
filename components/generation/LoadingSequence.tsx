'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'

export function LoadingSequence({ stage, stageMessage }: { stage: number; stageMessage: string }) {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-black/80 backdrop-blur-xl border border-[#2a2a25] rounded-full px-5 py-3 shadow-2xl flex items-center gap-4 pointer-events-auto"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] shadow-[0_0_15px_rgba(255,77,28,0.2)]">
          {stage < 3 ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} className="animate-pulse" />
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            Stage {stage} of 3
          </span>
          <span className="text-sm font-medium text-[#f0ece3]">
            {stageMessage}
          </span>
        </div>
      </motion.div>
    </div>
  )
}
