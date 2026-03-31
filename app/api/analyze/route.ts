import { NextRequest, NextResponse } from 'next/server'
import { preprocessHTML } from '@/lib/preprocessor'
import { runLocalScorer } from '@/lib/localScorer'
import { runAIScorer } from '@/lib/aiScorer'
import { getCachedReport, setCachedReport, hashContext } from '@/lib/cache'
import { composeReport } from '@/lib/reportComposer'

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url?: string }

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: '請輸入有效的網址（需包含 https://）' }, { status: 400 })
    }

    const timeout = parseInt(process.env.ANALYSIS_TIMEOUT_MS || '10000', 10)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    let html: string
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOAuditor/1.0; +https://yourdomain.com)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-TW,en;q=0.9',
        },
      })
      clearTimeout(timer)
      if (!response.ok) {
        return NextResponse.json({ error: `網站回傳錯誤狀態：${response.status}` }, { status: 502 })
      }
      html = await response.text()
    } catch (e: unknown) {
      clearTimeout(timer)
      const err = e as { name?: string }
      if (err.name === 'AbortError') {
        return NextResponse.json({ error: '網站回應超時（10 秒），請確認網址是否正常運作' }, { status: 503 })
      }
      return NextResponse.json({ error: '無法連接至目標網站' }, { status: 502 })
    }

    const ctx = preprocessHTML(html, url)

    const contentHash = hashContext(ctx)
    const cached = await getCachedReport(contentHash)
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true })
    }

    const [local, ai] = await Promise.all([
      Promise.resolve(runLocalScorer(ctx)),
      runAIScorer(ctx).catch(() => null),
    ])

    const report = composeReport(url, local, ai, ctx, false)

    await setCachedReport(contentHash, report)

    return NextResponse.json(report)
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: '分析過程發生錯誤，請稍後再試' }, { status: 500 })
  }
}
