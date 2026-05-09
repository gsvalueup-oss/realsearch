'use client'

import { FormEvent, useEffect, useState } from 'react'
import AdminLogin from '../_components/AdminLogin'
import AdminShell from '../_components/AdminShell'
import CorrectionRequestsSection from '../_components/CorrectionRequestsSection'
import { fetchCorrectionRequests, patchCorrectionRequest } from '../_lib/adminApi'
import { clearStoredAdminPassword, readStoredAdminPassword, storeAdminPassword } from '../_lib/adminAuth'
import type {
  CorrectionRequest,
  CorrectionStatusFilter,
  CorrectionTargetFilter,
} from '../_lib/adminTypes'

export default function AdminCorrectionRequestsPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [requests, setRequests] = useState<CorrectionRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<CorrectionStatusFilter>('')
  const [targetFilter, setTargetFilter] = useState<CorrectionTargetFilter>('')
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)

  const loadRequests = async (
    adminPassword = password,
    status: CorrectionStatusFilter = statusFilter,
    targetType: CorrectionTargetFilter = targetFilter
  ) => {
    if (!adminPassword) return

    setRequestLoading(true)
    setRequestError('')

    try {
      const data = await fetchCorrectionRequests({ password: adminPassword, status, targetType })
      setRequests(data)
      setPassword(adminPassword)
      setAuthenticated(true)
      storeAdminPassword(adminPassword)
    } catch (error: any) {
      setRequestError(error.message || '정정 요청 목록을 불러오지 못했습니다.')
      setAuthenticated(false)
      clearStoredAdminPassword()
    } finally {
      setRequestLoading(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedPassword = readStoredAdminPassword()
    if (storedPassword) {
      setLoading(true)
      loadRequests(storedPassword)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()

    if (!password) {
      setMessage('비밀번호를 입력하세요.')
      return
    }

    setLoading(true)
    setMessage('')
    await loadRequests(password)
  }

  const handleLogout = () => {
    clearStoredAdminPassword()
    setPassword('')
    setAuthenticated(false)
    setRequests([])
    setMessage('')
    setRequestError('')
  }

  const handleStatusFilterChange = (status: CorrectionStatusFilter) => {
    setStatusFilter(status)
    loadRequests(password, status, targetFilter)
  }

  const handleTargetFilterChange = (targetType: CorrectionTargetFilter) => {
    setTargetFilter(targetType)
    loadRequests(password, statusFilter, targetType)
  }

  const updateDraft = (id: number, patch: Partial<Pick<CorrectionRequest, 'status' | 'admin_note'>>) => {
    setRequests((items) => items.map((item) => (
      item.id === id ? { ...item, ...patch } : item
    )))
  }

  const saveRequest = async (request: CorrectionRequest) => {
    setSavingId(request.id)
    setRequestError('')

    try {
      const updated = await patchCorrectionRequest({ password, request })
      setRequests((items) => items.map((item) => (
        item.id === updated.id ? updated : item
      )))
      setMessage('정정 요청이 저장되었습니다.')
    } catch (error: any) {
      setRequestError(error.message || '정정 요청 저장에 실패했습니다.')
    } finally {
      setSavingId(null)
    }
  }

  if (!authenticated) {
    return (
      <AdminLogin
        password={password}
        loading={loading}
        message={message || requestError}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    )
  }

  return (
    <AdminShell
      title="정보 정정 요청"
      description="사용자가 제출한 정보 정정 요청을 확인하고 처리 상태를 관리합니다."
      message={message}
      onLogout={handleLogout}
    >
      <CorrectionRequestsSection
        requests={requests}
        statusFilter={statusFilter}
        targetFilter={targetFilter}
        loading={requestLoading}
        error={requestError}
        savingId={savingId}
        onStatusFilterChange={handleStatusFilterChange}
        onTargetFilterChange={handleTargetFilterChange}
        onRefresh={() => loadRequests()}
        onDraftChange={updateDraft}
        onSave={saveRequest}
      />
    </AdminShell>
  )
}
