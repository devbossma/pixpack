/**
 * app/api/download/route.ts
 *
 * GET /api/download?token=<JWT>
 *
 * Updated for Trigger.dev architecture:
 *   Images are stored in Supabase Storage, not as base64.
 *   imageUrl field contains a Supabase public URL.
 *
 * ZIP building:
 *   If imageUrl starts with 'http' → fetch from Supabase URL
 *   If imageUrl starts with 'data:' → decode real base64 (legacy)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import { verifyDownloadToken } from '@/lib/services/token.service'
import type { GeneratedImage } from '@/lib/types'

export const maxDuration = 30

const VARIATION_LETTERS = ['A', 'B', 'C', 'D']

// ─── Get image as Buffer — handles both URL and base64 ────────────────────────

async function getImageBuffer(image: GeneratedImage): Promise<Buffer | null> {
    const source = image.imageUrl
    if (!source) return null

    // Trigger.dev / queue path: imageUrl is a Supabase public URL
    if (source.startsWith('http')) {
        try {
            const res = await fetch(source, {
                signal: AbortSignal.timeout(10_000),
            })
            if (!res.ok) {
                console.error(`[download] Failed to fetch image URL: ${res.status}`)
                return null
            }
            return Buffer.from(await res.arrayBuffer())
        } catch (err) {
            console.error('[download] Image fetch error:', err)
            return null
        }
    }

    // Legacy / direct SSE path: real base64 string
    const base64 = source.replace(/^data:image\/\w+;base64,/, '')
    return Buffer.from(base64, 'base64')
}

// ─── Route handler ─────────────────────────────────────────────────────────────

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
            console.error('[download] Token lookup failed:', tokenError?.message)
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
            console.error('[download] Pack fetch failed:', packError?.message)
            return htmlError('Pack not found or has expired. Please generate a new one.', 404)
        }

        const images: GeneratedImage[] = pack.images_data as any

        // 4. Build ZIP — fetch images from Supabase URLs
        const zip = new JSZip()
        const imagesFolder = zip.folder('images')!

        for (const img of images) {
            if (img.status !== 'done') continue
            const buffer = await getImageBuffer(img)
            if (!buffer) continue
            const letter = VARIATION_LETTERS[img.variation - 1] ?? String(img.variation)
            imagesFolder.file(`variation-${letter}-${img.angle}.png`, buffer)
        }

        // ad_copy.txt
        const adLines: string[] = [
            'PIXPACK — AD COPY',
            '='.repeat(50),
            `Platform: ${(pack.platform ?? '').replace(/_/g, ' ').toUpperCase()}`,
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
        const platformLabel = (pack.platform ?? 'unknown').replace(/_/g, ' ').toUpperCase()
        zip.file('README.txt', [
            'PIXPACK — A/B TEST VARIATIONS', '='.repeat(40), '',
            `Platform:   ${platformLabel}`,
            `Variations: ${successCount} generated`,
            `Generated:  ${new Date().toLocaleString()}`,
            '',
            'FILES', '─'.repeat(40),
            'images/',
            '  variation-A-lifestyle.png',
            '  variation-B-hero.png',
            '  variation-C-context.png',
            '  variation-D-closeup.png',
            'ad_copy.txt',
            '',
            'HOW TO USE', '─'.repeat(40),
            'Upload all 4 to your ads manager, split budget equally,',
            'run for 7–14 days, keep the winner.',
            '',
            `Generated by PixPack — ${process.env.NEXT_PUBLIC_SITE_URL}`,
        ].join('\n'))

        // 5. Mark token used
        await supabase
            .from('download_requests')
            .update({ token_used: true, downloaded_at: new Date().toISOString() })
            .eq('id', tokenRecord.id)

        // 6. Stream ZIP
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
        const date = new Date().toISOString().slice(0, 10)
        const platform = (pack.platform ?? 'pack').replace(/_/g, '-')

        return new NextResponse(zipBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="pixpack-${platform}-${date}.zip"`,
                'Content-Length': zipBuffer.byteLength.toString(),
                'Cache-Control': 'no-store',
            },
        })

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        console.error('[download] Fatal:', message)
        return htmlError('Something went wrong. Please try again.', 500)
    }
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