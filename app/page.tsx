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

export const metadata: Metadata = {
  title: 'PixPack — AI Product Content Pack Generator | Free During Beta',
  description:
    'Turn 1 product photo into 6 platform-native images, localized captions, ad copy variants and a Shopify product description — in under 60 seconds. Free during beta. 20+ global markets.',
  keywords: [
    'AI product image generator',
    'ecommerce content generator AI',
    'AI marketing images',
    'product photo background removal AI',
    'AI ad copy generator',
    'social media content automation',
    'Shopify product description AI',
    'Instagram product photo AI',
    'TikTok content generator',
    'culturally adapted marketing AI',
    'global ecommerce AI tool',
    'free AI image generator for products',
  ],
  openGraph: {
    title: 'PixPack — Turn 1 Product Photo Into a Full Content Pack',
    description: '6 AI images + ad copy + captions + engagement scores in 60 seconds. Free during beta.',
    url: siteConfig.url,
    siteName: 'PixPack',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixPack — AI Content Pack Generator',
    description: 'Turn 1 product photo into a full content pack in 60 seconds. Free during beta.',
  },
  alternates: { canonical: siteConfig.url },
  robots: 'index, follow',
}

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'PixPack',
        url: siteConfig.url,
        description:
          'AI-powered product content pack generator. Upload 1 photo and receive 6 platform-native images, localized captions, ad copy and a product description in under 60 seconds.',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free during public beta. No account required.',
        },
        featureList: [
          'AI product image generation with Google Imagen 3',
          'Cultural audience targeting for 20+ global markets',
          'Platform-native image sizing (Instagram, TikTok, Facebook, Shopify, Web Banner)',
          'AI-written localized captions and hashtags',
          '3 ad copy variants per image (Awareness, Consideration, Conversion)',
          'AI engagement score prediction per image',
          'Shopify-ready product description generation',
          'ZIP download in under 60 seconds',
          'No account required during beta',
        ],
        availableLanguage: ['English', 'French', 'Arabic', 'Portuguese', 'Spanish', 'Korean', 'Indonesian'],
      },
      {
        '@type': 'Organization',
        name: 'PixPack',
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
        sameAs: [],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How does PixPack generate product images?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'PixPack uses Google Imagen 3 AI to place your product in realistic lifestyle scenes adapted for your target market. Upload one product photo, define your audience, select platforms — AI generates 6 culturally adapted images in under 60 seconds.',
            },
          },
          {
            '@type': 'Question',
            name: 'Which countries and markets does PixPack support?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'PixPack supports 20+ global markets including USA, UK, France, Germany, Brazil, Nigeria, South Korea, Japan, India, Indonesia, Morocco, UAE, Saudi Arabia, South Africa, Mexico, Canada, Australia, Singapore, Portugal and Turkey.',
            },
          },
          {
            '@type': 'Question',
            name: 'What does the AI ad copy include?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'For every image, PixPack generates 3 ad copy variants: Awareness (grab attention), Consideration (build interest) and Conversion (drive purchase). Each is tailored to platform length and cultural context.',
            },
          },
          {
            '@type': 'Question',
            name: 'How long does it take to generate a content pack?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The full pack — 6 images + captions + ad copy + engagement scores + product description — is delivered in under 60 seconds.',
            },
          },
          {
            '@type': 'Question',
            name: 'What platforms does PixPack support?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Instagram Post (1080×1080), Instagram Story (1080×1920), TikTok (1080×1920), Facebook Post (1200×630), Shopify Product (800×800), and Web Banner (1920×600).',
            },
          },
          {
            '@type': 'Question',
            name: 'Do I need an account to use PixPack?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No account required during beta. Generate and download your ZIP with no sign-up, no credit card.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is PixPack free?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. PixPack is 100% free during the public beta. Get as many packs as you need before paid plans launch.',
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
    </>
  )
}
