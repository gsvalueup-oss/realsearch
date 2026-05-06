'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { OfficeDetail } from '@/types'
import api from '@/lib/api'
import { extractLicenseYear } from '@/lib/licenseUtils'

export default function OfficePage() {
  const params = useParams()
  const registrationNumberParam = params?.registration_number as string || ''

  const [office, setOffice] = useState<OfficeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchOffice = async () => {
      try {
        const { data } = await api.get<OfficeDetail>(
          `/api/offices/${registrationNumberParam}`
        )
        setOffice(data)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (registrationNumberParam) {
      fetchOffice()
    }
  }, [registrationNumberParam])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">로딩 중...</p>
      </div>
    )
  }

  if (error || !office) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">사무소를 찾을 수 없습니다</p>
      </div>
    )
  }

  // 대표자 정보 찾기
  const representative = office.staff?.find(
    (agent) => agent.name === office.representative_name
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 break-words">{office.office_name}</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">등록번호: {office.registration_number}</p>
            </div>
            <span
              className={`px-3 sm:px-4 py-2 font-semibold rounded-lg whitespace-nowrap flex-shrink-0 text-sm ${
                office.status === '영업중'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-white'
              }`}
            >
              {office.status}
            </span>
          </div>
        </div>

        {/* 기본 정보 카드 */}
        <div className="card mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
            <div>
              <p className="text-sm text-gray-600">대표자</p>
              <p className="font-semibold text-gray-900 mb-3">
                {office.representative_name || '-'}
              </p>
              {representative ? (() => {
                const { year, career } = extractLicenseYear(representative.license_number || null, representative.license_date || null)
                return (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      자격취득년도: <span className={`font-semibold ${year ? 'text-gray-900' : 'text-red-600'}`}>{year || '자격증 미보유'}</span>
                    </p>
                    <p className={`text-sm font-semibold ${
                      career === '-' ? 'text-gray-500' : 'text-blue-600'
                    }`}>
                      대표자 경력: {career === '-' ? '확인 불가' : career}
                    </p>
                  </div>
                )
              })() : office.representative_name ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    자격취득년도: <span className="font-semibold text-red-600">자격증 미보유</span>
                  </p>
                  <p className="text-sm font-semibold text-gray-500">
                    대표자 경력: 확인 불가
                  </p>
                </div>
              ) : null}
            </div>
            <div>
              <p className="text-sm text-gray-600">지역</p>
              <p className="font-semibold text-gray-900">
                {office.sido} {office.sigungu}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">주소</p>
              <p className="font-semibold text-gray-900">{office.address || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">등록일자</p>
              <p className="font-semibold text-gray-900">
                {office.registered_date
                  ? new Date(office.registered_date).toLocaleDateString('ko-KR')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">운영 기간</p>
              <p className="font-semibold text-gray-900">
                {office.registered_date
                  ? (() => {
                      const days = Math.floor(
                        (new Date().getTime() - new Date(office.registered_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                      const years = Math.floor(days / 365)
                      return years > 0 ? `${years}년 ${days % 365}일` : `${days}일`
                    })()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">전화번호</p>
              <p className="font-semibold text-gray-900">{office.phone_number && office.phone_number !== 'nan' ? office.phone_number : '-'}</p>
            </div>
          </div>
        </div>

        {/* 직원 통계 */}
        {office.staff && office.staff.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">직원 현황</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600">총 직원</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{office.staff.length}</p>
                <p className="text-xs text-gray-500 mt-1">명</p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600">공인중개사</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {office.staff.filter((a) => a.agent_type === '공인중개사').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">명</p>
              </div>
              <div className="text-center col-span-2 lg:col-span-1">
                <p className="text-xs sm:text-sm text-gray-600">중개보조원</p>
                <p className="text-2xl sm:text-3xl font-bold text-cyan-600">
                  {office.staff.filter((a) => a.agent_type === '중개보조원').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">명</p>
              </div>
            </div>
          </div>
        )}

        {/* 소속 직원 */}
        {office.staff && office.staff.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              소속 직원 상세 ({office.staff.length}명)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* 공인중개사 */}
              <div>
                <h3 className="font-bold text-blue-600 mb-3">
                  공인중개사 ({office.staff.filter((a) => a.agent_type === '공인중개사').length}명)
                </h3>
                <div className="space-y-2">
                  {office.staff.filter((a) => a.agent_type === '공인중개사').map((agent) => (
                    <Link
                      key={agent.id}
                      href={`/agent/${agent.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer border border-gray-100 gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{agent.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm text-blue-600 flex-shrink-0">자세히 →</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 중개보조원 */}
              <div>
                <h3 className="font-bold text-cyan-600 mb-3">
                  중개보조원 ({office.staff.filter((a) => a.agent_type === '중개보조원').length}명)
                </h3>
                <div className="space-y-2">
                  {office.staff.filter((a) => a.agent_type === '중개보조원').map((agent) => (
                    <Link
                      key={agent.id}
                      href={`/agent/${agent.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer border border-gray-100 gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{agent.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm text-cyan-600 flex-shrink-0">자세히 →</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 기타 */}
            {office.staff.filter((a) => a.agent_type !== '공인중개사' && a.agent_type !== '중개보조원').length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-bold text-gray-600 mb-3">
                  기타 ({office.staff.filter((a) => a.agent_type !== '공인중개사' && a.agent_type !== '중개보조원').length}명)
                </h3>
                <div className="space-y-2">
                  {office.staff.filter((a) => a.agent_type !== '공인중개사' && a.agent_type !== '중개보조원').map((agent) => (
                    <Link
                      key={agent.id}
                      href={`/agent/${agent.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer border border-gray-100 gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{agent.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'} • {agent.agent_type || '정보 없음'}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">자세히 →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
}
