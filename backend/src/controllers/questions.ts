import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../utils/database';
import path from 'path';
import fs from 'fs';

/**
 * 获取当前用户的错题列表
 */
export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    // 解析查询参数
    const {
      page = 1,
      limit = 20,
      subjectId,
      difficulty,
      masteryLevel,
      errorType,
      search,
      sortBy = 'addedAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // 构建过滤条件
    const where: any = {
      userId,
    };

    if (subjectId) {
      where.subjectId = subjectId as string;
    }

    if (difficulty) {
      where.difficulty = difficulty as string;
    }

    if (masteryLevel) {
      where.masteryLevel = masteryLevel as string;
    }

    if (errorType) {
      where.errorType = errorType as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { content: { contains: search as string } },
        { correctAnswer: { contains: search as string } },
        { explanation: { contains: search as string } }
      ];
    }

    // 构建排序条件
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder as string;

    // 获取错题列表
    const [questions, totalCount] = await Promise.all([
      prisma.question.findMany({
        where,
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
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.question.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: questions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
};

/**
 * 根据ID获取单个错题详情
 */
export const getQuestionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Question ID is required'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    const question = await prisma.question.findFirst({
      where: {
        id,
        userId // 确保只能访问自己的错题
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

    if (!question) {
      res.status(404).json({
        success: false,
        error: 'Question not found',
        code: 'QUESTION_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Get question by id error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question'
    });
  }
};

/**
 * 创建新错题
 */
export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    const {
      title,
      content,
      images,
      myAnswer,
      correctAnswer,
      explanation,
      subjectId,
      difficulty = 'MEDIUM',
      languageType = 'CHINESE',
      errorType = 'OTHER',
      knowledgePoints,
      tags
    } = req.body;

    // 验证科目是否存在
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      res.status(400).json({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
      return;
    }

    // 创建错题
    const question = await prisma.question.create({
      data: {
        title,
        content,
        images: images ? JSON.stringify(images) : null,
        myAnswer,
        correctAnswer,
        explanation,
        subjectId,
        difficulty,
        languageType,
        errorType,
        knowledgePoints: knowledgePoints ? JSON.stringify(knowledgePoints) : null,
        tags: tags ? JSON.stringify(tags) : null,
        userId
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

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create question'
    });
  }
};

/**
 * 更新错题信息
 */
export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Question ID is required'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    // 检查错题是否存在且属于当前用户
    const existingQuestion = await prisma.question.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingQuestion) {
      res.status(404).json({
        success: false,
        error: 'Question not found',
        code: 'QUESTION_NOT_FOUND'
      });
      return;
    }

    const {
      title,
      content,
      images,
      myAnswer,
      correctAnswer,
      explanation,
      subjectId,
      difficulty,
      languageType,
      errorType,
      knowledgePoints,
      tags,
      masteryLevel
    } = req.body;

    // 如果更新了科目ID，验证科目是否存在
    if (subjectId && subjectId !== existingQuestion.subjectId) {
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId }
      });

      if (!subject) {
        res.status(400).json({
          success: false,
          error: 'Subject not found',
          code: 'SUBJECT_NOT_FOUND'
        });
        return;
      }
    }

    // 更新错题
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(images !== undefined && { images: images ? JSON.stringify(images) : null }),
        ...(myAnswer !== undefined && { myAnswer }),
        ...(correctAnswer !== undefined && { correctAnswer }),
        ...(explanation !== undefined && { explanation }),
        ...(subjectId !== undefined && { subjectId }),
        ...(difficulty !== undefined && { difficulty }),
        ...(languageType !== undefined && { languageType }),
        ...(errorType !== undefined && { errorType }),
        ...(knowledgePoints !== undefined && { knowledgePoints: knowledgePoints ? JSON.stringify(knowledgePoints) : null }),
        ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
        ...(masteryLevel !== undefined && { masteryLevel })
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

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update question'
    });
  }
};

/**
 * 删除错题
 */
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Question ID is required'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    // 检查错题是否存在且属于当前用户
    const existingQuestion = await prisma.question.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingQuestion) {
      res.status(404).json({
        success: false,
        error: 'Question not found',
        code: 'QUESTION_NOT_FOUND'
      });
      return;
    }

    // 删除错题（级联删除会自动处理相关的bookmarks和reviews）
    await prisma.question.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete question'
    });
  }
};

/**
 * 批量删除错题
 */
