'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { api, questionsAPI, subjectsAPI } from '@/lib/api';
import AppLayout from '../../components/layout/AppLayout';
import ImageUpload from '../../components/ui/ImageUpload';

interface Subject {
  id: string;
  code: string;
  nameZh: string;
  nameEn: string;
  color: string;
}

interface Question {
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
  subject: Subject;
  addedAt: string;
  lastReviewedAt?: string;
  reviewCount: number;
  _count: {
    reviews: number;
    bookmarks: number;
  };
}

interface QuestionStats {
  totalCount: number;
  recentWeekCount: number;
  bySubject: Array<{ subjectId: string; _count: number; subject: Subject }>;
  byDifficulty: Array<{ difficulty: string; _count: number }>;
  byMastery: Array<{ masteryLevel: string; _count: number }>;
  byErrorType: Array<{ errorType: string; _count: number }>;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FilterState {
  subjectId?: string;
  difficulty?: string;
  masteryLevel?: string;
  errorType?: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Chinese display functions
const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case 'EASY': return '简单';
    case 'MEDIUM': return '中等';
    case 'HARD': return '困难';
    default: return difficulty;
  }
};

const getMasteryText = (masteryLevel: string) => {
  switch (masteryLevel) {
    case 'NOT_MASTERED': return '未掌握';
    case 'PARTIALLY_MASTERED': return '部分掌握';
    case 'MASTERED': return '已掌握';
    default: return masteryLevel;
  }
};

