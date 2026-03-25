'use client'

import { useState } from 'react'
import { PackSummary } from './PackSummary'
import { OutputGrid } from './OutputGrid'
import { ActionBar } from './ActionBar'
import { Wand2, LayoutGrid } from 'lucide-react'
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
        <div className="max-w-md w-full">
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

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!hasContent) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8 text-[var(--text-muted)] h-full">
      <div className="w-12 h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
        <Wand2 size={20} className="text-[var(--text-muted)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)]">Your ad pack appears here</p>
      <p className="text-xs max-w-xs leading-relaxed opacity-70">
        Upload a photo, pick a platform &amp; audience — then click &ldquo;Generate your pack&rdquo; in the sidebar
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
          className="hidden md:flex items-center justify-between flex-shrink-0 px-6 py-3 border-b border-[var(--output-border)] bg-[var(--output-bg)]"
        >
          {/* Left: branding + pack info */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <LayoutGrid size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--accent)]">Preview Mode</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {pack.images.filter(i => i.status === 'done').length} variations · {pack.platform.replace('_', ' ')}
              </p>
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
