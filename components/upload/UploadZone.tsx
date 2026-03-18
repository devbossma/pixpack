'use client'

import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileWarning, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useGenerationStore } from '@/hooks/useGeneration'
import { fileToBase64 } from '@/hooks/useUpload'

export function UploadZone() {
  const { uploadState, setUploadState, resetState } = useGenerationStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => {
    // Clear the value first so picking the same file fires onChange again
    if (fileInputRef.current) fileInputRef.current.value = ''
    fileInputRef.current?.click()
  }

  const processFile = async (file: File) => {
    resetState()
    setUploadState({ status: 'processing', message: 'Reading file...' })
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Please upload a JPG, PNG, or WEBP image.')
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be under 10MB.')
      }
      const previewUrl = URL.createObjectURL(file)
      const { base64, mimeType } = await fileToBase64(file)
      setUploadState({ status: 'ready', previewUrl, base64, mimeType })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error processing file'
      setUploadState({ status: 'error', message })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (uploadState.status === 'idle') setUploadState({ status: 'dragging' })
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (uploadState.status === 'dragging') setUploadState({ status: 'idle' })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (uploadState.status === 'ready' || uploadState.status === 'processing') return
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
    else setUploadState({ status: 'idle' })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const onClickZone = () => {
    if (uploadState.status === 'idle' || uploadState.status === 'error') {
      openPicker()
    }
  }

  const reset = () => setUploadState({ status: 'idle' })

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
        onChange={handleFileChange}
      />
      
      <AnimatePresence mode="wait">
        {uploadState.status === 'ready' ? (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full aspect-square relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={uploadState.previewUrl} 
              alt="Product Preview" 
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              {/* "Change Photo" opens the picker directly — no idle reset */}
              <button 
                onClick={openPicker}
                className="bg-[var(--surface)] hover:bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition"
              >
                Change Photo
              </button>
            </div>
            <div className="absolute top-2 left-2 bg-[var(--accent3)] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow">
              <CheckCircle2 size={12} /> Ready
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            onClick={onClickZone}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full aspect-video rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${
              uploadState.status === 'dragging' 
                ? 'border border-dashed border-[var(--accent)] bg-[var(--accent-dim)]'
                : uploadState.status === 'error'
                  ? 'border border-dashed border-red-500 bg-red-500/5'
                  : 'border border-dashed border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface2)]'
            }`}
          >
            {uploadState.status === 'processing' ? (
              <div className="flex flex-col items-center">
                <RefreshCw className="w-5 h-5 text-[var(--accent)] animate-spin mb-2" />
                <p className="text-[10px] font-medium text-[var(--text)]">{uploadState.message}</p>
              </div>
            ) : uploadState.status === 'error' ? (
              <div className="flex flex-col items-center text-center px-2">
                <FileWarning className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-[10px] font-medium text-[var(--text)] mb-0.5">Upload failed</p>
                <p className="text-[10px] text-[var(--text-muted)] mb-2 line-clamp-1">{uploadState.message}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); reset() }}
                  className="px-3 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-semibold hover:bg-red-500/20 transition"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center px-4">
                <motion.div 
                  animate={{ scale: uploadState.status === 'dragging' ? 1.1 : 1 }}
                  className="bg-[var(--surface2)] p-2.5 rounded-full mb-2"
                >
                  <UploadCloud className={`w-5 h-5 ${uploadState.status === 'dragging' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                </motion.div>
                <p className="text-xs font-medium text-[var(--text)] mb-0.5">
                  {uploadState.status === 'dragging' ? 'Drop it here!' : 'Add product photo'}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  JPG, PNG or WEBP up to 10MB
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

