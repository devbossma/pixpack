/**
 * lib/prompts/image-generation.prompt.ts
 *
 * v4 — Three targeted fixes:
 *
 * FIX 1 — WATERMARK:
 *   Previous version removed "Photoroom" from the prompt and used vague
 *   terms like "background artifacts". Gemini needs the EXACT word.
 *   Restored: "DO NOT reproduce the word Photoroom".
 *
 * FIX 2 — PRODUCT GROUNDING:
 *   Added "physical weight and gravity" instruction.
 *   Products were floating/hovering. "The product has physical weight.
 *   It presses down on the surface slightly." forces realistic contact.
 *
 * FIX 3 — CLOSEUP ANGLE:
 *   Was producing a zoomed-out full product shot instead of true macro.
 *   Now explicitly: "Do NOT show the full product. ONE surface detail
 *   fills 90%+ of frame." And removed the "full product in frame" rule
 *   for this angle specifically.
 */

import type { Scene, UserConfig } from '../types'
import { getSafetyRules, getMarketProhibitions } from './cultural-safety.rules'

// ─── Platform camera & quality directives ─────────────────────────────────────

const PLATFORM_QUALITY_DIRECTIVES: Record<string, string> = {
  instagram_post: `
Shot on Fujifilm GFX 100S, 80mm f/1.7. Medium-format texture and micro-contrast.
Color grade: Warm editorial — lifted shadows, Kodak Portra film emulation, natural highlights.
Composition: Rule of thirds. Product sharp at center focal point.
`.trim(),

  instagram_story: `
Shot on iPhone 15 Pro Max, 24mm, native vertical 9:16.
Lighting: Soft natural side-window light. Warm, skin-friendly tones.
Composition: Single continuous scene. Product in lower two-thirds. Nothing cropped.
`.trim(),

  tiktok: `
Shot on DJI Osmo Pocket 3, wide-angle. Native vertical 9:16.
Lighting: Ring-light roll-off or soft ambient urban glow.
Composition: Slightly off-center. High energy. Product physically weighted on surface.
`.trim(),

  facebook_post: `
Shot on Sony A7R V, 35mm f/2.0. Clean, journalistic 4:3.
Lighting: 45-degree professional softbox. Legible, honest shadows.
Color grade: Neutral, high-contrast, trustworthy. No heavy filters.
`.trim(),

  shopify_product: `
Shot on Hasselblad H6D-100c, 100MP. Commercial studio 1:1.
Lighting: 3-point studio. Crisp highlight roll-off on product edges.
Background: Single clean surface (specified in scene). Zero distraction.
`.trim(),

  web_banner: `
Shot on Phase One XF, 45mm panoramic. Ultra-wide 16:9.
Lighting: Golden-hour cinematic side-light. Long directional shadows.
Composition: Product anchored left or right. Large clean empty space for text overlay.
`.trim(),
}

// ─── Per-angle placement rules ────────────────────────────────────────────────

const ANGLE_PLACEMENT_RULES: Record<string, string> = {
  lifestyle: `
LIFESTYLE PLACEMENT:
- Product rests on a real, named surface. It has physical weight and gravity.
- Render a soft directional contact shadow exactly where product touches surface.
- Ambient scene light wraps the product — warm room = warm product highlights.
- The product is part of the scene, not layered on top of it.
- Human element: hands nearby, personal items, implied presence — never isolated.
`,

  hero: `
HERO STUDIO PLACEMENT:
- Product is the ONLY subject. Perfectly centered. Entire product visible.
- Surface: a single named material beneath the product (slate, oak, marble, steel).
- Background: a seamless gradient — one solid tone, smooth from surface to top.
  Choose one: deep charcoal, warm cream, navy-to-black, dove grey. NO texture, NO pattern, NO repeat.
- Rim light separates product from background. Crisp contact shadow beneath.
- The product has physical weight — it presses down onto the surface.
`,

  context: `
ASPIRATIONAL CONTEXT PLACEMENT:
- Rich environmental scene. No person visible.
- Product placed naturally on a surface within the environment.
- Background: dense with real scene detail — at least 3 specific named elements
  (e.g. "a trailing pothos plant, a brass floor lamp, floor-to-ceiling linen curtains").
- Product receives the scene's natural light — direction, color temperature, intensity match.
`,

  social_proof: `
SOCIAL PROOF / UGC PLACEMENT:
- This is an AUTHENTIC first-use or unboxing moment. It must look real, not staged.
- The FULL product is clearly visible and in frame — minimum 40% frame coverage.
- A hand rests beside or partially holds the product from the edge of frame, or packaging (paper bag, box) is visible nearby.
- Personal items (coffee cup, phone, keys) are casually placed in the scene — not artfully arranged, organically positioned.
- Surface: a real domestic surface — bed linen, bathroom shelf, kitchen counter, wooden desk.
- Lighting: soft natural window light only. No softboxes, no ring lights, no studio flash.
  Warm morning or afternoon indoor ambient light. Slight natural skin-tone warmth on surfaces.
- Background: real domestic interior, slightly out of focus — blurred apartment wall, sheer curtained window, bookshelf. NOT a seamless gradient.
- Mood: This should feel like a frame from someone’s Instagram Stories, not a commercial shoot.
`,
}

