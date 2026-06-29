import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'

// 로고 전용 — 깔끔한 기하학 고딕 (PLOTT 로고)
const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['700', '900'],
})

export const metadata: Metadata = {
  title: 'PLOTT - 식물을 콘텐츠처럼, 취향을 큐레이션하다',
  description: '식물 마켓플레이스이자 커뮤니티. 취향에 맞는 식물을 큐레이션해요.',
  metadataBase: new URL('https://plott.ai.kr'),
  openGraph: {
    title: 'PLOTT - 식물을 콘텐츠처럼, 취향을 큐레이션하다',
    description: '식물 마켓플레이스이자 커뮤니티. 취향에 맞는 식물을 큐레이션해요.',
    url: 'https://plott.ai.kr',
    siteName: 'PLOTT',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PLOTT - 식물 마켓플레이스 & 커뮤니티',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PLOTT - 식물을 콘텐츠처럼, 취향을 큐레이션하다',
    description: '식물 마켓플레이스이자 커뮤니티. 취향에 맞는 식물을 큐레이션해요.',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={outfit.variable}>
      <body className="min-h-screen flex flex-col bg-white text-charcoal">
        <Header />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  )
}
