# 배포 가이드

## Supabase + Vercel 배포 (권장)

가장 빠르고 간편한 배포 방법입니다. 무료 플랜으로 시작할 수 있습니다.

### 1. Supabase 설정

#### 1.1 프로젝트 생성
1. [Supabase](https://supabase.com) 접속 → 회원가입/로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `eduvault`
   - **Database Password**: 강력한 비밀번호 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)`
4. "Create new project" 클릭 → 2-3분 대기

#### 1.2 연결 정보 확인
**Settings → Database** 에서:
```bash
# Connection pooling (앱용) - DATABASE_URL로 사용
postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection (마이그레이션용) - DIRECT_URL로 사용
postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

#### 1.3 Storage 설정 (파일 저장용)
1. **Storage** 메뉴 → "New bucket"
2. **Name**: `files`
3. **Public**: Off (비공개)

### 2. 백엔드 배포 (Railway 권장)

#### 2.1 Railway 설정
1. [Railway](https://railway.app) → GitHub 로그인
2. "New Project" → "Deploy from GitHub repo"
3. `webhard` 레포지토리 선택
4. **Settings** 탭:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`

#### 2.2 환경변수 설정
Railway **Variables** 탭에서 추가:
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
JWT_SECRET=your-32-character-secret-key-here
CORS_ORIGIN=https://your-vercel-app.vercel.app
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### 3. 프론트엔드 배포 (Vercel)

#### 3.1 Vercel 설정
1. [Vercel](https://vercel.com) → GitHub 로그인
2. "Import Project" → `webhard` 선택
3. **Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`

#### 3.2 환경변수
```
VITE_API_URL=https://your-railway-app.railway.app/api
VITE_APP_NAME=EduVault
```

### 4. 배포 완료 후 체크리스트
- [ ] 백엔드 URL 접속 테스트: `https://your-app.railway.app/health`
- [ ] 프론트엔드 접속 테스트
- [ ] 회원가입/로그인 테스트
- [ ] 쪽지/친구 기능 테스트

---

## 프로덕션 배포 (기존 방식)

### 1. 환경 변수 설정

#### Backend (.env)
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://user:password@host:5432/webhard"
REDIS_URL="redis://host:6379"
JWT_SECRET="your-secret-key-here"
CORS_ORIGIN="https://your-domain.com"

# AWS S3
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Payment
TOSS_CLIENT_KEY=live_ck_...
TOSS_SECRET_KEY=live_sk_...
```

#### Frontend (.env.production)
```bash
VITE_API_URL=https://api.your-domain.com/api
VITE_APP_NAME=EduVault
```

### 2. Docker 배포

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec backend npm run migrate:deploy

# Run seed (optional)
docker-compose exec backend npm run seed
```

### 3. AWS EC2 배포

```bash
# Connect to EC2
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/josens83/webhard.git
cd webhard

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with production values

# Build and run
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Nginx 설정

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 5. SSL 인증서 (Let's Encrypt)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto renewal
sudo certbot renew --dry-run
```

### 6. 프로세스 관리 (PM2)

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start npm --name "eduvault-backend" -- start

# Start frontend
cd frontend
pm2 start npm --name "eduvault-frontend" -- start

# Save PM2 configuration
pm2 save

# Auto start on reboot
pm2 startup
```

### 7. 모니터링

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs eduvault-backend
pm2 logs eduvault-frontend

# Check status
pm2 status
```

### 8. 백업

```bash
# Database backup
pg_dump -h host -U user -d webhard > backup_$(date +%Y%m%d).sql

# File storage backup (S3)
aws s3 sync s3://your-bucket s3://your-backup-bucket

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres webhard > /backup/db_$DATE.sql
find /backup -name "db_*.sql" -mtime +7 -delete
```

## Vercel 배포 (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

## Railway 배포 (Backend)

1. Railway 웹사이트에서 프로젝트 생성
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포

## 성능 최적화

### 1. PostgreSQL
```sql
-- 인덱스 생성
CREATE INDEX idx_files_category ON files(category_id);
CREATE INDEX idx_files_uploader ON files(uploader_id);
CREATE INDEX idx_files_status ON files(status);

-- 쿼리 최적화
ANALYZE;
VACUUM;
```

### 2. Redis 캐싱
```typescript
// API 응답 캐싱
const cacheKey = `files:popular:${page}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}
// ... fetch from database
await redis.setex(cacheKey, 3600, JSON.stringify(data));
```

### 3. CDN 설정
- CloudFlare or AWS CloudFront
- 정적 파일 캐싱
- 이미지 최적화

## 보안 체크리스트

- [ ] 환경 변수 보안
- [ ] HTTPS 적용
- [ ] Rate limiting 설정
- [ ] CORS 제한
- [ ] SQL Injection 방어
- [ ] XSS 방어
- [ ] CSRF 토큰
- [ ] 파일 업로드 검증
- [ ] 비밀번호 정책
- [ ] 로그 모니터링

## 모니터링 도구

### Sentry (에러 트래킹)
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-dsn",
  environment: "production",
});
```

### Prometheus + Grafana
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'eduvault'
    static_configs:
      - targets: ['localhost:4000']
```

## 문제 해결

### Database Connection Issues
```bash
# Check PostgreSQL
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

### Memory Issues
```bash
# Check memory usage
free -m

# Restart services
pm2 restart all
```

### High CPU Usage
```bash
# Check processes
top
htop

# Optimize queries
EXPLAIN ANALYZE SELECT ...
```
