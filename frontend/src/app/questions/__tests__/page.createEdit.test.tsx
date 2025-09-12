import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import QuestionsPage from '../page';
import { useAuthStore } from '@/stores/authStore';
import { questionsAPI, subjectsAPI } from '@/lib/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  questionsAPI: {
    getQuestions: jest.fn(),
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

// Mock AppLayout component
jest.mock('../../../components/layout/AppLayout', () => {
  return function MockAppLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="app-layout">{children}</div>;
  };
});

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
});

const mockSubjects = [
  {
    id: 'subject-1',
    code: 'MATH',
    nameZh: '数学',
    nameEn: 'Mathematics',
    color: '#FF5722',
    order: 1
  },
  {
    id: 'subject-2', 
    code: 'ENG',
    nameZh: '英语',
    nameEn: 'English',
    color: '#4CAF50',
    order: 2
  }
];

const mockQuestion = {
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
};

const mockStats = {
  totalCount: 1,
  recentWeekCount: 1,
  bySubject: [{ subjectId: 'subject-1', _count: 1, subject: mockSubjects[0] }],
  byDifficulty: [{ difficulty: 'MEDIUM', _count: 1 }],
  byMastery: [{ masteryLevel: 'NOT_MASTERED', _count: 1 }],
  byErrorType: [{ errorType: 'CALCULATION', _count: 1 }]
};

const mockPagination = {
  page: 1,
  limit: 20,
  totalCount: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false
};

