import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('../src/utils/database', () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    subject: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  }
}));

// Mock JWT Service
jest.mock('../src/utils/jwt', () => ({
  JWTService: {
    generateAccessToken: jest.fn(() => 'mock-access-token'),
    generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
    verifyAccessToken: jest.fn(() => ({ userId: 'mock-user-id' })),
    verifyRefreshToken: jest.fn(() => ({ userId: 'mock-user-id' })),
    extractTokenFromHeader: jest.fn((header: string) => {
      if (header.startsWith('Bearer ')) {
        return header.substring(7);
      }
      return null;
    }),
  }
}));

// 全局测试环境设置
beforeAll(() => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
});

afterAll(() => {
  // 清理
  jest.clearAllMocks();
});

// 在每个测试之前重置所有mocks
beforeEach(() => {
  jest.clearAllMocks();
});
