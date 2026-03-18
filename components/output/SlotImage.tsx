'use client'

import { Download, RefreshCw, ImageIcon } from 'lucide-react'
import type { GeneratedImage, PlatformSpec } from '@/types'

function ratioToCss(ratio: string): string {
  return ratio.replace(':', '/')
}

interface SlotImageProps {
  image: GeneratedImage
  spec: PlatformSpec
  onRegenerate: (imageId: string) => void
}

export function SlotImage({ image, spec, onRegenerate }: SlotImageProps) {
  const ratio = ratioToCss(spec.aspectRatio)

  function handleDownload() {
    if (!image.imageBase64) return
    const a = document.createElement('a')
    a.href = image.imageBase64
    a.download = `pixpack_${image.platform}.png`
    a.click()
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-[var(--output-bg)] group"
      style={{ aspectRatio: ratio }}
    >
      {/* 
        Image: Full object-cover 
        Scale to 1.02 on hover for depth.
      */}
      {image.imageBase64 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.imageBase64}
          alt={image.caption}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--output-bg)]">
          <ImageIcon size={24} className="text-[var(--text-muted)] opacity-50" />
        </div>
      )}

      {/* Two overlay badges (always visible, bottom-left and bottom-right) */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 z-10 bg-black/75 px-2 py-1 rounded-md max-w-[calc(100%-100px)] truncate border border-black/80">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none truncate ml-0.5">
          {spec.name}
        </span>
      </div>

      <div className="absolute bottom-2 right-2 flex items-center z-10 bg-black/60 px-2 py-1 rounded-md backdrop-blur-md">
        <span className="text-[10px] font-mono text-white/90 leading-none">
          {spec.width}×{spec.height}
        </span>
      </div>

      {/* 
        Hover state: Subtle dark overlay (30% max opacity),
        Buttons slide up from the bottom via CSS translate.
      */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 pointer-events-none" />

      <div className="absolute inset-x-0 bottom-12 flex items-center justify-center gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-20">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 bg-white/95 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white shadow-[var(--shadow-md)] transition-colors pointer-events-auto"
        >
          <Download size={14} />
          Download
        </button>
        <button
          onClick={() => onRegenerate(image.id)}
          className="flex items-center gap-1.5 bg-[var(--surface2)]/95 text-white border border-[var(--border)] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[var(--surface)] hover:border-[var(--border-hover)] shadow-[var(--shadow-md)] transition-colors pointer-events-auto backdrop-blur-sm"
        >
          <RefreshCw size={14} />
          Regen
        </button>
      </div>
    </div>
  )
}
