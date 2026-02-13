#!/bin/bash
# stop.sh - 停止 YYC³ NAS-ECS 服务

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")/docker"

echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} 停止 YYC³ NAS-ECS 服务..."

cd "${DOCKER_DIR}"

echo -e "${YELLOW}停止所有服务...${NC}"
docker compose -f docker-compose.yml down

echo -e "${GREEN}✅ 所有服务已停止${NC}"

echo ""
echo -e "${YELLOW}清理 Docker 数据卷（可选）:${NC}"
echo "  docker volume rm nas-ecs_postgres_data"
echo "  docker volume rm nas-ecs_redis_data"
echo "  docker volume rm nas-ecs_prometheus_data"
echo ""
