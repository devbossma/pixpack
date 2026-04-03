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

import type { Scene, UserConfig, ProductProfile } from '../types'
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

  etsy_product: `
Shot on Sony A7R IV, 50mm f/2.8. Artisan boutique 4:3.
Lighting: Soft natural daylight, warm inviting tones, highlighting craftsmanship.
Background: Textured but clean surface (e.g., reclaimed wood, linen), cozy aesthetic.
`.trim(),
}

// ─── Per-angle placement rules (with depth-of-field) ─────────────────────────

const ANGLE_PLACEMENT_RULES: Record<string, string> = {
  lifestyle: `
LIFESTYLE PLACEMENT:
- Product rests on a real, named surface. It has physical weight and gravity.
- Render a soft directional contact shadow exactly where product touches surface.
- Ambient scene light wraps the product — warm room = warm product highlights.
- The product is part of the scene, not layered on top of it.
- Human element: hands nearby, personal items, implied presence — never isolated.
- DEPTH OF FIELD: f/1.8–f/2.8. The product is the sharp focal plane. Background falls into
  smooth, creamy bokeh. Foreground elements (if any) are also slightly soft.
`,

  hero: `
HERO STUDIO PLACEMENT:
- Product is the ONLY subject. Perfectly centered. Entire product visible.
- Surface: a single named material beneath the product (slate, oak, marble, steel).
- Background: a seamless gradient — one solid tone, smooth from surface to top.
  Choose one: deep charcoal, warm cream, navy-to-black, dove grey. NO texture, NO pattern, NO repeat.
- LIGHTING SETUP (3-point studio):
    KEY LIGHT: positioned 45° from the product’s front-corner, at 30–45° elevation.
    Creates the primary highlight and defines the product’s form. Diffused through a large softbox.
    FILL LIGHT: opposite side, 2:1 ratio (half the key intensity). Softens shadows without eliminating them.
    RIM / BACK LIGHT: positioned behind and above the product, aimed at the back edges.
    Creates a bright separation highlight — a halo of light on the product’s rear edges that lifts it off the background.
- Contact shadow: crisp, well-defined directly under the product. Fades gently outward.
- The product has physical weight — it presses firmly down onto the surface.
- DEPTH OF FIELD: f/8–f/11. Every surface detail, texture, and edge of the product is razor-sharp.
`,

  context: `
ASPIRATIONAL CONTEXT PLACEMENT:
- Rich environmental scene. No person visible.
- Product placed naturally on a surface within the environment.
- Background: dense with real scene detail — at least 3 specific named elements
  (e.g. "a trailing pothos plant, a brass floor lamp, floor-to-ceiling linen curtains").
- Product receives the scene’s natural light — direction, color temperature, intensity match.
- DEPTH OF FIELD: f/4–f/5.6. Product is the sharpest element. Environmental props behind it
  are in soft focus — identifiable but not competing for attention.
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
- DEPTH OF FIELD: f/1.8 phone portrait-mode simulation. Background is noticeably blurred — the kind of
  selective focus a modern smartphone creates on its portrait mode. Looks organic, not studio.
- Mood: This should feel like a frame from someone’s Instagram Stories, not a commercial shoot.
`,
}

// ─── Material-specific rendering rules ───────────────────────────────────────
// Different materials require different rendering treatment to look photorealistic.
// Glass ≠ leather ≠ fabric ≠ metal. Passing the wrong rendering approach produces
// a product that looks like a 3D render, not a real photograph.

