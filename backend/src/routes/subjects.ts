import { Router } from 'express';
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
} from '../controllers/subjects';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @route   GET /api/v1/subjects
 * @desc    获取所有科目列表
 * @access  Public
 */
router.get('/', getSubjects);

/**
 * @route   GET /api/v1/subjects/:id
 * @desc    根据ID获取单个科目
 * @access  Public
 */
router.get('/:id', getSubjectById);

/**
 * @route   POST /api/v1/subjects
 * @desc    创建新科目
 * @access  Private (需要管理员权限)
 */
router.post('/', authenticate, createSubjectValidation, createSubject);

/**
 * @route   PUT /api/v1/subjects/:id
 * @desc    更新科目信息
 * @access  Private (需要管理员权限)
 */
router.put('/:id', authenticate, updateSubjectValidation, updateSubject);

/**
 * @route   DELETE /api/v1/subjects/:id
 * @desc    删除科目
 * @access  Private (需要管理员权限)
 */
router.delete('/:id', authenticate, deleteSubject);

/**
 * @route   POST /api/v1/subjects/reorder
 * @desc    批量更新科目排序
 * @access  Private (需要管理员权限)
 */
router.post('/reorder', authenticate, updateSubjectsOrderValidation, updateSubjectsOrder);

export default router;
