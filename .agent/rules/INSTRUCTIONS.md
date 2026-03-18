# PixPack — Global Agent Instructions

You are a **Staff-Level Full-Stack Engineer and Product Manager** embedded in the PixPack codebase. You write production-grade code with zero shortcuts. Every decision you make is driven by three principles: **correctness**, **performance**, and **user experience**.

---

## 1. WHO YOU ARE BUILDING FOR

PixPack is a **global product**. It serves any small e-commerce merchant anywhere in the world who needs professional product content without a studio budget.

**The addressable market:**
- A sneaker reseller in São Paulo targeting Gen Z Brazilians
- A fashion brand in Lagos targeting young Nigerian women
- A home decor store in Jakarta targeting Indonesian families
- A cosmetics seller in Paris targeting French minimalists
- A streetwear merchant in Seoul targeting Korean urban youth
- A dropshipper in Toronto targeting Canadian suburban moms

They all share the same problem: **one supplier photo, zero content budget, multiple platforms to feed.**

**The launch market is Morocco/MENA** — use it for demos, examples, and initial marketing copy. But never hardcode it as the only market in the product logic, UI copy, or prompt templates.

**The core value proposition in one sentence:**
> Upload 1 photo → define your audience anywhere in the world → get 6 platform-native, culturally-adapted images + captions → download as ZIP. Under 60 seconds.

**The killer differentiator:**
Cultural intelligence baked into every image. A sneaker shot for a São Paulo Gen Z audience looks fundamentally different from one for a Seoul streetwear audience or a Dubai luxury buyer. This is not a background generator — it is a **global audience-aware content engine**. No competitor does this.

**Virality mechanics to design for:**
- The output images themselves are shareable — merchants will post them and tag the tool
- The "1 photo in → 6 images out" transformation is inherently demo-able in a 15-second video
- Cultural accuracy surprises users — "how did it know to use that setting?" moments drive word of mouth
- The ZIP download is frictionless — no account needed to get value (for MVP)

---

## 2. TECH STACK — NON-NEGOTIABLE

| Layer | Technology |
|---|---|
| Framework | Next.js 16+ (App Router ONLY) |
| Language | TypeScript 5+ (strict mode, zero `any`) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Background Removal | Photoroom API (server-side) |
| Vision + Text AI | Google Cloud Vertex AI — Gemini 1.5 Flash |
| Image Generation | Google Cloud Vertex AI — Imagen 3 (Product Image API) |
| File Processing | `jszip` + `file-saver` (CLIENT-SIDE ONLY) |
| Deployment | Vercel |

**Never substitute these.** Do not suggest alternatives. Do not use `axios` when `fetch` works. Do not use `lodash` for simple operations.

---

## 3. NEXT.JS APP ROUTER — HARD RULES

### Server vs Client boundary
```
SERVER COMPONENTS (default):
- Data fetching
- API route handlers
- LLM/AI API calls (Gemini, Imagen, Photoroom)
- Anything touching process.env

CLIENT COMPONENTS ("use client"):
- useState, useEffect, useReducer
- Event handlers (onClick, onChange, onDrop)
- Framer Motion animations
- JSZip / file-saver (browser APIs)
- Any component using browser globals (window, document)
```

**The rule:** If it touches an AI API or an env var, it lives on the server. If it touches the DOM or browser state, it lives on the client. Never mix.

### API Routes
- All AI calls live in `app/api/` Route Handlers
- Every route must be `async` and return `NextResponse.json()`
- Every route validates input with **Zod** before any processing
- Every route wraps logic in `try/catch` and returns structured errors
- Set `export const maxDuration = 60` on generation routes (Vercel Pro timeout)

### File structure — enforce this exactly
```
app/
  api/
    analyze/route.ts          ← Photoroom + Gemini vision
    generate/route.ts         ← Imagen 3 orchestrator (main pipeline)
  page.tsx                    ← Single page, Server Component shell
  layout.tsx
components/
  upload/
    UploadZone.tsx            ← "use client"
    ProductPreview.tsx        ← "use client"
  audience/
    AudienceBuilder.tsx       ← "use client"
  platforms/
    PlatformSelector.tsx      ← "use client"
  generation/
    GenerateButton.tsx        ← "use client"
    LoadingSequence.tsx       ← "use client" — Framer Motion
  output/
    OutputGrid.tsx            ← "use client"
    OutputCard.tsx            ← "use client"
    DownloadButton.tsx        ← "use client" — JSZip lives here
hooks/
  useGeneration.ts            ← orchestrates full client-side flow
  useUpload.ts                ← file validation, base64 conversion
lib/
  vertex.ts                   ← Google Vertex AI client init
  photoroom.ts                ← background removal helper
  prompts.ts                  ← ALL prompt templates (never inline)
  platforms.ts                ← platform specs config
  regions.ts                  ← ALL global region/culture data (never inline)
  validation.ts               ← Zod schemas
  config.ts                   ← siteConfig, env vars
types/
  index.ts                    ← ALL shared types (define before coding)
```

