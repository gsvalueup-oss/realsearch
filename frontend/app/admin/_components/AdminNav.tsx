import { BORDER, TEXT_MUTED } from '../_lib/adminStyles'

export default function AdminNav() {
  const items = ['대시보드', '정정 요청', 'CSV 동기화', '방문 통계', 'API 모니터링', '설정']

  return (
    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            border: `1px solid ${BORDER}`,
            color: TEXT_MUTED,
            fontSize: 12,
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          {item}
        </span>
      ))}
    </nav>
  )
}
