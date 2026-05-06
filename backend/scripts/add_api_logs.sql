-- API 요청 로그 테이블 추가
CREATE TABLE IF NOT EXISTS api_request_logs (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_endpoint ON api_request_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_status_code ON api_request_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_created_at ON api_request_logs(created_at);
