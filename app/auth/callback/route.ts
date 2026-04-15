/**
 * app/auth/callback/route.ts
 *
 * OAuth callback handler.
 * After Google OAuth consent, Supabase redirects here with a `code` parameter.
 * We exchange the code for a session, then redirect to /app.
 *
 * IMPORTANT: We create the Supabase client with cookies bound
 * directly to the redirect response — this ensures the session
 * cookies are forwarded to the browser on redirect.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect') ?? '/app'

  if (code) {
    // Create the success redirect response FIRST — we'll set cookies on it
    const redirectUrl = new URL(redirectTo, origin)
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Cookies are already set on the response — session is established
      return response
    }
  }

  // Auth error — redirect to login with error flag
  return NextResponse.redirect(new URL('/login?error=auth', origin))
}
