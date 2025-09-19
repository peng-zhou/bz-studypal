# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

BZ StudyPal is a bilingual (Chinese/English) wrong question management and review system built with modern web technologies. It helps K12 students track, categorize, and review their mistakes to improve academic performance.

## Development Commands

### Backend (Express.js + Prisma + SQLite)
```bash
cd backend

# Development
npm run dev           # Start dev server with nodemon
npm run dev:watch     # Alternative dev command

# Database
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run database migrations
npm run db:push       # Push schema changes to database
npm run db:seed       # Seed database with initial data

# Testing
npm test              # Run Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:subjects # Run specific subject tests

# Build & Production
npm run build         # Build TypeScript to JavaScript
npm start             # Start production server (requires build)
```

### Frontend (Next.js 15 + Tailwind CSS)
```bash
cd frontend

# Development
npm run dev           # Start Next.js dev server with Turbopack
npm run dev:no-turbo  # Start Next.js dev server without Turbopack

# Testing
npm test              # Run Jest unit tests
npm run test:watch    # Run Jest in watch mode
npm run test:coverage # Run tests with coverage
npm run test:ci       # Run tests for CI
npm run test:unit     # Run unit tests only
npm run cypress:open  # Open Cypress for e2e testing
npm run cypress:run   # Run Cypress e2e tests headlessly
npm run test:all      # Run both unit and e2e tests

# Code Quality
npm run lint          # Run ESLint
npm run lint:check    # Check lint without fixing
npm run lint:fix      # Fix lint issues
npm run format:check  # Check Prettier formatting
npm run format:write  # Apply Prettier formatting
npm run type-check    # Run TypeScript type checking
npm run pre-commit    # Run pre-commit checks

# Build & Production
npm run build         # Build for production
npm start             # Start production server
```

### Development Scripts
```bash
# Start backend development server (with logging)
bash scripts/dev-run.sh

# Monitor both services
bash monitor-services.sh

# Test API endpoints
bash simple-api-test.sh
```

## Architecture Overview

### High-Level Structure
This is a full-stack TypeScript application with clear separation between frontend and backend:

- **Frontend**: Next.js 15 with App Router, Tailwind CSS, and Zustand state management
- **Backend**: Express.js REST API with Prisma ORM and SQLite database
- **Authentication**: JWT-based auth with Google OAuth 2.0 support
- **Database**: SQLite with comprehensive Prisma schema

### Key Architectural Patterns

#### Backend Architecture
- **MVC Pattern**: Controllers handle business logic, routes define endpoints, middleware handles cross-cutting concerns
- **Prisma ORM**: Type-safe database access with schema-first approach
- **JWT Authentication**: Stateless authentication with access/refresh token pattern
- **Middleware Stack**: Authentication, validation, rate limiting, security headers
- **Error Handling**: Centralized error handling with structured responses

#### Frontend Architecture
- **App Router**: Next.js 15's file-based routing system
- **Zustand State Management**: Lightweight state management for authentication
- **Component Architecture**: Reusable components with TypeScript interfaces
- **API Layer**: Centralized API client with Axios interceptors
- **Form Handling**: React Hook Form with Yup validation

### Database Schema Design
The Prisma schema includes these core entities:
- **User**: Authentication, profiles, roles (STUDENT/TEACHER/PARENT/ADMIN)
- **Question**: Wrong questions with images, categorization, mastery tracking  
- **Subject**: Academic subjects with bilingual names and categorization
- **Review**: Review sessions with performance tracking
- **Bookmark/BookmarkFolder**: Question bookmarking system
- **UserSession**: JWT refresh token management

### Authentication Flow
1. **Registration/Login**: Traditional email/password or Google OAuth
2. **JWT Tokens**: Short-lived access tokens (15m) + long-lived refresh tokens (7d)
3. **Middleware Protection**: Route-level authentication with role-based access
4. **Frontend State**: Zustand store with persistent authentication state
5. **Token Refresh**: Automatic token refresh on API calls

