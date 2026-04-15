/**
 * app/auth/confirm/route.ts
 *
 * Email confirmation handler.
 * When a user clicks the confirmation link in their email,
 * Supabase redirects here with a token_hash and type.
 * We verify the OTP and redirect to `/app`.
 *
 * IMPORTANT: We create the Supabase client with cookies bound
 * directly to the redirect response — this ensures the session
 * cookies are forwarded to the browser on redirect.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (tokenHash && type) {
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

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      // Cookies are already set on the response — session is established
      return response
    }
  }

  // Verification failed
  return NextResponse.redirect(new URL('/login?error=confirmation', origin))
}
