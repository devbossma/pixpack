/**
 * app/api/generate/route.ts
 *
 * POST /api/generate
 *
 * Streams generation progress using Server-Sent Events (SSE).
 * Each image is sent to the client as soon as it completes —
 * the client does not wait for all 6 images before rendering.
 *
 * Why SSE fixes the 504 timeout:
 *   The old approach waited for all 6 images then sent one big response.
 *   With 22s gaps between images, 6 images = ~160s before the first byte
 *   was sent — dangerously close to Vercel's 180s limit.
 *
 *   SSE keeps the HTTP connection alive by continuously sending data.
 *   Vercel's timeout resets on each chunk sent, so the 180s limit
 *   applies to the gap between writes, not the total request duration.
 *
 * Event types streamed to client:
 *   { type: 'stage', stage: 1|2|3, message: string }
 *   { type: 'image', image: GeneratedImage }
 *   { type: 'meta',  productDescription, postingSchedule, audience, totalScore }
 *   { type: 'done' }
 *   { type: 'error', message: string }
 */

import { NextRequest } from 'next/server'
import { generatePack } from '@/lib/services/generate.service'

export const maxDuration = 180

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { productProfile, userConfig, marketingLanguage = 'auto' } = body

  if (!productProfile || !userConfig) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: productProfile and userConfig' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!productProfile.extractedImageUrl) {
    return new Response(
      JSON.stringify({ error: 'productProfile.extractedImageUrl is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // ── SSE stream setup ────────────────────────────────────────────────────────
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {

      // Helper: send one SSE event
      function send(data: Record<string, unknown>) {
        const chunk = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(chunk))
      }

      try {
        // generatePack now accepts an onImage callback — called after each
        // image completes so we can stream it immediately
        const pack = await generatePack(
          { productProfile, userConfig, marketingLanguage },
          {
            onStage: async (stage: number, message: string) => {
              send({ type: 'stage', stage, message })
            },
            onImage: async (image: any) => {
              send({ type: 'image', image })
            },
          },
        )

        const hasImages = pack.images.some((img) => img.status === 'done')
        if (!hasImages) {
          send({ type: 'error', message: 'All image generation tasks failed. Please try again.' })
          controller.close()
          return
        }

        // Send the pack metadata (everything except images — already sent individually)
        send({
          type: 'meta',
          audience: pack.audience,
          generatedAt: pack.generatedAt,
          id: pack.id,
          platform: pack.platform,
        })

        send({ type: 'done' })

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        const isRateLimit = /429|Resource exhausted|RESOURCE_EXHAUSTED|quota/i.test(message)

        console.error('[POST /api/generate] Error:', message)

        send({
          type: 'error',
          message: isRateLimit
            ? 'Rate limit reached. Please wait a moment and try again.'
            : message,
        })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      // Disable Vercel's response buffering — critical for SSE to work
      'X-Accel-Buffering': 'no',
    },
  })
}