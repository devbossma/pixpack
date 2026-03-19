'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, ImageIcon } from 'lucide-react'
import type { GeneratedImage, Platform, PlatformSpec } from '@/types'
import { SlotImage } from './SlotImage'
import { SlotTabs } from './SlotTabs'

export type SlotState =
  | { type: 'idle' }
  | { type: 'generating' }
  | { type: 'done'; image: GeneratedImage }
  | { type: 'error'; image?: GeneratedImage }

interface PlatformSlotProps {
  platformId: Platform
  spec: PlatformSpec
  state: SlotState
  orderIndex: number
}

function ratioToCss(ratio: string): string {
  return ratio.replace(':', '/')
}

export function PlatformSlot({ platformId, spec, state, orderIndex }: PlatformSlotProps) {
  // Common wrapper styling that all slots share to maintain the grid
  const wrapperClass = "flex flex-col w-full"
  const ratio = ratioToCss(spec.aspectRatio)

  // 1. IDLE STATE
  if (state.type === 'idle') {
    return (
      <div className={wrapperClass}>
        <div
          className="relative border border-dashed border-[var(--border)] rounded-xl opacity-40 overflow-hidden"
          style={{ aspectRatio: ratio }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <ImageIcon size={24} className="text-[var(--text-muted)] opacity-50" />
            <span className="text-xs text-[var(--text-muted)] font-medium leading-tight">
              {spec.name}
            </span>
            <span className="text-[10px] text-[var(--border)] font-mono opacity-80 mt-1">
              {spec.aspectRatio}
            </span>
            {/* Very faint text */}
            <span className="absolute bottom-4 text-[10px] text-[var(--text-muted)] opacity-30 select-none">
              Not selected
            </span>
          </div>
        </div>
        {/* Placeholder for tabs area to maintain height equivalent */}
        <div className="h-[196px]" /> {/* 36px tab bar + 160px content */}
      </div>
    )
  }

  // 2. GENERATING STATE
  if (state.type === 'generating') {
    return (
      <div className={wrapperClass}>
        <div
          className="relative border border-solid border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]"
          style={{ aspectRatio: ratio }}
        >
          {/* Shimmer Base */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background: 'linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s infinite linear',
            }}
          />
          {/* Platform Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 bg-black/60 text-white px-2 py-1 rounded-md animate-pulse">
            <ImageIcon size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{spec.name}</span>
          </div>
        </div>
        {/* Placeholder for tabs area */}
        <div className="h-[196px]" />
      </div>
    )
  }

  // 3. ERROR STATE
  if (state.type === 'error') {
    return (
      <div className={wrapperClass}>
        <div
          className="relative border border-solid rounded-xl overflow-hidden bg-[var(--surface)]"
          style={{ aspectRatio: ratio, borderColor: 'rgba(255, 77, 28, 0.3)' }}
        >
          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 bg-black/60 text-white px-2 py-1 rounded-md">
            <ImageIcon size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{spec.name}</span>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 bg-red-500/5 text-center">
            <AlertTriangle size={24} className="text-[var(--accent)]" />
            <span className="text-sm font-semibold text-[var(--text)]">Generation failed</span>
          </div>
        </div>
        {/* Placeholder for tabs area */}
        <div className="h-[196px]" />
      </div>
    )
  }

  // 4. DONE STATE
  const image = state.image
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: orderIndex * 0.12,
        ease: [0.25, 0.1, 0.25, 1],
        duration: 0.4,
      }}
      className={`${wrapperClass} rounded-xl border border-[var(--output-border)] bg-[var(--output-surface)] overflow-hidden shadow-[var(--shadow-sm)]`}
    >
      <SlotImage image={image} spec={spec} />
      <SlotTabs image={image} />
    </motion.div>
  )
}
