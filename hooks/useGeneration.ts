'use client'

import { create } from 'zustand'
import type { GenerationConfig, GenerationState, UploadState, GeneratedPack, PipelineStatus } from '@/types'
import { PLATFORM_SPECS } from '@/lib/platforms'

interface GenerationStore {
  config: GenerationConfig
  setConfig: (partial: Partial<GenerationConfig>) => void

  uploadState: UploadState
  setUploadState: (state: UploadState) => void

  generationState: GenerationState
  pipelineStatus: PipelineStatus
  lastGeneratedHash: string | null
  isProcessed: boolean
  analysis: any | null
  extractedImageUrl: string | null

  startGeneration: () => void
  setPipelineStatus: (status: PipelineStatus) => void
  setLastGeneratedHash: (hash: string | null) => void
  setIsProcessed: (val: boolean) => void
  setBrainResults: (analysis: any, url: string) => void
  reset: () => void
  resetState: () => void
}

// ─── Selectors ──────────────────────────────────────────────────────────────
// Use these with useGenerationStore(selector) so components re-render reactively.
// DO NOT put canGenerate / isGenerating in the store state — Zustand's shallow
// merge strips getter descriptors on every set(), making them stale forever.
export const selectCanGenerate = (s: GenerationStore): boolean =>
  s.uploadState.status === 'ready' &&
  s.config.regionId !== null &&
  s.config.ageRanges.length >= 1 &&
  s.config.gender !== null &&
  s.config.platforms.length >= 1 &&
  s.config.angles.length >= 1

export const selectIsGenerating = (s: GenerationStore): boolean =>
  s.generationState.status === 'generating'

