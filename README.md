# BZ StudyPal - Smart Wrong Question Management & Review System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13+-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## Project Overview

BZ StudyPal is an intelligent wrong question management and review system designed for K12 students, featuring bilingual Chinese-English interface to help students improve academic performance through scientific wrong question review methods.

## Core Features

### 🌐 Multilingual Support
- Chinese-English bilingual interface switching
- Real-time language switching without refresh
- Complete content localization

### 🔐 User Authentication
- Google Gmail one-click login
- Traditional email password registration
- Secure JWT token management

### 📝 Question Management
- Photo upload for wrong questions
- Rich text editor support
- Multi-dimensional categorization system
- Smart tag management

### 📚 Review System
- Multiple review modes
- Smart review recommendations
- Learning progress tracking
- Detailed statistical analysis

### ⭐ Bookmark Feature
- One-click bookmark important questions
- Bookmark folder management
- Bookmark folder review mode

## Technology Stack

### Frontend
- **Framework**: Next.js 13+ (App Router)
- **UI Library**: Material-UI (MUI) + Tailwind CSS
- **State Management**: Zustand
- **Internationalization**: next-i18next
- **Type Checking**: TypeScript
- **Image Processing**: react-dropzone

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT + Google OAuth 2.0
- **File Storage**: Multer + Cloud Storage

### Development Tools
- **Package Manager**: pnpm
- **Code Quality**: ESLint + Prettier
- **Version Control**: Git
- **API Documentation**: Swagger/OpenAPI

## Project Structure

```
review-system/
├── frontend/              # Next.js Frontend Application
│   ├── src/
│   │   ├── app/          # App Router Routes
│   │   ├── components/   # Reusable Components
│   │   ├── hooks/        # Custom Hooks
│   │   ├── lib/          # Utility Functions
│   │   ├── store/        # State Management
│   │   └── types/        # TypeScript Types
│   ├── public/           # Static Assets
│   ├── i18n/            # Internationalization Config
│   └── package.json
├── backend/              # Express.js Backend API
│   ├── src/
│   │   ├── controllers/  # Controllers
│   │   ├── models/       # Data Models
│   │   ├── routes/       # Route Definitions
│   │   ├── middlewares/  # Middlewares
│   │   ├── utils/        # Utility Functions
│   │   └── config/       # Configuration Files
│   ├── prisma/          # Database Schema
│   └── package.json
├── docs/                # Project Documentation
├── assets/              # Shared Resources
└── README.md           # Project Description
```

## Quick Start

### Prerequisites
- Node.js 18.0 or higher
- pnpm 8.0 or higher
- PostgreSQL 14.0 or higher
- Redis 6.0 or higher

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd review-system
```

2. **Install dependencies**
```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

3. **Configure environment variables**
```bash
# Copy environment template
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit environment variables
# Configure database connection, Google OAuth, JWT keys, etc.
```

4. **Initialize database**
```bash
cd backend
pnpm prisma migrate dev
pnpm prisma db seed
```

5. **Start development servers**
```bash
# Start backend server
cd backend
pnpm dev

# Start frontend server in new terminal
cd frontend
pnpm dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development Roadmap

### Phase 1 - Basic Features (4 weeks)
- [x] Project architecture setup
- [x] Chinese-English i18n configuration
- [ ] Google OAuth integration
- [ ] User authentication system
- [ ] Question input functionality
- [ ] Basic categorization system

### Phase 2 - Core Features (4 weeks)
- [ ] Review system development
- [ ] Bookmark functionality implementation
- [ ] Statistical charts
- [ ] Mobile adaptation
- [ ] Admin management system

### Phase 3 - Optimization (3 weeks)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] UX improvements
- [ ] Testing and documentation

## Contributing

Welcome to contribute! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or suggestions, please contact us via:

- Issues: [GitHub Issues](../../issues)
- Email: support@bzstudypal.com
- Documentation: [Project Documentation](docs/)

---

**Development Status**: 🚧 In Active Development

**Last Updated**: 2025-09-12
