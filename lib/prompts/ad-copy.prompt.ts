/**
 * lib/prompts/ad-copy.prompt.ts
 *
 * Dedicated prompt for the ad copy generation stage.
 *
 * WHY THIS IS A SEPARATE CALL FROM THE CREATIVE DIRECTOR:
 * -------------------------------------------------------
 * The Creative Director (gemini-2.5-flash) previously generated scenes +
 * copy + shopify data + posting schedule in a single JSON call. With 6
 * platforms that's 18 copy fields + 6 scene descriptions all competing
 * for the same token budget. Gemini compressed everything to fit — which
 * is why copy came out as single short sentences.
 *
 * This call is text-only (no image input, no image output) and has one job:
 * write full-length, platform-native ad copy for each scene.
 *
 * LENGTH TARGETS (enforced in the prompt):
 *   awareness:     2-3 sentences (~40-60 words)
 *   consideration: 3-5 sentences (~60-100 words) — the money paragraph
 *   conversion:    1-2 sentences (~15-25 words) — punchy CTA
 *
 * The consideration copy is intentionally the longest — this is what gets
 * shown in the "Ad Copy" tab and what merchants paste into their ad manager.
 * It needs to be a complete sales argument, not a fragment.
 */

import type { ProductProfile, UserConfig } from '../types'

// Reuse the same banned phrases and quality rules from the creative director
const FORBIDDEN_PHRASES = `
BANNED — never use these words or phrases:
"effortlessly", "seamlessly", "elevate your", "level up", "game-changer",
"transform your", "unlock your", "dive into", "flow", "vibe", "journey",
"personal sanctuary", "daily grind", "sound sanctuary", "without missing a beat",
"take it to the next level", "feel the difference", "experience the difference",
"high quality", "premium quality", "carefully crafted", "thoughtfully designed",
"built for you", "made for the modern", "for the discerning", "lifestyle brand",
"community of", "join thousands of", "be part of something".
`.trim()

// Platform-specific length and tone guidance
const PLATFORM_COPY_SPEC: Record<string, {
    awareness_spec: string
    consideration_spec: string
    conversion_spec: string
}> = {
    instagram_post: {
        awareness_spec: '2 sentences. AFTER state — the life with the product. Vivid and specific. No abstract emotions. (~30-40 words)',
        consideration_spec: '3-4 sentences. The BRIDGE — what specifically makes this product deliver that life. At least 2 named features with concrete outcomes. Use specifics: numbers, materials, durations, named scenarios. (~70-90 words)',
        conversion_spec: '1 sentence. Social proof number + specific CTA + one urgency signal. (~20-25 words)',
    },
    instagram_story: {
        awareness_spec: '1 punchy sentence. Stops the thumb. Surprising specific outcome or result. (~15-20 words)',
        consideration_spec: '2-3 sentences. One concrete proof point per sentence. Numbers, dimensions, test results. No adjectives without evidence. (~40-60 words)',
        conversion_spec: '1 sentence. Maximum 10 words. Scarcity or novelty signal. Swipe-up energy.',
    },
    tiktok: {
        awareness_spec: '1 sentence. Works as text overlay. Specific result or named problem. No vague promises. (~15-20 words)',
        consideration_spec: '2-3 sentences. The counterintuitive fact about the product. Something surprising they didn\'t know they needed. Reads naturally spoken aloud. (~40-60 words)',
        conversion_spec: '1 sentence. 5 words or fewer. Works sound-off. Decisive.',
    },
    facebook_post: {
        awareness_spec: '2-3 sentences. Names the exact specific daily frustration. The reader should think "that\'s exactly it." Include the specific moment of the problem, not the category. (~40-55 words)',
        consideration_spec: '4-5 sentences. Full PAS solution paragraph. Feature → mechanism → outcome → proof → emotional payoff. This is the main body of the Facebook post. Write it like a copywriter who gets paid per conversion. (~90-120 words)',
        conversion_spec: '1-2 sentences. Social proof number + zero-friction action. Return policy or free shipping if relevant. (~20-30 words)',
    },
    shopify_product: {
        awareness_spec: '1-2 sentences. The single most important benefit, stated as specifically as possible. Could be the headline on a product page. (~20-30 words)',
        consideration_spec: '4-6 sentences. Full product argument: feature 1 + outcome, feature 2 + outcome, differentiator vs alternatives, who it\'s for specifically, what makes it worth the price. This is the above-the-fold product description. (~100-130 words)',
        conversion_spec: '1 sentence. Shipping speed + return policy + stock signal. Removes every reason not to buy. (~15-20 words)',
    },
    web_banner: {
        awareness_spec: '1 sentence. Max 8 words. Billboard rule: specific benefit, no filler words. (~8 words)',
        consideration_spec: '1-2 sentences. One specific proof point. Number, certification, comparison, or test result. (~20-30 words)',
        conversion_spec: '2-4 words. Strong verb CTA. "Shop Now" is fine if the awareness line is specific.',
    },
}

