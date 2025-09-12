import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';
import { prisma } from '../utils/database';

// 简单的内存缓存用于存储用户信息
class UserCache {
  private cache = new Map<string, { user: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5分钟缓存

  get(userId: string) {
    const cached = this.cache.get(userId);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(userId);
      return null;
    }
    
    return cached.user;
  }

  set(userId: string, user: any) {
    this.cache.set(userId, {
      user,
      timestamp: Date.now()
    });
  }

  delete(userId: string) {
    this.cache.delete(userId);
  }

  clear() {
    this.cache.clear();
  }
}

const userCache = new UserCache();

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name?: string;
      };
    }
  }
}

/**
 * 认证中间件 - 验证JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从多个来源获取token
    let token: string | null = null;

    // 1. 从Authorization header获取
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = JWTService.extractTokenFromHeader(authHeader);
    }

    // 2. 从cookie获取
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
      return;
    }

    // 验证token
    let payload;
    try {
      payload = JWTService.verifyAccessToken(token);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired access token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // 先从缓存获取用户信息
    let user = userCache.get(payload.userId);
    
    if (!user) {
      // 缓存未命中，从数据库获取
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true
        }
      });
      
      if (user) {
        userCache.set(payload.userId, user);
      }
    }

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'Account is suspended or inactive',
        code: 'ACCOUNT_INACTIVE'
      });
      return;
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      ...(user.name && { name: user.name })
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication'
    });
  }
};

/**
 * 可选认证中间件 - token存在时验证，不存在时继续
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从多个来源获取token
    let token: string | null = null;

    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = JWTService.extractTokenFromHeader(authHeader);
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    // 如果没有token，直接继续
    if (!token) {
      next();
      return;
    }

    // 如果有token，尝试验证
    try {
      const payload = JWTService.verifyAccessToken(token);
      
      // 先从缓存获取用户信息
      let user = userCache.get(payload.userId);
      
      if (!user) {
        user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true
          }
        });
        
        if (user) {
          userCache.set(payload.userId, user);
        }
      }

      if (user && user.status === 'ACTIVE') {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          ...(user.name && { name: user.name })
        };
      }
    } catch (error) {
      // token无效时不报错，继续处理请求
      console.warn('Optional authentication failed:', error);
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // 出错时也继续处理请求
  }
};

/**
 * 角色验证中间件
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * 管理员验证中间件
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * 教师或管理员验证中间件
 */
export const requireTeacherOrAdmin = requireRole(['TEACHER', 'ADMIN']);
