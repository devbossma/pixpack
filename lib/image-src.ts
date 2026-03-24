import type { GeneratedImage } from './types'

export function getImageSrc(image: GeneratedImage | null | undefined): string | null {
    if (image?.imageUrl) return image.imageUrl
    return null
}

export function hasImageSrc(image: GeneratedImage | null | undefined): boolean {
    return !!image?.imageUrl
}