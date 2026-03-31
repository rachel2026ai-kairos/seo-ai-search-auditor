'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  score: number
  maxScore: number
  label: string
  color: string
}

export default function ScoreGauge({ score, maxScore, label, color }: Props) {
  const [displayScore, setDisplayScore] = useState(0)
  const pct = maxScore > 0 ? score / maxScore : 0
  const r = 54
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference - pct * circumference

  useEffect(() => {
    const end = score
    const duration = 1500
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setDisplayScore(Math.round(end * progress))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [score])

  const getGrade = () => {
    if (pct >= 0.8) return { label: '優良', color: '#10B981' }
    if (pct >= 0.6) return { label: '良好', color: '#F59E0B' }
    if (pct >= 0.4) return { label: '待改善', color: '#F97316' }
    return { label: '需重視', color: '#EF4444' }
  }
  const grade = getGrade()

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90" aria-hidden>
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <motion.circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{displayScore}</span>
          <span className="text-xs text-white/40">/ {maxScore}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-white/70">{label}</div>
        <div className="text-xs font-semibold mt-1" style={{ color: grade.color }}>{grade.label}</div>
      </div>
    </div>
  )
}
