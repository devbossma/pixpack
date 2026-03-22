# Skill: UI/UX & Framer Motion (V2)

Read this before building or modifying any component.

---

## DESIGN SYSTEM

### Fonts
```ts
// app/layout.tsx
import { Syne } from 'next/font/google'
import localFont from 'next/font/local'

const syne = Syne({ subsets: ['latin'], weight: ['700','800'], variable: '--font-syne' })
const cabinet = localFont({
  src: '../public/fonts/CabinetGrotesk-Variable.woff2',
  variable: '--font-cabinet',
  fallback: ['DM Sans', 'system-ui'],
})
// Fallback if file missing: DM Sans from Google Fonts
```

### Icons — lucide-react ONLY, never emojis
```ts
import { Upload, Wand2, Download, Package, Globe, Sun, Moon,
         Scissors, ScanSearch, MessageSquare, Image, RefreshCw,
         ChevronDown, X, Search, ArrowRight, Check, Zap } from 'lucide-react'

// Sizes: 16=UI/button, 20=card, 24=section, 32=hero
```

### CSS Variables (dark default)
```css
:root {
  color-scheme: dark;
  --bg:           #0c0c0b;
  --surface:      #161614;
  --surface2:     #1f1f1c;
  --border:       #2a2a26;
  --text:         #f0ece3;
  --text-muted:   #6b6760;
  --accent:       #ff4d1c;
  --accent-hover: #e6441a;
  --accent2:      #ffb800;
  --accent3:      #00c27a;
  --output-bg:    #f5f2ed;
  --output-surface: #ffffff;
  --output-border:  #e2ddd5;
  --output-text:    #0c0c0b;
}
[data-theme="light"] {
  color-scheme: light;
  --bg:         #f5f2ed;
  --surface:    #ffffff;
  --surface2:   #f0ece4;
  --border:     #e2ddd5;
  --text:       #0c0c0b;
  --text-muted: #9e9a92;
  /* accent vars unchanged */
  --output-bg:  #f5f2ed;
  --output-surface: #ffffff;
  --output-border: #e2ddd5;
  --output-text: #0c0c0b;
}
```

---

## PAGE LAYOUT

```
HEADER (sticky) — Logo · ThemeToggle
HERO SECTION (collapses on CTA click — stays in DOM for SEO)
  ↓ id="workspace"
WORKSPACE (dark shell)
  UploadZone
  AudienceBuilder        ← age, gender, country, interest (NO angle picker)
  PlatformSelector       ← SINGLE-SELECT radio (V2)
  GenerateBar (sticky bottom)
══════════════════════════
OUTPUT GRID (light bg)    ← 2×2 grid of 4 A/B variations
```

---

## PLATFORM SELECTOR (V2 — SINGLE SELECT)

User picks ONE platform. The server generates 4 variations of that platform.

```tsx
// components/platforms/PlatformSelector.tsx
interface PlatformSelectorProps {
  value: string | null
  onChange: (platform: string) => void
}

// Visual: 6 cards in a grid
// One selected at a time — radio behavior
// Selected: accent border + filled bg + Check icon in corner
// Sub-label below grid: "We'll generate 4 A/B test variations for your chosen platform"
```

There is NO AngleSelector component in V2. The server handles all 4 angles automatically.

---

## OUTPUT GRID (V2 — 2×2 VARIATIONS)

```tsx
// components/output/OutputGrid.tsx
// Layout: grid-cols-1 sm:grid-cols-2 (always 2×2 on desktop, never 3-col)
// Header: "4 A/B Test Variations · {platformLabel}"

// platformLabel mapping:
const PLATFORM_LABELS: Record<string, string> = {
  instagram_post:  'Instagram Post',
  instagram_story: 'Instagram Story',
  tiktok:          'TikTok',
  facebook_post:   'Facebook Post',
  shopify_product: 'Shopify Product',
  web_banner:      'Web Banner',
}
```

---

