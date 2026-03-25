/**
 * trigger/generate-pack.ts
 *
 * The PixPack generation task — runs on Trigger.dev infrastructure.
 *
 * Why Trigger.dev instead of Vercel serverless:
 *   - No timeout — runs as long as needed (Vercel free: 60s, Pro: 180s)
 *   - concurrency: { limit: 1 } replaces the entire Redis lock system
 *   - metadata.append() streams image URLs to the frontend in real-time
 *   - Automatic retries per run, not per image
 *   - Full trace in dashboard: see exactly which step failed
 *
 * Image flow (why URLs not base64):
 *   Trigger.dev metadata limit is 256KB.
 *   One image base64 is ~3MB — way over the limit.
 *   So: generate image → upload to Supabase → store public URL in metadata.
 *   The frontend renders images from Supabase URLs.
 *   The download route fetches from Supabase URLs when building the ZIP.
 *
 * Metadata shape (read by useRealtimeRun on the frontend):
 * {
 *   stage:        1 | 2 | 3
 *   stageMessage: string
 *   images: Array<{
 *     id, variation, platform, angle, imageUrl, adCopy, status, error?
 *   }>
 * }
 */

import { task, metadata } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import { generatePack } from '@/lib/services/generate.service'
import type { GeneratedImage } from '@/lib/types'
import type { GenerateInput } from '@/lib/services/generate.service'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratePackPayload {
    input: GenerateInput
}

// What we store per image in run metadata (no base64 — only URL)
export interface MetadataImage {
    id: string
    variation: number
    platform: string
    angle: string
    imageUrl: string | null   // Supabase public URL
    adCopy: { awareness: string; consideration: string; conversion: string }
    status: 'done' | 'error'
    error?: string
    [key: string]: any // Add index signature for Trigger.dev metadata compatibility
}

// ─── Supabase upload helper ────────────────────────────────────────────────────

async function uploadImageToSupabase(image: GeneratedImage, base64: string | null): Promise<string | null> {
    if (!base64) return null

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        const base64Data = base64.includes(',')
            ? base64.split(',')[1]
            : base64

        const mimeType = base64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png'
        const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png'
        const buffer = Buffer.from(base64Data, 'base64')
        const filename = `gen-${image.id}-v${image.variation}-${image.angle}.${ext}`

        const { error } = await supabase.storage
            .from('pack_assets')
            .upload(filename, buffer, { contentType: mimeType, cacheControl: '3600', upsert: true })

        if (error) {
            console.error(`[task] Supabase upload failed variation ${image.variation}:`, error.message)
            return null
        }

        const { data: { publicUrl } } = supabase.storage.from('pack_assets').getPublicUrl(filename)
        return publicUrl

    } catch (err) {
        console.error(`[task] Upload error variation ${image.variation}:`, err)
        return null
    }
}

// ─── The task ──────────────────────────────────────────────────────────────────

export const generatePackTask = task({
    id: 'generate-pack',

    // ONE job at a time globally — prevents Gemini 429 rate limit errors.
    // No Redis lock needed. No self-triggering. One line.
    queue: {
        concurrencyLimit: 1,
    },

    // Retry the whole run up to 1 time if something catastrophic fails.
    // Individual image failures are handled gracefully within the run (error cards).
    retry: {
        maxAttempts: 2,
        minTimeoutInMs: 5_000,
        maxTimeoutInMs: 30_000,
    },

    run: async (payload: GeneratePackPayload) => {
        const { input } = payload

        // Initialise metadata — frontend reads this via useRealtimeRun
        metadata.set('stage', 0)
        metadata.set('stageMessage', 'Starting generation...')
        metadata.set('images', [])

        // Track URLs for building the final pack
        const urlMap = new Map<string, string>()

        // Run the full generation pipeline
        const result = await generatePack(
            input,
            {
                onStage: async (stage: number, message: string) => {
                    // Updates stream to frontend in real-time via Realtime API
                    metadata.set('stage', stage)
                    metadata.set('stageMessage', message)
                    console.log(`[task] Stage ${stage}: ${message}`)
                },

                onImage: async (image: GeneratedImage, base64: string | null) => {
                    console.log(`[task] Variation ${image.variation} (${image.angle}) — uploading...`)

                    // Upload to Supabase, get URL
                    const imageUrl = await uploadImageToSupabase(image, base64)
                    if (imageUrl) urlMap.set(image.id, imageUrl)

                    // Append lean image to metadata — frontend sees it appear immediately
                    const metaImage: MetadataImage = {
                        id: image.id,
                        variation: image.variation,
                        platform: image.platform,
                        angle: image.angle,
                        imageUrl,
                        adCopy: image.adCopy,
                        status: image.status,
                        error: image.error,
                    }

                    metadata.append('images', metaImage)
                    console.log(`[task] Variation ${image.variation} appended to metadata (url: ${imageUrl ? 'ok' : 'null'})`)
                },
            },
        )

        if (result.status === 'yield') {
            throw new Error('Task yielded unexpectedly. Trigger.dev should run to completion.')
        }

        const { pack } = result

        // Replace imageUrl with Supabase URL in the final pack
        const leanPack = {
            ...pack,
            images: pack.images.map(img => ({
                ...img,
                imageUrl: urlMap.get(img.id) ?? img.imageUrl,
            })),
        }

        console.log(`[task] Done — ${urlMap.size}/4 images uploaded to Supabase`)

        // Return the lean pack — stored as run output, accessible via run.output
        return leanPack
    },
})