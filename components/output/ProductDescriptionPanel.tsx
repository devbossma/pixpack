'use client'

import { useState } from 'react'
import { Clipboard, CheckCircle } from 'lucide-react'
import type { ProductDescription } from '@/types'

export function ProductDescriptionPanel({ desc }: { desc: ProductDescription }) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const allBullets = desc.bulletFeatures.map(b => `• ${b}`).join('\n')

  return (
    <div className="p-5 border border-[var(--output-border)] rounded-xl bg-[var(--output-surface)] shadow-[var(--shadow-sm)]">
      <h3 className="font-display text-base font-bold text-[var(--output-text)] mb-4 uppercase tracking-wide text-sm">
        Shopify Product Listing
      </h3>

      <div className="space-y-4">
        {/* Title */}
        <FieldRow label="Title" value={desc.title} field="title" copiedField={copiedField} onCopy={copyToClipboard} />

        {/* Tagline */}
        {desc.subtitle && (
          <FieldRow label="Tagline" value={desc.subtitle} field="tagline" copiedField={copiedField} onCopy={copyToClipboard} />
        )}

        {/* Bullet features */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-[10px] font-bold text-[var(--output-muted)] uppercase tracking-widest">Product Description</h4>
            <button
              onClick={() => copyToClipboard(allBullets, 'bullets')}
              className="text-[var(--output-muted)] hover:text-[var(--accent)] transition-colors p-0.5"
              aria-label="Copy all bullet features"
            >
              {copiedField === 'bullets' ? <CheckCircle size={14} className="text-[var(--accent3)]" /> : <Clipboard size={14} />}
            </button>
          </div>
          <ul className="list-disc pl-4 text-sm text-[var(--output-text)] space-y-1">
            {desc.bulletFeatures.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>

        {/* SEO Meta Title */}
        <div>
          <h4 className="text-[10px] font-bold text-[var(--output-muted)] uppercase tracking-widest mb-1">SEO Meta Title</h4>
          <div className="flex items-center justify-between bg-[var(--output-bg)] p-2 rounded-md border border-[var(--output-border)]">
            <p className="text-xs text-[var(--output-text)] flex-1">{desc.seoMetaTitle}</p>
            <button
              onClick={() => copyToClipboard(desc.seoMetaTitle, 'seoTitle')}
              className="text-[var(--output-muted)] hover:text-[var(--accent)] transition-colors p-0.5 ml-2 flex-shrink-0"
              aria-label="Copy SEO meta title"
            >
              {copiedField === 'seoTitle' ? <CheckCircle size={14} className="text-[var(--accent3)]" /> : <Clipboard size={14} />}
            </button>
          </div>
        </div>

        {/* SEO Meta Description */}
        <div>
          <h4 className="text-[10px] font-bold text-[var(--output-muted)] uppercase tracking-widest mb-1">SEO Meta Description</h4>
          <div className="flex items-center justify-between bg-[var(--output-bg)] p-2 rounded-md border border-[var(--output-border)]">
            <p className="text-xs text-[var(--output-text)] flex-1">{desc.seoMetaDescription}</p>
            <button
              onClick={() => copyToClipboard(desc.seoMetaDescription, 'seoDesc')}
              className="text-[var(--output-muted)] hover:text-[var(--accent)] transition-colors p-0.5 ml-2 flex-shrink-0"
              aria-label="Copy SEO meta description"
            >
              {copiedField === 'seoDesc' ? <CheckCircle size={14} className="text-[var(--accent3)]" /> : <Clipboard size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldRow({ label, value, field, copiedField, onCopy }: {
  label: string
  value: string
  field: string
  copiedField: string | null
  onCopy: (text: string, field: string) => void
}) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-[var(--output-muted)] uppercase tracking-widest mb-1">{label}</h4>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--output-text)] flex-1">{value}</p>
        <button
          onClick={() => onCopy(value, field)}
          className="text-[var(--output-muted)] hover:text-[var(--accent)] transition-colors p-0.5 ml-2 flex-shrink-0"
          aria-label={`Copy ${label}`}
        >
          {copiedField === field ? <CheckCircle size={14} className="text-[var(--accent3)]" /> : <Clipboard size={14} />}
        </button>
      </div>
    </div>
  )
}
