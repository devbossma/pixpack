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
 * Limits by BOTH IP and email (if provided) to prevent users from bypassing
 * limits by creating multiple accounts on the same IP.
 */
export async function checkGenerationLimit(
    ip: string,
    email?: string,
): Promise<RateLimitResult> {
    try {
        // 1. Always check and increment IP count
        const ipKey = genKeyByIp(ip)
        const ipCount = await redis.incr(ipKey)
        if (ipCount === 1) await redis.expire(ipKey, WINDOW_SECONDS)

        // 2. Check and increment Email count (if provided)
        let emailCount = 0
        let emailKey = ''
        if (email) {
            emailKey = genKeyByEmail(email)
            emailCount = await redis.incr(emailKey)
            if (emailCount === 1) await redis.expire(emailKey, WINDOW_SECONDS)
        }

        // 3. Resolve TTLs to determine the highest wait time
        const ipTtl = await redis.ttl(ipKey)
        const ipResetInMs = ipTtl > 0 ? ipTtl * 1000 : WINDOW_SECONDS * 1000

        let emailResetInMs = WINDOW_SECONDS * 1000
        if (email) {
            const emailTtl = await redis.ttl(emailKey)
            emailResetInMs = emailTtl > 0 ? emailTtl * 1000 : WINDOW_SECONDS * 1000
        }

        const resetInMs = email ? Math.max(ipResetInMs, emailResetInMs) : ipResetInMs

        // 4. Block if EITHER IP or Email exceeded the daily limit.
        // We use `> MAX_PER_DAY` because `ipCount`/`emailCount` already includes the current request.
        // So for MAX_PER_DAY=3, counts 1, 2, 3 are allowed. 4 is blocked.
        if (ipCount > MAX_PER_DAY || (email && emailCount > MAX_PER_DAY)) {
            return {
                allowed: false,
                remaining: 0,
                resetInMs,
                reason: `Daily limit reached. You can generate ${MAX_PER_DAY} packs per day. Resets in ${formatResetTime(resetInMs)}.`,
            }
        }

        // 5. Success. The remaining is whatever boundary is most restricted.
        const remaining = email
            ? Math.min(MAX_PER_DAY - ipCount, MAX_PER_DAY - emailCount)
            : MAX_PER_DAY - ipCount

        return {
            allowed: true,
            remaining: Math.max(0, remaining),
            resetInMs,
        }

    } catch (err) {
        console.error('[rate-limit] Redis error — failing open:', err)
        return { allowed: true, remaining: 1, resetInMs: WINDOW_SECONDS * 1000 }
    }
}

/**
 * Get remaining generations without incrementing.
 * Checks both IP and email boundaries and returns the stricter of the two.
 */
export async function getRemainingGenerations(
    ip: string,
    email?: string,
): Promise<{
    remaining: number
    resetInMs: number
}> {
    try {
        const ipKey = genKeyByIp(ip)
        const rawIp = await redis.get<number>(ipKey)
        const ipCount = rawIp ?? 0
        const ipTtl = await redis.ttl(ipKey)
        const ipResetInMs = ipTtl > 0 ? ipTtl * 1000 : WINDOW_SECONDS * 1000

        if (email) {
            const emailKey = genKeyByEmail(email)
            const rawEmail = await redis.get<number>(emailKey)
            const emailCount = rawEmail ?? 0
            const emailTtl = await redis.ttl(emailKey)
            const emailResetInMs = emailTtl > 0 ? emailTtl * 1000 : WINDOW_SECONDS * 1000

            const remaining = Math.min(MAX_PER_DAY - ipCount, MAX_PER_DAY - emailCount)
            return {
                remaining: Math.max(0, remaining),
                resetInMs: Math.max(ipResetInMs, emailResetInMs)
            }
        }

        return {
            remaining: Math.max(0, MAX_PER_DAY - ipCount),
            resetInMs: ipResetInMs
        }
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