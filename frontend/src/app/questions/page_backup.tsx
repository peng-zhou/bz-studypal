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

// Display functions using translations
const getDifficultyText = (difficulty: string, t: any) => {
  switch (difficulty) {
    case 'EASY': return t('questions.easy');
    case 'MEDIUM': return t('questions.medium');
    case 'HARD': return t('questions.hard');
    default: return difficulty;
  }
};

const getMasteryText = (masteryLevel: string, t: any) => {
  switch (masteryLevel) {
    case 'NOT_MASTERED': return t('questions.notMasteredLevel');
    case 'PARTIALLY_MASTERED': return t('questions.partiallyMastered');
    case 'MASTERED': return t('questions.masteredLevel');
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
    
    if (!confirm(t('questions.confirmDeleteSelected', { count: selectedQuestions.length }))) {
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
    if (!confirm(t('questions.confirmDelete'))) {
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
      setError(t('questions.contentRequired'));
      return;
    }
    if (!createFormData.myAnswer.trim()) {
      setError(t('questions.myAnswerRequired'));
      return;
    }
    if (!createFormData.correctAnswer.trim()) {
      setError(t('questions.correctAnswerRequired'));
      return;
    }
    if (!createFormData.subjectId) {
      setError(t('questions.subjectRequired'));
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
      setError(t('questions.contentRequired'));
      return;
    }
    if (!editFormData.myAnswer.trim()) {
      setError(t('questions.myAnswerRequired'));
      return;
    }
    if (!editFormData.correctAnswer.trim()) {
      setError(t('questions.correctAnswerRequired'));
      return;
    }
    if (!editFormData.subjectId) {
      setError(t('questions.subjectRequired'));
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
            <div className="text-sm text-gray-600">{t('questions.totalQuestions')}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600" data-testid="recent-count">{stats.recentWeekCount}</div>
            <div className="text-sm text-gray-600">{t('questions.thisWeek')}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600" data-testid="not-mastered-count">
              {stats.byMastery.find(m => m.masteryLevel === 'NOT_MASTERED')?._count || 0}
            </div>
            <div className="text-sm text-gray-600">{t('questions.notMastered')}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600" data-testid="mastered-count">
              {stats.byMastery.find(m => m.masteryLevel === 'MASTERED')?._count || 0}
            </div>
            <div className="text-sm text-gray-600">{t('questions.mastered')}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-lg shadow mb-6" data-testid="filters">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.search')}
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={t('questions.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="search-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('questions.subject')}
            </label>
            <select
              value={filters.subjectId || ''}
              onChange={(e) => handleFilterChange('subjectId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="subject-filter"
            >
              <option value="">{t('questions.allSubjects')}</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.nameZh}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('questions.difficulty')}
            </label>
            <select
              value={filters.difficulty || ''}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="difficulty-filter"
            >
              <option value="">{t('questions.allDifficulties')}</option>
              <option value="EASY">{t('questions.easy')}</option>
              <option value="MEDIUM">{t('questions.medium')}</option>
              <option value="HARD">{t('questions.hard')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('questions.masteryLevel')}
            </label>
            <select
              value={filters.masteryLevel || ''}
              onChange={(e) => handleFilterChange('masteryLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="mastery-filter"
            >
              <option value="">{t('questions.allMasteryLevels')}</option>
              <option value="NOT_MASTERED">{t('questions.notMasteredLevel')}</option>
              <option value="PARTIALLY_MASTERED">{t('questions.partiallyMastered')}</option>
              <option value="MASTERED">{t('questions.masteredLevel')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('questions.sortBy')}
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="sort-by"
            >
              <option value="addedAt">{t('questions.addedDate')}</option>
              <option value="lastReviewedAt">{t('questions.lastReviewed')}</option>
              <option value="reviewCount">{t('questions.reviewCount')}</option>
              <option value="difficulty">{t('questions.difficulty')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('questions.sortOrder')}
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="sort-order"
            >
              <option value="desc">{t('questions.descending')}</option>
              <option value="asc">{t('questions.ascending')}</option>
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
            {t('questions.addQuestion')}
          </button>
          
          {selectedQuestions.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              data-testid="delete-selected-btn"
            >
              {t('questions.deleteSelected', { count: selectedQuestions.length })}
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600" data-testid="results-info">
          {t('common.showing')} {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.totalCount)} {t('common.items')} {pagination.totalCount} {t('common.total')}
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="questions-list">
        {questions.length === 0 ? (
          <div className="p-8 text-center text-gray-500" data-testid="empty-state">
            {t('questions.noQuestionsFound')}
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
                  {t('common.selectAll')}
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
                            {getDifficultyText(question.difficulty, t)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            question.masteryLevel === 'MASTERED' ? 'bg-blue-100 text-blue-800' :
                            question.masteryLevel === 'PARTIALLY_MASTERED' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`} data-testid={`mastery-${question.id}`}>
                            {getMasteryText(question.masteryLevel, t)}
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
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                            data-testid={`delete-btn-${question.id}`}
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-gray-700 line-clamp-3" data-testid={`content-${question.id}`}>
                          {question.content}
                        </p>
                        
                        {/* Question Images */}
                        {(() => {
                          // Ensure images is an array
                          let imageArray: string[] = [];
                          if (question.images) {
                            if (Array.isArray(question.images)) {
                              imageArray = question.images;
                            } else if (typeof question.images === 'string') {
                              try {
                                imageArray = JSON.parse(question.images);
                              } catch {
                                imageArray = [question.images]; // Treat as single image URL
                              }
                            }
                          }
                          
                          return imageArray.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {imageArray.slice(0, 3).map((imageUrl, index) => (
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
                                {imageArray.length > 3 && (
                                  <div className="w-16 h-16 bg-gray-100 border rounded flex items-center justify-center text-xs text-gray-500">
                                    +{imageArray.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        <span data-testid={`added-date-${question.id}`}>
                          {t('questions.addedAt')}: {new Date(question.addedAt).toLocaleDateString()}
                        </span>
                        <span data-testid={`review-count-${question.id}`}>
                          {t('questions.reviewCount')}: {question.reviewCount}
                        </span>
                        {question._count?.bookmarks && question._count.bookmarks > 0 && (
                          <span data-testid={`bookmark-count-${question.id}`}>
                            {t('questions.bookmarkCount')}: {question._count.bookmarks}
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
              {t('common.previous')}
            </button>
            
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700" data-testid="page-info">
              {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="next-page-btn"
            >
              {t('common.next')}
            </button>
          </nav>
        </div>
      )}

      {/* 创建错题模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" data-testid="create-modal">
          <div className="flex items-start justify-center min-h-full p-2 sm:p-4 pt-4 sm:pt-8 pb-20">
            <div className="bg-white rounded-lg max-w-4xl w-full shadow-xl mx-2">
              <div className="max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('questions.createQuestionModal')}</h2>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        resetCreateForm();
                      }}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="px-4 sm:px-6 py-4">
            
            <form onSubmit={(e) => { e.preventDefault(); handleCreateQuestion(); }} className="space-y-4 sm:space-y-6">
              {/* Question Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('questions.titleOptional')}
                </label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('questions.enterTitle')}
                />
              </div>

              {/* Question Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('questions.contentRequiredLabel')}
                </label>
                <textarea
                  value={createFormData.content}
                  onChange={(e) => setCreateFormData({ ...createFormData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder={t('questions.enterContent')}
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
                    {t('questions.myAnswerRequiredLabel')}
                  </label>
                  <textarea
                    value={createFormData.myAnswer}
                    onChange={(e) => setCreateFormData({ ...createFormData, myAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder={t('questions.enterMyAnswer')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('questions.correctAnswerRequiredLabel')}
                  </label>
                  <textarea
                    value={createFormData.correctAnswer}
                    onChange={(e) => setCreateFormData({ ...createFormData, correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder={t('questions.enterCorrectAnswer')}
                    required
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('questions.explanationOptional')}
                </label>
                <textarea
                  value={createFormData.explanation}
                  onChange={(e) => setCreateFormData({ ...createFormData, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder={t('questions.enterExplanation')}
                />
              </div>

              {/* Subject, Difficulty, Error Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('questions.subjectRequiredLabel')}
                  </label>
                  <select
                    value={createFormData.subjectId}
                    onChange={(e) => setCreateFormData({ ...createFormData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">{t('questions.selectSubject')}</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.nameZh}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('questions.difficulty')}
                  </label>
                  <select
                    value={createFormData.difficulty}
                    onChange={(e) => setCreateFormData({ ...createFormData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EASY">{t('questions.easy')}</option>
                    <option value="MEDIUM">{t('questions.medium')}</option>
                    <option value="HARD">{t('questions.hard')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('questions.errorType')}
                  </label>
                  <select
                    value={createFormData.errorType}
                    onChange={(e) => setCreateFormData({ ...createFormData, errorType: e.target.value as 'CALCULATION' | 'CONCEPTUAL' | 'CARELESS' | 'METHODOLOGICAL' | 'KNOWLEDGE' | 'OTHER' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="CALCULATION">{t('questions.calculation')}</option>
                    <option value="CONCEPTUAL">{t('questions.conceptual')}</option>
                    <option value="CARELESS">{t('questions.careless')}</option>
                    <option value="METHODOLOGICAL">{t('questions.methodological')}</option>
                    <option value="KNOWLEDGE">{t('questions.knowledge')}</option>
                    <option value="OTHER">{t('questions.other')}</option>
                  </select>
                </div>
              </div>

              {/* Language Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('questions.languageType')}
                </label>
                <select
                  value={createFormData.languageType}
                  onChange={(e) => setCreateFormData({ ...createFormData, languageType: e.target.value as 'CHINESE' | 'ENGLISH' | 'BILINGUAL' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CHINESE">{t('questions.chinese')}</option>
                  <option value="ENGLISH">{t('questions.english')}</option>
                  <option value="BILINGUAL">{t('questions.bilingual')}</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  data-testid="cancel-create-btn"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  data-testid="confirm-create-btn"
                >
                  {loading ? t('questions.creating') : t('common.create')}
                </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑错题模态框 */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" data-testid="edit-modal">
          <div className="flex items-start justify-center min-h-full p-2 sm:p-4 pt-4 sm:pt-8 pb-20">
            <div className="bg-white rounded-lg max-w-4xl w-full shadow-xl mx-2">
              <div className="max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('questions.editQuestionModal')}</h2>
                    <button
                      onClick={() => {
                        setEditingQuestion(null);
                        resetEditForm();
                      }}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="px-4 sm:px-6 py-4">
            
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateQuestion(); }} className="space-y-4 sm:space-y-6">
              {/* Question Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('questions.titleOptional')}
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('questions.enterTitle')}
                />
              </div>

              {/* Question Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('questions.contentRequiredLabel')}
                </label>
                <textarea
                  value={editFormData.content}
                  onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder={t('questions.enterContent')}
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
                    {t('questions.myAnswerRequiredLabel')}
                  </label>
                  <textarea
                    value={editFormData.myAnswer}
                    onChange={(e) => setEditFormData({ ...editFormData, myAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder={t('questions.enterMyAnswer')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('questions.correctAnswerRequiredLabel')}
                  </label>
                  <textarea
                    value={editFormData.correctAnswer}
                    onChange={(e) => setEditFormData({ ...editFormData, correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder={t('questions.enterCorrectAnswer')}
                    required
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('questions.explanationOptional')}
                </label>
                <textarea
                  value={editFormData.explanation}
                  onChange={(e) => setEditFormData({ ...editFormData, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder={t('questions.enterExplanation')}
                />
              </div>

              {/* Subject, Difficulty, Error Type, Mastery Level */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('questions.subjectRequiredLabel')}
                  </label>
                  <select
                    value={editFormData.subjectId}
                    onChange={(e) => setEditFormData({ ...editFormData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">{t('questions.selectSubject')}</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.nameZh}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('questions.difficulty')}
                  </label>
                  <select
                    value={editFormData.difficulty}
                    onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EASY">{t('questions.easy')}</option>
                    <option value="MEDIUM">{t('questions.medium')}</option>
                    <option value="HARD">{t('questions.hard')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('questions.errorType')}
                  </label>
                  <select
                    value={editFormData.errorType}
                    onChange={(e) => setEditFormData({ ...editFormData, errorType: e.target.value as 'CALCULATION' | 'CONCEPTUAL' | 'CARELESS' | 'METHODOLOGICAL' | 'KNOWLEDGE' | 'OTHER' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="CALCULATION">{t('questions.calculation')}</option>
                    <option value="CONCEPTUAL">{t('questions.conceptual')}</option>
                    <option value="CARELESS">{t('questions.careless')}</option>
                    <option value="METHODOLOGICAL">{t('questions.methodological')}</option>
                    <option value="KNOWLEDGE">{t('questions.knowledge')}</option>
                    <option value="OTHER">{t('questions.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('questions.masteryLevel')}
                  </label>
                  <select
                    value={editFormData.masteryLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, masteryLevel: e.target.value as 'NOT_MASTERED' | 'PARTIALLY_MASTERED' | 'MASTERED' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="NOT_MASTERED">{t('questions.notMasteredLevel')}</option>
                    <option value="PARTIALLY_MASTERED">{t('questions.partiallyMastered')}</option>
                    <option value="MASTERED">{t('questions.masteredLevel')}</option>
                  </select>
                </div>
              </div>

              {/* Language Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('questions.languageType')}
                </label>
                <select
                  value={editFormData.languageType}
                  onChange={(e) => setEditFormData({ ...editFormData, languageType: e.target.value as 'CHINESE' | 'ENGLISH' | 'BILINGUAL' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CHINESE">{t('questions.chinese')}</option>
                  <option value="ENGLISH">{t('questions.english')}</option>
                  <option value="BILINGUAL">{t('questions.bilingual')}</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    resetEditForm();
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  data-testid="cancel-edit-btn"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  data-testid="confirm-edit-btn"
                >
                  {loading ? t('questions.saving') : t('common.save')}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
      )}
    </AppLayout>
  );
}
