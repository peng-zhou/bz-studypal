import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app: Application = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

// 初始化Prisma客户端
const prisma = new PrismaClient();

// 中间件配置
app.use(helmet()); // 安全头
app.use(morgan('combined')); // 日志记录
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 基础路由
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'BZ StudyPal API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/v1',
    }
  });
});

// 健康检查路由
app.get('/health', async (req: Request, res: Response) => {
  try {
    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API v1 基础路由
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'BZ StudyPal API v1',
    version: '1.0.0',
    routes: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      questions: '/api/v1/questions',
      subjects: '/api/v1/subjects',
      bookmarks: '/api/v1/bookmarks',
      reviews: '/api/v1/reviews',
    }
  });
});

// 获取科目列表（测试路由）
app.get('/api/v1/subjects', async (req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { order: 'asc' }
    });
    
    res.json({
      success: true,
      data: subjects,
      count: subjects.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch subjects'
    });
  }
});

// 404处理 - 使用新版path-to-regexp兼容的语法
app.all('/*path', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((error: Error, req: Request, res: Response, next: Function) => {
  console.error('Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`🚀 BZ StudyPal API Server is running!`);
      console.log(`📡 Server: http://${HOST}:${PORT}`);
      console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
      console.log(`📚 API documentation: http://${HOST}:${PORT}/api/v1`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

// 启动服务器
startServer();
