'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Share2, Twitter, Instagram, Linkedin, CheckCircle2, Loader2 } from 'lucide-react'
import type { GeneratedPack } from '@/types'

type ModalState =
  | { view: 'email' }
  | { view: 'uploading' }
  | { view: 'success' }
  | { view: 'rate_limited'; reason: 'email' | 'ip' }
  | { view: 'share_success' }
  | { view: 'error'; message: string }

const SHARE_OPTIONS = [
  {
    id: 'twitter' as const,
    label: 'Share on X',
    Icon: Twitter,
    color: '#000000',
    getText: (url: string) =>
      `Just generated a full content pack in 60s with @PixPackApp 🔥\n\nOne product photo → 6 images + ad copy + engagement scores.\n\nFree: ${url}`,
  },
  {
    id: 'instagram' as const,
    label: 'Story on Instagram',
    Icon: Instagram,
    color: '#E1306C',
    getText: () => '',
  },
  {
    id: 'linkedin' as const,
    label: 'Post on LinkedIn',
    Icon: Linkedin,
    color: '#0A66C2',
    getText: () => '',
  },
] as const

interface Props {
  pack: GeneratedPack
  onClose: () => void
}

export function DownloadGateModal({ pack, onClose }: Props) {
  const [state, setState] = useState<ModalState>({ view: 'email' })
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  async function handleSubmit() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    setEmailError('')
    setState({ view: 'uploading' })

    try {
      // MOCK: test rate limit flow
      if (email.includes('+limit')) {
        await new Promise(r => setTimeout(r, 1000))
        setState({ view: 'rate_limited', reason: 'email' })
        return
      }

      // MOCK: 2 seconds to success
      await new Promise(r => setTimeout(r, 2000))
      
      // MOCK: throw an error roughly 1 in 10 times to test error UI occasionally
      // if (Math.random() < 0.1) throw new Error('Network error simulated')
      
      setState({ view: 'success' })

    } catch (err) {
      setState({ view: 'error', message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' })
    }
  }

  async function handleShare(option: typeof SHARE_OPTIONS[number]) {
    // We can simulate opening the window but won't completely in the mock so it doesn't pop up unnecessarily, or we'll simply let it run but we don't need real URL parameters for this mock
    
    // MOCK: wait 3s then success, back to email view
    await new Promise(r => setTimeout(r, 3000))
    setState({ view: 'share_success' })
    
    setTimeout(() => {
      setState({ view: 'email' })
    }, 2500)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 14 }}
        transition={{ ease: [0.34, 1.2, 0.64, 1], duration: 0.3 }}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm overflow-hidden shadow-[var(--shadow-lg)]"
      >
        <AnimatePresence mode="wait">

          {/* EMAIL INPUT */}
          {state.view === 'email' && (
            <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--text)]">Get your content pack</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    We'll email you a secure download link.<br />Expires in 24 hours.
                  </p>
                </div>
                <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 transition-colors flex-shrink-0">
                  <X size={15} />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-[var(--surface2)] transition-colors
                  ${emailError ? 'border-red-400' : 'border-[var(--border)] focus-within:border-[var(--accent)]'}`}>
                  <Mail size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
                    autoFocus
                  />
                </div>
                {emailError && <p className="text-xs text-red-400">{emailError}</p>}
                <motion.button
                  onClick={handleSubmit}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display font-bold text-sm py-2.5 rounded-xl transition-colors"
                >
                  Send my pack →
                </motion.button>
                <p className="text-[11px] text-[var(--text-muted)] text-center">
                  Free during beta · No spam, ever
                </p>
              </div>
            </motion.div>
          )}

          {/* UPLOADING */}
          {state.view === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-10 flex flex-col items-center gap-3 text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}>
                <Loader2 size={28} className="text-[var(--accent)]" />
              </motion.div>
              <p className="text-sm font-semibold text-[var(--text)]">Securing your pack...</p>
              <p className="text-xs text-[var(--text-muted)]">Uploading {pack.images.length} images · Sending email</p>
            </motion.div>
          )}

          {/* SUCCESS */}
          {state.view === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center gap-4 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.1 }}>
                <CheckCircle2 size={44} className="text-[var(--accent3)]" />
              </motion.div>
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--text)] mb-1">Check your inbox</h3>
                <p className="text-sm text-[var(--text-secondary)]">Download link sent to</p>
                <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{email}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">Link expires in 24 hours · One-time use</p>
              </div>
              <button onClick={onClose}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline underline-offset-2 transition-colors mt-1">
                Back to my pack
              </button>
            </motion.div>
          )}

          {/* RATE LIMITED */}
          {state.view === 'rate_limited' && (
            <motion.div key="ratelimit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
                <div>
                  <h3 className="font-display font-bold text-base text-[var(--text)]">Daily limit reached</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    Share PixPack on social media<br />to unlock 3 more packs today
                  </p>
                </div>
                <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 flex-shrink-0">
                  <X size={15} />
                </button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--accent-dim)] mb-3">
                  <Share2 size={13} className="text-[var(--accent)] flex-shrink-0" />
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Click any option below, share, and your download unlocks instantly
                  </p>
                </div>
                {SHARE_OPTIONS.map(option => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleShare(option)}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface2)] transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${option.color}15` }}>
                      <option.Icon size={15} style={{ color: option.color }} />
                    </div>
                    <span className="text-sm font-medium text-[var(--text)]">{option.label}</span>
                    <span className="ml-auto text-xs text-[var(--accent)] font-semibold">Unlock →</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* SHARE SUCCESS */}
          {state.view === 'share_success' && (
            <motion.div key="sharesuccess" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center gap-3 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                <CheckCircle2 size={40} className="text-[var(--accent3)]" />
              </motion.div>
              <h3 className="font-display font-bold text-base text-[var(--text)]">Pack unlocked!</h3>
              <p className="text-xs text-[var(--text-muted)]">Thanks for sharing. Returning to download...</p>
            </motion.div>
          )}

          {/* ERROR */}
          {state.view === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-6 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-[var(--text)]">{state.message}</p>
              <button
                onClick={() => setState({ view: 'email' })}
                className="text-xs text-[var(--accent)] underline underline-offset-2"
              >
                Try again
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}
