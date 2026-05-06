# CSV 컬럼 매핑 설정
# 실제 브이월드 CSV 파일의 컬럼명과 DB 필드명을 매핑합니다.

# 부동산중개업사무소정보 CSV → office_current 테이블
OFFICE_CSV_MAPPING = {
    "등록번호": "registration_number",
    "사업자상호": "office_name",
    "중개업자명": "representative_name",
    "법정동코드": "legal_dong_code",
    "법정동명": "legal_dong_name",
    "지번주소": "address",
    "도로명주소": "road_address",
    "도로명주소코드": "road_address_code",
    "상태구분명": "status",
    "등록일자": "registered_date",
    "전화번호": "phone_number",
    "보증설정시작일": "start_date",
    "보증설정종료일": "end_date",
    "데이터기준일자": "source_updated_at",
}

# 부동산중개업자정보 CSV → agent_current 테이블
AGENT_CSV_MAPPING = {
    "등록번호": "office_registration_number",
    "사업자상호": "office_name",
    "중개업자명": "name",
    "중개업자종별명": "agent_type",
    "직위구분명": "role",
    "자격증번호": "license_number",
    "자격증취득일": "license_date",
    "법정동코드": "legal_dong_code",
    "법정동명": "legal_dong_name",
    "데이터기준일자": "source_updated_at",
}

# 직위 정규화 (다양한 표현을 통일)
ROLE_NORMALIZATION = {
    "대표": "대표",
    "대표자": "대표",
    "공인중개사": "소속공인중개사",
    "소속공인중개사": "소속공인중개사",
    "중개보조원": "중개보조원",
    "보조원": "중개보조원",
}

# 영업상태 정규화
STATUS_NORMALIZATION = {
    "영업중": "영업중",
    "폐업": "폐업",
    "휴업": "휴업",
    "업무정지": "업무정지",
}

# 지역 코드 → 시도명 매핑 (법정동코드 첫 2자리)
SIDO_MAPPING = {
    "11": "서울특별시",
    "26": "부산광역시",
    "27": "대구광역시",
    "28": "인천광역시",
    "29": "광주광역시",
    "30": "대전광역시",
    "31": "울산광역시",
    "36": "세종특별자치시",
    "41": "경기도",
    "42": "강원도",
    "43": "충청북도",
    "44": "충청남도",
    "45": "전라북도",
    "46": "전라남도",
    "47": "경상북도",
    "48": "경상남도",
    "49": "제주특별자치도",
}


def parse_legal_dong_name(legal_dong_name: str) -> tuple:
    """
    법정동명을 파싱하여 (sido, sigungu, eupmyeondong) 반환
    예: "대구광역시 중구 동인동" → ("대구광역시", "중구", "동인동")
    """
    if not legal_dong_name:
        return (None, None, None)

    parts = legal_dong_name.split()

    if len(parts) >= 3:
        return (parts[0], parts[1], parts[2])
    elif len(parts) == 2:
        return (parts[0], parts[1], None)
    elif len(parts) == 1:
        return (parts[0], None, None)

    return (None, None, None)


def normalize_role(role: str) -> str:
    """직위를 정규화"""
    if not role:
        return role
    normalized = ROLE_NORMALIZATION.get(role.strip(), role.strip())
    return normalized


def normalize_status(status: str) -> str:
    """영업상태를 정규화"""
    if not status:
        return status
    normalized = STATUS_NORMALIZATION.get(status.strip(), status.strip())
    return normalized
