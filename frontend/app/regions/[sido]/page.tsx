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
        <Link href="/regions" className="mb-4 inline-block" style={{ color: '#3182F6' }}>
          ← 지역 목록으로
        </Link>
        <div className="p-4 rounded-lg mt-4 border" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#FCA5A5',
          borderColor: 'rgba(239, 68, 68, 0.2)'
        }}>
          데이터를 불러올 수 없습니다
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/regions" className="mb-4 inline-block" style={{ color: '#3182F6' }}>
          ← 지역 목록으로
        </Link>
        <h1 className="text-4xl font-bold text-white">{sido}</h1>
        <p className="mt-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          {loading ? '로딩 중...' : stats.length > 0 ? `${stats.length}개 구/군 정보` : '데이터가 없습니다'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>로딩 중...</p>
        </div>
      ) : stats.length === 0 ? (
        <div className="p-8 rounded-lg text-center border" style={{
          background: '#13192B',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>데이터가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.sigungu} className="rounded-lg p-6 border" style={{
              background: '#13192B',
              borderColor: 'rgba(255, 255, 255, 0.08)'
            }}>
              <h3 className="font-bold text-lg text-white mb-4">
                {stat.sigungu}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2" style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>사무소 (총)</span>
                  <span className="font-semibold text-white">{stat.total_office_count}개</span>
                </div>
                <div className="flex justify-between py-2" style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>영업중</span>
                  <span className="font-semibold text-white">{stat.active_office_count}개</span>
                </div>
                <div className="flex justify-between py-2" style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>폐업/휴업</span>
                  <span className="font-semibold text-white">{stat.inactive_office_count}개</span>
                </div>
                <div className="flex justify-between py-2" style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>공인중개사</span>
                  <span className="font-semibold text-white">{stat.licensed_agent_count}명</span>
                </div>
                <div className="flex justify-between py-2">
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>중개보조원</span>
                  <span className="font-semibold text-white">{stat.assistant_count}명</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