## OUTPUT CARD (V2)

```tsx
// components/output/OutputCard.tsx
// Shows: image + variation label + angle pill + 3-tab copy

// Variation label: A/B/C/D (derived from image.variation 1→A, 2→B, etc.)
const VARIATION_LABELS = ['A', 'B', 'C', 'D']

// Angle pills (color-coded):
const ANGLE_COLORS: Record<string, string> = {
  lifestyle: 'bg-blue-500/20 text-blue-300',
  hero:      'bg-purple-500/20 text-purple-300',
  context:   'bg-amber-500/20 text-amber-300',
  closeup:   'bg-green-500/20 text-green-300',
}

// Ad copy tabs:
// "Awareness" | "Consideration" | "Conversion"
// Default: Awareness
// Tab content: image.adCopy.awareness / .consideration / .conversion

// Download button: triggers onDownload prop (email gate modal)
// Error state: gray placeholder + "Variation failed" + retry info
```

---

## LOADING SEQUENCE (V2)

```tsx
// components/generation/LoadingSequence.tsx
import { ScanSearch, Wand2, MessageSquare, Image, Package } from 'lucide-react'

const STEPS = [
  { id: 'analyzing', icon: ScanSearch,    title: 'Analyzing product',            subtitle: 'Reading materials, style & target audience' },
  { id: 'creative',  icon: Wand2,         title: 'Building 4 creative concepts', subtitle: 'Lifestyle, hero, context, and closeup angles' },
  { id: 'copy',      icon: MessageSquare, title: 'Writing ad copy',              subtitle: '3 copy variants per variation' },
  { id: 'images',    icon: Image,         title: 'Generating 4 images',          subtitle: 'Streaming as each completes — ~15s each' },
  { id: 'assembling',icon: Package,       title: 'Assembling your pack',         subtitle: 'Almost ready...' },
]

const LOADING_FACTS = [
  "💡 4 variations = 4 genuine A/B tests. Same product, 4 different creative angles.",
  "🎯 Each variation has its own copy — lifestyle copy feels different from hero copy.",
  "📊 A/B testing one platform beats scattering across 6 every time.",
  "⚡ Images stream as they complete — you'll see the first one in ~15 seconds.",
  "🌍 Ad copy is culturally adapted for your target market and audience.",
  "🚀 Ready to upload directly to Ads Manager when done.",
]
```

The loading sequence should show images appearing progressively in a mini-preview
as each SSE `image` event arrives. Small thumbnails appear one by one in the modal.

---

## GENERATE BAR (V2)

```tsx
// Visible when: image uploaded + platform selected + at least one audience field
// (No longer requires angle selection)

// Summary format: "4 variations · [Platform] · [Audience]"
// Example: "4 variations · Instagram Post · Women 25–34 · Fashion · South Korea 🇰🇷"

// CTA label: "Generate 4 Variations →"
```

---

## ANIMATION PATTERNS

```tsx
// Stagger container
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }

// Card entrance (output cards)
<motion.div
  initial={{ opacity: 0, scale: 0.94 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: index * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
  whileHover={{ y: -3 }}
/>

// Generate bar slide-up
<motion.div
  initial={{ y: 80, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 80, opacity: 0 }}
  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
/>

// Pill select
<motion.button whileTap={{ scale: 0.93 }} whileHover={{ scale: 1.04 }} />
```

---

## RESPONSIVE

```
Mobile  < 640px:  1-col output grid, full-width selectors
Tablet  640–1024: 2-col output grid (natural 2×2 for 4 cards)
Desktop > 1024px: 2-col output grid (still 2×2)
```

All touch targets: minimum 44×44px.

---

## AUDIENCE BUILDER

No changes to existing AudienceBuilder component except:
- Remove AngleSelector if it was included there
- The 4 remaining fields: Age Range, Gender, Country (searchable dropdown), Interest

The country selector remains a searchable dropdown with flag + label, grouped by continent.