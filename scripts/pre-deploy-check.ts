/**
 * scripts/pre-deploy-check.ts
 *
 * Run before every deploy: npx tsx scripts/pre-deploy-check.ts
 *
 * Checks for common security mistakes that would leak secrets to Vercel logs,
 * git history, or the browser.
 */

import * as fs   from 'fs'
import * as path from 'path'
import * as glob from 'glob'  // install if needed: npm install glob

const RED   = '\x1b[31m'
const GREEN = '\x1b[32m'
const AMBER = '\x1b[33m'
const RESET = '\x1b[0m'

let passed = 0
let failed = 0
let warned = 0

function check(label: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`${GREEN}✓${RESET} ${label}`)
    passed++
  } else {
    console.log(`${RED}✗${RESET} ${label}${detail ? `\n  → ${detail}` : ''}`)
    failed++
  }
}

function warn(label: string, detail?: string): void {
  console.log(`${AMBER}⚠${RESET} ${label}${detail ? `\n  → ${detail}` : ''}`)
  warned++
}

async function main() {
  console.log('\nPixPack Pre-Deploy Security Check\n' + '─'.repeat(40))

  // 1. Critical files exist
  check('.gitignore exists',    fs.existsSync('.gitignore'))
  check('.env.example exists',  fs.existsSync('.env.example'))
  check('DEPLOY.md exists',     fs.existsSync('DEPLOY.md'))
  check('next.config.ts exists',fs.existsSync('next.config.ts') || fs.existsSync('next.config.js'))

  // 2. Dangerous files are NOT present (would be pushed to git)
  const dangerousFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'service-account.json',
  ]
  for (const f of dangerousFiles) {
    const exists = fs.existsSync(f)
    if (exists) {
      // Check if gitignored
      check(`${f} is gitignored (not committed)`, !exists,
        `File exists AND is not gitignored — run: git check-ignore -v ${f}`)
    }
  }

  // 3. .env.example has no real-looking values
  if (fs.existsSync('.env.example')) {
    const content = fs.readFileSync('.env.example', 'utf-8')
    const hasRealKey = content.match(/AIza[A-Za-z0-9_-]{35}/) ||
                       content.match(/re_[A-Za-z0-9]{32,}/) ||
                       content.match(/"private_key"/)
    check('.env.example contains no real secrets', !hasRealKey,
      'Found what looks like a real API key in .env.example — replace with placeholder')
  }

  // 4. No NEXT_PUBLIC_ secret vars
  const allFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**']
  })

  const secretPrefixes = [
    'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE',
    'NEXT_PUBLIC_PHOTOROOM',
    'NEXT_PUBLIC_GOOGLE_APPLICATION_CREDENTIALS',
    'NEXT_PUBLIC_RESEND',
    'NEXT_PUBLIC_DOWNLOAD_SECRET',
    'NEXT_PUBLIC_CRON_SECRET',
  ]

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const prefix of secretPrefixes) {
      if (content.includes(prefix)) {
        check(`No NEXT_PUBLIC_ secret in ${file}`, false,
          `Found ${prefix} — this would expose the secret to the browser`)
      }
    }
  }

  // 5. Client components don't import server-only libs
  const clientFiles = allFiles.filter(f => {
    const content = fs.readFileSync(f, 'utf-8')
    return content.includes("'use client'") || content.includes('"use client"')
  })

  const serverOnlyImports = [
    'vertex-client',
    'claude-client',
    'analyze.service',
    'generate.service',
  ]

  for (const file of clientFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const imp of serverOnlyImports) {
      if (content.includes(imp)) {
        check(`Client file ${file} doesn't import server-only module`, false,
          `Found import of '${imp}' in a 'use client' file — this would break the build`)
      }
    }
  }

  // 6. maxDuration is set correctly on generate route
  const generateRoute = 'app/api/generate/route.ts'
  if (fs.existsSync(generateRoute)) {
    const content = fs.readFileSync(generateRoute, 'utf-8')
    const hasDuration = content.includes('maxDuration = 180') || content.includes('maxDuration = 120')
    check('Generate route has maxDuration set', hasDuration,
      'Add: export const maxDuration = 180')
    if (content.includes('maxDuration = 60')) {
      warn('maxDuration is 60s — may timeout for 6 image generation. Consider 180s.')
    }
  } else {
    warn(`${generateRoute} not found — skipping maxDuration check`)
  }

  // 7. TypeScript build
  console.log('\nRunning tsc --noEmit...')
  const { execSync } = require('child_process')
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' })
    check('TypeScript: zero errors', true)
  } catch (e: any) {
    check('TypeScript: zero errors', false, e.stdout?.toString().slice(0, 300))
  }

  // Summary
  console.log('\n' + '─'.repeat(40))
  console.log(`${GREEN}${passed} passed${RESET}  ${RED}${failed} failed${RESET}  ${AMBER}${warned} warnings${RESET}`)

  if (failed > 0) {
    console.log(`\n${RED}NOT SAFE TO DEPLOY — fix all failures above first.${RESET}\n`)
    process.exit(1)
  } else if (warned > 0) {
    console.log(`\n${AMBER}Review warnings before deploying.${RESET}\n`)
  } else {
    console.log(`\n${GREEN}All checks passed. Safe to deploy.${RESET}\n`)
  }
}

main().catch(console.error)
