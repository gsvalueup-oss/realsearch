from app.db.database import SessionLocal
from app.db.models import OfficeCurrent

db = SessionLocal()

# GS공인 검색
offices = db.query(OfficeCurrent).filter(
    OfficeCurrent.office_name.like('%GS공인%')
).all()

print("=== GS공인 사무소 정보 ===")
for office in offices:
    print(f"Office Name: {office.office_name}")
    print(f"Representative Name: {office.representative_name}")
    print(f"Address: {office.address}")
    print(f"Registration Number: {office.registration_number}")
    print("---")

# 백시동으로 검색되는 모든 사무소
print("\n=== '백시동' 검색 결과 ===")
search_term = "%백시동%"
offices_with_baeksi = db.query(OfficeCurrent).filter(
    (OfficeCurrent.office_name.ilike(search_term)) |
    (OfficeCurrent.address.ilike(search_term))
).all()

for office in offices_with_baeksi:
    print(f"Office Name: {office.office_name}")
    print(f"Representative Name: {office.representative_name}")
    print(f"Address: {office.address}")
    print("---")

db.close()
