# Skill: Client-Side ZIP Handling

Read this file before implementing any download or file export functionality.

---

## THE GOLDEN RULE

**ZIP assembly NEVER happens on the server.**

Fetching 6 images (each potentially 1–3MB) and zipping them in a Vercel serverless function will:
1. Hit the 50MB response size limit
2. Consume massive memory (Lambda functions have 1GB max)
3. Risk timeout on slow connections
4. Cost significantly more per invocation

**All of this happens on the client, in the browser, using `jszip` and `file-saver`.**

---

## PACKAGE INSTALLATION

```bash
npm install jszip file-saver
npm install --save-dev @types/file-saver
```

---

## WHAT THE SERVER RETURNS

The `/api/generate` route returns image data as **base64 strings** embedded in the JSON response.
The client does NOT need to make additional fetch calls to download the images — they're already in memory.

```ts
// Server response shape
interface GeneratedImage {
  id: string
  angle: Angle
  platform: Platform
  platformSpec: PlatformSpec
  imageBase64: string        // ← "data:image/png;base64,iVBOR..."
  caption: string
  hashtags: string[]
  status: 'done' | 'error'
  error?: string
}
```

**Why base64 in response?**
- Imagen 3 returns images as base64 bytes — no intermediate storage needed
- Avoids CORS issues with cross-origin image URLs
- Works offline after initial generation
- No expiry issues (Replicate URLs expire, Vertex base64 doesn't)

---

## ZIP ASSEMBLY IMPLEMENTATION

```tsx
// components/output/DownloadButton.tsx
'use client'

import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { GeneratedImage } from '@/types'

interface DownloadButtonProps {
  images: GeneratedImage[]
  audienceSummary: string // e.g. "Women 25-34 Morocco"
}

export function DownloadButton({ images, audienceSummary }: DownloadButtonProps) {
  const [isZipping, setIsZipping] = useState(false)
  const [zipProgress, setZipProgress] = useState(0)

  async function handleDownloadAll() {
    setIsZipping(true)
    setZipProgress(0)

    try {
      const zip = new JSZip()
      const imagesFolder = zip.folder('images')!
      const captionsLines: string[] = [
        `PixPack Content Pack`,
        `Audience: ${audienceSummary}`,
        `Generated: ${new Date().toLocaleDateString()}`,
        `──────────────────────────\n`,
      ]

      const successfulImages = images.filter(img => img.status === 'done' && img.imageBase64)
      
      // Process each image
      successfulImages.forEach((img, index) => {
        // Convert base64 data URL to raw base64
        const base64Data = img.imageBase64.includes(',')
          ? img.imageBase64.split(',')[1]
          : img.imageBase64

        // Filename: pixpack_instagram_post_lifestyle.png
        const filename = `pixpack_${img.platform}_${img.angle}.png`
        imagesFolder.file(filename, base64Data, { base64: true })

        // Build captions file entry
        captionsLines.push(`📸 ${filename}`)
        captionsLines.push(`Platform: ${img.platformSpec.name} (${img.platformSpec.width}×${img.platformSpec.height}px)`)
        if (img.caption) captionsLines.push(`Caption: ${img.caption}`)
        if (img.hashtags.length) captionsLines.push(`Hashtags: ${img.hashtags.join(' ')}`)
        captionsLines.push('')

        // Update progress
        setZipProgress(Math.round(((index + 1) / successfulImages.length) * 80))
      })

      // Add captions.txt
      zip.file('captions.txt', captionsLines.join('\n'))

      // Add README
      zip.file('README.txt', buildReadme(images, audienceSummary))

      setZipProgress(90)

      // Generate ZIP blob
      const blob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (metadata) => {
          setZipProgress(90 + Math.round(metadata.percent * 0.1))
        }
      )

      setZipProgress(100)

      // Trigger download
      const timestamp = new Date().toISOString().slice(0, 10)
      saveAs(blob, `pixpack_${timestamp}.zip`)

    } catch (err) {
      console.error('ZIP assembly failed:', err)
      // Show toast error to user
    } finally {
      setIsZipping(false)
      setZipProgress(0)
    }
  }

  return (
    <motion.button
      onClick={handleDownloadAll}
      disabled={isZipping}
      whileTap={{ scale: 0.97 }}
      className="relative bg-[#0f0e0c] text-white font-semibold px-6 py-3 rounded-lg overflow-hidden disabled:opacity-70"
    >
      {/* Progress fill background */}
      {isZipping && (
        <motion.div
          className="absolute inset-0 bg-[#ff4d1c] origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: zipProgress / 100 }}
          transition={{ ease: 'easeOut' }}
        />
      )}
      
      <span className="relative z-10">
        {isZipping
          ? zipProgress < 100
            ? `Zipping... ${zipProgress}%`
            : 'Downloading...'
          : `⬇ Download All (${images.filter(i => i.status === 'done').length} images)`
        }
      </span>
    </motion.button>
  )
}
```

---

## SINGLE IMAGE DOWNLOAD

For downloading individual images from the output grid:

```ts
// utils/download.ts
export function downloadSingleImage(image: GeneratedImage): void {
  const base64Data = image.imageBase64.includes(',')
    ? image.imageBase64.split(',')[1]
    : image.imageBase64

  // Convert base64 to blob
  const byteCharacters = atob(base64Data)
  const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0))
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'image/png' })

  const filename = `pixpack_${image.platform}_${image.angle}.png`
  saveAs(blob, filename)
}
```

---

## COPY CAPTIONS TO CLIPBOARD

```ts
// utils/clipboard.ts
export async function copyAllCaptions(images: GeneratedImage[]): Promise<void> {
  const text = images
    .filter(img => img.status === 'done' && img.caption)
    .map(img =>
      [
        `── ${img.platformSpec.name} (${img.angle}) ──`,
        img.caption,
        img.hashtags.join(' '),
      ].join('\n')
    )
    .join('\n\n')

  await navigator.clipboard.writeText(text)
}
```

---

## README FILE CONTENT

```ts
function buildReadme(images: GeneratedImage[], audienceSummary: string): string {
  const successCount = images.filter(i => i.status === 'done').length
  const errorCount = images.filter(i => i.status === 'error').length

  return `PIXPACK — AI CONTENT PACK
═══════════════════════════

Generated: ${new Date().toLocaleString()}
Audience:  ${audienceSummary}
Images:    ${successCount} generated${errorCount > 0 ? `, ${errorCount} failed` : ''}

FILES IN THIS PACK
──────────────────
images/         → Your platform-ready product images
captions.txt    → Copy-paste captions + hashtags for each image

IMAGE NAMING
────────────
pixpack_{platform}_{angle}.png

Platforms: instagram_post, instagram_story, tiktok, facebook_post, shopify_product, web_banner
Angles:    lifestyle, flatlay, closeup, model, hero

TIPS
────
• Post within 24 hours for best algorithm reach
• Use the caption + hashtags from captions.txt as-is or customize
• For Stories, crop from the top of the image if needed

Generated by PixPack — pixpack.app
`
}
```

---

## WHAT NOT TO DO

```ts
// ❌ NEVER — server-side ZIP causes memory crashes on Vercel
// app/api/download/route.ts
const zip = new JSZip()
const images = await Promise.all(urls.map(url => fetch(url).then(r => r.blob())))
// This will crash on Vercel for large images

// ❌ NEVER — stream ZIP from server
res.setHeader('Content-Type', 'application/zip')
archiver.pipe(res) // This blocks the serverless function

// ✅ ALWAYS — all ZIP work in the browser component
// Client already has the base64 images in state
// JSZip runs in the browser, no server involved
```

---

## BROWSER COMPATIBILITY NOTE

`jszip` and `file-saver` work in all modern browsers.
`navigator.clipboard` requires HTTPS (fine for Vercel deployment, not for `http://localhost` — use a fallback for dev).

```ts
// Safe clipboard helper
export async function safeClipboardWrite(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for HTTP or permission denied
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  }
}
```
