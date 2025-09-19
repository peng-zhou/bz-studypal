import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const enTranslations = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    submit: 'Submit',
    close: 'Close',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    reset: 'Reset',
    all: 'All',
    none: 'None',
    selectAll: 'Select All',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    showing: 'Showing',
    items: 'items',
    total: 'total',
    unknown: 'Unknown',
    actions: {
      loading: 'Loading...'
    },
    imageUpload: {
      title: 'Images',
      selectFiles: 'Select Images',
      dropFiles: 'Drop images here',
      maxFiles: 'Maximum {{max}} files',
      uploading: 'Uploading...',
      remove: 'Remove'
    }
  },
  navigation: {
    dashboard: 'Dashboard',
    subjects: 'Subjects',
    questions: 'Questions',
    reviews: 'Reviews',
    settings: 'Settings',
    logout: 'Logout',
  },
  auth: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    loginButton: 'Sign In',
    registerButton: 'Sign Up',
    loginToAccount: 'Sign in to your account',
    createAccount: 'Create your account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
  },
  questions: {
    title: 'Question Management',
    description: 'Manage and review your mistake questions',
    addQuestion: 'Add Question',
    editQuestion: 'Edit Question',
    deleteQuestion: 'Delete Question',
    questionTitle: 'Question Title',
    questionContent: 'Question Content',
    myAnswer: 'My Answer',
    correctAnswer: 'Correct Answer',
    explanation: 'Explanation',
    subject: 'Subject',
    difficulty: 'Difficulty',
    errorType: 'Error Type',
    languageType: 'Language Type',
    masteryLevel: 'Mastery Level',
    knowledgePoints: 'Knowledge Points',
    tags: 'Tags',
    addedAt: 'Added',
    reviewCount: 'Reviews',
    bookmarkCount: 'Bookmarks',
    // Statistics
    totalQuestions: 'Total Questions',
    thisWeek: 'This Week',
    notMastered: 'Not Mastered',
    mastered: 'Mastered',
    // Difficulty levels
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    // Mastery levels
    notMasteredLevel: 'Not Mastered',
    partiallyMastered: 'Partially Mastered',
    masteredLevel: 'Mastered',
    // Error types
    calculation: 'Calculation Error',
    conceptual: 'Conceptual Error',
    careless: 'Careless Error',
    methodological: 'Methodological Error',
    knowledge: 'Knowledge Error',
    other: 'Other',
    // Language types
    chinese: 'Chinese',
    english: 'English',
    bilingual: 'Bilingual',
    // Filters and search
    searchPlaceholder: 'Search questions...',
    allSubjects: 'All Subjects',
    allDifficulties: 'All Difficulties',
    allMasteryLevels: 'All Mastery Levels',
    sortBy: 'Sort By',
    sortOrder: 'Sort Order',
    ascending: 'Ascending',
    descending: 'Descending',
    addedDate: 'Added Date',
    lastReviewed: 'Last Reviewed',
    // Messages
    noQuestionsFound: 'No questions found',
    questionCreated: 'Question created successfully',
    questionUpdated: 'Question updated successfully',
    questionDeleted: 'Question deleted successfully',
    confirmDelete: 'Are you sure you want to delete this question? This action cannot be undone.',
    confirmDeleteSelected: 'Are you sure you want to delete {{count}} questions? This action cannot be undone.',
    // Form validation
    titleRequired: 'Please enter question title',
    contentRequired: 'Please enter question content',
    myAnswerRequired: 'Please enter your answer',
    correctAnswerRequired: 'Please enter correct answer',
    subjectRequired: 'Please select a subject',
    // Placeholders
    enterTitle: 'Enter question title',
    enterContent: 'Enter question content',
    enterMyAnswer: 'Enter your answer',
    enterCorrectAnswer: 'Enter correct answer',
    enterExplanation: 'Enter question explanation',
    selectSubject: 'Select subject',
    // Form labels
    titleOptional: 'Question Title (Optional)',
    contentRequiredLabel: 'Question Content *',
    myAnswerRequiredLabel: 'My Answer *',
    correctAnswerRequiredLabel: 'Correct Answer *',
    explanationOptional: 'Explanation (Optional)',
    subjectRequiredLabel: 'Subject *',
    // Modal titles
    createQuestionModal: 'Add Question',
    editQuestionModal: 'Edit Question',
    // Actions
    creating: 'Creating...',
    saving: 'Saving...',
    deleteSelected: 'Delete Selected ({{count}})',
    bookmarkCount: 'Bookmarks',
    // Modal titles
    createQuestionModal: 'Add Question',
    editQuestionModal: 'Edit Question',
    // Form labels
    titleOptional: 'Question Title (Optional)',
    contentRequiredLabel: 'Question Content *',
    myAnswerRequiredLabel: 'My Answer *',
    correctAnswerRequiredLabel: 'Correct Answer *',
    explanationOptional: 'Explanation (Optional)',
    subjectRequiredLabel: 'Subject *',
    // Placeholders
    enterTitle: 'Enter question title',
    enterContent: 'Enter question content',
    enterMyAnswer: 'Enter your answer',
    enterCorrectAnswer: 'Enter correct answer',
    enterExplanation: 'Enter explanation',
    selectSubject: 'Select subject',
    // Actions
    creating: 'Creating...',
    saving: 'Saving...',
  },
  subjects: {
    title: 'Subject Management',
    description: 'Manage your study subjects and categories',
    list: 'Subjects List',
    add: 'Add Subject',
    edit: 'Edit',
    delete: 'Delete',
    addSubject: 'Add Subject',
    editSubject: 'Edit Subject',
    deleteSubject: 'Delete Subject',
    subjectCode: 'Subject Code',
    chineseName: 'Chinese Name',
    englishName: 'English Name',
    subjectDescription: 'Description',
    color: 'Color',
    order: 'Order',
    questionCount: 'Questions',
    noSubjectsFound: 'No subjects found',
    createFirstSubject: 'Create your first subject!',
    subjectCreated: 'Subject created successfully',
    subjectUpdated: 'Subject updated successfully',
    subjectDeleted: 'Subject deleted successfully',
    confirmDelete: 'Are you sure you want to delete this subject?',
    cannotDeleteWithQuestions: 'Cannot delete subject with existing questions',
    // Fields
    fields: {
      code: 'Code:',
      englishName: 'English Name:',
      description: 'Description:',
      order: 'Order:',
      questionCount: 'Questions:'
    },
    // Empty state
    empty: {
      title: 'No subjects found',
      description: 'Create your first subject to get started!',
      action: 'Add Subject'
    },
    // Form labels and placeholders
    form: {
      code: 'Subject Code',
      codePlaceholder: 'e.g., math, english',
      nameZh: 'Chinese Name',
      nameZhPlaceholder: 'e.g., 数学',
      nameEn: 'English Name', 
      nameEnPlaceholder: 'e.g., Mathematics',
      description: 'Description',
      descriptionPlaceholder: 'Subject description (optional)',
      color: 'Color',
      order: 'Order',
      cancel: 'Cancel',
      create: 'Create',
      update: 'Update'
    },
    // Error messages
    errors: {
      createFailed: 'Failed to create subject',
      updateFailed: 'Failed to update subject',
      deleteFailed: 'Failed to delete subject',
      submitError: 'Submit error occurred'
    },
    // Confirmation messages
    confirm: {
      delete: 'Are you sure you want to delete this subject?'
    },
    // Form validation
    codeRequired: 'Please enter subject code',
    chineseNameRequired: 'Please enter Chinese name',
    englishNameRequired: 'Please enter English name',
    // Placeholders
    enterCode: 'e.g., math, english',
    enterChineseName: 'e.g., 数学',
    enterEnglishName: 'e.g., Mathematics',
    enterDescription: 'Subject description (optional)',
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Overview of your learning progress',
    welcome: 'Welcome back',
    quickStats: 'Quick Stats',
    recentActivity: 'Recent Activity',
    upcomingReviews: 'Upcoming Reviews',
    learningProgress: 'Learning Progress',
    learningStats: 'Learning Statistics',
    learningStatsDesc: 'View detailed analytics of your learning progress and performance',
    reviewPlanDesc: 'Start your personalized review session based on spaced repetition',
    viewStats: 'View Statistics',
    startReview: 'Start Review',
    noRecentActivity: 'No recent activities',
    userInfo: {
      name: 'Name',
      email: 'Email',
      preferredLanguage: 'Preferred Language',
      memberSince: 'Member Since',
      chinese: 'Chinese',
      english: 'English'
    }
  },
  settings: {
    title: 'Settings',
    description: 'Manage your account and preferences',
    profile: 'Profile',
    preferences: 'Preferences',
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
  },
};

