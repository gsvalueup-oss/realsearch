'use client'

import { usePathname } from 'next/navigation'

export default function ConditionalFooter() {
  const pathname = usePathname()
  const isDetailPage = pathname.includes('/agent/') || pathname.includes('/office/')

  if (isDetailPage) {
    return null
  }

  return (
    <footer
      className="border-t mt-12 sm:mt-16"
      style={{ background: '#070B14', borderColor: 'rgba(255, 255, 255, 0.08)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <h3
              className="font-bold mb-3 sm:mb-4 text-xs sm:text-sm"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              서비스
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs">
              <li>
                <a href="/search" className="footer-link block py-1 sm:py-2">
                  검색
                </a>
              </li>
              <li>
                <a href="/rankings" className="footer-link block py-1 sm:py-2">
                  랭킹
                </a>
              </li>
              <li>
                <a href="/advanced-search" className="footer-link block py-1 sm:py-2">
                  상세검색
                </a>
              </li>
            </ul>
          </div>
          <div className="col-span-1">
            <h3
              className="font-bold mb-3 sm:mb-4 text-xs sm:text-sm"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              정보 출처
            </h3>
            <p
              className="text-xs"
              style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: '1.4' }}
            >
              공공데이터포털 브이월드 개방데이터 기반
            </p>
          </div>
          <div className="col-span-1">
            <h3
              className="font-bold mb-3 sm:mb-4 text-xs sm:text-sm"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              문의
            </h3>
            <p
              className="text-xs break-all"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              realsearchvalue@gmail.com
            </p>
          </div>
        </div>

        <div className="border-t pt-4 sm:pt-6" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            본 서비스는 참고용 조회 서비스입니다. 실제 등록상태는 관할 구청 또는 공식 부동산중개업 조회 서비스를 통해 최종 확인하시기 바랍니다.
          </p>
          <p className="text-xs mt-2 sm:mt-3" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
            &copy; 2026 RealSearch. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
