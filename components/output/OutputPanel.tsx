'use client'

import { OutputSection } from './OutputSection'
import type { GeneratedPack, Platform } from '@/types'

interface OutputPanelProps {
  pack: GeneratedPack | null
  onGenerateMissing?: (platformId: Platform) => void
}

export function OutputPanel({ pack, onGenerateMissing }: OutputPanelProps) {
  return (
    <OutputSection
      pack={pack}
      onGenerateMissing={onGenerateMissing}
    />
  )
}
