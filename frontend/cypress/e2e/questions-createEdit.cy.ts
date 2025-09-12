describe('Questions Create and Edit E2E Tests', () => {
  const testUser = {
    email: 'questions.createedit@example.com',
    password: 'TestPassword123!',
    name: 'Create Edit Test User'
  };

  const sampleSubject = {
    code: 'MATH',
    nameZh: '数学',
    nameEn: 'Mathematics',
    description: '数学相关题目',
    color: '#2196F3',
    order: 1
  };

  const sampleQuestion = {
    title: '二次方程求解测试',
    content: '解方程 x² + 2x - 3 = 0',
    myAnswer: 'x = 1 或 x = -2',
    correctAnswer: 'x = 1 或 x = -3',
    explanation: '使用因式分解：(x+3)(x-1) = 0',
    difficulty: 'MEDIUM',
    errorType: 'CALCULATION',
    languageType: 'CHINESE'
  };

  // Setup test authentication
  before(() => {
    // Use test authentication setup
    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', 'test-access-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        preferredLanguage: 'zh',
        createdAt: '2025-09-12T17:19:17.734Z'
      }));
    });
  });

  beforeEach(() => {
    // Ensure authentication is set
    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', 'test-access-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        preferredLanguage: 'zh',
        createdAt: '2025-09-12T17:19:17.734Z'
      }));
    });

    // Mock API responses
    cy.intercept('GET', '**/api/v1/subjects', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: 'subject-1', ...sampleSubject },
          { id: 'subject-2', code: 'ENG', nameZh: '英语', nameEn: 'English', color: '#4CAF50', order: 2 }
        ]
      }
    }).as('getSubjects');

    cy.intercept('GET', '**/api/v1/questions/stats', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalCount: 1,
          recentWeekCount: 1,
          bySubject: [{ subjectId: 'subject-1', _count: 1, subject: sampleSubject }],
          byDifficulty: [{ difficulty: 'MEDIUM', _count: 1 }],
          byMastery: [{ masteryLevel: 'NOT_MASTERED', _count: 1 }],
          byErrorType: [{ errorType: 'CALCULATION', _count: 1 }]
        }
      }
    }).as('getStats');

    cy.intercept('GET', '**/api/v1/questions**', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: 'question-1',
            ...sampleQuestion,
            subjectId: 'subject-1',
            masteryLevel: 'NOT_MASTERED',
            subject: { id: 'subject-1', nameZh: '数学', color: '#2196F3' },
            addedAt: '2024-01-01T00:00:00.000Z',
            reviewCount: 0,
            _count: { reviews: 0, bookmarks: 1 }
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    }).as('getQuestions');

    cy.visit('/questions');
    cy.wait(['@getQuestions', '@getStats', '@getSubjects']);
  });

  describe('Create Question Functionality', () => {
    it('should open and close create modal correctly', () => {
      // Open modal
      cy.get('[data-testid="create-question-btn"]')
        .should('be.visible')
        .should('contain', '添加错题')
        .click();

      cy.get('[data-testid="create-modal"]').should('be.visible');
      cy.contains('添加错题').should('be.visible');

      // Close modal
      cy.get('[data-testid="cancel-create-btn"]').click();
      cy.get('[data-testid="create-modal"]').should('not.exist');
    });

    it('should display all form fields in create modal', () => {
      cy.get('[data-testid="create-question-btn"]').click();

      // Check all form fields are present
      cy.get('input[placeholder="请输入错题标题"]').should('be.visible');
      cy.get('textarea[placeholder="请输入错题内容"]').should('be.visible');
      cy.get('textarea[placeholder="请输入您的答案"]').should('be.visible');
      cy.get('textarea[placeholder="请输入正确答案"]').should('be.visible');
      cy.get('textarea[placeholder="请输入错题解析"]').should('be.visible');

      // Check select fields
      cy.contains('科目').should('be.visible');
      cy.contains('难度').should('be.visible');
      cy.contains('错误类型').should('be.visible');
      cy.contains('语言类型').should('be.visible');

      // Check buttons
      cy.get('[data-testid="cancel-create-btn"]').should('contain', '取消');
      cy.get('[data-testid="confirm-create-btn"]').should('contain', '创建');
    });

    it('should validate required fields', () => {
      cy.get('[data-testid="create-question-btn"]').click();

      // Try to submit empty form
      cy.get('[data-testid="confirm-create-btn"]').click();

      // Should show validation error
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.contains('请输入错题内容').should('be.visible');
    });

    it('should create question with minimum required fields', () => {
      // Mock successful creation
      cy.intercept('POST', '**/api/v1/questions', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'new-question-id',
            content: '新创建的错题内容',
            myAnswer: '我的答案',
            correctAnswer: '正确答案',
            subjectId: 'subject-1'
          },
          message: 'Question created successfully'
        }
      }).as('createQuestion');

      cy.get('[data-testid="create-question-btn"]').click();

      // Fill required fields
      cy.get('textarea[placeholder="请输入错题内容"]').type('新创建的错题内容');
      cy.get('textarea[placeholder="请输入您的答案"]').type('我的答案');
      cy.get('textarea[placeholder="请输入正确答案"]').type('正确答案');
      
      // Select subject
      cy.get('select').first().select('数学');

      // Submit form
      cy.get('[data-testid="confirm-create-btn"]').click();

      // Verify API call
      cy.wait('@createQuestion').then((interception) => {
        expect(interception.request.body).to.include({
          content: '新创建的错题内容',
          myAnswer: '我的答案',
          correctAnswer: '正确答案',
          subjectId: 'subject-1'
        });
      });

      // Modal should close
      cy.get('[data-testid="create-modal"]').should('not.exist');
    });

    it('should create question with all fields filled', () => {
      cy.intercept('POST', '**/api/v1/questions', {
        statusCode: 200,
        body: { success: true, data: {}, message: 'Created successfully' }
      }).as('createQuestionFull');

      cy.get('[data-testid="create-question-btn"]').click();

      // Fill all fields
      cy.get('input[placeholder="请输入错题标题"]').type('完整的错题标题');
      cy.get('textarea[placeholder="请输入错题内容"]').type('完整的错题内容描述');
      cy.get('textarea[placeholder="请输入您的答案"]').type('我的详细答案');
      cy.get('textarea[placeholder="请输入正确答案"]').type('正确的详细答案');
      cy.get('textarea[placeholder="请输入错题解析"]').type('详细的解题过程和说明');

      // Select dropdown values
      cy.get('select').eq(0).select('数学'); // subject
      cy.get('select').eq(1).select('困难'); // difficulty
      cy.get('select').eq(2).select('概念错误'); // error type
      cy.get('select').eq(3).select('中文'); // language type

      cy.get('[data-testid="confirm-create-btn"]').click();

      cy.wait('@createQuestionFull').then((interception) => {
        expect(interception.request.body).to.include({
          title: '完整的错题标题',
          content: '完整的错题内容描述',
          myAnswer: '我的详细答案',
          correctAnswer: '正确的详细答案',
          explanation: '详细的解题过程和说明',
          difficulty: 'HARD',
          errorType: 'CONCEPTUAL',
          languageType: 'CHINESE'
        });
      });

      cy.get('[data-testid="create-modal"]').should('not.exist');
    });

    it('should handle create API errors gracefully', () => {
      cy.intercept('POST', '**/api/v1/questions', {
        statusCode: 400,
        body: {
          success: false,
          error: 'Validation failed: Content is required'
        }
      }).as('createQuestionError');

      cy.get('[data-testid="create-question-btn"]').click();

      // Fill form
      cy.get('textarea[placeholder="请输入错题内容"]').type('测试内容');
      cy.get('textarea[placeholder="请输入您的答案"]').type('我的答案');
      cy.get('textarea[placeholder="请输入正确答案"]').type('正确答案');
      cy.get('select').first().select('数学');

      cy.get('[data-testid="confirm-create-btn"]').click();

      cy.wait('@createQuestionError');

      // Should show error message and keep modal open
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.contains('Validation failed').should('be.visible');
      cy.get('[data-testid="create-modal"]').should('be.visible');
    });

    it('should reset form after successful creation', () => {
      cy.intercept('POST', '**/api/v1/questions', {
        statusCode: 200,
        body: { success: true, data: {}, message: 'Created' }
      }).as('createQuestionSuccess');

      cy.get('[data-testid="create-question-btn"]').click();

      // Fill and submit form
      cy.get('textarea[placeholder="请输入错题内容"]').type('测试内容');
      cy.get('textarea[placeholder="请输入您的答案"]').type('答案');
      cy.get('textarea[placeholder="请输入正确答案"]').type('正确答案');
      cy.get('select').first().select('数学');

      cy.get('[data-testid="confirm-create-btn"]').click();
      cy.wait('@createQuestionSuccess');

      // Open modal again - form should be reset
      cy.get('[data-testid="create-question-btn"]').click();
      cy.get('textarea[placeholder="请输入错题内容"]').should('have.value', '');
      cy.get('textarea[placeholder="请输入您的答案"]').should('have.value', '');
      cy.get('textarea[placeholder="请输入正确答案"]').should('have.value', '');
    });
  });

  describe('Edit Question Functionality', () => {
    it('should open and close edit modal correctly', () => {
      // Open modal
      cy.get('[data-testid="edit-btn-question-1"]')
        .should('be.visible')
        .click();

      cy.get('[data-testid="edit-modal"]').should('be.visible');
      cy.contains('编辑错题').should('be.visible');

      // Close modal
      cy.get('[data-testid="cancel-edit-btn"]').click();
      cy.get('[data-testid="edit-modal"]').should('not.exist');
    });

    it('should populate form with existing question data', () => {
      cy.get('[data-testid="edit-btn-question-1"]').click();

      // Verify form is populated with existing data
      cy.get('input').should('have.value', '二次方程求解测试'); // title
      cy.get('textarea').eq(0).should('have.value', '解方程 x² + 2x - 3 = 0'); // content
      cy.get('textarea').eq(1).should('have.value', 'x = 1 或 x = -2'); // myAnswer
      cy.get('textarea').eq(2).should('have.value', 'x = 1 或 x = -3'); // correctAnswer
      cy.get('textarea').eq(3).should('have.value', '使用因式分解：(x+3)(x-1) = 0'); // explanation

      // Check selected values
      cy.get('select').eq(0).should('have.value', 'subject-1'); // subject
      cy.get('select').eq(1).should('have.value', 'MEDIUM'); // difficulty
      cy.get('select').eq(2).should('have.value', 'CALCULATION'); // error type
      cy.get('select').eq(3).should('have.value', 'NOT_MASTERED'); // mastery level
      cy.get('select').eq(4).should('have.value', 'CHINESE'); // language type
    });

    it('should display mastery level field in edit form but not in create form', () => {
      // Check create form doesn't have mastery level
      cy.get('[data-testid="create-question-btn"]').click();
      cy.contains('掌握程度').should('not.exist');
      cy.get('[data-testid="cancel-create-btn"]').click();

      // Check edit form has mastery level
      cy.get('[data-testid="edit-btn-question-1"]').click();
      cy.contains('掌握程度').should('be.visible');
      
      // Check mastery level options
      cy.get('select').contains('未掌握').parent().within(() => {
        cy.get('option').should('contain', '未掌握');
        cy.get('option').should('contain', '部分掌握');
        cy.get('option').should('contain', '已掌握');
      });
    });

    it('should validate required fields in edit form', () => {
      cy.get('[data-testid="edit-btn-question-1"]').click();

      // Clear a required field
      cy.get('textarea').eq(0).clear(); // content

      // Try to submit
      cy.get('[data-testid="confirm-edit-btn"]').click();

      // Should show validation error
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.contains('请输入错题内容').should('be.visible');
    });

    it('should update question successfully', () => {
      cy.intercept('PUT', '**/api/v1/questions/question-1', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 'question-1',
            title: '修改后的标题',
            content: '修改后的内容',
            masteryLevel: 'MASTERED'
          },
          message: 'Question updated successfully'
        }
      }).as('updateQuestion');

      cy.get('[data-testid="edit-btn-question-1"]').click();

      // Modify some fields
      cy.get('input').clear().type('修改后的标题');
      cy.get('textarea').eq(0).clear().type('修改后的内容');
      cy.get('select').contains('未掌握').parent().select('MASTERED');

      cy.get('[data-testid="confirm-edit-btn"]').click();

      cy.wait('@updateQuestion').then((interception) => {
        expect(interception.request.body).to.include({
          title: '修改后的标题',
          content: '修改后的内容',
          masteryLevel: 'MASTERED'
        });
      });

      cy.get('[data-testid="edit-modal"]').should('not.exist');
    });

    it('should handle update API errors gracefully', () => {
      cy.intercept('PUT', '**/api/v1/questions/question-1', {
        statusCode: 400,
        body: {
          success: false,
          error: 'Failed to update question'
        }
      }).as('updateQuestionError');

      cy.get('[data-testid="edit-btn-question-1"]').click();
      cy.get('[data-testid="confirm-edit-btn"]').click();

      cy.wait('@updateQuestionError');

      // Should show error message and keep modal open
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.contains('Failed to update question').should('be.visible');
      cy.get('[data-testid="edit-modal"]').should('be.visible');
    });

    it('should allow updating mastery level independently', () => {
      cy.intercept('PUT', '**/api/v1/questions/question-1', {
        statusCode: 200,
        body: { success: true, data: {}, message: 'Updated' }
      }).as('updateMastery');

      cy.get('[data-testid="edit-btn-question-1"]').click();

      // Only change mastery level
      cy.get('select').contains('未掌握').parent().select('PARTIALLY_MASTERED');

      cy.get('[data-testid="confirm-edit-btn"]').click();

      cy.wait('@updateMastery').then((interception) => {
        expect(interception.request.body).to.include({
          masteryLevel: 'PARTIALLY_MASTERED'
        });
      });
    });
  });

  describe('Form Interaction and UX', () => {
    it('should handle form switching between create and edit modes', () => {
      // Open create modal
      cy.get('[data-testid="create-question-btn"]').click();
      cy.get('[data-testid="create-modal"]').should('be.visible');
      cy.get('[data-testid="cancel-create-btn"]').click();

      // Open edit modal
      cy.get('[data-testid="edit-btn-question-1"]').click();
      cy.get('[data-testid="edit-modal"]').should('be.visible');
      cy.get('[data-testid="cancel-edit-btn"]').click();

      // Should be able to open create again
      cy.get('[data-testid="create-question-btn"]').click();
      cy.get('[data-testid="create-modal"]').should('be.visible');
    });

    it('should show loading state during form submission', () => {
      cy.intercept('POST', '**/api/v1/questions', (req) => {
        // Delay response to see loading state
        req.reply((res) => {
          setTimeout(() => {
            res.send({ statusCode: 200, body: { success: true, data: {}, message: 'Created' } });
          }, 1000);
        });
      }).as('slowCreateQuestion');

      cy.get('[data-testid="create-question-btn"]').click();

      cy.get('textarea[placeholder="请输入错题内容"]').type('测试');
      cy.get('textarea[placeholder="请输入您的答案"]').type('答案');
      cy.get('textarea[placeholder="请输入正确答案"]').type('正确');
      cy.get('select').first().select('数学');

      cy.get('[data-testid="confirm-create-btn"]').click();

      // Should show loading text
      cy.get('[data-testid="confirm-create-btn"]').should('contain', '创建中...');
      cy.get('[data-testid="confirm-create-btn"]').should('be.disabled');

      cy.wait('@slowCreateQuestion');
    });

    it('should preserve form data while typing', () => {
      cy.get('[data-testid="create-question-btn"]').click();

      const testContent = '这是一个测试错题内容，用来验证表单数据保持功能';
      cy.get('textarea[placeholder="请输入错题内容"]').type(testContent);
      
      // Verify content is preserved
      cy.get('textarea[placeholder="请输入错题内容"]').should('have.value', testContent);

      // Type in another field and verify first field is still intact
      cy.get('textarea[placeholder="请输入您的答案"]').type('测试答案');
      cy.get('textarea[placeholder="请输入错题内容"]').should('have.value', testContent);
    });

    it('should support keyboard navigation in forms', () => {
      cy.get('[data-testid="create-question-btn"]').click();

      // Tab through form fields
      cy.get('input[placeholder="请输入错题标题"]').focus();
      cy.focused().tab();
      cy.focused().should('have.attr', 'placeholder', '请输入错题内容');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'placeholder', '请输入您的答案');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'placeholder', '请输入正确答案');
    });

    it('should handle very long text inputs gracefully', () => {
      cy.get('[data-testid="create-question-btn"]').click();

      const longText = 'A'.repeat(1000);
      cy.get('textarea[placeholder="请输入错题内容"]').type(longText);
      cy.get('textarea[placeholder="请输入错题内容"]').should('have.value', longText);

      // Form should still be submittable
      cy.get('textarea[placeholder="请输入您的答案"]').type('答案');
      cy.get('textarea[placeholder="请输入正确答案"]').type('正确答案');
      cy.get('select').first().select('数学');

      cy.get('[data-testid="confirm-create-btn"]').should('not.be.disabled');
    });
  });

  describe('Data Refresh and Integration', () => {
    it('should refresh questions list after successful creation', () => {
      cy.intercept('POST', '**/api/v1/questions', {
        statusCode: 200,
        body: { success: true, data: {}, message: 'Created' }
      }).as('createSuccess');

      // Mock refreshed data calls
      cy.intercept('GET', '**/api/v1/questions**', {
        statusCode: 200,
        body: { success: true, data: [], pagination: {} }
      }).as('refreshQuestions');

      cy.intercept('GET', '**/api/v1/questions/stats', {
        statusCode: 200,
        body: { success: true, data: {} }
      }).as('refreshStats');

      cy.get('[data-testid="create-question-btn"]').click();

      cy.get('textarea[placeholder="请输入错题内容"]').type('新题目');
      cy.get('textarea[placeholder="请输入您的答案"]').type('答案');
      cy.get('textarea[placeholder="请输入正确答案"]').type('正确答案');
      cy.get('select').first().select('数学');

      cy.get('[data-testid="confirm-create-btn"]').click();

      cy.wait('@createSuccess');
      
      // Should refresh both questions and stats
      cy.wait(['@refreshQuestions', '@refreshStats']);
    });

    it('should refresh questions list after successful update', () => {
      cy.intercept('PUT', '**/api/v1/questions/question-1', {
        statusCode: 200,
        body: { success: true, data: {}, message: 'Updated' }
      }).as('updateSuccess');

      cy.intercept('GET', '**/api/v1/questions**', {
        statusCode: 200,
        body: { success: true, data: [], pagination: {} }
      }).as('refreshQuestions');

      cy.intercept('GET', '**/api/v1/questions/stats', {
        statusCode: 200,
        body: { success: true, data: {} }
      }).as('refreshStats');

      cy.get('[data-testid="edit-btn-question-1"]').click();
      cy.get('[data-testid="confirm-edit-btn"]').click();

      cy.wait('@updateSuccess');
      cy.wait(['@refreshQuestions', '@refreshStats']);
    });

    it('should maintain scroll position after modal operations', () => {
      // Scroll down
      cy.scrollTo('bottom');

      // Open and close modal
      cy.get('[data-testid="create-question-btn"]').click();
      cy.get('[data-testid="cancel-create-btn"]').click();

      // Page should remain scrolled
      cy.window().its('scrollY').should('be.gt', 0);
    });
  });
});
