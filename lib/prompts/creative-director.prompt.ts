/**
 * lib/prompts/creative-director.prompt.ts
 *
 * REWRITTEN — v5
 *
 * KEY CHANGES FROM v4:
 *
 *   FIX 1 — CREATIVE ENTROPY:
 *     Every call now receives a unique set of randomized creative seeds
 *     (time of day, palette family, texture pool, shooting angle, set dressing pool).
 *     The same product input CANNOT produce the same scene twice because the seeds
 *     shift the creative constraints on every generation.
 *
 *   FIX 2 — PRODUCT-CATEGORY INTELLIGENCE:
 *     We derive a product context (WHO uses it, WHERE, HOW) from productProfile.product_type
 *     and productProfile.use_cases. This context gates the scene environments:
 *       - Pet product → scenes with happy animal present, outdoor/home pet spaces
 *       - Skincare/beauty → human applying or using, vanity/bath, satisfaction visible
 *       - Sports/fitness → gym or outdoor, active use context, energy
 *       - Food/beverage → kitchen or dining context, appetite appeal
 *       - Tech → workspace or carry context
 *       - Default → lifestyle interior appropriate to target audience
 *
 *   FIX 3 — MANDATORY VARIATION UNIQUENESS:
 *     The prompt now explicitly enforces that each variation uses a DIFFERENT:
 *     time of day, color temperature, surface material, and environment type.
 *     Repetition is called out as a failure mode to avoid.
 */

import type { ProductProfile, UserConfig } from '../types'
import { getSafetyRules } from './cultural-safety.rules'

// ─── Audience visual context ───────────────────────────────────────────────────

const AGE_VISUAL_CONTEXT: Record<string, string> = {
  '18-24': 'Urban energy: street markets, colorful minimal bedrooms, vibrant co-working spaces. Textures: concrete, neon acrylic, brushed aluminum.',
  '25-34': 'Aspirational living: modern apartments with trailing plants, boutique coffee bars, rooftop brunch spots. Textures: white marble, linen, light oak, matte ceramic.',
  '35-44': 'Accomplished & active: high-end home office, stone kitchen island, weekend garden retreat. Textures: walnut, stone, glass, brushed bronze.',
  '45-60': 'Refined comfort: sunset terrace, well-appointed reading room, luxury travel lounge. Textures: fine wool, velvet, aged oak, wrought iron.',
}

const GENDER_VISUAL_CONTEXT: Record<string, string> = {
  women: 'Warm tones, morning light, vanity adjacency, floral accents. Gold and rose-gold hardware. Silk, marble, soft ceramics.',
  men: 'Clean lines, workshop bench, gym floor, rugged terrain. Matte black and chrome. Carbon fiber, brushed steel, raw concrete.',
  mixed: 'Contemporary neutral: open bright spaces, shared café environments, outdoor public lifestyle. Concrete, light oak, glass.',
}

const PLATFORM_FRAMING: Record<string, string> = {
  instagram_post: 'Square 1:1. Clean rule of thirds. Premium social aesthetic.',
  instagram_story: 'Vertical 9:16. Upper-half product focus. Candid energy.',
  tiktok: 'Vertical 9:16. Dynamic creator-native angle. Motion-suggested background.',
  facebook_post: '4:3. Approachable, trust-building, relatable lifestyle composition.',
  shopify_product: '1:1. Commercial, zero clutter, single-surface studio.',
  web_banner: '16:9. Product far left or right. Large negative space for copy overlay.',
}

// ─── Creative entropy pools ─────────────────────────────────────────────────────
// These are picked randomly on each call so identical product inputs generate
// different scene seeds. The model is FORCED to work within these constraints,
// preventing the "same white marble table" problem.

const TIME_OF_DAY_POOL = [
  'golden hour (6–7am warm low-angle sunlight)',
  'midmorning (9–10am soft diffused daylight)',
  'noon (harsh overhead light, strong defined shadows)',
  'blue hour (just before sunset, cool-warm mix)',
  'late afternoon (warm side-raking sunlight)',
  'overcast day (flat even soft light, no shadows)',
]

