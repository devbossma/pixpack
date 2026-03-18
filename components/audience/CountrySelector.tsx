'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { REGIONS } from '@/lib/regions'

interface Option<T extends string = string> { id: T; label: string; flag?: string; continent?: string }

interface SelectorProps<T extends string = string> {
  value: T | null
  onChange: (id: any) => void
  placeholder?: string
  options?: Option<T>[]
}

export function CountrySelector<T extends string = string>({ value, onChange, placeholder = 'Select target market...', options }: SelectorProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const allOptions: Option<T>[] = options ?? Object.values(REGIONS).map(r => ({
    id: r.id as unknown as T, label: r.label, flag: r.flag, continent: r.continent,
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
              className="p-0.5 text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
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
                        {opt.flag && <span className="w-4 flex-shrink-0 text-center">{opt.flag}</span>}
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
