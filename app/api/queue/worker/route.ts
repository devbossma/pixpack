/**
 * app/api/queue/worker/route.ts
 *
 * POST /api/queue/worker
 *
 * Serial job processor. Runs ONE job at a time.
 *
 * KEY FIX — image base64 never stored in Redis:
 *   Upstash has a 10MB request size limit.
 *   4 images × ~3MB base64 each = ~12MB → exceeds limit.
 *
 *   Solution: as each image completes, upload its base64 to Supabase Storage.
 *   Store the public URL in Redis instead. The client loads images from Supabase.
 *   The final pack stored on 'done' also has URLs instead of base64.
 *
 * Flow:
 *   1. Acquire Redis lock (NX) — if locked, another worker is running, exit.
 *   2. Pop next jobId from queue.
 *   3. Mark job as 'processing'.
 *   4. Run generatePack() — onImage callback uploads to Supabase → stores URL in Redis.
 *   5. Mark job as 'done' with lean pack (URLs not base64).
 *   6. Release lock.
 *   7. Self-trigger if more jobs waiting.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
    acquireLock,
    releaseLock,
    dequeueNextJob,
    getJob,
    updateJob,
    appendJobImage,
    requeueJobAtFront,
    recalculatePositions,
    getQueueLength,
} from '@/lib/queue'
import { generatePack } from '@/lib/services/generate.service'
import type { GeneratedImage } from '@/lib/types'

export const maxDuration = 180

// Function deleted because Supabase is no longer used for image temporary storage


// function makeLeanPack deleted as we mutate the images directly now

// ─── Worker handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    // Auth
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${process.env.QUEUE_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Acquire lock
    const locked = await acquireLock()
    if (!locked) {
        console.log('[worker] Already running — exiting')
        return NextResponse.json({ status: 'already_running' })
    }

    let jobId: string | null = null

    try {
        // Pop next job
        jobId = await dequeueNextJob()
        if (!jobId) {
            console.log('[worker] Queue empty — nothing to do')
            await releaseLock()
            return NextResponse.json({ status: 'queue_empty' })
        }

        await recalculatePositions()

        const job = await getJob(jobId)
        if (!job) {
            console.warn(`[worker] Job ${jobId} not found — skipping`)
            await releaseLock()
            return NextResponse.json({ status: 'job_not_found' })
        }

        console.log(`[worker] Processing job ${jobId}`)

        await updateJob(jobId, {
            status: 'processing',
            position: '0',
            startedAt: new Date().toISOString(),
        })

        // Run generation — optionally passing resumeState to skip completed steps
        const result = await generatePack(
            job.input,
            {
                onStage: async (stage: number, message: string) => {
                    await updateJob(jobId!, { stage: String(stage), stageMessage: message })
                    console.log(`[worker] ${jobId} stage ${stage}: ${message}`)
                },

                onImage: async (image: GeneratedImage, base64: string | null) => {
                    console.log(`[worker] ${jobId} variation ${image.variation} (${image.angle}) — processed`)

                    if (base64) {
                        image.imageUrl = `/api/image?jobId=${jobId}&imageId=${image.id}`
                    }

                    await appendJobImage(jobId!, image, base64)
                },
            },
            job.scenesWithCopy ? { scenesWithCopy: job.scenesWithCopy, startImageIndex: job.images?.length ?? 0 } : null
        )

        if (result.status === 'yield') {
            console.log(`[worker] Job ${jobId} yielded to refresh execution timeout`)
            await updateJob(jobId, {
                scenesWithCopy: result.scenesWithCopy,
            })
            await requeueJobAtFront(jobId)
        } else {
            console.log(`[worker] Job ${jobId} done — final merger`)
            
            // Get the final job with ALL images collected across yields
            const finalJob = await getJob(jobId)
            const finalPack = {
              ...result.pack,
              images: finalJob?.images ?? result.pack.images
            }

            await updateJob(jobId, {
                status: 'done',
                finishedAt: new Date().toISOString(),
                pack: finalPack,
            })
        }

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
        await releaseLock()

        // Self-trigger next job
        const remaining = await getQueueLength()
        if (remaining > 0) {
            console.log(`[worker] ${remaining} jobs remaining — self-triggering`)
            fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/queue/worker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.QUEUE_SECRET}`,
                },
            }).catch(err => console.warn('[worker] Self-trigger failed:', err.message))
        }
    }

    return NextResponse.json({ status: 'ok', jobId })
}