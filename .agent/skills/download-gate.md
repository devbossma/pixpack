# Skill: Download Gate, Email Capture, Pack Persistence & Rate Limiting

Read this file before implementing anything related to download, email, storage, or user tracking.

---

## CORE PRINCIPLE — WHEN TO PERSIST

**Never write to the database during or after generation.**
**Write to the database exactly once: when the user provides their email.**

The email submission is the user's commitment signal. Before that moment:
- All generated images live exclusively in React state (browser memory)
- User can freely regenerate individual images, tweak audience, re-run the whole pack
- Zero DB writes, zero storage cost, zero API calls for abandoned sessions
- Only engaged users who want their pack ever touch the database

```
GENERATION PHASE (zero persistence)
─────────────────────────────────────────────────────────
  Generate → images in React state
  Regenerate image 3 → replace image 3 in React state
  Regenerate image 5 → replace image 5 in React state
  User happy → clicks "Download Pack"
                    ↓
EMAIL COMMITMENT (single write — exact images user approved)
─────────────────────────────────────────────────────────
  POST /api/request-download  ←  full pack payload in body
    → save pack to DB
    → generate JWT
    → send email
    → return success
                    ↓
DOWNLOAD (read-only, no regeneration)
─────────────────────────────────────────────────────────
  User clicks email link
    → validate JWT
    → fetch pack from DB
    → build ZIP from saved data (exact same images)
    → stream to browser
    → mark downloaded
                    ↓
CLEANUP (daily cron)
─────────────────────────────────────────────────────────
  DELETE packs older than 24h
  DELETE download_requests older than 48h
```

---

## PER-IMAGE REGENERATION — REACT STATE MANAGEMENT

Before the user downloads, they can regenerate any individual image.
This must be handled entirely in client state — no API side effects.

```ts
// types/index.ts — add to GeneratedPack
export interface GeneratedPack {
  id: string                        // client-generated: crypto.randomUUID()
  images: GeneratedImage[]
  productDescription: ProductDescription
  postingSchedule: PostingSchedule[]
  audience: AudienceConfig
  generatedAt: string
  totalScore: number
}

// Each image tracks its own generation state
export interface GeneratedImage {
  id: string
  angle: Angle
  platform: Platform
  platformSpec: PlatformSpec
  imageBase64: string | null        // null while regenerating
  caption: string
  hashtags: string[]
  adCopy: AdCopyVariants
  engagementScore: EngagementScore
  status: 'done' | 'regenerating' | 'error'
  error?: string
}
```

### `hooks/usePackEditor.ts` — manages pack state + per-image regen

```ts
'use client'
import { useState, useCallback } from 'react'
import type { GeneratedPack, GeneratedImage, AudienceConfig } from '@/types'

export function usePackEditor() {
  const [pack, setPack] = useState<GeneratedPack | null>(null)

  // Called once when full generation completes
  function setPack_initial(newPack: GeneratedPack) {
    setPack(newPack)
  }

  // Regenerate a single image — replaces it in state while keeping all others
  const regenerateImage = useCallback(async (imageId: string) => {
    if (!pack) return

    // 1. Set that image to 'regenerating' state immediately
    setPack(prev => prev ? {
      ...prev,
      images: prev.images.map(img =>
        img.id === imageId
          ? { ...img, status: 'regenerating', imageBase64: null }
          : img
      )
    } : null)

    // 2. Find the image config
    const targetImage = pack.images.find(img => img.id === imageId)
    if (!targetImage) return

    try {
      // 3. Call single-image regeneration endpoint
      const res = await fetch('/api/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          angle: targetImage.angle,
          platform: targetImage.platform,
          audience: pack.audience,
          // Pass current pack context so Gemini can maintain consistency
        }),
      })

      if (!res.ok) throw new Error('Regeneration failed')
      const { imageBase64, engagementScore } = await res.json()

      // 4. Replace only that image in state — all others unchanged
      setPack(prev => prev ? {
        ...prev,
        images: prev.images.map(img =>
          img.id === imageId
            ? { ...img, imageBase64, engagementScore, status: 'done', error: undefined }
            : img
        ),
        // Recalculate total score
        totalScore: calculateAverageScore(prev.images.map(img =>
          img.id === imageId ? { ...img, engagementScore } : img
        )),
      } : null)

    } catch (err) {
      setPack(prev => prev ? {
        ...prev,
        images: prev.images.map(img =>
          img.id === imageId
            ? { ...img, status: 'error', error: 'Regeneration failed. Try again.', imageBase64: null }
            : img
        )
      } : null)
    }
  }, [pack])

  // Update caption for a single image (user edits inline)
  const updateCaption = useCallback((imageId: string, caption: string) => {
    setPack(prev => prev ? {
      ...prev,
      images: prev.images.map(img =>
        img.id === imageId ? { ...img, caption } : img
      )
    } : null)
  }, [])

  return { pack, setPack: setPack_initial, regenerateImage, updateCaption }
}

function calculateAverageScore(images: GeneratedImage[]): number {
  const done = images.filter(i => i.status === 'done' && i.engagementScore)
  if (!done.length) return 0
  return done.reduce((sum, i) => sum + i.engagementScore.score, 0) / done.length
}
```

