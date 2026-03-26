import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { HeroSection } from '@/components/hero/HeroSection'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { ValueSection } from '@/components/landing/ValueSection'
import { PlatformsAndMarkets } from '@/components/landing/PlatformsAndMarkets'
import { WhoIsItFor } from '@/components/landing/WhoIsItFor'
import { FAQSection } from '@/components/landing/FAQSection'
import { FinalCTA } from '@/components/landing/FinalCTA'

export const metadata: Metadata = {
  title: 'PixPack — AI Product Ad Generator | One Photo → Full Ad Pack while your coffee brews',
  description:
    'Turn one supplier product photo into 4 A/B-ready ad creatives for Instagram, TikTok, Facebook, and Shopify — with localised copy — while your coffee brews. No studio, no agency.',
  keywords: [
    'AI product ad generator',
    'product photo to ad creative',
    'Instagram ad generator',
    'TikTok ad generator',
    'Shopify product image generator',
    'ecommerce ad creatives',
    'AI marketing tool',
    'product image AI',
  ],
  openGraph: {
    title: 'PixPack — AI Product Ad Generator',
    description: 'One product photo → 12 platform-native ad variations while your coffee brews.',
    url: 'https://pixpack.saberlabs.dev',
    siteName: 'PixPack',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixPack — AI Product Ad Generator',
    description: 'One product photo → 4 platform-native ad variations in 60 seconds.',
  },
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <ValueSection />
        <PlatformsAndMarkets />
        <WhoIsItFor />
        <FAQSection />
        <FinalCTA />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-8 px-6 text-center">
        <p className="text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} PixPack. AI product content for merchants worldwide.
          <span className="mx-2">·</span>
          <a href="/app" className="hover:text-[var(--accent)] transition-colors">Launch app →</a>
        </p>
      </footer>
    </div>
  )
}
