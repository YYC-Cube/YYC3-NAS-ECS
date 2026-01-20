#!/bin/bash
# quick-start.sh - 快速启动脚本（开发环境）
# 用途：一键启动所有服务进行开发测试

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

# 创建日志目录
mkdir -p "${BASE_DIR}/logs"

log "=========================================="
log "YYC³ 快速启动（开发环境）"
log "=========================================="

# 1. 启动 Redis
log "启动 Redis..."
cd "${BASE_DIR}/redis"
if docker-compose ps | grep -q redis-dev; then
    warn "Redis 已在运行"
else
    docker-compose -f config/docker-compose.yml up -d redis-dev
    sleep 3
fi

# 2. 启动 API 服务
log "启动 API 服务..."
cd "${BASE_DIR}/api"
if docker-compose ps | grep -q api; then
    warn "API 服务已在运行"
else
    docker-compose up -d api
    sleep 5
fi

# 3. 启动 LLM 服务
log "启动 LLM 服务..."
cd "${BASE_DIR}/llm"
LLM_PID=$(pgrep -f "uvicorn main:app" || true)
if [ -n "$LLM_PID" ]; then
    warn "LLM 服务已在运行 (PID: $LLM_PID)"
else
    nohup uvicorn main:app --host 0.0.0.0 --port 6002 \
        > "${BASE_DIR}/logs/llm.log" 2>&1 &
    echo $! > "${BASE_DIR}/logs/llm.pid"
    sleep 3
fi

# 4. 启动邮件服务
log "启动邮件服务..."
cd "${BASE_DIR}/mail"
MAIL_PID=$(pgrep -f "node server.js" || true)
if [ -n "$MAIL_PID" ]; then
    warn "邮件服务已在运行 (PID: $MAIL_PID)"
else
    nohup node server.js > "${BASE_DIR}/logs/mail.log" 2>&1 &
    echo $! > "${BASE_DIR}/logs/mail.pid"
    sleep 3
fi

# 5. 启动前端
log "启动前端开发服务器..."
FRONTEND_PID=$(pgrep -f "vite.*src/main.tsx" || true)
if [ -n "$FRONTEND_PID" ]; then
    warn "前端服务已在运行 (PID: $FRONTEND_PID)"
else
    cd "${BASE_DIR}"
    nohup bun --hot src/main.tsx > "${BASE_DIR}/logs/frontend.log" 2>&1 &
    echo $! > "${BASE_DIR}/logs/frontend.pid"
    sleep 5
fi

log "=========================================="
log "✅ 所有服务启动完成"
log "=========================================="
echo ""
echo -e "${BLUE}📌 本地访问地址:${NC}"
echo "  - 前端:     http://localhost:6001"
echo "  - API:       http://localhost:6000"
echo "  - 邮件:      http://localhost:6003"
echo "  - LLM:       http://localhost:6002"
echo "  - Redis:     http://localhost:6379"
echo ""
echo -e "${BLUE}📋 管理命令:${NC}"
echo "  - 查看所有日志: tail -f ${BASE_DIR}/logs/*.log"
echo "  - 停止所有服务: ${SCRIPT_DIR}/quick-stop.sh"
echo "  - 重启所有服务: ${SCRIPT_DIR}/quick-restart.sh"
echo ""
echo -e "${BLUE}📝 服务状态:${NC}"
cd "${BASE_DIR}/api"
docker-compose ps
echo ""
echo -e "${BLUE}✅ Redis 状态:${NC}"
cd "${BASE_DIR}/redis"
docker-compose -f config/docker-compose.yml ps redis-dev
echo ""
log "启动完成时间: $(date)"