const PALETTE_FAMILY_POOL = [
  'warm earth tones: terracotta, raw sienna, warm cream, tobacco',
  'cool Nordic palette: dove grey, arctic white, pale ice blue, aged pine',
  'moody dark palette: deep forest green, charcoal, rust amber, warm black',
  'warm monochrome: cream, off-white, sand, warm stone, pale linen',
  'high-contrast editorial: deep black, crisp white, single accent color',
  'natural botanics: sage green, warm beige, aged terracotta, dried flowers',
]

const SURFACE_TEXTURE_POOL: string[] = [
  'honed black granite with visible grain',
  'raw pine wood plank with open knots',
  'polished cream travertine stone',
  'aged reclaimed teak deck board',
  'matte dark slate tile',
  'washed linen fabric draped flat',
  'burnished copper sheet',
  'hand-thrown ceramic glaze surface (matte)',
  'brushed concrete screed',
  'bleached white oak parquet',
  'warm terracotta paver tile',
  'dark espresso leather surface',
]

const BACKGROUND_COLOR_POOL: string[] = [
  'deep forest green matte paper sweep',
  'warm putty-beige seamless backdrop',
  'charcoal-to-black gradient',
  'dusty rose paper sweep',
  'slate grey seamless',
  'rich navy matte',
  'warm ivory paper roll',
  'burnt umber fade',
  'cool dove grey studio wall',
  'deep burgundy matte backdrop',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

// ─── Product-category intelligence ─────────────────────────────────────────────
// Reads the product's type + use_cases and returns scene constraints that match
// the product's actual real-world context. This prevents:
//   - A dog toy being placed on a marble kitchen island with no dog
//   - A face cream being shot in a gym
//   - A food product with no appetite context

interface ProductContext {
  category: string
  usageContext: string        // WHO uses it, WHERE, HOW
  humanPresence: string       // required human/animal presence instruction per variation
  forbiddenEnvironments: string  // scenes that don't match this product
  lifestyle_setting: string   // appropriate spaces for lifestyle shot
  context_setting: string     // appropriate spaces for aspirational context shot
  social_proof_surface: string // appropriate surface for UGC shot
}

function deriveProductContext(productProfile: ProductProfile): ProductContext {
  const type = (productProfile.product_type ?? '').toLowerCase()
  const useCases = (productProfile.use_cases ?? []).join(' ').toLowerCase()
  const combined = `${type} ${useCases}`

  // Pet products
  if (/\b(pet|dog|cat|animal|collar|leash|toy.*pet|pet.*toy|treats?|paw|fur|kennel|aquarium|fish|bird)\b/.test(combined)) {
    return {
      category: 'pet',
      usageContext: 'A pet owner using this for their animal companion (dog, cat, or other pet). The animal may be present in lifestyle/social_proof shots.',
      humanPresence: 'For LIFESTYLE and SOCIAL PROOF variations: include the animal (dog or cat, breed-appropriate to the product) in the scene — relaxed, happy, using or near the product. A human hand or feet may be visible.',
      forbiddenEnvironments: 'luxury hotel lobbies, marble office desks, fashion editorial settings, gym equipment areas',
      lifestyle_setting: 'living room rug at eye level, backyard grass, dog park, kitchen floor near the pet bowl area',
      context_setting: 'a cozy corner of a home with a dog bed, toys scattered, a worn hardwood floor or low-pile rug',
      social_proof_surface: 'living room floor, a front porch deck board, a garden path stone',
    }
  }

  // Beauty / skincare / personal care
  if (/\b(serum|moisturizer|cleanser|toner|sunscreen|lipstick|mascara|eye.?shadow|foundation|blush|perfume|cologne|shampoo|conditioner|body.?wash|soap|skincare|haircare|nail|beauty|cosmetic|makeup|lotion|cream|balm|mist|spray|deodorant)\b/.test(combined)) {
    return {
      category: 'beauty',
      usageContext: 'A person using this in their daily beauty or self-care routine. Use is intimate and personal.',
      humanPresence: 'For LIFESTYLE and SOCIAL PROOF variations: include a hand applying or holding the product, or visible results on skin. Show satisfaction and care.',
      forbiddenEnvironments: 'outdoor action scenes, sports fields, garages, pet environments',
      lifestyle_setting: 'bathroom vanity with warm backlighting, a marble sink basin edge, a vanity table with mirror reflection',
      context_setting: 'a clean bathroom shelf with curated skincare lineup, a spa-like counter with white towels and candles',
      social_proof_surface: 'bathroom shelf, vanity table top, bedside table in morning light',
    }
  }

  // Sports / fitness / outdoor performance
  if (/\b(gym|fitness|workout|running|yoga|sports|athletic|cycling|hiking|climbing|training|resistance|weights|protein|supplement|performance|sneaker|shoe.*sport|sport.*shoe)\b/.test(combined)) {
    return {
      category: 'sports',
      usageContext: 'An active person using this during or around physical activity.',
      humanPresence: 'For LIFESTYLE and SOCIAL PROOF variations: include an athlete or active person (implied or partially visible) using the product in an active context.',
      forbiddenEnvironments: 'luxury interiors, vanity counters, pet zones, food prep areas',
      lifestyle_setting: 'gym floor with rubberized tiles, outdoor running path at golden hour, yoga studio hardwood floor',
      context_setting: 'a minimalist gym locker alcove, an outdoor park at dawn, a clean athletic studio with white walls',
      social_proof_surface: 'gym bag open on a bench, training mat surface, outdoor concrete step',
    }
  }

  // Food / beverage / kitchen
  if (/\b(coffee|tea|beverage|drink|food|snack|supplement|protein.?bar|chocolate|olive.?oil|sauce|seasoning|spice|kitchen|cookware|mug|cup|flask|bottle.*drink|drink.*bottle)\b/.test(combined)) {
    return {
      category: 'food',
      usageContext: 'A person enjoying this food or beverage in a domestic or café context.',
      humanPresence: 'For LIFESTYLE and SOCIAL PROOF variations: include hands preparing, holding, or about to consume the product. Show appetite and anticipation.',
      forbiddenEnvironments: 'gyms, pet environments, office tech setups, fashion-only spaces',
      lifestyle_setting: 'kitchen marble counter at morning light, café wooden table, living room coffee table',
      context_setting: 'a styled kitchen shelf with ceramic props, a coffee corner with a French press and plant, a dining table morning setup',
      social_proof_surface: 'kitchen counter, café table, breakfast tray in bed linen',
    }
  }

  // Tech / electronics / gadgets
  if (/\b(phone|laptop|tablet|headphone|earphone|charger|cable|speaker|camera|gadget|tech|device|keyboard|mouse|monitor|screen|usb|wireless|bluetooth|smart.?watch|wearable|power.?bank)\b/.test(combined)) {
    return {
      category: 'tech',
      usageContext: 'A professional or creative using this in their work or daily digital life.',
      humanPresence: 'For LIFESTYLE and SOCIAL PROOF variations: include hands using or setting up the product, or a person working nearby. Show productivity or creativity.',
      forbiddenEnvironments: 'pet zones, food prep messy areas, outdoor sports fields, beauty vanities',
      lifestyle_setting: 'clean desk setup with monitor glow, café table with laptop and coffee, modern home office',
      context_setting: 'a minimal desk with cord management, a bookshelf studio background, a sleek workstation with ambient light strip',
      social_proof_surface: 'desk surface, laptop bag unzipped, bedside table',
    }
  }

  // Fashion / clothing / accessories / jewelry / bags
  if (/\b(bag|handbag|wallet|purse|watch|jewelry|necklace|ring|bracelet|earring|clothing|shirt|dress|jacket|coat|jeans|sneaker|boot|shoe|sunglasses|belt|scarf|hat|cap|accessory)\b/.test(combined)) {
    return {
      category: 'fashion',
      usageContext: 'A style-conscious person wearing or carrying this as part of their daily look.',
      humanPresence: 'For LIFESTYLE and SOCIAL PROOF variations: include the product being worn or carried — a hand holding a bag, a wrist with a watch, a styled outfit partially visible. Show real-life style context.',
      forbiddenEnvironments: 'gyms, kitchens, pet zones, clinical or medical settings',
      lifestyle_setting: 'city street with textured stone sidewalk, boutique dressing room, café terrace, apartment with morning light',
      context_setting: 'an editorial flat-surface with complementary props (sunglasses, keys, a book), a fashion-forward apartment interior',
      social_proof_surface: 'wooden entry table, a rumpled bed linen, café marble top, a bench seat',
    }
  }

  // Home / décor / furniture / candles / plants
  if (/\b(candle|vase|cushion|pillow|blanket|throw|lamp|light|plant|pot|planter|frame|mirror|clock|shelf|decor|home|furniture|rug|curtain|towel)\b/.test(combined)) {
    return {
      category: 'home',
      usageContext: 'A homeowner styling their living space with this decorative or functional piece.',
      humanPresence: 'For LIFESTYLE variations: imply a person through personal items nearby (a book, a coffee, reading glasses). No person required in context or hero shots.',
      forbiddenEnvironments: 'gyms, sports fields, outdoor wilderness, pet-only zones',
      lifestyle_setting: 'living room shelf or coffee table, bedroom side table, entrance hallway console',
      context_setting: 'a thoughtfully arranged living space grouping — books, plants, textured throws, warm lamplight',
      social_proof_surface: 'living room table, hallway shelf, bedroom surface',
    }
  }

  // Kids / baby / toys / parenting
  if (/\b(toy|baby|infant|toddler|kids?|child|children|nursery|stroller|feeding|diaper|sippy|rattle|puzzle|educational|playmat)\b/.test(combined)) {
    return {
      category: 'kids',
      usageContext: 'A child or baby using or playing with this product, with a parent nearby.',
      humanPresence: 'For LIFESTYLE and SOCIAL PROOF variations: include a child\'s hands interacting with the product, or parent and child together. Show joy and safety.',
      forbiddenEnvironments: 'luxury editorial settings, bars, nightlife, sports performance zones',
      lifestyle_setting: 'bright playroom floor, backyard lawn, living room rug in natural light',
      context_setting: 'a colorful organized playroom corner, a nursery shelf, a bright comfortable family living space',
      social_proof_surface: 'playroom floor mat, living room rug, wooden activity table',
    }
  }

  // Default fallback
  return {
    category: 'general',
    usageContext: 'A person using or displaying this product in an everyday lifestyle context.',
    humanPresence: 'For LIFESTYLE and SOCIAL PROOF variations: include a human element — hands, implied presence, or personal items that tell a story about the user.',
    forbiddenEnvironments: 'hospital settings, industrial environments, unrelated niche spaces',
    lifestyle_setting: 'a well-lit domestic interior appropriate to the product\'s style',
    context_setting: 'an aspirational lifestyle environment matching the product\'s aesthetic',
    social_proof_surface: 'a personal domestic surface: desk, shelf, table, or counter',
  }
}

// ─── Main prompt builder ───────────────────────────────────────────────────────

export function buildCreativeDirectorPrompt(
  productProfile: ProductProfile,
  userConfig: UserConfig,
): string {
  const platform = userConfig.platform ?? 'instagram_post'
  const ageVisual = userConfig.ageRange ? AGE_VISUAL_CONTEXT[userConfig.ageRange] ?? '' : ''
  const genderVisual = userConfig.gender ? GENDER_VISUAL_CONTEXT[userConfig.gender] ?? '' : ''
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

  // ── Randomized creative entropy (changes every call) ──────────────────────────
  // Pick 4 distinct times of day — one per variation so they're all different
  const [time1, time2, time3, time4] = pickN(TIME_OF_DAY_POOL, 4)
  // Pick 4 distinct palette families
  const [palette1, palette2, palette3, palette4] = pickN(PALETTE_FAMILY_POOL, 4)
  // Pick 4 distinct surface textures
  const [surface1, surface2, surface3, surface4] = pickN(SURFACE_TEXTURE_POOL, 4)
  // Pick 4 distinct background colors for hero/studio shots
  const heroBg = pick(BACKGROUND_COLOR_POOL)

  // ── Product-category context ──────────────────────────────────────────────────
  const productCtx = deriveProductContext(productProfile)

  return `
You are a Senior Creative Director at a world-class Digital Ad Agency.
Task: Write 4 COMPLETELY DISTINCT scene descriptions for A/B testing this product in paid ads.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT ANALYSIS:
${JSON.stringify(productProfile, null, 2)}

PRODUCT CONTEXT (derived from above):
Category: ${productCtx.category}
Who uses it, where, and how: ${productCtx.usageContext}
Human/animal presence requirement: ${productCtx.humanPresence}
Forbidden environments for this product: ${productCtx.forbiddenEnvironments}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AUDIENCE: ${audienceContext || 'Global social media users'}
AUDIENCE VISUAL CONTEXT:
${[ageVisual, genderVisual].filter(Boolean).join('\n')}

PLATFORM: ${platform}
FRAMING GUIDE: ${platformFrame}

${safetyRules ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CULTURAL & COMPLIANCE RULES — YOU MUST FOLLOW THESE:
${safetyRules}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATIVE SEEDS — MANDATORY CONSTRAINTS:
These seeds are UNIQUE to this generation. You MUST use them. They exist to ensure
that no two generations of the same product look the same.

Variation 1 (LIFESTYLE) seeds:
  - Time of day: ${time1}
  - Color palette: ${palette1}
  - Surface material: ${surface1}
  - Appropriate lifestyle setting: ${productCtx.lifestyle_setting}

Variation 2 (HERO/STUDIO) seeds:
  - Time of day: ${time2} (affects light on product)
  - Color palette: ${palette2}
  - Surface material: ${surface2}
  - Background color: ${heroBg}

Variation 3 (CONTEXT/ASPIRATIONAL) seeds:
  - Time of day: ${time3}
  - Color palette: ${palette3}
  - Surface material: ${surface3}
  - Appropriate aspirational setting: ${productCtx.context_setting}

Variation 4 (SOCIAL PROOF/UGC) seeds:
  - Time of day: ${time4}
  - Color palette: ${palette4}
  - Surface material: ${productCtx.social_proof_surface}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE DESCRIPTION RULES — NON-NEGOTIABLE:

1. THREE SPATIAL LAYERS: Every scene description MUST address all three layers:
   - SURFACE: The exact material the product sits ON (use the seed above — be precise)
   - MID-SCENE: Props, environment, human/animal elements
   - BACKGROUND: The specific color, material, or depth behind the product — MUST be explicit

2. PRODUCT PLACEMENT — GRAVITY IS MANDATORY:
   The product must have PHYSICAL WEIGHT. It PRESSES DOWN onto the surface.
   There must be a contact shadow where the base of the product meets the surface.
   A product that appears to float or hover is WRONG. Describe: "resting firmly on",
   "pressed against", "weighted on", never "placed on" (too vague).

3. PRODUCT-APPROPRIATE CONTEXT:
   The scene MUST match the product's actual real-world use context.
   If this is a pet product, the scene involves a pet. If it's a beauty product, a person uses it.
   If it's a food product, the scene evokes appetite and consumption.
   Do NOT place a ${productCtx.category} product in a ${productCtx.forbiddenEnvironments} context.

4. MANDATORY VARIATION UNIQUENESS:
   Each of the 4 variations MUST differ in ALL of these dimensions:
   - Time of day / light temperature (use each seed — they are all different)
   - Surface material (use each seed — all different)
   - Environment type (indoor vs outdoor, domestic vs aspirational vs studio)
   - Human/animal presence level (from none → implied → partial → active)
   Writing 4 variations with similar settings is a FAILURE. Prove creative range.

5. SPECIFICITY — no vague language:
   WRONG: "a wooden table", "a cozy room", "nice lighting", "warm atmosphere"
   RIGHT: "a bleached oak plank with visible grain lines", "a Haussmann-era apartment living room with floor-to-ceiling shuttered windows", "warm side-raking 7am sunlight with long surface shadows"

6. NO PRODUCT NAME: Never name the product, brand, or specific technical features. Describe only the environment and the physical object's silhouette.

7. OUTPUT LANGUAGE: Scene descriptions must be in English regardless of target market.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOUR VARIATION BRIEFS:

VARIATION 1 — LIFESTYLE (Story-in-Progress):
A candid real-life scene. The product is BEING USED or is mid-moment in someone's day.
Use seed: ${time1} light · ${palette1} palette · ${surface1} surface.
Setting: ${productCtx.lifestyle_setting}
Human/animal: ${productCtx.humanPresence}
Show: A specific moment frozen in time — not a styled product shot, but a scene from real life.

VARIATION 2 — HERO (Pure Studio):
The product is the only subject. No distractions, no clutter.
Use seed: ${time2} (light direction on product) · ${palette2} palette · ${surface2} surface · ${heroBg} background.
The product MUST be centered, full product visible, pressing firmly onto the surface.
Background MUST be the exact color specified: ${heroBg}.
Nothing else in the frame. One product. One surface. One background.

VARIATION 3 — CONTEXT (World-Building):
No person visible. The product lives in a rich aspirational scene that tells the buyer
"this is the life you get when you own this product."
Use seed: ${time3} light · ${palette3} palette · ${surface3} surface.
Setting: ${productCtx.context_setting}
Describe 3+ specific named environmental props that build the world.
The product is part of the scene, not dropped into it.

VARIATION 4 — SOCIAL PROOF (Authentic UGC):
Looks like a real customer's organic post — not a brand shoot.
Use seed: ${time4} light · ${palette4} palette · ${productCtx.social_proof_surface} surface.
A hand, packaging, or receipt should be naturally visible in frame.
The product is fully visible, sitting firmly on the surface in a real domestic environment.
This should feel like something you'd see in an Instagram Story from a happy buyer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON. No markdown. No code fences. Start directly with {

{
  "platform": "${platform}",
  "variations": [
    {
      "variation": 1,
      "angle": "lifestyle",
      "image_prompt": "<4 sentences: (1) exact surface material from seed · (2) human/animal element doing something specific · (3) 2-3 named props establishing the environment · (4) background wall/window/atmosphere with specific light direction and color temperature. No product name.>"
    },
    {
      "variation": 2,
      "angle": "hero",
      "image_prompt": "<3 sentences: (1) exact surface material from seed, product centered and pressing firmly onto it with a contact shadow · (2) single-source lighting direction and quality matching the time-of-day seed · (3) background is exactly ${heroBg} — seamless, no texture, no pattern. No product name.>"
    },
    {
      "variation": 3,
      "angle": "context",
      "image_prompt": "<4 sentences: (1) exact surface material · (2) at least 3 specifically named environmental props that build the aspirational world · (3) background wall/window with exact material and color · (4) light quality and direction. No person. No product name.>"
    },
    {
      "variation": 4,
      "angle": "social_proof",
      "image_prompt": "<4 sentences: (1) domestic surface from seed, product fully visible pressing onto it · (2) hand or packaging casually visible, implying real first-use moment · (3) personal items in frame that feel organic (phone, receipt, mug) · (4) background blurred domestic interior with specific light source. No product name.>"
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