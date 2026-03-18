# Skill: UI/UX, Theme System & Layout

Read this entire file before building or modifying any component, layout, or style.

---

## FONTS — IMPLEMENT EXACTLY THIS, NO FALLBACKS ALLOWED

```ts
// app/layout.tsx
import { Syne } from 'next/font/google'
import localFont from 'next/font/local'

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

// Cabinet Grotesk: download from https://www.fontshare.com/fonts/cabinet-grotesk
// Place at: public/fonts/CabinetGrotesk-Variable.woff2
const cabinet = localFont({
  src: '../public/fonts/CabinetGrotesk-Variable.woff2',
  variable: '--font-cabinet',
  display: 'swap',
  fallback: ['DM Sans', 'system-ui'],
})

// Apply both to <html>:
// <html className={`${syne.variable} ${cabinet.variable}`}>
```

If Cabinet Grotesk file is missing, use DM Sans from Google Fonts:
```ts
import { Syne, DM_Sans } from 'next/font/google'
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-cabinet', display: 'swap' })
```

```css
/* globals.css */
body {
  font-family: var(--font-cabinet), 'DM Sans', system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, .font-display {
  font-family: var(--font-syne), system-ui, sans-serif;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
```

---

## ICONS — LUCIDE-REACT ONLY, NEVER EMOJIS

```bash
npm install lucide-react
```

```tsx
// ✅ CORRECT
import { Upload, Scissors, Globe, Wand2, Download, Sun, Moon, ChevronDown, Copy, Check, BarChart2, Megaphone, Image, Lightbulb, Sparkles, ArrowRight, Package } from 'lucide-react'

// ❌ FORBIDDEN — emojis are OS-dependent and look amateur
const icon = '✂️'
```

Icon size standards (never deviate):
- Inline/button icons: `size={16}`
- Card icons: `size={20}`
- Section icons: `size={24}`
- Hero/display icons: `size={32}`

Always pair icons with `aria-label` when no visible text accompanies them.

Loading step icons (Lucide only):
```tsx
import { Scissors, ScanSearch, Globe, Wand2, MessageSquare, Package } from 'lucide-react'
const STEP_ICONS = [Scissors, ScanSearch, Globe, Wand2, MessageSquare, Package]
// Render as: const Icon = STEP_ICONS[stepIndex]; <Icon size={14} />
```

---

## THEME SYSTEM — COMPLETE CSS VARIABLE SPEC

### Both themes defined in globals.css

```css
/* globals.css */

/* ── DARK THEME (default) ── */
:root {
  color-scheme: dark;

  /* Shell backgrounds */
  --bg:              #0c0c0b;
  --surface:         #141412;
  --surface2:        #1c1c19;
  --surface3:        #242420;
  --border:          #2a2a25;
  --border-hover:    #3a3a34;

  /* Text */
  --text:            #f0ece3;
  --text-secondary:  #a09c94;
  --text-muted:      #605c55;

  /* Accent palette */
  --accent:          #ff4d1c;
  --accent-hover:    #e6431a;
  --accent-dim:      rgba(255, 77, 28, 0.12);
  --accent2:         #ffb800;
  --accent2-dim:     rgba(255, 184, 0, 0.12);
  --accent3:         #00c27a;
  --accent3-dim:     rgba(0, 194, 122, 0.12);
  --accent-info:     #3b82f6;
  --accent-info-dim: rgba(59, 130, 246, 0.12);

  /* Output panel (always light — images render better) */
  --output-bg:       #f5f2ed;
  --output-surface:  #ffffff;
  --output-border:   #e2ddd5;
  --output-text:     #1a1917;
  --output-muted:    #9e9a92;

  /* Sidebar */
  --sidebar-bg:      #0f0f0d;
  --sidebar-border:  #222220;

  /* Topbar */
  --topbar-bg:       #0c0c0b;
  --topbar-border:   #1e1e1c;

  /* Shadows */
  --shadow-sm:       0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:       0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg:       0 8px 32px rgba(0,0,0,0.6);
}

/* ── LIGHT THEME ── */
[data-theme="light"] {
  color-scheme: light;

  --bg:              #f5f2ed;
  --surface:         #ffffff;
  --surface2:        #f0ece4;
  --surface3:        #ebe7de;
  --border:          #e2ddd5;
  --border-hover:    #ccc8bf;

  --text:            #1a1917;
  --text-secondary:  #6b6760;
  --text-muted:      #a09c94;

  --accent:          #ff4d1c;
  --accent-hover:    #e6431a;
  --accent-dim:      rgba(255, 77, 28, 0.08);
  --accent2:         #e6a800;
  --accent2-dim:     rgba(230, 168, 0, 0.10);
  --accent3:         #009960;
  --accent3-dim:     rgba(0, 153, 96, 0.10);
  --accent-info:     #2563eb;
  --accent-info-dim: rgba(37, 99, 235, 0.08);

  --output-bg:       #f5f2ed;
  --output-surface:  #ffffff;
  --output-border:   #e2ddd5;
  --output-text:     #1a1917;
  --output-muted:    #9e9a92;

  --sidebar-bg:      #ffffff;
  --sidebar-border:  #e8e4db;

  --topbar-bg:       #ffffff;
  --topbar-border:   #e8e4db;

  --shadow-sm:       0 1px 3px rgba(0,0,0,0.08);
  --shadow-md:       0 4px 16px rgba(0,0,0,0.10);
  --shadow-lg:       0 8px 32px rgba(0,0,0,0.14);
}
```

