import type { Stats } from '../_lib/adminTypes'
import { ACCENT, TABLE_HOVER, TEXT, TEXT_MUTED, cardStyle, tdStyle, thStyle } from '../_lib/adminStyles'

export default function PopularTables({ stats }: { stats: Stats }) {
  return (
    <>
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>인기 조회 사무소 TOP 10</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>순위</th>
                <th style={thStyle}>사무소명</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>조회수</th>
              </tr>
            </thead>
            <tbody>
              {stats.most_viewed_offices.map((office, idx) => (
                <tr key={office.registration_number} style={{ cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget.style.background = TABLE_HOVER)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{idx + 1}</td>
                  <td style={tdStyle}>{office.office_name}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: ACCENT }}>{office.view_count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>인기 조회 중개업자 TOP 10</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>순위</th>
                <th style={thStyle}>이름</th>
                <th style={thStyle}>소속 사무소</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>조회수</th>
              </tr>
            </thead>
            <tbody>
              {stats.most_viewed_agents.map((agent, idx) => (
                <tr key={agent.id}
                  onMouseEnter={e => (e.currentTarget.style.background = TABLE_HOVER)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{idx + 1}</td>
                  <td style={tdStyle}>{agent.name}</td>
                  <td style={{ ...tdStyle, color: TEXT_MUTED }}>{agent.office_name}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: ACCENT }}>{agent.view_count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