export interface AdCopyInput {
    productProfile: ProductProfile
    userConfig: UserConfig
    scenes: Array<{ platform: string; image_prompt: string }>
    language: string
}

export function buildAdCopyPrompt(input: AdCopyInput): string {
    const { productProfile, userConfig, scenes, language } = input

    const audienceContext = [
        userConfig.ageRange && `Age: ${userConfig.ageRange}`,
        userConfig.gender && `Gender: ${userConfig.gender}`,
        userConfig.interest && `Interest: ${userConfig.interest}`,
        userConfig.country && `Market: ${userConfig.country}`,
    ].filter(Boolean).join(' · ')

    const platformSpecs = scenes.map(scene => {
        const spec = PLATFORM_COPY_SPEC[scene.platform] ?? {
            awareness_spec: '2-3 sentences. Specific, vivid, audience-targeted.',
            consideration_spec: '4-5 sentences. Full product argument with specific features and outcomes.',
            conversion_spec: '1-2 sentences. Clear CTA with urgency or social proof.',
        }
        return `
### ${scene.platform.toUpperCase()}
Scene context (the image this copy will appear alongside):
"${scene.image_prompt}"

awareness     — ${spec.awareness_spec}
consideration — ${spec.consideration_spec}
conversion    — ${spec.conversion_spec}
`.trim()
    }).join('\n\n')

    return `
You are a senior direct-response copywriter specialising in e-commerce paid social.
You write copy that sells products — not copy that sounds like marketing.

PRODUCT:
${JSON.stringify(productProfile, null, 2)}

TARGET AUDIENCE: ${audienceContext || 'Global e-commerce audience'}

LANGUAGE: Write all copy in ${language}. Keep product specs, model numbers, and brand names in their original form.

${FORBIDDEN_PHRASES}

QUALITY TEST: Before submitting, read each piece of copy aloud.
If it sounds like something you've heard in any other ad — rewrite it.
If it could appear in a competitor's ad without changing a word — rewrite it.
The copy must be specific enough that removing the product name still makes it obvious what product it's for.

SPECIFICITY RULE:
Use real details from the product above. Numbers, materials, model specs, dimensions.
"Bluetooth 5.3" not "advanced connectivity".
"40mm neodymium drivers" not "premium sound".
"6-hour battery" not "long-lasting".
"28dB passive isolation" not "blocks out noise".
If the product data doesn't include a specific detail, use the most specific language available.

---

COPY BRIEF PER PLATFORM:
${platformSpecs}

---

Return ONLY a valid JSON array. No markdown. No code fences. Start directly with [

[
  ${scenes.map(scene => `{
    "platform": "${scene.platform}",
    "awareness": "<awareness copy — meet the exact word count in the spec above>",
    "consideration": "<consideration copy — this is the LONGEST field, the full sales argument>",
    "conversion": "<conversion CTA — meets the spec above>"
  }`).join(',\n  ')}
]

CRITICAL:
- consideration must be the longest field for every platform.
- No field may be a single sentence unless the platform spec explicitly says so.
- facebook_post consideration must be 4-5 full sentences minimum.
- shopify_product consideration must be 4-6 full sentences minimum.
- Every field must use at least one specific detail from the PRODUCT data above.
`.trim()
}