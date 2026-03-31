'use client'
/**
 * hooks/useGeneration.ts
 *
 * Generation hook backed by Trigger.dev Realtime.
 * Shared via Zustand store so multiple components (Sidebar, Output, etc) stay in sync.
 */

import { useRef, useCallback, useEffect } from 'react'
import { create } from 'zustand'
import { useRealtimeRun } from '@trigger.dev/react-hooks'
import type { generatePackTask, MetadataImage } from '@/trigger/generate-pack'
import type { GeneratedPack, ProductProfile, UserConfig } from '@/lib/types'
import { REGIONS } from '@/lib/regions'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type GenerationState =
  | { status: 'idle' }
  | { status: 'queued'; runId: string; position?: number; estimatedWait?: number }
  | { status: 'analyzing'; runId: string; stage: number; stageMessage: string }
  | { status: 'generating'; runId: string; stage: number; stageMessage: string; images: MetadataImage[] }
  | { status: 'done'; runId: string; pack: GeneratedPack }
  | { status: 'error'; message: string }

export type UploadStatus = 'idle' | 'dragging' | 'processing' | 'ready' | 'error'

export interface UploadState {
  status: UploadStatus
  message?: string
  previewUrl?: string
  base64?: string
  mimeType?: string
  file?: File
}

export interface UserGenerationConfig {
  regionId: string | null
  ageRange: string | null
  gender: string | null
  interest: string | null
  language: string | null
  platform: string | null
  productHint: string | null
}

export type PipelineStatus = 'idle' | 'extracting' | 'generating_creative' | 'rendering_images' | 'done'

interface GenerationStore {
  // Generation Process (Trigger.dev)
  generationState: GenerationState
  runId: string | null
  accessToken: string | null
  
  // User Configuration
  config: UserGenerationConfig
  uploadState: UploadState
  
  // Pipeline Tracking
  pipelineStatus: PipelineStatus
  lastGeneratedHash: string | null
  isProcessed: boolean

  // Actions
  setRun: (runId: string, accessToken: string) => void
  setGenerationState: (state: GenerationState) => void
  setConfig: (config: Partial<UserGenerationConfig>) => void
  setUploadState: (state: Partial<UploadState>) => void
  setPipelineStatus: (status: PipelineStatus) => void
  setLastGeneratedHash: (hash: string | null) => void
  reset: () => void
  resetState: () => void // Matches UploadZone expectation
  
