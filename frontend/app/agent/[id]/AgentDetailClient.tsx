'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AgentDetail } from '@/types'
import { extractLicenseYear } from '@/lib/licenseUtils'
import { ArrowLeft, CheckCircle, AlertCircle, ShieldCheck, Mail } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const CONTACT_EMAIL = 'realsearchvalue@gmail.com'

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

function getValue(value: string | null | undefined) {
  return value && value !== 'nan' ? value : '정보 없음'
}

function getAgentSummaryMessage(agent: AgentDetail) {
  if (agent.agent_type?.includes('공인중개사')) {
    return '현재 공인중개사로 등록된 사람입니다.'
  }

  if (agent.agent_type?.includes('중개보조원')) {
    return '현재 중개보조원으로 등록된 사람입니다.'
  }

  return '부동산중개업 종사자 정보가 확인됩니다.'
}

function getAgentPositionLabel(agent: AgentDetail) {
  if (agent.role === '대표') return '대표'
  if (agent.agent_type?.includes('중개보조원')) return '중개보조원'
  if (agent.agent_type?.includes('공인중개사')) return '소속공인중개사'

  return agent.role || agent.agent_type || '정보 없음'
}

function createCorrectionMailto(agent: AgentDetail, id: string, officeName: string, region: string) {
  const subject = `[리얼서치 정보 정정 요청] ${getValue(agent.name)}`
  const body = [
    `페이지 URL: ${getSiteUrl()}/agent/${encodeURIComponent(id)}`,
    `이름: ${getValue(agent.name)}`,
    `직위: ${getAgentPositionLabel(agent)}`,
    `구분: ${getValue(agent.agent_type)}`,
    `소속 사무소: ${getValue(officeName)}`,
    `지역: ${getValue(region)}`,
    '',
    '정정 요청 내용:',
    '',
    '요청자 연락처:',
  ].join('\n')

  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default function AgentDetailClient({ id }: { id: string }) {
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
  const region = [agent.sido, agent.sigungu].filter(Boolean).join(' ') || '정보 없음'
  const officeName = agent.office_name || agent.office?.office_name || '정보 없음'
  const correctionMailto = createCorrectionMailto(agent, id, officeName, region)

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
            <p className="text-base sm:text-lg font-bold text-white">{getAgentSummaryMessage(agent)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            ['직위', getAgentPositionLabel(agent)],
            ['소속 사무소', officeName],
            ['지역', region],
            ['자격취득년도', year ? `${year}년` : '정보 없음'],
            ['경력', year ? career : '정보 없음'],
            ['데이터 기준일', formatDate(agent.source_updated_at || agent.updated_at || agent.created_at)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg px-3 py-2" style={{ background: 'rgba(10, 14, 26, 0.52)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.48)' }}>{label}</p>
              <p className="font-semibold text-white break-words">{getValue(value)}</p>
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
          <a
            href={correctionMailto}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#13192B] hover:opacity-90"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: 'rgba(255, 255, 255, 0.88)',
            }}
          >
            <Mail size={16} />
            정보 정정 요청
          </a>
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
