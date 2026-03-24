'use client'

import { PackSummary } from './PackSummary'
import { OutputGrid } from './OutputGrid'
import { ActionBar } from './ActionBar'
import { Wand2 } from 'lucide-react'
import type { GeneratedPack, GeneratedImage } from '@/types'
import { useGenerationStore, selectIsGenerating } from '@/hooks/useGeneration'
import { LoadingSequence } from '@/components/generation/LoadingSequence'

interface OutputSectionProps {
  pack: GeneratedPack | null
}

export function OutputSection({ pack }: OutputSectionProps) {
  const isGenerating = useGenerationStore(selectIsGenerating)
  const generationState = useGenerationStore(s => s.generationState)

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
    displayImages = pack.images
    displayPlatform = pack.platform
  }

  const hasContent = displayImages.length > 0 || isGenerating

  if (!hasContent) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8 text-[var(--text-muted)] h-full">
      <div className="w-12 h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
        <Wand2 size={20} className="text-[var(--text-muted)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)]">Your ad pack appears here</p>
      <p className="text-xs max-w-xs leading-relaxed opacity-70">Upload a photo, pick a platform &amp; audience — then click &ldquo;Generate your pack&rdquo; in the sidebar</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--output-bg)]">
      {/* Header & Actions — only when fully generated */}
      {pack && !isGenerating && (
        <div className="flex-shrink-0 px-5 pt-5 pb-3 space-y-3 border-b border-[var(--output-border)]">
          <PackSummary pack={pack} />
          <ActionBar pack={pack} />
        </div>
      )}

      {/* Grid — fills remaining height */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
        <OutputGrid images={displayImages} platform={displayPlatform} isGenerating={isGenerating} />
      </div>
    </div>
  )
}
