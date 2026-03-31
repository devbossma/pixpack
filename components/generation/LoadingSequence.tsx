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
import { useState, useEffect } from 'react'
import {
    ScanSearch, Sparkles, BrainCircuit, PenTool, Image as ImageIcon, Lightbulb, Target, BarChart2, Zap, Globe, Rocket
} from 'lucide-react'
import { QueuePosition } from './QueuePosition'
import type { GeneratedImage } from '@/lib/types'
import type { GenerationState } from '@/hooks/useGeneration'
import { getImageSrc } from '@/lib/image-src'

const STEPS = [
    { id: 'analyzing', icon: ScanSearch, title: 'Analyzing product', subtitle: 'Reading materials, style & audience' },
    { id: 'startup', icon: Sparkles, title: 'Initializing pipeline', subtitle: 'Waking up generation agents' },
    { id: 'creative', icon: BrainCircuit, title: 'Creative Director Agent', subtitle: 'Designing 4 distinct scene concepts' },
    { id: 'copy', icon: PenTool, title: 'Copywriter Agent', subtitle: 'Drafting variations aligned with brand voice' },
    { id: 'images', icon: ImageIcon, title: 'Studio Generation', subtitle: 'Rendering high-resolution product photography' },
]

const LOADING_FACTS = [
    { icon: Lightbulb, text: '4 variations = 4 genuine A/B tests. Same product, 4 different creative angles.' },
    { icon: Target, text: 'Each variation has its own copy — lifestyle copy feels different from hero copy.' },
    { icon: BarChart2, text: 'A/B testing one platform beats scattering across 6 every time.' },
    { icon: Zap, text: 'Images stream as they complete — you\'ll see the first one in ~15 seconds.' },
    { icon: Globe, text: 'Ad copy is culturally adapted for your target market and audience.' },
    { icon: Rocket, text: 'Ready to upload directly to Ads Manager when done.' },
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
        : state.status === 'generating' ? Math.min((state.stage ?? 0) + 2, STEPS.length)
            : 0

    const images: GeneratedImage[] = state.status === 'generating' ? state.images : []

    // Cycle through loading facts
    const [factIndex, setFactIndex] = useState(0)
    useEffect(() => {
        const id = setInterval(() => setFactIndex(i => (i + 1) % LOADING_FACTS.length), 6000)
        return () => clearInterval(id)
    }, [])
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

            {/* Loading fact — animated ticker */}
            <div
                className="px-6 py-3 border-t overflow-hidden bg-[var(--surface2)]/50"
                style={{ borderColor: 'var(--border)', minHeight: '40px' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={factIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2 text-xs"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <currentFact.icon size={13} className="text-[var(--accent)] opacity-70 flex-shrink-0" />
                        <p className="leading-tight">{currentFact.text}</p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    )
}