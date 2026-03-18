/**
 * lib/services/analyze.service.ts
 *
 * Runs two tasks in parallel:
 *   A. Photoroom background removal → Supabase upload → public URL
 *   B. Gemini Vision product analysis → structured ProductAnalysis JSON
 *
 * No Next.js / HTTP concerns here.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { VertexAI }                              from '@google-cloud/vertexai'
import { buildAnalyzePrompt }                    from '../prompts/analyze.prompt'
import type { ProductAnalysis, AnalyzeResponse } from '../types'

export interface AnalyzeInput {
  file:        File
  productHint: string
  language:    string
}

export async function analyzeProduct(input: AnalyzeInput): Promise<AnalyzeResponse> {
  const { file, productHint } = input
  const buffer   = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type

  const [extractedImageUrl, analysis] = await Promise.all([
    extractBackground(file),
    analyzeWithVision(buffer, mimeType, productHint),
  ])

  return { extractedImageUrl, analysis }
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
    method:  'POST',
    headers: { 'x-api-key': process.env.PHOTOROOM_API_KEY! },
    body:    photoroomFormData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Photoroom error ${response.status}: ${text}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const filename    = `extracted-${crypto.randomUUID()}.png`

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error: uploadError } = await supabase.storage
    .from('pack_assets')
    .upload(filename, arrayBuffer, { contentType: 'image/png', cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('pack_assets').getPublicUrl(filename)
  return publicUrl
}

// ---- Task B: Gemini Vision product analysis ---------------------------------

async function analyzeWithVision(
  buffer:      Buffer,
  mimeType:    string,
  productHint: string,
): Promise<ProductAnalysis> {
  const vertexAI = new VertexAI({
    project:  process.env.GOOGLE_CLOUD_PROJECT_ID!,
    location: process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1',
  })

  const model = vertexAI.getGenerativeModel({
    model:            'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  const prompt = buildAnalyzePrompt(productHint)

  const result = await model.generateContent({
    contents: [
      {
        role:  'user',
        parts: [
          { inlineData: { data: buffer.toString('base64'), mimeType } },
          { text: prompt },
        ],
      },
    ],
  })

  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini Vision returned no analysis text')

  const firstBrace = text.indexOf('{')
  const lastBrace  = text.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) throw new Error('Gemini Vision returned no JSON object')

  return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as ProductAnalysis
}
