"""
변화 추적 API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date, timedelta
from app.db.database import get_db
from app.db.models import ChangeLog, OfficeCurrent
from app.db import schemas

router = APIRouter(
    prefix="/api/changes",
    tags=["changes"],
)


@router.get("", response_model=list[schemas.ChangeLogResponse])
async def list_changes(
    days: int = Query(7, ge=1, le=365),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=days)

    logs = db.query(ChangeLog).filter(
        ChangeLog.change_date >= cutoff
    ).order_by(ChangeLog.change_date.desc()).limit(limit).all()

    return logs


@router.get("/new-offices", response_model=list[dict])
async def new_offices(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=days)

    logs = db.query(ChangeLog).filter(
        ChangeLog.change_type == "new_office",
        ChangeLog.change_date >= cutoff,
    ).order_by(ChangeLog.change_date.desc()).limit(limit).all()

    if logs:
        return [
            {
                "change_date": log.change_date,
                "registration_number": log.registration_number,
                "office_name": log.description or "신규 개업 사무소",
                "description": log.description,
            }
            for log in logs
        ]

    offices = db.query(OfficeCurrent).filter(
        OfficeCurrent.registered_date >= cutoff
    ).order_by(OfficeCurrent.registered_date.desc()).limit(limit).all()

    return [
        {
            "change_date": o.registered_date,
            "registration_number": o.registration_number,
            "office_name": o.office_name,
            "description": f"{o.office_name} 신규 개업",
        }
        for o in offices
    ]


@router.get("/closed-offices", response_model=list[schemas.ChangeLogResponse])
async def closed_offices(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=days)

    logs = db.query(ChangeLog).filter(
        ChangeLog.change_type.in_(["closed_office", "suspended_office"]),
        ChangeLog.change_date >= cutoff,
    ).order_by(ChangeLog.change_date.desc()).limit(limit).all()

    return logs


@router.get("/staff-increased", response_model=list[schemas.ChangeLogResponse])
async def staff_increased(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=days)

    logs = db.query(ChangeLog).filter(
        ChangeLog.change_type == "staff_increase",
        ChangeLog.change_date >= cutoff,
    ).order_by(ChangeLog.change_date.desc()).limit(limit).all()

    return logs


@router.get("/staff-decreased", response_model=list[schemas.ChangeLogResponse])
async def staff_decreased(
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=days)

    logs = db.query(ChangeLog).filter(
        ChangeLog.change_type == "staff_decrease",
        ChangeLog.change_date >= cutoff,
    ).order_by(ChangeLog.change_date.desc()).limit(limit).all()

    return logs
