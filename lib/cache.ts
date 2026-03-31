import crypto from 'crypto'
import { FinalReport } from './types'

function hashContext(data: object): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
}

async function getKV() {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv')
    return kv
  }
  return null
}

let redisPromise: Promise<import('ioredis').default | null> | null = null

async function getRedis(): Promise<import('ioredis').default | null> {
  if (process.env.CF_WORKER === '1') return null
  const url = process.env.REDIS_URL
  if (!url) return null
  if (!redisPromise) {
    redisPromise = (async () => {
      try {
        const { default: Redis } = await import('ioredis')
        return new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true })
      } catch {
        return null
      }
    })()
  }
  return redisPromise
}

export async function getCachedReport(contextHash: string): Promise<FinalReport | null> {
  try {
    const kv = await getKV()
    if (kv) {
      const cached = await kv.get<FinalReport>(`seo:${contextHash}`)
      return cached ?? null
    }
    const redis = await getRedis()
    if (!redis) return null
    const raw = await redis.get(`seo:${contextHash}`)
    if (!raw) return null
    return JSON.parse(raw) as FinalReport
  } catch {
    return null
  }
}

export async function setCachedReport(contextHash: string, report: FinalReport): Promise<void> {
  try {
    const kv = await getKV()
    const ttl = parseInt(process.env.CACHE_TTL_SECONDS || '86400', 10)
    if (kv) {
      await kv.set(`seo:${contextHash}`, report, { ex: ttl })
      return
    }
    const redis = await getRedis()
    if (!redis) return
    await redis.set(`seo:${contextHash}`, JSON.stringify(report), 'EX', ttl)
  } catch {
    /* graceful degradation */
  }
}

export { hashContext }
