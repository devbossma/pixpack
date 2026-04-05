/**
 * app/api/analyze/route.ts
 *
 * POST /api/analyze
 *
 * Accepts: multipart/form-data
 *   file         File    — product photo (required)
 *   productHint  string  — optional free-text hint for Gemini
 *   language     string  — target language (default: 'auto')
 *
 * Returns: { extractedImageUrl: string, analysis: ProductAnalysis }
 *
 * All business logic lives in lib/services/analyze.service.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeProduct }            from '@/lib/services/analyze.service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 })
    }

    const result = await analyzeProduct({
      file,
      productHint: (formData.get('productHint') as string) ?? '',
      language:    (formData.get('language')    as string) ?? 'auto',
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[POST /api/analyze] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
