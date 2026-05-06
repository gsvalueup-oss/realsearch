import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AgentDetail } from '@/types'
import { extractLicenseYear } from '@/lib/licenseUtils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Props {
  params: { id: string }
}


export default async function AgentPage({ params }: Props) {
  const { id } = params

  try {
    const res = await fetch(`${API_URL}/api/agents/${id}`, { cache: 'no-store' })

    if (!res.ok) {
      notFound()
    }

    const agent: AgentDetail = await res.json()
    const { year, career, isInvalid, errorMessage } = extractLicenseYear(agent.license_number, agent.license_date)

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 break-words">{agent.name}</h1>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <span className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-100 text-blue-800 font-semibold rounded whitespace-nowrap">
              {agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'}
            </span>
            {/* agent_type 구분 표시 */}
            <span className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold rounded whitespace-nowrap ${
              agent.agent_type === '공인중개사'
                ? 'bg-blue-600 text-white'
                : agent.agent_type === '중개인'
                ? 'bg-orange-600 text-white'
                : agent.agent_type === '중개보조원'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-600 text-white'
            }`}>
              {agent.agent_type || '-'}
            </span>
          </div>
        </div>

        {/* 데이터 오류 경고 - 자격번호가 없으면만 표시 */}
        {isInvalid && errorMessage && (!agent.license_number || agent.license_number === 'nan') && (
          <div className="flex gap-3 px-4 py-3 mb-8 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="text-orange-600 text-lg flex-shrink-0">!</span>
            <div>
              <p className="text-orange-700 font-medium text-sm">데이터 검증 주의</p>
              <p className="text-orange-600 text-xs mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 자격증 확인됨 메시지 - 자격번호가 있으면 표시 */}
        {agent.license_number && agent.license_number !== 'nan' && (
          <div className="flex items-center gap-3 px-4 py-3 mb-8 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">✓</span>
            <p className="text-blue-700 font-medium text-sm">공인중개사 자격증 등록됨</p>
          </div>
        )}

        {/* 기본 정보 카드 */}
        <div className="card mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
            <div>
              <p className="text-sm text-gray-600">역할</p>
              <p className="font-semibold text-gray-900">{agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">자격번호</p>
              <p className="font-semibold text-gray-900">{agent.license_number && agent.license_number !== 'nan' ? agent.license_number : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">자격취득년도</p>
              <p className="font-semibold text-gray-900">
                {year ? `${year}년${isInvalid ? ' (주의)' : ''}` : '자격증 미보유'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">경력</p>
              <p className={`font-semibold ${
                year ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {year ? career : '확인 불가'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">종별</p>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{agent.agent_type || '-'}</p>
                {agent.agent_type === '공인중개사' && (
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">✓</span>
                    <p className="text-xs text-blue-600">공인중개사 자격증 보유</p>
                  </div>
                )}
                {agent.agent_type === '중개인' && (
                  <p className="text-xs text-orange-700">자격증 미보유</p>
                )}
                {agent.agent_type === '중개보조원' && (
                  <p className="text-xs text-orange-700">자격증 미보유</p>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">지역</p>
              <p className="font-semibold text-gray-900">
                {agent.sido} {agent.sigungu}
              </p>
            </div>
          </div>
        </div>

        {/* 소속 사무소 */}
        {agent.office && (
          <div className="card mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">소속 사무소</h2>
            <Link
              href={`/office/${encodeURIComponent(agent.office.registration_number)}`}
            >
              <div className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer border border-blue-200 transition">
                <h3 className="font-bold text-base sm:text-lg text-blue-900 mb-2 break-words">
                  {agent.office.office_name}
                </h3>
                <div className="text-xs sm:text-sm text-blue-800 space-y-1">
                  <p>등록번호: {agent.office.registration_number}</p>
                  <p>
                    지역: {agent.office.sido} {agent.office.sigungu}
                  </p>
                  <p className="text-blue-600 font-semibold mt-3">자세히 보기 →</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error(error)
    notFound()
  }
}
