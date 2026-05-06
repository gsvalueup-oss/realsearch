"""
관리자 API
"""
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import date, timedelta, datetime
from app.db.database import get_db
from app.db.models import OfficeCurrent, AgentCurrent, DataSyncLog, APIRequestLog, UserVisit
from app.db import schemas
import csv
import io

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
)

ADMIN_PASSWORD = "admin123"


def verify_admin(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="인증 실패")


@router.get("/stats", dependencies=[])
async def get_stats(
    password: str = Query("", description="관리자 비밀번호"),
    db: Session = Depends(get_db),
):
    verify_admin(password)

    total_offices = db.query(func.count(OfficeCurrent.id)).scalar() or 0
    active_offices = db.query(func.count(OfficeCurrent.id)).filter(
        OfficeCurrent.status == "영업중"
    ).scalar() or 0
    total_agents = db.query(func.count(AgentCurrent.id)).scalar() or 0

    most_viewed_offices = db.query(OfficeCurrent).order_by(
        desc(OfficeCurrent.view_count)
    ).limit(10).all()

    most_viewed_agents = db.query(AgentCurrent).order_by(
        desc(AgentCurrent.view_count)
    ).limit(10).all()

    return {
        "total_offices": total_offices,
        "active_offices": active_offices,
        "total_agents": total_agents,
        "most_viewed_offices": [
            {
                "registration_number": o.registration_number,
                "office_name": o.office_name,
                "view_count": o.view_count or 0,
            }
            for o in most_viewed_offices
        ],
        "most_viewed_agents": [
            {
                "id": a.id,
                "name": a.name,
                "office_name": a.office_name,
                "view_count": a.view_count or 0,
            }
            for a in most_viewed_agents
        ],
    }


@router.post("/reset-views")
async def reset_views(
    password: str = Query("", description="관리자 비밀번호"),
    db: Session = Depends(get_db),
):
    verify_admin(password)

    db.query(OfficeCurrent).update({OfficeCurrent.view_count: 0})
    db.query(AgentCurrent).update({AgentCurrent.view_count: 0})
    db.commit()

    return {"message": "조회수가 초기화되었습니다"}


@router.get("/sync-status")
async def sync_status(
    password: str = Query("", description="관리자 비밀번호"),
    db: Session = Depends(get_db),
):
    verify_admin(password)

    logs = db.query(DataSyncLog).all()

    return {
        "syncs": [
            {
                "data_type": log.data_type,
                "last_sync_date": log.last_sync_date,
                "last_sync_time": log.last_sync_time,
                "record_count": log.record_count,
            }
            for log in logs
        ]
    }


@router.get("/api-stats")
async def api_stats(
    password: str = Query("", description="관리자 비밀번호"),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
):
    verify_admin(password)

    cutoff = date.today() - timedelta(days=days)

    total_requests = db.query(func.count(APIRequestLog.id)).filter(
        APIRequestLog.created_at >= cutoff
    ).scalar() or 0

    avg_response_time = db.query(func.avg(APIRequestLog.response_time_ms)).filter(
        APIRequestLog.created_at >= cutoff
    ).scalar() or 0

    error_count = db.query(func.count(APIRequestLog.id)).filter(
        APIRequestLog.status_code >= 400,
        APIRequestLog.created_at >= cutoff,
    ).scalar() or 0

    endpoint_stats = db.query(
        APIRequestLog.endpoint,
        APIRequestLog.method,
        func.count(APIRequestLog.id).label("count"),
        func.avg(APIRequestLog.response_time_ms).label("avg_time"),
    ).filter(
        APIRequestLog.created_at >= cutoff
    ).group_by(
        APIRequestLog.endpoint,
        APIRequestLog.method,
    ).order_by(
        desc(func.count(APIRequestLog.id))
    ).limit(20).all()

    recent_errors = db.query(APIRequestLog).filter(
        APIRequestLog.status_code >= 400,
        APIRequestLog.created_at >= cutoff,
    ).order_by(
        desc(APIRequestLog.created_at)
    ).limit(10).all()

    return {
        "total_requests": total_requests,
        "avg_response_time": round(avg_response_time, 2) if avg_response_time else 0,
        "error_count": error_count,
        "endpoint_stats": [
            {
                "endpoint": stat[0],
                "method": stat[1],
                "count": stat[2],
                "avg_time": round(stat[3], 2) if stat[3] else 0,
            }
            for stat in endpoint_stats
        ],
        "recent_errors": [
            {
                "endpoint": log.endpoint,
                "method": log.method,
                "status_code": log.status_code,
                "response_time_ms": log.response_time_ms,
                "created_at": log.created_at,
            }
            for log in recent_errors
        ],
    }


