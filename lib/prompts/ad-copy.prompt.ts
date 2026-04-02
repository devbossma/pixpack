/**
 * lib/prompts/ad-copy.prompt.ts
 *
 * v2 — FEELINGS-FIRST:
 *   When a StrategyOutput is present (Creative Director v5+), the copy writer
 *   receives explicit emotional archetype assignments per variation.
 *   Each variation leads with a different archetype so the 4 ads feel distinct
 *   and hit buyers through different emotional entry points.
 *
 *   "A seller sells features. A good seller sells outcomes.
 *    A genius seller sells feelings." — principle driving this rewrite.
 */

import type { ProductProfile, UserConfig, SceneLayout, StrategyOutput } from '../types'

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
    etsy_product: {
        awareness: '2 sentences. Highlight the handmade/unique quality. 1 emoji. (~30-40 words)',
        consideration: '4-5 sentences. Tell the story of the craft or the special touch. Connect with the buyer\'s search for something unique. 2-3 emojis. (~80-100 words)',
        conversion: '2 sentences. Suggest as a perfect gift or personal treat. 1 emoji.',
    },
}

// ─── Visual angle → base copy direction ──────────────────────────────────────
// Used as a fallback when no strategy is present, AND as a secondary layer
// when strategy IS present (the archetype adds the emotional dimension ON TOP).

const VARIATION_COPY_ANGLE: Record<string, string> = {
    lifestyle: 'Story-led & Emotional. Focus on the identity shift. "Who do I become when I use this?" Use warm, personal language. Candid "day-in-the-life" feel.',
    hero: 'Authority & Performance. Lead with technical superiority. "Why is this better than the rest?" Use numbers, specs, and performance claims. Direct and confident.',
    context: 'Desire & Aspiration. Paint the world the product belongs to. Focus on status, aesthetics, and "The Good Life". High-end, sophisticated energy.',
    social_proof: 'Trust & Authenticity. Write as if a real customer is recommending the product to a friend. Use first-person enthusiasm, mention the unboxing moment or first impression. Social proof energy — "I ordered this and..." or "Not sponsored, genuinely obsessed".',
}

// ─── Category-specific copy amplifiers ────────────────────────────────────────
// The archetype tells us the EMOTIONAL dimension to activate.
// The category amplifier tells us HOW to write for this product type.
// Both are injected together — archetype is the feeling, category is the craft.

const CATEGORY_COPY_AMPLIFIERS: Record<string, string> = {
  pet: 'Write with deep pet-parent empathy. Speak directly to their bond ("your dog deserves", "cats know better"). Use specific breed or animal behavior details — vague animal references feel fake. The pet\'s comfort and happiness IS the parent\'s peace of mind.',
  beauty: 'Lead with sensory precision — texture, sensation, scent, the exact moment of application. Never say "glowing skin" — say "the kind of skin that catches light from across a room". Real application detail (how it feels, how fast it absorbs, the finish it leaves) is more convincing than any claim.',
  sports: 'Write as if the athlete is already mid-session, not sitting on a couch. Use kinetic verbs — "locks in", "holds under load", "powers through", "doesn\'t slip". A specific performance metric beats any adjective.',
  food: 'Activate the appetite with sensory precision — smell, taste, texture, temperature, the specific flavour note. Never "delicious" — say "the caramel note that hits at the back of the throat on the finish". Make the reader\'s mouth water before they finish the sentence.',
  tech: 'Translate every spec into a human outcome first, then show the number. "4 hours of battery life" is forgettable. "One full workday on a single charge — yes, including the video calls" is not. Lead with the single most impressive spec in plain language.',
  fashion: 'Write to identity before appearance. A bag isn\'t a bag — it\'s the statement the outfit makes. Reference specific style moments, real wardrobe situations. "The piece that makes the rest of your look make sense." Aspiration must feel attainable, not generic luxury.',
  home: 'Write to the feeling of the home, not the object. A candle isn\'t a candle — it\'s Tuesday evening finally unwinding. A throw isn\'t a throw — it\'s the cold couch fix. Make the reader feel the room, not just see the product.',
  kids: 'Serve two audiences in one piece: the parent\'s peace of mind (safety, developmental value, easy cleanup) AND the child\'s pure delight (fun, colour, play). Lead with whichever one matches the archetype, then address the other.',
  handmade: 'Tell the story of the hands that made it — specific material origin, craft tradition, the visible imperfections that prove it\'s real. "No two are exactly alike" is earned, not claimed. Machine-made products don\'t look like this, and your copy should make that obvious.',
  general: 'Lead with the clearest, most specific benefit observable from the product. No abstract claims — only the concrete, tangible difference this product makes in someone\'s actual day.',
}

// ─── Archetype copy techniques ────────────────────────────────────────────────
// Concrete writing instructions per emotional archetype.

