/**
 * lib/prompts/image-generation.prompt.ts
 *
 * v5 — Root cause fix: identical images across different products
 *
 * THE PROBLEM (v4):
 *   The creative director wrote rich, product-specific scene descriptions but they were
 *   being overridden by two things in the final image prompt:
 *
 *   1. GENERIC ANGLE_PLACEMENT_RULES: These re-described the scene type (lifestyle/hero/context)
 *      in product-agnostic terms AFTER the creative director's specific scene — Gemini
 *      weighted the generic rules more heavily and defaulted to "product on a nice surface".
 *
 *   2. MISSING PRODUCT CONTEXT: product_type, use_cases, target_customer were never injected
 *      into the image generation prompt. Gemini had no idea if it was generating for a
 *      coffee set, a dog collar, or a yoga mat, so it generated the same generic shot.
 *
 *   3. SCENE BURIED MID-PROMPT: scene.image_prompt appeared sandwiched between boilerplate,
 *      making it lower priority than the surrounding rules.
 *
 * THE FIX (v5):
 *   1. scene.image_prompt is now the PRIMARY directive — placed first, heavily emphasized.
 *   2. Product context block added: product_type + use_cases + target_customer so Gemini
 *      knows "this is a coffee product, it lives in a kitchen context" before generating.
 *   3. ANGLE_PLACEMENT_RULES replaced with ANGLE_TECHNICAL_SPECS — these now ONLY cover
 *      technical photography (DOF, f-stop, lighting setup), NOT scene re-descriptions.
 *      The creative director already wrote the scene — these rules add to it, not replace it.
 *   4. Fixed numbering bug (two items labeled "4." in PRODUCT INTEGRATION).
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

// ─── Per-angle TECHNICAL specs only (DOF, lighting setup, NOT scene re-description) ──
// These add to the creative director's scene — they do NOT replace it.
// The creative director already wrote what the scene looks like.
// These rules only specify HOW to photograph it (aperture, focus plane, lighting rig).

const ANGLE_TECHNICAL_SPECS: Record<string, string> = {
  lifestyle: `
TECHNICAL PHOTOGRAPHY (lifestyle):
- Depth of field: f/1.8–f/2.8. The product is the sharp focal plane. Background falls into smooth creamy bokeh.
- Foreground elements (if any) are also slightly soft.
- Natural ambient light — no studio flash, no ring light, no hard shadows.
- The scene described above is a real candid moment, not a styled product shoot. Photograph it accordingly.
`,

  hero: `
TECHNICAL PHOTOGRAPHY (hero studio):
- Depth of field: f/8–f/11. Every surface detail, texture, and edge of the product is razor-sharp.
- 3-point studio lighting:
    KEY LIGHT: 45° from front-corner at 30–45° elevation. Large softbox diffusion. Defines product form.
    FILL LIGHT: opposite side, 2:1 ratio. Softens shadows without eliminating them.
    RIM / BACK LIGHT: behind and above the product, aimed at back edges. Creates a bright separation halo.
- Contact shadow: crisp, well-defined directly under the product. Fades gently outward.
`,

  context: `
TECHNICAL PHOTOGRAPHY (aspirational context):
- Depth of field: f/4–f/5.6. Product is the sharpest element. Environmental props behind are in soft focus — identifiable but not competing.
- Natural scene light — the product receives the scene's ambient light in direction, color temperature, and intensity.
- No person visible in the scene. The environment tells the story.
`,

  social_proof: `
TECHNICAL PHOTOGRAPHY (social proof / UGC):
- Depth of field: f/1.8 phone portrait-mode simulation. Background noticeably blurred — the kind of selective focus a modern smartphone creates on portrait mode.
- Natural window light only. No studio flash, no ring light. Warm morning or afternoon indoor ambient.
- This should look like a frame from someone's Instagram Stories, not a commercial shoot.
`,
}

// ─── Material-specific rendering rules ───────────────────────────────────────

function buildMaterialRenderingRules(surfaceFinish?: string): string {
  if (!surfaceFinish) return ''

  const rules: Record<string, string> = {
    glossy: `GLOSSY SURFACE RENDERING:
- Render a clean, bright elongated specular highlight where the key light hits — one dominant bright zone.
- Subtle blurred environment reflections are visible across the surface — ghosted, not sharp.
- The contact shadow has a hard dark core and a soft penumbra that fades outward.
- DO NOT render the surface as flat-colored — gloss always shows light interaction.`,

    metallic: `METALLIC SURFACE RENDERING:
- The product's metal surfaces reflect their environment — show a blurred, desaturated reflection of the scene.
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
- Render the leather's characteristic wide, soft specular sheen — a broad warm highlight across the grain.
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
- Render visible wood grain running with the product's natural grain direction.
- Warm light makes wood glow from within — grain highlights carry warm amber undertones.
- Oiled / finished wood shows a subtle sheen. Raw / unfinished wood is completely flat with no specular.
- End-grain surfaces (if visible) show a tighter, more circular pattern — render them differently from face-grain.
- Knots, color variation, and figure in the grain are natural — do not smooth them out.`,

    matte: `MATTE SURFACE RENDERING:
- Absolutely no specular highlight — the surface scatters light uniformly in all directions (Lambertian).
- Ambient occlusion darkens recessed areas, inside corners, and tight joints.
- The product's color is fully and accurately represented — no glossy overlay shifting the hue.
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

// ─── Wearable detection ────────────────────────────────────────────────────────
// Returns true if the product is meant to be worn on the body.
// Used to override the "place on surface" defaults in lifestyle/social_proof shots.

const WEARABLE_PATTERN = /\b(watch|ring|bracelet|necklace|earring|pendant|bangle|anklet|brooch|cuff|chain|choker|locket|jewelry|jewellery|shoe|sneaker|boot|sandal|heel|loafer|trainer|bag|handbag|backpack|purse|clutch|tote|crossbody|satchel|wallet|hat|cap|beanie|beret|headband|scarf|glove|mitten|belt|sunglasses|glasses|eyewear|clothing|shirt|dress|jacket|coat|jeans|trousers|pants|skirt|suit|blazer|hoodie|sweater|cardigan|vest|leggings|shorts)\b/i

function isWearableProduct(productProfile?: ProductProfile): boolean {
  if (!productProfile) return false
  const combined = [
    productProfile.product_type ?? '',
    ...(productProfile.use_cases ?? []),
  ].join(' ').toLowerCase()
  return WEARABLE_PATTERN.test(combined)
}

// ─── Product context block ─────────────────────────────────────────────────────
// Tells the image model WHAT the product is and WHERE it belongs before it generates.
// Without this, Gemini treats every product identically and defaults to a generic surface shot.

function buildProductContextBlock(productProfile?: ProductProfile, angle?: string): string {
  if (!productProfile) return ''
  const lines: string[] = []

  if (productProfile.product_type) {
    lines.push(`Product type: ${productProfile.product_type}`)
  }
  if (productProfile.use_cases?.length) {
    lines.push(`Real-world use contexts: ${productProfile.use_cases.join(' · ')}`)
  }
  if (productProfile.target_customer) {
    lines.push(`Target user: ${productProfile.target_customer}`)
  }
  if (productProfile.style_aesthetic) {
    lines.push(`Visual aesthetic: ${productProfile.style_aesthetic}`)
  }

  if (!lines.length) return ''

  const wearable = isWearableProduct(productProfile)
  const isLifestyleAngle = angle === 'lifestyle' || angle === 'social_proof'

  // Wearable-specific instruction: for lifestyle/UGC shots, product should be WORN not placed
  const wearableInstruction = wearable && isLifestyleAngle
    ? `
⚠️ WEARABLE PRODUCT — CRITICAL RULE FOR THIS SCENE TYPE:
This product is designed to be WORN or CARRIED on the body, not placed on a surface.
In this scene, the product MUST be shown being worn or held by a person:
- A watch → on a wrist, sleeve partially visible
- A ring or bracelet → on a hand or wrist
- A necklace → worn on a neck, collarbone visible
- A bag or purse → carried on a shoulder, held by a handle, or resting against a hip
- Shoes → on feet, person seated or walking
- Clothing → worn by a person, at least partially visible
- Sunglasses → on a face or held in hand
Do NOT place this product on a table or surface for this shot type.
The person does not need to be fully in frame — a hand, wrist, shoulder, or partial silhouette is enough.`
    : wearable
      ? `Note: This is a wearable product. In lifestyle and UGC shots it should be worn — in studio/hero shots it may be placed on a surface.`
      : ''

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT THIS PRODUCT IS — READ THIS BEFORE GENERATING:
${lines.join('\n')}
${wearableInstruction}
This context defines where this product BELONGS in the real world.
The scene you generate MUST match this product's natural environment and usage.
Do NOT default to a generic "product on a white table" shot.
A coffee product belongs in a kitchen or café context.
A pet product belongs in a home with an animal present.
A skincare product belongs in a bathroom or vanity context.
Match the scene to the product's real life — not to a generic product photo template.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
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
  const angleTechSpecs = ANGLE_TECHNICAL_SPECS[scene.angle] ?? ''
  const audienceColor = buildAudienceColorMood(userConfig)
  const verticalWarning = ['instagram_story', 'tiktok'].includes(platform)
    ? '\nFORMAT: ONE SINGLE CONTINUOUS PHOTOGRAPH. NOT a collage. NOT split panels. NOT a grid.\n'
    : ''

  // Material-specific rendering rules derived from surface_finish in product analysis
  const materialRules = buildMaterialRenderingRules(productProfile?.surface_finish)

  // For wearable products in lifestyle/social_proof shots, "full product visible" is wrong —
  // a watch on a wrist doesn't need 40% frame coverage; it needs to be clearly worn.
  const wearable = isWearableProduct(productProfile)
  const isLifestyleAngle = scene.angle === 'lifestyle' || scene.angle === 'social_proof'
  const productVisibilityRule = wearable && isLifestyleAngle
    ? '4. PRODUCT CLEARLY VISIBLE: The product must be clearly identifiable and its key features visible. It does not need to fill 40% of the frame — it should be shown as it would naturally appear when worn or carried.'
    : '4. FULL PRODUCT VISIBLE: Do not crop any part of the product. Full product in frame. Minimum 40% frame coverage.'

  // Dominant color palette hint — ensures the generated environment harmonizes with the product
  const colorHint = productProfile?.dominant_colors?.length
    ? `\nPRODUCT COLOR PALETTE: ${productProfile.dominant_colors.join(' · ')}\nThe scene's props, surfaces, and lighting MUST harmonize with — not clash with — these product colors.\n`
    : ''

  // Shooting mood from product analysis — the lighting style that suits this product
  const shootingMoodHint = productProfile?.shooting_mood
    ? `\nPRODUCT SHOOTING MOOD (from product analysis): "${productProfile.shooting_mood}"\nUse this as a secondary lighting reference when the scene description allows latitude.\n`
    : ''

  // Product context block — tells Gemini what the product is and where it lives
  const productContextBlock = buildProductContextBlock(productProfile, scene.angle)

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
⚡ MERCHANT'S PRODUCT DESCRIPTION — AUTHORITATIVE:
"${productHint}"
Trust this over visual inference. If the merchant says "handmade wool macramé", the scene must reflect handmade craftsmanship — not generic home décor.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    : ''

  return `
You are a world-class commercial product photographer and CGI compositor.
Task: create a single photorealistic product image for ${platform}'s platform.
Output: ONE single continuous photograph. No collage, no grid, no split panels. No text. No explanation.
${verticalWarning}
${productContextBlock}
${productHintBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMARY DIRECTIVE — THIS IS THE SCENE YOU MUST CREATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${scene.image_prompt}

Every visual decision in this image — the environment, the props, the light direction, the surfaces, the human/animal presence — comes from the scene description above.
Do NOT substitute a generic product-on-table shot. Do NOT ignore the specific environment described.
If the scene says "a dog park at golden hour with a Labrador beside the product", generate exactly that.
If the scene says "a marble bathroom vanity with a woman's hand applying the product", generate exactly that.
The scene description is the primary visual brief. Follow it precisely.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${colorHint}
${shootingMoodHint}
${safetyRules ? `
CULTURAL & COMPLIANCE RULES:
${safetyRules}
` : ''}

PRODUCT FIDELITY — MANDATORY:
The provided reference image shows the exact product to place in the scene. Reproduce it faithfully:
1. GRAVITY: The product has physical weight. It sits firmly on the surface. It is NOT floating or hovering.
2. CONTACT SHADOW: Render a realistic shadow exactly where the product meets the surface — matching the scene's light direction.
3. LIGHT WRAP: The scene's ambient light wraps the product surfaces. Warm room = warm product highlights. Cool studio = neutral product tones.
${productVisibilityRule}
5. EXACT FIDELITY: Reproduce the product's exact shape, color, material finish, and proportions. Do not invent features, change colors, or alter the form.
6. WATERMARK REMOVAL: The reference image may contain a "Photoroom" text watermark — DO NOT reproduce this text anywhere in the output.
${materialRules}

TECHNICAL PHOTOGRAPHY:
${qualityDirective}
${angleTechSpecs}
${audienceColor}
Aspect ratio: ${aspectRatio}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE PROHIBITIONS:
✗ ANY text, letters, words, numbers, or typographic characters anywhere in the image
✗ The "Photoroom" watermark text or any diagonal text pattern
✗ A generic "product on a clean table" shot when the scene specifies a real environment
✗ Ignoring the scene's specific environment and replacing it with a studio backdrop
✗ A floating or hovering product (product must touch a surface with a contact shadow)
✗ A cropped product (full product must be visible)
✗ Collage, split-screen, multi-panel, or grid layout
✗ Multiple copies of the product
✗ Over-smoothed plastic-looking surfaces — render actual material texture
${marketProhibitions ? marketProhibitions : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim()
}
