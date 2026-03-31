'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = () => {
    if (!url.startsWith('http')) {
      setError('請輸入完整網址，需包含 https://')
      return
    }
    router.push(`/results?url=${encodeURIComponent(url)}`)
  }

  return (
    <main className="min-h-screen bg-[#080D1A] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            SEO & AI Search <span className="text-blue-400">Auditor</span>
          </h1>
          <p className="text-white/50 text-base sm:text-lg">
            同時評估 Google SEO 分數與 AI 搜索引擎優化程度
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="https://your-website.com"
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors text-base sm:text-lg"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-colors text-base sm:text-lg"
          >
            開始分析
          </button>
          <p className="text-white/30 text-xs">分析約需 8-15 秒 · 結果快取 24 小時</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: '📊', label: 'Google SEO 評分', desc: '30+ 技術指標' },
            { icon: '🤖', label: 'AI 搜索優化', desc: 'GEO / AEO 分析' },
            { icon: '💡', label: 'AI 改善建議', desc: '質化深度洞察' },
          ].map(f => (
            <div key={f.label} className="bg-white/4 border border-white/8 rounded-xl p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-medium text-white/80">{f.label}</div>
              <div className="text-xs text-white/40 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
