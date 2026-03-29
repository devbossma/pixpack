/**
 * lib/prompts/cultural-safety.rules.ts
 *
 * Region-aware cultural + legal + category guardrails
 * aligned with RegionId system.
 */

import type { RegionId } from '@/lib/regions'

type CategoryKey =
    | 'cosmetics'
    | 'fashion'
    | 'food'
    | 'tech'
    | 'default';

type PlatformKey =
    | 'meta'
    | 'tiktok'
    | 'amazon'
    | 'default';

/**
 * 🌍 GLOBAL BASE RULES (always applied)
 */
const GLOBAL_BASE_RULES = `
CORE SAFETY RULES:
- NO sexualized minors or age ambiguity.
- NO hate symbols, extremism, or political propaganda.
- NO offensive stereotypes.
- NO misleading product representation.
- Avoid AI artifacts (extra limbs, distortions).
- Maintain brand-safe, advertiser-friendly visuals.
`;

/**
 * 🌐 REGION-ALIGNED CULTURAL RULES
 */
export const REGION_SAFETY_RULES: Record<RegionId | 'global', string> = {
    // MENA
    morocco: `
    
    - Respect modesty and cultural authenticity.
    - Avoid nightlife-heavy or overly westernized scenes.
    - Use traditional-modern blend (riads, zellige, urban lifestyle).
    - NO alcohol, wine, beer, or bar settings.
    - NO revealing or immodest clothing (ensure subjects are conservatively dressed).
    - NO religious symbols other than Islamic-appropriate architectural motifs.
    - NO gambling or casino imagery.
    - Maintain an aesthetic of sophistication, heritage, and luxury.
    - Focus on high-end perfume bottle presentation and rich, warm lighting.
`,

    gulf_uae: `

- NO alcohol, wine, beer, or bar settings.
- NO revealing or immodest clothing (ensure subjects are conservatively dressed).
- NO religious symbols other than Islamic-appropriate architectural motifs.
- NO gambling or casino imagery.
- Maintain an aesthetic of sophistication, heritage, and luxury.
- Focus on high-end perfume bottle presentation and rich, warm lighting.
`,

    saudi: `

    - NO alcohol, wine, beer, or bar settings.
    - NO revealing or immodest clothing (ensure subjects are conservatively dressed).
    - NO public displays of affection.
    - NO kissing or romantic intimacy.
    - NO sexualized content.
    - NO nudity or partial nudity.
    - NO religious symbols other than Islamic-appropriate architectural motifs.
    - NO gambling or casino imagery.
    - Maintain an aesthetic of sophistication, heritage, and luxury.
    - Focus on high-end perfume bottle presentation and rich, warm lighting.
`,

    egypt: `

    - NO alcohol, wine, beer, or bar settings.
    - NO revealing or immodest clothing (ensure subjects are conservatively dressed).
    - NO public displays of affection.
    - NO religious symbols other than Islamic-appropriate architectural motifs.
    - NO gambling or casino imagery.
    - Maintain an aesthetic of sophistication, heritage, and luxury.
    - Focus on high-end perfume bottle presentation and rich, warm lighting.
`,

    // Europe
    france: `
    
    - Focus on elegance, minimalism, editorial style.
    - Subtle sensuality allowed (not explicit).
    - Avoid flashy or overly commercial visuals.
`,

    uk: `
    
    - Authentic, slightly imperfect realism works well.
    - Avoid exaggerated or overly polished ads.
    - Subtle humor and understatement preferred.
`,

    germany: `
    
    - Focus on realism, quality, and clarity.
    - Avoid hype or exaggerated visuals.
    - Clean, structured compositions.
`,

    spain: `
    
    - Vibrant, social, expressive visuals.
    - Avoid dull or overly minimal compositions.
    - Warm, lively environments.
`,

    italy: `
    
    - Emphasize elegance, craftsmanship, and lifestyle.
    - Avoid cheap or mass-market feeling visuals.
    - Strong sense of aesthetic beauty.
`,

    // North America
    usa_urban: `
    
    - Bold, diverse, high-energy visuals.
    - Avoid stereotypes; prioritize inclusivity.
    - Lifestyle storytelling over static shots.
`,

    usa_suburban: `
    
    - Family-oriented, safe, relatable visuals.
    - Avoid overly edgy or urban aesthetics.
    - Focus on comfort and everyday lifestyle.
`,

    canada: `
    
    - Friendly, inclusive, outdoor-oriented.
    - Avoid aggressive or overly flashy visuals.
    - Natural and clean aesthetics.
`,

    // LATAM
    brazil: `
    
    - Vibrant, colorful, energetic.
    - Avoid dull or muted aesthetics.
    - Community and lifestyle-driven visuals.
`,

    mexico: `
    
    - Strong cultural identity and color.
    - Avoid generic “latin” stereotypes.
    - Authentic urban + heritage mix.
`,

    colombia: `
    
    - Energetic, joyful, modern.
    - Avoid negative or outdated imagery.
    - Urban + nature blend.
`,

    argentina: `
    
    - Stylish, urban, European-influenced.
    - Avoid overly loud or chaotic visuals.
    - Balanced elegance + lifestyle.
`,

    // Africa
    nigeria: `
    
    - Bold, expressive, fashion-forward.
    - Avoid outdated or poverty-based imagery.
    - Celebrate culture, energy, and pride.
`,

    south_africa: `
    
    - Diverse, scenic, modern.
    - Avoid stereotypes.
    - Lifestyle + nature fusion.
`,

    kenya: `
    
    - Natural, vibrant, community-driven.
    - Avoid safari clichés unless relevant.
    - Modern African urban life.
`,

    ghana: `
    
    - Bright, cultural, lively.
    - Avoid generic African stereotypes.
    - Focus on modern urban Ghana.
`,

    // India
    india_urban: `
    
    - Aspirational, modern, family-aware.
    - Avoid religious misuse.
    - Blend tradition with modern success.
`,

    india_tier2: `
    
    - Community-driven, practical, relatable.
    - Avoid overly luxury-focused visuals.
    - Emphasize trust and accessibility.
`,

    // Asia
    china: `
    
    - Clean, modern, aspirational.
    - Avoid political or sensitive symbolism.
    - Focus on innovation and prestige.
`,

    japan: `
    
    - Minimal, precise, harmonious.
    - Avoid clutter and exaggeration.
    - High attention to detail.
`,

    south_korea: `
    
    - Trendy, polished, aesthetic perfection.
    - Avoid messy or unrefined visuals.
    - K-style minimal + fashion-forward.
`,

    indonesia: `
    
    - Warm, community-oriented.
    - Avoid overly luxury-heavy tone.
    - Natural + lifestyle-driven.
`,

    // Other
    australia: `
    
    - Relaxed, outdoor, casual.
    - Avoid overly formal or rigid visuals.
    - Lifestyle-first storytelling.
`,

    global: `
    
    - Neutral, globally safe, inclusive.
    - Clean editorial-style visuals.
`,
};

