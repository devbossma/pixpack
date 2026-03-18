'use client'

import { useState } from 'react'
import { ImageIcon, Megaphone, BarChart2, Clipboard, CheckCircle, Lightbulb } from 'lucide-react'
import type { GeneratedImage } from '@/types'

type Tab = 'image' | 'adcopy' | 'score'

const TABS: { id: Tab; Icon: typeof ImageIcon; label: string }[] = [
  { id: 'image',  Icon: ImageIcon,  label: 'Image'   },
  { id: 'adcopy', Icon: Megaphone,  label: 'Ad Copy' },
  { id: 'score',  Icon: BarChart2,  label: 'Score'   },
]

interface SlotTabsProps {
  image: GeneratedImage
}

export function SlotTabs({ image }: SlotTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('image')
  const [copiedField, setCopiedField] = useState<string | null>(null)

  async function copy(text: string, field: string) {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const scoreColor =
    image.engagementScore.score >= 8.5 ? '#00c27a' :
    image.engagementScore.score >= 7.0 ? '#ffb800' :
    image.engagementScore.score >= 5.0 ? '#ff8c00' : '#ff4444'

  return (
    <div className="flex flex-col">
      {/* Tab bar — fixed 36px height */}
      <div className="flex h-9 border-t border-b border-[var(--output-border)] bg-[var(--output-bg)]">
        {TABS.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-medium transition-colors
              ${activeTab === id
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] opacity-60 hover:opacity-90 border-b-2 border-transparent'
              }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Content area — fixed 160px height, scrolls if overflow */}
      <div className="h-40 overflow-y-auto bg-[var(--output-surface)]" style={{ scrollbarWidth: 'thin' }}>
        {activeTab === 'image' && (
          <div className="p-3 space-y-2">
            <p className="text-xs text-[var(--output-text)] leading-relaxed line-clamp-3">
              {image.caption}
            </p>
            <p className="text-[10px] font-mono text-[var(--accent)] break-words opacity-80 leading-relaxed">
              {image.hashtags.join(' ')}
            </p>
          </div>
        )}

        {activeTab === 'adcopy' && (
          <div className="p-3 space-y-2">
            {(['awareness', 'consideration', 'conversion'] as const).map(variant => (
              <div
                key={variant}
                className={`rounded-lg p-2.5 border text-xs ${
                  variant === 'awareness'    ? 'border-blue-500/20  bg-blue-500/5' :
                  variant === 'consideration'? 'border-amber-500/20 bg-amber-500/5' :
                                               'border-green-500/20 bg-green-500/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--output-muted)]">
                    {variant}
                  </span>
                  <button
                    onClick={() => copy(image.adCopy[variant], variant)}
                    className="text-[var(--output-muted)] hover:text-[var(--accent)] transition-colors"
                    aria-label={`Copy ${variant}`}
                  >
                    {copiedField === variant
                      ? <CheckCircle size={12} className="text-[var(--accent3)]" />
                      : <Clipboard size={12} />
                    }
                  </button>
                </div>
                <p className="text-[var(--output-text)] leading-relaxed text-[11px]">
                  {image.adCopy[variant]}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'score' && (
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span
                  className="text-3xl font-bold font-display"
                  style={{ color: scoreColor }}
                >
                  {image.engagementScore.score.toFixed(1)}
                </span>
                <span
                  className="inline-block ml-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ color: scoreColor, backgroundColor: `${scoreColor}22` }}
                >
                  {image.engagementScore.label}
                </span>
              </div>
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--output-border)" strokeWidth="4" />
                <circle
                  cx="22" cy="22" r="18" fill="none"
                  stroke={scoreColor} strokeWidth="4"
                  strokeDasharray={`${(image.engagementScore.score / 10) * 113.1} 113.1`}
                  strokeLinecap="round" transform="rotate(-90 22 22)"
                />
              </svg>
            </div>

            <p className="text-[11px] text-[var(--output-text)] leading-relaxed opacity-75">
              {image.engagementScore.reason}
            </p>

            <div className="flex gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <Lightbulb size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-[var(--output-text)] leading-relaxed opacity-90">
                {image.engagementScore.tip}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
