# Skill: Smart Outputs — Beyond Images

Read this file before implementing the generation pipeline output layer.
PixPack does not just generate images. It generates a complete intelligence pack.

---

## THE FULL PACK OUTPUT — WHAT GETS GENERATED

Every generation produces all of the following in a single pipeline run:

```
IMAGES (6)              → Imagen 3 via Vertex AI
CAPTIONS (6)            → Gemini 2.5-flash (one batched call)
AD COPY VARIANTS (6×3)  → Gemini 2.5-flash (one batched call, parallel to images)
ENGAGEMENT SCORES (6)   → Gemini 2.5-flash (one batched call, parallel to images)
PRODUCT DESCRIPTION (1) → Gemini 2.5-flash (one batched call, parallel to images)
POSTING SCHEDULE (1)    → Gemini 2.5-flash (one batched call, parallel to images)
```

All Gemini calls run in parallel with image generation.
Total cost addition over base pack: ~$0.03 per generation.
Total perceived value addition: enormous.

---

## UPDATED TYPES — ADD TO `types/index.ts`

```ts
// Ad copy for a single image — maps to Facebook/TikTok/Google Ads funnel stages
export interface AdCopyVariants {
  awareness: string      // Top of funnel — brand/product discovery
  consideration: string  // Middle funnel — why this product
  conversion: string     // Bottom funnel — buy now, limited stock, CTA
}

// Engagement prediction for a single image
export interface EngagementScore {
  score: number          // 1.0–10.0
  label: 'Poor' | 'Average' | 'Good' | 'Excellent'
  reason: string         // one sentence explanation
  tip: string            // one actionable improvement suggestion
}

// Product listing copy
export interface ProductDescription {
  title: string          // Shopify/WooCommerce product title
  subtitle: string       // short tagline
  bulletFeatures: string[] // 4–5 bullet points
  seoMetaTitle: string   // <60 chars
  seoMetaDescription: string // <160 chars
}

// Posting schedule recommendation
export interface PostingSchedule {
  platform: Platform
  bestDay: string        // e.g. "Tuesday"
  bestTime: string       // e.g. "7:00–9:00 PM"
  timezone: string       // e.g. "GMT+1 (Morocco)"
  reason: string         // one sentence
}

// Extended GeneratedImage — update existing type
export interface GeneratedImage {
  id: string
  angle: Angle
  platform: Platform
  platformSpec: PlatformSpec
  imageBase64: string
  caption: string
  hashtags: string[]
  adCopy: AdCopyVariants         // ← NEW
  engagementScore: EngagementScore // ← NEW
  status: 'done' | 'error'
  error?: string
}

// Full pack output
export interface GeneratedPack {
  id: string
  images: GeneratedImage[]
  productDescription: ProductDescription  // ← NEW
  postingSchedule: PostingSchedule[]      // ← NEW
  audience: AudienceConfig
  generatedAt: string
  totalScore: number  // average of all image scores
}
```

---

## AD COPY GENERATION — PROMPT

```ts
// lib/prompts.ts — add this function

export function buildAdCopyPrompt(params: {
  analysis: ProductAnalysis
  audience: AudienceConfig
  images: ImagePrompt[]
}): string {
  const region = REGIONS[params.audience.regionId]

  return `You are a performance marketing expert writing ad copy for ${region.label}.

Product: ${params.analysis.product_type}
Colors: ${params.analysis.colors.join(', ')}
Style: ${params.analysis.style}
Key features: ${params.analysis.key_features.join(', ')}
Audience: ${params.audience.gender}, ${params.audience.ageRange}, ${params.audience.lifestyle}
Language/tone: ${region.captionTone}

For each of the ${params.images.length} images below, write 3 ad copy variants:
- awareness: Brand discovery copy. No hard sell. Evoke emotion or identity. 1 sentence.
- consideration: Why THIS product. Highlight 1 key benefit. 1–2 sentences.  
- conversion: Buy now urgency. Include a CTA. Max 15 words.

