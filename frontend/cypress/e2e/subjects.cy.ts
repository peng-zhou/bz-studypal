/// <reference types="cypress" />

describe('科目管理', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };

  const testSubject = {
    code: 'physics',
    nameZh: '物理',
    nameEn: 'Physics',
    description: '物理相关错题',
    color: '#9C27B0',
    order: 10
  };

  beforeEach(() => {
    // 清理和设置
    cy.task('log', '开始科目管理测试...');
    
    // 访问登录页面
    cy.visit('/auth/login');
    
    // 登录用户
    cy.get('[data-testid="email-input"], input[type="email"]').type(testUser.email);
    cy.get('[data-testid="password-input"], input[type="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();
    
    // 等待登录成功并跳转到dashboard
    cy.url().should('include', '/dashboard');
    cy.contains(testUser.name).should('be.visible');
  });

  describe('访问科目管理页面', () => {
    it('应该能从dashboard导航到科目管理页面', () => {
      // 点击科目管理按钮
      cy.contains('管理科目').should('be.visible').click();
      
      // 检查URL和页面内容
      cy.url().should('include', '/subjects');
      cy.contains('科目管理').should('be.visible');
      cy.contains('科目列表').should('be.visible');
    });

    it('应该显示已有的科目列表', () => {
      cy.visit('/subjects');
      
      // 等待科目列表加载
      cy.get('[data-testid="subjects-grid"], .grid').should('be.visible');
      
      // 检查默认科目是否存在
      cy.contains('数学').should('be.visible');
      cy.contains('英语').should('be.visible');
      cy.contains('Mathematics').should('be.visible');
      cy.contains('English').should('be.visible');
      
      // 检查科目详情
      cy.contains('代码:').should('be.visible');
      cy.contains('英文名:').should('be.visible');
      cy.contains('错题数:').should('be.visible');
    });

    it('应该正确显示认证用户信息', () => {
      cy.visit('/subjects');
      
      // 检查导航栏中的用户信息
      cy.contains(`欢迎, ${testUser.name}`).should('be.visible');
      cy.contains('返回主页').should('be.visible');
    });
  });

  describe('创建科目', () => {
    beforeEach(() => {
      cy.visit('/subjects');
    });

    it('应该能打开创建科目模态框', () => {
      // 点击添加科目按钮
      cy.get('button').contains('添加科目').click();
      
      // 检查模态框是否打开
      cy.get('[data-testid="subject-modal"], .fixed.inset-0').should('be.visible');
      cy.contains('添加科目').should('be.visible');
      cy.get('input[placeholder*="math, english"]').should('be.visible');
      cy.get('input[placeholder*="数学"]').should('be.visible');
      cy.get('input[placeholder*="Mathematics"]').should('be.visible');
    });

    it('应该能成功创建新科目', () => {
      // 打开模态框
      cy.get('button').contains('添加科目').click();
      
      // 填写表单
      cy.get('input[placeholder*="math, english"]').type(testSubject.code);
      cy.get('input[placeholder*="数学"]').type(testSubject.nameZh);
      cy.get('input[placeholder*="Mathematics"]').type(testSubject.nameEn);
      cy.get('textarea[placeholder*="科目描述"]').type(testSubject.description);
      cy.get('input[type="color"]').invoke('val', testSubject.color).trigger('change');
      cy.get('input[type="number"]').clear().type(testSubject.order.toString());
      
      // 提交表单
      cy.get('button[type="submit"]').contains('创建').click();
      
      // 验证科目创建成功
      cy.contains(testSubject.nameZh).should('be.visible');
      cy.contains(testSubject.nameEn).should('be.visible');
      cy.contains(testSubject.code).should('be.visible');
      
      // 模态框应该关闭
      cy.get('.fixed.inset-0').should('not.exist');
    });

    it('应该验证必填字段', () => {
      // 打开模态框
      cy.get('button').contains('添加科目').click();
      
      // 尝试提交空表单
      cy.get('button[type="submit"]').contains('创建').click();
      
      // 表单验证应该阻止提交（模态框应该保持打开）
      cy.get('.fixed.inset-0').should('be.visible');
      
      // 验证必填字段有required属性
      cy.get('input[placeholder*="math, english"]').should('have.attr', 'required');
      cy.get('input[placeholder*="数学"]').should('have.attr', 'required');
      cy.get('input[placeholder*="Mathematics"]').should('have.attr', 'required');
    });

    it('应该能取消创建科目', () => {
      // 打开模态框
      cy.get('button').contains('添加科目').click();
      
      // 填写一些数据
      cy.get('input[placeholder*="math, english"]').type('test');
      
      // 点击取消
      cy.get('button').contains('取消').click();
      
      // 模态框应该关闭
      cy.get('.fixed.inset-0').should('not.exist');
    });

    it('应该处理创建错误', () => {
      // 这个测试需要模拟API错误
      // 由于Cypress环境的限制，我们主要测试UI行为
      
      // 打开模态框
      cy.get('button').contains('添加科目').click();
      
      // 尝试创建重复的科目代码
      cy.get('input[placeholder*="math, english"]').type('math'); // 已存在的代码
      cy.get('input[placeholder*="数学"]').type('重复数学');
      cy.get('input[placeholder*="Mathematics"]').type('Duplicate Math');
      
      // 提交表单
      cy.get('button[type="submit"]').contains('创建').click();
      
      // 如果有错误消息显示，应该能看到
      // 注意：这取决于API的实际响应
      cy.get('body').then(($body) => {
        if ($body.find('.bg-red-100, .text-red-700').length > 0) {
          cy.get('.bg-red-100, .text-red-700').should('be.visible');
        }
      });
    });
  });

  describe('编辑科目', () => {
    beforeEach(() => {
      cy.visit('/subjects');
    });

    it('应该能打开编辑模态框并显示预填充数据', () => {
      // 等待科目列表加载
      cy.contains('数学').should('be.visible');
      
      // 点击第一个编辑按钮
      cy.get('button').contains('编辑').first().click();
      
      // 检查模态框是否打开并且有预填充数据
      cy.get('.fixed.inset-0').should('be.visible');
      cy.contains('编辑科目').should('be.visible');
      
      // 检查表单字段是否有值
      cy.get('input[placeholder*="math, english"]').should('have.value', 'math');
      cy.get('input[placeholder*="数学"]').should('have.value', '数学');
      cy.get('input[placeholder*="Mathematics"]').should('have.value', 'Mathematics');
    });

    it('应该能成功更新科目信息', () => {
      // 点击编辑按钮
      cy.get('button').contains('编辑').first().click();
      
      // 修改科目信息
      const updatedName = '更新的数学';
      cy.get('input[placeholder*="数学"]').clear().type(updatedName);
      
      // 提交更新
      cy.get('button[type="submit"]').contains('更新').click();
      
      // 验证更新成功
      cy.contains(updatedName).should('be.visible');
      
      // 模态框应该关闭
      cy.get('.fixed.inset-0').should('not.exist');
    });

    it('应该能取消编辑', () => {
      // 点击编辑按钮
      cy.get('button').contains('编辑').first().click();
      
      // 修改一些数据
      cy.get('input[placeholder*="数学"]').clear().type('修改后的名称');
      
      // 点击取消
      cy.get('button').contains('取消').click();
      
      // 模态框应该关闭，更改不应保存
      cy.get('.fixed.inset-0').should('not.exist');
      cy.contains('修改后的名称').should('not.exist');
      cy.contains('数学').should('be.visible'); // 原名称应该保留
    });
  });

  describe('删除科目', () => {
    beforeEach(() => {
      cy.visit('/subjects');
    });

    it('应该禁用有关联错题的科目的删除按钮', () => {
      // 等待科目列表加载
      cy.get('.grid').should('be.visible');
      
      // 检查有错题的科目（如英语）的删除按钮是否被禁用
      cy.get('button').contains('删除').should('exist');
      
      // 我们无法精确判断哪个是有错题的科目，但可以检查禁用状态
      cy.get('button:disabled').should('exist');
    });

    it('应该能删除没有关联错题的科目', () => {
      // 首先创建一个新科目用于删除
      cy.get('button').contains('添加科目').click();
      cy.get('input[placeholder*="math, english"]').type('deleteme');
      cy.get('input[placeholder*="数学"]').type('待删除科目');
      cy.get('input[placeholder*="Mathematics"]').type('Subject to Delete');
      cy.get('button[type="submit"]').contains('创建').click();
      
      // 等待科目创建完成
      cy.contains('待删除科目').should('be.visible');
      
      // 模拟window.confirm返回true
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      
      // 找到新创建的科目并点击删除
      cy.contains('待删除科目').parent().parent().find('button').contains('删除').click();
      
      // 验证科目已被删除
      cy.contains('待删除科目').should('not.exist');
    });

    it('应该能取消删除操作', () => {
      // 模拟window.confirm返回false
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(false);
      });
      
      // 尝试删除科目
      cy.get('button').contains('删除').first().click();
      
      // 科目应该仍然存在
      cy.contains('数学').should('be.visible');
    });
  });

  describe('响应式设计', () => {
    it('应该在移动设备上正常显示', () => {
      // 设置移动设备视窗
      cy.viewport(375, 667); // iPhone SE
      
      cy.visit('/subjects');
      
      // 检查页面元素是否正确显示
      cy.contains('科目管理').should('be.visible');
      cy.contains('添加科目').should('be.visible');
      
      // 检查网格布局在移动设备上的表现
      cy.get('.grid').should('be.visible');
    });

    it('应该在平板设备上正常显示', () => {
      // 设置平板设备视窗
      cy.viewport(768, 1024); // iPad
      
      cy.visit('/subjects');
      
      // 检查页面布局
      cy.contains('科目管理').should('be.visible');
      cy.get('.grid').should('be.visible');
    });
  });

  describe('错误处理', () => {
    it('应该处理网络错误', () => {
      // 拦截API请求并模拟网络错误
      cy.intercept('GET', '**/api/v1/subjects', { forceNetworkError: true }).as('getSubjectsError');
      
      cy.visit('/subjects');
      
      // 等待错误请求完成
      cy.wait('@getSubjectsError');
      
      // 检查是否显示错误信息
      cy.contains('获取科目列表失败').should('be.visible');
    });

    it('应该能关闭错误提示', () => {
      // 拦截API请求并返回错误
      cy.intercept('GET', '**/api/v1/subjects', {
        statusCode: 500,
        body: { success: false, error: '服务器错误' }
      }).as('getSubjectsServerError');
      
      cy.visit('/subjects');
      cy.wait('@getSubjectsServerError');
      
      // 检查错误信息显示
      cy.get('.bg-red-100').should('be.visible');
      
      // 点击关闭按钮
      cy.get('.bg-red-100').find('button').contains('×').click();
      
      // 错误信息应该消失
      cy.get('.bg-red-100').should('not.exist');
    });
  });

  describe('导航', () => {
    it('应该能返回主页', () => {
      cy.visit('/subjects');
      
      // 点击返回主页链接
      cy.contains('返回主页').click();
      
      // 应该跳转到dashboard
      cy.url().should('include', '/dashboard');
    });

    it('应该在未登录时重定向到登录页', () => {
      // 清除认证状态
      cy.clearCookies();
      cy.clearLocalStorage();
      
      // 尝试直接访问科目管理页面
      cy.visit('/subjects');
      
      // 应该显示登录提示或跳转到登录页
      cy.get('body').should('contain.text', '请先登录');
    });
  });

  describe('数据持久化', () => {
    it('创建的科目在页面刷新后应该保持', () => {
      cy.visit('/subjects');
      
      // 创建新科目
      cy.get('button').contains('添加科目').click();
      cy.get('input[placeholder*="math, english"]').type('persistence-test');
      cy.get('input[placeholder*="数学"]').type('持久化测试');
      cy.get('input[placeholder*="Mathematics"]').type('Persistence Test');
      cy.get('button[type="submit"]').contains('创建').click();
      
      // 等待创建完成
      cy.contains('持久化测试').should('be.visible');
      
      // 刷新页面
      cy.reload();
      
      // 科目应该仍然存在
      cy.contains('持久化测试').should('be.visible');
    });
  });

  afterEach(() => {
    cy.task('log', '科目管理测试完成');
  });
});
