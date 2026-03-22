# Skill: Architecture & Pipeline Flow (V2)

Read this before implementing any part of the pipeline.

---

## THE V2 PIPELINE

```
[1] UPLOAD         → Client: file validation + base64 via useUpload hook
[2] ANALYZE        → POST /api/analyze → Photoroom bg removal + Gemini vision
[3] GENERATE (SSE) → POST /api/generate → SSE stream of 3 stages + 4 images
[4] DOWNLOAD GATE  → POST /api/request-download → JWT email link
[5] DOWNLOAD       → GET /api/download?token= → ZIP stream
```

Steps 2–5 are server-side. Step 1 is client-only.

---

## STEP 2 — ANALYZE

`POST /api/analyze`
- Input: `{ imageBase64, mimeType, productHint? }`
- Photoroom removes background → returns clean PNG
- Gemini 2.5 Flash analyzes product → returns `ProductAnalysis`
- Response: `{ extractedImageUrl, analysis }`

The `extractedImageUrl` is stored in Supabase and re-fetched during generation.

---

## STEP 3 — GENERATE (V2 MODEL)

`POST /api/generate`
- Input: `{ productProfile, userConfig, marketingLanguage }`
- `userConfig.platform` is a **single string** — not an array
- Returns: `text/event-stream` (SSE)

### SSE Event sequence

```
data: {"type":"stage","stage":1,"message":"Building 4 creative concepts..."}
data: {"type":"stage","stage":2,"message":"Writing ad copy for each variation..."}
data: {"type":"stage","stage":3,"message":"Generating 4 image variations..."}
data: {"type":"image","image":{...GeneratedImage variation 1}}
data: {"type":"image","image":{...GeneratedImage variation 2}}
data: {"type":"image","image":{...GeneratedImage variation 3}}
data: {"type":"image","image":{...GeneratedImage variation 4}}
data: {"type":"done","pack":{...GeneratedPack}}
```

Images stream one by one with gaps between images 2–4 (quota management).
Client shows each image as it arrives — do NOT wait for all 4.

### Route handler requirements

```ts
export const maxDuration = 180
export const dynamic = 'force-dynamic'

// Critical headers for SSE on Vercel:
headers: {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
}
```

---

## STEP 4 — DOWNLOAD GATE

`POST /api/request-download`
- Input: `{ email, packId, imageCount, platforms }`
- Validates email (format + domain allowlist + disposable block)
- Rate limits: 3/day per email, 5/day per IP
- Saves pack to Supabase `packs` table
- Signs JWT (jose HS256, 24h, jti=UUID)
- Saves to `download_requests` table
- Sends email via Resend with download link
- Response: `{ success: true }`

---

## STEP 5 — DOWNLOAD

`GET /api/download?token=<JWT>`
- Verifies JWT signature and expiry
- Looks up jti in `download_requests`
- Checks `token_used = false`
- Fetches pack from `packs` table
- Builds ZIP:
  ```
  images/
    variation-A-lifestyle.png
    variation-B-hero.png
    variation-C-context.png
    variation-D-closeup.png
  ad_copy.txt
  README.txt
  ```
- Marks token as used
- Streams ZIP as `application/zip`

---

## DATA FLOW

```
Client                           Server
  │                                │
  ├─ [1] file → useUpload          │
  ├─ POST /api/analyze ───────────►│
  │                                ├─ Photoroom
  │                                ├─ Gemini vision
  │◄─ { extractedImageUrl, analysis }
  │                                │
  ├─ POST /api/generate ──────────►│
  │    platform: 'instagram_post'  ├─ Stage 1: Creative Director
  │                                ├─ Stage 2: Ad Copy
  │◄── SSE: stage events           ├─ Stage 3: Image 1 (no gap)
  │◄── SSE: image 1 ──────────────┤  Image 2 (no gap)
  │◄── SSE: image 2                │  Image 3 (15s gap)
  │◄── SSE: image 3                │  Image 4 (15s gap)
  │◄── SSE: image 4                │
  │◄── SSE: done ─────────────────┤
  │                                │
  ├─ [user clicks Download]        │
  ├─ POST /api/request-download ──►│
  │◄─ { success: true }            ├─ JWT email sent
  │                                │
  ├─ [user clicks email link]      │
  ├─ GET /api/download?token= ────►│
  │◄─ ZIP stream ─────────────────┤
```

---

## CONCURRENCY & QUOTA

Images 1–2: no gap (fresh quota)
Images 3–4: 15s pre-emptive gap (prevents 429s)

No retries. If a 429 hits, mark that image as error card and continue.
A partial pack (3/4 images) is better than a timeout that returns nothing.

Expected total time: ~90–110s well within 180s limit.

---

## SUPABASE TABLES

```sql
packs (
  id uuid primary key,
  email text,
  images_data jsonb,      -- GeneratedImage[] without base64
  platform text,
  audience jsonb,
  created_at timestamp
)

download_requests (
  id uuid primary key,
  pack_id uuid references packs(id),
  email text,
  ip_address text,
  jwt_token text,         -- jti claim
  token_used boolean default false,
  expires_at timestamp,
  downloaded_at timestamp,
  created_at timestamp
)
```