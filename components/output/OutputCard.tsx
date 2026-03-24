'use client'

import { useState } from 'react'
import { ImageIcon, AlertTriangle, Clipboard, CheckCircle, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GeneratedImage, Platform } from '@/types'
import { PLATFORM_SPECS } from '@/lib/platforms'
import { cardEntrance } from '@/lib/animations'
import { getImageSrc, hasImageSrc } from '@/lib/image-src'

type CopyTab = 'awareness' | 'consideration' | 'conversion'

const VARIATION_LETTERS = ['A', 'B', 'C', 'D'] as const

const ANGLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  lifestyle: { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/25' },
  hero:      { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/25' },
  context:   { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/25' },
  closeup:   { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/25' },
}

const COPY_TABS: { id: CopyTab; label: string; colorCls: string }[] = [
  { id: 'awareness',     label: 'Awareness',     colorCls: 'text-blue-400 border-blue-400' },
  { id: 'consideration', label: 'Consideration', colorCls: 'text-amber-400 border-amber-400' },
  { id: 'conversion',    label: 'Conversion',    colorCls: 'text-green-400 border-green-400' },
]

interface OutputCardProps {
  image: GeneratedImage
  index: number
  onDownload?: () => void
}

export function OutputCard({ image, index, onDownload }: OutputCardProps) {
  const [activeTab, setActiveTab] = useState<CopyTab | null>(null) // null = image view
  const [copiedField, setCopiedField] = useState<string | null>(null)

  async function copyToClipboard(text: string, field: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  function downloadImage(): void {
    const src = getImageSrc(image)
    if (!src) return

    if (src.startsWith('http') || src.startsWith('/api/image')) {
      // For URL images (queue path or local API), just open in new tab or use download attribute
      const a = document.createElement('a')
      a.href = src
      a.download = `pixpack-variation-${varLetter}-${image.angle}.png`
      a.target = '_blank'
      a.click()
      return
    }

    // For base64 images (SSE path)
    const base64Data = src.includes(',') ? src.split(',')[1] : src
    const byteChars = atob(base64Data)
    const byteNums = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
    const blob = new Blob([byteNums], { type: 'image/png' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pixpack-variation-${varLetter}-${image.angle}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  const spec = PLATFORM_SPECS[image.platform as Platform] ?? PLATFORM_SPECS.instagram_post
  const varLetter = VARIATION_LETTERS[(image.variation - 1)] ?? 'X'
  const angleColors = ANGLE_COLORS[image.angle] ?? ANGLE_COLORS.lifestyle

  function ratioToCss(ratio: string): string {
    return ratio.replace(':', '/')
  }

  const showingImage = activeTab === null

  return (
    <motion.div
      {...cardEntrance(index)}
      className="rounded-xl border border-[var(--output-border)] bg-[var(--output-surface)] overflow-hidden shadow-[var(--shadow-sm)] flex flex-col h-full group/card"
    >
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between border-b border-[var(--output-border)] px-3 py-1.5 flex-shrink-0">
        {/* Left: Variation label + Angle pill */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--output-text)]">
            Var {varLetter}
          </span>
          <span className={[
            'inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border',
            angleColors.bg, angleColors.text, angleColors.border,
          ].join(' ')}>
            {image.angle}
          </span>
        </div>

        {/* Right: Download single image */}
        {hasImageSrc(image) && (
          <button
            onClick={downloadImage}
            title="Download this image"
            className="opacity-0 group-hover/card:opacity-100 transition-opacity p-1.5 rounded-md text-[var(--output-muted)] hover:text-[var(--output-text)] hover:bg-[var(--output-bg)]"
          >
            <Download size={12} />
          </button>
        )}
      </div>

      {/* ── Tabs Row ── */}
      <div className="flex border-b border-[var(--output-border)] bg-[var(--output-bg)] flex-shrink-0">
        {/* Image tab */}
        <button
          onClick={() => setActiveTab(null)}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-r border-[var(--output-border)]',
            showingImage
              ? 'bg-[var(--output-surface)] text-[var(--output-text)]'
              : 'text-[var(--output-muted)] hover:text-[var(--output-text)]',
          ].join(' ')}
          aria-pressed={showingImage}
        >
          <ImageIcon size={10} />
          Image
        </button>

        {/* 3 copy tabs */}
        {COPY_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex-1 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors border-r last:border-r-0 border-[var(--output-border)]',
              activeTab === tab.id
                ? `bg-[var(--output-surface)] ${tab.colorCls} border-b-2 border-b-current`
                : 'text-[var(--output-muted)] hover:text-[var(--output-text)]',
            ].join(' ')}
            aria-pressed={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content area ── */}
      <div className="relative flex-1 min-h-0 bg-[var(--output-bg)]">
        <AnimatePresence mode="wait">
          {showingImage ? (
            /* ── Image panel ── */
            <motion.div
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full flex flex-col justify-center items-center"
            >
              <div
                className="relative w-full max-h-full"
                style={{ aspectRatio: spec.aspectRatio ? ratioToCss(spec.aspectRatio) : '1/1' }}
              >
                <div className="absolute inset-0 overflow-hidden border-b border-[var(--output-border)]">
                  {image.status === 'error' && !hasImageSrc(image) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--output-bg)] p-4">
                      <AlertTriangle size={24} className="text-[var(--accent2)]" />
                      <p className="text-xs text-[var(--output-muted)] text-center font-medium">
                        Variation failed
                      </p>
                      {image.error && (
                        <p className="text-[10px] text-[var(--output-muted)] text-center opacity-70 line-clamp-3">
                          {image.error}
                        </p>
                      )}
                    </div>
                  ) : !hasImageSrc(image) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--output-bg)]">
                      <div className="w-6 h-6 rounded-full border-2 border-[var(--output-border)] border-t-[var(--accent)] animate-spin" />
                      <span className="text-[10px] text-[var(--output-muted)]">Generating…</span>
                    </div>
                  ) : (
                    <motion.img
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      // eslint-disable-next-line @next/next/no-img-element
                      src={getImageSrc(image)!}
                      alt={`Variation ${varLetter} — ${image.angle}`}
                      className="absolute inset-0 w-full h-full object-contain bg-[var(--output-bg)]"
                    />
                  )}

                  {/* Dimensions badge on hover */}
                  <span className="absolute bottom-2 right-2 text-[10px] bg-black/40 text-white/80 px-2 py-0.5 rounded-full font-mono backdrop-blur-sm z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    {spec.width}×{spec.height}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── Ad Copy panel ── */
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 overflow-y-auto p-4 bg-[var(--output-surface)] custom-scrollbar"
            >
              {activeTab && (
                <div className="space-y-1">
                  {/* Copy field label */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={[
                      'text-[10px] font-bold uppercase tracking-widest',
                      COPY_TABS.find(t => t.id === activeTab)?.colorCls.split(' ')[0] ?? '',
                    ].join(' ')}>
                      {activeTab}
                    </span>
                    <button
                      onClick={() => copyToClipboard(image.adCopy[activeTab], activeTab)}
                      className="text-[var(--output-muted)] hover:text-[var(--accent)] transition-colors p-1 rounded-md hover:bg-[var(--output-bg)]"
                      aria-label={`Copy ${activeTab} copy`}
                    >
                      {copiedField === activeTab
                        ? <CheckCircle size={13} className="text-[var(--accent3)]" />
                        : <Clipboard size={13} />
                      }
                    </button>
                  </div>

                  <p className="text-sm text-[var(--output-text)] leading-relaxed whitespace-pre-wrap">
                    {image.adCopy[activeTab]}
                  </p>

                  {/* Context hint */}
                  <p className="text-[10px] text-[var(--output-muted)] mt-4 pt-3 border-t border-[var(--output-border)] leading-relaxed">
                    {activeTab === 'awareness' && 'Top-of-funnel hook — grabs attention in the first scroll'}
                    {activeTab === 'consideration' && 'Mid-funnel argument — makes the case why they need this'}
                    {activeTab === 'conversion' && 'Bottom-funnel CTA — urgency-driven close'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
