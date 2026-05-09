'use client'

import { FormEvent, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import api from '@/lib/api'

export interface CorrectionRequestPayload {
  target_type: 'agent' | 'office'
  target_id: string
  target_name: string
  page_url: string
  snapshot: string
}

interface CorrectionRequestModalProps {
  isOpen: boolean
  onClose: () => void
  payload: CorrectionRequestPayload
}

const MAX_CONTENT_LENGTH = 2000

export default function CorrectionRequestModal({
  isOpen,
  onClose,
  payload,
}: CorrectionRequestModalProps) {
  const [requestContent, setRequestContent] = useState('')
  const [requesterContact, setRequesterContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, submitting])

  useEffect(() => {
    if (!isOpen) {
      setRequestContent('')
      setRequesterContact('')
      setErrorMessage('')
      setSuccessMessage('')
      setSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedContent = requestContent.trim()
    const trimmedContact = requesterContact.trim()

    if (!trimmedContent) {
      setErrorMessage('정정 요청 내용을 입력해주세요.')
      setSuccessMessage('')
      return
    }

    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data } = await api.post('/api/correction-requests', {
        ...payload,
        request_content: trimmedContent,
        requester_contact: trimmedContact || null,
      })

      setSuccessMessage(data?.message || '정정 요청이 접수되었습니다.')
      setRequestContent('')
      setRequesterContact('')
    } catch {
      setErrorMessage('정정 요청을 보내지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: 'rgba(0, 0, 0, 0.72)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="correction-request-title"
    >
      <div
        className="w-full max-w-lg rounded-xl border shadow-2xl"
        style={{
          background: '#13192B',
          borderColor: 'rgba(255, 255, 255, 0.12)',
        }}
      >
        <div
          className="flex items-start justify-between gap-4 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <div>
            <h2 id="correction-request-title" className="text-lg font-bold text-white">
              정보 정정 요청
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'rgba(255, 255, 255, 0.58)' }}>
              표시된 정보가 실제와 다를 경우 정정 요청을 남겨주세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.86)',
            }}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div>
            <label htmlFor="correction-content" className="mb-2 block text-sm font-semibold text-white">
              정정 요청 내용
            </label>
            <textarea
              id="correction-content"
              value={requestContent}
              onChange={(event) => {
                setRequestContent(event.target.value)
                if (errorMessage) setErrorMessage('')
              }}
              maxLength={MAX_CONTENT_LENGTH}
              rows={6}
              className="w-full resize-none rounded-lg border px-3 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-400"
              style={{
                background: 'rgba(10, 14, 26, 0.72)',
                borderColor: 'rgba(255, 255, 255, 0.14)',
              }}
              placeholder="예: 소속 사무소가 변경되었습니다."
              disabled={submitting}
            />
            <p className="mt-1 text-right text-xs" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
              {requestContent.length}/{MAX_CONTENT_LENGTH}
            </p>
          </div>

          <div>
            <label htmlFor="requester-contact" className="mb-2 block text-sm font-semibold text-white">
              요청자 연락처 <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>(선택)</span>
            </label>
            <input
              id="requester-contact"
              value={requesterContact}
              onChange={(event) => setRequesterContact(event.target.value)}
              maxLength={255}
              className="w-full rounded-lg border px-3 py-3 text-sm text-white outline-none transition focus:ring-2 focus:ring-blue-400"
              style={{
                background: 'rgba(10, 14, 26, 0.72)',
                borderColor: 'rgba(255, 255, 255, 0.14)',
              }}
              placeholder="이메일 또는 전화번호"
              disabled={submitting}
            />
            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.52)' }}>
              요청자 연락처는 선택 입력이며, 정정 요청 확인 목적으로만 사용됩니다.
            </p>
          </div>

          <p className="rounded-lg px-3 py-2 text-xs leading-relaxed" style={{
            background: 'rgba(49, 130, 246, 0.08)',
            color: 'rgba(255, 255, 255, 0.62)',
          }}>
            요청 내용은 확인 후 반영 여부를 검토합니다. 실제 등록상태는 관할 시·군·구청 또는 공식 조회를 통해 최종 확인하시기 바랍니다.
          </p>

          {errorMessage && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#FCA5A5',
            }}>
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#86EFAC',
            }}>
              {successMessage}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.86)',
              }}
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: '#3182F6' }}
            >
              {submitting ? '전송 중...' : '정정 요청 보내기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
