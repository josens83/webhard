# EduVault - Educational Content Platform 🎓

World-class educational platform with AI-powered learning, blockchain copyright protection, and institutional-grade course management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## 🌟 Overview

EduVault is a comprehensive educational content marketplace that combines the best features of Google Drive for Education, Coursera, and TeachersPayTeachers, enhanced with cutting-edge AI and blockchain technology.

### Key Differentiators

✅ **AI-Powered Learning** - GPT-4 tutoring, automated quiz generation, personalized learning paths
✅ **Blockchain Copyright** - Decentralized content protection with IPFS and NFT support
✅ **Professional Certificates** - Blockchain-verified course completion credentials
✅ **Open Platform** - Any educator can create and monetize quality content
✅ **Institutional Support** - Schools, universities, and training centers
✅ **Quality Assurance** - AI-powered content analysis and pedagogical scoring

## 🎯 Core Features

### For Students
- 📚 **Course Enrollment** - Access thousands of courses across all subjects
- 🤖 **AI Tutoring** - 24/7 personalized learning assistance
- 📊 **Progress Tracking** - Detailed analytics and learning insights
- 🏆 **Certificates** - Blockchain-verified completion certificates
- 🎯 **Learning Paths** - AI-generated personalized curricula
- 💬 **Interactive Learning** - Quizzes, assignments, and assessments

### For Educators & Creators
- 📝 **Course Creation** - Intuitive course builder with multimedia support
- 🔐 **Copyright Protection** - Blockchain registration with IPFS storage
- 💰 **Monetization** - Flexible pricing with multiple license types
- 📈 **Analytics** - Student performance and engagement metrics
- 🤖 **AI Tools** - Automated quiz generation and content analysis
- ✅ **Quality Scoring** - AI-based pedagogical and quality assessment

### For Institutions
- 🏫 **Institution Management** - School and university administration
- 👥 **Member Management** - Student and faculty accounts
- 📊 **Institutional Analytics** - Organization-wide insights
- 🎓 **Curriculum Alignment** - Common Core, IB, AP standards
- 🔄 **LMS Integration** - Canvas, Blackboard, Moodle (coming soon)

## 🏗️ Technology Stack

### Backend
- **Runtime:** Node.js 18 + Express + TypeScript
- **Database:** PostgreSQL 15 with Prisma ORM
- **Cache:** Redis 7
- **Search:** Elasticsearch 8.11
- **AI:** OpenAI GPT-4 for tutoring and content generation
- **Blockchain:** Ethers.js (Ethereum/Polygon)
- **Storage:** IPFS for decentralized content storage
- **File Storage:** AWS S3 / MinIO
- **Authentication:** JWT + 2FA (TOTP)
- **Real-time:** Socket.io

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS with Dark Mode
- **State Management:** Zustand + React Query
- **Routing:** React Router v6
- **Charts:** Recharts
- **Markdown:** React Markdown
- **Video:** React Player
- **Animations:** Framer Motion
- **i18n:** i18next (Korean/English)

### Mobile
- **Framework:** React Native 0.73
- **Platform:** Expo 50
- **Navigation:** React Navigation
- **Storage:** Expo SecureStore

### AI & ML
- **Language Model:** OpenAI GPT-4
- **NLP:** node-nlp for content analysis
- **Content Processing:** PDF Parse, Mammoth, XLSX, Cheerio

### Media Processing
- **Images:** Sharp, Jimp, Canvas
- **Video:** FFmpeg (fluent-ffmpeg)
- **Documents:** PDFKit, Puppeteer

### DevOps
- **Containerization:** Docker + Docker Compose
- **Web Server:** Nginx
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Job Scheduling:** Agenda, Cron

## 📦 Project Structure

