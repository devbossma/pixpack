/**
 * lib/prompts/image-generation.prompt.ts
 *
 * Builds the image generation prompt for gemini-2.5-flash-image.
 *
 * KEY FIXES IN THIS VERSION:
 *
 * 1. FULL PRODUCT VISIBILITY (fixes half-product issue)
 *    The original prompt didn't tell the model where to anchor the product or
 *    how large to make it. Gemini defaulted to "natural" placement — sometimes
 *    cropping the product at the frame edge. Now: explicit position + minimum
 *    size requirement + hard prohibition on partial crops.
 *
 * 2. AUDIENCE CONTEXT IN IMAGE PROMPT (fixes same-style-every-time issue)
 *    The image model also gets the audience config so it can adjust:
 *    - Colour grade (warm/cool, saturated/muted) to match demographic taste
 *    - Compositional energy (dynamic vs calm) to match age/interest
 *    - Any human elements (hands, body language) to match gender/age
 *
 * 3. ANGLE-SPECIFIC COMPOSITION RULES
 *    Each angle type (lifestyle, flatlay, closeup, model, hero) now gets
 *    explicit composition rules so the model knows exactly what to do with
 *    the product — not just where to put it.
 */

import type { Scene, UserConfig } from '../types'

// Per-platform quality directives
const PLATFORM_QUALITY_DIRECTIVES: Record<string, string> = {
  instagram_post: `
Camera: Sony A7R V, 85mm f/1.4. Bokeh background, product in sharp focus.
Color grade: Warm Lightroom preset — lifted shadows, slightly desaturated highlights.
Composition: Rule of thirds. Product clearly in frame, not cropped. Natural negative space around it.
`.trim(),

  instagram_story: `
Camera: iPhone 15 Pro portrait mode — native, not over-produced.
Vertical frame (9:16). THIS IS A SINGLE CONTINUOUS PHOTOGRAPH — one unbroken scene from top to bottom.
Product fully visible in the upper two-thirds. Scene context fills the lower third naturally.
Color grade: Slightly warm, high clarity. Authentic UGC aesthetic.
`.trim(),

  tiktok: `
Camera: Sony ZV-E10 or DJI Osmo Pocket. Wide, energetic.
Color grade: High contrast, punchy saturation. Cyberpunk or film-burned if environment supports it.
Composition: Dynamic, off-centre. Product fully in frame — never cropped by edge.
Vertical frame (9:16). THIS IS A SINGLE CONTINUOUS PHOTOGRAPH — one unbroken scene from top to bottom.
Do NOT split the frame into panels, grids, or sections.
`.trim(),

  facebook_post: `
Camera: Canon 5D Mark IV, 50mm f/2.8. Clean, journalistic.
Color grade: Natural, accurate. Slight warm tone.
Composition: Balanced, clear. Product prominent and fully visible.
`.trim(),

  shopify_product: `
Camera: Phase One IQ4 or Hasselblad X2D. Medium format quality.
Lighting: Three-point softbox. Even illumination, no harsh shadows.
Color grade: Neutral, colour-accurate. No stylisation.
Composition: Product fills 70–80% of frame. Centred or rule-of-thirds. Fully in frame.
`.trim(),

  web_banner: `
Camera: Canon EOS R5, 24–70mm wide. Cinematic.
Color grade: Slightly desaturated, one accent colour pull.
Composition: Wide horizontal. Product anchored left or right third. FULLY in frame. Empty space on opposite side for text.
`.trim(),
}

// Angle-specific product placement rules
const ANGLE_PLACEMENT_RULES: Record<string, string> = {
  lifestyle: `
LIFESTYLE ANGLE RULES:
- Product placed naturally in the environment, as if left there or in active use.
- Product fully visible — no cropping, no partial frames.
- Scene tells a story; product is part of it, not floating above it.
- Shallow depth of field: product sharp, background soft.
`,

  flatlay: `
FLAT-LAY ANGLE RULES:
- Camera directly overhead (90 degrees). Clean top-down view.
- Product centred or rule-of-thirds. ENTIRE PRODUCT must be visible within the frame.
- Complementary props arranged around it — nothing overlapping the product itself.
- Even, shadowless overhead lighting.
`,

  closeup: `
CLOSE-UP ANGLE RULES:
- Product fills 80–90% of the frame. Extreme macro.
- Focus on the most visually interesting detail: texture, stitching, finish, logo, hardware.
- Entire product or the featured detail must be fully in-frame — no cropping.
- Background: clean soft bokeh.
`,

  model: `
MODEL ANGLE RULES:
- A person holds, uses, or wears the product. Product is clearly visible.
- Product must not be obscured by hands, body, or motion blur.
- Person's face optional — if shown, expression matches the brand mood.
- 3/4 body shot or detail shot with product prominent.
`,

  hero: `
HERO ANGLE RULES:
- Product is the sole subject. Nothing competes for attention.
- Product centred, fills 70–80% of frame. COMPLETE product, no cropping.
- Perfect controlled lighting. Background clean or minimal.
- Commercial photography benchmark: Amazon Hero Image quality.
`,
}

