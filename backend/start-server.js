const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8000;

// 基础中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(express.json());

// 基础路由
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    environment: 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'BZ StudyPal API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 模拟数据
let subjects = [
  {
    id: '1',
    code: 'math',
    nameZh: '数学',
    nameEn: 'Mathematics',
    description: '数学相关题目',
    color: '#2196F3',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { questions: 5 }
  },
  {
    id: '2',
    code: 'english',
    nameZh: '英语',
    nameEn: 'English',
    description: '英语相关题目',
    color: '#4CAF50',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { questions: 3 }
  }
];

let questions = [
  {
    id: '1',
    title: '二次函数题目',
    content: '求解二次函数 y = x² + 2x + 1 的最值',
    myAnswer: 'x = -1时取最小值0',
    correctAnswer: 'x = -1时取最小值0',
    explanation: '配方法：y = (x+1)² + 0，所以最小值为0',
    subjectId: '1',
    difficulty: 'MEDIUM',
    languageType: 'CHINESE',
    errorType: 'CALCULATION',
    masteryLevel: 'MASTERED',
    knowledgePoints: ['二次函数', '配方法'],
    tags: ['函数', '最值'],
    addedAt: new Date().toISOString(),
    reviewCount: 2,
    subject: null,
    _count: { reviews: 2, bookmarks: 1 }
  },
  {
    id: '2',
    title: '英语语法题',
    content: 'Choose the correct answer: I have been working here _____ 2020.',
    myAnswer: 'since',
    correctAnswer: 'since',
    explanation: '现在完成时配合since表示从某个时间点开始',
    subjectId: '2',
    difficulty: 'EASY',
    languageType: 'ENGLISH',
    errorType: 'KNOWLEDGE',
    masteryLevel: 'PARTIALLY_MASTERED',
    knowledgePoints: ['现在完成时', 'since用法'],
    tags: ['语法', '时态'],
    addedAt: new Date().toISOString(),
    reviewCount: 1,
    subject: null,
    _count: { reviews: 1, bookmarks: 0 }
  }
];

// 设置subject引用
questions[0].subject = subjects[0];
questions[1].subject = subjects[1];

// 认证相关路由
app.post('/api/auth/login', (req, res) => {
  // 模拟登录响应
  res.json({
    success: true,
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        preferredLanguage: 'zh',
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      }
    }
  });
});

// 科目管理API
app.get('/api/v1/subjects', (req, res) => {
  res.json({
    success: true,
    data: subjects
  });
});

app.get('/api/v1/subjects/:id', (req, res) => {
  const subject = subjects.find(s => s.id === req.params.id);
  if (!subject) {
    return res.status(404).json({ success: false, error: 'Subject not found' });
  }
  res.json({ success: true, data: subject });
});

app.post('/api/v1/subjects', (req, res) => {
  const newSubject = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { questions: 0 }
  };
  subjects.push(newSubject);
  res.json({ success: true, data: newSubject });
});

app.put('/api/v1/subjects/:id', (req, res) => {
  const index = subjects.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Subject not found' });
  }
  subjects[index] = {
    ...subjects[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json({ success: true, data: subjects[index] });
});

app.delete('/api/v1/subjects/:id', (req, res) => {
  const index = subjects.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Subject not found' });
  }
  subjects.splice(index, 1);
  res.json({ success: true });
});

// 错题管理API
app.get('/api/v1/questions', (req, res) => {
  let filteredQuestions = [...questions];
  
  // 应用过滤器
  if (req.query.subjectId) {
    filteredQuestions = filteredQuestions.filter(q => q.subjectId === req.query.subjectId);
  }
  if (req.query.difficulty) {
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === req.query.difficulty);
  }
  if (req.query.masteryLevel) {
    filteredQuestions = filteredQuestions.filter(q => q.masteryLevel === req.query.masteryLevel);
  }
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    filteredQuestions = filteredQuestions.filter(q => 
      q.title?.toLowerCase().includes(search) || 
      q.content.toLowerCase().includes(search)
    );
  }
  
  // 分页
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedQuestions,
    pagination: {
      page,
      limit,
      totalCount: filteredQuestions.length,
      totalPages: Math.ceil(filteredQuestions.length / limit),
      hasNextPage: endIndex < filteredQuestions.length,
      hasPrevPage: page > 1
    }
  });
});

