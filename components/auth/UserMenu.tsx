'use client'

/**
 * components/auth/UserMenu.tsx
 *
 * User avatar dropdown for the Topbar.
 * Shows user email/avatar with sign-out action.
 * Animated with Framer Motion.
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, User } from 'lucide-react'
import { signOut } from '@/app/auth/actions'

interface UserMenuProps {
  email: string
  avatarUrl?: string | null
}

export function UserMenu({ email, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  const initials = email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--surface2)] transition-colors"
        aria-label="User menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-7 h-7 rounded-full object-cover border border-[var(--border)]"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[var(--accent-dim)] border border-[var(--accent)]/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[var(--accent)]">{initials}</span>
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-[var(--border)]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-dim)] border border-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-[var(--accent)]" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text)] truncate">{email}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Free plan</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
