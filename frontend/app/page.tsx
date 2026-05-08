'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Trophy, BarChart3 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [searchError, setSearchError] = useState('')
  const [stats, setStats] = useState({ totalOffices: 0, totalAgents: 0, regions: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [todayDate, setTodayDate] = useState('')

  useEffect(() => {
    setTodayDate(new Date().toLocaleDateString('ko-KR'))
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const statsRes = await fetch(`${baseURL}/api/search/stats`)
        const statsData = await statsRes.json()
        const regionsRes = await fetch(`${baseURL}/api/regions`)
        const regionsData = await regionsRes.json()

        setStats({
          totalOffices: statsData.total_offices || 0,
          totalAgents: statsData.total_agents || 0,
          regions: regionsData.length
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
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
      {/* 히어로 섹션 */}
      <section className="w-full px-4 py-12 sm:py-16 md:py-32 lg:py-40 sm:px-6 lg:px-8" style={{
        background: 'linear-gradient(135deg, #0A0E1A 0%, #0F1629 100%)'
      }}>
        <div className="max-w-4xl mx-auto">
          {/* 제목 */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-snug sm:leading-tight">
              전국 공인중개사<br className="sm:hidden" /> 정보를 한눈에
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-2 px-2 sm:px-0" style={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.6' }}>
              내 소중한 재산을 맡기기 전,<br className="sm:hidden" /> 정식 등록된 업체와 사람인지 확인하셨나요?
            </p>
          </div>

          {/* 검색 폼 */}
          <form onSubmit={handleSearch} className="mb-10 sm:mb-12 md:mb-16">
            <div className="search-form-card rounded-2xl p-4 sm:p-6 md:p-8">
              {/* 검색 입력 */}
              <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 search-input-box px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
                <Search size={18} className="sm:w-5 sm:h-5" style={{ color: 'rgba(255, 255, 255, 0.4)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="사무소명, 이름을 입력하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input w-full text-sm sm:text-base"
                  autoFocus
                />
              </div>

              {/* 검색 타입 Pill 탭 */}
              <div className="mb-4 sm:mb-6">
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  {[
                    { value: 'all', label: '전체' },
                    { value: 'office', label: '사무소' },
                    { value: 'person', label: '사람' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSearchType(type.value)}
                      className={`pill-btn px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm whitespace-nowrap ${
                        searchType === type.value ? 'active' : ''
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 에러 메시지 */}
              {searchError && (
                <div className="mb-4 sm:mb-6 p-2 sm:p-3 rounded-lg text-xs sm:text-sm" style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  {searchError}
                </div>
              )}

              {/* 검색 버튼 */}
              <button
                type="submit"
                className="search-btn w-full py-2.5 sm:py-3 md:py-4 px-4 rounded-lg font-semibold text-sm sm:text-base"
              >
                조회하기
              </button>
            </div>
          </form>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* 사무소 통계 */}
            <div className="rounded-xl p-4 sm:p-6 border" style={{
              background: '#13192B',
              borderColor: 'rgba(255, 255, 255, 0.08)'
            }}>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="min-w-0">
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem sm:text-sm', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    등록된 공인중개사사무소
                  </p>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {statsLoading ? '-' : stats.totalOffices.toLocaleString()}
                  </div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.7rem sm:text-xs', marginTop: '0.5rem' }}>
                    전국 {stats.regions}개 지역
                  </p>
                </div>
                <span style={{ color: '#3182F6', fontSize: '1.25rem sm:text-2xl', marginLeft: '0.5rem', flexShrink: 0 }}>●</span>
              </div>
            </div>

            {/* 중개인 통계 */}
            <div className="rounded-xl p-4 sm:p-6 border" style={{
              background: '#13192B',
              borderColor: 'rgba(255, 255, 255, 0.08)'
            }}>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="min-w-0">
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem sm:text-sm', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    등록된 부동산중개업 종사자
                  </p>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {statsLoading ? '-' : stats.totalAgents.toLocaleString()}
                  </div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.7rem sm:text-xs', marginTop: '0.5rem' }}>
                    공인중개사·중개인·보조원
                  </p>
                </div>
                <span style={{ color: '#3182F6', fontSize: '1.25rem sm:text-2xl', marginLeft: '0.5rem', flexShrink: 0 }}>●</span>
              </div>
            </div>

            {/* 데이터 현황 */}
            <div className="rounded-xl p-4 sm:p-6 border" style={{
              background: '#13192B',
              borderColor: 'rgba(255, 255, 255, 0.08)'
            }}>
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="min-w-0">
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem sm:text-sm', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    데이터 현황
                  </p>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">100%</div>
                  <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.7rem sm:text-xs', marginTop: '0.5rem' }}>
                    데이터 기준일: {todayDate}
                  </p>
                </div>
                <span style={{ color: '#3182F6', fontSize: '1.25rem sm:text-2xl', marginLeft: '0.5rem', flexShrink: 0 }}>●</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section className="w-full px-4 py-12 sm:py-16 md:py-24 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* 세부 검색 */}
            <Link href="/advanced-search" className="feature-card rounded-xl p-4 sm:p-6 cursor-pointer">
              <div className="mb-3 sm:mb-4" style={{ color: '#3182F6' }}>
                <Search size={28} className="sm:w-8 sm:h-8" />
              </div>
              <h3 className="font-bold text-white mb-2 text-base sm:text-lg">세부 검색</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8125rem', lineHeight: '1.5' }}>
                지역, 경력, 직원 등 조건 검색
              </p>
            </Link>

            {/* 랭킹 */}
            <Link href="/rankings" className="feature-card rounded-xl p-4 sm:p-6 cursor-pointer">
              <div className="mb-3 sm:mb-4" style={{ color: '#3182F6' }}>
                <Trophy size={28} className="sm:w-8 sm:h-8" />
              </div>
              <h3 className="font-bold text-white mb-2 text-base sm:text-lg">랭킹</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8125rem', lineHeight: '1.5' }}>
                경력, 규모 등 기반 업체 순위
              </p>
            </Link>

            {/* 지역 통계 */}
            <Link href="/regions" className="feature-card rounded-xl p-4 sm:p-6 cursor-pointer">
              <div className="mb-3 sm:mb-4" style={{ color: '#3182F6' }}>
                <BarChart3 size={28} className="sm:w-8 sm:h-8" />
              </div>
              <h3 className="font-bold text-white mb-2 text-base sm:text-lg">지역 통계</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8125rem', lineHeight: '1.5' }}>
                지역별 부동산중개업 현황 한눈에
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
