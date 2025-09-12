/// <reference types="cypress" />

describe('User Authentication Flow', () => {
  beforeEach(() => {
    // Clear auth state before each test
    cy.clearAuth();
    
    // Set up API interceptors
    cy.interceptAuthRequests();
  });

  describe('Homepage', () => {
    it('should display the homepage correctly', () => {
      cy.visit('/');
      
      // Check main elements
      cy.contains('BZ StudyPal').should('be.visible');
      cy.contains('智能错题管理系统').should('be.visible');
      cy.contains('双语版MVP错题管理与复习系统').should('be.visible');
      
      // Check feature cards
      cy.contains('📚 错题管理').should('be.visible');
      cy.contains('📈 学习统计').should('be.visible');
      cy.contains('📝 复习计划').should('be.visible');
      
      // Check action buttons
      cy.contains('🔑 立即登录').should('be.visible');
      cy.contains('👤 免费注册').should('be.visible');
      
      // Check version info
      cy.contains('版本 1.0.0 - MVP 测试版').should('be.visible');
    });

    it('should navigate to login page when login button is clicked', () => {
      cy.visit('/');
      
      cy.contains('🔑 立即登录').click();
      
      cy.url().should('include', '/auth/login');
      cy.contains('用户登录').should('be.visible');
    });

    it('should navigate to register page when register button is clicked', () => {
      cy.visit('/');
      
      cy.contains('👤 免费注册').click();
      
      cy.url().should('include', '/auth/register');
      cy.contains('用户注册').should('be.visible');
    });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', () => {
      const timestamp = Date.now();
      const email = `test${timestamp}@example.com`;
      const name = `Test User ${timestamp}`;
      const password = 'TestPass123';

      cy.visit('/auth/register');
      
      // Verify form elements are visible
      cy.get('input[name="name"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('select[name="preferredLanguage"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
      
      // Fill out registration form
      cy.get('input[name="name"]').type(name);
      cy.get('input[name="email"]').type(email);
      cy.get('select[name="preferredLanguage"]').select('zh');
      cy.get('input[name="password"]').type(password);
      cy.get('input[name="confirmPassword"]').type(password);
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Wait for API call
      cy.wait('@registerRequest').its('response.statusCode').should('eq', 201);
      
      // Should redirect to dashboard after successful registration
      cy.url().should('include', '/dashboard');
      cy.contains('欢迎').should('be.visible');
      cy.contains(name).should('be.visible');
      
      // Should be authenticated
      cy.shouldBeAuthenticated();
    });

    it('should show validation errors for invalid input', () => {
      cy.visit('/auth/register');
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click();
      
      // Should still be on register page
      cy.url().should('include', '/auth/register');
      
      // Try with mismatched passwords
      cy.get('input[name="name"]').type('Test User');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('differentpassword');
      
      cy.get('button[type="submit"]').click();
      
      // Should show password mismatch error (via alert in current implementation)
      // Note: In a real app, you'd use proper form validation messages
    });

    it('should navigate to login page via link', () => {
      cy.visit('/auth/register');
      
      cy.contains('立即登录').click();
      
      cy.url().should('include', '/auth/login');
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      // Create a test user first via API
      const timestamp = Date.now();
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/auth/register`,
        body: {
          email: `testuser${timestamp}@example.com`,
          password: 'TestPass123',
          name: `Test User ${timestamp}`,
          preferredLanguage: 'zh'
        }
      }).then((response) => {
        expect(response.status).to.eq(201);
        // Store user data for login tests
        cy.wrap({
          email: `testuser${timestamp}@example.com`,
          password: 'TestPass123'
        }).as('testUser');
      });
    });

    it('should login successfully with valid credentials', function() {
      cy.visit('/auth/login');
      
      // Verify form elements
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
      
      // Fill login form
      cy.get('input[name="email"]').type(this.testUser.email);
      cy.get('input[name="password"]').type(this.testUser.password);
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Wait for API call
      cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.contains('欢迎').should('be.visible');
      
      // Should be authenticated
      cy.shouldBeAuthenticated();
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/auth/login');
      
      // Try login with invalid credentials
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      
      cy.get('button[type="submit"]').click();
      
      // Wait for failed API call
      cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);
      
      // Should show error message
      cy.contains('Invalid credentials').should('be.visible');
      
      // Should stay on login page
      cy.url().should('include', '/auth/login');
      
      // Should not be authenticated
      cy.shouldBeUnauthenticated();
    });

    it('should toggle password visibility', () => {
      cy.visit('/auth/login');
      
      const password = 'testpassword';
      cy.get('input[name="password"]').type(password);
      
      // Initially password should be hidden
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
      
      // Click toggle button
      cy.get('button').contains('👁️').click();
      
      // Password should now be visible
      cy.get('input[name="password"]').should('have.attr', 'type', 'text');
      
      // Click toggle again to hide
      cy.get('button').contains('🙈').click();
      
      // Password should be hidden again
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    });

    it('should navigate to register page via link', () => {
      cy.visit('/auth/login');
      
      cy.contains('立即注册').click();
      
      cy.url().should('include', '/auth/register');
    });
  });

  describe('Dashboard Access', () => {
    beforeEach(function() {
      // Create and login a test user
      const timestamp = Date.now();
      const testUser = {
        email: `dashtest${timestamp}@example.com`,
        password: 'TestPass123',
        name: `Dashboard Test User ${timestamp}`
      };
      
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/auth/register`,
        body: {
          ...testUser,
          preferredLanguage: 'zh'
        }
      }).then((response) => {
        expect(response.status).to.eq(201);
        const { accessToken } = response.body.data.tokens;
        
        // Store token in localStorage
        cy.window().then((win) => {
          win.localStorage.setItem('accessToken', accessToken);
        });
        
        cy.wrap(testUser).as('loggedInUser');
      });
    });

    it('should display dashboard for authenticated user', function() {
      cy.visit('/dashboard');
      
      // Should display user info
      cy.contains('欢迎').should('be.visible');
      cy.contains(this.loggedInUser.name).should('be.visible');
      
      // Should display feature cards
      cy.contains('错题管理').should('be.visible');
      cy.contains('学习统计').should('be.visible');
      cy.contains('复习计划').should('be.visible');
      
      // Should display user information section
      cy.contains('用户信息').should('be.visible');
      cy.contains(this.loggedInUser.email).should('be.visible');
      
      // Should have logout button
      cy.contains('退出登录').should('be.visible');
    });

    it('should redirect unauthenticated user to login', () => {
      // Clear authentication
      cy.clearAuth();
      
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
    });

    it('should logout successfully', function() {
      cy.visit('/dashboard');
      
      // Verify we're on dashboard first
      cy.contains('欢迎').should('be.visible');
      
      // Click logout button
      cy.contains('退出登录').click();
      
      // Wait for logout API call
      cy.wait('@logoutRequest').its('response.statusCode').should('eq', 200);
      
      // Should redirect to homepage
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      
      // Should not be authenticated
      cy.shouldBeUnauthenticated();
    });
  });

  describe('Route Protection', () => {
    it('should protect dashboard route when not authenticated', () => {
      cy.clearAuth();
      
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
    });

    it('should allow access to public routes when not authenticated', () => {
      cy.clearAuth();
      
      // Homepage should be accessible
      cy.visit('/');
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      
      // Auth pages should be accessible
      cy.visit('/auth/login');
      cy.url().should('include', '/auth/login');
      
      cy.visit('/auth/register');
      cy.url().should('include', '/auth/register');
    });
  });

  describe('Navigation Flow', () => {
    it('should complete full authentication flow', () => {
      const timestamp = Date.now();
      const testUser = {
        email: `fullflow${timestamp}@example.com`,
        password: 'TestPass123',
        name: `Full Flow User ${timestamp}`
      };
      
      // Start from homepage
      cy.visit('/');
      cy.contains('BZ StudyPal').should('be.visible');
      
      // Go to register
      cy.contains('👤 免费注册').click();
      cy.url().should('include', '/auth/register');
      
      // Register new user
      cy.get('input[name="name"]').type(testUser.name);
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('select[name="preferredLanguage"]').select('zh');
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('input[name="confirmPassword"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      
      // Should be redirected to dashboard
      cy.wait('@registerRequest');
      cy.url().should('include', '/dashboard');
      cy.contains('欢迎').should('be.visible');
      
      // Logout
      cy.contains('退出登录').click();
      cy.wait('@logoutRequest');
      
      // Should be back to homepage
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      
      // Login again
      cy.contains('🔑 立即登录').click();
      cy.url().should('include', '/auth/login');
      
      cy.get('input[name="email"]').type(testUser.email);
      cy.get('input[name="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      
      // Should be back to dashboard
      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');
      cy.contains('欢迎').should('be.visible');
    });
  });
});
