# WeDisk Clone - 웹하드 서비스

완전한 기능을 갖춘 웹하드(파일 공유) 서비스 클론 프로젝트

## 주요 기능

### 사용자 기능
- 회원가입/로그인 (이메일, 소셜 로그인)
- 파일 업로드/다운로드/스트리밍
- 캐시/포인트/쿠폰 시스템
- 다중 결제 수단 (카카오페이, 삼성페이, 신용카드, 계좌이체 등)
- 카테고리별 파일 검색 (영화, 드라마, 게임, 애니, 도서, 교육 등)
- 파일 판매/구매
- 댓글 및 평점
- 찜하기/북마크
- 자료 요청
- 마이페이지 (구매/판매 내역, 포인트 관리)

### 판매자 기능
- 파일 업로드 및 가격 설정
- 판매 통계 대시보드
- 정산 관리

### 관리자 기능
- 사용자 관리
- 파일 관리 및 검열
- 결제 관리
- 통계 대시보드
- 배너 광고 관리

## 기술 스택

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (메인 DB)
- Redis (캐싱, 세션)
- MinIO/AWS S3 (파일 스토리지)
- JWT 인증
- Socket.io (실시간 알림)

### Frontend (Web)
- React 18 + TypeScript
- Vite
- TailwindCSS
- React Query
- Zustand (상태 관리)
- React Router v6

### Mobile
- React Native
- Expo
- TypeScript

### Payment
- 토스페이먼츠
- 아임포트 (다중 PG 연동)

### DevOps
- Docker + Docker Compose
- Nginx
- GitHub Actions (CI/CD)

## 프로젝트 구조

```
webhard/
├── backend/              # Node.js API 서버
│   ├── src/
│   │   ├── controllers/  # 컨트롤러
│   │   ├── models/       # DB 모델
│   │   ├── routes/       # API 라우트
│   │   ├── services/     # 비즈니스 로직
│   │   ├── middleware/   # 미들웨어
│   │   ├── utils/        # 유틸리티
│   │   └── config/       # 설정
│   ├── prisma/           # Prisma ORM 스키마
│   └── package.json
├── frontend/             # React 웹 앱
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── pages/        # 페이지
│   │   ├── hooks/        # 커스텀 훅
│   │   ├── api/          # API 클라이언트
│   │   ├── store/        # 상태 관리
│   │   ├── types/        # TypeScript 타입
│   │   └── utils/        # 유틸리티
│   └── package.json
├── mobile/               # React Native 모바일 앱
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   └── navigation/
│   └── package.json
├── admin/                # 관리자 대시보드
│   └── src/
├── shared/               # 공통 타입 및 유틸리티
│   └── types/
├── docker-compose.yml    # 개발 환경 설정
└── README.md
```

## 설치 및 실행

### 필수 요구사항
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis
- MinIO (로컬 개발시) 또는 AWS S3

### 개발 환경 설정

1. 저장소 클론
```bash
git clone https://github.com/josens83/webhard.git
cd webhard
```

2. Docker로 개발 환경 실행
```bash
docker-compose up -d
```

3. Backend 설정
```bash
cd backend
npm install
cp .env.example .env
# .env 파일 수정
npm run migrate
npm run seed    # 샘플 데이터 생성
npm run dev
```

4. Frontend 설정
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

5. 브라우저에서 http://localhost:3000 접속

### 모바일 앱 개발 환경

```bash
cd mobile
npm install
npx expo start
```

자세한 내용은 [mobile/README.md](mobile/README.md)를 참고하세요.

## 프로덕션 배포

### 빠른 배포

```bash
# .env.production 파일 생성
cp .env.production.example .env.production
# 환경 변수 설정 후

# 배포 스크립트 실행
sudo ./deploy.sh
```

### 수동 배포

```bash
# 프로덕션 환경 빌드 및 실행
docker-compose -f docker-compose.prod.yml up -d --build

# 데이터베이스 마이그레이션
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# 샘플 데이터 생성 (선택사항)
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### 유용한 스크립트

```bash
# 로그 확인
./scripts/logs.sh [service_name]

# 헬스 체크
./scripts/health-check.sh

# 데이터베이스 백업
./scripts/backup-db.sh

# 데이터베이스 복원
./scripts/restore-db.sh backups/wedisk_backup_YYYYMMDD_HHMMSS.sql.gz
```

## 서비스 접속

### 개발 환경
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- MinIO Console: http://localhost:9001

### 프로덕션 환경
- Frontend: https://your-domain.com
- Backend API: https://your-domain.com/api
- MinIO Console: https://your-domain.com/minio
- Grafana: https://your-domain.com/grafana
- Prometheus: http://localhost:9090 (internal)

## 테스트 계정

```
관리자: admin@wedisk.com / password123
판매자: seller1@wedisk.com / password123
일반 사용자: user@wedisk.com / password123
```

## 모니터링

Grafana 대시보드를 통해 다음을 모니터링할 수 있습니다:
- API 응답 시간
- 데이터베이스 성능
- Redis 캐시 히트율
- 시스템 리소스 사용량
- 에러 로그

## API 문서
- Swagger UI: http://localhost:4000/api-docs

## 문서

- [기능 목록](FEATURES.md) - 구현된 전체 기능 목록
- [배포 가이드](DEPLOYMENT.md) - 상세한 배포 가이드
- [모바일 앱](mobile/README.md) - React Native 모바일 앱

## 라이센스
MIT

## 기여
Pull Request를 환영합니다!

## 주의사항

⚠️ 프로덕션 환경에서는 반드시:
1. 강력한 비밀번호 사용
2. SSL/TLS 인증서 설정 (Let's Encrypt 권장)
3. 환경 변수 보안 관리
4. 정기적인 데이터베이스 백업
5. 모니터링 및 알림 설정
