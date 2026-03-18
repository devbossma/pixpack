'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Scissors, ScanSearch, MapPin, Sparkles, PenTool, Image as ImageIcon, Package, Check } from 'lucide-react'

const STEPS = [
  { Icon: Scissors,      title: 'Removing background',     sub: 'Isolating your product' },
  { Icon: ScanSearch,    title: 'Analyzing product',       sub: 'Extracting features, style & context' },
  { Icon: MapPin,        title: 'Directing scenes',        sub: 'Adapting environments to your market' },
  { Icon: PenTool,       title: 'Writing ad copy',         sub: 'Crafting platform-native descriptions' },
  { Icon: ImageIcon,     title: 'Rendering images',        sub: 'Gemini placing product seamlessly' },
  { Icon: Package,       title: 'Assembling output',       sub: 'Scoring engagement & building assets' },
]

const FACTS = [
  'Professional product shoots cost $500–5,000. You\'re skipping that.',
  'Each scene environment is dynamically triggered by your chosen audience.',
  'Your ad copy follows proven direct-response marketing formulas.',
  'Engagement scores are based on platform best practices for your market.',
  'Every single image exports at the exact pixel dimensions explicitly preferred by the platform algorithms.',
  'Your generated pack includes a full Shopify-ready SEO product description.',
]

export function LoadingSequence({ currentStep, progress }: { currentStep: number; progress: number }) {
  // Graceful handling of progress overflows
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="fixed inset-0 bg-[#0c0c0b]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-black/40 border border-[#2a2a25] rounded-3xl p-8 w-full max-w-[420px] shadow-2xl overflow-hidden relative"
      >
        {/* Ambient top glow */}
        <div className="absolute -top-24 -inset-x-20 h-40 bg-[var(--accent)] opacity-[0.08] blur-3xl rounded-[100%]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Generating Pack
            </h2>
            <div className="flex flex-col items-end">
              <span className="text-sm font-mono font-medium text-[var(--accent)]">{Math.round(safeProgress)}%</span>
            </div>
          </div>
          
          <p className="text-xs text-[#a09c94] mb-6 flex items-center gap-2">
            <Sparkles size={12} className="text-[var(--accent2)]" />
            Usually takes 45-60 seconds
          </p>

          {/* Smooth Progress bar */}
          <div className="h-1.5 w-full bg-[#1c1c19] rounded-full mb-8 overflow-hidden relative shadow-inner">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent)] to-[#ff8c00] rounded-full"
              style={{ width: `${safeProgress}%` }}
              layout
              transition={{ ease: "circOut", duration: 0.8 }}
            />
            {/* Shimmer effect over the progress bar */}
            <motion.div 
              className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>

          {/* Steps List */}
          <div className="space-y-4 mb-8">
            {STEPS.map(({ Icon, title, sub }, i) => {
              const done = i < currentStep
              const active = i === currentStep
              const pending = i > currentStep
              
              return (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: pending ? 0.3 : 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-start gap-3.5 transition-all duration-300 ${active ? 'scale-[1.02]' : 'scale-100'}`}
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500
                    ${done ? 'bg-[var(--accent3)]/10 text-[var(--accent3)] shadow-[0_0_15px_rgba(0,194,122,0.15)]' 
                      : active ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-[0_0_15px_rgba(255,77,28,0.2)] border border-[var(--accent)]/20' 
                      : 'bg-[#1c1c19] text-[#605c55]'}`}
                  >
                    {done ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check size={16} strokeWidth={3} />
                      </motion.div>
                    ) : active ? (
                      <Icon size={15} className="animate-pulse" />
                    ) : (
                      <Icon size={14} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`text-sm font-semibold truncate transition-colors duration-300 ${active || done ? 'text-[#f0ece3]' : 'text-[#605c55]'}`}>
                      {title}
                    </p>
                    <AnimatePresence>
                      {(active || done) && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className={`text-xs mt-1 transition-colors duration-300 ${active ? 'text-[var(--accent)]' : 'text-[#605c55]'}`}
                        >
                          {sub}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Fact card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#141412] border border-[#2a2a25] p-4">
             <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#ffb800] to-[var(--accent)]" />
             <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="pl-3"
              >
                <p className="text-xs text-[#a09c94] font-medium leading-relaxed italic">
                  "{FACTS[currentStep % FACTS.length]}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
