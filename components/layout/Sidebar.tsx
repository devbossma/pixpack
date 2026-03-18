'use client'
import { useState } from 'react'
import { useGenerationStore, selectCanGenerate, selectIsGenerating } from '@/hooks/useGeneration'
import { UploadZone } from '@/components/upload/UploadZone'
import { CountrySelector } from '@/components/audience/CountrySelector'
import { PillSelector } from '@/components/ui/PillSelector'
import { PlatformGrid } from '@/components/platforms/PlatformGrid'
import { AGE_RANGES, GENDERS, INTERESTS, ANGLES, MARKETING_LANGUAGES } from '@/lib/config'
import { Wand2, PanelLeftOpen, X, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { usePipeline } from '@/hooks/usePipeline'

export function Sidebar() {
  const { config, setConfig } = useGenerationStore()
  const { pipelineStatus, isGenerateEnabled, runPipeline } = usePipeline()
  const [mobileOpen, setMobileOpen] = useState(false)

  const mainContent = (
    <>
      {/* Product photo */}
      <SidebarSection label="Product photo">
        <UploadZone />
        <div className="mt-4">
          <FieldLabel>Product Details & Features (Optional)</FieldLabel>
          <textarea
            value={config.productHint || ''}
            onChange={(e) => setConfig({ productHint: e.target.value })}
            placeholder="e.g., Waterproof smartwatch, genuine leather band, 24h battery life..."
            className="w-full h-24 bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors resize-none mb-1.5"
          />
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed italic">
            Give the AI a hint to generate hyper-accurate ad copy.
          </p>
        </div>
      </SidebarSection>

      {/* Audience */}
      <SidebarSection label="Target audience">
        <div className="space-y-3">
          <div>
            <FieldLabel>Market</FieldLabel>
            <CountrySelector value={config.regionId} onChange={v => setConfig({ regionId: v })} />
          </div>
          <div>
            <FieldLabel>Age range</FieldLabel>
            <PillSelector options={AGE_RANGES} value={config.ageRanges} onChange={v => setConfig({ ageRanges: v })} />
          </div>
          <div>
            <FieldLabel>Gender</FieldLabel>
            <PillSelector options={GENDERS} value={config.gender} onChange={v => setConfig({ gender: v })} single />
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
              onChange={v => setConfig({ language: v })} 
              single 
            />
          </div>
        </div>
      </SidebarSection>

      {/* Platforms */}
      <SidebarSection label="Platforms">
        <PlatformGrid value={config.platforms} onChange={v => setConfig({ platforms: v })} />
      </SidebarSection>

      {/* Shot style */}
      <SidebarSection label="Shot style" noBorder>
        <PillSelector options={ANGLES} value={config.angles} onChange={v => setConfig({ angles: v })} multi />
      </SidebarSection>
    </>
  )

  const footerContent = (
    <div className="p-3 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]">
      <AnimatePresence mode="wait">
        {pipelineStatus !== 'idle' && pipelineStatus !== 'done' ? (
          <motion.div
            key="active"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-full flex flex-col gap-2"
          >
            <div className="w-full bg-[var(--surface2)] rounded-xl py-3 px-4 flex items-center gap-3 border border-[var(--border)]">
              <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
              <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                {pipelineStatus === 'extracting' && 'Extracting...'}
                {pipelineStatus === 'generating_creative' && 'Generating...'}
                {pipelineStatus === 'rendering_images' && 'Rendering...'}
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => { runPipeline(); setMobileOpen(false) }}
              disabled={!isGenerateEnabled}
              className={`w-full flex items-center justify-center gap-2 font-display font-bold text-sm py-3 rounded-xl transition-all
                ${isGenerateEnabled
                  ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-[0_0_20px_rgba(255,77,28,0.2)]'
                  : 'bg-[var(--surface2)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed'
                }`}
              aria-label="Generate pack"
            >
              <Wand2 size={15} />
              {pipelineStatus === 'done' && !isGenerateEnabled ? 'Up to date' : 'Generate pack'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {pipelineStatus === 'idle' && !isGenerateEnabled && (
        <p className="text-[10px] text-center text-[var(--text-muted)] mt-3 leading-relaxed">
          Configure market, platform &amp; shot style to unlock generation
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
      <aside className="hidden md:flex w-72 flex-shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex-col z-10">
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

function SidebarSection({ label, children, noBorder }: {
  label: string
  children: React.ReactNode
  noBorder?: boolean
}) {
  return (
    <div className={`p-3 ${!noBorder ? 'border-b border-[var(--sidebar-border)]' : ''}`}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2.5">
        {label}
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="block text-xs text-[var(--text-secondary)] mb-1.5">{children}</span>
}

