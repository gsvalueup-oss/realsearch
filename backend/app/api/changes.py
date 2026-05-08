"""
변동 이력 API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.db.database import get_db
from app.db.models import DailySyncResult

router = APIRouter(
    prefix="/api/changes",
    tags=["changes"],
)


@router.get("/daily")
async def get_daily_changes(
    target_date: str = Query(None, description="YYYY-MM-DD, 기본값: 오늘"),
    db: Session = Depends(get_db),
):
    if target_date:
        try:
            d = date.fromisoformat(target_date)
        except ValueError:
            d = date.today()
    else:
        d = date.today()

    result = db.query(DailySyncResult).filter(DailySyncResult.sync_date == d).first()
    if not result:
        return {"sync_date": d.isoformat(), "has_data": False,
                "inserted": 0, "updated": 0, "deleted": 0,
                "new_list": [], "closed_list": [], "updated_list": []}

    return {
        "sync_date": result.sync_date.isoformat(),
        "has_data": True,
        "inserted": result.inserted,
        "updated": result.updated,
        "deleted": result.deleted,
        "new_list": result.new_list or [],
        "closed_list": result.closed_list or [],
        "updated_list": result.updated_list or [],
    }


@router.get("/recent")
async def get_recent_changes(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=days)
    results = db.query(DailySyncResult).filter(
        DailySyncResult.sync_date >= cutoff
    ).order_by(DailySyncResult.sync_date.desc()).all()

    return [
        {
            "sync_date": r.sync_date.isoformat(),
            "inserted": r.inserted,
            "updated": r.updated,
            "deleted": r.deleted,
        }
        for r in results
    ]