### Theme Toggle Component

```tsx
// components/ui/ThemeToggle.tsx
'use client'
import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('pixpack-theme') as 'dark' | 'light' | null
    const initial = saved ?? 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial === 'dark' ? '' : 'light')
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next === 'dark' ? '' : 'light')
    localStorage.setItem('pixpack-theme', next)
  }

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.88 }}
      className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--border)] bg-[var(--surface2)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)] transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark'
        ? <Sun size={14} strokeWidth={2} />
        : <Moon size={14} strokeWidth={2} />
      }
    </motion.button>
  )
}
```

---

## FULL WORKSPACE LAYOUT — EXACT STRUCTURE

This is the production layout. Build it exactly.

```
┌──────────────────────────────────────────────────────┐
│ TOPBAR (h-11, sticky, z-50)                          │
│ [Logo] ──────────────── [Beta badge] [ThemeToggle]   │
├──────────────┬───────────────────────────────────────┤
│ SIDEBAR      │ MAIN PANEL                            │
│ w-72         │ flex-1                                │
│ (fixed left) │                                       │
│              │ ┌─────────────────────────────────┐   │
│ ─ Product ─  │ │ HERO SECTION                    │   │
│ UploadZone   │ │ (collapses on CTA click)         │   │
│              │ └─────────────────────────────────┘   │
│ ─ Audience ─ │                                       │
│ Country↓     │ ┌─────────────────────────────────┐   │
│ Age pills    │ │ OUTPUT PANEL (id="workspace")   │   │
│ Gender pills │ │                                 │   │
│ Interest↓    │ │ PackSummary (4 metric cards)    │   │
│              │ │                                 │   │
│ ─ Platforms ─│ │ OutputGrid                      │   │
│ Platform grid│ │ 3-col → 2-col → 1-col           │   │
│              │ │ OutputCard × N                  │   │
│ ─ Shot style─│ │ (tabs: Image / Ad Copy / Score) │   │
│ Angle pills  │ │                                 │   │
│              │ │ ProductDescriptionPanel         │   │
│ ─────────── │ │ PostingSchedulePanel            │   │
│ [Generate →] │ └─────────────────────────────────┘   │
└──────────────┴───────────────────────────────────────┘
```

### Root layout CSS

```tsx
// app/layout.tsx — body structure
<body className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
  <div className="flex flex-col h-screen overflow-hidden">
    <Topbar />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  </div>
</body>
```

### Topbar

```tsx
// components/layout/Topbar.tsx
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
```

### Sidebar