### Single image regeneration endpoint

```ts
// app/api/regenerate-image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateImage } from '@/lib/vertex'
import { buildImagePrompt } from '@/lib/prompts'
import { generateEngagementScore } from '@/lib/vertex'

export const maxDuration = 30

const schema = z.object({
  angle: z.string(),
  platform: z.string(),
  audience: z.object({
    regionId: z.string(),
    ageRange: z.string(),
    gender: z.string(),
    interest: z.string(),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())

    // Re-analyze is not needed — we already have the product analysis
    // stored in the prompt config. Build prompt from audience + angle + platform.
    const prompt = buildImagePrompt({
      angle: body.angle as any,
      platform: body.platform as any,
      audience: body.audience as any,
      sceneIndex: Math.floor(Math.random() * 6), // random scene for variety
    })

    const [imageBase64, engagementScore] = await Promise.all([
      generateImage(prompt),
      generateEngagementScore({ prompt, audience: body.audience as any }),
    ])

    return NextResponse.json({ imageBase64, engagementScore })
  } catch (err) {
    return NextResponse.json(
      { error: 'Regeneration failed. Please try again.' },
      { status: 500 }
    )
  }
}
```

---

## OUTPUT CARD — REGENERATE BUTTON

Each OutputCard has a regenerate button that triggers per-image regen.

```tsx
// In OutputCard.tsx — add to image tab overlay
import { RefreshCw, Loader2 } from 'lucide-react'

// Hover overlay on the image
<div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors group flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
  <button
    onClick={() => onRegenerate(image.id)}
    disabled={image.status === 'regenerating'}
    className="flex items-center gap-1.5 bg-white/90 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
  >
    {image.status === 'regenerating'
      ? <><Loader2 size={12} className="animate-spin" /> Regenerating...</>
      : <><RefreshCw size={12} /> Regenerate</>
    }
  </button>
</div>

// When regenerating — show shimmer placeholder
{image.status === 'regenerating' && (
  <div className="absolute inset-0 bg-[var(--surface2)] animate-pulse flex items-center justify-center">
    <Loader2 size={24} className="text-[var(--text-muted)] animate-spin" />
  </div>
)}
```

---

## SUPABASE SETUP

### Install
```bash
npm install @supabase/supabase-js
```

### Tables

```sql
-- Packs table — stores full pack data at email commitment time
-- images stored as JSONB (not bytea) for simplicity at beta scale
create table packs (
  id text primary key,                    -- client-generated UUID
  email text not null,
  images_data jsonb not null,             -- array of { platform, angle, imageBase64, caption, hashtags, adCopy, engagementScore }
  product_description jsonb not null,
  posting_schedule jsonb not null,
  audience jsonb not null,
  total_score numeric(4,2),
  created_at timestamptz default now(),
  downloaded_at timestamptz,              -- null until user downloads
  expires_at timestamptz not null         -- always now() + 24h
);

-- Index for cleanup cron
create index on packs (expires_at);
create index on packs (email, created_at);

-- Download requests — one per email submission
create table download_requests (
  id uuid default gen_random_uuid() primary key,
  pack_id text references packs(id) on delete cascade,
  email text not null,
  ip_address text not null,
  jwt_token text not null,               -- the signed token sent in email
  token_used boolean default false,      -- true after first download
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

create index on download_requests (email, created_at);
create index on download_requests (ip_address, created_at);
create index on download_requests (jwt_token);

-- Share unlocks
create table share_unlocks (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  platform text not null,
  unlocked_at timestamptz default now()
);
create index on share_unlocks (email, unlocked_at);
```

