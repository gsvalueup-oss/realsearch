# -*- coding: utf-8 -*-
import sys
import os
from pathlib import Path
from sqlalchemy import create_engine, text, event
from sqlalchemy.pool import StaticPool

DB_USER = "myuser"
DB_PASSWORD = "mypassword"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "realsearch"

print("[LOG] PostgreSQL 연결 시작...")

try:
    # Step 1: postgres DB에 접속해서 realsearch DB 생성
    postgres_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"

    from sqlalchemy.pool import NullPool
    engine_postgres = create_engine(postgres_url, poolclass=NullPool)

    with engine_postgres.begin() as conn:
        # autocommit이 필요하므로 raw_connection 사용
        dbapi_conn = conn.connection.dbapi_connection
        dbapi_conn.autocommit = True
        cursor = dbapi_conn.cursor()

        print("[LOG] realsearch 데이터베이스 생성 중...")
        try:
            cursor.execute(f"CREATE DATABASE {DB_NAME};")
            print("[OK] realsearch 데이터베이스 생성 완료")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("[WARN] realsearch 데이터베이스가 이미 존재합니다")
            else:
                raise
        cursor.close()

    # Step 2: realsearch DB에 접속해서 스키마 생성
    print("[LOG] 스키마 생성 중...")
    realsearch_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine_realsearch = create_engine(realsearch_url, poolclass=NullPool)

    schema_path = Path(__file__).parent.parent / "schema.sql"
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    with engine_realsearch.begin() as conn:
        statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
        print(f"[LOG] {len(statements)}개의 SQL 명령 실행 중...")

        for i, stmt in enumerate(statements, 1):
            try:
                conn.execute(text(stmt))
                if i % 10 == 0:
                    print(f"  {i}/{len(statements)} 완료")
            except Exception as e:
                error_str = str(e)
                if "already exists" not in error_str.lower():
                    print(f"[WARN] Statement {i}: {error_str[:80]}")

    print("[OK] 스키마 생성 완료")
    print("")
    print("="*60)
    print("[OK] DB 설정 완료!")
    print("="*60)
    print("")
    print("다음 단계:")
    print("1. CSV 파일 확인: backend/data/csv/ 에 2개 파일이 있어야 함")
    print("2. CSV 임포트: python scripts/import_csv.py")
    print("3. FastAPI 실행: python -m app.main")
    print("4. Next.js 실행: cd ../frontend && npm run dev")

except Exception as e:
    print(f"[ERROR] 오류: {str(e)}")
    print("")
    print("[INFO] 확인사항:")
    print("1. PostgreSQL 실행 중?")
    print("2. myuser / mypassword 정보 확인?")
    print("3. localhost:5432 접속 가능?")
    import traceback
    traceback.print_exc()
    sys.exit(1)
