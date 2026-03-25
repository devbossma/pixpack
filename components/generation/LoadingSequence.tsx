'use client'
/**
 * components/generation/LoadingSequence.tsx
 *
 * Shown during the full generation flow: queued → analyzing → generating.
 *
 * States:
 *   queued     → QueuePosition component ("You are #3 in queue")
 *   analyzing  → step 1-2 progress (Creative Director + Ad Copy)
 *   generating → step 3 progress + progressive image thumbnails
 */

import { motion, AnimatePresence } from 'framer-motion'
import {
    ScanSearch, Wand2, MessageSquare, Image as ImageIcon, Package,
} from 'lucide-react'
import { QueuePosition } from './QueuePosition'
import type { GeneratedImage } from '@/lib/types'
import type { GenerationState } from '@/hooks/useGeneration'
import { getImageSrc } from '@/lib/image-src'

const STEPS = [
    { id: 'analyzing', icon: ScanSearch, title: 'Analyzing product', subtitle: 'Reading materials, style & target audience' },
    { id: 'creative', icon: Wand2, title: 'Building 4 creative concepts', subtitle: 'Lifestyle, hero, context, and closeup angles' },
    { id: 'copy', icon: MessageSquare, title: 'Writing ad copy', subtitle: '3 copy variants per variation' },
    { id: 'images', icon: ImageIcon, title: 'Generating 4 images', subtitle: 'Streaming as each completes — ~15s each' },
    { id: 'assembling', icon: Package, title: 'Assembling your pack', subtitle: 'Almost ready...' },
]

const LOADING_FACTS = [
    '💡 4 variations = 4 genuine A/B tests. Same product, 4 different creative angles.',
    '🎯 Each variation has its own copy — lifestyle copy feels different from hero copy.',
    '📊 A/B testing one platform beats scattering across 6 every time.',
    '⚡ Images stream as they complete — you\'ll see the first one in ~15 seconds.',
  '🌍 Ad copy is culturally adapted for your target market and audience.',
    '🚀 Ready to upload directly to Ads Manager when done.',
]

interface LoadingSequenceProps {
    state: GenerationState & { status: 'queued' | 'analyzing' | 'generating' }
}

export function LoadingSequence({ state }: LoadingSequenceProps) {
    // ── Queue waiting ──────────────────────────────────────────────────────────
    if (state.status === 'queued') {
        return (
            <div
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
                <QueuePosition
                    position={state.position ?? 1}
                    estimatedWait={state.estimatedWait ?? 0}
                />
            </div>
        )
    }

    // ── Active generation ──────────────────────────────────────────────────────
    const currentStep = state.status === 'analyzing' ? 1
        : state.status === 'generating' ? (state.stage ?? 3)
            : 0

    const images: GeneratedImage[] = state.status === 'generating' ? state.images : []

    // Cycle through loading facts
    const factIndex = Math.floor(Date.now() / 6000) % LOADING_FACTS.length
    const currentFact = LOADING_FACTS[factIndex]

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
            {/* Steps */}
            <div className="p-6 space-y-3">
                {STEPS.map((step, i) => {
                    const stepNum = i + 1
                    const isActive = stepNum === currentStep
                    const isDone = stepNum < currentStep

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: isDone || isActive ? 1 : 0.35, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="flex items-center gap-3"
                        >
                            {/* Icon */}
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                                style={{
                                    backgroundColor: isDone
                                        ? 'rgba(0,194,122,0.15)'
                                        : isActive
                                            ? 'rgba(255,77,28,0.15)'
                                            : 'var(--surface2)',
                                    border: `1px solid ${isDone ? 'rgba(0,194,122,0.3)' : isActive ? 'rgba(255,77,28,0.3)' : 'var(--border)'}`,
                                }}
                            >
                                {isDone ? (
                                    <motion.svg
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        width="14" height="14" viewBox="0 0 14 14" fill="none"
                                    >
                                        <path d="M2.5 7L5.5 10L11.5 4" stroke="var(--accent3)" strokeWidth="2" strokeLinecap="round" />
                                    </motion.svg>
                                ) : (
                                    <step.icon
                                        size={14}
                                        style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                                        className={isActive ? 'animate-pulse' : ''}
                                    />
                                )}
                            </div>

                            {/* Label */}
                            <div className="min-w-0">
                                <p
                                    className="text-xs font-semibold leading-tight"
                                    style={{ color: isDone || isActive ? 'var(--text)' : 'var(--text-muted)' }}
                                >
                                    {step.title}
                                </p>
                                {isActive && (
                                    <motion.p
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="text-xs mt-0.5"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        {state.status === 'generating' && state.stageMessage
                                            ? state.stageMessage
                                            : step.subtitle}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Image thumbnails — appear as generation runs */}
            <AnimatePresence>
                {images.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="px-6 pb-4"
                    >
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                            {images.length} of 4 ready
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3].map(i => {
                                const img = images[i]
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: img ? 1 : 0.25, scale: 1 }}
                                        transition={{ delay: 0.05 }}
                                        className="aspect-square rounded-lg overflow-hidden"
                                        style={{
                                            backgroundColor: 'var(--surface2)',
                                            border: '1px solid var(--border)',
                                        }}
                                    >
                                        {img && img.status === 'done' && getImageSrc(img) && (
                                            <img
                                                src={getImageSrc(img)!}
                                                alt={`Variation ${i + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        {img?.status === 'error' && (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>✗</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading fact */}
            <div
                className="px-6 py-3 border-t text-xs"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
                {currentFact}
            </div>
        </motion.div>
    )
}