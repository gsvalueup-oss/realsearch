'use client'

import { FormEvent, useEffect, useState } from 'react'
import AdminLogin from '../_components/AdminLogin'
import AdminShell from '../_components/AdminShell'
import SyncUploadSection from '../_components/SyncUploadSection'
import { fetchAdminStats } from '../_lib/adminApi'
import { clearStoredAdminPassword, readStoredAdminPassword, storeAdminPassword } from '../_lib/adminAuth'

export default function AdminSyncPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const authenticate = async (adminPassword = password) => {
    if (!adminPassword) return

    setLoading(true)
    setMessage('')

    try {
      await fetchAdminStats(adminPassword)
      setPassword(adminPassword)
      setAuthenticated(true)
      storeAdminPassword(adminPassword)
    } catch {
      setPassword('')
      setAuthenticated(false)
      clearStoredAdminPassword()
      setMessage('관리자 인증에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedPassword = readStoredAdminPassword()
    if (storedPassword) {
      authenticate(storedPassword)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (!password) {
      setMessage('비밀번호를 입력하세요.')
      return
    }
    await authenticate(password)
  }

  const handleLogout = () => {
    clearStoredAdminPassword()
    setPassword('')
    setAuthenticated(false)
    setMessage('')
  }

  if (!authenticated) {
    return (
      <AdminLogin
        password={password}
        loading={loading}
        message={message}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    )
  }

  return (
    <AdminShell
      title="데이터 관리"
      description="CSV 업로드, 데이터 미리보기, 실제 적용 및 동기화 결과를 관리합니다."
      message={message}
      onLogout={handleLogout}
    >
      <SyncUploadSection password={password} onMessage={setMessage} />
    </AdminShell>
  )
}
