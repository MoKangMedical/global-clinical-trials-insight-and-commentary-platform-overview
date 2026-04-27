import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '全球临床试验洞察平台',
  description: 'AI驱动的全球临床试验数据分析与评论平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
