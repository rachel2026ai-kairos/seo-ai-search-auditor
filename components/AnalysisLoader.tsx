'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STAGES = [
  { icon: '🌐', text: '正在讀取目標頁面...' },
  { icon: '🔍', text: '萃取 SEO 骨架資料...' },
  { icon: '🤖', text: 'AI 深度分析中...' },
]

export default function AnalysisLoader() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1800)
    const t2 = setTimeout(() => setStage(2), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
      <div className="relative w-20 h-20">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-blue-500/30"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {STAGES[stage].icon}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-white/60 text-sm"
        >
          {STAGES[stage].text}
        </motion.p>
      </AnimatePresence>
      <div className="flex gap-2">
        {STAGES.map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            animate={{ backgroundColor: i <= stage ? '#3B82F6' : 'rgba(255,255,255,0.15)' }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}
