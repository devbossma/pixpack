'use client'

import React, { useState } from 'react'
import { PackSummary } from './PackSummary'
import { OutputGrid } from './OutputGrid'
import { ActionBar } from './ActionBar'
import { LayoutGrid } from 'lucide-react'
import type { GeneratedPack, GeneratedImage } from '@/types'
import { useGenerationStore, selectIsGenerating } from '@/hooks/useGeneration'
import { usePipeline } from '@/hooks/usePipeline'
import { LoadingSequence } from '@/components/generation/LoadingSequence'
import { DownloadGateModal } from './DownloadGateModal'
import { AnimatePresence, motion } from 'framer-motion'

interface OutputSectionProps {
  pack: GeneratedPack | null
}

export function OutputSection({ pack }: OutputSectionProps) {
  const isGenerating    = useGenerationStore(selectIsGenerating)
  const generationState = useGenerationStore(s => s.generationState)
  const { pipelineStatus } = usePipeline()

  const [showModal, setShowModal] = useState(false)

  // ── Loading states ──────────────────────────────────────────────────────────
  if (isGenerating && (
    generationState.status === 'queued' ||
    generationState.status === 'analyzing' ||
    generationState.status === 'generating'
  )) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-[var(--output-bg)]">
        <div className="max-w-lg w-full">
          <LoadingSequence state={generationState} />
        </div>
      </div>
    )
  }

  let displayImages: GeneratedImage[] = []
  let displayPlatform: string | undefined

  if (pack) {
    displayImages   = pack.images
    displayPlatform = pack.platform
  }

  const hasContent = displayImages.length > 0 || isGenerating

  // ── Empty state ──────────────────────────────────────────────────────
  if (!hasContent) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center p-8 h-full">
      {/* Headline */}
      <div className="space-y-2">
        <h2 className="text-xl font-black tracking-tight text-[var(--text)]">
          Your ad pack appears here
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-sm leading-relaxed">
          3 steps. 90 seconds. 4 ready-to-test ad variations.
        </p>
      </div>

      {/* 3-step flow diagram */}
      <div className="hidden md:flex items-center gap-4">
        {[
          { num: '1', title: 'Upload photo', sub: 'Any product image', color: 'var(--accent)' },
          { num: '2', title: 'Pick audience', sub: 'Market, age, interest', color: 'var(--accent2)' },
          { num: '3', title: 'Choose platform', sub: 'Instagram, TikTok...', color: 'var(--accent3)' },
        ].map((step, i) => (
          <React.Fragment key={step.num}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center gap-2 w-36"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${step.color}cc, ${step.color}66)`,
                  boxShadow: `0 4px 20px ${step.color}33`,
                  border: `1px solid ${step.color}40`,
                }}
              >
                {step.num}
              </div>
              <p className="text-xs font-bold text-[var(--text)]">{step.title}</p>
              <p className="text-[10px] text-[var(--text-muted)] leading-snug">{step.sub}</p>
            </motion.div>
            {i < 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.12 + 0.06 }}
                className="text-[var(--border)] text-xl font-thin flex-shrink-0"
              >
                →
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Result preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="hidden md:flex flex-col items-center gap-2"
      >
        <div className="flex gap-2">
          {['Lifestyle', 'Hero', 'Context', 'Social'].map((label, i) => (
            <div
              key={label}
              className="w-16 h-16 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col items-center justify-center gap-1"
              style={{ opacity: 0.4 + i * 0.1 }}
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--surface2)] border border-[var(--border)]" />
              <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--text-muted)]">4 A/B variations for your chosen platform</p>
      </motion.div>

      {/* Mobile simple hint */}
      <p className="md:hidden text-xs text-[var(--text-muted)] max-w-xs">
        Tap “Configure” below to upload your product photo and get started.
      </p>
    </div>
  )

  // ── Preview mode: pack is done, sidebar is hidden ───────────────────────────
  const isPreviewMode = pipelineStatus === 'done' && !!pack && !isGenerating

  // Mobile: unchanged — full screen snap scroll
  // Desktop in preview mode: centred, max-width container with top toolbar
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--output-bg)]">

      {/* ── Desktop Preview Toolbar (preview mode only) ───────────────────── */}
      {isPreviewMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="hidden md:flex items-center justify-between flex-shrink-0 px-6 py-2.5 border-b border-[var(--output-border)] bg-[var(--output-bg)]"
        >
          {/* Left: pack identity */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <LayoutGrid size={13} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--accent)] leading-none">Ad Pack Ready</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 capitalize">
                {pack.platform.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-1.5 ml-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent3-dim)] text-[var(--accent3)] border border-[var(--accent3)]/20">
                {pack.images.filter(i => i.status === 'done').length} variations
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-info-dim)] text-[var(--accent-info)] border border-[var(--accent-info)]/20">
                3 copy sets each
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            <ActionBar pack={pack} />
          </div>
        </motion.div>
      )}

      {/* ── Desktop Header (non-preview, generation in progress) ─────────── */}
      {pack && !isGenerating && !isPreviewMode && (
        <div className="hidden md:block flex-shrink-0 px-5 pt-5 pb-3 space-y-3 border-b border-[var(--output-border)]">
          <PackSummary pack={pack} />
          <ActionBar pack={pack} />
        </div>
      )}

      {/* ── Grid area ────────────────────────────────────────────────────── */}
      {isPreviewMode ? (
        /* PREVIEW MODE desktop: centred container */
        <>
          {/* Mobile: unchanged full scroll */}
          <div className="md:hidden flex-1 min-h-0">
            <OutputGrid
              images={displayImages}
              platform={displayPlatform}
              isGenerating={isGenerating}
              onDownloadZip={() => setShowModal(true)}
            />
          </div>

          {/* Desktop: centred, max-width, padded */}
          <div className="hidden md:flex flex-1 min-h-0 overflow-y-auto justify-center py-8 px-6">
            <div className="w-full max-w-5xl">
              <OutputGrid
                images={displayImages}
                platform={displayPlatform}
                isGenerating={isGenerating}
                onDownloadZip={() => setShowModal(true)}
              />
            </div>
          </div>
        </>
      ) : (
        /* NORMAL mode (generating or config+result with sidebar) */
        <div className="flex-1 min-h-0 overflow-y-auto px-0 py-0 md:px-5 md:py-5">
          <OutputGrid
            images={displayImages}
            platform={displayPlatform}
            isGenerating={isGenerating}
            onDownloadZip={() => setShowModal(true)}
          />
        </div>
      )}

      <AnimatePresence>
        {showModal && pack && (
          <DownloadGateModal pack={pack} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
