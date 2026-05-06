# RealSearch - 부동산중개업 정보 조회 서비스

전국 공인중개사무소·소속공인중개사·중개보조원 정보를 검색하고 분석하는 웹사이트입니다.

단순 검색을 넘어 **랭킹·통계·변화 추적** 기능을 제공하여 소비자와 실무자에게 유용한 정보를 제공합니다.

---

## 📋 주요 기능

### 1. 통합 검색
- 사무소 상호명 검색
- 대표/직원 이름 검색
- 등록번호 정확 검색
- 주소/지역명 검색
- 직위별 필터 (대표, 소속공인중개사, 중개보조원)
- 영업상태 필터

### 2. 상세 정보 조회
- **사무소 상세페이지**: 직원 목록, 인원 수, 순위, 운영기간, 변화 추적
- **사람 상세페이지**: 현재 소속, 직위, 소속 이력

### 3. 랭킹
- 전국 / 대구 / 구별 직원 수 많은 사무소
- 오래된 사무소 순위
- 최근 신규 개업 사무소
- 최근 폐업/휴업 사무소
- 최근 직원 수 증가 사무소

### 4. 지역 통계
- 시도별 / 시군구별 현황
- 사무소 수, 직원 수, 평균 인원
- 신규/폐업 추이

### 5. 변화 추적
- 신규 등록 사무소
- 폐업/휴업 전환
- 직원 증감
- 소속 변경

---

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| **백엔드** | Python FastAPI |
| **프론트엔드** | Next.js (TypeScript) |
| **데이터베이스** | PostgreSQL (Full Text Search, pg_trgm) |
| **데이터 수집** | Python (스케줄러) |

---

## 📁 프로젝트 구조

```
realsearch/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── api/               # API 라우트
│   │   │   ├── search.py
│   │   │   ├── offices.py
│   │   │   ├── agents.py
│   │   │   ├── rankings.py
│   │   │   ├── regions.py
│   │   │   └── changes.py
│   │   ├── db/                # DB 모델 및 설정
│   │   │   ├── models.py
│   │   │   ├── schemas.py
│   │   │   └── database.py
│   │   ├── core/              # 핵심 설정
│   │   │   ├── config.py
│   │   │   └── csv_mapping.py
│   │   └── main.py            # FastAPI 앱
│   ├── scripts/               # 데이터 처리 스크립트
│   │   ├── fetch_data.py      # 데이터 다운로드
│   │   ├── import_csv.py      # CSV import
│   │   └── generate_snapshots.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # Next.js 프론트엔드
│   ├── app/
│   │   ├── page.tsx           # 메인 페이지
│   │   ├── layout.tsx
│   │   └── (pages)/
│   │       ├── search/
│   │       ├── office/
│   │       ├── agent/
│   │       ├── rankings/
│   │       ├── regions/
│   │       └── changes/
│   ├── components/
│   ├── lib/
│   ├── styles/
│   ├── package.json
│   └── .env.example
│
├── docs/                       # 문서
├── schema.sql                  # DB 스키마
├── docker-compose.yml          # Docker 설정 (선택사항)
└── README.md
```

---

## 🚀 시작하기

### 사전 요구사항
- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- pip, npm

### 1. 저장소 클론 및 환경 설정

```bash
cd C:\Users\gsval\realsearch

# 백엔드 환경 설정
cp .env.example .env
# .env 파일 수정 (DB 연결 정보 등)
```

### 2. 데이터베이스 설정

```bash
# PostgreSQL 실행
# Windows에서 PostgreSQL이 설치되어 있다고 가정

# DB 생성
psql -U postgres
CREATE DATABASE realsearch;

# 스키마 생성
psql -U postgres -d realsearch -f schema.sql
```

### 3. 백엔드 설치 및 실행

```bash
cd backend

# 가상환경 생성
python -m venv venv
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# FastAPI 서버 실행
python -m app.main
# 또는
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API 문서: http://localhost:8000/docs

### 4. 프론트엔드 설치 및 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드: http://localhost:3000

---

## 📊 데이터 수집 및 임포트

### CSV 파일 준비
브이월드 공개 데이터에서 다음 파일 다운로드:
1. `부동산중개업사무소정보.csv`
2. `부동산중개업자정보.csv`

`backend/data/csv/` 디렉토리에 저장

### 데이터 임포트

```bash
cd backend

