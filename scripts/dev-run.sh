#!/bin/bash

# BZ StudyPal 后端开发服务器启动脚本
# 使用稳定的方式启动，避免 TTY 阻塞问题

set -e

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
LOG_FILE="/tmp/bz-studypal-backend.log"

echo "🚀 BZ StudyPal 后端服务器启动脚本"
echo "================================="
echo "项目根目录: $PROJECT_ROOT"
echo "后端目录: $BACKEND_DIR"
echo "日志文件: $LOG_FILE"

# 检查后端目录
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ 错误: 后端目录不存在: $BACKEND_DIR"
    exit 1
fi

# 检查 package.json
if [ ! -f "$BACKEND_DIR/package.json" ]; then
    echo "❌ 错误: package.json 不存在"
    exit 1
fi

cd "$BACKEND_DIR"

# 停止现有进程
echo "🛑 停止现有的后端进程..."
pkill -f "nodemon.*src/index.ts" 2>/dev/null || true
pkill -f "ts-node.*src/index.ts" 2>/dev/null || true

# 等待进程完全停止
sleep 2

# 检查端口是否被占用
if lsof -i :8000 >/dev/null 2>&1; then
    echo "⚠️  端口 8000 仍被占用，尝试释放..."
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 启动服务器
echo "▶️  启动开发服务器..."
echo "📄 日志输出到: $LOG_FILE"
echo ""

# 使用 nohup 和重定向避免 TTY 问题
nohup npm run dev >"$LOG_FILE" 2>&1 </dev/null &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待服务器启动中..."
for i in {1..30}; do
    if grep -q "BZ StudyPal API Server is running" "$LOG_FILE" 2>/dev/null; then
        echo "✅ 服务器启动成功! PID: $SERVER_PID"
        echo "🌐 服务器地址: http://localhost:8000"
        echo "🏥 健康检查: http://localhost:8000/health" 
        echo "📊 API文档: http://localhost:8000/api/v1"
        echo "📄 实时日志: tail -f $LOG_FILE"
        echo ""
        
        # 快速健康检查
        echo "🔍 执行健康检查..."
        if curl -s --max-time 3 http://localhost:8000/health >/dev/null 2>&1; then
            echo "✅ 健康检查通过"
        else
            echo "⚠️  健康检查失败，请检查日志"
        fi
        
        echo ""
        echo "💡 命令提示:"
        echo "   查看日志: tail -f $LOG_FILE"
        echo "   停止服务: kill $SERVER_PID"
        echo "   API测试: bash $PROJECT_ROOT/simple-api-test.sh"
        
        exit 0
    fi
    
    # 检查进程是否还在运行
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "❌ 服务器进程意外退出"
        echo "📄 最后几行日志:"
        tail -10 "$LOG_FILE" 2>/dev/null || echo "无法读取日志"
        exit 1
    fi
    
    sleep 1
    echo -n "."
done

echo ""
echo "❌ 服务器启动超时"
echo "📄 最后几行日志:"
tail -10 "$LOG_FILE" 2>/dev/null || echo "无法读取日志"
exit 1
