/**
 * lib/prompts/image-generation.prompt.ts
 *
 * REWRITTEN — v3
 *
 * ROOT CAUSE OF WATERMARK HALLUCINATION:
 *   The Photoroom-processed input image carries a tiled "Photoroom" watermark.
 *   Gemini's image model treats this as a visual texture and reproduces it —
 *   especially in hero and closeup variations where the background is minimal
 *   and the model has "room" to fill with the dominant texture it observed.
 *
 * FIX STRATEGY:
 *   1. Explicitly name and kill the background textual artifacts in the prompt.
 *   2. Force the background to be fully described so the model fills it with
 *      real scene content instead of hallucinated noise.
 *   3. For hero/closeup: prescribe a SOLID GRADIENT or TEXTURED MATERIAL background
 *      — something definite that leaves no space for artifact hallucination.
 *   4. Add a NEGATIVE PROMPT section (a list of things Gemini must NOT produce).
 */

import type { Scene, UserConfig } from '../types'

// ─── Platform camera & quality directives ─────────────────────────────────────

const PLATFORM_QUALITY_DIRECTIVES: Record<string, string> = {
  instagram_post: `
Shot on Fujifilm GFX 100S, 80mm f/1.7. Medium-format depth and grain.
Color grade: Warm editorial — lifted shadows, Kodak Portra film emulation, natural highlights.
Composition: Rule of thirds. Product sharp at center focal point.
`.trim(),

  instagram_story: `
Shot on iPhone 15 Pro Max, 24mm, vertical native.
Lighting: Soft natural side-window light. Warm, skin-friendly tones.
Composition: Single continuous scene. Product firmly anchored in lower two-thirds.
`.trim(),

  tiktok: `
Shot on DJI Osmo Pocket 3, wide-angle. Vertical native frame.
Lighting: Ring-light roll-off or soft ambient urban glow.
Composition: Slightly off-center. High energy. Product physically present and weighted.
`.trim(),

  facebook_post: `
Shot on Sony A7R V, 35mm f/2.0.
Lighting: 45-degree professional softbox. Clean, legible shadows.
Color grade: Neutral, high-contrast, trustworthy — no heavy filters.
`.trim(),

  shopify_product: `
Shot on Hasselblad H6D-100c. 100MP commercial quality.
Lighting: 3-point studio. Crisp highlight roll-off on product edges.
Background: Single clean surface (specified in scene). Absolute zero distraction.
`.trim(),

  web_banner: `
Shot on Phase One XF, 45mm panoramic.
Lighting: Golden-hour cinematic side-light with long directional shadows.
Composition: Product left-anchored or right-anchored. Large clean negative space for text.
`.trim(),
}

// ─── Per-angle placement rules ────────────────────────────────────────────────

const ANGLE_PLACEMENT_RULES: Record<string, string> = {
  lifestyle: `
LIFESTYLE PLACEMENT:
- Product rests on or near a clearly defined surface (table, shelf, floor, hand).
- Cast a soft, directional contact shadow where product meets surface.
- Ambient scene light wraps around the product naturally.
- The product belongs in this scene — not composited on top of it.
`,

  hero: `
HERO STUDIO PLACEMENT:
- Product is the only subject. Centered. Full product visible.
- Surface below: a single clean material (slate, oak plank, white marble, brushed steel).
- Background: a seamless gradient or a solid out-of-focus wall — NO PATTERN, NO TEXTURE BEYOND THE SURFACE.
- Rim lighting separates product cleanly from background.
- The background behind the product must be a smooth, uninterrupted gradient — charcoal, warm grey, cream, or deep navy. Choose one. No texture. No grain pattern. No repeated elements.
`,

  context: `
ASPIRATIONAL CONTEXT PLACEMENT:
- Rich environmental scene. No person.
- Product is placed naturally in this environment (on a surface, shelf, countertop).
- Background is dense with real scene detail — furniture, plants, light sources, architecture.
- Product receives the scene's natural light accurately.
`,

  closeup: `
MACRO/CLOSEUP PLACEMENT:
- Frame fills 85%+ with the product's surface detail.
- Background: extreme shallow bokeh. Out-of-focus. The background must be a smooth color wash — NOT a repeated pattern or text.
- One directional light source revealing surface texture: grain, stitching, metal finish, matte coating.
- Depth of field: f/1.4 equivalent. Only the product surface is sharp.
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
      luxury: 'Mood: Ultra-premium. Glossy surfaces, deep shadows, controlled highlights.',
      fashion: 'Mood: High-fashion editorial. Marble, steel, and dramatic contrast.',
      sports: 'Mood: Performance cold-tone. Dynamic, sharp, energetic.',
      tech: 'Mood: Precise and geometric. Cool ambient blue-grey tones.',
      home: 'Mood: Hygge warmth. Natural daylight, linen textures, soft glow.',
      beauty: 'Mood: Luminous. Pastel-adjacent, soft-focus warmth.',
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
    ? '\nFORMAT: ONE SINGLE CONTINUOUS PHOTOGRAPH. NO COLLAGE. NO SPLIT PANELS. NO GRIDS.\n'
    : ''

  return `
You are a world-class commercial product photographer and CGI compositor.
Your task: create a single, photorealistic product photograph for ${platform}.

REFERENCE IMAGE:
The attached image is a product on a transparent or removed background.
This image MAY contain thin, faint, background artifacts or a repeating diagonal pattern of textual noise.
THAT NOISE IS NOT PART OF THE PRODUCT. It is an artifact of the background removal process.
DO NOT reproduce any background text, diagonal noise pattern, or repeated words in your output.
The product itself is clean. Treat the reference as a clean studio cutout.
${verticalWarning}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE TO CREATE:
${scene.image_prompt}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUCT INTEGRATION — NON-NEGOTIABLE:
1. GROUNDED: Product sits firmly on the scene's surface. Zero floating.
2. CONTACT SHADOW: Render a realistic shadow where product touches surface, matching the scene's light direction.
3. LIGHT WRAP: Scene lighting affects the product — warm light = warm highlights on product surface.
4. FULL PRODUCT IN FRAME: Do not crop any part of the product. Full product visible. Minimum 40% frame coverage.
5. EXACT FIDELITY: Reproduce the product's exact shape, color, finish, and proportions. No invented features. No alterations.

${anglePlacement}

TECHNICAL QUALITY:
${qualityDirective}
${audienceColor}
Aspect ratio: ${aspectRatio}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE PROHIBITIONS — OUTPUT MUST NOT CONTAIN:
- Any text, words, or repeated diagonal patterns anywhere in the image
- Any background-removal tool artifacts or textual noise
- Floating product (not touching a surface)
- Cropped or partially visible product edges
- Collage, split-screen, multi-panel, or grid layouts
- Ghosted or semi-transparent product edges
- Multiple copies of the product
- Extra unrelated products in background
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim()
}