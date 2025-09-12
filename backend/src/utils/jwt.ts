import jwt from 'jsonwebtoken';
import { Response } from 'express';

interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

  /**
   * 生成访问令牌和刷新令牌对
   */
  static generateTokenPair(payload: JWTPayload): TokenPair {
    const accessToken = jwt.sign(
      payload,
      this.ACCESS_TOKEN_SECRET as string,
      { 
        expiresIn: this.ACCESS_TOKEN_EXPIRES_IN as string,
        issuer: 'bz-studypal',
        audience: 'bz-studypal-users'
      } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      this.REFRESH_TOKEN_SECRET as string,
      { 
        expiresIn: this.REFRESH_TOKEN_EXPIRES_IN as string,
        issuer: 'bz-studypal',
        audience: 'bz-studypal-users'
      } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }

  /**
   * 验证访问令牌
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.ACCESS_TOKEN_SECRET as string, {
        issuer: 'bz-studypal',
        audience: 'bz-studypal-users'
      } as jwt.VerifyOptions) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * 验证刷新令牌
   */
  static verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET as string, {
        issuer: 'bz-studypal',
        audience: 'bz-studypal-users'
      } as jwt.VerifyOptions) as { userId: string };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * 从Authorization header中提取token
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7);
  }

  /**
   * 设置认证cookies
   */
  static setAuthCookies(res: Response, tokens: TokenPair): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // 设置访问令牌cookie (短期)
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15分钟
      path: '/'
    });

    // 设置刷新令牌cookie (长期)
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      path: '/api/auth'
    });
  }

  /**
   * 清除认证cookies
   */
  static clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth' });
  }

  /**
   * 计算token过期时间
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }
}
