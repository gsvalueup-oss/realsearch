import type { FormEvent } from 'react'
import { ACCENT, BG, TEXT, TEXT_MUTED, cardStyle, inputStyle } from '../_lib/adminStyles'

export default function AdminLogin({
  password,
  loading,
  message,
  onPasswordChange,
  onSubmit,
}: {
  password: string
  loading: boolean
  message: string
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent) => void
}) {
  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <div style={{ width: '100%', maxWidth: 400, ...cardStyle }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: TEXT, marginBottom: 24, textAlign: 'center' }}>관리자 로그인</h1>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: TEXT_MUTED, marginBottom: 8 }}>비밀번호</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              style={inputStyle}
              placeholder="관리자 비밀번호를 입력하세요"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '10px 0', background: loading ? 'rgba(49,130,246,0.5)' : ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        {message && (
          <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center', color: message.includes('성공') ? '#34d399' : '#f87171' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
