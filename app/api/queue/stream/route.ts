/**
 * app/api/queue/stream/route.ts
 *
 * GET /api/queue/stream?jobId=xxx
 *
 * Optional SSE stream for a queued job.
 * Only used when USE_SSE=true in environment.
 *
 * Instead of the client running generatePack() directly (old architecture),
 * the worker runs it and writes results to Redis.
 * This route reads from Redis and forwards events to the client as SSE.
 *
 * It polls Redis every 1 second and emits:
 *   { type: 'queued',     position: number, estimatedWait: number }
 *   { type: 'stage',      stage: number, message: string }
 *   { type: 'image',      image: GeneratedImage }   ← emitted as each new image appears
 *   { type: 'done',       pack: GeneratedPack }
 *   { type: 'error',      message: string }
 *
 * The client's useGeneration hook reads these events exactly like the old
 * /api/generate SSE stream — the hook doesn't know the difference.
 * Only the source changed (direct execution → Redis-backed queue).
 */

import { NextRequest } from 'next/server'
import { getJob } from '@/lib/queue'
import type { GeneratedImage } from '@/lib/types'

export const maxDuration = 180

const POLL_INTERVAL_MS = 1_000   // check Redis every 1s
const MAX_WAIT_MS = 170_000 // stop after 170s (10s safety before Vercel 180s limit)

export async function GET(request: NextRequest) {
    const jobId = request.nextUrl.searchParams.get('jobId')

    if (!jobId) {
        return new Response('jobId is required', { status: 400 })
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        async start(controller) {
            function send(data: Record<string, unknown>) {
                const chunk = `data: ${JSON.stringify(data)}\n\n`
                controller.enqueue(encoder.encode(chunk))
            }

            const startMs = Date.now()
            let lastImageCount = 0
            let lastStage = 0
            let done = false

            while (!done && (Date.now() - startMs) < MAX_WAIT_MS) {
                // Check if client disconnected
                if (request.signal.aborted) break

                const job = await getJob(jobId)

                if (!job) {
                    send({ type: 'error', message: 'Job not found or expired' })
                    break
                }

                // ── Emit queue position while waiting ──────────────────────────────
                if (job.status === 'queued') {
                    send({
                        type: 'queued',
                        position: job.position,
                        estimatedWait: job.position * 100,
                    })
                }

                // ── Emit stage changes ─────────────────────────────────────────────
                const currentStage = Number(job.stage ?? 0)
                if (currentStage > lastStage) {
                    send({
                        type: 'stage',
                        stage: currentStage,
                        message: job.stageMessage ?? '',
                    })
                    lastStage = currentStage
                }

                // ── Emit new images as they arrive in Redis ─────────────────────────
                const images: GeneratedImage[] = job.images ?? []
                if (images.length > lastImageCount) {
                    const newImages = images.slice(lastImageCount)
                    for (const image of newImages) {
                        send({ type: 'image', image })
                    }
                    lastImageCount = images.length
                }

                // ── Terminal states ────────────────────────────────────────────────
                if (job.status === 'done') {
                    send({ type: 'done', pack: job.pack })
                    done = true
                    break
                }

                if (job.status === 'failed') {
                    send({ type: 'error', message: job.error ?? 'Generation failed' })
                    done = true
                    break
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
            }

            if (!done) {
                send({ type: 'error', message: 'Stream timeout — please check your email for results.' })
            }

            controller.close()
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    })
}