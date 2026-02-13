#!/bin/bash
# deploy.sh - YYC³ NAS-ECS 生产部署脚本
# 用途：一键启动生产环境服务

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
DOCKER_DIR="$(dirname "$SCRIPT_DIR")/docker"

log "=========================================="
log "YYC³ NAS-ECS 生产部署"
log "=========================================="

log "[1/5] 检查环境变量..."
if [ ! -f "${SCRIPT_DIR}/../config/.env.production" ]; then
    error "配置文件不存在: config/.env.production"
    error "请先复制配置模板: cp config/.env.example config/.env.production"
    exit 1
fi

export $(cat "${SCRIPT_DIR}/../config/.env.production" | grep -v '^#' | xargs)
log "✅ 环境变量已加载"

log ""
log "[2/5] 检查 Docker..."
if ! command -v docker &> /dev/null; then
    error "Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose 未安装"
    exit 1
fi

log "✅ Docker 环境正常"

log ""
log "[3/5] 检查网络..."
if ! docker network ls | grep -q "nas-network"; then
    log "创建 Docker 网络: nas-network"
    docker network create nas-network
else
    log "✅ 网络已存在: nas-network"
fi

log ""
log "[4/5] 启动服务..."
cd "${DOCKER_DIR}"

log "启动 API 服务..."
docker compose -f docker-compose.yml up -d api

log "启动 Nginx 服务..."
docker compose -f docker-compose.yml up -d nginx

log "启动 Prometheus 监控..."
docker compose -f docker-compose.yml up -d prometheus

log "启动 Grafana 监控..."
docker compose -f docker-compose.yml up -d grafana

sleep 10

log ""
log "[5/5] 验证服务状态..."
if docker compose -f docker-compose.yml ps | grep -q "api.*Up"; then
    log "✅ API 服务运行正常"
else
    error "❌ API 服务启动失败"
    docker compose -f docker-compose.yml logs api
fi

if docker compose -f docker-compose.yml ps | grep -q "nginx.*Up"; then
    log "✅ Nginx 服务运行正常"
else
    error "❌ Nginx 服务启动失败"
fi

if docker compose -f docker-compose.yml ps | grep -q "prometheus.*Up"; then
    log "✅ Prometheus 服务运行正常"
else
    warn "⚠️  Prometheus 服务未启动"
fi

log ""
log "=========================================="
log "✅ 部署完成！"
log "=========================================="
echo ""
echo -e "${BLUE}📌 服务访问地址:${NC}"
echo "  - 前端应用: http://$(hostname -I | awk '{print $1}')"
echo "  - API 服务: http://$(hostname -I | awk '{print $1}'):6000"
echo "  - Nginx:   http://$(hostname -I | awk '{print $1}')"
echo "  - Prometheus: http://$(hostname -I | awk '{print $1}'):9090"
echo "  - Grafana:   http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo -e "${YELLOW}📝 查看日志:${NC}"
echo "  docker compose -f docker/docker-compose.yml logs -f"
echo ""
echo -e "${YELLOW}📝 停止服务:${NC}"
echo "  ./scripts/stop.sh"
echo ""
