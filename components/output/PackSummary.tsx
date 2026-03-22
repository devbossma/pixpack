'use client'

import type { GeneratedPack } from '@/types'
import { PLATFORM_SPECS } from '@/lib/platforms'

export function PackSummary({ pack }: { pack: GeneratedPack }) {
  const successfulImages = pack.images.filter(i => i.status === 'done')
  const imageCount = successfulImages.length
  const adVariants = imageCount * 3

  const spec = PLATFORM_SPECS[pack.platform as keyof typeof PLATFORM_SPECS]
  const platformName = spec?.name ?? pack.platform
  const market = pack.audience.country ?? 'Global'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        label="Platform"
        value={platformName}
        accent
        small
      />
      <MetricCard
        label="Market"
        value={market}
        small
      />
      <MetricCard
        label="Variations"
        value={imageCount.toString()}
      />
      <MetricCard
        label="Ad Copies"
        value={adVariants.toString()}
      />
    </div>
  )
}

function MetricCard({ label, value, accent, small }: {
  label: string
  value: string
  accent?: boolean
  small?: boolean
}) {
  return (
    <div className="p-3 border border-[var(--output-border)] rounded-xl bg-[var(--output-surface)] shadow-[var(--shadow-sm)] flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--output-muted)]">{label}</span>
      <span
        className={`font-display font-bold text-[var(--output-text)] ${small ? 'text-sm' : 'text-2xl'} ${accent ? 'text-[var(--accent)]' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
