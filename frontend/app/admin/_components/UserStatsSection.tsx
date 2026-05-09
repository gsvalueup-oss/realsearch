'use client'

import {
  ACCENT,
  TABLE_HOVER,
  TEXT,
  TEXT_MUTED,
  cardStyle,
  tdStyle,
  thStyle,
} from '../_lib/adminStyles'
import type { UserStats } from '../_lib/adminTypes'

interface UserStatsSectionProps {
  userStats: UserStats | null
  loading?: boolean
  error?: string
}

export default function UserStatsSection({
  userStats,
  loading = false,
  error = '',
}: UserStatsSectionProps) {
  if (loading) {
    return (
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: TEXT_MUTED }}>방문자 통계를 불러오는 중입니다...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        ...cardStyle,
        marginBottom: 24,
        color: '#f87171',
        border: '1px solid rgba(248,113,113,0.2)',
      }}>
        {error}
      </div>
    )
  }

  if (!userStats) {
    return (
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: TEXT_MUTED }}>표시할 방문자 통계가 없습니다.</p>
      </div>
    )
  }

  const topPages = userStats.page_stats.slice(0, 20)

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>사용자 접속 통계</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>총 고유 방문자</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: ACCENT }}>{userStats.total_unique_visitors.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>총 방문 수</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: TEXT }}>{userStats.total_visits.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>방문 페이지 수</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: TEXT }}>{userStats.page_stats.length.toLocaleString()}</p>
        </div>
      </div>

      {userStats.daily_visitors.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>일별 방문자 수</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>날짜</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>고유 방문자</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>총 방문 수</th>
                </tr>
              </thead>
              <tbody>
                {userStats.daily_visitors.map((day) => (
                  <tr key={day.date}
                    onMouseEnter={e => (e.currentTarget.style.background = TABLE_HOVER)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>{new Date(day.date).toLocaleDateString('ko-KR')}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: ACCENT }}>{day.unique_visitors.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{day.total_visits.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {topPages.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>인기 페이지 TOP 20</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>페이지</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>방문 수</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>고유 방문자</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((page, idx) => (
                  <tr key={`${page.page}-${idx}`}
                    onMouseEnter={e => (e.currentTarget.style.background = TABLE_HOVER)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>{page.page}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{page.visit_count.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: TEXT_MUTED }}>{page.unique_visitors.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {userStats.recent_visitors.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>최근 방문자</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>IP 주소</th>
                  <th style={thStyle}>마지막 방문 페이지</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>총 방문 수</th>
                  <th style={thStyle}>시간</th>
                </tr>
              </thead>
              <tbody>
                {userStats.recent_visitors.map((visitor, idx) => (
                  <tr key={`${visitor.ip_address}-${visitor.visited_at}-${idx}`}
                    onMouseEnter={e => (e.currentTarget.style.background = TABLE_HOVER)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>{visitor.ip_address}</td>
                    <td style={tdStyle}>{visitor.page}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{visitor.visit_count}</td>
                    <td style={{ ...tdStyle, color: TEXT_MUTED }}>{new Date(visitor.visited_at).toLocaleString('ko-KR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
