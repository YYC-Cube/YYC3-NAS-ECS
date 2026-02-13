#!/bin/bash
# start-production.sh - 使用现有镜像启动生产环境

set -e

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

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"

log "=========================================="
log "YYC³ NAS-ECS 生产环境启动"
log "=========================================="

log "[1/4] 检查现有服务..."
if docker ps | grep -q "yyc3-staging-api"; then
    warn "检测到正在运行的 yyc3-staging-api 服务"
    read -p "是否停止现有服务？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "停止现有服务..."
        docker stop yyc3-staging-api
        docker rm yyc3-staging-api
    else
        log "保持现有服务运行"
        exit 0
    fi
fi

log ""
log "[2/4] 创建 Docker 网络..."
if ! docker network ls | grep -q "nas-network"; then
    log "创建网络: nas-network"
    docker network create nas-network
else
    log "✅ 网络已存在"
fi

log ""
log "[3/4] 加载环境变量..."
ENV_FILE="${BASE_DIR}/config/.env.production"
if [ ! -f "$ENV_FILE" ]; then
    error "配置文件不存在: $ENV_FILE"
    exit 1
fi

export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
log "✅ 环境变量已加载"

log ""
log "[4/4] 启动服务..."

log "启动 API 服务..."
docker run -d \
    --name nas-ecs-api \
    --restart unless-stopped \
    --network host \
    -e ENVIRONMENT=production \
    -e NODE_ENV=production \
    -e APP_NAME="YYC3-NAS-ECS" \
    -e APP_VERSION="1.0.0" \
    -e API_PREFIX="/api/v2" \
    -e API_VERSION="2.0.0" \
    -e CORS_ENABLED="true" \
    -e CORS_ORIGINS="*" \
    -e SECURE_COOKIE="true" \
    -e API_JWT_SECRET="API_KEY_PLACEHOLDER_production_secret_key_32_chars_min" \
    -e JWT_SECRET_KEY="API_KEY_PLACEHOLDER_production_secret_key_32_chars_min" \
    -e SECRET_KEY="API_KEY_PLACEHOLDER_production_secret_key_32_chars_min" \
    -e DATABASE_URL="postgresql://postgres:staging-password@localhost:5432/yyc3_staging" \
    -e REDIS_URL="redis://localhost:6379/0" \
    -e VITE_API_BASE_URL="https://api.0379.email" \
    -e VITE_APP_ENV="production" \
    yyc3-staging-api:latest \
    gunicorn --bind 0.0.0.0:6009 --worker-class gevent --workers 4 wsgi:app

sleep 10

log ""
log "=========================================="
log "✅ 服务启动完成"
log "=========================================="
echo ""
echo -e "${BLUE}📌 服务访问地址:${NC}"
echo "  - API 服务: http://$(hostname -I | awk '{print $1}'):6009"
echo "  - API HTTPS: https://api.0379.email"
echo ""
echo -e "${YELLOW}📝 查看日志:${NC}"
echo "  docker logs -f nas-ecs-api"
echo ""
echo -e "${YELLOW}📝 停止服务:${NC}"
echo "  docker stop nas-ecs-api && docker rm nas-ecs-api"
echo ""
