import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/Topbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { ValueSection } from '@/components/landing/ValueSection'
import { PlatformsAndMarkets } from '@/components/landing/PlatformsAndMarkets'
import { WhoIsItFor } from '@/components/landing/WhoIsItFor'
import { FAQSection } from '@/components/landing/FAQSection'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { siteConfig } from '@/lib/config'

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
