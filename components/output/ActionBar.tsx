'use client'

import { Download, Plus } from 'lucide-react'
import type { GeneratedPack } from '@/types'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { DownloadGateModal } from './DownloadGateModal'
import { useGenerationStore } from '@/hooks/useGeneration'

export function ActionBar({ pack }: { pack: GeneratedPack }) {
  const [showModal, setShowModal] = useState(false)
  const resetState = useGenerationStore(s => s.resetState)

  function handleNewPack() {
    resetState()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowModal(true)}
          disabled={pack.images.filter(i => i.status === 'done').length === 0}
          className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors h-9 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          <span>Download ZIP</span>
        </button>

        <button
          onClick={handleNewPack}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--output-text)] text-xs font-medium px-4 py-2.5 rounded-lg transition-colors h-9 ml-auto"
        >
          <Plus size={14} />
          <span>New pack</span>
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <DownloadGateModal pack={pack} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
