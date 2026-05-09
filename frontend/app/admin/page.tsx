'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AdminLogin from './_components/AdminLogin'
import AdminShell from './_components/AdminShell'
import PopularTables from './_components/PopularTables'
import StatCards from './_components/StatCards'
import {
  fetchAdminStats,
  fetchApiStats,
  refreshAdminStats,
  resetViews,
} from './_lib/adminApi'
import { clearStoredAdminPassword, readStoredAdminPassword, storeAdminPassword } from './_lib/adminAuth'
import {
  ACCENT,
  BORDER,
  TABLE_HOVER,
  TEXT,
  TEXT_MUTED,
  cardStyle,
  tdStyle,
  thStyle,
} from './_lib/adminStyles'
import type {
  APIStats,
  Stats,
} from './_lib/adminTypes'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [apiStats, setApiStats] = useState<APIStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const loadDashboard = async (adminPassword = password) => {
    if (!adminPassword) return

    setLoading(true)
    setMessage('')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const [statsData, apiStatsData] = await Promise.all([
        fetchAdminStats(adminPassword, controller.signal),
        fetchApiStats(adminPassword, controller.signal),
      ])

      setPassword(adminPassword)
      setStats(statsData)
      setApiStats(apiStatsData)
      setAuthenticated(true)
      storeAdminPassword(adminPassword)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessage('??? ??? ? ????. (10? ??)')
      } else {
        setMessage('????? ???? ????.')
      }
      setPassword('')
      setAuthenticated(false)
      clearStoredAdminPassword()
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedPassword = readStoredAdminPassword()
    if (storedPassword) {
      loadDashboard(storedPassword)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setMessage('????? ?????.')
      return
    }
    await loadDashboard(password)
  }

  const handleLogout = () => {
    clearStoredAdminPassword()
    setAuthenticated(false)
    setPassword('')
    setStats(null)
    setApiStats(null)
    setMessage('')
  }

  const handleResetViews = async () => {
    if (!window.confirm('정말 조회수를 초기화하시겠습니까?')) return
    setLoading(true)
    try {
      await resetViews(password)
      setMessage('조회수가 초기화되었습니다')
      setStats(await refreshAdminStats(password))
    } catch {
      setMessage('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <AdminLogin
        password={password}
        loading={loading}
        message={message}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    )
  }

  return (
    <AdminShell
      message={message}
      onLogout={handleLogout}
    >
      {stats && (
        <>
          <StatCards stats={stats} />
          <PopularTables stats={stats} />

          <Link
            href="/admin/correction-requests"
            style={{
              ...cardStyle,
              display: 'block',
              marginBottom: 24,
              textDecoration: 'none',
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 6 }}>?? ?? ?? ??</h2>
            <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>
              ???? ??? ?? ?? ??? ???? ?? ??? ??? ??? ?????.
            </p>
          </Link>

          <Link
            href="/admin/sync"
            style={{
              ...cardStyle,
              display: 'block',
              marginBottom: 24,
              textDecoration: 'none',
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 6 }}>데이터 관리</h2>
            <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>
              CSV 업로드, 미리보기, 실제 적용 및 동기화 결과 관리는 별도 페이지에서 처리합니다.
            </p>
          </Link>

          <Link
            href="/admin/visits"
            style={{
              ...cardStyle,
              display: 'block',
              marginBottom: 24,
              textDecoration: 'none',
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 6 }}>방문자 분석</h2>
            <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>
              사용자 접속 통계, 인기 페이지, 최근 방문자 기록은 별도 페이지에서 확인합니다.
            </p>
          </Link>

          {/* API 모니터링 */}
          {apiStats && (
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
                        <tr key={idx}
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
                          <tr key={idx}
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
          )}

          {/* 관리 기능 */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>기타 관리 기능</h2>
            <button
              onClick={handleResetViews}
              disabled={loading}
              style={{
                width: '100%', padding: '12px 0', background: loading ? 'rgba(255,255,255,0.08)' : 'rgba(248,113,113,0.15)',
                color: loading ? TEXT_MUTED : '#f87171', border: `1px solid ${loading ? BORDER : 'rgba(248,113,113,0.3)'}`,
                borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '처리 중...' : '조회수 초기화'}
            </button>
          </div>
        </>
      )}
    </AdminShell>
  )
}
