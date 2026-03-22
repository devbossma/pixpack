# Skill: Download Gate, Email Capture & Pack Persistence (V2)

Read this before implementing anything related to download, email, storage, or ZIP.

---

## THE ARCHITECTURE

```
GENERATION (zero persistence — images live in React state only)
  ↓ SSE streams 4 images into state
  ↓ User sees 4 variations
  ↓ Clicks any "Download Pack" button
                    ↓
MODAL OPENS (DownloadGateModal)
  ↓ User enters email, clicks "Send my pack →"
  ↓ POST /api/request-download
      body: { email, pack }   ← FULL GeneratedPack object
        → validate email (format + domain)
        → rate limit: 3/day per email, 5/day per IP
        → save pack to Supabase packs table
        → sign JWT (jose HS256, 24h, jti = randomUUID)
        → save to download_requests table
        → send email via Resend
        → return { success: true }
                    ↓
USER CLICKS EMAIL LINK
  GET /api/download?token=<JWT>
    → verify JWT (jose)
    → lookup jti in download_requests — check token_used = false
    → fetch pack from packs table
    → build ZIP server-side (jszip)
    → mark token_used = true
    → stream ZIP as attachment
                    ↓
CRON (daily 3AM)
  DELETE packs where expires_at < NOW()
```

---

## CRITICAL — V2 GeneratedPack SHAPE

The `GeneratedPack` returned by `generate.service.ts` in V2 is:

```ts
interface GeneratedPack {
  id:          string          // crypto.randomUUID()
  platform:    string          // single platform e.g. 'instagram_post'
  images:      GeneratedImage[] // exactly 4 variations
  audience:    UserConfig
  generatedAt: string
  // NO productDescription
  // NO postingSchedule
  // NO totalScore
}

interface GeneratedImage {
  id:          string
  variation:   number        // 1–4
  platform:    string
  angle:       string        // lifestyle | hero | context | closeup
  imageBase64: string | null // "data:image/png;base64,..." or null
  adCopy: {
    awareness:     string
    consideration: string
    conversion:    string
  }
  status:      'done' | 'error'
  error?:      string
  // NO caption, NO hashtags, NO engagementScore
}
```

Do NOT pass `productDescription`, `postingSchedule`, or `totalScore` anywhere.
These fields are **gone in V2**.

---

## POST /api/request-download

```
Input body: { email: string, pack: GeneratedPack }
```

The pack is sent whole — the route saves it to Supabase.

```ts
// app/api/request-download/route.ts
import { NextRequest, NextResponse }   from 'next/server'
import { createClient }                from '@supabase/supabase-js'
import { randomUUID }                  from 'node:crypto'
import { sendDownloadEmail }           from '@/lib/services/email.service'
import { signDownloadToken }           from '@/lib/services/token.service'
import type { GeneratedPack }          from '@/lib/types'
import { validateEmailDomain }         from '@/lib/email-validation'

export const maxDuration = 30

const MAX_PER_EMAIL_PER_DAY = 3
const MAX_PER_IP_PER_DAY    = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, pack }: { email: string; pack: GeneratedPack } = body

    // Validate email
    if (!email?.includes('@')) {
      return NextResponse.json({ error: 'Valid email address required' }, { status: 400 })
    }
    const domainCheck = validateEmailDomain(email)
    if (!domainCheck.valid) {
      return NextResponse.json({ error: domainCheck.reason }, { status: 400 })
    }
    if (!pack?.images?.length) {
      return NextResponse.json({ error: 'Invalid pack data' }, { status: 400 })
    }
    if (!pack.id) pack.id = randomUUID()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Rate limiting
    const ip        = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                   ?? request.headers.get('x-real-ip')
                   ?? 'unknown'
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [emailResult, ipResult] = await Promise.all([
      supabase.from('download_requests').select('id')
        .eq('email', email.toLowerCase()).gte('created_at', oneDayAgo),
      supabase.from('download_requests').select('id')
        .eq('ip_address', ip).gte('created_at', oneDayAgo),
    ])

    if ((emailResult.data?.length ?? 0) >= MAX_PER_EMAIL_PER_DAY) {
      return NextResponse.json(
        { error: `You've reached the limit of ${MAX_PER_EMAIL_PER_DAY} packs per day.` },
        { status: 429 }
      )
    }
    if ((ipResult.data?.length ?? 0) >= MAX_PER_IP_PER_DAY) {
      return NextResponse.json(
        { error: 'Too many requests from your network. Try again tomorrow.' },
        { status: 429 }
      )
    }

    // Save pack — V2 shape: images_data, platform, audience only
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data: savedPack, error: packError } = await supabase
      .from('packs')
      .insert({
        id:          pack.id,
        email:       email.toLowerCase(),
        images_data: pack.images,     // GeneratedImage[] with base64
        platform:    pack.platform,
        audience:    pack.audience,
        expires_at:  expiresAt,
      })
      .select('id')
      .single()

    if (packError) {
      console.error('[request-download] Save pack failed:', packError.message)
      return NextResponse.json({ error: 'Failed to save pack. Please try again.' }, { status: 500 })
    }

    // Sign JWT + save download_request
    const jti         = randomUUID()
    const token       = await signDownloadToken({ packId: savedPack.id, email: email.toLowerCase(), jti })
    const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/download?token=${token}`

    await supabase.from('download_requests').insert({
      pack_id:    savedPack.id,
      email:      email.toLowerCase(),
      ip_address: ip,
      jwt_token:  jti,
      expires_at: expiresAt,
    })

    // Send email
    const successfulImages = pack.images.filter(img => img.status === 'done')
    const { success: emailSent, error: emailError } = await sendDownloadEmail({
      to:              email,
      packDownloadUrl: downloadUrl,
      imageCount:      successfulImages.length,
      platforms:       [pack.platform],
      expiresIn:       '24 hours',
    })

    if (!emailSent) {
      console.error('[request-download] Email failed:', emailError)
      return NextResponse.json(
        { error: 'Pack saved but email failed. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[request-download] Fatal:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

---

## GET /api/download?token=<JWT>

```ts
// app/api/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import JSZip                         from 'jszip'
import { verifyDownloadToken }       from '@/lib/services/token.service'
import type { GeneratedImage }       from '@/lib/types'

