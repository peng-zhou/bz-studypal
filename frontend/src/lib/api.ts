import axios from 'axios';

// 创建axios实例
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 支持cookie认证
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 如果是401错误且不是重试请求
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 尝试刷新token
        const refreshResponse = await api.post('/api/auth/refresh');
        const { accessToken } = refreshResponse.data.data.tokens;
        
        // 更新localStorage中的token
        localStorage.setItem('accessToken', accessToken);
        
        // 重新发送原请求
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清除认证状态
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 用户注册
  register: async (data: RegisterData) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  // 用户登录
  login: async (data: LoginData) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  // Google OAuth登录
  googleLogin: async (idToken: string) => {
    const response = await api.post('/api/auth/google', { idToken });
    return response.data;
  },

  // 获取用户资料
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  // 登出
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // 刷新token
  refreshToken: async () => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },

  // 检查认证状态
  checkAuthStatus: async () => {
    const response = await api.get('/api/auth/status');
    return response.data;
  },

  // 获取Google OAuth配置
  getGoogleConfig: async () => {
    const response = await api.get('/api/auth/google/config');
    return response.data;
  },
};

// 科目管理API
export const subjectsAPI = {
  // 获取所有科目
  getSubjects: async () => {
    const response = await api.get('/api/v1/subjects');
    return response.data;
  },

  // 根据ID获取科目
  getSubjectById: async (id: string) => {
    const response = await api.get(`/api/v1/subjects/${id}`);
    return response.data;
  },

  // 创建科目
  createSubject: async (data: CreateSubjectData) => {
    const response = await api.post('/api/v1/subjects', data);
    return response.data;
  },

  // 更新科目
  updateSubject: async (id: string, data: UpdateSubjectData) => {
    const response = await api.put(`/api/v1/subjects/${id}`, data);
    return response.data;
  },

  // 删除科目
  deleteSubject: async (id: string) => {
    const response = await api.delete(`/api/v1/subjects/${id}`);
    return response.data;
  },

  // 更新科目排序
  updateSubjectsOrder: async (data: SubjectsOrderData) => {
    const response = await api.post('/api/v1/subjects/reorder', data);
    return response.data;
  },
};

// 类型定义
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  preferredLanguage?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  preferredLanguage?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
    };
  };
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// 科目相关接口定义
export interface Subject {
  id: string;
  code: string;
  nameZh: string;
  nameEn: string;
  description?: string;
  color?: string;
  order: number;
  _count?: {
    questions: number;
  };
}

export interface CreateSubjectData {
  code: string;
  nameZh: string;
  nameEn: string;
  description?: string;
  color?: string;
  order?: number;
}

export interface UpdateSubjectData {
  code?: string;
  nameZh?: string;
  nameEn?: string;
  description?: string;
  color?: string;
  order?: number;
}

export interface SubjectsOrderData {
  subjects: Array<{
    id: string;
    order: number;
  }>;
}
