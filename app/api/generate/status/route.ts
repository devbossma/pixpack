/**
 * app/api/generate/status/route.ts
 *
 * GET /api/generate/status
 *
 * Returns how many generations this IP has remaining today.
 * Called on page load — before the user clicks Generate.
 * Allows the UI to show "2 generations remaining today" proactively
 * and disable the Generate button when limit is reached.
 *
 * No auth required — IP-based only.
 * Read-only — does NOT increment the counter.
 *
 * Response:
 * {
 *   remaining: number   // 0-3
 *   resetInMs: number   // ms until 24h window resets
 *   limited:   boolean  // true when remaining === 0
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRemainingGenerations } from '@/lib/rate-limit'

export const maxDuration = 10

export async function GET(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip')
        ?? '127.0.0.1'

    const { remaining, resetInMs } = await getRemainingGenerations(ip)

    return NextResponse.json({
        remaining,
        resetInMs,
        limited: remaining === 0,
    }, {
        headers: {
            // Cache for 30s — avoids hammering Redis on every render
            // but stays fresh enough to be accurate
            'Cache-Control': 'private, max-age=30',
        },
    })
}