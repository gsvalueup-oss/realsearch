"""
인기 조회 API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.db.models import OfficeCurrent, AgentCurrent
from app.db import schemas

router = APIRouter(
    prefix="/api/popular",
    tags=["popular"],
)


@router.get("/offices", response_model=list[schemas.OfficeSummary])
async def popular_offices(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    offices = db.query(OfficeCurrent).filter(
        OfficeCurrent.view_count > 0
    ).order_by(desc(OfficeCurrent.view_count)).limit(limit).all()

    return offices


@router.get("/agents", response_model=list[schemas.AgentSummary])
async def popular_agents(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    agents = db.query(AgentCurrent).filter(
        AgentCurrent.view_count > 0
    ).order_by(desc(AgentCurrent.view_count)).limit(limit).all()

    return agents
