# Skill: SEO & Discoverability (V2)

Read this before touching `app/layout.tsx`, `app/page.tsx`, or any metadata.

---

## DOMAIN CONFIGURATION

**Production URL:** `https://pixpack.saberlabs.dev`
**Never hardcode** — always use `siteConfig.url`

```ts
// lib/config.ts
export const siteConfig = {
  url:    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pixpack.saberlabs.dev',
  name:   'PixPack',
  handle: '@pixpackapp',
} as const
```

---

## V2 SEO STRATEGY

The product has pivoted. The value prop is now **A/B testing**, not "content pack for 6 platforms."
Keywords and copy must reflect this.

**Primary keywords:**
- `AI product photo A/B testing ads`
- `generate 4 ad variations from one product photo`
- `AI ad creative generator`
- `product image ad variations AI`

**Long-tail:**
- `generate instagram ad variations from product photo`
- `AI ad creative A/B test generator ecommerce`
- `product photo to 4 ad creatives automatically`
- `TikTok ad variations AI generator`
- `Facebook ad creative generator from product image`

**Regional long-tail (unchanged from V1):**
- `générateur de variations publicitaires IA` (French)
- `gerador de variações de anúncios IA` (Portuguese/Brazil)
- `AI 광고 소재 변형 생성기` (Korean)

---

## METADATA (V2 COPY)

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'PixPack — AI Ad Variation Generator',
    template: '%s | PixPack',
  },
  description:
    'Upload 1 product photo. Get 4 AI-generated ad variations ready for A/B testing — with platform-native images and full ad copy. Works for Instagram, TikTok, Facebook and more. Under 2 minutes.',
  keywords: [
    'AI ad variation generator',
    'product photo to ad creatives',
    'A/B test ad images AI',
    'ecommerce ad generator',
    'Instagram ad creative AI',
    'TikTok ad variation generator',
    'Facebook ad image generator',
    'product photo ad variations',
    'AI advertising creative tool',
    'ad creative automation ecommerce',
  ],
  // ... rest of metadata same structure as before
  openGraph: {
    title: 'PixPack — Turn 1 Product Photo Into 4 A/B Test Ad Variations',
    description: '4 AI-generated ad creatives with full copy in under 2 minutes. Pick your platform, define your audience, start testing.',
    // ...
  },
}
```

---

## ON-PAGE CONTENT (V2)

```
H1: Turn 1 product photo into 4 ad variations
H2: How PixPack Works        ← 4 steps
H2: 4 Variations, Ready to Test  ← explain A/B testing angle
H2: For Every Platform       ← list platforms
H2: For Merchants Worldwide  ← global framing
H2: Frequently Asked Questions
```

**Hero copy (V2 — globally resonant):**
```
✅ "Turn 1 photo into 4 ad variations — and start testing today."
✅ "Upload. Pick your platform. Get 4 A/B-ready creatives in 90 seconds."
✅ "Made for merchants in São Paulo, Seoul, Lagos, London, and everywhere in between."
❌ "Made for Moroccan merchants" (too narrow)
❌ "Get 6 images for 6 platforms" (old model)
```

---

## JSON-LD (V2 FAQ)

Update FAQ to reflect new model:

```ts
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'PixPack',
      description: 'AI-powered ad variation generator for e-commerce merchants worldwide.',
      featureList: [
        'AI product image generation with Gemini Flash Image',
        '4 A/B test variations per generation',
        'Cultural audience targeting for 20+ global markets',
        'Platform-native ad copy (awareness, consideration, conversion)',
        'ZIP download with full ad copy — ready for Ads Manager',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How many images does PixPack generate?',
          acceptedAnswer: { '@type': 'Answer', text: 'PixPack generates 4 ad image variations for your chosen platform. Each variation uses a different creative angle — lifestyle, hero, aspirational context, and close-up detail — giving you 4 genuine A/B test creatives.' },
        },
        {
          '@type': 'Question',
          name: 'Which platforms does PixPack support?',
          acceptedAnswer: { '@type': 'Answer', text: 'Instagram Post (1:1), Instagram Story (9:16), TikTok (9:16), Facebook Post (4:3), Shopify Product (1:1), and Web Banner (16:9). You choose one platform and get 4 variations for it.' },
        },
        {
          '@type': 'Question',
          name: 'How long does it take?',
          acceptedAnswer: { '@type': 'Answer', text: 'Under 2 minutes. Images stream to your screen as they complete — you typically see the first variation within 15 seconds.' },
        },
        {
          '@type': 'Question',
          name: 'What is included in the download?',
          acceptedAnswer: { '@type': 'Answer', text: 'A ZIP file containing 4 named images (variation-A-lifestyle.png through variation-D-closeup.png) plus an ad_copy.txt with all awareness, consideration, and conversion copy for each variation.' },
        },
      ],
    },
  ],
}
```

---

## TECHNICAL SEO — UNCHANGED

`public/robots.txt`, `app/sitemap.ts`, `app/manifest.ts` — structure same as V1.
Update `theme_color` and `description` to match V2 messaging.

## DEPLOY-DAY CHECKLIST

- [ ] `NEXT_PUBLIC_SITE_URL` set in Vercel env vars
- [ ] H1 contains "4 ad variations" or equivalent primary keyword
- [ ] OG image updated to show 2×2 variation grid (not 6-platform grid)
- [ ] JSON-LD FAQ updated to V2 model
- [ ] sitemap submitted to Google Search Console
- [ ] 400+ words of visible body text