IMPORTANT: Write in ${region.captionLanguage === 'french_darija' ? 'French (with occasional Darija)' : region.captionLanguage === 'arabic' ? 'Arabic' : region.captionLanguage === 'portuguese_br' ? 'Brazilian Portuguese' : region.captionLanguage === 'korean' ? 'Korean' : 'English'}.

Return ONLY valid JSON array, no markdown:
[
  {
    "awareness": "...",
    "consideration": "...",
    "conversion": "..."
  }
]

Images:
${params.images.map((p, i) => `${i + 1}. ${p.angle} for ${p.platform}`).join('\n')}`
}
```

---

## ENGAGEMENT SCORE GENERATION — PROMPT

```ts
export function buildEngagementScorePrompt(params: {
  analysis: ProductAnalysis
  audience: AudienceConfig
  images: ImagePrompt[]
}): string {
  const region = REGIONS[params.audience.regionId]

  return `You are a social media performance analyst with expertise in ${region.label} markets.

Product: ${params.analysis.product_type}, ${params.analysis.style} style
Target: ${params.audience.gender}, ${params.audience.ageRange}, ${region.label}, ${params.audience.lifestyle}

Score each of the ${params.images.length} content pieces below for predicted social media engagement.
Base your scoring on: cultural fit, platform best practices, angle effectiveness, audience match.

Scoring:
- 1.0–4.9: Poor — significant mismatch
- 5.0–6.9: Average — functional but generic  
- 7.0–8.4: Good — strong fit, likely to perform
- 8.5–10.0: Excellent — optimized for virality

Return ONLY valid JSON array, no markdown:
[
  {
    "score": 8.2,
    "label": "Good",
    "reason": "Lifestyle angle with ${region.aesthetic} setting strongly matches ${params.audience.ageRange} ${params.audience.gender} in ${region.label}",
    "tip": "One specific actionable improvement in one sentence"
  }
]

Images to score:
${params.images.map((p, i) => `${i + 1}. ${p.angle} shot for ${p.platform} (${p.aspectRatio}) — Scene: ${p.prompt.slice(0, 80)}...`).join('\n')}`
}
```

---

## PRODUCT DESCRIPTION GENERATION — PROMPT

```ts
export function buildProductDescriptionPrompt(params: {
  analysis: ProductAnalysis
  audience: AudienceConfig
}): string {
  const region = REGIONS[params.audience.regionId]

  return `You are a Shopify copywriter specializing in ${region.label} e-commerce.

Product analysis:
- Type: ${params.analysis.product_type}
- Colors: ${params.analysis.colors.join(', ')}
- Material: ${params.analysis.material}
- Style: ${params.analysis.style}
- Key features: ${params.analysis.key_features.join(', ')}
- Use case: ${params.analysis.use_case}

Target customer: ${params.audience.gender}, ${params.audience.ageRange}, ${params.audience.lifestyle} lifestyle, ${region.label}

Write a complete product listing. Return ONLY valid JSON, no markdown:
{
  "title": "Product title under 60 chars, includes key material/style",
  "subtitle": "Punchy tagline under 80 chars",
  "bulletFeatures": [
    "Feature 1 — benefit-led, not spec-led",
    "Feature 2",
    "Feature 3",
    "Feature 4"
  ],
  "seoMetaTitle": "Under 60 chars, includes product type and key differentiator",
  "seoMetaDescription": "Under 160 chars, natural language, includes target audience signal"
}`
}
```

---

## PARALLEL EXECUTION — UPDATED ORCHESTRATOR