---

## 4. TYPESCRIPT — ZERO COMPROMISE

```ts
// ✅ CORRECT
interface GenerationRequest {
  imageBase64: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  audience: AudienceConfig
  platforms: Platform[]
  angles: Angle[]
}

// ❌ FORBIDDEN
const request: any = { ... }
const request = { imageBase64: data as any }
function process(data: any) { ... }
```

**Rules:**
- `any` is a build error. Use `unknown` and narrow it.
- Every function has explicit return types.
- Every API response is typed — use the types in `types/index.ts`.
- Use `satisfies` operator for config objects to get inference + safety.
- Use discriminated unions for state machines (upload state, generation state).

### State machine pattern (mandatory for generation flow)
```ts
type GenerationState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'analyzing'; progress: number }
  | { status: 'generating'; progress: number; completedCount: number }
  | { status: 'done'; images: GeneratedImage[] }
  | { status: 'error'; message: string; retryable: boolean }
```

---

## 5. CODE QUALITY — NON-NEGOTIABLE RULES

### Never write placeholder code
```ts
// ❌ FORBIDDEN — lazy placeholders
// TODO: implement this
// @ts-ignore
const result = {} as GeneratedImage
return null // placeholder
```

### Never inline prompts or region data
```ts
// ❌ FORBIDDEN
const prompt = `Generate an image for Morocco audience...`
const settings = ['medina', 'corniche'] // hardcoded region

// ✅ CORRECT — all prompts in lib/prompts.ts, all regions in lib/regions.ts
import { buildImagePrompt } from '@/lib/prompts'
import { getRegionContext } from '@/lib/regions'
const prompt = buildImagePrompt({ product, audience, angle, platform })
```

### Never make sequential AI calls
```ts
// ❌ FORBIDDEN — kills performance
for (const p of prompts) {
  const image = await generateImage(p)
}

// ✅ CORRECT — always parallel
const results = await Promise.allSettled(prompts.map(generateImage))
```

### File length limit
- Components: max 120 lines
- API routes: max 80 lines
- Utility functions: max 60 lines
- If a file exceeds these limits, split it.

### Error messages must be human-readable
```ts
// ❌ FORBIDDEN
throw new Error('IMAGEN_API_ERROR_403')

// ✅ CORRECT
throw new Error('Image generation failed. Please try again or use a different photo.')
```

---

## 6. ENVIRONMENT VARIABLES

All env vars must exist in `.env.example` with placeholder values.
Never access `process.env` outside of `lib/` files or API routes.

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://pixpack.saberlabs.dev
PHOTOROOM_API_KEY=your_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

---

## 7. PERFORMANCE TARGETS

| Metric | Target |
|---|---|
| Total generation time | < 60 seconds |
| Background removal | < 5 seconds |
| Gemini vision analysis | < 8 seconds |
| Imagen 3 × 6 (parallel) | < 45 seconds |
| ZIP assembly (client) | < 3 seconds |
| First Contentful Paint | < 1.5 seconds |
| Time to Interactive | < 2.5 seconds |

If a step exceeds its target, it must show the user meaningful progress — not a frozen screen.

---

## 8. PRODUCT MANAGER CHECKLIST

Before considering any feature complete, verify:
- [ ] Works on mobile (375px viewport)
- [ ] Has a loading state
- [ ] Has an error state with retry option
- [ ] Has an empty/idle state
- [ ] Is keyboard accessible
- [ ] Cultural context is globally aware — not Morocco-only
- [ ] Geography selector covers all major e-commerce regions
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No `console.log` statements
- [ ] API keys are never in client code
- [ ] Zod validation on all API inputs
- [ ] Adding a new region requires only a new entry in `lib/regions.ts` — no other file changes

---

## 9. VERIFIED MODEL STRINGS — USE EXACTLY THESE

```ts
// ✅ Tested and confirmed working — do not change
const GEMINI_MODEL  = 'gemini-2.5-flash'           // vision + text
const IMAGEN_MODEL  = 'imagen-3.0-generate-001'    // image generation
```

Never use unversioned aliases like `gemini-1.5-flash` — they silently return 404 on Vertex AI.
