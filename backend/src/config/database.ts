import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// ============================================
// Prisma Singleton Pattern for Serverless
// ============================================
// Serverless 환경(Vercel, AWS Lambda 등)에서 Connection Pool 고갈 방지
// Hot Reload 시에도 새 인스턴스 생성 방지

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma Client with optimized settings
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    // Connection Pool 설정 (schema.prisma의 datasource와 함께 작동)
    // PgBouncer 사용 시 transaction 모드 권장
  });
};

// Singleton 인스턴스 생성 또는 재사용
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// 개발 환경에서만 global에 저장 (프로덕션에서는 불필요)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Redis Client
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

// Database connection
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});

export default prisma;
