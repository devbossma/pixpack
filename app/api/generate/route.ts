/**
 * app/api/generate/route.ts
 *
 * POST /api/generate
 *
 * Accepts: application/json
 *   productProfile   ProductProfile  — output of /api/analyze + extractedImageUrl (required)
 *   userConfig       UserConfig      — platforms, country, audience config (required)
 *   marketingLanguage string         — target copy language (default: 'auto')
 *
 * Returns: { pack: GeneratedPack }
 *
 * All business logic lives in lib/services/generate.service.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { generatePack } from '@/lib/services/generate.service'

export const maxDuration = 180

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productProfile, userConfig, marketingLanguage = 'auto' } = body

    // Validate required fields
    if (!productProfile || !userConfig) {
      return NextResponse.json(
        { error: 'Missing required fields: productProfile and userConfig' },
        { status: 400 },
      )
    }

    if (!productProfile.extractedImageUrl) {
      return NextResponse.json(
        { error: 'productProfile.extractedImageUrl is required' },
        { status: 400 },
      )
    }

    const pack = await generatePack({ productProfile, userConfig, marketingLanguage })

    // If every image failed, surface a clear error
    const hasImages = pack.images.some(img => img.status === 'done')
    if (!hasImages) {
      return NextResponse.json(
        { error: 'All image generation tasks failed. Please try again in a moment.' },
        { status: 429 },
      )
    }

    return NextResponse.json({ pack })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[POST /api/generate] Error:', message)

    const isRateLimit = /429|Resource exhausted|RESOURCE_EXHAUSTED|quota/i.test(message)

    return NextResponse.json(
      { error: isRateLimit ? 'Rate limit reached. Please wait a moment and try again.' : message },
      { status: isRateLimit ? 429 : 500 },
    )
  }
}