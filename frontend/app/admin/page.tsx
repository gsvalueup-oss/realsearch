'use client'

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
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setMessage('비밀번호를 입력하세요')
      return
    }

    try {
      const baseURL = typeof window !== 'undefined'
        ? (window.location.hostname === 'localhost'
          ? 'http://localhost:8000'
          : 'https://realsearch-production-882c.up.railway.app')
        : 'https://realsearch-production-882c.up.railway.app'

      const [statsRes, apiStatsRes, userStatsRes] = await Promise.all([
        fetch(`${baseURL}/api/admin/stats?password=${password}`),
        fetch(`${baseURL}/api/admin/api-stats?password=${password}`),
        fetch(`${baseURL}/api/admin/user-stats?password=${password}`),
      ])

      if (!statsRes.ok) throw new Error('인증 실패')

      setStats(await statsRes.json())
      setApiStats(await apiStatsRes.json())
      setUserStats(await userStatsRes.json())
      setAuthenticated(true)
      setMessage('인증 성공')
    } catch (error) {
      setMessage('비밀번호가 잘못되었습니다')
      setPassword('')
    }
  }

  const handleResetViews = async () => {
    if (!window.confirm('정말 조회수를 초기화하시겠습니까?')) return

    setLoading(true)
    try {
      const baseURL = typeof window !== 'undefined'
        ? (window.location.hostname === 'localhost'
          ? 'http://localhost:8000'
          : 'https://realsearch-production-882c.up.railway.app')
        : 'https://realsearch-production-882c.up.railway.app'

      await fetch(`${baseURL}/api/admin/reset-views?password=${password}`, {
        method: 'POST'
      })
      setMessage('조회수가 초기화되었습니다')
      const res = await fetch(`${baseURL}/api/admin/stats?password=${password}`)
      setStats(await res.json())
    } catch (error) {
      setMessage('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) {
      setMessage('파일을 선택하세요')
      return
    }

    setLoading(true)
    setUploadProgress(0)
    try {
      const baseURL = typeof window !== 'undefined'
        ? (window.location.hostname === 'localhost'
          ? 'http://localhost:8000'
          : 'https://realsearch-production-882c.up.railway.app')
        : 'https://realsearch-production-882c.up.railway.app'

      const formData = new FormData()
      formData.append('file', csvFile)

      const res = await fetch(
        `${baseURL}/api/admin/csv-upload?password=${password}&data_type=${csvType}&sync_mode=${syncMode}`,
        { method: 'POST', body: formData }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'CSV 업로드 실패')
      }

      const data = await res.json()
      setMessage(data.message)
      setSyncResult(data)
      setUploadProgress(100)
      setCsvFile(null)
      setTimeout(() => setUploadProgress(0), 1000)

      const statsRes = await fetch(`${baseURL}/api/admin/stats?password=${password}`)
      setStats(await statsRes.json())
    } catch (error: any) {
      setMessage(error.message || 'CSV 업로드 실패')
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">관리자 로그인</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="관리자 비밀번호를 입력하세요"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              로그인
            </button>
          </form>
          {message && (
            <p className={`mt-4 text-sm text-center ${message.includes('성공') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">관리자 대시보드</h1>
        <button
          onClick={() => {
            setAuthenticated(false)
            setPassword('')
            setStats(null)
          }}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
        >
          로그아웃
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.includes('성공') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {stats && (
        <>
          {/* 기본 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-sm text-gray-600 mb-2">전체 사무소</h3>
              <p className="text-4xl font-bold text-gray-900">{stats.total_offices.toLocaleString()}</p>
            </div>
            <div className="card">
              <h3 className="text-sm text-gray-600 mb-2">영업중 사무소</h3>
              <p className="text-4xl font-bold text-green-600">{stats.active_offices.toLocaleString()}</p>
            </div>
            <div className="card">
              <h3 className="text-sm text-gray-600 mb-2">전체 중개업자</h3>
              <p className="text-4xl font-bold text-gray-900">{stats.total_agents.toLocaleString()}</p>
            </div>
          </div>

          {/* 인기 조회 사무소 */}
          <div className="card mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">인기 조회 사무소 TOP 10</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">순위</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">사무소명</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">조회수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.most_viewed_offices.map((office, idx) => (
                    <tr key={office.registration_number} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{office.office_name}</td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        {office.view_count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 인기 조회 중개업자 */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">인기 조회 중개업자 TOP 10</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">순위</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">이름</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">소속 사무소</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">조회수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.most_viewed_agents.map((agent, idx) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{agent.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{agent.office_name}</td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        {agent.view_count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CSV 업로드 */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">CSV 업로드 및 데이터 동기화</h2>
            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    데이터 타입
                  </label>
                  <select
                    value={csvType}
                    onChange={(e) => setCsvType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="office">사무소</option>
                    <option value="agent">중개업자</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    동기화 방식
                  </label>
                  <select
                    value={syncMode}
                    onChange={(e) => setSyncMode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="update">기존 데이터만 업데이트</option>
                    <option value="upsert">새 데이터 추가 + 기존 데이터 업데이트</option>
                    <option value="sync">완전 동기화 (추가/수정/삭제)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV 파일
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {syncMode === 'update' && '기존 데이터만 업데이트합니다'}
                  {syncMode === 'upsert' && 'CSV의 새로운 데이터를 추가하고 기존 데이터를 업데이트합니다'}
                  {syncMode === 'sync' && 'CSV의 데이터로 완전히 동기화합니다 (CSV에 없는 데이터는 삭제됨)'}
                </p>
              </div>

              {loading && uploadProgress > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">업로드 진행 중...</span>
                    <span className="text-sm font-semibold text-gray-900">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !csvFile}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 font-semibold"
              >
                {loading ? '처리 중...' : 'CSV 업로드 및 동기화'}
              </button>
            </form>
          </div>

          {/* 동기화 결과 */}
          {syncResult && (
            <div className="card mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">동기화 결과</h2>

              {/* 요약 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">신규 추가</p>
                  <p className="text-3xl font-bold text-green-600">{syncResult.inserted}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">업데이트</p>
                  <p className="text-3xl font-bold text-blue-600">{syncResult.updated}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">삭제</p>
                  <p className="text-3xl font-bold text-red-600">{syncResult.deleted}</p>
                </div>
              </div>

              {/* 신규 추가 목록 */}
              {syncResult.inserted_list.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-green-700 mb-3">추가된 항목 ({syncResult.inserted_list.length}개)</h3>
                  <div className="bg-green-50 rounded-lg overflow-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left">{csvType === 'office' ? '등록번호' : '이름'}</th>
                          <th className="px-4 py-2 text-left">{csvType === 'office' ? '사무소명' : '소속'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncResult.inserted_list.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-2">{csvType === 'office' ? item.registration_number : item.name}</td>
                            <td className="px-4 py-2">{item.office_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 업데이트 목록 */}
              {syncResult.updated_list.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-blue-700 mb-3">업데이트된 항목 ({syncResult.updated_list.length}개)</h3>
                  <div className="bg-blue-50 rounded-lg overflow-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-100 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left">{csvType === 'office' ? '등록번호' : '이름'}</th>
                          <th className="px-4 py-2 text-left">{csvType === 'office' ? '사무소명' : '소속'}</th>
                          <th className="px-4 py-2 text-left">변경 항목</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncResult.updated_list.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-2">{csvType === 'office' ? item.registration_number : item.name}</td>
                            <td className="px-4 py-2">{item.office_name}</td>
                            <td className="px-4 py-2 text-xs">
                              {Object.keys(item.changes).map(key => (
                                <div key={key} className="mb-1">
                                  <span className="font-semibold">{key}:</span> {item.changes[key].before} → {item.changes[key].after}
                                </div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 삭제 목록 */}
              {syncResult.deleted_list.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-red-700 mb-3">삭제된 항목 ({syncResult.deleted_list.length}개)</h3>
                  <div className="bg-red-50 rounded-lg overflow-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-red-100 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left">{csvType === 'office' ? '등록번호' : '이름'}</th>
                          <th className="px-4 py-2 text-left">{csvType === 'office' ? '사무소명' : '소속'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncResult.deleted_list.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-2">{csvType === 'office' ? item.registration_number : item.name}</td>
                            <td className="px-4 py-2">{item.office_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 사용자 통계 */}
          {userStats && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">사용자 접속 통계</h2>

              {/* 기본 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card">
                  <h3 className="text-sm text-gray-600 mb-2">총 고유 방문자</h3>
                  <p className="text-4xl font-bold text-blue-600">{userStats.total_unique_visitors.toLocaleString()}</p>
                </div>
                <div className="card">
                  <h3 className="text-sm text-gray-600 mb-2">총 방문 수</h3>
                  <p className="text-4xl font-bold text-gray-900">{userStats.total_visits.toLocaleString()}</p>
                </div>
              </div>

              {/* 일별 방문자 수 */}
              {userStats.daily_visitors.length > 0 && (
                <div className="card mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">일별 방문자 수</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">날짜</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">고유 방문자</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">총 방문 수</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {userStats.daily_visitors.map((day) => (
                          <tr key={day.date} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{new Date(day.date).toLocaleDateString('ko-KR')}</td>
                            <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{day.unique_visitors.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center text-sm text-gray-900">{day.total_visits.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 페이지별 방문 수 */}
              {userStats.page_stats.length > 0 && (
                <div className="card mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">인기 페이지 TOP 10</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">페이지</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">방문 수</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">고유 방문자</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {userStats.page_stats.map((page, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{page.page}</td>
                            <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{page.visit_count.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center text-sm text-gray-900">{page.unique_visitors.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 최근 방문자 */}
              {userStats.recent_visitors.length > 0 && (
                <div className="card mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">최근 방문자</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">IP 주소</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">마지막 방문 페이지</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">총 방문 수</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">시간</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {userStats.recent_visitors.map((visitor, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{visitor.ip_address}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{visitor.page}</td>
                            <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{visitor.visit_count}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(visitor.visited_at).toLocaleString('ko-KR')}</td>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card">
                  <h3 className="text-sm text-gray-600 mb-2">총 요청 수</h3>
                  <p className="text-4xl font-bold text-gray-900">{apiStats.total_requests.toLocaleString()}</p>
                </div>
                <div className="card">
                  <h3 className="text-sm text-gray-600 mb-2">평균 응답 시간</h3>
                  <p className="text-4xl font-bold text-blue-600">{apiStats.avg_response_time.toLocaleString()}ms</p>
                </div>
                <div className="card">
                  <h3 className="text-sm text-gray-600 mb-2">에러 수</h3>
                  <p className="text-4xl font-bold text-red-600">{apiStats.error_count.toLocaleString()}</p>
                </div>
              </div>

              {/* 엔드포인트별 통계 */}
              <div className="card mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">엔드포인트별 통계</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">엔드포인트</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">메서드</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">요청 수</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">평균 시간(ms)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {apiStats.endpoint_stats.map((stat, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{stat.endpoint}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {stat.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">{stat.count.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-900">{stat.avg_time.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 최근 에러 */}
              {apiStats.recent_errors.length > 0 && (
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">최근 에러 (7일)</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">엔드포인트</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">메서드</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">상태 코드</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">응답 시간</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">시간</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {apiStats.recent_errors.map((error, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{error.endpoint}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                {error.method}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-sm">
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                {error.status_code}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-gray-900">{error.response_time_ms}ms</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(error.created_at).toLocaleString('ko-KR')}
                            </td>
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
          <div className="card mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">기타 관리 기능</h2>
            <div className="space-y-3">
              <button
                onClick={handleResetViews}
                disabled={loading}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 font-semibold"
              >
                {loading ? '처리 중...' : '조회수 초기화'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
