/**
 * app/auth/confirm/route.ts
 *
 * Email confirmation handler.
 *
 * Supabase SSR uses PKCE flow by default. When the user clicks the
 * confirmation link in their email:
 *   1. Supabase verifies the token on its server
 *   2. Redirects here with a `code` query parameter
 *   3. We exchange the code for a session (same as OAuth callback)
 *
 * Also handles the legacy implicit flow (`token_hash` + `type`) as fallback.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  // Create the success redirect response FIRST — we'll set cookies on it
  const redirectUrl = new URL('/app', origin)
  const response = NextResponse.redirect(redirectUrl)

  // Create Supabase client that writes cookies directly onto the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // PKCE flow (default for Supabase SSR) — exchange code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
  }

  // Implicit flow fallback — verify OTP directly
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (!error) {
      return response
    }
  }

  // Both methods failed
  return NextResponse.redirect(new URL('/login?error=confirmation', origin))
}
