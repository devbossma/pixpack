/**
 * lib/rate-limit.ts
 *
 * IP-based rate limiting for generation.
 * Uses Upstash Redis — INCR + EXPIRE, purpose-built for this.
 *
 * 3 generations per IP per 24 hours.
 * If Redis is down, fails open (don't block users for infra issues).
 */

import redis from './redis'

const MAX_PER_IP_PER_DAY = 3
const WINDOW_SECONDS = 60 * 60 * 24

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetInMs: number
    reason?: string
}

function genKey(ip: string): string {
    return `ratelimit:gen:${ip}`
}

export async function checkGenerationLimit(ip: string): Promise<RateLimitResult> {
    const key = genKey(ip)

    try {
        const count = await redis.incr(key)
        if (count === 1) await redis.expire(key, WINDOW_SECONDS)

        const ttl = await redis.ttl(key)
        const resetInMs = ttl > 0 ? ttl * 1000 : WINDOW_SECONDS * 1000

        if (count > MAX_PER_IP_PER_DAY) {
            return {
                allowed: false,
                remaining: 0,
                resetInMs,
                reason: `Daily limit reached. You can generate ${MAX_PER_IP_PER_DAY} packs per day. Resets in ${formatResetTime(resetInMs)}.`,
            }
        }

        return {
            allowed: true,
            remaining: MAX_PER_IP_PER_DAY - count,
            resetInMs,
        }

    } catch (err) {
        console.error('[rate-limit] Redis error — failing open:', err)
        return { allowed: true, remaining: 1, resetInMs: WINDOW_SECONDS * 1000 }
    }
}

export async function getRemainingGenerations(ip: string): Promise<{
    remaining: number
    resetInMs: number
}> {
    const key = genKey(ip)
    try {
        const raw = await redis.get<number>(key)
        const count = raw ?? 0
        const ttl = await redis.ttl(key)
        const resetInMs = ttl > 0 ? ttl * 1000 : WINDOW_SECONDS * 1000
        return { remaining: Math.max(0, MAX_PER_IP_PER_DAY - count), resetInMs }
    } catch {
        return { remaining: MAX_PER_IP_PER_DAY, resetInMs: WINDOW_SECONDS * 1000 }
    }
}

function formatResetTime(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}