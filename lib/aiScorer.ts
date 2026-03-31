import { CleanContext, AIScoreResult } from './types'

const SYSTEM_PROMPT = `You are an Elite SEO Auditor specializing in 2026 Google E-E-A-T and GEO (Generative Engine Optimization) for AI search engines including ChatGPT Search, Perplexity, and Google AI Overview.

Analyze the structured page data provided. Be precise and evidence-based. Do not hallucinate. If information is missing from the data, explicitly state it is missing — never assume its presence.

Return ONLY a valid JSON object matching the exact schema provided. No markdown, no code blocks, no preamble, no explanation outside the JSON.`

function buildUserPrompt(ctx: CleanContext): string {
  return `Analyze this page's structured data and return qualitative SEO scores.

[PAGE DATA]
Title: ${ctx.meta.title ?? 'MISSING'}
Meta Description: ${ctx.meta.description ?? 'MISSING'}
H1: ${ctx.headings.h1.join(' | ') || 'MISSING'}
H2s (first 5): ${ctx.headings.h2.slice(0, 5).join(' | ') || 'none'}
Schema Types: ${ctx.schemaTypes.join(', ') || 'none'}
Word Count: ~${ctx.wordCount}
Content Preview (first 1000 words): ${ctx.contentPreview.slice(0, 2000)}
Has FAQ Structure: ${ctx.hasFaqStructure}
Has List Content: ${ctx.hasListContent}
Has Summary/TL;DR: ${ctx.hasSummaryParagraph}
Has Author Info: ${ctx.hasAuthorInfo}
Has Published Date: ${ctx.hasDatePublished}
Has Breadcrumb: ${ctx.hasBreadcrumb}
Has About Page Link: ${ctx.hasAboutPageLink}
Has Social Links: ${ctx.hasSocialLinks}
External Domains Referenced: ${ctx.links.externalDomains.slice(0, 10).join(', ') || 'none'}
[/PAGE DATA]

Score each of the 4 dimensions from 0-10 based on evidence in the data above.

Return this exact JSON (no other text):
{
  "contentQuality": {
    "score": <0-10>,
    "finding": "<one sentence describing what you found, in Traditional Chinese>",
    "fix": "<one actionable improvement, in Traditional Chinese>"
  },
  "brandAuthority": {
    "score": <0-10>,
    "finding": "<one sentence, Traditional Chinese>",
    "fix": "<one action, Traditional Chinese>"
  },
  "aiSearchability": {
    "score": <0-10>,
    "finding": "<one sentence, Traditional Chinese>",
    "fix": "<one action, Traditional Chinese>"
  },
  "eeatSignals": {
    "score": <0-10>,
    "finding": "<one sentence, Traditional Chinese>",
    "fix": "<one action, Traditional Chinese>"
  },
  "summary": "<3-sentence overall assessment in Traditional Chinese, covering strengths, weaknesses, and top priority>"
}`
}

function parseAIJson(text: string): AIScoreResult {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned) as AIScoreResult
}

export async function runAIScorer(ctx: CleanContext): Promise<AIScoreResult> {
  const provider = process.env.AI_PROVIDER || 'openai'

  if (provider === 'openai') {
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 800,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(ctx) },
      ],
    })
    const text = response.choices[0]?.message?.content || ''
    return parseAIJson(text)
  }

  if (provider === 'gemini') {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY || '')
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(
      `${SYSTEM_PROMPT}\n\n${buildUserPrompt(ctx)}`
    )
    const text = result.response.text()
    return parseAIJson(text)
  }

  throw new Error(`Unknown AI_PROVIDER: ${provider}`)
}
