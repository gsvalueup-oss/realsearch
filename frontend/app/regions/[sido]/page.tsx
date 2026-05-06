'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SigunguStats } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function SidoPage() {
  const params = useParams()
  const sidoParam = params?.sido as string || ''
  const sido = decodeURIComponent(sidoParam)
  const [stats, setStats] = useState<SigunguStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/regions/${sidoParam}`)
        if (!res.ok) {
          setError(true)
          return
        }
        const data = await res.json()
        setStats(data || [])
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (sidoParam) {
      fetchData()
    }
  }, [sidoParam])

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/regions" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← 지역 목록으로
        </Link>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mt-4">
          데이터를 불러올 수 없습니다
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/regions" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← 지역 목록으로
        </Link>
        <h1 className="text-4xl font-bold text-gray-900">{sido}</h1>
        <p className="text-gray-600 mt-2">
          {loading ? '로딩 중...' : stats.length > 0 ? `${stats.length}개 구/군 정보` : '데이터가 없습니다'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : stats.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">데이터가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.sigungu} className="card">
              <h3 className="font-bold text-lg text-gray-900 mb-4">
                {stat.sigungu}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">사무소 (총)</span>
                  <span className="font-semibold">{stat.total_office_count}개</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">영업중</span>
                  <span className="font-semibold">{stat.active_office_count}개</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">폐업/휴업</span>
                  <span className="font-semibold">{stat.inactive_office_count}개</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">공인중개사</span>
                  <span className="font-semibold">{stat.licensed_agent_count}명</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">중개보조원</span>
                  <span className="font-semibold">{stat.assistant_count}명</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
