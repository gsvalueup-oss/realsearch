'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { OfficeSummary, AgentSummary } from '@/types'

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [searchError, setSearchError] = useState('')
  const [popularOffices, setPopularOffices] = useState<OfficeSummary[]>([])
  const [popularAgents, setPopularAgents] = useState<AgentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const [officesRes, agentsRes] = await Promise.all([
          api.get<OfficeSummary[]>('/api/popular/offices', { params: { limit: 6 } }),
          api.get<AgentSummary[]>('/api/popular/agents', { params: { limit: 6 } }),
        ])
        setPopularOffices(officesRes.data || [])
        setPopularAgents(agentsRes.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchPopular()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchError('')
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`)
    } else {
      setSearchError('검색어를 입력해주세요')
      setTimeout(() => setSearchError(''), 3000)
    }
  }

  return (
    <div className="w-full">
      {/* 메인 검색 섹션 */}
      <section className="w-full px-4 py-12 md:py-24 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            부동산중개업 정보 검색
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-4">
            전국 공인중개사무소, 공인중개사를 조회하고 확인해보세요
          </p>
          <p className="text-sm text-gray-500">
            데이터 기준일: {new Date().toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* 검색 폼 */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md-soft p-4 sm:p-5 md:p-8 border border-gray-50">
            {/* 검색창 */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="사무소명, 사람 이름을 입력하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input text-base sm:text-lg"
                autoFocus
              />
            </div>

            {/* 검색 타입 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                검색 유형
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'all', label: '전체' },
                  { value: 'office', label: '사무소' },
                  { value: 'person', label: '사람' },
                ].map((type) => (
                  <label key={type.value} className="min-h-[44px] flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="searchType"
                      value={type.value}
                      checked={searchType === type.value}
                      onChange={(e) => setSearchType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 에러 메시지 */}
            {searchError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm font-medium">
                ⚠️ {searchError}
              </div>
            )}

            {/* 검색 버튼 */}
            <button
              type="submit"
              className="w-full btn btn-primary py-4 text-lg font-bold"
            >
              🔍 검색하기
            </button>
          </div>
        </form>

        {/* 바로가기 섹션 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
          <a
            href="/advanced-search"
            className="card text-center hover:shadow-lg cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="text-5xl mb-4">🔎</div>
            <h3 className="font-bold text-gray-900 mb-2">세부 검색</h3>
            <p className="text-sm text-gray-600">조건별 사무소 검색</p>
          </a>

          <a
            href="/rankings"
            className="card text-center hover:shadow-lg cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="font-bold text-gray-900 mb-2">랭킹</h3>
            <p className="text-sm text-gray-600">직원 수, 운영기간 등</p>
          </a>

          <a
            href="/regions"
            className="card text-center hover:shadow-lg cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="text-5xl mb-4">📊</div>
            <h3 className="font-bold text-gray-900 mb-2">지역 통계</h3>
            <p className="text-sm text-gray-600">시도별, 구별 현황</p>
          </a>

          <a
            href="#faq"
            className="card text-center hover:shadow-lg cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
          >
            <div className="text-5xl mb-4">❓</div>
            <h3 className="font-bold text-gray-900 mb-2">자주 묻는 질문</h3>
            <p className="text-sm text-gray-600">도움말 및 가이드</p>
          </a>
        </div>

          {/* 인기 조회 */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* 인기 조회 사무소 */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">🏢 인기 조회 사무소</h3>
              <div className="space-y-2">
                {popularOffices.length > 0 ? (
                  popularOffices.map((office) => (
                    <Link
                      key={office.registration_number}
                      href={`/office/${encodeURIComponent(office.registration_number)}`}
                      className="block p-2 text-sm text-gray-700 hover:bg-blue-50 rounded transition"
                    >
                      {office.office_name}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">조회 데이터가 없습니다</p>
                )}
              </div>
            </div>

            {/* 인기 조회 사람 */}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">👤 인기 조회 사람</h3>
              <div className="space-y-2">
                {popularAgents.length > 0 ? (
                  popularAgents.map((agent) => (
                    <Link
                      key={agent.id}
                      href={`/agent/${agent.id}`}
                      className="block p-2 text-sm text-gray-700 hover:bg-blue-50 rounded transition"
                    >
                      {agent.name} {agent.office_name && `(${agent.office_name})`}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">조회 데이터가 없습니다</p>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </section>


    </div>
  )
}
