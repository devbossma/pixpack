'use client'

import { useMemo, useCallback, useEffect } from 'react'
import { useGenerationStore, selectCanGenerate, selectIsGenerating } from './useGeneration'
import { usePackEditor } from './usePackEditor'

export function usePipeline() {
  const { 
    config, 
    uploadState, 
    pipelineStatus, 
    setPipelineStatus,
    lastGeneratedHash, 
    setLastGeneratedHash,
    isProcessed,
    startGeneration,
    generationState
  } = useGenerationStore()

  const { setPack } = usePackEditor()

  // 1. CONFIGURATION HASHING
  const currentConfigHash = useMemo(() => {
    // We hash the essential inputs: image, hint, and audience/platform config
    const components = [
      uploadState.status === 'ready' ? uploadState.base64 : '',
      config.productHint || '',
      config.regionId || '',
      config.ageRange || '',
      config.gender || '',
      config.interest || '',
      config.language || '',
      config.platform || ''
    ]
    return components.join('|')
  }, [uploadState, config])

  const hasConfigChanged = currentConfigHash !== lastGeneratedHash
  const canGenerate = useGenerationStore(selectCanGenerate)
  const isGenerating = useGenerationStore(selectIsGenerating)

  const isGenerateEnabled = canGenerate && hasConfigChanged && !isGenerating

  // 2. PIPELINE EXECUTION
  const runPipeline = useCallback(async () => {
    if (!isGenerateEnabled) return

    // Transition status
    if (!isProcessed) {
      setPipelineStatus('extracting')
    } else {
      setPipelineStatus('generating_creative')
    }

    // Call the store's generation logic
    // Note: startGeneration in useGeneration.ts already handles step/progress updates
    await startGeneration()

    // Status updates are handled by monitoring the store's generationState
  }, [isGenerateEnabled, isProcessed, setPipelineStatus, startGeneration])

  // Sync pipeline status with generation steps
  useEffect(() => {
    if (generationState.status === 'analyzing') {
      if (pipelineStatus !== 'extracting') setPipelineStatus('extracting')
    } else if (generationState.status === 'generating') {
      if ((generationState.stage ?? 0) === 1 || (generationState.stage ?? 0) === 2) {
        if (pipelineStatus !== 'generating_creative') setPipelineStatus('generating_creative')
      } else if ((generationState.stage ?? 0) >= 3) {
        if (pipelineStatus !== 'rendering_images') setPipelineStatus('rendering_images')
      }
    } else if (generationState.status === 'done') {
      if (pipelineStatus !== 'done') {
        setPipelineStatus('done')
        setLastGeneratedHash(currentConfigHash)
      }
    } else if (generationState.status === 'idle' || generationState.status === 'error') {
      if (pipelineStatus !== 'idle' && pipelineStatus !== 'done') setPipelineStatus('idle')
    }
  }, [generationState, pipelineStatus, setPipelineStatus, setLastGeneratedHash, currentConfigHash])

  return {
    pipelineStatus,
    isGenerateEnabled,
    runPipeline,
    currentConfigHash,
    hasConfigChanged
  }
}
