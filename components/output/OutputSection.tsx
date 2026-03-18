'use client'

import { PackSummary } from './PackSummary'
import { PlatformGallery } from './PlatformGallery'
import { ProductDescriptionPanel } from './ProductDescriptionPanel'
import { PostingSchedulePanel } from './PostingSchedulePanel'
import { ActionBar } from './ActionBar'
import { Wand2 } from 'lucide-react'
import type { GeneratedPack, Platform } from '@/types'
import { useGenerationStore, selectIsGenerating } from '@/hooks/useGeneration'

interface OutputSectionProps {
  pack: GeneratedPack | null
  onRegenerate: (imageId: string) => void
  onGenerateMissing?: (platformId: Platform) => void
}

export function OutputSection({ pack, onRegenerate, onGenerateMissing }: OutputSectionProps) {
  const isGenerating = useGenerationStore(selectIsGenerating)

  if (!pack && !isGenerating) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-12 text-[var(--text-muted)] h-full min-h-full">
      <div className="w-12 h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
        <Wand2 size={20} className="text-[var(--text-muted)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)]">Your content pack appears here</p>
      <p className="text-xs max-w-xs leading-relaxed">Configure your audience in the sidebar, then click generate</p>
    </div>
  )

  return (
    <div id="workspace" className="p-5 space-y-5 bg-[var(--output-bg)] min-h-full border-t border-[var(--output-bg)]">
      {/* Header & Actions */}
      {pack && !isGenerating && (
        <div className="space-y-4">
          <PackSummary pack={pack} />
          <ActionBar pack={pack} />
        </div>
      )}

      <PlatformGallery
        pack={pack}
        isGenerating={isGenerating}
        onRegenerate={onRegenerate}
      />

      {pack && !isGenerating && (
        <div className="grid lg:grid-cols-2 gap-5 mt-5">
          <ProductDescriptionPanel desc={pack.productDescription} />
          <PostingSchedulePanel schedule={pack.postingSchedule} />
        </div>
      )}
    </div>
  )
}
