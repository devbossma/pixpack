/**
 * lib/prompts/creative-director.prompt.ts
 *
 * The Creative Director stage drives two things:
 *   1. SCENE DESCRIPTIONS for the image model — must be audience-specific, not generic
 *   2. AD COPY per platform — must use proven formulas per platform
 *
 * KEY FIX: Audience config (age, gender, interest, angle, country) now directly drives
 * the scene descriptions, not just the copy. Age 18-24 women in Seoul gets a completely
 * different scene than age 45-60 men in Frankfurt — different environments, props,
 * lighting moods, and cultural markers baked into the image_prompt itself.
 *
 * HOW AUDIENCE DRIVES SCENES:
 *   age     → energy level, life stage, setting type (campus vs office vs home)
 *   gender  → environment selection, prop choice, POV framing
 *   interest → which subcultural spaces and objects appear in the background
 *   angle   → camera style (lifestyle candid / editorial flatlay / closeup macro /
 *              model-led fashion / hero studio)
 *   country → specific named locations, cultural markers, lighting character
 */

import type { ProductProfile, UserConfig } from '../types'

// ─── Audience → visual language translation maps ──────────────────────────────
// These translate UI selections into concrete photographic scene language.
// The image model needs specifics, not abstractions.

const AGE_VISUAL_CONTEXT: Record<string, string> = {
  '18-24': 'energetic, youthful spaces — university campuses, shared apartments, skate parks, street food markets, dorm rooms, indie coffee shops. Props: AirPods, skateboards, sneakers, energy drinks, phone mounts. People are in motion or casually posed. Raw, unpolished energy.',
  '25-34': 'aspirational but accessible — co-working spaces, modern apartments with plants, brunch spots, gym lobbies, commuter environments. Props: laptops, quality tote bags, specialty coffee, yoga mats. Composed but not stiff.',
  '35-44': 'established, purposeful — home offices with good lighting, kitchen islands, weekend outdoor settings, professional environments. Props: leather goods, quality kitchenware, running gear. Calm, confident.',
  '45-60': 'refined, comfort-forward — well-furnished homes, garden settings, golf courses, upscale restaurants, travel settings. Props: quality fabrics, reading glasses, weekend leisure items. Warm, unhurried.',
}

const GENDER_VISUAL_CONTEXT: Record<string, string> = {
  'women': 'spaces and props that resonate with women: vanity surfaces, floral accents, soft textiles, warm lighting. Composition uses intimate framing, lifestyle moments, hands and textures. Colours lean warm or pastel where appropriate.',
  'men': 'spaces with clean lines and purpose: workbenches, gym floors, desk setups, outdoor terrain. Composition is direct, product-forward. Neutral or bold colour palette. Confident, no-nonsense framing.',
  'mixed': 'neutral, inclusive environments: open public spaces, well-designed interiors, outdoor lifestyle settings. Props are universally relatable. Colour palette is balanced and contemporary.',
}

const INTEREST_VISUAL_CONTEXT: Record<string, string> = {
  'fashion': 'fashion-forward environments: editorial studio backdrops, boutique dressing rooms, fashion week street scenes, marble surfaces, clothing racks in background. High-contrast or editorial lighting.',
  'sports': 'athletic environments: gym equipment in background, outdoor tracks, locker room tiles, sports courts, running paths. Dynamic lighting, motion-blur suggestion, performance-oriented.',
  'luxury': 'luxury markers: marble surfaces, hotel lobbies, private pools, leather goods, champagne flutes, architectural interiors. Ultra-clean composition, dramatic shadows, premium materials throughout.',
  'tech': 'tech environments: clean desk setups with monitors, cable-managed workstations, neon-lit rooms, server room aesthetics. Cool blue or purple ambient light. Precision and order.',
  'home': 'domestic warmth: linen textures, morning sunlight through curtains, kitchen counters with fresh herbs, wooden surfaces, cosy blankets. Soft natural light. Hygge aesthetic.',
  'beauty': 'beauty environments: vanity setups with ring lights, bathroom counters with premium skincare, floral arrangements, rose quartz surfaces. Pastel tones, soft focus.',
  'outdoor': 'outdoor and adventure: mountain trails, beach settings, forest clearings, camping gear in background, golden hour landscapes. Natural light, high dynamic range, earthy tones.',
  'family': 'family-friendly spaces: bright living rooms, playgrounds in background, kitchen tables, backyard settings. Warm tones, natural light, open inviting spaces.',
  'food': 'food and lifestyle environments: café interiors, farmers market stalls, kitchen prep surfaces with ingredients, restaurant interiors. Warm overhead lighting, textures of wood and stone.',
  'business': 'professional environments: boardrooms, sleek office lobbies, laptop setups on clean desks, airport business lounges. Cool confident tones, geometric composition.',
}

const ANGLE_VISUAL_DIRECTION: Record<string, string> = {
  'lifestyle': 'Candid lifestyle shot. Product integrated naturally in a real-life scene. Person or implied presence. Shallow depth of field. The product is present but the scene tells a story around it.',
  'flatlay': 'Top-down flat-lay on a styled surface. Product centred or rule-of-thirds. Complementary props carefully arranged around it. Clean overhead light. No shadows cutting across the product.',
  'closeup': 'Extreme close-up macro shot. Product fills 85% of frame. Focus on texture, material, detail, craftsmanship. Background is soft bokeh. Reveals quality that distance hides.',
  'model': 'Model-led editorial shot. A person using or wearing/holding the product. Product clearly visible. Model\'s expression and body language reinforce the brand mood.Fashion editorial framing.',
  'hero': 'Hero studio shot. Product is the sole subject. Perfect controlled lighting. Clean or minimalist background. Product fills 70–80% of frame. Commercial photography at its best.',
}

// ─── Forbidden phrases — injected into every copy brief ──────────────────────
// These are the exact phrases Gemini defaults to when given no constraints.
// Explicitly banning them forces it to find concrete, specific alternatives.
const FORBIDDEN_COPY_PHRASES = `
BANNED WORDS AND PHRASES — never use these, ever:
"effortlessly", "seamlessly", "elevate your", "level up", "game-changer",
"transform your", "unlock your", "dive into", "flow", "vibe", "journey",
"personal sanctuary", "daily grind", "sound sanctuary", "without missing a beat",
"take it to the next level", "feel the difference", "experience the difference",
"high quality", "premium quality", "carefully crafted", "thoughtfully designed",
"built for you", "made for the modern", "for the discerning", "lifestyle brand",
"community of", "join thousands of", "be part of something".

If you find yourself writing any of these, stop and rewrite with a specific detail instead.
A specific detail is: a number, a named place, a duration, a material, a comparison,
a named frustration, a named scenario. Never an abstraction.
`.trim()

// ─── Copy quality rules — injected once before all formulas ───────────────────
const COPY_QUALITY_RULES = `
COPY QUALITY STANDARD:
Every line of copy must pass the "could only be us" test.
If the sentence could appear in ANY brand's ad without changing a word, rewrite it.

SPECIFICITY RULES:
- Use numbers: "6-hour battery" not "long battery life"
- Use named scenarios: "on the metro at rush hour" not "during your commute"  
- Use specific frustrations: "the cable that snags on your jacket zip" not "inconvenience"
- Use named outcomes: "still connected from floor 1 to floor 8" not "strong signal"
- Use concrete social proof: "25,847 orders in 3 months" not "thousands of customers"

GOOD vs BAD examples:
BAD:  "Effortlessly flow through your day feeling in sync with your soundtrack."
GOOD: "The headphones people stop you on the street to ask about."

BAD:  "Our over-ear design creates your personal sound sanctuary."
GOOD: "40mm drivers + 28dB passive isolation — the city disappears at volume 4."

BAD:  "Join urban women who've elevated their daily grind."
GOOD: "25,847 orders this quarter. Free shipping ends Sunday."

BAD:  "Experience premium quality crafted for the modern lifestyle."
GOOD: "Worn by baristas, architects, and night-shift nurses. Built to last 3 years."
`.trim()

