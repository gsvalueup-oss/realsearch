export interface OfficeSummary {
  id: number
  registration_number: string
  office_name: string
  representative_name: string | null
  address?: string | null
  sido: string | null
  sigungu: string | null
  status: string | null
  registered_date: string | null
  phone_number: string | null
  staff_count?: number | null
  licensed_agent_count?: number | null
  assistant_count?: number | null
  representative_experience?: number | null
}

export interface OfficeDetail extends OfficeSummary {
  address: string | null
  road_address: string | null
  eupmyeondong: string | null
  legal_dong_name: string | null
  start_date: string | null
  end_date: string | null
  latitude: number | null
  longitude: number | null
  source_updated_at: string | null
  created_at: string | null
  updated_at: string | null
  staff: AgentSummary[]
  representative_license_number?: string | null
  representative_license_date?: string | null
}

export interface AgentSummary {
  id: number
  name: string
  role: string | null
  agent_type: string | null
  license_number: string | null
  license_date: string | null
  status: string | null
  office_name?: string | null
  office_registration_number?: string
  address?: string | null
  sido?: string | null
  sigungu?: string | null
  experience?: number | null
}

export interface AgentDetail {
  id: number
  name: string
  role: string | null
  office_registration_number: string
  office_name: string | null
  legal_dong_name: string | null
  address: string | null
  sido: string | null
  sigungu: string | null
  agent_type: string | null
  license_number: string | null
  license_date: string | null
  status: string | null
  source_updated_at: string | null
  created_at: string | null
  updated_at: string | null
  office: OfficeSummary | null
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface RankingItem {
  rank: number
  registration_number: string
  office_name: string
  sido: string | null
  sigungu: string | null
  value: number
  value_label: string
  status: string | null
  representative_name?: string | null
  representative_experience?: number | null
  representative_license_year?: number | null
}

export interface RegionSummary {
  sido: string
  total_office_count: number
  active_office_count: number
  licensed_agent_count: number
  assistant_count: number
}

export interface SigunguStats {
  sido: string
  sigungu: string
  total_office_count: number
  active_office_count: number
  inactive_office_count: number
  licensed_agent_count: number
  assistant_count: number
  avg_staff_per_office: number | null
}

export interface ChangeLogResponse {
  id: number
  change_date: string
  change_type: string
  target_type: string | null
  target_id: string | null
  registration_number: string | null
  name: string | null
  description: string | null
  previous_value: string | null
  current_value: string | null
}

export interface SearchResult {
  type: 'office' | 'person'
  id?: number
  registration_number?: string
  office_name?: string
  representative_name?: string | null
  name?: string
  role?: string | null
  office_registration_number?: string
  sido?: string | null
  sigungu?: string | null
  status?: string | null
}
