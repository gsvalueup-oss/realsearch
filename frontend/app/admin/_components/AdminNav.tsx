'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ACCENT, BORDER, TEXT, TEXT_MUTED } from '../_lib/adminStyles'

const NAV_ITEMS = [
  { label: '대시보드', href: '/admin' },
  { label: '정정 요청', href: '/admin/correction-requests' },
  { label: '데이터 관리', href: '/admin/sync' },
  { label: '방문자 분석', href: '/admin/visits' },
  { label: 'API 로그', href: '/admin/api-monitor' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: '7px 12px',
              borderRadius: 999,
              border: `1px solid ${active ? 'rgba(49,130,246,0.38)' : BORDER}`,
              color: active ? TEXT : TEXT_MUTED,
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              background: active ? 'rgba(49,130,246,0.14)' : 'rgba(255,255,255,0.03)',
              textDecoration: 'none',
              outlineColor: ACCENT,
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
