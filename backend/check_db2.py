from app.db.database import SessionLocal
from app.db.models import OfficeCurrent

db = SessionLocal()

with open('db_check_result.txt', 'w', encoding='utf-8') as f:
    # 백시동으로 검색되는 모든 사무소
    f.write("=== '백시동' 검색 결과 (office_name 또는 address) ===\n")
    search_term = "%백시동%"
    offices_with_baeksi = db.query(OfficeCurrent).filter(
        (OfficeCurrent.office_name.ilike(search_term)) |
        (OfficeCurrent.address.ilike(search_term))
    ).all()

    f.write(f"총 {len(offices_with_baeksi)}개 결과\n\n")
    for office in offices_with_baeksi:
        f.write(f"Office Name: {office.office_name}\n")
        f.write(f"Representative Name: {office.representative_name}\n")
        f.write(f"Address: {office.address}\n")
        f.write(f"Registration Number: {office.registration_number}\n")
        f.write("---\n")

db.close()
print("완료! db_check_result.txt 파일을 확인하세요.")
