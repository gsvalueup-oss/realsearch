-- 사무소 조회수 컬럼 추가
ALTER TABLE office_current
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 중개업자 조회수 컬럼 추가
ALTER TABLE agent_current
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
