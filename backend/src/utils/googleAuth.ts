import { OAuth2Client } from 'google-auth-library';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  email_verified: boolean;
}

export class GoogleAuthService {
  private static client: OAuth2Client | null = null;

  /**
   * 获取Google OAuth客户端
   */
  private static getClient(): OAuth2Client {
    if (!this.client) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not configured');
      }

      this.client = new OAuth2Client(
        clientId,
        clientSecret,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/auth/google/callback'
      );
    }

    return this.client;
  }

  /**
   * 生成Google OAuth认证URL
   */
  static generateAuthUrl(state?: string): string {
    const client = this.getClient();
    
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const options: any = {
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      prompt: 'consent' // 确保获取refresh token
    };
    
    if (state) {
      options.state = state;
    }
    
    const authUrl = client.generateAuthUrl(options);

    return authUrl;
  }

  /**
   * 验证Google OAuth授权码并获取用户信息
   */
  static async verifyAuthCode(code: string): Promise<GoogleUserInfo> {
    try {
      const client = this.getClient();

      // 交换授权码获取访问令牌
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      // 使用访问令牌获取用户信息
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google client ID not configured');
      }
      
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: clientId
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Failed to get user info from Google');
      }

      return {
        id: payload.sub,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture || null,
        email_verified: payload.email_verified || false
      };
    } catch (error) {
      console.error('Google OAuth verification error:', error);
      throw new Error('Failed to verify Google OAuth code');
    }
  }

  /**
   * 验证Google ID Token（用于前端直接集成）
   */
  static async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const client = this.getClient();
      const clientId = process.env.GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('Google client ID not configured');
      }

      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid ID token');
      }

      return {
        id: payload.sub,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture || null,
        email_verified: payload.email_verified || false
      };
    } catch (error) {
      console.error('Google ID token verification error:', error);
      throw new Error('Invalid Google ID token');
    }
  }

  /**
   * 刷新Google访问令牌
   */
  static async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const client = this.getClient();
      client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await client.refreshAccessToken();
      return credentials.access_token!;
    } catch (error) {
      console.error('Google token refresh error:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  /**
   * 撤销Google访问令牌
   */
  static async revokeToken(accessToken: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.revokeToken(accessToken);
    } catch (error) {
      console.error('Google token revocation error:', error);
      throw new Error('Failed to revoke Google access token');
    }
  }

  /**
   * 检查Google OAuth配置是否完整
   */
  static isConfigured(): boolean {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }

  /**
   * 获取配置状态信息
   */
  static getConfigStatus(): {
    configured: boolean;
    clientId: string | null;
    redirectUri: string;
  } {
    return {
      configured: this.isConfigured(),
      clientId: process.env.GOOGLE_CLIENT_ID || null,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/auth/google/callback'
    };
  }
}
