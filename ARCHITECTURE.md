# WeDisk 아키텍처 문서

## 🏗️ 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                         클라이언트 레이어                          │
├─────────────────┬──────────────────┬────────────────────────────┤
│   웹 브라우저    │   모바일 앱       │    관리자 대시보드          │
│   (React SPA)   │  (React Native)  │   (React Admin)           │
└────────┬────────┴────────┬─────────┴──────────┬─────────────────┘
         │                 │                    │
         │    HTTPS/WSS    │                    │
         ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Nginx 리버스 프록시                         │
│          (SSL/TLS, Rate Limiting, Load Balancing)              │
└────────┬────────────────────────────────────────────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐
│  Backend   │  │   Socket   │  │   MinIO    │  │ Grafana  │
│    API     │  │    .io     │  │    S3      │  │          │
│ (Node.js)  │  │ (실시간)    │  │  (파일)     │  │ (모니터링) │
└─────┬──────┘  └─────┬──────┘  └────────────┘  └──────────┘
      │               │
      ├───────┬───────┼────────┬──────────┬────────────┐
      ▼       ▼       ▼        ▼          ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│PostgreSQL│ │  Redis   │ │Elastic   │ │Prometheus│ │  외부 API  │
│  (메인DB)│ │ (캐시)   │ │ search   │ │ (메트릭)  │ │ (결제/OAuth)│
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## 📋 레이어별 상세 설명

### 1. 프레젠테이션 레이어

#### 웹 프론트엔드 (React SPA)
- **기술 스택**: React 18, TypeScript, Vite, TailwindCSS
- **상태 관리**: Zustand (로컬), React Query (서버)
- **라우팅**: React Router v6
- **주요 기능**:
  - 파일 업로드/다운로드
  - 검색 및 필터링
  - 결제 및 충전
  - 사용자 인증
  - 다크모드, 다국어 지원

#### 모바일 앱 (React Native)
- **기술 스택**: React Native 0.73, Expo 50, TypeScript
- **네비게이션**: React Navigation
- **상태 관리**: Zustand, React Query
- **보안**: Expo SecureStore (토큰 저장)
- **주요 화면**: 9개 (Login, Register, Home, Files, FileDetail, Search, MyPage, Charge, Upload)

### 2. API 게이트웨이 레이어

#### Nginx 리버스 프록시
```nginx
역할:
- SSL/TLS 종료
- Rate Limiting (API 보호)
- Load Balancing (Backend 2 replicas)
- Static 파일 캐싱
- WebSocket 프록시 (Socket.io)
- CORS 헤더 관리
```

**주요 설정**:
```
/api/*        → Backend API (3000번 포트)
/socket.io/*  → WebSocket (실시간 알림)
/s3/*         → MinIO S3 (파일 다운로드)
/grafana/*    → Grafana Dashboard
/*            → React Frontend (80번 포트)
```

### 3. 애플리케이션 레이어

#### Backend API (Node.js + Express)

**디렉토리 구조**:
```
backend/src/
├── controllers/      # 비즈니스 로직 처리
│   ├── auth.controller.ts
│   ├── file.controller.ts
│   ├── payment.controller.ts
│   ├── user.controller.ts
│   └── admin.controller.ts
├── routes/          # API 라우트 정의
│   ├── auth.routes.ts
│   ├── file.routes.ts
│   ├── search.routes.ts
│   └── ...
├── services/        # 핵심 비즈니스 서비스
│   ├── elasticsearch.service.ts  # 검색 엔진
│   ├── socket.service.ts         # 실시간 알림
│   ├── payment.service.ts        # 결제 처리
│   ├── fileStorage.service.ts    # 파일 저장
│   ├── twoFactor.service.ts      # 2FA 인증
│   └── imageProcessor.ts         # 이미지 처리
├── middleware/      # Express 미들웨어
│   ├── auth.ts      # JWT 인증
│   ├── upload.ts    # 파일 업로드
│   └── rateLimit.ts # Rate limiting
├── utils/           # 유틸리티 함수
└── config/          # 설정 파일
    ├── passport.ts  # OAuth 설정
    └── database.ts  # DB 연결
```

