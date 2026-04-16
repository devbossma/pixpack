/**
 * lib/email-validation.ts
 *
 * Utilities to validate email domains before allowing signup.
 */

import disposableDomains from 'disposable-email-domains'

// A list of the largest, most trusted consumer email providers
const MAJOR_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'msn.com',
  'live.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'zoho.com',
  'yandex.com'
]

/**
 * Checks if the email domain is in a known list of disposable/temporary email providers
 * (e.g., mailinator.com, tempmail.com).
 * This is the RECOMMENDED approach for B2B/SaaS apps, because it blocks spam
 * while still allowing legitimate business/custom domains (like hello@mystore.com).
 */
export function isDisposableEmail(email: string): boolean {
  try {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return false
    return disposableDomains.includes(domain)
  } catch {
    return false
  }
}

/**
 * Checks if the email domain matches a strict whitelist of major providers.
 * WARNING: Using this will block legitimate merchants who want to sign up
 * using their own business domain (e.g., info@their-ecommerce-site.com).
 */
export function isMajorEmailProvider(email: string): boolean {
  try {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return false
    return MAJOR_EMAIL_PROVIDERS.includes(domain)
  } catch {
    return false
  }
}
