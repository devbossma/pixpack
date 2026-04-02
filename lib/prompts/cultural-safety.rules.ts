/**
 * lib/prompts/cultural-safety.rules.ts
 *
 * Creative Governance Layer — cultural, legal, and category-aware guardrails
 * for ALL AI-generated content: scene descriptions AND image generation.
 *
 * Used by:
 *   buildCreativeDirectorPrompt()  — prevents prohibited scenes from being written
 *   buildImageGenerationPrompt()   — prevents prohibited visuals from being rendered
 *
 * The rules appear in BOTH prompts because:
 *   - If a prohibited scene is written in Stage 1, Stage 3 will render it.
 *   - Blocking at the scene-writing level is the primary defense.
 *   - Blocking at the image-render level is the safety net.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

type MarketKey =
    | 'saudi_arabia' | 'uae' | 'qatar' | 'kuwait' | 'bahrain' | 'oman'
    | 'egypt' | 'jordan' | 'algeria' | 'tunisia' | 'morocco'
    | 'us' | 'uk' | 'us_uk' | 'canada' | 'australia'
    | 'france' | 'germany' | 'italy' | 'spain' | 'netherlands'
    | 'japan' | 'south_korea' | 'china'
    | 'india' | 'indonesia' | 'malaysia' | 'pakistan'
    | 'brazil' | 'mexico'
    | 'default'

type CategoryKey = 'cosmetics' | 'beauty' | 'fashion' | 'food' | 'tech' | 'default'
type PlatformKey = 'instagram_post' | 'instagram_story' | 'tiktok' | 'facebook_post' | 'shopify_product' | 'etsy_product' | 'default'

// ─── Global base rules (always applied) ───────────────────────────────────────

const GLOBAL_BASE_RULES = `
UNIVERSAL CONTENT RULES — NON-NEGOTIABLE:
- NO sexualized minors or subjects of ambiguous age. All human subjects must clearly be adults.
- NO hate symbols, extremist imagery, or political propaganda of any kind.
- NO offensive stereotypes based on race, religion, gender, or nationality.
- NO misleading product representation — product must resemble realistic real-world use.
- NO excessive AI artifacts: extra fingers, fused limbs, distorted anatomy, impossible physics.
- Maintain brand-safe, advertiser-compliant visual standards throughout.
`

// ─── Market-specific rules ─────────────────────────────────────────────────────

const MARKET_RULES: Record<string, string> = {

    // ── Gulf / MENA strict ────────────────────────────────────────────────────────
    gulf_strict: `
STRICT CULTURAL COMPLIANCE — GULF MARKET:
ABSOLUTELY FORBIDDEN in scenes and generated images:
  ✗ Alcohol of any kind: wine bottles, beer cans, spirits, bar counters, cocktail glasses, wine racks
  ✗ Any setting that resembles or implies a bar, pub, nightclub, or alcohol-serving venue
  ✗ Revealing or immodest clothing on any person
  ✗ Physical contact between unrelated men and women
  ✗ Non-Islamic religious symbols displayed prominently
  ✗ Gambling imagery, casino settings, playing cards in gambling context
  ✗ Pork products or images associated with pork
  ✗ Western nightlife culture (clubs, raves, party scenes)

REQUIRED aesthetic direction:
  ✓ Warm luxury: gold accents, marble, deep jewel tones, ornate geometric patterns
  ✓ Heritage and modernity coexisting: traditional craftsmanship with contemporary elegance
  ✓ Aspirational settings: private estates, premium hotels, high-end retail interiors
  ✓ Natural light or controlled warm artificial light — no neon or nightclub lighting
`,

    // ── Morocco (MENA moderate) ───────────────────────────────────────────────────
    morocco: `
CULTURAL CONTEXT — MOROCCO:
FORBIDDEN:
  ✗ Alcohol-centered scenes (no bar counters, wine racks, or prominent alcohol)
  ✗ Nightclub or Western party culture imagery
  ✗ Overly sexualized content or very revealing clothing

PREFERRED aesthetic:
  ✓ Blend of traditional Moroccan design (zellige tile, carved plaster, arched doorways) with modern urban lifestyle
  ✓ Authentic urban settings — Casablanca modern apartment, Marrakech riad courtyard
  ✓ Warm afternoon light, terracotta and ochre tones, artisanal textures
  ✓ Aspirational but culturally grounded — premium without Western excess
`,

    // ── Western markets ───────────────────────────────────────────────────────────
    western: `
CULTURAL CONTEXT — WESTERN MARKET:
  ✓ Emphasize individuality, authenticity, and self-expression
  ✓ Include natural diverse representation — not token or performative
  ✓ Avoid outdated gender stereotypes
  ✓ Lifestyle storytelling preferred over static product shots
  ✗ Avoid exaggerated or hyper-commercial aesthetic unless brand-appropriate
`,

    // ── France ───────────────────────────────────────────────────────────────────
    france: `
CULTURAL CONTEXT — FRANCE:
  ✓ Elegant, minimal, editorial art direction
  ✓ Subtle sensuality allowed — sophisticated, never crude
  ✓ Parisian lifestyle cues: stone walls, café marble, natural light through tall windows
  ✓ Luxury and craftsmanship — artisanal quality signals
  ✗ Avoid flashy, over-branded, or aggressively commercial visuals
`,

    // ── Japan / Korea ─────────────────────────────────────────────────────────────
    east_asia: `
CULTURAL CONTEXT — EAST ASIA:
  ✓ Minimalism, visual harmony, precise negative space
  ✓ Clean geometric compositions — order is aesthetic
  ✓ Subtle, refined expressions — no exaggerated poses
  ✓ Quality materials and craftsmanship signals
  ✗ Avoid chaotic or cluttered compositions
  ✗ Avoid misuse of East Asian cultural symbols as decoration
`,

    // ── India ─────────────────────────────────────────────────────────────────────
    india: `
CULTURAL CONTEXT — INDIA:
  ✓ Rich colors and tactile textures — vibrant without being garish
  ✓ Family-oriented and aspirational tone
  ✓ Celebrate diverse skin tones naturally
  ✗ Avoid misappropriation or trivializing of religious symbols (lotus, Om, etc.)
  ✗ Avoid content that could appear to demean any caste or community
`,

    // ── Southeast Asia (Muslim-majority) ─────────────────────────────────────────
    sea_muslim: `
CULTURAL CONTEXT — SOUTHEAST ASIA (MUSLIM-MAJORITY):
  ✗ Avoid prominent alcohol imagery
  ✗ Avoid revealing clothing as primary focus
  ✓ Family-friendly, aspirational lifestyle
  ✓ Modern urban environments with inclusive representation
`,

    // ── Germany / Northern Europe ─────────────────────────────────────────────────
    germany: `
CULTURAL CONTEXT — GERMANY / NORTHERN EUROPE:
  ✓ Functional clarity — quality and engineering over glamour
  ✓ Realism over idealization — authentic materials, honest lighting
  ✓ Clean structured compositions — Bauhaus sensibility
  ✗ Avoid exaggerated luxury staging or excessive ornamentation
`,

    // ── Brazil / LatAm ────────────────────────────────────────────────────────────
    latam: `
CULTURAL CONTEXT — LATIN AMERICA:
  ✓ Warm, vibrant, energetic color palette
  ✓ Celebratory, community-oriented lifestyle cues
  ✓ Urban authenticity — real environments, not sterile studios
  ✓ Inclusive of diverse ethnicities naturally
`,

    default: `
GLOBAL PROFESSIONALISM:
  ✓ Clean, neutral, editorial-quality visuals safe for all audiences
  ✓ Avoid culturally specific symbols unless the target market is known
`,
}

// ─── Category-specific rules ───────────────────────────────────────────────────

const CATEGORY_RULES: Record<string, string> = {
    cosmetics_beauty: `
COSMETICS / BEAUTY RULES:
  ✓ Natural skin texture — avoid over-smoothed plastic skin
  ✓ Realistic lighting that shows product color accurately
  ✓ Subtle application — no exaggerated transformations
  ✗ Avoid extreme retouching that implies impossible results
  ✗ Avoid "before/after" comparisons (violates Meta/TikTok ad policies)
`,
    fashion: `
FASHION RULES:
  ✓ Accurate garment fit and fabric drape — fabric should behave realistically
  ✓ Culturally appropriate styling for the target market
  ✗ Avoid unrealistic body proportions or extreme thinness
  ✗ Avoid cultural appropriation of traditional dress without context
`,
    food: `
FOOD RULES:
  ✓ Product must look genuinely edible and appetizing
  ✓ Respect market dietary restrictions (halal, vegetarian) where relevant
  ✗ Avoid artificial textures or physically impossible presentation
  ✗ Avoid depicting foods forbidden in the target market
`,
    tech: `
TECH RULES:
  ✓ Clean, precise, minimal aesthetic — product as engineering achievement
  ✓ Highlight usability — show the product in realistic use context
  ✗ Avoid sci-fi exaggeration unless brand-intentional
  ✗ Avoid cluttered desk setups that distract from the product
`,
    default: `
PRODUCT RULES:
  ✓ Maintain product realism — the output should help a merchant sell this item
  ✓ Scene supports the product — the product is always the hero
`,
}

// ─── Platform compliance rules ────────────────────────────────────────────────

const PLATFORM_COMPLIANCE: Record<string, string> = {
    meta: `
META ADS COMPLIANCE:
  ✗ NO before/after body comparisons
  ✗ NO unrealistic claims implied by the image (e.g., "instant results" body transformations)
  ✗ NO targeting-sensitive visual traits (weight, skin conditions, financial distress)
`,
    tiktok: `
TIKTOK ADS COMPLIANCE:
  ✗ Avoid misleading or exaggerated visual transformations
  ✓ Keep visuals authentic and creator-native — not overly polished "ad" look
`,
    shopify_product: `
SHOPIFY / E-COMMERCE COMPLIANCE:
  ✓ Product clearly visible, realistic, undistorted
  ✓ Clean neutral backgrounds preferred for product pages
  ✗ NO misleading enhancements or impossible scale
`,
    default: `
GENERAL AD SAFETY:
  ✓ Truthful and non-misleading visual representation
`,
}

// ─── Market key resolver ───────────────────────────────────────────────────────
// Maps userConfig.country to the correct market rules group

function resolveMarketGroup(country?: string): string {
    if (!country) return MARKET_RULES.default

    const c = country.toLowerCase().trim()

    // Gulf (strict)
    if (['saudi arabia', 'uae', 'united arab emirates', 'qatar', 'kuwait', 'bahrain', 'oman'].includes(c))
        return MARKET_RULES.gulf_strict

    // Other MENA Arabic
    if (['egypt', 'jordan', 'iraq', 'syria', 'libya', 'algeria', 'tunisia'].includes(c))
        return MARKET_RULES.gulf_strict  // Apply same strict rules for safety

    // Morocco
    if (c === 'morocco')
        return MARKET_RULES.morocco

    // France
    if (c === 'france')
        return MARKET_RULES.france

    // Germany / Northern Europe
    if (['germany', 'austria', 'sweden', 'denmark', 'norway', 'finland', 'netherlands'].includes(c))
        return MARKET_RULES.germany

    // Japan / Korea
    if (['japan', 'south korea'].includes(c))
        return MARKET_RULES.east_asia

    // India
    if (c === 'india')
        return MARKET_RULES.india

    // Muslim-majority Southeast Asia
    if (['indonesia', 'malaysia', 'pakistan', 'bangladesh'].includes(c))
        return MARKET_RULES.sea_muslim

    // Latin America
    if (['brazil', 'mexico', 'colombia', 'argentina', 'chile', 'peru'].includes(c))
        return MARKET_RULES.latam

    // Western English-speaking + Western Europe
    if (['united states', 'us', 'united kingdom', 'uk', 'canada', 'australia',
        'new zealand', 'ireland', 'spain', 'italy', 'portugal', 'belgium'].includes(c))
        return MARKET_RULES.western

    return MARKET_RULES.default
}

// ─── Category key resolver ────────────────────────────────────────────────────

function resolveCategoryRules(interest?: string): string {
    if (!interest) return CATEGORY_RULES.default
    const i = interest.toLowerCase()
    if (['cosmetics', 'beauty'].includes(i)) return CATEGORY_RULES.cosmetics_beauty
    if (i === 'fashion') return CATEGORY_RULES.fashion
    if (i === 'food') return CATEGORY_RULES.food
    if (i === 'tech') return CATEGORY_RULES.tech
    return CATEGORY_RULES.default
}

// ─── Platform compliance resolver ────────────────────────────────────────────

function resolvePlatformCompliance(platform?: string): string {
    if (!platform) return PLATFORM_COMPLIANCE.default
    if (['instagram_post', 'instagram_story', 'facebook_post'].includes(platform))
        return PLATFORM_COMPLIANCE.meta
    if (platform === 'tiktok')
        return PLATFORM_COMPLIANCE.tiktok
    if (platform === 'shopify_product')
        return PLATFORM_COMPLIANCE.shopify_product
    return PLATFORM_COMPLIANCE.default
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface SafetyRuleParams {
    country?: string
    interest?: string
    platform?: string
}

/**
 * Returns the complete safety ruleset for this user's context.
 * Inject this into both buildCreativeDirectorPrompt and buildImageGenerationPrompt.
 */
