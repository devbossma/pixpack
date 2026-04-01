/**
 * lib/services/analyze.service.ts
 *
 * Runs two tasks in parallel:
 *   A. Photoroom background removal → Supabase upload → public URL
 *   B. Gemini Vision product analysis → structured ProductAnalysis JSON
 *
 * No Next.js / HTTP concerns here.
 */

import sharp from 'sharp'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createVertexClient } from '../vertex-client'
import { buildAnalyzePrompt } from '../prompts/analyze.prompt'
import type { ProductAnalysis, AnalyzeResponse } from '../types'

export interface AnalyzeInput {
  file: File
  productHint: string
  language: string
}

export async function analyzeProduct(input: AnalyzeInput): Promise<AnalyzeResponse> {
  const { file, productHint } = input
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type

  const [extractedImageUrl, analysis] = await Promise.all([
    extractBackground(file),
    analyzeWithVision(buffer, mimeType, productHint),
  ])

  return { extractedImageUrl, analysis }
}

// ---- Watermark scrubber -------------------------------------------------------
//
// Photoroom sandbox returns a PNG where the alpha channel correctly marks the
// product subject, BUT the RGB channels still carry the "Photoroom" diagonal
// watermark text — even over pixels that should be fully transparent.
//
// When Gemini receives this image it flattens transparency to white internally,
// making the "Photoroom" text clearly visible, and then sometimes reproduces it
// as a background pattern in the generated image.
//
// Fix: walk every pixel. If Photoroom's alpha says this pixel is background
// (alpha < THRESHOLD), zero out its RGB too — making it cleanly transparent
// with no color information. This eliminates the watermark from all background
// areas. The residual watermark on product pixels (alpha > THRESHOLD) is
// already handled by the existing prompt instruction.

const ALPHA_BACKGROUND_THRESHOLD = 15  // pixels below this are background, not product

async function cleanWatermark(watermarkedBuffer: ArrayBuffer): Promise<Buffer> {
  const input = Buffer.from(watermarkedBuffer)

  // Read raw RGBA data — 4 bytes per pixel
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Walk every pixel: zero out RGB where Photoroom marked the pixel as background
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < ALPHA_BACKGROUND_THRESHOLD) {
      data[i]     = 0  // R
      data[i + 1] = 0  // G
      data[i + 2] = 0  // B
      data[i + 3] = 0  // A — fully transparent, no color data
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 6 })
    .toBuffer()
}

// ---- Task A: Photoroom background removal + Supabase upload -----------------

async function extractBackground(file: File): Promise<string> {
  const photoroomFormData = new FormData()
  photoroomFormData.append('imageFile', file)
  photoroomFormData.append('background.color', 'transparent')
  photoroomFormData.append('background.scaling', 'fill')
  photoroomFormData.append('outputSize', 'croppedSubject')
  photoroomFormData.append('padding', '0.1')

  const response = await fetch('https://image-api.photoroom.com/v2/edit', {
    method: 'POST',
    headers: { 'x-api-key': process.env.PHOTOROOM_API_KEY! },
    body: photoroomFormData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Photoroom error ${response.status}: ${text}`)
  }

  // Photoroom adds a tiled watermark when credits are exhausted or on a free key.
  // Detect via x-credits-charged header — if 0, the image is watermarked.
  // Watermarked images cause Gemini to reproduce the "Photoroom" text as background texture.
  const creditsCharged = response.headers.get('x-credits-charged')
  const creditsRemaining = response.headers.get('x-credits-remaining')
  const isWatermarked = creditsCharged === '0'

  if (isWatermarked) {
    console.warn(
      '[photoroom] x-credits-charged=0 — sandbox watermark detected. Cleaning pixels before upload.',
      `Credits remaining: ${creditsRemaining ?? 'unknown'}.`,
    )
  } else {
    console.log(`[photoroom] OK — credits charged: ${creditsCharged}, remaining: ${creditsRemaining}`)
  }

  const rawArrayBuffer = await response.arrayBuffer()

  // If watermarked: scrub background pixels so "Photoroom" text has no RGB data.
  // Gemini sees a clean transparent cutout instead of diagonal watermark text on white.
  const imageBuffer: Buffer = isWatermarked
    ? await cleanWatermark(rawArrayBuffer)
    : Buffer.from(rawArrayBuffer)

  const filename = `extracted-${crypto.randomUUID()}.png`

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error: uploadError } = await supabase.storage
    .from('pack_assets')
    .upload(filename, imageBuffer, { contentType: 'image/png', cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('pack_assets').getPublicUrl(filename)
  return publicUrl
}

// ---- Task B: Gemini Vision product analysis ---------------------------------

async function analyzeWithVision(
  buffer: Buffer,
  mimeType: string,
  productHint: string,
): Promise<ProductAnalysis> {
  // Use createVertexClient() — same as generate.service.ts
  // This correctly loads GOOGLE_APPLICATION_CREDENTIALS_JSON on Vercel
  const ai = createVertexClient()
  const prompt = buildAnalyzePrompt(productHint)

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: buffer.toString('base64'), mimeType } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,  // Low temperature: factual extraction — consistent, deterministic analysis
      maxOutputTokens: 4096,
    },
  })

  const text = response.text
  if (!text) throw new Error('Gemini Vision returned no analysis text')

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) throw new Error('Gemini Vision returned no JSON object')

  return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as ProductAnalysis
}