/// <reference types="cypress" />

describe('UI/UX Tests', () => {
  beforeEach(() => {
    cy.clearAuth();
  });

  describe('Responsive Design', () => {
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Large Desktop', width: 1920, height: 1080 },
    ];

    viewports.forEach((viewport) => {
      it(`should display correctly on ${viewport.name}`, () => {
        cy.viewport(viewport.width, viewport.height);
        
        cy.visit('/');
        
        // Check main elements are visible
        cy.contains('BZ StudyPal').should('be.visible');
        cy.contains('智能错题管理系统').should('be.visible');
        
        // Check buttons are accessible
        cy.contains('🔑 立即登录').should('be.visible');
        cy.contains('👤 免费注册').should('be.visible');
        
        // Check feature cards
        cy.contains('📚 错题管理').should('be.visible');
        cy.contains('📈 学习统计').should('be.visible');
        cy.contains('📝 复习计划').should('be.visible');
      });
    });

    it('should adapt navigation on mobile devices', () => {
      cy.viewport('iphone-x');
      
      cy.visit('/');
      
      // On mobile, buttons should stack vertically
      cy.get('.flex-col').should('exist');
      
      // Feature cards should stack on mobile
      cy.get('.md\\:grid-cols-3').should('exist');
    });
  });

  describe('Visual Elements', () => {
    it('should display gradient backgrounds correctly', () => {
      cy.visit('/');
      
      // Check for gradient background classes
      cy.get('.bg-gradient-to-br').should('exist');
      cy.get('.from-blue-600').should('exist');
      cy.get('.to-purple-600').should('exist');
    });

    it('should display emojis and icons properly', () => {
      cy.visit('/');
      
      // Check emojis are visible
      cy.contains('🎓').should('be.visible');
      cy.contains('📚').should('be.visible');
      cy.contains('📈').should('be.visible');
      cy.contains('📝').should('be.visible');
      cy.contains('🔑').should('be.visible');
      cy.contains('👤').should('be.visible');
    });

    it('should have proper shadows and borders', () => {
      cy.visit('/');
      
      // Check for shadow classes
      cy.get('.shadow-2xl').should('exist');
      cy.get('.shadow-lg').should('exist');
      
      // Check for rounded corners
      cy.get('.rounded-3xl').should('exist');
      cy.get('.rounded-xl').should('exist');
    });
  });

  describe('Form Interactions', () => {
    it('should provide visual feedback for form interactions on login page', () => {
      cy.visit('/auth/login');
      
      // Test input focus states
      cy.get('input[name="email"]').focus();
      cy.get('input[name="email"]').should('have.focus');
      cy.get('input[name="email"]').should('have.class', 'focus:ring-2', 'focus:ring-blue-500');
      
      // Test typing in inputs
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="email"]').should('have.value', 'test@example.com');
      
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="password"]').should('have.value', 'password123');
      
      // Test button states
      cy.get('button[type="submit"]').should('not.be.disabled');
      cy.get('button[type="submit"]').should('have.class', 'hover:bg-blue-700');
    });

    it('should provide visual feedback on registration page', () => {
      cy.visit('/auth/register');
      
      // Test all form fields
      cy.get('input[name="name"]').type('Test User').should('have.value', 'Test User');
      cy.get('input[name="email"]').type('test@example.com').should('have.value', 'test@example.com');
      
      // Test select dropdown
      cy.get('select[name="preferredLanguage"]').select('en');
      cy.get('select[name="preferredLanguage"]').should('have.value', 'en');
      
      // Test password visibility toggle
      cy.get('input[name="password"]').type('password123');
      cy.get('button').contains('👁️').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'text');
      
      cy.get('button').contains('🙈').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner on dashboard when checking auth', () => {
      cy.visit('/dashboard');
      
      // Should show loading state briefly before redirecting
      cy.get('.animate-spin').should('exist');
      cy.contains('加载中...').should('be.visible');
    });

    it('should handle button loading states', () => {
      cy.visit('/auth/login');
      
      // Fill form with invalid credentials to test loading state
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      
      cy.intercept('POST', '/api/auth/login', {
        delay: 1000,
        statusCode: 401,
        body: { success: false, error: 'Invalid credentials' }
      }).as('slowLogin');
      
      cy.get('button[type="submit"]').click();
      
      // Button should show loading state
      cy.get('button[type="submit"]').should('contain', '登录中...');
      cy.get('button[type="submit"]').should('be.disabled');
      
      cy.wait('@slowLogin');
    });
  });

  describe('Hover and Focus States', () => {
    it('should show proper hover states on interactive elements', () => {
      cy.visit('/');
      
      // Test button hover states (note: Cypress hover simulation is limited)
      cy.get('a').contains('🔑 立即登录').should('have.class', 'hover:bg-blue-700');
      cy.get('a').contains('👤 免费注册').should('have.class', 'hover:bg-blue-50');
    });

    it('should provide proper focus indicators for accessibility', () => {
      cy.visit('/auth/login');
      
      // Tab through form elements
      cy.get('input[name="email"]').focus();
      cy.get('input[name="email"]').should('have.focus');
      
      cy.get('input[name="email"]').tab();
      cy.get('input[name="password"]').should('have.focus');
      
      cy.get('input[name="password"]').tab();
      cy.focused().should('not.have.attr', 'name', 'password');
    });
  });

  describe('Color Scheme and Typography', () => {
    it('should use consistent color scheme', () => {
      cy.visit('/');
      
      // Check for consistent blue color usage
      cy.get('.text-blue-600').should('exist');
      cy.get('.bg-blue-600').should('exist');
      cy.get('.border-blue-600').should('exist');
      
      // Check for consistent text colors
      cy.get('.text-gray-600').should('exist');
      cy.get('.text-gray-900').should('exist');
    });

    it('should use proper typography hierarchy', () => {
      cy.visit('/');
      
      // Check heading sizes
      cy.get('h1').should('have.class', 'text-6xl');
      cy.get('h2').should('have.class', 'text-2xl');
      cy.get('h3').should('have.class', 'text-xl');
      
      // Check font weights
      cy.get('h1').should('have.class', 'font-bold');
      cy.get('h3').should('have.class', 'font-semibold');
    });
  });

  describe('Layout and Spacing', () => {
    it('should have consistent spacing between elements', () => {
      cy.visit('/');
      
      // Check for consistent margin/padding classes
      cy.get('.mb-12').should('exist');
      cy.get('.mb-8').should('exist');
      cy.get('.mb-4').should('exist');
      cy.get('.p-8').should('exist');
      cy.get('.px-8').should('exist');
      cy.get('.py-4').should('exist');
    });

    it('should center content properly', () => {
      cy.visit('/');
      
      // Check for centering classes
      cy.get('.mx-auto').should('exist');
      cy.get('.justify-center').should('exist');
      cy.get('.items-center').should('exist');
      cy.get('.text-center').should('exist');
    });
  });

  describe('Animation and Transitions', () => {
    it('should have smooth transitions on interactive elements', () => {
      cy.visit('/');
      
      // Check for transition classes
      cy.get('.transition-colors').should('exist');
      cy.get('.duration-200').should('exist');
    });

    it('should have backdrop blur effects', () => {
      cy.visit('/');
      
      // Check for backdrop blur
      cy.get('.backdrop-blur-sm').should('exist');
    });
  });

  describe('Error State Handling', () => {
    it('should display error messages with proper styling', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { success: false, error: 'Invalid credentials' }
      }).as('loginError');
      
      cy.visit('/auth/login');
      
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginError');
      
      // Check error styling
      cy.get('.bg-red-100').should('exist');
      cy.get('.border-red-400').should('exist');
      cy.get('.text-red-700').should('exist');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and semantic HTML', () => {
      cy.visit('/');
      
      // Check for semantic HTML elements
      cy.get('main').should('exist');
      cy.get('h1').should('exist');
      cy.get('h2').should('exist');
      cy.get('h3').should('exist');
      
      // Check for proper link attributes
      cy.get('a[href="/auth/login"]').should('exist');
      cy.get('a[href="/auth/register"]').should('exist');
    });

    it('should have proper form labels', () => {
      cy.visit('/auth/login');
      
      // Check form labels are associated with inputs
      cy.get('label[for="email"]').should('exist');
      cy.get('label[for="password"]').should('exist');
      cy.get('input#email').should('exist');
      cy.get('input#password').should('exist');
    });

    it('should support keyboard navigation', () => {
      cy.visit('/');
      
      // Test keyboard navigation with Tab
      cy.get('body').tab();
      cy.focused().should('have.attr', 'href', '/auth/login');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'href', '/auth/register');
    });
  });
});
