/**
 * lib/prompts/creative-director.prompt.ts
 *
 * REWRITTEN — v3
 *
 * KEY CHANGES FROM v2:
 *   - Hero and Closeup scenes now REQUIRE a specified background color/gradient.
 *     Empty/vague backgrounds are where the model hallucinates watermark patterns.
 *     Forcing "a deep charcoal seamless background" or "warm cream gradient wall"
 *     fills that space with intentional content.
 *   - Scene descriptions are now 3 sentences minimum, all describing different
 *     spatial layers (surface · mid-scene · background/atmosphere).
 *   - Added BACKGROUND_COLOR requirement field to hero and closeup variation briefs.
 *   - Tightened all variation briefs to produce denser, more specific prompts.
 */

import type { ProductProfile, UserConfig } from '../types'
import { getSafetyRules } from './cultural-safety.rules'

// ─── Audience visual context ───────────────────────────────────────────────────

const AGE_VISUAL_CONTEXT: Record<string, string> = {
  '18-24': 'Urban energy: skateparks, neon-lit street markets, colorful minimal bedrooms, vibrant co-working spaces. Textures: Concrete, neon acrylic, street tiles, brushed aluminum.',
  '25-34': 'Aspirational living: modern boho apartments with trailing plants, rooftop brunch spots, boutique coffee bars with marble counters. Textures: White marble, linen, light oak, matte ceramic.',
  '35-44': 'Accomplished & active: high-end home office, stone kitchen island with pendant lighting, weekend garden retreat. Textures: Walnut, stone, glass, brushed bronze.',
  '45-60': 'Refined comfort: sunset terrace, well-appointed reading room, luxury travel lounge. Textures: Fine wool, velvet, aged oak, wrought iron.',
}

const GENDER_VISUAL_CONTEXT: Record<string, string> = {
  women: 'Warm tones, morning light, vanity adjacency, floral accents. Gold and rose-gold hardware. Silk, marble, soft ceramics.',
  men: 'Clean lines, workshop bench, gym floor, rugged terrain. Matte black and chrome. Carbon fiber, brushed steel, raw concrete.',
  mixed: 'Contemporary neutral: open bright spaces, shared café environments, outdoor public lifestyle. Concrete, light oak, glass.',
}

const INTEREST_VISUAL_CONTEXT: Record<string, string> = {
  fashion: 'Editorial: high-contrast studio, boutique dressing room, marble street corner. High-fashion mood.',
  sports: 'Performance: indoor track, textured gym floor, locker room tile, outdoor court. Dynamic lighting.',
  luxury: 'Quiet luxury: marble surface, private poolside, leather interior, hotel lobby with soft gold accents.',
  tech: 'Precise: clean workstation, dual-monitor ambient glow, geometric desk setup, cool blue-grey tones.',
  home: 'Hygge: linen, morning light, wooden surfaces, a steaming mug. Slow and warm.',
  beauty: 'Luminous: vanity counter, white marble bath, soft-focus florals, pastel light.',
  outdoor: 'Raw nature: mountain trail at golden hour, lakeside rocks, forest dappled light.',
  family: 'Welcoming: bright living room, kitchen table, backyard lawn. Warm open daylight.',
  food: 'Tactile appetite: café marble, market wood crates, kitchen prep stone. Warm overhead light.',
  business: 'Sharp: sleek office lobby, airport lounge, boardroom glass. Confident cool tone.',
}

const PLATFORM_FRAMING: Record<string, string> = {
  instagram_post: 'Square 1:1. Clean rule of thirds. Premium social aesthetic.',
  instagram_story: 'Vertical 9:16. Upper-half product focus. Candid energy.',
  tiktok: 'Vertical 9:16. Dynamic creator-native angle. Motion-suggested background.',
  facebook_post: '4:3. Approachable, trust-building, relatable lifestyle composition.',
  shopify_product: '1:1. Commercial, zero clutter, single-surface studio.',
  web_banner: '16:9. Product far left or right. Large negative space for copy overlay.',
}

