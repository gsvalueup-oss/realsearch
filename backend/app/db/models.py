from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, Numeric, ForeignKey, Index,
    func, UniqueConstraint, JSON
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()


class OfficeCurrent(Base):
    """현재 사무소 정보"""
    __tablename__ = "office_current"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(50), unique=True, nullable=False, index=True)
    office_name = Column(String(255), nullable=False, index=True)
    representative_name = Column(String(100), index=True)
    legal_dong_code = Column(String(10))
    legal_dong_name = Column(String(100))
    address = Column(Text)
    road_address = Column(Text)
    sido = Column(String(50), index=True)
    sigungu = Column(String(50))
    eupmyeondong = Column(String(100))
    status = Column(String(50), index=True)
    registered_date = Column(Date)
    phone_number = Column(String(20))
    start_date = Column(Date)
    end_date = Column(Date)
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    source_updated_at = Column(Date)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    agents = relationship("AgentCurrent", back_populates="office", cascade="all, delete-orphan")
    snapshots = relationship("OfficeDailySnapshot", back_populates="office")
    metrics = relationship("OfficeMetricsDaily", back_populates="office")

    __table_args__ = (
        Index('idx_office_name_gin', 'office_name'),
        Index('idx_representative_name_gin', 'representative_name'),
    )


class AgentCurrent(Base):
    """현재 중개업자 정보"""
    __tablename__ = "agent_current"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    role = Column(String(50), index=True)  # 대표, 소속공인중개사, 중개보조원
    office_registration_number = Column(String(50), ForeignKey("office_current.registration_number"), nullable=False, index=True)
    office_name = Column(String(255))
    legal_dong_name = Column(String(100))
    address = Column(Text)
    sido = Column(String(50), index=True)
    sigungu = Column(String(50))
    agent_type = Column(String(50))
    license_number = Column(String(50), index=True)
    license_date = Column(Date)
    status = Column(String(50))
    source_updated_at = Column(Date)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 관계
    office = relationship("OfficeCurrent", back_populates="agents")

    __table_args__ = (
        Index('idx_agent_name_gin', 'name'),
    )


class OfficeDailySnapshot(Base):
    """일일 사무소 스냅샷"""
    __tablename__ = "office_daily_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    registration_number = Column(String(50), ForeignKey("office_current.registration_number"), index=True)
    office_name = Column(String(255))
    representative_name = Column(String(100))
    address = Column(Text)
    sido = Column(String(50), index=True)
    sigungu = Column(String(50))
    status = Column(String(50))
    registered_date = Column(Date)
    source_updated_at = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계
    office = relationship("OfficeCurrent", back_populates="snapshots")

    __table_args__ = (
        UniqueConstraint('snapshot_date', 'registration_number', name='uq_office_snapshot_date_reg'),
    )


class AgentDailySnapshot(Base):
    """일일 중개업자 스냅샷"""
    __tablename__ = "agent_daily_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    name = Column(String(100), nullable=False, index=True)
    role = Column(String(50))
    office_registration_number = Column(String(50), index=True)
    office_name = Column(String(255))
    sido = Column(String(50), index=True)
    sigungu = Column(String(50))
    status = Column(String(50))
    source_updated_at = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('snapshot_date', 'office_registration_number', 'name', name='uq_agent_snapshot_date_office_name'),
    )


class OfficeMetricsDaily(Base):
    """사무소 일일 메트릭"""
    __tablename__ = "office_metrics_daily"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    registration_number = Column(String(50), ForeignKey("office_current.registration_number"), index=True)
    total_staff_count = Column(Integer)
    representative_count = Column(Integer)
    licensed_agent_count = Column(Integer)
    assistant_count = Column(Integer)
    staff_change_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계
    office = relationship("OfficeCurrent", back_populates="metrics")

    __table_args__ = (
        UniqueConstraint('snapshot_date', 'registration_number', name='uq_office_metrics_date_reg'),
    )


class RegionMetricsDaily(Base):
    """지역별 일일 메트릭"""
    __tablename__ = "region_metrics_daily"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    sido = Column(String(50), index=True)
    sigungu = Column(String(50))
    total_office_count = Column(Integer)
    active_office_count = Column(Integer)
    inactive_office_count = Column(Integer)
    licensed_agent_count = Column(Integer)
    assistant_count = Column(Integer)
    avg_staff_per_office = Column(Numeric(10, 2))
    new_office_count = Column(Integer)
    closed_office_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('snapshot_date', 'sido', 'sigungu', name='uq_region_metrics_date_sido_sigungu'),
    )


class ChangeLog(Base):
    """변경 로그"""
    __tablename__ = "change_logs"

    id = Column(Integer, primary_key=True, index=True)
    change_date = Column(Date, nullable=False, index=True)
    change_type = Column(String(50), index=True)  # new_office, closed_office, staff_increase, etc
    target_type = Column(String(50))  # office, agent
    target_id = Column(String(100))
    registration_number = Column(String(50), index=True)
    name = Column(String(100), index=True)
    previous_value = Column(Text)
    current_value = Column(Text)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class CorrectionRequest(Base):
    """Information correction request submitted by users."""
    __tablename__ = "correction_requests"

    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(String(20), nullable=False, index=True)
    target_id = Column(String(100), nullable=False, index=True)
    target_name = Column(String(255), nullable=False, index=True)
    page_url = Column(String(500), nullable=False)
    request_content = Column(Text, nullable=False)
    requester_contact = Column(String(255))
    snapshot = Column(JSON)
    status = Column(String(20), nullable=False, default="pending", index=True)
    admin_note = Column(Text)
    ip_address = Column(String(50), index=True)
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime)

    __table_args__ = (
        Index('idx_correction_requests_target', 'target_type', 'target_id'),
    )


class DailySyncResult(Base):
    """일별 CSV 동기화 결과 (오늘의 변동 페이지용)"""
    __tablename__ = "daily_sync_results"

    id = Column(Integer, primary_key=True, index=True)
    sync_date = Column(Date, nullable=False, index=True)
    inserted = Column(Integer, default=0)
    updated = Column(Integer, default=0)
    deleted = Column(Integer, default=0)
    new_list = Column(JSON)      # [{registration_number, office_name, sido, sigungu}]
    closed_list = Column(JSON)   # [{registration_number, office_name, sido, sigungu}]
    updated_list = Column(JSON)  # [{registration_number, office_name, changes}]
    created_at = Column(DateTime, default=datetime.utcnow)


class DataSyncLog(Base):
    """데이터 동기화 로그"""
    __tablename__ = "data_sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    data_type = Column(String(50), unique=True)  # office, agent
    last_sync_date = Column(Date)
    last_sync_time = Column(DateTime)
    record_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class APIRequestLog(Base):
    """API 요청 로그"""
    __tablename__ = "api_request_logs"

    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(255), index=True)
    method = Column(String(10))
    status_code = Column(Integer, index=True)
    response_time_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class UserVisit(Base):
    """사용자 방문 기록"""
    __tablename__ = "user_visits"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(50), index=True)
    user_agent = Column(Text)
    page = Column(String(255), index=True)
    referer = Column(String(255))
    visited_at = Column(DateTime, default=datetime.utcnow, index=True)


class UserSession(Base):
    """사용자 세션"""
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True)
    ip_address = Column(String(50), index=True)
    user_agent = Column(Text)
    first_visit = Column(DateTime, default=datetime.utcnow, index=True)
    last_visit = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    page_count = Column(Integer, default=1)
    duration_seconds = Column(Integer, default=0)
