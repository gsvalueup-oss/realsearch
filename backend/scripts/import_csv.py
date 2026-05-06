# -*- coding: utf-8 -*-
"""
CSV 파일을 읽어서 DB에 임포트하는 스크립트 (간단버전)
"""
import sys
from pathlib import Path
from datetime import datetime
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.csv_mapping import parse_legal_dong_name, normalize_role, normalize_status

DB_CONFIG = {
    'dbname': 'realsearch',
    'user': 'myuser',
    'host': 'localhost',
    'port': '5432'
}


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def import_offices_from_csv(csv_path: str, conn) -> int:
    print(f"\n[LOG] 사무소 정보 CSV 읽는 중: {csv_path}")

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

    for idx, row in df.iterrows():
        try:
            registration_number = str(row.get("등록번호", "")).strip()
            if not registration_number:
                skipped_count += 1
                continue

            legal_dong_name = row.get("법정동명", "")
            sido, sigungu, eupmyeondong = parse_legal_dong_name(legal_dong_name)

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
                updated_at = NOW()
            """

            registered_date = pd.to_datetime(row.get("등록일자"), errors="coerce")
            start_date = pd.to_datetime(row.get("보증설정시작일"), errors="coerce")
            end_date = pd.to_datetime(row.get("보증설정종료일"), errors="coerce")
            source_updated_at = pd.to_datetime(row.get("데이터기준일자"), errors="coerce")

            cursor.execute(sql, (
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

            if imported_count % 5000 == 0:
                print(f"  ... {imported_count} 행 처리 중")

        except Exception as e:
            skipped_count += 1
            if skipped_count <= 5:
                print(f"  [WARN] {idx}번 행 스킵: {str(e)[:150]}")

    conn.commit()
    cursor.close()
    print(f"\n[OK] 사무소 정보 임포트 완료: {imported_count}개 (스킵: {skipped_count}개)")
    return imported_count


def import_agents_from_csv(csv_path: str, conn) -> int:
    print(f"\n[LOG] 중개업자 정보 CSV 읽는 중: {csv_path}")

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

    for idx, row in df.iterrows():
        try:
            office_registration_number = str(row.get("등록번호", "")).strip()
            name = str(row.get("중개업자명", "")).strip()

            if not office_registration_number or not name:
                skipped_count += 1
                continue

            legal_dong_name = row.get("법정동명", "")
            sido, sigungu, _ = parse_legal_dong_name(legal_dong_name)

            sql = """
            INSERT INTO agent_current (
                name, role, office_registration_number, office_name,
                legal_dong_name, sido, sigungu, agent_type,
                license_number, license_date, status, source_updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            """

            license_date = pd.to_datetime(row.get("자격증취득일"), errors="coerce")
            source_updated_at = pd.to_datetime(row.get("데이터기준일자"), errors="coerce")

            cursor.execute(sql, (
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

            if imported_count % 5000 == 0:
                print(f"  ... {imported_count} 행 처리 중")

        except Exception as e:
            skipped_count += 1

    conn.commit()
    cursor.close()
    print(f"\n[OK] 중개업자 정보 임포트 완료: {imported_count}개")
    return imported_count


def main():
    print("=" * 60)
    print("[START] RealSearch CSV 임포트")
    print("=" * 60)

    conn = None
    try:
        conn = get_connection()
        print("[OK] DB 연결 성공")

        csv_dir = Path(__file__).parent.parent / "data" / "csv"
        office_csv = csv_dir / "부동산중개업사무소정보.csv"
        agent_csv = csv_dir / "부동산중개업자정보.csv"

        if not office_csv.exists():
            print(f"[WARN] CSV 파일 미존재: {csv_dir}")
            return

        import_offices_from_csv(str(office_csv), conn)

        if agent_csv.exists():
            import_agents_from_csv(str(agent_csv), conn)

        print("\n" + "=" * 60)
        print("[OK] CSV 임포트 완료!")
        print("=" * 60)
        print("\n다음 단계:")
        print("1. python -m app.main  (FastAPI 실행)")
        print("2. cd ../frontend && npm run dev  (Next.js 실행)")

    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
