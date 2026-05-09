import type { ReactNode } from 'react'
import AdminNav from './AdminNav'
import AdminMessage from './AdminMessage'
import { BG, BORDER, TEXT, TEXT_MUTED } from '../_lib/adminStyles'

export default function AdminShell({
  message,
  onLogout,
  children,
}: {
  message: string
  onLogout: () => void
  children: ReactNode
}) {
  return (
    <div style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 16px', background: BG, minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: TEXT }}>관리자 대시보드</h1>
        <button
          onClick={onLogout}
          style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', color: TEXT_MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          로그아웃
        </button>
      </div>

      <AdminNav />
      <AdminMessage message={message} />
      {children}
    </div>
  )
}
