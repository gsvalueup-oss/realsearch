import Link from 'next/link'
import { RegionSummary } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default async function RegionsPage() {
  try {
    const res = await fetch(`${API_URL}/api/regions`, { cache: 'no-store' })
    const regions: RegionSummary[] = await res.json()

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">지역별 현황</h1>

        {regions.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500">데이터가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {regions.map((region) => (
              <Link
                key={region.sido}
                href={`/regions/${encodeURIComponent(region.sido)}`}
              >
                <div className="card hover:shadow-lg cursor-pointer">
                  <h3 className="font-bold text-lg text-gray-900 mb-3">
                    {region.sido}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>사무소</span>
                      <span className="font-semibold">
                        {region.total_office_count}개
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>영업중</span>
                      <span className="font-semibold">
                        {region.active_office_count}개
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>공인중개사</span>
                      <span className="font-semibold">
                        {region.licensed_agent_count}명
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>중개보조원</span>
                      <span className="font-semibold">
                        {region.assistant_count}명
                      </span>
                    </div>
                  </div>
                  <p className="text-blue-600 font-semibold mt-4">자세히 →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error(error)
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">지역별 현황</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          데이터를 불러올 수 없습니다
        </div>
      </div>
    )
  }
}
