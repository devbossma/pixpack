/**
 * lib/prompts/ad-copy.prompt.ts
 *
 * EXPERT MEDIA BUYER VERSION:
 *   Generates high-converting, social-native ad copy.
 *   - Thumb-stopping hooks
 *   - Emoji integration (platform-appropriate)
 *   - PAS (Problem-Agitate-Solve) and AIDA frameworks
 *   - Benefit-driven bullets
 */

import type { ProductProfile, UserConfig, SceneLayout } from '../types'

const FORBIDDEN_PHRASES = `
BANNED — never use these "marketing-ese" words:
"effortlessly", "seamlessly", "elevate your", "level up", "game-changer",
"transform your", "unlock your", "flow", "vibe", "journey", "personal sanctuary",
"daily grind", "high quality", "premium quality", "carefully crafted",
"thoughtfully designed", "built for you", "made for the modern".
`.trim()

// ─── Copy spec per platform ───────────────────────────────────────────────────

const PLATFORM_COPY_SPEC: Record<string, {
    awareness: string
    consideration: string
    conversion: string
}> = {
    instagram_post: {
        awareness: '3 sentences. Start with a vivid social media HOOK. Use 1-2 emojis. Focus on the "Aha!" moment. (~40-50 words)',
        consideration: '5-6 sentences. Benefit-driven. Use 2-3 bullet points (•) for key features. Use 2-3 emojis. Address a specific audience desire. (~100-120 words)',
        conversion: '2 sentences. Social proof + specific CTA + urgency. 1 emoji. (~30-40 words)',
    },
    instagram_story: {
        awareness: '1-2 sentences. Bold, thumb-stopping hook. 1 emoji. (~25-30 words)',
        consideration: '3-4 sentences. Fast-paced. One concrete proof point per sentence. Use 2 emojis. (~60-80 words)',
        conversion: '1 sentence + CTA. Strong scarcity or "Link in Bio" energy. 1 emoji.',
    },
    tiktok: {
        awareness: '1 disruptive sentence. UGC style. Sounds like a creator speaking. 1-2 emojis. (~20-25 words)',
        consideration: '3-4 short, punchy sentences. "Why you actually need this" energy. Use trending-style language but stay professional. 2 emojis. (~70-90 words)',
        conversion: 'Short CTA. 3-5 words. Urgent. 1 emoji.',
    },
    facebook_post: {
        awareness: '3-4 sentences. Start with a relatable PROBLEM. Deep emotional resonance. 1-2 emojis. (~60-80 words)',
        consideration: '6-8 sentences. Full Long-form sales copy. PAS framework (Problem-Agitate-Solve). Detail the transformation. Use 3-4 emojis. (~150-180 words)',
        conversion: '2 sentences. Safety signal (Guarantees/Shipping) + clear link CTA. 1 emoji.',
    },
    shopify_product: {
        awareness: '2 sentences. High-authority product positioning. 0-1 emojis. (~40-50 words)',
        consideration: '6-8 sentences. Conversion-optimised product description. Narrative + technical specs. (~120-150 words)',
        conversion: '2 sentences. "Add to cart" incentive. 1 emoji.',
    },
    web_banner: {
        awareness: '1 short headline. Bold, benefit-led. 0 emojis. (~8-10 words)',
        consideration: '2 sentences. The "Unique Selling Proposition" (USP). (~30-40 words)',
        conversion: '3-5 words. Strong action verb.',
    },
}

const VARIATION_COPY_ANGLE: Record<string, string> = {
    lifestyle: 'Story-led & Emotional. Focus on the identity shift. "Who do I become when I use this?" Use warm, personal language. Candid "day-in-the-life" feel.',
    hero: 'Authority & Performance. Lead with technical superiority. "Why is this better than the rest?" Use numbers, specs, and performance claims. Direct and confident.',
    context: 'Desire & Aspiration. Paint the world the product belongs to. Focus on status, aesthetics, and "The Good Life". High-end, sophisticated energy.',
    social_proof: 'Trust & Authenticity. Write as if a real customer is recommending the product to a friend. Use first-person enthusiasm, mention the unboxing moment or first impression. Social proof energy — "I ordered this and..." or "Not sponsored, genuinely obsessed".',
}

export interface AdCopyInput {
    productProfile: ProductProfile
    userConfig: UserConfig
    variations: SceneLayout[]
    language: string
}

export function buildAdCopyPrompt(input: AdCopyInput): string {
    const { productProfile, userConfig, variations, language } = input

    const platform = userConfig.platform ?? 'instagram_post'
    const spec = PLATFORM_COPY_SPEC[platform] ?? PLATFORM_COPY_SPEC.instagram_post

    const audienceContext = [
        userConfig.ageRange && `Age: ${userConfig.ageRange}`,
        userConfig.gender && `Gender: ${userConfig.gender}`,
        userConfig.interest && `Interest: ${userConfig.interest}`,
        userConfig.country && `Market: ${userConfig.country}`,
    ].filter(Boolean).join(' · ')

    const variationBriefs = variations.map(v => `
VARIATION ${v.variation} (${v.angle.toUpperCase()})
Creative Angle: ${VARIATION_COPY_ANGLE[v.angle] ?? 'Social-native benefit-led copy.'}
Scene: "${v.image_prompt}"

[AWARENESS]: ${spec.awareness}
[CONSIDERATION]: ${spec.consideration}
[CONVERSION]: ${spec.conversion}
`.trim()).join('\n\n---\n\n')

    return `
You are a top-tier Direct Response Media Buyer and Social Copywriter. 
You write ads that stop the scroll and force people to read.

PRODUCT INFO:
${JSON.stringify(productProfile, null, 2)}

PLATFORM TARGET: ${platform}
AUDIENCE SEGMENT: ${audienceContext || 'Global Social Media Users'}
LANGUAGE: ${language}

${FORBIDDEN_PHRASES}

COPYWRITING RULES:
1. THE HOOK: Every Awareness piece MUST start with a hook. No "Welcome to..." or "Discover our...". 
   Start with: A surprising fact, a polarizing question, a specific pain point, or a vivid "After" state.
2. SOCIAL NATIVE: Use emojis (✨, 🚀, ✅, 📍, etc.) appropriately for the platform.
3. SPECIFICITY: If the product has a 5000mAh battery, say "5000mAh battery" — do NOT say "long-lasting battery".
4. TONE: High energy, authority, and empathy. Speak TO the user, not AT them.
5. FORMATTING: Use bullet points (•) in the Consideration section for readability.

---

COPY BRIEF FOR EACH VARIATION:
${variationBriefs}

---

Return ONLY a valid JSON array. No markdown. No code fences. Start directly with [

[
  ${variations.map(v => `{
    "variation": ${v.variation},
    "angle": "${v.angle}",
    "awareness": "<hook-led awareness copy with 1-2 emojis>",
    "consideration": "<full sales argument with benefits, bullets, and emojis>",
    "conversion": "<urgent CTA with final proof point and 1 emoji>"
  }`).join(',\n  ')}
]
`.trim()
}