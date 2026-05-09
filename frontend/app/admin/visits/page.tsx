'use client'

import { FormEvent, useEffect, useState } from 'react'
import AdminLogin from '../_components/AdminLogin'
import AdminShell from '../_components/AdminShell'
import UserStatsSection from '../_components/UserStatsSection'
import { fetchUserStats } from '../_lib/adminApi'
import { clearStoredAdminPassword, readStoredAdminPassword, storeAdminPassword } from '../_lib/adminAuth'
import type { UserStats } from '../_lib/adminTypes'

export default function AdminVisitsPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [statsError, setStatsError] = useState('')

  const loadVisits = async (adminPassword = password) => {
    if (!adminPassword) return

    setLoading(true)
    setMessage('')
    setStatsError('')

    try {
      const data = await fetchUserStats(adminPassword)
      setPassword(adminPassword)
      setUserStats(data)
      setAuthenticated(true)
      storeAdminPassword(adminPassword)
    } catch (error: any) {
      setPassword('')
      setUserStats(null)
      setAuthenticated(false)
      clearStoredAdminPassword()
      setStatsError(error.message || '방문자 통계를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedPassword = readStoredAdminPassword()
    if (storedPassword) {
      loadVisits(storedPassword)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (!password) {
      setMessage('비밀번호를 입력하세요.')
      return
    }
    await loadVisits(password)
  }

  const handleLogout = () => {
    clearStoredAdminPassword()
    setPassword('')
    setAuthenticated(false)
    setUserStats(null)
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
      title="방문자 분석"
      description="사용자 접속 통계, 인기 페이지, 최근 방문자 기록을 확인합니다."
      message={message}
      onLogout={handleLogout}
    >
      <UserStatsSection
        userStats={userStats}
        loading={loading}
        error={statsError}
      />
    </AdminShell>
  )
}
