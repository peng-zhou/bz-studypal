import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, User, LoginData, RegisterData } from '../lib/api';

interface AuthState {
  // 状态
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 操作
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 登录操作
      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.login(data);
          
          if (response.success) {
            const { user, tokens } = response.data;
            
            // 保存token到localStorage
            localStorage.setItem('accessToken', tokens.accessToken);
            
            // 更新状态
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error || 'Login failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Login failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // 注册操作
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.register(data);
          
          if (response.success) {
            const { user, tokens } = response.data;
            
            // 保存token到localStorage
            localStorage.setItem('accessToken', tokens.accessToken);
            
            // 更新状态
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error || 'Registration failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Google登录
      googleLogin: async (idToken: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.googleLogin(idToken);
          
          if (response.success) {
            const { user, tokens } = response.data;
            
            // 保存token到localStorage
            localStorage.setItem('accessToken', tokens.accessToken);
            
            // 更新状态
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error || 'Google login failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Google login failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // 登出操作
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authAPI.logout();
        } catch (error) {
          // 即使API调用失败，也要清除本地状态
          console.error('Logout API error:', error);
        } finally {
          // 清除本地存储
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          
          // 重置状态
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // 检查认证状态
      checkAuth: async () => {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await authAPI.getProfile();
          
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('Auth check failed');
          }
        } catch (error) {
          // Token可能过期或无效，清除认证状态
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // 清除错误
      clearError: () => {
        set({ error: null });
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      // 只持久化用户信息，不持久化token（token存在localStorage中）
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 选择器hooks，用于组件中获取特定状态
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    googleLogin,
    logout,
    checkAuth,
    clearError,
    setLoading,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    googleLogin,
    logout,
    checkAuth,
    clearError,
    setLoading,
  };
};