### Supabase client

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Client-side — safe to use in components
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side only — NEVER import in any 'use client' file
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

---

## RATE LIMITING

```ts
// lib/rate-limit.ts
import { getSupabaseAdmin } from './supabase'

export const RATE_LIMITS = {
  perEmail:  { count: 3, windowHours: 24 },
  perIp:     { count: 5, windowHours: 24 },
} as const

export async function checkRateLimit(params: {
  email: string
  ip: string
}): Promise<{ allowed: boolean; reason: 'email' | 'ip' | null }> {
  const supabase = getSupabaseAdmin()
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [{ count: emailCount }, { count: ipCount }] = await Promise.all([
    supabase.from('download_requests')
      .select('id', { count: 'exact', head: true })
      .eq('email', params.email)
      .gte('created_at', windowStart),
    supabase.from('download_requests')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', params.ip)
      .gte('created_at', windowStart),
  ])

  if ((emailCount ?? 0) >= RATE_LIMITS.perEmail.count) {
    return { allowed: false, reason: 'email' }
  }
  if ((ipCount ?? 0) >= RATE_LIMITS.perIp.count) {
    return { allowed: false, reason: 'ip' }
  }
  return { allowed: true, reason: null }
}

export async function hasShareUnlock(email: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('share_unlocks')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('unlocked_at', windowStart)
  return (count ?? 0) > 0
}
```

---

## JWT TOKEN — SIGN AND VERIFY

```ts
// lib/download-token.ts
// Uses jose for Edge-compatible JWT — no Node.js crypto dependency
// npm install jose

import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.DOWNLOAD_SECRET!)

export async function signDownloadToken(payload: {
  packId: string
  email: string
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(secret)
}

export async function verifyDownloadToken(token: string): Promise<{
  packId: string
  email: string
} | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { packId: string; email: string }
  } catch {
    return null
  }
}
```

Add to `.env.local`:
```bash
DOWNLOAD_SECRET=generate-a-random-32-char-string-here
# generate with: openssl rand -base64 32
```

---

## API ROUTES

### `POST /api/request-download`

This is called when user submits their email. It receives the full pack payload.

