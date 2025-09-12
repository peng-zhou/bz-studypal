// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add global configurations
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // for uncaught exceptions that we expect (like navigation errors)
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Add viewport commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-testid attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Custom command to login via UI
       * @example cy.loginViaUI('user@example.com', 'password')
       */
      loginViaUI(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to login via API (faster for setup)
       * @example cy.loginViaAPI('user@example.com', 'password')
       */
      loginViaAPI(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to register a new user
       * @example cy.registerUser('user@example.com', 'password', 'Test User')
       */
      registerUser(email: string, password: string, name: string): Chainable<void>;
      
      /**
       * Custom command to clear local storage and cookies
       * @example cy.clearAuth()
       */
      clearAuth(): Chainable<void>;
    }
  }
}