```tsx
// components/layout/Sidebar.tsx
'use client'
import { useGenerationStore } from '@/hooks/useGeneration'
import { UploadZone } from '@/components/upload/UploadZone'
import { CountrySelector } from '@/components/audience/CountrySelector'
import { PillSelector } from '@/components/ui/PillSelector'
import { PlatformGrid } from '@/components/platforms/PlatformGrid'
import { AGE_RANGES, GENDERS, INTERESTS, ANGLES } from '@/lib/config'
import { Wand2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Sidebar() {
  const { config, setConfig, canGenerate, startGeneration, isGenerating } = useGenerationStore()

  return (
    <aside className="w-72 flex-shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex flex-col overflow-y-auto">

      {/* Product photo */}
      <SidebarSection label="Product photo">
        <UploadZone />
      </SidebarSection>

      {/* Audience */}
      <SidebarSection label="Target audience">
        <div className="space-y-3">
          <div>
            <FieldLabel>Market</FieldLabel>
            <CountrySelector value={config.regionId} onChange={v => setConfig({ regionId: v })} />
          </div>
          <div>
            <FieldLabel>Age range</FieldLabel>
            <PillSelector options={AGE_RANGES} value={config.ageRange} onChange={v => setConfig({ ageRange: v })} single />
          </div>
          <div>
            <FieldLabel>Gender</FieldLabel>
            <PillSelector options={GENDERS} value={config.gender} onChange={v => setConfig({ gender: v })} single />
          </div>
          <div>
            <FieldLabel>Interest</FieldLabel>
            <CountrySelector
              options={INTERESTS}
              value={config.interest}
              onChange={v => setConfig({ interest: v })}
              placeholder="Select interest category..."
            />
          </div>
        </div>
      </SidebarSection>

      {/* Platforms */}
      <SidebarSection label="Platforms">
        <PlatformGrid value={config.platforms} onChange={v => setConfig({ platforms: v })} />
      </SidebarSection>

      {/* Shot style */}
      <SidebarSection label="Shot style" noBorder>
        <PillSelector options={ANGLES} value={config.angles} onChange={v => setConfig({ angles: v })} multi />
      </SidebarSection>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Generate button */}
      <div className="p-3 border-t border-[var(--sidebar-border)]">
        <AnimatePresence>
          {canGenerate && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <motion.button
                onClick={startGeneration}
                disabled={isGenerating}
                whileTap={{ scale: 0.97 }}
                animate={canGenerate && !isGenerating
                  ? { boxShadow: ['0 0 0 0 rgba(255,77,28,0.35)', '0 0 0 10px rgba(255,77,28,0)', '0 0 0 0 rgba(255,77,28,0)'] }
                  : {}
                }
                transition={{ boxShadow: { repeat: Infinity, duration: 2.2 } }}
                className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white font-display font-bold text-sm py-3 rounded-xl transition-colors"
              >
                <Wand2 size={15} />
                {isGenerating ? 'Generating...' : 'Generate pack'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        {!canGenerate && (
          <p className="text-xs text-center text-[var(--text-muted)]">
            Upload a photo and configure your audience to generate
          </p>
        )}
      </div>
    </aside>
  )
}

function SidebarSection({ label, children, noBorder }: {
  label: string
  children: React.ReactNode
  noBorder?: boolean
}) {
  return (
    <div className={`p-3 ${!noBorder ? 'border-b border-[var(--sidebar-border)]' : ''}`}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2.5">
        {label}
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs text-[var(--text-secondary)] mb-1.5">{children}</span>
}
```

---

## GEOGRAPHY / INTEREST SELECTOR — SEARCHABLE DROPDOWN

