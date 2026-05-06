from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import get_settings

settings = get_settings()

# DB 엔진 생성
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.ECHO_SQL,
    poolclass=NullPool,  # 개발 환경에서 연결 문제를 피하기 위해 사용
)

# 세션 팩토리
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """DB 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