/**
 * 🎨 SYMBOLISM RULES
 */
const SYMBOLISM_RULES = `
SYMBOLISM:
- Red = luck (Asia), danger (West).
- White = purity (West), mourning (some Asia).
- Green = prosperity (Islamic regions).
- Avoid sensitive cultural symbols unless accurate.
`;

/**
 * ⚖️ PLATFORM RULES
 */
const PLATFORM_RULES: Record<PlatformKey, string> = {
    meta: `
    - NO before/after.
    - NO exaggerated claims.
    - NO sensitive trait targeting.
`,

    tiktok: `
    - Native, authentic feel required.
    - Avoid overly polished ads.
`,

    amazon: `
    - Clean background.
    - Clear product visibility.
    - No misleading enhancements.
`,

    default: `
- Maintain truthful and realistic visuals.
`,
};

/**
 * 🧴 CATEGORY RULES
 */
const CATEGORY_RULES: Record<CategoryKey, string> = {
    cosmetics: `
    - Natural skin texture.
    - No plastic or over-retouched skin.
`,

    fashion: `
    - Realistic body proportions.
    - Accurate fabric behavior.
`,

    food: `
    - Must look edible and real.
    - No artificial textures.
`,

    tech: `
    - Clean, minimal, realistic usage.
    - Avoid sci-fi exaggeration.
`,
    default: `
- Maintain realism and clarity.
`,

};

/**
 * 🧠 MAIN BUILDER
 */
export function getSafetyRules(params?: {
    regionId?: RegionId;
    category?: CategoryKey;
    platform?: PlatformKey;
}): string {
    const region = params?.regionId ?? 'global';
    const category = params?.category ?? 'default';
    const platform = params?.platform ?? 'default';

    return [
        GLOBAL_BASE_RULES,
        REGION_SAFETY_RULES[region],
        SYMBOLISM_RULES,
        CATEGORY_RULES[category],
        PLATFORM_RULES[platform],
    ].join('\n');
}