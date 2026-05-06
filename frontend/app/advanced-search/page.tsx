'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { OfficeSummary } from '@/types'

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

interface AdvancedSearchParams {
  sido?: string
  sigungu?: string
  representative_experience?: number
  min_staff?: number
  status?: string
  page?: number
  limit?: number
}

interface SearchResponse {
  items: OfficeSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export default function AdvancedSearchPage() {
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [minExperience, setMinExperience] = useState(0)
  const [minStaff, setMinStaff] = useState(0)
  const [status, setStatus] = useState('')
  const [results, setResults] = useState<OfficeSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 20

  const sigunguList = sido ? SIGUNGU_MAP[sido] || [] : []

  const handleSearch = async (pageNum: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params: AdvancedSearchParams = {
        page: pageNum,
        limit: pageSize,
      }

      if (sido) params.sido = sido
      if (sigungu) params.sigungu = sigungu
      if (minExperience > 0) params.representative_experience = minExperience
      if (minStaff > 0) params.min_staff = minStaff
      if (status) params.status = status

      const { data } = await api.get<SearchResponse>('/api/advanced-search', {
        params,
      })

      setResults(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.total_pages || 0)
      setPage(pageNum)
    } catch (err) {
      setError('검색에 실패했습니다. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSido('')
    setSigungu('')
    setMinExperience(0)
    setMinStaff(0)
    setStatus('')
    setResults([])
    setTotal(0)
    setPage(1)
  }

  const handleSidoChange = (newSido: string) => {
    setSido(newSido)
    setSigungu('')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 검색 필터 */}
      <div className="card shadow-md-soft mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">세부검색 조건</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6">
          {/* 시도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시도
            </label>
            <select
              value={sido}
              onChange={(e) => handleSidoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">전체</option>
              {SIDO_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* 시군구 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시군구
            </label>
            <select
              value={sigungu}
              onChange={(e) => setSigungu(e.target.value)}
              disabled={!sido}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50"
            >
              <option value="">전체</option>
              {sigunguList.map((sg) => (
                <option key={sg} value={sg}>
                  {sg}
                </option>
              ))}
            </select>
          </div>

          {/* 대표자 경력 (년) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              대표자 경력
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '전체', value: 0 },
                { label: '5년 ↑', value: 5 },
                { label: '10년 ↑', value: 10 },
                { label: '15년 ↑', value: 15 },
                { label: '20년 ↑', value: 20 },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMinExperience(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    minExperience === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 직원 수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              직원 수
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '전체', value: 0 },
                { label: '5명 ↑', value: 5 },
                { label: '10명 ↑', value: 10 },
                { label: '50명 ↑', value: 50 },
                { label: '100명 ↑', value: 100 },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMinStaff(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    minStaff === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 영업상태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              영업상태
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">전체</option>
              <option value="영업중">영업중</option>
              <option value="휴업">휴업</option>
              <option value="폐업">폐업</option>
              <option value="업무정지">업무정지</option>
            </select>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleSearch(1)}
            disabled={loading}
            className="btn btn-primary flex-1 sm:flex-initial"
          >
            {loading ? '🔄 검색 중...' : '🔍 검색'}
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="btn btn-secondary flex-1 sm:flex-initial"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {/* 검색 결과 */}
      {results.length > 0 && (
        <div>
          <div className="mb-4 text-gray-600">
            검색 결과: <span className="font-semibold">{total}</span>개
          </div>

          <div className="space-y-4 mb-6">
            {results.map((office) => (
              <Link
                key={office.registration_number}
                href={`/office/${encodeURIComponent(office.registration_number)}`}
              >
                <div className="card hover:shadow-lg cursor-pointer">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 min-w-0">
                          {office.office_name}
                        </h3>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                            office.status === '영업중'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-600 text-white'
                          }`}
                        >
                          {office.status}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1 mb-3">
                        <p>등록번호: {office.registration_number}</p>
                        <p>대표: {office.representative_name || '-'}</p>
                        <p>주소: {office.address || '-'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {office.representative_experience === null && office.representative_name ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap">
                            대표자 자격증 미보유
                          </span>
                        ) : (
                          <span className={`badge ${office.representative_experience !== null ? 'badge-info' : 'badge-warning'}`}>
                            대표 경력: {office.representative_experience !== null ? `${office.representative_experience}년` : '확인 불가'}
                          </span>
                        )}
                        {office.staff_count !== null && (
                          <span className="badge badge-info">
                            직원수: {office.staff_count}명
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => handleSearch(page - 1)}
                disabled={page === 1}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 whitespace-nowrap text-sm"
              >
                이전
              </button>
              <span className="text-gray-600 text-sm whitespace-nowrap">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => handleSearch(page + 1)}
                disabled={page === totalPages}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 whitespace-nowrap text-sm"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && results.length === 0 && total === 0 && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">
            검색 조건을 선택하고 검색 버튼을 클릭하세요
          </p>
        </div>
      )}
    </div>
  )
}
