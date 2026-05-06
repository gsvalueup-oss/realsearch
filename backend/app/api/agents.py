"""
중개업자 API
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.db.database import get_db
from app.db.models import AgentCurrent, AgentDailySnapshot
from app.db import schemas

router = APIRouter(
    prefix="/api/agents",
    tags=["agents"],
)


@router.get("", response_model=schemas.PaginatedResponse[schemas.AgentSummary])
async def list_agents(
    q: str = Query("", description="검색어"),
    sido: str = Query("", description="시도"),
    sigungu: str = Query("", description="시군구"),
    role: str = Query("", description="직위"),
    status: str = Query("", description="상태"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(AgentCurrent)

    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                AgentCurrent.name.ilike(search_term),
                AgentCurrent.office_name.ilike(search_term),
            )
        )

    if sido:
        query = query.filter(AgentCurrent.sido == sido)
    if sigungu:
        query = query.filter(AgentCurrent.sigungu == sigungu)
    if role:
        query = query.filter(AgentCurrent.role == role)
    if status:
        query = query.filter(AgentCurrent.status == status)

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


@router.get("/{agent_id}", response_model=schemas.AgentDetail)
async def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
):
    agent = db.query(AgentCurrent).options(
        joinedload(AgentCurrent.office)
    ).filter(AgentCurrent.id == agent_id).first()

    if not agent:
        raise HTTPException(status_code=404, detail="중개업자를 찾을 수 없습니다")

    agent.view_count = (agent.view_count or 0) + 1
    db.commit()

    return agent


@router.get("/{agent_id}/history", response_model=list[dict])
async def get_agent_history(
    agent_id: int,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    agent = db.query(AgentCurrent).filter(AgentCurrent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="중개업자를 찾을 수 없습니다")

    snapshots = db.query(AgentDailySnapshot).filter(
        AgentDailySnapshot.office_registration_number == agent.office_registration_number,
        AgentDailySnapshot.name == agent.name,
    ).order_by(AgentDailySnapshot.snapshot_date.desc()).limit(limit).all()

    return [
        {
            "snapshot_date": s.snapshot_date,
            "office_name": s.office_name,
            "role": s.role,
            "status": s.status,
        }
        for s in snapshots
    ]