**API 엔드포인트** (30+):
```
인증:
POST   /api/auth/register        # 회원가입
POST   /api/auth/login           # 로그인
GET    /api/auth/me              # 현재 사용자
POST   /api/auth/logout          # 로그아웃
GET    /api/auth/google          # Google OAuth
GET    /api/auth/kakao           # Kakao OAuth

파일:
GET    /api/files                # 파일 목록 (페이지네이션)
GET    /api/files/:id            # 파일 상세
POST   /api/files/upload         # 파일 업로드
POST   /api/files/:id/download   # 파일 다운로드
POST   /api/files/:id/purchase   # 파일 구매
POST   /api/files/:id/favorite   # 찜하기
POST   /api/files/:id/rate       # 평가

검색:
GET    /api/search               # Elasticsearch 검색
GET    /api/search/suggest       # 자동완성

결제:
POST   /api/payments/request     # 결제 요청
POST   /api/payments/confirm     # 결제 확인
GET    /api/payments/transactions # 거래 내역

사용자:
GET    /api/users/profile        # 프로필 조회
PUT    /api/users/profile        # 프로필 수정
GET    /api/users/purchases      # 구매 내역
GET    /api/users/downloads      # 다운로드 내역

관리자:
GET    /api/admin/dashboard      # 대시보드 통계
GET    /api/admin/users          # 사용자 관리
GET    /api/admin/files          # 파일 관리
PUT    /api/admin/files/:id/approve # 파일 승인
```

### 4. 데이터 레이어

#### PostgreSQL (메인 데이터베이스)

**데이터베이스 스키마** (15개 모델):
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────▶│ Purchase │◀────│   File   │
└──────────┘     └──────────┘     └──────────┘
     │                │                 │
     │                │                 ▼
     ▼                │            ┌──────────┐
┌──────────┐          │            │ Category │
│Transaction│         │            └──────────┘
└──────────┘          │                 │
     │                │                 ▼
     ▼                │            ┌──────────┐
┌──────────┐          │            │   Tag    │
│  Coupon  │          │            └──────────┘
└──────────┘          │
                     ▼
              ┌──────────┐
              │ Download │
              └──────────┘
                     │
                     ▼
              ┌──────────┐
              │ Comment  │
              └──────────┘
                     │
                     ▼
              ┌──────────┐
              │  Rating  │
              └──────────┘
```

**주요 모델**:
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  username     String   @unique
  password     String
  displayName  String?
  cash         Int      @default(0)
  point        Int      @default(0)
  membership   MembershipLevel @default(BASIC)
  twoFactorSecret String?  # 2FA
  files        File[]
  purchases    Purchase[]
  downloads    Download[]
  comments     Comment[]
  ratings      Rating[]
  favorites    Favorite[]
}

model File {
  id           String   @id @default(uuid())
  title        String
  description  String?
  fileName     String
  filePath     String
  fileSize     BigInt
  mimeType     String
  thumbnailUrl String?
  price        Int      @default(0)
  priceType    PriceType @default(FREE)
  status       FileStatus @default(PENDING)
  downloadCount Int     @default(0)
  viewCount    Int      @default(0)
  ratingAverage Float   @default(0)
  ratingCount  Int      @default(0)
  category     Category @relation(fields: [categoryId])
  user         User     @relation(fields: [userId])
  tags         Tag[]
}
```

#### Redis (캐싱 및 세션)

**캐시 전략**:
```
키 패턴:
- user:{id}           # 사용자 정보 (TTL: 1시간)
- file:{id}           # 파일 메타데이터 (TTL: 30분)
- stats:files         # 파일 통계 (TTL: 5분)
- popular:files       # 인기 파일 (TTL: 10분)
- search:{query}      # 검색 결과 (TTL: 5분)

세션 관리:
- session:{token}     # JWT 세션 (TTL: 7일)
```

#### Elasticsearch (검색 엔진)

**인덱스 구조**:
```json
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "korean",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "description": { "type": "text", "analyzer": "korean" },
      "category": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" }
        }
      },
      "tags": { "type": "keyword" },
      "price": { "type": "integer" },
      "downloadCount": { "type": "integer" },
      "viewCount": { "type": "integer" },
      "ratingAverage": { "type": "float" }
    }
  }
}
```

**검색 기능**:
- 전문 검색 (Full-text search)
- 한국어 형태소 분석
- 자동완성 (Auto-suggest)
- 필터링 (카테고리, 태그, 가격)
- 정렬 (최신순, 인기순, 평점순)
- 페이지네이션

### 5. 스토리지 레이어

#### MinIO (S3 호환 객체 스토리지)

**버킷 구조**:
```
wedisk-files/
├── uploads/              # 업로드된 파일
│   ├── {year}/
│   │   ├── {month}/
│   │   │   └── {uuid}.{ext}
│   └── ...
├── thumbnails/           # 썸네일 이미지
│   ├── small/            # 150x150
│   ├── medium/           # 300x300
│   └── large/            # 800x600
└── temp/                 # 임시 파일
```

