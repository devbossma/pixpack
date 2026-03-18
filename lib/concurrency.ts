/**
 * lib/concurrency.ts
 *
 * Utility for rate-limit-safe parallel execution.
 *
 * Problem: firing N async tasks simultaneously hammers the quota bucket →
 * RESOURCE_EXHAUSTED (429). Sequential is safe but too slow.
 *
 * Solution: run tasks in small batches with a short pause between each batch.
 * The quota window refills during the pause, so by the time the next batch
 * fires there's headroom again.
 *
 * Returns the same shape as Promise.allSettled — fulfilled/rejected per task —
 * so partial failures never crash the whole generation.
 */

export async function batchedAllSettled<T>(
  tasks: Array<() => Promise<T>>,
  options: {
    batchSize: number
    delayBetweenBatchesMs: number
    onBatchComplete?: (batchIndex: number, totalBatches: number) => void
  },
): Promise<PromiseSettledResult<T>[]> {
  const { batchSize, delayBetweenBatchesMs, onBatchComplete } = options
  const results: PromiseSettledResult<T>[] = []
  const totalBatches = Math.ceil(tasks.length / batchSize)

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batchIndex  = Math.floor(i / batchSize)
    const batch       = tasks.slice(i, i + batchSize)
    const batchResult = await Promise.allSettled(batch.map(task => task()))

    results.push(...batchResult)
    onBatchComplete?.(batchIndex, totalBatches)

    const isLastBatch = i + batchSize >= tasks.length
    if (!isLastBatch) {
      await delay(delayBetweenBatchesMs)
    }
  }

  return results
}

/** Simple promise-based delay. */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a single async task on transient errors (429, 5xx, quota).
 * Returns the result or throws if all attempts fail.
 */
export async function retryOnRateLimit<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    backoffMs?: number
    label?: string
  } = {},
): Promise<T> {
  const { maxAttempts = 2, backoffMs = 6000, label = 'task' } = options

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const isTransient = isRateLimitError(msg)

      if (isTransient && attempt < maxAttempts) {
        console.warn(`[retry] ${label} hit rate limit (attempt ${attempt}/${maxAttempts}). Waiting ${backoffMs}ms…`)
        await delay(backoffMs)
        continue
      }

      throw err
    }
  }

  // TypeScript narrowing — never reached
  throw new Error(`${label} failed after ${maxAttempts} attempts`)
}

export function isRateLimitError(msg: string): boolean {
  return (
    msg.includes('429')               ||
    msg.includes('503')               ||
    msg.includes('502')               ||
    msg.includes('504')               ||
    msg.includes('Resource exhausted') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('overloaded')         ||
    msg.includes('UNAVAILABLE')
  )
}
