/**
 * app/api/generate/route.ts
 *
 * POST /api/generate
 *
 * Protected — requires authenticated user.
 *
 * Flow:
 *   1. Verify auth (via Supabase session)
 *   2. Rate limit (email-based, 3/day)
 *   3. Validate input
 *   4. Trigger the Trigger.dev task (non-blocking, returns instantly)
 *   5. Return { runId, publicAccessToken } to client
 *
 * The client uses runId + publicAccessToken to subscribe via useRealtimeRun.
 * The task runs on Trigger.dev's infrastructure — no Vercel timeout risk.
 */

import { NextRequest, NextResponse } from 'next/server'
import { tasks } from '@trigger.dev/sdk/v3'
import type { generatePackTask } from '@/trigger/generate-pack'
import type { GenerateInput } from '@/lib/services/generate.service'
import { checkGenerationLimit } from '@/lib/rate-limit'
import { getAuthUser } from '@/lib/supabase-auth'

export const maxDuration = 15  // Just needs to trigger the task — very fast

export async function POST(request: NextRequest) {
    // 1. Auth check
    const user = await getAuthUser()
    if (!user) {
        return NextResponse.json(
            { error: 'Authentication required. Please sign in.' },
            { status: 401 },
        )
    }

    // 2. Rate limit (email-based)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip')
        ?? '127.0.0.1'

    const limit = await checkGenerationLimit(ip, user.email)

    if (!limit.allowed) {
        return NextResponse.json(
            { error: limit.reason, limited: true, resetInMs: limit.resetInMs },
            { status: 429 },
        )
    }

    // 3. Validate & trigger
    try {
        const body = await request.json()
        const { productProfile, userConfig, marketingLanguage = 'auto' } = body

        if (!productProfile?.extractedImageUrl) {
            return NextResponse.json(
                { error: 'productProfile.extractedImageUrl is required' },
                { status: 400 },
            )
        }
        if (!userConfig?.platform) {
            return NextResponse.json(
                { error: 'userConfig.platform is required' },
                { status: 400 },
            )
        }

        const input: GenerateInput = { productProfile, userConfig, marketingLanguage }

        // 4. Trigger the task — returns immediately with a handle
        const handle = await tasks.trigger<typeof generatePackTask>(
            'generate-pack',
            { input },
        )

        return NextResponse.json({
            runId: handle.id,
            publicAccessToken: handle.publicAccessToken,
        })

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to start generation'
        console.error('[generate] Error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}