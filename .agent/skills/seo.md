# Skill: SEO & Discoverability

Read this file before touching `app/layout.tsx`, `app/page.tsx`, or any metadata.

---

## DOMAIN CONFIGURATION — READ THIS FIRST

**Current production URL:** `https://pixpack.saberlabs.dev`
**Future custom domain:** TBD (e.g. `getpixpack.com`, `trypixpack.com`)

**CRITICAL: Never hardcode the domain anywhere.**

### `lib/config.ts`
```ts
export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pixpack.saberlabs.dev',
  name: 'PixPack',
  handle: '@pixpackapp',
} as const
```

### `.env.local`
```bash
NEXT_PUBLIC_SITE_URL=https://pixpack.saberlabs.dev
```

Use `siteConfig.url` in all metadata, JSON-LD, sitemap, OG routes. When you move to a custom domain, change one env var — nothing else.

---

## GLOBAL SEO STRATEGY

PixPack is a **global product** with a worldwide target market. The SEO strategy reflects this.

**Primary keywords (high volume, competitive — rank in months):**
- `AI product image generator`
- `product photo background AI`
- `ecommerce content generator AI`
- `AI marketing images generator`

**Long-tail keywords (lower competition — rank in weeks):**
- `generate product images for Instagram TikTok automatically`
- `AI product photography for online store`
- `one product photo multiple platform images`
- `product image generator for Shopify`
- `culturally adapted product images AI`
- `AI content pack generator ecommerce`

**Regional long-tail (fastest to rank — multiple languages):**
- `générateur d'images produit IA` (French)
- `gerador de imagens de produto IA` (Portuguese/Brazil)
- `AI 상품 이미지 생성기` (Korean)
- `AI product foto generator` (Dutch/German crossover)
- `مولد صور المنتجات بالذكاء الاصطناعي` (Arabic)

**Strategy:** Win global English long-tail first, then expand to regional language pages if traction warrants it.

---