// ─── Variation angle briefs ────────────────────────────────────────────────────
// CRITICAL: Each brief demands 3 spatial layers in the scene description:
//   Layer 1: The SURFACE the product sits on (exact material + finish)
//   Layer 2: The MID-SCENE elements (props, architecture, environment)
//   Layer 3: The BACKGROUND (color, gradient, or atmosphere — MUST be specific)
//
// Hero and Closeup MUST specify background color — this prevents the model from
// filling empty background space with watermark-pattern hallucinations.

const VARIATION_ANGLES = [
  {
    id: 'lifestyle',
    label: 'VARIATION 1 — LIFESTYLE',
    brief: `Candid scene with a person implied or partially present. 
Surface (Layer 1): Specify the exact material the product rests on — e.g., "light oak coffee table", "pale marble side table", "soft linen bedsheet".
Mid-scene (Layer 2): Describe 2-3 props and the human element — what is nearby, what are hands doing, what tells us about the person's life.
Background (Layer 3): Describe the room or environment atmosphere — wall color, window light, plants, furniture. Be specific. No vague "cozy atmosphere".
Mood: Candid, warm, real-life moment. The product belongs here naturally.`,
  },
  {
    id: 'hero',
    label: 'VARIATION 2 — HERO (Studio)',
    brief: `Commercial studio shot. The product is the sole subject.
Surface (Layer 1): ONE specific material surface — e.g., "polished white Carrara marble slab", "raw grey slate tile", "aged warm oak plank", "brushed gunmetal sheet".
Mid-scene (Layer 2): The product sits centered on this surface. Nothing else. Maybe a subtle complementary prop if it adds context (a clean cable, a case), but nothing distracting.
Background (Layer 3): THIS IS CRITICAL — specify an exact background color or gradient behind and above the product. Examples: "seamless deep charcoal grey gradient", "warm cream-white paper sweep", "rich navy-to-black gradient", "soft dove-grey seamless backdrop". This must be a SOLID TONE or smooth gradient — no patterns, no textures, no repeated elements.
Mood: Premium, precise, aspirational. One product, one surface, one background tone.`,
  },
  {
    id: 'context',
    label: 'VARIATION 3 — CONTEXT (Aspirational)',
    brief: `High-end aspirational environment. No person visible.
Surface (Layer 1): The material surface where the product sits — e.g., "veined white marble kitchen island", "reclaimed oak sideboard", "glass shelf".
Mid-scene (Layer 2): Rich environmental context — describe the furniture, objects, plants, and architectural details that signal the lifestyle. 3-4 specific elements.
Background (Layer 3): The wall, window, or atmospheric depth behind — e.g., "floor-to-ceiling windows with soft city haze", "raw plaster warm beige wall", "dark green botanical wallpaper". Be specific.
Mood: Desire and aspiration. The scene sells the lifestyle the product belongs to.`,
  },
  {
    id: 'closeup',
    label: 'VARIATION 4 — CLOSEUP (Detail)',
    brief: `Extreme macro. The product's surface fills 85%+ of the frame.
Surface (Layer 1): Describe the PRODUCT SURFACE being featured — the specific material detail: "the matte soft-touch coating on the headband", "the perforated leather ear cushion texture", "the brushed gold adjustment mechanism". This is what the macro lens is focusing on.
Mid-scene (Layer 2): Not applicable — the product IS the scene. But describe the orientation: "shot from 30 degrees above, slightly front-facing".
Background (Layer 3): THIS IS CRITICAL — specify what the extreme bokeh background resolves to: "soft warm amber bokeh wash", "out-of-focus cool grey studio wall", "blurred cream linen texture". Must be a single smooth color tone — no text, no patterns, no repeated elements. The background must not be identifiable as anything specific.
Mood: Material desire. Every tactile detail is visible and inviting.`,
  },
]

// ─── Main prompt builder ───────────────────────────────────────────────────────

