'use client'

// Cache bust
import { useState } from 'react'

interface Stats {
  total_offices: number
  active_offices: number
  total_agents: number
  most_viewed_offices: Array<{ registration_number: string; office_name: string; view_count: number }>
  most_viewed_agents: Array<{ id: number; name: string; office_name: string; view_count: number }>
}

interface APIStats {
  total_requests: number
  avg_response_time: number
  error_count: number
  endpoint_stats: Array<{ endpoint: string; method: string; count: number; avg_time: number }>
  recent_errors: Array<{ endpoint: string; method: string; status_code: number; response_time_ms: number; created_at: string }>
}

interface UserStats {
  total_unique_visitors: number
  total_visits: number
  daily_visitors: Array<{ date: string; unique_visitors: number; total_visits: number }>
  page_stats: Array<{ page: string; visit_count: number; unique_visitors: number }>
  hourly_stats: Array<{ hour: string; visit_count: number }>
  browser_stats: Array<{ user_agent: string; visit_count: number }>
  recent_visitors: Array<{ ip_address: string; page: string; visited_at: string; visit_count: number }>
}

interface SyncResult {
  message: string
  inserted: number
  updated: number
  deleted: number
  inserted_list: any[]
  updated_list: any[]
  deleted_list: any[]
}

const BG = '#0A0E1A'
const CARD_BG = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT = 'rgba(255,255,255,0.9)'
const TEXT_MUTED = 'rgba(255,255,255,0.5)'
const ACCENT = '#3182F6'
const TABLE_HEADER_BG = 'rgba(255,255,255,0.06)'
const TABLE_HOVER = 'rgba(255,255,255,0.03)'

const cardStyle: React.CSSProperties = {
  background: CARD_BG,
  borderRadius: 16,
  padding: 24,
  border: `1px solid ${BORDER}`,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  color: TEXT,
  outline: 'none',
}

const thStyle: React.CSSProperties = {
  padding: '12px 24px',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: TEXT_MUTED,
  background: TABLE_HEADER_BG,
  borderBottom: `1px solid ${BORDER}`,
}