**파일 업로드 플로우**:
```
1. 클라이언트 → Backend (Multipart upload)
2. Backend → Sharp (이미지 처리)
3. Sharp → MinIO (원본 + 썸네일 저장)
4. MinIO → Signed URL 생성 (다운로드용)
5. Backend → Elasticsearch (메타데이터 인덱싱)
6. Backend → PostgreSQL (파일 정보 저장)
```

### 6. 실시간 통신 레이어

#### Socket.io (WebSocket)

**이벤트 구조**:
```javascript
서버 → 클라이언트:
- 'notification'        # 일반 알림
- 'file:approved'       # 파일 승인
- 'file:purchased'      # 파일 구매
- 'payment:completed'   # 결제 완료
- 'upload:progress'     # 업로드 진행률

클라이언트 → 서버:
- 'join:room'           # 방 참여
- 'leave:room'          # 방 나가기
- 'mark:read'           # 읽음 처리
```

**Room 구조**:
```
user:{userId}       # 개인 알림
admin:all           # 관리자 전체
seller:{userId}     # 판매자 알림
```

---

## 🔐 보안 아키텍처

### 인증 및 권한

```
┌──────────────────────────────────────────────┐
│            인증 플로우                         │
├──────────────────────────────────────────────┤
│ 1. 클라이언트 → POST /api/auth/login         │
│    { email, password }                       │
│                                              │
│ 2. Backend → Bcrypt 비밀번호 검증            │
│                                              │
│ 3. Backend → JWT 토큰 생성                   │
│    {                                         │
│      userId, email, role,                    │
│      exp: 7일                                │
│    }                                         │
│                                              │
│ 4. Backend → Redis 세션 저장                 │
│    SET session:{token} {userId} EX 604800   │
│                                              │
│ 5. Backend → 클라이언트                      │
│    { token, user }                           │
│                                              │
│ 6. 클라이언트 → localStorage/SecureStore     │
│    저장                                      │
│                                              │
│ 7. 이후 요청 → Authorization: Bearer {token}│
│                                              │
│ 8. Middleware → JWT 검증                     │
│    - 토큰 유효성                             │
│    - Redis 세션 확인                         │
│    - 사용자 권한 확인                        │
└──────────────────────────────────────────────┘
```

### 2FA (Two-Factor Authentication)

```
┌──────────────────────────────────────────────┐
│         2FA 활성화 플로우                      │
├──────────────────────────────────────────────┤
│ 1. 사용자 → 2FA 활성화 요청                   │
│                                              │
│ 2. Backend → Speakeasy Secret 생성           │
│    base32: "JBSWY3DPEHPK3PXP"               │
│                                              │
│ 3. Backend → QR 코드 생성                    │
│    otpauth://totp/WeDisk:user@example.com   │
│                                              │
│ 4. 사용자 → Authenticator 앱에 등록          │
│    (Google Auth, Authy 등)                  │
│                                              │
│ 5. 사용자 → TOTP 코드 입력 (123456)          │
│                                              │
│ 6. Backend → Speakeasy 검증                  │
│    verify(secret, token, window: 2)         │
│                                              │
│ 7. Backend → DB 저장                         │
│    UPDATE user SET twoFactorSecret = secret │
│                                              │
│ 8. Backend → 백업 코드 생성 (10개)            │
│    ["ABC123", "DEF456", ...]                │
└──────────────────────────────────────────────┘
```

---

## 📊 모니터링 아키텍처

### Prometheus + Grafana

```
┌──────────────┐
│  Application │ ──metrics──▶ ┌────────────┐
│   (Backend)  │              │ Prometheus │
└──────────────┘              │  (수집)     │
                              └──────┬─────┘
┌──────────────┐                     │
│  PostgreSQL  │ ──metrics──▶        │
└──────────────┘                     │
                                     │ scrape
┌──────────────┐                     │ (15s)
│    Redis     │ ──metrics──▶        │
└──────────────┘                     │
                                     │
┌──────────────┐                     │
│   Nginx      │ ──metrics──▶        │
└──────────────┘                     ▼
                              ┌────────────┐
                              │  Grafana   │
                              │ (시각화)    │
                              └────────────┘
```

**수집 메트릭**:
- API 응답 시간 (p50, p95, p99)
- 요청 처리량 (req/sec)
- 에러율 (4xx, 5xx)
- DB 쿼리 성능
- Redis Hit/Miss Rate
- 파일 업로드/다운로드 속도
- 메모리/CPU 사용률

