'use client'

import { FormEvent, useEffect, useState } from 'react'
import AdminLogin from '../_components/AdminLogin'
import AdminSettingsSection from '../_components/AdminSettingsSection'
import AdminShell from '../_components/AdminShell'
import { fetchAdminStats } from '../_lib/adminApi'
import { clearStoredAdminPassword, readStoredAdminPassword, storeAdminPassword } from '../_lib/adminAuth'

export default function AdminSettingsPage() {
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
      title="관리자 설정"
      description="조회수 초기화 등 위험 관리 기능을 실행합니다."
      message={message}
      onLogout={handleLogout}
    >
      <AdminSettingsSection
        password={password}
        onMessage={setMessage}
      />
    </AdminShell>
  )
}
