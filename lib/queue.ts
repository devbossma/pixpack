/**
 * lib/queue.ts
 *
 * Redis-backed generation queue using Upstash.
 *
 * Data model in Redis:
 *
 *   queue:pending          → Redis LIST  — jobIds waiting to run (LPUSH / RPOP)
 *   queue:job:{jobId}      → Redis HASH  — full job record
 *   queue:lock             → Redis STRING — set while a worker is running (prevents double-processing)
 *
 * Job lifecycle:
 *   queued → processing → done | failed
 *
 * A job record (HASH fields):
 *   status        queued | processing | done | failed
 *   position      number (1 = next up)  — only meaningful while queued
 *   jobId         UUID
 *   createdAt     ISO string
 *   startedAt     ISO string (set when processing begins)
 *   finishedAt    ISO string (set when done or failed)
 *   input         JSON string — GenerateInput
 *   pack          JSON string — GeneratedPack (set when done)
 *   error         string (set when failed)
 *   sseEvents     JSON string — GeneratedImage[] collected during processing
 *                 used so the status poll can replay images to the client
 */

import { Redis } from '@upstash/redis'
import type { GeneratedImage, GeneratedPack } from './types'
import type { GenerateInput } from './services/generate.service'

// ─── Upstash Redis client ──────────────────────────────────────────────────────

// export const redis = new Redis({
//     url: process.env.UPSTASH_REDIS_REST_URL!,
//     token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// })
const redis = Redis.fromEnv();

// ─── Keys ──────────────────────────────────────────────────────────────────────

const QUEUE_LIST = 'queue:pending'
const LOCK_KEY = 'queue:lock'
const jobKey = (id: string) => `queue:job:${id}`

const JOB_TTL_SECONDS = 60 * 60 * 2   // 2 hours — then Redis auto-expires

// ─── Types ─────────────────────────────────────────────────────────────────────

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed'

export interface QueueJob {
    jobId: string
    status: JobStatus
    position: number        // queue position while status=queued, 0 otherwise
    createdAt: string
    startedAt?: string
    finishedAt?: string
    input: GenerateInput
    pack?: GeneratedPack
    error?: string
    stage?: number          // current pipeline stage (1|2|3)
    stageMessage?: string    // human-readable message for the stage
    images: GeneratedImage[]  // images collected so far (for SSE replay)
}

export interface EnqueueResult {
    jobId: string
    position: number          // 1 = you're next, 2 = one person ahead, etc.
}

// ─── Enqueue ───────────────────────────────────────────────────────────────────

export async function enqueueJob(input: GenerateInput): Promise<EnqueueResult> {
    const jobId = crypto.randomUUID()

    // Push jobId to the tail of the pending list
    await redis.lpush(QUEUE_LIST, jobId)

    // Get current queue length to calculate position
    const queueLength = await redis.llen(QUEUE_LIST)

    const job: Record<string, string> = {
        jobId,
        status: 'queued',
        position: String(queueLength),
        createdAt: new Date().toISOString(),
        input: JSON.stringify(input),
        images: '[]',
    }

    // Save job record with TTL
    const key = jobKey(jobId)
    await redis.hset(key, job)
    await redis.expire(key, JOB_TTL_SECONDS)

    return { jobId, position: queueLength }
}

// ─── Get job status ────────────────────────────────────────────────────────────

export async function getJob(jobId: string): Promise<QueueJob | null> {
    const raw = await redis.hgetall(jobKey(jobId))
    if (!raw || Object.keys(raw).length === 0) return null

    return {
        jobId: raw.jobId as string,
        status: raw.status as JobStatus,
        position: Number(raw.position ?? 0),
        createdAt: raw.createdAt as string,
        startedAt: raw.startedAt as string | undefined,
        finishedAt: raw.finishedAt as string | undefined,
        input: JSON.parse(raw.input as string),
        pack: raw.pack ? JSON.parse(raw.pack as string) : undefined,
        error: raw.error as string | undefined,
        stage: raw.stage ? Number(raw.stage) : undefined,
        stageMessage: raw.stageMessage as string | undefined,
        images: raw.images ? JSON.parse(raw.images as string) : [],
    }
}

// ─── Pop next job from queue ───────────────────────────────────────────────────

export async function dequeueNextJob(): Promise<string | null> {
    // RPOP gives us FIFO (we LPUSH on enqueue, RPOP on dequeue)
    const jobId = await redis.rpop<string>(QUEUE_LIST)
    return jobId ?? null
}

// ─── Update job fields ─────────────────────────────────────────────────────────

export async function updateJob(
    jobId: string,
    fields: Partial<Record<string, string>>,
): Promise<void> {
    const key = jobKey(jobId)
    await redis.hset(key, fields)
    await redis.expire(key, JOB_TTL_SECONDS)  // refresh TTL on every update
}

// ─── Append an image to the job's image list ──────────────────────────────────
// Called by the worker as each image completes — clients poll and see new images

export async function appendJobImage(jobId: string, image: GeneratedImage): Promise<void> {
    const raw = await redis.hget<string>(jobKey(jobId), 'images')
    const images: GeneratedImage[] = raw ? JSON.parse(raw) : []
    images.push(image)
    await updateJob(jobId, { images: JSON.stringify(images) })
}

// ─── Queue position recalculation ─────────────────────────────────────────────
// Call after dequeue to update position numbers for remaining jobs

export async function recalculatePositions(): Promise<void> {
    const pending = await redis.lrange<string>(QUEUE_LIST, 0, -1)
    // pending is ordered tail→head (RPOP takes from tail = oldest = index -1)
    // lrange returns head→tail, so index 0 is the newest, last index is next to run
    const reversed = [...pending].reverse()
    await Promise.all(
        reversed.map((jobId, i) =>
            updateJob(jobId, { position: String(i + 1) }),
        ),
    )
}

// ─── Worker lock ───────────────────────────────────────────────────────────────
// Prevents two worker invocations from running simultaneously.
// NX = only set if not exists. EX = expire after 3 minutes (safety net if worker crashes).

export async function acquireLock(): Promise<boolean> {
    const result = await redis.set(LOCK_KEY, '1', { nx: true, ex: 180 })
    return result === 'OK'
}

export async function releaseLock(): Promise<void> {
    await redis.del(LOCK_KEY)
}

export async function isLocked(): Promise<boolean> {
    const val = await redis.get(LOCK_KEY)
    return val !== null
}

// ─── Queue length ──────────────────────────────────────────────────────────────

export async function getQueueLength(): Promise<number> {
    return redis.llen(QUEUE_LIST)
}