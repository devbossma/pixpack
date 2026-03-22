'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ArrowRight } from 'lucide-react'

export function Topbar() {
  const pathname = usePathname()
  const isApp = pathname?.startsWith('/app')

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--topbar-border)] bg-[var(--topbar-bg)]/80 backdrop-blur-md sticky top-0 z-50 flex-shrink-0"
    >
      <div className="flex items-center gap-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.png"
            alt="PixPack"
            width={120}
            height={32}
            className="h-6 sm:h-8 w-auto object-contain"
            priority
          />
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]/20 uppercase tracking-widest font-display">
            Beta
          </span>
          <span className="hidden md:inline-flex text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-widest">
            Free trial
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {!isApp && (
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#how-it-works" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
              How it works
            </Link>
            <Link href="/#faq" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
              FAQ
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          {!isApp && (
            <Link
              href="/app"
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,77,28,0.15)] hover:shadow-[0_0_25px_rgba(255,77,28,0.25)] active:scale-95 whitespace-nowrap"
            >
              Launch App
              <ArrowRight size={14} className="hidden sm:block" />
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  )
}
