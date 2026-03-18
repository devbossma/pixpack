/**
 * lib/supabase.ts
 *
 * Server-side Supabase admin client.
 * Uses the service role key — never expose this to the browser.
 * Import only in app/api/ routes or lib/services/.
 */

import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
