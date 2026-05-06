from app.db.database import SessionLocal
from app.db.models import OfficeCurrent

db = SessionLocal()

with open('db_check_result2.txt', 'w', encoding='utf-8') as f:
    # representative_name이 "백시동"인 사무소
    f.write("=== representative_name이 '백시동'인 사무소 ===\n")
    offices = db.query(OfficeCurrent).filter(
        OfficeCurrent.representative_name == '백시동'
    ).all()

    f.write(f"총 {len(offices)}개\n\n")
    for office in offices:
        f.write(f"Office Name: {office.office_name}\n")
        f.write(f"Representative Name: {office.representative_name}\n")
        f.write(f"Address: {office.address}\n")
        f.write(f"Registration Number: {office.registration_number}\n")
        f.write("---\n")

db.close()
print("완료!")
