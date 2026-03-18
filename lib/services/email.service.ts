/**
 * lib/services/email.service.ts
 *
 * Handles all email sending for PixPack.
 *
 * Uses Resend's native React rendering — no manual render() call needed.
 * Resend renders the React Email component to HTML server-side automatically.
 *
 * X-Entity-Ref-ID with a unique UUID prevents Gmail from threading multiple
 * download emails together — each pack email appears as its own conversation.
 */

import { randomUUID } from 'node:crypto'
import { resend } from '@/lib/resend-client'
import { PixPackEmail } from '@/emails/pixpack-email'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendDownloadEmailParams {
    to: string
    packDownloadUrl: string
    imageCount?: number
    platforms?: string[]
    expiresIn?: string
}

export interface SendEmailResult {
    success: boolean
    messageId?: string
    error?: string
}

// ─── Public function ──────────────────────────────────────────────────────────

export async function sendDownloadEmail(
    params: SendDownloadEmailParams,
): Promise<SendEmailResult> {
    const {
        to,
        packDownloadUrl,
        imageCount = 6,
        platforms = [],
        expiresIn = '24 hours',
    } = params

    try {
        const { data, error } = await resend.emails.send({
            from: buildFromAddress(),
            to: [to],
            subject: 'Your PixPack is ready — download before it expires',

            // Pass React component directly — Resend renders it to HTML automatically
            // No need to call render() manually
            react: PixPackEmail({ packDownloadUrl, expiresIn, imageCount, platforms }),

            // Plain text fallback for email clients that don't render HTML
            text: buildPlainText({ packDownloadUrl, expiresIn, imageCount }),

            // Prevent Gmail from threading multiple pack emails into one conversation.
            // Without this, a user who downloads 3 packs sees 1 collapsed thread
            // instead of 3 separate emails — making it hard to find a specific pack link.
            headers: {
                'X-Entity-Ref-ID': randomUUID(),
            },
        })

        if (error) {
            console.error('[email] Resend error:', error)
            return { success: false, error: error.message }
        }

        console.log(`[email] Download link sent to ${to} — ID: ${data?.id}`)
        return { success: true, messageId: data?.id }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown email error'
        console.error('[email] Failed to send:', message)
        return { success: false, error: message }
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFromAddress(): string {
    const domain = process.env.RESEND_FROM_DOMAIN
    if (!domain) {
        // Sandbox: only delivers to your Resend signup email
        console.warn('[email] RESEND_FROM_DOMAIN not set — using sandbox address')
        return 'onboarding@resend.dev'
    }
    return `PixPack <hello@${domain}>`
}

function buildPlainText(params: {
    packDownloadUrl: string
    expiresIn: string
    imageCount: number
}): string {
    return `
Your PixPack content pack is ready.

${params.imageCount} AI-generated images are waiting for you.

Download your pack:
${params.packDownloadUrl}

This link expires in ${params.expiresIn} and can only be used once.

---
PixPack — AI product content for global merchants
`.trim()
}