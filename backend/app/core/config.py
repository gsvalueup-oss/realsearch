from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # 앱 기본 설정
    APP_NAME: str = "RealSearch - 부동산중개업 정보 조회"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # DB 설정
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/realsearch"
    ECHO_SQL: bool = False

    # API 설정
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api"

    # CORS 설정
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"

    @property
    def cors_origins_list(self) -> list:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]

    # 데이터 수집 설정
    DATA_FETCH_INTERVAL_HOURS: int = 24  # 매일 1회
    VWORLD_API_KEY: str = ""  # 필요시 설정

    # CSV 파일 저장 경로
    CSV_DATA_DIR: str = "./data/csv"
    SAMPLE_DATA_DIR: str = "./data/sample"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()
