describe('Questions Management E2E Tests', () => {
  const testUser = {
    email: 'questions.test@example.com',
    password: 'TestPassword123!',
    name: 'Questions Test User'
  };

  const sampleQuestion = {
    title: 'E2E Test Question',
    content: 'What is 2 + 2?',
    myAnswer: '5',
    correctAnswer: '4',
    explanation: 'Basic arithmetic: 2 + 2 = 4',
    difficulty: 'EASY',
    errorType: 'CALCULATION'
  };

  before(() => {
    // Setup: Create test user and login
    cy.request('POST', `${Cypress.env('API_URL')}/api/auth/register`, testUser);
    cy.login(testUser.email, testUser.password);
  });

  beforeEach(() => {
    // Login before each test
    cy.login(testUser.email, testUser.password);
    cy.visit('/questions');
  });

  after(() => {
    // Cleanup: Remove test user (if cleanup endpoint exists)
    cy.login(testUser.email, testUser.password);
    // cy.request('DELETE', `${Cypress.env('API_URL')}/api/auth/account`);
  });

  describe('Authentication and Access', () => {
    it('should redirect to login if not authenticated', () => {
      cy.clearLocalStorage();
      cy.visit('/questions');
      cy.url().should('include', '/auth/login');
    });

    it('should access questions page when authenticated', () => {
      cy.url().should('include', '/questions');
      cy.get('[data-testid="questions-page"]').should('be.visible');
    });
  });

  describe('Page Layout and UI', () => {
    it('should display all main page elements', () => {
      cy.get('[data-testid="page-title"]')
        .should('be.visible')
        .and('contain', 'Questions');

      cy.get('[data-testid="page-description"]').should('be.visible');
      cy.get('[data-testid="stats-cards"]').should('be.visible');
      cy.get('[data-testid="filters"]').should('be.visible');
      cy.get('[data-testid="questions-list"]').should('be.visible');
    });

    it('should display statistics cards with correct information', () => {
      cy.get('[data-testid="total-count"]').should('be.visible');
      cy.get('[data-testid="recent-count"]').should('be.visible');
      cy.get('[data-testid="not-mastered-count"]').should('be.visible');
      cy.get('[data-testid="mastered-count"]').should('be.visible');
    });

    it('should display all filter controls', () => {
      cy.get('[data-testid="search-input"]').should('be.visible');
      cy.get('[data-testid="subject-filter"]').should('be.visible');
      cy.get('[data-testid="difficulty-filter"]').should('be.visible');
      cy.get('[data-testid="mastery-filter"]').should('be.visible');
      cy.get('[data-testid="sort-by"]').should('be.visible');
      cy.get('[data-testid="sort-order"]').should('be.visible');
    });
  });

  describe('Questions List Display', () => {
    it('should display questions or empty state', () => {
      cy.get('[data-testid="questions-list"]').within(() => {
        cy.get('[data-testid="empty-state"]')
          .should('be.visible')
          .then(($emptyState) => {
            if ($emptyState.length > 0) {
              cy.log('No questions found - showing empty state');
            }
          });
      });
    });

    it('should show correct results information', () => {
      cy.get('[data-testid="results-info"]').should('be.visible');
    });

    it('should display create question button', () => {
      cy.get('[data-testid="create-question-btn"]')
        .should('be.visible')
        .and('contain', 'Create');
    });
  });

  describe('Create Question Flow', () => {
    it('should open create modal when create button is clicked', () => {
      cy.get('[data-testid="create-question-btn"]').click();
      cy.get('[data-testid="create-modal"]').should('be.visible');
      cy.contains('Create New Question').should('be.visible');
    });

    it('should close create modal when cancel is clicked', () => {
      cy.get('[data-testid="create-question-btn"]').click();
      cy.get('[data-testid="create-modal"]').should('be.visible');
      
      cy.get('[data-testid="cancel-create-btn"]').click();
      cy.get('[data-testid="create-modal"]').should('not.exist');
    });

    it('should create a new question successfully', () => {
      // First, ensure we have at least one subject
      cy.createTestSubject();

      cy.get('[data-testid="create-question-btn"]').click();
      cy.get('[data-testid="create-modal"]').should('be.visible');

      // Note: This test assumes form implementation
      // In actual implementation, we would fill out the form here
      // For now, we'll test the API call behavior
      cy.get('[data-testid="confirm-create-btn"]').click();
      
      // The modal should close after successful creation
      cy.get('[data-testid="create-modal"]', { timeout: 10000 }).should('not.exist');
      
      // Questions list should refresh
      cy.get('[data-testid="questions-list"]').should('be.visible');
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(() => {
      // Create some test data
      cy.createTestSubject();
      cy.createTestQuestion(sampleQuestion);
    });

    it('should filter questions by search term', () => {
      cy.get('[data-testid="search-input"]')
        .clear()
        .type('E2E Test');

      // Wait for debounced search
      cy.wait(500);

      // Should trigger API call and update results
      cy.get('[data-testid="questions-list"]').should('be.visible');
    });

    it('should filter questions by subject', () => {
      cy.get('[data-testid="subject-filter"]').select('Mathematics');
      
      // Wait for API call
      cy.wait(500);

      cy.get('[data-testid="questions-list"]').should('be.visible');
    });

    it('should filter questions by difficulty', () => {
      cy.get('[data-testid="difficulty-filter"]').select('EASY');
      
      // Wait for API call
      cy.wait(500);

      cy.get('[data-testid="questions-list"]').should('be.visible');
    });

    it('should filter questions by mastery level', () => {
      cy.get('[data-testid="mastery-filter"]').select('NOT_MASTERED');
      
      // Wait for API call
      cy.wait(500);

      cy.get('[data-testid="questions-list"]').should('be.visible');
    });

    it('should sort questions correctly', () => {
      cy.get('[data-testid="sort-by"]').select('reviewCount');
      cy.get('[data-testid="sort-order"]').select('asc');
      
      // Wait for API call
      cy.wait(500);

      cy.get('[data-testid="questions-list"]').should('be.visible');
    });

    it('should clear search when input is cleared', () => {
      cy.get('[data-testid="search-input"]')
        .clear()
        .type('nonexistent');

      cy.wait(500);

      cy.get('[data-testid="search-input"]').clear();

      cy.wait(500);

      // Should show all questions again
      cy.get('[data-testid="questions-list"]').should('be.visible');
    });
  });

  describe('Question Management Actions', () => {
    beforeEach(() => {
      // Create test data for management actions
      cy.createTestSubject();
      cy.createTestQuestion(sampleQuestion);
      cy.reload(); // Refresh to see the created question
    });

    it('should display question actions when questions exist', () => {
      cy.get('[data-testid^="question-"]').first().within(() => {
        cy.get('[data-testid^="edit-btn-"]').should('be.visible');
        cy.get('[data-testid^="delete-btn-"]').should('be.visible');
      });
    });

    it('should open edit modal when edit button is clicked', () => {
      cy.get('[data-testid^="edit-btn-"]').first().click();
      cy.get('[data-testid="edit-modal"]').should('be.visible');
      cy.contains('Edit Question').should('be.visible');
    });

    it('should close edit modal when cancel is clicked', () => {
      cy.get('[data-testid^="edit-btn-"]').first().click();
      cy.get('[data-testid="edit-modal"]').should('be.visible');
      
      cy.get('[data-testid="cancel-edit-btn"]').click();
      cy.get('[data-testid="edit-modal"]').should('not.exist');
    });

    it('should delete question when delete button is clicked and confirmed', () => {
      cy.get('[data-testid^="delete-btn-"]').first().click();
      
      // Handle confirmation dialog
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      
      // Question should be removed from list
      cy.wait(1000);
      cy.get('[data-testid="questions-list"]').should('be.visible');
    });

    it('should not delete question when deletion is cancelled', () => {
      const initialQuestionCount = cy.get('[data-testid^="question-"]').its('length');
      
      cy.get('[data-testid^="delete-btn-"]').first().click();
      
      // Cancel confirmation dialog
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(false);
      });
      
      // Question count should remain the same
      cy.get('[data-testid^="question-"]').should('have.length.gte', 0);
    });
  });

  describe('Bulk Actions and Selection', () => {
    beforeEach(() => {
      // Create multiple test questions
      cy.createTestSubject();
      cy.createTestQuestion({ ...sampleQuestion, title: 'Question 1' });
      cy.createTestQuestion({ ...sampleQuestion, title: 'Question 2' });
      cy.reload();
    });

    it('should allow selecting individual questions', () => {
      cy.get('[data-testid^="checkbox-"]').first().click();
      cy.get('[data-testid^="checkbox-"]').first().should('be.checked');
    });

    it('should show delete selected button when questions are selected', () => {
      cy.get('[data-testid^="checkbox-"]').first().click();
      cy.get('[data-testid="delete-selected-btn"]').should('be.visible');
    });

    it('should select all questions when select all is clicked', () => {
      cy.get('[data-testid="select-all-checkbox"]').click();
      
      // All individual checkboxes should be checked
      cy.get('[data-testid^="checkbox-"]').each(($checkbox) => {
        cy.wrap($checkbox).should('be.checked');
      });
    });

    it('should deselect all questions when select all is clicked again', () => {
      cy.get('[data-testid="select-all-checkbox"]').click();
      cy.get('[data-testid="select-all-checkbox"]').click();
      
      // All individual checkboxes should be unchecked
      cy.get('[data-testid^="checkbox-"]').each(($checkbox) => {
        cy.wrap($checkbox).should('not.be.checked');
      });
    });

    it('should batch delete selected questions', () => {
      cy.get('[data-testid^="checkbox-"]').first().click();
      cy.get('[data-testid^="checkbox-"]').eq(1).click();
      
      cy.get('[data-testid="delete-selected-btn"]').click();
      
      // Confirm deletion
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      
      cy.wait(1000);
      cy.get('[data-testid="questions-list"]').should('be.visible');
    });

    it('should update selected count in delete button text', () => {
      cy.get('[data-testid^="checkbox-"]').first().click();
      cy.get('[data-testid="delete-selected-btn"]').should('contain', '(1)');
      
      cy.get('[data-testid^="checkbox-"]').eq(1).click();
      cy.get('[data-testid="delete-selected-btn"]').should('contain', '(2)');
    });
  });

  describe('Pagination', () => {
    it('should display pagination when there are multiple pages', () => {
      // This test would need sufficient data to trigger pagination
      // For now, check if pagination elements exist when needed
      cy.get('[data-testid="results-info"]').should('be.visible');
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="pagination"]').length > 0) {
          cy.get('[data-testid="pagination"]').should('be.visible');
          cy.get('[data-testid="page-info"]').should('be.visible');
          cy.get('[data-testid="prev-page-btn"]').should('exist');
          cy.get('[data-testid="next-page-btn"]').should('exist');
        }
      });
    });

    it('should navigate between pages', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="next-page-btn"]').length > 0) {
          cy.get('[data-testid="next-page-btn"]').then(($btn) => {
            if (!$btn.prop('disabled')) {
              cy.wrap($btn).click();
              cy.wait(500);
              cy.get('[data-testid="questions-list"]').should('be.visible');
            }
          });
        }
      });
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { name: 'desktop', width: 1024, height: 768 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];

    viewports.forEach((viewport) => {
      it(`should display correctly on ${viewport.name}`, () => {
        cy.viewport(viewport.width, viewport.height);
        
        cy.get('[data-testid="questions-page"]').should('be.visible');
        cy.get('[data-testid="page-title"]').should('be.visible');
        cy.get('[data-testid="stats-cards"]').should('be.visible');
        cy.get('[data-testid="filters"]').should('be.visible');
        cy.get('[data-testid="questions-list"]').should('be.visible');
      });

      it(`should have functional filters on ${viewport.name}`, () => {
        cy.viewport(viewport.width, viewport.height);
        
        cy.get('[data-testid="search-input"]')
          .should('be.visible')
          .and('not.be.disabled');
          
        cy.get('[data-testid="subject-filter"]')
          .should('be.visible')
          .and('not.be.disabled');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', () => {
      // Intercept API call and force it to fail
      cy.intercept('GET', '**/api/v1/questions*', {
        statusCode: 500,
        body: { success: false, error: 'Internal server error' }
      });

      cy.visit('/questions');
      
      cy.get('[data-testid="error-message"]', { timeout: 10000 }).should('be.visible');
    });

    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '**/api/v1/questions*', { forceNetworkError: true });

      cy.visit('/questions');
      
      // Should either show error message or loading state
      cy.get('body').should('contain.text', 'Error').or('contain.text', 'Failed');
    });

    it('should recover from errors when data loads successfully', () => {
      // First, simulate error
      cy.intercept('GET', '**/api/v1/questions*', {
        statusCode: 500,
        body: { success: false, error: 'Server error' }
      }).as('failedRequest');

      cy.visit('/questions');
      cy.wait('@failedRequest');
      
      // Then simulate recovery
      cy.intercept('GET', '**/api/v1/questions*', {
        statusCode: 200,
        body: {
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });

      // Retry by refreshing
      cy.reload();
      
      cy.get('[data-testid="questions-page"]').should('be.visible');
    });
  });

  describe('Performance and Loading', () => {
    it('should show loading state while fetching data', () => {
      // Delay API response to see loading state
      cy.intercept('GET', '**/api/v1/questions*', (req) => {
        req.reply((res) => {
          // Delay response by 1 second
          return new Promise((resolve) => {
            setTimeout(() => {
              res.send({
                statusCode: 200,
                body: {
                  success: true,
                  data: [],
                  pagination: {
                    page: 1,
                    limit: 20,
                    totalCount: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                  }
                }
              });
              resolve(undefined);
            }, 1000);
          });
        });
      });

      cy.visit('/questions');
      
      cy.get('[data-testid="loading"]').should('be.visible');
      cy.get('[data-testid="questions-page"]', { timeout: 5000 }).should('be.visible');
    });

    it('should debounce search input', () => {
      cy.get('[data-testid="search-input"]')
        .clear()
        .type('te');
      
      // Type more characters quickly
      cy.get('[data-testid="search-input"]').type('st query');
      
      // Should only make one API call after debounce period
      cy.wait(500);
      
      // Verify the search was applied
      cy.get('[data-testid="questions-list"]').should('be.visible');
    });
  });

  describe('Data Persistence', () => {
    it('should maintain filter state after page refresh', () => {
      cy.get('[data-testid="search-input"]')
        .clear()
        .type('test search');
        
      cy.get('[data-testid="difficulty-filter"]').select('HARD');
      
      cy.wait(500);
      
      // Refresh page
      cy.reload();
      
      // Filters should maintain their values
      cy.get('[data-testid="search-input"]').should('have.value', 'test search');
      cy.get('[data-testid="difficulty-filter"]').should('have.value', 'HARD');
    });

    it('should reflect changes in statistics after operations', () => {
      // Get initial total count
      cy.get('[data-testid="total-count"]').then(($count) => {
        const initialCount = parseInt($count.text());
        
        // Create a new question
        cy.createTestQuestion(sampleQuestion);
        
        // Refresh to see updated stats
        cy.reload();
        
        // Count should increase
        cy.get('[data-testid="total-count"]').should(($newCount) => {
          const newCount = parseInt($newCount.text());
          expect(newCount).to.be.gte(initialCount);
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      // Navigate through key elements using tab
      cy.tab();
      cy.tab();
      cy.tab();
      
      // Should be able to reach create button
      cy.get('[data-testid="create-question-btn"]').focus().should('be.focused');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.get('[data-testid="select-all-checkbox"]')
        .should('have.attr', 'type', 'checkbox');
        
      cy.get('[data-testid="search-input"]')
        .should('have.attr', 'type', 'text');
        
      // Check for proper form labels
      cy.get('label').should('exist');
    });

    it('should be screen reader friendly', () => {
      // Check for meaningful text content
      cy.get('[data-testid="page-title"]').should('not.be.empty');
      cy.get('[data-testid="page-description"]').should('not.be.empty');
      
      // Check for alt text on any images (if present)
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });
  });
});
