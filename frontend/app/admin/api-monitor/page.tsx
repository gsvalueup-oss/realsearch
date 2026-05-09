'use client'

import { FormEvent, useEffect, useState } from 'react'
import AdminLogin from '../_components/AdminLogin'
import AdminShell from '../_components/AdminShell'
import ApiStatsSection from '../_components/ApiStatsSection'
import { fetchApiStats } from '../_lib/adminApi'
import { clearStoredAdminPassword, readStoredAdminPassword, storeAdminPassword } from '../_lib/adminAuth'
import type { APIStats } from '../_lib/adminTypes'

export default function AdminApiMonitorPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [apiStats, setApiStats] = useState<APIStats | null>(null)
  const [statsError, setStatsError] = useState('')

  const loadApiStats = async (adminPassword = password) => {
    if (!adminPassword) return

    setLoading(true)
    setMessage('')
    setStatsError('')

    try {
      const data = await fetchApiStats(adminPassword)
      setPassword(adminPassword)
      setApiStats(data)
      setAuthenticated(true)
      storeAdminPassword(adminPassword)
    } catch (error: any) {
      setPassword('')
      setApiStats(null)
      setAuthenticated(false)
      clearStoredAdminPassword()
      setStatsError(error.message || 'API 통계를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedPassword = readStoredAdminPassword()
    if (storedPassword) {
      loadApiStats(storedPassword)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (!password) {
      setMessage('비밀번호를 입력하세요.')
      return
    }
    await loadApiStats(password)
  }

  const handleLogout = () => {
    clearStoredAdminPassword()
    setPassword('')
    setAuthenticated(false)
    setApiStats(null)
    setMessage('')
    setStatsError('')
  }

  if (!authenticated) {
    return (
      <AdminLogin
        password={password}
        loading={loading}
        message={message || statsError}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    )
  }

  return (
    <AdminShell
      title="API 로그"
      description="API 요청 현황, 엔드포인트별 통계, 최근 오류 및 실패 기록을 확인합니다."
      message={message}
      onLogout={handleLogout}
    >
      <ApiStatsSection
        apiStats={apiStats}
        loading={loading}
        error={statsError}
      />
    </AdminShell>
  )
}
