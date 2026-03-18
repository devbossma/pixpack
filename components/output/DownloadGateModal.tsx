'use client'

/**
 * components/output/DownloadGateModal.tsx
 *
 * Shown when the user clicks "Download ZIP".
 * Gates the download behind an email field, then calls /api/request-download.
 *
 * States:
 *   idle       → email input form
 *   loading    → spinner on button while API call is in flight
 *   success    → "Check your inbox" confirmation
 *   error      → API returned error, show message + allow retry
 *   rate_limit → 429 response, distinct message (form hidden)
 *
 * Escape / backdrop closes in: idle, error, rate_limit
 * Escape / backdrop does NOT close in: loading, success
 */

import { useEffect, useState }       from 'react'
import { motion, AnimatePresence }    from 'framer-motion'
import { X, Download, CheckCircle, Loader2, Mail } from 'lucide-react'
import type { GeneratedPack }         from '@/types'

type ModalState = 'idle' | 'loading' | 'success' | 'error' | 'rate_limit'

interface DownloadGateModalProps {
  pack:    GeneratedPack
  onClose: () => void
}

export function DownloadGateModal({ pack, onClose }: DownloadGateModalProps) {
  const [state,   setState]   = useState<ModalState>('idle')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')

  const imageCount = pack.images.filter(i => i.status === 'done').length
  const canClose   = state !== 'loading' && state !== 'success'

  // Escape key — only when not in loading or success
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && canClose) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canClose, onClose])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!email.trim() || state === 'loading') return

    setState('loading')
    setMessage('')

    try {
      const res = await fetch('/api/request-download', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), pack }),
      })

      const data = await res.json() as { error?: string }

      if (res.status === 429) {
        setState('rate_limit')
        setMessage(data.error ?? 'Too many requests. Try again tomorrow.')
        return
      }

      if (!res.ok) {
        setState('error')
        setMessage(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setState('success')

    } catch {
      setState('error')
      setMessage('Network error. Please check your connection and try again.')
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.target === e.currentTarget && canClose) onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 8  }}
        transition={{ ease: [0.25, 0.1, 0.25, 1], duration: 0.2 }}
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{
          backgroundColor: 'var(--surface)',
          border:          '1px solid var(--border)',
          boxShadow:       'var(--shadow-lg)',
        }}
      >
        {/* Close button — hidden while loading or in success */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}

        <AnimatePresence mode="wait">

          {/* ── IDLE / LOADING / ERROR / RATE_LIMIT ── */}
          {state !== 'success' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--accent-dim)',
                    border:          '1px solid rgba(255,77,28,0.2)',
                  }}
                >
                  <Download size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h2
                    className="text-base font-semibold"
                    style={{ color: 'var(--text)', fontFamily: 'var(--font-syne, sans-serif)' }}
                  >
                    Your pack is ready
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Enter your email to receive the download link
                  </p>
                </div>
              </div>

              {/* Pack summary pills */}
              <div className="flex gap-2 flex-wrap mb-5">
                {[
                  `${imageCount} images`,
                  `${imageCount * 3} ad variants`,
                  'Shopify listing',
                  '24h link',
                ].map(label => (
                  <span
                    key={label}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: 'var(--surface2)',
                      border:          '1px solid var(--border)',
                      color:           'var(--text-muted)',
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Error message */}
              {state === 'error' && (
                <div
                  className="rounded-lg px-3 py-2.5 mb-4 text-sm"
                  style={{
                    backgroundColor: 'rgba(255,77,28,0.08)',
                    border:          '1px solid rgba(255,77,28,0.2)',
                    color:           'var(--accent)',
                  }}
                >
                  {message}
                </div>
              )}

              {/* Rate limit message — distinct from error */}
              {state === 'rate_limit' && (
                <div
                  className="rounded-lg px-3 py-2.5 mb-4 text-sm"
                  style={{
                    backgroundColor: 'rgba(255,184,0,0.08)',
                    border:          '1px solid rgba(255,184,0,0.25)',
                    color:           'var(--accent2)',
                  }}
                >
                  {message}
                </div>
              )}

              {/* Email form — hidden in rate_limit state */}
              {state !== 'rate_limit' && (
                <form onSubmit={handleSubmit}>
                  <div className="relative mb-3">
                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      id="download-gate-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoFocus
                      disabled={state === 'loading'}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors disabled:opacity-60"
                      style={{
                        backgroundColor: 'var(--surface2)',
                        border:          '1px solid var(--border)',
                        color:           'var(--text)',
                      }}
                      onFocus={e  => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
                    />
                  </div>

                  <button
                    id="download-gate-submit"
                    type="submit"
                    disabled={state === 'loading' || !email.trim()}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color:           '#fff',
                      opacity:         (state === 'loading' || !email.trim()) ? 0.7 : 1,
                      cursor:          (state === 'loading' || !email.trim()) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {state === 'loading' ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>Send my pack →</>
                    )}
                  </button>
                </form>
              )}

              <p
                className="text-center text-xs mt-3"
                style={{ color: 'var(--text-muted)' }}
              >
                Free · No account · No spam
              </p>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.08 }}
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  backgroundColor: 'rgba(0,194,122,0.12)',
                  border:          '1px solid rgba(0,194,122,0.25)',
                }}
              >
                <CheckCircle size={26} style={{ color: 'var(--accent3)' }} />
              </motion.div>

              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--text)', fontFamily: 'var(--font-syne, sans-serif)' }}
              >
                Check your inbox
              </h2>

              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                We sent your download link to
              </p>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                {email}
              </p>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                The link expires in 24 hours.
              </p>
              <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                Don&apos;t see it? Check your spam folder.
              </p>

              <button
                id="download-gate-close"
                onClick={onClose}
                className="px-6 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--surface2)',
                  border:          '1px solid var(--border)',
                  color:           'var(--text)',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                Close
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
