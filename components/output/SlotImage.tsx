'use client'

import { ImageIcon } from 'lucide-react'
import type { GeneratedImage, PlatformSpec } from '@/types'

function ratioToCss(ratio: string): string {
  return ratio.replace(':', '/')
}

interface SlotImageProps {
  image: GeneratedImage
  spec: PlatformSpec
}

export function SlotImage({ image, spec }: SlotImageProps) {
  const ratio = ratioToCss(spec.aspectRatio)



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
        Hover state: Subtle dark overlay (30% max opacity).
      */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 pointer-events-none" />
    </div>
  )
}
