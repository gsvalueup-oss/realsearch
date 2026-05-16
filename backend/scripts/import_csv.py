# -*- coding: utf-8 -*-
"""
CSV 파일을 읽어서 DB에 임포트하는 스크립트
사용법: python scripts/import_csv.py <office_csv_path> [agent_csv_path]
"""
import sys
import os
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse
import argparse
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()

from app.core.csv_mapping import parse_legal_dong_name, normalize_role, normalize_status
from app.core.config import get_settings


def get_db_config():
    """환경변수에서 DB 설정을 읽어옴"""
    settings = get_settings()
    db_url = settings.DATABASE_URL

    # postgresql://user:password@host:port/dbname 형식 파싱
    parsed = urlparse(db_url)
    return {
        'dbname': parsed.path.lstrip('/'),
        'user': parsed.username or 'postgres',
        'password': parsed.password or '',
        'host': parsed.hostname or 'localhost',
        'port': str(parsed.port or 5432)
    }


DB_CONFIG = get_db_config()


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def import_offices_from_csv(csv_path: str, conn, batch_size: int = 5000) -> int:
    print(f"[LOG] 사무소 정보 CSV 읽는 중: {csv_path}")

    encodings = ['utf-8-sig', 'utf-8', 'euc-kr', 'cp949']
    df = None
    for enc in encodings:
        try:
            df = pd.read_csv(csv_path, encoding=enc)
            print(f"[OK] 인코딩: {enc}, 읽은 행 수: {len(df)}")
            break
        except Exception as e:
            continue

    if df is None:
        raise ValueError(f"CSV 파일을 읽을 수 없음: {csv_path}")

    cursor = conn.cursor()
    imported_count = 0
    skipped_count = 0
    batch_data = []

    sql = """
    INSERT INTO office_current (
        registration_number, office_name, representative_name,
        legal_dong_code, legal_dong_name, address, road_address,
        sido, sigungu, eupmyeondong, status, registered_date,
        phone_number, start_date, end_date, source_updated_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (registration_number) DO UPDATE SET
        office_name = EXCLUDED.office_name,
        representative_name = EXCLUDED.representative_name,
        source_updated_at = EXCLUDED.source_updated_at,
        updated_at = NOW()
    """

    for idx, row in df.iterrows():
        try:
            registration_number = str(row.get("등록번호", "")).strip()
            if not registration_number:
                skipped_count += 1
                continue

            legal_dong_name = row.get("법정동명", "")
            sido, sigungu, eupmyeondong = parse_legal_dong_name(legal_dong_name)

            registered_date = pd.to_datetime(row.get("등록일자"), errors="coerce")
            start_date = pd.to_datetime(row.get("보증설정시작일"), errors="coerce")
            end_date = pd.to_datetime(row.get("보증설정종료일"), errors="coerce")
            source_updated_at = pd.to_datetime(row.get("데이터기준일자"), errors="coerce")

            batch_data.append((
                registration_number,
                str(row.get("사업자상호", "")).strip(),
                str(row.get("중개업자명", "")).strip(),
                str(row.get("법정동코드", "")).strip(),
                legal_dong_name,
                str(row.get("지번주소", "")).strip(),
                str(row.get("도로명주소", "")).strip(),
                sido, sigungu, eupmyeondong,
                normalize_status(row.get("상태구분명", "")),
                registered_date.date() if pd.notna(registered_date) else None,
                str(row.get("전화번호", "")).strip(),
                start_date.date() if pd.notna(start_date) else None,
                end_date.date() if pd.notna(end_date) else None,
                source_updated_at.date() if pd.notna(source_updated_at) else None,
            ))

            imported_count += 1

            # 배치 단위로 실행
            if imported_count % batch_size == 0:
                execute_batch(cursor, sql, batch_data)
                batch_data = []
                print(f"  ✓ {imported_count} 행 처리됨")

        except Exception as e:
            skipped_count += 1
            if skipped_count <= 5:
                print(f"  [WARN] {idx}번 행 스킵: {str(e)[:100]}")

    # 남은 데이터 처리
    if batch_data:
        execute_batch(cursor, sql, batch_data)

    conn.commit()
    cursor.close()
    print(f"[OK] 사무소 임포트 완료: {imported_count}개 (스킵: {skipped_count}개)\n")
    return imported_count


