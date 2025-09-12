import request from 'supertest';
import express from 'express';
import { prisma } from '../../src/utils/database';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  updateSubjectsOrder,
  createSubjectValidation,
  updateSubjectValidation,
  updateSubjectsOrderValidation
} from '../../src/controllers/subjects';
import { authenticate } from '../../src/middlewares/auth';

// Mock the middleware
jest.mock('../../src/middlewares/auth');

const app = express();
app.use(express.json());

// 设置路由
app.get('/subjects', getSubjects);
app.get('/subjects/:id', getSubjectById);
app.post('/subjects', authenticate, createSubjectValidation, createSubject);
app.put('/subjects/:id', authenticate, updateSubjectValidation, updateSubject);
app.delete('/subjects/:id', authenticate, deleteSubject);
app.post('/subjects/reorder', authenticate, updateSubjectsOrderValidation, updateSubjectsOrder);

// Mock认证中间件
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
mockAuthenticate.mockImplementation(async (req: any, res: any, next: any) => {
  req.user = { id: 'mock-user-id', email: 'test@example.com', role: 'USER' };
  next();
});

describe('Subjects Controller', () => {
  const mockSubject = {
    id: 'subject-1',
    code: 'math',
    nameZh: '数学',
    nameEn: 'Mathematics',
    description: '数学相关错题',
    color: '#2196F3',
    order: 1,
    _count: { questions: 0 }
  };

  const mockSubjects = [
    mockSubject,
    {
      id: 'subject-2',
      code: 'english',
      nameZh: '英语',
      nameEn: 'English',
      description: '英语相关错题',
      color: '#4CAF50',
      order: 2,
      _count: { questions: 5 }
    }
  ];

  describe('GET /subjects', () => {
    it('should return all subjects', async () => {
      (prisma.subject.findMany as jest.Mock).mockResolvedValue(mockSubjects);

      const response = await request(app).get('/subjects');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockSubjects,
        count: mockSubjects.length
      });
      expect(prisma.subject.findMany).toHaveBeenCalledWith({
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: {
              questions: true
            }
          }
        }
      });
    });

    it('should handle database errors', async () => {
      (prisma.subject.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/subjects');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch subjects'
      });
    });
  });

  describe('GET /subjects/:id', () => {
    it('should return a subject by id', async () => {
      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(mockSubject);

      const response = await request(app).get('/subjects/subject-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockSubject
      });
      expect(prisma.subject.findUnique).toHaveBeenCalledWith({
        where: { id: 'subject-1' },
        include: {
          _count: {
            select: {
              questions: true
            }
          }
        }
      });
    });

    it('should return 404 when subject not found', async () => {
      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/subjects/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
    });

    it('should return 500 for empty id parameter', async () => {
      // 测试空字符串ID的情况
      const response = await request(app).get('/subjects/ ');

      expect(response.status).toBe(500); // 因为getSubjectById会被catch到错误
    });
  });

  describe('POST /subjects', () => {
    const validSubjectData = {
      code: 'physics',
      nameZh: '物理',
      nameEn: 'Physics',
      description: '物理相关错题',
      color: '#9C27B0',
      order: 3
    };

    it('should create a new subject', async () => {
      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(null); // 代码不存在
      (prisma.subject.create as jest.Mock).mockResolvedValue({ id: 'new-subject', ...validSubjectData });

      const response = await request(app)
        .post('/subjects')
        .send(validSubjectData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Subject created successfully');
      expect(response.body.data).toEqual({ id: 'new-subject', ...validSubjectData });
    });

    it('should return 409 when subject code already exists', async () => {
      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(mockSubject);

      const response = await request(app)
        .post('/subjects')
        .send(validSubjectData);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        error: 'Subject code already exists',
        code: 'SUBJECT_CODE_EXISTS'
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        nameZh: '物理',
        // 缺少code, nameEn
      };

      const response = await request(app)
        .post('/subjects')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate subject code format', async () => {
      const invalidData = {
        code: 'invalid code with spaces',
        nameZh: '物理',
        nameEn: 'Physics'
      };

      const response = await request(app)
        .post('/subjects')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /subjects/:id', () => {
    const updateData = {
      nameZh: '更新的数学',
      description: '更新的描述',
      color: '#FF5722'
    };

    it('should update a subject', async () => {
      (prisma.subject.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockSubject) // 首次调用检查存在
        .mockResolvedValueOnce(null); // 第二次调用检查代码冲突
      (prisma.subject.update as jest.Mock).mockResolvedValue({ ...mockSubject, ...updateData });

      const response = await request(app)
        .put('/subjects/subject-1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Subject updated successfully');
    });

    it('should return 404 when subject not found', async () => {
      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/subjects/nonexistent')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
    });

    it('should return 409 when updating to existing code', async () => {
      (prisma.subject.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockSubject)
        .mockResolvedValueOnce({ id: 'other-subject', code: 'english' }); // 代码已存在

      const response = await request(app)
        .put('/subjects/subject-1')
        .send({ code: 'english' });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        error: 'Subject code already exists',
        code: 'SUBJECT_CODE_EXISTS'
      });
    });
  });

  describe('DELETE /subjects/:id', () => {
    it('should delete a subject with no questions', async () => {
      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(mockSubject);
      (prisma.subject.delete as jest.Mock).mockResolvedValue(mockSubject);

      const response = await request(app).delete('/subjects/subject-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Subject deleted successfully'
      });
    });

    it('should not delete a subject with questions', async () => {
      const subjectWithQuestions = { ...mockSubject, _count: { questions: 5 } };
      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(subjectWithQuestions);

      const response = await request(app).delete('/subjects/subject-1');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'Cannot delete subject with associated questions',
        code: 'SUBJECT_HAS_QUESTIONS',
        details: {
          questionCount: 5
        }
      });
    });

    it('should return 404 when subject not found', async () => {
      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete('/subjects/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
    });
  });

  describe('POST /subjects/reorder', () => {
    const reorderData = {
      subjects: [
        { id: 'subject-1', order: 2 },
        { id: 'subject-2', order: 1 }
      ]
    };

    it('should reorder subjects', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { ...mockSubject, order: 2 },
        { ...mockSubjects[1], order: 1 }
      ]);

      const response = await request(app)
        .post('/subjects/reorder')
        .send(reorderData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Subjects order updated successfully'
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should validate reorder data', async () => {
      const invalidData = {
        subjects: [
          { id: 'subject-1' } // 缺少order
        ]
      };

      const response = await request(app)
        .post('/subjects/reorder')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