@router.get("/user-stats")
async def user_stats(
    password: str = Query("", description="관리자 비밀번호"),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
):
    verify_admin(password)

    cutoff = date.today() - timedelta(days=days)

    # 일별 방문자 수
    daily_visitors = db.query(
        func.date(UserVisit.visited_at).label("visit_date"),
        func.count(func.distinct(UserVisit.ip_address)).label("unique_visitors"),
        func.count(UserVisit.id).label("total_visits"),
    ).filter(
        UserVisit.visited_at >= cutoff
    ).group_by(
        func.date(UserVisit.visited_at)
    ).order_by(
        func.date(UserVisit.visited_at).desc()
    ).all()

    # 페이지별 방문 수
    page_stats = db.query(
        UserVisit.page,
        func.count(UserVisit.id).label("visit_count"),
        func.count(func.distinct(UserVisit.ip_address)).label("unique_visitors"),
    ).filter(
        UserVisit.visited_at >= cutoff
    ).group_by(
        UserVisit.page
    ).order_by(
        func.count(UserVisit.id).desc()
    ).limit(20).all()

    # 시간대별 방문 수
    hourly_stats = db.query(
        func.date_trunc('hour', UserVisit.visited_at).label("visit_hour"),
        func.count(UserVisit.id).label("visit_count"),
    ).filter(
        UserVisit.visited_at >= cutoff
    ).group_by(
        func.date_trunc('hour', UserVisit.visited_at)
    ).order_by(
        func.date_trunc('hour', UserVisit.visited_at).desc()
    ).limit(24).all()

    # 상위 브라우저
    browser_stats = db.query(
        UserVisit.user_agent,
        func.count(UserVisit.id).label("visit_count"),
    ).filter(
        UserVisit.visited_at >= cutoff
    ).group_by(
        UserVisit.user_agent
    ).order_by(
        func.count(UserVisit.id).desc()
    ).limit(10).all()

    # 최근 방문자
    recent_visitors = db.query(
        UserVisit.ip_address,
        UserVisit.page,
        UserVisit.visited_at,
        func.count(UserVisit.id).over(
            partition_by=UserVisit.ip_address
        ).label("visit_count"),
    ).filter(
        UserVisit.visited_at >= cutoff
    ).distinct(
        UserVisit.ip_address
    ).order_by(
        UserVisit.ip_address,
        UserVisit.visited_at.desc()
    ).limit(10).all()

    total_unique_visitors = db.query(
        func.count(func.distinct(UserVisit.ip_address))
    ).filter(
        UserVisit.visited_at >= cutoff
    ).scalar() or 0

    total_visits = db.query(
        func.count(UserVisit.id)
    ).filter(
        UserVisit.visited_at >= cutoff
    ).scalar() or 0

    return {
        "total_unique_visitors": total_unique_visitors,
        "total_visits": total_visits,
        "daily_visitors": [
            {
                "date": stat[0].isoformat() if stat[0] else "",
                "unique_visitors": stat[1],
                "total_visits": stat[2],
            }
            for stat in daily_visitors
        ],
        "page_stats": [
            {
                "page": stat[0],
                "visit_count": stat[1],
                "unique_visitors": stat[2],
            }
            for stat in page_stats
        ],
        "hourly_stats": [
            {
                "hour": stat[0].isoformat() if stat[0] else "",
                "visit_count": stat[1],
            }
            for stat in hourly_stats
        ],
        "browser_stats": [
            {
                "user_agent": stat[0][:100],  # 길이 제한
                "visit_count": stat[1],
            }
            for stat in browser_stats
        ],
        "recent_visitors": [
            {
                "ip_address": stat[0],
                "page": stat[1],
                "visited_at": stat[2].isoformat() if stat[2] else "",
                "visit_count": stat[3],
            }
            for stat in recent_visitors
        ],
    }


