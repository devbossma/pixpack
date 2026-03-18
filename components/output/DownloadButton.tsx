'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import type { GeneratedPack } from '@/types'
import { DownloadGateModal } from './DownloadGateModal'

export function DownloadButton({ pack }: { pack: GeneratedPack }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={pack.images.length === 0}
        className="flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors overflow-hidden disabled:opacity-75 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2">
          <Download size={14} />
          Download All ZIP
        </span>
      </button>

      <AnimatePresence>
        {showModal && (
          <DownloadGateModal pack={pack} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

