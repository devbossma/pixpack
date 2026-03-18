'use client'
import { useState, useCallback } from 'react'
import type { GeneratedPack, GeneratedImage, Platform } from '@/types'
import { PLATFORM_SPECS } from '@/lib/platforms'

export function usePackEditor() {
  const [pack, setPack] = useState<GeneratedPack | null>(null)

  function setPack_initial(newPack: GeneratedPack) {
    setPack(newPack)
  }

  const regenerateImage = useCallback(async (imageId: string) => {
    if (!pack) return

    setPack(prev => prev ? {
      ...prev,
      images: prev.images.map(img =>
        img.id === imageId
          ? { ...img, status: 'regenerating' as const, imageBase64: null }
          : img
      )
    } : null)

    const targetImage = pack.images.find(img => img.id === imageId)
    if (!targetImage) return

    try {
      // Mock mode: wait 4 seconds then return new color
      await new Promise(res => setTimeout(res, 4000))
      
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
      const newColor = colors[Math.floor(Math.random() * colors.length)]

      const imageBase64 = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="${targetImage.platformSpec.width}" height="${targetImage.platformSpec.height}">
        <rect width="100%" height="100%" fill="${newColor}" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="white">Regenerated</text>
      </svg>`)

      const engagementScore = {
        score: Number((Math.random() * (9.2 - 6.5) + 6.5).toFixed(1)),
        label: 'Good',
        reason: 'Regenerated reason: lighting matches platform trends.',
        tip: 'Consider adding a recognizable lifestyle prop.'
      }

      setPack(prev => prev ? {
        ...prev,
        images: prev.images.map(img =>
          img.id === imageId
            ? { ...img, imageBase64, engagementScore, status: 'done' as const, error: undefined }
            : img
        ),
        totalScore: calculateAverageScore(prev.images.map(img =>
          img.id === imageId ? { ...img, engagementScore } : img
        )),
      } : null)

    } catch (err) {
      setPack(prev => prev ? {
        ...prev,
        images: prev.images.map(img =>
          img.id === imageId
            ? { ...img, status: 'error' as const, error: 'Regeneration failed. Try again.', imageBase64: '' }
            : img
        )
      } : null)
    }
  }, [pack])

  const modifyImage = useCallback(async (imageId: string, prompt: string) => {
    if (!pack) return
    // Simulation: wait and update with new mock content
    await new Promise(res => setTimeout(res, 3000))
    await regenerateImage(imageId)
  }, [pack, regenerateImage])

  const changeImage = useCallback(async (imageId: string) => {
    if (!pack) return
    await new Promise(res => setTimeout(res, 3000))
    await regenerateImage(imageId)
  }, [pack, regenerateImage])

  const updateCaption = useCallback((imageId: string, caption: string) => {
    setPack(prev => prev ? {
      ...prev,
      images: prev.images.map(img =>
        img.id === imageId ? { ...img, caption } : img
      )
    } : null)
  }, [])

  const generateMissing = useCallback(async (platformId: Platform) => {
    if (!pack) return

    // 1. Create a placeholder regenerating image
    const newId = crypto.randomUUID()
    const newImage: GeneratedImage = {
      id: newId,
      platform: platformId,
      platformSpec: PLATFORM_SPECS[platformId],
      angle: 'lifestyle', // default guess
      imageBase64: '',
      caption: 'Generating...',
      hashtags: ['#generating'],
      adCopy: { awareness: '', consideration: '', conversion: '' },
      engagementScore: { score: 0, label: 'Poor', reason: '', tip: '' },
      status: 'regenerating'
    }

    setPack(prev => prev ? {
      ...prev,
      images: [...prev.images, newImage]
    } : null)

    try {
      // Mock generation delay
      await new Promise(res => setTimeout(res, 4000))
      
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
      const newColor = colors[Math.floor(Math.random() * colors.length)]

      const imageBase64 = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="${newImage.platformSpec.width}" height="${newImage.platformSpec.height}">
        <rect width="100%" height="100%" fill="${newColor}" />
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="white">Generated</text>
      </svg>`)

      const engagementScore = {
        score: Number((Math.random() * (9.2 - 6.5) + 6.5).toFixed(1)),
        label: 'Good' as const,
        reason: 'New generated reason: lighting matches platform trends.',
        tip: 'Consider adding a recognizable lifestyle prop.'
      }

      setPack(prev => prev ? {
        ...prev,
        images: prev.images.map(img =>
          img.id === newId
            ? { 
                ...img, 
                imageBase64, 
                engagementScore, 
                status: 'done' as const,
                caption: 'Freshly generated copy for ' + PLATFORM_SPECS[platformId].name,
                adCopy: { 
                  awareness: 'Catchy hook here.', 
                  consideration: 'Why you need this now.', 
                  conversion: 'Buy it before it is gone.' 
                }
              }
            : img
        )
      } : null)
    } catch (err) {
      setPack(prev => prev ? {
        ...prev,
        images: prev.images.map(img =>
          img.id === newId
            ? { ...img, status: 'error' as const, error: 'Generation failed. Try again.', imageBase64: '' }
            : img
        )
      } : null)
    }
  }, [pack])

  return { pack, setPack: setPack_initial, regenerateImage, modifyImage, changeImage, updateCaption, generateMissing }
}

function calculateAverageScore(images: GeneratedImage[]): number {
  const done = images.filter(i => i.status === 'done' && i.engagementScore)
  if (!done.length) return 0
  return done.reduce((sum, i) => sum + i.engagementScore.score, 0) / done.length
}
