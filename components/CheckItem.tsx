'use client'

import { useState } from 'react'
import { CheckItem as CheckItemType } from '@/lib/types'

export default function CheckItemRow({ item }: { item: CheckItemType }) {
  const [open, setOpen] = useState(false)
  const icon = item.status === 'pass' ? '✅' : item.status === 'warn' ? '⚠️' : '❌'
  const statusColor = item.status === 'pass' ? 'text-emerald-400' : item.status === 'warn' ? 'text-amber-400' : 'text-red-400'

  return (
    <div
      className="border border-white/8 rounded-lg p-3 cursor-pointer hover:border-white/20 transition-all"
      onClick={() => setOpen(!open)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen(!open)
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-sm text-white/80">{item.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${statusColor}`}>{item.score}/{item.maxScore}</span>
          <span className="text-white/30 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-white/8 space-y-2">
          <p className="text-xs text-white/60">{item.detail}</p>
          {item.fix && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
              <p className="text-xs text-blue-300">💡 {item.fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
