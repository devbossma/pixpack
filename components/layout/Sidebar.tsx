'use client'
import { useState } from 'react'
import { useGenerationStore } from '@/hooks/useGeneration'
import { UploadZone } from '@/components/upload/UploadZone'
import { CountrySelector } from '@/components/audience/CountrySelector'
import { PillSelector } from '@/components/ui/PillSelector'
import { PlatformSelector } from '@/components/platforms/PlatformSelector'
import { AGE_RANGES, GENDERS, INTERESTS, MARKETING_LANGUAGES } from '@/lib/config'
import { Wand2, PanelLeftOpen, X, Globe, Users, Monitor, Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePipeline } from '@/hooks/usePipeline'
import { useGenerationLimit } from '@/hooks/useGenerationLimit'
import { GenerationLimitBadge } from '@/components/generation/GenerationLimitBadge'
import { GenerateBar } from '@/components/generation/GenerateBar'
import type { Platform } from '@/types'

export function Sidebar() {
  const { config, setConfig } = useGenerationStore()
  const uploadState = useGenerationStore(s => s.uploadState)
  const { pipelineStatus, isGenerateEnabled, runPipeline } = usePipeline()
  const limit = useGenerationLimit()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isGenerating = pipelineStatus !== 'idle' && pipelineStatus !== 'done'

  async function handleGenerate() {
    if (limit.limited) return
    await runPipeline()
    limit.decrementRemaining()
    if (typeof window !== 'undefined' && window.innerWidth < 768) setMobileOpen(false)
  }

  // PREVIEW MODE: Hide the entire configuration UI when the pack is successfully generated.
  if (pipelineStatus === 'done') return null

  const uploadReady = uploadState?.status === 'ready'

  const mainContent = (
    <>
      {/* Step 1: Product photo */}
      <SidebarSection step={1} label="Product photo" icon={<Camera size={11} />}>
        <UploadZone />
        <div className="mt-3">
          <FieldLabel>Brand & Product hint <span className="text-[var(--text-muted)] font-normal">(optional)</span></FieldLabel>
          <textarea
            value={config.productHint || ''}
            onChange={(e) => setConfig({ productHint: e.target.value })}
            placeholder="e.g., Handmade macramé bag, natural cotton. Bold playful brand voice..."
            className="w-full h-16 bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all resize-none mb-1"
          />
        </div>
      </SidebarSection>

      {/* Step 2: Audience */}
      <SidebarSection step={2} label="Target audience" icon={<Users size={11} />}>
        <div className="space-y-3">
          <div>
            <FieldLabel>Market</FieldLabel>
            <CountrySelector value={config.regionId} onChange={v => setConfig({ regionId: v })} />
          </div>
          <div>
            <FieldLabel>Age range</FieldLabel>
            <PillSelector
              options={AGE_RANGES}
              value={config.ageRange}
              onChange={v => setConfig({ ageRange: v })}
              single
            />
          </div>
          <div>
            <FieldLabel>Gender</FieldLabel>
            <PillSelector
              options={GENDERS}
              value={config.gender}
              onChange={v => setConfig({ gender: v })}
              single
            />
          </div>
          <div>
            <FieldLabel>Interest <span className="text-[var(--text-muted)] font-normal normal-case">(optional)</span></FieldLabel>
            <CountrySelector
              options={INTERESTS}
              value={config.interest}
              onChange={v => setConfig({ interest: v })}
              placeholder="Select interest category..."
            />
          </div>
          <div>
            <FieldLabel>
              <div className="flex items-center gap-1.5">
                <Globe size={10} className="text-[var(--accent)]" />
                Marketing Language
              </div>
            </FieldLabel>
            <PillSelector
              options={MARKETING_LANGUAGES}
              value={config.language}
              onChange={v => setConfig({ language: v ?? 'auto' })}
              single
            />
          </div>
        </div>
      </SidebarSection>

      {/* Step 3: Platform */}
      <SidebarSection step={3} label="Ad platform" icon={<Monitor size={11} />} noBorder>
        <PlatformSelector
          value={config.platform}
          onChange={(v: string) => setConfig({ platform: v as Platform })}
        />
      </SidebarSection>
    </>
  )

  const footerContent = (
    <div className="p-3 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] space-y-2">
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="active"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-[var(--surface2)] rounded-xl py-3 px-4 border border-[var(--border)]"
          >
            <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin flex-shrink-0" />
            <span className="text-xs font-semibold text-[var(--text)] truncate">
              {pipelineStatus === 'extracting' && 'Analyzing product…'}
              {pipelineStatus === 'generating_creative' && 'Building concepts…'}
              {pipelineStatus === 'rendering_images' && 'Rendering images…'}
            </span>
          </motion.div>
        ) : (
          <div key="generation-cta" className="flex flex-col gap-2 w-full">
            <GenerationLimitBadge
              remaining={limit.remaining}
              resetInMs={limit.resetInMs}
              limited={limit.limited}
              loading={limit.loading}
            />
            <GenerateBar
              disabled={!isGenerateEnabled || limit.limited}
              onGenerate={handleGenerate}
            />
          </div>
        )}
      </AnimatePresence>

      {!isGenerating && !isGenerateEnabled && (
        <p className="text-[10px] text-center text-[var(--text-muted)] leading-relaxed">
          Upload a photo, pick a platform &amp; audience to unlock
        </p>
      )}
    </div>
  )

  return (
    <>
      {/* ── Mobile hamburger button ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-5 left-4 z-40 flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-bold"
        aria-label="Open sidebar"
      >
        <PanelLeftOpen size={16} />
        Configure
      </button>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-72 lg:w-80 xl:w-80 flex-shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex-col z-10">
        <div className="flex-1 overflow-y-auto">
          {mainContent}
        </div>
        {footerContent}
      </aside>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-[min(80vw,320px)] bg-[var(--sidebar-bg)] flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--sidebar-border)] flex-shrink-0">
                <span className="text-sm font-bold text-[var(--text)]">Configure pack</span>
                <button onClick={() => setMobileOpen(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {mainContent}
              </div>
              {footerContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarSection({ step, label, icon, children, noBorder }: {
  step?: number
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  noBorder?: boolean
}) {
  return (
    <div className={`p-4 ${!noBorder ? 'border-b border-[var(--sidebar-border)]' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        {step && (
          <span className="w-4 h-4 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-[9px] font-black flex items-center justify-center flex-shrink-0">
            {step}
          </span>
        )}
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="block text-[11px] text-[var(--text-secondary)] mb-1.5 font-medium">{children}</span>
}
