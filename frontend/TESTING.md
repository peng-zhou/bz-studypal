# Testing Guide for BZ StudyPal Frontend

This document provides comprehensive information about testing in the BZ StudyPal frontend application.

## 📋 Testing Stack

### Unit Testing
- **Jest** - JavaScript testing framework
- **@testing-library/react** - Simple and complete testing utilities for React components
- **@testing-library/jest-dom** - Custom Jest matchers for DOM elements
- **@testing-library/user-event** - Fire events the same way the user does

### End-to-End Testing  
- **Cypress** - Modern web testing framework
- **@cypress/code-coverage** - Code coverage support for Cypress

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Running backend server (for E2E tests)

### Installation
All testing dependencies are included in the project. Just run:

```bash
npm install
```

## 🧪 Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (no watch, with coverage)
npm run test:ci
```

### E2E Tests
```bash
# Open Cypress Test Runner (interactive mode)
npm run e2e:open

# Run E2E tests headlessly (CI mode)
npm run e2e

# Run E2E tests in development mode
npm run test:e2e:dev
```

### All Tests
```bash
# Run both unit tests and E2E tests
npm run test:all
```

## 📁 Test Structure

```
frontend/
├── src/
│   ├── stores/
│   │   └── __tests__/
│   │       └── authStore.test.ts
│   ├── lib/
│   │   └── __tests__/
│   │       └── api.test.ts
│   └── app/
│       └── __tests__/
│           └── page.test.tsx
├── cypress/
│   ├── e2e/
│   │   ├── auth.cy.ts
│   │   └── ui.cy.ts
│   ├── support/
│   │   ├── commands.ts
│   │   └── e2e.ts
│   └── fixtures/
│       └── users.json
├── jest.config.js
├── jest.setup.js
└── cypress.config.ts
```

## ✅ Unit Testing

### What to Test
1. **Store Logic** - State management with Zustand
2. **API Functions** - HTTP client utilities
3. **Components** - UI components and their behavior
4. **Utility Functions** - Helper functions and transformations

### Best Practices

#### Testing Components
```typescript
import { render, screen } from '@testing-library/react';
import { HomePage } from '../HomePage';

describe('HomePage', () => {
  it('should render welcome message', () => {
    render(<HomePage />);
    
    expect(screen.getByText('Welcome to BZ StudyPal')).toBeInTheDocument();
  });
  
  it('should navigate to login when button is clicked', async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    
    const loginButton = screen.getByRole('button', { name: /login/i });
    await user.click(loginButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
  });
});
```

#### Testing Stores
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../authStore';

describe('useAuth store', () => {
  it('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });
});
```

#### Testing API Functions
```typescript
import { authAPI } from '../api';

jest.mock('axios');

describe('authAPI', () => {
  it('should call login endpoint with correct data', async () => {
    const mockResponse = { data: { success: true } };
    mockedAxios.post.mockResolvedValue(mockResponse);
    
    await authAPI.login({ email: 'test@example.com', password: 'pass' });
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'pass'
    });
  });
});
```

## 🔍 E2E Testing

### What to Test
1. **User Journeys** - Complete workflows from start to finish
2. **Authentication Flows** - Registration, login, logout
3. **Navigation** - Page transitions and routing
4. **Form Interactions** - Form validation and submission
5. **API Integration** - Frontend-backend communication

### Best Practices

#### Page Object Pattern
```typescript
// cypress/support/pages/LoginPage.ts
export class LoginPage {
  visit() {
    cy.visit('/auth/login');
  }
  
  fillEmail(email: string) {
    cy.get('input[name="email"]').type(email);
    return this;
  }
  
  fillPassword(password: string) {
    cy.get('input[name="password"]').type(password);
    return this;
  }
  
  submit() {
    cy.get('button[type="submit"]').click();
    return this;
  }
}

// Usage in tests
const loginPage = new LoginPage();

it('should login successfully', () => {
  loginPage
    .visit()
    .fillEmail('test@example.com')
    .fillPassword('password123')
    .submit();
    
  cy.url().should('include', '/dashboard');
});
```

