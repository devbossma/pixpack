/**
 * app/auth/confirm/route.ts
 *
 * Email confirmation handler.
 * When a user clicks the confirmation link in their email,
 * Supabase redirects here with a token_hash and type.
 * We verify the OTP and redirect to `/app`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (tokenHash && type) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(new URL('/app', origin))
    }
  }

  // Verification failed
  return NextResponse.redirect(new URL('/login?error=confirmation', origin))
}
