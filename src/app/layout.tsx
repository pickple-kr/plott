import type { Metadata } from 'next'
import { Playfair_Display, Noto_Serif_KR } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'

// 영문 세리프 — PLOTT 로고 전용
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
})

// 한글 명조 — 섹션 제목, 강조 문구
const notoSerifKR = Noto_Serif_KR({
  variable: '--font-noto-serif-kr',
  weight: ['400', '700', '900'],
  preload: false,
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PLOTT',
  description: '식물 마켓플레이스 & 커뮤니티',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${playfair.variable} ${notoSerifKR.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-charcoal">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  )
}