---

## 🚀 배포 아키텍처

### Docker Compose 프로덕션

```yaml
services:
  nginx:        # 프론트 게이트웨이
  backend:      # API 서버 (2 replicas)
  frontend:     # React SPA
  postgres:     # 메인 DB
  redis:        # 캐시
  elasticsearch:# 검색 엔진
  minio:        # 파일 저장소
  prometheus:   # 메트릭 수집
  grafana:      # 모니터링 대시보드
```

### CI/CD 파이프라인

```
GitHub Push
    │
    ▼
┌─────────────────┐
│ GitHub Actions  │
│                 │
│ 1. Checkout     │
│ 2. Setup Node   │
│ 3. Install Deps │
│ 4. Run Tests    │
│ 5. Build        │
│ 6. Docker Build │
│ 7. Push Image   │
│ 8. Deploy       │
└─────────────────┘
    │
    ▼
Production Server
```

---

## 📈 확장성 및 성능

### 수평 확장 (Horizontal Scaling)

```
Load Balancer (Nginx)
         │
    ┌────┼────┬────┬────┐
    ▼    ▼    ▼    ▼    ▼
Backend Backend Backend Backend
  #1     #2     #3     #4
    │    │    │    │    │
    └────┴────┴────┴────┘
              │
              ▼
    ┌─────────────────┐
    │  Shared Redis   │
    │  Shared DB      │
    │  Shared MinIO   │
    └─────────────────┘
```

### 캐싱 전략

```
요청 → Nginx (정적 파일)
    ↓ miss
    → Redis (동적 데이터)
        ↓ miss
        → PostgreSQL (원본)
            ↓
            → Redis 저장
            → 응답
```

---

## 🔄 데이터 플로우 예시

### 파일 다운로드 플로우

```
1. 클라이언트 → POST /api/files/:id/download

2. Backend Middleware → JWT 검증

3. Backend → PostgreSQL
   SELECT * FROM File WHERE id = :id

4. Backend → PostgreSQL (구매 여부 확인)
   SELECT * FROM Purchase
   WHERE userId = :userId AND fileId = :fileId

5. Backend → MinIO (Signed URL 생성)
   getSignedUrl(bucket, filePath, expiresIn: 3600)

6. Backend → PostgreSQL (다운로드 기록)
   INSERT INTO Download (...) VALUES (...)

7. Backend → PostgreSQL (다운로드 카운트 증가)
   UPDATE File SET downloadCount = downloadCount + 1

8. Backend → Socket.io (판매자 알림)
   emit('file:downloaded', { fileId, userId })

9. Backend → 클라이언트
   { downloadUrl, expiresIn }

10. 클라이언트 → MinIO (직접 다운로드)
    GET signed-url
```

---

## 📝 코드 품질

### 테스트 전략

```
단위 테스트 (Unit Tests)
├── Services
│   ├── Payment Service
│   ├── File Storage Service
│   └── Elasticsearch Service
└── Utilities

통합 테스트 (Integration Tests)
├── API Endpoints
│   ├── Auth API
│   ├── Files API
│   └── Payment API
└── Database Operations

E2E 테스트 (End-to-End)
└── 사용자 시나리오
    ├── 회원가입 → 로그인
    ├── 파일 업로드 → 승인 → 구매 → 다운로드
    └── 결제 플로우
```

---

## 🎯 최적화 포인트

1. **Database**
   - 인덱싱 (user_id, category_id, created_at)
   - Connection Pooling
   - Query 최적화

2. **Caching**
   - Redis 캐싱 (파일 메타데이터, 통계)
   - Nginx 정적 파일 캐싱
   - CDN 활용 (이미지, CSS, JS)

3. **Search**
   - Elasticsearch 샤딩
   - 비동기 인덱싱
   - 검색 결과 캐싱

4. **File Storage**
   - Signed URL (직접 다운로드)
   - Multipart Upload (대용량)
   - 썸네일 최적화 (Sharp)

5. **API**
   - Rate Limiting
   - Response Compression
   - Pagination
   - Field Selection

---

## 📚 참고 자료

- [Prisma ORM 문서](https://www.prisma.io/docs)
- [Elasticsearch 가이드](https://www.elastic.co/guide)
- [Socket.io 문서](https://socket.io/docs)
- [MinIO 문서](https://min.io/docs)
- [Nginx 설정 가이드](https://nginx.org/en/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**작성일**: 2024-11-21
**버전**: 1.0
**WeDisk Clone Project**
