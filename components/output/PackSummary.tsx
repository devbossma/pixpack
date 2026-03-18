'use client'

import type { GeneratedPack } from '@/types'

export function PackSummary({ pack }: { pack: GeneratedPack }) {
  const successfulImages = pack.images.filter(i => i.status === 'done')
  const imageCount = successfulImages.length
  const adVariants = imageCount * 3
  const bestTime = pack.postingSchedule[0]
    ? `${pack.postingSchedule[0].bestDay} ${pack.postingSchedule[0].bestTime}`
    : '—'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        label="Avg Score"
        value={pack.totalScore.toFixed(1)}
        accent
      />
      <MetricCard
        label="Images"
        value={imageCount.toString()}
      />
      <MetricCard
        label="Ad Variants"
        value={adVariants.toString()}
      />
      <MetricCard
        label="Best Time"
        value={bestTime}
        small
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
