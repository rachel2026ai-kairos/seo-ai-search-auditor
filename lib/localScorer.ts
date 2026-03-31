import { CleanContext, CategoryScore, CheckItem, LocalScoreResult } from './types'

function item(
  id: string, label: string, score: number, maxScore: number,
  status: 'pass' | 'warn' | 'fail', detail: string, fix: string
): CheckItem {
  return { id, label, score, maxScore, status, detail, fix }
}

function scoreTechnical(ctx: CleanContext): CategoryScore {
  const items: CheckItem[] = []

  const titleLen = ctx.meta.title?.length ?? 0
  if (!ctx.meta.title) {
    items.push(item('title', 'Title Tag', 0, 5, 'fail', '缺少 Title Tag', '在 <head> 中加入 <title> 標籤'))
  } else if (titleLen < 50 || titleLen > 60) {
    items.push(item('title', 'Title Tag', 3, 5, 'warn', `Title 長度 ${titleLen} 字元（建議 50-60）`, '調整 Title 至 50-60 字元'))
  } else {
    items.push(item('title', 'Title Tag', 5, 5, 'pass', `Title 長度 ${titleLen} 字元，符合標準`, ''))
  }

  const descLen = ctx.meta.description?.length ?? 0
  if (!ctx.meta.description) {
    items.push(item('desc', 'Meta Description', 0, 5, 'fail', '缺少 Meta Description', '加入 120-160 字元的 Meta Description'))
  } else if (descLen < 120 || descLen > 160) {
    items.push(item('desc', 'Meta Description', 3, 5, 'warn', `描述長度 ${descLen} 字元（建議 120-160）`, '調整描述長度至 120-160 字元'))
  } else {
    items.push(item('desc', 'Meta Description', 5, 5, 'pass', `描述長度 ${descLen} 字元，符合標準`, ''))
  }

  items.push(ctx.meta.canonical
    ? item('canonical', 'Canonical Tag', 3, 3, 'pass', `Canonical 已設定：${ctx.meta.canonical}`, '')
    : item('canonical', 'Canonical Tag', 0, 3, 'fail', '缺少 Canonical Tag，可能導致重複內容問題', '加入 <link rel="canonical" href="...">'))

  items.push(ctx.hasHttps
    ? item('https', 'HTTPS', 3, 3, 'pass', '網站使用 HTTPS 安全連線', '')
    : item('https', 'HTTPS', 0, 3, 'fail', '網站未使用 HTTPS，影響排名與信任度', '申請 SSL 憑證並強制 HTTPS 重導向'))

  const ogComplete = !!(ctx.meta.ogTitle && ctx.meta.ogDescription && ctx.meta.ogImage)
  const ogPartial = !!(ctx.meta.ogTitle || ctx.meta.ogDescription)
  if (ogComplete) {
    items.push(item('og', 'Open Graph Tags', 5, 5, 'pass', 'OG 標籤完整（title + description + image）', ''))
  } else if (ogPartial) {
    items.push(item('og', 'Open Graph Tags', 2, 5, 'warn', '部分 OG 標籤缺失', '補齊 og:title、og:description、og:image'))
  } else {
    items.push(item('og', 'Open Graph Tags', 0, 5, 'fail', '缺少所有 OG 標籤，社群分享將無法優化', '加入完整 Open Graph meta 標籤'))
  }

  items.push(ctx.hasViewportMeta
    ? item('viewport', 'Viewport Meta', 4, 4, 'pass', '已設定 viewport，行動裝置友善', '')
    : item('viewport', 'Viewport Meta', 0, 4, 'fail', '缺少 viewport meta，行動裝置顯示異常', '加入 <meta name="viewport" content="width=device-width, initial-scale=1">'))

  const score = items.reduce((a, b) => a + b.score, 0)
  return { score, maxScore: 25, items }
}

