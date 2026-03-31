'use client'

import type { AIScoreResult } from '@/lib/types'

interface AIInsightPanelProps {
  insights: AIScoreResult
  className?: string
}

export default function AIInsightPanel({ insights, className = '' }: AIInsightPanelProps) {
  const blocks = [
    { label: '內容品質', data: insights.contentQuality },
    { label: '品牌權威', data: insights.brandAuthority },
    { label: 'AI 可搜尋性', data: insights.aiSearchability },
    { label: 'E-E-A-T', data: insights.eeatSignals },
  ]

  return (
    <div className={`grid md:grid-cols-2 gap-4 ${className}`}>
      {blocks.map(({ label, data }) => (
        <div key={label} className="bg-white/4 border border-white/8 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-white/80">{label}</span>
            <span
              className={`text-lg font-bold ${
                data.score >= 7 ? 'text-emerald-400' : data.score >= 4 ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {data.score}/10
            </span>
          </div>
          <p className="text-xs text-white/60">{data.finding}</p>
          {data.fix && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-300">💡 {data.fix}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
