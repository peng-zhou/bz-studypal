import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  refreshToken,
  logout,
  getProfile,
  registerValidation,
  loginValidation
} from '../controllers/auth';
import { authenticate } from '../middlewares/auth';
import { GoogleAuthService } from '../utils/googleAuth';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', registerValidation, register);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth登录
 * @access  Public
 */
router.post('/google', googleAuth);

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新访问令牌
 * @access  Public (需要refresh token)
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/profile
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   GET /api/auth/status
 * @desc    检查认证状态
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const googleConfig = GoogleAuthService.getConfigStatus();
    
    res.json({
      success: true,
      data: {
        google: {
          configured: googleConfig.configured,
          clientId: googleConfig.clientId ? 
            `${googleConfig.clientId.substring(0, 10)}...` : null,
          redirectUri: googleConfig.redirectUri
        },
        jwt: {
          configured: !!(process.env.JWT_SECRET && process.env.REFRESH_TOKEN_SECRET),
          accessTokenExpiry: process.env.JWT_EXPIRES_IN || '15m',
          refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
        }
      }
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get authentication status'
    });
  }
});

/**
 * @route   GET /api/auth/google/config
 * @desc    获取Google OAuth配置信息（用于前端）
 * @access  Public
 */
router.get('/google/config', (req, res) => {
  try {
    const config = GoogleAuthService.getConfigStatus();
    
    if (!config.configured) {
      res.status(503).json({
        success: false,
        error: 'Google OAuth not configured',
        code: 'GOOGLE_OAUTH_NOT_CONFIGURED'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        configured: true
      }
    });
  } catch (error) {
    console.error('Google config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Google OAuth configuration'
    });
  }
});

/**
 * @route   GET /api/auth/google/url
 * @desc    生成Google OAuth认证URL
 * @access  Public
 */
router.get('/google/url', (req, res) => {
  try {
    const state = req.query.state as string;
    const authUrl = GoogleAuthService.generateAuthUrl(state);
    
    res.json({
      success: true,
      data: {
        authUrl,
        state
      }
    });
  } catch (error) {
    console.error('Google auth URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Google auth URL'
    });
  }
});

export default router;
