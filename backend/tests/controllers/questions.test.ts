import request from 'supertest';
import express from 'express';
import { prisma } from '../../src/utils/database';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  batchDeleteQuestions,
  getQuestionStats,
  createQuestionValidation,
  updateQuestionValidation,
  batchDeleteValidation,
  getQuestionsValidation
} from '../../src/controllers/questions';
import { authenticate } from '../../src/middlewares/auth';

// Mock the authenticate middleware
jest.mock('../../src/middlewares/auth');

// Create Express app for testing
const app = express();
app.use(express.json());

// Setup routes with auth middleware
app.get('/questions', authenticate, getQuestionsValidation, getQuestions);
app.get('/questions/stats', authenticate, getQuestionStats);
app.get('/questions/:id', authenticate, getQuestionById);
app.post('/questions', authenticate, createQuestionValidation, createQuestion);
app.put('/questions/:id', authenticate, updateQuestionValidation, updateQuestion);
app.delete('/questions/:id', authenticate, deleteQuestion);
app.post('/questions/batch/delete', authenticate, batchDeleteValidation, batchDeleteQuestions);

// Mock authenticate middleware
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
mockAuthenticate.mockImplementation(async (req: any, res: any, next: any) => {
  req.user = { id: 'user-123', email: 'test@example.com', role: 'USER' };
  next();
});

