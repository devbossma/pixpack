'use client'
/**
 * hooks/useGeneration.ts
 *
 * Unified generation store using Zustand.
 * Handles configuration, upload state, pipeline progress, and AI generation (SSE or Polling).
 */

import { create } from 'zustand'
import type { 
  GeneratedImage, 
  GeneratedPack, 
  ProductProfile, 
  UserConfig,
  Platform,
  PipelineStatus,
  UploadState,
  GenerationConfig
} from '@/types'

const USE_SSE = process.env.NEXT_PUBLIC_USE_SSE !== 'false'  // default true
const POLL_INTERVAL_MS = 2_000

// ─── Generation State Machine ───────────────────────────────────────────────

export type GenerationState =
  | { status: 'idle' }
  | { status: 'queued'; jobId: string; position: number; estimatedWait: number }
  | { status: 'analyzing'; jobId: string }
  | { status: 'generating'; jobId: string; stage: number; stageMessage: string; images: GeneratedImage[] }
  | { status: 'done'; jobId: string; pack: GeneratedPack }
  | { status: 'error'; message: string }

// ─── Store Interface ────────────────────────────────────────────────────────

interface GenerationStore {
  // State
  config: GenerationConfig
  uploadState: UploadState
  pipelineStatus: PipelineStatus
  lastGeneratedHash: string
  generationState: GenerationState
  
  // Persistence for analysis results
  productProfile: ProductProfile | null
  isProcessed: boolean

  // Actions
  setConfig: (updates: Partial<GenerationConfig>) => void
  setUploadState: (state: UploadState) => void
  setPipelineStatus: (status: PipelineStatus) => void
  setLastGeneratedHash: (hash: string) => void
  resetState: () => void
  startGeneration: () => Promise<void>
}

// Internal refs (not reactive)
let abortController: AbortController | null = null
let pollTimer: ReturnType<typeof setTimeout> | null = null

// ─── Initial State ───────────────────────────────────────────────────────────

const INITIAL_CONFIG: GenerationConfig = {
  regionId: null,
  ageRange: null,
  gender: null,
  interest: null,
  productHint: null,
  language: 'auto',
  platform: null,
  angle: null,
}

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectCanGenerate = (state: GenerationStore) => 
  state.uploadState.status === 'ready' && !!state.config.platform

export const selectIsGenerating = (state: GenerationStore) => 
  ['queued', 'analyzing', 'generating'].includes(state.generationState.status)

// ─── The Store ───────────────────────────────────────────────────────────────

export const useGenerationStore = create<GenerationStore>((set, get) => ({
  config: INITIAL_CONFIG,
  uploadState: { status: 'idle' },
  pipelineStatus: 'idle',
  lastGeneratedHash: '',
  generationState: { status: 'idle' },
  productProfile: null,
  isProcessed: false,

  setConfig: (updates) => set((s) => ({ config: { ...s.config, ...updates } })),
  
  setUploadState: (state) => set({ 
    uploadState: state,
    isProcessed: state.status === 'ready' ? false : get().isProcessed,
    productProfile: state.status === 'ready' ? null : get().productProfile
  }),

  setPipelineStatus: (status) => set({ pipelineStatus: status }),

  setLastGeneratedHash: (hash) => set({ lastGeneratedHash: hash }),

  resetState: () => {
    abortController?.abort()
    if (pollTimer) clearTimeout(pollTimer)
    set({ 
      generationState: { status: 'idle' },
      pipelineStatus: 'idle',
      isProcessed: false,
      productProfile: null
    })
  },

  startGeneration: async () => {
    const { config, uploadState, isProcessed, productProfile } = get()
    
    if (uploadState.status !== 'ready' || !config.platform) return

    abortController?.abort()
    abortController = new AbortController()

    try {
      let currentProfile = productProfile

      // Step 1: Analysis (if not processed)
      if (!isProcessed || !currentProfile) {
        set({ generationState: { status: 'analyzing', jobId: '' } })
        
        // We need the File object here. In UploadState 'ready', we store base64 but maybe not the File?
        // Let's assume /api/analyze can take the original file.
        // Wait, UploadZone passes a File to processFile.
        // If we only have base64, we can convert it back to a Blob if needed, 
        // but it's better if we keep the file or use a base64-friendly analyze route.
        // Looking at /api/analyze, it expects multipart/form-data with 'file'.
        
        // Convert base64 back to Blob for multipart upload
        const res = await fetch(`data:${uploadState.mimeType};base64,${uploadState.base64}`)
        const blob = await res.blob()
        const file = new File([blob], 'product.jpg', { type: uploadState.mimeType })

        const formData = new FormData()
        formData.append('file', file)
        formData.append('productHint', config.productHint || '')
        formData.append('language', config.language || 'auto')

        const analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
          signal: abortController.signal,
        })

        if (!analyzeRes.ok) {
          const data = await analyzeRes.json()
          set({ generationState: { status: 'error', message: data.error ?? 'Analysis failed' } })
          return
        }

        const { extractedImageUrl, analysis } = await analyzeRes.json()
        currentProfile = {
          ...analysis,
          extractedImageUrl,
          productHint: config.productHint || undefined,
        }
        set({ productProfile: currentProfile, isProcessed: true })
      }

      // Step 2: Enqueue Job
      const input = {
        productProfile: currentProfile,
        userConfig: {
          platform: config.platform,
          country: config.regionId || undefined,
          ageRange: config.ageRange || undefined,
          gender: config.gender || undefined,
          interest: config.interest || undefined,
          angle: config.angle || undefined,
        } as UserConfig,
        marketingLanguage: config.language
      }

      const enqueueRes = await fetch('/api/queue/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: abortController.signal,
      })

      if (!enqueueRes.ok) {
        const data = await enqueueRes.json()
        set({ generationState: { status: 'error', message: data.error ?? 'Failed to queue job' } })
        return
      }

      const { jobId, position } = await enqueueRes.json()
      
      // Show queue position immediately
      set({ 
        generationState: { 
          status: 'queued', 
          jobId, 
          position, 
          estimatedWait: position * 100 
        } 
      })

      // Step 3: Connect to results
      if (USE_SSE) {
        await connectSSE(jobId, abortController.signal, set)
      } else {
        await startPolling(jobId, abortController.signal, set, get)
      }

    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      set({ generationState: { status: 'error', message: 'Network error. Please try again.' } })
    }
  }
}))

