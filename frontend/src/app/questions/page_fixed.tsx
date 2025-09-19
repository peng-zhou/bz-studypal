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

// Modal Component
const QuestionModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onSubmit,
  submitText,
  isLoading = false 
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitText: string;
  isLoading?: boolean;
}) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-full p-2 sm:p-4 pt-4 sm:pt-8 pb-20">
        <div className="bg-white rounded-lg max-w-4xl w-full shadow-xl">
          <div className="max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-4 sm:px-6 py-4">
              <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4 sm:space-y-6">
                {children}
                
                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitText}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

  // ... (keep all the existing logic functions like loadQuestions, handleCreateQuestion, etc.)

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <AppLayout 
      title={t('questions.title')} 
      description={t('questions.description')}
    >
      {/* Your existing JSX content here */}
      
      {/* Create Question Modal */}
      <QuestionModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title={t('questions.createQuestionModal')}
        onSubmit={handleCreateQuestion}
        submitText={loading ? t('questions.creating') : t('common.create')}
        isLoading={loading}
      >
        {/* Form content for creating question */}
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
        {/* Add rest of form fields here */}
      </QuestionModal>

      {/* Edit Question Modal */}
      <QuestionModal
        isOpen={!!editingQuestion}
        onClose={() => {
          setEditingQuestion(null);
          resetEditForm();
        }}
        title={t('questions.editQuestionModal')}
        onSubmit={handleUpdateQuestion}
        submitText={loading ? t('questions.saving') : t('common.save')}
        isLoading={loading}
      >
        {/* Form content for editing question */}
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
        {/* Add rest of form fields here */}
      </QuestionModal>
    </AppLayout>
  );
}
