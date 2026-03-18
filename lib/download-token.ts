/**
 * lib/download-token.ts
 *
 * Signs and verifies JWT tokens for download links.
 * Uses the `jose` library (Edge-compatible, no Node.js crypto dependency).
 *
 * Token payload:
 *   packId   — Supabase row ID to fetch the pack
 *   email    — who requested the download (for audit)
 *   iat/exp  — issued at / expires at (24h)
 *
 * One-time use is enforced at the DB level in /api/download —
 * the JWT alone does not prevent reuse.
 */

import { SignJWT, jwtVerify } from 'jose'

const SECRET = process.env.DOWNLOAD_SECRET
if (!SECRET) throw new Error('Missing DOWNLOAD_SECRET environment variable')

const key = new TextEncoder().encode(SECRET)

export interface DownloadTokenPayload {
  packId: string
  email:  string
}

/** Signs a new download token valid for 24 hours */
export async function signDownloadToken(
  payload: DownloadTokenPayload,
): Promise<string> {
  return new SignJWT({ packId: payload.packId, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

/** Verifies a download token. Throws if invalid or expired. */
export async function verifyDownloadToken(
  token: string,
): Promise<DownloadTokenPayload> {
  const { payload } = await jwtVerify(token, key)

  if (!payload.packId || !payload.email) {
    throw new Error('Invalid token payload')
  }

  return {
    packId: payload.packId as string,
    email:  payload.email  as string,
  }
}
