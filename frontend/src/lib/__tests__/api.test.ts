import axios from 'axios';
import { api, authAPI } from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('API Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should create axios instance with correct config', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:8000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
  });

  it('should setup request and response interceptors', () => {
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
  });
});

describe('AuthAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call register endpoint with correct data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        preferredLanguage: 'zh',
      };

      const mockResponse = {
        data: {
          success: true,
          message: 'Registration successful',
          data: {
            user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'STUDENT' },
            tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authAPI.register(userData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/register', userData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle registration error', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockError = {
        response: {
          data: {
            success: false,
            error: 'User already exists',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(authAPI.register(userData)).rejects.toEqual(mockError);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/register', userData);
    });
  });

  describe('login', () => {
    it('should call login endpoint with credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        data: {
          success: true,
          message: 'Login successful',
          data: {
            user: { id: '1', email: 'test@example.com', name: 'Test User' },
            tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authAPI.login(credentials);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login error', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockError = {
        response: {
          data: {
            success: false,
            error: 'Invalid credentials',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(authAPI.login(credentials)).rejects.toEqual(mockError);
    });
  });

  describe('googleLogin', () => {
    it('should call Google OAuth endpoint', async () => {
      const idToken = 'google-id-token';

      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: '1', email: 'test@gmail.com', name: 'Google User' },
            tokens: { accessToken: 'token123', refreshToken: 'refresh123' },
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authAPI.googleLogin(idToken);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/google', { idToken });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getProfile', () => {
    it('should call profile endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: '1', email: 'test@example.com', name: 'Test User' },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authAPI.getProfile();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/auth/profile');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Logged out successfully',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authAPI.logout();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/logout');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('refreshToken', () => {
    it('should call refresh token endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            tokens: { accessToken: 'new-token', refreshToken: 'new-refresh' },
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authAPI.refreshToken();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/refresh');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('checkAuthStatus', () => {
    it('should call auth status endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            google: { configured: true },
            jwt: { configured: true },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authAPI.checkAuthStatus();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/auth/status');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getGoogleConfig', () => {
    it('should call Google config endpoint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            clientId: 'google-client-id',
            redirectUri: 'http://localhost:8000/api/auth/google/callback',
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authAPI.getGoogleConfig();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/auth/google/config');
      expect(result).toEqual(mockResponse.data);
    });
  });
});

// Test type definitions
describe('API Types', () => {
  it('should have correct LoginData interface', () => {
    const loginData: import('../api').LoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    expect(loginData.email).toBe('test@example.com');
    expect(loginData.password).toBe('password123');
  });

  it('should have correct RegisterData interface', () => {
    const registerData: import('../api').RegisterData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      preferredLanguage: 'zh',
    };

    expect(registerData.email).toBe('test@example.com');
    expect(registerData.name).toBe('Test User');
    expect(registerData.preferredLanguage).toBe('zh');
  });

  it('should have correct User interface', () => {
    const user: import('../api').User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'STUDENT',
      preferredLanguage: 'zh',
      createdAt: '2024-01-01T00:00:00Z',
    };

    expect(user.id).toBe('1');
    expect(user.role).toBe('STUDENT');
  });
});
