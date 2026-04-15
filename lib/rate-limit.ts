/**
 * lib/rate-limit.ts
 *
 * Rate limiting for generation.
 * Uses Upstash Redis — INCR + EXPIRE, purpose-built for this.
 *
 * Dual mode:
 *   - Authenticated: 3 generations per email per 24 hours (primary)
 *   - Fallback: 3 generations per IP per 24 hours (belt-and-suspenders)
 *
 * If Redis is down, fails open (don't block users for infra issues).
 */

import redis from './redis'

const MAX_PER_DAY = 3
const WINDOW_SECONDS = 60 * 60 * 24

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetInMs: number
    reason?: string
}

function genKeyByEmail(email: string): string {
    return `ratelimit:gen:email:${email.toLowerCase()}`
}

function genKeyByIp(ip: string): string {
    return `ratelimit:gen:ip:${ip}`
}

/**
 * Check generation limit.
 * When `email` is provided, uses email-based limiting (preferred for authenticated users).
 * Always falls back to IP-based as a secondary check.
 */
export async function checkGenerationLimit(
    ip: string,
    email?: string,
): Promise<RateLimitResult> {
    try {
        // Primary: email-based (for authenticated users)
        if (email) {
            const emailKey = genKeyByEmail(email)
            const emailCount = await redis.incr(emailKey)
            if (emailCount === 1) await redis.expire(emailKey, WINDOW_SECONDS)

            const ttl = await redis.ttl(emailKey)
            const resetInMs = ttl > 0 ? ttl * 1000 : WINDOW_SECONDS * 1000

            if (emailCount > MAX_PER_DAY) {
                return {
                    allowed: false,
                    remaining: 0,
                    resetInMs,
                    reason: `Daily limit reached. You can generate ${MAX_PER_DAY} packs per day. Resets in ${formatResetTime(resetInMs)}.`,
                }
            }

            return {
                allowed: true,
                remaining: MAX_PER_DAY - emailCount,
                resetInMs,
            }
        }

        // Fallback: IP-based (shouldn't normally be hit with auth, but kept for safety)
        const ipKey = genKeyByIp(ip)
        const count = await redis.incr(ipKey)
        if (count === 1) await redis.expire(ipKey, WINDOW_SECONDS)

        const ttl = await redis.ttl(ipKey)
        const resetInMs = ttl > 0 ? ttl * 1000 : WINDOW_SECONDS * 1000

        if (count > MAX_PER_DAY) {
            return {
                allowed: false,
                remaining: 0,
                resetInMs,
                reason: `Daily limit reached. You can generate ${MAX_PER_DAY} packs per day. Resets in ${formatResetTime(resetInMs)}.`,
            }
        }

        return {
            allowed: true,
            remaining: MAX_PER_DAY - count,
            resetInMs,
        }

    } catch (err) {
        console.error('[rate-limit] Redis error — failing open:', err)
        return { allowed: true, remaining: 1, resetInMs: WINDOW_SECONDS * 1000 }
    }
}

/**
 * Get remaining generations without incrementing.
 * When `email` is provided, checks email-based counter.
 */
export async function getRemainingGenerations(
    ip: string,
    email?: string,
): Promise<{
    remaining: number
    resetInMs: number
}> {
    try {
        // Use email-based counter if available
        const key = email ? genKeyByEmail(email) : genKeyByIp(ip)
        const raw = await redis.get<number>(key)
        const count = raw ?? 0
        const ttl = await redis.ttl(key)
        const resetInMs = ttl > 0 ? ttl * 1000 : WINDOW_SECONDS * 1000
        return { remaining: Math.max(0, MAX_PER_DAY - count), resetInMs }
    } catch {
        return { remaining: MAX_PER_DAY, resetInMs: WINDOW_SECONDS * 1000 }
    }
}

function formatResetTime(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
}