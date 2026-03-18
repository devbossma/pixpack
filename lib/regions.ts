export type RegionId =
  | 'morocco' | 'gulf_uae' | 'saudi' | 'egypt'           // MENA
  | 'france' | 'uk' | 'germany' | 'spain' | 'italy'      // Europe
  | 'usa_urban' | 'usa_suburban' | 'canada'               // North America
  | 'brazil' | 'mexico' | 'colombia' | 'argentina'        // Latin America
  | 'nigeria' | 'south_africa' | 'kenya' | 'ghana'        // Africa
  | 'india_urban' | 'india_tier2'                         // India
  | 'china' | 'japan' | 'south_korea' | 'indonesia'       // East/SE Asia
  | 'australia' | 'global'                                // Other

export interface RegionContext {
  id: RegionId
  label: string
  flag: string
  continent: string
  settings: string[]
  lightDescription: string
  aesthetic: string
  captionLanguage: CaptionLanguage
  captionTone: string
}

export type CaptionLanguage =
  | 'arabic'           // MENA (Morocco/Gulf/Saudi/Egypt)
  | 'french'           // France
  | 'english_uk'       // UK
  | 'german'           // Germany
  | 'spanish_latam'    // Latin America
  | 'spanish_spain'    // Spain
  | 'portuguese_br'    // Brazil
  | 'english_us'       // USA/Canada/Australia/Global
  | 'hindi_english'    // India
  | 'korean'           // South Korea
  | 'japanese'         // Japan
  | 'indonesian'       // Indonesia
  | 'swahili_english'  // Kenya/East Africa
  | 'english_ng'       // Nigeria
  | 'afrikaans_english'// South Africa

