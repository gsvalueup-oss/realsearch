'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-red-900 mb-4">오류가 발생했습니다</h2>
        <p className="text-red-700 mb-6">
          {error.message || '예상치 못한 오류가 발생했습니다.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
