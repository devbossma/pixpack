'use client'
import { useEffect } from 'react'
import { OutputPanel } from '@/components/output/OutputPanel'
import { usePackEditor } from '@/hooks/usePackEditor'
import { useGenerationStore } from '@/hooks/useGeneration'

export function WorkspaceClient() {
  const generationState = useGenerationStore((s) => s.generationState)
  const { pack, setPack } = usePackEditor()

  useEffect(() => {
    if (generationState.status === 'done') {
      setPack(generationState.pack)
    }
  }, [generationState, setPack])

  return (
    <div className="flex flex-col flex-1 h-full min-h-0">
      <OutputPanel pack={pack} />
    </div>
  )
}
