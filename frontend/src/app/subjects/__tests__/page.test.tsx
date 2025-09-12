import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SubjectsPage from '../page';
import { useAuth } from '../../../stores/authStore';
import { subjectsAPI } from '../../../lib/api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth store
jest.mock('../../../stores/authStore', () => ({
  useAuth: jest.fn(),
}));

// Mock subjects API
jest.mock('../../../lib/api', () => ({
  subjectsAPI: {
    getSubjects: jest.fn(),
    createSubject: jest.fn(),
    updateSubject: jest.fn(),
    deleteSubject: jest.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
};

const mockSubjects = [
  {
    id: 'subject-1',
    code: 'math',
    nameZh: '数学',
    nameEn: 'Mathematics',
    description: '数学相关错题',
    color: '#2196F3',
    order: 1,
    _count: { questions: 0 },
  },
  {
    id: 'subject-2',
    code: 'english',
    nameZh: '英语',
    nameEn: 'English',
    description: '英语相关错题',
    color: '#4CAF50',
    order: 2,
    _count: { questions: 5 },
  },
];

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockSubjectsAPI = subjectsAPI as jest.Mocked<typeof subjectsAPI>;

describe('SubjectsPage', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should show login prompt when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(<SubjectsPage />);

      expect(screen.getByText('请先登录以访问科目管理')).toBeInTheDocument();
      expect(screen.getByText('前往登录')).toBeInTheDocument();
    });

    it('should render subjects page when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockSubjectsAPI.getSubjects.mockResolvedValue({
        success: true,
        data: mockSubjects,
      });

      render(<SubjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('科目管理')).toBeInTheDocument();
        expect(screen.getByText(`欢迎, ${mockUser.name}`)).toBeInTheDocument();
      });
    });
  });

  describe('Loading and Error States', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });
    });

    it('should show loading state', () => {
      mockSubjectsAPI.getSubjects.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<SubjectsPage />);

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('should show error state when API fails', async () => {
      mockSubjectsAPI.getSubjects.mockResolvedValue({
        success: false,
        error: 'API Error',
      });

      render(<SubjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      mockSubjectsAPI.getSubjects.mockRejectedValue(new Error('Network error'));

      render(<SubjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('获取科目列表失败')).toBeInTheDocument();
      });
    });
  });

  describe('Subjects Display', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockSubjectsAPI.getSubjects.mockResolvedValue({
        success: true,
        data: mockSubjects,
      });
    });

    it('should display subjects list', async () => {
      render(<SubjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('数学')).toBeInTheDocument();
        expect(screen.getByText('英语')).toBeInTheDocument();
        expect(screen.getByText('Mathematics')).toBeInTheDocument();
        expect(screen.getByText('English')).toBeInTheDocument();
      });
    });

    it('should show subject details', async () => {
      render(<SubjectsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('代码:').length).toBeGreaterThan(0);
        expect(screen.getByText('math')).toBeInTheDocument();
        expect(screen.getByText('english')).toBeInTheDocument();
        expect(screen.getAllByText('错题数:').length).toBeGreaterThan(0);
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('should show empty state when no subjects', async () => {
      mockSubjectsAPI.getSubjects.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<SubjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('暂无科目')).toBeInTheDocument();
        expect(screen.getByText('开始创建您的第一个科目吧！')).toBeInTheDocument();
      });
    });
  });

  describe('Subject Creation', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockSubjectsAPI.getSubjects.mockResolvedValue({
        success: true,
        data: [],
      });
    });

    it('should open create modal when clicking add button', async () => {
      render(<SubjectsPage />);

      await waitFor(() => {
        // 点击主要的添加科目按钮（不是空状态中的）
        const addButtons = screen.getAllByText('添加科目');
        fireEvent.click(addButtons[0]); // 使用第一个按钮
      });

      expect(screen.getByRole('heading', { name: '添加科目' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('如: math, english')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('如: 数学')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('如: Mathematics')).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      render(<SubjectsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('添加科目'));
      });

      // 尝试提交空表单
      fireEvent.click(screen.getByText('创建'));

      // 表单验证应该阻止提交
      expect(mockSubjectsAPI.createSubject).not.toHaveBeenCalled();
    });

    it('should create new subject successfully', async () => {
      mockSubjectsAPI.createSubject.mockResolvedValue({
        success: true,
        data: {
          id: 'new-subject',
          code: 'physics',
          nameZh: '物理',
          nameEn: 'Physics',
          description: '物理相关错题',
          color: '#9C27B0',
          order: 1,
        },
      });

      mockSubjectsAPI.getSubjects
        .mockResolvedValueOnce({ success: true, data: [] })
        .mockResolvedValueOnce({
          success: true,
          data: [
            {
              id: 'new-subject',
              code: 'physics',
              nameZh: '物理',
              nameEn: 'Physics',
              description: '物理相关错题',
              color: '#9C27B0',
              order: 1,
              _count: { questions: 0 },
            },
          ],
        });

      render(<SubjectsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('添加科目'));
      });

      // 填写表单
      fireEvent.change(screen.getByPlaceholderText('如: math, english'), {
        target: { value: 'physics' },
      });
      fireEvent.change(screen.getByPlaceholderText('如: 数学'), {
        target: { value: '物理' },
      });
      fireEvent.change(screen.getByPlaceholderText('如: Mathematics'), {
        target: { value: 'Physics' },
      });

      // 提交表单
      fireEvent.click(screen.getByText('创建'));

      await waitFor(() => {
        expect(mockSubjectsAPI.createSubject).toHaveBeenCalledWith({
          code: 'physics',
          nameZh: '物理',
          nameEn: 'Physics',
          description: '',
          color: '#2196F3',
          order: 0,
        });
      });
    });

    it('should handle create API error', async () => {
      mockSubjectsAPI.createSubject.mockResolvedValue({
        success: false,
        error: 'Subject code already exists',
      });

      render(<SubjectsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('添加科目'));
      });

      // 填写表单
      fireEvent.change(screen.getByPlaceholderText('如: math, english'), {
        target: { value: 'physics' },
      });
      fireEvent.change(screen.getByPlaceholderText('如: 数学'), {
        target: { value: '物理' },
      });
      fireEvent.change(screen.getByPlaceholderText('如: Mathematics'), {
        target: { value: 'Physics' },
      });

      // 提交表单
      fireEvent.click(screen.getByText('创建'));

      await waitFor(() => {
        expect(screen.getByText('Subject code already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Subject Editing', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockSubjectsAPI.getSubjects.mockResolvedValue({
        success: true,
        data: mockSubjects,
      });
    });

    it('should open edit modal with pre-filled data', async () => {
      render(<SubjectsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('编辑')[0]);
      });

      // 检查预填充的数据
      expect(screen.getByDisplayValue('math')).toBeInTheDocument();
      expect(screen.getByDisplayValue('数学')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('编辑科目')).toBeInTheDocument();
    });

    it('should update subject successfully', async () => {
      mockSubjectsAPI.updateSubject.mockResolvedValue({
        success: true,
        data: { ...mockSubjects[0], nameZh: '更新的数学' },
      });

      render(<SubjectsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getAllByText('编辑')[0]);
      });

      // 修改数据
      const nameZhInput = screen.getByDisplayValue('数学');
      fireEvent.change(nameZhInput, {
        target: { value: '更新的数学' },
      });

      // 提交更新
      fireEvent.click(screen.getByText('更新'));

      await waitFor(() => {
        expect(mockSubjectsAPI.updateSubject).toHaveBeenCalledWith(
          'subject-1',
          expect.objectContaining({
            nameZh: '更新的数学',
          })
        );
      });
    });
  });

  describe('Subject Deletion', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockSubjectsAPI.getSubjects.mockResolvedValue({
        success: true,
        data: mockSubjects,
      });
    });

    it('should disable delete button for subjects with questions', async () => {
      render(<SubjectsPage />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('删除');
        // 英语科目有5个问题，删除按钮应该被禁用
        expect(deleteButtons[1]).toBeDisabled();
      });
    });

    it('should delete subject successfully', async () => {
      mockSubjectsAPI.deleteSubject.mockResolvedValue({
        success: true,
      });

      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(<SubjectsPage />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('删除');
        // 数学科目没有问题，可以删除
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith('确定要删除这个科目吗？');
        expect(mockSubjectsAPI.deleteSubject).toHaveBeenCalledWith('subject-1');
      });

      confirmSpy.mockRestore();
    });

    it('should handle delete confirmation cancellation', async () => {
      // Mock window.confirm to return false
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(<SubjectsPage />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('删除');
        fireEvent.click(deleteButtons[0]);
      });

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockSubjectsAPI.deleteSubject).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
        checkAuth: jest.fn(),
      });

      mockSubjectsAPI.getSubjects.mockResolvedValue({
        success: true,
        data: [],
      });
    });

    it('should close modal when clicking cancel', async () => {
      render(<SubjectsPage />);

      await waitFor(() => {
        const addButtons = screen.getAllByText('添加科目');
        fireEvent.click(addButtons[0]);
      });

      expect(screen.getByRole('heading', { name: '添加科目' })).toBeInTheDocument();

      fireEvent.click(screen.getByText('取消'));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: '添加科目' })).not.toBeInTheDocument();
      });
    });

    it('should clear error when closing error message', async () => {
      mockSubjectsAPI.getSubjects.mockResolvedValue({
        success: false,
        error: 'Test error message',
      });

      render(<SubjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      // 点击关闭按钮
      fireEvent.click(screen.getByText('×'));

      await waitFor(() => {
        expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
      });
    });
  });
});