export function buildCreativeDirectorPrompt(
  productProfile: ProductProfile,
  userConfig: UserConfig,
): string {
  const platform = userConfig.platform ?? 'instagram_post'
  const ageVisual = userConfig.ageRange ? AGE_VISUAL_CONTEXT[userConfig.ageRange] ?? '' : ''
  const genderVisual = userConfig.gender ? GENDER_VISUAL_CONTEXT[userConfig.gender] ?? '' : ''
  const interestVis = userConfig.interest ? INTEREST_VISUAL_CONTEXT[userConfig.interest] ?? '' : ''
  const platformFrame = PLATFORM_FRAMING[platform] ?? ''

  const audienceContext = [
    userConfig.ageRange && `Age group: ${userConfig.ageRange}`,
    userConfig.gender && `Gender: ${userConfig.gender}`,
    userConfig.country && `Market: ${userConfig.country}`,
    userConfig.interest && `Interest: ${userConfig.interest}`,
  ].filter(Boolean).join(' · ')

  const safetyRules = getSafetyRules({
    country: userConfig?.country,
    interest: userConfig?.interest,
    platform,
  })

  return `
You are a Senior Creative Director at a top-tier Digital Ad Agency.
Task: Write 4 DISTINCT scene descriptions for A/B testing this product in paid ads.

PRODUCT ANALYSIS:
${JSON.stringify(productProfile, null, 2)}

AUDIENCE: ${audienceContext || 'Global social media users'}

AUDIENCE VISUAL CONTEXT:
${[ageVisual, genderVisual, interestVis].filter(Boolean).join('\n')}

PLATFORM: ${platform}
FRAMING GUIDE: ${platformFrame}

${safetyRules ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CULTURAL & COMPLIANCE RULES — YOU MUST FOLLOW THESE:
${safetyRules}
These rules govern what is allowed in your scene descriptions.
A scene that violates these rules will be rejected. Write scenes that respect them completely.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE DESCRIPTION RULES — READ CAREFULLY:

1. THREE SPATIAL LAYERS: Every scene description MUST address all three layers:
   - SURFACE: The exact material the product sits on (never vague — "wood" is wrong, "light ash wood grain desktop" is right)
   - MID-SCENE: Props, environment, human elements
   - BACKGROUND: The specific color, gradient, wall, or atmosphere behind the product — this MUST be explicit and definite

2. WHY BACKGROUND MATTERS: The image generation model fills undefined background space with noise and artifacts. 
   A specific background ("deep charcoal seamless gradient") prevents hallucinations.
   "Moody atmosphere" is NOT a background. "Warm charcoal grey seamless paper sweep" IS.

3. NO PRODUCT MENTION: Do not name the product, its brand, or its features in the scene. Describe only the environment.

4. SPECIFICITY: Every material, color, and object must be named precisely. No "nice", "modern", "elegant", "premium".

5. DENSITY: 3 full sentences per variation minimum, each addressing a different spatial layer.

6. LANGUAGE: Output the JSON in English regardless of target market language. Language affects the ad copy, not the visual scene.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOUR VARIATION BRIEFS:

${VARIATION_ANGLES.map(v => `${v.label}:\n${v.brief}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON. No markdown. No code fences. Start directly with {

{
  "platform": "${platform}",
  "variations": [
    {
      "variation": 1,
      "angle": "lifestyle",
      "image_prompt": "<3 sentences covering all 3 spatial layers: SURFACE material · MID-SCENE props and human element · BACKGROUND room atmosphere with specific wall color and light source. No product name.>"
    },
    {
      "variation": 2,
      "angle": "hero",
      "image_prompt": "<3 sentences: SURFACE material (exact) · product as sole subject, centered · BACKGROUND as a specific solid-tone seamless gradient or color sweep — charcoal, navy, cream, slate, etc. No patterns. No product name.>"
    },
    {
      "variation": 3,
      "angle": "context",
      "image_prompt": "<3 sentences: SURFACE material · MID-SCENE lifestyle environment with 3+ specific elements · BACKGROUND wall or window with specific color/material. No person. No product name.>"
    },
    {
      "variation": 4,
      "angle": "closeup",
      "image_prompt": "<3 sentences: SURFACE as the product's own material surface detail being macro-focused · shooting angle and depth of field · BACKGROUND as a specific smooth bokeh color wash — amber, grey, cream, etc. Not a pattern. No product name.>"
    }
  ],
  "posting_schedule": {
    "best_day":  "<day of week>",
    "best_time": "<local time>",
    "reasoning": "<one sentence specific to this audience>"
  }
}
`.trim()
}