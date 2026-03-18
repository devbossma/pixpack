# .agent/ — PixPack AI Agent Brain

This folder is the complete operating manual for any AI coding agent working on PixPack.
**Read everything in `rules/` before writing a single line of code.**
**Read the relevant `skills/` file before implementing each feature.**

---

## RULES (mandatory — read ALL before starting)

| File | What it covers |
|---|---|
| `rules/INSTRUCTIONS.md` | Global persona, stack, code standards, verified model strings, PM checklist |

---

## SKILLS (read the relevant one before each feature)

| File | When to read it |
|---|---|
| `skills/ui-ux-motion.md` | Before ANY component, layout, style, animation, or theme work |
| `skills/smart-outputs.md` | Before implementing the output layer — ad copy, scores, descriptions, schedule |
| `skills/architecture-flow.md` | Before touching any API route or pipeline code |
| `skills/ai-concurrency.md` | Before writing any Gemini or Imagen 3 calls |
| `skills/types-and-validation.md` | Before writing any TypeScript types or Zod schemas |
| `skills/client-zip-handling.md` | Before implementing download functionality |
| `skills/seo.md` | Before touching layout.tsx, page.tsx, metadata, or deploying |

---

## WHAT PIXPACK GENERATES PER PACK

Every single generation produces ALL of the following:

```
✦ 6 images            → Imagen 3, platform-native dimensions, culturally adapted
✦ 6 captions          → Localized language + tone for target market
✦ 18 ad copy variants → 3 per image: awareness / consideration / conversion
✦ 6 engagement scores → AI-predicted 1–10 score with reason + improvement tip
✦ 1 product listing   → Shopify-ready title, bullets, SEO meta
✦ 1 posting schedule  → Best day/time per platform for target geography
```

---

## THE 3 THINGS THAT MAKE PIXPACK WIN

1. **Cultural intelligence** — Not just "product on nice background." Scenes, lighting,
   and copy are adapted to the specific target market. Morocco looks Moroccan.
   Seoul looks Seoul. This is the core differentiator.

2. **Smart outputs** — Competitors give you images. PixPack gives you a complete
   campaign: images + ad copy + engagement scores + product description + schedule.
   It answers "how do I sell more?" not just "how do I get content?"

3. **Sub-60-second delivery** — Everything fires in parallel. Images + captions +
   ad copy + scores all generate simultaneously. See `ai-concurrency.md`.

---

## VERIFIED API DETAILS

```
Gemini model:   gemini-2.5-flash        ← tested, confirmed working
Imagen model:   imagen-3.0-generate-001 ← use exactly this string
Photoroom API:  https://image-api.photoroom.com/v2/segment
```

---

## BUILD ORDER FOR MVP

```
Phase 1 — Foundation
  1.  types/index.ts                    ← ALL types including smart output types
  2.  lib/validation.ts                 ← Zod schemas
  3.  lib/config.ts                     ← siteConfig, AGE_RANGES, GENDERS, INTERESTS, ANGLES
  4.  lib/platforms.ts                  ← PLATFORM_SPECS
  5.  lib/regions.ts                    ← REGIONS global database (15+ regions)
  6.  lib/vertex.ts                     ← Vertex AI client (credentials from JSON, not file path)
  7.  lib/photoroom.ts                  ← background removal
  8.  lib/prompts.ts                    ← ALL prompt builders including ad copy + scores

Phase 2 — UI (read ui-ux-motion.md fully before starting)
  9.  globals.css                       ← full CSS variable theme system (dark + light)
  10. app/layout.tsx                    ← fonts, metadata, body structure
  11. components/ui/ThemeToggle.tsx     ← dark/light toggle with localStorage
  12. components/layout/Topbar.tsx      ← logo + theme toggle
  13. components/layout/Sidebar.tsx     ← full sidebar shell
  14. components/ui/PillSelector.tsx    ← reusable pill selector
  15. components/audience/CountrySelector.tsx ← searchable dropdown
  16. components/platforms/PlatformGrid.tsx   ← platform cards
  17. components/upload/UploadZone.tsx  ← drag + drop
  18. components/hero/HeroSection.tsx   ← SEO hero with DOM-persistent collapse
  19. components/generation/LoadingSequence.tsx ← Framer Motion 6-step loader
  20. components/output/OutputCard.tsx  ← 3-tab card: Image / Ad Copy / Score
  21. components/output/PackSummary.tsx ← 4 metric cards
  22. components/output/OutputGrid.tsx  ← responsive grid
  23. components/output/ProductDescriptionPanel.tsx
  24. components/output/PostingSchedulePanel.tsx
  25. components/output/DownloadButton.tsx ← JSZip client-side

Phase 3 — Logic
  26. hooks/useUpload.ts                ← file validation + base64
  27. hooks/useGeneration.ts            ← GenerationState machine + mock mode
  28. app/api/generate/route.ts         ← full parallel pipeline orchestrator

Phase 4 — Wire up
  29. app/page.tsx                      ← compose layout + JSON-LD

Phase 5 — Polish
  30. Mobile responsive pass
  31. Error states pass
  32. SEO pass
  33. Deploy to Vercel
```

**Rule: Complete each phase fully before starting the next.**
**Rule: In Phase 2, use mock data for generation — no real API calls yet.**
**Rule: Types before logic. Logic before UI. Never reverse.**

---

## ROUTING ARCHITECTURE — TWO SEPARATE PAGES

```
app/
  page.tsx          ← Landing page ONLY — hero, SEO, CTA, no sidebar, no workspace
  app/
    page.tsx        ← Workspace ONLY — sidebar + output panel, no hero content
  layout.tsx        ← Shared: fonts, metadata, ThemeToggle in topbar
```

**`/` (Landing page):**
- Full-screen hero with H1, subheadline, feature pills, CTA button
- SEO feature cards always in DOM
- CTA navigates to `/app` — does NOT collapse in place
- No sidebar. No workspace. Clean.

**`/app` (Workspace):**
- Topbar + sidebar + output panel
- Sidebar: upload, audience, platforms, angles — NO generate button initially
- Generate button appears in sidebar only when: image uploaded + audience configured + 1+ platform + 1+ angle
- Output panel starts empty, fills after generation

---

## UPLOAD ZONE — CHANGE IMAGE FIX

The change image bug is caused by reusing the same `<input type="file">` element.
Fix: reset the input value after each selection.

```tsx
// hooks/useUpload.ts
function resetFileInput(inputRef: React.RefObject<HTMLInputElement>) {
  if (inputRef.current) {
    inputRef.current.value = ''  // ← this is the fix
  }
}

// In UploadZone.tsx — call resetFileInput after every file selection
// including the "change image" click handler
// This forces the browser to fire onChange even if the same file is selected
```

---

## DOWNLOAD GATE — FLOW SUMMARY

See `skills/download-gate.md` for full implementation.

```
User clicks "Download Pack"
  → DownloadGateModal appears
  → User enters email
  → Server: check rate limit (3/day per email, 5/day per IP)
  → ALLOWED: assemble ZIP → upload to Supabase Storage → send signed URL by email
  → RATE LIMITED: show ShareToUnlock → user shares on X/Instagram/LinkedIn → unlock granted → retry
```

No ZIP is ever downloaded directly in the browser.
All ZIPs live in Supabase Storage with 24h signed URLs.
