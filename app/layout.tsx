import type { Metadata } from 'next'
import { Syne, JetBrains_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { siteConfig } from '@/lib/config'
import './globals.css'
import { clsx } from 'clsx'

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const cabinetGrotesk = localFont({
  src: '../public/fonts/CabinetGrotesk-Variable.woff2',
  variable: '--font-body',
})

import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={clsx(syne.variable, jetbrainsMono.variable, cabinetGrotesk.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
