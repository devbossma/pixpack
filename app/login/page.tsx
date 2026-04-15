/**
 * app/login/page.tsx
 *
 * Login page — public.
 * Renders the LoginForm client component within the PixPack branded shell.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your PixPack account to generate A/B-ready ad creatives.',
}

export default function LoginPage() {
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
              Welcome back
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Sign in to your account to continue
            </p>
          </div>

          <Suspense fallback={
            <div className="w-full max-w-sm mx-auto animate-pulse space-y-4">
              <div className="h-12 bg-[var(--surface2)] rounded-xl" />
              <div className="h-12 bg-[var(--surface2)] rounded-xl" />
              <div className="h-12 bg-[var(--surface2)] rounded-xl" />
            </div>
          }>
            <LoginForm />
          </Suspense>
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
