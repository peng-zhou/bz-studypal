import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, User, LoginData, RegisterData } from '../lib/api';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
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
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login operation
      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.login(data);
          
          if (response.success) {
            const { user, tokens } = response.data;
            
            // Save token to localStorage
            localStorage.setItem('accessToken', tokens.accessToken);
            
            // Update state
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error || 'Login failed');
          }
  } catch (error: unknown) {
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

      // Registration operation
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.register(data);
          
          if (response.success) {
            const { user, tokens } = response.data;
            
            // Save token to localStorage
            localStorage.setItem('accessToken', tokens.accessToken);
            
            // Update state
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error || 'Registration failed');
          }
  } catch (error: unknown) {
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

      // Google login
      googleLogin: async (idToken: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.googleLogin(idToken);
          
          if (response.success) {
            const { user, tokens } = response.data;
            
            // Save token to localStorage
            localStorage.setItem('accessToken', tokens.accessToken);
            
            // Update state
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.error || 'Google login failed');
          }
    } catch (error: unknown) {
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

      // Logout operation
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authAPI.logout();
        } catch (error) {
          // Clear local state even if API call fails
          console.error('Logout API error:', error);
        } finally {
          // Clear local storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          
          // Reset state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const token = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');
        
        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        // Development mode: if there's a test-token and saved user info, use directly
        if (token === 'test-access-token' && savedUser) {
          try {
            const user = JSON.parse(savedUser);
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          } catch (e) {
            console.error('Failed to parse saved user:', e);
          }
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
          // For development mode, if API call fails but has test token, try to use locally saved info
          if (token === 'test-access-token' && savedUser) {
            try {
              const user = JSON.parse(savedUser);
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              return;
            } catch (e) {
              console.error('Failed to parse saved user in fallback:', e);
            }
          }
          
          // Token might be expired or invalid, clear authentication state
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

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      // Only persist user info, don't persist token (token is stored in localStorage)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Ensure state is correctly restored during hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Auth state rehydrated:', { user: state.user, isAuthenticated: state.isAuthenticated });
        }
      },
    }
  )
);

// Selector hooks for getting specific state in components
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
