export interface CleanContext {
  meta: {
    title: string | null
    description: string | null
    canonical: string | null
    robots: string | null
    ogTitle: string | null
    ogDescription: string | null
    ogImage: string | null
    twitterCard: string | null
    hreflang: string[]
  }
  headings: {
    h1: string[]
    h2: string[]
    h3: string[]
    h4: string[]
  }
  schemas: object[]
  schemaTypes: string[]
  contentPreview: string
  wordCount: number
  links: {
    internal: string[]
    externalDomains: string[]
    externalWithSource: number
    descriptiveAnchors: number
    totalAnchors: number
  }
  hasHttps: boolean
  hasFavicon: boolean
  hasViewportMeta: boolean
  imageAltCoverage: number
  hasAuthorInfo: boolean
  hasDatePublished: boolean
  hasFaqStructure: boolean
  hasListContent: boolean
  hasSummaryParagraph: boolean
  hasBreadcrumb: boolean
  hasAboutPageLink: boolean
  hasSocialLinks: boolean
  internalLinkCount: number
}

export interface CheckItem {
  id: string
  label: string
  score: number
  maxScore: number
  status: 'pass' | 'warn' | 'fail'
  detail: string
  fix: string
}

export interface CategoryScore {
  score: number
  maxScore: number
  items: CheckItem[]
}

export interface AIInsight {
  score: number
  finding: string
  fix: string
}

export interface AIScoreResult {
  contentQuality: AIInsight
  brandAuthority: AIInsight
  aiSearchability: AIInsight
  eeatSignals: AIInsight
  summary: string
}

export interface LocalScoreResult {
  technical: CategoryScore
  contentStructure: CategoryScore
  ux: CategoryScore
  aiQuantitative: CategoryScore
}

export interface FinalReport {
  url: string
  analyzedAt: string
  fromCache: boolean
  googleSEO: {
    total: number
    maxTotal: number
    technical: CategoryScore
    contentStructure: CategoryScore
    ux: CategoryScore
  }
  aiSearch: {
    total: number
    maxTotal: number
    citability: CategoryScore
    structure: CategoryScore
    eeat: CategoryScore
    aiSearchability: CategoryScore
  }
  aiInsights: AIScoreResult | null
  summary: string
  topPriorities: string[]
}
