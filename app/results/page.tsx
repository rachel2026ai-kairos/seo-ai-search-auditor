'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AnalysisLoader from '@/components/AnalysisLoader'
import ScoreGauge from '@/components/ScoreGauge'
import CheckItemRow from '@/components/CheckItem'
import AIInsightPanel from '@/components/AIInsightPanel'
import { FinalReport } from '@/lib/types'

function Results() {
  const params = useSearchParams()
  const url = params.get('url') || ''
  const [report, setReport] = useState<FinalReport | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!url) return
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setReport(data as FinalReport)
      })
      .catch(() => setError('分析失敗，請稍後再試'))
  }, [url])

  if (error) {
    return (
      <div className="min-h-screen bg-[#080D1A] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-white/70">{error}</p>
          <a href="/" className="text-blue-400 hover:underline text-sm">← 返回首頁</a>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#080D1A]">
        <AnalysisLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080D1A] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8 sm:space-y-10">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="min-w-0 flex-1">
            <a href="/" className="text-blue-400 text-sm hover:underline">← 重新分析</a>
            <h1 className="text-lg sm:text-xl font-bold text-white/90 mt-2 break-all">{report.url}</h1>
            <p className="text-white/40 text-xs mt-1">
              {report.fromCache ? '📦 快取結果' : '🔍 即時分析'} ·
              {new Date(report.analyzedAt).toLocaleString('zh-TW')}
            </p>
          </div>
        </div>

        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <ScoreGauge score={report.googleSEO.total} maxScore={report.googleSEO.maxTotal} label="Google SEO 分數" color="#3B82F6" />
            <div className="text-white/20 text-4xl font-thin hidden md:block select-none">|</div>
            <ScoreGauge score={report.aiSearch.total} maxScore={report.aiSearch.maxTotal} label="AI Search 分數" color="#06B6D4" />
          </div>
        </div>

        {report.aiInsights && (
          <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-blue-400 mb-3">🤖 AI 綜合評估</h2>
            <p className="text-white/80 text-sm leading-relaxed">{report.summary}</p>
          </div>
        )}

        {report.topPriorities.length > 0 && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-amber-400 mb-3">🎯 優先改善行動</h2>
            <ol className="space-y-2">
              {report.topPriorities.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm text-white/70">
                  <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-bold">📊 Google SEO 詳細評分</h2>
          {[
            { title: '技術 SEO', cat: report.googleSEO.technical },
            { title: '內容結構', cat: report.googleSEO.contentStructure },
            { title: '使用者體驗', cat: report.googleSEO.ux },
          ].map(({ title, cat }) => (
            <div key={title} className="bg-white/4 border border-white/8 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white/90">{title}</h3>
                <span className="text-sm text-white/50">{cat.score} / {cat.maxScore}</span>
              </div>
              <div className="space-y-2">
                {cat.items.map(item => <CheckItemRow key={item.id} item={item} />)}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold">🤖 AI Search 詳細評分</h2>
          {[
            { title: '可引用性', cat: report.aiSearch.citability },
            { title: '內容結構清晰度', cat: report.aiSearch.structure },
            { title: 'E-E-A-T 信號', cat: report.aiSearch.eeat },
          ].map(({ title, cat }) => (
            <div key={title} className="bg-white/4 border border-white/8 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white/90">{title}</h3>
                <span className="text-sm text-white/50">{cat.score} / {cat.maxScore}</span>
              </div>
              <div className="space-y-2">
                {cat.items.length > 0
                  ? cat.items.map(item => <CheckItemRow key={item.id} item={item} />)
                  : <p className="text-xs text-white/40">尚無資料（需 AI 分析）</p>}
              </div>
            </div>
          ))}
        </section>

        {report.aiInsights && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold">💡 AI 質化分析</h2>
            <AIInsightPanel insights={report.aiInsights} />
          </section>
        )}
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={(
      <div className="min-h-screen bg-[#080D1A]">
        <AnalysisLoader />
      </div>
    )}
    >
      <Results />
    </Suspense>
  )
}
