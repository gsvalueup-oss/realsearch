"""
사무소 API
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, case
from datetime import date, timedelta
from app.db.database import get_db
from app.db.models import OfficeCurrent, AgentCurrent, ChangeLog, OfficeMetricsDaily
from app.db import schemas

router = APIRouter(
    prefix="/api/offices",
    tags=["offices"],
)


@router.get("", response_model=schemas.PaginatedResponse[schemas.OfficeSummary])
async def list_offices(
    q: str = Query("", description="검색어"),
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    status: str = Query("", description="영업상태"),
    page: int = Query(1, ge=1, description="페이지"),
    page_size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: Session = Depends(get_db),
):
    query = db.query(OfficeCurrent)

    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                OfficeCurrent.office_name.ilike(search_term),
                OfficeCurrent.representative_name.ilike(search_term),
                OfficeCurrent.address.ilike(search_term),
            )
        )

    if sido:
        query = query.filter(OfficeCurrent.sido == sido)
    if sigungu:
        query = query.filter(OfficeCurrent.sigungu == sigungu)
    if status:
        query = query.filter(OfficeCurrent.status == status)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size

    return schemas.PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{registration_number}", response_model=schemas.OfficeDetail)
async def get_office(
    registration_number: str,
    db: Session = Depends(get_db),
):
    office = db.query(OfficeCurrent).filter(
        OfficeCurrent.registration_number == registration_number
    ).first()
    if not office:
        raise HTTPException(status_code=404, detail="사무소를 찾을 수 없습니다")

    office.view_count = (office.view_count or 0) + 1
    db.commit()

    agents = db.query(AgentCurrent).filter(
        AgentCurrent.office_registration_number == registration_number
    ).order_by(
        case(
            (AgentCurrent.name == office.representative_name, 0),
            else_=1
        ),
        AgentCurrent.name
    ).all()

    office.staff = agents
    return office


@router.get("/{registration_number}/staff", response_model=list[schemas.AgentSummary])
async def get_office_staff(
    registration_number: str,
    db: Session = Depends(get_db),
):
    office = db.query(OfficeCurrent).filter(
        OfficeCurrent.registration_number == registration_number
    ).first()
    if not office:
        raise HTTPException(status_code=404, detail="사무소를 찾을 수 없습니다")

    agents = db.query(AgentCurrent).filter(
        AgentCurrent.office_registration_number == registration_number
    ).all()
    return agents


@router.get(
    "/{registration_number}/history",
    response_model=list[schemas.ChangeLogResponse],
)
async def get_office_history(
    registration_number: str,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    logs = db.query(ChangeLog).filter(
        ChangeLog.registration_number == registration_number
    ).order_by(ChangeLog.change_date.desc()).limit(limit).all()
    return logs


@router.get("/{registration_number}/metrics", response_model=list[schemas.StaffMetric])
async def get_office_metrics(
    registration_number: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=days)
    metrics = db.query(OfficeMetricsDaily).filter(
        OfficeMetricsDaily.registration_number == registration_number,
        OfficeMetricsDaily.snapshot_date >= cutoff,
    ).order_by(OfficeMetricsDaily.snapshot_date.desc()).all()
    return metrics