```
eduvault/
├── backend/                    # Node.js API Server
│   ├── src/
│   │   ├── routes/            # API Routes
│   │   │   ├── course.routes.ts
│   │   │   ├── ai-learning.routes.ts
│   │   │   ├── certificate.routes.ts
│   │   │   ├── copyright.routes.ts
│   │   │   └── ... (auth, user, file, etc.)
│   │   ├── services/          # Business Logic
│   │   │   ├── course.service.ts
│   │   │   ├── ai-learning.service.ts
│   │   │   ├── certificate.service.ts
│   │   │   ├── blockchain-copyright.service.ts
│   │   │   └── ...
│   │   ├── middleware/        # Auth, validation, etc.
│   │   └── index.ts          # Main server file
│   ├── prisma/
│   │   └── schema.prisma     # Database schema (1,215 lines)
│   └── package.json          # eduvault-backend v2.0.0
├── frontend/                  # React Web App
│   ├── src/
│   │   ├── components/       # Reusable Components
│   │   │   ├── CourseCard.tsx
│   │   │   ├── LessonPlayer.tsx
│   │   │   ├── Quiz.tsx
│   │   │   └── ...
│   │   ├── pages/           # Page Components
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── ...
│   │   ├── contexts/        # React Context
│   │   │   └── ThemeContext.tsx
│   │   └── i18n/           # Internationalization
│   └── package.json        # eduvault-frontend v2.0.0
├── mobile/                 # React Native Mobile App
│   ├── src/
│   │   ├── screens/
│   │   │   ├── UploadScreen.tsx
│   │   │   └── ...
│   │   └── ...
│   └── package.json
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── ARCHITECTURE.md         # System architecture (685 lines)
├── EDUVAULT_TRANSFORMATION.md  # Transformation guide (420 lines)
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+
- (Optional) IPFS node or Infura account
- (Optional) Ethereum/Polygon RPC endpoint

### 1. Clone Repository
```bash
git clone https://github.com/josens83/webhard.git
cd webhard
```

### 2. Environment Setup

Create `.env` file in `backend/`:
```bash
# Database
DATABASE_URL="postgresql://eduvault:password@localhost:5432/eduvault"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"

# OpenAI (Required for AI features)
OPENAI_API_KEY="sk-..."

# Blockchain (Optional - for copyright protection)
BLOCKCHAIN_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR-KEY"
BLOCKCHAIN_PRIVATE_KEY="0x..."
COPYRIGHT_CONTRACT_ADDRESS="0x..."
BLOCKCHAIN_NETWORK="polygon"

# IPFS (Optional - for decentralized storage)
IPFS_HOST="ipfs.infura.io"
IPFS_PORT="5001"
IPFS_PROTOCOL="https"

# AWS S3 or MinIO
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="eduvault"
```

### 3. Start Development Environment

```bash
# Start PostgreSQL, Redis, Elasticsearch
docker-compose up -d

# Backend setup
cd backend
npm install
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
npx prisma migrate dev --name init
npm run seed  # Optional: seed sample data
npm run dev

# In another terminal - Frontend setup
cd frontend
npm install
npm run dev

