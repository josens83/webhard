# Project: EduVault (Educational Cloud Storage Platform)

## Overview
EduVault is a comprehensive educational cloud storage platform similar to wedisk.co.kr. It provides file storage, sharing, messaging between users, and administrative features for educational institutions.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Real-time**: Socket.io
- **Auth**: JWT + bcrypt
- **Payments**: Toss Payments integration
- **Deployment**: Vercel (Frontend) / Railway (Backend)

## Project Structure
```
webhard/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service calls
│   │   ├── store/          # State management
│   │   └── types/          # TypeScript types
│   └── package.json
│
├── backend/                # Express backend API
│   ├── src/
│   │   ├── config/         # Configuration (database, etc.)
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
│
├── .github/workflows/      # CI/CD pipelines
├── docs/                   # Documentation
└── package.json            # Root package (Husky, lint-staged)
```

## Commands

### Root Level
- `npm run verify` - Run typecheck + lint + build for all projects
- `npm run lint` - Run ESLint on all projects
- `npm run typecheck` - Run TypeScript checks on all projects

### Backend
- `npm run dev --prefix backend` - Start dev server
- `npm run build --prefix backend` - Build for production
- `npm run typecheck --prefix backend` - TypeScript check
- `npx prisma studio --prefix backend` - Database GUI
- `npx prisma migrate dev --prefix backend` - Run migrations

### Frontend
- `npm run dev --prefix frontend` - Start dev server (http://localhost:5173)
- `npm run build --prefix frontend` - Build for production
- `npm run typecheck --prefix frontend` - TypeScript check

## Coding Conventions
- Functional components with React Hooks
- TypeScript strict mode enabled
- Absolute imports with `@/` prefix
- Korean comments OK, variable names in English
- Conventional Commits format (feat, fix, docs, etc.)

## Current Features
- [x] User authentication (register, login, JWT)
- [x] File upload/download/management
- [x] Folder structure management
- [x] File sharing with links
- [x] Real-time messaging (Socket.io)
- [x] Friend system
- [x] Admin dashboard
- [x] Payment integration (Toss)
- [x] Advanced search with filters
- [x] File preview (images, PDFs, videos)

## Important Notes
- **Prisma**: Always run `npx prisma generate` after schema changes
- **Environment**: Use `.env` files for secrets (never commit)
- **Pre-deploy**: Always run `npm run verify` before deploying
- **Database**: Prisma singleton pattern for serverless environments
- **Ports**: Backend uses PORT env variable for Railway compatibility

## API Base URLs
- Development: http://localhost:4000/api
- Production: Configured via VITE_API_URL

## Database Schema Key Models
- User: Authentication, profile, storage quota
- File: File metadata, storage paths
- Folder: Hierarchical folder structure
- Share: File/folder sharing links
- Message: Real-time chat messages
- Friendship: User connections
- Payment: Transaction records
