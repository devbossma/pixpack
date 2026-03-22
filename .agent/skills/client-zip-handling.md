# Skill: Client Download Flow (V2)

Read this before implementing any download button, download modal, or pack saving.

---

## THE RULE

**ZIP happens on the server. The client never touches jszip.**

The client's only job:
1. Trigger the `DownloadGateModal` when user clicks download
2. POST the full `GeneratedPack` to `/api/request-download`
3. Show the modal states (idle → loading → success / error / rate_limited)

The server builds the ZIP at `/api/download` when the user clicks the email link.
See `download-gate.md` for the server implementation.

---

## DOWNLOAD GATE MODAL

`components/output/DownloadGateModal.tsx`

Triggered by any download button. Receives the full `pack` as a prop.

States: `idle` → `loading` → `success` | `error` | `rate_limited`

```tsx
'use client'
import { useState }               from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, CheckCircle, Loader2, Mail } from 'lucide-react'
import type { GeneratedPack }     from '@/lib/types'

type ModalState = 'idle' | 'loading' | 'success' | 'error' | 'rate_limited'

interface DownloadGateModalProps {
  pack:    GeneratedPack
  onClose: () => void
}

export function DownloadGateModal({ pack, onClose }: DownloadGateModalProps) {
  const [state,   setState]   = useState<ModalState>('idle')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || state === 'loading') return
    setState('loading')

    try {
      const res = await fetch('/api/request-download', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, pack }),  // full pack object
      })
      const data = await res.json()

      if (res.status === 429) { setState('rate_limited'); setMessage(data.error); return }
      if (!res.ok)            { setState('error');        setMessage(data.error ?? 'Something went wrong.'); return }

      setState('success')
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && state !== 'success') onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 8  }}
        transition={{ ease: [0.25, 0.1, 0.25, 1], duration: 0.2 }}
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Close — always shown */}
        <button onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <AnimatePresence mode="wait">

          {/* IDLE / LOADING / ERROR / RATE_LIMITED */}
          {state !== 'success' && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(255,77,28,0.12)', border: '1px solid rgba(255,77,28,0.2)' }}>
                  <Download size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold"
                    style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    Your pack is ready
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Enter your email to receive the download link
                  </p>
                </div>
              </div>

              {/* What's in the ZIP */}
              <div className="flex gap-2 flex-wrap mb-5">
                {[
                  `${pack.images.filter(i => i.status === 'done').length} images`,
                  '4 variations (A/B/C/D)',
                  'Full ad copy',
                  '24h link',
                ].map(label => (
                  <span key={label} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                ))}
              </div>

              {/* Error / rate limit message */}
              {(state === 'error' || state === 'rate_limited') && (
                <div className="rounded-lg px-3 py-2.5 mb-4 text-sm"
                  style={{ backgroundColor: 'rgba(255,77,28,0.08)', border: '1px solid rgba(255,77,28,0.2)', color: 'var(--accent)' }}>
                  {message}
                </div>
              )}

              {/* Form — hidden on rate_limited */}
              {state !== 'rate_limited' && (
                <form onSubmit={handleSubmit}>
                  <div className="relative mb-3">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com" required disabled={state === 'loading'}
                      autoFocus
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                      style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                    />
                  </div>
                  <button type="submit" disabled={state === 'loading' || !email}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                    style={{ backgroundColor: 'var(--accent)', color: '#fff', opacity: (state === 'loading' || !email) ? 0.7 : 1 }}>
                    {state === 'loading'
                      ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
                      : <>Send my pack →</>}
                  </button>
                </form>
              )}

              <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Free · No account needed · No spam
              </p>
            </motion.div>
          )}

          {/* SUCCESS */}
          {state === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(0,194,122,0.12)', border: '1px solid rgba(0,194,122,0.25)' }}>
                <CheckCircle size={26} style={{ color: 'var(--accent3)' }} />
              </div>
              <h2 className="text-lg font-semibold mb-2"
                style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                Check your inbox
              </h2>
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>We sent your download link to</p>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{email}</p>
              <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                Expires in 24 hours · One-time use · Check spam if needed
              </p>
              <button onClick={onClose}
                className="px-6 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                Close
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
```

---

## HOW TO WIRE IT IN OutputGrid

```tsx
'use client'
import { useState }              from 'react'
import { AnimatePresence }       from 'framer-motion'
import { DownloadGateModal }     from '@/components/output/DownloadGateModal'
import type { GeneratedPack }    from '@/lib/types'

// In the component:
const [showDownload, setShowDownload] = useState(false)

// The button (in grid header AND on each OutputCard hover overlay):
<button onClick={() => setShowDownload(true)}>
  Download Pack
</button>

// The modal at the bottom of the JSX:
<AnimatePresence>
  {showDownload && (
    <DownloadGateModal
      pack={pack}
      onClose={() => setShowDownload(false)}
    />
  )}
</AnimatePresence>
```

---

## COPY AD COPY TO CLIPBOARD

The "Copy all copy" button in the OutputGrid header copies all 4 variations' copy to clipboard.

```ts
// utils/clipboard.ts
import type { GeneratedImage } from '@/lib/types'

const LETTERS = ['A', 'B', 'C', 'D']

export async function copyAllAdCopy(images: GeneratedImage[]): Promise<void> {
  const text = images
    .filter(img => img.status === 'done')
    .map(img => {
      const letter = LETTERS[img.variation - 1] ?? img.variation
      return [
        `── VARIATION ${letter} (${img.angle.toUpperCase()}) ──`,
        `Awareness:\n${img.adCopy.awareness}`,
        `Consideration:\n${img.adCopy.consideration}`,
        `Conversion:\n${img.adCopy.conversion}`,
      ].join('\n\n')
    })
    .join('\n\n' + '─'.repeat(40) + '\n\n')

  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // HTTP fallback (localhost dev)
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}
```

---

## WHAT NOT TO DO

```ts
// ❌ NEVER — no client-side ZIP in V2
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// ❌ NEVER — no direct download trigger (bypasses email gate)
function downloadImage(image: GeneratedImage) { ... }

// ❌ NEVER — referencing removed V1 fields
pack.productDescription  // does not exist in V2
pack.postingSchedule     // does not exist in V2
pack.totalScore          // does not exist in V2
image.caption            // does not exist in V2
image.hashtags           // does not exist in V2
image.engagementScore    // does not exist in V2

// ✅ ALWAYS — every download opens the modal
<button onClick={() => setShowDownload(true)}>Download Pack</button>
```