# Access the platform
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api
# API Docs: http://localhost:4000/api-docs
```

### 4. Mobile App (Optional)

```bash
cd mobile
npm install
npx expo start
```

## 📚 API Documentation

### Educational Platform Endpoints

#### Courses
```
POST   /api/courses              Create course
GET    /api/courses              Search courses
GET    /api/courses/:id          Get course details
PUT    /api/courses/:id          Update course
POST   /api/courses/:id/publish  Publish course
POST   /api/courses/:id/enroll   Enroll in course
GET    /api/courses/:id/stats    Get course statistics
DELETE /api/courses/:id          Delete course
GET    /api/courses/my/enrollments  Get user enrollments
```

#### AI Learning
```
POST   /api/ai-learning/quiz/generate      Generate quiz questions
POST   /api/ai-learning/tutoring           Get AI tutoring help
POST   /api/ai-learning/learning-path      Generate learning path
POST   /api/ai-learning/content/analyze    Analyze content quality
POST   /api/ai-learning/plagiarism/check   Check plagiarism
POST   /api/ai-learning/content/summarize  Generate summary
POST   /api/ai-learning/content/translate  Translate content
```

#### Certificates
```
POST   /api/certificates/issue           Issue certificate
GET    /api/certificates/verify/:code    Verify certificate
GET    /api/certificates/my              Get user certificates
POST   /api/certificates/:id/blockchain  Add blockchain hash
```

#### Copyright Protection
```
POST   /api/copyright/register           Register copyright
GET    /api/copyright/verify/:tokenId    Verify on blockchain
GET    /api/copyright/file/:fileId       Get copyright record
GET    /api/copyright/my                 Get user copyrights
POST   /api/copyright/:id/nft            Create NFT
POST   /api/copyright/check-originality  Check content originality
```

Visit http://localhost:4000/api-docs for complete API documentation (Swagger UI).

## 🗄️ Database Schema

### Educational Models
- **Institution** - Educational organizations (schools, universities)
- **Course** - Structured learning courses
- **Lesson** - Individual learning units
- **Enrollment** - Student course registrations
- **LessonProgress** - Granular progress tracking
- **Quiz/Question/Answer** - Assessment system
- **QuizAttempt** - Quiz submissions and scoring
- **Certificate** - Course completion certificates
- **LearningPath** - AI-generated learning curricula
- **CopyrightRecord** - Blockchain copyright protection
- **AIInteraction** - AI tutoring analytics

### Enhanced Models
- **User** - Educational roles (Student, Teacher, Creator, Institution Admin)
- **Category** - Educational taxonomy (K-12, University, Professional, etc.)
- **File** - Learning objectives, quality scores, CC licenses

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed schema documentation.

## 🎓 Educational Features

### AI-Powered Quiz Generation
```typescript
// Generate 10 multiple-choice questions about any topic
const quiz = await fetch('/api/ai-learning/quiz/generate', {
  method: 'POST',
  body: JSON.stringify({
    topic: "Photosynthesis",
    difficulty: "INTERMEDIATE",
    questionCount: 10,
    questionType: "multiple_choice"
  })
});
```

### AI Tutoring
```typescript
// Get personalized tutoring help
const help = await fetch('/api/ai-learning/tutoring', {
  method: 'POST',
  body: JSON.stringify({
    subject: "Mathematics",
    question: "How do I solve quadratic equations?",
    context: "Learning algebra for the first time"
  })
});
```

### Learning Path Generation
```typescript
// Generate personalized learning path
const path = await fetch('/api/ai-learning/learning-path', {
  method: 'POST',
  body: JSON.stringify({
    targetRole: "Data Scientist",
    currentLevel: "BEGINNER",
    interests: ["Python", "Statistics", "Machine Learning"],
    timeCommitment: 10 // hours per week
  })
});
```

### Blockchain Copyright Registration
```typescript
// Register copyright on blockchain with IPFS
const copyright = await fetch('/api/copyright/register', {
  method: 'POST',
  body: JSON.stringify({
    title: "Advanced Calculus Course",
    description: "Comprehensive calculus curriculum",
    licenseType: "CC_BY_SA",
    content: base64EncodedContent // Uploads to IPFS
  })
});
```

## 📊 Monitoring & Analytics

### Grafana Dashboards
Access at http://localhost:3001 (production)

Monitors:
- API response times and throughput
- Database query performance
- Redis cache hit rates
- System resource utilization
- Error logs and alerts
- Course enrollment trends
- Student engagement metrics

### Prometheus Metrics
- Custom educational metrics
- Course completion rates
- AI API usage and costs
- Certificate generation stats
- Blockchain transaction monitoring

## 🔒 Security

### Content Protection
- **Blockchain Copyright** - Immutable ownership records on Ethereum/Polygon
- **IPFS Storage** - Decentralized, tamper-proof content storage
- **NFT Support** - Tokenize premium educational content
- **Plagiarism Detection** - AI-powered originality verification
- **Digital Watermarking** - Content attribution and protection

### Access Control
- **Role-Based Access** - Student, Teacher, Creator, Institution Admin, Super Admin
- **Course Enrollment Gates** - Purchase and access validation
- **License Management** - Creative Commons and proprietary licenses
- **2FA Authentication** - TOTP-based two-factor auth
- **Institution Verification** - Accreditation validation

## 🌍 Internationalization

Supported languages:
- 🇰🇷 Korean (기본)
- 🇺🇸 English

Add translations in `frontend/src/i18n/locales/`

## 🚀 Production Deployment

### Using Docker Compose

```bash
# Build and start production environment
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose -f docker-compose.prod.yml exec backend npx prisma generate

