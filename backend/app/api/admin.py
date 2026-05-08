"""
관리자 API
"""
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import date, timedelta, datetime
from app.db.database import get_db
from app.db.models import OfficeCurrent, AgentCurrent, DataSyncLog, DailySyncResult, APIRequestLog, UserVisit
from app.db import schemas
import csv
import io
import re

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
)

ADMIN_PASSWORD = "admin123"
CHUNK = 5000
DELETE_SAFETY_THRESHOLD = 0.20  # 20% 이상 삭제 시 경고


def verify_admin(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="인증 실패")


@router.get("/stats")
async def get_stats(
    password: str = Query(""),
    db: Session = Depends(get_db),
):
    verify_admin(password)
    total_offices = db.query(func.count(OfficeCurrent.id)).scalar() or 0
    active_offices = db.query(func.count(OfficeCurrent.id)).filter(OfficeCurrent.status == "영업중").scalar() or 0
    total_agents = db.query(func.count(AgentCurrent.id)).scalar() or 0
    most_viewed_offices = db.query(OfficeCurrent).order_by(desc(OfficeCurrent.view_count)).limit(10).all()
    most_viewed_agents = db.query(AgentCurrent).order_by(desc(AgentCurrent.view_count)).limit(10).all()
    return {
        "total_offices": total_offices,
        "active_offices": active_offices,
        "total_agents": total_agents,
        "most_viewed_offices": [
            {"registration_number": o.registration_number, "office_name": o.office_name, "view_count": o.view_count or 0}
            for o in most_viewed_offices
        ],
        "most_viewed_agents": [
            {"id": a.id, "name": a.name, "office_name": a.office_name, "view_count": a.view_count or 0}
            for a in most_viewed_agents
        ],
    }


@router.post("/reset-views")
async def reset_views(password: str = Query(""), db: Session = Depends(get_db)):
    verify_admin(password)
    db.query(OfficeCurrent).update({OfficeCurrent.view_count: 0})
    db.query(AgentCurrent).update({AgentCurrent.view_count: 0})
    db.commit()
    return {"message": "조회수가 초기화되었습니다"}


@router.get("/sync-status")
async def sync_status(password: str = Query(""), db: Session = Depends(get_db)):
    verify_admin(password)
    logs = db.query(DataSyncLog).all()
    return {
        "syncs": [
            {"data_type": log.data_type, "last_sync_date": log.last_sync_date,
             "last_sync_time": log.last_sync_time, "record_count": log.record_count}
            for log in logs
        ]
    }


@router.get("/api-stats")
async def api_stats(
    password: str = Query(""),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
):
    verify_admin(password)
    cutoff = date.today() - timedelta(days=days)
    total_requests = db.query(func.count(APIRequestLog.id)).filter(APIRequestLog.created_at >= cutoff).scalar() or 0
    avg_response_time = db.query(func.avg(APIRequestLog.response_time_ms)).filter(APIRequestLog.created_at >= cutoff).scalar() or 0
    error_count = db.query(func.count(APIRequestLog.id)).filter(APIRequestLog.status_code >= 400, APIRequestLog.created_at >= cutoff).scalar() or 0
    endpoint_stats = db.query(
        APIRequestLog.endpoint, APIRequestLog.method,
        func.count(APIRequestLog.id).label("count"),
        func.avg(APIRequestLog.response_time_ms).label("avg_time"),
    ).filter(APIRequestLog.created_at >= cutoff).group_by(
        APIRequestLog.endpoint, APIRequestLog.method
    ).order_by(desc(func.count(APIRequestLog.id))).limit(20).all()
    recent_errors = db.query(APIRequestLog).filter(
        APIRequestLog.status_code >= 400, APIRequestLog.created_at >= cutoff
    ).order_by(desc(APIRequestLog.created_at)).limit(10).all()
    return {
        "total_requests": total_requests,
        "avg_response_time": round(avg_response_time, 2) if avg_response_time else 0,
        "error_count": error_count,
        "endpoint_stats": [
            {"endpoint": s[0], "method": s[1], "count": s[2], "avg_time": round(s[3], 2) if s[3] else 0}
            for s in endpoint_stats
        ],
        "recent_errors": [
            {"endpoint": l.endpoint, "method": l.method, "status_code": l.status_code,
             "response_time_ms": l.response_time_ms, "created_at": l.created_at}
            for l in recent_errors
        ],
    }


