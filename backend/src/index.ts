import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import { authenticate, optionalAuthenticate } from './middlewares/auth';
import { prisma } from './utils/database';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app: Application = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

// 中间件配置
app.use(helmet()); // 安全头

// 在开发环境中使用更简单的日志格式
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// 优化JSON解析限制
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser()); // Cookie解析中间件

// 添加响应超时保护中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  // 为每个响应设置5秒超时
  res.setTimeout(5000, () => {
    if (!res.headersSent) {
      res.status(503).json({ 
        success: false, 
        error: 'Server response timeout',
        timestamp: new Date().toISOString()
      });
    }
  });
  next();
});

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

// 健康检查路由 - 优化为非阻塞式
app.get('/health', async (req: Request, res: Response) => {
  let databaseStatus = 'unknown';
  
  try {
    // 使用Promise.race实现300ms超时保护
    await Promise.race([
      prisma.$queryRaw`SELECT 1 as test`.then(() => {
        databaseStatus = 'connected';
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DB check timeout')), 300)
      )
    ]);
  } catch (error) {
    // 超时或错误时不阻塞响应
    databaseStatus = 'timeout';
    console.warn('Health check DB timeout or error:', error);
  }
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: databaseStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 认证路由
app.use('/api/auth', authRoutes);

// API v1 基础路由
app.get('/api/v1', optionalAuthenticate, (req: Request, res: Response) => {
  res.json({
    message: 'BZ StudyPal API v1',
    version: '1.0.0',
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    } : null,
    routes: {
      auth: '/api/auth',
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
