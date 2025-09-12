# Create and Edit Question Function Testing Guide

## Overview

This guide covers the comprehensive test suite added for the create and edit functions of the question management system, including unit tests and end-to-end tests.

## Test File Structure

```
frontend/
├── src/app/questions/__tests__/
│   ├── page.test.tsx                    # Original comprehensive unit tests
│   └── page.createEdit.test.tsx         # New: Dedicated unit tests for create/edit functions
└── cypress/e2e/
    ├── questions.cy.ts                  # Original comprehensive E2E tests
    └── questions-createEdit.cy.ts       # New: Dedicated E2E tests for create/edit functions
```

## Unit Tests (Jest + React Testing Library)

### New Test File: `page.createEdit.test.tsx`

**Test Coverage:**
- ✅ Create question modal open/close
- ✅ Form field validation (required field checks)
- ✅ Complete successful question creation flow
- ✅ API error handling
- ✅ Edit question modal open/close
- ✅ Form data pre-population
- ✅ Complete successful question update flow
- ✅ Special handling of mastery level field (only shown during edit)
- ✅ Form field interactions (difficulty, error type, etc. options)
- ✅ Data refresh mechanism (auto-refresh list and stats after create/update)

### Running Unit Tests

```bash
# Run all unit tests for questions page
npm test -- --testPathPatterns=questions

# Run only create/edit function unit tests
npm test -- --testPathPatterns=page.createEdit.test.tsx

# Run in verbose mode
npm test -- --testPathPatterns=page.createEdit.test.tsx --verbose
```

## End-to-End Tests (Cypress)

### New Test File: `questions-createEdit.cy.ts`

**Test Coverage:**
- ✅ Authentication state management
- ✅ Complete user flow for creating questions
- ✅ Form validation (frontend validation)
- ✅ API interactions (mock success and error scenarios)
- ✅ Complete user flow for editing questions
- ✅ Form data pre-population validation
- ✅ Mastery level update functionality
- ✅ User experience testing (loading states, form reset, etc.)
- ✅ Keyboard navigation support
- ✅ Data persistence and refresh

### Running End-to-End Tests

```bash
# Start Cypress test runner
npm run cypress:open

# Run specific test file
npx cypress run --spec "cypress/e2e/questions-createEdit.cy.ts"

# Run all question-related E2E tests
npx cypress run --spec "cypress/e2e/questions*.cy.ts"
```

## Test Environment Setup

### Prerequisites

1. **Backend server running**:
   ```bash
   cd backend
   node start-server.js  # Simplified API server running on port 8000
   ```

2. **Frontend development server running**:
   ```bash
   cd frontend
   npm run dev  # Frontend app running on port 3002
   ```

3. **Authentication setup** (for manual testing):
   Visit `http://localhost:3002/set-auth.html` to set test authentication info

## Test Features

### Unit Test Features

- **Mock API calls**: Use Jest to mock all API requests
- **Component isolation**: Mock AppLayout and other dependency components
- **User interaction simulation**: Use @testing-library/user-event to simulate real user operations
- **Async operation testing**: Properly handle Promise and async/await
- **Error boundary testing**: Verify error handling logic

### E2E Test Features

- **Real browser environment**: Run tests in actual browser
- **API interception**: Use Cypress to intercept and mock API calls
- **User flow validation**: Test complete user operation sequences
- **UI interaction testing**: Verify modals, forms, buttons, and other UI elements
- **Responsive testing**: Verify performance across different screen sizes

## Test Data

### Mock Data Structure

```javascript
// Test subject data
const mockSubjects = [
  {
    id: 'subject-1',
    code: 'MATH',
    nameZh: 'Mathematics',
    nameEn: 'Mathematics',
    color: '#2196F3',
    order: 1
  }
];

// Test question data
const mockQuestion = {
  id: 'question-1',
  title: 'Quadratic Equation Solving',
  content: 'Solve equation x² + 2x - 3 = 0',
  myAnswer: 'x = 1 or x = -2',
  correctAnswer: 'x = 1 or x = -3',
  explanation: 'Using factorization: (x+3)(x-1) = 0',
  subjectId: 'subject-1',
  difficulty: 'MEDIUM',
  masteryLevel: 'NOT_MASTERED',
  // ...other fields
};
```

## Key Test Scenarios

### 1. Successful Question Creation Flow
1. Click "Add Question" button
2. Fill required fields (content, my answer, correct answer, subject)
3. Optionally fill other fields (title, explanation, difficulty, etc.)
4. Click "Create" button
5. Verify API call is correct
6. Verify modal closes
7. Verify data refresh

### 2. Successful Question Edit Flow
1. Click question's "Edit" button
2. Verify form pre-population with existing data
3. Modify fields (especially mastery level)
4. Click "Save" button
5. Verify API call is correct
6. Verify modal closes
7. Verify data refresh

### 3. Form Validation Scenarios
- Validation when required fields are empty
- Handling of long text input
- Correct display of dropdown options
- Form reset functionality

### 4. Error Handling Scenarios
- Handling API call failures
- Handling network errors
- Displaying validation errors
- User-friendly error messages

## Test Statistics

- **Unit Tests**: 16 test cases covering core create and edit functionality
- **E2E Tests**: 20+ test cases covering complete user interaction flows
- **Test Coverage**: Includes form validation, API interaction, user experience, error handling, etc.

## Continuous Integration Recommendations

1. **Run tests in CI/CD pipeline**
2. **Code coverage reports**
3. **Test result notifications**
4. **Automatic retry mechanism for failed tests**

## Troubleshooting

### Common Issues

1. **Test timeouts**:
   - Check if API server is running
   - Increase waitFor timeout duration
   - Ensure async operations are handled correctly

2. **Element not found**:
   - Verify data-testid attributes
   - Check component rendering timing
   - Ensure DOM structure is correct

3. **API mock failures**:
   - Check interceptor path matching
   - Verify request parameter format
   - Ensure response data structure

This test system ensures the reliability, user experience quality, and long-term maintainability of the create and edit question functionality.
