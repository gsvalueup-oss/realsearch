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
  fetchUserStats,
  getCsvUploadUrl,
  refreshAdminStats,
  resetViews,
  uploadCsvWithProgress,
} from './_lib/adminApi'
import { clearStoredAdminPassword, readStoredAdminPassword, storeAdminPassword } from './_lib/adminAuth'
import {
  ACCENT,
  BORDER,
  TABLE_HOVER,
  TEXT,
  TEXT_MUTED,
  cardStyle,
  inputStyle,
  tdStyle,
  thStyle,
} from './_lib/adminStyles'
import type {
  APIStats,
  Stats,
  SyncResult,
  UserStats,
} from './_lib/adminTypes'

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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'processing'>('idle')
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  // 2단계 미리보기 상태
  const [uploadStep, setUploadStep] = useState<'idle' | 'preview_ready'>('idle')
  const [previewResult, setPreviewResult] = useState<SyncResult | null>(null)
  const [confirmDanger, setConfirmDanger] = useState(false)
  const loadDashboard = async (adminPassword = password) => {
    if (!adminPassword) return

    setLoading(true)
    setMessage('')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const [statsData, apiStatsData, userStatsData] = await Promise.all([
        fetchAdminStats(adminPassword, controller.signal),
        fetchApiStats(adminPassword, controller.signal),
        fetchUserStats(adminPassword, controller.signal),
      ])

      setPassword(adminPassword)
      setStats(statsData)
      setApiStats(apiStatsData)
      setUserStats(userStatsData)
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
    setUserStats(null)
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

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) { setMessage('파일을 선택하세요'); return }
    setLoading(true)
    setUploadProgress(0)
    setUploadPhase('uploading')
    setPreviewResult(null)
    setSyncResult(null)
    setMessage('')
    setConfirmDanger(false)

    const formData = new FormData()
    formData.append('file', csvFile)
    const url = getCsvUploadUrl({ password, csvType, dryRun: true })

    try {
      const data = await uploadCsvWithProgress({
        url,
        formData,
        onProgress: setUploadProgress,
        onUploaded: () => setUploadPhase('processing'),
      })
      setPreviewResult(data)
      setUploadStep('preview_ready')
      setMessage('')
    } catch (error: any) {
      setMessage(error.message || '분석 실패')
    } finally {
      setLoading(false)
      setUploadPhase('idle')
      setUploadProgress(0)
    }
  }

  const handleApply = async () => {
    if (!csvFile) { setMessage('파일이 없습니다. 다시 선택해 주세요.'); return }
    if (previewResult?.safety_warning && !confirmDanger) {
      setMessage('위험 경고를 확인한 후 체크박스를 선택해 주세요.')
      return
    }
    setLoading(true)
    setUploadProgress(0)
    setUploadPhase('uploading')
    setMessage('')

    const formData = new FormData()
    formData.append('file', csvFile)
    const url = getCsvUploadUrl({ password, csvType, dryRun: false })

    try {
      const data = await uploadCsvWithProgress({
        url,
        formData,
        onProgress: setUploadProgress,
        onUploaded: () => setUploadPhase('processing'),
      })
      setMessage(data.message)
      setSyncResult(data)
      setPreviewResult(null)
      setUploadStep('idle')
      setCsvFile(null)
      setConfirmDanger(false)
      setStats(await refreshAdminStats(password))
    } catch (error: any) {
      setMessage(error.message || 'CSV 적용 실패')
    } finally {
      setLoading(false)
      setUploadPhase('idle')
      setUploadProgress(0)
    }
  }

  const handleResetUpload = () => {
    setUploadStep('idle')
    setPreviewResult(null)
    setSyncResult(null)
    setConfirmDanger(false)
    setMessage('')
    setCsvFile(null)
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

          {/* CSV 업로드 */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 4 }}>CSV 업로드 및 데이터 동기화</h2>
            <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>먼저 분석하기로 변경 내용을 확인한 뒤 적용하세요.</p>

            {/* 진행 표시 */}
            {uploadPhase === 'uploading' && (
              <div style={{ marginBottom: 20 }}>
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
              <div style={{ marginBottom: 20 }}>
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
              </div>
            )}

            {/* Step 1: 파일 선택 */}
            {uploadStep === 'idle' && uploadPhase === 'idle' && (
              <form onSubmit={handlePreview} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 8 }}>데이터 타입</label>
                  <select value={csvType} onChange={(e) => setCsvType(e.target.value)} style={{ ...inputStyle, maxWidth: 240 }}>
                    <option value="office">사무소</option>
                    <option value="agent">중개업자</option>
                  </select>
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
                    국토부 전국 CSV 기준으로 완전 동기화합니다 (CSV에 없는 사무소는 폐업 처리)
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading || !csvFile}
                  style={{
                    padding: '12px 0', background: loading || !csvFile ? 'rgba(255,255,255,0.1)' : 'rgba(49,130,246,0.15)',
                    color: loading || !csvFile ? TEXT_MUTED : ACCENT,
                    border: `1px solid ${loading || !csvFile ? BORDER : 'rgba(49,130,246,0.3)'}`,
                    borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: loading || !csvFile ? 'not-allowed' : 'pointer',
                  }}
                >
                  🔍 분석하기 (미리보기)
                </button>
              </form>
            )}

            {/* Step 2: 미리보기 결과 */}
            {uploadStep === 'preview_ready' && previewResult && uploadPhase === 'idle' && (
              <div>
                {/* 요약 카운트 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: '신규 추가 예정', value: previewResult.inserted, color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
                    { label: '수정 예정', value: previewResult.updated, color: ACCENT, bg: 'rgba(49,130,246,0.08)' },
                    { label: '삭제 예정', value: previewResult.deleted, color: previewResult.safety_warning ? '#f87171' : TEXT_MUTED, bg: previewResult.safety_warning ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.04)' },
                  ].map((item) => (
                    <div key={item.label} style={{ textAlign: 'center', padding: '16px 8px', background: item.bg, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                      <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>{item.label}</p>
                      <p style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* 안전 경고 */}
                {previewResult.safety_warning && (
                  <div style={{ padding: '14px 16px', borderRadius: 8, marginBottom: 16, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
                    <p style={{ fontSize: 14, color: '#f87171', marginBottom: 10 }}>{previewResult.safety_warning}</p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={confirmDanger}
                        onChange={(e) => setConfirmDanger(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#f87171' }}
                      />
                      <span style={{ fontSize: 13, color: TEXT }}>위험을 인지하고 계속 진행합니다</span>
                    </label>
                  </div>
                )}

                {/* 변경 목록 미리보기 */}
                {previewResult.inserted_list.length > 0 && (
                  <SyncTable title={`신규 추가 예정 (${previewResult.inserted.toLocaleString()}개 중 최대 50개 표시)`} color="#34d399" bg="rgba(52,211,153,0.06)"
                    items={previewResult.inserted_list} csvType={csvType} showChanges={false} />
                )}
                {previewResult.updated_list.length > 0 && (
                  <SyncTable title={`수정 예정 (${previewResult.updated.toLocaleString()}개 중 최대 50개 표시)`} color={ACCENT} bg="rgba(49,130,246,0.06)"
                    items={previewResult.updated_list} csvType={csvType} showChanges={true} />
                )}
                {previewResult.deleted_list.length > 0 && (
                  <SyncTable title={`삭제 예정 (${previewResult.deleted.toLocaleString()}개 중 최대 50개 표시)`} color="#f87171" bg="rgba(248,113,113,0.06)"
                    items={previewResult.deleted_list} csvType={csvType} showChanges={false} />
                )}

                {/* 액션 버튼 */}
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button
                    onClick={handleResetUpload}
                    style={{
                      flex: 1, padding: '12px 0', background: 'rgba(255,255,255,0.06)',
                      color: TEXT_MUTED, border: `1px solid ${BORDER}`,
                      borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer',
                    }}
                  >
                    ← 다시 선택
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={loading || (!!previewResult.safety_warning && !confirmDanger)}
                    style={{
                      flex: 2, padding: '12px 0',
                      background: loading || (!!previewResult.safety_warning && !confirmDanger) ? 'rgba(255,255,255,0.1)' : ACCENT,
                      color: loading || (!!previewResult.safety_warning && !confirmDanger) ? TEXT_MUTED : '#fff',
                      border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15,
                      cursor: loading || (!!previewResult.safety_warning && !confirmDanger) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? '적용 중...' : '✓ 적용하기'}
                  </button>
                </div>
              </div>
            )}
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
                    <p style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</p>
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
    </AdminShell>
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