# 첫 번째 실행: CSV 임포트
python scripts/import_csv.py

# 이후 매일: 스냅샷 생성 및 변화 감지
python scripts/generate_snapshots.py
```

### 자동 스케줄링 (선택사항)
```bash
# Windows Task Scheduler 또는 Linux cron으로 매일 실행 가능
# 추후 Celery/APScheduler로 자동화 가능
```

---

## 🔌 API 엔드포인트

### 검색
```
GET /api/search?q=&type=&sido=&sigungu=&role=&status=
```

### 사무소
```
GET /api/offices
GET /api/offices/{registration_number}
GET /api/offices/{registration_number}/staff
GET /api/offices/{registration_number}/history
GET /api/offices/{registration_number}/metrics
```

### 사람
```
GET /api/agents
GET /api/agents/{id}
GET /api/agents/search?q=
GET /api/agents/{id}/history
```

### 랭킹
```
GET /api/rankings/offices/by-staff
GET /api/rankings/offices/by-age
GET /api/rankings/offices/by-licensed-agents
GET /api/rankings/offices/by-assistants
```

### 지역 통계
```
GET /api/regions
GET /api/regions/{sido}
GET /api/regions/{sido}/{sigungu}
GET /api/regions/{sido}/{sigungu}/metrics
```

### 변화 추적
```
GET /api/changes
GET /api/changes/new-offices
GET /api/changes/closed-offices
GET /api/changes/staff-increased
GET /api/changes/staff-decreased
```

---

## 📄 프론트엔드 페이지

| 경로 | 설명 |
|------|------|
| `/` | 메인 검색 페이지 |
| `/search?q=` | 검색 결과 |
| `/office/[registration_number]` | 사무소 상세 |
| `/agent/[id]` | 사람 상세 |
| `/rankings` | 랭킹 메인 |
| `/rankings/daegu/staff` | 대구 직원 수 랭킹 |
| `/regions` | 지역 통계 메인 |
| `/regions/daegu` | 대구 현황 |
| `/regions/daegu/[sigungu]` | 대구 구별 현황 |
| `/changes` | 최근 변화 |

---

## ⚠️ 법적 및 표현 주의사항

이 서비스는 **공공데이터 기반의 참고용 조회 서비스**입니다.

### 금지 표현
- ❌ "위험한 중개사"
- ❌ "사기 중개사"
- ❌ "블랙리스트"
- ❌ "불량 중개사무소"

### 권장 표현
- ✅ "공개데이터 기준 확인 정보"
- ✅ "등록정보 확인"
- ✅ "소속정보 변동 있음"
- ✅ "영업상태 확인 필요"

### 면책 고지문
> 본 서비스는 브이월드 및 공공데이터 기반의 참고용 조회 서비스입니다. 전국 지자체 정보를 취합하는 과정에서 실제 등록관청 정보와 시간 차이가 있을 수 있습니다. 실제 등록상태, 영업상태, 소속 여부 등은 관할 시·군·구청 또는 공식 부동산중개업 조회 서비스를 통해 최종 확인하시기 바랍니다.

---

## 🔒 개인정보 보호

- 공개 데이터에 포함된 정보만 제공
- 주민번호, 연락처, 상세 개인정보는 저장/표시 안 함
- GDPR/개인정보보호법 준수

---

## 📈 확장 계획

### Phase 1 (현재)
- ✅ MVP 기본 기능
- ✅ 검색 및 상세 조회
- ✅ 기본 랭킹/통계

### Phase 2
- 🔄 Elasticsearch로 검색 최적화
- 🔄 지도 기능 (카카오맵/네이버지도)
- 🔄 고급 분석 대시보드

### Phase 3
- 📅 전국 서비스 확대
- 📅 캐싱 최적화
- 📅 모바일 앱

---

## 🤝 기여

이 프로젝트는 공개 데이터를 활용한 공공 서비스입니다.
개선 사항이나 버그 보고는 이슈를 통해 제출해주세요.

---

## 📞 연락처

문의사항: gs2486666@gmail.com

---

## 📝 라이선스

MIT License

---

## 📚 참고 자료

- [브이월드 공공데이터](https://vworld.kr/)
- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [Next.js 문서](https://nextjs.org/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)

---

**마지막 업데이트**: 2026-05-03