```ts
// app/api/request-download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase'
import { checkRateLimit, hasShareUnlock } from '@/lib/rate-limit'
import { signDownloadToken } from '@/lib/download-token'
import { sendDownloadEmail } from '@/lib/email'

// Allow large body — pack contains base64 images (~5MB)
export const maxDuration = 30

const imageSchema = z.object({
  id: z.string(),
  platform: z.string(),
  angle: z.string(),
  imageBase64: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  adCopy: z.object({
    awareness: z.string(),
    consideration: z.string(),
    conversion: z.string(),
  }),
  engagementScore: z.object({
    score: z.number(),
    label: z.string(),
    reason: z.string(),
    tip: z.string(),
  }),
})

const schema = z.object({
  packId: z.string().uuid(),
  images: z.array(imageSchema).min(1).max(12),
  productDescription: z.object({
    title: z.string(),
    subtitle: z.string(),
    bulletFeatures: z.array(z.string()),
    seoMetaTitle: z.string(),
    seoMetaDescription: z.string(),
  }),
  postingSchedule: z.array(z.object({
    platform: z.string(),
    bestDay: z.string(),
    bestTime: z.string(),
    timezone: z.string(),
    reason: z.string(),
  })),
  audience: z.object({
    regionId: z.string(),
    ageRange: z.string(),
    gender: z.string(),
    interest: z.string(),
  }),
  totalScore: z.number(),
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? '0.0.0.0'

    // Rate limit check — share unlock bypasses email limit
    const rateCheck = await checkRateLimit({ email: body.email, ip })
    if (!rateCheck.allowed) {
      const unlocked = await hasShareUnlock(body.email)
      if (!unlocked) {
        return NextResponse.json(
          { error: 'RATE_LIMITED', reason: rateCheck.reason },
          { status: 429 }
        )
      }
    }

    const supabase = getSupabaseAdmin()
    const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString()

    // Persist pack — this is the ONLY time we write to DB
    await supabase.from('packs').insert({
      id: body.packId,
      email: body.email,
      images_data: body.images,
      product_description: body.productDescription,
      posting_schedule: body.postingSchedule,
      audience: body.audience,
      total_score: body.totalScore,
      expires_at: expiresAt,
    })

    // Generate signed JWT
    const token = await signDownloadToken({ packId: body.packId, email: body.email })

    // Log download request
    await supabase.from('download_requests').insert({
      pack_id: body.packId,
      email: body.email,
      ip_address: ip,
      jwt_token: token,
      expires_at: expiresAt,
    })

    // Send email
    const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/download?token=${token}`
    await sendDownloadEmail({ to: body.email, downloadUrl, expiresAt })

    return NextResponse.json({ success: true })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error('request-download error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
```

### `GET /api/download?token=JWT`

Called when user clicks the email link. Builds ZIP from saved pack, streams it.

```ts
// app/api/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyDownloadToken } from '@/lib/download-token'
import { assemblePackZip } from '@/lib/pack-assembler'

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/download-expired', req.url))
  }

  // Verify JWT
  const payload = await verifyDownloadToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL('/download-expired', req.url))
  }

  const supabase = getSupabaseAdmin()

  // Check token not already used
  const { data: request } = await supabase
    .from('download_requests')
    .select('token_used, pack_id')
    .eq('jwt_token', token)
    .single()

  if (!request || request.token_used) {
    return NextResponse.redirect(new URL('/download-expired', req.url))
  }

  // Fetch pack data
  const { data: pack } = await supabase
    .from('packs')
    .select('*')
    .eq('id', payload.packId)
    .single()

  if (!pack) {
    return NextResponse.redirect(new URL('/download-expired', req.url))
  }

  // Mark token as used + record download time — fire and forget
  supabase.from('download_requests')
    .update({ token_used: true })
    .eq('jwt_token', token)
    .then(() => {})

  supabase.from('packs')
    .update({ downloaded_at: new Date().toISOString() })
    .eq('id', payload.packId)
    .then(() => {})

  // Build ZIP from saved pack data
  const zipBuffer = await assemblePackZip({
    packId: pack.id,
    images: pack.images_data,
    productDescription: pack.product_description,
    postingSchedule: pack.posting_schedule,
  })

  // Stream ZIP directly to browser
  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="pixpack_${pack.id.slice(0, 8)}.zip"`,
      'Content-Length': zipBuffer.byteLength.toString(),
    },
  })
}
```

### `POST /api/confirm-share`

```ts
// app/api/confirm-share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  platform: z.enum(['twitter', 'instagram', 'linkedin']),
})

export async function POST(req: NextRequest) {
  try {
    const { email, platform } = schema.parse(await req.json())
    const supabase = getSupabaseAdmin()
    await supabase.from('share_unlocks').insert({ email, platform })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
```

---

## ZIP ASSEMBLER — SERVER SIDE