@router.post("/csv-upload")
async def upload_csv(
    password: str = Query("", description="관리자 비밀번호"),
    data_type: str = Query("office", description="office 또는 agent"),
    sync_mode: str = Query("upsert", description="update(기존만) 또는 upsert(추가포함) 또는 sync(완전동기)"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    verify_admin(password)

    if data_type not in ["office", "agent"]:
        raise HTTPException(status_code=400, detail="data_type은 office 또는 agent여야 합니다")

    if sync_mode not in ["update", "upsert", "sync"]:
        raise HTTPException(status_code=400, detail="sync_mode는 update, upsert, sync 중 하나여야 합니다")

    try:
        contents = await file.read()

        # 여러 인코딩 시도
        text = None
        for encoding in ['utf-8', 'cp949', 'euc-kr', 'latin-1']:
            try:
                text = contents.decode(encoding)
                break
            except:
                continue

        if text is None:
            raise HTTPException(status_code=400, detail="파일 인코딩을 인식할 수 없습니다. UTF-8, CP949, EUC-KR 중 하나를 사용해주세요")

        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)

        if data_type == "office":
            return handle_office_upload(db, rows, sync_mode)
        else:  # agent
            return handle_agent_upload(db, rows, sync_mode)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def handle_office_upload(db: Session, rows: list, sync_mode: str):
    """사무소 CSV 업로드 처리"""
    inserted = 0
    updated = 0
    deleted = 0
    inserted_list = []
    updated_list = []
    deleted_list = []

    # CSV의 등록번호 목록
    csv_reg_numbers = set()

    for row in rows:
        registration_number = row.get("사업자등록번호", "").strip()
        if not registration_number:
            continue

        csv_reg_numbers.add(registration_number)

        office = db.query(OfficeCurrent).filter(
            OfficeCurrent.registration_number == registration_number
        ).first()

        # 모든 가능한 필드 업데이트
        new_data = {
            'office_name': row.get("상호명", "").strip(),
            'representative_name': row.get("대표자명", "").strip() or None,
            'address': row.get("주소", "").strip() or None,
            'road_address': row.get("도로명주소", "").strip() or None,
            'phone_number': row.get("전화번호", "").strip() or None,
            'sido': row.get("시도", "").strip() or None,
            'sigungu': row.get("시군구", "").strip() or None,
            'status': row.get("영업상태", "").strip() or None,
        }

        # registered_date 파싱
        reg_date_str = row.get("등록일자", "").strip()
        if reg_date_str:
            try:
                new_data['registered_date'] = datetime.strptime(reg_date_str, "%Y-%m-%d").date()
            except:
                pass

        if office:
            # UPDATE 모드: 기존 데이터만 업데이트
            changes = {}
            for key, value in new_data.items():
                if value is not None and getattr(office, key, None) != value:
                    changes[key] = {"before": getattr(office, key, None), "after": value}
                    setattr(office, key, value)

            if changes:
                updated += 1
                updated_list.append({
                    "registration_number": registration_number,
                    "office_name": office.office_name,
                    "changes": changes
                })
        else:
            # UPSERT/SYNC 모드: 새 데이터 추가
            if sync_mode in ["upsert", "sync"]:
                new_office = OfficeCurrent(
                    registration_number=registration_number,
                    **new_data
                )
                db.add(new_office)
                inserted += 1
                inserted_list.append({
                    "registration_number": registration_number,
                    "office_name": new_data.get('office_name', ''),
                })

    # SYNC 모드: CSV에 없는 데이터는 삭제
    if sync_mode == "sync":
        offices_to_delete = db.query(OfficeCurrent).filter(
            ~OfficeCurrent.registration_number.in_(csv_reg_numbers)
        ).all()
        deleted = len(offices_to_delete)
        for office in offices_to_delete:
            deleted_list.append({
                "registration_number": office.registration_number,
                "office_name": office.office_name,
            })
            db.delete(office)

    db.commit()

    # DataSyncLog 업데이트
    sync_log = db.query(DataSyncLog).filter(DataSyncLog.data_type == "office").first()
    if not sync_log:
        sync_log = DataSyncLog(data_type="office")
        db.add(sync_log)
    sync_log.last_sync_date = date.today()
    sync_log.last_sync_time = datetime.utcnow()
    sync_log.record_count = db.query(func.count(OfficeCurrent.id)).scalar() or 0
    db.commit()

    message = f"사무소 데이터 동기화 완료 - 신규: {inserted}, 업데이트: {updated}"
    if sync_mode == "sync":
        message += f", 삭제: {deleted}"

    return {
        "message": message,
        "inserted": inserted,
        "updated": updated,
        "deleted": deleted,
        "inserted_list": inserted_list,
        "updated_list": updated_list,
        "deleted_list": deleted_list,
    }


def handle_agent_upload(db: Session, rows: list, sync_mode: str):
    """중개업자 CSV 업로드 처리"""
    inserted = 0
    updated = 0
    deleted = 0
    inserted_list = []
    updated_list = []
    deleted_list = []

    # CSV의 (name, office_reg) 조합 목록
    csv_agent_keys = set()

    for row in rows:
        agent_name = row.get("성명", "").strip()
        office_reg = row.get("중개사무소등록번호", "").strip()
        if not agent_name or not office_reg:
            continue

        csv_agent_keys.add((agent_name, office_reg))

        agent = db.query(AgentCurrent).filter(
            AgentCurrent.name == agent_name,
            AgentCurrent.office_registration_number == office_reg,
        ).first()

        # 모든 가능한 필드 업데이트
        new_data = {
            'role': row.get("직위", "").strip() or None,
            'office_name': row.get("중개사무소명", "").strip() or None,
            'license_number': row.get("중개사자격번호", "").strip() or None,
            'agent_type': row.get("중개사/보조원구분", "").strip() or None,
            'status': row.get("상태", "").strip() or None,
            'sido': row.get("시도", "").strip() or None,
            'sigungu': row.get("시군구", "").strip() or None,
            'address': row.get("주소", "").strip() or None,
        }

        # license_date 파싱
        lic_date_str = row.get("자격취득년도", "").strip()
        if lic_date_str:
            try:
                # "YYYY-MM-DD" 또는 "YYYY" 형식 처리
                if len(lic_date_str) == 4:  # 연도만 있으면 01-01로
                    new_data['license_date'] = datetime.strptime(f"{lic_date_str}-01-01", "%Y-%m-%d").date()
                else:
                    new_data['license_date'] = datetime.strptime(lic_date_str, "%Y-%m-%d").date()
            except:
                pass

        if agent:
            # UPDATE 모드: 기존 데이터만 업데이트
            changes = {}
            for key, value in new_data.items():
                if value is not None and getattr(agent, key, None) != value:
                    changes[key] = {"before": getattr(agent, key, None), "after": value}
                    setattr(agent, key, value)

            if changes:
                updated += 1
                updated_list.append({
                    "name": agent.name,
                    "office_name": agent.office_name,
                    "changes": changes
                })
        else:
            # UPSERT/SYNC 모드: 새 데이터 추가
            if sync_mode in ["upsert", "sync"]:
                new_agent = AgentCurrent(
                    name=agent_name,
                    office_registration_number=office_reg,
                    **new_data
                )
                db.add(new_agent)
                inserted += 1
                inserted_list.append({
                    "name": agent_name,
                    "office_name": new_data.get('office_name', ''),
                })

    # SYNC 모드: CSV에 없는 데이터는 삭제
    if sync_mode == "sync":
        agents_to_delete = db.query(AgentCurrent).filter(
            ~db.query(AgentCurrent).filter(
                AgentCurrent.name.in_([k[0] for k in csv_agent_keys]),
                AgentCurrent.office_registration_number.in_([k[1] for k in csv_agent_keys]),
            ).exists()
        ).all()
        deleted = len(agents_to_delete)
        for agent in agents_to_delete:
            deleted_list.append({
                "name": agent.name,
                "office_name": agent.office_name,
            })
            db.delete(agent)

    db.commit()

    # DataSyncLog 업데이트
    sync_log = db.query(DataSyncLog).filter(DataSyncLog.data_type == "agent").first()
    if not sync_log:
        sync_log = DataSyncLog(data_type="agent")
        db.add(sync_log)
    sync_log.last_sync_date = date.today()
    sync_log.last_sync_time = datetime.utcnow()
    sync_log.record_count = db.query(func.count(AgentCurrent.id)).scalar() or 0
    db.commit()

    message = f"중개업자 데이터 동기화 완료 - 신규: {inserted}, 업데이트: {updated}"
    if sync_mode == "sync":
        message += f", 삭제: {deleted}"

    return {
        "message": message,
        "inserted": inserted,
        "updated": updated,
        "deleted": deleted,
        "inserted_list": inserted_list,
        "updated_list": updated_list,
        "deleted_list": deleted_list,
    }
