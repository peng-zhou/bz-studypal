import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { JWTService } from '../utils/jwt';
import { GoogleAuthService } from '../utils/googleAuth';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/database';

// 优化的bcrypt配置，降低工作因子提高性能
const BCRYPT_ROUNDS = process.env.NODE_ENV === 'production' ? 12 : 8;

/**
 * 用户注册
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { email, password, name, preferredLanguage = 'zh' } = req.body;

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User already exists',
        code: 'USER_EXISTS'
      });
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        preferredLanguage,
        emailVerified: false,
        role: 'STUDENT',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredLanguage: true,
        createdAt: true
      }
    });

    // 生成JWT tokens
    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // 设置认证cookies
    JWTService.setAuthCookies(res, tokens);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: JWTService.getTokenExpiration(tokens.accessToken)
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
};

/**
 * 用户登录
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { email, password } = req.body;

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        status: true,
        preferredLanguage: true,
        lastLogin: true
      }
    });

    if (!user || !user.password) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // 检查账户状态
    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'Account is suspended or inactive',
        code: 'ACCOUNT_INACTIVE'
      });
      return;
    }

    // 注释：移除最后登录时间更新以提高性能
    // 可以在后台异步更新或在非关键路径中处理
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { lastLogin: new Date() }
    // });

    // 生成JWT tokens
    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // 设置认证cookies
    JWTService.setAuthCookies(res, tokens);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: JWTService.getTokenExpiration(tokens.accessToken)
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    });
  }
};

/**
 * Google OAuth登录
 */
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, credential } = req.body;
    
    if (!idToken && !credential) {
      res.status(400).json({
        success: false,
        error: 'Google ID token required',
        code: 'MISSING_ID_TOKEN'
      });
      return;
    }

    // 验证Google ID Token
    const googleUser = await GoogleAuthService.verifyIdToken(idToken || credential);

    if (!googleUser.email_verified) {
      res.status(400).json({
        success: false,
        error: 'Google email not verified',
        code: 'EMAIL_NOT_VERIFIED'
      });
      return;
    }

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        preferredLanguage: true,
        googleId: true,
        avatar: true
      }
    });

    if (!user) {
      // 创建新用户
      user = await prisma.user.create({
        data: {
          email: googleUser.email.toLowerCase(),
          name: googleUser.name,
          googleId: googleUser.id,
          avatar: googleUser.picture || null,
          emailVerified: true,
          role: 'STUDENT',
          status: 'ACTIVE',
          preferredLanguage: 'zh'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          preferredLanguage: true,
          googleId: true,
          avatar: true
        }
      });
    } else {
      // 更新现有用户的Google ID和头像
      if (!user.googleId) {
        const updatedAvatar = googleUser.picture || null;
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            googleId: googleUser.id,
            avatar: updatedAvatar,
            emailVerified: true,
            lastLogin: new Date()
          }
        });
        user.googleId = googleUser.id;
        user.avatar = updatedAvatar;
      } else {
        // 更新最后登录时间
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });
      }
    }

    // 检查账户状态
    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'Account is suspended or inactive',
        code: 'ACCOUNT_INACTIVE'
      });
      return;
    }

    // 生成JWT tokens
    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // 设置认证cookies
    JWTService.setAuthCookies(res, tokens);

    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        user,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: JWTService.getTokenExpiration(tokens.accessToken)
        }
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Google authentication failed'
    });
  }
};

/**
 * 刷新访问令牌
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token required',
        code: 'MISSING_REFRESH_TOKEN'
      });
      return;
    }

    // 验证刷新令牌
    let payload;
    try {
      payload = JWTService.verifyRefreshToken(refreshToken);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
      return;
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });

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

    // 生成新的访问令牌
    const tokens = JWTService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // 设置新的认证cookies
    JWTService.setAuthCookies(res, tokens);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: JWTService.getTokenExpiration(tokens.accessToken)
        }
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during token refresh'
    });
  }
};

/**
 * 用户登出
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // 清除认证cookies
    JWTService.clearAuthCookies(res);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during logout'
    });
  }
};

/**
 * 获取当前用户信息
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        preferredLanguage: true,
        grade: true,
        school: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            questions: true,
            bookmarks: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// 输入验证规则
export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('preferredLanguage').optional().isIn(['zh', 'en']).withMessage('Invalid language preference')
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];
