'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { RankingItem } from '@/types'

type RankingType = 'by-staff' | 'by-age' | 'by-representative-career' | 'newest'

const RANKING_TABS = [
  { value: 'by-staff' as RankingType, label: '직원 수' },
  { value: 'by-age' as RankingType, label: '운영 기간' },
  { value: 'by-representative-career' as RankingType, label: '대표자 경력' },
  { value: 'newest' as RankingType, label: '신규 개업' },
]

const SIGUNGU_MAP: Record<string, string[]> = {
  '서울특별시': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '부산광역시': ['강서구', '금정구', '남구', '동구', '동래구', '부산진구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구'],
  '대구광역시': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구', '군위군'],
  '인천광역시': ['강화군', '계양구', '남동구', '남구', '동구', '부평구', '서구', '연수구', '옹진군', '중구'],
  '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
  '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산광역시': ['남구', '동구', '북구', '중구', '울주군'],
  '경기도': ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '남양주시', '동두천시', '여주시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시', '안성시', '안양시', '안산시', '의왕시', '의정부시', '오산시', '용인시'],
  '강원특별자치도': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '태백시', '철원군', '춘천시', '홍천군', '화천군', '횡성군'],
  '충청북도': ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'],
  '충청남도': ['공주시', '계룡시', '논산시', '당진시', '보령시', '부여군', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
  '전라북도': ['고창군', '군산시', '김제시', '남원시', '정읍시', '전주시', '완주군', '임실군', '장수군', '진안군'],
  '전라남도': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
  '경상북도': ['경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '칠곡군', '포항시'],
  '경상남도': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'],
  '제주특별자치도': ['서귀포시', '제주시'],
}

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<RankingType>('by-staff')
  const [sido, setSido] = useState('')
  const [sigungu, setSigungu] = useState('')
  const [items, setItems] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(false)

  const sidoList = Object.keys(SIGUNGU_MAP)
  const sigunguList = sido ? SIGUNGU_MAP[sido] || [] : []

  useEffect(() => {
    setSigungu('')
  }, [sido])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get<RankingItem[]>(
          `/api/rankings/offices/${activeTab}`,
          {
            params: { sido, sigungu, limit: 50 },
          }
        )
        setItems(data || [])
      } catch (error) {
        console.error(error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [activeTab, sido, sigungu])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8">
        {activeTab === 'by-staff' && '직원 수 Top 50'}
        {activeTab === 'by-age' && '운영 기간 Top 50'}
        {activeTab === 'by-representative-career' && '대표자 경력 Top 50'}
        {activeTab === 'newest' && '신규 개업 Top 50'}
      </h1>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {RANKING_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 sm:px-6 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition min-h-[44px] flex items-center ${
              activeTab === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시도
            </label>
            <select
              value={sido}
              onChange={(e) => setSido(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="">전국</option>
              {sidoList.map((sido_name) => (
                <option key={sido_name} value={sido_name}>
                  {sido_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시군구
            </label>
            <select
              value={sigungu}
              onChange={(e) => setSigungu(e.target.value)}
              disabled={!sido}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-50"
            >
              <option value="">전체</option>
              {sigunguList.map((sigungu_name) => (
                <option key={sigungu_name} value={sigungu_name}>
                  {sigungu_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 결과 테이블 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">결과가 없습니다</p>
        </div>
      ) : (
        <>
          {/* 모바일 카드 리스트 */}
          <div className="md:hidden space-y-4">
            {items.map((item) => (
              <Link
                key={`${item.registration_number}-${item.rank}`}
                href={`/office/${encodeURIComponent(item.registration_number)}`}
              >
                <div className="card hover:shadow-lg transition">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm flex-shrink-0">
                      {item.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 break-words">
                        {item.office_name}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {item.sido} {item.sigungu}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    {activeTab === 'by-representative-career' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">자격취득년도</span>
                          <span className="font-semibold text-gray-900">
                            {item.representative_license_year ? item.representative_license_year : '-'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{RANKING_TABS.find((t) => t.value === activeTab)?.label}</span>
                        <span className="font-semibold text-gray-900">
                          {item.value_label === '일'
                            ? (() => {
                                const years = Math.floor(item.value / 365)
                                const days = item.value % 365
                                return years > 0 ? `${years}년 ${days}일` : `${item.value}일`
                              })()
                            : `${item.value}${item.value_label === '일' ? '' : item.value_label}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">{activeTab === 'by-representative-career' ? '경력(년)' : '대표자 경력'}</span>
                      <span>
                        {item.representative_experience ? (
                          <span className="font-semibold text-blue-700">{item.representative_experience}년</span>
                        ) : item.representative_name ? (
                          <span className="text-orange-600 font-medium text-xs">자격증 미보유 / 경력확인불가</span>
                        ) : (
                          <span className="text-gray-500 text-xs">대표자 정보 없음</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-gray-600">상태</span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                          item.status === '영업중'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 데스크탑 테이블 */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      순위
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      사무소명
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      지역
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      {activeTab === 'by-representative-career' ? '자격취득년도' : RANKING_TABS.find((t) => t.value === activeTab)?.label}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      {activeTab === 'by-representative-career' ? '경력(년)' : '대표자 경력'}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr
                      key={`${item.registration_number}-${item.rank}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 sm:px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                          {item.rank}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <Link
                          href={`/office/${encodeURIComponent(
                            item.registration_number
                          )}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {item.office_name}
                        </Link>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-600">
                        {item.sido} {item.sigungu}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-center">
                        {activeTab === 'by-representative-career' ? (
                          <span className="font-semibold text-gray-900">
                            {item.representative_license_year ? item.representative_license_year : '-'}
                          </span>
                        ) : (
                          <>
                            <span className="font-semibold text-gray-900">
                              {item.value_label === '일'
                                ? (() => {
                                    const years = Math.floor(item.value / 365)
                                    const days = item.value % 365
                                    return years > 0 ? `${years}년 ${days}일` : `${item.value}일`
                                  })()
                                : item.value}
                            </span>
                            <span className="text-sm text-gray-600 ml-1">
                              {item.value_label === '일' ? '' : item.value_label}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-center">
                        {item.representative_experience ? (
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {item.representative_experience}년
                          </span>
                        ) : item.representative_name ? (
                          <span className="text-orange-600 text-sm font-medium">자격증 미보유 / 경력확인불가</span>
                        ) : (
                          <span className="text-gray-500 text-sm">대표자 정보 없음</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                            item.status === '영업중'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-600 text-white'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
