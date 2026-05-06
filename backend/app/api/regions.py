"""
지역 통계 API
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from app.db.database import get_db
from app.db.models import OfficeCurrent, AgentCurrent
from app.db import schemas

router = APIRouter(
    prefix="/api/regions",
    tags=["regions"],
)


@router.get("", response_model=list[schemas.RegionSummary])
async def list_regions(db: Session = Depends(get_db)):
    results = db.query(
        OfficeCurrent.sido,
        func.count(OfficeCurrent.id).label("total_office_count"),
        func.sum(
            case((OfficeCurrent.status == "영업중", 1), else_=0)
        ).label("active_office_count"),
    ).filter(
        OfficeCurrent.sido.isnot(None)
    ).group_by(
        OfficeCurrent.sido
    ).order_by(
        desc(func.count(OfficeCurrent.id))
    ).all()

    regions = []
    for sido, total, active in results:
        licensed_q = db.query(
            func.count(AgentCurrent.id)
        ).filter(
            AgentCurrent.sido == sido,
            AgentCurrent.agent_type == "공인중개사"
        ).scalar()

        assistant_q = db.query(
            func.count(AgentCurrent.id)
        ).filter(
            AgentCurrent.sido == sido,
            AgentCurrent.agent_type == "중개보조원"
        ).scalar()

        regions.append(
            schemas.RegionSummary(
                sido=sido,
                total_office_count=total or 0,
                active_office_count=active or 0,
                licensed_agent_count=licensed_q or 0,
                assistant_count=assistant_q or 0,
            )
        )

    return regions


@router.get("/{sido}", response_model=list[schemas.SigunguStats])
async def get_sigungu_stats(
    sido: str,
    db: Session = Depends(get_db),
):
    results = db.query(
        OfficeCurrent.sigungu,
        func.count(OfficeCurrent.id).label("total_office_count"),
        func.sum(
            case((OfficeCurrent.status == "영업중", 1), else_=0)
        ).label("active_office_count"),
        func.sum(
            case((OfficeCurrent.status.in_(["폐업", "휴업", "업무정지"]), 1), else_=0)
        ).label("inactive_office_count"),
    ).filter(
        OfficeCurrent.sido == sido,
        OfficeCurrent.sigungu.isnot(None)
    ).group_by(
        OfficeCurrent.sigungu
    ).order_by(
        OfficeCurrent.sigungu
    ).all()

    stats = []
    for sigungu, total, active, inactive in results:
        licensed_q = db.query(
            func.count(AgentCurrent.id)
        ).filter(
            AgentCurrent.sido == sido,
            AgentCurrent.sigungu == sigungu,
            AgentCurrent.agent_type == "공인중개사"
        ).scalar()

        assistant_q = db.query(
            func.count(AgentCurrent.id)
        ).filter(
            AgentCurrent.sido == sido,
            AgentCurrent.sigungu == sigungu,
            AgentCurrent.agent_type == "중개보조원"
        ).scalar()

        stats.append(
            schemas.SigunguStats(
                sido=sido,
                sigungu=sigungu,
                total_office_count=total or 0,
                active_office_count=active or 0,
                inactive_office_count=inactive or 0,
                licensed_agent_count=licensed_q or 0,
                assistant_count=assistant_q or 0,
                avg_staff_per_office=None,
            )
        )

    return stats


@router.get("/{sido}/{sigungu}", response_model=dict)
async def get_sigungu_detail(
    sido: str,
    sigungu: str,
    db: Session = Depends(get_db),
):
    offices = db.query(OfficeCurrent).filter(
        OfficeCurrent.sido == sido,
        OfficeCurrent.sigungu == sigungu
    ).all()

    if not offices:
        raise HTTPException(status_code=404, detail="해당 지역을 찾을 수 없습니다")

    total_office_count = len(offices)
    active_office_count = sum(1 for o in offices if o.status == "영업중")
    inactive_office_count = total_office_count - active_office_count

    licensed_q = db.query(func.count(AgentCurrent.id)).filter(
        AgentCurrent.sido == sido,
        AgentCurrent.sigungu == sigungu,
        AgentCurrent.agent_type == "공인중개사"
    ).scalar()

    assistant_q = db.query(func.count(AgentCurrent.id)).filter(
        AgentCurrent.sido == sido,
        AgentCurrent.sigungu == sigungu,
        AgentCurrent.agent_type == "중개보조원"
    ).scalar()

    return {
        "sido": sido,
        "sigungu": sigungu,
        "total_office_count": total_office_count,
        "active_office_count": active_office_count,
        "inactive_office_count": inactive_office_count,
        "licensed_agent_count": licensed_q or 0,
        "assistant_count": assistant_q or 0,
        "offices": [
            {
                "registration_number": o.registration_number,
                "office_name": o.office_name,
                "representative_name": o.representative_name,
                "status": o.status,
                "registered_date": o.registered_date,
            }
            for o in offices[:50]
        ],
    }