export function buildImageGenerationPrompt(
  scene: Scene,
  aspectRatio: string,
  userConfig?: UserConfig,
): string {
  const qualityDirective = PLATFORM_QUALITY_DIRECTIVES[scene.platform] ?? 'Professional commercial product photography.'
  const anglePlacement = userConfig?.angle ? ANGLE_PLACEMENT_RULES[userConfig.angle] ?? '' : ''

  // Audience colour and energy modifiers
  // These give the model specific visual cues to adjust for different audiences
  const audienceColorMood = buildAudienceColorMood(userConfig)

  // For vertical platforms, add an explicit single-frame reinforcement at the top
  // — Gemini sometimes interprets 9:16 + product reference as "make a collage"
  const singleFrameWarning = ['instagram_story', 'tiktok'].includes(scene.platform)
    ? 'OUTPUT FORMAT: ONE single photograph. NOT a collage. NOT a split screen. NOT a before/after. One continuous image.\n'
    : ''

  // The reference image may contain a "Photoroom" watermark from the sandbox API.
  // We explicitly instruct the model to ignore it and not reproduce it.
  const watermarkWarning = 'IMPORTANT: The reference product image may contain a "Photoroom" watermark. This is a processing artefact — IGNORE IT COMPLETELY. Do NOT reproduce it, trace it, or let it appear anywhere in the output image.\n'

  return `
${watermarkWarning}${singleFrameWarning}You are compositing a professional product photograph for ${scene.platform}.
The reference image is a product with a transparent or removed background.
Ignore any text, watermarks, or overlays visible on the reference image — they are processing artefacts, not part of the product.
Place the COMPLETE, FULLY VISIBLE product into the scene described below.

SCENE DESCRIPTION:
${scene.image_prompt}

PRODUCT PLACEMENT — NON-NEGOTIABLE RULES:
1. The ENTIRE product must be visible within the frame. No edges cut off. No partial crops.
   If the product cannot fit completely, zoom out until it does.
2. Position the product in the foreground of the scene. It must be the visual focal point.
3. Preserve EXACTLY from the reference image: all colours, textures, proportions, logos,
   text, hardware, and brand details. Do not alter, stylise, or simplify anything.
4. Scale naturally — the product must look like it was physically present when photographed.
   Minimum size: the product must occupy at least 30% of the total frame area.
5. Match the key light direction from the scene to the product's lighting.
6. Add a realistic contact shadow or ground shadow beneath the product.

${anglePlacement}

TECHNICAL SPECIFICATION:
${qualityDirective}
${audienceColorMood}
Aspect ratio: ${aspectRatio}

ABSOLUTE PROHIBITIONS:
- NEVER cut off or crop any part of the product — if it doesn't fit, scale it down.
- Do NOT reproduce ANY text, watermark, or overlay from the reference image.
  Specifically: if the reference image contains a "Photoroom" watermark, it must NOT
  appear anywhere in the output. Treat the product as if it were perfectly clean.
- Do NOT add any new text, logos, or graphic overlays.
- Do NOT let the product float with no surface relationship.
- Do NOT warp, distort, mirror, or stylise the product's shape or colour.
- Do NOT duplicate or clone the product.
- Do NOT add people, hands, or faces unless the scene specifically calls for it.
- Do NOT make the product smaller than 30% of the frame area.
- SINGLE FRAME ONLY: Do NOT create collages, split screens, before/after panels,
  grid layouts, diptychs, or any multi-panel composition. The output must be
  one single continuous photograph — one scene, one frame, one image.
`.trim()
}

// ─── Audience → colour and energy modifiers ───────────────────────────────────
// These are subtle but cumulative — they push the model toward the right
// visual feel for the demographic without overriding the scene description.

function buildAudienceColorMood(userConfig?: UserConfig): string {
  if (!userConfig) return ''

  const lines: string[] = []

  if (userConfig.ageRange) {
    const ageGrade: Record<string, string> = {
      '18-24': 'Color energy: high saturation, high contrast. Bold and immediate.',
      '25-34': 'Color energy: warm saturation, editorial grade. Aspirational but real.',
      '35-44': 'Color energy: balanced, confident tones. Quality over flash.',
      '45-60': 'Color energy: warm, refined palette. Timeless over trendy.',
    }
    const grade = ageGrade[userConfig.ageRange]
    if (grade) lines.push(grade)
  }

  if (userConfig.interest) {
    const interestMood: Record<string, string> = {
      'fashion': 'Visual mood: editorial, high-fashion. Every element looks intentional.',
      'sports': 'Visual mood: dynamic, performance. Energy in the composition.',
      'luxury': 'Visual mood: ultra-premium. Rich textures, dramatic shadows, no excess.',
      'tech': 'Visual mood: precise, clean. Cool tones, geometric discipline.',
      'home': 'Visual mood: warm, cosy. Hygge. Natural materials and soft light.',
      'beauty': 'Visual mood: soft, luminous. Pastel or neutral palette, flawless.',
      'outdoor': 'Visual mood: raw, natural. High dynamic range, earthy tones.',
      'family': 'Visual mood: bright, welcoming. Open spaces, warm daylight.',
      'food': 'Visual mood: appetising, tactile. Warm overhead, wood and stone.',
      'business': 'Visual mood: sharp, confident. Cool tones, geometric composition.',
    }
    const mood = interestMood[userConfig.interest]
    if (mood) lines.push(mood)
  }

  return lines.length > 0 ? `\nAUDIENCE VISUAL CALIBRATION:\n${lines.join('\n')}` : ''
}