// ─── Transport Helpers ──────────────────────────────────────────────────────

async function connectSSE(
  jobId: string, 
  signal: AbortSignal, 
  set: (state: Partial<GenerationStore>) => void
) {
  return new Promise<void>((resolve) => {
    const url = `/api/queue/stream?jobId=${jobId}`

    fetch(url, { signal })
      .then(async (res) => {
        if (!res.body) { resolve(); return }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        let currentImages: GeneratedImage[] = []
        let currentStage = 0
        let currentMessage = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            let event: Record<string, unknown>
            try { event = JSON.parse(line.slice(6)) } catch { continue }

            handleEvent(event, jobId, currentImages, currentStage, currentMessage, set,
              (imgs, stage, msg) => {
                currentImages = imgs
                currentStage = stage
                currentMessage = msg
              },
            )
          }
        }
        resolve()
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          set({ generationState: { status: 'error', message: 'Connection lost. Please try again.' } })
        }
        resolve()
      })
  })
}

async function startPolling(
  jobId: string, 
  signal: AbortSignal, 
  set: (state: Partial<GenerationStore>) => void,
  get: () => GenerationStore
) {
  let lastImageCount = 0
  let currentImages: GeneratedImage[] = []

  const poll = async () => {
    if (signal.aborted) return

    try {
      const res = await fetch(`/api/queue/status?jobId=${jobId}`, { signal })
      if (!res.ok) { 
        set({ generationState: { status: 'error', message: 'Status check failed' } })
        return 
      }
      const data = await res.json()

      // Update queue position
      if (data.status === 'queued') {
        set({ 
          generationState: { 
            status: 'queued', 
            jobId, 
            position: data.position, 
            estimatedWait: data.estimatedWaitSeconds 
          } 
        })
      }

      // Update stage
      if (data.status === 'processing') {
        if (data.stage === 1 || data.stage === 2) {
          set({ generationState: { status: 'analyzing', jobId } })
        } else {
          const current = get().generationState
          set({
            generationState: {
              status: 'generating',
              jobId,
              stage: data.stage,
              stageMessage: data.stageMessage,
              images: current.status === 'generating' ? current.images : [],
            }
          })
        }
      }

      // New images
      const newImages: GeneratedImage[] = data.images ?? []
      if (newImages.length > lastImageCount) {
        currentImages = newImages
        lastImageCount = newImages.length
        set({
          generationState: {
            status: 'generating',
            jobId,
            stage: data.stage ?? 3,
            stageMessage: data.stageMessage ?? 'Generating images...',
            images: currentImages,
          }
        })
      }

      // Terminal states
      if (data.status === 'done' && data.pack) {
        set({ generationState: { status: 'done', jobId, pack: data.pack } })
        return
      }
      if (data.status === 'failed') {
        set({ generationState: { status: 'error', message: data.error ?? 'Generation failed' } })
        return
      }

      // Schedule next poll
      if (!signal.aborted) {
        pollTimer = setTimeout(poll, POLL_INTERVAL_MS)
      }

    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        set({ generationState: { status: 'error', message: 'Network error during polling' } })
      }
    }
  }

  poll()
}

function handleEvent(
  event: Record<string, unknown>,
  jobId: string,
  currentImages: GeneratedImage[],
  currentStage: number,
  currentMessage: string,
  set: (state: Partial<GenerationStore>) => void,
  update: (imgs: GeneratedImage[], stage: number, msg: string) => void,
) {
  switch (event.type) {
    case 'queued':
      set({
        generationState: {
          status: 'queued',
          jobId,
          position: event.position as number,
          estimatedWait: event.estimatedWait as number,
        }
      })
      break

    case 'stage': {
      const stage = event.stage as number
      const msg = event.message as string
      update(currentImages, stage, msg)
      if (stage <= 2) {
        set({ generationState: { status: 'analyzing', jobId } })
      } else {
        set({ generationState: { status: 'generating', jobId, stage, stageMessage: msg, images: currentImages } })
      }
      break
    }

    case 'image': {
      const image = event.image as GeneratedImage
      const imgs = [...currentImages, image]
      update(imgs, currentStage, currentMessage)
      set({
        generationState: {
          status: 'generating',
          jobId,
          stage: currentStage,
          stageMessage: currentMessage,
          images: imgs,
        }
      })
      break
    }

    case 'done':
      if (event.pack) {
        set({ generationState: { status: 'done', jobId, pack: event.pack as GeneratedPack } })
      }
      break

    case 'error':
      set({ generationState: { status: 'error', message: event.message as string } })
      break
  }
}