describe('Questions Controller', () => {
  const mockSubject = {
    id: 'subject-123',
    code: 'MATH',
    nameZh: '数学',
    nameEn: 'Mathematics',
    color: '#FF5722'
  };

  const mockQuestion = {
    id: 'question-123',
    title: '二次方程求解',
    content: '解方程 x² + 2x - 3 = 0',
    images: null,
    myAnswer: 'x = 1 或 x = -3',
    correctAnswer: 'x = 1 或 x = -3',
    explanation: '使用因式分解：(x+3)(x-1) = 0',
    subjectId: 'subject-123',
    difficulty: 'MEDIUM',
    languageType: 'CHINESE',
    errorType: 'CALCULATION',
    masteryLevel: 'NOT_MASTERED',
    knowledgePoints: '["二次方程", "因式分解"]',
    tags: '["代数", "方程"]',
    userId: 'user-123',
    addedAt: new Date('2024-01-01'),
    lastReviewedAt: null,
    reviewCount: 0,
    subject: mockSubject,
    _count: {
      reviews: 0,
      bookmarks: 0
    }
  };

  describe('GET /questions', () => {
    it('should return paginated questions list', async () => {
      const mockQuestions = [mockQuestion];
      const totalCount = 1;

      (prisma.question.findMany as jest.Mock).mockResolvedValue(mockQuestions);
      (prisma.question.count as jest.Mock).mockResolvedValue(totalCount);

      const response = await request(app)
        .get('/questions')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([expect.objectContaining({
          id: mockQuestion.id,
          title: mockQuestion.title,
          content: mockQuestion.content
        })]),
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      });

      expect(prisma.question.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          subject: {
            select: {
              id: true,
              code: true,
              nameZh: true,
              nameEn: true,
              color: true
            }
          },
          _count: {
            select: {
              reviews: true,
              bookmarks: true
            }
          }
        },
        orderBy: { addedAt: 'desc' },
        skip: 0,
        take: 20
      });
    });

    it('should apply filters correctly', async () => {
      (prisma.question.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.question.count as jest.Mock).mockResolvedValue(0);

      await request(app)
        .get('/questions?subjectId=subject-123&difficulty=HARD&masteryLevel=MASTERED&errorType=CONCEPTUAL&search=test&sortBy=reviewCount&sortOrder=asc')
        .expect(200);

      expect(prisma.question.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          subjectId: 'subject-123',
          difficulty: 'HARD',
          masteryLevel: 'MASTERED',
          errorType: 'CONCEPTUAL',
          OR: [
            { title: { contains: 'test' } },
            { content: { contains: 'test' } },
            { correctAnswer: { contains: 'test' } },
            { explanation: { contains: 'test' } }
          ]
        },
        include: expect.any(Object),
        orderBy: { reviewCount: 'asc' },
        skip: 0,
        take: 20
      });
    });

    it('should handle database errors', async () => {
      (prisma.question.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/questions')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch questions'
      });
    });
  });

  describe('GET /questions/stats', () => {
    it('should return question statistics', async () => {
      (prisma.question.count as jest.Mock)
        .mockResolvedValueOnce(10) // totalCount
        .mockResolvedValueOnce(3); // recentWeekCount

      (prisma.question.groupBy as jest.Mock)
        .mockResolvedValueOnce([{ subjectId: 'subject-123', _count: 5 }]) // by subject
        .mockResolvedValueOnce([{ difficulty: 'MEDIUM', _count: 4 }]) // by difficulty
        .mockResolvedValueOnce([{ masteryLevel: 'NOT_MASTERED', _count: 6 }]) // by mastery
        .mockResolvedValueOnce([{ errorType: 'CALCULATION', _count: 3 }]); // by error type

      (prisma.subject.findMany as jest.Mock).mockResolvedValue([mockSubject]);

      const response = await request(app)
        .get('/questions/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalCount: 10,
        recentWeekCount: 3,
        bySubject: [{ subjectId: 'subject-123', _count: 5, subject: mockSubject }],
        byDifficulty: [{ difficulty: 'MEDIUM', _count: 4 }],
        byMastery: [{ masteryLevel: 'NOT_MASTERED', _count: 6 }],
        byErrorType: [{ errorType: 'CALCULATION', _count: 3 }]
      });
    });

    it('should handle database errors in stats', async () => {
      (prisma.question.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/questions/stats')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch question statistics'
      });
    });
  });

  describe('GET /questions/:id', () => {
    it('should return question by id', async () => {
      const questionWithReviews = {
        ...mockQuestion,
        reviews: [
          { id: 'review-1', reviewedAt: new Date() },
          { id: 'review-2', reviewedAt: new Date() }
        ]
      };

      (prisma.question.findFirst as jest.Mock).mockResolvedValue(questionWithReviews);

      const response = await request(app)
        .get('/questions/question-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockQuestion.id,
          title: mockQuestion.title,
          content: mockQuestion.content,
          reviews: expect.arrayContaining([
            expect.objectContaining({ id: 'review-1' }),
            expect.objectContaining({ id: 'review-2' })
          ])
        })
      });

      expect(prisma.question.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'question-123',
          userId: 'user-123'
        },
        include: {
          subject: {
            select: {
              id: true,
              code: true,
              nameZh: true,
              nameEn: true,
              color: true
            }
          },
          reviews: {
            orderBy: { reviewedAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              reviews: true,
              bookmarks: true
            }
          }
        }
      });
    });

    it('should return 404 for non-existent question', async () => {
      (prisma.question.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/questions/non-existent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Question not found',
        code: 'QUESTION_NOT_FOUND'
      });
    });
  });

  describe('POST /questions', () => {
    const validQuestionData = {
      title: '三角函数问题',
      content: '求 sin(π/6) 的值',
      myAnswer: '1/2',
      correctAnswer: '1/2',
      explanation: 'sin(30°) = 1/2',
      subjectId: 'subject-123',
      difficulty: 'EASY',
      languageType: 'CHINESE',
      errorType: 'KNOWLEDGE',
      knowledgePoints: ['三角函数', '特殊角'],
      tags: ['几何', '三角']
    };

    it('should create a new question', async () => {
      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(mockSubject);
      (prisma.question.create as jest.Mock).mockResolvedValue(mockQuestion);

      const response = await request(app)
        .post('/questions')
        .send(validQuestionData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Question created successfully',
        data: expect.objectContaining({
          id: mockQuestion.id,
          title: mockQuestion.title,
          content: mockQuestion.content
        })
      });

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: {
          title: validQuestionData.title,
          content: validQuestionData.content,
          images: null,
          myAnswer: validQuestionData.myAnswer,
          correctAnswer: validQuestionData.correctAnswer,
          explanation: validQuestionData.explanation,
          subjectId: validQuestionData.subjectId,
          difficulty: validQuestionData.difficulty,
          languageType: validQuestionData.languageType,
          errorType: validQuestionData.errorType,
          knowledgePoints: JSON.stringify(validQuestionData.knowledgePoints),
          tags: JSON.stringify(validQuestionData.tags),
          userId: 'user-123'
        },
        include: {
          subject: {
            select: {
              id: true,
              code: true,
              nameZh: true,
              nameEn: true,
              color: true
            }
          }
        }
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/questions')
        .send({
          title: 'Test Question'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for non-existent subject', async () => {
      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/questions')
        .send(validQuestionData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
    });
  });

  describe('PUT /questions/:id', () => {
    const updateData = {
      title: 'Updated Question',
      content: 'Updated content',
      masteryLevel: 'MASTERED'
    };

    it('should update a question', async () => {
      const updatedQuestion = { ...mockQuestion, ...updateData };

      (prisma.question.findFirst as jest.Mock).mockResolvedValue(mockQuestion);
      (prisma.question.update as jest.Mock).mockResolvedValue(updatedQuestion);

      const response = await request(app)
        .put('/questions/question-123')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Question updated successfully',
        data: expect.objectContaining({
          id: mockQuestion.id,
          title: updateData.title,
          content: updateData.content,
          masteryLevel: updateData.masteryLevel
        })
      });

      expect(prisma.question.update).toHaveBeenCalledWith({
        where: { id: 'question-123' },
        data: {
          title: updateData.title,
          content: updateData.content,
          masteryLevel: updateData.masteryLevel
        },
        include: {
          subject: {
            select: {
              id: true,
              code: true,
              nameZh: true,
              nameEn: true,
              color: true
            }
          }
        }
      });
    });

    it('should return 404 for non-existent question', async () => {
      (prisma.question.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/questions/non-existent')
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Question not found',
        code: 'QUESTION_NOT_FOUND'
      });
    });
  });

  describe('DELETE /questions/:id', () => {
    it('should delete a question', async () => {
      (prisma.question.findFirst as jest.Mock).mockResolvedValue(mockQuestion);
      (prisma.question.delete as jest.Mock).mockResolvedValue(mockQuestion);

      const response = await request(app)
        .delete('/questions/question-123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Question deleted successfully'
      });

      expect(prisma.question.delete).toHaveBeenCalledWith({
        where: { id: 'question-123' }
      });
    });

    it('should return 404 for non-existent question', async () => {
      (prisma.question.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/questions/non-existent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Question not found',
        code: 'QUESTION_NOT_FOUND'
      });
    });
  });

  describe('POST /questions/batch/delete', () => {
    const questionIds = ['question-1', 'question-2', 'question-3'];

    it('should batch delete questions', async () => {
      (prisma.question.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const response = await request(app)
        .post('/questions/batch/delete')
        .send({ questionIds })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Successfully deleted 3 questions',
        deletedCount: 3
      });

      expect(prisma.question.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: questionIds },
          userId: 'user-123'
        }
      });
    });

    it('should validate questionIds array', async () => {
      const response = await request(app)
        .post('/questions/batch/delete')
        .send({ questionIds: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle extremely long content', async () => {
      const longContent = 'x'.repeat(6000); // Exceeds 5000 char limit

      const response = await request(app)
        .post('/questions')
        .send({
          content: longContent,
          myAnswer: 'test',
          correctAnswer: 'test',
          subjectId: 'subject-123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid enum values', async () => {
      const response = await request(app)
        .post('/questions')
        .send({
          content: 'test content',
          myAnswer: 'test',
          correctAnswer: 'test',
          subjectId: 'subject-123',
          difficulty: 'INVALID_DIFFICULTY',
          errorType: 'INVALID_ERROR_TYPE'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Data Formatting', () => {
    it('should handle JSON arrays for images, knowledgePoints, and tags', async () => {
      const questionData = {
        content: 'test content',
        myAnswer: 'test',
        correctAnswer: 'test',
        subjectId: 'subject-123',
        images: ['image1.jpg', 'image2.jpg'],
        knowledgePoints: ['point1', 'point2'],
        tags: ['tag1', 'tag2']
      };

      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(mockSubject);
      (prisma.question.create as jest.Mock).mockResolvedValue(mockQuestion);

      await request(app)
        .post('/questions')
        .send(questionData)
        .expect(201);

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          images: JSON.stringify(questionData.images),
          knowledgePoints: JSON.stringify(questionData.knowledgePoints),
          tags: JSON.stringify(questionData.tags)
        }),
        include: expect.any(Object)
      });
    });

    it('should handle null/undefined arrays', async () => {
      const questionData = {
        content: 'test content',
        myAnswer: 'test',
        correctAnswer: 'test',
        subjectId: 'subject-123'
        // No images, knowledgePoints, tags
      };

      (prisma.subject.findUnique as jest.Mock).mockResolvedValue(mockSubject);
      (prisma.question.create as jest.Mock).mockResolvedValue(mockQuestion);

      await request(app)
        .post('/questions')
        .send(questionData)
        .expect(201);

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          images: null,
          knowledgePoints: null,
          tags: null
        }),
        include: expect.any(Object)
      });
    });
  });
});
