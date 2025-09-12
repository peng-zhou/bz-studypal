import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import QuestionsPage from '../page';
import { useAuthStore } from '@/stores/authStore';
import { questionsAPI, subjectsAPI } from '@/lib/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  questionsAPI: {
    getQuestions: jest.fn(),
    getQuestionById: jest.fn(), 
    createQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    batchDeleteQuestions: jest.fn(),
    getQuestionStats: jest.fn(),
  },
  subjectsAPI: {
    getSubjects: jest.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockT = (key: string, options?: any) => {
  const translations: Record<string, string> = {
    'title': 'Questions Management',
    'description': 'Manage your wrong questions',
    'stats.totalQuestions': 'Total Questions',
    'stats.thisWeek': 'This Week',
    'stats.notMastered': 'Not Mastered',
    'stats.mastered': 'Mastered',
    'filters.search': 'Search',
    'filters.searchPlaceholder': 'Search questions...',
    'filters.subject': 'Subject',
    'filters.allSubjects': 'All Subjects',
    'filters.difficulty': 'Difficulty',
    'filters.allDifficulties': 'All Difficulties',
    'filters.mastery': 'Mastery',
    'filters.allMastery': 'All Mastery Levels',
    'filters.sortBy': 'Sort By',
    'filters.sortOrder': 'Sort Order',
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.hard': 'Hard',
    'mastery.notmastered': 'Not Mastered',
    'mastery.partiallymastered': 'Partially Mastered',
    'mastery.mastered': 'Mastered',
    'sort.addedAt': 'Added Date',
    'sort.lastReviewed': 'Last Reviewed',
    'sort.reviewCount': 'Review Count',
    'sort.difficulty': 'Difficulty',
    'sort.descending': 'Descending',
    'sort.ascending': 'Ascending',
    'actions.createQuestion': 'Create Question',
    'actions.deleteSelected': `Delete Selected (${options?.count || 0})`,
    'actions.edit': 'Edit',
    'actions.delete': 'Delete',
    'actions.cancel': 'Cancel',
    'actions.create': 'Create',
    'actions.save': 'Save',
    'pagination.showing': `Showing ${options?.start || 1}-${options?.end || 0} of ${options?.total || 0}`,
    'pagination.previous': 'Previous',
    'pagination.next': 'Next',
    'pagination.pageInfo': `Page ${options?.current || 1} of ${options?.total || 1}`,
    'selectAll': 'Select All',
    'emptyState': 'No questions found',
    'addedAt': 'Added',
    'reviewCount': 'Reviews',
    'bookmarkCount': 'Bookmarks',
    'confirmDelete': 'Are you sure you want to delete this question?',
    'confirmDeleteSelected': `Are you sure you want to delete ${options?.count || 0} questions?`,
    'modals.createQuestion': 'Create New Question',
    'modals.editQuestion': 'Edit Question'
  };
  return translations[key] || key;
};

const mockSubjects = [
  {
    id: 'subject-1',
    code: 'MATH',
    nameZh: '数学',
    nameEn: 'Mathematics',
    color: '#FF5722'
  },
  {
    id: 'subject-2', 
    code: 'ENG',
    nameZh: '英语',
    nameEn: 'English',
    color: '#4CAF50'
  }
];

const mockQuestions = [
  {
    id: 'question-1',
    title: '二次方程求解',
    content: '解方程 x² + 2x - 3 = 0',
    images: [],
    myAnswer: 'x = 1 或 x = -2',
    correctAnswer: 'x = 1 或 x = -3',
    explanation: '使用因式分解：(x+3)(x-1) = 0',
    subjectId: 'subject-1',
    difficulty: 'MEDIUM' as const,
    languageType: 'CHINESE' as const,
    errorType: 'CALCULATION' as const,
    masteryLevel: 'NOT_MASTERED' as const,
    knowledgePoints: ['二次方程', '因式分解'],
    tags: ['代数', '方程'],
    subject: mockSubjects[0],
    addedAt: '2024-01-01T00:00:00.000Z',
    lastReviewedAt: null,
    reviewCount: 0,
    _count: {
      reviews: 0,
      bookmarks: 1
    }
  },
  {
    id: 'question-2',
    title: '英语语法',
    content: 'Choose the correct answer: I ____ to school yesterday.',
    images: [],
    myAnswer: 'go',
    correctAnswer: 'went',
    explanation: 'Past tense of "go" is "went"',
    subjectId: 'subject-2',
    difficulty: 'EASY' as const,
    languageType: 'ENGLISH' as const,
    errorType: 'KNOWLEDGE' as const,
    masteryLevel: 'MASTERED' as const,
    knowledgePoints: ['Past tense'],
    tags: ['grammar'],
    subject: mockSubjects[1],
    addedAt: '2024-01-02T00:00:00.000Z',
    lastReviewedAt: '2024-01-03T00:00:00.000Z',
    reviewCount: 3,
    _count: {
      reviews: 3,
      bookmarks: 0
    }
  }
];

const mockStats = {
  totalCount: 25,
  recentWeekCount: 5,
  bySubject: [
    { subjectId: 'subject-1', _count: 15, subject: mockSubjects[0] },
    { subjectId: 'subject-2', _count: 10, subject: mockSubjects[1] }
  ],
  byDifficulty: [
    { difficulty: 'EASY', _count: 5 },
    { difficulty: 'MEDIUM', _count: 12 },
    { difficulty: 'HARD', _count: 8 }
  ],
  byMastery: [
    { masteryLevel: 'NOT_MASTERED', _count: 18 },
    { masteryLevel: 'PARTIALLY_MASTERED', _count: 4 },
    { masteryLevel: 'MASTERED', _count: 3 }
  ],
  byErrorType: [
    { errorType: 'CALCULATION', _count: 10 },
    { errorType: 'CONCEPTUAL', _count: 8 },
    { errorType: 'KNOWLEDGE', _count: 7 }
  ]
};

const mockPagination = {
  page: 1,
  limit: 20,
  totalCount: 25,
  totalPages: 2,
  hasNextPage: true,
  hasPrevPage: false
};

describe('QuestionsPage', () => {
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;
  const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
  const mockQuestionsAPI = questionsAPI as jest.Mocked<typeof questionsAPI>;
  const mockSubjectsAPI = subjectsAPI as jest.Mocked<typeof subjectsAPI>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    (mockUseRouter as jest.Mock).mockReturnValue(mockRouter);
    (mockUseTranslation as jest.Mock).mockReturnValue({ t: mockT });
    
    (mockUseAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    });

    // Mock successful API responses
    mockQuestionsAPI.getQuestions.mockResolvedValue({
      success: true,
      data: mockQuestions,
      pagination: mockPagination
    });

    mockSubjectsAPI.getSubjects.mockResolvedValue({
      success: true,
      data: mockSubjects,
      count: mockSubjects.length
    });

    mockQuestionsAPI.getQuestionStats.mockResolvedValue({
      success: true,
      data: mockStats
    });

    // Mock other API methods
    mockQuestionsAPI.deleteQuestion.mockResolvedValue({ success: true, message: 'Deleted' });
    mockQuestionsAPI.batchDeleteQuestions.mockResolvedValue({ success: true, message: 'Deleted', deletedCount: 2 });
    mockQuestionsAPI.createQuestion.mockResolvedValue({ success: true, data: mockQuestions[0], message: 'Created' });
    mockQuestionsAPI.updateQuestion.mockResolvedValue({ success: true, data: mockQuestions[0], message: 'Updated' });
  });

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', () => {
      (mockUseAuthStore as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(<QuestionsPage />);

      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login?redirect=/questions');
    });

    it('should render page if authenticated', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('questions-page')).toBeInTheDocument();
      });
    });
  });

  describe('Initial Loading', () => {
    it('should show loading spinner initially', () => {
      render(<QuestionsPage />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should load questions, subjects, and stats on mount', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(mockQuestionsAPI.getQuestions).toHaveBeenCalled();
        expect(mockSubjectsAPI.getSubjects).toHaveBeenCalled();
        expect(mockQuestionsAPI.getQuestionStats).toHaveBeenCalled();
      });
    });

    it('should display error message when loading fails', async () => {
      mockQuestionsAPI.getQuestions.mockRejectedValue(new Error('Failed to load'));

      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Cards', () => {
    it('should display statistics correctly', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
        expect(screen.getByTestId('total-count')).toHaveTextContent('25');
        expect(screen.getByTestId('recent-count')).toHaveTextContent('5');
        expect(screen.getByTestId('not-mastered-count')).toHaveTextContent('18');
        expect(screen.getByTestId('mastered-count')).toHaveTextContent('3');
      });
    });
  });

  describe('Filters', () => {
    it('should render all filter controls', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByTestId('subject-filter')).toBeInTheDocument();
        expect(screen.getByTestId('difficulty-filter')).toBeInTheDocument();
        expect(screen.getByTestId('mastery-filter')).toBeInTheDocument();
        expect(screen.getByTestId('sort-by')).toBeInTheDocument();
        expect(screen.getByTestId('sort-order')).toBeInTheDocument();
      });
    });

    it('should update search filter and reload questions', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'algebra' } });
      });

      // Wait for debounce and API call
      await waitFor(() => {
        expect(mockQuestionsAPI.getQuestions).toHaveBeenCalledWith(
          expect.stringContaining('search=algebra')
        );
      }, { timeout: 500 });
    });

    it('should update subject filter and reload questions', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('subject-filter')).toBeInTheDocument();
      });

      const subjectFilter = screen.getByTestId('subject-filter');
      
      await act(async () => {
        fireEvent.change(subjectFilter, { target: { value: 'subject-1' } });
      });

      await waitFor(() => {
        expect(mockQuestionsAPI.getQuestions).toHaveBeenCalledWith(
          expect.stringContaining('subjectId=subject-1')
        );
      }, { timeout: 500 });
    });

    it('should populate subject filter options', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        const subjectFilter = screen.getByTestId('subject-filter');
        expect(subjectFilter).toBeInTheDocument();
        
        const options = subjectFilter.querySelectorAll('option');
        expect(options).toHaveLength(3); // All + 2 subjects
        expect(options[1]).toHaveTextContent('数学');
        expect(options[2]).toHaveTextContent('英语');
      });
    });
  });

  describe('Questions List', () => {
    it('should render questions list when data is available', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('questions-list')).toBeInTheDocument();
        expect(screen.getByTestId('question-question-1')).toBeInTheDocument();
        expect(screen.getByTestId('question-question-2')).toBeInTheDocument();
      });
    });

    it('should display empty state when no questions', async () => {
      mockQuestionsAPI.getQuestions.mockResolvedValue({
        success: true,
        data: [],
        pagination: { ...mockPagination, totalCount: 0, totalPages: 0 }
      });

      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });

    it('should display question information correctly', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        const question = mockQuestions[0];
        expect(screen.getByTestId(`title-${question.id}`)).toHaveTextContent(question.title!);
        expect(screen.getByTestId(`content-${question.id}`)).toHaveTextContent(question.content);
        expect(screen.getByTestId(`subject-badge-${question.id}`)).toHaveTextContent('数学');
        expect(screen.getByTestId(`difficulty-${question.id}`)).toHaveTextContent('Medium');
        expect(screen.getByTestId(`review-count-${question.id}`)).toHaveTextContent('Reviews: 0');
      });
    });

    it('should show bookmark count when greater than 0', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('bookmark-count-question-1')).toBeInTheDocument();
        expect(screen.queryByTestId('bookmark-count-question-2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Selection and Bulk Actions', () => {
    it('should allow selecting individual questions', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-question-1')).toBeInTheDocument();
      });

      const checkbox = screen.getByTestId('checkbox-question-1');
      
      await act(async () => {
        fireEvent.click(checkbox);
      });

      expect(checkbox).toBeChecked();
    });

    it('should allow selecting all questions', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('select-all-checkbox')).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      
      await act(async () => {
        fireEvent.click(selectAllCheckbox);
      });

      expect(selectAllCheckbox).toBeChecked();
      expect(screen.getByTestId('checkbox-question-1')).toBeChecked();
      expect(screen.getByTestId('checkbox-question-2')).toBeChecked();
    });

    it('should show delete selected button when questions are selected', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-question-1')).toBeInTheDocument();
      });

      // Initially, delete button should not be visible
      expect(screen.queryByTestId('delete-selected-btn')).not.toBeInTheDocument();

      const checkbox = screen.getByTestId('checkbox-question-1');
      
      await act(async () => {
        fireEvent.click(checkbox);
      });

      expect(screen.getByTestId('delete-selected-btn')).toBeInTheDocument();
    });
  });

  describe('Question Actions', () => {
    beforeEach(() => {
      // Mock window.confirm
      global.confirm = jest.fn(() => true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should delete individual question', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn-question-1')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByTestId('delete-btn-question-1');
      
      await act(async () => {
        fireEvent.click(deleteBtn);
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(mockQuestionsAPI.deleteQuestion).toHaveBeenCalledWith('question-1');
    });

    it('should not delete if user cancels confirmation', async () => {
      global.confirm = jest.fn(() => false);

      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn-question-1')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByTestId('delete-btn-question-1');
      
      await act(async () => {
        fireEvent.click(deleteBtn);
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(mockQuestionsAPI.deleteQuestion).not.toHaveBeenCalled();
    });

    it('should batch delete selected questions', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-question-1')).toBeInTheDocument();
      });

      // Select questions
      await act(async () => {
        fireEvent.click(screen.getByTestId('checkbox-question-1'));
        fireEvent.click(screen.getByTestId('checkbox-question-2'));
      });

      const deleteBtn = screen.getByTestId('delete-selected-btn');
      
      await act(async () => {
        fireEvent.click(deleteBtn);
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(mockQuestionsAPI.batchDeleteQuestions).toHaveBeenCalledWith(['question-1', 'question-2']);
    });

    it('should open edit modal when edit button is clicked', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('edit-btn-question-1')).toBeInTheDocument();
      });

      const editBtn = screen.getByTestId('edit-btn-question-1');
      
      await act(async () => {
        fireEvent.click(editBtn);
      });

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });
  });

  describe('Create Question Modal', () => {
    it('should open create modal when create button is clicked', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('create-question-btn')).toBeInTheDocument();
      });

      const createBtn = screen.getByTestId('create-question-btn');
      
      await act(async () => {
        fireEvent.click(createBtn);
      });

      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });

    it('should close create modal when cancel is clicked', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('create-question-btn')).toBeInTheDocument();
      });

      // Open modal
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-question-btn'));
      });

      expect(screen.getByTestId('create-modal')).toBeInTheDocument();

      // Close modal
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-create-btn'));
      });

      expect(screen.queryByTestId('create-modal')).not.toBeInTheDocument();
    });

    it('should call create API when confirm is clicked', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('create-question-btn')).toBeInTheDocument();
      });

      // Open modal and confirm
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-question-btn'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm-create-btn'));
      });

      expect(mockQuestionsAPI.createQuestion).toHaveBeenCalledWith({});
    });
  });

  describe('Edit Question Modal', () => {
    it('should close edit modal when cancel is clicked', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('edit-btn-question-1')).toBeInTheDocument();
      });

      // Open modal
      await act(async () => {
        fireEvent.click(screen.getByTestId('edit-btn-question-1'));
      });

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();

      // Close modal
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-edit-btn'));
      });

      expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
    });

    it('should call update API when save is clicked', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('edit-btn-question-1')).toBeInTheDocument();
      });

      // Open modal and save
      await act(async () => {
        fireEvent.click(screen.getByTestId('edit-btn-question-1'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm-edit-btn'));
      });

      expect(mockQuestionsAPI.updateQuestion).toHaveBeenCalledWith('question-1', {});
    });
  });

  describe('Pagination', () => {
    it('should show pagination when there are multiple pages', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
        expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 2');
      });
    });

    it('should disable previous button on first page', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        const prevBtn = screen.getByTestId('prev-page-btn');
        expect(prevBtn).toBeDisabled();
      });
    });

    it('should enable next button when there are more pages', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        const nextBtn = screen.getByTestId('next-page-btn');
        expect(nextBtn).toBeEnabled();
      });
    });

    it('should navigate to next page when next button is clicked', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('next-page-btn')).toBeInTheDocument();
      });

      const nextBtn = screen.getByTestId('next-page-btn');
      
      await act(async () => {
        fireEvent.click(nextBtn);
      });

      await waitFor(() => {
        expect(mockQuestionsAPI.getQuestions).toHaveBeenCalledWith(
          expect.stringContaining('page=2')
        );
      });
    });

    it('should hide pagination when only one page', async () => {
      mockQuestionsAPI.getQuestions.mockResolvedValue({
        success: true,
        data: mockQuestions,
        pagination: { ...mockPagination, totalPages: 1, hasNextPage: false }
      });

      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
      });
    });
  });

  describe('Results Info', () => {
    it('should display correct results information', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('results-info')).toHaveTextContent('Showing 1-20 of 25');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockQuestionsAPI.deleteQuestion.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn-question-1')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('delete-btn-question-1'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should display error from API response', async () => {
      mockQuestionsAPI.deleteQuestion.mockResolvedValue({
        success: false,
        error: 'Permission denied'
      });

      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn-question-1')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('delete-btn-question-1'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Permission denied');
      });
    });
  });

  describe('Data Refresh', () => {
    it('should refresh stats after successful deletion', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('delete-btn-question-1')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('delete-btn-question-1'));
      });

      await waitFor(() => {
        expect(mockQuestionsAPI.getQuestionStats).toHaveBeenCalledTimes(2); // Initial load + after delete
      });
    });

    it('should refresh data after successful creation', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('create-question-btn')).toBeInTheDocument();
      });

      // Open modal and create
      await act(async () => {
        fireEvent.click(screen.getByTestId('create-question-btn'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('confirm-create-btn'));
      });

      await waitFor(() => {
        expect(mockQuestionsAPI.getQuestions).toHaveBeenCalledTimes(2); // Initial load + after create
        expect(mockQuestionsAPI.getQuestionStats).toHaveBeenCalledTimes(2); // Initial load + after create
      });
    });
  });
});
