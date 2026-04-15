/**
 * app/signup/page.tsx
 *
 * Signup page — public.
 * Renders the SignupForm client component within the PixPack branded shell.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your free PixPack account to start generating A/B-ready ad creatives.',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="py-6 px-6 flex items-center justify-center">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <span className="font-display font-black text-2xl tracking-tighter leading-none">
            <span className="text-[var(--text)]">Pix</span>
            <span className="text-[var(--accent)]">Pack</span>
          </span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">
              Create your account
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Start generating ad creatives in under 2 minutes
            </p>
          </div>

          <SignupForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-[11px] text-[var(--text-muted)]">
          © {new Date().getFullYear()} PixPack. AI product content for merchants worldwide.
        </p>
      </footer>
    </div>
  )
}
