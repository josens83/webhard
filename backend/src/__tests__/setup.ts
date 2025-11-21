import { prisma } from '../config/database';

beforeAll(async () => {
  // Setup test database
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
});