```ts
// lib/pack-assembler.ts — server only, never import in client components
import JSZip from 'jszip'

interface PackImage {
  platform: string
  angle: string
  imageBase64: string
  caption: string
  hashtags: string[]
  adCopy: { awareness: string; consideration: string; conversion: string }
  engagementScore: { score: number; label: string; reason: string; tip: string }
}

export async function assemblePackZip(params: {
  packId: string
  images: PackImage[]
  productDescription: {
    title: string
    subtitle: string
    bulletFeatures: string[]
    seoMetaTitle: string
    seoMetaDescription: string
  }
  postingSchedule: Array<{
    platform: string
    bestDay: string
    bestTime: string
    timezone: string
    reason: string
  }>
}): Promise<Buffer> {
  const zip = new JSZip()
  const root = zip.folder(`pixpack_${params.packId.slice(0, 8)}`)!
  const images = root.folder('images')!

  // Images
  params.images.forEach((img, i) => {
    const base64 = img.imageBase64.replace(/^data:image\/\w+;base64,/, '')
    images.file(`${String(i + 1).padStart(2, '0')}_${img.platform}_${img.angle}.png`, base64, { base64: true })
  })

  // Captions
  root.file('captions.txt',
    params.images.map((img, i) =>
      `IMAGE ${i + 1} — ${img.platform} / ${img.angle}\n\n${img.caption}\n\n${img.hashtags.join(' ')}`
    ).join('\n\n' + '─'.repeat(40) + '\n\n')
  )

  // Ad copy
  root.file('ad_copy.txt',
    params.images.map((img, i) =>
      `IMAGE ${i + 1} — ${img.platform} / ${img.angle}\n\nAWARENESS\n${img.adCopy.awareness}\n\nCONSIDERATION\n${img.adCopy.consideration}\n\nCONVERSION\n${img.adCopy.conversion}`
    ).join('\n\n' + '═'.repeat(40) + '\n\n')
  )

  // Engagement scores
  root.file('engagement_scores.txt',
    params.images.map((img, i) =>
      `IMAGE ${i + 1} — ${img.platform} / ${img.angle}\nScore: ${img.engagementScore.score}/10 (${img.engagementScore.label})\nWhy: ${img.engagementScore.reason}\nTip: ${img.engagementScore.tip}`
    ).join('\n\n' + '─'.repeat(40) + '\n\n')
  )

  // Product description
  root.file('product_description.txt',
    `TITLE\n${params.productDescription.title}\n\nTAGLINE\n${params.productDescription.subtitle}\n\nFEATURES\n${params.productDescription.bulletFeatures.map(f => `• ${f}`).join('\n')}\n\nSEO META TITLE\n${params.productDescription.seoMetaTitle}\n\nSEO META DESCRIPTION\n${params.productDescription.seoMetaDescription}`
  )

  // Posting schedule
  root.file('posting_schedule.txt',
    params.postingSchedule.map(s =>
      `${s.platform}\nBest time: ${s.bestDay} at ${s.bestTime} (${s.timezone})\nWhy: ${s.reason}`
    ).join('\n\n')
  )

  // README
  root.file('README.txt',
    `PixPack Content Pack\n${'─'.repeat(40)}\nGenerated: ${new Date().toUTCString()}\nPack ID: ${params.packId}\n\nCONTENTS\nimages/                  Platform-native product images\ncaptions.txt             Social captions + hashtags\nad_copy.txt              3 ad variants per image\nengagement_scores.txt    AI performance predictions\nproduct_description.txt  Shopify-ready product listing\nposting_schedule.txt     Best times to post per platform\n\nMade with PixPack\n${process.env.NEXT_PUBLIC_APP_URL}`
  )

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  return buffer
}
```

---

## EMAIL — RESEND

```bash
npm install resend
```

```ts
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendDownloadEmail(params: {
  to: string
  downloadUrl: string
  expiresAt: string
}) {
  const expiryFormatted = new Date(params.expiresAt).toLocaleString('en-US', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC'
  }) + ' UTC'

  await resend.emails.send({
    from: `PixPack <packs@${process.env.RESEND_FROM_DOMAIN}>`,
    to: params.to,
    subject: 'Your PixPack content pack is ready ✦',
    html: `
      <div style="max-width:560px;margin:0 auto;font-family:system-ui,sans-serif;color:#1a1917;background:#f5f2ed;padding:24px;">
        <div style="background:#0c0c0b;padding:20px 28px;border-radius:12px 12px 0 0;">
          <span style="font-size:20px;font-weight:800;color:#ff4d1c;">Pix</span><span style="font-size:20px;font-weight:800;color:#fff;">Pack</span>
        </div>
        <div style="background:#fff;padding:28px;border:1px solid #e2ddd5;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;color:#1a1917;">Your content pack is ready</h2>
          <p style="color:#6b6760;font-size:14px;line-height:1.6;margin:0 0 24px;">
            6 platform-native images · captions · ad copy variants · engagement scores · product description — all packed and ready.
          </p>
          <a href="${params.downloadUrl}"
            style="display:inline-block;background:#ff4d1c;color:#fff;padding:13px 26px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
            Download your pack →
          </a>
          <p style="color:#9e9a92;font-size:12px;margin:18px 0 0;">
            Link expires ${expiryFormatted} · One-time download
          </p>
          <hr style="border:none;border-top:1px solid #e2ddd5;margin:22px 0;" />
          <p style="color:#9e9a92;font-size:12px;margin:0;line-height:1.6;">
            Made with PixPack — AI product content for merchants worldwide.<br/>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#ff4d1c;text-decoration:none;">Generate another pack →</a>
          </p>
        </div>
      </div>
    `,
  })
}
```

