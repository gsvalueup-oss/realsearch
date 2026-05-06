import sys
sys.path.insert(0, 'C:\\Users\\gsval\\realsearch\\backend')

from app.db.database import SessionLocal
from app.db.models import OfficeCurrent

try:
    db = SessionLocal()
    count = db.query(OfficeCurrent).count()
    print(f"Success! Office count: {count}")
    db.close()
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