function scoreContentStructure(ctx: CleanContext): CategoryScore {
  const items: CheckItem[] = []

  if (ctx.headings.h1.length === 1) {
    items.push(item('h1', 'H1 標籤', 5, 5, 'pass', `H1：「${ctx.headings.h1[0].slice(0, 50)}」`, ''))
  } else if (ctx.headings.h1.length === 0) {
    items.push(item('h1', 'H1 標籤', 0, 5, 'fail', '頁面缺少 H1 標籤', '加入一個包含主要關鍵字的 H1 標籤'))
  } else {
    items.push(item('h1', 'H1 標籤', 2, 5, 'warn', `頁面有 ${ctx.headings.h1.length} 個 H1，應只有 1 個`, '刪除多餘的 H1，保留最重要的一個'))
  }

  const hasH2 = ctx.headings.h2.length > 0
  const hasH3withoutH2 = ctx.headings.h3.length > 0 && !hasH2
  if (!hasH2) {
    items.push(item('hierarchy', '標題層級結構', 2, 5, 'warn', '缺少 H2 標籤，內容結構不清晰', '使用 H2 劃分主要段落，H3 用於子段落'))
  } else if (hasH3withoutH2) {
    items.push(item('hierarchy', '標題層級結構', 2, 5, 'warn', 'H3 出現但無 H2，層級跳躍', '確保標題層級從 H1 → H2 → H3 依序使用'))
  } else {
    items.push(item('hierarchy', '標題層級結構', 5, 5, 'pass', `H2 × ${ctx.headings.h2.length}，H3 × ${ctx.headings.h3.length}，層級合理`, ''))
  }

  const altPct = Math.round(ctx.imageAltCoverage * 100)
  if (ctx.imageAltCoverage >= 0.9) {
    items.push(item('alt', '圖片 Alt 屬性', 5, 5, 'pass', `${altPct}% 的圖片有 Alt 文字`, ''))
  } else if (ctx.imageAltCoverage >= 0.6) {
    items.push(item('alt', '圖片 Alt 屬性', 3, 5, 'warn', `只有 ${altPct}% 的圖片有 Alt 文字`, '為所有圖片加入描述性 Alt 屬性'))
  } else {
    items.push(item('alt', '圖片 Alt 屬性', 0, 5, 'fail', `只有 ${altPct}% 的圖片有 Alt 文字，嚴重影響無障礙與 SEO`, '立即為所有圖片加入 Alt 屬性'))
  }

  if (ctx.wordCount >= 800) {
    items.push(item('words', '內容字數', 5, 5, 'pass', `約 ${ctx.wordCount} 字，內容豐富`, ''))
  } else if (ctx.wordCount >= 300) {
    items.push(item('words', '內容字數', 3, 5, 'warn', `約 ${ctx.wordCount} 字（建議至少 800 字）`, '擴充內容深度，增加至 800 字以上'))
  } else {
    items.push(item('words', '內容字數', 0, 5, 'fail', `只有約 ${ctx.wordCount} 字，內容過於稀薄`, '大幅擴充內容，加入更多實用資訊'))
  }

  const score = items.reduce((a, b) => a + b.score, 0)
  return { score, maxScore: 20, items }
}

function scoreUX(ctx: CleanContext): CategoryScore {
  const items: CheckItem[] = []

  if (ctx.internalLinkCount >= 3) {
    items.push(item('internal', '內部連結', 3, 3, 'pass', `有 ${ctx.internalLinkCount} 個內部連結`, ''))
  } else {
    items.push(item('internal', '內部連結', 1, 3, 'warn', `只有 ${ctx.internalLinkCount} 個內部連結`, '增加相關頁面的內部連結，幫助使用者與爬蟲瀏覽'))
  }

  const anchorRatio = ctx.links.totalAnchors > 0
    ? ctx.links.descriptiveAnchors / ctx.links.totalAnchors : 1
  if (anchorRatio >= 0.8) {
    items.push(item('anchors', '連結描述性文字', 4, 4, 'pass', '大多數連結使用描述性錨文字', ''))
  } else {
    items.push(item('anchors', '連結描述性文字', 1, 4, 'warn', '部分連結使用「點此」等無意義錨文字', '將「點此」、「更多」等文字改為描述性錨文字'))
  }

  items.push(ctx.hasFavicon
    ? item('favicon', 'Favicon', 3, 3, 'pass', '已設定網站圖示', '')
    : item('favicon', 'Favicon', 0, 3, 'fail', '缺少 Favicon', '加入 <link rel="icon"> 設定網站圖示'))

  const score = items.reduce((a, b) => a + b.score, 0)
  return { score, maxScore: 10, items }
}

function scoreAIQuantitative(ctx: CleanContext): CategoryScore {
  const items: CheckItem[] = []

  items.push(ctx.hasAuthorInfo
    ? item('author', '作者資訊', 5, 5, 'pass', '頁面有明確的作者標記', '')
    : item('author', '作者資訊', 0, 5, 'fail', '缺少作者資訊，AI 引用可能性低', '加入作者 byline 或 schema author 標記'))

  items.push(ctx.hasDatePublished
    ? item('date', '發布日期', 5, 5, 'pass', '頁面有發布或更新日期標記', '')
    : item('date', '發布日期', 0, 5, 'fail', '缺少日期資訊，AI 無法判斷時效性', '加入 <time datetime="..."> 或 datePublished Schema'))

  if (ctx.schemas.length >= 2) {
    items.push(item('schema', 'Schema 結構化資料', 5, 5, 'pass', `有 ${ctx.schemas.length} 個 Schema（${ctx.schemaTypes.join(', ')}）`, ''))
  } else if (ctx.schemas.length === 1) {
    items.push(item('schema', 'Schema 結構化資料', 3, 5, 'warn', `只有 1 個 Schema（${ctx.schemaTypes.join(', ')}）`, '新增 FAQPage 或 Article Schema 提升 AI 可讀性'))
  } else {
    items.push(item('schema', 'Schema 結構化資料', 0, 5, 'fail', '缺少 Schema 結構化資料', '加入 JSON-LD 格式的 Schema，如 Article、FAQPage'))
  }

  const score = items.reduce((a, b) => a + b.score, 0)
  return { score, maxScore: 15, items }
}

export function runLocalScorer(ctx: CleanContext): LocalScoreResult {
  return {
    technical: scoreTechnical(ctx),
    contentStructure: scoreContentStructure(ctx),
    ux: scoreUX(ctx),
    aiQuantitative: scoreAIQuantitative(ctx),
  }
}
