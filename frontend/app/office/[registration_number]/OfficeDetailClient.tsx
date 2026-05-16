'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { OfficeDetail } from '@/types'
import api from '@/lib/api'
import { extractLicenseYear } from '@/lib/licenseUtils'
import CorrectionRequestModal from '@/components/CorrectionRequestModal'
import { ArrowLeft, Users, History, ShieldCheck, MessageSquare } from 'lucide-react'

interface ChangeEvent {
  type: '신규개업' | '폐업' | '정보변경'
  detail: Record<string, { before: string; after: string }> | null
}

interface OfficeChangeHistory {
  sync_date: string
  events: ChangeEvent[]
}

const FIELD_LABELS: Record<string, string> = {
  office_name: '사무소명',
  representative_name: '대표자명',
  address: '주소',
  road_address: '도로명주소',
  phone_number: '전화번호',
  status: '상태',
  sido: '시도',
  sigungu: '시군구',
}


function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://realsearch.kr').replace(/\/$/, '')
}

function formatDate(value: string | null | undefined) {
  if (!value) return '정보 없음'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '정보 없음'

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function getValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '' || value === 'nan') {
    return '정보 없음'
  }

  return String(value)
}

function getOfficeSummaryMessage(office: OfficeDetail) {
  if (office.status === '영업중') {
    return '현재 영업중인 부동산중개사무소입니다.'
  }

  if (office.status) {
    return `현재 ${office.status} 상태로 확인되는 부동산중개사무소입니다.`
  }

  return '부동산중개사무소 정보가 확인됩니다.'
}

