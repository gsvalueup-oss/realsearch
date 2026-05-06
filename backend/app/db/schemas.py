"""
Pydantic response 스키마
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Generic, TypeVar
from datetime import date, datetime
from decimal import Decimal

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class AgentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    role: Optional[str] = None
    agent_type: Optional[str] = None
    license_number: Optional[str] = None
    license_date: Optional[date] = None
    status: Optional[str] = None


class OfficeSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    registration_number: str
    office_name: str
    representative_name: Optional[str] = None
    address: Optional[str] = None
    sido: Optional[str] = None
    sigungu: Optional[str] = None
    status: Optional[str] = None
    registered_date: Optional[date] = None
    phone_number: Optional[str] = None
    staff_count: Optional[int] = None
    representative_experience: Optional[int] = None


class OfficeDetail(OfficeSummary):
    address: Optional[str] = None
    road_address: Optional[str] = None
    eupmyeondong: Optional[str] = None
    legal_dong_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    source_updated_at: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    staff: List[AgentSummary] = []


class AgentDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    role: Optional[str] = None
    office_registration_number: str
    office_name: Optional[str] = None
    legal_dong_name: Optional[str] = None
    address: Optional[str] = None
    sido: Optional[str] = None
    sigungu: Optional[str] = None
    agent_type: Optional[str] = None
    license_number: Optional[str] = None
    license_date: Optional[date] = None
    status: Optional[str] = None
    source_updated_at: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    office: Optional[OfficeSummary] = None


class RankingItem(BaseModel):
    rank: int
    registration_number: str
    office_name: str
    sido: Optional[str] = None
    sigungu: Optional[str] = None
    value: int
    value_label: str
    status: Optional[str] = None
    representative_name: Optional[str] = None
    representative_experience: Optional[int] = None
    representative_license_year: Optional[int] = None


class RegionSummary(BaseModel):
    sido: str
    total_office_count: int
    active_office_count: int
    licensed_agent_count: int
    assistant_count: int


class SigunguStats(BaseModel):
    sido: str
    sigungu: str
    total_office_count: int
    active_office_count: int
    inactive_office_count: int
    licensed_agent_count: int
    assistant_count: int
    avg_staff_per_office: Optional[Decimal] = None


class ChangeLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    change_date: date
    change_type: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    registration_number: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    previous_value: Optional[str] = None
    current_value: Optional[str] = None


class StaffMetric(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    snapshot_date: date
    total_staff_count: Optional[int] = None
    representative_count: Optional[int] = None
    licensed_agent_count: Optional[int] = None
    assistant_count: Optional[int] = None
    staff_change_count: Optional[int] = None
