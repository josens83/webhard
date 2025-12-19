# ADR 002: Prisma Configuration for Serverless Environments

## Status
Accepted

## Date
2024-12-19

## Context
When deploying to serverless platforms (Vercel, Railway), the standard Prisma Client instantiation causes problems:
- Multiple connections created on each function invocation
- Connection pool exhaustion under load
- Cold start performance issues
- Binary engine compatibility across environments

## Options Considered

### Option 1: Default Prisma Setup
**Pros:**
- Simple, no additional configuration

**Cons:**
- Connection exhaustion in serverless
- Each function creates new client
- No connection reuse between invocations

### Option 2: Prisma Singleton Pattern
**Pros:**
- Reuses existing connections in development
- Prevents hot-reload connection leaks
- Standard recommended pattern

**Cons:**
- Slight code complexity
- Still may have issues in high-concurrency serverless

### Option 3: Prisma Accelerate (Connection Pooling Service)
**Pros:**
- Managed connection pooling
- Edge-compatible
- Automatic scaling

**Cons:**
- Additional cost
- External dependency
- Vendor lock-in

## Decision
**Prisma Singleton Pattern (Option 2)** with preparation for Option 3

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Additional Configurations:**
1. `directUrl` in schema for migrations (bypasses connection pooler)
2. `postinstall` script for `prisma generate`
3. Prepared for `engineType: "client"` when Prisma 5.16+ is stable

## Consequences

### Positive
- No connection leaks in development
- Reduced cold start overhead
- Easy upgrade path to Prisma Accelerate

### Negative
- Production still creates new connections per function
- Need PgBouncer or similar for high traffic

### Risks
- **Connection Limits**: Monitor connection count; add PgBouncer if exceeding limits
- **Query Engine Size**: Large binary can increase cold starts; consider `engineType: "client"` for pure JS mode
