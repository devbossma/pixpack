'use client'
/**
 * hooks/useGenerationLimit.ts
 *
 * Tracks how many generations the user has remaining today.
 *
 * Fetches from GET /api/generate/status on mount.
 * Updates locally after each successful generation (no extra fetch needed).
 * Re-fetches if the tab was hidden for >5 minutes (user came back next day).
 *
 * Usage:
 *   const { remaining, limited, resetInMs, loading } = useGenerationLimit()
 *
 *   // In GenerateBar:
 *   <button disabled={limited || loading}>
 *     {limited ? `Limit reached — resets in ${formatReset(resetInMs)}` : 'Generate 4 Variations →'}
 *   </button>
 *
 *   // Counter anywhere:
 *   {!loading && <p>{remaining} generation{remaining !== 1 ? 's' : ''} remaining today</p>}
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface GenerationLimitState {
    remaining: number
    resetInMs: number
    limited: boolean
    loading: boolean
}

export function useGenerationLimit() {
    const [state, setState] = useState<GenerationLimitState>({
        remaining: 3,       // optimistic default — real value arrives quickly
        resetInMs: 0,
        limited: false,
        loading: true,
    })

    const lastFetchRef = useRef<number>(0)
    const hiddenAtRef = useRef<number>(0)

    const fetchLimit = useCallback(async () => {
        try {
            const res = await fetch('/api/generate/status')
            if (!res.ok) return
            const data = await res.json()
            lastFetchRef.current = Date.now()
            setState({
                remaining: data.remaining,
                resetInMs: data.resetInMs,
                limited: data.limited,
                loading: false,
            })
        } catch {
            // Fail open — don't block the user if status fetch fails
            setState(prev => ({ ...prev, loading: false }))
        }
    }, [])

    // Fetch on mount
    useEffect(() => {
        fetchLimit()
    }, [fetchLimit])

    // Re-fetch when tab becomes visible after being hidden for >5 minutes
    // (user may have come back the next day — limit may have reset)
    useEffect(() => {
        function onVisibilityChange() {
            if (document.hidden) {
                hiddenAtRef.current = Date.now()
            } else {
                const hiddenFor = Date.now() - hiddenAtRef.current
                if (hiddenFor > 5 * 60 * 1000) {
                    fetchLimit()
                }
            }
        }
        document.addEventListener('visibilitychange', onVisibilityChange)
        return () => document.removeEventListener('visibilitychange', onVisibilityChange)
    }, [fetchLimit])

    /**
     * Call this after a successful generation starts.
     * Decrements the local count instantly — no network round-trip needed.
     * The server already incremented on enqueue.
     */
    const decrementRemaining = useCallback(() => {
        setState(prev => {
            const next = Math.max(0, prev.remaining - 1)
            return { ...prev, remaining: next, limited: next === 0 }
        })
    }, [])

    return { ...state, decrementRemaining, refetch: fetchLimit }
}

/**
 * Format the reset countdown for display.
 * e.g. 3661000ms → "1h 1m"
 */
export function formatResetTime(ms: number): string {
    if (ms <= 0) return 'soon'
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h`
    if (minutes > 0) return `${minutes}m`
    return 'less than a minute'
}