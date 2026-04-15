/**
 * lib/supabase-auth.ts
 *
 * Server-side auth helper for API routes.
 * Extracts the authenticated user from the request cookies.
 *
 * Usage in route handlers:
 *   const user = await getAuthUser()
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export interface AuthUser {
  id: string
  email: string
}

/**
 * Returns the authenticated user or null.
 * Always validates with the Supabase auth server (getUser, not getSession).
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user || !user.email) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
  }
}
