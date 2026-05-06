import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RealSearch - 부동산중개업 정보 조회',
  description: '전국 공인중개사무소, 소속공인중개사, 중개보조원 정보 검색 및 분석',
  keywords: ['부동산', '공인중개사', '중개사무소', '중개보조원', '검색'],
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning className={notoSansKr.className} style={{ background: '#f5f7fa' }}>
        <div className="min-h-screen flex flex-col bg-gray-50">
          {/* 헤더 */}
          <header className="sticky top-0 z-50 bg-white border-b border-gray-200" style={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}>
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center hover:opacity-80 transition">
                  <Image
                    src="/favicon.png"
                    alt="RealSearch"
                    width={36}
                    height={36}
                    className="mr-2"
                    priority
                  />
                  <Image
                    src="/logo.png"
                    alt="RealSearch Logo"
                    width={100}
                    height={32}
                    className="h-auto hidden sm:block"
                    priority
                  />
                </Link>
                {/* 데스크탑 네비게이션 */}
                <nav className="hidden md:flex gap-8">
                  <Link href="/search" className="text-sm font-500 text-gray-700 hover:text-blue-600 transition">검색</Link>
                  <Link href="/advanced-search" className="text-sm font-500 text-gray-700 hover:text-blue-600 transition">세부검색</Link>
                  <Link href="/rankings" className="text-sm font-500 text-gray-700 hover:text-blue-600 transition">랭킹</Link>
                </nav>
                {/* 모바일 네비게이션 */}
                <nav className="md:hidden flex gap-3">
                  <Link href="/search" className="text-xs text-gray-700 hover:text-blue-600 transition">검색</Link>
                  <Link href="/advanced-search" className="text-xs text-gray-700 hover:text-blue-600 transition">세부검색</Link>
                  <Link href="/rankings" className="text-xs text-gray-700 hover:text-blue-600 transition">랭킹</Link>
                </nav>
              </div>
            </div>
          </header>

          {/* 메인 컨텐츠 */}
          <main className="flex-grow w-full" style={{ background: '#f5f7fa' }}>
            {children}
          </main>

          {/* 푸터 */}
          <footer className="bg-gray-50 border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-4 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 text-sm">서비스</h3>
                  <ul className="space-y-2 text-xs">
                    <li><a href="/search" className="block py-2 text-gray-600 hover:text-blue-600 transition">검색</a></li>
                    <li><a href="/rankings" className="block py-2 text-gray-600 hover:text-blue-600 transition">랭킹</a></li>
                    <li><a href="/advanced-search" className="block py-2 text-gray-600 hover:text-blue-600 transition">세부검색</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 text-sm">정보 출처</h3>
                  <p className="text-xs text-gray-600">공공데이터포털, 브이월드 개방데이터 기반</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 text-sm">문의</h3>
                  <p className="text-xs text-gray-600">realsearchvalue@gmail.com</p>
                </div>
              </div>

              {/* 면책 고지문 */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-xs text-gray-600 leading-relaxed">
                  본 서비스는 참고용 조회 서비스입니다. 실제 등록상태는 관할 시·군·구청 또는 공식 부동산중개업 조회 서비스를 통해 최종 확인하시기 바랍니다.
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  &copy; 2026 RealSearch. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
