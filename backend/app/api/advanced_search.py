"""
고급 검색 API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.db.database import get_db
from app.db.models import OfficeCurrent, AgentCurrent
from app.db import schemas
import re

def extract_year_from_license_number(license_number: str) -> int | None:
    if not license_number or license_number == 'nan':
        return None
    years = re.findall(r'\d{4}', license_number)
    valid_years = [int(y) for y in years if 1985 <= int(y) <= 2026]
    return min(valid_years) if valid_years else None

router = APIRouter(
    prefix="/api",
    tags=["search"],
)

@router.get("/advanced-search", response_model=schemas.PaginatedResponse[schemas.OfficeSummary])
async def advanced_search(
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    representative_experience: int = Query(0, ge=0, le=100, description="최소 대표자 경력(년)"),
    min_staff: int = Query(0, ge=0, le=1000, description="최소 직원수"),
    status: str = Query("", description="영업상태"),
    page: int = Query(1, ge=1, description="페이지"),
    limit: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: Session = Depends(get_db),
):
    query = db.query(OfficeCurrent)

    if sido:
        query = query.filter(OfficeCurrent.sido == sido)
    if sigungu:
        query = query.filter(OfficeCurrent.sigungu == sigungu)
    if status:
        query = query.filter(OfficeCurrent.status == status)

    if min_staff > 0:
        staff_sq = db.query(
            AgentCurrent.office_registration_number,
            func.count(AgentCurrent.id).label("cnt")
        ).group_by(AgentCurrent.office_registration_number).subquery()

        query = query.outerjoin(
            staff_sq,
            OfficeCurrent.registration_number == staff_sq.c.office_registration_number
        ).filter(func.coalesce(staff_sq.c.cnt, 0) >= min_staff)

    query = query.distinct(OfficeCurrent.registration_number).order_by(
        OfficeCurrent.registration_number.desc()
    )

    # representative_experience 필터가 있으면 모든 결과를 가져와서 필터링
    if representative_experience > 0:
        all_offices = query.all()
    else:
        total = query.count()
        all_offices = query.offset((page - 1) * limit).limit(limit).all()

    result_items = []
    for office in all_offices:
        staff_count = db.query(func.count(AgentCurrent.id)).filter(
            AgentCurrent.office_registration_number == office.registration_number
        ).scalar()

        representative_experience_val = None
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
                    representative_experience_val = date.today().year - year

        # representative_experience 필터 적용
        if representative_experience > 0 and representative_experience_val is None:
            continue
        if representative_experience > 0 and representative_experience_val < representative_experience:
            continue

        office_dict = {
            'id': office.id,
            'registration_number': office.registration_number,
            'office_name': office.office_name,
            'representative_name': office.representative_name,
            'address': office.address,
            'sido': office.sido,
            'sigungu': office.sigungu,
            'status': office.status,
            'registered_date': office.registered_date,
            'phone_number': office.phone_number,
            'staff_count': staff_count,
            'representative_experience': representative_experience_val,
        }
        result_items.append(schemas.OfficeSummary(**office_dict))

    # representative_experience 필터가 있으면 페이지네이션 적용
    if representative_experience > 0:
        # 대표자 경력 높은 순서로 정렬 (None은 뒤로)
        result_items.sort(key=lambda x: x.representative_experience if x.representative_experience else 0, reverse=True)
        total = len(result_items)
        result_items = result_items[(page - 1) * limit : page * limit]
    else:
        total = query.count()

    total_pages = (total + limit - 1) // limit

    return schemas.PaginatedResponse(
        items=result_items,
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )
