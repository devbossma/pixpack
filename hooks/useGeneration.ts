'use client'
/**
 * hooks/useGeneration.ts
 *
 * Unified generation store using Zustand.
 * Handles the full pipeline from upload -> analysis -> queue -> streaming results.
 */

import { create } from 'zustand'
import type { GeneratedImage, GeneratedPack, ProductProfile, UserConfig, ProductAnalysis } from '@/lib/types'
import type { QueueJob } from '@/lib/queue'

const USE_SSE = process.env.NEXT_PUBLIC_USE_SSE !== 'false'
const POLL_INTERVAL_MS = 2_000

// ─── State machine ─────────────────────────────────────────────────────────────

export type GenerationState =
  | { status: 'idle' }
  | { status: 'queued'; jobId: string; position: number; estimatedWait: number }
  | { status: 'analyzing'; jobId: string }
  | { status: 'generating'; jobId: string; stage?: number; stageMessage?: string; images: GeneratedImage[] }
  | { status: 'done'; jobId: string; pack: GeneratedPack }
  | { status: 'error'; message: string }

export interface UploadState {
  status: 'idle' | 'dragging' | 'processing' | 'ready' | 'error'
  previewUrl?: string
  base64?: string
  mimeType?: string
  message?: string
  file?: File
}

export interface GenerationStore {
  // State
  generationState: GenerationState
  config: { 
    platform: string
    language: string
    regionId: string | null
    ageRange: string | null
    gender: string | null
    interest: string | null
    angle: string | null
    productHint: string | null
  }
  uploadState: UploadState
  pipelineStatus: string
  lastGeneratedHash: string
  isProcessed: boolean
  processedResult: ProductProfile | null
  
  // Internal refs/controllers (conceptually)
  abortController: AbortController | null
  pollTimer: ReturnType<typeof setTimeout> | null

  // Methods
  setConfig: (config: Partial<GenerationStore['config']>) => void
  setUploadState: (state: Partial<UploadState>) => void
  setPipelineStatus: (status: string) => void
  setLastGeneratedHash: (hash: string) => void
  resetState: () => void
  
  // Core Actions
  startGeneration: () => Promise<void>
  reset: () => void
}

export const useGenerationStore = create<GenerationStore>((set, get) => ({
  // Defaults
  generationState: { status: 'idle' },
  config: { 
    platform: '', 
    language: 'auto',
    regionId: null,
    ageRange: null,
    gender: null,
    interest: null,
    angle: null,
    productHint: null,
  },
  uploadState: { status: 'idle' },
  pipelineStatus: 'idle',
  lastGeneratedHash: '',
  isProcessed: false,
  processedResult: null,
  abortController: null,
  pollTimer: null,

  setConfig: (newConfig) => set(prev => ({ config: { ...prev.config, ...newConfig } })),
  setUploadState: (newState) => set(prev => ({ uploadState: { ...prev.uploadState, ...newState } })),
  setPipelineStatus: (status) => set({ pipelineStatus: status }),
  setLastGeneratedHash: (hash) => set({ lastGeneratedHash: hash }),

  resetState: () => {
    const { abortController, pollTimer } = get()
    abortController?.abort()
    if (pollTimer) clearTimeout(pollTimer)
    set({
      generationState: { status: 'idle' },
      pipelineStatus: 'idle',
      isProcessed: false,
      processedResult: null,
      abortController: null,
      pollTimer: null
    })
  },

  reset: () => {
     get().resetState()
  },

  startGeneration: async () => {
    const { uploadState, config, abortController, isProcessed, processedResult } = get()
    
    // 0. Safety Checks
    if (uploadState.status !== 'ready' || !config.platform) return
    if (get().generationState.status !== 'idle' && get().generationState.status !== 'done' && get().generationState.status !== 'error') return

    abortController?.abort()
    const newController = new AbortController()
    set({ abortController: newController, pipelineStatus: 'extracting' })

    try {
      let finalProfile: ProductProfile

      // 1. Analyze Step (if not already processed or if hint/image changed)
      if (!isProcessed || !processedResult) {
        set({ generationState: { status: 'analyzing', jobId: 'pre-queue' } })
        
        const formData = new FormData()
        if (uploadState.file) {
           formData.append('file', uploadState.file)
        } else if (uploadState.base64) {
           // Fallback if file missing (shouldn't happen with updated UploadZone)
           const blob = await fetch(`data:${uploadState.mimeType};base64,${uploadState.base64}`).then(r => r.blob())
           formData.append('file', blob, 'product.jpg')
        }
        
        formData.append('productHint', config.productHint || '')
        formData.append('language', config.language || 'auto')

        const analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
          signal: newController.signal
        })

        if (!analyzeRes.ok) throw new Error('Product analysis failed')
        const analysisData = await analyzeRes.json()
        
        finalProfile = {
          ...analysisData.analysis,
          extractedImageUrl: analysisData.extractedImageUrl,
          productHint: config.productHint
        }
        
        set({ isProcessed: true, processedResult: finalProfile })
      } else {
        finalProfile = processedResult
      }

      set({ pipelineStatus: 'generating_creative' })

      // 2. Enqueue Job
      const enqueueRes = await fetch('/api/queue/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productProfile: finalProfile,
          userConfig: {
            platform: config.platform,
            country: config.regionId ?? undefined,
            ageRange: config.ageRange ?? undefined,
            gender: config.gender ?? undefined,
            interest: config.interest ?? undefined,
            angle: config.angle ?? undefined,
          },
          marketingLanguage: config.language
        }),
        signal: newController.signal,
      })

      if (!enqueueRes.ok) {
        const data = await enqueueRes.json()
        set({ generationState: { status: 'error', message: data.error ?? 'Failed to queue job' } })
        return
      }

      const { jobId, position } = await enqueueRes.json()
      set({ generationState: { status: 'queued', jobId, position, estimatedWait: position * 100 } })

      // 3. Track Progress
      if (USE_SSE) {
        let retries = 0
        while (!newController.signal.aborted && retries < 15) {
          await connectSSE(jobId, newController.signal, set, get)
          const currentState = get().generationState
          if (currentState.status === 'done' || currentState.status === 'error') {
            break
          }
          // The SSE closed cleanly (likely due to 170s Vercel timeout).
          // We must reconnect until the job reaches a terminal state.
          await new Promise(r => setTimeout(r, 1000))
          retries++
        }
      } else {
        await startPolling(jobId, newController.signal, set)
      }

    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('[startGeneration] Error:', err)
      set({ generationState: { status: 'error', message: err.message ?? 'Generation failed' }, pipelineStatus: 'idle' })
    }
  }
}))

