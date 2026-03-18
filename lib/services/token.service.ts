/**
 * lib/services/token.service.ts
 *
 * Signs and verifies download JWT tokens using the jose library.
 *
 * Token payload:
 *   packId   — Supabase row ID to fetch on download
 *   email    — who requested the download
 *   jti      — unique token ID (used for one-time-use enforcement)
 *
 * Expiry: 24 hours from issue time.
 * Algorithm: HS256 (symmetric — same secret for sign + verify).
 */

import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.DOWNLOAD_SECRET!)
const EXPIRY = '24h'

export interface DownloadTokenPayload {
    packId: string
    email: string
    jti: string   // unique token ID — stored in DB for one-time-use check
}

export async function signDownloadToken(payload: DownloadTokenPayload): Promise<string> {
    return new SignJWT({ packId: payload.packId, email: payload.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setJti(payload.jti)
        .setIssuedAt()
        .setExpirationTime(EXPIRY)
        .sign(SECRET)
}

export async function verifyDownloadToken(token: string): Promise<DownloadTokenPayload> {
    const { payload } = await jwtVerify(token, SECRET)

    if (!payload.packId || !payload.email || !payload.jti) {
        throw new Error('Invalid token payload')
    }

    return {
        packId: payload.packId as string,
        email: payload.email as string,
        jti: payload.jti as string,
    }
}