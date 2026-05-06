'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

type ChangeType = 'all' | 'new-offices' | 'closed-offices' | 'staff-increased' | 'staff-decreased'

const CHANGE_TABS = [
  { value: 'all' as ChangeType, label: '전체' },
  { value: 'new-offices' as ChangeType, label: '신규 개업' },
  { value: 'closed-offices' as ChangeType, label: '폐업/휴업' },
  { value: 'staff-increased' as ChangeType, label: '직원 증가' },
  { value: 'staff-decreased' as ChangeType, label: '직원 감소' },
]

export default function ChangesPage() {
  const [activeTab, setActiveTab] = useState<ChangeType>('all')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const endpoint =
          activeTab === 'all'
            ? '/api/changes'
            : `/api/changes/${activeTab}`

        const { data } = await api.get(endpoint, {
          params: { days: 30, limit: 50 },
        })

        setItems(data || [])
      } catch (error) {
        console.error(error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [activeTab])

  const getChangeTypeLabel = (changeType: string) => {
    const typeMap: Record<string, string> = {
      new_office: '신규 개업',
      closed_office: '폐업',
      suspended_office: '휴업',
      staff_increase: '직원 증가',
      staff_decrease: '직원 감소',
    }
    return typeMap[changeType] || changeType
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">최근 변화</h1>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {CHANGE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-6 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition ${
              activeTab === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 결과 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">변화 기록이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {item.office_name || item.name || '변화'}
                  </h3>
                  {item.registration_number && (
                    <p className="text-sm text-gray-600">
                      등록번호: {item.registration_number}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded">
                  {getChangeTypeLabel(item.change_type)}
                </span>
              </div>

              {item.change_date && (
                <p className="text-sm text-gray-600 mb-2">
                  {new Date(item.change_date).toLocaleDateString('ko-KR')}
                </p>
              )}

              {item.description && (
                <p className="text-sm text-gray-700">{item.description}</p>
              )}

              {item.registration_number && (
                <Link
                  href={`/office/${encodeURIComponent(item.registration_number)}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold mt-3 inline-block"
                >
                  사무소 상세보기 →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
