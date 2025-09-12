import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/database';

/**
 * 获取所有科目列表
 */
export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            questions: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: subjects,
      count: subjects.length
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subjects'
    });
  }
};

/**
 * 根据ID获取单个科目
 */
export const getSubjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Subject ID is required'
      });
      return;
    }

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true
          }
        }
      }
    });

    if (!subject) {
      res.status(404).json({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Get subject by id error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subject'
    });
  }
};

/**
 * 创建新科目
 */
export const createSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { code, nameZh, nameEn, description, color, order = 0 } = req.body;

    // 检查科目代码是否已存在
    const existingSubject = await prisma.subject.findUnique({
      where: { code }
    });

    if (existingSubject) {
      res.status(409).json({
        success: false,
        error: 'Subject code already exists',
        code: 'SUBJECT_CODE_EXISTS'
      });
      return;
    }

    const subject = await prisma.subject.create({
      data: {
        code,
        nameZh,
        nameEn,
        description,
        color,
        order
      }
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subject'
    });
  }
};

/**
 * 更新科目信息
 */
export const updateSubject = async (req: Request, res: Response): Promise<void> => {
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
    const { code, nameZh, nameEn, description, color, order } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Subject ID is required'
      });
      return;
    }

    // 检查科目是否存在
    const existingSubject = await prisma.subject.findUnique({
      where: { id }
    });

    if (!existingSubject) {
      res.status(404).json({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
      return;
    }

    // 如果更新代码，检查是否与其他科目冲突
    if (code && code !== existingSubject.code) {
      const codeExists = await prisma.subject.findUnique({
        where: { code }
      });

      if (codeExists) {
        res.status(409).json({
          success: false,
          error: 'Subject code already exists',
          code: 'SUBJECT_CODE_EXISTS'
        });
        return;
      }
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(nameZh && { nameZh }),
        ...(nameEn && { nameEn }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(order !== undefined && { order })
      }
    });

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: updatedSubject
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subject'
    });
  }
};

/**
 * 删除科目
 */
export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Subject ID is required'
      });
      return;
    }

    // 检查科目是否存在
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true
          }
        }
      }
    });

    if (!existingSubject) {
      res.status(404).json({
        success: false,
        error: 'Subject not found',
        code: 'SUBJECT_NOT_FOUND'
      });
      return;
    }

    // 检查是否有关联的问题
    if (existingSubject._count.questions > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete subject with associated questions',
        code: 'SUBJECT_HAS_QUESTIONS',
        details: {
          questionCount: existingSubject._count.questions
        }
      });
      return;
    }

    await prisma.subject.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete subject'
    });
  }
};

/**
 * 批量更新科目排序
 */
export const updateSubjectsOrder = async (req: Request, res: Response): Promise<void> => {
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

    const { subjects } = req.body; // Array of { id, order }

    // 使用事务更新所有科目的排序
    await prisma.$transaction(
      subjects.map((subject: { id: string; order: number }) =>
        prisma.subject.update({
          where: { id: subject.id },
          data: { order: subject.order }
        })
      )
    );

    res.json({
      success: true,
      message: 'Subjects order updated successfully'
    });
  } catch (error) {
    console.error('Update subjects order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subjects order'
    });
  }
};

// 验证规则
export const createSubjectValidation = [
  body('code')
    .trim()
    .isLength({ min: 1, max: 20 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Subject code must be 1-20 characters long and contain only letters, numbers, hyphens, and underscores'),
  body('nameZh')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Chinese name is required and must be 1-50 characters long'),
  body('nameEn')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('English name is required and must be 1-50 characters long'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

export const updateSubjectValidation = [
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Subject code must be 1-20 characters long and contain only letters, numbers, hyphens, and underscores'),
  body('nameZh')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Chinese name must be 1-50 characters long'),
  body('nameEn')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('English name must be 1-50 characters long'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color code'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

export const updateSubjectsOrderValidation = [
  body('subjects')
    .isArray({ min: 1 })
    .withMessage('Subjects array is required'),
  body('subjects.*.id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Subject ID is required'),
  body('subjects.*.order')
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];
