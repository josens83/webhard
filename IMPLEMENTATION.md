# EduVault Clone - 구현 완료 문서

## 프로젝트 개요

https://www.eduvault.co.kr/ 사이트를 완벽하게 클론한 풀스택 교육 플랫폼 서비스입니다.

## 구현된 주요 기능

### 1. 사용자 인증 시스템
- ✅ 회원가입 / 로그인
- ✅ JWT 기반 인증
- ✅ OAuth 소셜 로그인 준비 (Google, Kakao, Naver)
- ✅ 비밀번호 변경
- ✅ 사용자 프로필 관리

### 2. 파일 관리 시스템
- ✅ 파일 업로드 (멀티파트 업로드)
- ✅ 파일 다운로드
- ✅ 파일 검색 및 필터링
- ✅ 카테고리별 분류 (영화, 드라마, 게임, 애니, 도서, 교육 등)
- ✅ 파일 정보 상세 보기
- ✅ 파일 미리보기
- ✅ 찜하기 / 북마크

### 3. 결제 및 포인트 시스템
- ✅ 캐시 충전 시스템
- ✅ 포인트 시스템
- ✅ 쿠폰 시스템
- ✅ 다중 결제 수단 지원 (카카오페이, 삼성페이, 신용카드, 계좌이체 등)
- ✅ 결제 보너스 (충전 금액에 따른 캐시/포인트/쿠폰 보너스)
- ✅ 거래 내역 조회

### 4. 파일 구매 시스템
- ✅ 캐시로 파일 구매
- ✅ 포인트로 파일 구매
- ✅ 쿠폰으로 파일 구매
- ✅ 구매 내역 관리
- ✅ 판매자 정산 시스템 (10% 수수료)

### 5. 커뮤니티 기능
- ✅ 댓글 시스템 (대댓글 지원)
- ✅ 평점 시스템 (1-5점)
- ✅ 신고 기능
- ✅ 사용자 간 소통

### 6. 마이페이지
- ✅ 구매한 파일 목록
- ✅ 업로드한 파일 목록
- ✅ 찜한 파일 목록
- ✅ 거래 내역
- ✅ 포인트/캐시/쿠폰 관리
- ✅ 프로필 수정

### 7. 관리자 기능
- ✅ 대시보드 (통계)
- ✅ 사용자 관리
- ✅ 파일 승인/거부 시스템
- ✅ 파일 관리
- ✅ 배너 광고 관리
- ✅ 신고 처리

### 8. UI/UX
- ✅ EduVault와 유사한 디자인
- ✅ 반응형 디자인 (모바일 대응)
- ✅ 카테고리 네비게이션
- ✅ 검색 기능
- ✅ 정렬 옵션 (최신순, 인기순, 평점순)
- ✅ 페이지네이션
- ✅ 광고 배너 영역

## 기술 스택

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (Prisma ORM)
- Redis (캐싱)
- JWT 인증
- Multer (파일 업로드)
- MinIO/S3 (파일 스토리지)
- Swagger (API 문서)

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- React Query
- Zustand (상태 관리)
- React Router v6
- Axios
- React Hot Toast

### DevOps
- Docker + Docker Compose
- PostgreSQL 15
- Redis 7
- MinIO

## 데이터베이스 스키마

### 주요 모델
1. **User** - 사용자 정보, 캐시, 포인트, 쿠폰
2. **File** - 파일 정보, 가격, 통계
3. **Category** - 카테고리 (계층 구조)
4. **Purchase** - 구매 내역
5. **Download** - 다운로드 내역
6. **Transaction** - 거래 내역 (입금, 출금, 구매, 환불)
7. **Comment** - 댓글 (대댓글 지원)
8. **Rating** - 평점
9. **Favorite** - 찜하기
10. **Coupon** - 쿠폰
11. **Banner** - 광고 배너
12. **Report** - 신고

## API 엔드포인트

### 인증
- POST `/api/auth/register` - 회원가입
- POST `/api/auth/login` - 로그인
- GET `/api/auth/me` - 현재 사용자 정보
- PUT `/api/auth/change-password` - 비밀번호 변경

### 파일
- GET `/api/files` - 파일 목록
- GET `/api/files/:id` - 파일 상세
- POST `/api/files/upload` - 파일 업로드
- POST `/api/files/:id/download` - 파일 다운로드
- POST `/api/files/:id/purchase` - 파일 구매
- POST `/api/files/:id/favorite` - 찜하기 토글

### 카테고리
- GET `/api/categories` - 카테고리 목록
- GET `/api/categories/:id` - 카테고리 상세

### 결제
- POST `/api/payments/charge` - 캐시 충전
- GET `/api/payments/transactions` - 거래 내역
- POST `/api/payments/coupon/apply` - 쿠폰 적용
- GET `/api/payments/coupons` - 내 쿠폰 목록

### 댓글
- POST `/api/comments` - 댓글 작성
- PUT `/api/comments/:id` - 댓글 수정
- DELETE `/api/comments/:id` - 댓글 삭제
- POST `/api/comments/rating` - 평점 작성

### 사용자
- GET `/api/users/profile/:id` - 사용자 프로필
- PUT `/api/users/profile` - 프로필 수정
- GET `/api/users/my-files` - 내 파일 목록
- GET `/api/users/my-purchases` - 구매 내역
- GET `/api/users/my-favorites` - 찜한 파일

### 관리자
- GET `/api/admin/dashboard` - 대시보드 통계
- POST `/api/admin/files/:id/review` - 파일 승인/거부
- GET `/api/admin/users` - 사용자 목록
- PATCH `/api/admin/users/:id/toggle-status` - 사용자 활성화/비활성화
- POST `/api/admin/banners` - 배너 생성
- GET `/api/admin/banners` - 배너 목록

## 설치 및 실행

### 1. Docker로 실행 (권장)

```bash
# Docker Compose로 데이터베이스 실행
docker-compose up -d

# Backend 실행
cd backend
npm install
npm run prisma:generate
npm run migrate
npm run dev

# Frontend 실행
cd frontend
npm install
npm run dev
```

### 2. 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api-docs

## 보안 기능
- ✅ JWT 토큰 기반 인증
- ✅ 비밀번호 해싱 (bcrypt)
- ✅ Rate limiting
- ✅ CORS 설정
- ✅ Helmet (보안 헤더)
- ✅ 입력 유효성 검사

## 성능 최적화
- ✅ Redis 캐싱
- ✅ 데이터베이스 인덱싱
- ✅ 페이지네이션
- ✅ 이미지 압축 및 최적화
- ✅ Code splitting (프론트엔드)

## 추가 구현 가능한 기능
- 📱 모바일 앱 (React Native)
- 🔐 DRM 및 파일 암호화
- 📧 이메일 인증
- 💬 실시간 채팅
- 📊 판매자 대시보드
- 🎁 이벤트 및 프로모션 관리
- 🔔 실시간 알림 (Socket.io)
- 📱 SMS 인증
- 🌐 다국어 지원
- 📈 고급 분석 및 리포트

## 테스트 계정
- 일반 사용자: user@example.com / password123
- 판매자: seller@example.com / password123
- 관리자: admin@example.com / password123

## 라이센스
MIT

## 개발자
프로젝트 개발 완료