export const maxDuration = 30

const VARIATION_LETTERS = ['A', 'B', 'C', 'D']

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) return htmlError('Missing download token.', 400)

    // 1. Verify JWT
    let payload: Awaited<ReturnType<typeof verifyDownloadToken>>
    try {
      payload = await verifyDownloadToken(token)
    } catch {
      return htmlError('This download link is invalid or has expired.', 401)
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // 2. One-time-use check
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('download_requests')
      .select('id, token_used')
      .eq('jwt_token', payload.jti)
      .single()

    if (tokenError || !tokenRecord) {
      return htmlError('Download link not found. Please generate a new pack.', 404)
    }
    if (tokenRecord.token_used) {
      return htmlError('This link has already been used. Generate a new pack to get a fresh link.', 410)
    }

    // 3. Fetch pack
    const { data: pack, error: packError } = await supabase
      .from('packs')
      .select('images_data, platform, audience')
      .eq('id', payload.packId)
      .single()

    if (packError || !pack) {
      return htmlError('Pack not found or has expired. Please generate a new one.', 404)
    }

    const images: GeneratedImage[] = pack.images_data

    // 4. Build ZIP
    const zip          = new JSZip()
    const imagesFolder = zip.folder('images')!

    // Images — named variation-A-lifestyle.png etc.
    for (const img of images) {
      if (img.status !== 'done' || !img.imageBase64) continue
      const base64  = img.imageBase64.replace(/^data:image\/\w+;base64,/, '')
      const ext     = img.imageBase64.startsWith('data:image/jpeg') ? 'jpg' : 'png'
      const letter  = VARIATION_LETTERS[img.variation - 1] ?? String(img.variation)
      imagesFolder.file(`variation-${letter}-${img.angle}.${ext}`, base64, { base64: true })
    }

    // ad_copy.txt
    const adLines: string[] = [
      'PIXPACK — AD COPY',
      '='.repeat(50),
      `Platform: ${pack.platform.replace(/_/g, ' ').toUpperCase()}`,
      '',
    ]
    for (const img of images) {
      if (img.status !== 'done') continue
      const letter = VARIATION_LETTERS[img.variation - 1] ?? String(img.variation)
      adLines.push('─'.repeat(40))
      adLines.push(`VARIATION ${letter} — ${img.angle.toUpperCase()}`)
      adLines.push('─'.repeat(40))
      adLines.push(`\nAWARENESS:\n${img.adCopy.awareness}\n`)
      adLines.push(`CONSIDERATION:\n${img.adCopy.consideration}\n`)
      adLines.push(`CONVERSION:\n${img.adCopy.conversion}\n`)
    }
    zip.file('ad_copy.txt', adLines.join('\n'))

    // README
    const successCount = images.filter(i => i.status === 'done').length
    zip.file('README.txt', buildReadme(pack.platform, successCount))

    // 5. Mark token used BEFORE streaming
    await supabase
      .from('download_requests')
      .update({ token_used: true, downloaded_at: new Date().toISOString() })
      .eq('id', tokenRecord.id)

    // 6. Stream ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    const date      = new Date().toISOString().slice(0, 10)
    const platform  = pack.platform.replace(/_/g, '-')

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/zip',
        'Content-Disposition': `attachment; filename="pixpack-${platform}-${date}.zip"`,
        'Content-Length':      zipBuffer.byteLength.toString(),
        'Cache-Control':       'no-store',
      },
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[download] Fatal:', message)
    return htmlError('Something went wrong. Please try again.', 500)
  }
}

function buildReadme(platform: string, imageCount: number): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pixpack.saberlabs.dev'
  return `PIXPACK — A/B TEST VARIATIONS
${'═'.repeat(40)}

Platform:   ${platform.replace(/_/g, ' ').toUpperCase()}
Variations: ${imageCount} generated
Generated:  ${new Date().toLocaleString()}

FILES
${'─'.repeat(40)}
images/
  variation-A-lifestyle.ext   Candid lifestyle scene
  variation-B-hero.ext        Studio hero shot
  variation-C-context.ext     Aspirational context
  variation-D-closeup.ext     Material detail macro
ad_copy.txt                   Awareness / Consideration / Conversion per variation

HOW TO USE
${'─'.repeat(40)}
Upload all 4 to your ads manager, split budget equally,
run for 7–14 days, keep the winner.

Generated by PixPack — ${siteUrl}
`
}

