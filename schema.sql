-- PostgreSQL 스키마 파일
-- realsearch 부동산중개업 정보 조회 서비스

-- 한글 Full Text Search 설정 (pg_trgm 확장)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- 1. 현재 사무소 정보 (office_current)
CREATE TABLE IF NOT EXISTS office_current (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    office_name VARCHAR(255) NOT NULL,
    representative_name VARCHAR(100),
    legal_dong_code VARCHAR(10),
    legal_dong_name VARCHAR(100),
    address TEXT,
    road_address TEXT,
    status VARCHAR(50),  -- 영업중, 휴업, 폐업, 업무정지 등
    registered_date DATE,
    phone_number VARCHAR(20),
    start_date DATE,  -- 보증설정시작일
    end_date DATE,    -- 보증설정종료일
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    source_updated_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 주소 분리 컬럼 추가 (자동 파싱을 위해 추가)
ALTER TABLE office_current ADD COLUMN IF NOT EXISTS sido VARCHAR(50);
ALTER TABLE office_current ADD COLUMN IF NOT EXISTS sigungu VARCHAR(50);
ALTER TABLE office_current ADD COLUMN IF NOT EXISTS eupmyeondong VARCHAR(100);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_office_current_registration ON office_current(registration_number);
CREATE INDEX IF NOT EXISTS idx_office_current_office_name ON office_current USING GIN (office_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_office_current_representative ON office_current USING GIN (representative_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_office_current_sido ON office_current(sido);
CREATE INDEX IF NOT EXISTS idx_office_current_status ON office_current(status);
CREATE INDEX IF NOT EXISTS idx_office_current_registered_date ON office_current(registered_date);

---

-- 2. 현재 중개업자 정보 (agent_current)
CREATE TABLE IF NOT EXISTS agent_current (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50),  -- 대표, 소속공인중개사, 중개보조원
    office_registration_number VARCHAR(50) NOT NULL,
    office_name VARCHAR(255),
    legal_dong_name VARCHAR(100),
    address TEXT,
    sido VARCHAR(50),
    sigungu VARCHAR(50),
    agent_type VARCHAR(50),  -- 중개업자 종별
    license_number VARCHAR(50),
    license_date DATE,
    status VARCHAR(50),  -- 영업중, 휴업, 폐업 등
    source_updated_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (office_registration_number) REFERENCES office_current(registration_number) ON DELETE CASCADE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_agent_current_name ON agent_current USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_agent_current_office_reg ON agent_current(office_registration_number);
CREATE INDEX IF NOT EXISTS idx_agent_current_role ON agent_current(role);
CREATE INDEX IF NOT EXISTS idx_agent_current_sido ON agent_current(sido);
CREATE INDEX IF NOT EXISTS idx_agent_current_license_number ON agent_current(license_number);

---

-- 3. 일일 사무소 스냅샷 (office_daily_snapshot)
CREATE TABLE IF NOT EXISTS office_daily_snapshot (
    id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    registration_number VARCHAR(50) NOT NULL,
    office_name VARCHAR(255),
    representative_name VARCHAR(100),
    address TEXT,
    sido VARCHAR(50),
    sigungu VARCHAR(50),
    status VARCHAR(50),
    registered_date DATE,
    source_updated_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(snapshot_date, registration_number)
);

CREATE INDEX IF NOT EXISTS idx_office_snapshot_date ON office_daily_snapshot(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_office_snapshot_registration ON office_daily_snapshot(registration_number);
CREATE INDEX IF NOT EXISTS idx_office_snapshot_sido ON office_daily_snapshot(sido);

---

-- 4. 일일 중개업자 스냅샷 (agent_daily_snapshot)
CREATE TABLE IF NOT EXISTS agent_daily_snapshot (
    id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50),
    office_registration_number VARCHAR(50) NOT NULL,
    office_name VARCHAR(255),
    sido VARCHAR(50),
    sigungu VARCHAR(50),
    status VARCHAR(50),
    source_updated_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(snapshot_date, office_registration_number, name)
);

CREATE INDEX IF NOT EXISTS idx_agent_snapshot_date ON agent_daily_snapshot(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_agent_snapshot_name ON agent_daily_snapshot(name);
CREATE INDEX IF NOT EXISTS idx_agent_snapshot_office_reg ON agent_daily_snapshot(office_registration_number);

---

-- 5. 사무소 일일 메트릭 (office_metrics_daily)
CREATE TABLE IF NOT EXISTS office_metrics_daily (
    id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    registration_number VARCHAR(50) NOT NULL,
    total_staff_count INT,
    representative_count INT,
    licensed_agent_count INT,
    assistant_count INT,
    staff_change_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(snapshot_date, registration_number)
);

CREATE INDEX IF NOT EXISTS idx_office_metrics_date ON office_metrics_daily(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_office_metrics_registration ON office_metrics_daily(registration_number);

---

-- 6. 지역별 일일 메트릭 (region_metrics_daily)
CREATE TABLE IF NOT EXISTS region_metrics_daily (
    id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    sido VARCHAR(50),
    sigungu VARCHAR(50),
    total_office_count INT,
    active_office_count INT,
    inactive_office_count INT,
    licensed_agent_count INT,
    assistant_count INT,
    avg_staff_per_office DECIMAL(10, 2),
    new_office_count INT,
    closed_office_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(snapshot_date, sido, sigungu)
);

CREATE INDEX IF NOT EXISTS idx_region_metrics_date ON region_metrics_daily(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_region_metrics_sido ON region_metrics_daily(sido, sigungu);

---

-- 7. 변경 로그 (change_logs)
CREATE TABLE IF NOT EXISTS change_logs (
    id BIGSERIAL PRIMARY KEY,
    change_date DATE NOT NULL,
    change_type VARCHAR(50),  -- new_office, closed_office, staff_increase, staff_decrease, agent_moved, status_changed, etc
    target_type VARCHAR(50),  -- office, agent
    target_id VARCHAR(100),
    registration_number VARCHAR(50),
    name VARCHAR(100),
    previous_value TEXT,
    current_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_change_logs_date ON change_logs(change_date);
CREATE INDEX IF NOT EXISTS idx_change_logs_type ON change_logs(change_type);
CREATE INDEX IF NOT EXISTS idx_change_logs_registration ON change_logs(registration_number);
CREATE INDEX IF NOT EXISTS idx_change_logs_name ON change_logs(name);

---

-- 마지막 데이터 수집 일시 기록
CREATE TABLE IF NOT EXISTS data_sync_logs (
    id SERIAL PRIMARY KEY,
    data_type VARCHAR(50),  -- office, agent
    last_sync_date DATE,
    last_sync_time TIMESTAMP,
    record_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data_type)
);

-- 초기 데이터 동기화 로그 생성
INSERT INTO data_sync_logs (data_type, last_sync_date, last_sync_time, record_count)
VALUES
    ('office', NULL, NULL, 0),
    ('agent', NULL, NULL, 0)
ON CONFLICT (data_type) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

---

-- 8. API 요청 로그 (api_request_logs)
CREATE TABLE IF NOT EXISTS api_request_logs (
    id BIGSERIAL PRIMARY KEY,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INT,
    response_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_request_endpoint ON api_request_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_request_status ON api_request_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_request_created ON api_request_logs(created_at);

---

-- 9. 사용자 방문 기록 (user_visits)
CREATE TABLE IF NOT EXISTS user_visits (
    id BIGSERIAL PRIMARY KEY,
    ip_address VARCHAR(50),
    user_agent TEXT,
    page VARCHAR(255),
    referer VARCHAR(255),
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_visits_ip ON user_visits(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_visits_page ON user_visits(page);
CREATE INDEX IF NOT EXISTS idx_user_visits_visited_at ON user_visits(visited_at);

---

-- 10. 사용자 세션 (user_sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE,
    ip_address VARCHAR(50),
    user_agent TEXT,
    first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    page_count INT DEFAULT 1,
    duration_seconds INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_first_visit ON user_sessions(first_visit);
