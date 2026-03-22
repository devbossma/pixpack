'use client'
/**
 * components/generation/QueuePosition.tsx
 *
 * Shown when status = 'queued'.
 * Displays queue position, estimated wait, and a live countdown.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users } from 'lucide-react'

interface QueuePositionProps {
    position: number   // 1 = you're next
    estimatedWait: number   // seconds
}

export function QueuePosition({ position, estimatedWait }: QueuePositionProps) {
    const [secondsLeft, setSecondsLeft] = useState(estimatedWait)

    // Countdown timer
    useEffect(() => {
        setSecondsLeft(estimatedWait)
        const interval = setInterval(() => {
            setSecondsLeft(s => Math.max(0, s - 1))
        }, 1000)
        return () => clearInterval(interval)
    }, [estimatedWait])

    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    const timeStr = minutes > 0
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 py-10 px-6 text-center"
        >
            {/* Position badge */}
            <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="relative"
            >
                <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-display font-black"
                    style={{
                        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                        color: '#fff',
                        boxShadow: '0 0 40px rgba(255,77,28,0.3)',
                    }}
                >
                    #{position}
                </div>
                <div
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--surface2)', border: '2px solid var(--border)' }}
                >
                    <Users size={13} style={{ color: 'var(--text-muted)' }} />
                </div>
            </motion.div>

            {/* Label */}
            <div>
                <p
                    className="text-xl font-display font-bold mb-1"
                    style={{ color: 'var(--text)' }}
                >
                    {position === 1 ? "You're next!" : `You are #${position} in queue`}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {position === 1
                        ? 'Generation will start in seconds...'
                        : `${position - 1} ${position - 1 === 1 ? 'person' : 'people'} ahead of you`}
                </p>
            </div>

            {/* Countdown */}
            {secondsLeft > 0 && (
                <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                    style={{
                        backgroundColor: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                    }}
                >
                    <Clock size={13} />
                    <span>Estimated wait: <strong style={{ color: 'var(--text)' }}>{timeStr}</strong></span>
                </div>
            )}

            {/* Animated dots */}
            <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: 'var(--accent)' }}
                    />
                ))}
            </div>

            <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
                Your pack is secured in the queue. Each generation takes ~90 seconds.
                {' '}Don't close this tab.
            </p>
        </motion.div>
    )
}