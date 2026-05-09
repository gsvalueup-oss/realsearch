-- Add information correction request table

CREATE TABLE IF NOT EXISTS correction_requests (
    id SERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    target_name VARCHAR(255) NOT NULL,
    page_url VARCHAR(500) NOT NULL,
    request_content TEXT NOT NULL,
    requester_contact VARCHAR(255),
    snapshot JSON,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_correction_requests_status ON correction_requests(status);
CREATE INDEX IF NOT EXISTS idx_correction_requests_target_type ON correction_requests(target_type);
CREATE INDEX IF NOT EXISTS idx_correction_requests_target_id ON correction_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_correction_requests_target_name ON correction_requests(target_name);
CREATE INDEX IF NOT EXISTS idx_correction_requests_created_at ON correction_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_correction_requests_target ON correction_requests(target_type, target_id);
