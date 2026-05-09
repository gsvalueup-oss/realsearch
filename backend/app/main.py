from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import get_settings
from app.db.database import engine, SessionLocal
from app.db.models import APIRequestLog, UserVisit
import time
import hashlib
import uuid

from app.db import models

# DB 테이블 자동 생성
models.Base.metadata.create_all(bind=engine)

# 테스트 데이터 추가
def add_test_data():
    from datetime import date, datetime
    db = SessionLocal()
    try:
        # 기존 데이터 확인
        from sqlalchemy import func
        office_count = db.query(func.count(models.OfficeCurrent.id)).scalar() or 0
        if office_count > 0:
            return  # 이미 데이터가 있으면 스킵

        # 테스트 사무소 데이터
        test_offices = [
            models.OfficeCurrent(
                registration_number="TEST001",
                office_name="강남공인중개소",
                representative_name="김철수",
                legal_dong_code="11110",
                legal_dong_name="서울특별시 강남구",
                address="서울특별시 강남구 강남대로 100",
                road_address="서울특별시 강남구 강남대로 100",
                status="영업중",
                registered_date=date(2020, 1, 15),
                phone_number="02-1234-5678",
                sido="서울특별시",
                sigungu="강남구",
                eupmyeondong="강남동",
                latitude=37.4979,
                longitude=127.0276,
                source_updated_at=date.today(),
                view_count=10
            ),
            models.OfficeCurrent(
                registration_number="TEST002",
                office_name="서초부동산중개",
                representative_name="박영희",
                legal_dong_code="11140",
                legal_dong_name="서울특별시 서초구",
                address="서울특별시 서초구 서초대로 200",
                road_address="서울특별시 서초구 서초대로 200",
                status="영업중",
                registered_date=date(2019, 6, 20),
                phone_number="02-5678-1234",
                sido="서울특별시",
                sigungu="서초구",
                eupmyeondong="서초동",
                latitude=37.4863,
                longitude=127.0121,
                source_updated_at=date.today(),
                view_count=15
            ),
        ]

        for office in test_offices:
            db.add(office)

        # 테스트 중개업자 데이터
        test_agents = [
            models.AgentCurrent(
                name="이민준",
                role="대표",
                office_registration_number="TEST001",
                office_name="강남공인중개소",
                legal_dong_name="서울특별시 강남구",
                address="서울특별시 강남구 강남대로 100",
                sido="서울특별시",
                sigungu="강남구",
                agent_type="중개사",
                license_number="2020-12345",
                license_date=date(2020, 3, 1),
                status="영업중",
                source_updated_at=date.today(),
                view_count=8
            ),
            models.AgentCurrent(
                name="정수현",
                role="소속공인중개사",
                office_registration_number="TEST002",
                office_name="서초부동산중개",
                legal_dong_name="서울특별시 서초구",
                address="서울특별시 서초구 서초대로 200",
                sido="서울특별시",
                sigungu="서초구",
                agent_type="중개사",
                license_number="2019-54321",
                license_date=date(2019, 5, 15),
                status="영업중",
                source_updated_at=date.today(),
                view_count=12
            ),
        ]

        for agent in test_agents:
            db.add(agent)

        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()

add_test_data()

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="부동산중개업 정보 조회 API",
)


class APILoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = int((time.time() - start_time) * 1000)

        # /admin, /health는 로깅 제외
        if not request.url.path.startswith("/admin") and request.url.path != "/health" and request.url.path != "/":
            try:
                db = SessionLocal()

                # API 요청 로그
                log = APIRequestLog(
                    endpoint=request.url.path,
                    method=request.method,
                    status_code=response.status_code,
                    response_time_ms=process_time,
                )
                db.add(log)

                # 사용자 방문 기록 (GET 요청만)
                if request.method == "GET":
                    ip_address = request.client.host if request.client else "unknown"
                    user_agent = request.headers.get("user-agent", "unknown")
                    referer = request.headers.get("referer", "")

                    visit = UserVisit(
                        ip_address=ip_address,
                        user_agent=user_agent,
                        page=request.url.path,
                        referer=referer,
                    )
                    db.add(visit)

                db.commit()
                db.close()
            except Exception:
                pass

        return response


app.add_middleware(APILoggingMiddleware)

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "RealSearch API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api_docs": "/redoc",
    }


# API 라우트 임포트
from app.api import search, offices, agents, rankings, regions, changes, popular, admin, advanced_search, correction_requests

app.include_router(search.router)
app.include_router(advanced_search.router)
app.include_router(offices.router)
app.include_router(agents.router)
app.include_router(rankings.router)
app.include_router(regions.router)
app.include_router(changes.router)
app.include_router(popular.router)
app.include_router(admin.router)
app.include_router(correction_requests.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
    )