@router.get("/user-stats")
async def user_stats(
    password: str = Query(""),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
):
    verify_admin(password)
    cutoff = date.today() - timedelta(days=days)
    daily_visitors = db.query(
        func.date(UserVisit.visited_at).label("visit_date"),
        func.count(func.distinct(UserVisit.ip_address)).label("unique_visitors"),
        func.count(UserVisit.id).label("total_visits"),
    ).filter(UserVisit.visited_at >= cutoff).group_by(func.date(UserVisit.visited_at)).order_by(func.date(UserVisit.visited_at).desc()).all()
    page_stats = db.query(
        UserVisit.page,
        func.count(UserVisit.id).label("visit_count"),
        func.count(func.distinct(UserVisit.ip_address)).label("unique_visitors"),
    ).filter(UserVisit.visited_at >= cutoff).group_by(UserVisit.page).order_by(func.count(UserVisit.id).desc()).limit(20).all()
    hourly_stats = db.query(
        func.date_trunc('hour', UserVisit.visited_at).label("visit_hour"),
        func.count(UserVisit.id).label("visit_count"),
    ).filter(UserVisit.visited_at >= cutoff).group_by(func.date_trunc('hour', UserVisit.visited_at)).order_by(func.date_trunc('hour', UserVisit.visited_at).desc()).limit(24).all()
    browser_stats = db.query(
        UserVisit.user_agent, func.count(UserVisit.id).label("visit_count"),
    ).filter(UserVisit.visited_at >= cutoff).group_by(UserVisit.user_agent).order_by(func.count(UserVisit.id).desc()).limit(10).all()
    recent_visitors = db.query(
        UserVisit.ip_address, UserVisit.page, UserVisit.visited_at,
        func.count(UserVisit.id).over(partition_by=UserVisit.ip_address).label("visit_count"),
    ).filter(UserVisit.visited_at >= cutoff).distinct(UserVisit.ip_address).order_by(
        UserVisit.ip_address, UserVisit.visited_at.desc()
    ).limit(10).all()
    total_unique_visitors = db.query(func.count(func.distinct(UserVisit.ip_address))).filter(UserVisit.visited_at >= cutoff).scalar() or 0
    total_visits = db.query(func.count(UserVisit.id)).filter(UserVisit.visited_at >= cutoff).scalar() or 0
    return {
        "total_unique_visitors": total_unique_visitors,
        "total_visits": total_visits,
        "daily_visitors": [{"date": s[0].isoformat() if s[0] else "", "unique_visitors": s[1], "total_visits": s[2]} for s in daily_visitors],
        "page_stats": [{"page": s[0], "visit_count": s[1], "unique_visitors": s[2]} for s in page_stats],
        "hourly_stats": [{"hour": s[0].isoformat() if s[0] else "", "visit_count": s[1]} for s in hourly_stats],
        "browser_stats": [{"user_agent": s[0][:100], "visit_count": s[1]} for s in browser_stats],
        "recent_visitors": [
            {"ip_address": s[0], "page": s[1], "visited_at": s[2].isoformat() if s[2] else "", "visit_count": s[3]}
            for s in recent_visitors
        ],
    }


