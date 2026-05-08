'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AgentDetail } from '@/types'
import { extractLicenseYear } from '@/lib/licenseUtils'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AgentPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : params.id?.[0]

  const [agent, setAgent] = useState<AgentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    fetch(`${API_URL}/api/agents/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('404')
        return res.json()
      })
      .then((data: AgentDetail) => {
        setAgent(data)
        setLoading(false)
      })
      .catch(() => {
        setNotFound(true)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>로딩 중...</p>
      </div>
    )
  }

  if (notFound || !agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition" style={{ color: '#3182F6' }}>
          <ArrowLeft size={20} />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-white mb-4">페이지를 찾을 수 없습니다</h1>
      </div>
    )
  }

  const { year, career, isInvalid, errorMessage } = extractLicenseYear(agent.license_number, agent.license_date)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition" style={{ color: '#3182F6' }}>
        <ArrowLeft size={20} />
        돌아가기
      </Link>

      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">{agent.name}</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <span className="px-4 py-2 text-sm font-semibold rounded-full text-white" style={{ background: '#3182F6' }}>
            {agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'}
          </span>
          <span className="px-4 py-2 text-sm font-semibold rounded-full text-white" style={{
            background: agent.agent_type === '공인중개사' ? '#3182F6' : '#666'
          }}>
            {agent.agent_type || '-'}
          </span>
        </div>
      </div>

      {/* 경고/확인 메시지 */}
      {isInvalid && errorMessage && (!agent.license_number || agent.license_number === 'nan') && (
        <div className="flex gap-3 px-4 py-3 mb-8 rounded-lg border" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          color: '#FCA5A5'
        }}>
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">데이터 검증 주의</p>
            <p className="text-xs mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {agent.license_number && agent.license_number !== 'nan' && (
        <div className="flex gap-3 px-4 py-3 mb-8 rounded-lg border" style={{
          background: 'rgba(49, 130, 246, 0.1)',
          borderColor: 'rgba(49, 130, 246, 0.2)',
          color: '#93C5FD'
        }}>
          <CheckCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#3182F6' }} />
          <p className="font-medium text-sm">공인중개사 자격증 등록됨</p>
        </div>
      )}

      {/* 기본 정보 카드 */}
      <div className="rounded-xl p-6 mb-8 border" style={{
        background: '#13192B',
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <h2 className="text-2xl font-bold text-white mb-6">기본 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              역할
            </p>
            <p className="font-semibold text-white">{agent.role === '대표' ? '대표자' : agent.role ? '소속직원' : '-'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              자격번호
            </p>
            <p className="font-semibold text-white">{agent.license_number && agent.license_number !== 'nan' ? agent.license_number : '-'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              자격취득년도
            </p>
            <p className="font-semibold text-white">
              {year ? `${year}년${isInvalid ? ' (주의)' : ''}` : '자격증 미보유'}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              경력
            </p>
            <p className="font-semibold" style={{ color: year ? '#3182F6' : 'rgba(255, 255, 255, 0.6)' }}>
              {year ? career : '확인 불가'}
            </p>
          </div>
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              종별
            </p>
            <p className="font-semibold text-white">{agent.agent_type || '-'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              지역
            </p>
            <p className="font-semibold text-white">
              {agent.sido} {agent.sigungu}
            </p>
          </div>
        </div>
      </div>

      {/* 소속 사무소 */}
      {agent.office && (
        <div className="rounded-xl p-6 border" style={{
          background: '#13192B',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <h2 className="text-2xl font-bold text-white mb-4">소속 사무소</h2>
          <Link href={`/office/${encodeURIComponent(agent.office.registration_number)}`}>
            <div className="p-4 rounded-lg cursor-pointer transition border" style={{
              background: 'rgba(49, 130, 246, 0.08)',
              borderColor: 'rgba(49, 130, 246, 0.2)'
            }}>
              <h3 className="font-bold text-lg text-white mb-3">
                {agent.office.office_name}
              </h3>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }} className="space-y-1 mb-4">
                <p>등록번호: {agent.office.registration_number}</p>
                <p>주소: {agent.office.address || '-'}</p>
              </div>
              <p style={{ color: '#3182F6', fontSize: '0.875rem', fontWeight: '600' }}>자세히 보기 →</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