### State Management Architecture
- **Zustand Auth Store**: Handles authentication state, token management, user data
- **Local Storage**: Persists tokens and user information across sessions
- **API Integration**: Automatic token injection and refresh handling
- **Error Boundaries**: Graceful error handling and user feedback

### API Structure
RESTful API with versioned endpoints:
- `/api/auth/*` - Authentication endpoints
- `/api/v1/questions/*` - Question management
- `/api/v1/subjects/*` - Subject management  
- `/api/v1/bookmarks/*` - Bookmark management (planned)
- `/api/v1/reviews/*` - Review system (planned)

### File Upload Strategy
- **Multer Integration**: Handle question image uploads
- **File Validation**: Size, type, and security checks
- **Storage**: Local filesystem with URL generation
- **User Isolation**: Files organized by user ID for security

## Development Guidelines

### Working with the Database
- Always run `npm run db:generate` after schema changes
- Use `npm run db:migrate` for production-ready schema changes
- Use `npm run db:push` for development schema experimentation
- The database file is at `backend/prisma/dev.db` (SQLite)

### Authentication Testing
- Use the test script: `bash simple-api-test.sh`
- Check auth status: `GET /api/auth/status`
- Health checks available at: `GET /health` and `GET /health/db`

### API Development Patterns
- Controllers use async/await with proper error handling
- Validation uses express-validator with structured error responses
- Responses follow consistent format: `{ success: boolean, data?: any, error?: string }`
- Protected routes require authentication middleware
- Pagination and filtering built into list endpoints

### Frontend Development Patterns
- Components use TypeScript interfaces for props
- Forms use React Hook Form with Yup validation
- API calls go through centralized API client (`lib/api.ts`)
- State management via Zustand with persistence
- Responsive design with Tailwind CSS utilities

### Testing Strategy
- Backend: Jest with Supertest for API integration tests
- Frontend: Jest + Testing Library for unit tests, Cypress for e2e
- Database: In-memory SQLite for test isolation
- Mocking: Controllers and external services mocked in tests

### Code Quality Tools
- **TypeScript**: Strict type checking across frontend and backend
- **ESLint**: Code linting with project-specific rules
- **Prettier**: Code formatting with consistent style
- **Pre-commit hooks**: Automated quality checks before commits

## Common Development Tasks

### Adding New API Endpoints
1. Create controller function in `backend/src/controllers/`
2. Add validation rules using express-validator
3. Define routes in `backend/src/routes/`
4. Add to main router in `backend/src/index.ts`
5. Write tests in `backend/tests/controllers/`

### Adding New Frontend Pages
1. Create page in `frontend/src/app/` (App Router)
2. Add components in `frontend/src/components/`
3. Update navigation if needed
4. Add API integration via `frontend/src/lib/api.ts`
5. Write tests in `frontend/src/__tests__/`

### Database Schema Changes
1. Modify `backend/prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma client
3. Run `npm run db:migrate` to create migration
4. Update TypeScript types if needed
5. Test with seed data using `npm run db:seed`

### Running Single Tests
```bash
# Backend specific test
cd backend && npm run test:subjects

# Frontend specific test  
cd frontend && npm run test:unit

# Single test file
cd backend && npx jest subjects.test.ts
```

## Environment Setup

### Required Environment Variables
Backend (`.env`):
- `DATABASE_URL` - SQLite database path
- `JWT_SECRET` - JWT signing secret
- `REFRESH_TOKEN_SECRET` - Refresh token secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `CORS_ORIGIN` - Frontend URL for CORS

Frontend (`.env.local`):
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID

### Port Configuration
- Backend: http://localhost:8000
- Frontend: http://localhost:3000 (or 3001 as configured)
- Health checks: http://localhost:8000/health

## Project Status
Currently in MVP phase with complete authentication system. Core features for question management, subjects, and reviews are partially implemented. Ready for business logic development.