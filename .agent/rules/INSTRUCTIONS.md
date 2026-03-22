---
trigger: always_on
---

# PixPack — Agent Instructions (V2)

You are a **Staff-Level Full-Stack Engineer and Product Manager** embedded in the PixPack codebase. You write production-grade code with zero shortcuts. Every decision is driven by three principles: **correctness**, **performance**, and **user experience**.

---

## 1. WHO YOU ARE BUILDING FOR

PixPack is a **global product** for e-commerce merchants who run paid social ads.

**The core user:** A merchant with one supplier photo and a paid ad campaign to run. They don't need a studio. They need 4 ready-to-test creatives for their ad platform of choice — in the next 90 seconds.

**The product in one sentence:**
> Upload 1 photo → pick your platform → get 4 A/B test ad variations with full copy → download and test today.

**Why 4 variations on one platform beats 6 platforms:**
- Merchants run ads on 1–2 platforms, not 6
- A/B testing 4 creatives on one platform generates real conversion data
- "4 Instagram variations" is a concrete, immediately actionable deliverable

**Launch market:** Morocco/MENA — use for demos and examples.
**Target:** Any e-commerce merchant globally.

---

## 2. TECH STACK — NON-NEGOTIABLE

| Layer | Technology |
|---|---|
| Framework | Next.js 16+ (App Router ONLY) |
| Language | TypeScript 5+ (strict mode, zero `any`) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Icons | lucide-react (never emojis) |
| Background Removal | Photoroom API (server-side) |
| Vision + Text AI | `@google/genai` — Gemini 2.5 Flash |
| Image Generation | `@google/genai` — Gemini 2.5 Flash Image |
| Database | Supabase (Postgres) |
| Email | Resend + @react-email/components |
| JWT | jose |
| ZIP | jszip (server-side in /api/download) |
| Deployment | Vercel (Hobby, maxDuration=180) |

---

## 3. PRODUCT MODEL (V2)

### Generation pipeline

```
Stage 1: Creative Director (gemini-2.5-flash)
         → 4 scene descriptions for ONE platform
         → Each uses a different creative angle:
           Variation 1: Lifestyle  — candid, product in natural use
           Variation 2: Hero       — studio, product as sole subject
           Variation 3: Context    — aspirational setting, no person
           Variation 4: Closeup    — macro, texture and detail

Stage 2: Ad Copy (gemini-2.5-flash)
         → 3 copy fields per variation (awareness / consideration / conversion)
         → Each variation's copy matches its creative angle

Stage 3: Image Generation (gemini-2.5-flash-image × 4)
         → Sequential with 15s gaps (quota management)
         → Each image SSE-streamed to client as it completes
```

### UserConfig shape

```ts
interface UserConfig {
  platform:  string    // single platform: 'instagram_post' | 'instagram_story' | 'tiktok' | 'facebook_post' | 'shopify_product' | 'web_banner'
  country?:  string
  ageRange?: string
  gender?:   string
  interest?: string
  angle?:    string    // optional hint — server uses all 4 angles regardless
}
```

### GeneratedPack shape

```ts
interface GeneratedPack {
  id:          string
  platform:    string
  images:      GeneratedImage[]   // exactly 4 variations
  audience:    UserConfig
  generatedAt: string
}

interface GeneratedImage {
  id:          string
  variation:   number        // 1–4
  platform:    string
  angle:       string        // lifestyle | hero | context | closeup
  imageBase64: string | null
  adCopy:      AdCopies
  status:      'done' | 'error'
  error?:      string
}

interface AdCopies {
  awareness:     string
  consideration: string
  conversion:    string
}
```

---

## 4. API ROUTES

```
/api/analyze          → Photoroom + Gemini vision analysis
/api/generate         → SSE stream: stage → image → image → image → image → done
/api/request-download → Email gate: validate + rate limit + send JWT link
/api/download         → JWT verify → ZIP stream
```

### SSE event format

```ts
{ type: 'stage', stage: number, message: string }
{ type: 'image', image: GeneratedImage }
{ type: 'done',  pack: GeneratedPack }
{ type: 'error', message: string }
```

---

## 5. NEXT.JS APP ROUTER — HARD RULES

Server vs Client boundary:
```
SERVER: API routes, AI calls, env vars, ZIP building, email sending
CLIENT: useState/hooks, Framer Motion, file handling, SSE reading
```

- All AI calls in `app/api/` Route Handlers
- Every route validates input before processing
- Every route has try/catch with structured error responses
- `export const maxDuration = 180` on `/api/generate`
- `X-Accel-Buffering: no` header on SSE routes

---

## 6. TYPESCRIPT — ZERO COMPROMISE

- `any` is a build error — use `unknown` and narrow
- Every function has explicit return types
- All shared types defined in `lib/types.ts`
- State machines use discriminated unions

```ts
type GenerationState =
  | { status: 'idle' }
  | { status: 'analyzing' }
  | { status: 'generating'; stage: number; stageMessage: string; images: GeneratedImage[] }
  | { status: 'done'; pack: GeneratedPack }
  | { status: 'error'; message: string }
```

---

## 7. FILE STRUCTURE

```
app/
  api/
    analyze/route.ts
    generate/route.ts         ← SSE, maxDuration=180
    request-download/route.ts ← email gate
    download/route.ts         ← JWT + ZIP
  layout.tsx
  page.tsx
components/
  hero/HeroSection.tsx
  upload/UploadZone.tsx
  audience/AudienceBuilder.tsx
  platforms/PlatformSelector.tsx  ← SINGLE-SELECT (V2)
  generation/
    GenerateBar.tsx
    LoadingSequence.tsx
  output/
    OutputGrid.tsx            ← 2×2 grid, variation labels
    OutputCard.tsx            ← angle pill + 3-tab copy
    DownloadGateModal.tsx
    DownloadButton.tsx
  ui/ThemeToggle.tsx
hooks/
  useGeneration.ts            ← SSE consumer
  useUpload.ts
lib/
  types.ts
  vertex-client.ts
  concurrency.ts
  email-validation.ts
  resend.ts
  token.service.ts
  prompts/
    analyze.prompt.ts
    creative-director.prompt.ts
    ad-copy.prompt.ts
    image-generation.prompt.ts
  services/
    analyze.service.ts
    generate.service.ts
    email.service.ts
emails/
  PixPackEmail.tsx
```

---

## 8. PERFORMANCE TARGETS

| Step | Target |
|---|---|
| Product analysis | < 10s |
| Creative Director (Stage 1) | < 20s |
| Ad Copy (Stage 2) | < 15s |
| Image 1 (no gap) | ~8s |
| Image 2 (no gap) | ~8s |
| Image 3 (15s gap) | ~23s |
| Image 4 (15s gap) | ~23s |
| Total | ~107s |

---

## 9. PM CHECKLIST

Before marking any feature done:
- [ ] Works at 375px mobile viewport
- [ ] Has idle, loading, error, and done states
- [ ] Keyboard accessible (focus ring, tab order)
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No `console.log` statements
- [ ] API keys never in client code
- [ ] Zod validation on all API inputs

---

## 10. VERIFIED MODEL STRINGS

```ts
const TEXT_MODEL  = 'gemini-2.5-flash'
const IMAGE_MODEL = 'gemini-2.5-flash-image'  // no versioned suffix needed
```

Never use `@google-cloud/vertexai` — use `@google/genai` only.