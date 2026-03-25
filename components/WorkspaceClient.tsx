'use client'
import { useEffect } from 'react'
import { OutputPanel } from '@/components/output/OutputPanel'
import { usePackEditor } from '@/hooks/usePackEditor'
import { useGenerationStore, RunSubscriber } from '@/hooks/useGeneration'

export function WorkspaceClient() {
  const generationState = useGenerationStore((s) => s.generationState)
  const runId = useGenerationStore((s) => s.runId)
  const accessToken = useGenerationStore((s) => s.accessToken)
  const { pack, setPack } = usePackEditor()

  useEffect(() => {
    if (generationState.status === 'done') {
      setPack(generationState.pack)
    }
  }, [generationState, setPack])

  return (
    <div className="flex flex-col flex-1 h-full min-h-0">
      {/* Subscribe to Trigger.dev updates if we have a run active */}
      {runId && accessToken && (
        <RunSubscriber runId={runId} publicAccessToken={accessToken} />
      )}
      
      <OutputPanel pack={pack} />
    </div>
  )
}