#### Custom Commands
```typescript
// Use custom commands for common actions
cy.loginViaUI('test@example.com', 'password123');
cy.loginViaAPI('test@example.com', 'password123'); // Faster for test setup
cy.shouldBeAuthenticated();
cy.clearAuth();
```

#### Test Data Management
```typescript
// Use fixtures for test data
cy.fixture('users').then((users) => {
  cy.loginViaUI(users.validUser.email, users.validUser.password);
});
```

## 📊 Code Coverage

### Coverage Reports
Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools

### Coverage Thresholds
Current thresholds (configured in `jest.config.js`):
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Viewing Coverage
```bash
# Generate and view coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```

## 🔧 Configuration

### Jest Configuration
Key settings in `jest.config.js`:
```javascript
{
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts'
  ]
}
```

### Cypress Configuration
Key settings in `cypress.config.ts`:
```typescript
{
  baseUrl: 'http://localhost:3001',
  env: {
    apiUrl: 'http://localhost:8000'
  },
  viewportWidth: 1280,
  viewportHeight: 720
}
```

## 🐛 Debugging Tests

### Jest Debugging
```bash
# Run specific test file
npm test -- authStore.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="login"

# Debug mode
npm test -- --detectOpenHandles --forceExit
```

### Cypress Debugging
```bash
# Open Cypress Test Runner for interactive debugging
npm run e2e:open

# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.ts"

# Debug mode with console logs
DEBUG=cypress:* npm run e2e
```

## 🚨 Common Issues & Solutions

### Jest Issues

#### "Cannot resolve module" errors
```bash
# Clear Jest cache
npx jest --clearCache

# Check moduleNameMapper in jest.config.js
```

#### "TextEncoder is not defined"
```javascript
// Add to jest.setup.js
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
```

### Cypress Issues

#### "Cypress cannot find element"
```typescript
// Use proper waiting strategies
cy.get('[data-testid="submit"]').should('be.visible').click();

// Wait for network requests
cy.intercept('POST', '/api/auth/login').as('login');
cy.wait('@login');
```

#### "Cannot read property of undefined"
```typescript
// Use proper error handling
cy.window().its('localStorage').should('exist');
```

## 📈 Testing Metrics

### What We Measure
1. **Test Coverage** - Code coverage percentage
2. **Test Execution Time** - Performance of test suites
3. **Test Reliability** - Flaky test detection
4. **E2E Success Rate** - End-to-end test pass rate

### Goals
- **Unit Test Coverage**: >80%
- **E2E Test Coverage**: All critical user journeys
- **Test Execution Time**: <5 minutes for full suite
- **Test Reliability**: <5% flaky rate

## 🔄 CI/CD Integration

### GitHub Actions
Tests run automatically on:
- **Push** to main/develop branches
- **Pull Requests** to main/develop branches

### Test Pipeline
1. **Linting** - Code style and syntax checks
2. **Type Checking** - TypeScript compilation
3. **Unit Tests** - Jest test suite with coverage
4. **Build Test** - Application build verification
5. **E2E Tests** - Cypress test suite

### Artifacts
- Test coverage reports
- Cypress screenshots (on failure)
- Cypress videos (on failure)
- Build artifacts

## 📚 Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Cypress Documentation](https://docs.cypress.io/)

### Best Practices
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)

### Tools
- [Testing Playground](https://testing-playground.com/) - Query selector helper
- [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app) - Example app

## 🤝 Contributing

When adding new features:
1. Write unit tests for new functions/components
2. Add E2E tests for new user workflows
3. Maintain or improve test coverage
4. Update this documentation as needed

### Writing Good Tests
- **Descriptive Names** - Test names should describe behavior
- **Single Responsibility** - One test, one concept
- **Independent Tests** - Tests shouldn't depend on each other
- **Fast Execution** - Keep tests fast and focused
- **Real User Scenarios** - Test how users actually use the app

---

For questions or issues with testing, please refer to the project documentation or reach out to the development team.
