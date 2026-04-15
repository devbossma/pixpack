/**
 * middleware.ts (root)
 *
 * Next.js middleware — runs on every request before the page renders.
 * Delegates to updateSession() for Supabase auth session refresh
 * and route protection.
 *
 * Matcher excludes static assets, _next internals, and public files.
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - Static assets (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|ico|json|txt|xml|mp4)$).*)',
  ],
}