const ARCHETYPE_TECHNIQUE: Record<string, string> = {
    Security:   'Talk about what will NOT go wrong. Peace of mind, durability, reliability. Words: "always", "never fails", "guaranteed", "trusted by". Start with the risk the buyer fears, then eliminate it.',
    Belonging:  'Write as if the buyer is joining a community. Words: "people like you", "thousands of", "together", "you\'re not alone". Reference shared values. Make them feel seen.',
    Status:     'Let them feel above the crowd. Exclusivity, subtle flex, aspirational positioning. Words: "the kind of person who", "when others notice", "most people settle for". Speak to identity pride.',
    Freedom:    'Remove constraints and limitations. Words: "finally", "without", "no more", "stop waiting". Focus on time saved, independence gained, friction eliminated.',
    Curiosity:  'Open a loop that can only be closed by buying. Start with a question or a surprising fact. Words: "what happens when", "most people don\'t know", "turns out". Create productive mystery.',
}

// ─── Archetype → variation mapping ───────────────────────────────────────────
// Which variation (by angle) leads with which archetype position in the stack.
// lifestyle → primary (most emotionally resonant for narrative)
// hero → secondary (authority deepens the second emotion)
// context → secondary (aspiration often shares archetype with hero)
// social_proof → tertiary (trust/community closes the loop)

const ANGLE_ARCHETYPE_INDEX: Record<string, number> = {
    lifestyle:    0,  // primary archetype
    hero:         1,  // secondary archetype
    context:      1,  // secondary archetype
    social_proof: 2,  // tertiary archetype
}

// ─── Input & builder ──────────────────────────────────────────────────────────

export interface AdCopyInput {
    productProfile: ProductProfile
    userConfig: UserConfig
    variations: SceneLayout[]
    language: string
    strategy?: StrategyOutput  // optional — present when Creative Director v5+ is used
}

// ─── Category resolver ────────────────────────────────────────────────────────
// Mirrors the category detection logic in creative-director.prompt.ts
// so copy receives the same product-type context the Creative Director used.

function resolveCopyCategory(productProfile: ProductProfile): string {
    const type = (productProfile.product_type ?? '').toLowerCase()
    const useCases = (productProfile.use_cases ?? []).join(' ').toLowerCase()
    const combined = `${type} ${useCases}`

    if (/\b(pet|dog|cat|animal|collar|leash|toy.*pet|pet.*toy|treats?|paw|fur)\b/.test(combined)) return 'pet'
    if (/\b(serum|moisturizer|cleanser|toner|sunscreen|lipstick|mascara|foundation|blush|perfume|shampoo|conditioner|body.?wash|soap|skincare|haircare|nail|beauty|cosmetic|makeup|lotion|cream|balm)\b/.test(combined)) return 'beauty'
    if (/\b(gym|fitness|workout|running|yoga|sports|athletic|cycling|hiking|climbing|training|resistance|weights|protein|supplement|performance)\b/.test(combined)) return 'sports'
    if (/\b(coffee|tea|beverage|drink|food|snack|supplement|protein.?bar|chocolate|olive.?oil|sauce|seasoning|spice|kitchen|cookware|mug|cup|flask)\b/.test(combined)) return 'food'
    if (/\b(phone|laptop|tablet|headphone|earphone|charger|cable|speaker|camera|gadget|tech|device|keyboard|mouse|monitor|usb|wireless|bluetooth|smart.?watch)\b/.test(combined)) return 'tech'
    if (/\b(bag|handbag|wallet|purse|watch|jewelry|necklace|ring|bracelet|earring|clothing|shirt|dress|jacket|coat|jeans|sneaker|boot|shoe|sunglasses|belt|scarf|hat)\b/.test(combined)) return 'fashion'
    if (/\b(candle|vase|cushion|pillow|blanket|throw|lamp|light|plant|pot|planter|frame|mirror|clock|shelf|decor|home|furniture|rug|curtain|towel)\b/.test(combined)) return 'home'
    if (/\b(toy|baby|infant|toddler|kids?|child|children|nursery|stroller|feeding|diaper|sippy|rattle|puzzle|educational|playmat)\b/.test(combined)) return 'kids'
    if (/\b(handmade|hand.?made|handcrafted|artisan|artisanal|bespoke|custom.?made|small.?batch|hand.?sewn|hand.?woven|hand.?knit|hand.?painted|hand.?carved|pottery|ceramics|woodworking|leather.?work|macram[eé]|crochet|embroidery)\b/.test(combined)) return 'handmade'
    return 'general'
}

