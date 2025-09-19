# CI/CD流程使用指南

本文档介绍BZ StudyPal项目的完整CI/CD流程，包括使用方法、最佳实践和故障排除。

## 🚀 CI/CD流程概述

我们的CI/CD流程包含以下阶段：

1. **代码检查** - 代码质量、格式化、类型检查
2. **自动化测试** - 单元测试、集成测试、E2E测试
3. **安全扫描** - 依赖漏洞检查、容器安全扫描
4. **构建镜像** - Docker镜像构建和推送
5. **自动部署** - 部署到staging/production环境
6. **健康检查** - 部署后验证和监控

## 📋 工作流程文件

### 1. 后端测试工作流 (`.github/workflows/backend-tests.yml`)

**触发条件:**
- Push到 `main` 或 `develop` 分支时backend目录有变更
- Pull Request到 `main` 或 `develop` 分支时backend目录有变更

**包含的检查:**
- TypeScript类型检查
- Jest单元测试和集成测试
- API端点测试
- 依赖安全扫描
- 构建测试

### 2. 前端测试工作流 (`.github/workflows/frontend-tests.yml`)

**触发条件:**
- Push到 `main` 或 `develop` 分支时frontend目录有变更
- Pull Request到 `main` 或 `develop` 分支时frontend目录有变更

**包含的检查:**
- ESLint代码检查
- Jest单元测试
- Cypress E2E测试
- Next.js构建测试
- TypeScript类型检查

### 3. 部署工作流 (`.github/workflows/deploy.yml`)

**触发条件:**
- Push到 `main` 分支（自动部署到生产环境）
- 手动触发（可选择staging或production环境）

**部署步骤:**
1. 运行所有测试
2. 构建Docker镜像
3. 安全扫描
4. 推送到容器注册表
5. 部署到服务器
6. 健康检查
7. 通知

## 🛠️ 本地开发工作流

### 开发分支策略

```bash
main           # 生产环境，受保护
  ├── develop  # 开发环境，集成分支
  ├── feature/user-auth    # 功能分支
  ├── feature/question-mgmt
  └── hotfix/critical-bug  # 热修复分支
```

### 提交代码流程

1. **创建功能分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **开发和测试**
   ```bash
   # 在backend目录
   cd backend
   npm run test
   npm run build
   
   # 在frontend目录  
   cd ../frontend
   npm run test:ci
   npm run build
   npm run lint
   ```

3. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add user authentication system"
   git push origin feature/your-feature-name
   ```

4. **创建Pull Request**
   - 目标分支选择 `develop`
   - 填写详细的PR描述
   - 等待CI检查通过
   - 代码评审

5. **合并到主分支**
   ```bash
   # 合并到develop进行集成测试
   git checkout develop
   git merge feature/your-feature-name
   
   # 准备发布时合并到main
   git checkout main
   git merge develop
   git push origin main  # 触发生产部署
   ```

## 🔧 环境配置

### 开发环境

```bash
# 启动本地开发服务器
npm run dev          # 前端 (http://localhost:3000)
cd backend && npm run dev  # 后端 (http://localhost:8000)

# 或使用Docker Compose
docker-compose -f docker-compose.dev.yml up
```

### 测试环境变量

在本地运行测试前，确保设置了必要的环境变量：

```bash
# backend/.env.test
NODE_ENV=test
DATABASE_URL=file:./test.db
JWT_SECRET=test-jwt-secret
REFRESH_TOKEN_SECRET=test-refresh-secret

# frontend/.env.test.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📊 监控和健康检查

### 使用健康检查脚本

```bash
# 检查本地开发环境
./scripts/health-check.sh --env development

# 检查生产环境
./scripts/health-check.sh --env production --url https://yourdomain.com

# 详细输出
./scripts/health-check.sh --env production --verbose
```

### 持续监控

```bash
# 启动持续监控
./scripts/monitor.sh --env production --persistent --webhook YOUR_SLACK_WEBHOOK

# 自定义监控参数
./scripts/monitor.sh \
  --env production \
  --interval 60 \
  --threshold 5 \
  --url https://yourdomain.com \
  --persistent
```

## 🚀 部署流程

### 自动部署

**生产环境部署:**
- Push到 `main` 分支自动触发
- 包含完整的测试、构建、部署流程
- 自动进行健康检查和通知

**Staging环境部署:**
```bash
# 在GitHub Actions页面手动触发deploy工作流
# 或使用GitHub CLI
gh workflow run deploy.yml -f environment=staging
```

