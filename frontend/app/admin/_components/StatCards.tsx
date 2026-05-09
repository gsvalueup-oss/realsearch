import type { Stats } from '../_lib/adminTypes'
import { ACCENT, TEXT, TEXT_MUTED, cardStyle } from '../_lib/adminStyles'

export default function StatCards({ stats }: { stats: Stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
      {[
        { label: '전체 사무소', value: stats.total_offices.toLocaleString(), color: TEXT },
        { label: '영업중 사무소', value: stats.active_offices.toLocaleString(), color: '#34d399' },
        { label: '전체 중개업자', value: stats.total_agents.toLocaleString(), color: ACCENT },
      ].map((item) => (
        <div key={item.label} style={cardStyle}>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>{item.label}</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: item.color }}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}
