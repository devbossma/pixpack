'use client'

import { OutputSection } from './OutputSection'
import type { GeneratedPack } from '@/types'

interface OutputPanelProps {
  pack: GeneratedPack | null
}

export function OutputPanel({ pack }: OutputPanelProps) {
  return (
    <div className="flex flex-col flex-1 h-full min-h-0">
      <OutputSection pack={pack} />
    </div>
  )
}