```tsx
// components/audience/CountrySelector.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { REGIONS } from '@/lib/regions'
import type { RegionId } from '@/lib/regions'

interface Option { id: string; label: string; flag?: string; continent?: string }

interface SelectorProps {
  value: string | null
  onChange: (id: any) => void
  placeholder?: string
  options?: Option[]   // if omitted, uses REGIONS
}

export function CountrySelector({ value, onChange, placeholder = 'Select target market...', options }: SelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const allOptions: Option[] = options ?? Object.values(REGIONS).map(r => ({
    id: r.id, label: r.label, flag: r.flag, continent: r.continent,
  }))

  const selected = value ? allOptions.find(o => o.id === value) : null

  const filtered = allOptions.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.continent?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  const grouped = filtered.reduce<Record<string, Option[]>>((acc, opt) => {
    const key = opt.continent ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(opt)
    return acc
  }, {})

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] hover:border-[var(--border-hover)] transition-colors text-xs"
      >
        <span className="flex items-center gap-1.5 truncate">
          {selected ? (
            <>{selected.flag && <span>{selected.flag}</span>}<span className="truncate">{selected.label}</span></>
          ) : (
            <span className="text-[var(--text-muted)]">{placeholder}</span>
          )}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onChange(null) }}
              className="p-0.5 text-[var(--text-muted)] hover:text-[var(--accent)]"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown size={12} className={`text-[var(--text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch('') }} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-full mt-1 left-0 right-0 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden"
            >
              <div className="p-1.5 border-b border-[var(--border)]">
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--surface2)]">
                  <Search size={12} className="text-[var(--text-muted)] flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 bg-transparent text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {Object.entries(grouped).map(([group, opts]) => (
                  <div key={group}>
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      {group}
                    </div>
                    {opts.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { onChange(opt.id); setOpen(false); setSearch('') }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-[var(--surface2)] transition-colors text-left
                          ${value === opt.id ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}
                      >
                        {opt.flag && <span className="w-4 flex-shrink-0">{opt.flag}</span>}
                        <span className="truncate">{opt.label}</span>
                        {value === opt.id && <span className="ml-auto text-[var(--accent)] text-[10px]">✓</span>}
                      </button>
                    ))}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="px-3 py-4 text-xs text-[var(--text-muted)] text-center">Nothing found</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## REUSABLE PILL SELECTOR

```tsx
// components/ui/PillSelector.tsx
'use client'
import { motion } from 'framer-motion'

interface PillOption { id: string; label: string }

interface PillSelectorProps {
  options: PillOption[]
  value: string | string[]
  onChange: (value: any) => void
  single?: boolean
  multi?: boolean
}

export function PillSelector({ options, value, onChange, single, multi }: PillSelectorProps) {
  function toggle(id: string) {
    if (single) {
      onChange(id)
    } else {
      const arr = Array.isArray(value) ? value : []
      onChange(arr.includes(id) ? arr.filter(v => v !== id) : [...arr, id])
    }
  }

  function isActive(id: string) {
    if (Array.isArray(value)) return value.includes(id)
    return value === id
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <motion.button
          key={opt.id}
          type="button"
          onClick={() => toggle(opt.id)}
          whileTap={{ scale: 0.92 }}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-150
            ${isActive(opt.id)
              ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
              : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text)]'
            }`}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  )
}
```

---

## PLATFORM GRID COMPONENT

```tsx
// components/platforms/PlatformGrid.tsx
'use client'
import { motion } from 'framer-motion'
import { PLATFORM_SPECS } from '@/lib/platforms'
import type { Platform } from '@/types'

