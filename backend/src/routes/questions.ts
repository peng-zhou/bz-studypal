import express from 'express';
import { authenticate } from '../middlewares/auth';
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
} from '../controllers/questions';

const router = express.Router();

// 应用认证中间件到所有路由
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: 错题管理
 */

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: 获取用户错题列表
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: 每页记录数
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *         description: 科目ID
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *         description: 难度
 *       - in: query
 *         name: masteryLevel
 *         schema:
 *           type: string
 *           enum: [NOT_MASTERED, PARTIALLY_MASTERED, MASTERED]
 *         description: 掌握程度
 *       - in: query
 *         name: errorType
 *         schema:
 *           type: string
 *           enum: [CALCULATION, CONCEPTUAL, CARELESS, METHODOLOGICAL, KNOWLEDGE, OTHER]
 *         description: 错误类型
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [addedAt, lastReviewedAt, reviewCount, difficulty, masteryLevel]
 *           default: addedAt
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 错题列表获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', getQuestionsValidation, getQuestions);

/**
 * @swagger
 * /api/questions/stats:
 *   get:
 *     summary: 获取错题统计信息
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: integer
 *                     recentWeekCount:
 *                       type: integer
 *                     bySubject:
 *                       type: array
 *                     byDifficulty:
 *                       type: array
 *                     byMastery:
 *                       type: array
 *                     byErrorType:
 *                       type: array
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/stats', getQuestionStats);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: 获取单个错题详情
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 错题ID
 *     responses:
 *       200:
 *         description: 错题详情获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Question'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', getQuestionById);

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: 创建新错题
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - myAnswer
 *               - correctAnswer
 *               - subjectId
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: 错题标题
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 description: 错题内容
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 错题图片
 *               myAnswer:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: 我的答案
 *               correctAnswer:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: 正确答案
 *               explanation:
 *                 type: string
 *                 maxLength: 3000
 *                 description: 解析
 *               subjectId:
 *                 type: string
 *                 description: 科目ID
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *                 default: MEDIUM
 *                 description: 难度
 *               languageType:
 *                 type: string
 *                 enum: [CHINESE, ENGLISH, BILINGUAL]
 *                 default: CHINESE
 *                 description: 语言类型
 *               errorType:
 *                 type: string
 *                 enum: [CALCULATION, CONCEPTUAL, CARELESS, METHODOLOGICAL, KNOWLEDGE, OTHER]
 *                 default: OTHER
 *                 description: 错误类型
 *               knowledgePoints:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 知识点
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 标签
 *     responses:
 *       201:
 *         description: 错题创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Question'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/', createQuestionValidation, createQuestion);

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: 更新错题
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 错题ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: 错题标题
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 description: 错题内容
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 错题图片
 *               myAnswer:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: 我的答案
 *               correctAnswer:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: 正确答案
 *               explanation:
 *                 type: string
 *                 maxLength: 3000
 *                 description: 解析
 *               subjectId:
 *                 type: string
 *                 description: 科目ID
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *                 description: 难度
 *               languageType:
 *                 type: string
 *                 enum: [CHINESE, ENGLISH, BILINGUAL]
 *                 description: 语言类型
 *               errorType:
 *                 type: string
 *                 enum: [CALCULATION, CONCEPTUAL, CARELESS, METHODOLOGICAL, KNOWLEDGE, OTHER]
 *                 description: 错误类型
 *               masteryLevel:
 *                 type: string
 *                 enum: [NOT_MASTERED, PARTIALLY_MASTERED, MASTERED]
 *                 description: 掌握程度
 *               knowledgePoints:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 知识点
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 标签
 *     responses:
 *       200:
 *         description: 错题更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Question'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/:id', updateQuestionValidation, updateQuestion);

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: 删除错题
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 错题ID
 *     responses:
 *       200:
 *         description: 错题删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', deleteQuestion);

/**
 * @swagger
 * /api/questions/batch/delete:
 *   post:
 *     summary: 批量删除错题
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionIds
 *             properties:
 *               questionIds:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                 description: 错题ID数组
 *     responses:
 *       200:
 *         description: 批量删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/batch/delete', batchDeleteValidation, batchDeleteQuestions);

export default router;
