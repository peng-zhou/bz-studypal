import { PrismaClient } from '@prisma/client';

// 全局Prisma客户端单例
let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
  });
} else {
  // 在开发环境中使用全局变量避免热重载时创建多个连接
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

// 优雅关闭处理
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
