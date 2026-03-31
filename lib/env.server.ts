import 'server-only'

/**
 * 僅在伺服器／Cloudflare Worker 執行。API 金鑰請勿使用 NEXT_PUBLIC_ 前綴。
 *
 * 生產環境請在 Cloudflare Dashboard：
 * Workers & Pages → ai-seo-website → Settings → Variables and Secrets
 * 新增 Secret：GOOGLE_GENERATIVE_AI_KEY、OPENAI_API_KEY（擇一或兩者）
 * 一般變數：AI_PROVIDER（gemini / openai）
 */

export function getAiProvider(): 'openai' | 'gemini' {
  const p = (process.env.AI_PROVIDER || 'openai').toLowerCase()
  return p === 'gemini' ? 'gemini' : 'openai'
}

export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY
}

export function getGoogleGenerativeAiKey(): string | undefined {
  return process.env.GOOGLE_GENERATIVE_AI_KEY
}
