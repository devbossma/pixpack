'use client'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function Topbar() {
  return (
    <header className="h-11 flex items-center justify-between px-4 border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)] sticky top-0 z-50 flex-shrink-0">
      <div className="font-display text-base font-extrabold tracking-tight">
        Pix<span className="text-[var(--accent)]">Pack</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text-muted)] font-medium">
          Beta · Free
        </span>
        <ThemeToggle />
      </div>
    </header>
  )
}