const tdStyle: React.CSSProperties = {
  padding: '14px 24px',
  fontSize: 13,
  color: TEXT,
  borderBottom: `1px solid ${BORDER}`,
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [apiStats, setApiStats] = useState<APIStats | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvType, setCsvType] = useState('office')
  const [syncMode, setSyncMode] = useState('upsert')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'processing'>('idle')
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const getBaseURL = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) { setMessage('비밀번호를 입력하세요'); return }
    try {
      const base = getBaseURL()
      const [statsRes, apiStatsRes, userStatsRes] = await Promise.all([
        fetch(`${base}/api/admin/stats?password=${password}`),
        fetch(`${base}/api/admin/api-stats?password=${password}`),
        fetch(`${base}/api/admin/user-stats?password=${password}`),
      ])
      if (!statsRes.ok) throw new Error('인증 실패')
      setStats(await statsRes.json())
      setApiStats(await apiStatsRes.json())
      setUserStats(await userStatsRes.json())
      setAuthenticated(true)
      setMessage('인증 성공')
    } catch {
      setMessage('비밀번호가 잘못되었습니다')
      setPassword('')
    }
  }

  const handleResetViews = async () => {
    if (!window.confirm('정말 조회수를 초기화하시겠습니까?')) return
    setLoading(true)
    try {
      const base = getBaseURL()
      await fetch(`${base}/api/admin/reset-views?password=${password}`, { method: 'POST' })
      setMessage('조회수가 초기화되었습니다')
      const res = await fetch(`${base}/api/admin/stats?password=${password}`)
      setStats(await res.json())
    } catch {
      setMessage('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) { setMessage('파일을 선택하세요'); return }
    setLoading(true)
    setUploadProgress(0)
    setUploadPhase('uploading')
    setSyncResult(null)
    setMessage('')

    const base = getBaseURL()
    const formData = new FormData()
    formData.append('file', csvFile)
    const url = `${base}/api/admin/csv-upload?password=${password}&data_type=${csvType}&sync_mode=${syncMode}`

    try {
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
          }
        }

        xhr.upload.onload = () => {
          setUploadProgress(100)
          setUploadPhase('processing')
        }

        xhr.onload = () => {
          try {
            const result = JSON.parse(xhr.responseText)
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(result)
            } else {
              reject(new Error(result.detail || 'CSV 업로드 실패'))
            }
          } catch {
            reject(new Error('서버 응답 오류'))
          }
        }

        xhr.onerror = () => reject(new Error('네트워크 오류가 발생했습니다'))
        xhr.ontimeout = () => reject(new Error('요청 시간이 초과되었습니다'))

        xhr.open('POST', url)
        xhr.send(formData)
      })

      setMessage(data.message)
      setSyncResult(data)
      setCsvFile(null)
      const statsRes = await fetch(`${base}/api/admin/stats?password=${password}`)
      setStats(await statsRes.json())
    } catch (error: any) {
      setMessage(error.message || 'CSV 업로드 실패')
    } finally {
      setLoading(false)
      setUploadPhase('idle')
      setUploadProgress(0)
    }
  }

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        <div style={{ width: '100%', maxWidth: 400, ...cardStyle }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: TEXT, marginBottom: 24, textAlign: 'center' }}>관리자 로그인</h1>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: TEXT_MUTED, marginBottom: 8 }}>비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="관리자 비밀번호를 입력하세요"
              />
            </div>
            <button
              type="submit"
              style={{ width: '100%', padding: '10px 0', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
            >
              로그인
            </button>
          </form>
          {message && (
            <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center', color: message.includes('성공') ? '#34d399' : '#f87171' }}>
              {message}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 16px', background: BG, minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT }}>관리자 대시보드</h1>
        <button
          onClick={() => { setAuthenticated(false); setPassword(''); setStats(null) }}
          style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', color: TEXT_MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          로그아웃
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: 14,
          background: message.includes('성공') ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          color: message.includes('성공') ? '#34d399' : '#f87171',
          border: `1px solid ${message.includes('성공') ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
        }}>
          {message}
        </div>
      )}

      {stats && (
        <>
          {/* 기본 통계 */}
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

          {/* 인기 조회 사무소 */}
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

          {/* 인기 조회 중개업자 */}
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

          {/* CSV 업로드 */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>CSV 업로드 및 데이터 동기화</h2>
            <form onSubmit={handleCsvUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 8 }}>데이터 타입</label>
                  <select value={csvType} onChange={(e) => setCsvType(e.target.value)} style={inputStyle}>
                    <option value="office">사무소</option>
                    <option value="agent">중개업자</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 8 }}>동기화 방식</label>
                  <select value={syncMode} onChange={(e) => setSyncMode(e.target.value)} style={inputStyle}>
                    <option value="update">기존 데이터만 업데이트</option>
                    <option value="upsert">새 데이터 추가 + 기존 데이터 업데이트</option>
                    <option value="sync">완전 동기화 (추가/수정/삭제)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 8 }}>CSV 파일</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  style={inputStyle}
                  disabled={loading}
                />
                <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 6 }}>
                  {syncMode === 'update' && '기존 데이터만 업데이트합니다'}
                  {syncMode === 'upsert' && 'CSV의 새로운 데이터를 추가하고 기존 데이터를 업데이트합니다'}
                  {syncMode === 'sync' && 'CSV의 데이터로 완전히 동기화합니다 (CSV에 없는 데이터는 삭제됨)'}
                </p>
              </div>

              {uploadPhase === 'uploading' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: TEXT_MUTED }}>파일 전송 중...</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>{uploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, background: ACCENT, height: '100%', transition: 'width 0.2s ease' }} />
                  </div>
                </div>
              )}

              {uploadPhase === 'processing' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: TEXT_MUTED }}>서버 처리 중... (잠시 기다려 주세요)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>처리 중</span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      width: '40%', background: '#f59e0b', height: '100%',
                      animation: 'shimmer 1.4s ease-in-out infinite',
                    }} />
                  </div>
                  <style>{`
                    @keyframes shimmer {
                      0% { transform: translateX(-100%) scaleX(2.5); }
                      100% { transform: translateX(350%) scaleX(2.5); }
                    }
                  `}</style>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !csvFile}
                style={{
                  padding: '12px 0', background: loading || !csvFile ? 'rgba(255,255,255,0.1)' : ACCENT,
                  color: loading || !csvFile ? TEXT_MUTED : '#fff', border: 'none', borderRadius: 8,
                  fontWeight: 600, fontSize: 15, cursor: loading || !csvFile ? 'not-allowed' : 'pointer',
                }}
              >
                {uploadPhase === 'uploading' ? `전송 중... ${uploadProgress}%`
                  : uploadPhase === 'processing' ? '서버 처리 중...'
                  : 'CSV 업로드 및 동기화'}
              </button>
            </form>
          </div>

          {/* 동기화 결과 */}
          {syncResult && (
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>동기화 결과</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: '신규 추가', value: syncResult.inserted, color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
                  { label: '업데이트', value: syncResult.updated, color: ACCENT, bg: 'rgba(49,130,246,0.08)' },
                  { label: '삭제', value: syncResult.deleted, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: 'center', padding: '16px 8px', background: item.bg, borderRadius: 10 }}>
                    <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>{item.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {syncResult.inserted_list.length > 0 && (
                <SyncTable title={`추가된 항목 (${syncResult.inserted_list.length}개)`} color="#34d399" bg="rgba(52,211,153,0.06)"
                  items={syncResult.inserted_list} csvType={csvType} showChanges={false} />
              )}
              {syncResult.updated_list.length > 0 && (
                <SyncTable title={`업데이트된 항목 (${syncResult.updated_list.length}개)`} color={ACCENT} bg="rgba(49,130,246,0.06)"
                  items={syncResult.updated_list} csvType={csvType} showChanges={true} />
              )}
              {syncResult.deleted_list.length > 0 && (
                <SyncTable title={`삭제된 항목 (${syncResult.deleted_list.length}개)`} color="#f87171" bg="rgba(248,113,113,0.06)"
                  items={syncResult.deleted_list} csvType={csvType} showChanges={false} />
              )}
            </div>
          )}

          {/* 사용자 통계 */}
          {userStats && (
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

              {userStats.page_stats.length > 0 && (
                <div style={{ ...cardStyle, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>인기 페이지 TOP 10</h2>
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
                        {userStats.page_stats.map((page, idx) => (
                          <tr key={idx}
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
                          <tr key={idx}
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
          )}

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
    </div>
  )
}

function SyncTable({ title, color, bg, items, csvType, showChanges }: {
  title: string; color: string; bg: string; items: any[]; csvType: string; showChanges: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color, marginBottom: 8 }}>{title}</h3>
      <div style={{ background: bg, borderRadius: 8, overflow: 'auto', maxHeight: 256 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, background: 'transparent' }}>{csvType === 'office' ? '등록번호' : '이름'}</th>
              <th style={{ ...thStyle, background: 'transparent' }}>{csvType === 'office' ? '사무소명' : '소속'}</th>
              {showChanges && <th style={{ ...thStyle, background: 'transparent' }}>변경 항목</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ ...tdStyle, borderColor: 'rgba(255,255,255,0.05)' }}>
                  {csvType === 'office' ? item.registration_number : item.name}
                </td>
                <td style={{ ...tdStyle, borderColor: 'rgba(255,255,255,0.05)' }}>{item.office_name}</td>
                {showChanges && (
                  <td style={{ ...tdStyle, fontSize: 11, borderColor: 'rgba(255,255,255,0.05)' }}>
                    {Object.keys(item.changes).map(key => (
                      <div key={key} style={{ marginBottom: 2 }}>
                        <span style={{ fontWeight: 600 }}>{key}:</span> {item.changes[key].before} → {item.changes[key].after}
                      </div>
                    ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
