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

// Extend Cypress chainable interface
declare global {
  namespace Cypress {
    interface Chainable {
      shouldBeAuthenticated(): Chainable<void>;
      shouldBeUnauthenticated(): Chainable<void>;
      interceptAuthRequests(): Chainable<void>;
    }
  }
}
