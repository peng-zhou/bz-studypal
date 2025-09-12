import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../authStore';
import * as api from '../../lib/api';

// Mock the API module
jest.mock('../../lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAuth store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    localStorageMock.clear.mockImplementation(() => {});
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
        preferredLanguage: 'zh',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: '2024-01-01T01:00:00Z',
      };

      mockedApi.authAPI.login.mockResolvedValue({
        success: true,
        message: 'Login successful',
        data: { user: mockUser, tokens: mockTokens },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'accessToken',
        'mock-access-token'
      );
    });

    it('should handle login failure', async () => {
      mockedApi.authAPI.login.mockRejectedValue({
        response: { data: { error: 'Invalid credentials' } },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrongpassword',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should successfully register user', async () => {
      const mockUser = {
        id: '2',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'STUDENT',
        preferredLanguage: 'zh',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: '2024-01-01T01:00:00Z',
      };

      mockedApi.authAPI.register.mockResolvedValue({
        success: true,
        message: 'Registration successful',
        data: { user: mockUser, tokens: mockTokens },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
          preferredLanguage: 'zh',
        });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle registration failure', async () => {
      mockedApi.authAPI.register.mockRejectedValue({
        response: { data: { error: 'User already exists' } },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.register({
            email: 'existing@example.com',
            password: 'password123',
            name: 'Existing User',
            preferredLanguage: 'zh',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('User already exists');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockedApi.authAPI.logout.mockResolvedValue({
        success: true,
        message: 'Logged out successfully',
      });

      const { result } = renderHook(() => useAuth());

      // First set a user as logged in
      act(() => {
        result.current.setLoading(false);
        // Simulate logged in state by directly accessing the store
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('should logout even if API call fails', async () => {
      mockedApi.authAPI.logout.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('checkAuth', () => {
    it('should return early if no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(mockedApi.authAPI.getProfile).not.toHaveBeenCalled();
    });

    it('should validate token and set user if valid', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
        preferredLanguage: 'zh',
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockedApi.authAPI.getProfile.mockResolvedValue({
        success: true,
        data: { user: mockUser },
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should clear auth state if token is invalid', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      
      mockedApi.authAPI.getProfile.mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('utility methods', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
