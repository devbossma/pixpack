/**
 * app/api/queue/enqueue/route.ts
 *
 * POST /api/queue/enqueue
 *
 * Called when user clicks "Generate My Pack".
 * Immediately returns { jobId, position } — never blocks.
 *
 * Then triggers the worker (fire-and-forget) if nothing is currently running.
 * The worker processes jobs serially — one at a time — which prevents
 * Google Gemini 429 quota errors from concurrent generation requests.
 *
 * Body: { productProfile, userConfig, marketingLanguage }
 * Response: { jobId: string, position: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import {
    enqueueJob,
    isLocked,
    getQueueLength,
} from '@/lib/queue'
import type { GenerateInput } from '@/lib/services/generate.service'

export const maxDuration = 15

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { productProfile, userConfig, marketingLanguage = 'auto' } = body

        // Validate
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

        // Add job to queue — returns instantly
        const { jobId, position } = await enqueueJob(input)

        console.log(`[enqueue] Job ${jobId} queued at position ${position}`)

        // If no worker is currently running, kick one off (fire-and-forget)
        // We don't await this — the response goes back to the client immediately
        const locked = await isLocked()
        if (!locked) {
            // const workerUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/queue/worker`
            const workerUrl = `http://localhost:3000/api/queue/worker`
            fetch(workerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.QUEUE_SECRET}`,
                },
            }).catch(err => {
                // Non-fatal — worker will be triggered by next poll or next enqueue
                console.warn('[enqueue] Worker trigger failed (non-fatal):', err.message)
            })
        }

        return NextResponse.json({ jobId, position })

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Enqueue failed'
        console.error('[enqueue] Error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}