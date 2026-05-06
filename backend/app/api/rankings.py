"""
랭킹 API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from datetime import date, timedelta
from app.db.database import get_db
from app.db.models import OfficeCurrent, AgentCurrent
from app.db import schemas
import re

def extract_year_from_license_number(license_number: str) -> int | None:
    """license_number에서 4자리 숫자를 모두 추출해서 1985-2026 범위의 가장 오래된 연도 반환"""
    if not license_number or license_number == 'nan':
        return None

    years = re.findall(r'\d{4}', license_number)
    valid_years = [int(y) for y in years if 1985 <= int(y) <= 2026]

    return min(valid_years) if valid_years else None

router = APIRouter(
    prefix="/api/rankings",
    tags=["rankings"],
)


@router.get("/offices/by-staff", response_model=list[schemas.RankingItem])
async def ranking_by_staff(
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    status: str = Query("영업중", description="영업상태"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    staff_count_sq = (
        db.query(
            AgentCurrent.office_registration_number,
            func.count(AgentCurrent.id).label("total_staff"),
        )
        .group_by(AgentCurrent.office_registration_number)
        .subquery()
    )

    query = (
        db.query(OfficeCurrent, func.coalesce(staff_count_sq.c.total_staff, 0).label("staff_count_val"))
        .outerjoin(staff_count_sq, OfficeCurrent.registration_number == staff_count_sq.c.office_registration_number)
        .order_by(desc(func.coalesce(staff_count_sq.c.total_staff, 0)))
    )

    if sido:
        query = query.filter(OfficeCurrent.sido == sido)
    if sigungu:
        query = query.filter(OfficeCurrent.sigungu == sigungu)
    if status:
        query = query.filter(OfficeCurrent.status == status)

    results = query.limit(limit).all()

    # 대표자 경력 계산 헬퍼 함수
    def get_representative_experience(office, db):
        if not office.representative_name:
            return None
        agent = db.query(
            AgentCurrent.license_date,
            AgentCurrent.license_number
        ).filter(
            AgentCurrent.office_registration_number == office.registration_number,
            AgentCurrent.name == office.representative_name,
        ).order_by(AgentCurrent.license_date.asc()).first()

        if not agent:
            return None

        year = None
        if agent.license_date and agent.license_date.year >= 1985:
            year = agent.license_date.year
        else:
            year = extract_year_from_license_number(agent.license_number)

        if year:
            return date.today().year - year
        return None

    return [
        schemas.RankingItem(
            rank=idx + 1,
            registration_number=office.registration_number,
            office_name=office.office_name,
            sido=office.sido,
            sigungu=office.sigungu,
            value=staff_count or 0,
            value_label="명",
            status=office.status,
            representative_name=office.representative_name,
            representative_experience=get_representative_experience(office, db),
        )
        for idx, (office, staff_count) in enumerate(results)
    ]


@router.get("/offices/by-age", response_model=list[schemas.RankingItem])
async def ranking_by_age(
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    status: str = Query("영업중", description="영업상태"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    def get_representative_experience(office, db):
        if not office.representative_name:
            return None
        agent = db.query(
            AgentCurrent.license_date,
            AgentCurrent.license_number
        ).filter(
            AgentCurrent.office_registration_number == office.registration_number,
            AgentCurrent.name == office.representative_name,
        ).order_by(AgentCurrent.license_date.asc()).first()

        if not agent:
            return None

        year = None
        if agent.license_date and agent.license_date.year >= 1985:
            year = agent.license_date.year
        else:
            year = extract_year_from_license_number(agent.license_number)

        if year:
            return date.today().year - year
        return None

    query = db.query(OfficeCurrent).filter(
        OfficeCurrent.registered_date.isnot(None)
    ).order_by(OfficeCurrent.registered_date.asc())

    if sido:
        query = query.filter(OfficeCurrent.sido == sido)
    if sigungu:
        query = query.filter(OfficeCurrent.sigungu == sigungu)
    if status:
        query = query.filter(OfficeCurrent.status == status)

    results = query.limit(limit).all()

    return [
        schemas.RankingItem(
            rank=idx + 1,
            registration_number=office.registration_number,
            office_name=office.office_name,
            sido=office.sido,
            sigungu=office.sigungu,
            value=(date.today() - office.registered_date).days if office.registered_date else 0,
            value_label="일",
            status=office.status,
            representative_name=office.representative_name,
            representative_experience=get_representative_experience(office, db),
        )
        for idx, office in enumerate(results)
    ]


@router.get("/offices/by-licensed-agents", response_model=list[schemas.RankingItem])
async def ranking_by_licensed_agents(
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    status: str = Query("영업중", description="영업상태"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    def get_representative_experience(office, db):
        if not office.representative_name:
            return None
        agent = db.query(
            AgentCurrent.license_date,
            AgentCurrent.license_number
        ).filter(
            AgentCurrent.office_registration_number == office.registration_number,
            AgentCurrent.name == office.representative_name,
        ).order_by(AgentCurrent.license_date.asc()).first()

        if not agent:
            return None

        year = None
        if agent.license_date and agent.license_date.year >= 1985:
            year = agent.license_date.year
        else:
            year = extract_year_from_license_number(agent.license_number)

        if year:
            return date.today().year - year
        return None

    licensed_count_sq = (
        db.query(
            AgentCurrent.office_registration_number,
            func.count(AgentCurrent.id).label("licensed_count"),
        )
        .filter(AgentCurrent.agent_type == "공인중개사")
        .group_by(AgentCurrent.office_registration_number)
        .subquery()
    )

    query = (
        db.query(OfficeCurrent, func.coalesce(licensed_count_sq.c.licensed_count, 0).label("licensed_count_val"))
        .outerjoin(licensed_count_sq, OfficeCurrent.registration_number == licensed_count_sq.c.office_registration_number)
        .order_by(desc(func.coalesce(licensed_count_sq.c.licensed_count, 0)))
    )

    if sido:
        query = query.filter(OfficeCurrent.sido == sido)
    if sigungu:
        query = query.filter(OfficeCurrent.sigungu == sigungu)
    if status:
        query = query.filter(OfficeCurrent.status == status)

    results = query.limit(limit).all()

    return [
        schemas.RankingItem(
            rank=idx + 1,
            registration_number=office.registration_number,
            office_name=office.office_name,
            sido=office.sido,
            sigungu=office.sigungu,
            value=licensed_count or 0,
            value_label="명",
            status=office.status,
            representative_name=office.representative_name,
            representative_experience=get_representative_experience(office, db),
        )
        for idx, (office, licensed_count) in enumerate(results)
    ]


@router.get("/offices/by-assistants", response_model=list[schemas.RankingItem])
async def ranking_by_assistants(
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    status: str = Query("영업중", description="영업상태"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    def get_representative_experience(office, db):
        if not office.representative_name:
            return None
        agent = db.query(
            AgentCurrent.license_date,
            AgentCurrent.license_number
        ).filter(
            AgentCurrent.office_registration_number == office.registration_number,
            AgentCurrent.name == office.representative_name,
        ).order_by(AgentCurrent.license_date.asc()).first()

        if not agent:
            return None

        year = None
        if agent.license_date and agent.license_date.year >= 1985:
            year = agent.license_date.year
        else:
            year = extract_year_from_license_number(agent.license_number)

        if year:
            return date.today().year - year
        return None

    assistant_count_sq = (
        db.query(
            AgentCurrent.office_registration_number,
            func.count(AgentCurrent.id).label("assistant_count"),
        )
        .filter(AgentCurrent.agent_type == "중개보조원")
        .group_by(AgentCurrent.office_registration_number)
        .subquery()
    )

    query = (
        db.query(OfficeCurrent, func.coalesce(assistant_count_sq.c.assistant_count, 0).label("assistant_count_val"))
        .outerjoin(assistant_count_sq, OfficeCurrent.registration_number == assistant_count_sq.c.office_registration_number)
        .order_by(desc(func.coalesce(assistant_count_sq.c.assistant_count, 0)))
    )

    if sido:
        query = query.filter(OfficeCurrent.sido == sido)
    if sigungu:
        query = query.filter(OfficeCurrent.sigungu == sigungu)
    if status:
        query = query.filter(OfficeCurrent.status == status)

    results = query.limit(limit).all()

    return [
        schemas.RankingItem(
            rank=idx + 1,
            registration_number=office.registration_number,
            office_name=office.office_name,
            sido=office.sido,
            sigungu=office.sigungu,
            value=assistant_count or 0,
            value_label="명",
            status=office.status,
            representative_name=office.representative_name,
            representative_experience=get_representative_experience(office, db),
        )
        for idx, (office, assistant_count) in enumerate(results)
    ]


@router.get("/offices/newest", response_model=list[schemas.RankingItem])
async def ranking_newest_offices(
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    def get_representative_experience(office, db):
        if not office.representative_name:
            return None
        agent = db.query(
            AgentCurrent.license_date,
            AgentCurrent.license_number
        ).filter(
            AgentCurrent.office_registration_number == office.registration_number,
            AgentCurrent.name == office.representative_name,
        ).order_by(AgentCurrent.license_date.asc()).first()

        if not agent:
            return None

        year = None
        if agent.license_date and agent.license_date.year >= 1985:
            year = agent.license_date.year
        else:
            year = extract_year_from_license_number(agent.license_number)

        if year:
            return date.today().year - year
        return None

    cutoff = date.today() - timedelta(days=days)

    query = db.query(OfficeCurrent).filter(
        OfficeCurrent.registered_date >= cutoff
    ).order_by(OfficeCurrent.registered_date.desc())

    if sido:
        query = query.filter(OfficeCurrent.sido == sido)
    if sigungu:
        query = query.filter(OfficeCurrent.sigungu == sigungu)

    results = query.limit(limit).all()

    return [
        schemas.RankingItem(
            rank=idx + 1,
            registration_number=office.registration_number,
            office_name=office.office_name,
            sido=office.sido,
            sigungu=office.sigungu,
            value=(date.today() - office.registered_date).days if office.registered_date else 0,
            value_label="일",
            status=office.status,
            representative_name=office.representative_name,
            representative_experience=get_representative_experience(office, db),
        )
        for idx, office in enumerate(results)
    ]


@router.get("/offices/by-representative-career", response_model=list[schemas.RankingItem])
async def ranking_by_representative_career(
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    status: str = Query("영업중", description="영업상태"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from sqlalchemy.orm import joinedload

    query = db.query(OfficeCurrent).filter(
        OfficeCurrent.representative_name.isnot(None),
        OfficeCurrent.registered_date.isnot(None)
    )

    if sido:
        query = query.filter(OfficeCurrent.sido == sido)
    if sigungu:
        query = query.filter(OfficeCurrent.sigungu == sigungu)
    if status:
        query = query.filter(OfficeCurrent.status == status)

    offices = query.limit(limit * 3).all()

    office_careers = []
    FIRST_EXAM_YEAR = 1985  # 공인중개사 제도 시작 연도

    for office in offices:
        representative_agent = db.query(AgentCurrent.license_date).filter(
            AgentCurrent.office_registration_number == office.registration_number,
            AgentCurrent.name == office.representative_name,
            AgentCurrent.license_date.isnot(None),
        ).first()

        if representative_agent and representative_agent[0]:
            license_year = representative_agent[0].year
            # 1970-01-01 (Unix 기준시간) 또는 1985년 이전 데이터는 제외
            if license_year >= FIRST_EXAM_YEAR:
                career_days = (date.today() - representative_agent[0]).days
                office_careers.append((office, career_days, license_year))

    office_careers.sort(key=lambda x: x[1], reverse=True)

    return [
        schemas.RankingItem(
            rank=idx + 1,
            registration_number=office.registration_number,
            office_name=office.office_name,
            sido=office.sido,
            sigungu=office.sigungu,
            value=career_days,
            value_label="일",
            status=office.status,
            representative_name=office.representative_name,
            representative_experience=career_days // 365 if career_days else None,
            representative_license_year=license_year,
        )
        for idx, (office, career_days, license_year) in enumerate(office_careers[:limit])
    ]


@router.get("/offices/by-comprehensive", response_model=list[schemas.RankingItem])
async def ranking_by_comprehensive(
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    status: str = Query("영업중", description="영업상태"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """종합랭킹: 직원수와 대표자경력을 균형있게 반영"""

    staff_count_sq = (
        db.query(
            AgentCurrent.office_registration_number,
            func.count(AgentCurrent.id).label("total_staff"),
        )
        .group_by(AgentCurrent.office_registration_number)
        .subquery()
    )

    query = (
        db.query(OfficeCurrent, func.coalesce(staff_count_sq.c.total_staff, 0).label("staff_count_val"))
        .outerjoin(staff_count_sq, OfficeCurrent.registration_number == staff_count_sq.c.office_registration_number)
    )

    if sido:
        query = query.filter(OfficeCurrent.sido == sido)
    if sigungu:
        query = query.filter(OfficeCurrent.sigungu == sigungu)
    if status:
        query = query.filter(OfficeCurrent.status == status)

    results = query.all()

    office_scores = []
    FIRST_EXAM_YEAR = 1985

    for office, staff_count in results:
        if not office.representative_name:
            continue

        # 대표자 경력 구하기
        representative_agent = db.query(AgentCurrent.license_date).filter(
            AgentCurrent.office_registration_number == office.registration_number,
            AgentCurrent.name == office.representative_name,
            AgentCurrent.license_date.isnot(None),
        ).first()

        if not representative_agent or not representative_agent[0]:
            continue

        license_year = representative_agent[0].year
        if license_year < FIRST_EXAM_YEAR:
            continue

        career_days = (date.today() - representative_agent[0]).days
        career_years = career_days // 365 if career_days else 0

        staff_count = staff_count or 0

        if staff_count == 0 or career_years == 0:
            continue

        # 종합점수 계산
        # 점수 = (직원수 × 경력년수) ÷ 100
        score = (staff_count * career_years) / 100

        # 균형도 = min(직원수, 경력년수) ÷ max(직원수, 경력년수)
        balance = min(staff_count, career_years) / max(staff_count, career_years)

        # 최종점수 = 점수 × 균형도
        final_score = score * balance

        office_scores.append((office, final_score, career_years, license_year))

    office_scores.sort(key=lambda x: x[1], reverse=True)

    def get_representative_experience(office, db):
        if not office.representative_name:
            return None
        agent = db.query(
            AgentCurrent.license_date,
            AgentCurrent.license_number
        ).filter(
            AgentCurrent.office_registration_number == office.registration_number,
            AgentCurrent.name == office.representative_name,
        ).order_by(AgentCurrent.license_date.asc()).first()

        if not agent:
            return None

        year = None
        if agent.license_date and agent.license_date.year >= FIRST_EXAM_YEAR:
            year = agent.license_date.year
        else:
            year = extract_year_from_license_number(agent.license_number)

        if year:
            return date.today().year - year
        return None

    return [
        schemas.RankingItem(
            rank=idx + 1,
            registration_number=office.registration_number,
            office_name=office.office_name,
            sido=office.sido,
            sigungu=office.sigungu,
            value=int(final_score * 10),  # 소수점 제거를 위해 10을 곱함
            value_label="점",
            status=office.status,
            representative_name=office.representative_name,
            representative_experience=get_representative_experience(office, db),
            representative_license_year=license_year,
        )
        for idx, (office, final_score, career_years, license_year) in enumerate(office_scores[:limit])
    ]
