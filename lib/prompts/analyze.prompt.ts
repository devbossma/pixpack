/**
 * lib/prompts/analyze.prompt.ts
 *
 * Gemini Vision prompt for product analysis.
 *
 * Goal: extract structured data that feeds directly into marketing copy generation.
 * The richer and more specific this analysis, the better the Creative Director
 * output will be. Generic terms like "high quality" are explicitly forbidden.
 *
 * Key upgrades over the original:
 * - Added product_type, target_customer, use_cases, visual_mood, competitor_positioning
 * - Key selling points now require functional + emotional + practical split
 * - Materials require quality indicator, not just material name
 * - style_aesthetic uses precise style vocabulary marketers actually use
 */

export function buildAnalyzePrompt(productHint: string): string {
  return `
You are an expert e-commerce product analyst and commercial photographer.
Analyze this product image with the eyes of a professional marketer and copywriter.
${productHint ? `Merchant note: "${productHint}"` : ''}

Return ONLY a valid JSON object. No markdown. No explanation. Start directly with {

{
  "product_type": "<specific product category — be precise, e.g. 'leather crossbody bag', 'ceramic pour-over coffee set', 'wireless noise-cancelling headphones'>",
  "physical_features": [
    "<concrete observable detail — e.g. 'matte black finish with brushed gold hardware'>",
    "<concrete observable detail — e.g. 'adjustable padded shoulder strap with quick-release buckle'>",
    "<concrete observable detail — e.g. 'compact form factor, approximately 20cm wide'>"
  ],
  "materials": [
    "<material + quality indicator — e.g. 'full-grain vegetable-tanned leather with visible texture'>",
    "<material + quality indicator — e.g. 'solid brass zipper pulls, not plated'>"
  ],
  "style_aesthetic": "<one precise style label marketers use — e.g. 'minimalist Scandinavian with warm earth tones' / 'coastal grandmother' / 'quiet luxury' / 'Y2K chrome and glass' / 'artisanal cottage-core'>",
  "target_customer": "<specific person, not demographic — e.g. 'a 32-year-old UX designer who cycles to work and attends gallery openings on weekends'>",
  "use_cases": [
    "<concrete scenario — e.g. 'daily office commute with laptop and charger'>",
    "<concrete scenario — e.g. 'weekend farmers market and brunch'>",
    "<concrete scenario — e.g. 'carry-on travel, fits personal item slot'>"
  ],
  "key_selling_points": [
    "<functional benefit — specific and measurable, e.g. 'fits 13-inch laptop plus daily essentials in separate zippered compartments'>",
    "<emotional benefit — how owning it makes you feel, e.g. 'projects quiet confidence without looking try-hard'>",
    "<practical benefit — problem it solves, e.g. 'converts from shoulder bag to backpack in two seconds, hands-free for cyclists'>"
  ],
  "visual_mood": "<the feeling the product evokes — e.g. 'calm sophistication, like a well-edited wardrobe' / 'raw energy, like a pre-race locker room' / 'cosy abundance, like Sunday morning in a warm kitchen'>",
  "competitor_positioning": "<market context in one sentence — e.g. 'premium alternative to Coach at Mango price point' / 'sustainable option in the fast-fashion accessories space' / 'prosumer tool bridging the gap between hobbyist and professional'>"
}

Rules:
- Describe ONLY what you can actually observe in the image — no assumptions.
- Forbidden words: 'high quality', 'versatile', 'stylish', 'beautiful', 'premium feel' — these are meaningless.
- Every field must be concrete enough to paste directly into an ad.
`.trim()
}
