# ADR 001: Technology Stack Selection

## Status
Accepted

## Date
2024-12-19

## Context
EduVault requires a technology stack that supports:
- Rapid development for a solo developer
- Type safety to reduce runtime errors
- Real-time features for messaging
- Scalable file storage handling
- Easy deployment to cloud platforms
- Korean market compatibility

## Options Considered

### Option 1: Next.js Full-Stack (Monolithic)
**Pros:**
- Single codebase, simpler deployment
- Built-in API routes
- Excellent Vercel integration
- SSR/SSG capabilities

**Cons:**
- Backend tightly coupled to frontend
- Harder to scale backend independently
- Limited WebSocket support in serverless

### Option 2: React + Express (Separated Frontend/Backend)
**Pros:**
- Clear separation of concerns
- Independent scaling of frontend and backend
- Full control over backend (WebSockets, file streaming)
- Can deploy to different platforms optimized for each

**Cons:**
- Two codebases to maintain
- CORS configuration needed
- More complex CI/CD setup

### Option 3: Vue.js + NestJS
**Pros:**
- NestJS provides structured backend architecture
- Vue.js has good Korean community
- TypeScript native in NestJS

**Cons:**
- Smaller React ecosystem
- Learning curve for NestJS decorators
- Less community resources for Korean developers

## Decision
**React + Express (Option 2)** with the following specifics:

| Component | Choice | Reasoning |
|-----------|--------|-----------|
| Frontend | React + Vite | Fast development, huge ecosystem |
| Backend | Express + TypeScript | Simple, flexible, great for WebSockets |
| Database | PostgreSQL + Prisma | Type-safe ORM, JSON support |
| Cache | Redis | Session storage, real-time pub/sub |
| Real-time | Socket.io | Reliable WebSocket with fallbacks |
| Styling | Tailwind CSS | Rapid UI development |

**Key Reasons:**
1. **Independent Scaling**: File upload/download is resource-intensive; separating allows backend scaling without affecting frontend
2. **WebSocket Support**: Express + Socket.io provides robust real-time messaging
3. **Deployment Flexibility**: Frontend on Vercel (edge), Backend on Railway (containers)
4. **Prisma ORM**: Type safety across database operations, easy migrations

## Consequences

### Positive
- Clear architecture boundaries
- Each team (even solo) can focus on one area at a time
- Backend can handle long-running operations (file processing)
- Frontend benefits from Vercel's edge network

### Negative
- Two `package.json` files to maintain
- Need to keep API contracts in sync
- CORS and environment variable management complexity

### Risks
- **API Contract Drift**: Mitigate with shared TypeScript types
- **Deployment Complexity**: Mitigate with CI/CD automation (GitHub Actions)
- **Authentication Sync**: Mitigate with JWT tokens validated on both sides