```ts
// app/api/generate/route.ts — updated parallel block

const imagePrompts = buildAllPrompts({ analysis, audience, platforms, angles })

// Fire ALL AI calls simultaneously
const [
  imageResults,
  captionResults,
  adCopyResults,
  engagementResults,
  productDescResult,
  scheduleResult,
] = await Promise.all([

  // Images — allSettled for safety filter resilience
  Promise.allSettled(imagePrompts.map(p => generateImage(p))),

  // Captions — single batched call
  generateAllCaptions({ analysis, audience, prompts: imagePrompts }),

  // Ad copy — single batched call
  generateAdCopy({ analysis, audience, images: imagePrompts }),

  // Engagement scores — single batched call
  generateEngagementScores({ analysis, audience, images: imagePrompts }),

  // Product description — single call
  generateProductDescription({ analysis, audience }),

  // Posting schedule — single call
  generatePostingSchedule({ audience, platforms }),
])

// Assemble final pack
const pack: GeneratedPack = assemblePack({
  imagePrompts,
  imageResults,
  captionResults,
  adCopyResults,
  engagementResults,
  productDescResult,
  scheduleResult,
  audience,
})
```

---

## OUTPUT CARD — SMART DISPLAY

Each `OutputCard` has 3 tabs:

```
[ Image ] [ Ad Copy ] [ Score ]
```

**Image tab (default):**
- Generated image
- Caption + hashtags
- Platform badge + dimensions

**Ad Copy tab:**
- 3 labeled variants: Awareness / Consideration / Conversion
- "Copy" button on each
- Language badge (FR / AR / EN / PT etc.)

**Score tab:**
- Large score number with color (red < 5, amber 5–7, green 7–8.5, accent > 8.5)
- Label badge
- Reason sentence
- Tip with lightbulb icon

```tsx
// components/output/OutputCard.tsx
'use client'
import { useState } from 'react'
import { Copy, Check, Lightbulb, Image, Megaphone, BarChart2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'image' | 'adcopy' | 'score'

export function OutputCard({ image, index }: { image: GeneratedImage; index: number }) {
  const [tab, setTab] = useState<Tab>('image')
  const [copied, setCopied] = useState<string | null>(null)

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  const scoreColor =
    image.engagementScore.score >= 8.5 ? '#ff4d1c' :
    image.engagementScore.score >= 7   ? '#00c27a' :
    image.engagementScore.score >= 5   ? '#ffb800' : '#e24b4a'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="bg-[var(--output-surface)] border border-[var(--output-border)] rounded-xl overflow-hidden"
    >
      {/* Tab bar */}
      <div className="flex border-b border-[var(--output-border)]">
        {([
          { id: 'image',  Icon: Image,      label: 'Image' },
          { id: 'adcopy', Icon: Megaphone,   label: 'Ad Copy' },
          { id: 'score',  Icon: BarChart2,   label: 'Score' },
        ] as const).map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors
              ${tab === id
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] -mb-px'
                : 'text-[var(--output-text)] opacity-50 hover:opacity-80'
              }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {tab === 'image' && (
          <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* image display */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
              {image.imageBase64
                ? <img src={image.imageBase64} alt={`${image.angle} for ${image.platform}`} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">Generation failed</div>
              }
              <span className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                {image.platformSpec.name}
              </span>
              <span className="absolute top-2 right-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                {image.angle}
              </span>
            </div>
            <div className="p-3">
              <p className="text-xs text-[var(--output-text)] leading-relaxed mb-1">{image.caption}</p>
              <p className="text-xs text-blue-500">{image.hashtags.join(' ')}</p>
            </div>
          </motion.div>
        )}

        {tab === 'adcopy' && (
          <motion.div key="adcopy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-3">
            {(['awareness', 'consideration', 'conversion'] as const).map(variant => (
              <div key={variant} className="p-2.5 rounded-lg bg-[var(--output-bg)] relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-[var(--output-text)] capitalize">{variant}</span>
                  <button
                    onClick={() => copyText(image.adCopy[variant], variant)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    {copied === variant ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <p className="text-xs text-[var(--output-text)] leading-relaxed opacity-80">
                  {image.adCopy[variant]}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'score' && (
          <motion.div key="score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-3xl font-bold" style={{ color: scoreColor, fontFamily: 'var(--font-syne)' }}>
                  {image.engagementScore.score.toFixed(1)}
                </div>
                <div className="text-xs font-medium mt-0.5" style={{ color: scoreColor }}>
                  {image.engagementScore.label}
                </div>
              </div>
              {/* Score ring */}
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="22" fill="none" stroke="var(--output-border)" strokeWidth="4"/>
                <circle cx="26" cy="26" r="22" fill="none" stroke={scoreColor} strokeWidth="4"
                  strokeDasharray={`${(image.engagementScore.score / 10) * 138.2} 138.2`}
                  strokeLinecap="round" transform="rotate(-90 26 26)" />
              </svg>
            </div>
            <p className="text-xs text-[var(--output-text)] opacity-70 leading-relaxed mb-3">
              {image.engagementScore.reason}
            </p>
            <div className="flex gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
              <Lightbulb size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">{image.engagementScore.tip}</p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
```

