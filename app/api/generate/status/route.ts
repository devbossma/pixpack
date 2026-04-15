/**
 * app/api/generate/status/route.ts
 *
 * GET /api/generate/status
 *
 * Protected — requires authenticated user.
 *
 * Returns how many generations this user has remaining today.
 * Uses email-based rate limiting for authenticated users.
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
import { getAuthUser } from '@/lib/supabase-auth'

export const maxDuration = 10

export async function GET(request: NextRequest) {
    // Auth check
    const user = await getAuthUser()
    if (!user) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 },
        )
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip')
        ?? '127.0.0.1'

    const { remaining, resetInMs } = await getRemainingGenerations(ip, user.email)

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