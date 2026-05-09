import type { CSSProperties } from 'react'
import type { CorrectionStatus } from './adminTypes'

export const BG = '#0A0E1A'
export const CARD_BG = 'rgba(255,255,255,0.04)'
export const BORDER = 'rgba(255,255,255,0.08)'
export const TEXT = 'rgba(255,255,255,0.9)'
export const TEXT_MUTED = 'rgba(255,255,255,0.5)'
export const ACCENT = '#3182F6'
export const TABLE_HEADER_BG = 'rgba(255,255,255,0.06)'
export const TABLE_HOVER = 'rgba(255,255,255,0.03)'

export const STATUS_LABELS: Record<CorrectionStatus, string> = {
  pending: '대기',
  reviewing: '검토중',
  resolved: '완료',
  rejected: '반려',
}

export const STATUS_COLORS: Record<CorrectionStatus, { color: string; bg: string; border: string }> = {
  pending: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.28)' },
  reviewing: { color: ACCENT, bg: 'rgba(49,130,246,0.12)', border: 'rgba(49,130,246,0.28)' },
  resolved: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.28)' },
  rejected: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.28)' },
}

export const cardStyle: CSSProperties = {
  background: CARD_BG,
  borderRadius: 16,
  padding: 24,
  border: `1px solid ${BORDER}`,
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  color: TEXT,
  outline: 'none',
}

export const thStyle: CSSProperties = {
  padding: '12px 24px',
  textAlign: 'left',
  fontSize: 13,
  fontWeight: 600,
  color: TEXT_MUTED,
  background: TABLE_HEADER_BG,
  borderBottom: `1px solid ${BORDER}`,
}

export const tdStyle: CSSProperties = {
  padding: '14px 24px',
  fontSize: 13,
  color: TEXT,
  borderBottom: `1px solid ${BORDER}`,
}
