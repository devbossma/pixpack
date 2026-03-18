'use client'

import { OutputSection } from './OutputSection'
import type { GeneratedPack, Platform } from '@/types'

interface OutputPanelProps {
  pack: GeneratedPack | null
  onRegenerate: (imageId: string) => void
  onGenerateMissing?: (platformId: Platform) => void
}

export function OutputPanel({ pack, onRegenerate, onGenerateMissing }: OutputPanelProps) {
  return (
    <OutputSection
      pack={pack}
      onRegenerate={onRegenerate}
      onGenerateMissing={onGenerateMissing}
    />
  )
}
