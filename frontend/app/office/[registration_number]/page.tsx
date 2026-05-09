import type { Metadata } from 'next'
import type { OfficeDetail } from '@/types'
import OfficeDetailClient from './OfficeDetailClient'

type OfficePageProps = {
  params: {
    registration_number: string
  }
}

const fallbackTitle = '공인중개사사무소 정보 조회 | 리얼서치'
const fallbackDescription =
  '리얼서치에서 전국 공인중개사사무소, 공인중개사, 중개보조원 정보를 조회하세요.'

function getApiBaseUrl() {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).replace(/\/$/, '')
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://realsearch.kr').replace(/\/$/, '')
}

async function fetchOfficeForMetadata(
  registrationNumber: string
): Promise<OfficeDetail | null> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/offices/${encodeURIComponent(registrationNumber)}?track_view=false`,
      {
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch {
    return null
  }
}

function buildRegionLabel(office: OfficeDetail) {
  return [office.sido, office.sigungu].filter(Boolean).join(' ')
}

function buildMetadataTitle(office: OfficeDetail) {
  const region = buildRegionLabel(office)

  if (region) {
    return `${office.office_name} | ${region} 공인중개사사무소 조회 - 리얼서치`
  }

  return `${office.office_name} 공인중개사사무소 조회 - 리얼서치`
}

export async function generateMetadata({ params }: OfficePageProps): Promise<Metadata> {
  const registrationNumber = params.registration_number
  const office = await fetchOfficeForMetadata(registrationNumber)
  const pageUrl = `${getSiteUrl()}/office/${encodeURIComponent(registrationNumber)}`

  if (!office) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: pageUrl,
        siteName: '리얼서치',
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  }

  const title = buildMetadataTitle(office)
  const description = `${office.office_name}의 대표자, 등록번호, 주소, 개업일자, 소속 공인중개사 및 중개보조원 정보를 리얼서치에서 확인하세요. 계약 전 정식 등록 여부와 사무소 정보를 확인할 수 있습니다.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: '리얼서치',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function OfficePage({ params }: OfficePageProps) {
  return <OfficeDetailClient registrationNumber={params.registration_number} />
}