export const batchDeleteQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    const { questionIds } = req.body;

    // 删除属于当前用户的指定错题
    const result = await prisma.question.deleteMany({
      where: {
        id: { in: questionIds },
        userId
      }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.count} questions`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Batch delete questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete questions'
    });
  }
};

/**
 * 获取错题统计信息
 */
export const getQuestionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    const [
      totalCount,
      subjectStats,
      difficultyStats,
      masteryStats,
      errorTypeStats,
      recentStats
    ] = await Promise.all([
      // 总错题数
      prisma.question.count({ where: { userId } }),
      
      // 按科目统计
      prisma.question.groupBy({
        by: ['subjectId'],
        where: { userId },
        _count: true,
        orderBy: { _count: { subjectId: 'desc' } }
      }),
      
      // 按难度统计
      prisma.question.groupBy({
        by: ['difficulty'],
        where: { userId },
        _count: true
      }),
      
      // 按掌握程度统计
      prisma.question.groupBy({
        by: ['masteryLevel'],
        where: { userId },
        _count: true
      }),
      
      // 按错误类型统计
      prisma.question.groupBy({
        by: ['errorType'],
        where: { userId },
        _count: true
      }),
      
      // 最近7天新增错题统计
      prisma.question.count({
        where: {
          userId,
          addedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // 获取科目信息
    const subjects = await prisma.subject.findMany({
      where: {
        id: { in: subjectStats.map(s => s.subjectId) }
      },
      select: {
        id: true,
        code: true,
        nameZh: true,
        nameEn: true,
        color: true
      }
    });

    // 关联科目信息
    const subjectStatsWithInfo = subjectStats.map(stat => {
      const subject = subjects.find(s => s.id === stat.subjectId);
      return {
        ...stat,
        subject
      };
    });

    res.json({
      success: true,
      data: {
        totalCount,
        recentWeekCount: recentStats,
        bySubject: subjectStatsWithInfo,
        byDifficulty: difficultyStats,
        byMastery: masteryStats,
        byErrorType: errorTypeStats
      }
    });
  } catch (error) {
    console.error('Get question stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question statistics'
    });
  }
};

// 验证规则
export const createQuestionValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Question content is required and must be 1-5000 characters long'),
  body('myAnswer')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('My answer is required and must be 1-2000 characters long'),
  body('correctAnswer')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Correct answer is required and must be 1-2000 characters long'),
  body('subjectId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Subject ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('explanation')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Explanation must not exceed 3000 characters'),
  body('difficulty')
    .optional()
    .isIn(['EASY', 'MEDIUM', 'HARD'])
    .withMessage('Difficulty must be EASY, MEDIUM, or HARD'),
  body('languageType')
    .optional()
    .isIn(['CHINESE', 'ENGLISH', 'BILINGUAL'])
    .withMessage('Language type must be CHINESE, ENGLISH, or BILINGUAL'),
  body('errorType')
    .optional()
    .isIn(['CALCULATION', 'CONCEPTUAL', 'CARELESS', 'METHODOLOGICAL', 'KNOWLEDGE', 'OTHER'])
    .withMessage('Error type must be one of the predefined values'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('knowledgePoints')
    .optional()
    .isArray()
    .withMessage('Knowledge points must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

export const updateQuestionValidation = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Question content must be 1-5000 characters long'),
  body('myAnswer')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('My answer must be 1-2000 characters long'),
  body('correctAnswer')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Correct answer must be 1-2000 characters long'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('explanation')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Explanation must not exceed 3000 characters'),
  body('difficulty')
    .optional()
    .isIn(['EASY', 'MEDIUM', 'HARD'])
    .withMessage('Difficulty must be EASY, MEDIUM, or HARD'),
  body('languageType')
    .optional()
    .isIn(['CHINESE', 'ENGLISH', 'BILINGUAL'])
    .withMessage('Language type must be CHINESE, ENGLISH, or BILINGUAL'),
  body('errorType')
    .optional()
    .isIn(['CALCULATION', 'CONCEPTUAL', 'CARELESS', 'METHODOLOGICAL', 'KNOWLEDGE', 'OTHER'])
    .withMessage('Error type must be one of the predefined values'),
  body('masteryLevel')
    .optional()
    .isIn(['NOT_MASTERED', 'PARTIALLY_MASTERED', 'MASTERED'])
    .withMessage('Mastery level must be NOT_MASTERED, PARTIALLY_MASTERED, or MASTERED'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('knowledgePoints')
    .optional()
    .isArray()
    .withMessage('Knowledge points must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

export const batchDeleteValidation = [
  body('questionIds')
    .isArray({ min: 1 })
    .withMessage('Question IDs array is required'),
  body('questionIds.*')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Each question ID must be a non-empty string')
];

export const getQuestionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('difficulty')
    .optional()
    .isIn(['EASY', 'MEDIUM', 'HARD'])
    .withMessage('Difficulty must be EASY, MEDIUM, or HARD'),
  query('masteryLevel')
    .optional()
    .isIn(['NOT_MASTERED', 'PARTIALLY_MASTERED', 'MASTERED'])
    .withMessage('Mastery level must be NOT_MASTERED, PARTIALLY_MASTERED, or MASTERED'),
  query('errorType')
    .optional()
    .isIn(['CALCULATION', 'CONCEPTUAL', 'CARELESS', 'METHODOLOGICAL', 'KNOWLEDGE', 'OTHER'])
    .withMessage('Error type must be one of the predefined values'),
  query('sortBy')
    .optional()
    .isIn(['addedAt', 'lastReviewedAt', 'reviewCount', 'difficulty', 'masteryLevel'])
    .withMessage('Sort by must be one of the allowed fields'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

/**
 * 上传错题图片
 */
export const uploadQuestionImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
      return;
    }

    // Generate file URLs
    const imageUrls = files.map(file => {
      return `/uploads/questions/${file.filename}`;
    });

    res.json({
      success: true,
      message: `Successfully uploaded ${files.length} image(s)`,
      data: {
        images: imageUrls,
        count: files.length
      }
    });
  } catch (error) {
    console.error('Upload question images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload images'
    });
  }
};

/**
 * 删除错题图片
 */
export const deleteQuestionImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      res.status(400).json({
        success: false,
        error: 'Image URL is required'
      });
      return;
    }

    // Extract filename from URL
    const filename = path.basename(imageUrl);
    const uploadsDir = path.join(__dirname, '../../uploads/questions');
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists and belongs to user (filename contains userId)
    if (fs.existsSync(filePath) && filename.includes(userId)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Image not found or access denied'
      });
    }
  } catch (error) {
    console.error('Delete question image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
};
