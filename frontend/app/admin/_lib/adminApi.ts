import type {
  APIStats,
  CorrectionRequest,
  CorrectionStatusFilter,
  CorrectionTargetFilter,
  Stats,
  SyncResult,
  UserStats,
} from './adminTypes'

export function getBaseURL() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

export function buildPasswordParams(password: string) {
  return new URLSearchParams({ password })
}

export async function fetchAdminStats(password: string, signal?: AbortSignal): Promise<Stats> {
  const res = await fetch(`${getBaseURL()}/api/admin/stats?password=${password}`, { signal })
  if (!res.ok) throw new Error('인증 실패')
  return res.json()
}

export async function fetchApiStats(password: string, signal?: AbortSignal): Promise<APIStats> {
  const res = await fetch(`${getBaseURL()}/api/admin/api-stats?password=${password}`, { signal })
  if (!res.ok) throw new Error('API 통계를 불러오지 못했습니다.')
  return res.json()
}

export async function fetchUserStats(password: string, signal?: AbortSignal): Promise<UserStats> {
  const res = await fetch(`${getBaseURL()}/api/admin/user-stats?password=${password}`, { signal })
  if (!res.ok) throw new Error('사용자 통계를 불러오지 못했습니다.')
  return res.json()
}

export async function fetchCorrectionRequests({
  password,
  status = '',
  targetType = '',
  signal,
}: {
  password: string
  status?: CorrectionStatusFilter
  targetType?: CorrectionTargetFilter
  signal?: AbortSignal
}): Promise<CorrectionRequest[]> {
  const params = new URLSearchParams({ password, limit: '100' })
  if (status) params.set('status', status)
  if (targetType) params.set('target_type', targetType)

  const res = await fetch(`${getBaseURL()}/api/admin/correction-requests?${params.toString()}`, { signal })
  if (!res.ok) throw new Error('정정 요청 목록을 불러오지 못했습니다.')
  return res.json()
}

export async function patchCorrectionRequest({
  password,
  request,
}: {
  password: string
  request: CorrectionRequest
}): Promise<CorrectionRequest> {
  const params = buildPasswordParams(password)
  const res = await fetch(`${getBaseURL()}/api/admin/correction-requests/${request.id}?${params.toString()}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: request.status,
      admin_note: request.admin_note || null,
    }),
  })

  if (!res.ok) throw new Error('정정 요청 저장에 실패했습니다.')
  return res.json()
}

export async function resetViews(password: string) {
  const res = await fetch(`${getBaseURL()}/api/admin/reset-views?password=${password}`, { method: 'POST' })
  if (!res.ok) throw new Error('조회수 초기화에 실패했습니다.')
  return res.json()
}

export async function refreshAdminStats(password: string): Promise<Stats> {
  const res = await fetch(`${getBaseURL()}/api/admin/stats?password=${password}`)
  if (!res.ok) throw new Error('통계를 다시 불러오지 못했습니다.')
  return res.json()
}

export function uploadCsvWithProgress({
  url,
  formData,
  onProgress,
  onUploaded,
}: {
  url: string
  formData: FormData
  onProgress: (progress: number) => void
  onUploaded: () => void
}): Promise<SyncResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100))
    }
    xhr.upload.onload = () => {
      onProgress(100)
      onUploaded()
    }
    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve(result)
        else reject(new Error(result.detail || '업로드 실패'))
      } catch {
        reject(new Error('서버 응답 오류'))
      }
    }
    xhr.onerror = () => reject(new Error('네트워크 오류가 발생했습니다.'))
    xhr.ontimeout = () => reject(new Error('요청 시간이 초과되었습니다.'))
    xhr.open('POST', url)
    xhr.send(formData)
  })
}

export function getCsvUploadUrl({
  password,
  csvType,
  dryRun,
}: {
  password: string
  csvType: string
  dryRun: boolean
}) {
  return `${getBaseURL()}/api/admin/csv-upload?password=${password}&data_type=${csvType}&dry_run=${dryRun}`
}
