'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('pixpack-theme') as 'dark' | 'light' | null
    const initial = saved ?? 'dark'
    // eslint-disable-next-line
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
