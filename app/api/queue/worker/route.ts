/**
 * app/api/queue/worker/route.ts
 *
 * POST /api/queue/worker
 *
 * The serial job processor. Runs ONE job at a time.
 *
 * Flow:
 *   1. Acquire lock (Redis NX) — if locked, another worker is running, exit.
 *   2. Pop next jobId from queue list.
 *   3. Mark job as 'processing'.
 *   4. Run generatePack() — callbacks write images to Redis as they complete.
 *      → Clients polling /api/queue/status see images appear in real-time.
 *   5. Mark job as 'done' (or 'failed').
 *   6. Release lock.
 *   7. If more jobs are waiting, self-trigger (fire-and-forget fetch to self).
 *
 * Self-triggering means no cron job is needed.
 * Each completed job kicks off the next one automatically.
 *
 * Security: requires Authorization: Bearer {QUEUE_SECRET} header.
 * This prevents random internet requests from triggering the worker.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
    acquireLock,
    releaseLock,
    dequeueNextJob,
    getJob,
    updateJob,
    appendJobImage,
    recalculatePositions,
    getQueueLength,
} from '@/lib/queue'
import { generatePack } from '@/lib/services/generate.service'

export const maxDuration = 180

export async function POST(request: NextRequest) {
    // ── Auth check ────────────────────────────────────────────────────────────
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${process.env.QUEUE_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Acquire lock ──────────────────────────────────────────────────────────
    const locked = await acquireLock()
    if (!locked) {
        console.log('[worker] Already running — exiting')
        return NextResponse.json({ status: 'already_running' })
    }

    let jobId: string | null = null

    try {
        // ── Pop next job ────────────────────────────────────────────────────────
        jobId = await dequeueNextJob()
        if (!jobId) {
            console.log('[worker] Queue empty — nothing to do')
            await releaseLock()
            return NextResponse.json({ status: 'queue_empty' })
        }

        // Recalculate positions for remaining queued jobs
        await recalculatePositions()

        // ── Load job ────────────────────────────────────────────────────────────
        const job = await getJob(jobId)
        if (!job) {
            console.warn(`[worker] Job ${jobId} not found in Redis — skipping`)
            await releaseLock()
            return NextResponse.json({ status: 'job_not_found' })
        }

        console.log(`[worker] Processing job ${jobId}`)

        // ── Mark as processing ──────────────────────────────────────────────────
        await updateJob(jobId, {
            status: 'processing',
            position: '0',
            startedAt: new Date().toISOString(),
        })

        // ── Run generation ──────────────────────────────────────────────────────
        // Callbacks write progress into Redis so the status poller can relay it.
        // When USE_SSE=false, the client polls /api/queue/status to get images.
        // When USE_SSE=true, the client also opens an SSE connection to /api/queue/stream.

        const pack = await generatePack(
            job.input,
            {
                onStage: async (stage: number, message: string) => {
                    await updateJob(jobId!, { stage: String(stage), stageMessage: message })
                    console.log(`[worker] ${jobId} stage ${stage}: ${message}`)
                },
                onImage: async (image) => {
                    await appendJobImage(jobId!, image)
                    console.log(`[worker] ${jobId} image ${image.variation} (${image.angle}) saved`)
                },
            },
        )

        // ── Mark as done ────────────────────────────────────────────────────────
        await updateJob(jobId, {
            status: 'done',
            finishedAt: new Date().toISOString(),
            pack: JSON.stringify(pack),
        })

        console.log(`[worker] Job ${jobId} done`)

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Generation failed'
        console.error(`[worker] Job ${jobId} failed:`, message)

        if (jobId) {
            await updateJob(jobId, {
                status: 'failed',
                finishedAt: new Date().toISOString(),
                error: message,
            })
        }

    } finally {
        // ── Release lock ────────────────────────────────────────────────────────
        await releaseLock()

        // ── Self-trigger if more jobs are waiting ───────────────────────────────
        // Fire-and-forget — we don't await this, response goes back first
        const remaining = await getQueueLength()
        if (remaining > 0) {
            console.log(`[worker] ${remaining} jobs remaining — self-triggering`)
            const workerUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/queue/worker`
            fetch(workerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.QUEUE_SECRET}`,
                },
            }).catch(err => {
                console.warn('[worker] Self-trigger failed:', err.message)
            })
        }
    }

    return NextResponse.json({ status: 'ok', jobId })
}