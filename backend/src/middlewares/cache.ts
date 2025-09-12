import { Request, Response, NextFunction } from 'express';

// 简单的内存缓存，用于缓存API响应
class ResponseCache {
  private cache = new Map<string, { 
    data: any; 
    timestamp: number; 
    headers: Record<string, string>;
  }>();
  
  private readonly TTL: Record<string, number> = {
    'default': 2 * 60 * 1000, // 2分钟
    '/api/auth/status': 10 * 60 * 1000, // 10分钟
    '/api/auth/google/config': 30 * 60 * 1000, // 30分钟
  };

  private getCacheTTL(path: string): number {
    return this.TTL[path] || this.TTL['default']!;
  }

  get(key: string, path: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const ttl = this.getCacheTTL(path);
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }

  set(key: string, data: any, path: string, headers: Record<string, string> = {}) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      headers
    });
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // 生成缓存键
  generateKey(req: Request): string {
    const { method, originalUrl, user } = req;
    const userId = user?.id || 'anonymous';
    return `${method}:${originalUrl}:${userId}`;
  }
}

const responseCache = new ResponseCache();

/**
 * 响应缓存中间件
 * 只对GET请求进行缓存
 */
export const cacheResponse = (req: Request, res: Response, next: NextFunction) => {
  // 只缓存GET请求
  if (req.method !== 'GET') {
    return next();
  }

  // 跳过需要实时数据的路由
  const skipCacheRoutes = [
    '/api/auth/profile', // 用户资料可能频繁更新
    '/health' // 健康检查需要实时状态
  ];

  if (skipCacheRoutes.some(route => req.path.includes(route))) {
    return next();
  }

  const cacheKey = responseCache.generateKey(req);
  const cached = responseCache.get(cacheKey, req.path);

  if (cached) {
    // 设置缓存响应头
    Object.keys(cached.headers).forEach(key => {
      const value = cached.headers[key];
      if (value) {
        res.setHeader(key, value);
      }
    });
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached.data);
  }

  // 拦截原始的json方法
  const originalJson = res.json;
  res.json = function(data: any) {
    // 只缓存成功的响应
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const headers: Record<string, string> = {};
      
      // 保存一些重要的响应头
      const headersToCache = ['content-type', 'cache-control'];
      headersToCache.forEach(header => {
        const value = res.getHeader(header);
        if (value) {
          headers[header] = String(value);
        }
      });

      responseCache.set(cacheKey, data, req.path, headers);
      res.setHeader('X-Cache', 'MISS');
    }

    return originalJson.call(this, data);
  };

  next();
};

// 清除用户相关缓存的辅助函数
export const clearUserCache = (userId: string) => {
  // 这里可以实现更精确的缓存清除逻辑
  responseCache.clear();
};

export { responseCache };
