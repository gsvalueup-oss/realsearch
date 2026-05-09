'use client'

import {
  ACCENT,
  BORDER,
  STATUS_COLORS,
  STATUS_LABELS,
  TEXT,
  TEXT_MUTED,
  cardStyle,
  inputStyle,
} from '../_lib/adminStyles'
import type {
  CorrectionRequest,
  CorrectionStatus,
  CorrectionStatusFilter,
  CorrectionTargetFilter,
} from '../_lib/adminTypes'

function formatAdminDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('ko-KR')
}

function formatSnapshot(snapshot: CorrectionRequest['snapshot']) {
  if (!snapshot) return '정보 없음'
  if (typeof snapshot === 'string') return snapshot
  try {
    return JSON.stringify(snapshot, null, 2)
  } catch {
    return '정보 없음'
  }
}

function getCorrectionTargetLabel(targetType: CorrectionRequest['target_type']) {
  return targetType === 'agent' ? '사람' : '사무소'
}

function CorrectionStatusBadge({ status }: { status: CorrectionStatus }) {
  const colors = STATUS_COLORS[status]

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 8px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      color: colors.color,
      background: colors.bg,
      border: `1px solid ${colors.border}`,
    }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

interface CorrectionRequestsSectionProps {
  requests: CorrectionRequest[]
  statusFilter: CorrectionStatusFilter
  targetFilter: CorrectionTargetFilter
  loading: boolean
  error: string
  savingId: number | null
  onStatusFilterChange: (status: CorrectionStatusFilter) => void
  onTargetFilterChange: (targetType: CorrectionTargetFilter) => void
  onRefresh: () => void
  onDraftChange: (id: number, patch: Partial<Pick<CorrectionRequest, 'status' | 'admin_note'>>) => void
  onSave: (request: CorrectionRequest) => void
}

export default function CorrectionRequestsSection({
  requests,
  statusFilter,
  targetFilter,
  loading,
  error,
  savingId,
  onStatusFilterChange,
  onTargetFilterChange,
  onRefresh,
  onDraftChange,
  onSave,
}: CorrectionRequestsSectionProps) {
  return (
    <div style={{ ...cardStyle, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 6 }}>정보 정정 요청</h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED }}>
            접수된 정보 정정 요청을 확인하고 상태와 관리자 메모를 저장합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          style={{
            padding: '9px 14px',
            background: loading ? 'rgba(255,255,255,0.08)' : 'rgba(49,130,246,0.14)',
            color: loading ? TEXT_MUTED : ACCENT,
            border: `1px solid ${loading ? BORDER : 'rgba(49,130,246,0.28)'}`,
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '불러오는 중...' : '새로고침'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>상태 필터</label>
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as CorrectionStatusFilter)}
            style={inputStyle}
            disabled={loading}
          >
            <option value="">전체</option>
            <option value="pending">대기</option>
            <option value="reviewing">검토중</option>
            <option value="resolved">완료</option>
            <option value="rejected">반려</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>대상 구분</label>
          <select
            value={targetFilter}
            onChange={(event) => onTargetFilterChange(event.target.value as CorrectionTargetFilter)}
            style={inputStyle}
            disabled={loading}
          >
            <option value="">전체</option>
            <option value="agent">사람</option>
            <option value="office">사무소</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 14px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          color: '#f87171',
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.2)',
        }}>
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div style={{
          padding: '28px 16px',
          textAlign: 'center',
          color: TEXT_MUTED,
          border: `1px dashed ${BORDER}`,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.02)',
        }}>
          표시할 정정 요청이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                background: 'rgba(10,14,26,0.42)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                padding: '14px 16px',
                borderBottom: `1px solid ${BORDER}`,
                background: 'rgba(255,255,255,0.025)',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <CorrectionStatusBadge status={request.status} />
                    <span style={{ fontSize: 12, color: TEXT_MUTED }}>{getCorrectionTargetLabel(request.target_type)}</span>
                    <span style={{ fontSize: 12, color: TEXT_MUTED }}>#{request.id}</span>
                  </div>
                  <h3 style={{ fontSize: 16, color: TEXT, fontWeight: 700, marginBottom: 4, wordBreak: 'break-word' }}>
                    {request.target_name || '정보 없음'}
                  </h3>
                  <p style={{ fontSize: 12, color: TEXT_MUTED }}>접수일: {formatAdminDate(request.created_at)}</p>
                </div>
                <a
                  href={request.page_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    alignSelf: 'flex-start',
                    color: ACCENT,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    wordBreak: 'break-all',
                  }}
                >
                  페이지 열기
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14, padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <InfoBlock label="페이지 URL" value={request.page_url} />
                  <InfoBlock label="요청자 연락처" value={request.requester_contact || '정보 없음'} />
                </div>

                <InfoBlock label="정정 요청 내용" value={request.request_content} multiline />
                <InfoBlock label="snapshot" value={formatSnapshot(request.snapshot)} multiline />

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 220px) minmax(0, 1fr)', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>상태 변경</label>
                    <select
                      value={request.status}
                      onChange={(event) => onDraftChange(request.id, { status: event.target.value as CorrectionStatus })}
                      style={inputStyle}
                      disabled={savingId === request.id}
                    >
                      <option value="pending">대기</option>
                      <option value="reviewing">검토중</option>
                      <option value="resolved">완료</option>
                      <option value="rejected">반려</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>관리자 메모</label>
                    <textarea
                      value={request.admin_note || ''}
                      onChange={(event) => onDraftChange(request.id, { admin_note: event.target.value })}
                      rows={3}
                      maxLength={2000}
                      style={{ ...inputStyle, resize: 'vertical', minHeight: 82 }}
                      disabled={savingId === request.id}
                      placeholder="처리 내용이나 확인 메모를 입력하세요."
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => onSave(request)}
                    disabled={savingId === request.id}
                    style={{
                      minWidth: 110,
                      padding: '10px 16px',
                      background: savingId === request.id ? 'rgba(255,255,255,0.1)' : ACCENT,
                      color: savingId === request.id ? TEXT_MUTED : '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: savingId === request.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingId === request.id ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoBlock({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>{label}</p>
      <div style={{
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.035)',
        border: `1px solid ${BORDER}`,
        color: TEXT,
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: multiline ? 'pre-wrap' : 'normal',
        wordBreak: 'break-word',
        maxHeight: multiline ? 140 : undefined,
        overflowY: multiline ? 'auto' : undefined,
      }}>
        {value || '정보 없음'}
      </div>
    </div>
  )
}
