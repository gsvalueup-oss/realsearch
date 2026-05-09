export type CorrectionStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected'
export type CorrectionStatusFilter = CorrectionStatus | ''
export type CorrectionTargetType = 'agent' | 'office'
export type CorrectionTargetFilter = CorrectionTargetType | ''

export interface Stats {
  total_offices: number
  active_offices: number
  total_agents: number
  most_viewed_offices: Array<{ registration_number: string; office_name: string; view_count: number }>
  most_viewed_agents: Array<{ id: number; name: string; office_name: string; view_count: number }>
}

export interface APIStats {
  total_requests: number
  avg_response_time: number
  error_count: number
  endpoint_stats: Array<{ endpoint: string; method: string; count: number; avg_time: number }>
  recent_errors: Array<{ endpoint: string; method: string; status_code: number; response_time_ms: number; created_at: string }>
}

export interface UserStats {
  total_unique_visitors: number
  total_visits: number
  daily_visitors: Array<{ date: string; unique_visitors: number; total_visits: number }>
  page_stats: Array<{ page: string; visit_count: number; unique_visitors: number }>
  hourly_stats: Array<{ hour: string; visit_count: number }>
  browser_stats: Array<{ user_agent: string; visit_count: number }>
  recent_visitors: Array<{ ip_address: string; page: string; visited_at: string; visit_count: number }>
}

export interface SyncResult {
  dry_run: boolean
  message: string
  inserted: number
  updated: number
  deleted: number
  safety_warning: string | null
  inserted_list: any[]
  updated_list: any[]
  deleted_list: any[]
}

export interface CorrectionRequest {
  id: number
  target_type: CorrectionTargetType
  target_id: string
  target_name: string
  page_url: string
  request_content: string
  requester_contact: string | null
  snapshot: string | Record<string, unknown> | null
  status: CorrectionStatus
  admin_note: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}
