'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { OfficeSummary, AgentSummary } from '@/types'
import { extractLicenseYear } from '@/lib/licenseUtils'
import { Search, ChevronLeft, ChevronRight, Building2, User } from 'lucide-react'

const SIDO_LIST = [
  '서울특별시', '경기도', '부산광역시', '대구광역시', '인천광역시',
  '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
  '경상북도', '경상남도', '전라북도', '전라남도',
  '강원특별자치도', '충청북도', '충청남도', '제주특별자치도', '전북특별자치도'
]

const SIGUNGU_MAP: Record<string, string[]> = {
  '서울특별시': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '부산광역시': ['강서구', '금정구', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구'],
  '대구광역시': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
  '인천광역시': ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'],
  '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
  '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산광역시': ['남구', '동구', '북구', '울주군', '중구'],
  '세종특별자치시': ['세종시'],
  '경기도': ['가평군', '고양시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
  '강원특별자치도': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
  '충청북도': ['괴산군', '단양군', '달성군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'],
  '충청남도': ['계룡시', '공주시', '금산군', '논산시', '당진시', '대산군', '부여군', '보령시', '서천군', '세종시', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
  '전라북도': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '전주시', '정읍시', '진안군'],
  '전라남도': ['강진군', '고흥군', '고창군', '구례군', '나주시', '담양군', '동구', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '전주시', '정읍시', '제주시', '진도군', '함평군', '해남군', '화순군'],
  '경상북도': ['경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '이천시', '포항시'],
  '경상남도': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'],
  '제주특별자치도': ['서귀포시', '제주시'],
}

const EMPTY_VALUE = '정보 없음'

function displayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '' || value === 'nan') {
    return EMPTY_VALUE
  }

  return String(value)
}

function displayRegion(sido?: string | null, sigungu?: string | null) {
  return [sido, sigungu].filter(Boolean).join(' ') || EMPTY_VALUE
}

function displayAgentRole(agent: AgentSummary) {
  if (agent.role === '대표') return '대표'
  if (agent.role) return agent.role
  if (agent.agent_type === '중개보조원') return '중개보조원'
  if (agent.agent_type === '공인중개사') return '소속공인중개사'

  return EMPTY_VALUE
}

function displayCount(value: number | null | undefined) {
  return typeof value === 'number' ? `${value}명` : EMPTY_VALUE
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'office' | 'person'>('all')
  const [offices, setOffices] = useState<OfficeSummary[]>([])
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterSido, setFilterSido] = useState('')
  const [filterSigungu, setFilterSigungu] = useState('')
  const [newSearchQuery, setNewSearchQuery] = useState('')
  const pageSize = 20

  const q = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all'
  const sido = searchParams.get('sido') || ''
  const sigungu = searchParams.get('sigungu') || ''
  const sigunguList = filterSido ? SIGUNGU_MAP[filterSido] || [] : []

  useEffect(() => {
    setFilterSido(sido)
    setFilterSigungu(sigungu)
  }, [sido, sigungu])

  useEffect(() => {
    setActiveTab((type as any) || 'all')
  }, [type])

  useEffect(() => {
    const fetchResults = async () => {
      if (!q) {
        setOffices([])
        setAgents([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const params = new URLSearchParams({
          q,
          type,
          sido,
          sigungu,
          limit: '50'
        })
        const url = `${baseURL}/api/search?${params}`
        console.log('Search URL:', url)
        const response = await fetch(url)
        const data = await response.json()

        console.log('Search response:', data)
        console.log('Agents count:', data.agents?.length || 0)

        setOffices(data.offices || [])
        setAgents(data.agents || [])
        setTotal(data.total || 0)
        setPage(1)
      } catch (err) {
        console.error('Search error:', err)
        setError('검색에 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [q, sido, sigungu])

  const filteredOffices =
    activeTab === 'all' || activeTab === 'office'
      ? offices.slice((page - 1) * pageSize, page * pageSize)
      : []
  const filteredAgents =
    activeTab === 'all' || activeTab === 'person'
      ? agents.slice((page - 1) * pageSize, page * pageSize)
      : []

  const totalPages = Math.ceil(total / pageSize)

  const handleFilterChange = (newSido: string, newSigungu: string = '') => {
    const params = new URLSearchParams(searchParams.toString())
    if (newSido) {
      params.set('sido', newSido)
    } else {
      params.delete('sido')
    }
    if (newSigungu) {
      params.set('sigungu', newSigungu)
    } else {
      params.delete('sigungu')
    }
    router.push(`/search?${params.toString()}`)
  }

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSearchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(newSearchQuery)}&type=all`)
      setNewSearchQuery('')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 새 검색 폼 */}
      <form onSubmit={handleNewSearch} className="rounded-xl p-6 mb-8 border" style={{
        background: '#13192B',
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <div className="relative flex items-center gap-3" style={{
          background: '#0A0E1A',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <Search size={20} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
          <input
            type="text"
            placeholder="사무소명, 이름을 입력하세요"
            value={newSearchQuery}
            onChange={(e) => setNewSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 text-base"
          />
          <button
            type="submit"
            className="flex-shrink-0 font-bold transition"
            style={{ color: '#3182F6' }}
          >
            조회
          </button>
        </div>
      </form>

      {/* 지역 필터 */}
      <div className="rounded-xl p-6 mb-8 border" style={{
        background: '#13192B',
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
              시도
            </label>
            <select
              value={filterSido}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="search-select w-full"
            >
              <option value="">전체 지역</option>
              {SIDO_LIST.map((sido_name) => (
                <option key={sido_name} value={sido_name}>
                  {sido_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
              시군구
            </label>
            <select
              value={filterSigungu}
              onChange={(e) => handleFilterChange(filterSido, e.target.value)}
              disabled={!filterSido}
              className="search-select w-full"
            >
              <option value="">전체</option>
              {sigunguList.map((sg) => (
                <option key={sg} value={sg}>
                  {sg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 검색결과 정보 */}
      <div className="rounded-xl p-4 mb-8 border" style={{
        background: '#13192B',
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="font-semibold text-white">
            {q ? `"${q}" 검색 결과` : '검색 결과'}
          </p>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
            <span style={{ color: '#93C5FD' }}>사무소 {offices.length}개</span>
            <span className="mx-2" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>/</span>
            <span style={{ color: '#93C5FD' }}>사람 {agents.length}명</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg p-4 mb-6 border" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          color: '#FCA5A5'
        }}>{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>검색 중...</p>
        </div>
      ) : total === 0 ? (
        <div className="rounded-lg p-8 text-center border" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <p className="font-semibold text-white mb-2">검색 결과가 없습니다.</p>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>검색어를 바꾸거나 지역 필터를 조정해보세요.</p>
        </div>
      ) : (
        <>
          <div className="flex border-b mb-6 overflow-x-auto" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            {['all', 'office', 'person'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`tab-button ${activeTab === t ? 'active' : ''}`}
              >
                {t === 'all' ? '전체' : t === 'office' ? '사무소' : '사람'}
              </button>
            ))}
          </div>

          {(activeTab === 'all' || activeTab === 'office') && (
            <div className="mb-8">
              {filteredOffices.length === 0 ? (
                activeTab === 'office' && (
                  <div className="rounded-lg p-8 text-center border" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.08)'
                  }}>
                    <p className="font-semibold text-white mb-2">사무소 검색 결과가 없습니다.</p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>검색어 또는 지역 필터를 다시 확인해보세요.</p>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {filteredOffices.map((office) => (
                    <Link
                      key={office.registration_number}
                      href={`/office/${encodeURIComponent(office.registration_number)}`}
                      className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0A0E1A]"
                    >
                      <div className="result-card group">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(49, 130, 246, 0.1)', color: '#93C5FD' }}>
                            <Building2 size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <h3 className="font-bold text-base sm:text-lg text-white min-w-0 break-words">
                                {displayValue(office.office_name)}
                              </h3>
                              <span className="px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 text-white" style={{
                                background: office.status === '영업중' ? '#3182F6' : 'rgba(255, 255, 255, 0.18)'
                              }}>
                                {displayValue(office.status)}
                              </span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                              등록번호 {displayValue(office.registration_number)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                          {[
                            ['대표자', displayValue(office.representative_name)],
                            ['주소', displayValue(office.address)],
                            ['총 직원 수', displayCount(office.staff_count)],
                            ['공인중개사 수', displayCount(office.licensed_agent_count)],
                            ['중개보조원 수', displayCount(office.assistant_count)],
                          ].map(([label, value]) => (
                            <div key={label} className={label === '주소' ? 'sm:col-span-2' : ''}>
                              <p className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.42)' }}>{label}</p>
                              <p className="font-medium text-white break-words">{value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                            클릭하면 사무소 상세 정보로 이동합니다.
                          </p>
                          <span className="inline-flex items-center justify-center min-h-[40px] px-3 py-2 rounded-lg text-sm font-semibold transition group-hover:opacity-90" style={{
                            background: 'rgba(49, 130, 246, 0.12)',
                            color: '#93C5FD',
                            border: '1px solid rgba(49, 130, 246, 0.2)'
                          }}>
                            사무소 상세보기 →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'person') && (
            <div className="mb-8">
              {filteredAgents.length === 0 ? (
                activeTab === 'person' && (
                  <div className="rounded-lg p-8 text-center border" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.08)'
                  }}>
                    <p className="font-semibold text-white mb-2">사람 검색 결과가 없습니다.</p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>이름이나 지역 조건을 다시 확인해보세요.</p>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {filteredAgents.map((agent) => {
                    const { year, career } = extractLicenseYear(agent.license_number || null, agent.license_date || null)
                    return (
                    <Link
                      key={agent.id}
                      href={`/agent/${agent.id}`}
                      className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0A0E1A]"
                    >
                      <div className="result-card group">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(49, 130, 246, 0.1)', color: '#93C5FD' }}>
                            <User size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <h3 className="font-bold text-base sm:text-lg text-white min-w-0 break-words">
                                {displayValue(agent.name)}
                              </h3>
                              <span className="px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 text-white" style={{
                                background: agent.agent_type === '공인중개사' ? '#3182F6' : 'rgba(255, 255, 255, 0.18)'
                              }}>
                                {displayValue(agent.agent_type)}
                              </span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                              {displayAgentRole(agent)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                          {[
                            ['직위', displayAgentRole(agent)],
                            ['구분', displayValue(agent.agent_type)],
                            ['소속 사무소명', displayValue(agent.office_name)],
                            ['지역', displayRegion(agent.sido, agent.sigungu)],
                            ['자격취득년도', year ? `${year}년` : EMPTY_VALUE],
                            ['경력', career === '-' ? EMPTY_VALUE : career],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <p className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.42)' }}>{label}</p>
                              <p className="font-medium text-white break-words">{value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                            클릭하면 사람 상세 정보로 이동합니다.
                          </p>
                          <span className="inline-flex items-center justify-center min-h-[40px] px-3 py-2 rounded-lg text-sm font-semibold transition group-hover:opacity-90" style={{
                            background: 'rgba(49, 130, 246, 0.12)',
                            color: '#93C5FD',
                            border: '1px solid rgba(49, 130, 246, 0.2)'
                          }}>
                            상세정보 보기 →
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                  })}
                </div>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8 overflow-x-auto pb-2">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-2 rounded border transition hover:opacity-80"
                  style={{
                    background: '#13192B',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {(() => {
                const maxPages = 5
                let startPage = Math.max(1, page - 2)
                let endPage = Math.min(totalPages, startPage + maxPages - 1)
                if (endPage - startPage + 1 < maxPages) {
                  startPage = Math.max(1, endPage - maxPages + 1)
                }
                return [...Array(endPage - startPage + 1)].map((_, i) => {
                  const pageNum = startPage + i
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className="px-4 py-2 rounded min-h-[44px] transition border"
                      style={{
                        background: page === pageNum ? '#3182F6' : '#13192B',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        color: page === pageNum ? 'white' : 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })
              })()}
              {page < totalPages && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-2 rounded border transition hover:opacity-80"
                  style={{
                    background: '#13192B',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-12" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>로딩 중...</div>}>
      <SearchContent />
    </Suspense>
  )
}
