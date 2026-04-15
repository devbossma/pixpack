'use client'

/**
 * components/auth/SignupForm.tsx
 *
 * Client component for the signup page.
 * Supports email/password with confirmation and Google OAuth.
 * Matches PixPack design system.
 */

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type FormState = 'idle' | 'loading' | 'success' | 'error'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formState, setFormState] = useState<FormState>('idle')
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setFormState('loading')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (authError) {
      setError(authError.message)
      setFormState('error')
      return
    }

    setFormState('success')
  }

  async function handleGoogleSignup() {
    setError(null)
    setOauthLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setOauthLoading(false)
    }
  }

  const isValid =
    email.includes('@') &&
    password.length >= 6 &&
    password === confirmPassword

  // Success state
  if (formState === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm mx-auto text-center"
      >
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[var(--accent3-dim)] border border-[var(--accent3)]/20 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-[var(--accent3)]" />
        </div>
        <h2 className="font-display text-xl font-bold text-[var(--text)] mb-2">
          Check your email
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          We sent a confirmation link to <strong className="text-[var(--text)]">{email}</strong>.
          Click the link to activate your account.
        </p>
        <div className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              onClick={() => { setFormState('idle'); setEmail(''); setPassword(''); setConfirmPassword('') }}
              className="text-[var(--accent)] hover:underline font-semibold"
            >
              try again
            </button>
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={oauthLoading || formState === 'loading'}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface2)] hover:border-[var(--border-hover)] text-sm font-semibold text-[var(--text)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {oauthLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      {/* Email + Password form */}
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Email
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full pl-10 pr-12 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-confirm" className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="signup-confirm"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full pl-10 pr-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
            />
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-[11px] text-red-400 mt-1">Passwords do not match</p>
          )}
        </div>

        {/* Error */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-400 leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || formState === 'loading' || oauthLoading}
          className="w-full py-3 px-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,77,28,0.15)] hover:shadow-[0_0_25px_rgba(255,77,28,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
        >
          {formState === 'loading' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating account…
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center text-xs text-[var(--text-muted)] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--accent)] hover:underline font-semibold">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
