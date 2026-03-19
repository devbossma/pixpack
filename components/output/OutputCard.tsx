'use client'

import { useState } from 'react'
import { ImageIcon, Megaphone, BarChart2, AlertTriangle, Clipboard, CheckCircle, Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'
import type { GeneratedImage } from '@/types'
import { PLATFORM_SPECS } from '@/lib/platforms'
import { cardEntrance } from '@/lib/animations'
import { PlatformIcons } from './TemplateCard'

type Tab = 'image' | 'adcopy' | 'score'

interface OutputCardProps {
  image: GeneratedImage
  index: number
}

export function OutputCard({ image, index }: OutputCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('image')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const spec = PLATFORM_SPECS[image.platform as keyof typeof PLATFORM_SPECS]
  const scoreColor =
    image.engagementScore.score >= 8.5 ? '#00c27a' :
    image.engagementScore.score >= 7.0 ? '#ffb800' :
    image.engagementScore.score >= 5.0 ? '#ff8c00' : '#ff4444'

  // Aspect ratio helper
  function ratioToCss(ratio: string): string {
    return ratio.replace(':', '/')
  }

  const PlatformIcon = PlatformIcons[image.platform] || ImageIcon

  return (
    <motion.div
      {...cardEntrance(index)}
      className="rounded-xl border border-[var(--output-border)] bg-[var(--output-surface)] overflow-hidden shadow-[var(--shadow-sm)]"
    >
      {/* Tab bar */}
      <div className="flex border-b border-[var(--output-border)]">
        {([
          { id: 'image' as Tab,  Icon: ImageIcon,  label: 'Image' },
          { id: 'adcopy' as Tab, Icon: Megaphone,  label: 'Ad Copy' },
          { id: 'score' as Tab,  Icon: BarChart2,  label: 'Score' },
        ]).map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors
              ${activeTab === id
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] -mb-px bg-[var(--output-bg)]'
                : 'text-[var(--output-muted)] hover:text-[var(--output-text)] border-b-2 border-transparent'
              }`}
          >
             <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content container */}
      <div className="relative" style={{ aspectRatio: spec?.aspectRatio ? ratioToCss(spec.aspectRatio) : '1/1' }}>
        {/* We ALWAYS render the image container to enforce the card's physical layout height, 
            but we conditionally hide it if it's not the active tab. */}
        <div className={`w-full h-full ${activeTab !== 'image' && 'hidden'}`}>
          <div className="relative w-full h-full overflow-hidden bg-[var(--output-bg)] group">
              {image.status === 'regenerating' && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[var(--output-bg)] via-[var(--output-border)] to-[var(--output-bg)]"
                  style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}
                />
              )}

              {!image.imageBase64 && image.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--output-bg)]">
                  <AlertTriangle size={20} className="text-[var(--accent2)]" />
                  <p className="text-xs text-[var(--text-muted)] text-center px-4">
                    Generation failed
                  </p>
                </div>
              )}

              {image.imageBase64 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.imageBase64} alt={image.caption} className="absolute inset-0 w-full h-full object-cover" />
              )}

              {/* Platform badge (Top Left) */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 bg-black/60 text-white backdrop-blur-sm px-2 py-1 rounded-md">
                <PlatformIcon size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{spec?.name ?? image.platform}</span>
              </div>

              {/* Dimensions badge */}
              <span className="absolute bottom-2 right-2 text-[10px] bg-black/40 text-white/80 px-2 py-0.5 rounded-full font-mono backdrop-blur-sm z-10">
                {spec?.width ?? 1080}×{spec?.height ?? 1080}
              </span>
            </div>
          </div>

        {activeTab === 'adcopy' && (
          <div className="absolute inset-0 overflow-y-auto p-3 space-y-2 bg-[var(--output-surface)] custom-scrollbar">
            {([
              { key: 'awareness', label: 'AWARENESS', colorClass: 'bg-blue-500/5 border-blue-500/20' },
              { key: 'consideration', label: 'CONSIDERATION', colorClass: 'bg-amber-500/5 border-amber-500/20' },
              { key: 'conversion', label: 'CONVERSION', colorClass: 'bg-green-500/5 border-green-500/20' },
            ] as const).map(({ key, label, colorClass }) => (
              <div key={key} className={`border ${colorClass} rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--output-muted)]">{label}</span>
                  <button
                    onClick={() => copyToClipboard(image.adCopy[key], key)}
                    className="text-[var(--output-muted)] hover:text-[var(--accent)] transition-colors p-0.5"
                    aria-label={`Copy ${label}`}
                  >
                     {copiedField === key ? <CheckCircle size={16} className="text-[var(--accent3)]" /> : <Clipboard size={16} />}
                  </button>
                </div>
                <p className="text-sm text-[var(--output-text)] leading-relaxed">{image.adCopy[key]}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'score' && (
          <div className="absolute inset-0 overflow-y-auto p-4 space-y-4 bg-[var(--output-surface)] custom-scrollbar">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-display font-extrabold" style={{ color: scoreColor }}>
                  {image.engagementScore.score.toFixed(1)}/10
                </div>
                <span
                  className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ color: scoreColor, backgroundColor: `${scoreColor}18` }}
                >
                  {image.engagementScore.label}
                </span>
              </div>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="var(--output-border)" strokeWidth="4" />
                <circle cx="28" cy="28" r="24" fill="none" stroke={scoreColor} strokeWidth="4"
                  strokeDasharray={`${(image.engagementScore.score / 10) * 150.8} 150.8`}
                  strokeLinecap="round" transform="rotate(-90 28 28)" />
              </svg>
            </div>

            <div className="bg-[var(--output-bg)] p-3 rounded-lg border border-[var(--output-border)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--output-muted)] mb-1">Why this score</p>
              <p className="text-xs text-[var(--output-text)] leading-relaxed">{image.engagementScore.reason}</p>
            </div>

            <div className="flex gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
               <Lightbulb size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-0.5">Tip to improve</p>
                <p className="text-xs text-[var(--output-text)] opacity-90 leading-relaxed">{image.engagementScore.tip}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Caption & Hashtags always show at the bottom regardless of tab */}
      <div className="p-3 border-t border-[var(--output-border)] bg-[var(--output-surface)]">
        <p className="text-xs text-[var(--output-text)] leading-relaxed mb-1 line-clamp-2">{image.caption}</p>
        <p className="text-[10px] font-mono text-[var(--accent)] break-words truncate opacity-80">{image.hashtags.join(' ')}</p>
      </div>
    </motion.div>
  )
}
