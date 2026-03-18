'use client'

import { useState } from 'react'
import { PLATFORM_SPECS } from '@/lib/platforms'
import type { PostingSchedule } from '@/types'

export function PostingSchedulePanel({ schedule }: { schedule: PostingSchedule[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!schedule || schedule.length === 0) return null

  const current = schedule[activeIndex] ?? schedule[0]

  return (
    <div className="p-5 border border-[var(--output-border)] rounded-xl bg-[var(--output-surface)] shadow-[var(--shadow-sm)]">
      <h3 className="font-display text-base font-bold text-[var(--output-text)] mb-4 uppercase tracking-wide text-sm">
        Best Time to Post
      </h3>

      {/* Platform tabs */}
      {schedule.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {schedule.map((slot, i) => {
            const spec = PLATFORM_SPECS[slot.platform as keyof typeof PLATFORM_SPECS]
            return (
              <button
                key={slot.platform}
                onClick={() => setActiveIndex(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-150
                  ${activeIndex === i
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                    : 'bg-transparent border-[var(--output-border)] text-[var(--output-muted)] hover:border-[var(--accent)] hover:text-[var(--output-text)]'
                  }`}
              >
                {spec?.name ?? slot.platform}
              </button>
            )
          })}
        </div>
      )}

      {/* Schedule data */}
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div className="bg-[var(--output-bg)] p-3 rounded-lg border border-[var(--output-border)]">
          <span className="block text-[10px] font-bold text-[var(--output-muted)] uppercase tracking-widest mb-1">Best Day</span>
          <p className="text-sm font-medium text-[var(--output-text)]">{current.bestDay}</p>
        </div>
        <div className="bg-[var(--output-bg)] p-3 rounded-lg border border-[var(--output-border)]">
          <span className="block text-[10px] font-bold text-[var(--output-muted)] uppercase tracking-widest mb-1">Best Time</span>
          <p className="text-sm font-medium text-[var(--output-text)]">{current.bestTime} ({current.timezone})</p>
        </div>
      </div>

      <p className="text-xs text-[var(--output-text)] opacity-70 border-l-2 border-[var(--accent)] pl-3 italic leading-relaxed">
        {current.reason}
      </p>
    </div>
  )
}