---

## DOWNLOAD GATE MODAL COMPONENT

```tsx
// components/output/DownloadGateModal.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Share2, Twitter, Instagram, Linkedin, CheckCircle2, Loader2 } from 'lucide-react'
import type { GeneratedPack } from '@/types'

type ModalState =
  | { view: 'email' }
  | { view: 'uploading' }       // uploading pack to server
  | { view: 'success' }
  | { view: 'rate_limited'; reason: 'email' | 'ip' }
  | { view: 'share_success' }
  | { view: 'error'; message: string }

const SHARE_OPTIONS = [
  {
    id: 'twitter' as const,
    label: 'Share on X',
    Icon: Twitter,
    color: '#000000',
    getText: (url: string) =>
      `Just generated a full content pack in 60s with @PixPackApp 🔥\n\nOne product photo → 6 images + ad copy + engagement scores.\n\nFree: ${url}`,
  },
  {
    id: 'instagram' as const,
    label: 'Story on Instagram',
    Icon: Instagram,
    color: '#E1306C',
    getText: () => '',
  },
  {
    id: 'linkedin' as const,
    label: 'Post on LinkedIn',
    Icon: Linkedin,
    color: '#0A66C2',
    getText: () => '',
  },
] as const

interface Props {
  pack: GeneratedPack
  onClose: () => void
}

export function DownloadGateModal({ pack, onClose }: Props) {
  const [state, setState] = useState<ModalState>({ view: 'email' })
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  async function handleSubmit() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    setEmailError('')
    setState({ view: 'uploading' })

    try {
      const res = await fetch('/api/request-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pack, email }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setState({ view: 'rate_limited', reason: data.reason })
        return
      }
      if (!res.ok) throw new Error(data.error)

      setState({ view: 'success' })

    } catch (err) {
      setState({ view: 'error', message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' })
    }
  }

  async function handleShare(option: typeof SHARE_OPTIONS[number]) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

    if (option.id === 'twitter') {
      const text = option.getText(appUrl)
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    } else if (option.id === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`, '_blank', 'noopener,noreferrer')
    } else {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
    }

    // Wait 3s (give them time to share) then grant unlock
    await new Promise(r => setTimeout(r, 3000))

    await fetch('/api/confirm-share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, platform: option.id }),
    })

    setState({ view: 'share_success' })

    // Auto-return to email view after 2.5s so they can retry
    setTimeout(() => setState({ view: 'email' }), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 14 }}
        transition={{ ease: [0.34, 1.2, 0.64, 1], duration: 0.3 }}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm overflow-hidden shadow-[var(--shadow-lg)]"
      >
        <AnimatePresence mode="wait">

          {/* EMAIL INPUT */}
          {state.view === 'email' && (
            <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--text)]">Get your content pack</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    We'll email you a secure download link.<br />Expires in 24 hours.
                  </p>
                </div>
                <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 transition-colors flex-shrink-0">
                  <X size={15} />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-[var(--surface2)] transition-colors
                  ${emailError ? 'border-red-400' : 'border-[var(--border)] focus-within:border-[var(--accent)]'}`}>
                  <Mail size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
                    autoFocus
                  />
                </div>
                {emailError && <p className="text-xs text-red-400">{emailError}</p>}
                <motion.button
                  onClick={handleSubmit}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display font-bold text-sm py-2.5 rounded-xl transition-colors"
                >
                  Send my pack →
                </motion.button>
                <p className="text-[11px] text-[var(--text-muted)] text-center">
                  Free during beta · No spam, ever
                </p>
              </div>
            </motion.div>
          )}

          {/* UPLOADING */}
          {state.view === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-10 flex flex-col items-center gap-3 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}>
                <Loader2 size={28} className="text-[var(--accent)]" />
              </motion.div>
              <p className="text-sm font-semibold text-[var(--text)]">Securing your pack...</p>
              <p className="text-xs text-[var(--text-muted)]">Uploading {pack.images.length} images · Sending email</p>
            </motion.div>
          )}

          {/* SUCCESS */}
          {state.view === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center gap-4 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.1 }}>
                <CheckCircle2 size={44} className="text-[var(--accent3)]" />
              </motion.div>
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--text)] mb-1">Check your inbox</h3>
                <p className="text-sm text-[var(--text-secondary)]">Download link sent to</p>
                <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{email}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">Link expires in 24 hours · One-time use</p>
              </div>
              <button onClick={onClose}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 transition-colors mt-1">
                Back to my pack
              </button>
            </motion.div>
          )}

          {/* RATE LIMITED */}
          {state.view === 'rate_limited' && (
            <motion.div key="ratelimit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--text)]">Daily limit reached</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    Share PixPack on social media<br />to unlock 3 more packs today
                  </p>
                </div>
                <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 flex-shrink-0">
                  <X size={15} />
                </button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--accent-dim)] mb-3">
                  <Share2 size={13} className="text-[var(--accent)] flex-shrink-0" />
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Click any option below, share, and your download unlocks instantly
                  </p>
                </div>
                {SHARE_OPTIONS.map(option => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleShare(option)}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface2)] transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${option.color}15` }}>
                      <option.Icon size={15} style={{ color: option.color }} />
                    </div>
                    <span className="text-sm font-medium text-[var(--text)]">{option.label}</span>
                    <span className="ml-auto text-xs text-[var(--accent)] font-semibold">Unlock →</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* SHARE SUCCESS */}
          {state.view === 'share_success' && (
            <motion.div key="sharesuccess" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center gap-3 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                <CheckCircle2 size={40} className="text-[var(--accent3)]" />
              </motion.div>
              <h3 className="font-display font-bold text-base text-[var(--text)]">Pack unlocked!</h3>
              <p className="text-xs text-[var(--text-muted)]">Thanks for sharing. Returning to download...</p>
            </motion.div>
          )}

          {/* ERROR */}
          {state.view === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-6 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-[var(--text)]">{state.message}</p>
              <button
                onClick={() => setState({ view: 'email' })}
                className="text-xs text-[var(--accent)] underline underline-offset-2"
              >
                Try again
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}
```

---

## CLEANUP CRON — VERCEL CRON JOB

```ts
// app/api/cron/cleanup/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron, not random requests
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count: packsDeleted } = await supabase
    .from('packs')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString())

  const { count: requestsDeleted } = await supabase
    .from('download_requests')
    .delete({ count: 'exact' })
    .lt('created_at', cutoff)

  return NextResponse.json({
    success: true,
    deleted: { packs: packsDeleted, requests: requestsDeleted }
  })
}
```

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup",
    "schedule": "0 3 * * *"
  }]
}
```

Add to `.env.local`:
```bash
CRON_SECRET=another-random-secret
# generate: openssl rand -base64 32
```

---

## NEXT.JS BODY SIZE CONFIG

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}
export default nextConfig
```

---

## COMPLETE ENV ADDITIONS

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email
RESEND_API_KEY=your_resend_key
RESEND_FROM_DOMAIN=pixpack.saberlabs.dev

# Security
DOWNLOAD_SECRET=generate-with-openssl-rand-base64-32
CRON_SECRET=generate-with-openssl-rand-base64-32
```

---

## INSTALL ALL DEPENDENCIES

```bash
npm install @supabase/supabase-js resend jose jszip
npm install --save-dev @types/jszip
```

---

## STORAGE MATH — FREE TIER SAFETY

```
Pack size in DB:      ~4.8MB JSONB per row (base64 images)
Supabase free DB:     500MB
Max concurrent packs: ~100 packs
With 24h auto-delete: effectively unlimited at beta scale

If 100 users simultaneously have active packs = 480MB
Cron runs at 3AM daily → clears expired packs → back to ~0MB
At beta traffic this is completely safe.

Upgrade trigger: when you consistently see >80 concurrent active packs
```
