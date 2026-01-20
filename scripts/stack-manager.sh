#!/bin/bash
# stack-manager.sh - YYC³ 全栈服务管理器
# 用途：统一管理所有服务的启动、停止、重启、状态检查

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
CONFIG_DIR="${BASE_DIR}/config"

# 默认环境
ENV="${1:-development}"
ACTION="${2:-status}"

# 验证环境参数
if [[ ! "$ENV" =~ ^(development|production)$ ]]; then
    error "无效的环境: $ENV"
    echo "用法: $0 [development|production] [start|stop|restart|status|logs]"
    exit 1
fi

# 加载环境变量
load_env() {
    log "加载 ${ENV} 环境配置..."
    
    if [ -f "${CONFIG_DIR}/load-env.sh" ]; then
        source "${CONFIG_DIR}/load-env.sh" "${ENV}"
    else
        error "环境变量加载脚本不存在: ${CONFIG_DIR}/load-env.sh"
        exit 1
    fi
}

# 获取 Redis 服务名称（环境名称映射）
get_redis_service_name() {
    case "${ENV}" in
        development)
            echo "redis-dev"
            ;;
        production)
            echo "redis-prod"
            ;;
        *)
            echo "redis-${ENV}"
            ;;
    esac
}

# 获取 API 服务名称（环境名称映射）
get_api_service_name() {
    case "${ENV}" in
        development)
            echo "api-dev"
            ;;
        production)
            echo "api-prod"
            ;;
        *)
            echo "api-${ENV}"
            ;;
    esac
}

# ========== 服务管理函数 ==========

start_redis() {
    log "启动 Redis 服务..."
    cd "${BASE_DIR}/redis"
    
    local redis_service=$(get_redis_service_name)
    
    if docker-compose -f config/docker-compose.yml ps ${redis_service} | grep -q "Up"; then
        warn "Redis 服务已在运行"
        return 0
    fi
    
    docker-compose -f config/docker-compose.yml up -d ${redis_service}
    sleep 2
    log "✅ Redis 服务启动完成"
}

stop_redis() {
    log "停止 Redis 服务..."
    cd "${BASE_DIR}/redis"
    
    local redis_service=$(get_redis_service_name)
    docker-compose -f config/docker-compose.yml stop ${redis_service}
    log "✅ Redis 服务已停止"
}

start_api() {
    log "启动 API 服务..."
    cd "${BASE_DIR}/api"
    
    # 检查是否已经加载环境变量
    if [ -z "$DATABASE_URL" ]; then
        warn "环境变量未加载，正在加载..."
        source "${CONFIG_DIR}/load-env.sh" "${ENV}"
    fi
    
    if docker-compose ps | grep -q "nas-ddns-api" && docker-compose ps | grep -q "Up"; then
        warn "API 服务已在运行"
        return 0
    fi
    
    # 使用新的 docker-compose 文件
    if [ -f "docker-compose.new.yml" ]; then
        docker-compose -f docker-compose.new.yml up -d api
    else
        docker-compose up -d api
    fi
    
    sleep 5
    log "✅ API 服务启动完成"
}

stop_api() {
    log "停止 API 服务..."
    cd "${BASE_DIR}/api"
    docker-compose stop
    log "✅ API 服务已停止"
}

start_llm() {
    log "启动 LLM 服务..."
    cd "${BASE_DIR}/llm"
    
    LLM_PID=$(pgrep -f "uvicorn main:app" || true)
    if [ -n "$LLM_PID" ]; then
        warn "LLM 服务已在运行 (PID: $LLM_PID)"
        return 0
    fi
    
    # 创建日志目录
    mkdir -p logs
    
    # 启动服务
    nohup uvicorn main:app --host 0.0.0.0 --port 6002 \
        > logs/llm.log 2>&1 &
    echo $! > logs/llm.pid
    
    sleep 3
    log "✅ LLM 服务启动完成"
}

stop_llm() {
    log "停止 LLM 服务..."
    cd "${BASE_DIR}/llm"
    
    if [ -f "logs/llm.pid" ]; then
        kill $(cat logs/llm.pid) 2>/dev/null || true
        rm -f logs/llm.pid
    fi
    
    # 清理所有LLM进程
    pkill -f "uvicorn main:app" || true
    
    log "✅ LLM 服务已停止"
}

start_mail() {
    log "启动邮件服务..."
    cd "${BASE_DIR}/mail"
    
    MAIL_PID=$(pgrep -f "node server.js" || true)
    if [ -n "$MAIL_PID" ]; then
        warn "邮件服务已在运行 (PID: $MAIL_PID)"
        return 0
    fi
    
    # 创建日志目录
    mkdir -p logs
    
    # 启动服务
    nohup node server.js > logs/mail.log 2>&1 &
    echo $! > logs/mail.pid
    
    sleep 3
    log "✅ 邮件服务启动完成"
}