export function PlatformGrid({ value, onChange }: {
  value: Platform[]
  onChange: (v: Platform[]) => void
}) {
  function toggle(id: Platform) {
    onChange(value.includes(id) ? value.filter(p => p !== id) : [...value, id])
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {Object.values(PLATFORM_SPECS).map(spec => {
        const active = value.includes(spec.id as Platform)
        return (
          <motion.button
            key={spec.id}
            type="button"
            onClick={() => toggle(spec.id as Platform)}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg border text-left transition-all duration-150 relative
              ${active
                ? 'border-[var(--accent)] bg-[var(--accent-dim)]'
                : 'border-[var(--border)] hover:border-[var(--border-hover)]'
              }`}
          >
            {active && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">✓</span>
              </span>
            )}
            <div className="text-xs font-medium text-[var(--text)] truncate pr-3">{spec.name}</div>
            <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{spec.width}×{spec.height}</div>
          </motion.button>
        )
      })}
    </div>
  )
}
```

---

## HERO SECTION — SEO + CTA + DOM-PERSISTENT COLLAPSE

```tsx
// components/hero/HeroSection.tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Globe, Download, BarChart2, Megaphone } from 'lucide-react'

export function HeroSection({ onStart }: { onStart: () => void }) {
  const [dismissed, setDismissed] = useState(false)

  function handleStart() {
    setDismissed(true)
    onStart()
    setTimeout(() => document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' }), 350)
  }

  // CRITICAL: animate height to 0, DO NOT conditionally unmount — SEO requires DOM presence
  return (
    <motion.section
      aria-labelledby="hero-heading"
      animate={dismissed
        ? { opacity: 0, height: 0, overflow: 'hidden', pointerEvents: 'none', marginBottom: 0 }
        : { opacity: 1, height: 'auto', overflow: 'visible', pointerEvents: 'auto' }
      }
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      style={{ visibility: dismissed ? 'hidden' : 'visible' }}
    >
      <div className="max-w-4xl mx-auto px-8 py-16 text-center">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface2)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent3)] animate-pulse" />
          Free during beta · No account needed
        </motion.div>

        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display text-5xl sm:text-6xl font-extrabold text-[var(--text)] leading-[1.05] tracking-tight mb-5"
        >
          Turn 1 product photo<br />
          <span className="text-[var(--accent)]">into a full content pack.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-8 leading-relaxed"
        >
          6 AI-generated images + captions + ad copy + engagement scores.
          Culturally adapted for any market worldwide.
          <strong className="text-[var(--text)] font-semibold"> Under 60 seconds.</strong>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {[
            { Icon: Globe,      text: '20+ global markets' },
            { Icon: BarChart2,  text: 'Engagement scoring' },
            { Icon: Megaphone,  text: 'Ad copy variants' },
            { Icon: Download,   text: 'ZIP in 60 seconds' },
            { Icon: Zap,        text: 'No account needed' },
          ].map(({ Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] border border-[var(--border)] bg-[var(--surface2)] rounded-full px-3 py-1.5">
              <Icon size={12} className="text-[var(--accent)]" />
              {text}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={handleStart}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            animate={{ boxShadow: ['0 0 0 0 rgba(255,77,28,0.3)', '0 0 0 16px rgba(255,77,28,0)', '0 0 0 0 rgba(255,77,28,0)'] }}
            transition={{ boxShadow: { repeat: Infinity, duration: 2.4 } }}
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display font-bold text-base px-8 py-3.5 rounded-xl transition-colors"
          >
            Start generating for free
            <ArrowRight size={17} />
          </motion.button>
          <p className="text-xs text-[var(--text-muted)] mt-3">No signup · No credit card</p>
        </motion.div>

        {/* SEO feature cards — always in DOM */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left"
        >
          {[
            { title: 'AI Product Photography', body: 'Google Imagen 3 places your product in realistic culturally-matched scenes. No studio, no photographer.' },
            { title: 'Cultural Audience Targeting', body: '20+ global markets. AI adapts scenes, lighting, language and tone to match your exact target audience.' },
            { title: 'Platform-Native Sizing', body: 'Every image at exact pixel dimensions for Instagram, TikTok, Facebook, Shopify and web banner.' },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1.5">{title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{body}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}
```

---

## LOADING SEQUENCE COMPONENT

```tsx
// components/generation/LoadingSequence.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Scissors, ScanSearch, Globe, Wand2, MessageSquare, Package } from 'lucide-react'

const STEPS = [
  { Icon: Scissors,      title: 'Removing background',     sub: 'Isolating your product' },
  { Icon: ScanSearch,    title: 'Analyzing product',        sub: 'Reading colors, style & features' },
  { Icon: Globe,         title: 'Mapping cultural context', sub: 'Adapting scenes for your market' },
  { Icon: Wand2,         title: 'Generating 6 images',      sub: 'Imagen 3 rendering your pack' },
  { Icon: MessageSquare, title: 'Writing captions & ads',   sub: 'Localized copy + 3 ad variants each' },
  { Icon: Package,       title: 'Assembling pack',          sub: 'Scoring engagement · Building ZIP' },
]

const FACTS = [
  'Professional product shoots cost $500–5,000. You\'re skipping that.',
  'Each image is culturally adapted — not just placed on a background.',
  'Your ad copy maps to Facebook\'s awareness → consideration → conversion funnel.',
  'Engagement scores are based on platform best practices for your market.',
  'Every image exports at the exact pixel dimensions the platform algorithm prefers.',
  'Your pack includes a full Shopify-ready product description.',
]

export function LoadingSequence({ currentStep, progress }: { currentStep: number; progress: number }) {
  return (
    <div className="fixed inset-0 bg-[var(--bg)]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-7 w-full max-w-sm shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-xl font-bold text-[var(--text)]">Generating your pack</h2>
          <span className="text-sm font-mono text-[var(--text-muted)]">{Math.round(progress)}%</span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-5">~50 seconds — hang tight</p>

        {/* Progress bar */}
        <div className="h-0.5 bg-[var(--border)] rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-[var(--accent)] rounded-full origin-left"
            style={{ scaleX: progress / 100 }}
            transition={{ ease: 'easeOut', duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2.5 mb-6">
          {STEPS.map(({ Icon, title, sub }, i) => {
            const done = i < currentStep
            const active = i === currentStep
            return (
              <motion.div
                key={title}
                animate={{ opacity: i > currentStep ? 0.25 : 1 }}
                className="flex items-center gap-3"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                  ${done ? 'bg-[var(--accent3)] text-white' : active ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface2)] text-[var(--text-muted)]'}`}
                >
                  {done ? (
                    <span className="text-xs font-bold">✓</span>
                  ) : active ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                      className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Icon size={13} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${active || done ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                    {title}
                  </p>
                  {active && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-[11px] text-[var(--text-muted)] mt-0.5"
                    >
                      {sub}
                    </motion.p>
                  )}
                </div>
                {done && <span className="text-[11px] text-[var(--accent3)] font-semibold flex-shrink-0">Done</span>}
              </motion.div>
            )
          })}
        </div>

        {/* Rotating fact */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="p-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)]"
          >
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed italic">
              {FACTS[currentStep % FACTS.length]}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
```

---

## ANIMATION TOKENS

```tsx
// Stagger container
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { ease: [0.25, 0.1, 0.25, 1] } },
}

// Card entrance with spring overshoot
export const cardEntrance = (index: number) => ({
  initial: { opacity: 0, scale: 0.93 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay: index * 0.06, ease: [0.34, 1.56, 0.64, 1], duration: 0.45 },
  whileHover: { y: -3, transition: { duration: 0.18 } },
})

// Slide up from bottom
export const slideUp = {
  initial: { y: 80, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 80, opacity: 0 },
  transition: { type: 'spring' as const, stiffness: 420, damping: 36 },
}
```

---

## OUTPUT PANEL LAYOUT

The output panel lives in `main` to the right of the sidebar.

```tsx
// components/output/OutputPanel.tsx
'use client'
import { PackSummary } from './PackSummary'
import { OutputGrid } from './OutputGrid'
import { ProductDescriptionPanel } from './ProductDescriptionPanel'
import { PostingSchedulePanel } from './PostingSchedulePanel'
import type { GeneratedPack } from '@/types'

export function OutputPanel({ pack }: { pack: GeneratedPack | null }) {
  if (!pack) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-12 text-[var(--text-muted)]">
      <div className="w-12 h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
        <Wand2 size={20} className="text-[var(--text-muted)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)]">Your content pack appears here</p>
      <p className="text-xs max-w-xs leading-relaxed">Configure your audience in the sidebar, then click generate</p>
    </div>
  )

  return (
    <div id="workspace" className="p-5 space-y-5 bg-[var(--output-bg)] min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--output-text)]">Your content pack</h2>
          <p className="text-xs text-[var(--output-muted)] mt-0.5">
            {pack.images.filter(i => i.status === 'done').length} images · {pack.images.length * 3} ad variants
          </p>
        </div>
        <div className="flex gap-2">
          <button className="text-xs px-3 py-1.5 rounded-lg border border-[var(--output-border)] text-[var(--output-text)] hover:bg-[var(--output-surface)] transition-colors">
            Copy all captions
          </button>
          <DownloadButton pack={pack} />
        </div>
      </div>

      {/* Summary metrics */}
      <PackSummary pack={pack} />

      {/* Image grid */}
      <OutputGrid images={pack.images} />

      {/* Product description */}
      <ProductDescriptionPanel desc={pack.productDescription} />

      {/* Posting schedule */}
      <PostingSchedulePanel schedule={pack.postingSchedule} />
    </div>
  )
}
```

---

## RESPONSIVENESS

```
Mobile  < 640px:   sidebar hidden → bottom sheet trigger, 1-col output grid
Tablet  640–1024:  sidebar w-64, 2-col output grid
Desktop > 1024px:  sidebar w-72, 3-col output grid
```

```tsx
// Mobile sidebar toggle — bottom bar on mobile
// On md+ screens: sidebar is always visible
// On < md: sidebar slides in from left, overlay backdrop
// Use: className="hidden md:flex" on sidebar, mobile trigger button in topbar
```
