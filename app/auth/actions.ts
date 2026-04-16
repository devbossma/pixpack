/**
 * app/auth/actions.ts
 *
 * Server actions for authentication.
 * - signOut: Signs out the user and redirects to landing page.
 */

'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

import { isDisposableEmail, isMajorEmailProvider } from '@/lib/email-validation'

export async function checkEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (isDisposableEmail(email)) {
    return { success: false, error: 'Disposable email addresses are not allowed. Please use your personal email.' }
  }

  // Optional: If you strictly want to restrict to ONLY major providers like Gmail, Yahoo, etc., you could uncomment this:
  if (!isMajorEmailProvider(email)) {
    return { success: false, error: 'Disposable email addresses are not allowed. Please use a major email provider like Gmail, Outlook, or Yahoo.' }
  }

  return { success: true }
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
  redirect('/')
}