stop_mail() {
    log "停止邮件服务..."
    cd "${BASE_DIR}/mail"
    
    if [ -f "logs/mail.pid" ]; then
        kill $(cat logs/mail.pid) 2>/dev/null || true
        rm -f logs/mail.pid
    fi
    
    # 清理所有邮件服务进程
    pkill -f "node server.js" || true
    
    log "✅ 邮件服务已停止"
}

start_frontend() {
    log "启动前端服务..."
    cd "${BASE_DIR}"
    
    FRONTEND_PID=$(pgrep -f "vite.*src/main.tsx" || true)
    if [ -n "$FRONTEND_PID" ]; then
        warn "前端服务已在运行 (PID: $FRONTEND_PID)"
        return 0
    fi
    
    # 创建日志目录
    mkdir -p logs
    
    # 仅在开发环境启动前端
    if [ "$ENV" = "development" ]; then
        nohup bun --hot src/main.tsx > logs/frontend.log 2>&1 &
        echo $! > logs/frontend.pid
        
        sleep 5
        log "✅ 前端服务启动完成"
    else
        warn "生产环境不启动前端开发服务器"
    fi
}

stop_frontend() {
    log "停止前端服务..."
    cd "${BASE_DIR}"
    
    if [ -f "logs/frontend.pid" ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
        rm -f logs/frontend.pid
    fi
    
    # 清理所有前端进程
    pkill -f "vite.*src/main.tsx" || true
    
    log "✅ 前端服务已停止"
}

start_frp() {
    log "启动 FRP 客户端..."
    cd "${BASE_DIR}/frp"
    
    FRP_PID=$(pgrep -f "frpc" || true)
    if [ -n "$FRP_PID" ]; then
        warn "FRP 客户端已在运行 (PID: $FRP_PID)"
        return 0
    fi
    
    # 创建日志目录
    mkdir -p logs
    
    # 启动服务
    nohup ./frpc -c frpc.toml > logs/frpc.log 2>&1 &
    echo $! > logs/frpc.pid
    
    sleep 3
    log "✅ FRP 客户端启动完成"
}

stop_frp() {
    log "停止 FRP 客户端..."
    cd "${BASE_DIR}/frp"
    
    if [ -f "logs/frpc.pid" ]; then
        kill $(cat logs/frpc.pid) 2>/dev/null || true
        rm -f logs/frpc.pid
    fi
    
    # 清理所有FRP进程
    pkill -f "frpc" || true
    
    log "✅ FRP 客户端已停止"
}

start_all() {
    log "=========================================="
    log "启动 YYC³ 全栈服务 (${ENV} 环境)"
    log "=========================================="
    echo ""
    
    # 1. 启动基础服务 (Redis)
    start_redis
    echo ""
    
    # 2. 启动 API 服务
    start_api
    echo ""
    
    # 3. 启动 LLM 服务
    start_llm
    echo ""
    
    # 4. 启动邮件服务
    start_mail
    echo ""
    
    # 5. 启动 FRP 客户端（生产环境）
    if [ "$ENV" = "production" ]; then
        start_frp
        echo ""
    fi
    
    # 6. 启动前端（开发环境）
    if [ "$ENV" = "development" ]; then
        start_frontend
        echo ""
    fi
    
    log "=========================================="
    log "✅ 所有服务启动完成"
    log "=========================================="
    echo ""
    show_status
}

stop_all() {
    log "=========================================="
    log "停止 YYC³ 全栈服务"
    log "=========================================="
    echo ""
    
    # 停止前端
    stop_frontend
    echo ""
    
    # 停止 FRP 客户端
    stop_frp
    echo ""
    
    # 停止邮件服务
    stop_mail
    echo ""
    
    # 停止 LLM 服务
    stop_llm
    echo ""
    
    # 停止 API 服务（包含 Redis）
    stop_api
    echo ""
    
    # 停止 Redis（单独停止以确保完全停止）
    stop_redis
    echo ""
    
    log "=========================================="
    log "✅ 所有服务已停止"
    log "=========================================="
}

restart_all() {
    log "=========================================="
    log "重启 YYC³ 全栈服务"
    log "=========================================="
    echo ""
    
    stop_all
    
    log "等待 3 秒..."
    sleep 3
    
    echo ""
    start_all
}

show_status() {
    echo -e "${BLUE}=========================================="
    echo "服务状态检查"
    echo -e "==========================================${NC}"
    echo ""
    
    # 检查 Redis
    echo -n "Redis 服务... "
    local redis_service=$(get_redis_service_name)
    if docker ps --format '{{.Names}}' | grep -q "${redis_service}"; then
        echo -e "${GREEN}✅ 运行中${NC}"
    else
        echo -e "${RED}❌ 未运行${NC}"
    fi
    
    # 检查 API
    echo -n "API 服务... "
    if docker ps --format '{{.Names}}' | grep -q "nas-ddns-api"; then
        echo -e "${GREEN}✅ 运行中${NC}"
    else
        echo -e "${RED}❌ 未运行${NC}"
    fi
    
    # 检查 LLM
    echo -n "LLM 服务... "
    LLM_PID=$(pgrep -f "uvicorn main:app" || true)
    if [ -n "$LLM_PID" ]; then
        echo -e "${GREEN}✅ 运行中 (PID: $LLM_PID)${NC}"
    else
        echo -e "${RED}❌ 未运行${NC}"
    fi
    
    # 检查邮件服务
    echo -n "邮件服务... "
    MAIL_PID=$(pgrep -f "node server.js" || true)
    if [ -n "$MAIL_PID" ]; then
        echo -e "${GREEN}✅ 运行中 (PID: $MAIL_PID)${NC}"
    else
        echo -e "${RED}❌ 未运行${NC}"
    fi
    
    # 检查前端
    echo -n "前端服务... "
    FRONTEND_PID=$(pgrep -f "vite.*src/main.tsx" || true)
    if [ -n "$FRONTEND_PID" ]; then
        echo -e "${GREEN}✅ 运行中 (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  未运行${NC}"
    fi
    
    # 检查 FRP
    echo -n "FRP 客户端... "
    FRP_PID=$(pgrep -f "frpc" || true)
    if [ -n "$FRP_PID" ]; then
        echo -e "${GREEN}✅ 运行中 (PID: $FRP_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  未运行${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}=========================================="
    echo "访问地址"
    echo -e "==========================================${NC}"
    echo "  管理平台: https://admin.0379.email"
    echo "  API文档:   https://api.0379.email/docs"
    echo "  FRP管理:   http://frp.0379.email:7500"
    echo ""
}

show_logs() {
    log "显示所有服务日志（Ctrl+C 退出）..."
    echo ""
    
    # 使用 tail -f 追踪所有日志
    cd "${BASE_DIR}"
    
    # 显示 Docker 日志
    echo -e "${BLUE}=== API 服务日志 ===${NC}"
    cd api
    docker-compose logs -f --tail=50 api 2>/dev/null &
    DOCKER_PID=$!
    cd ..
    
    # 显示应用日志
    echo -e "${BLUE}=== LLM 服务日志 ===${NC}"
    tail -f llm/logs/llm.log 2>/dev/null &
    LLM_PID=$!
    
    echo -e "${BLUE}=== 邮件服务日志 ===${NC}"
    tail -f mail/logs/mail.log 2>/dev/null &
    MAIL_PID=$!
    
    echo -e "${BLUE}=== 前端服务日志 ===${NC}"
    tail -f logs/frontend.log 2>/dev/null &
    FRONTEND_PID=$!
    
    echo -e "${BLUE}=== FRP 客户端日志 ===${NC}"
    tail -f frp/logs/frpc.log 2>/dev/null &
    FRP_PID=$!
    
    # 等待用户中断
    trap 'kill $DOCKER_PID $LLM_PID $MAIL_PID $FRONTEND_PID $FRP_PID 2>/dev/null; echo ""; log "日志查看已停止"; exit 0' INT
    
    wait
}

# ========== 主函数 ==========

main() {
    log "=========================================="
    log "YYC³ 全栈服务管理器"
    log "环境: ${ENV}"
    log "操作: ${ACTION}"
    log "=========================================="
    echo ""
    
    # 加载环境变量
    load_env
    
    # 根据操作执行
    case "$ACTION" in
        start|up)
            start_all
            ;;
        stop|down)
            stop_all
            ;;
        restart|reload)
            restart_all
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        *)
            echo "用法: $0 [environment] [action]"
            echo ""
            echo "环境:"
            echo "  development  - 开发环境"
            echo "  production   - 生产环境"
            echo ""
            echo "操作:"
            echo "  start|up     - 启动所有服务"
            echo "  stop|down    - 停止所有服务"
            echo "  restart      - 重启所有服务"
            echo "  status       - 显示服务状态"
            echo "  logs         - 显示服务日志"
            echo ""
            echo "示例:"
            echo "  $0 production start"
            echo "  $0 development stop"
            echo "  $0 production status"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