// ─── Audience color & mood overlay ────────────────────────────────────────────

function buildAudienceColorMood(userConfig?: UserConfig): string {
  if (!userConfig) return ''
  const lines: string[] = []

  if (userConfig.ageRange) {
    const map: Record<string, string> = {
      '18-24': 'Color tone: High saturation, punchy contrast, youthful energy.',
      '25-34': 'Color tone: Warm editorial — premium, slightly desaturated highlights.',
      '35-44': 'Color tone: Balanced, confident, deep mid-tones.',
      '45-60': 'Color tone: Refined, timeless, warm and subdued palette.',
    }
    if (map[userConfig.ageRange]) lines.push(map[userConfig.ageRange])
  }

  if (userConfig.interest) {
    const map: Record<string, string> = {
      luxury: 'Mood: Ultra-premium. Glossy surfaces, deep controlled shadows.',
      fashion: 'Mood: High-fashion editorial. Marble, steel, dramatic contrast.',
      sports: 'Mood: Performance cold-tone. Dynamic, sharp, energetic.',
      tech: 'Mood: Precise and geometric. Cool ambient blue-grey tones.',
      home: 'Mood: Hygge warmth. Natural daylight, linen textures, soft glow.',
      beauty: 'Mood: Luminous. Soft-focus warmth, pastel-adjacent.',
      outdoor: 'Mood: Raw nature. High dynamic range, golden-hour tones.',
      food: 'Mood: Appetite-forward. Warm overhead light, tactile surfaces.',
      business: 'Mood: Sharp and confident. Cool-tone, ordered, geometric.',
    }
    if (map[userConfig.interest]) lines.push(map[userConfig.interest])
  }

  return lines.length ? `\nAUDIENCE COLOR DIRECTION:\n${lines.join('\n')}` : ''
}

// ─── Main prompt builder ───────────────────────────────────────────────────────

export function buildImageGenerationPrompt(
  scene: Scene,
  aspectRatio: string,
  userConfig?: UserConfig,
): string {
  const platform = userConfig?.platform ?? 'instagram_post'
  const qualityDirective = PLATFORM_QUALITY_DIRECTIVES[platform] ?? 'Professional product photography.'
  const anglePlacement = ANGLE_PLACEMENT_RULES[scene.angle] ?? ''
  const audienceColor = buildAudienceColorMood(userConfig)
  const verticalWarning = ['instagram_story', 'tiktok'].includes(platform)
    ? '\nFORMAT: ONE SINGLE CONTINUOUS PHOTOGRAPH. NOT a collage. NOT split panels. NOT a grid.\n'
    : ''

  // All angles require the full product in frame (social_proof replaced closeup macro)
  const fullProductRule = '4. FULL PRODUCT IN FRAME: Do not crop any part of the product. Full product visible. Minimum 40% frame coverage.'

  // Cultural safety rules — market + category + platform compliance
  const safetyRules = getSafetyRules({
    country: userConfig?.country,
    interest: userConfig?.interest,
    platform,
  })
  const marketProhibitions = getMarketProhibitions(userConfig?.country)

  return `
You are a world-class commercial product photographer and CGI compositor.
Task: create a single photorealistic product photograph for ${platform}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERENCE IMAGE — CRITICAL INSTRUCTION:
The attached image shows a product with its background removed by a tool called Photoroom.
The image contains a tiled repeating diagonal watermark that reads "Photoroom" across it.
THIS WATERMARK IS NOT PART OF THE PRODUCT.
DO NOT reproduce the word "Photoroom" anywhere in your output image.
DO NOT use the diagonal "Photoroom" text pattern as a background texture or fill.
The product itself is clean. Treat the reference as a pristine studio cutout with no watermark.
${verticalWarning}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE TO CREATE:
${scene.image_prompt}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${safetyRules ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CULTURAL & COMPLIANCE RULES — MANDATORY:
${safetyRules}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : ''}

PRODUCT INTEGRATION — MANDATORY:
1. GRAVITY: The product has physical weight. It sits firmly on the surface. It is NOT floating or hovering above the surface.
2. CONTACT SHADOW: Render a realistic shadow exactly where the product meets the surface — matching the scene's light direction and intensity.
3. LIGHT WRAP: The scene's ambient light wraps the product surfaces. Warm room = warm product highlights. Cool studio = neutral product tones.
${fullProductRule}
5. EXACT FIDELITY: Reproduce the product's exact shape, color, material finish, and proportions from the reference. Do not invent features, change colors, or alter the form.

${anglePlacement}

TECHNICAL QUALITY:
${qualityDirective}
${audienceColor}
Aspect ratio: ${aspectRatio}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE OUTPUT IMAGE MUST NOT CONTAIN:
✗ The word "Photoroom" — anywhere in the image
✗ Any diagonal text pattern or repeated word used as background texture or fill
✗ A floating or hovering product (product must touch a surface)
✗ A fully cropped product (except closeup angle — see above)
✗ Collage, split-screen, multi-panel, or grid layout
✗ Ghosted or semi-transparent product edges
✗ Multiple copies of the product
✗ Unrelated objects cluttering the foreground
${marketProhibitions ? marketProhibitions : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim()
}