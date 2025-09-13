import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000, // 增加到 30 秒
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Support cookie authentication
});

// 重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

// 重试函数
const retryRequest = async (fn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.response?.status >= 500)) {
      console.warn(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

// Request interceptor - Add authentication token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
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

// Response interceptor - Handle authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 error and not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshResponse = await api.post('/api/auth/refresh');
        const { accessToken } = refreshResponse.data.data.tokens;
        
        // Update token in localStorage
        localStorage.setItem('accessToken', accessToken);
        
        // Resend original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear authentication state
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

// Authentication related API
export const authAPI = {
  // User registration
  register: async (data: RegisterData) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  // User login
  login: async (data: LoginData) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  // Google OAuth login
  googleLogin: async (idToken: string) => {
    const response = await api.post('/api/auth/google', { idToken });
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    return retryRequest(async () => {
      const response = await api.get('/api/auth/profile');
      return response.data;
    });
  },

  // Logout
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },

  // Check authentication status
  checkAuthStatus: async () => {
    const response = await api.get('/api/auth/status');
    return response.data;
  },

  // Get Google OAuth configuration
  getGoogleConfig: async () => {
    const response = await api.get('/api/auth/google/config');
    return response.data;
  },
};

// Subject management API
export const subjectsAPI = {
  // Get all subjects
  getSubjects: async () => {
    return retryRequest(async () => {
      const response = await api.get('/api/v1/subjects');
      return response.data;
    });
  },

  // Get subject by ID
  getSubjectById: async (id: string) => {
    const response = await api.get(`/api/v1/subjects/${id}`);
    return response.data;
  },

  // Create subject
  createSubject: async (data: CreateSubjectData) => {
    const response = await api.post('/api/v1/subjects', data);
    return response.data;
  },

  // Update subject
  updateSubject: async (id: string, data: UpdateSubjectData) => {
    const response = await api.put(`/api/v1/subjects/${id}`, data);
    return response.data;
  },

  // Delete subject
  deleteSubject: async (id: string) => {
    const response = await api.delete(`/api/v1/subjects/${id}`);
    return response.data;
  },

  // Update subjects order
  updateSubjectsOrder: async (data: SubjectsOrderData) => {
    const response = await api.post('/api/v1/subjects/reorder', data);
    return response.data;
  },
};

// Question management API
export const questionsAPI = {
  // Get questions list
  getQuestions: async (query?: string) => {
    const url = query ? `/api/v1/questions?${query}` : '/api/v1/questions';
    const response = await api.get(url);
    return response.data;
  },

  // Get question by ID
  getQuestionById: async (id: string) => {
    const response = await api.get(`/api/v1/questions/${id}`);
    return response.data;
  },

  // Create question
  createQuestion: async (data: CreateQuestionData) => {
    const response = await api.post('/api/v1/questions', data);
    return response.data;
  },

  // Update question
  updateQuestion: async (id: string, data: UpdateQuestionData) => {
    const response = await api.put(`/api/v1/questions/${id}`, data);
    return response.data;
  },

  // Delete question
  deleteQuestion: async (id: string) => {
    const response = await api.delete(`/api/v1/questions/${id}`);
    return response.data;
  },

  // Batch delete questions
  batchDeleteQuestions: async (questionIds: string[]) => {
    const response = await api.post('/api/v1/questions/batch/delete', { questionIds });
    return response.data;
  },

  // Get question statistics
  getQuestionStats: async () => {
    return retryRequest(async () => {
      const response = await api.get('/api/v1/questions/stats');
      return response.data;
    });
  },

  // Upload question images
  uploadImages: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    const response = await api.post('/api/v1/questions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete question image
  deleteImage: async (imageUrl: string) => {
    const response = await api.delete('/api/v1/questions/delete-image', {
      data: { imageUrl }
    });
    return response.data;
  },
};

// Type definitions
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
  details?: unknown;
}

// Subject related interface definitions
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

// Question related interface definitions
export interface Question {
  id: string;
  title?: string;
  content: string;
  images?: string[];
  myAnswer: string;
  correctAnswer: string;
  explanation?: string;
  subjectId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  languageType: 'CHINESE' | 'ENGLISH' | 'BILINGUAL';
  errorType: 'CALCULATION' | 'CONCEPTUAL' | 'CARELESS' | 'METHODOLOGICAL' | 'KNOWLEDGE' | 'OTHER';
  masteryLevel: 'NOT_MASTERED' | 'PARTIALLY_MASTERED' | 'MASTERED';
  knowledgePoints?: string[];
  tags?: string[];
  subject?: Subject;
  addedAt: string;
  lastReviewedAt?: string;
  reviewCount: number;
  _count?: {
    reviews: number;
    bookmarks: number;
  };
}

export interface CreateQuestionData {
  title?: string;
  content: string;
  images?: string[];
  myAnswer: string;
  correctAnswer: string;
  explanation?: string;
  subjectId: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  languageType?: 'CHINESE' | 'ENGLISH' | 'BILINGUAL';
  errorType?: 'CALCULATION' | 'CONCEPTUAL' | 'CARELESS' | 'METHODOLOGICAL' | 'KNOWLEDGE' | 'OTHER';
  knowledgePoints?: string[];
  tags?: string[];
}

export interface UpdateQuestionData {
  title?: string;
  content?: string;
  images?: string[];
  myAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  subjectId?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  languageType?: 'CHINESE' | 'ENGLISH' | 'BILINGUAL';
  errorType?: 'CALCULATION' | 'CONCEPTUAL' | 'CARELESS' | 'METHODOLOGICAL' | 'KNOWLEDGE' | 'OTHER';
  masteryLevel?: 'NOT_MASTERED' | 'PARTIALLY_MASTERED' | 'MASTERED';
  knowledgePoints?: string[];
  tags?: string[];
}

export interface QuestionStats {
  totalCount: number;
  recentWeekCount: number;
  bySubject: Array<{ subjectId: string; _count: number; subject?: Subject }>;
  byDifficulty: Array<{ difficulty: string; _count: number }>;
  byMastery: Array<{ masteryLevel: string; _count: number }>;
  byErrorType: Array<{ errorType: string; _count: number }>;
}

export interface QuestionFilters {
  subjectId?: string;
  difficulty?: string;
  masteryLevel?: string;
  errorType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface QuestionsPaginationResponse {
  success: boolean;
  data: Question[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
