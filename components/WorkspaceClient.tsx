'use client'
import { useEffect } from 'react'
import { OutputPanel } from '@/components/output/OutputPanel'
import { LoadingSequence } from '@/components/generation/LoadingSequence'
import { usePackEditor } from '@/hooks/usePackEditor'
import { useGenerationStore, selectIsGenerating } from '@/hooks/useGeneration'

export function WorkspaceClient() {
  const generationState = useGenerationStore((s) => s.generationState)
  const isGenerating = useGenerationStore(selectIsGenerating)
  const { pack, setPack, generateMissing } = usePackEditor()

  useEffect(() => {
    if (generationState.status === 'done') {
      setPack(generationState.pack)
    }
  }, [generationState, setPack])

  return (
    <div className="flex flex-col min-h-full">
      <OutputPanel
        pack={pack}
        onGenerateMissing={generateMissing}
      />

      {isGenerating && generationState.status === 'generating' && (
        <LoadingSequence
          stage={generationState.stage}
          stageMessage={generationState.stageMessage}
        />
      )}
      {isGenerating && generationState.status === 'analyzing' && (
        <LoadingSequence
          stage={1}
          stageMessage="Analyzing product..."
        />
      )}
    </div>
  )
}
