/**
 * app/api/request-download/route.ts
 *
 * POST /api/request-download
 *
 * Called when user submits their email in the DownloadGateModal.
 * Receives the full generated pack from client state.
 *
 * Flow:
 *   1. Validate input (email + pack)
 *   2. Rate limit check (3/day per email, 5/day per IP)
 *   3. Save pack to Supabase packs table
 *   4. Generate signed JWT token (24h expiry)
 *   5. Save token to download_requests table
 *   6. Send download email via Resend
 *   7. Return { success: true }
 *
 * The client shows "Check your inbox" after this returns.
 * The actual ZIP is never sent here — only the email with the link.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { sendDownloadEmail } from '@/lib/services/email.service'
import { signDownloadToken } from '@/lib/services/token.service'
import type { GeneratedPack } from '@/lib/types'

export const maxDuration = 30

const MAX_PER_EMAIL_PER_DAY = 3
const MAX_PER_IP_PER_DAY = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, pack }: { email: string; pack: GeneratedPack } = body

    // 1. Validate
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address required' }, { status: 400 })
    }
    if (!pack?.images?.length) {
      return NextResponse.json({ error: 'Invalid pack data' }, { status: 400 })
    }

    // Guarantee a valid UUID — client state can lose the id field during
    // serialisation/deserialisation, so we generate one server-side if missing
    if (!pack.id) {
      pack.id = randomUUID()
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // 2. Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [emailCount, ipCount] = await Promise.all([
      supabase
        .from('download_requests')
        .select('id', { count: 'exact', head: true })
        .eq('email', email.toLowerCase())
        .gte('created_at', oneDayAgo),
      supabase
        .from('download_requests')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('created_at', oneDayAgo),
    ])

    if ((emailCount.count ?? 0) >= MAX_PER_EMAIL_PER_DAY) {
      return NextResponse.json(
        { error: `Limit of ${MAX_PER_EMAIL_PER_DAY} packs per day reached. Try again tomorrow.` },
        { status: 429 },
      )
    }
    if ((ipCount.count ?? 0) >= MAX_PER_IP_PER_DAY) {
      return NextResponse.json(
        { error: 'Too many requests from your network. Try again tomorrow.' },
        { status: 429 },
      )
    }

    // 3. Save pack to Supabase
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data: savedPack, error: packError } = await supabase
      .from('packs')
      .insert({
        id: pack.id,
        email: email.toLowerCase(),
        images_data: pack.images,
        platform: pack.platform,
        audience: pack.audience,
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (packError) {
      console.error('[request-download] Save pack failed:', packError.message)
      return NextResponse.json({ error: 'Failed to save pack. Please try again.' }, { status: 500 })
    }

    // 4. Generate signed JWT
    const jti = randomUUID()
    const token = await signDownloadToken({ packId: savedPack.id, email: email.toLowerCase(), jti })
    const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/download?token=${token}`

    // 5. Save token record
    await supabase
      .from('download_requests')
      .insert({
        pack_id: savedPack.id,
        email: email.toLowerCase(),
        ip_address: ip,
        jwt_token: jti,
        expires_at: expiresAt,
      })

    // 6. Send email
    const successfulImages = pack.images.filter(img => img.status === 'done')

    const { success: emailSent, error: emailError } = await sendDownloadEmail({
      to: email,
      packDownloadUrl: downloadUrl,
      imageCount: successfulImages.length,
      platforms: successfulImages.map(img => img.platform),
      expiresIn: '24 hours',
    })

    if (!emailSent) {
      console.error('[request-download] Email failed:', emailError)
      return NextResponse.json(
        { error: 'Pack saved but email failed. Please try again.' },
        { status: 500 },
      )
    }

    console.log(`[request-download] Pack ${savedPack.id} sent to ${email}`)
    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[request-download] Fatal:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}