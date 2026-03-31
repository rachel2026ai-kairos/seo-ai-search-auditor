import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SEO & AI Search Auditor',
  description: 'Google SEO 與 AI 搜尋引擎優化分析',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased">{children}</body>
    </html>
  )
}
