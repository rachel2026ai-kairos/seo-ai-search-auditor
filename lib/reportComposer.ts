import { LocalScoreResult, AIScoreResult, FinalReport, CategoryScore, CheckItem, CleanContext } from './types'

function buildCitabilityCategory(ctx: CleanContext, ai: AIScoreResult): CategoryScore {
  const items: CheckItem[] = [
    {
      id: 'author', label: '作者資訊', score: ctx.hasAuthorInfo ? 5 : 0, maxScore: 5,
      status: ctx.hasAuthorInfo ? 'pass' : 'fail',
      detail: ctx.hasAuthorInfo ? '頁面有明確的作者標記' : '缺少作者 byline 或 schema',
      fix: ctx.hasAuthorInfo ? '' : '加入作者標記，提升 AI 引用信任度',
    },
    {
      id: 'date', label: '發布日期', score: ctx.hasDatePublished ? 5 : 0, maxScore: 5,
      status: ctx.hasDatePublished ? 'pass' : 'fail',
      detail: ctx.hasDatePublished ? '有時間戳記，AI 可判斷時效性' : '缺少日期',
      fix: ctx.hasDatePublished ? '' : '加入 <time datetime="..."> 標記',
    },
    {
      id: 'eeat-score', label: 'E-E-A-T 信號（AI 評估）',
      score: Math.round(ai.eeatSignals.score / 10 * 10), maxScore: 10,
      status: ai.eeatSignals.score >= 7 ? 'pass' : ai.eeatSignals.score >= 4 ? 'warn' : 'fail',
      detail: ai.eeatSignals.finding,
      fix: ai.eeatSignals.fix,
    },
  ]
  return { score: items.reduce((a, b) => a + b.score, 0), maxScore: 20, items }
}

function buildStructureCategory(ctx: CleanContext, ai: AIScoreResult): CategoryScore {
  const items: CheckItem[] = [
    {
      id: 'faq', label: 'FAQ 結構', score: ctx.hasFaqStructure ? 10 : 0, maxScore: 10,
      status: ctx.hasFaqStructure ? 'pass' : 'fail',
      detail: ctx.hasFaqStructure ? '有 FAQ 結構或 FAQPage Schema' : '缺少 FAQ 結構',
      fix: ctx.hasFaqStructure ? '' : '加入 FAQ 區塊並標記 FAQPage Schema',
    },
    {
      id: 'list', label: '條列式內容', score: ctx.hasListContent ? 5 : 0, maxScore: 5,
      status: ctx.hasListContent ? 'pass' : 'warn',
      detail: ctx.hasListContent ? '頁面有條列式內容，便於 AI 萃取重點' : '缺少條列式內容',
      fix: ctx.hasListContent ? '' : '將重點資訊改為有序或無序列表',
    },
    {
      id: 'summary', label: 'TL;DR / 摘要段落', score: ctx.hasSummaryParagraph ? 5 : 0, maxScore: 5,
      status: ctx.hasSummaryParagraph ? 'pass' : 'warn',
      detail: ctx.hasSummaryParagraph ? '頁面有摘要或重點整理' : '缺少摘要段落',
      fix: ctx.hasSummaryParagraph ? '' : '在文章開頭或結尾加入 TL;DR 摘要',
    },
    {
      id: 'ai-search-score', label: 'AI 可搜尋性（AI 評估）',
      score: Math.round(ai.aiSearchability.score / 10 * 10), maxScore: 10,
      status: ai.aiSearchability.score >= 7 ? 'pass' : ai.aiSearchability.score >= 4 ? 'warn' : 'fail',
      detail: ai.aiSearchability.finding,
      fix: ai.aiSearchability.fix,
    },
  ]
  return { score: items.reduce((a, b) => a + b.score, 0), maxScore: 30, items }
}

export function composeReport(
  url: string,
  local: LocalScoreResult,
  ai: AIScoreResult | null,
  ctx: CleanContext,
  fromCache: boolean
): FinalReport {
  const googleTotal = local.technical.score + local.contentStructure.score + local.ux.score +
    (ai ? Math.round(ai.contentQuality.score * 1.5) : 0)

  let aiSearchTotal = local.aiQuantitative.score
  let citability: CategoryScore = { score: local.aiQuantitative.score, maxScore: 15, items: local.aiQuantitative.items }
  let structure: CategoryScore = { score: 0, maxScore: 30, items: [] }
  let eeat: CategoryScore = { score: 0, maxScore: 15, items: [] }
  let aiSearchabilityCategory: CategoryScore = { score: 0, maxScore: 10, items: [] }

  if (ai) {
    citability = buildCitabilityCategory(ctx, ai)
    structure = buildStructureCategory(ctx, ai)
    aiSearchTotal = citability.score + structure.score
    eeat = {
      score: Math.round(ai.eeatSignals.score * 1.5),
      maxScore: 15,
      items: [{
        id: 'eeat',
        label: 'E-E-A-T 綜合評估',
        score: Math.round(ai.eeatSignals.score * 1.5),
        maxScore: 15,
        status: ai.eeatSignals.score >= 7 ? 'pass' : ai.eeatSignals.score >= 4 ? 'warn' : 'fail',
        detail: ai.eeatSignals.finding,
        fix: ai.eeatSignals.fix,
      }],
    }
    aiSearchabilityCategory = {
      score: Math.round(ai.aiSearchability.score),
      maxScore: 10,
      items: [{
        id: 'ais',
        label: 'AI 搜尋引擎友善度',
        score: Math.round(ai.aiSearchability.score),
        maxScore: 10,
        status: ai.aiSearchability.score >= 7 ? 'pass' : ai.aiSearchability.score >= 4 ? 'warn' : 'fail',
        detail: ai.aiSearchability.finding,
        fix: ai.aiSearchability.fix,
      }],
    }
  }

  const allFixes = [
    ...local.technical.items.filter(i => i.status !== 'pass').map(i => i.fix),
    ...local.contentStructure.items.filter(i => i.status !== 'pass').map(i => i.fix),
    ...(ai ? [ai.contentQuality.fix, ai.aiSearchability.fix, ai.eeatSignals.fix] : []),
  ].filter(Boolean).slice(0, 3)

  return {
    url,
    analyzedAt: new Date().toISOString(),
    fromCache,
    googleSEO: {
      total: Math.min(100, googleTotal),
      maxTotal: 100,
      technical: local.technical,
      contentStructure: local.contentStructure,
      ux: local.ux,
    },
    aiSearch: {
      total: Math.min(100, aiSearchTotal),
      maxTotal: 100,
      citability,
      structure,
      eeat,
      aiSearchability: aiSearchabilityCategory,
    },
    aiInsights: ai,
    summary: ai?.summary ?? '無法取得 AI 分析結果，以下為技術面評估。',
    topPriorities: allFixes,
  }
}
