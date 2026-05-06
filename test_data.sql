-- 테스트 데이터 추가

INSERT INTO office_current (registration_number, office_name, representative_name, legal_dong_code,
    legal_dong_name, address, road_address, status, registered_date, phone_number, sido, sigungu,
    eupmyeondong, latitude, longitude, source_updated_at, created_at, updated_at, view_count)
VALUES
    ('REG001', '강남공인중개소', '김철수', '11110', '서울특별시 강남구',
     '서울특별시 강남구 강남대로 100', '서울특별시 강남구 강남대로 100', '영업중', '2020-01-15',
     '02-1234-5678', '서울특별시', '강남구', '강남동', 37.4979, 127.0276, NOW(), NOW(), NOW(), 10),
    ('REG002', '서초부동산중개', '박영희', '11140', '서울특별시 서초구',
     '서울특별시 서초구 서초대로 200', '서울특별시 서초구 서초대로 200', '영업중', '2019-06-20',
     '02-5678-1234', '서울특별시', '서초구', '서초동', 37.4863, 127.0121, NOW(), NOW(), NOW(), 15)
ON CONFLICT (registration_number) DO NOTHING;

INSERT INTO agent_current (name, role, office_registration_number, office_name, legal_dong_name,
    address, sido, sigungu, agent_type, license_number, license_date, status, source_updated_at,
    created_at, updated_at, view_count)
VALUES
    ('이민준', '대표', 'REG001', '강남공인중개소', '서울특별시 강남구',
     '서울특별시 강남구 강남대로 100', '서울특별시', '강남구', '중개사', '2020-12345', '2020-03-01',
     '영업중', NOW(), NOW(), NOW(), 8),
    ('정수현', '소속공인중개사', 'REG002', '서초부동산중개', '서울특별시 서초구',
     '서울특별시 서초구 서초대로 200', '서울특별시', '서초구', '중개사', '2019-54321', '2019-05-15',
     '영업중', NOW(), NOW(), NOW(), 12)
ON CONFLICT DO NOTHING;