  // High-level Actions
  startGeneration: () => Promise<void>
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useGenerationStore = create<GenerationStore>((set, get) => ({
  generationState: { status: 'idle' },
  runId: null,
  accessToken: null,
  
  config: {
    regionId: 'US',
    ageRange: '25-44',
    gender: 'all',
    interest: null,
    language: 'auto',
    platform: 'instagram_post',
    productHint: null,
  },
  
  uploadState: { status: 'idle' },
  
  pipelineStatus: 'idle',
  lastGeneratedHash: null,
  isProcessed: false,

  setRun: (runId, accessToken) => set({ runId, accessToken, generationState: { status: 'queued', runId } }),
  setGenerationState: (state) => set({ generationState: state }),
  
  setConfig: (newConfig) => set((s) => ({ config: { ...s.config, ...newConfig } })),
  setUploadState: (newState) => set((s) => ({ uploadState: { ...s.uploadState, ...newState } })),
  
  setPipelineStatus: (status) => set({ pipelineStatus: status }),
  setLastGeneratedHash: (hash) => set({ lastGeneratedHash: hash }),
  
  reset: () => set({ 
    generationState: { status: 'idle' }, 
    runId: null, 
    accessToken: null,
    pipelineStatus: 'idle'
  }),
  
  resetState: () => set({ uploadState: { status: 'idle' } }),

  startGeneration: async () => {
    const { config, uploadState } = get()
    
    if (uploadState.status !== 'ready' || !uploadState.file) {
      set({ generationState: { status: 'error', message: 'Please upload a product photo first.' } })
      return
    }

    set({ generationState: { status: 'analyzing', runId: '', stage: 1, stageMessage: 'Extracting product & analyzing style...' }, runId: null, accessToken: null })

    try {
      // 1. Analyze Step 
      const formData = new FormData()
      formData.append('file', uploadState.file)
      formData.append('productHint', config.productHint ?? '')
      formData.append('language', config.language ?? 'auto')

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!analyzeRes.ok) {
        const analyzeData = await analyzeRes.json().catch(() => ({}))
        set({ generationState: { status: 'error', message: analyzeData.error ?? 'Failed to analyze the product image.' } })
        return
      }

      const { extractedImageUrl, analysis } = await analyzeRes.json()

      // Transition straight to queued for Trigger.dev
      set({ generationState: { status: 'queued', runId: '' } })

      // 2. Prepare input for Trigger.dev Task
      const input = {
        productProfile: {
          extractedImageUrl, // Has valid public Supabase URL now
          productHint: config.productHint ?? undefined,
          ...analysis,       // Add the parsed analysis fields (style, materials, etc)
        },
        userConfig: {
          platform: config.platform ?? 'instagram_post',
          // Resolve regionId (e.g. 'saudi') to full label (e.g. 'Saudi Arabia')
          // so resolveLanguageFromCountry() can match it in COUNTRY_LANGUAGE_MAP
          country: config.regionId ? (REGIONS[config.regionId as keyof typeof REGIONS]?.label ?? config.regionId) : undefined,
          ageRange: config.ageRange ?? undefined,
          gender: config.gender ?? undefined,
          interest: config.interest ?? undefined,
        },
        marketingLanguage: config.language || 'auto',
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (res.status === 429) {
        const data = await res.json()
        set({ generationState: {
          status:  'error',
          message: data.error ?? 'Daily generation limit reached. Try again tomorrow.',
        }})
        return
      }

      if (!res.ok) {
        const data = await res.json()
        set({ generationState: { status: 'error', message: data.error ?? 'Failed to start generation' } })
        return
      }

      const { runId, publicAccessToken } = await res.json()
      get().setRun(runId, publicAccessToken)

    } catch (err) {
      console.error('Generation Error:', err)
      set({ generationState: { status: 'error', message: 'Network error. Please try again.' } })
    }
  }
}))

// ─── Selectors (to fix component errors) ───────────────────────────────────────

export const selectIsGenerating = (s: GenerationStore) => 
  s.generationState.status === 'analyzing' || s.generationState.status === 'generating' || s.generationState.status === 'queued'

export const selectCanGenerate = (s: GenerationStore) => 
  s.generationState.status === 'idle' || s.generationState.status === 'done' || s.generationState.status === 'error'

// ─── Internal run subscriber component ────────────────────────────────────────

interface RunSubscriberProps {
  runId: string
  publicAccessToken: string
}

export function RunSubscriber({ runId, publicAccessToken }: RunSubscriberProps) {
  const setGenerationState = useGenerationStore((s) => s.setGenerationState)
  
  const { run, error } = useRealtimeRun<typeof generatePackTask>(runId, {
    accessToken: publicAccessToken,
  })

  useEffect(() => {
    if (error) {
      setGenerationState({ status: 'error', message: error.message })
      return
    }
    if (!run) return

    const meta = (run.metadata ?? {}) as Record<string, unknown>
    const stage = Number(meta.stage ?? 0)
    const stageMsg = String(meta.stageMessage ?? '')
    const images = (meta.images ?? []) as MetadataImage[]

    switch (run.status) {
      case 'QUEUED':
      case 'DELAYED':
      case 'PENDING_VERSION':
        setGenerationState({ status: 'queued', runId })
        break

      case 'EXECUTING':
        if (stage <= 2) {
          setGenerationState({ status: 'analyzing', runId, stage, stageMessage: stageMsg })
        } else {
          setGenerationState({ status: 'generating', runId, stage, stageMessage: stageMsg, images })
        }
        break

      case 'COMPLETED':
        if (run.output) {
          setGenerationState({ status: 'done', runId, pack: run.output as unknown as GeneratedPack })
        }
        break

      case 'FAILED':
      case 'CRASHED':
      case 'SYSTEM_FAILURE':
      case 'EXPIRED':
      case 'TIMED_OUT':
        setGenerationState({
          status: 'error',
          message: (run as any).error
            ? String((run as any).error)
            : 'Generation failed. Please try again.',
        })
        break

      case 'CANCELED':
        setGenerationState({ status: 'error', message: 'Generation was cancelled.' })
        break
    }
  }, [run, error, runId, setGenerationState])

  return null
}

// ─── Main hook (legacy wrapper) ────────────────────────────────────────────────

export function useGeneration() {
  const { generationState: state, runId, accessToken, startGeneration, reset } = useGenerationStore()
  
  return {
    state,
    runId,
    accessToken,
    startGeneration,
    reset,
  }
}