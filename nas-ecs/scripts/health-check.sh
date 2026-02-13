#!/bin/bash
# health-check.sh - 服务健康检查脚本

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=========================================="
echo "YYC³ 服务健康检查"
echo "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# 服务状态统计
TOTAL=0
PASS=0
FAIL=0

check_service() {
    local service_name="$1"
    local check_url="$2"
    local expected_code="${3:-200}"
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "检查 ${service_name}... "
    
    if curl -sf -o /dev/null -w "%{http_code}" "$check_url" | grep -q "$expected_code"; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

check_process() {
    local service_name="$1"
    local process_pattern="$2"
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "检查 ${service_name} 进程... "
    
    if pgrep -f "$process_pattern" > /dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

check_docker() {
    local service_name="$1"
    local container_name="$2"
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "检查 ${service_name} (Docker)... "
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

echo -e "${BLUE}=== 后端服务 ===${NC}"

# 检查 Docker 服务
check_docker "Redis" "redis-dev"
check_docker "API" "nas-ddns-api"

# 检查 Node.js/Python 服务
check_process "LLM" "uvicorn main:app"
check_process "邮件服务" "node server.js"
check_process "前端服务" "vite.*src/main.tsx"

echo ""
echo -e "${BLUE}=== HTTP 服务 ===${NC}"

# 检查 HTTP 端点
check_service "前端 (6001)" "http://localhost:6001"
check_service "API (6000)" "http://localhost:6000/api/v2/health"
check_service "邮件 (6003)" "http://localhost:6003/api/health"
check_service "LLM (6002)" "http://localhost:6002/health"

echo ""
echo -e "${BLUE}=== FRP 连接 ===${NC}"

check_service "FRP 管理面板" "http://frp.0379.email:7500"

echo ""
echo -e "${BLUE}=== DDNS 解析 ===${NC}"

echo -n "检查 ddns.0379.email 解析... "
if nslookup ddns.0379.email | grep -q "8.152.195.33"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC}"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

echo ""
echo "=========================================="
echo -e "检查结果: ${GREEN}${PASS}/${TOTAL}${NC} 通过, ${RED}${FAIL}/${TOTAL}${NC} 失败"
echo "=========================================="

# 如果有失败，返回非0状态码
if [ $FAIL -gt 0 ]; then
    exit 1
fi

exit 0
