'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { OfficeSummary, AgentSummary } from '@/types'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

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
      <style>{`
        .search-select {
          background: #13192B;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.875rem;
        }
        .search-select:focus {
          outline: none;
          border-color: #3182F6;
          box-shadow: 0 0 0 2px rgba(49, 130, 246, 0.1);
        }
        .search-select:disabled {
          opacity: 0.5;
        }
        .search-select option {
          background: #13192B;
          color: white;
        }
        .tab-button {
          color: rgba(255, 255, 255, 0.6);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          padding: 12px 16px;
          font-weight: 500;
        }
        .tab-button.active {
          color: #3182F6;
          border-bottom-color: #3182F6;
        }
        .tab-button:hover {
          color: rgba(255, 255, 255, 0.8);
        }
        .result-card {
          background: #13192B;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s;
        }
        .result-card:hover {
          border-color: #3182F6;
          box-shadow: 0 0 20px rgba(49, 130, 246, 0.15);
        }
      `}</style>

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
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
          검색결과: <span className="font-semibold text-white">{q}</span> <span style={{ color: '#3182F6' }}>(사무소 {offices.length}개, 사람 {agents.length}명)</span>
        </p>
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
          <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>검색 결과가 없습니다.</p>
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
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>검색 결과가 없습니다.</p>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {filteredOffices.map((office) => (
                    <Link
                      key={office.registration_number}
                      href={`/office/${encodeURIComponent(office.registration_number)}`}
                    >
                      <div className="result-card">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                              <h3 className="font-bold text-base sm:text-lg text-white min-w-0">
                                {office.office_name}
                              </h3>
                              <span className="px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 text-white" style={{
                                background: office.status === '영업중' ? '#3182F6' : '#666'
                              }}>
                                {office.status}
                              </span>
                            </div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.6)' }} className="space-y-1 mb-3 text-sm">
                              <p>등록번호: {office.registration_number}</p>
                              <p>대표: {office.representative_name || '-'}</p>
                              <p>주소: {office.address || '-'}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {office.staff_count !== null && (
                                <span className="px-3 py-1 text-xs rounded" style={{
                                  background: 'rgba(49, 130, 246, 0.1)',
                                  color: '#93C5FD'
                                }}>
                                  직원수: {office.staff_count}명
                                </span>
                              )}
                              {office.representative_experience !== null && (
                                <span className="px-3 py-1 text-xs rounded" style={{
                                  background: 'rgba(49, 130, 246, 0.1)',
                                  color: '#93C5FD'
                                }}>
                                  대표 경력: {office.representative_experience}년
                                </span>
                              )}
                            </div>
                          </div>
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
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>검색 결과가 없습니다.</p>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {filteredAgents.map((agent) => (
                    <Link key={agent.id} href={`/agent/${agent.id}`}>
                      <div className="result-card">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <h3 className="font-bold text-base sm:text-lg text-white min-w-0">
                                {agent.name}
                              </h3>
                              <span className="px-3 py-1 text-xs font-semibold rounded-full text-white" style={{
                                background: '#3182F6'
                              }}>
                                {agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'}
                              </span>
                            </div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.6)' }} className="space-y-1 text-sm">
                              <p>구분: {agent.agent_type || '-'}</p>
                              <p>사무소: {agent.office_name || '-'}</p>
                              <p>주소: {agent.address || '-'}</p>
                              {agent.license_date && (
                                <p>자격취득: {new Date(agent.license_date).toLocaleDateString('ko-KR')}</p>
                              )}
                              {agent.experience !== null && (
                                <p>경력: {agent.experience}년</p>
                              )}
                            </div>
                          </div>
                          <span className="px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 text-white" style={{
                            background: agent.agent_type === '공인중개사' ? '#3182F6' : '#666'
                          }}>
                            {agent.agent_type}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
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