// Chinese translations
const zhTranslations = {
  common: {
    loading: '加载中...',
    error: '错误',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    submit: '提交',
    close: '关闭',
    confirm: '确认',
    search: '搜索',
    filter: '筛选',
    reset: '重置',
    all: '全部',
    none: '无',
    selectAll: '全选',
    previous: '上一页',
    next: '下一页',
    page: '第',
    of: '页 / 共',
    showing: '显示',
    items: '条，共',
    total: '条',
    unknown: '未知',
    actions: {
      loading: '加载中...'
    },
    imageUpload: {
      title: '图片',
      selectFiles: '选择图片',
      dropFiles: '拖拽图片到此处',
      maxFiles: '最多 {{max}} 个文件',
      uploading: '上传中...',
      remove: '删除'
    }
  },
  navigation: {
    dashboard: '仪表盘',
    subjects: '科目管理',
    questions: '错题管理',
    reviews: '复习',
    settings: '设置',
    logout: '退出登录',
  },
  auth: {
    login: '登录',
    register: '注册',
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    forgotPassword: '忘记密码？',
    rememberMe: '记住我',
    loginButton: '登录',
    registerButton: '注册',
    loginToAccount: '登录您的账户',
    createAccount: '创建您的账户',
    alreadyHaveAccount: '已有账户？',
    dontHaveAccount: '还没有账户？',
  },
  questions: {
    title: '错题管理',
    description: '管理和复习您的错题',
    addQuestion: '添加错题',
    editQuestion: '编辑错题',
    deleteQuestion: '删除错题',
    questionTitle: '错题标题',
    questionContent: '错题内容',
    myAnswer: '我的答案',
    correctAnswer: '正确答案',
    explanation: '解析',
    subject: '科目',
    difficulty: '难度',
    errorType: '错误类型',
    languageType: '语言类型',
    masteryLevel: '掌握程度',
    knowledgePoints: '知识点',
    tags: '标签',
    addedAt: '添加时间',
    reviewCount: '复习次数',
    bookmarkCount: '收藏数',
    // Statistics
    totalQuestions: '错题总数',
    thisWeek: '本周新增',
    notMastered: '未掌握',
    mastered: '已掌握',
    // Difficulty levels
    easy: '简单',
    medium: '中等',
    hard: '困难',
    // Mastery levels
    notMasteredLevel: '未掌握',
    partiallyMastered: '部分掌握',
    masteredLevel: '已掌握',
    // Error types
    calculation: '计算错误',
    conceptual: '概念错误',
    careless: '粗心错误',
    methodological: '方法错误',
    knowledge: '知识点错误',
    other: '其他',
    // Language types
    chinese: '中文',
    english: '英文',
    bilingual: '中英文',
    // Filters and search
    searchPlaceholder: '请输入关键词搜索...',
    allSubjects: '全部科目',
    allDifficulties: '全部难度',
    allMasteryLevels: '全部程度',
    sortBy: '排序方式',
    sortOrder: '排序顺序',
    ascending: '升序',
    descending: '降序',
    addedDate: '添加时间',
    lastReviewed: '最后复习',
    // Messages
    noQuestionsFound: '暂无错题数据',
    questionCreated: '错题创建成功',
    questionUpdated: '错题更新成功',
    questionDeleted: '错题删除成功',
    confirmDelete: '确定要删除这道错题吗？此操作不可恢复。',
    confirmDeleteSelected: '确定要删除所选的 {{count}} 道错题吗？此操作不可恢复。',
    // Form validation
    titleRequired: '请输入错题标题',
    contentRequired: '请输入错题内容',
    myAnswerRequired: '请输入您的答案',
    correctAnswerRequired: '请输入正确答案',
    subjectRequired: '请选择科目',
    // Placeholders
    enterTitle: '请输入错题标题',
    enterContent: '请输入错题内容',
    enterMyAnswer: '请输入您的答案',
    enterCorrectAnswer: '请输入正确答案',
    enterExplanation: '请输入错题解析',
    selectSubject: '请选择科目',
    // Form labels
    titleOptional: '错题标题（可选）',
    contentRequiredLabel: '错题内容 *',
    myAnswerRequiredLabel: '您的答案 *',
    correctAnswerRequiredLabel: '正确答案 *',
    explanationOptional: '解析（可选）',
    subjectRequiredLabel: '科目 *',
    // Modal titles
    createQuestionModal: '添加错题',
    editQuestionModal: '编辑错题',
    // Actions
    creating: '创建中...',
    saving: '保存中...',
    deleteSelected: '删除所选 ({{count}})',
    bookmarkCount: '收藏数',
    // Modal titles
    createQuestionModal: '添加错题',
    editQuestionModal: '编辑错题',
    // Form labels
    titleOptional: '错题标题（可选）',
    contentRequiredLabel: '错题内容 *',
    myAnswerRequiredLabel: '您的答案 *',
    correctAnswerRequiredLabel: '正确答案 *',
    explanationOptional: '解析（可选）',
    subjectRequiredLabel: '科目 *',
    // Placeholders
    enterTitle: '请输入错题标题',
    enterContent: '请输入错题内容',
    enterMyAnswer: '请输入您的答案',
    enterCorrectAnswer: '请输入正确答案',
    enterExplanation: '请输入错题解析',
    selectSubject: '请选择科目',
    // Actions
    creating: '创建中...',
    saving: '保存中...',
  },
  subjects: {
    title: '科目管理',
    description: '管理您的学习科目和分类',
    list: '科目列表',
    add: '添加科目',
    edit: '编辑',
    delete: '删除',
    addSubject: '添加科目',
    editSubject: '编辑科目',
    deleteSubject: '删除科目',
    subjectCode: '科目代码',
    chineseName: '中文名称',
    englishName: '英文名称',
    subjectDescription: '描述',
    color: '颜色',
    order: '排序',
    questionCount: '错题数',
    noSubjectsFound: '暂无科目',
    createFirstSubject: '开始创建您的第一个科目吧！',
    subjectCreated: '科目创建成功',
    subjectUpdated: '科目更新成功',
    subjectDeleted: '科目删除成功',
    confirmDelete: '确定要删除这个科目吗？',
    cannotDeleteWithQuestions: '不能删除包含错题的科目',
    // Fields
    fields: {
      code: '代码：',
      englishName: '英文名称：',
      description: '描述：',
      order: '排序：',
      questionCount: '错题数：'
    },
    // Empty state
    empty: {
      title: '暂无科目',
      description: '创建您的第一个科目开始吧！',
      action: '添加科目'
    },
    // Form labels and placeholders
    form: {
      code: '科目代码',
      codePlaceholder: '如: math, english',
      nameZh: '中文名称',
      nameZhPlaceholder: '如: 数学',
      nameEn: '英文名称',
      nameEnPlaceholder: '如: Mathematics',
      description: '描述',
      descriptionPlaceholder: '科目描述（可选）',
      color: '颜色',
      order: '排序',
      cancel: '取消',
      create: '创建',
      update: '更新'
    },
    // Error messages
    errors: {
      createFailed: '创建科目失败',
      updateFailed: '更新科目失败',
      deleteFailed: '删除科目失败',
      submitError: '提交错误'
    },
    // Confirmation messages
    confirm: {
      delete: '确定要删除这个科目吗？'
    },
    // Form validation
    codeRequired: '请输入科目代码',
    chineseNameRequired: '请输入中文名称',
    englishNameRequired: '请输入英文名称',
    // Placeholders
    enterCode: '如: math, english',
    enterChineseName: '如: 数学',
    enterEnglishName: '如: Mathematics',
    enterDescription: '科目描述（可选）',
  },
  dashboard: {
    title: '仪表盘',
    description: '您的学习进度概览',
    welcome: '欢迎回来',
    quickStats: '快速统计',
    recentActivity: '最近活动',
    upcomingReviews: '待复习',
    learningProgress: '学习进度',
    learningStats: '学习统计',
    learningStatsDesc: '查看详细的学习进度和表现分析',
    reviewPlanDesc: '开始基于间隔重复的个性化复习计划',
    viewStats: '查看统计',
    startReview: '开始复习',
    noRecentActivity: '暂无最近活动',
    userInfo: {
      name: '姓名',
      email: '邮箱',
      preferredLanguage: '首选语言',
      memberSince: '注册时间',
      chinese: '中文',
      english: '英文'
    }
  },
  settings: {
    title: '设置',
    description: '管理您的账户和偏好设置',
    profile: '个人资料',
    preferences: '偏好设置',
    language: '语言',
    theme: '主题',
    notifications: '通知',
  },
};

const resources = {
  en: { translation: enTranslations },
  zh: { translation: zhTranslations },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // Default language set to English
    lng: 'en', // Initial language set to English
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
  });

export default i18n;