app.get('/api/v1/questions/stats', (req, res) => {
  const stats = {
    totalCount: questions.length,
    recentWeekCount: questions.length, // 简化统计
    bySubject: subjects.map(subject => ({
      subjectId: subject.id,
      _count: questions.filter(q => q.subjectId === subject.id).length,
      subject: subject
    })),
    byDifficulty: [
      { difficulty: 'EASY', _count: questions.filter(q => q.difficulty === 'EASY').length },
      { difficulty: 'MEDIUM', _count: questions.filter(q => q.difficulty === 'MEDIUM').length },
      { difficulty: 'HARD', _count: questions.filter(q => q.difficulty === 'HARD').length }
    ],
    byMastery: [
      { masteryLevel: 'NOT_MASTERED', _count: questions.filter(q => q.masteryLevel === 'NOT_MASTERED').length },
      { masteryLevel: 'PARTIALLY_MASTERED', _count: questions.filter(q => q.masteryLevel === 'PARTIALLY_MASTERED').length },
      { masteryLevel: 'MASTERED', _count: questions.filter(q => q.masteryLevel === 'MASTERED').length }
    ],
    byErrorType: [
      { errorType: 'CALCULATION', _count: questions.filter(q => q.errorType === 'CALCULATION').length },
      { errorType: 'CONCEPTUAL', _count: questions.filter(q => q.errorType === 'CONCEPTUAL').length },
      { errorType: 'KNOWLEDGE', _count: questions.filter(q => q.errorType === 'KNOWLEDGE').length }
    ]
  };
  
  res.json({ success: true, data: stats });
});

app.get('/api/v1/questions/:id', (req, res) => {
  const question = questions.find(q => q.id === req.params.id);
  if (!question) {
    return res.status(404).json({ success: false, error: 'Question not found' });
  }
  res.json({ success: true, data: question });
});

app.post('/api/v1/questions', (req, res) => {
  const subject = subjects.find(s => s.id === req.body.subjectId);
  if (!subject) {
    return res.status(400).json({ success: false, error: 'Subject not found' });
  }
  
  const newQuestion = {
    id: Date.now().toString(),
    ...req.body,
    addedAt: new Date().toISOString(),
    reviewCount: 0,
    subject: subject,
    _count: { reviews: 0, bookmarks: 0 }
  };
  
  questions.push(newQuestion);
  res.json({ success: true, data: newQuestion });
});

app.put('/api/v1/questions/:id', (req, res) => {
  const index = questions.findIndex(q => q.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Question not found' });
  }
  
  const subject = subjects.find(s => s.id === req.body.subjectId);
  if (req.body.subjectId && !subject) {
    return res.status(400).json({ success: false, error: 'Subject not found' });
  }
  
  questions[index] = {
    ...questions[index],
    ...req.body,
    subject: subject || questions[index].subject
  };
  
  res.json({ success: true, data: questions[index] });
});

app.delete('/api/v1/questions/:id', (req, res) => {
  const index = questions.findIndex(q => q.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Question not found' });
  }
  questions.splice(index, 1);
  res.json({ success: true });
});

app.post('/api/v1/questions/batch/delete', (req, res) => {
  const { questionIds } = req.body;
  if (!Array.isArray(questionIds)) {
    return res.status(400).json({ success: false, error: 'questionIds must be an array' });
  }
  
  questionIds.forEach(id => {
    const index = questions.findIndex(q => q.id === id);
    if (index !== -1) {
      questions.splice(index, 1);
    }
  });
  
  res.json({ success: true });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Simple API Server is running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
