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

## Design System

### Available UI Components
Use these existing components instead of creating new ones:

```
frontend/src/components/ui/
├── Button.tsx       - Primary action buttons
├── Card.tsx         - Content containers
├── Input.tsx        - Text inputs
├── Modal.tsx        - Dialog/popup windows
├── Skeleton.tsx     - Loading placeholders
├── EmptyState.tsx   - Empty data displays
├── ErrorState.tsx   - Error displays with retry
├── DataContainer.tsx - Unified state management
└── Toast/           - Notification system
```

### Import Paths
```tsx
// Correct imports
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { ErrorState } from "@/components/ui/ErrorState"

// Wrong - do not create new components
import { Button } from "./Button"
```

### Color Tokens (Tailwind)
```
Background:    bg-background, bg-card, bg-muted
Text:          text-foreground, text-muted-foreground
Primary:       bg-primary, text-primary-foreground
Destructive:   bg-destructive, text-destructive
Border:        border-border, border-input
```

### Spacing Guidelines
- Component gap: `gap-4` or `space-y-4`
- Section padding: `p-6` or `py-8`
- Card padding: `p-4` or `p-6`

### Required UI States
Every data-fetching component MUST implement:
1. **Loading**: Use Skeleton UI (not Spinner)
2. **Success**: Display actual data
3. **Empty**: Icon + message + CTA button
4. **Error**: Error message + retry button

### Responsive Breakpoints
```
Mobile:  default (< 640px)
Tablet:  sm (640px), md (768px)
Desktop: lg (1024px), xl (1280px)

// Always mobile-first
className="w-full sm:w-1/2 lg:w-1/3"
```

### Accessibility Requirements
- All images must have meaningful alt text
- All form inputs must have associated labels
- Buttons must have clear text or aria-label
- Focus states must be visible (focus-visible)
- Color contrast ratio: 4.5:1 minimum

### Prohibited Practices
- Inline styles (use Tailwind classes)
- Hardcoded colors (use design tokens)
- Creating new components when existing ones work
- Skipping loading/error/empty states
- Using `!important`
