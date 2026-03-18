import { useState } from 'react'
import type { UploadState } from '@/types'

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const [header, base64] = dataUrl.split(',')
      const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      resolve({ base64, mimeType })
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({ status: 'idle' })

  const processFile = async (file: File) => {
    setState({ status: 'processing', message: 'Reading file...' })
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Please upload a JPG, PNG, or WEBP image.')
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be under 10MB.')
      }
      const previewUrl = URL.createObjectURL(file)
      const { base64, mimeType } = await fileToBase64(file)
      setState({ status: 'ready', previewUrl, base64, mimeType })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error processing file'
      setState({ status: 'error', message })
    }
  }

  const reset = () => {
    setState({ status: 'idle' })
  }

  return { state, processFile, reset, setState }
}