function createCorrectionSnapshot(office: OfficeDetail, registrationNumber: string, staffCount: number, licensedAgentCount: number, assistantCount: number) {
  return [
    `대표자: ${getValue(office.representative_name)}`,
    `등록번호: ${getValue(office.registration_number || registrationNumber)}`,
    `주소: ${getValue(office.address)}`,
    `영업상태: ${getValue(office.status)}`,
    `총 직원: ${staffCount}명`,
    `공인중개사: ${licensedAgentCount}명`,
    `중개보조원: ${assistantCount}명`,
  ].join(', ')
}
export default function OfficeDetailClient({
  registrationNumber,
}: {
  registrationNumber: string
}) {
  const [office, setOffice] = useState<OfficeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [changeHistory, setChangeHistory] = useState<OfficeChangeHistory[]>([])
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false)

  useEffect(() => {
    const fetchOffice = async () => {
      try {
        const { data } = await api.get<OfficeDetail>(
          `/api/offices/${registrationNumber}`
        )
        setOffice(data)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    const fetchHistory = async () => {
      try {
        const { data } = await api.get<OfficeChangeHistory[]>(
          `/api/changes/office/${registrationNumber}`
        )
        setChangeHistory(data)
      } catch {
        // 변동 이력 없어도 페이지는 정상 표시
      }
    }

    if (registrationNumber) {
      fetchOffice()
      fetchHistory()
    }
  }, [registrationNumber])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>로딩 중...</p>
      </div>
    )
  }

  if (error || !office) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition" style={{ color: '#3182F6' }}>
          <ArrowLeft size={20} />
          돌아가기
        </Link>
        <p className="text-center text-white">사무소를 찾을 수 없습니다</p>
      </div>
    )
  }

  const representative = office.staff?.find(
    (agent) => agent.name === office.representative_name
  )
  const staff = office.staff || []
  const licensedAgentCount = staff.filter((agent) => agent.agent_type?.includes('공인중개사')).length
  const assistantCount = staff.filter((agent) => agent.agent_type?.includes('중개보조원')).length
  const correctionSnapshot = createCorrectionSnapshot(office, registrationNumber, staff.length, licensedAgentCount, assistantCount)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition" style={{ color: '#3182F6' }}>
        <ArrowLeft size={20} />
        돌아가기
      </Link>

      {/* 헤더 */}
      <div className="mb-8">
        <div className="mb-4">
          <h1 className="text-4xl font-bold text-white break-words mb-2">{office.office_name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
              등록번호: {office.registration_number}
            </p>
            <span className="px-3 py-1 font-semibold rounded-full text-white text-xs flex-shrink-0" style={{
              background: office.status === '영업중' ? '#3182F6' : 'rgba(255, 255, 255, 0.2)'
            }}>
              {office.status}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-5 sm:p-6 mb-8 border" style={{
        background: 'linear-gradient(135deg, rgba(49, 130, 246, 0.12), rgba(19, 25, 43, 0.95))',
        borderColor: 'rgba(49, 130, 246, 0.22)'
      }}>
        <div className="flex items-start gap-3 mb-5">
          <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(49, 130, 246, 0.14)', color: '#93C5FD' }}>
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold mb-1" style={{ color: '#93C5FD' }}>계약 전 확인 요약</p>
            <p className="text-base sm:text-lg font-bold text-white">{getOfficeSummaryMessage(office)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            ['대표자', getValue(office.representative_name)],
            ['등록번호', getValue(office.registration_number)],
            ['개업일자', formatDate(office.registered_date)],
            ['주소', getValue(office.address)],
            ['총 직원', `${staff.length}명`],
            ['공인중개사', `${licensedAgentCount}명`],
            ['중개보조원', `${assistantCount}명`],
            ['데이터 기준일', formatDate(office.source_updated_at || office.updated_at || office.created_at)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg px-3 py-2" style={{ background: 'rgba(10, 14, 26, 0.52)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.48)' }}>{label}</p>
              <p className="font-semibold text-white break-words">{value}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.56)' }}>
          계약 전 관할 시·군·구청 또는 공식 조회를 통해 최종 확인하세요.
        </p>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            표시된 정보가 실제와 다르다면 정정 요청을 보내주세요.
          </p>
          <button
            type="button"
            onClick={() => setIsCorrectionModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#13192B] hover:opacity-90"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: 'rgba(255, 255, 255, 0.88)',
            }}
          >
            <MessageSquare size={16} />
            정보 정정 요청
          </button>
        </div>
      </div>

      <CorrectionRequestModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        payload={{
          target_type: 'office',
          target_id: registrationNumber,
          target_name: getValue(office.office_name),
          page_url: `${getSiteUrl()}/office/${encodeURIComponent(registrationNumber)}`,
          snapshot: correctionSnapshot,
        }}
      />

      {/* 기본 정보 카드 */}
      <div className="rounded-xl p-6 mb-8 border" style={{
        background: '#13192B',
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <h2 className="text-2xl font-bold text-white mb-6">기본 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              대표자
            </p>
            <p className="font-semibold text-white mb-3">
              {office.representative_name || '-'}
            </p>
            {(() => {
              const licenseNumber = representative?.license_number || office.representative_license_number || null
              const licenseDate = representative?.license_date || office.representative_license_date || null
              if (!office.representative_name) return null
              const { year, career } = extractLicenseYear(licenseNumber, licenseDate)
              return (
                <div className="space-y-2">
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                    자격취득년도: <span style={{ color: year ? 'white' : 'rgba(255, 255, 255, 0.4)' }} className="font-semibold">{year || '정보 없음'}</span>
                  </p>
                  <p style={{ color: career === '-' ? 'rgba(255, 255, 255, 0.4)' : '#3182F6', fontSize: '0.875rem', fontWeight: '600' }}>
                    대표자 경력: {career === '-' ? '확인 불가' : career}
                  </p>
                </div>
              )
            })()}
          </div>
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              지역
            </p>
            <p className="font-semibold text-white">
              {office.sido} {office.sigungu}
            </p>
          </div>
          <div className="col-span-2">
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              주소
            </p>
            <p className="font-semibold text-white">{office.address || '-'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              등록일자
            </p>
            <p className="font-semibold text-white">
              {office.registered_date
                ? new Date(office.registered_date).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              운영 기간
            </p>
            <p className="font-semibold text-white">
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
        </div>
      </div>

      {/* 직원 통계 */}
      {office.staff && office.staff.length > 0 && (
        <div className="rounded-xl p-6 mb-8 border" style={{
          background: '#13192B',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <div className="flex items-center gap-3 mb-6">
            <Users size={24} style={{ color: '#3182F6' }} />
            <h2 className="text-2xl font-bold text-white">직원 현황</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col justify-center p-3 rounded border" style={{ background: 'rgba(49, 130, 246, 0.08)', borderColor: 'rgba(49, 130, 246, 0.2)' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>총 직원</p>
              <p className="text-2xl font-bold text-white mt-1">{office.staff.length}</p>
            </div>
            <div className="flex flex-col justify-center p-3 rounded border" style={{ background: 'rgba(49, 130, 246, 0.08)', borderColor: 'rgba(49, 130, 246, 0.2)' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>공인중개사</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#3182F6' }}>
                {office.staff.filter((a) => a.agent_type === '공인중개사').length}
              </p>
            </div>
            <div className="flex flex-col justify-center p-3 rounded border" style={{ background: 'rgba(49, 130, 246, 0.08)', borderColor: 'rgba(49, 130, 246, 0.2)' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>중개보조원</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#3182F6' }}>
                {office.staff.filter((a) => a.agent_type === '중개보조원').length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 소속 직원 */}
      {office.staff && office.staff.length > 0 && (
        <div className="rounded-xl p-6 border" style={{
          background: '#13192B',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <h2 className="text-2xl font-bold text-white mb-6">
            소속 직원 상세 ({office.staff.length}명)
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            {/* 공인중개사 */}
            <div>
              <h3 className="font-bold mb-4" style={{ color: '#3182F6' }}>
                공인중개사 ({office.staff.filter((a) => a.agent_type === '공인중개사').length}명)
              </h3>
              <div className="space-y-2">
                {office.staff.filter((a) => a.agent_type === '공인중개사').map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agent/${agent.id}`}
                    className="flex items-center justify-between p-3 rounded cursor-pointer transition border"
                    style={{
                      background: 'rgba(49, 130, 246, 0.08)',
                      borderColor: 'rgba(49, 130, 246, 0.2)'
                    }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{agent.name}</p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                        {agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 중개보조원 */}
            <div>
              <h3 className="font-bold mb-4" style={{ color: '#3182F6' }}>
                중개보조원 ({office.staff.filter((a) => a.agent_type === '중개보조원').length}명)
              </h3>
              <div className="space-y-2">
                {office.staff.filter((a) => a.agent_type === '중개보조원').map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agent/${agent.id}`}
                    className="flex items-center justify-between p-3 rounded cursor-pointer transition border"
                    style={{
                      background: 'rgba(49, 130, 246, 0.08)',
                      borderColor: 'rgba(49, 130, 246, 0.2)'
                    }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{agent.name}</p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                        {agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 기타 */}
          {office.staff.filter((a) => a.agent_type !== '공인중개사' && a.agent_type !== '중개보조원').length > 0 && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 className="font-bold mb-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                기타 ({office.staff.filter((a) => a.agent_type !== '공인중개사' && a.agent_type !== '중개보조원').length}명)
              </h3>
              <div className="space-y-2">
                {office.staff.filter((a) => a.agent_type !== '공인중개사' && a.agent_type !== '중개보조원').map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agent/${agent.id}`}
                    className="flex items-center justify-between p-3 rounded cursor-pointer transition border"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{agent.name}</p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                        {agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'} • {agent.agent_type || '정보 없음'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 변동 이력 */}
      {changeHistory.length > 0 && (
        <div className="rounded-xl p-6 mt-8 border" style={{
          background: '#13192B',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <div className="flex items-center gap-3 mb-6">
            <History size={24} style={{ color: '#3182F6' }} />
            <h2 className="text-2xl font-bold text-white">변동 이력</h2>
          </div>
          <div className="space-y-4">
            {changeHistory.map((entry, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{
                    background: entry.events.some(e => e.type === '신규개업') ? '#22c55e'
                      : entry.events.some(e => e.type === '폐업') ? '#ef4444'
                      : '#3182F6'
                  }} />
                  {idx < changeHistory.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.1)', minHeight: '1.5rem' }} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.375rem' }}>
                    {new Date(entry.sync_date).toLocaleDateString('ko-KR')}
                  </p>
                  {entry.events.map((ev, eidx) => (
                    <div key={eidx} className="mb-2">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold mb-1" style={{
                        background: ev.type === '신규개업' ? 'rgba(34,197,94,0.15)'
                          : ev.type === '폐업' ? 'rgba(239,68,68,0.15)'
                          : 'rgba(49,130,246,0.15)',
                        color: ev.type === '신규개업' ? '#22c55e'
                          : ev.type === '폐업' ? '#ef4444'
                          : '#3182F6'
                      }}>
                        {ev.type}
                      </span>
                      {ev.detail && Object.keys(ev.detail).length > 0 && (
                        <div className="space-y-1 mt-1">
                          {Object.entries(ev.detail).map(([field, val]) => (
                            <div key={field} className="flex flex-wrap gap-1 items-start text-xs">
                              <span style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                                {FIELD_LABELS[field] || field}:
                              </span>
                              <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>
                                {val.before || '(없음)'}
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
                              <span style={{ color: '#22c55e' }}>{val.after || '(없음)'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
