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
npm run migrate
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

## API 문서
- Swagger UI: http://localhost:4000/api-docs

## 라이센스
MIT

## 기여
Pull Request를 환영합니다!
