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
from app.api import search, offices, agents, rankings, regions, changes, popular, admin, advanced_search

app.include_router(search.router)
app.include_router(advanced_search.router)
app.include_router(offices.router)
app.include_router(agents.router)
app.include_router(rankings.router)
app.include_router(regions.router)
app.include_router(changes.router)
app.include_router(popular.router)
app.include_router(admin.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
    )