function buildMaterialRenderingRules(surfaceFinish?: string): string {
  if (!surfaceFinish) return ''

  const rules: Record<string, string> = {
    glossy: `GLOSSY SURFACE RENDERING:
- Render a clean, bright elongated specular highlight where the key light hits — one dominant bright zone.
- Subtle blurred environment reflections are visible across the surface — ghosted, not sharp.
- The contact shadow has a hard dark core and a soft penumbra that fades outward.
- DO NOT render the surface as flat-colored — gloss always shows light interaction.`,

    metallic: `METALLIC SURFACE RENDERING:
- The product’s metal surfaces reflect their environment — show a blurred, desaturated reflection of the scene.
- Rim light creates a bright, continuous edge highlight that separates the product from background.
- Key light creates a large, clean specular panel — not a single pinpoint dot.
- Brushed metal: reflections are streaked along the brush direction. Polished metal: reflections are mirror-clear.
- Dark areas on metal are very dark — metal has high contrast between lit and shadow zones.`,

    transparent: `TRANSPARENT / GLASS RENDERING:
- Render refraction inside the glass — objects seen through or behind the glass are visibly distorted by the lens effect.
- Caustic light patterns (bright light spots refracted through the glass) appear on the surface beneath the product.
- Internal reflections: the glass shows a ghost of the studio/scene reflected inside its walls.
- Glass edges catch the rim light and glow — a bright, thin line of light traces every glass edge.
- DO NOT render glass as simply a clear outline — it must interact physically with all light sources.`,

    fabric: `FABRIC / TEXTILE RENDERING:
- Render realistic micro-texture — individual fiber detail is visible at close range.
- Fabric shows realistic gravity and drape — natural folds, tension marks, no CG-smooth surfaces.
- Soft, broad diffuse highlights only — fabric scatters light, so there are no specular highlights.
- Thread count and weave pattern (if visible in the reference) must be preserved in the render.
- The fabric color is the pure surface color — no glossy overlay altering the hue.`,

    leather: `LEATHER SURFACE RENDERING:
- Render the leather’s characteristic wide, soft specular sheen — a broad warm highlight across the grain.
- Leather grain pattern is visible and consistent with the reference — not smooth, not plastic.
- Stitching detail catches the key light at a slightly different angle — render stitching with its own micro-highlight.
- Leather absorbs light richly — shadow areas are deep and warm. The contrast ratio is high.
- Edge coloring (if present in reference) transitions from the face color to a slightly different edge tone.`,

    ceramic: `CERAMIC / POTTERY RENDERING:
- Glazed ceramic: subtle sheen that catches light without becoming mirror-bright. A soft wide specular.
- Matte ceramic / stoneware: very little specular — gentle diffuse light, ambient occlusion deepens in hollows and recesses.
- Glaze imperfections (color pooling, texture variation) are visible — they are features, not errors.
- If there is a glaze break or textured foot ring, render these with honest material honesty.`,

    wood: `WOOD SURFACE RENDERING:
- Render visible wood grain running with the product’s natural grain direction.
- Warm light makes wood glow from within — grain highlights carry warm amber undertones.
- Oiled / finished wood shows a subtle sheen. Raw / unfinished wood is completely flat with no specular.
- End-grain surfaces (if visible) show a tighter, more circular pattern — render them differently from face-grain.
- Knots, color variation, and figure in the grain are natural — do not smooth them out.`,

    matte: `MATTE SURFACE RENDERING:
- Absolutely no specular highlight — the surface scatters light uniformly in all directions (Lambertian).
- Ambient occlusion darkens recessed areas, inside corners, and tight joints.
- The product’s color is fully and accurately represented — no glossy overlay shifting the hue.
- Surface texture (if any) is fully visible — matte finishes show every surface detail.
- Shadow transitions are smooth and gradual — no hard shadow boundaries.`,

    mixed: `MIXED SURFACE RENDERING:
- Identify each distinct material zone on the product from the reference image.
- Apply the correct rendering treatment to EACH zone independently — a metal buckle on a fabric bag needs both leather/fabric rendering AND metallic rendering in different areas.
- The transition between material zones should be sharp and physically correct.
- Do not blend or average the rendering — each material zone is its own physical material.`,
  }

  const key = surfaceFinish.toLowerCase().trim()
  const rule = rules[key]
  if (!rule) return ''
  return `\nMATERIAL RENDERING — CRITICAL FOR REALISM:\n${rule}\n`
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
  productHint?: string,
  productProfile?: ProductProfile,
): string {
  const platform = userConfig?.platform ?? 'instagram_post'
  const qualityDirective = PLATFORM_QUALITY_DIRECTIVES[platform] ?? 'Professional product photography.'
  const anglePlacement = ANGLE_PLACEMENT_RULES[scene.angle] ?? ''
  const audienceColor = buildAudienceColorMood(userConfig)
  const verticalWarning = ['instagram_story', 'tiktok'].includes(platform)
    ? '\nFORMAT: ONE SINGLE CONTINUOUS PHOTOGRAPH. NOT a collage. NOT split panels. NOT a grid.\n'
    : ''

  // Material-specific rendering rules derived from surface_finish in product analysis
  const materialRules = buildMaterialRenderingRules(productProfile?.surface_finish)

  // Dominant color palette hint — ensures the generated environment harmonizes with the product
  const colorHint = productProfile?.dominant_colors?.length
    ? `\nPRODUCT COLOR PALETTE: ${productProfile.dominant_colors.join(' · ')}\nThe scene's props, surfaces, and lighting MUST harmonize with — not clash with — these product colors.\n`
    : ''

  // Shooting mood from product analysis — the lighting style that suits this product
  const shootingMoodHint = productProfile?.shooting_mood
    ? `\nPRODUCT SHOOTING MOOD (from product analysis): "${productProfile.shooting_mood}"\nUse this as a secondary lighting reference when the scene description allows latitude.\n`
    : ''

  // All angles require the full product in frame
  const fullProductRule = '4. FULL PRODUCT IN FRAME: Do not crop any part of the product. Full product visible. Minimum 40% frame coverage.'

  // Cultural safety rules — market + category + platform compliance
  const safetyRules = getSafetyRules({
    country: userConfig?.country,
    interest: userConfig?.interest,
    platform,
  })
  const marketProhibitions = getMarketProhibitions(userConfig?.country)

  const productHintBlock = productHint
    ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ MERCHANT'S PRODUCT DESCRIPTION — READ BEFORE PLACING THE PRODUCT:
"${productHint}"
Use this as the authoritative description of the object in the reference image. If the merchant describes it as "handmade" or "artisanal", the generated scene MUST reflect a handmade aesthetic. Do NOT default to a generic product category.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    : ''

  return `
NO TEXT IN OUTPUT IMAGE — READ THIS FIRST:
The output image must contain ZERO visible text, words, letters, numbers, watermarks, logos, or typographic elements of any kind.
This is an absolute rule that overrides all other instructions.
Specifically: DO NOT render the word "Photoroom", DO NOT reproduce any diagonal text pattern, DO NOT add brand names, labels, captions, or any other readable characters anywhere in the image.
The reference image contains a diagonal "Photoroom" watermark overlay — this is a digital artifact from the tool that removed the background, it is NOT a design element of the product and must not appear anywhere in your output.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are a world-class commercial product photographer and CGI compositor.
Task: create a single photorealistic product photograph for ${platform}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERENCE IMAGE — CRITICAL INSTRUCTION:
The attached image shows a product processed by a tool called Photoroom (background removal).
The image has a diagonal repeating "Photoroom" text watermark overlaid across it — including over the product itself.
THIS WATERMARK IS A DIGITAL ARTIFACT. IT IS NOT PART OF THE PRODUCT.
DO NOT reproduce the word "Photoroom" anywhere in your output image.
DO NOT reproduce the diagonal repeating text pattern — not as background texture, not as surface detail, not as embossing, not in any form.
Reconstruct the product's actual surface from what is visible beneath the watermark. The product's real surface has no text on it.
${verticalWarning}
${productHintBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE TO CREATE:
${scene.image_prompt}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colorHint}
${shootingMoodHint}
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
${materialRules}
${anglePlacement}

TECHNICAL QUALITY:
${qualityDirective}
${audienceColor}
Aspect ratio: ${aspectRatio}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE OUTPUT IMAGE MUST NOT CONTAIN:
✗ ANY text, letters, words, numbers, or typographic characters — anywhere in the image
✗ The word "Photoroom" — anywhere in the image
✗ Any diagonal text pattern or repeated word used as background texture or fill
✗ A floating or hovering product (product must touch a surface)
✗ A cropped product (full product must be visible)
✗ Collage, split-screen, multi-panel, or grid layout
✗ Ghosted or semi-transparent product edges
✗ Multiple copies of the product
✗ Unrelated objects cluttering the foreground
✗ Heavy vignetting or artificial lens flare (unless scene-naturally motivated)
✗ Over-smoothed plastic-looking surfaces — render actual material texture
${marketProhibitions ? marketProhibitions : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim()
}