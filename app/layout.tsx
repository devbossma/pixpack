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
    default: 'PixPack | Your A/B Testing Ad Packs While Your Coffee Brews',
    template: '%s | PixPack',
  },
  description: 'Turn one photo into 4 A/B-ready ad creatives for Instagram, TikTok & Shopify—with copy—while your coffee brews. No studio needed.',
  keywords: [
    // ── Core product
    'AI product ad generator',
    'product photo to ad creative',
    'AI ad creative generator',
    'ecommerce ad creative tool',

    // ── A/B testing
    'A/B testing ad creatives',
    'ad A/B testing kit',
    'AI A/B testing ads',
    'ad variation generator',
    'ad creative variations AI',

    // ── Platform image optimization
    'Instagram ad image generator',
    'Instagram product image size optimizer',
    'TikTok ad creative generator',
    'TikTok product image size',
    'Facebook ad image generator',
    'Facebook ad creative AI',
    'Shopify product image generator',
    'Shopify product image optimizer',
    'Etsy product image generator',
    'Etsy listing image size optimizer',
    'Etsy product photo AI',

    // ── AI product photography
    'AI product photography',
    'AI product background generator',
    'product background removal AI',
    'AI product lifestyle photo generator',
    'AI product image generator free',

    // ── Ad copy generation
    'AI ad copy generator',
    'product ad copy generator',
    'platform-native ad copy AI',
    'ecommerce copywriting AI',

    // ── Ecommerce marketing
    'ecommerce content pack generator',
    'AI ecommerce marketing tool',
    'social media ad generator',
    'one photo multiple platform ads',
    'product marketing content generator',

    // ── Cultural & market adaptation
    'culturally adapted product images',
    'localized product ads AI',
    'global market ad creatives',
    'AI product images for global markets',

    // ── Free / intent
    'free AI ad creative generator',
    'free product image generator AI',
    'free ecommerce ad tool',
    'free AI product photography tool',
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
    title: 'PixPack | Your A/B Testing Ad Packs While Your Coffee Brews',
    description: 'Turn one photo into 4 A/B-ready ad creatives for Instagram, TikTok & Shopify—with copy—while your coffee brews. No studio needed.',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'PixPack | Your A/B Testing Ad Packs While Your Coffee Brews',
      type: 'image/png',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.handle,
    creator: siteConfig.handle,
    title: 'PixPack | Your A/B Testing Ad Packs While Your Coffee Brews',
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
      '@type': ['WebApplication', 'SoftwareApplication'],
      name: 'PixPack',
      url: siteConfig.url,
      description: 'Turn one supplier product photo into 4 A/B-ready ad creatives for Instagram, TikTok, Facebook, and Shopify — with localised copy — while your coffee brews. No studio, no agency.',
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
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '600',
        bestRating: '5',
        worstRating: '1',
      },
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
      '@type': 'HowTo',
      name: 'How to generate product ad creatives with PixPack',
      description: 'Turn one product photo into 12 A/B-ready ad creatives for Instagram, TikTok, Facebook, Shopify, and Etsy — in under 3 minutes.',
      totalTime: 'PT3M',
      supply: [
        { '@type': 'HowToSupply', name: 'Product photo (JPG, PNG, or WEBP, up to 10 MB)' },
      ],
      tool: [
        { '@type': 'HowToTool', name: 'PixPack (free, no account required)' },
      ],
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Upload your product photo',
          text: 'Upload any JPG, PNG, or WEBP file up to 10 MB. PixPack automatically removes the background and prepares a clean product cutout — no Photoshop or manual editing needed.',
          url: `${siteConfig.url}/#how-it-works`,
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Pick your ad platform and target audience',
          text: 'Select your ad platform (Instagram, TikTok, Facebook, Shopify, or Etsy) and your target market. PixPack adapts visuals and copy for 20+ global markets including Morocco, Brazil, South Korea, UAE, and more.',
          url: `${siteConfig.url}/#how-it-works`,
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'AI generates your full A/B testing kit',
          text: 'Google Imagen 3 via Gemini Flash creates 4 visual angles (Lifestyle, Hero, Context, Closeup), each paired with 3 funnel-stage ad copies (Awareness, Consideration, Conversion) — 12 ready-to-test combinations, zero manual effort.',
          url: `${siteConfig.url}/#how-it-works`,
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Download your pack and launch today',
          text: 'Download a ZIP containing every image at native platform resolution plus all 12 ad copies, structured and labelled for direct import into Meta Ads Manager, TikTok Ads Manager, or Shopify.',
          url: `${siteConfig.url}/#how-it-works`,
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How is PixPack different from a regular AI image generator?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Simple generators give you generic images. PixPack is a full marketing engine. It analyzes your product and target audience to generate a complete A/B testing kit: 4 visual angles (Lifestyle, Hero, Context, Closeup) each paired with 3 funnel-staged ad copies (Awareness, Consideration, Conversion) — precisely adapted to individual markets like Morocco, Brazil, or South Korea.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does PixPack generate product images?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack uses Google Imagen 3 via Gemini Flash to place your product in realistic, culturally relevant lifestyle scenes. Upload one photo, choose your target market and platform, and the AI generates platform-native images with matching ad copy in under 3 minutes — no Photoshop, no studio, no agency.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which platforms does PixPack support?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack generates images at native resolution for: Instagram Post (1080×1080), Instagram Story (1080×1920), TikTok Ads (1080×1920), Facebook Post (1200×630), Shopify Product (800×800), and Etsy Product (2700×2025). Each format is sized and composed to platform spec.',
          },
        },
        {
          '@type': 'Question',
          name: 'What exactly is in the ZIP download?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Your pack includes 6 platform-sized images, a structured text file with up to 12 distinct ad copy combinations (4 visual angles × 3 funnel stages), and a ready-to-paste Shopify product description with SEO-optimised title and bullet points. Everything is labelled for direct import into Meta Ads Manager, TikTok Ads, or Shopify.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which countries and markets does PixPack support?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack supports 20+ global markets including Morocco, UAE, France, Brazil, Nigeria, South Korea, India, Indonesia, USA, UK, and more. Each market gets culturally specific scenes, lighting, colour palette, and ad copy written in the local language and tone.',
          },
        },
        {
          '@type': 'Question',
          name: 'How long does it take to generate a content pack?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack delivers your full pack — 4 images and 12 ad copy variants — in under 3 minutes. Background removal, AI scene generation, copy writing, and export all happen in a single automated pipeline.',
          },
        },
        {
          '@type': 'Question',
          name: 'What AI model powers the image generation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack uses Google Imagen 3 via Gemini Flash for state-of-the-art photorealistic quality, layered with a proprietary Cultural IQ system that adapts scenes, props, and copy to your chosen market.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is PixPack free? Do I need an account?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack is 100% free during its public beta — no account, no credit card, no sign-up required. Upload your product photo, configure your audience and platform, then download your pack immediately.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use PixPack for Etsy and Shopify product listings?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Yes. PixPack generates images at Etsy's recommended 2700×2025 resolution and Shopify's 800×800 product format. Your ZIP also includes a ready-to-paste Shopify product description with an SEO-optimised title, feature bullet points, and full product copy.",
          },
        },
        {
          '@type': 'Question',
          name: 'What image formats and sizes does PixPack accept?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PixPack accepts JPG, PNG, and WEBP files up to 10 MB. For best results, upload a clean product photo on a plain or simple background. Our background removal AI works on any input, but cleaner source photos produce sharper outputs.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use the generated images in paid ads on Meta and TikTok?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. All images generated by PixPack are yours to use commercially, including in paid advertising on Meta Ads (Facebook and Instagram), TikTok Ads, Google Shopping, and any other platform. Your ZIP is structured and labelled for direct import into Meta Ads Manager and TikTok Ads Manager.',
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
