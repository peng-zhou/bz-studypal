#!/bin/bash

# BZ StudyPal 系统测试脚本

echo "🚀 开始启动 BZ StudyPal 系统测试..."
echo "=================================="

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "📁 项目根目录: $PROJECT_ROOT"

# 检查后端目录
if [ ! -d "$PROJECT_ROOT/backend" ]; then
    echo "❌ 后端目录不存在"
    exit 1
fi

# 检查前端目录
if [ ! -d "$PROJECT_ROOT/frontend" ]; then
    echo "❌ 前端目录不存在"
    exit 1
fi

echo ""
echo "🔧 检查依赖..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi
echo "✅ npm: $(npm --version)"

echo ""
echo "🔄 启动后端服务器..."

# 启动后端服务器（后台运行）
cd "$PROJECT_ROOT/backend"
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端服务器已启动 (PID: $BACKEND_PID)"

# 等待后端启动
echo "⏳ 等待后端服务器启动..."
sleep 5

# 测试后端API
echo "🧪 测试后端API连接..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端API连接成功"
else
    echo "❌ 后端API连接失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 测试科目API
echo "🧪 测试科目API..."
SUBJECTS_RESPONSE=$(curl -s http://localhost:8000/api/v1/subjects)
if echo "$SUBJECTS_RESPONSE" | grep -q '"success":true'; then
    SUBJECTS_COUNT=$(echo "$SUBJECTS_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "✅ 科目API正常 (找到 $SUBJECTS_COUNT 个科目)"
else
    echo "❌ 科目API失败"
fi

echo ""
echo "🔄 启动前端服务器..."

# 启动前端服务器（后台运行）
cd "$PROJECT_ROOT/frontend"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端服务器已启动 (PID: $FRONTEND_PID)"

# 等待前端启动
echo "⏳ 等待前端服务器启动..."
sleep 8

# 测试前端
echo "🧪 测试前端服务器..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端服务器连接成功"
else
    echo "❌ 前端服务器连接失败"
fi

echo ""
echo "🎉 系统启动完成！"
echo "=================================="
echo "📡 前端地址: http://localhost:3000"
echo "📡 后端API: http://localhost:8000"
echo "🏥 健康检查: http://localhost:8000/health"
echo "📚 API文档: http://localhost:8000/api/v1"
echo ""
echo "📋 进程信息:"
echo "   前端PID: $FRONTEND_PID"
echo "   后端PID: $BACKEND_PID"
echo ""
echo "🛑 停止服务器请按 Ctrl+C 或运行:"
echo "   kill $FRONTEND_PID $BACKEND_PID"
echo ""
echo "📝 日志文件:"
echo "   前端日志: $PROJECT_ROOT/frontend/frontend.log"
echo "   后端日志: $PROJECT_ROOT/backend/backend.log"
echo ""
echo "⌨️  按任意键查看实时日志，或 Ctrl+C 退出..."
read -n 1 -s

# 显示实时日志
echo ""
echo "📊 实时日志 (Ctrl+C 停止):"
tail -f "$PROJECT_ROOT/frontend/frontend.log" "$PROJECT_ROOT/backend/backend.log"