### 手动部署

```bash
# 使用部署脚本
./scripts/deploy.sh --env production --tag v1.2.3

# 跳过测试的快速部署（不推荐用于生产环境）
./scripts/deploy.sh --env staging --skip-tests

# 预览部署（不实际执行）
./scripts/deploy.sh --env production --dry-run
```

## 🔒 安全最佳实践

### GitHub Secrets管理

**必需的Secrets:**
```bash
# 生产环境
JWT_SECRET                    # JWT签名密钥
REFRESH_TOKEN_SECRET         # 刷新令牌密钥
GOOGLE_CLIENT_ID            # Google OAuth客户端ID
GOOGLE_CLIENT_SECRET        # Google OAuth客户端密钥
PRODUCTION_HOST             # 生产服务器地址
PRODUCTION_USER             # SSH用户名
PRODUCTION_SSH_KEY          # SSH私钥
PRODUCTION_URL              # 生产环境URL

# 通知（可选）
SLACK_WEBHOOK_URL           # Slack通知webhook
```

### 密钥轮换策略

1. **JWT密钥:** 每6个月轮换
2. **SSH密钥:** 每年轮换或人员变动时
3. **OAuth密钥:** 仅在泄露时轮换
4. **数据库密钥:** 每季度轮换

## 🐛 故障排除

### 常见CI/CD问题

#### 1. 测试失败

```bash
# 本地重现问题
cd backend && npm run test:coverage
cd frontend && npm run test:ci

# 查看详细错误日志
npm run test -- --verbose
```

#### 2. 构建失败

```bash
# 检查依赖
npm audit
npm outdated

# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 3. 部署失败

```bash
# 检查服务器连接
ssh user@your-server.com

# 查看容器日志
docker-compose -f docker-compose.prod.yml logs

# 回滚到上一版本
./scripts/deploy.sh --rollback previous-tag
```

#### 4. 健康检查失败

```bash
# 详细健康检查
./scripts/health-check.sh --env production --verbose

# 检查具体服务
curl -f https://yourdomain.com/health
curl -f https://api.yourdomain.com/health/db
```

### 性能问题诊断

```bash
# 检查系统资源
./scripts/monitor.sh --env production

# 查看容器资源使用
docker stats

# 检查数据库性能
docker-compose exec backend npm run db:query -- "EXPLAIN QUERY PLAN SELECT * FROM questions;"
```

## 📈 性能优化

### CI/CD优化建议

1. **并行化测试**
   - 将测试拆分为更小的任务
   - 使用GitHub Actions矩阵策略

2. **缓存优化**
   - 使用npm缓存
   - Docker层缓存
   - 测试结果缓存

3. **构建优化**
   - 多阶段Docker构建
   - 依赖预安装
   - 增量构建

### 部署优化

1. **零停机部署**
   - 蓝绿部署策略
   - 滚动更新
   - 健康检查集成

2. **资源优化**
   - 容器资源限制
   - 数据库连接池
   - 静态资源CDN

## 🔄 回滚策略

### 自动回滚

部署脚本包含自动回滚功能：

```bash
# 部署失败时会自动提示回滚选项
./scripts/deploy.sh --env production

# 手动回滚到指定版本
./scripts/deploy.sh --env production --rollback v1.1.0
```

### 数据库回滚

```bash
# 查看迁移历史
docker-compose exec backend npm run db:migrate status

# 回滚迁移
docker-compose exec backend npm run db:migrate rollback
```

## 📚 相关文档

- [部署设置指南](./deployment-setup.md) - 详细的服务器配置说明
- [开发指南](../WARP.md) - 项目架构和开发流程
- [API文档](./api-docs.md) - API端点说明
- [数据库文档](./database-schema.md) - 数据库结构说明

## 💡 提示和技巧

### 提高开发效率

1. **使用pre-commit hooks**
   ```bash
   cd frontend
   npm run prepare  # 安装Husky hooks
   ```

2. **本地Docker开发**
   ```bash
   # 使用开发版Docker配置
   docker-compose -f docker-compose.dev.yml up
   ```

3. **快速测试**
   ```bash
   # 只运行特定测试文件
   npm run test -- auth.test.ts
   
   # 监听模式测试
   npm run test:watch
   ```

### 监控最佳实践

1. **设置合理的告警阈值**
2. **使用多种监控指标**
3. **定期检查和更新监控脚本**
4. **建立值班机制**

记住：良好的CI/CD流程是持续改进的过程。随着项目的发展，不断优化和调整流程以适应新的需求。