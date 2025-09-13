#!/bin/bash

# 服务监控脚本
# 定期检查前后端服务状态，如果服务宕机则自动重启

BACKEND_PORT=8000
FRONTEND_PORT=3000
BACKEND_DIR="/Users/pengzhou/Projects/claude/review-system/backend"
FRONTEND_DIR="/Users/pengzhou/Projects/claude/review-system/frontend"
LOG_FILE="/tmp/service-monitor.log"

# 日志函数
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    lsof -i :$port > /dev/null 2>&1
    return $?
}

# 检查服务健康状态
check_health() {
    local url=$1
    local timeout=${2:-5}
    curl -f --connect-timeout $timeout --max-time $timeout "$url" > /dev/null 2>&1
    return $?
}

# 启动后端服务
start_backend() {
    log "启动后端服务..."
    cd "$BACKEND_DIR"
    nohup npm run dev > backend.log 2>&1 &
    local pid=$!
    log "后端服务已启动，PID: $pid"
    
    # 等待服务完全启动
    for i in {1..30}; do
        sleep 1
        if check_health "http://localhost:$BACKEND_PORT/health" 3; then
            log "后端服务启动成功"
            return 0
        fi
    done
    
    log "后端服务启动失败"
    return 1
}

# 启动前端服务
start_frontend() {
    log "启动前端服务..."
    cd "$FRONTEND_DIR"
    nohup npm run dev > frontend.log 2>&1 &
    local pid=$!
    log "前端服务已启动，PID: $pid"
    
    # 等待服务完全启动
    for i in {1..60}; do
        sleep 2
        if check_port $FRONTEND_PORT; then
            log "前端服务启动成功"
            return 0
        fi
    done
    
    log "前端服务启动失败"
    return 1
}

# 停止端口上的进程
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        log "停止端口 $port 上的进程 $pid"
        kill -9 $pid 2>/dev/null
        sleep 2
    fi
}

# 检查并重启后端服务
check_backend() {
    if ! check_port $BACKEND_PORT; then
        log "后端端口 $BACKEND_PORT 未被占用，需要启动服务"
        start_backend
    elif ! check_health "http://localhost:$BACKEND_PORT/health" 5; then
        log "后端服务无响应，需要重启"
        kill_port $BACKEND_PORT
        sleep 3
        start_backend
    else
        log "后端服务运行正常"
    fi
}

# 检查并重启前端服务
check_frontend() {
    if ! check_port $FRONTEND_PORT; then
        log "前端端口 $FRONTEND_PORT 未被占用，需要启动服务"
        start_frontend
    else
        log "前端服务运行正常"
    fi
}

# 主函数
main() {
    log "======== 服务监控开始 ========"
    
    # 检查必要目录是否存在
    if [ ! -d "$BACKEND_DIR" ]; then
        log "错误：后端目录不存在 - $BACKEND_DIR"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        log "错误：前端目录不存在 - $FRONTEND_DIR"
        exit 1
    fi
    
    # 检查服务状态
    check_backend
    sleep 2
    check_frontend
    
    log "======== 服务监控完成 ========"
}

# 显示使用帮助
show_help() {
    echo "服务监控脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -s, --status   检查服务状态"
    echo "  -r, --restart  重启所有服务"
    echo "  -k, --kill     停止所有服务"
    echo "  -w, --watch    持续监控模式 (每60秒检查一次)"
    echo ""
}

# 检查服务状态
check_status() {
    echo "======== 服务状态检查 ========"
    
    if check_port $BACKEND_PORT; then
        echo "✅ 后端服务运行中 (端口 $BACKEND_PORT)"
        if check_health "http://localhost:$BACKEND_PORT/health" 3; then
            echo "   健康检查通过"
        else
            echo "   ⚠️  健康检查失败"
        fi
    else
        echo "❌ 后端服务未运行"
    fi
    
    if check_port $FRONTEND_PORT; then
        echo "✅ 前端服务运行中 (端口 $FRONTEND_PORT)"
    else
        echo "❌ 前端服务未运行"
    fi
}

# 重启所有服务
restart_all() {
    echo "======== 重启所有服务 ========"
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    sleep 3
    
    start_backend
    sleep 5
    start_frontend
}

# 停止所有服务
kill_all() {
    echo "======== 停止所有服务 ========"
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    log "所有服务已停止"
}

# 持续监控模式
watch_mode() {
    echo "======== 持续监控模式 ========"
    echo "按 Ctrl+C 退出监控"
    
    while true; do
        main
        sleep 60  # 每60秒检查一次
    done
}

# 处理命令行参数
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -s|--status)
        check_status
        exit 0
        ;;
    -r|--restart)
        restart_all
        exit 0
        ;;
    -k|--kill)
        kill_all
        exit 0
        ;;
    -w|--watch)
        watch_mode
        exit 0
        ;;
    "")
        main
        exit 0
        ;;
    *)
        echo "未知选项: $1"
        show_help
        exit 1
        ;;
esac