# Seed initial data (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### Environment Variables (Production)

See `.env.production.example` for complete list.

Critical production settings:
- Set strong `JWT_SECRET`
- Configure `OPENAI_API_KEY` for AI features
- Set up blockchain RPC endpoints for copyright features
- Configure SMTP for email notifications
- Set up SSL certificates (Let's Encrypt recommended)
- Configure backup schedule for database
- Set up monitoring alerts

## 📈 Roadmap

### Phase 2 (Q1 2025)
- [ ] LMS Integration (Canvas, Blackboard, Moodle)
- [ ] Live Session Support (WebRTC)
- [ ] Mobile App Enhancements (offline mode, push notifications)
- [ ] AR/VR Learning Modules
- [ ] Advanced Analytics Dashboard
- [ ] Gamification System (badges, leaderboards)

### Phase 3 (Q2 2025)
- [ ] Peer Review System
- [ ] Discussion Forums
- [ ] Assignment Submission & Grading
- [ ] Grade Books
- [ ] Parent Portal
- [ ] White-label Solutions
- [ ] API for Third-party Developers

## 📖 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Complete system architecture (685 lines)
- [EDUVAULT_TRANSFORMATION.md](EDUVAULT_TRANSFORMATION.md) - Transformation guide (420 lines)
- [FEATURES.md](FEATURES.md) - Feature implementation details
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- API Documentation: http://localhost:4000/api-docs (Swagger UI)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The platform supports multiple content licenses:
- All Rights Reserved (default)
- Creative Commons (BY, BY-SA, BY-NC, BY-NC-SA, BY-ND, BY-NC-ND)
- CC0 (Public Domain)
- Educational Use Only

## 👥 Team

- **Project Lead:** EduVault Team
- **Backend:** Node.js + TypeScript specialists
- **Frontend:** React experts
- **AI/ML:** OpenAI integration specialists
- **Blockchain:** Ethereum/IPFS developers

## 📞 Support

- **Email:** support@eduvault.com
- **Documentation:** https://docs.eduvault.com
- **GitHub Issues:** https://github.com/josens83/webhard/issues
- **Community:** https://community.eduvault.com

## ⚠️ Important Notes

**For Production:**
1. ✅ Use strong passwords and JWT secrets
2. ✅ Configure SSL/TLS certificates (Let's Encrypt)
3. ✅ Secure environment variables
4. ✅ Set up regular database backups
5. ✅ Configure monitoring and alerts
6. ✅ Implement rate limiting
7. ✅ Set up CORS properly
8. ✅ Configure OpenAI API rate limits
9. ✅ Secure blockchain private keys

**AI Features:**
- OpenAI GPT-4 API is required for AI tutoring and content generation
- Monitor API usage to control costs
- Implement caching for frequently asked questions
- Set up fallback mechanisms for API failures

**Blockchain Features:**
- Blockchain features are optional but recommended
- Requires Ethereum/Polygon RPC endpoint (Infura, Alchemy)
- IPFS can use Infura or self-hosted node
- Smart contract deployment needed for full functionality

---

**EduVault** - Empowering Education Through Technology 🎓

Built with ❤️ for educators, students, and lifelong learners worldwide.
