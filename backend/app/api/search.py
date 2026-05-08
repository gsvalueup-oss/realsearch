"""
검색 API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import date
from app.db.database import get_db
from app.db.models import OfficeCurrent, AgentCurrent
import re

def extract_year_from_license_number(license_number: str) -> int | None:
    """license_number에서 4자리 숫자를 모두 추출해서 1985-2026 범위의 가장 오래된 연도 반환"""
    if not license_number or license_number == 'nan':
        return None

    years = re.findall(r'\d{4}', license_number)
    valid_years = [int(y) for y in years if 1985 <= int(y) <= 2026]

    return min(valid_years) if valid_years else None

router = APIRouter(
    prefix="/api/search",
    tags=["search"],
)


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """통계 정보 반환"""
    total_offices = db.query(func.count(OfficeCurrent.id)).scalar() or 0
    total_agents = db.query(func.count(AgentCurrent.id)).scalar() or 0

    return {
        "total_offices": total_offices,
        "total_agents": total_agents,
    }


@router.get("")
async def search(
    q: str = Query("", description="검색어"),
    type: str = Query("all", description="검색 타입: all, office, person"),
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    role: str = Query("", description="직위"),
    status: str = Query("", description="영업상태"),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
):
    """
    통합 검색
    - q: 검색어 (상호, 대표명, 중개업자명, 주소)
    - type: all(전체), office(사무소), person(사람)
    - sido: 시도 필터
    - sigungu: 시군구 필터
    - role: 직위 필터 (대표, 소속공인중개사, 중개보조원)
    - status: 영업상태 필터
    """

    results = {
        "offices": [],
        "agents": [],
        "total": 0,
    }

    if not q or len(q.strip()) < 1:
        return results

    search_term = f"%{q}%"

    # 1. 사무소 검색 (상호명, 주소만 검색 - 대표자명 제외)
    if type in ["all", "office"]:
        office_query = db.query(OfficeCurrent).filter(
            (OfficeCurrent.office_name.ilike(search_term) |
             OfficeCurrent.address.ilike(search_term))
        ).filter(
            ~OfficeCurrent.representative_name.ilike(search_term)
        )

        # 필터 적용
        if sido:
            office_query = office_query.filter(OfficeCurrent.sido == sido)
        if sigungu:
            office_query = office_query.filter(OfficeCurrent.sigungu == sigungu)
        if status:
            office_query = office_query.filter(OfficeCurrent.status == status)

        offices = office_query.limit(limit).all()

        offices_with_info = []
        for office in offices:
            # 직원수 계산
            staff_count = db.query(func.count(AgentCurrent.id)).filter(
                AgentCurrent.office_registration_number == office.registration_number
            ).scalar()

            # 대표자 경력 계산 (1970-01-01 또는 1985년 이전 데이터는 제외)
            representative_experience = None
            if office.representative_name:
                agent = db.query(
                    AgentCurrent.license_date,
                    AgentCurrent.license_number
                ).filter(
                    AgentCurrent.name == office.representative_name,
                    AgentCurrent.office_registration_number == office.registration_number
                ).order_by(AgentCurrent.license_date.asc()).first()

                if agent:
                    year = None
                    if agent.license_date and agent.license_date.year >= 1985:
                        year = agent.license_date.year
                    else:
                        year = extract_year_from_license_number(agent.license_number)

                    if year:
                        representative_experience = date.today().year - year

            offices_with_info.append({
                "id": office.id,
                "registration_number": office.registration_number,
                "office_name": office.office_name,
                "representative_name": office.representative_name,
                "address": office.address,
                "sido": office.sido,
                "sigungu": office.sigungu,
                "status": office.status,
                "type": "office",
                "staff_count": staff_count,
                "representative_experience": representative_experience,
            })

        results["offices"] = offices_with_info

    # 2. 중개업자 검색 (이름만 검색, 사무소명 제외)
    if type in ["all", "person"]:
        agent_query = db.query(AgentCurrent).filter(
            AgentCurrent.name.ilike(search_term)
        ).filter(
            ~AgentCurrent.office_name.ilike(search_term)
        )

        # 필터 적용
        if sido:
            agent_query = agent_query.filter(AgentCurrent.sido == sido)
        if sigungu:
            agent_query = agent_query.filter(AgentCurrent.sigungu == sigungu)
        if role:
            agent_query = agent_query.filter(AgentCurrent.role == role)
        if status:
            agent_query = agent_query.filter(AgentCurrent.status == status)

        agents = agent_query.limit(limit).all()

        agents_with_info = []
        for agent in agents:
            # 경력 계산 (1970-01-01 또는 1985년 이전 데이터는 제외)
            experience = None
            if agent.license_date and agent.license_date.year >= 1985:
                experience = date.today().year - agent.license_date.year

            # 사무소 주소 조회
            office = db.query(OfficeCurrent.address).filter(
                OfficeCurrent.registration_number == agent.office_registration_number
            ).first()
            office_address = office[0] if office else None

            agents_with_info.append({
                "id": agent.id,
                "name": agent.name,
                "role": agent.role,
                "agent_type": agent.agent_type,
                "office_name": agent.office_name,
                "office_registration_number": agent.office_registration_number,
                "address": office_address,
                "sido": agent.sido,
                "sigungu": agent.sigungu,
                "type": "person",
                "license_date": agent.license_date,
                "experience": experience,
            })

        results["agents"] = agents_with_info

    results["total"] = len(results["offices"]) + len(results["agents"])

    return results