export function buildAdCopyPrompt(input: AdCopyInput): string {
    const { productProfile, userConfig, variations, language, strategy } = input

    const platform = userConfig.platform ?? 'instagram_post'
    const spec = PLATFORM_COPY_SPEC[platform] ?? PLATFORM_COPY_SPEC.instagram_post

    const copyCategory = resolveCopyCategory(productProfile)
    const categoryAmplifier = CATEGORY_COPY_AMPLIFIERS[copyCategory] ?? CATEGORY_COPY_AMPLIFIERS.general

    const audienceContext = [
        userConfig.ageRange && `Age: ${userConfig.ageRange}`,
        userConfig.gender && `Gender: ${userConfig.gender}`,
        userConfig.interest && `Interest: ${userConfig.interest}`,
        userConfig.country && `Market: ${userConfig.country}`,
    ].filter(Boolean).join(' · ')

    // ── Strategy block (injected when Creative Director v5+ strategy is present) ──
    const strategySection = strategy ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMOTIONAL STRATEGY — THIS IS YOUR NORTH STAR:

"A seller sells features. A good seller sells outcomes. A genius seller sells feelings."

The strategy team has identified the top 3 emotional archetypes for this product + audience:

  ${strategy.emotional_archetypes.map((a, i) => `${i + 1}. ${a}`).join('\n  ')}

Strategic reasoning: ${strategy.reasoning}
Tone guide: ${strategy.tone_guide}

ARCHETYPE WRITING TECHNIQUES:
${strategy.emotional_archetypes.map(a => `▸ ${a}: ${ARCHETYPE_TECHNIQUE[a] ?? 'Tap into this core human motivation in every line.'}`).join('\n')}

TONE ENFORCEMENT:
Every sentence you write MUST feel like: ${strategy.tone_guide}
Read it aloud. If it sounds like a press release, rewrite it.
If it sounds like a real person talking to another real person — it's right.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''

    // ── Per-variation brief builder ──────────────────────────────────────────────
    // Each variation gets its archetype assignment (if strategy is available),
    // plus the base visual angle direction.
    const variationBriefs = variations.map(v => {
        const archetypes = strategy?.emotional_archetypes ?? []
        const idx = ANGLE_ARCHETYPE_INDEX[v.angle] ?? 0
        const assignedArchetype = archetypes[idx] ?? archetypes[0]

        const archetypeInstruction = assignedArchetype
            ? `PRIMARY FEELING TO SELL: "${assignedArchetype}"\n` +
              `Technique: ${ARCHETYPE_TECHNIQUE[assignedArchetype] ?? ''}\n` +
              `The FIRST sentence MUST create the feeling of ${assignedArchetype}. Every subsequent sentence must reinforce it.\n`
            : ''

        return `
VARIATION ${v.variation} (${v.angle.toUpperCase()})
${archetypeInstruction}Copy Direction: ${VARIATION_COPY_ANGLE[v.angle] ?? 'Social-native benefit-led copy.'}
Scene Context: "${v.image_prompt}"

[AWARENESS]: ${spec.awareness}
[CONSIDERATION]: ${spec.consideration}
[CONVERSION]: ${spec.conversion}
`.trim()
    }).join('\n\n---\n\n')

    return `
You are a top-tier Direct Response Media Buyer and Emotional Copywriter.
You don't just write ads that stop the scroll — you write ads that make people FEEL something and act on it.

PRODUCT INFO:
${JSON.stringify(productProfile, null, 2)}
${productProfile.productHint ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ MERCHANT'S OWN WORDS — HIGHEST PRIORITY:
"${productProfile.productHint}"
Use this as ground truth for copy claims. If the merchant says something is handmade or has a specific material, your copy MUST reflect it.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : ''}

PLATFORM TARGET: ${platform}
AUDIENCE SEGMENT: ${audienceContext || 'Global Social Media Users'}
LANGUAGE: ${language}

CRITICAL: You MUST write ALL copy in ${language}. Every word. No exceptions. Not even a single word in English unless ${language} is English.
${strategySection}
${FORBIDDEN_PHRASES}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT CATEGORY: ${copyCategory.toUpperCase()}
CATEGORY WRITING CRAFT — THIS IS HOW YOU WRITE FOR THIS TYPE OF PRODUCT:
${categoryAmplifier}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COPYWRITING RULES:
1. THE HOOK: Every Awareness piece MUST start with a hook. No "Welcome to..." or "Discover our...".
   Start with: A surprising fact, a polarizing question, a specific pain point, or a vivid "After" state.
2. SOCIAL NATIVE: Use emojis (✨, 🚀, ✅, 📍, etc.) appropriately for the platform.
3. SPECIFICITY: If the product has a 5000mAh battery, say "5000mAh battery" — do NOT say "long-lasting battery".
4. TONE: Match the tone guide exactly: ${strategy?.tone_guide ?? 'High energy, authority, and empathy. Speak TO the user, not AT them.'}
5. FORMATTING: Use bullet points (•) in the Consideration section for readability.
6. CATEGORY CRAFT: Apply the category writing technique above — every line should feel like it was written by someone who deeply understands this product type.

---

COPY BRIEF FOR EACH VARIATION:
${variationBriefs}

---

Return ONLY a valid JSON array. No markdown. No code fences. Start directly with [

[
  ${variations.map(v => `{
    "variation": ${v.variation},
    "angle": "${v.angle}",
    "awareness": "<hook-led awareness copy — first sentence must create the assigned emotional feeling>",
    "consideration": "<full sales argument deepening the emotion, with benefits, bullets, and emojis>",
    "conversion": "<urgent CTA anchored in the emotional archetype with 1 emoji>"
  }`).join(',\n  ')}
]
`.trim()
}