def import_agents_from_csv(csv_path: str, conn, batch_size: int = 5000) -> int:
    print(f"[LOG] 중개업자 정보 CSV 읽는 중: {csv_path}")

    encodings = ['utf-8-sig', 'utf-8', 'euc-kr', 'cp949']
    df = None
    for enc in encodings:
        try:
            df = pd.read_csv(csv_path, encoding=enc)
            print(f"[OK] 인코딩: {enc}, 읽은 행 수: {len(df)}")
            break
        except:
            continue

    if df is None:
        raise ValueError(f"CSV 파일을 읽을 수 없음: {csv_path}")

    cursor = conn.cursor()
    imported_count = 0
    skipped_count = 0
    batch_data = []

    sql = """
    INSERT INTO agent_current (
        name, role, office_registration_number, office_name,
        legal_dong_name, sido, sigungu, agent_type,
        license_number, license_date, status, source_updated_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (name, office_registration_number) DO UPDATE SET
        role = EXCLUDED.role,
        office_name = EXCLUDED.office_name,
        legal_dong_name = EXCLUDED.legal_dong_name,
        sido = EXCLUDED.sido,
        sigungu = EXCLUDED.sigungu,
        agent_type = EXCLUDED.agent_type,
        license_number = EXCLUDED.license_number,
        license_date = EXCLUDED.license_date,
        status = EXCLUDED.status,
        source_updated_at = EXCLUDED.source_updated_at,
        updated_at = NOW()
    """

    for idx, row in df.iterrows():
        try:
            office_registration_number = str(row.get("등록번호", "")).strip()
            name = str(row.get("중개업자명", "")).strip()

            if not office_registration_number or not name:
                skipped_count += 1
                continue

            legal_dong_name = row.get("법정동명", "")
            sido, sigungu, _ = parse_legal_dong_name(legal_dong_name)
            license_date = pd.to_datetime(row.get("자격증취득일"), errors="coerce")
            source_updated_at = pd.to_datetime(row.get("데이터기준일자"), errors="coerce")

            batch_data.append((
                name,
                normalize_role(row.get("직위구분명", "")),
                office_registration_number,
                str(row.get("사업자상호", "")).strip(),
                legal_dong_name,
                sido, sigungu,
                str(row.get("중개업자종별명", "")).strip(),
                str(row.get("자격증번호", "")).strip(),
                license_date.date() if pd.notna(license_date) else None,
                "활동중",
                source_updated_at.date() if pd.notna(source_updated_at) else None,
            ))

            imported_count += 1

            # 배치 단위로 실행
            if imported_count % batch_size == 0:
                try:
                    execute_batch(cursor, sql, batch_data)
                    batch_data = []
                    print(f"  ✓ {imported_count} 행 처리됨")
                except Exception as batch_err:
                    print(f"  [ERROR] 배치 {imported_count} 행 처리 실패: {str(batch_err)[:200]}")
                    conn.rollback()
                    cursor = conn.cursor()
                    raise

        except Exception as e:
            skipped_count += 1
            if skipped_count <= 10:
                print(f"  [WARN] {idx}번 행 스킵: {str(e)[:150]}")

    # 남은 데이터 처리
    if batch_data:
        execute_batch(cursor, sql, batch_data)

    try:
        conn.commit()
    except Exception as e:
        print(f"[WARN] Commit 실패: {str(e)[:100]}")
        conn.rollback()
        raise

    cursor.close()
    print(f"[OK] 중개업자 임포트 완료: {imported_count}개 (스킵: {skipped_count}개)\n")
    return imported_count


def main():
    parser = argparse.ArgumentParser(
        description='RealSearch CSV 데이터를 DB에 임포트합니다',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  python scripts/import_csv.py data/csv/부동산중개업사무소정보.csv
  python scripts/import_csv.py data/csv/부동산중개업사무소정보.csv data/csv/부동산중개업자정보.csv
        """
    )
    parser.add_argument('office_csv', help='사무소 정보 CSV 파일 경로')
    parser.add_argument('agent_csv', nargs='?', help='중개업자 정보 CSV 파일 경로 (선택사항)')
    parser.add_argument('--batch-size', type=int, default=5000, help='배치 크기 (기본값: 5000)')

    args = parser.parse_args()

    office_csv = Path(args.office_csv)
    agent_csv = Path(args.agent_csv) if args.agent_csv else None

    # CSV 파일 존재 확인
    if not office_csv.exists():
        print(f"[ERROR] 파일을 찾을 수 없습니다: {office_csv}")
        sys.exit(1)

    if agent_csv and not agent_csv.exists():
        print(f"[ERROR] 파일을 찾을 수 없습니다: {agent_csv}")
        sys.exit(1)

    print("=" * 70)
    print("[START] RealSearch CSV 임포트")
    print("=" * 70)
    print(f"DB: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['dbname']}")
    print(f"사무소 CSV: {office_csv.absolute()}")
    if agent_csv:
        print(f"중개업자 CSV: {agent_csv.absolute()}")
    print("=" * 70)

    conn = None
    try:
        conn = get_connection()
        print("[OK] DB 연결 성공\n")

        import_offices_from_csv(str(office_csv), conn)

        if agent_csv:
            import_agents_from_csv(str(agent_csv), conn)

        print("\n" + "=" * 70)
        print("[OK] CSV 임포트 완료!")
        print("=" * 70)

    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
