'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DailyChange {
  sync_date: string
  has_data: boolean
  inserted: number
  updated: number
  deleted: number
  new_list: OfficeItem[]
  closed_list: OfficeItem[]
  updated_list: UpdatedItem[]
}

interface OfficeItem {
  registration_number: string
  office_name: string
  sido: string | null
  sigungu: string | null
}

interface UpdatedItem {
  registration_number: string
  office_name: string
  sido: string | null
  sigungu: string | null
  changes: Record<string, { before: any; after: any }>
}

interface RecentDay {
  sync_date: string
  inserted: number
  updated: number
  deleted: number
}

const FIELD_LABELS: Record<string, string> = {
  office_name: '사무소명', representative_name: '대표자명',
  address: '주소', road_address: '도로명주소',
  phone_number: '전화번호', status: '영업상태',
  sido: '시도', sigungu: '시군구',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function ChangesPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [data, setData] = useState<DailyChange | null>(null)
  const [recentDays, setRecentDays] = useState<RecentDay[]>([])
  const [loading, setLoading] = useState(false)
  const [sidoFilter, setSidoFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'new' | 'closed' | 'updated'>('new')

  const getBaseURL = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${getBaseURL()}/api/changes/recent?days=30`)
      .then(r => r.json())
      .then(setRecentDays)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`${getBaseURL()}/api/changes/daily?target_date=${selectedDate}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedDate])

  const sidos = [...new Set([
    ...(data?.new_list || []).map(o => o.sido).filter(Boolean),
    ...(data?.closed_list || []).map(o => o.sido).filter(Boolean),
    ...(data?.updated_list || []).map(o => o.sido).filter(Boolean),
  ])].sort() as string[]

  const filtered = {
    new: (data?.new_list || []).filter(o => !sidoFilter || o.sido === sidoFilter),
    closed: (data?.closed_list || []).filter(o => !sidoFilter || o.sido === sidoFilter),
    updated: (data?.updated_list || []).filter(o => !sidoFilter || o.sido === sidoFilter),
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* 헤더 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eef5', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#3b82f6', fontSize: 14, fontWeight: 500 }}>
            ← 홈으로
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a202c', margin: 0 }}>
            중개업 일별 변동 현황
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {/* 날짜 선택 + 최근 현황 */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, marginBottom: 24 }}>
          {/* 날짜 선택 */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e8eef5' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 12 }}>날짜 선택</p>
            <input
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', border: '1.5px solid #e8eef5',
                borderRadius: 8, fontSize: 14, color: '#1a202c', outline: 'none',
                background: '#f9fafc', boxSizing: 'border-box',
              }}
            />
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {recentDays.slice(0, 14).map(d => (
                <button
                  key={d.sync_date}
                  onClick={() => setSelectedDate(d.sync_date)}
                  style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: 'none',
                    background: selectedDate === d.sync_date ? '#3b82f6' : '#eff6ff',
                    color: selectedDate === d.sync_date ? '#fff' : '#3b82f6',
                    fontWeight: 500,
                  }}
                >
                  {d.sync_date.slice(5)}
                </button>
              ))}
            </div>
          </div>

          {/* 최근 30일 통계 */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e8eef5' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 12 }}>최근 30일 누적</p>
            {recentDays.length === 0 ? (
              <p style={{ fontSize: 13, color: '#8a95a8' }}>데이터 없음 — CSV 업로드 후 기록됩니다</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: '신규 개업', value: recentDays.reduce((s, d) => s + d.inserted, 0), color: '#059669' },
                    { label: '정보 변경', value: recentDays.reduce((s, d) => s + d.updated, 0), color: '#3b82f6' },
                    { label: '폐업', value: recentDays.reduce((s, d) => s + d.deleted, 0), color: '#dc2626' },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: 'center', padding: '12px 8px', background: '#f9fafc', borderRadius: 8 }}>
                      <p style={{ fontSize: 11, color: '#8a95a8', marginBottom: 4 }}>{item.label}</p>
                      <p style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
                  {recentDays.slice(0, 30).reverse().map(d => {
                    const max = Math.max(...recentDays.map(r => r.inserted + r.deleted), 1)
                    const h = Math.max(4, ((d.inserted + d.deleted) / max) * 36)
                    return (
                      <div
                        key={d.sync_date}
                        title={`${d.sync_date}: 신규 ${d.inserted} 폐업 ${d.deleted}`}
                        onClick={() => setSelectedDate(d.sync_date)}
                        style={{
                          flex: 1, height: h, background: '#3b82f6', borderRadius: 2,
                          opacity: selectedDate === d.sync_date ? 1 : 0.35, cursor: 'pointer',
                        }}
                      />
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 선택 날짜 상세 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#8a95a8', fontSize: 14 }}>불러오는 중...</div>
        ) : !data || !data.has_data ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid #e8eef5' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1a202c', marginBottom: 6 }}>
              {formatDate(selectedDate)} 변동 데이터 없음
            </p>
            <p style={{ fontSize: 13, color: '#8a95a8' }}>해당 날짜에 CSV 동기화가 수행되지 않았습니다</p>
          </div>
        ) : (
          <>
            {/* 요약 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              {[
                { label: '신규 개업', value: data.inserted, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', tab: 'new' as const },
                { label: '정보 변경', value: data.updated, color: '#3b82f6', bg: '#eff6ff', border: '#bae6fd', tab: 'updated' as const },
                { label: '폐업', value: data.deleted, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', tab: 'closed' as const },
              ].map(item => (
                <button key={item.label} onClick={() => setActiveTab(item.tab)}
                  style={{
                    padding: '20px 16px', borderRadius: 16, textAlign: 'center', cursor: 'pointer',
                    background: activeTab === item.tab ? item.bg : '#fff',
                    border: `2px solid ${activeTab === item.tab ? item.border : '#e8eef5'}`,
                  }}>
                  <p style={{ fontSize: 13, color: '#4a5568', marginBottom: 8 }}>{item.label}</p>
                  <p style={{ fontSize: 36, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</p>
                  <p style={{ fontSize: 12, color: '#8a95a8', marginTop: 4 }}>{formatDate(data.sync_date)} 기준</p>
                </button>
              ))}
            </div>

            {/* 시도 필터 */}
            {sidos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                <button onClick={() => setSidoFilter('')}
                  style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none',
                    background: !sidoFilter ? '#3b82f6' : '#f0f4f8', color: !sidoFilter ? '#fff' : '#4a5568', fontWeight: 500 }}>
                  전체
                </button>
                {sidos.map(s => (
                  <button key={s} onClick={() => setSidoFilter(s === sidoFilter ? '' : s)}
                    style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none',
                      background: sidoFilter === s ? '#3b82f6' : '#f0f4f8',
                      color: sidoFilter === s ? '#fff' : '#4a5568', fontWeight: 500 }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* 탭별 목록 */}
            {activeTab === 'new' && (
              <OfficeTable title={`신규 개업 ${filtered.new.length.toLocaleString()}개`}
                items={filtered.new} color="#059669" emptyMsg="신규 개업 사무소 없음" />
            )}
            {activeTab === 'closed' && (
              <OfficeTable title={`폐업 ${filtered.closed.length.toLocaleString()}개`}
                items={filtered.closed} color="#dc2626" emptyMsg="폐업 사무소 없음" />
            )}
            {activeTab === 'updated' && (
              <UpdatedTable title={`정보 변경 ${filtered.updated.length.toLocaleString()}개`}
                items={filtered.updated} emptyMsg="정보 변경 사무소 없음" />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function OfficeTable({ title, items, color, emptyMsg }: {
  title: string; items: OfficeItem[]; color: string; emptyMsg: string
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8eef5', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8eef5' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color, margin: 0 }}>{title}</h2>
      </div>
      {items.length === 0 ? (
        <p style={{ padding: 32, textAlign: 'center', color: '#8a95a8', fontSize: 14 }}>{emptyMsg}</p>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                {['사무소명', '시도', '시군구', '등록번호'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                    color: '#4a5568', background: '#f9fafc', borderBottom: '1px solid #e8eef5' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f4f8' }}>
                  <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 500 }}>
                    <Link href={`/offices/${item.registration_number}`}
                      style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {item.office_name || '—'}
                    </Link>
                  </td>
                  <td style={{ padding: '10px 20px', fontSize: 13, color: '#4a5568' }}>{item.sido || '—'}</td>
                  <td style={{ padding: '10px 20px', fontSize: 13, color: '#4a5568' }}>{item.sigungu || '—'}</td>
                  <td style={{ padding: '10px 20px', fontSize: 12, color: '#8a95a8' }}>{item.registration_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function UpdatedTable({ title, items, emptyMsg }: {
  title: string; items: UpdatedItem[]; emptyMsg: string
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8eef5', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8eef5' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6', margin: 0 }}>{title}</h2>
      </div>
      {items.length === 0 ? (
        <p style={{ padding: 32, textAlign: 'center', color: '#8a95a8', fontSize: 14 }}>{emptyMsg}</p>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                {['사무소명', '시도', '변경 내용'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                    color: '#4a5568', background: '#f9fafc', borderBottom: '1px solid #e8eef5' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f0f4f8' }}>
                  <td style={{ padding: '10px 20px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    <Link href={`/offices/${item.registration_number}`}
                      style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {item.office_name || '—'}
                    </Link>
                  </td>
                  <td style={{ padding: '10px 20px', fontSize: 13, color: '#4a5568', whiteSpace: 'nowrap' }}>{item.sido || '—'}</td>
                  <td style={{ padding: '10px 20px', fontSize: 12, color: '#4a5568' }}>
                    {Object.entries(item.changes).map(([key, val]) => (
                      <div key={key} style={{ marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, color: '#1a202c' }}>{FIELD_LABELS[key] || key}</span>
                        {': '}
                        <span style={{ color: '#dc2626', textDecoration: 'line-through' }}>{String(val.before ?? '없음')}</span>
                        {' → '}
                        <span style={{ color: '#059669' }}>{String(val.after ?? '없음')}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
