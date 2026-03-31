'use client'

import { motion } from 'framer-motion'
import type { CategoryScore } from '@/lib/types'

interface ScoreCardProps {
  title: string
  category: CategoryScore
  delay?: number
}

export default function ScoreCard({ title, category, delay = 0 }: ScoreCardProps) {
  const pct = category.maxScore > 0 ? (category.score / category.maxScore) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-white/4 border border-white/8 rounded-xl p-5"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-white/90 text-sm">{title}</h3>
        <span className="text-sm text-white/50 tabular-nums">
          {category.score} / {category.maxScore}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-blue-500/80"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
        />
      </div>
    </motion.div>
  )
}
