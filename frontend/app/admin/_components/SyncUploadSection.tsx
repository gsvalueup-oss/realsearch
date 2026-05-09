'use client'

import { FormEvent, useState } from 'react'
import { getCsvUploadUrl, uploadCsvWithProgress } from '../_lib/adminApi'
import {
  ACCENT,
  BORDER,
  TEXT,
  TEXT_MUTED,
  cardStyle,
  inputStyle,
} from '../_lib/adminStyles'
import type { SyncResult } from '../_lib/adminTypes'
import SyncTable from './SyncTable'

interface SyncUploadSectionProps {
  password: string
  onMessage: (message: string) => void
}

export default function SyncUploadSection({
  password,
  onMessage,
}: SyncUploadSectionProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvType, setCsvType] = useState('office')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'processing'>('idle')
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [uploadStep, setUploadStep] = useState<'idle' | 'preview_ready'>('idle')
  const [previewResult, setPreviewResult] = useState<SyncResult | null>(null)
  const [confirmDanger, setConfirmDanger] = useState(false)
  const [loading, setLoading] = useState(false)

  const handlePreview = async (event: FormEvent) => {
    event.preventDefault()
    if (!csvFile) {
      onMessage('파일을 선택하세요')
      return
    }

    setLoading(true)
    setUploadProgress(0)
    setUploadPhase('uploading')
    setPreviewResult(null)
    setSyncResult(null)
    onMessage('')
    setConfirmDanger(false)

    const formData = new FormData()
    formData.append('file', csvFile)
    const url = getCsvUploadUrl({ password, csvType, dryRun: true })

    try {
      const data = await uploadCsvWithProgress({
        url,
        formData,
        onProgress: setUploadProgress,
        onUploaded: () => setUploadPhase('processing'),
      })
      setPreviewResult(data)
      setUploadStep('preview_ready')
      onMessage('')
    } catch (error: any) {
      onMessage(error.message || '분석 실패')
    } finally {
      setLoading(false)
      setUploadPhase('idle')
      setUploadProgress(0)
    }
  }

  const handleApply = async () => {
    if (!csvFile) {
      onMessage('파일이 없습니다. 다시 선택해 주세요.')
      return
    }

    if (previewResult?.safety_warning && !confirmDanger) {
      onMessage('위험 경고를 확인한 후 체크박스를 선택해 주세요.')
      return
    }

    setLoading(true)
    setUploadProgress(0)
    setUploadPhase('uploading')
    onMessage('')

    const formData = new FormData()
    formData.append('file', csvFile)
    const url = getCsvUploadUrl({ password, csvType, dryRun: false })

    try {
      const data = await uploadCsvWithProgress({
        url,
        formData,
        onProgress: setUploadProgress,
        onUploaded: () => setUploadPhase('processing'),
      })
      onMessage(data.message)
      setSyncResult(data)
      setPreviewResult(null)
      setUploadStep('idle')
      setCsvFile(null)
      setConfirmDanger(false)
    } catch (error: any) {
      onMessage(error.message || 'CSV 적용 실패')
    } finally {
      setLoading(false)
      setUploadPhase('idle')
      setUploadProgress(0)
    }
  }

  const handleResetUpload = () => {
    setUploadStep('idle')
    setPreviewResult(null)
    setSyncResult(null)
    setConfirmDanger(false)
    onMessage('')
    setCsvFile(null)
  }

  return (
    <>
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 4 }}>CSV 업로드 및 데이터 동기화</h2>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>먼저 분석하기로 변경 내용을 확인한 뒤 적용하세요.</p>

        {uploadPhase === 'uploading' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>파일 전송 중...</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>{uploadProgress}%</span>
            </div>
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, background: ACCENT, height: '100%', transition: 'width 0.2s ease' }} />
            </div>
          </div>
        )}

        {uploadPhase === 'processing' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>서버 처리 중... (잠시 기다려 주세요)</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>처리 중</span>
            </div>
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: '40%',
                background: '#f59e0b',
                height: '100%',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }} />
            </div>
          </div>
        )}

        {uploadStep === 'idle' && uploadPhase === 'idle' && (
          <form onSubmit={handlePreview} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 8 }}>데이터 타입</label>
              <select value={csvType} onChange={(event) => setCsvType(event.target.value)} style={{ ...inputStyle, maxWidth: 240 }}>
                <option value="office">사무소</option>
                <option value="agent">중개업자</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: TEXT_MUTED, marginBottom: 8 }}>CSV 파일</label>
              <input
                type="file"
                accept=".csv"
                onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
                style={inputStyle}
                disabled={loading}
              />
              <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 6 }}>
                국토부 전국 CSV 기준으로 완전 동기화합니다 (CSV에 없는 사무소는 폐업 처리)
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !csvFile}
              style={{
                padding: '12px 0',
                background: loading || !csvFile ? 'rgba(255,255,255,0.1)' : 'rgba(49,130,246,0.15)',
                color: loading || !csvFile ? TEXT_MUTED : ACCENT,
                border: `1px solid ${loading || !csvFile ? BORDER : 'rgba(49,130,246,0.3)'}`,
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                cursor: loading || !csvFile ? 'not-allowed' : 'pointer',
              }}
            >
              🔍 분석하기 (미리보기)
            </button>
          </form>
        )}

        {uploadStep === 'preview_ready' && previewResult && uploadPhase === 'idle' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { label: '신규 추가 예정', value: previewResult.inserted, color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
                { label: '수정 예정', value: previewResult.updated, color: ACCENT, bg: 'rgba(49,130,246,0.08)' },
                { label: '삭제 예정', value: previewResult.deleted, color: previewResult.safety_warning ? '#f87171' : TEXT_MUTED, bg: previewResult.safety_warning ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.04)' },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: 'center', padding: '16px 8px', background: item.bg, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>{item.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {previewResult.safety_warning && (
              <div style={{ padding: '14px 16px', borderRadius: 8, marginBottom: 16, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
                <p style={{ fontSize: 14, color: '#f87171', marginBottom: 10 }}>{previewResult.safety_warning}</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={confirmDanger}
                    onChange={(event) => setConfirmDanger(event.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#f87171' }}
                  />
                  <span style={{ fontSize: 13, color: TEXT }}>위험을 인지하고 계속 진행합니다</span>
                </label>
              </div>
            )}

            {previewResult.inserted_list.length > 0 && (
              <SyncTable title={`신규 추가 예정 (${previewResult.inserted.toLocaleString()}개 중 최대 50개 표시)`} color="#34d399" bg="rgba(52,211,153,0.06)"
                items={previewResult.inserted_list} csvType={csvType} showChanges={false} />
            )}
            {previewResult.updated_list.length > 0 && (
              <SyncTable title={`수정 예정 (${previewResult.updated.toLocaleString()}개 중 최대 50개 표시)`} color={ACCENT} bg="rgba(49,130,246,0.06)"
                items={previewResult.updated_list} csvType={csvType} showChanges={true} />
            )}
            {previewResult.deleted_list.length > 0 && (
              <SyncTable title={`삭제 예정 (${previewResult.deleted.toLocaleString()}개 중 최대 50개 표시)`} color="#f87171" bg="rgba(248,113,113,0.06)"
                items={previewResult.deleted_list} csvType={csvType} showChanges={false} />
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              <button
                onClick={handleResetUpload}
                style={{
                  flex: '1 1 180px',
                  padding: '12px 0',
                  background: 'rgba(255,255,255,0.06)',
                  color: TEXT_MUTED,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                ← 다시 선택
              </button>
              <button
                onClick={handleApply}
                disabled={loading || (!!previewResult.safety_warning && !confirmDanger)}
                style={{
                  flex: '2 1 240px',
                  padding: '12px 0',
                  background: loading || (!!previewResult.safety_warning && !confirmDanger) ? 'rgba(255,255,255,0.1)' : ACCENT,
                  color: loading || (!!previewResult.safety_warning && !confirmDanger) ? TEXT_MUTED : '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: loading || (!!previewResult.safety_warning && !confirmDanger) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '적용 중...' : '✓ 적용하기'}
              </button>
            </div>
          </div>
        )}
      </div>

      {syncResult && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 16 }}>동기화 결과</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: '신규 추가', value: syncResult.inserted, color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
              { label: '업데이트', value: syncResult.updated, color: ACCENT, bg: 'rgba(49,130,246,0.08)' },
              { label: '삭제', value: syncResult.deleted, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center', padding: '16px 8px', background: item.bg, borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>{item.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {syncResult.inserted_list.length > 0 && (
            <SyncTable title={`추가된 항목 (${syncResult.inserted_list.length}개)`} color="#34d399" bg="rgba(52,211,153,0.06)"
              items={syncResult.inserted_list} csvType={csvType} showChanges={false} />
          )}
          {syncResult.updated_list.length > 0 && (
            <SyncTable title={`업데이트된 항목 (${syncResult.updated_list.length}개)`} color={ACCENT} bg="rgba(49,130,246,0.06)"
              items={syncResult.updated_list} csvType={csvType} showChanges={true} />
          )}
          {syncResult.deleted_list.length > 0 && (
            <SyncTable title={`삭제된 항목 (${syncResult.deleted_list.length}개)`} color="#f87171" bg="rgba(248,113,113,0.06)"
              items={syncResult.deleted_list} csvType={csvType} showChanges={false} />
          )}
        </div>
      )}
    </>
  )
}