// ─── Store ──────────────────────────────────────────────────────────────────
export const useGenerationStore = create<GenerationStore>((set, get) => ({
  config: {
    regionId: null,
    ageRanges: ['25-34'],
    gender: 'women',
    interest: null,
    productHint: null,
    language: 'auto',
    platforms: [],
    angles: [],
  },

  setConfig: (partial) => set((state) => {
    const isHintChanging = 'productHint' in partial && partial.productHint !== state.config.productHint;
    return {
      config: { ...state.config, ...partial },
      isProcessed: isHintChanging ? false : state.isProcessed
    };
  }),

  uploadState: { status: 'idle' },
  setUploadState: (s) => set((state) => {
    // If we're setting a new ready state with a different image, reset processing
    const isNewImage = state.uploadState.status === 'ready' && s.status === 'ready' && s.base64 !== state.uploadState.base64;
    return {
      uploadState: s,
      isProcessed: isNewImage ? false : state.isProcessed
    };
  }),

  generationState: { status: 'idle' },
  pipelineStatus: 'idle',
  lastGeneratedHash: null,
  isProcessed: false,
  analysis: null,
  extractedImageUrl: null,

  setPipelineStatus: (status) => set({ pipelineStatus: status }),
  setLastGeneratedHash: (hash) => set({ lastGeneratedHash: hash }),
  setIsProcessed: (val) => set({ isProcessed: val }),
  setBrainResults: (analysis, url) => set({ analysis, extractedImageUrl: url, isProcessed: true }),

  startGeneration: async () => {
    const state = get()
    if (!selectCanGenerate(state) || selectIsGenerating(state)) return
    const { config, uploadState } = state

    // Ensure we have the image data
    if (uploadState.status !== 'ready') return

    set({ generationState: { status: 'generating', step: 0, progress: 0 } })

    try {
      let analysis = state.analysis
      let extractedImageUrl = state.extractedImageUrl

      if (!state.isProcessed) {
        // 1. Prepare Data for "Analyze & Extract"
        const formData = new FormData()

        // Convert base64 back to a blob for Photoroom/Gemini
        const byteCharacters = atob(uploadState.base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: uploadState.mimeType })

        formData.append('file', blob, 'product.png')
        formData.append('productHint', config.productHint || '')
        formData.append('language', config.language)
        formData.append('regionId', config.regionId || 'global')

        // 2. Hit the "Brain" API (Steps 0 and 1: Background removal + Analysis)
        const apiPromise = fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        })

        // Fake progress for step 0 (Background Removal)
        for (let j = 0; j < 35; j++) {
          await new Promise(r => setTimeout(r, 60))
          set(s => ({
            generationState: s.generationState.status === 'generating'
              ? { ...s.generationState, progress: (j / 70) * (100 / 6) }
              : s.generationState
          }))
        }
        set(s => ({ generationState: s.generationState.status === 'generating' ? { ...s.generationState, step: 1 } : s.generationState }))

        // Fake progress for step 1 (Analysis)
        for (let j = 35; j < 70; j++) {
          await new Promise(r => setTimeout(r, 60))
          set(s => ({
            generationState: s.generationState.status === 'generating'
              ? { ...s.generationState, progress: (j / 70) * (100 / 6) + (100 / 6) }
              : s.generationState
          }))
        }

        const response = await apiPromise
        if (!response.ok) {
          const responseText = await response.text()
          let errorMsg = 'Failed to analyze product'
          try {
            const errStatus = JSON.parse(responseText)
            if (errStatus.error) errorMsg = errStatus.error
          } catch {
            errorMsg = `Server Error (${response.status}): Analysis failed or timed out. Please try again.`
          }
          throw new Error(errorMsg)
        }

        const responseText = await response.text()
        let result;
        try {
          result = JSON.parse(responseText)
        } catch {
          throw new Error('Failed to parse analysis results. Please try again.')
        }

        analysis = result.analysis
        extractedImageUrl = result.extractedImageUrl

        set({ isProcessed: true, analysis, extractedImageUrl })
      } else {
        // Skip Brain steps and jump to step 2
        set({ generationState: { status: 'generating', step: 2, progress: 33 } })
      }

      // 3. Hit the "Generate Pack" API (Steps 2 to 5: Creative + Rendering)
      
      // Parallel simulated progress for the long generation task (~45-60s)
      const startTime = Date.now()
      const simulateProgress = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        let newStep = 2 // Directing scenes
        
        if (elapsed > 5) newStep = 3 // Writing ad copy
        if (elapsed > 15) newStep = 4 // Rendering images (Takes longest)
        if (elapsed > 42) newStep = 5 // Assembling
        
        // Progress interpolates cleanly up to 98%
        const renderProgress = Math.min(98, 33 + (elapsed / 50) * 65)
        
        const currentState = get().generationState
        if (currentState.status === 'generating') {
          set({ generationState: { ...currentState, step: newStep, progress: renderProgress } })
        }
      }, 500)

      let generateResponse;
      try {
        generateResponse = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packId: crypto.randomUUID(),
            productProfile: { ...analysis, extractedImageUrl },
            userConfig: {
              platforms: config.platforms,
              country: config.regionId ?? undefined,
              ageRange: config.ageRanges[0] ?? undefined,
              gender: config.gender ?? undefined,
              interest: config.interest ?? undefined,
              angle: config.angles[0] ?? undefined,
            },
            marketingLanguage: config.language
          })
        })
      } finally {
        clearInterval(simulateProgress)
      }

      if (!generateResponse.ok) {
        const responseText = await generateResponse.text()
        let errorMsg = 'Failed to generate pack assets'
        try {
          const errStatus = JSON.parse(responseText)
          if (errStatus.error) errorMsg = errStatus.error
        } catch {
          errorMsg = `Server Error (${generateResponse.status}): Generation took too long or crashed. Please try again.`
        }
        throw new Error(errorMsg)
      }

      // Snap to 100% just before completion
      set({ generationState: { status: 'generating', step: 5, progress: 100 } })
      await new Promise(r => setTimeout(r, 600))

      const responseText = await generateResponse.text()
      let pack;
      try {
        const parsed = JSON.parse(responseText)
        pack = parsed.pack
      } catch {
        throw new Error('Failed to parse the generated assets. Please try again.')
      }

      set({ generationState: { status: 'done', pack } })

      // Finalizing is done above inside the generateResponse block
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong during generation'
      set({
        generationState: {
          status: 'error',
          message,
          retryable: true
        }
      })
    }
  },

  reset: () => set({ generationState: { status: 'idle' }, pipelineStatus: 'idle' }),
  resetState: () => set((state) => ({
    isProcessed: false,
    analysis: null,
    extractedImageUrl: null,
    config: { ...state.config, productHint: '' },
    pipelineStatus: 'idle',
    generationState: { status: 'idle' }
  })),
}))
