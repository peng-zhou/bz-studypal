'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { api, questionsAPI, subjectsAPI } from '@/lib/api';

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

export default function QuestionsPage() {
  const router = useRouter();
  const { t } = useTranslation('questions');
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
    
    if (!confirm(t('confirmDeleteSelected', { count: selectedQuestions.length }))) {
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
    if (!confirm(t('confirmDelete'))) {
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

  const handleCreateQuestion = async (questionData: any) => {
    try {
      setLoading(true);
      const response = await questionsAPI.createQuestion(questionData);
      
      if (response.success) {
        setShowCreateModal(false);
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

  const handleUpdateQuestion = async (questionId: string, questionData: any) => {
    try {
      setLoading(true);
      const response = await questionsAPI.updateQuestion(questionId, questionData);
      
      if (response.success) {
        setEditingQuestion(null);
        await loadQuestions();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]" data-testid="loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="questions-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="page-title">
          {t('title')}
        </h1>
        <p className="text-gray-600" data-testid="page-description">
          {t('description')}
        </p>
      </div>

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
            <div className="text-sm text-gray-600">{t('stats.totalQuestions')}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600" data-testid="recent-count">{stats.recentWeekCount}</div>
            <div className="text-sm text-gray-600">{t('stats.thisWeek')}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600" data-testid="not-mastered-count">
              {stats.byMastery.find(m => m.masteryLevel === 'NOT_MASTERED')?._count || 0}
            </div>
            <div className="text-sm text-gray-600">{t('stats.notMastered')}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600" data-testid="mastered-count">
              {stats.byMastery.find(m => m.masteryLevel === 'MASTERED')?._count || 0}
            </div>
            <div className="text-sm text-gray-600">{t('stats.mastered')}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-lg shadow mb-6" data-testid="filters">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('filters.search')}
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={t('filters.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="search-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('filters.subject')}
            </label>
            <select
              value={filters.subjectId || ''}
              onChange={(e) => handleFilterChange('subjectId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="subject-filter"
            >
              <option value="">{t('filters.allSubjects')}</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.nameZh}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('filters.difficulty')}
            </label>
            <select
              value={filters.difficulty || ''}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="difficulty-filter"
            >
              <option value="">{t('filters.allDifficulties')}</option>
              <option value="EASY">{t('difficulty.easy')}</option>
              <option value="MEDIUM">{t('difficulty.medium')}</option>
              <option value="HARD">{t('difficulty.hard')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('filters.mastery')}
            </label>
            <select
              value={filters.masteryLevel || ''}
              onChange={(e) => handleFilterChange('masteryLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="mastery-filter"
            >
              <option value="">{t('filters.allMastery')}</option>
              <option value="NOT_MASTERED">{t('mastery.notMastered')}</option>
              <option value="PARTIALLY_MASTERED">{t('mastery.partiallyMastered')}</option>
              <option value="MASTERED">{t('mastery.mastered')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('filters.sortBy')}
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="sort-by"
            >
              <option value="addedAt">{t('sort.addedAt')}</option>
              <option value="lastReviewedAt">{t('sort.lastReviewed')}</option>
              <option value="reviewCount">{t('sort.reviewCount')}</option>
              <option value="difficulty">{t('sort.difficulty')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('filters.sortOrder')}
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              data-testid="sort-order"
            >
              <option value="desc">{t('sort.descending')}</option>
              <option value="asc">{t('sort.ascending')}</option>
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
            {t('actions.createQuestion')}
          </button>
          
          {selectedQuestions.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              data-testid="delete-selected-btn"
            >
              {t('actions.deleteSelected', { count: selectedQuestions.length })}
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600" data-testid="results-info">
          {t('pagination.showing', {
            start: (pagination.page - 1) * pagination.limit + 1,
            end: Math.min(pagination.page * pagination.limit, pagination.totalCount),
            total: pagination.totalCount
          })}
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="questions-list">
        {questions.length === 0 ? (
          <div className="p-8 text-center text-gray-500" data-testid="empty-state">
            {t('emptyState')}
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
                  {t('selectAll')}
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
                            {t(`difficulty.${question.difficulty.toLowerCase()}`)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            question.masteryLevel === 'MASTERED' ? 'bg-blue-100 text-blue-800' :
                            question.masteryLevel === 'PARTIALLY_MASTERED' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`} data-testid={`mastery-${question.id}`}>
                            {t(`mastery.${question.masteryLevel.toLowerCase().replace('_', '')}`)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingQuestion(question)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            data-testid={`edit-btn-${question.id}`}
                          >
                            {t('actions.edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                            data-testid={`delete-btn-${question.id}`}
                          >
                            {t('actions.delete')}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-gray-700 line-clamp-3" data-testid={`content-${question.id}`}>
                          {question.content}
                        </p>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        <span data-testid={`added-date-${question.id}`}>
                          {t('addedAt')}: {new Date(question.addedAt).toLocaleDateString()}
                        </span>
                        <span data-testid={`review-count-${question.id}`}>
                          {t('reviewCount')}: {question.reviewCount}
                        </span>
                        {question._count.bookmarks > 0 && (
                          <span data-testid={`bookmark-count-${question.id}`}>
                            {t('bookmarkCount')}: {question._count.bookmarks}
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
              {t('pagination.previous')}
            </button>
            
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700" data-testid="page-info">
              {t('pagination.pageInfo', { current: pagination.page, total: pagination.totalPages })}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="next-page-btn"
            >
              {t('pagination.next')}
            </button>
          </nav>
        </div>
      )}

      {/* Modals would go here - CreateQuestionModal, EditQuestionModal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-modal">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">{t('modals.createQuestion')}</h2>
            {/* Create form would go here */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                data-testid="cancel-create-btn"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={() => handleCreateQuestion({})}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                data-testid="confirm-create-btn"
              >
                {t('actions.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="edit-modal">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">{t('modals.editQuestion')}</h2>
            {/* Edit form would go here */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                data-testid="cancel-edit-btn"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={() => handleUpdateQuestion(editingQuestion.id, {})}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                data-testid="confirm-edit-btn"
              >
                {t('actions.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
