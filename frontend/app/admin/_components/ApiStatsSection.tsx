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
import type { APIStats } from '../_lib/adminTypes'

interface ApiStatsSectionProps {
  apiStats: APIStats | null
  loading?: boolean
  error?: string
}

export default function ApiStatsSection({
  apiStats,
  loading = false,
  error = '',
}: ApiStatsSectionProps) {
  if (loading) {
    return (
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: TEXT_MUTED }}>API 통계를 불러오는 중입니다...</p>
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

  if (!apiStats) {
    return (
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: TEXT_MUTED }}>표시할 API 통계가 없습니다.</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>총 요청 수</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: TEXT }}>{apiStats.total_requests.toLocaleString()}</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>평균 응답 시간</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: ACCENT }}>{apiStats.avg_response_time.toLocaleString()}ms</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8 }}>에러 수</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#f87171' }}>{apiStats.error_count.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>엔드포인트별 통계</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>엔드포인트</th>
                <th style={thStyle}>메서드</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>요청 수</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>평균 시간(ms)</th>
              </tr>
            </thead>
            <tbody>
              {apiStats.endpoint_stats.map((stat, idx) => (
                <tr key={`${stat.method}-${stat.endpoint}-${idx}`}
                  onMouseEnter={e => (e.currentTarget.style.background = TABLE_HOVER)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={tdStyle}>{stat.endpoint}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '2px 8px', background: 'rgba(49,130,246,0.15)', color: ACCENT, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      {stat.method}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{stat.count.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{stat.avg_time.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {apiStats.recent_errors.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>최근 에러 (7일)</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>엔드포인트</th>
                  <th style={thStyle}>메서드</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>상태 코드</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>응답 시간</th>
                  <th style={thStyle}>시간</th>
                </tr>
              </thead>
              <tbody>
                {apiStats.recent_errors.map((error, idx) => (
                  <tr key={`${error.method}-${error.endpoint}-${error.created_at}-${idx}`}
                    onMouseEnter={e => (e.currentTarget.style.background = TABLE_HOVER)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={tdStyle}>{error.endpoint}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '2px 8px', background: 'rgba(49,130,246,0.15)', color: ACCENT, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {error.method}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', background: 'rgba(248,113,113,0.15)', color: '#f87171', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {error.status_code}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{error.response_time_ms}ms</td>
                    <td style={{ ...tdStyle, color: TEXT_MUTED }}>{new Date(error.created_at).toLocaleString('ko-KR')}</td>
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
