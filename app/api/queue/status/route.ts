/**
 * app/api/queue/status/route.ts
 *
 * GET /api/queue/status?jobId=xxx
 *
 * Polled by the client every 2 seconds to check job progress.
 *
 * Returns the full job state including any images collected so far.
 * The client renders images progressively as they appear in the response —
 * simulating the SSE streaming experience via polling.
 *
 * Response shape:
 * {
 *   status:       'queued' | 'processing' | 'done' | 'failed'
 *   position:     number   (queue position — 0 when processing/done)
 *   stage:        number   (1|2|3 — which pipeline stage is running)
 *   stageMessage: string
 *   images:       GeneratedImage[]  (grows as worker completes each image)
 *   pack:         GeneratedPack     (only present when status='done')
 *   error:        string            (only present when status='failed')
 *   estimatedWaitSeconds: number    (rough ETA for queued jobs)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '@/lib/queue'

export const maxDuration = 10

// Rough estimate: each job takes ~100 seconds
const SECONDS_PER_JOB = 100

export async function GET(request: NextRequest) {
    const jobId = request.nextUrl.searchParams.get('jobId')

    if (!jobId) {
        return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const job = await getJob(jobId)

    if (!job) {
        return NextResponse.json({ error: 'Job not found or expired' }, { status: 404 })
    }

    const estimatedWaitSeconds = job.status === 'queued'
        ? job.position * SECONDS_PER_JOB
        : 0

    return NextResponse.json({
        status: job.status,
        position: job.position,
        stage: job.stage ?? 0,
        stageMessage: job.stageMessage ?? '',
        images: job.images ?? [],
        pack: job.pack,
        error: job.error,
        estimatedWaitSeconds,
    }, {
        // No caching — always fresh
        headers: { 'Cache-Control': 'no-store' },
    })
}