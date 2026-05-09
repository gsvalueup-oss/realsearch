'use client'

import { useState } from 'react'
import { resetViews } from '../_lib/adminApi'
import {
  BORDER,
  TEXT,
  TEXT_MUTED,
  cardStyle,
} from '../_lib/adminStyles'

interface AdminSettingsSectionProps {
  password: string
  onMessage: (message: string) => void
}

export default function AdminSettingsSection({
  password,
  onMessage,
}: AdminSettingsSectionProps) {
  const [loading, setLoading] = useState(false)

  const handleResetViews = async () => {
    if (!window.confirm('정말 조회수를 초기화하시겠습니까?')) return

    setLoading(true)
    onMessage('')

    try {
      await resetViews(password)
      onMessage('조회수가 초기화되었습니다')
    } catch {
      onMessage('오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      ...cardStyle,
      marginBottom: 24,
      border: '1px solid rgba(248,113,113,0.28)',
      background: 'rgba(248,113,113,0.055)',
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>위험 관리 기능</h2>
      <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, marginBottom: 18 }}>
        아래 기능은 서비스 데이터 표시 상태에 직접 영향을 줍니다. 실행 전에 작업 내용을 확인하고 필요한 경우 백업 상태를 먼저 점검하세요.
      </p>

      <button
        onClick={handleResetViews}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px 0',
          background: loading ? 'rgba(255,255,255,0.08)' : 'rgba(248,113,113,0.15)',
          color: loading ? TEXT_MUTED : '#f87171',
          border: `1px solid ${loading ? BORDER : 'rgba(248,113,113,0.3)'}`,
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '처리 중...' : '조회수 초기화'}
      </button>
    </div>
  )
}