export default function QuestionsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'addedAt',
    sortOrder: 'desc'
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    content: '',
    images: [] as string[],
    myAnswer: '',
    correctAnswer: '',
    explanation: '',
    subjectId: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    languageType: 'CHINESE' as 'CHINESE' | 'ENGLISH' | 'BILINGUAL',
    errorType: 'OTHER' as 'CALCULATION' | 'CONCEPTUAL' | 'CARELESS' | 'METHODOLOGICAL' | 'KNOWLEDGE' | 'OTHER',
    knowledgePoints: [] as string[],
    tags: [] as string[]
  });
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    images: [] as string[],
    myAnswer: '',
    correctAnswer: '',
    explanation: '',
    subjectId: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    languageType: 'CHINESE' as 'CHINESE' | 'ENGLISH' | 'BILINGUAL',
    errorType: 'OTHER' as 'CALCULATION' | 'CONCEPTUAL' | 'CARELESS' | 'METHODOLOGICAL' | 'KNOWLEDGE' | 'OTHER',
    masteryLevel: 'NOT_MASTERED' as 'NOT_MASTERED' | 'PARTIALLY_MASTERED' | 'MASTERED',
    knowledgePoints: [] as string[],
    tags: [] as string[]
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/questions');
      return;
    }
  }, [isAuthenticated, router]);

  // Load initial data
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load questions, subjects, and stats in parallel
        const [questionsRes, subjectsRes, statsRes] = await Promise.all([
          loadQuestions(),
          subjectsAPI.getSubjects(),
          questionsAPI.getQuestionStats()
        ]);
        
        if (subjectsRes.success) {
          setSubjects(subjectsRes.data);
        }
        
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load questions data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isAuthenticated]);

  const loadQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      
      if (filters.subjectId) params.set('subjectId', filters.subjectId);
      if (filters.difficulty) params.set('difficulty', filters.difficulty);
      if (filters.masteryLevel) params.set('masteryLevel', filters.masteryLevel);
      if (filters.errorType) params.set('errorType', filters.errorType);
      if (filters.search) params.set('search', filters.search);
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);
      
      const response = await questionsAPI.getQuestions(params.toString());
      if (response.success) {
        setQuestions(response.data);
        setPagination(response.pagination);
        return response;
      } else {
        throw new Error(response.error || 'Failed to load questions');
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
      throw err;
    }
  }, [pagination.page, pagination.limit, filters]);

  // Reload questions when filters change
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const timeoutId = setTimeout(() => {
      loadQuestions();
    }, 300); // Debounce search
    
    return () => clearTimeout(timeoutId);
  }, [filters, loadQuestions, isAuthenticated]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(questions.map(q => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedQuestions.length === 0) return;
    
    if (!confirm(`确定要删除所选的 ${selectedQuestions.length} 道错题吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await questionsAPI.batchDeleteQuestions(selectedQuestions);
      
      if (response.success) {
        setSelectedQuestions([]);
        await loadQuestions();
        // Refresh stats
        const statsRes = await questionsAPI.getQuestionStats();
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } else {
        setError(response.error || 'Failed to delete questions');
      }
    } catch (err) {
      console.error('Failed to delete questions:', err);
      setError('Failed to delete questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('确定要删除这道错题吗？此操作不可恢复。')) {
      return;
    }
    
    try {
      const response = await questionsAPI.deleteQuestion(questionId);
      
      if (response.success) {
        await loadQuestions();
        // Refresh stats
        const statsRes = await questionsAPI.getQuestionStats();
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } else {
        setError(response.error || 'Failed to delete question');
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
      setError('Failed to delete question');
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      title: '',
      content: '',
      images: [],
      myAnswer: '',
      correctAnswer: '',
      explanation: '',
      subjectId: '',
      difficulty: 'MEDIUM',
      languageType: 'CHINESE',
      errorType: 'OTHER',
      knowledgePoints: [],
      tags: []
    });
  };

  const initializeEditForm = (question: Question) => {
    setEditFormData({
      title: question.title || '',
      content: question.content,
      images: question.images || [],
      myAnswer: question.myAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      subjectId: question.subjectId,
      difficulty: question.difficulty,
      languageType: question.languageType,
      errorType: question.errorType,
      masteryLevel: question.masteryLevel,
      knowledgePoints: question.knowledgePoints || [],
      tags: question.tags || []
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      title: '',
      content: '',
      images: [],
      myAnswer: '',
      correctAnswer: '',
      explanation: '',
      subjectId: '',
      difficulty: 'MEDIUM',
      languageType: 'CHINESE',
      errorType: 'OTHER',
      masteryLevel: 'NOT_MASTERED',
      knowledgePoints: [],
      tags: []
    });
  };

  const handleCreateQuestion = async () => {
    // Basic validation
    if (!createFormData.content.trim()) {
      setError('请输入错题内容');
      return;
    }
    if (!createFormData.myAnswer.trim()) {
      setError('请输入您的答案');
      return;
    }
    if (!createFormData.correctAnswer.trim()) {
      setError('请输入正确答案');
      return;
    }
    if (!createFormData.subjectId) {
      setError('请选择科目');
      return;
    }

    try {
      setLoading(true);
      const response = await questionsAPI.createQuestion(createFormData);
      
      if (response.success) {
        setShowCreateModal(false);
        resetCreateForm();
        await loadQuestions();
        // Refresh stats
        const statsRes = await questionsAPI.getQuestionStats();
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } else {
        setError(response.error || 'Failed to create question');
      }
    } catch (err) {
      console.error('Failed to create question:', err);
      setError('Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;
    
    // Basic validation
    if (!editFormData.content.trim()) {
      setError('请输入错题内容');
      return;
    }
    if (!editFormData.myAnswer.trim()) {
      setError('请输入您的答案');
      return;
    }
    if (!editFormData.correctAnswer.trim()) {
      setError('请输入正确答案');
      return;
    }
    if (!editFormData.subjectId) {
      setError('请选择科目');
      return;
    }

    try {
      setLoading(true);
      const response = await questionsAPI.updateQuestion(editingQuestion.id, editFormData);
      
      if (response.success) {
        setEditingQuestion(null);
        resetEditForm();
        await loadQuestions();
        // Refresh stats
        const statsRes = await questionsAPI.getQuestionStats();
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } else {
        setError(response.error || 'Failed to update question');
      }
    } catch (err) {
      console.error('Failed to update question:', err);
      setError('Failed to update question');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <AppLayout 
      title={t('questions.title')} 
      description={t('questions.description')}
    >
      {loading && (
        <div className="flex justify-center items-center min-h-[400px]" data-testid="loading">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="error-message">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-testid="stats-cards">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600" data-testid="total-count">{stats.totalCount}</div>
            <div className="text-sm text-gray-600">错题总数</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600" data-testid="recent-count">{stats.recentWeekCount}</div>
            <div className="text-sm text-gray-600">本周新增</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600" data-testid="not-mastered-count">
              {stats.byMastery.find(m => m.masteryLevel === 'NOT_MASTERED')?._count || 0}
            </div>
            <div className="text-sm text-gray-600">未掌握</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600" data-testid="mastered-count">
              {stats.byMastery.find(m => m.masteryLevel === 'MASTERED')?._count || 0}
            </div>
            <div className="text-sm text-gray-600">已掌握</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-lg shadow mb-6" data-testid="filters">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              搜索
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="请输入关键词搜索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="search-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              科目
            </label>
            <select
              value={filters.subjectId || ''}
              onChange={(e) => handleFilterChange('subjectId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="subject-filter"
            >
              <option value="">全部科目</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.nameZh}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              难度
            </label>
            <select
              value={filters.difficulty || ''}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="difficulty-filter"
            >
              <option value="">全部难度</option>
              <option value="EASY">简单</option>
              <option value="MEDIUM">中等</option>
              <option value="HARD">困难</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              掌握程度
            </label>
            <select
              value={filters.masteryLevel || ''}
              onChange={(e) => handleFilterChange('masteryLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="mastery-filter"
            >
              <option value="">全部程度</option>
              <option value="NOT_MASTERED">未掌握</option>
              <option value="PARTIALLY_MASTERED">部分掌握</option>
              <option value="MASTERED">已掌握</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              排序方式
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="sort-by"
            >
              <option value="addedAt">添加时间</option>
              <option value="lastReviewedAt">最后复习</option>
              <option value="reviewCount">复习次数</option>
              <option value="difficulty">难度</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              排序顺序
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="sort-order"
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            data-testid="create-question-btn"
          >
添加错题
          </button>
          
          {selectedQuestions.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              data-testid="delete-selected-btn"
            >
              删除所选 ({selectedQuestions.length})
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600" data-testid="results-info">
          显示 {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.totalCount)} 条，共 {pagination.totalCount} 条
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="questions-list">
        {questions.length === 0 ? (
          <div className="p-8 text-center text-gray-500" data-testid="empty-state">
            暂无错题数据
          </div>
        ) : (
          <>
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedQuestions.length === questions.length && questions.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  data-testid="select-all-checkbox"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  全选
                </span>
              </label>
            </div>
            
            {questions.map((question) => (
              <div key={question.id} className="border-b border-gray-200 last:border-b-0" data-testid={`question-${question.id}`}>
                <div className="px-6 py-4">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      data-testid={`checkbox-${question.id}`}
                    />
                    
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {question.title && (
                            <h3 className="text-lg font-medium text-gray-900" data-testid={`title-${question.id}`}>
                              {question.title}
                            </h3>
                          )}
                          <span
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                            style={{ backgroundColor: question.subject.color + '20', color: question.subject.color }}
                            data-testid={`subject-badge-${question.id}`}
                          >
                            {question.subject.nameZh}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            question.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                            question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`} data-testid={`difficulty-${question.id}`}>
                            {getDifficultyText(question.difficulty)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            question.masteryLevel === 'MASTERED' ? 'bg-blue-100 text-blue-800' :
                            question.masteryLevel === 'PARTIALLY_MASTERED' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`} data-testid={`mastery-${question.id}`}>
                            {getMasteryText(question.masteryLevel)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingQuestion(question);
                              initializeEditForm(question);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            data-testid={`edit-btn-${question.id}`}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                            data-testid={`delete-btn-${question.id}`}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-gray-700 line-clamp-3" data-testid={`content-${question.id}`}>
                          {question.content}
                        </p>
                        
                        {/* Question Images */}
                        {question.images && question.images.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2">
                              {question.images.slice(0, 3).map((imageUrl, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={`http://localhost:8000${imageUrl}`}
                                    alt={`Question image ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                                    onClick={() => {
                                      // Open image in modal or new tab
                                      window.open(`http://localhost:8000${imageUrl}`, '_blank');
                                    }}
                                    data-testid={`image-${question.id}-${index}`}
                                  />
                                </div>
                              ))}
                              {question.images.length > 3 && (
                                <div className="w-16 h-16 bg-gray-100 border rounded flex items-center justify-center text-xs text-gray-500">
                                  +{question.images.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        <span data-testid={`added-date-${question.id}`}>
                          添加时间: {new Date(question.addedAt).toLocaleDateString('zh-CN')}
                        </span>
                        <span data-testid={`review-count-${question.id}`}>
                          复习次数: {question.reviewCount}
                        </span>
                        {question._count.bookmarks > 0 && (
                          <span data-testid={`bookmark-count-${question.id}`}>
                            收藏数: {question._count.bookmarks}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center" data-testid="pagination">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="prev-page-btn"
            >
              上一页
            </button>
            
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700" data-testid="page-info">
              第 {pagination.page} 页 / 共 {pagination.totalPages} 页
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="next-page-btn"
            >
              下一页
            </button>
          </nav>
        </div>
      )}

      {/* 创建错题模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" data-testid="create-modal">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 my-8">
        <h2 className="text-xl font-bold mb-6">{t('questions.createQuestionModal')}</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleCreateQuestion(); }} className="space-y-6">
              {/* Question Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  错题标题（可选）
                </label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入错题标题"
                />
              </div>

              {/* Question Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  错题内容 *
                </label>
                <textarea
                  value={createFormData.content}
                  onChange={(e) => setCreateFormData({ ...createFormData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="请输入错题内容"
                  required
                />
              </div>

              {/* Question Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.imageUpload.title')}
                </label>
                <ImageUpload
                  images={createFormData.images}
                  onChange={(images) => setCreateFormData({ ...createFormData, images })}
                  maxFiles={5}
                  disabled={loading}
                />
              </div>

              {/* Your Answer and Correct Answer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    您的答案 *
                  </label>
                  <textarea
                    value={createFormData.myAnswer}
                    onChange={(e) => setCreateFormData({ ...createFormData, myAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="请输入您的答案"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    正确答案 *
                  </label>
                  <textarea
                    value={createFormData.correctAnswer}
                    onChange={(e) => setCreateFormData({ ...createFormData, correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="请输入正确答案"
                    required
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  解析（可选）
                </label>
                <textarea
                  value={createFormData.explanation}
                  onChange={(e) => setCreateFormData({ ...createFormData, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="请输入错题解析"
                />
              </div>

              {/* Subject, Difficulty, Error Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    科目 *
                  </label>
                  <select
                    value={createFormData.subjectId}
                    onChange={(e) => setCreateFormData({ ...createFormData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">请选择科目</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.nameZh}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    难度
                  </label>
                  <select
                    value={createFormData.difficulty}
                    onChange={(e) => setCreateFormData({ ...createFormData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EASY">简单</option>
                    <option value="MEDIUM">中等</option>
                    <option value="HARD">困难</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    错误类型
                  </label>
                  <select
                    value={createFormData.errorType}
                    onChange={(e) => setCreateFormData({ ...createFormData, errorType: e.target.value as 'CALCULATION' | 'CONCEPTUAL' | 'CARELESS' | 'METHODOLOGICAL' | 'KNOWLEDGE' | 'OTHER' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="CALCULATION">计算错误</option>
                    <option value="CONCEPTUAL">概念错误</option>
                    <option value="CARELESS">粗心错误</option>
                    <option value="METHODOLOGICAL">方法错误</option>
                    <option value="KNOWLEDGE">知识点错误</option>
                    <option value="OTHER">其他</option>
                  </select>
                </div>
              </div>

              {/* Language Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  语言类型
                </label>
                <select
                  value={createFormData.languageType}
                  onChange={(e) => setCreateFormData({ ...createFormData, languageType: e.target.value as 'CHINESE' | 'ENGLISH' | 'BILINGUAL' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CHINESE">中文</option>
                  <option value="ENGLISH">英文</option>
                  <option value="BILINGUAL">中英文</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  data-testid="cancel-create-btn"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  data-testid="confirm-create-btn"
                >
                  {loading ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑错题模态框 */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" data-testid="edit-modal">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 my-8">
        <h2 className="text-xl font-bold mb-6">{t('questions.editQuestionModal')}</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateQuestion(); }} className="space-y-6">
              {/* Question Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  错题标题（可选）
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入错题标题"
                />
              </div>

              {/* Question Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  错题内容 *
                </label>
                <textarea
                  value={editFormData.content}
                  onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="请输入错题内容"
                  required
                />
              </div>

              {/* Question Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.imageUpload.title')}
                </label>
                <ImageUpload
                  images={editFormData.images}
                  onChange={(images) => setEditFormData({ ...editFormData, images })}
                  maxFiles={5}
                  disabled={loading}
                />
              </div>

              {/* Your Answer and Correct Answer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    您的答案 *
                  </label>
                  <textarea
                    value={editFormData.myAnswer}
                    onChange={(e) => setEditFormData({ ...editFormData, myAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="请输入您的答案"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    正确答案 *
                  </label>
                  <textarea
                    value={editFormData.correctAnswer}
                    onChange={(e) => setEditFormData({ ...editFormData, correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="请输入正确答案"
                    required
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  解析（可选）
                </label>
                <textarea
                  value={editFormData.explanation}
                  onChange={(e) => setEditFormData({ ...editFormData, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="请输入错题解析"
                />
              </div>

              {/* Subject, Difficulty, Error Type, Mastery Level */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    科目 *
                  </label>
                  <select
                    value={editFormData.subjectId}
                    onChange={(e) => setEditFormData({ ...editFormData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">请选择科目</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.nameZh}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    难度
                  </label>
                  <select
                    value={editFormData.difficulty}
                    onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EASY">简单</option>
                    <option value="MEDIUM">中等</option>
                    <option value="HARD">困难</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    错误类型
                  </label>
                  <select
                    value={editFormData.errorType}
                    onChange={(e) => setEditFormData({ ...editFormData, errorType: e.target.value as 'CALCULATION' | 'CONCEPTUAL' | 'CARELESS' | 'METHODOLOGICAL' | 'KNOWLEDGE' | 'OTHER' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="CALCULATION">计算错误</option>
                    <option value="CONCEPTUAL">概念错误</option>
                    <option value="CARELESS">粗心错误</option>
                    <option value="METHODOLOGICAL">方法错误</option>
                    <option value="KNOWLEDGE">知识点错误</option>
                    <option value="OTHER">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    掌握程度
                  </label>
                  <select
                    value={editFormData.masteryLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, masteryLevel: e.target.value as 'NOT_MASTERED' | 'PARTIALLY_MASTERED' | 'MASTERED' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="NOT_MASTERED">未掌握</option>
                    <option value="PARTIALLY_MASTERED">部分掌握</option>
                    <option value="MASTERED">已掌握</option>
                  </select>
                </div>
              </div>

              {/* Language Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  语言类型
                </label>
                <select
                  value={editFormData.languageType}
                  onChange={(e) => setEditFormData({ ...editFormData, languageType: e.target.value as 'CHINESE' | 'ENGLISH' | 'BILINGUAL' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CHINESE">中文</option>
                  <option value="ENGLISH">英文</option>
                  <option value="BILINGUAL">中英文</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    resetEditForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  data-testid="cancel-edit-btn"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  data-testid="confirm-edit-btn"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
