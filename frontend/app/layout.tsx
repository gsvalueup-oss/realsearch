'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const isDetailPage = pathname.includes('/agent/') || pathname.includes('/office/')
  const showFooter = !isDetailPage
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning className={notoSansKr.className} style={{ background: '#0A0E1A' }}>
        <div className="min-h-screen flex flex-col" style={{ background: '#0A0E1A' }}>
          {/* 헤더 */}
          <header className="sticky top-0 z-50 border-b" style={{
            background: '#0A0E1A',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(10, 14, 26, 0.8)'
          }}>
            <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center hover:opacity-80 transition">
                  <span className="text-white font-bold text-base sm:text-lg">리얼서치</span>
                </Link>
                {/* 데스크탑 네비게이션 */}
                <nav className="hidden md:flex gap-6 sm:gap-8">
                  <Link href="/search" className="text-sm font-500 hover:text-blue-400 transition" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>검색</Link>
                  <Link href="/advanced-search" className="text-sm font-500 hover:text-blue-400 transition" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>세부검색</Link>
                  <Link href="/rankings" className="text-sm font-500 hover:text-blue-400 transition" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>랭킹</Link>
                </nav>
                {/* 모바일 네비게이션 */}
                <nav className="md:hidden flex gap-2 sm:gap-3">
                  <Link href="/search" className="text-xs sm:text-sm hover:text-blue-400 transition" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>검색</Link>
                  <Link href="/advanced-search" className="text-xs sm:text-sm hover:text-blue-400 transition" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>세부검색</Link>
                  <Link href="/rankings" className="text-xs sm:text-sm hover:text-blue-400 transition" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>랭킹</Link>
                </nav>
              </div>
            </div>
          </header>

          {/* 메인 컨텐츠 */}
          <main className="flex-grow w-full" style={{ background: '#0A0E1A' }}>
            {children}
          </main>

          {/* 푸터 */}
          {showFooter && <footer className="border-t mt-12 sm:mt-16" style={{ background: '#070B14', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-6 sm:mb-8">
                <div>
                  <h3 className="font-bold mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>서비스</h3>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs">
                    <li><a href="/search" className="footer-link block py-1 sm:py-2">검색</a></li>
                    <li><a href="/rankings" className="footer-link block py-1 sm:py-2">랭킹</a></li>
                    <li><a href="/advanced-search" className="footer-link block py-1 sm:py-2">세부검색</a></li>
                  </ul>
                </div>
                <div className="col-span-1">
                  <h3 className="font-bold mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>정보 출처</h3>
                  <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: '1.4' }}>공공데이터포털, 브이월드 개방데이터 기반</p>
                </div>
                <div className="col-span-1">
                  <h3 className="font-bold mb-3 sm:mb-4 text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>문의</h3>
                  <p className="text-xs break-all" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>realsearchvalue@gmail.com</p>
                </div>
              </div>

              {/* 면책 고지문 */}
              <div className="border-t pt-4 sm:pt-6" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  본 서비스는 참고용 조회 서비스입니다. 실제 등록상태는 관할 시·군·구청 또는 공식 부동산중개업 조회 서비스를 통해 최종 확인하시기 바랍니다.
                </p>
                <p className="text-xs mt-2 sm:mt-3" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                  &copy; 2026 RealSearch. All rights reserved.
                </p>
              </div>
            </div>
          </footer>}
        </div>
      </body>
    </html>
  )
}
