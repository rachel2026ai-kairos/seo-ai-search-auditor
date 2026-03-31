import * as cheerio from 'cheerio'
import { CleanContext } from './types'

function flattenSchemaTypes(schemas: object[]): string[] {
  const types: string[] = []
  for (const s of schemas) {
    const o = s as Record<string, unknown>
    const t = o['@type']
    if (Array.isArray(t)) types.push(...t.filter((x): x is string => typeof x === 'string'))
    else if (typeof t === 'string') types.push(t)
  }
  return types
}

export function preprocessHTML(html: string, baseUrl: string): CleanContext {
  const $ = cheerio.load(html)
  const origin = new URL(baseUrl).origin

  $('script:not([type="application/ld+json"]), style, noscript, iframe, svg').remove()

  const meta = {
    title: $('title').first().text().trim() || null,
    description: $('meta[name="description"]').attr('content') || null,
    canonical: $('link[rel="canonical"]').attr('href') || null,
    robots: $('meta[name="robots"]').attr('content') || null,
    ogTitle: $('meta[property="og:title"]').attr('content') || null,
    ogDescription: $('meta[property="og:description"]').attr('content') || null,
    ogImage: $('meta[property="og:image"]').attr('content') || null,
    twitterCard: $('meta[name="twitter:card"]').attr('content') || null,
    hreflang: $('link[rel="alternate"][hreflang]').map((_, el) => $(el).attr('hreflang') || '').get(),
  }

  const headings = {
    h1: $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean),
    h2: $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 10),
    h3: $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 10),
    h4: $('h4').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 5),
  }

  const schemas: object[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || '{}')
      if (Array.isArray(parsed)) schemas.push(...parsed)
      else schemas.push(parsed)
    } catch {
      /* skip invalid JSON-LD */
    }
  })
  const schemaTypes = flattenSchemaTypes(schemas)

  $('nav, header, footer, aside, .sidebar, .menu, .navigation, .ad, .advertisement').remove()
  const bodyText = $('main, article, [role="main"], body').first().text()
    .replace(/\s+/g, ' ').trim()
  const words = bodyText.split(/\s+/).filter(Boolean)
  const contentPreview = words.slice(0, 1000).join(' ')
  const wordCount = words.length

  const internalLinks: string[] = []
  const externalDomains = new Set<string>()
  let externalWithSource = 0
  let descriptiveAnchors = 0
  let totalAnchors = 0

  const nonDescriptive = ['click here', 'here', 'more', 'read more', 'learn more', 'link', '點此', '更多']

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const text = $(el).text().trim()
    totalAnchors++

    if (text.length > 3 && !nonDescriptive.includes(text.toLowerCase())) {
      descriptiveAnchors++
    }

    try {
      const resolved = href.startsWith('http')
        ? href
        : `${origin}${href.startsWith('/') ? '' : '/'}${href}`
      const url = new URL(resolved)
      if (url.origin === origin) {
        if (!internalLinks.includes(url.pathname)) internalLinks.push(url.pathname)
      } else {
        externalDomains.add(url.hostname)
        externalWithSource++
      }
    } catch {
      /* ignore bad href */
    }
  })

  const images = $('img')
  const imagesWithAlt = $('img[alt]').length
  const imageAltCoverage = images.length > 0 ? imagesWithAlt / images.length : 1

  const htmlStr = $.html()
  const hasAuthorInfo = !!(
    $('[itemprop="author"], [rel="author"], .author, .byline').length > 0 ||
    $('meta[name="author"]').length > 0
  )
  const hasDatePublished = !!(
    $('time[datetime], meta[property="article:published_time"], [itemprop="datePublished"]').length > 0
  )
  const hasFaqStructure = !!(
    $('details summary, [itemtype*="FAQPage"]').length > 0 ||
    schemaTypes.includes('FAQPage')
  )
  const hasListContent = $('ul li, ol li').length > 3
  const hasSummaryParagraph = !!(
    htmlStr.match(/tl;dr|tldr|summary|摘要|重點整理/i)
  )
  const hasBreadcrumb = !!(
    $('[itemtype*="BreadcrumbList"], nav[aria-label*="breadcrumb"], .breadcrumb').length > 0 ||
    schemaTypes.includes('BreadcrumbList')
  )
  const hasAboutPageLink = !!$('a[href*="about"]').length
  const hasSocialLinks = !!$(
    'a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="facebook.com"], a[href*="instagram.com"]'
  ).length

  return {
    meta,
    headings,
    schemas,
    schemaTypes,
    contentPreview,
    wordCount,
    links: {
      internal: internalLinks.slice(0, 20),
      externalDomains: Array.from(externalDomains).slice(0, 20),
      externalWithSource,
      descriptiveAnchors,
      totalAnchors,
    },
    hasHttps: baseUrl.startsWith('https'),
    hasFavicon: !!$('link[rel*="icon"]').length,
    hasViewportMeta: !!$('meta[name="viewport"]').length,
    imageAltCoverage,
    hasAuthorInfo,
    hasDatePublished,
    hasFaqStructure,
    hasListContent,
    hasSummaryParagraph,
    hasBreadcrumb,
    hasAboutPageLink,
    hasSocialLinks,
    internalLinkCount: internalLinks.length,
  }
}