---

## PACK SUMMARY PANEL

Above the output grid, show a summary bar with overall pack intelligence:

```tsx
// components/output/PackSummary.tsx
export function PackSummary({ pack }: { pack: GeneratedPack }) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      <div className="bg-[var(--output-surface)] border border-[var(--output-border)] rounded-xl p-3">
        <div className="text-xs text-[var(--text-muted)] mb-1">Pack score</div>
        <div className="text-2xl font-bold text-[var(--accent)]" style={{ fontFamily: 'var(--font-syne)' }}>
          {pack.totalScore.toFixed(1)}
        </div>
        <div className="text-xs text-[var(--text-muted)]">avg engagement</div>
      </div>
      <div className="bg-[var(--output-surface)] border border-[var(--output-border)] rounded-xl p-3">
        <div className="text-xs text-[var(--text-muted)] mb-1">Images</div>
        <div className="text-2xl font-bold text-[var(--output-text)]" style={{ fontFamily: 'var(--font-syne)' }}>
          {pack.images.filter(i => i.status === 'done').length}
        </div>
        <div className="text-xs text-[var(--text-muted)]">generated</div>
      </div>
      <div className="bg-[var(--output-surface)] border border-[var(--output-border)] rounded-xl p-3">
        <div className="text-xs text-[var(--text-muted)] mb-1">Ad variants</div>
        <div className="text-2xl font-bold text-[var(--output-text)]" style={{ fontFamily: 'var(--font-syne)' }}>
          {pack.images.length * 3}
        </div>
        <div className="text-xs text-[var(--text-muted)]">ready to use</div>
      </div>
      <div className="bg-[var(--output-surface)] border border-[var(--output-border)] rounded-xl p-3">
        <div className="text-xs text-[var(--text-muted)] mb-1">Best time</div>
        <div className="text-sm font-bold text-[var(--output-text)]" style={{ fontFamily: 'var(--font-syne)' }}>
          {pack.postingSchedule[0]?.bestTime ?? '—'}
        </div>
        <div className="text-xs text-[var(--text-muted)]">{pack.postingSchedule[0]?.bestDay}</div>
      </div>
    </div>
  )
}
```

---

## ZIP CONTENTS — UPDATED

The ZIP now includes additional files:

```
pixpack_{timestamp}/
  images/
    pixpack_instagram_post_lifestyle.png
    pixpack_tiktok_flatlay.png
    ...
  ad_copy.txt           ← all 3 variants per image
  captions.txt          ← captions + hashtags per image
  product_description.txt ← full Shopify-ready listing
  posting_schedule.txt  ← best times per platform
  pack_scores.txt       ← engagement scores + tips
  README.txt
```

---

## COST BREAKDOWN — UPDATED

```
Background removal (Photoroom)    ~$0.01
Vision analysis (Gemini)          ~$0.005
6× Image generation (Imagen 3)    ~$0.18
Captions (Gemini Haiku-equivalent)~$0.002
Ad copy variants (Gemini)         ~$0.008
Engagement scores (Gemini)        ~$0.006
Product description (Gemini)      ~$0.004
Posting schedule (Gemini)         ~$0.003
──────────────────────────────────────────
Total per pack                    ~$0.218

Charge $4.99 per pack → 22× margin
Monthly subscription $19/mo → 87× margin on 1 pack/day usage
```
