"""
Information correction request API.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import schemas
from app.db.database import get_db
from app.db.models import CorrectionRequest

router = APIRouter(
    prefix="/api/correction-requests",
    tags=["correction-requests"],
)


@router.post("")
async def create_correction_request(
    payload: schemas.CorrectionRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    correction_request = CorrectionRequest(
        target_type=payload.target_type,
        target_id=payload.target_id,
        target_name=payload.target_name,
        page_url=payload.page_url,
        request_content=payload.request_content,
        requester_contact=payload.requester_contact,
        snapshot=payload.snapshot,
        status="pending",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    try:
        db.add(correction_request)
        db.commit()
        db.refresh(correction_request)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="정정 요청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        )

    return {
        "success": True,
        "id": correction_request.id,
        "message": "정정 요청이 접수되었습니다.",
    }
