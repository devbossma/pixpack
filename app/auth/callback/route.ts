/**
 * app/auth/callback/route.ts
 *
 * OAuth callback handler.
 * After Google OAuth consent, Supabase redirects here with a `code` parameter.
 * We exchange the code for a session, then redirect to /app.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect') ?? '/app'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(redirectTo, origin))
    }
  }

  // Auth error — redirect to login with error flag
  return NextResponse.redirect(new URL('/login?error=auth', origin))
}
