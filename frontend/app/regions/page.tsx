'use client'

import Link from 'next/link'
import { RegionSummary } from '@/types'
import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function RegionsPage() {
  const [regions, setRegions] = useState<RegionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/regions`)
        const data: RegionSummary[] = await res.json()
        setRegions(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchRegions()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8">지역별 현황</h1>

      {loading ? (
        <div className="text-center py-12">
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>로딩 중...</p>
        </div>
      ) : regions.length === 0 ? (
        <div className="p-8 rounded-lg text-center border" style={{
          background: '#13192B',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>데이터가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {regions.map((region) => (
            <Link
              key={region.sido}
              href={`/regions/${encodeURIComponent(region.sido)}`}
            >
              <div className="rounded-lg p-6 border transition cursor-pointer hover:border-blue-500" style={{
                background: '#13192B',
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}>
                <h3 className="font-bold text-lg text-white mb-3">
                  {region.sido}
                </h3>
                <div className="text-sm space-y-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  <div className="flex justify-between">
                    <span>사무소</span>
                    <span className="font-semibold text-white">
                      {region.total_office_count}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>영업중</span>
                    <span className="font-semibold text-white">
                      {region.active_office_count}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>공인중개사</span>
                    <span className="font-semibold text-white">
                      {region.licensed_agent_count}명
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>중개보조원</span>
                    <span className="font-semibold text-white">
                      {region.assistant_count}명
                    </span>
                  </div>
                </div>
                <p className="font-semibold mt-4" style={{ color: '#3182F6' }}>자세히 →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