// Copywriting formula by platform
const COPY_FORMULAS: Record<string, string> = {
  instagram_post: `
BAB formula (Before-After-Bridge):
  awareness:     AFTER state — one vivid, specific sentence describing the life WITH the product.
                 No product name. No abstract emotions. Use a specific scene, a specific feeling, a specific moment.
                 BAD: "Imagine effortlessly flowing through your day." 
                 GOOD: "The headphones people stop you on the street to ask about."
  consideration: BRIDGE — one named feature + one concrete, measurable outcome.
                 Must include at least one specific number or named scenario.
                 BAD: "Our design creates your personal sound sanctuary."
                 GOOD: "40mm drivers + 28dB passive isolation. The city disappears at volume 4."
  conversion:    Concrete social proof number + specific CTA with urgency signal.
                 BAD: "Join thousands who've elevated their daily grind. Shop →"
                 GOOD: "25,847 orders this quarter. Free shipping ends Sunday →"
`.trim(),

  instagram_story: `
Visual hook formula (story stops the thumb in 1 second):
  awareness:     Surprising specific outcome — NOT a vague promise. Start with the result.
                 BAD: "This bag is the reason I feel so put together every morning."
                 GOOD: "This bag has one pocket for literally everything. I timed it: 4 seconds to find my keys."
  consideration: One concrete proof point. A specific number, dimension, material, or test result.
                 BAD: "Made from premium materials for everyday use."
                 GOOD: "Waterproof canvas. Dropped mine in a puddle last Tuesday. Contents: dry."
  conversion:    Ultra-short. One action. Maximum 8 words. Scarcity or novelty signal.
                 GOOD: "Last 12 in stock. Tap to grab yours."
`.trim(),

  tiktok: `
3-second hook (text overlay must work with sound OFF):
  awareness:     Specific result hook: "[Exact number/outcome] — [the thing they assumed was impossible]"
                 OR problem hook: "You're [doing specific thing wrong] and it's costing you [specific consequence]"
                 BAD: "Stop struggling with [generic problem]"
                 GOOD: "I haven't untangled a cable in 8 months"
                 GOOD: "Your headphones are leaking sound to everyone on this train"
  consideration: The one counterintuitive or surprising fact about the product.
                 Something they couldn't guess from looking at it.
                 GOOD: "The cushions are replaceable. Separately. Under $12."
  conversion:    5 words or fewer. Works as text overlay. No emoji needed.
                 GOOD: "Link in bio" / "Shop before it sells out" / "Code SAVE20 expires tonight"
`.trim(),

  facebook_post: `
PAS formula (Problem — Agitate — Solution):
  awareness:     Name the exact, specific daily frustration. The reader should think "that's exactly it."
                 Not a category of problem — a specific moment of that problem.
                 BAD: "Tired of poor sound quality during your commute?"
                 GOOD: "Your earbuds fall out every time you look down at your phone. Every. Single. Time."
  consideration: The product as the direct solution. One specific feature that eliminates the named problem.
                 Include the mechanism — WHY it solves it, not just THAT it solves it.
                 BAD: "Our headphones are designed to stay in place."
                 GOOD: "Over-ear arc + memory foam cushion. Worn through 3 marathons without adjusting once."
  conversion:    Social proof with a real number + low-friction action.
                 GOOD: "4.8 stars across 3,200 reviews. Free returns, no questions. Shop now →"
`.trim(),

  shopify_product: `
AIDA formula (Attention — Interest — Desire — Action):
  awareness:     The single biggest, most specific benefit. What does the customer walk away with?
                 Not a feature, not a vibe — a specific, tangible outcome.
                 BAD: "Premium headphones for the modern listener."
                 GOOD: "40 hours wireless. Zero cable tangles. One charge Sunday, done by Friday."
  consideration: Feature → specific outcome → emotional payoff. One sentence, three beats.
                 BAD: "High quality drivers deliver immersive audio."
                 GOOD: "40mm neodymium drivers push deep bass without the distortion that cheaper cans add at high volume."
  conversion:    Remove every source of friction. Shipping speed + return policy + stock signal.
                 GOOD: "In stock now. Ships in 24h. 30-day returns, no questions asked."
`.trim(),

  web_banner: `
Billboard rule: if you covered the logo and showed it to a stranger, they should know exactly what it does in 3 seconds.
  awareness:     Max 8 words. Specific benefit, not a mood. No verbs like "discover" or "explore".
                 BAD: "Elevate Your Sound Experience"
                 GOOD: "40 Hours. Zero Tangles. One Charge."
  consideration: One specific proof point. Number, certification, comparison, or test result.
                 GOOD: "Worn by 25,000+ commuters" / "IPX4 rated" / "Beats AirPods on battery by 16h"
  conversion:    Strong verb. Specific action. "Shop Now" is fine if the awareness line is strong.
`.trim(),
}

