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
CHUNK = 5000  # IN 절 최대 크기


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
                "user_agent": stat[0][:100],
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
    sync_mode: str = Query("upsert", description="update / upsert / sync"),
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

        text = None
        for encoding in ['utf-8', 'cp949', 'euc-kr', 'latin-1']:
            try:
                text = contents.decode(encoding)
                break
            except Exception:
                continue

        if text is None:
            raise HTTPException(status_code=400, detail="파일 인코딩을 인식할 수 없습니다")

        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)

        if not rows:
            raise HTTPException(status_code=400, detail="CSV 파일이 비어 있습니다")

        if data_type == "office":
            return handle_office_upload(db, rows, sync_mode)
        else:
            return handle_agent_upload(db, rows, sync_mode)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def _parse_date(date_str: str, fmt: str = "%Y-%m-%d"):
    try:
        return datetime.strptime(date_str.strip(), fmt).date()
    except Exception:
        return None


def handle_office_upload(db: Session, rows: list, sync_mode: str):
    inserted = 0
    updated = 0
    deleted = 0
    inserted_list = []
    updated_list = []
    deleted_list = []

    # 1. CSV 전체 파싱
    parsed = []
    csv_reg_numbers = set()
    for row in rows:
        reg = row.get("사업자등록번호", "").strip()
        if not reg:
            continue
        csv_reg_numbers.add(reg)
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
        reg_date = _parse_date(row.get("등록일자", ""))
        if reg_date:
            new_data['registered_date'] = reg_date
        parsed.append((reg, new_data))

    if not parsed:
        return _empty_result("처리할 데이터가 없습니다")

    # 2. CSV에 있는 등록번호만 배치 조회 (N+1 → ceil(N/5000) 쿼리)
    existing_offices: dict[str, OfficeCurrent] = {}
    reg_list = list(csv_reg_numbers)
    for i in range(0, len(reg_list), CHUNK):
        chunk = reg_list[i:i + CHUNK]
        for o in db.query(OfficeCurrent).filter(OfficeCurrent.registration_number.in_(chunk)).all():
            existing_offices[o.registration_number] = o

    # 3. 처리
    to_insert = []
    for reg, new_data in parsed:
        office = existing_offices.get(reg)
        if office:
            changes = {}
            for key, value in new_data.items():
                if value is not None and getattr(office, key, None) != value:
                    changes[key] = {"before": getattr(office, key), "after": value}
                    setattr(office, key, value)
            if changes:
                updated += 1
                updated_list.append({
                    "registration_number": reg,
                    "office_name": office.office_name,
                    "changes": changes,
                })
        elif sync_mode in ["upsert", "sync"]:
            to_insert.append(OfficeCurrent(registration_number=reg, **new_data))
            inserted += 1
            inserted_list.append({
                "registration_number": reg,
                "office_name": new_data.get('office_name', ''),
            })

    # 4. 배치 INSERT
    if to_insert:
        db.bulk_save_objects(to_insert)

    # 5. sync 모드: CSV에 없는 사무소 삭제
    if sync_mode == "sync" and csv_reg_numbers:
        # 삭제 대상 정보 수집
        to_delete_rows = db.query(
            OfficeCurrent.registration_number, OfficeCurrent.office_name
        ).filter(
            ~OfficeCurrent.registration_number.in_(csv_reg_numbers)
        ).all()
        deleted = len(to_delete_rows)
        deleted_list = [{"registration_number": r[0], "office_name": r[1]} for r in to_delete_rows]

        if deleted > 0:
            to_delete_regs = [r[0] for r in to_delete_rows]
            # 연관 agent 먼저 삭제 (FK 제약 위반 방지)
            for i in range(0, len(to_delete_regs), CHUNK):
                chunk = to_delete_regs[i:i + CHUNK]
                db.query(AgentCurrent).filter(
                    AgentCurrent.office_registration_number.in_(chunk)
                ).delete(synchronize_session=False)
            # 사무소 삭제
            for i in range(0, len(to_delete_regs), CHUNK):
                chunk = to_delete_regs[i:i + CHUNK]
                db.query(OfficeCurrent).filter(
                    OfficeCurrent.registration_number.in_(chunk)
                ).delete(synchronize_session=False)

    db.commit()
    _update_sync_log(db, "office")

    message = f"사무소 동기화 완료 - 신규: {inserted}, 업데이트: {updated}"
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
    inserted = 0
    updated = 0
    deleted = 0
    inserted_list = []
    updated_list = []
    deleted_list = []

    # 1. CSV 전체 파싱
    parsed = []
    csv_agent_keys: set[tuple[str, str]] = set()  # (name, office_reg)
    for row in rows:
        name = row.get("성명", "").strip()
        office_reg = row.get("중개사무소등록번호", "").strip()
        if not name or not office_reg:
            continue
        csv_agent_keys.add((name, office_reg))
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
        lic_date_str = row.get("자격취득년도", "").strip()
        if lic_date_str:
            if len(lic_date_str) == 4:
                lic_date = _parse_date(f"{lic_date_str}-01-01")
            else:
                lic_date = _parse_date(lic_date_str)
            if lic_date:
                new_data['license_date'] = lic_date
        parsed.append((name, office_reg, new_data))

    if not parsed:
        return _empty_result("처리할 데이터가 없습니다")

    # 2. 유효한 사무소 등록번호 확인 (Fix #3: FK 오류 방지)
    csv_office_regs = {office_reg for _, office_reg, _ in parsed}
    valid_office_regs: set[str] = set()
    office_reg_list = list(csv_office_regs)
    for i in range(0, len(office_reg_list), CHUNK):
        chunk = office_reg_list[i:i + CHUNK]
        rows_result = db.query(OfficeCurrent.registration_number).filter(
            OfficeCurrent.registration_number.in_(chunk)
        ).all()
        valid_office_regs.update(r[0] for r in rows_result)

    # 3. CSV에 있는 (name, office_reg) 기준으로 기존 agent 배치 조회
    csv_names = list({name for name, _, _ in parsed})
    existing_agents: dict[tuple[str, str], AgentCurrent] = {}
    for i in range(0, len(csv_names), CHUNK):
        chunk = csv_names[i:i + CHUNK]
        for a in db.query(AgentCurrent).filter(AgentCurrent.name.in_(chunk)).all():
            existing_agents[(a.name, a.office_registration_number)] = a

    # 4. 처리
    to_insert = []
    skipped = 0
    for name, office_reg, new_data in parsed:
        agent = existing_agents.get((name, office_reg))
        if agent:
            changes = {}
            for key, value in new_data.items():
                if value is not None and getattr(agent, key, None) != value:
                    changes[key] = {"before": getattr(agent, key), "after": value}
                    setattr(agent, key, value)
            if changes:
                updated += 1
                updated_list.append({
                    "name": name,
                    "office_name": agent.office_name,
                    "changes": changes,
                })
        elif sync_mode in ["upsert", "sync"]:
            # FK 오류 방지: 사무소가 DB에 없으면 건너뜀
            if office_reg not in valid_office_regs:
                skipped += 1
                continue
            to_insert.append(AgentCurrent(
                name=name,
                office_registration_number=office_reg,
                **new_data,
            ))
            inserted += 1
            inserted_list.append({
                "name": name,
                "office_name": new_data.get('office_name', ''),
            })

    # 5. 배치 INSERT
    if to_insert:
        db.bulk_save_objects(to_insert)

    # 6. sync 모드: CSV에 없는 agent 삭제 (Fix #1: 올바른 쿼리)
    if sync_mode == "sync":
        # DB의 모든 (id, name, office_reg) 로드 후 메모리에서 차집합 계산
        all_db_agents = db.query(
            AgentCurrent.id, AgentCurrent.name, AgentCurrent.office_registration_number
        ).all()

        to_delete_ids = [
            row[0] for row in all_db_agents
            if (row[1], row[2]) not in csv_agent_keys
        ]
        deleted = len(to_delete_ids)

        if deleted > 0:
            # 삭제 목록 (응답용)
            for i in range(0, len(to_delete_ids), CHUNK):
                chunk = to_delete_ids[i:i + CHUNK]
                info = db.query(AgentCurrent.name, AgentCurrent.office_name).filter(
                    AgentCurrent.id.in_(chunk)
                ).all()
                deleted_list.extend({"name": r[0], "office_name": r[1]} for r in info)

            # 배치 삭제
            for i in range(0, len(to_delete_ids), CHUNK):
                chunk = to_delete_ids[i:i + CHUNK]
                db.query(AgentCurrent).filter(
                    AgentCurrent.id.in_(chunk)
                ).delete(synchronize_session=False)

    db.commit()
    _update_sync_log(db, "agent")

    message = f"중개업자 동기화 완료 - 신규: {inserted}, 업데이트: {updated}"
    if sync_mode == "sync":
        message += f", 삭제: {deleted}"
    if skipped:
        message += f" (사무소 미등록으로 건너뜀: {skipped}건)"

    return {
        "message": message,
        "inserted": inserted,
        "updated": updated,
        "deleted": deleted,
        "inserted_list": inserted_list,
        "updated_list": updated_list,
        "deleted_list": deleted_list,
    }


def _update_sync_log(db: Session, data_type: str):
    model = OfficeCurrent if data_type == "office" else AgentCurrent
    sync_log = db.query(DataSyncLog).filter(DataSyncLog.data_type == data_type).first()
    if not sync_log:
        sync_log = DataSyncLog(data_type=data_type)
        db.add(sync_log)
    sync_log.last_sync_date = date.today()
    sync_log.last_sync_time = datetime.utcnow()
    sync_log.record_count = db.query(func.count(model.id)).scalar() or 0
    db.commit()


def _empty_result(message: str):
    return {
        "message": message,
        "inserted": 0,
        "updated": 0,
        "deleted": 0,
        "inserted_list": [],
        "updated_list": [],
        "deleted_list": [],
    }
