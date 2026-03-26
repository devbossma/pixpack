import type { Metadata, Viewport } from 'next'
import { Syne, JetBrains_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import Script from 'next/script'
import { siteConfig } from '@/lib/config'
import './globals.css'
import { clsx } from 'clsx'

// ─── Fonts ───────────────────────────────────────────────────────────────────
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

// ─── Viewport (separately exported for Next.js 14+) ───────────────────────────
export const viewport: Viewport = {
  themeColor: '#ff4d1c',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

// ─── Full Metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'PixPack — AI Product Ad Generator',
    template: '%s | PixPack',
  },
  description:
    'Turn one product photo into 4 A/B-ready ad creatives for Instagram, TikTok, Facebook, and Shopify — with 12 localised copy variations — while your coffee brews. No studio, no agency.',
  keywords: [
    'AI product image generator',
    'product photo generator',
    'ecommerce content pack',
    'AI marketing images',
    'product background AI',
    'Instagram product photos AI',
    'TikTok product content generator',
    'Shopify product image AI',
    'culturally adapted product images',
    'AI content generator online store',
    'one photo multiple platform images',
    'product photography AI tool',
    'ecommerce marketing automation',
    'AI image generator for merchants',
    'content pack generator',
    'social media content AI',
    'AI product photography',
    'free AI product image generator',
    'free AI product photography',
    'free AI content pack generator',
    'free AI marketing images',
    'free AI product background',
    'free AI Instagram product photos',
    'free AI TikTok product content',
    'free AI Shopify product images',
    'free AI culturally adapted product images',
    'free AI content generator online store',
    'free AI one photo multiple platform images',
    'free AI product photography tool',
    'free AI ecommerce marketing automation',
    'free AI image generator for merchants',
    'free content pack generator',
    'free social media content AI',
    'free AI product photography',
    'free AI product photography',
  ],
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: siteConfig.url,
    siteName: 'PixPack',
    locale: 'en_US',
    title: 'PixPack — AI Product Ad Generator',
    description: 'One product photo → 12 platform-native ad variations while your coffee brews. Culturally adapted for any market. No studio. No designer.',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'PixPack — AI product content pack generator',
      type: 'image/png',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.handle,
    creator: siteConfig.handle,
    title: 'PixPack — AI Product Ad Generator',
    description: 'One product photo → 12 platform-native ad variations while your coffee brews.',
    images: ['/og-image.png'],
  },
  applicationName: 'PixPack',
  category: 'technology',
  creator: 'PixPack',
  publisher: 'PixPack',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    other: [{
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    }],
  },
  manifest: '/manifest.json',
}

// ─── JSON-LD Structured Data ─────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'PixPack',
      url: siteConfig.url,
      description: 'AI-powered product content pack generator for e-commerce merchants worldwide.',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript. Works in all modern browsers.',
      inLanguage: 'en',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free during beta',
      },
      featureList: [
        'AI product image generation',
        'Cultural audience targeting for 20+ global markets',
        'Platform-native sizing for Instagram, TikTok, Facebook, Shopify',
        'AI-written localized ad copy — 12 variants per pack',
        'Shopify product listing generator',
        'Ready while your coffee brews',
      ],
      availableLanguage: [
        'English', 'French', 'Arabic', 'Portuguese',
        'Spanish', 'Korean', 'Indonesian',
      ],
      screenshot: `${siteConfig.url}/og-image.png`,
    },
    {
      '@type': 'Organization',
      name: 'PixPack',
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
        width: '200',
        height: '50',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does PixPack generate product images?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack uses Google Gemini AI to place your product in realistic lifestyle scenes adapted for your target market. Upload one product photo, define your audience, select platforms, and the AI generates platform-native images in under 60 seconds.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which platforms does PixPack support?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack generates images sized for Instagram Post (1080×1080), Instagram Story (1080×1920), TikTok (1080×1920), Facebook Post (1200×630), Shopify Product (800×800), and Web Banner (1920×600).',
          },
        },
        {
          '@type': 'Question',
          name: 'Which countries and markets does PixPack support?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack supports 20+ global markets including Morocco, UAE, France, Brazil, Nigeria, South Korea, India, Indonesia, USA, UK and more. Each market gets culturally specific scenes, lighting, and ad copy language.',
          },
        },
        {
          '@type': 'Question',
          name: 'How long does it take to generate a content pack?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack generates 4 visual angles and 12 funnel-staged copy variations while your coffee brews (typically under 3 minutes).',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need to create an account to use PixPack?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No account is required. Upload your product photo, configure your audience, and generate your pack for free.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much does PixPack cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack is free during beta. No credit card required.',
          },
        },
      ],
    },
  ],
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={clsx(syne.variable, jetbrainsMono.variable, cabinetGrotesk.variable)} suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="f3p2w_ru2f0gQx9b6YlUYY6RdyN7nPaELJ8zEZvRWEU" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased" suppressHydrationWarning>
        {children}

        {/* ── Google Analytics ── */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