export function buildCreativeDirectorPrompt(
  productProfile: ProductProfile,
  userConfig: UserConfig,
  language: string,
): string {
  const platforms = userConfig.platforms?.length
    ? userConfig.platforms
    : ['instagram_post', 'tiktok', 'facebook_post', 'shopify_product']

  // ── Build audience visual brief ──────────────────────────────────────────────
  // This is what actually makes scenes different for different audiences.
  // Each line is concrete visual direction, not abstract demographic data.

  const ageVisual = userConfig.ageRange ? AGE_VISUAL_CONTEXT[userConfig.ageRange] : null
  const genderVisual = userConfig.gender ? GENDER_VISUAL_CONTEXT[userConfig.gender] : null
  const interestVisual = userConfig.interest ? INTEREST_VISUAL_CONTEXT[userConfig.interest] : null
  const angleDirection = userConfig.angle ? ANGLE_VISUAL_DIRECTION[userConfig.angle] : null

  const audienceVisualBrief = [
    ageVisual && `AGE GROUP ENVIRONMENT: ${ageVisual}`,
    genderVisual && `GENDER VISUAL CONTEXT: ${genderVisual}`,
    interestVisual && `INTEREST/LIFESTYLE SETTING: ${interestVisual}`,
    angleDirection && `CAMERA ANGLE STYLE: ${angleDirection}`,
  ].filter(Boolean).join('\n\n')

  // ── Build copy brief ─────────────────────────────────────────────────────────
  const copyFormulas = platforms
    .map(p => `### ${p}\n${COPY_FORMULAS[p] ?? 'Benefit-led copy with a clear CTA.'}`)
    .join('\n\n')

  // ── Regional and demographic context for copy ────────────────────────────────
  const regionContext = userConfig.country
    ? `Target market: ${userConfig.country}. Reflect local culture, values, slang, and shopping behaviour.`
    : 'Adapt tone and cultural references to match the target audience demographics.'

  const audienceCopyContext = [
    userConfig.ageRange && `Age: ${userConfig.ageRange}`,
    userConfig.gender && `Gender: ${userConfig.gender}`,
    userConfig.interest && `Interest/lifestyle: ${userConfig.interest}`,
  ].filter(Boolean).join(' · ')

  return `
You are a world-class social media creative director and e-commerce copywriter.
Your clients are online merchants who need content that sells — not content that looks generic.

PRODUCT INTELLIGENCE:
${JSON.stringify(productProfile, null, 2)}

AUDIENCE PROFILE:
${regionContext}
${audienceCopyContext ? `Demographic: ${audienceCopyContext}` : ''}

LANGUAGE RULE: Write ALL copy (awareness, consideration, conversion, Shopify content) in ${language}.
Keep proper nouns and brand-standard terms in their original language.

---

IMAGE SCENE BRIEF
=================
Each scene you write will be sent to an image generation model.
The model will composite the product into the scene you describe.

YOUR SCENE MUST BE 100% SPECIFIC TO THIS AUDIENCE — not generic.
Use the audience visual brief below as the primary driver for what environment,
props, lighting, and composition to describe.

AUDIENCE VISUAL BRIEF (use this to build the scene):
${audienceVisualBrief || 'Write professional, contemporary lifestyle scenes appropriate for a global e-commerce audience.'}

SCENE RULES:
- Describe ONLY the background environment and atmosphere — do NOT mention the product.
  The product will be composited in later.
- Be specific about: named location type, surface textures, lighting direction and quality,
  background elements, colour palette, time of day, props visible in scene.
- Each platform scene must be visually distinct — different location, different mood, different light.
- 2-3 sentences per scene. Dense and specific. No vague words like "modern" or "nice".

PLATFORM FRAMING (secondary constraint — apply after audience brief):
${platforms.map(p => {
    const framings: Record<string, string> = {
      instagram_post: 'Square crop. Lifestyle or flat-lay. Rule of thirds. Organic feel.',
      instagram_story: 'Vertical 9:16. Product in upper half. Scene context in lower half. Candid freeze-frame moment.',
      tiktok: 'Vertical 9:16. Dynamic, off-centre. Energy-forward. Looks like organic creator content.',
      facebook_post: '4:3. Trust-building. Familiar, relatable environment. Warm and approachable.',
      shopify_product: 'Square. Studio hero or textured surface. Product-forward. Clean and commercial.',
      web_banner: '16:9. Wide. Product anchored left or right. Empty space on the opposite side for text.',
    }
    return `- ${p}: ${framings[p] ?? 'Professional product lifestyle scene.'}`
  }).join('\n')}

---

AD COPY BRIEF
=============
${FORBIDDEN_COPY_PHRASES}

---

${COPY_QUALITY_RULES}

---

PLATFORM FORMULAS (follow exactly — read the good/bad examples per formula):
${copyFormulas}

The copy must speak directly to: ${audienceCopyContext || 'the target audience'}.
Reference their specific life stage, environment, and frustrations — not generic customer language.
Mine the PRODUCT INTELLIGENCE above for specific numbers, materials, and features to use as proof points.
If the product has Bluetooth 5.3 — say "Bluetooth 5.3", not "advanced connectivity".
If it has 40mm drivers — say "40mm drivers", not "premium audio".

---

SHOPIFY LISTING RULES:
title:                "[Benefit-led adjective] [Product Type] for [Specific Use Case]" — under 60 chars, keyword-rich
tagline:              Emotional hook — the one-line reason to buy, under 80 chars
description:          5 bullets using "so that" structure: [Feature] so you can [specific outcome], [emotional payoff].
                      Separate bullets with periods. No hyphens or bullet characters.
seo_meta_title:       Primary keyword in first 40 chars. Under 60 chars total.
seo_meta_description: Primary keyword + secondary keyword + CTA. Under 160 chars.

---

POSTING SCHEDULE:
Best day/time for this audience (${audienceCopyContext || 'target demographic'}) in ${userConfig.country ?? 'their market'}.
Base it on platform-specific data: TikTok peaks 7–9pm local; Facebook peaks Tue–Thu lunch; Instagram peaks Mon/Thu 11am–1pm.

---

Return ONLY a valid JSON object. No markdown. No code fences. Start directly with {

NOTE: Do NOT include ad_copies in this response. Ad copy is generated in a separate dedicated call.
Your only job here is scene descriptions, shopify data, and posting schedule.

{
  "scenes": [
    ${platforms.map(p => `{
      "platform": "${p}",
      "image_prompt": "<2-3 sentences: specific environment built from audience visual brief + platform framing. Zero generic words. No product mention.>"
    }`).join(',\n    ')}
  ],
  "shopify_data": {
    "title":                "<benefit-led title under 60 chars>",
    "tagline":              "<emotional hook under 80 chars>",
    "description":          "<5 feature→benefit→payoff sentences separated by periods>",
    "seo_meta_title":       "<primary keyword first, under 60 chars>",
    "seo_meta_description": "<keyword-rich with CTA, under 160 chars>"
  },
  "posting_schedule": {
    "best_platform": "<platform from the list with highest purchase intent for this audience>",
    "best_day":      "<specific day>",
    "best_time":     "<time window in local time>",
    "reasoning":     "<one sentence: why this time for this specific audience>"
  }
}

CRITICAL: Generate exactly ${platforms.length} scene objects, in this exact order: ${platforms.join(', ')}.
Every scene must reflect the audience visual brief — a scene for 18–24 women must look nothing like a scene for 45–60 men.
`.trim()
}