# BZ StudyPal - Smart Wrong Question Management & Review System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13+-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## Project Overview

BZ StudyPal is an intelligent wrong question management and review system designed for K12 students, featuring bilingual Chinese-English interface to help students improve academic performance through scientific wrong question review methods.

## 核心功能 | Core Features

### 🌐 多语言支持 | Multilingual Support
- 中英文双语界面切换 | Chinese-English bilingual interface switching
- 实时语言切换，无需刷新 | Real-time language switching without refresh
- 完整的内容本地化 | Complete content localization

### 🔐 用户认证 | User Authentication
- Google Gmail 一键登录 | Google Gmail one-click login
- 传统邮箱密码注册 | Traditional email password registration
- 安全的JWT Token管理 | Secure JWT token management

### 📝 错题管理 | Question Management
- 拍照录入错题 | Photo upload for wrong questions
- 富文本编辑器支持 | Rich text editor support
- 多维度分类系统 | Multi-dimensional categorization system
- 智能标签管理 | Smart tag management

### 📚 复习系统 | Review System
- 多种复习模式 | Multiple review modes
- 智能复习推荐 | Smart review recommendations
- 学习进度跟踪 | Learning progress tracking
- 详细统计分析 | Detailed statistical analysis

### ⭐ 收藏功能 | Bookmark Feature
- 一键收藏重要错题 | One-click bookmark important questions
- 收藏夹管理 | Bookmark folder management
- 收藏夹复习模式 | Bookmark folder review mode

## 技术架构 | Technology Stack

### 前端 | Frontend
- **框架**: Next.js 13+ (App Router)
- **UI库**: Material-UI (MUI) + Tailwind CSS
- **状态管理**: Zustand
- **国际化**: next-i18next
- **类型检查**: TypeScript
- **图片处理**: react-dropzone

### 后端 | Backend
- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **认证**: JWT + Google OAuth 2.0
- **文件存储**: Multer + 云存储

### 开发工具 | Development Tools
- **包管理**: pnpm
- **代码质量**: ESLint + Prettier
- **版本控制**: Git
- **API文档**: Swagger/OpenAPI

## 项目结构 | Project Structure

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

## 快速开始 | Quick Start

### 环境要求 | Prerequisites
- Node.js 18.0 或更高版本 | Node.js 18.0 or higher
- pnpm 8.0 或更高版本 | pnpm 8.0 or higher
- PostgreSQL 14.0 或更高版本 | PostgreSQL 14.0 or higher
- Redis 6.0 或更高版本 | Redis 6.0 or higher

### 安装步骤 | Installation

1. **克隆项目 | Clone the repository**
```bash
git clone <repository-url>
cd review-system
```

2. **安装依赖 | Install dependencies**
```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

3. **配置环境变量 | Configure environment variables**
```bash
# Copy environment template
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit environment variables
# Configure database connection, Google OAuth, JWT keys, etc.
```

4. **初始化数据库 | Initialize database**
```bash
cd backend
pnpm prisma migrate dev
pnpm prisma db seed
```

5. **启动开发服务器 | Start development servers**
```bash
# Start backend server
cd backend
pnpm dev

# Start frontend server in new terminal
cd frontend
pnpm dev
```

6. **访问应用 | Access the application**
- 前端应用 | Frontend: http://localhost:3000
- 后端API | Backend API: http://localhost:8000
- API文档 | API Documentation: http://localhost:8000/docs

## 开发计划 | Development Roadmap

### Phase 1 - 基础功能 | Basic Features (4周 | 4 weeks)
- [x] 项目架构搭建 | Project architecture setup
- [x] 中英文国际化配置 | Chinese-English i18n configuration
- [ ] Google OAuth 集成 | Google OAuth integration
- [ ] 用户认证系统 | User authentication system
- [ ] 错题录入功能 | Question input functionality
- [ ] 基础分类系统 | Basic categorization system

### Phase 2 - 核心功能 | Core Features (4周 | 4 weeks)
- [ ] 复习系统开发 | Review system development
- [ ] 收藏功能实现 | Bookmark functionality implementation
- [ ] 数据统计图表 | Statistical charts
- [ ] 移动端适配 | Mobile adaptation
- [ ] 后台管理系统 | Admin management system

### Phase 3 - 优化完善 | Optimization (3周 | 3 weeks)
- [ ] 性能优化 | Performance optimization
- [ ] 安全加固 | Security hardening
- [ ] 用户体验优化 | UX improvements
- [ ] 测试和文档完善 | Testing and documentation

## 贡献指南 | Contributing

欢迎贡献代码！请查看 [CONTRIBUTING.md](docs/CONTRIBUTING.md) 了解详细信息。

Welcome to contribute! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

## 许可证 | License

本项目采用 MIT 许可证。查看 [LICENSE](LICENSE) 文件了解详情。

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 联系我们 | Contact

如有问题或建议，请通过以下方式联系：

For questions or suggestions, please contact us via:

- Issues: [GitHub Issues](../../issues)
- Email: support@bzstudypal.com
- 文档 | Documentation: [项目文档](docs/)

---

**开发状态 | Development Status**: 🚧 积极开发中 | In Active Development

**最后更新 | Last Updated**: 2025-09-12
