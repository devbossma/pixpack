# PixPack — Deployment Guide

## What to push to git

### PUSH THESE ✅
Everything in the project EXCEPT what is listed under "Never push" below.
Specifically confirm these are included:
- app/              (all Next.js pages and API routes)
- components/       (all UI components)
- hooks/            (all hooks)
- lib/              (all utility functions — NO secrets inside)
- public/           (static assets, fonts)
- scripts/          (test scripts — already gitignored but the folder is fine)
- types/            (if exists as separate folder)
- .env.example      (safe — contains NO real values)
- .gitignore
- next.config.ts
- package.json
- package-lock.json (or yarn.lock / pnpm-lock.yaml)
- tsconfig.json
- tailwind.config.ts (if exists)
- postcss.config.js (if exists)
- DEPLOY.md (this file)

### NEVER PUSH ❌
.env.local              ← your real API keys
.env                    ← any real env file
service-account.json    ← Google private key
*.key.json              ← any credential file
.next/                  ← build output (Vercel builds this itself)
node_modules/           ← dependencies (Vercel installs these itself)

---

## Vercel Environment Variables

Add these in: Vercel Dashboard → Your Project → Settings → Environment Variables

Set scope to "Production" + "Preview" for all:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your production domain, e.g. `https://getpixpack.com` |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP Console top bar |
| `GOOGLE_CLOUD_LOCATION` | `us-central1` |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | `cat service-account.json \| tr -d '\n'` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `PHOTOROOM_API_KEY` | photoroom.com/api |
| `RESEND_API_KEY` | resend.com/api-keys |
| `RESEND_FROM_DOMAIN` | Your verified sending domain |
| `DOWNLOAD_SECRET` | `openssl rand -base64 32` |
| `CRON_SECRET` | `openssl rand -base64 32` |

⚠️  DO NOT add `GOOGLE_APPLICATION_CREDENTIALS` (the file path) to Vercel.
    Vercel is serverless — there is no file system. Use `GOOGLE_APPLICATION_CREDENTIALS_JSON` instead.

---

## Deploy steps

1. `git init` (if not already a repo)
2. `git add .`
3. `git status` — VERIFY no `.env` files or `service-account.json` appear in the staged list
4. `git commit -m "Initial commit"`
5. Push to GitHub
6. Connect repo to Vercel
7. Add all environment variables in Vercel dashboard
8. Deploy

## Pre-deploy verification commands

Run these locally before pushing:

```bash
# 1. TypeScript — zero errors required
npx tsc --noEmit

# 2. Check nothing sensitive is staged
git status
git diff --cached --name-only

# 3. Verify .gitignore is working
git check-ignore -v .env.local
git check-ignore -v service-account.json
# Both should output a line confirming they are ignored
# If they output nothing — they are NOT ignored, fix .gitignore before pushing

# 4. Test production build locally
npm run build

# 5. Verify the build succeeds and check for warnings
```