function htmlError(message: string, status: number): NextResponse {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '/'
  const html = `<!DOCTYPE html><html lang="en">
<head><meta charset="utf-8"><title>PixPack — Download Error</title>
<style>body{font-family:system-ui;background:#0c0c0b;color:#f0ece3;
display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
.card{max-width:400px;text-align:center}
.logo{font-size:24px;font-weight:700;margin-bottom:24px}
.logo span{color:#ff4d1c}p{color:#6b6760;line-height:1.6;margin-bottom:24px}
a{color:#ff4d1c;text-decoration:none}</style></head>
<body><div class="card">
<div class="logo">Pix<span>Pack</span></div>
<p>${message}</p><a href="${siteUrl}">← Back to PixPack</a>
</div></body></html>`
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html' } })
}
```

---

## JWT — lib/services/token.service.ts

```ts
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.DOWNLOAD_SECRET!)

export interface DownloadTokenPayload {
  packId: string
  email:  string
  jti:    string
}

export async function signDownloadToken(payload: DownloadTokenPayload): Promise<string> {
  return new SignJWT({ packId: payload.packId, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET)
}

export async function verifyDownloadToken(token: string): Promise<DownloadTokenPayload> {
  const { payload } = await jwtVerify(token, SECRET)
  if (!payload.packId || !payload.email || !payload.jti) {
    throw new Error('Invalid token payload')
  }
  return {
    packId: payload.packId as string,
    email:  payload.email  as string,
    jti:    payload.jti    as string,
  }
}
```

---

## EMAIL — lib/services/email.service.ts

```ts
import { randomUUID }   from 'node:crypto'
import { resend }       from '@/lib/resend'    // singleton: new Resend(key)
import { PixPackEmail } from '@/emails/PixPackEmail'

export interface SendDownloadEmailParams {
  to:              string
  packDownloadUrl: string
  imageCount?:     number
  platforms?:      string[]
  expiresIn?:      string
}

export interface SendEmailResult {
  success:    boolean
  messageId?: string
  error?:     string
}

export async function sendDownloadEmail(
  params: SendDownloadEmailParams,
): Promise<SendEmailResult> {
  const { to, packDownloadUrl, imageCount = 4, platforms = [], expiresIn = '24 hours' } = params

  try {
    const { data, error } = await resend.emails.send({
      from:    buildFromAddress(),
      to:      [to],
      subject: 'Your PixPack is ready — download before it expires',
      react:   PixPackEmail({ packDownloadUrl, expiresIn, imageCount, platforms }),
      text:    `Your PixPack is ready.\n\nDownload your ${imageCount} ad variations:\n${packDownloadUrl}\n\nExpires in ${expiresIn}. One-time use.`,
      headers: { 'X-Entity-Ref-ID': randomUUID() },  // prevents Gmail threading
    })

    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown email error'
    return { success: false, error: message }
  }
}

function buildFromAddress(): string {
  const domain = process.env.RESEND_FROM_DOMAIN
  if (!domain) return 'onboarding@resend.dev'  // Resend sandbox fallback
  return `PixPack <hello@${domain}>`
}
```

---

## lib/resend.ts (singleton)

```ts
import { Resend } from 'resend'
export const resend = new Resend(process.env.RESEND_API_KEY!)
```

---

## SUPABASE TABLES

```sql
CREATE TABLE packs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text,
  images_data jsonb NOT NULL,    -- GeneratedImage[] with imageBase64
  platform    text NOT NULL,
  audience    jsonb,
  created_at  timestamptz DEFAULT now(),
  expires_at  timestamptz DEFAULT (now() + interval '24 hours')
);

CREATE TABLE download_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id       uuid REFERENCES packs(id) ON DELETE CASCADE,
  email         text NOT NULL,
  ip_address    text,
  jwt_token     text NOT NULL,   -- jti UUID, not full token
  token_used    boolean DEFAULT false,
  expires_at    timestamptz NOT NULL,
  downloaded_at timestamptz,
  created_at    timestamptz DEFAULT now()
);
```

---

## CLEANUP CRON

```ts
// app/api/cron/cleanup/route.ts
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  await supabase.from('packs').delete().lt('expires_at', new Date().toISOString())
  return Response.json({ success: true })
}
```

```json
// vercel.json
{ "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }] }
```

---

## ENV VARS

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_DOMAIN=saberlabs.dev        # domain verified in Resend
DOWNLOAD_SECRET=<openssl rand -base64 32>
CRON_SECRET=<openssl rand -base64 32>
```

---

## PACKAGES

```bash
npm install @supabase/supabase-js resend @react-email/components jose jszip
```

`jszip` is **server-only** — only imported in `app/api/download/route.ts`.