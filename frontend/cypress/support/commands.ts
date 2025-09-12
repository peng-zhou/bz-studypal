/// <reference types="cypress" />

// Custom command to select elements by data-testid
Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-testid="${value}"]`);
});

// Custom command to clear authentication data
Cypress.Commands.add('clearAuth', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});

// Custom command to login via UI
Cypress.Commands.add('loginViaUI', (email: string, password: string) => {
  cy.visit('/auth/login');
  
  // Wait for the page to load
  cy.get('input[name="email"]').should('be.visible');
  
  // Fill in the form
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  
  // Submit the form
  cy.get('button[type="submit"]').click();
  
  // Wait for successful login (redirect to dashboard)
  cy.url().should('include', '/dashboard');
  cy.contains('欢迎').should('be.visible');
});

// Custom command to login via API (faster for test setup)
Cypress.Commands.add('loginViaAPI', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/login`,
    body: {
      email,
      password,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;
    
    // Store the token in localStorage
    const { accessToken } = response.body.data.tokens;
    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', accessToken);
    });
  });
});

// Custom command to register a new user
Cypress.Commands.add('registerUser', (email: string, password: string, name: string) => {
  const timestamp = Date.now();
  const uniqueEmail = `${timestamp}-${email}`;
  
  cy.visit('/auth/register');
  
  // Wait for the page to load
  cy.get('input[name="name"]').should('be.visible');
  
  // Fill in the form
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="email"]').type(uniqueEmail);
  cy.get('select[name="preferredLanguage"]').select('zh');
  cy.get('input[name="password"]').type(password);
  cy.get('input[name="confirmPassword"]').type(password);
  
  // Submit the form
  cy.get('button[type="submit"]').click();
  
  // Wait for successful registration (redirect to dashboard)
  cy.url().should('include', '/dashboard');
  cy.contains('欢迎').should('be.visible');
  
  return cy.wrap({ email: uniqueEmail, password, name });
});

// Add custom assertions
Cypress.Commands.add('shouldBeAuthenticated', () => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('accessToken');
    expect(token).to.exist;
  });
});

Cypress.Commands.add('shouldBeUnauthenticated', () => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('accessToken');
    expect(token).to.not.exist;
  });
});

// Network request helpers
Cypress.Commands.add('interceptAuthRequests', () => {
  cy.intercept('POST', '/api/auth/login').as('loginRequest');
  cy.intercept('POST', '/api/auth/register').as('registerRequest');
  cy.intercept('POST', '/api/auth/logout').as('logoutRequest');
  cy.intercept('GET', '/api/auth/profile').as('profileRequest');
});

// Custom commands for questions management
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/auth/login`,
    body: { email, password },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 && response.body.success) {
      const { accessToken } = response.body.data.tokens;
      cy.window().then((win) => {
        win.localStorage.setItem('accessToken', accessToken);
      });
    }
  });
});

// Create a test subject for questions
Cypress.Commands.add('createTestSubject', () => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('accessToken');
    if (token) {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/api/v1/subjects`,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: {
          code: 'TEST_MATH',
          nameZh: 'Test Mathematics',
          nameEn: 'Test Mathematics',
          description: 'Test subject for E2E tests',
          color: '#FF5722'
        },
        failOnStatusCode: false
      });
    }
  });
});

// Create a test question
Cypress.Commands.add('createTestQuestion', (questionData: any) => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('accessToken');
    if (token) {
      // First, get available subjects to use one
      cy.request({
        method: 'GET',
        url: `${Cypress.env('API_URL')}/api/v1/subjects`,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        failOnStatusCode: false
      }).then((subjectsResponse) => {
        if (subjectsResponse.status === 200 && subjectsResponse.body.data.length > 0) {
          const subjectId = subjectsResponse.body.data[0].id;
          
          cy.request({
            method: 'POST',
            url: `${Cypress.env('API_URL')}/api/v1/questions`,
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: {
              ...questionData,
              subjectId
            },
            failOnStatusCode: false
          });
        }
      });
    }
  });
});

// Keyboard navigation helper
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  const el = subject ? cy.wrap(subject) : cy.focused();
  return el.trigger('keydown', { key: 'Tab' });
});

// Extend Cypress chainable interface
declare global {
  namespace Cypress {
    interface Chainable {
      shouldBeAuthenticated(): Chainable<void>;
      shouldBeUnauthenticated(): Chainable<void>;
      interceptAuthRequests(): Chainable<void>;
      login(email: string, password: string): Chainable<void>;
      createTestSubject(): Chainable<void>;
      createTestQuestion(questionData: any): Chainable<void>;
      tab(): Chainable<JQuery<HTMLElement>>;
    }
  }
}
