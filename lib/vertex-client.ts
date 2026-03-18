/**
 * lib/vertex-client.ts
 *
 * Single source of truth for Vertex AI client creation.
 * Both /api/analyze and /api/generate import from here.
 *
 * Auth priority:
 *   1. GOOGLE_APPLICATION_CREDENTIALS_JSON  → Vercel (single-line JSON string)
 *   2. GOOGLE_APPLICATION_CREDENTIALS       → local dev (path to .json file)
 *                                             OR accidentally set to JSON content
 *   3. undefined                            → Cloud Run / GKE ADC
 */

import path from 'path'
import fs from 'fs'
import { GoogleGenAI } from '@google/genai'

function loadCredentials(): Record<string, unknown> | undefined {
  // Priority 1: inline JSON string (correct Vercel setup)
  const inlineJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  if (inlineJson) {
    try {
      return JSON.parse(inlineJson)
    } catch {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON')
    }
  }

  // Priority 2: file path (local dev)
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (credPath) {
    // Guard: if it starts with '{' it's JSON content, not a file path
    // This handles the common mistake of pasting JSON into the wrong env var
    if (credPath.trimStart().startsWith('{')) {
      try {
        return JSON.parse(credPath)
      } catch {
        throw new Error(
          'GOOGLE_APPLICATION_CREDENTIALS looks like JSON but could not be parsed. ' +
          'Use GOOGLE_APPLICATION_CREDENTIALS_JSON for inline JSON credentials.'
        )
      }
    }

    const resolved = path.resolve(process.cwd(), credPath)
    if (!fs.existsSync(resolved)) {
      throw new Error(`Service account file not found at: ${resolved}`)
    }
    return JSON.parse(fs.readFileSync(resolved, 'utf-8'))
  }

  return undefined // Cloud Run / GKE ADC
}

export function createVertexClient(): GoogleGenAI {
  const credentials = loadCredentials()

  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
    location: process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1',
    ...(credentials ? { googleAuthOptions: { credentials } } : {}),
  })
}
