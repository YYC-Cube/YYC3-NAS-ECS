#!/bin/bash
# quick-stop.sh - 快速停止脚本
# 用途：一键停止所有服务

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

log "=========================================="
log "YYC³ 停止所有服务"
log "=========================================="

# 1. 停止前端
if [ -f "${BASE_DIR}/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "${BASE_DIR}/logs/frontend.pid")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        log "停止前端服务 (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID"
    fi
    rm -f "${BASE_DIR}/logs/frontend.pid"
fi

# 2. 停止邮件服务
if [ -f "${BASE_DIR}/logs/mail.pid" ]; then
    MAIL_PID=$(cat "${BASE_DIR}/logs/mail.pid")
    if ps -p "$MAIL_PID" > /dev/null 2>&1; then
        log "停止邮件服务 (PID: $MAIL_PID)..."
        kill "$MAIL_PID"
    fi
    rm -f "${BASE_DIR}/logs/mail.pid"
fi

# 3. 停止 LLM 服务
if [ -f "${BASE_DIR}/logs/llm.pid" ]; then
    LLM_PID=$(cat "${BASE_DIR}/logs/llm.pid")
    if ps -p "$LLM_PID" > /dev/null 2>&1; then
        log "停止 LLM 服务 (PID: $LLM_PID)..."
        kill "$LLM_PID"
    fi
    rm -f "${BASE_DIR}/logs/llm.pid"
fi

# 4. 停止 API 和 Redis
log "停止 API 和 Redis 服务..."
cd "${BASE_DIR}/api"
docker-compose down

log "停止 Redis..."
cd "${BASE_DIR}/redis"
docker-compose -f config/docker-compose.yml down

# 清理僵尸进程
log "清理僵尸进程..."
pkill -f "vite.*src/main.tsx" || true
pkill -f "node server.js" || true
pkill -f "uvicorn main:app" || true

log "=========================================="
log "✅ 所有服务已停止"
log "=========================================="
log "停止完成时间: $(date)"
