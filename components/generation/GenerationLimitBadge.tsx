'use client'
/**
 * components/generation/GenerationLimitBadge.tsx
 *
 * Shows the user how many generations they have left today.
 * Displayed near the GenerateBar so the user sees it before clicking.
 *
 * States:
 *   loading   → nothing shown (avoids layout shift)
 *   3 left    → nothing shown (full quota, no need to warn)
 *   2 left    → subtle gray pill: "2 generations remaining today"
 *   1 left    → amber pill: "1 generation remaining today"
 *   0 left    → red banner: "Daily limit reached · Resets in 4h 23m"
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Zap } from 'lucide-react'
import { formatResetTime } from '@/hooks/useGenerationLimit'

interface GenerationLimitBadgeProps {
    remaining: number
    resetInMs: number
    limited: boolean
    loading: boolean
}

export function GenerationLimitBadge({
    remaining,
    resetInMs,
    limited,
    loading,
}: GenerationLimitBadgeProps) {
    // Don't show anything while loading or when at full quota
    if (loading || remaining >= 3) return null

    if (limited) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                    style={{
                        backgroundColor: 'rgba(255,77,28,0.1)',
                        border: '1px solid rgba(255,77,28,0.3)',
                        color: 'var(--accent)',
                    }}
                >
                    <Clock size={13} />
                    <span>
                        Daily limit reached
                        {resetInMs > 0 && (
                            <> · Resets in <strong>{formatResetTime(resetInMs)}</strong></>
                        )}
                    </span>
                </motion.div>
            </AnimatePresence>
        )
    }

    // 1 or 2 remaining — show a subtle warning
    const isLow = remaining === 1
    const color = isLow ? '#ffb800' : 'var(--text-muted)'
    const bgColor = isLow ? 'rgba(255,184,0,0.08)' : 'var(--surface2)'
    const border = isLow ? '1px solid rgba(255,184,0,0.2)' : '1px solid var(--border)'

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: bgColor, border, color }}
            >
                <Zap size={11} />
                <span>
                    {remaining} generation{remaining !== 1 ? 's' : ''} remaining today
                </span>
            </motion.div>
        </AnimatePresence>
    )
}
/**
 * ─── HOW TO WIRE INTO app/page.tsx ───────────────────────────────────────────
 *
 * import { useGenerationLimit }      from '@/hooks/useGenerationLimit'
 * import { GenerationLimitBadge }    from '@/components/generation/GenerationLimitBadge'
 *
 * export default function Page() {
 *   const limit = useGenerationLimit()
 *   const gen   = useGeneration()
 *
 *   async function handleGenerate(input: StartGenerationInput) {
 *     if (limit.limited) return   // blocked at UI level too
 *     await gen.startGeneration(input)
 *     limit.decrementRemaining()  // update local count instantly
 *   }
 *
 *   return (
 *     <>
 *       ... your page ...
 *
 *       // Show badge above the GenerateBar:
 *       <GenerationLimitBadge
 *         remaining={limit.remaining}
 *         resetInMs={limit.resetInMs}
 *         limited={limit.limited}
 *         loading={limit.loading}
 *       />
 *
 *       // Pass limited to GenerateBar to disable the button:
 *       <GenerateBar
 *         disabled={limit.limited}
 *         onGenerate={handleGenerate}
 *       />
 *     </>
 *   )
 * }
 *
 * ─── HOW TO UPDATE GenerateBar.tsx ───────────────────────────────────────────
 *
 * Add a `disabled` prop:
 *
 * interface GenerateBarProps {
 *   disabled?: boolean
 *   onGenerate: (input: StartGenerationInput) => void
 * }
 *
 * // In the button:
 * <motion.button
 *   disabled={disabled || isGenerating}
 *   onClick={onGenerate}
 *   style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
 * >
 *   {disabled ? 'Daily limit reached' : 'Generate 4 Variations →'}
 * </motion.button>
 */