export function getSafetyRules(params?: SafetyRuleParams): string {
    return [
        GLOBAL_BASE_RULES,
        resolveMarketGroup(params?.country),
        resolveCategoryRules(params?.interest),
        resolvePlatformCompliance(params?.platform),
    ]
        .filter(Boolean)
        .join('\n')
        .trim()
}

/**
 * Returns ONLY the market prohibition list as a compact string.
 * Used in the PROHIBITIONS section of buildImageGenerationPrompt
 * where we want a tight list not a full rules block.
 */
export function getMarketProhibitions(country?: string): string {
    if (!country) return ''

    const c = country.toLowerCase().trim()

    const isGulfStrict = ['saudi arabia', 'uae', 'united arab emirates', 'qatar',
        'kuwait', 'bahrain', 'oman', 'egypt', 'jordan', 'iraq',
        'syria', 'libya', 'algeria', 'tunisia'].includes(c)

    const isMorocco = c === 'morocco'

    const isSeaMuslim = ['indonesia', 'malaysia', 'pakistan', 'bangladesh'].includes(c)

    if (isGulfStrict) {
        return `
✗ ANY alcohol: wine bottles, beer, spirits, cocktail glasses, bar counters, wine racks
✗ Any setting that looks like a bar, pub, nightclub, or alcohol-serving establishment
✗ Revealing or immodest clothing
✗ Western nightlife or party culture imagery
✗ Gambling or casino imagery`
    }

    if (isMorocco || isSeaMuslim) {
        return `
✗ Bar counters, wine bottles, or prominent alcohol imagery
✗ Nightclub or Western party culture settings`
    }

    return ''
}