export const REGIONS: Record<RegionId, RegionContext> = {
  morocco: {
    id: 'morocco', label: 'Morocco', flag: '🇲🇦', continent: 'Africa',
    settings: ['medina of Marrakech with terracotta walls', 'modern Gueliz café', 'Casablanca corniche', 'rooftop terrace with Atlas mountain views', 'Majorelle garden', 'Moroccan riad courtyard'],
    lightDescription: 'warm golden Mediterranean afternoon light',
    aesthetic: 'North African contemporary urban',
    captionLanguage: 'arabic',
    captionTone: 'warm, aspirational, community-oriented',
  },
  gulf_uae: {
    id: 'gulf_uae', label: 'UAE', flag: '🇦🇪', continent: 'Middle East',
    settings: ['Dubai Marina at sunset', 'luxury mall interior with marble floors', 'desert dunes at golden hour', 'Abu Dhabi Corniche', 'sleek hotel rooftop'],
    lightDescription: 'bright high-contrast Gulf sunlight',
    aesthetic: 'luxury Gulf contemporary',
    captionLanguage: 'arabic',
    captionTone: 'premium, exclusive, aspirational',
  },
  saudi: {
    id: 'saudi', label: 'Saudi Arabia', flag: '🇸🇦', continent: 'Middle East',
    settings: ['Riyadh Boulevard', 'modern Diriyah architecture', 'Jeddah waterfront', 'Al Ula desert landscape'],
    lightDescription: 'bright high-contrast desert sunlight',
    aesthetic: 'luxury Saudi contemporary',
    captionLanguage: 'arabic',
    captionTone: 'premium, visionary, aspirational',
  },
  egypt: {
    id: 'egypt', label: 'Egypt', flag: '🇪🇬', continent: 'Middle East',
    settings: ['Cairo downtown', 'Zamalek cafes', 'Alexandria corniche', 'Giza plateau background'],
    lightDescription: 'warm North African afternoon light',
    aesthetic: 'Egyptian urban contemporary',
    captionLanguage: 'arabic',
    captionTone: 'warm, welcoming, vibrant',
  },
  france: {
    id: 'france', label: 'France', flag: '🇫🇷', continent: 'Europe',
    settings: ['Parisian café terrace with wicker chairs', 'Haussmann boulevard in autumn', 'French countryside field', 'minimalist white studio'],
    lightDescription: 'soft diffused Parisian morning light',
    aesthetic: 'French minimal chic editorial',
    captionLanguage: 'french',
    captionTone: 'chic, understated, minimal',
  },
  uk: {
    id: 'uk', label: 'United Kingdom', flag: '🇬🇧', continent: 'Europe',
    settings: ['London street with Georgian townhouses', 'rainy Shoreditch alley', 'English countryside village', 'modern Soho café'],
    lightDescription: 'soft overcast British natural light',
    aesthetic: 'British contemporary streetwear meets heritage',
    captionLanguage: 'english_uk',
    captionTone: 'witty, understated, self-aware',
  },
  germany: {
    id: 'germany', label: 'Germany', flag: '🇩🇪', continent: 'Europe',
    settings: ['Berlin Kreuzberg street', 'Munich Englischer Garten', 'modern Frankfurt architecture', 'industrial loft'],
    lightDescription: 'cool clear Central European light',
    aesthetic: 'German functional modernism',
    captionLanguage: 'german',
    captionTone: 'direct, quality-focused, precise',
  },
  spain: {
    id: 'spain', label: 'Spain', flag: '🇪🇸', continent: 'Europe',
    settings: ['Barcelona Gothic Quarter', 'Madrid Retiro park', 'Mediterranean beach', 'vibrant Valencia street'],
    lightDescription: 'warm Mediterranean sunshine',
    aesthetic: 'Spanish vibrant modern',
    captionLanguage: 'spanish_spain',
    captionTone: 'passionate, lively, social',
  },
  italy: {
    id: 'italy', label: 'Italy', flag: '🇮🇹', continent: 'Europe',
    settings: ['Milan fashion district', 'Rome cobblestone street', 'Amalfi coast terrace', 'Florence piazza'],
    lightDescription: 'rich golden Italian sunlight',
    aesthetic: 'Italian classic elegance',
    captionLanguage: 'french', // TBD, keeping type simple
    captionTone: 'elegant, passionate, high-quality',
  },
  usa_urban: {
    id: 'usa_urban', label: 'USA - Urban', flag: '🇺🇸', continent: 'Americas',
    settings: ['New York SoHo street', 'LA Venice Beach boardwalk', 'Chicago rooftop at dusk', 'Brooklyn warehouse district', 'Miami Art Deco backdrop'],
    lightDescription: 'golden hour urban American light',
    aesthetic: 'American urban streetwear, bold and confident',
    captionLanguage: 'english_us',
    captionTone: 'bold, direct, energetic, aspirational',
  },
  usa_suburban: {
    id: 'usa_suburban', label: 'USA - Suburban', flag: '🇺🇸', continent: 'Americas',
    settings: ['American suburban house porch', 'picket fence', 'green lawn', 'suburban park'],
    lightDescription: 'bright clear American sunlight',
    aesthetic: 'American suburban casual',
    captionLanguage: 'english_us',
    captionTone: 'relaxed, friendly, family-oriented',
  },
  canada: {
    id: 'canada', label: 'Canada', flag: '🇨🇦', continent: 'Americas',
    settings: ['Toronto skyline', 'Vancouver mountains backdrop', 'Montreal old port', 'Canadian pine forest'],
    lightDescription: 'crisp clear Northern light',
    aesthetic: 'Canadian outdoor functional',
    captionLanguage: 'english_us',
    captionTone: 'friendly, outdoorsy, polite',
  },
  brazil: {
    id: 'brazil', label: 'Brazil', flag: '🇧🇷', continent: 'Americas',
    settings: ['Rio de Janeiro beachfront', 'São Paulo urban graffiti wall', 'colorful favela staircase', 'Brazilian rainforest edge', 'modern São Paulo rooftop'],
    lightDescription: 'vibrant tropical Brazilian sunlight',
    aesthetic: 'vibrant Brazilian contemporary urban',
    captionLanguage: 'portuguese_br',
    captionTone: 'vibrant, fun, community-driven, warm',
  },
  mexico: {
    id: 'mexico', label: 'Mexico', flag: '🇲🇽', continent: 'Americas',
    settings: ['Mexico City Roma Norte', 'Oaxaca colorful street', 'Tulum beach aesthetic', 'modern CDMX architecture'],
    lightDescription: 'warm bright Mexican sunlight',
    aesthetic: 'Mexican contemporary vibrant',
    captionLanguage: 'spanish_latam',
    captionTone: 'vibrant, welcoming, cultural',
  },
  colombia: {
    id: 'colombia', label: 'Colombia', flag: '🇨🇴', continent: 'Americas',
    settings: ['Medellín Poblado', 'Bogotá Candelaria', 'Cartagena colorful walls', 'Colombian coffee region'],
    lightDescription: 'bright tropical Andean light',
    aesthetic: 'Colombian vibrant urban',
    captionLanguage: 'spanish_latam',
    captionTone: 'energetic, joyful, welcoming',
  },
  argentina: {
    id: 'argentina', label: 'Argentina', flag: '🇦🇷', continent: 'Americas',
    settings: ['Buenos Aires Palermo', 'Puerto Madero', 'Patagonian landscape', 'classic Cafe in BA'],
    lightDescription: 'soft Southern hemisphere light',
    aesthetic: 'Argentine classic urban',
    captionLanguage: 'spanish_latam',
    captionTone: 'passionate, sociable, confident',
  },
  nigeria: {
    id: 'nigeria', label: 'Nigeria', flag: '🇳🇬', continent: 'Africa',
    settings: ['Lagos Victoria Island skyline', 'colorful Lekki market', 'modern Abuja street', 'Nigerian fabric market', 'Lagos waterfront'],
    lightDescription: 'rich warm West African sunlight',
    aesthetic: 'Afrobeats-inspired modern Lagos fashion',
    captionLanguage: 'english_ng',
    captionTone: 'energetic, bold, culturally proud, viral',
  },
  south_africa: {
    id: 'south_africa', label: 'South Africa', flag: '🇿🇦', continent: 'Africa',
    settings: ['Cape Town waterfront', 'Johannesburg Maboneng', 'Table Mountain backdrop', 'modern SA winery'],
    lightDescription: 'bright clear Southern African light',
    aesthetic: 'South African modern contemporary',
    captionLanguage: 'afrikaans_english',
    captionTone: 'dynamic, scenic, vibrant',
  },
  kenya: {
    id: 'kenya', label: 'Kenya', flag: '🇰🇪', continent: 'Africa',
    settings: ['Nairobi skyline', 'Kenyan savannah lodge', 'Mombasa coastal vibe', 'Westlands cafes'],
    lightDescription: 'warm equatorial sunlight',
    aesthetic: 'Kenyan vibrant outdoor',
    captionLanguage: 'swahili_english',
    captionTone: 'welcoming, vibrant, natural',
  },
  ghana: {
    id: 'ghana', label: 'Ghana', flag: '🇬🇭', continent: 'Africa',
    settings: ['Accra coastline', 'Osu Oxford Street', 'colorful Makola market', 'modern Accra architecture'],
    lightDescription: 'bright West African sunlight',
    aesthetic: 'Ghanaian contemporary bright',
    captionLanguage: 'english_ng',
    captionTone: 'warm, lively, cultural',
  },
  india_urban: {
    id: 'india_urban', label: 'India - Urban', flag: '🇮🇳', continent: 'Asia',
    settings: ['Mumbai marine drive', 'Delhi Hauz Khas Village', 'Bangalore tech park area', 'colorful Jaipur haveli', 'modern Mumbai café'],
    lightDescription: 'warm rich Indian afternoon light',
    aesthetic: 'modern Indian urban fusion',
    captionLanguage: 'hindi_english',
    captionTone: 'aspirational, warm, family-connected, proud',
  },
  india_tier2: {
    id: 'india_tier2', label: 'India - Tier 2', flag: '🇮🇳', continent: 'Asia',
    settings: ['traditional Indian bazaar', 'historical monuments', 'local street food stall', 'colorful neighborhood'],
    lightDescription: 'warm bright Indian sunlight',
    aesthetic: 'traditional Indian local',
    captionLanguage: 'hindi_english',
    captionTone: 'community-focused, traditional, value-driven',
  },
  china: {
    id: 'china', label: 'China', flag: '🇨🇳', continent: 'Asia',
    settings: ['Shanghai Bund', 'Beijing hutong', 'Shenzhen modern skyline', 'traditional Chinese garden'],
    lightDescription: 'soft urban Asian light',
    aesthetic: 'Chinese minimalist modern',
    captionLanguage: 'english_us',
    captionTone: 'modern, prestigious, innovative',
  },
  japan: {
    id: 'japan', label: 'Japan', flag: '🇯🇵', continent: 'Asia',
    settings: ['Tokyo Shibuya crossing', 'Kyoto traditional street', 'minimalist Japanese interior', 'cherry blossom park'],
    lightDescription: 'clean diffuse Japanese light',
    aesthetic: 'Japanese minimal perfection',
    captionLanguage: 'japanese',
    captionTone: 'polite, minimalist, high-quality',
  },
  south_korea: {
    id: 'south_korea', label: 'South Korea', flag: '🇰🇷', continent: 'Asia',
    settings: ['Seoul Gangnam street', 'Hongdae café alley', 'Bukchon Hanok village', 'Korean convenience store night', 'Seoul Han River park'],
    lightDescription: 'clean cool Korean urban light',
    aesthetic: 'K-fashion minimal aesthetic, clean and precise',
    captionLanguage: 'korean',
    captionTone: 'clean, trendy, precise, subtle flex',
  },
  indonesia: {
    id: 'indonesia', label: 'Indonesia', flag: '🇮🇩', continent: 'Asia',
    settings: ['Bali rice terrace', 'Jakarta modern café', 'Bali beach at sunrise', 'Yogyakarta temple alley', 'modern Jakarta skyline'],
    lightDescription: 'lush tropical Southeast Asian light',
    aesthetic: 'Indonesian modern',
    captionLanguage: 'indonesian',
    captionTone: 'friendly, warm, community-first, aspirational',
  },
  australia: {
    id: 'australia', label: 'Australia', flag: '🇦🇺', continent: 'Global',
    settings: ['Sydney Bondi beach', 'Melbourne laneway café', 'Australian outback edge', 'modern coastal home'],
    lightDescription: 'bright harsh Australian sunlight',
    aesthetic: 'Australian relaxed coastal',
    captionLanguage: 'english_us',
    captionTone: 'laid-back, outdoor, casual',
  },
  global: {
    id: 'global', label: 'Global / Worldwide', flag: '🌍', continent: 'Global',
    settings: ['clean modern studio with soft shadows', 'urban street with bokeh city background', 'bright minimalist apartment', 'outdoor urban terrace', 'rooftop with city skyline'],
    lightDescription: 'clean neutral studio lighting',
    aesthetic: 'international contemporary — universally appealing',
    captionLanguage: 'english_us',
    captionTone: 'contemporary, inclusive, energetic',
  },
} satisfies Record<RegionId, RegionContext>
