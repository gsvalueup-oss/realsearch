import type { Metadata } from 'next'
import type { AgentDetail } from '@/types'
import AgentDetailClient from './AgentDetailClient'

type AgentPageProps = {
  params: {
    id: string
  }
}

const fallbackTitle = '공인중개사 정보 조회 | 리얼서치'
const fallbackDescription =
  '리얼서치에서 전국 공인중개사, 중개보조원, 부동산중개사무소 정보를 조회하세요.'

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

async function fetchAgentForMetadata(id: string): Promise<AgentDetail | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/agents/${id}?track_view=false`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch {
    return null
  }
}

function getAgentTypeLabel(agent: AgentDetail) {
  const agentType = agent.agent_type || ''

  if (agentType.includes('공인중개사')) {
    return '공인중개사'
  }

  if (agentType.includes('중개보조원')) {
    return '중개보조원'
  }

  return null
}

function buildMetadataTitle(agent: AgentDetail) {
  const typeLabel = getAgentTypeLabel(agent)
  const officeName = agent.office_name || agent.office?.office_name

  if (typeLabel && officeName) {
    return `${agent.name} ${typeLabel} 정보 | ${officeName} - 리얼서치`
  }

  return `${agent.name} 부동산중개업 종사자 정보 | 리얼서치`
}

export async function generateMetadata({ params }: AgentPageProps): Promise<Metadata> {
  const agent = await fetchAgentForMetadata(params.id)
  const pageUrl = `${getSiteUrl()}/agent/${encodeURIComponent(params.id)}`

  if (!agent) {
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

  const title = buildMetadataTitle(agent)
  const description = `${agent.name}님의 직위, 소속 사무소, 자격취득년도, 경력, 지역 정보를 리얼서치에서 확인하세요. 계약 전 정식 등록 여부와 소속 정보를 확인할 수 있습니다.`

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

export default function AgentPage({ params }: AgentPageProps) {
  return <AgentDetailClient id={params.id} />
}