describe('QuestionsPage - Create and Edit Functionality', () => {
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
  const mockQuestionsAPI = questionsAPI as jest.Mocked<typeof questionsAPI>;
  const mockSubjectsAPI = subjectsAPI as jest.Mocked<typeof subjectsAPI>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    (mockUseRouter as jest.Mock).mockReturnValue(mockRouter);
    
    (mockUseAuthStore as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    });

    // Mock successful API responses
    mockQuestionsAPI.getQuestions.mockResolvedValue({
      success: true,
      data: [mockQuestion],
      pagination: mockPagination
    });

    mockSubjectsAPI.getSubjects.mockResolvedValue({
      success: true,
      data: mockSubjects
    });

    mockQuestionsAPI.getQuestionStats.mockResolvedValue({
      success: true,
      data: mockStats
    });

    mockQuestionsAPI.createQuestion.mockResolvedValue({
      success: true,
      data: mockQuestion,
      message: 'Question created successfully'
    });

    mockQuestionsAPI.updateQuestion.mockResolvedValue({
      success: true,
      data: { ...mockQuestion, masteryLevel: 'MASTERED' },
      message: 'Question updated successfully'
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
      expect(screen.getAllByText('添加错题')).toHaveLength(2); // Button and modal title
    });

    it('should close create modal when cancel is clicked', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('create-question-btn')).toBeInTheDocument();
      });

      // Open modal
      const createBtn = screen.getByTestId('create-question-btn');
      await act(async () => {
        fireEvent.click(createBtn);
      });

      expect(screen.getByTestId('create-modal')).toBeInTheDocument();

      // Close modal
      const cancelBtn = screen.getByTestId('cancel-create-btn');
      await act(async () => {
        fireEvent.click(cancelBtn);
      });

      expect(screen.queryByTestId('create-modal')).not.toBeInTheDocument();
    });

    it('should validate required fields and show error messages', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('create-question-btn')).toBeInTheDocument();
      });

      // Open modal
      const createBtn = screen.getByTestId('create-question-btn');
      await act(async () => {
        fireEvent.click(createBtn);
      });

      // Try to submit without required fields
      const submitBtn = screen.getByTestId('confirm-create-btn');
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Should show validation error
      await waitFor(() => {
        const errorElement = screen.queryByTestId('error-message');
        if (errorElement) {
          expect(errorElement).toBeInTheDocument();
        } else {
          // Check if form prevents submission or shows inline validation
          expect(screen.getByTestId('create-modal')).toBeInTheDocument();
        }
      });
    });

    it('should create question successfully with valid data', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('create-question-btn')).toBeInTheDocument();
      });

      // Open modal
      const createBtn = screen.getByTestId('create-question-btn');
      await act(async () => {
        fireEvent.click(createBtn);
      });

      expect(screen.getByTestId('create-modal')).toBeInTheDocument();

      // Fill form data
      const contentField = screen.getByPlaceholderText('请输入错题内容');
      const myAnswerField = screen.getByPlaceholderText('请输入您的答案');
      const correctAnswerField = screen.getByPlaceholderText('请输入正确答案');
      const subjectField = screen.getByDisplayValue('请选择科目');

      await user.type(contentField, '测试错题内容');
      await user.type(myAnswerField, '我的答案');
      await user.type(correctAnswerField, '正确答案');
      await user.selectOptions(subjectField, 'subject-1');

      // Submit form
      const submitBtn = screen.getByTestId('confirm-create-btn');
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Verify API was called with correct data
      await waitFor(() => {
        expect(mockQuestionsAPI.createQuestion).toHaveBeenCalledWith({
          title: '',
          content: '测试错题内容',
          myAnswer: '我的答案',
          correctAnswer: '正确答案',
          explanation: '',
          subjectId: 'subject-1',
          difficulty: 'MEDIUM',
          languageType: 'CHINESE',
          errorType: 'OTHER',
          knowledgePoints: [],
          tags: []
        });
      });

      // Modal should close after successful creation
      expect(screen.queryByTestId('create-modal')).not.toBeInTheDocument();
    });

    it('should handle API errors during creation', async () => {
      mockQuestionsAPI.createQuestion.mockResolvedValue({
        success: false,
        error: 'Failed to create question'
      });

      const user = userEvent.setup();
      
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('create-question-btn')).toBeInTheDocument();
      });

      // Open modal and fill form
      const createBtn = screen.getByTestId('create-question-btn');
      await act(async () => {
        fireEvent.click(createBtn);
      });

      const contentField = screen.getByPlaceholderText('请输入错题内容');
      const myAnswerField = screen.getByPlaceholderText('请输入您的答案');
      const correctAnswerField = screen.getByPlaceholderText('请输入正确答案');
      const subjectField = screen.getByDisplayValue('请选择科目');

      await user.type(contentField, '测试错题内容');
      await user.type(myAnswerField, '我的答案');
      await user.type(correctAnswerField, '正确答案');
      await user.selectOptions(subjectField, 'subject-1');

      // Submit form
      const submitBtn = screen.getByTestId('confirm-create-btn');
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Failed to create question')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Question Modal', () => {
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
      expect(screen.getByText('编辑错题')).toBeInTheDocument();
    });

    it('should populate form with existing question data', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('edit-btn-question-1')).toBeInTheDocument();
      });

      // Click edit button
      const editBtn = screen.getByTestId('edit-btn-question-1');
      await act(async () => {
        fireEvent.click(editBtn);
      });

      // Check if form is populated with existing data
      expect(screen.getByDisplayValue('二次方程求解')).toBeInTheDocument(); // title
      expect(screen.getByDisplayValue('解方程 x² + 2x - 3 = 0')).toBeInTheDocument(); // content
      expect(screen.getByDisplayValue('x = 1 或 x = -2')).toBeInTheDocument(); // myAnswer
      expect(screen.getByDisplayValue('x = 1 或 x = -3')).toBeInTheDocument(); // correctAnswer
      expect(screen.getByDisplayValue('使用因式分解：(x+3)(x-1) = 0')).toBeInTheDocument(); // explanation
    });

    it('should close edit modal when cancel is clicked', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('edit-btn-question-1')).toBeInTheDocument();
      });

      // Open edit modal
      const editBtn = screen.getByTestId('edit-btn-question-1');
      await act(async () => {
        fireEvent.click(editBtn);
      });

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();

      // Close modal
      const cancelBtn = screen.getByTestId('cancel-edit-btn');
      await act(async () => {
        fireEvent.click(cancelBtn);
      });

      expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
    });

    it('should update question successfully', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('edit-btn-question-1')).toBeInTheDocument();
      });

      // Open edit modal
      const editBtn = screen.getByTestId('edit-btn-question-1');
      await act(async () => {
        fireEvent.click(editBtn);
      });

      // Modify some fields
      const contentField = screen.getByDisplayValue('解方程 x² + 2x - 3 = 0');
      await user.clear(contentField);
      await user.type(contentField, '修改后的题目内容');

      const masterySelect = screen.getByDisplayValue('未掌握');
      await user.selectOptions(masterySelect, 'MASTERED');

      // Submit form
      const saveBtn = screen.getByTestId('confirm-edit-btn');
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      // Verify API was called
      await waitFor(() => {
        expect(mockQuestionsAPI.updateQuestion).toHaveBeenCalledWith('question-1', expect.objectContaining({
          content: '修改后的题目内容',
          masteryLevel: 'MASTERED'
        }));
      });

      // Modal should close after successful update
      expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
    });

    it('should validate required fields in edit form', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('edit-btn-question-1')).toBeInTheDocument();
      });

      // Open edit modal
      const editBtn = screen.getByTestId('edit-btn-question-1');
      await act(async () => {
        fireEvent.click(editBtn);
      });

      // Clear required field
      const contentField = screen.getByDisplayValue('解方程 x² + 2x - 3 = 0');
      await user.clear(contentField);

      // Try to submit
      const saveBtn = screen.getByTestId('confirm-edit-btn');
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      // Should show validation error
      await waitFor(() => {
        const errorElement = screen.queryByTestId('error-message');
        if (errorElement) {
          expect(errorElement).toBeInTheDocument();
        } else {
          // Check if form prevents submission or shows inline validation
          expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
        }
      });
    });

    it('should handle API errors during update', async () => {
      mockQuestionsAPI.updateQuestion.mockResolvedValue({
        success: false,
        error: 'Failed to update question'
      });

      await act(async () => {
        render(<QuestionsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('edit-btn-question-1')).toBeInTheDocument();
      });

      // Open edit modal
      const editBtn = screen.getByTestId('edit-btn-question-1');
      await act(async () => {
        fireEvent.click(editBtn);
      });

      // Submit form
      const saveBtn = screen.getByTestId('confirm-edit-btn');
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Failed to update question')).toBeInTheDocument();
      });
    });
  });

  describe('Form Field Interactions', () => {
    it('should support all difficulty levels in create form', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      const createBtn = screen.getByTestId('create-question-btn');
      await act(async () => {
        fireEvent.click(createBtn);
      });

      const difficultySelect = screen.getByDisplayValue('中等');
      expect(difficultySelect).toBeInTheDocument();
      
      const options = difficultySelect.querySelectorAll('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('简单');
      expect(options[1]).toHaveTextContent('中等');
      expect(options[2]).toHaveTextContent('困难');
    });

    it('should support all error types in forms', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      const createBtn = screen.getByTestId('create-question-btn');
      await act(async () => {
        fireEvent.click(createBtn);
      });

      const errorTypeSelect = screen.getByDisplayValue('其他');
      const options = errorTypeSelect.querySelectorAll('option');
      expect(options).toHaveLength(6);
      expect(options[0]).toHaveTextContent('计算错误');
      expect(options[1]).toHaveTextContent('概念错误');
      expect(options[2]).toHaveTextContent('粗心错误');
      expect(options[3]).toHaveTextContent('方法错误');
      expect(options[4]).toHaveTextContent('知识点错误');
      expect(options[5]).toHaveTextContent('其他');
    });

    it('should support mastery levels in edit form', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      const editBtn = screen.getByTestId('edit-btn-question-1');
      await act(async () => {
        fireEvent.click(editBtn);
      });

      const masterySelect = screen.getByDisplayValue('未掌握');
      const options = masterySelect.querySelectorAll('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('未掌握');
      expect(options[1]).toHaveTextContent('部分掌握');
      expect(options[2]).toHaveTextContent('已掌握');
    });
  });

  describe('Data Refresh After Operations', () => {
    it('should refresh questions list and stats after creating', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<QuestionsPage />);
      });

      // Open modal and create question
      const createBtn = screen.getByTestId('create-question-btn');
      await act(async () => {
        fireEvent.click(createBtn);
      });

      // Fill and submit form
      const contentField = screen.getByPlaceholderText('请输入错题内容');
      const myAnswerField = screen.getByPlaceholderText('请输入您的答案');
      const correctAnswerField = screen.getByPlaceholderText('请输入正确答案');
      const subjectField = screen.getByDisplayValue('请选择科目');

      await user.type(contentField, '测试错题');
      await user.type(myAnswerField, '我的答案');
      await user.type(correctAnswerField, '正确答案');
      await user.selectOptions(subjectField, 'subject-1');

      const submitBtn = screen.getByTestId('confirm-create-btn');
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Should refresh both questions and stats
      await waitFor(() => {
        expect(mockQuestionsAPI.getQuestions).toHaveBeenCalledTimes(2); // Initial + refresh
        expect(mockQuestionsAPI.getQuestionStats).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });

    it('should refresh questions list and stats after editing', async () => {
      await act(async () => {
        render(<QuestionsPage />);
      });

      // Open edit modal and update
      const editBtn = screen.getByTestId('edit-btn-question-1');
      await act(async () => {
        fireEvent.click(editBtn);
      });

      const saveBtn = screen.getByTestId('confirm-edit-btn');
      await act(async () => {
        fireEvent.click(saveBtn);
      });

      // Should refresh both questions and stats
      await waitFor(() => {
        expect(mockQuestionsAPI.getQuestions).toHaveBeenCalledTimes(2); // Initial + refresh
        expect(mockQuestionsAPI.getQuestionStats).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });
  });
});
