import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Noto_Sans_KR } from 'next/font/google'
import ConditionalFooter from '@/components/ConditionalFooter'
import './globals.css'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://realsearch.kr'
const title = '리얼서치 | 전국 공인중개사·중개보조원 조회 서비스'
const description =
  '전국 공인중개사사무소, 공인중개사, 중개보조원 정보를 쉽게 조회하세요. 계약 전 정식 등록 여부와 소속 사무소를 확인할 수 있습니다.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: '리얼서치',
    locale: 'ko_KR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={notoSansKr.className}
        style={{ background: '#0A0E1A' }}
      >
        <div className="min-h-screen flex flex-col" style={{ background: '#0A0E1A' }}>
          <header
            className="sticky top-0 z-50 border-b"
            style={{
              background: '#0A0E1A',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(10, 14, 26, 0.8)',
            }}
          >
            <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center hover:opacity-80 transition">
                  <span className="text-white font-bold text-base sm:text-lg">리얼서치</span>
                </Link>
                <nav className="hidden md:flex gap-6 sm:gap-8">
                  <Link
                    href="/search"
                    className="text-sm font-500 hover:text-blue-400 transition"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    검색
                  </Link>
                  <Link
                    href="/advanced-search"
                    className="text-sm font-500 hover:text-blue-400 transition"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    상세검색
                  </Link>
                  <Link
                    href="/rankings"
                    className="text-sm font-500 hover:text-blue-400 transition"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    랭킹
                  </Link>
                </nav>
                <nav className="md:hidden flex gap-2 sm:gap-3">
                  <Link
                    href="/search"
                    className="text-xs sm:text-sm hover:text-blue-400 transition"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    검색
                  </Link>
                  <Link
                    href="/advanced-search"
                    className="text-xs sm:text-sm hover:text-blue-400 transition"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    상세검색
                  </Link>
                  <Link
                    href="/rankings"
                    className="text-xs sm:text-sm hover:text-blue-400 transition"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    랭킹
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          <main className="flex-grow w-full" style={{ background: '#0A0E1A' }}>
            {children}
          </main>

          <ConditionalFooter />
        </div>
      </body>
    </html>
  )
}
