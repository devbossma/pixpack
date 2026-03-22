'use client'
import { useState } from 'react'
import type { GeneratedPack } from '@/types'

export function usePackEditor() {
  const [pack, setPack] = useState<GeneratedPack | null>(null)

  function setPack_initial(newPack: GeneratedPack) {
    setPack(newPack)
  }

  return { pack, setPack: setPack_initial }
}