@router.post("/csv-upload")
async def upload_csv(
    password: str = Query(""),
    data_type: str = Query("office"),
    dry_run: bool = Query(False, description="True: 미리보기만 / False: 실제 적용"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    verify_admin(password)

    if data_type not in ["office", "agent"]:
        raise HTTPException(status_code=400, detail="data_type은 office 또는 agent여야 합니다")

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

        rows = list(csv.DictReader(io.StringIO(text)))
        if not rows:
            raise HTTPException(status_code=400, detail="CSV 파일이 비어 있습니다")

        if data_type == "office":
            return handle_office_upload(db, rows, dry_run)
        else:
            return handle_agent_upload(db, rows, dry_run)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── 사무소 업로드 ────────────────────────────────────────────────────────────

def handle_office_upload(db: Session, rows: list, dry_run: bool):
    # 1. CSV 파싱 (항상 sync 모드)
    parsed: list[tuple[str, dict]] = []
    csv_reg_numbers: set[str] = set()
    skipped_excel = 0
    for row in rows:
        reg = row.get("등록번호", "").strip()
        if not reg:
            continue
        if re.search(r'[Ee][+\-]\d+', reg):
            skipped_excel += 1
            continue
        if re.search(r'[A-Za-z]', reg):
            skipped_excel += 1
            continue
        if reg in csv_reg_numbers:
            continue
        csv_reg_numbers.add(reg)
        legal_dong = row.get("법정동명", "").strip()
        parts = legal_dong.split()
        sido = parts[0] if parts else None
        sigungu = parts[1] if len(parts) > 1 else None
        new_data = {
            'office_name': row.get("사업자상호", "").strip() or None,
            'representative_name': row.get("중개업자명", "").strip() or None,
            'address': row.get("지번주소", "").strip() or None,
            'road_address': row.get("도로명주소", "").strip() or None,
            'phone_number': row.get("전화번호", "").strip() or None,
            'sido': sido,
            'sigungu': sigungu,
            'status': row.get("상태구분명", "").strip() or None,
        }
        reg_date = _parse_date(row.get("등록일자", ""))
        if reg_date:
            new_data['registered_date'] = reg_date
        parsed.append((reg, new_data))

    if not parsed and not skipped_excel:
        return _empty_result("처리할 데이터가 없습니다", dry_run)

    # 2. 기존 레코드 배치 조회
    existing: dict[str, OfficeCurrent] = {}
    for i in range(0, len(csv_reg_numbers), CHUNK):
        chunk = list(csv_reg_numbers)[i:i + CHUNK]
        for o in db.query(OfficeCurrent).filter(OfficeCurrent.registration_number.in_(chunk)).all():
            existing[o.registration_number] = o

    # 3. 차이 계산
    to_insert_maps: list[dict] = []
    to_update_maps: list[dict] = []
    inserted_list: list[dict] = []
    updated_list: list[dict] = []

    for reg, new_data in parsed:
        office = existing.get(reg)
        if office:
            changes = {}
            update_fields: dict = {'id': office.id}
            for key, value in new_data.items():
                if value is not None and getattr(office, key, None) != value:
                    changes[key] = {"before": _json_safe(getattr(office, key)), "after": _json_safe(value)}
                    update_fields[key] = value
            if changes:
                to_update_maps.append(update_fields)
                updated_list.append({"registration_number": reg, "office_name": office.office_name,
                                     "sido": office.sido, "sigungu": office.sigungu, "changes": changes})
        else:
            to_insert_maps.append({"registration_number": reg, **new_data})
            inserted_list.append({"registration_number": reg, "office_name": new_data.get('office_name', ''),
                                   "sido": new_data.get('sido'), "sigungu": new_data.get('sigungu')})

    # 4. 폐업 대상 계산 (CSV에 없는 기존 레코드)
    to_delete_rows = db.query(
        OfficeCurrent.registration_number, OfficeCurrent.office_name,
        OfficeCurrent.sido, OfficeCurrent.sigungu
    ).filter(~OfficeCurrent.registration_number.in_(csv_reg_numbers)).all()
    deleted_list = [{"registration_number": r[0], "office_name": r[1], "sido": r[2], "sigungu": r[3]}
                    for r in to_delete_rows]

    inserted = len(to_insert_maps)
    updated = len(to_update_maps)
    deleted = len(deleted_list)

    # 5. 안전 검사
    safety_warning = _check_delete_safety(db, OfficeCurrent, deleted, "사무소")
    excel_warning = f"⚠️ Excel 과학적 표기법 등록번호 {skipped_excel:,}건 제외됨" if skipped_excel else None

    if dry_run:
        result = _preview_result("사무소", inserted, updated, deleted, safety_warning,
                                 inserted_list, updated_list, deleted_list)
        if excel_warning:
            result["excel_warning"] = excel_warning
        return result

    # 6. 실제 적용
    if to_insert_maps:
        db.bulk_insert_mappings(OfficeCurrent, to_insert_maps)
    if to_update_maps:
        db.bulk_update_mappings(OfficeCurrent, to_update_maps)
    if deleted_list:
        to_delete_regs = [r["registration_number"] for r in deleted_list]
        for i in range(0, len(to_delete_regs), CHUNK):
            chunk = to_delete_regs[i:i + CHUNK]
            db.query(AgentCurrent).filter(AgentCurrent.office_registration_number.in_(chunk)).delete(synchronize_session=False)
        for i in range(0, len(to_delete_regs), CHUNK):
            chunk = to_delete_regs[i:i + CHUNK]
            db.query(OfficeCurrent).filter(OfficeCurrent.registration_number.in_(chunk)).delete(synchronize_session=False)

    db.commit()
    _update_sync_log(db, "office")
    _save_daily_sync_result(db, inserted_list, updated_list, deleted_list)

    message = f"사무소 업데이트 완료 — 신규 {inserted:,}개 · 수정 {updated:,}개 · 폐업 {deleted:,}개"
    if skipped_excel:
        message += f" (Excel 변환 오류 {skipped_excel:,}건 제외)"
    return {
        "dry_run": False, "message": message,
        "inserted": inserted, "updated": updated, "deleted": deleted,
        "safety_warning": safety_warning,
        "inserted_list": inserted_list, "updated_list": updated_list, "deleted_list": deleted_list,
    }


# ── 중개업자 업로드 ──────────────────────────────────────────────────────────

def handle_agent_upload(db: Session, rows: list, dry_run: bool):
    # 1. CSV 파싱 (항상 sync 모드)
    parsed: list[tuple[str, str, dict]] = []
    csv_agent_keys: set[tuple[str, str]] = set()
    skipped_excel = 0
    for row in rows:
        # 국토부 CSV 컬럼명 기준
        name = row.get("중개업자명", "").strip()
        office_reg = row.get("등록번호", "").strip()
        if not name or not office_reg:
            continue
        # Excel 과학적 표기법 스킵
        if re.search(r'[Ee][+\-]\d+', office_reg):
            skipped_excel += 1
            continue
        if re.search(r'[A-Za-z]', office_reg):
            skipped_excel += 1
            continue
        # 중복 행 스킵
        if (name, office_reg) in csv_agent_keys:
            continue
        csv_agent_keys.add((name, office_reg))
        # 법정동명에서 시도/시군구 파싱
        legal_dong = row.get("법정동명", "").strip()
        parts = legal_dong.split()
        sido = parts[0] if parts else None
        sigungu = parts[1] if len(parts) > 1 else None
        new_data = {
            'role': row.get("직위구분명", "").strip() or None,
            'office_name': row.get("사업자상호", "").strip() or None,
            'license_number': row.get("자격증번호", "").strip() or None,
            'agent_type': row.get("중개업자종별명", "").strip() or None,
            'sido': sido,
            'sigungu': sigungu,
        }
        lic_date = _parse_date(row.get("자격증취득일", ""))
        if lic_date:
            new_data['license_date'] = lic_date
        parsed.append((name, office_reg, new_data))

    if not parsed:
        return _empty_result("처리할 데이터가 없습니다", dry_run)

    # 2. 유효 사무소 등록번호 확인 (FK 오류 방지)
    csv_office_regs = {office_reg for _, office_reg, _ in parsed}
    valid_office_regs: set[str] = set()
    for i in range(0, len(csv_office_regs), CHUNK):
        chunk = list(csv_office_regs)[i:i + CHUNK]
        for r in db.query(OfficeCurrent.registration_number).filter(OfficeCurrent.registration_number.in_(chunk)).all():
            valid_office_regs.add(r[0])

    # 3. CSV 이름 기준 기존 레코드 배치 조회
    csv_names = list({name for name, _, _ in parsed})
    existing: dict[tuple[str, str], AgentCurrent] = {}
    for i in range(0, len(csv_names), CHUNK):
        chunk = csv_names[i:i + CHUNK]
        for a in db.query(AgentCurrent).filter(AgentCurrent.name.in_(chunk)).all():
            existing[(a.name, a.office_registration_number)] = a

    # 4. 차이 계산
    to_insert_maps: list[dict] = []
    to_update_maps: list[dict] = []
    inserted_list: list[dict] = []
    updated_list: list[dict] = []
    skipped = 0

    for name, office_reg, new_data in parsed:
        agent = existing.get((name, office_reg))
        if agent:
            changes = {}
            update_fields: dict = {'id': agent.id}
            for key, value in new_data.items():
                if value is not None and getattr(agent, key, None) != value:
                    changes[key] = {"before": _json_safe(getattr(agent, key)), "after": _json_safe(value)}
                    update_fields[key] = value
            if changes:
                to_update_maps.append(update_fields)
                updated_list.append({"name": name, "office_name": agent.office_name, "changes": changes})
        else:
            if office_reg not in valid_office_regs:
                skipped += 1
                continue
            to_insert_maps.append({"name": name, "office_registration_number": office_reg, **new_data})
            inserted_list.append({"name": name, "office_name": new_data.get('office_name', '')})

    # 5. 삭제 대상 계산
    all_db = db.query(AgentCurrent.id, AgentCurrent.name, AgentCurrent.office_registration_number, AgentCurrent.office_name).all()
    to_delete = [(r[0], r[2], r[3]) for r in all_db if (r[1], r[2]) not in csv_agent_keys]
    deleted_list = [{"name": r[1], "office_name": r[2]} for r in all_db if (r[1], r[2]) not in csv_agent_keys]

    inserted = len(to_insert_maps)
    updated = len(to_update_maps)
    deleted = len(deleted_list)

    # 6. 안전 검사
    safety_warning = _check_delete_safety(db, AgentCurrent, deleted, "중개업자")
    excel_warning = f"⚠️ Excel 과학적 표기법으로 변환된 등록번호 {skipped_excel:,}건은 처리 불가로 제외됐습니다." if skipped_excel else None

    if dry_run:
        result = _preview_result("중개업자", inserted, updated, deleted, safety_warning,
                                 inserted_list, updated_list, deleted_list)
        if skipped:
            result["message"] += f" (사무소 미등록 {skipped:,}건 제외)"
        if excel_warning:
            result["excel_warning"] = excel_warning
        return result

    # 7. 실제 적용
    if to_insert_maps:
        db.bulk_insert_mappings(AgentCurrent, to_insert_maps)
    if to_update_maps:
        db.bulk_update_mappings(AgentCurrent, to_update_maps)
    if deleted_list:
        delete_ids = [r[0] for r in to_delete]
        for i in range(0, len(delete_ids), CHUNK):
            chunk = delete_ids[i:i + CHUNK]
            db.query(AgentCurrent).filter(AgentCurrent.id.in_(chunk)).delete(synchronize_session=False)

    db.commit()
    _update_sync_log(db, "agent")

    message = f"중개업자 업데이트 완료 — 신규 {inserted:,}개 · 수정 {updated:,}개 · 삭제 {deleted:,}개"
    if skipped:
        message += f" (사무소 미등록 {skipped:,}건 제외)"
    if skipped_excel:
        message += f" (Excel 변환 오류 {skipped_excel:,}건 제외)"
    return {
        "dry_run": False, "message": message,
        "inserted": inserted, "updated": updated, "deleted": deleted,
        "safety_warning": safety_warning,
        "inserted_list": inserted_list, "updated_list": updated_list, "deleted_list": deleted_list,
    }


# ── 헬퍼 ─────────────────────────────────────────────────────────────────────

def _json_safe(val):
    from datetime import date as date_type
    if isinstance(val, date_type):
        return val.isoformat()
    return val

def _save_daily_sync_result(db: Session, inserted_list: list, updated_list: list, deleted_list: list):
    today = date.today()
    existing = db.query(DailySyncResult).filter(DailySyncResult.sync_date == today).first()
    if existing:
        db.delete(existing)
        db.flush()
    result = DailySyncResult(
        sync_date=today,
        inserted=len(inserted_list),
        updated=len(updated_list),
        deleted=len(deleted_list),
        new_list=inserted_list,
        closed_list=deleted_list,
        updated_list=updated_list[:200],
    )
    db.add(result)
    db.commit()


def _parse_date(date_str: str, fmt: str = "%Y-%m-%d"):
    try:
        return datetime.strptime(date_str.strip(), fmt).date()
    except Exception:
        return None


def _check_delete_safety(db: Session, model, deleted: int, label: str) -> str | None:
    if deleted == 0:
        return None
    total = db.query(func.count(model.id)).scalar() or 1
    ratio = deleted / total
    if ratio > DELETE_SAFETY_THRESHOLD:
        return (f"⚠️ 전체 {label}의 {ratio:.1%}({deleted:,}개)가 삭제됩니다. "
                f"CSV가 전체 데이터를 포함하는지 확인하세요.")
    return None


def _preview_result(label, inserted, updated, deleted, safety_warning,
                    inserted_list, updated_list, deleted_list) -> dict:
    return {
        "dry_run": True,
        "message": f"[미리보기] {label} — 신규 {inserted:,}개 · 수정 {updated:,}개 · 삭제 {deleted:,}개",
        "inserted": inserted, "updated": updated, "deleted": deleted,
        "safety_warning": safety_warning,
        "inserted_list": inserted_list[:50],
        "updated_list": updated_list[:50],
        "deleted_list": deleted_list[:50],
    }


def _empty_result(message: str, dry_run: bool) -> dict:
    return {
        "dry_run": dry_run, "message": message,
        "inserted": 0, "updated": 0, "deleted": 0,
        "safety_warning": None,
        "inserted_list": [], "updated_list": [], "deleted_list": [],
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
