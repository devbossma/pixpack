'use client'

import { create } from 'zustand'
import type { GenerationConfig, GenerationState, UploadState, GeneratedPack, GeneratedImage, PipelineStatus, ProductDescription, PostingSchedule } from '@/types'
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

let globalAbortController: AbortController | null = null

// ─── Selectors ──────────────────────────────────────────────────────────────
export const selectCanGenerate = (s: GenerationStore): boolean =>
  s.uploadState.status === 'ready' &&
  s.config.regionId !== null &&
  s.config.ageRanges.length >= 1 &&
  s.config.gender !== null &&
  s.config.platforms.length >= 1 &&
  s.config.angles.length >= 1

export const selectIsGenerating = (s: GenerationStore): boolean =>
  s.generationState.status === 'analyzing' ||
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

    if (uploadState.status !== 'ready') return

    // Cancel any in-progress generation
    globalAbortController?.abort()
    globalAbortController = new AbortController()

    set({ generationState: { status: 'analyzing' } })

    try {
      let analysis = state.analysis
      let extractedImageUrl = state.extractedImageUrl

      if (!state.isProcessed) {
        // 1. Prepare Data for "Analyze & Extract"
        const formData = new FormData()

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

        // 2. Hit the "Brain" API (Background removal + Analysis)
        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
          signal: globalAbortController.signal,
        })

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
      }

      // 3. Hit the "Generate Pack" API via SSE
      set({ generationState: { status: 'generating', stage: 1, stageMessage: 'Starting...', images: [] } })

      const receivedImages: GeneratedImage[] = []
      let packMeta: Omit<GeneratedPack, 'images'> | null = null

      const generateResponse = await fetch('/api/generate', {
        method:  'POST',
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
        }),
        signal:  globalAbortController.signal,
      })

      if (!generateResponse.ok || !generateResponse.body) {
        const err = await generateResponse.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error ?? 'Generation failed')
      }

      // Read SSE stream
      const reader  = generateResponse.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''  // keep incomplete last chunk

        for (const eventStr of events) {
          const line = eventStr.trim()
          if (!line.startsWith('data: ')) continue

          let event: Record<string, unknown>
          try {
            event = JSON.parse(line.slice(6))
          } catch {
            continue
          }

          if (event.type === 'stage') {
            set(prev => {
              const prevGen = prev.generationState
              return {
                generationState: {
                  status: 'generating',
                  stage: event.stage as number,
                  stageMessage: event.message as string,
                  images: prevGen.status === 'generating' ? prevGen.images : [],
                }
              }
            })
          }

          if (event.type === 'image') {
            const image = event.image as GeneratedImage
            receivedImages.push(image)

            set(prev => {
              const prevGen = prev.generationState
              return {
                generationState: {
                  status: 'generating',
                  stage: prevGen.status === 'generating' ? prevGen.stage : 3,
                  stageMessage: prevGen.status === 'generating' ? prevGen.stageMessage : 'Generating images...',
                  images: [...receivedImages],
                }
              }
            })
          }

          if (event.type === 'meta') {
            packMeta = {
              id:                 event.id as string,
              productDescription: event.productDescription as ProductDescription,
              postingSchedule:    event.postingSchedule    as PostingSchedule[],
              audience:           event.audience           as GenerationConfig,
              totalScore:         event.totalScore         as number,
              generatedAt:        event.generatedAt        as string,
            }
          }

          if (event.type === 'done') {
            if (!packMeta) throw new Error('Stream ended without pack metadata')

            const pack: GeneratedPack = {
              ...packMeta,
              images: receivedImages,
            }

            set({ generationState: { status: 'done', pack } })
          }

          if (event.type === 'error') {
            throw new Error(event.message as string)
          }
        }
      }

    } catch (error: unknown) {
      if ((error as Error).name === 'AbortError') return

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

  reset: () => {
    globalAbortController?.abort()
    set({ generationState: { status: 'idle' }, pipelineStatus: 'idle' })
  },
  resetState: () => {
    globalAbortController?.abort()
    set((state) => ({
      isProcessed: false,
      analysis: null,
      extractedImageUrl: null,
      config: { ...state.config, productHint: '' },
      pipelineStatus: 'idle',
      generationState: { status: 'idle' }
    }))
  },
}))