## NEXT.JS METADATA

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: {
    default: 'PixPack — AI Product Content Pack Generator',
    template: '%s | PixPack',
  },
  description:
    'Upload 1 product photo. Get 6 AI-generated, platform-native images with captions — sized for Instagram, TikTok, Facebook & more. Culturally adapted for any market worldwide. Ready in 60 seconds.',
  keywords: [
    'AI product image generator',
    'product photo generator',
    'ecommerce content pack',
    'AI marketing images',
    'product background generator',
    'Instagram product photos AI',
    'TikTok product content generator',
    'Shopify product image AI',
    'culturally adapted product images',
    'AI content generator online store',
    'one photo multiple platform images',
    'product photography AI tool',
    'ecommerce marketing automation',
    'AI image generator for merchants',
  ],
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    url: siteConfig.url,
    title: 'PixPack — Turn 1 Product Photo Into a Full Content Pack',
    description: '6 AI-generated, platform-native images + captions in 60 seconds. Culturally adapted for any market. No studio. No designer.',
    siteName: 'PixPack',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'PixPack AI Product Content Pack Generator' }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixPack — Turn 1 Product Photo Into a Full Content Pack',
    description: '6 AI-generated images + captions in 60 seconds. Sized for Instagram, TikTok, Facebook & more.',
    images: ['/og-image.png'],
    creator: siteConfig.handle,
  },
  applicationName: 'PixPack',
  category: 'technology',
  verification: {
    google: 'REPLACE_WITH_GOOGLE_SEARCH_CONSOLE_TOKEN',
  },
}
```

---

## STRUCTURED DATA (JSON-LD)

```tsx
// app/page.tsx — Server Component
export default function Page() {
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
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free during beta' },
        featureList: [
          'AI product image generation with Imagen 3',
          'Cultural audience targeting for 20+ global markets',
          'Platform-native sizing (Instagram, TikTok, Facebook, Shopify)',
          'AI-written localized captions and hashtags',
          'ZIP download in under 60 seconds',
          'No account required for MVP',
        ],
        availableLanguage: ['English', 'French', 'Arabic', 'Portuguese', 'Spanish', 'Korean', 'Indonesian'],
      },
      {
        '@type': 'Organization',
        name: 'PixPack',
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How does PixPack generate product images?',
            acceptedAnswer: { '@type': 'Answer', text: 'PixPack uses Google Imagen 3 AI to place your product in realistic lifestyle scenes adapted for your target market. Upload one product photo, define your audience (age, gender, location), select platforms, and the AI generates 6 culturally adapted images.' },
          },
          {
            '@type': 'Question',
            name: 'Which countries and markets does PixPack support?',
            acceptedAnswer: { '@type': 'Answer', text: 'PixPack supports 20+ global markets including USA, UK, France, Brazil, Nigeria, South Korea, India, Indonesia, Morocco, UAE, and more. Each market has culturally specific scenes, lighting, and caption language.' },
          },
          {
            '@type': 'Question',
            name: 'How long does it take to generate a content pack?',
            acceptedAnswer: { '@type': 'Answer', text: 'PixPack generates 6 images plus localized captions in under 60 seconds.' },
          },
          {
            '@type': 'Question',
            name: 'What platforms does PixPack support?',
            acceptedAnswer: { '@type': 'Answer', text: 'Instagram Post (1080×1080), Instagram Story (1080×1920), TikTok (1080×1920), Facebook Post (1200×630), Shopify Product (800×800), and Web Banner (1920×600).' },
          },
          {
            '@type': 'Question',
            name: 'Do I need to create an account to use PixPack?',
            acceptedAnswer: { '@type': 'Answer', text: 'No. During beta, you can generate and download your content pack with no account required.' },
          },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* page content */}
    </>
  )
}
```

---

## ON-PAGE CONTENT STRATEGY

Minimum **400 words** of visible semantic body text. These sections serve two purposes: explain the product to new users AND feed Google keyword-dense structured content.

```
H1: Turn 1 Product Photo Into a Full Content Pack
H2: How PixPack Works                     ← 4 steps, keyword-rich
H2: 20+ Markets, Every Platform           ← list global regions + platforms
H2: Who PixPack Is For                    ← "Shopify merchants", "Instagram sellers", global framing
H2: Frequently Asked Questions            ← matches JSON-LD FAQPage exactly
```

**Hero copy must be globally resonant — never region-specific:**
```
✅ "Your audience, anywhere in the world"
✅ "Made for merchants in São Paulo, Seoul, Lagos, London, and everywhere in between"
❌ "Made for Moroccan and MENA merchants"
```

---

## TECHNICAL SEO FILES

### `public/robots.txt`
```
User-agent: *
Allow: /
Sitemap: ${siteConfig.url}/sitemap.xml
```

### `app/sitemap.ts`
```ts
import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config'

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteConfig.url, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 }]
}
```

### `app/manifest.ts`
```ts
export default function manifest() {
  return {
    name: 'PixPack', short_name: 'PixPack',
    description: 'AI product content pack generator for merchants worldwide',
    start_url: '/', display: 'standalone',
    background_color: '#0f0e0c', theme_color: '#ff4d1c',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
  }
}
```

---

## CORE WEB VITALS

| Metric | Target | How |
|---|---|---|
| LCP | < 2.5s | `next/image` with `priority` on hero |
| CLS | < 0.1 | Always set `width` + `height` on images |
| INP | < 200ms | Lazy load output grid |
| TTFB | < 800ms | Vercel Edge handles this |

```tsx
// ✅ Always use next/image
import Image from 'next/image'
<Image src="/hero.png" alt="PixPack generating product images for global markets" width={1200} height={630} priority />

// ✅ Lazy load output grid
const OutputGrid = dynamic(() => import('@/components/output/OutputGrid'), { loading: () => <OutputGridSkeleton /> })
```

---

## DEPLOY-DAY CHECKLIST

- [ ] `NEXT_PUBLIC_SITE_URL` set to production URL in Vercel env vars
- [ ] `<h1>` contains primary keyword, appears once
- [ ] All images have descriptive `alt` text referencing global markets
- [ ] JSON-LD validates at schema.org/validator
- [ ] `robots.txt` is accessible at `/robots.txt`
- [ ] `sitemap.xml` generated and loads at `/sitemap.xml`
- [ ] Submit sitemap to Google Search Console on day 1
- [ ] OG image is 1200×630px and loads in < 200ms
- [ ] Page passes Core Web Vitals in Vercel Analytics
- [ ] 400+ words of visible body text
- [ ] No region-specific copy in hero or above-the-fold sections
- [ ] `canonical` points to production URL