// Selectors
export const selectCanGenerate = (s: GenerationStore) => 
  s.uploadState.status === 'ready' && !!s.config.platform && !['queued', 'analyzing', 'generating'].includes(s.generationState.status)
export const selectIsGenerating = (s: GenerationStore) => 
  ['queued', 'analyzing', 'generating'].includes(s.generationState.status)

// ── Shared Helpers ──────────────────────────────────────────────────────────

async function connectSSE(jobId: string, signal: AbortSignal, set: any, get: any) {
  const url = `/api/queue/stream?jobId=${jobId}`

  try {
    const res = await fetch(url, { signal })
    if (!res.body) return

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const currentState = get().generationState
    let currentImages: GeneratedImage[] = (currentState.status === 'generating' || currentState.status === 'done') 
      ? (currentState.images || (currentState.status === 'done' ? currentState.pack?.images : []) || []) 
      : []
    let currentStage = (currentState as any).stage || 0
    let currentMessage = (currentState as any).stageMessage || ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        let event: any
        try { event = JSON.parse(line.slice(6)) } catch { continue }

        handleEvent(event, jobId, currentImages, currentStage, currentMessage, set, (imgs, stage, msg) => {
          currentImages = imgs
          currentStage = stage
          currentMessage = msg
        })
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[connectSSE] Network disconnected, retrying...', err)
    }
  }
}

async function startPolling(jobId: string, signal: AbortSignal, set: any) {
  let lastImageCount = 0

  const poll = async () => {
    if (signal.aborted) return

    try {
      const res = await fetch(`/api/queue/status?jobId=${jobId}`, { signal })
      if (!res.ok) { set({ generationState: { status: 'error', message: 'Status check failed' } }); return }
      const data = await res.json()

      if (data.status === 'queued') {
        set({ generationState: { status: 'queued', jobId, position: data.position, estimatedWait: data.estimatedWaitSeconds } })
      } else if (data.status === 'processing') {
        const stage = data.stage ?? 0
        const msg = data.stageMessage ?? ''
        
        if (stage <= 2) {
          set({ generationState: { status: 'analyzing', jobId } })
        } else {
          set((prev: any) => ({
             generationState: {
               status: 'generating',
               jobId,
               stage,
               stageMessage: msg,
               images: data.images ?? prev.generationState.images ?? []
             }
          }))
        }
        
        if (stage >= 3) set({ pipelineStatus: 'rendering_images' })
        else if (stage > 0) set({ pipelineStatus: 'generating_creative' })
      }

      if (data.status === 'done' && data.pack) {
        set({ generationState: { status: 'done', jobId, pack: data.pack }, pipelineStatus: 'done' })
        return
      }
      if (data.status === 'failed') {
        set({ generationState: { status: 'error', message: data.error ?? 'Generation failed' }, pipelineStatus: 'idle' })
        return
      }

      if (!signal.aborted) {
        const timer = setTimeout(poll, POLL_INTERVAL_MS)
        set({ pollTimer: timer })
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        set({ generationState: { status: 'error', message: 'Polling failed' } })
      }
    }
  }

  poll()
}

function handleEvent(
  event: any,
  jobId: string,
  currentImages: GeneratedImage[],
  currentStage: number,
  currentMessage: string,
  set: any,
  update: (imgs: GeneratedImage[], stage: number, msg: string) => void,
) {
  switch (event.type) {
    case 'queued':
      set({ generationState: { status: 'queued', jobId, position: event.position, estimatedWait: event.estimatedWait } })
      break
    case 'stage': {
      const { stage, message } = event
      update(currentImages, stage, message)
      if (stage <= 2) {
        set({ generationState: { status: 'analyzing', jobId } })
      } else {
        set({ generationState: { status: 'generating', jobId, stage, stageMessage: message, images: currentImages } })
        set({ pipelineStatus: 'rendering_images' })
      }
      break
    }
    case 'image': {
      // Deduplicate by ID to handle SSE re-emits during reconnect
      const exists = currentImages.some(img => img.id === event.image.id)
      const imgs = exists ? currentImages : [...currentImages, event.image]
      
      update(imgs, currentStage, currentMessage)
      set({ generationState: { status: 'generating', jobId, stage: currentStage, stageMessage: currentMessage, images: imgs } })
      break
    }
    case 'done':
      if (event.pack) set({ generationState: { status: 'done', jobId, pack: event.pack }, pipelineStatus: 'done' })
      break
    case 'error':
      set({ generationState: { status: 'error', message: event.message }, pipelineStatus: 'idle' })
      break
  }
}

// Compat hook
export function useGeneration() {
  const store = useGenerationStore()
  return {
    state: store.generationState,
    startGeneration: store.startGeneration,
    reset: store.reset
  }
}