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

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ─── Keys ──────────────────────────────────────────────────────────────────────

const QUEUE_LIST = 'queue:pending'
const ACTIVE_SET = 'queue:active'   // Set of jobIds currently being processed
const LOCK_KEY = 'queue:lock'
const jobKey = (id: string) => `queue:job:${id}`

const JOB_TTL_SECONDS = 60 * 60 * 2   // 2 hours — then Redis auto-expires

// ─── Resilience Wrapper ────────────────────────────────────────────────────────

const redisCall = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
    try {
        return await fn()
    } catch (err) {
        if (retries > 0) {
            console.warn(`[redis] Transient error - retrying... (${retries} left)`, (err as Error).message)
            await new Promise(r => setTimeout(r, 500))
            return redisCall(fn, retries - 1)
        }
        throw err
    }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed'

export interface QueueJob {
    jobId: string
    status: JobStatus
    position: number        // queue position while status=queued, 0 otherwise
    stage?: number          // pipeline stage (1|2|3)
    stageMessage?: string   // current step description
    createdAt: string
    updatedAt: string       // set on every hash update
    startedAt?: string
    finishedAt?: string
    input: GenerateInput
    pack?: GeneratedPack  // stored WITHOUT imageBase64 — images have imageUrl instead
    error?: string
    images: GeneratedImage[]  // images collected so far — URL not base64
    scenesWithCopy?: any[]    // intermediate processed scenes/copy
}

export interface EnqueueResult {
    jobId: string
    position: number          // 1 = you're next, 2 = one person ahead, etc.
}

// ─── Enqueue ───────────────────────────────────────────────────────────────────

export async function enqueueJob(input: GenerateInput): Promise<EnqueueResult> {
    const jobId = crypto.randomUUID()

    // Push jobId to the tail of the pending list
    // lpush returns the NEW list length atomically
    const queueLength = await redisCall(() => redis.lpush(QUEUE_LIST, jobId))

    const job: Record<string, string> = {
        jobId,
        status: 'queued',
        position: String(queueLength - 1),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
    const raw = await redisCall(() => redis.hgetall(jobKey(jobId)))
    if (!raw || Object.keys(raw).length === 0) return null

    const parseField = (val: any) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val) } catch { return val }
        }
        return val
    }

    return {
        jobId: raw.jobId as string,
        status: raw.status as JobStatus,
        position: Number(raw.position ?? 0),
        stage: raw.stage ? Number(raw.stage) : undefined,
        stageMessage: raw.stageMessage as string | undefined,
        createdAt: raw.createdAt as string,
        updatedAt: (raw.updatedAt || raw.createdAt) as string,
        startedAt: raw.startedAt as string | undefined,
        finishedAt: raw.finishedAt as string | undefined,
        input: parseField(raw.input),
        pack: parseField(raw.pack),
        error: raw.error as string | undefined,
        images: parseField(raw.images) ?? [],
        scenesWithCopy: parseField(raw.scenesWithCopy),
    }
}

// ─── Pop next job from queue ───────────────────────────────────────────────────

export async function dequeueNextJob(): Promise<string | null> {
    // RPOP gives us FIFO (we LPUSH on enqueue, RPOP on dequeue)
    const jobId = await redisCall(() => redis.rpop<string>(QUEUE_LIST))
    if (jobId) {
        await redisCall(() => redis.sadd(ACTIVE_SET, jobId))
    }
    return jobId ?? null
}

export async function markJobActive(jobId: string): Promise<void> {
    await redis.sadd(ACTIVE_SET, jobId)
}

export async function markJobFinished(jobId: string): Promise<void> {
    await redis.srem(ACTIVE_SET, jobId)
}

export async function requeueJobAtFront(jobId: string): Promise<void> {
    // RPUSH puts it at the front of the queue for the very next RPOP
    await redis.rpush(QUEUE_LIST, jobId)
}

// ─── Update job fields ─────────────────────────────────────────────────────────

export async function updateJob(
    jobId: string,
    fields: Partial<Record<string, any>>,
): Promise<void> {
    const key = jobKey(jobId)
    
    // Hash fields must be strings in Redis
    const flatFields: Record<string, string> = {
        updatedAt: new Date().toISOString(),
    }
    for (const [k, v] of Object.entries(fields)) {
        if (v === undefined || v === null) continue
        flatFields[k] = typeof v === 'object' ? JSON.stringify(v) : String(v)
    }

    if (Object.keys(flatFields).length > 0) {
        await redis.hset(key, flatFields)
    }
    await redis.expire(key, JOB_TTL_SECONDS)  // refresh TTL on every update
}

// Stores a LEAN version of the image in the job object.
// Full base64 (~3MB per image) is stored in a separate standalone Redis key
// to stay under the 10MB payload size limit per request.

export async function appendJobImage(jobId: string, image: GeneratedImage, base64: string | null): Promise<void> {
    if (base64) {
        const imgKey = `${jobKey(jobId)}:image:${image.id}`
        await redis.set(imgKey, base64)
        // Store for 24h so the download link works for a day
        await redis.expire(imgKey, 24 * 60 * 60)
    }

    const leanImage: GeneratedImage = {
        ...image,
        imageUrl: base64 ? `/api/image?jobId=${jobId}&imageId=${image.id}` : null
    }

    const raw = await redis.hget<any>(jobKey(jobId), 'images')
    let images: GeneratedImage[] = []
    
    if (typeof raw === 'string') {
        images = JSON.parse(raw)
    } else if (Array.isArray(raw)) {
        images = raw
    }
    
    images.push(leanImage)
    await updateJob(jobId, { images: JSON.stringify(images) })
}

export async function getJobImageBase64(jobId: string, imageId: string): Promise<string | null> {
    const raw = await redis.get<string>(`${jobKey(jobId)}:image:${imageId}`)
    return raw ?? null
}


// ─── Queue position recalculation ─────────────────────────────────────────────
// Call after dequeue to update position numbers for remaining jobs

export async function recalculatePositions(): Promise<void> {
    const pending = await redis.lrange<string>(QUEUE_LIST, 0, -1)
    const reversed = [...pending].reverse()
    await Promise.all(
        reversed.map((jobId, i) =>
            updateJob(jobId, { position: String(i) }),
        ),
    )
}

// ─── Stuck Job Recovery ────────────────────────────────────────────────────────
// Finds jobs in 'active' set that haven't been updated in > 5m
// and puts them back into the pending queue.

export async function recoverStuckJobs(): Promise<void> {
    const activeIds = await redis.smembers(ACTIVE_SET)
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000

    for (const jobId of activeIds) {
        const job = await getJob(jobId)
        if (!job) {
            await redis.srem(ACTIVE_SET, jobId)
            continue
        }

        if (job.status === 'done' || job.status === 'failed') {
            await redis.srem(ACTIVE_SET, jobId)
            continue
        }

        const updatedAt = new Date(job.updatedAt).getTime()
        if (now - updatedAt > fiveMinutes) {
            console.log(`[queue] Recovering stuck job ${jobId}`)
            await updateJob(jobId, { status: 'queued' })
            await redis.lpush(QUEUE_LIST, jobId)
            await redis.srem(ACTIVE_SET, jobId)
        }
    }
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