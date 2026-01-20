#!/bin/bash
# test-p0.sh - P0任务测试脚本
# 用途：验证P0任务完成情况

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

success() {
    echo -e "${GREEN}✅${NC} $1"
}

fail() {
    echo -e "${RED}❌${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="${BASE_DIR}/config"

# 测试统计
TOTAL=0
PASS=0
FAIL=0

test_result() {
    TOTAL=$((TOTAL + 1))
    
    if [ $? -eq 0 ]; then
        success "$1"
        PASS=$((PASS + 1))
    else
        fail "$1"
        FAIL=$((FAIL + 1))
    fi
}

echo -e "${BLUE}=========================================="
echo "P0任务测试"
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "==========================================${NC}"
echo ""

# =====================================================
# 任务1: 统一环境变量管理
# =====================================================

echo -e "${BLUE}=== 任务1: 统一环境变量管理 ===${NC}"
echo ""

# 测试1.1: 检查配置目录
echo -n "1.1 检查配置目录是否存在... "
[ -d "${CONFIG_DIR}" ]
test_result "配置目录已创建"

# 测试1.2: 检查基础配置文件
echo -n "1.2 检查基础配置文件... "
[ -f "${CONFIG_DIR}/.env.base" ]
test_result "基础配置文件已创建"

# 测试1.3: 检查开发环境配置文件
echo -n "1.3 检查开发环境配置文件... "
[ -f "${CONFIG_DIR}/.env.development" ]
test_result "开发环境配置文件已创建"

# 测试1.4: 检查生产环境配置文件
echo -n "1.4 检查生产环境配置文件... "
[ -f "${CONFIG_DIR}/.env.production" ]
test_result "生产环境配置文件已创建"

# 测试1.5: 检查密钥目录
echo -n "1.5 检查密钥目录是否存在... "
[ -d "${CONFIG_DIR}/secrets" ]
test_result "密钥目录已创建"

# 测试1.6: 检查密钥配置文件
echo -n "1.6 检查密钥配置文件... "
SECRETS_COUNT=$(ls -1 "${CONFIG_DIR}/secrets"/*.env 2>/dev/null | wc -l)
[ "$SECRETS_COUNT" -ge 8 ]
test_result "密钥配置文件已创建 (8个)"

# 测试1.7: 检查环境变量加载脚本
echo -n "1.7 检查环境变量加载脚本... "
[ -x "${CONFIG_DIR}/load-env.sh" ]
test_result "环境变量加载脚本已创建"

# 测试1.8: 测试环境变量加载
echo -n "1.8 测试环境变量加载（开发环境）... "
source "${CONFIG_DIR}/load-env.sh" development > /dev/null 2>&1
[ -n "$ENVIRONMENT" ] && [ "$ENVIRONMENT" = "development" ]
test_result "环境变量加载成功"

echo ""

# =====================================================
# 任务2: 完善API接口对接
# =====================================================

echo -e "${BLUE}=== 任务2: 完善API接口对接 ===${NC}"
echo ""

# 测试2.1: 检查系统监控API文件
echo -n "2.1 检查系统监控API文件... "
[ -f "${BASE_DIR}/api/app/api/v2/monitoring_api.py" ]
test_result "系统监控API文件已创建"

# 测试2.2: 检查NAS API文件
echo -n "2.2 检查NAS API文件... "
[ -f "${BASE_DIR}/api/app/api/v2/nas_api.py" ]
test_result "NAS API文件已创建"

# 测试2.3: 检查FRP API文件
echo -n "2.3 检查FRP API文件... "
[ -f "${BASE_DIR}/api/app/api/v2/frp_api.py" ]
test_result "FRP API文件已创建"

# 测试2.4: 检查DDNS API文件
echo -n "2.4 检查DDNS API文件... "
[ -f "${BASE_DIR}/api/app/api/v2/ddns_api.py" ]
test_result "DDNS API文件已创建"

# 测试2.5: 检查前端API服务文件
echo -n "2.5 检查前端API服务文件... "
[ -f "${BASE_DIR}/src/app/services/api-new.ts" ]
test_result "前端API服务文件已创建"

# 测试2.6: 验证系统监控API语法
echo -n "2.6 验证系统监控API语法... "
python3 -m py_compile "${BASE_DIR}/api/app/api/v2/monitoring_api.py" 2>/dev/null
test_result "系统监控API语法正确"

# 测试2.7: 验证NAS API语法
echo -n "2.7 验证NAS API语法... "
python3 -m py_compile "${BASE_DIR}/api/app/api/v2/nas_api.py" 2>/dev/null
test_result "NAS API语法正确"

# 测试2.8: 验证FRP API语法
echo -n "2.8 验证FRP API语法... "
python3 -m py_compile "${BASE_DIR}/api/app/api/v2/frp_api.py" 2>/dev/null
test_result "FRP API语法正确"

# 测试2.9: 验证DDNS API语法
echo -n "2.9 验证DDNS API语法... "
python3 -m py_compile "${BASE_DIR}/api/app/api/v2/ddns_api.py" 2>/dev/null
test_result "DDNS API语法正确"

echo ""

# =====================================================
# 任务3: 创建统一启动脚本
# =====================================================

echo -e "${BLUE}=== 任务3: 创建统一启动脚本 ===${NC}"
echo ""

# 测试3.1: 检查stack-manager脚本
echo -n "3.1 检查stack-manager脚本... "
[ -x "${SCRIPT_DIR}/stack-manager.sh" ]
test_result "stack-manager脚本已创建"

# 测试3.2: 检查quick-start脚本
echo -n "3.2 检查quick-start脚本... "
[ -x "${SCRIPT_DIR}/quick-start.sh" ]
test_result "quick-start脚本已创建"

# 测试3.3: 检查quick-stop脚本
echo -n "3.3 检查quick-stop脚本... "
[ -x "${SCRIPT_DIR}/quick-stop.sh" ]
test_result "quick-stop脚本已创建"

# 测试3.4: 检查health-check脚本
echo -n "3.4 检查health-check脚本... "
[ -x "${SCRIPT_DIR}/health-check.sh" ]
test_result "health-check脚本已创建"

# 测试3.5: 测试stack-manager脚本帮助
echo -n "3.5 测试stack-manager脚本帮助... "
"${SCRIPT_DIR}/stack-manager.sh" > /dev/null 2>&1
test_result "stack-manager脚本运行正常"

echo ""

# =====================================================
# 功能测试
# =====================================================

echo -e "${BLUE}=== 功能测试 ===${NC}"
echo ""

# 测试4.1: 测试环境变量加载（开发）
echo -n "4.1 测试开发环境变量加载... "
source "${CONFIG_DIR}/load-env.sh" development > /dev/null 2>&1
[ "$ENVIRONMENT" = "development" ] && [ -n "$API_SERVICE_PORT" ] && [ -n "$REDIS_PASSWORD" ]
test_result "开发环境变量加载正常"

# 测试4.2: 测试环境变量加载（生产）
echo -n "4.2 测试生产环境变量加载... "
source "${CONFIG_DIR}/load-env.sh" production > /dev/null 2>&1
[ "$ENVIRONMENT" = "production" ] && [ -n "$API_SERVICE_PORT" ] && [ -n "$REDIS_PASSWORD" ]
test_result "生产环境变量加载正常"

# 测试4.3: 检查API接口端点定义
echo -n "4.3 检查系统监控API端点定义... "
grep -q "def get_stats" "${BASE_DIR}/api/app/api/v2/monitoring_api.py"
test_result "系统监控API端点已定义"

# 测试4.4: 检查NAS接口端点定义
echo -n "4.4 检查NAS API端点定义... "
grep -q "def get_nas_status" "${BASE_DIR}/api/app/api/v2/nas_api.py"
test_result "NAS API端点已定义"

# 测试4.5: 检查FRP接口端点定义
echo -n "4.5 检查FRP API端点定义... "
grep -q "def get_frp_status" "${BASE_DIR}/api/app/api/v2/frp_api.py"
test_result "FRP API端点已定义"

# 测试4.6: 检查DDNS接口端点定义
echo -n "4.6 检查DDNS API端点定义... "
grep -q "def get_ddns_status" "${BASE_DIR}/api/app/api/v2/ddns_api.py"
test_result "DDNS API端点已定义"

# 测试4.7: 检查前端API服务
echo -n "4.7 检查前端API服务对象... "
grep -q "export const apiV2" "${BASE_DIR}/src/app/services/api-new.ts"
test_result "前端API服务对象已定义"

# 测试4.8: 检查前端API端点
echo -n "4.8 检查前端API端点... "
grep -q "getStats:" "${BASE_DIR}/src/app/services/api-new.ts" && \
grep -q "getStatus:" "${BASE_DIR}/src/app/services/api-new.ts" && \
grep -q "getConfigs:" "${BASE_DIR}/src/app/services/api-new.ts"
test_result "前端API端点已定义"

echo ""

# =====================================================
# 集成测试
# =====================================================

echo -e "${BLUE}=== 集成测试 ===${NC}"
echo ""

# 测试5.1: 测试配置文件完整性
echo -n "5.1 测试配置文件完整性... "
source "${CONFIG_DIR}/load-env.sh" development > /dev/null 2>&1
[ -n "$API_SERVICE_PORT" ] && [ -n "$MAIL_SERVICE_PORT" ] && \
[ -n "$LLM_SERVICE_PORT" ] && [ -n "$REDIS_PASSWORD" ]
test_result "配置文件完整"

# 测试5.2: 测试密钥配置
echo -n "5.2 测试密钥配置... "
source "${CONFIG_DIR}/load-env.sh" development > /dev/null 2>&1
[ -n "$POSTGRES_PASSWORD" ] && [ -n "$REDIS_PASSWORD" ] && \
[ -n "$API_JWT_SECRET" ] && [ -n "$FRP_AUTH_TOKEN" ]
test_result "密钥配置完整"

# 测试5.3: 测试API模块依赖
echo -n "5.3 测试API模块依赖... "
grep -q "import psutil" "${BASE_DIR}/api/app/api/v2/monitoring_api.py" && \
grep -q "import requests" "${BASE_DIR}/api/app/api/v2/nas_api.py"
test_result "API模块依赖正确"

# 测试5.4: 测试API路由配置
echo -n "5.4 测试API路由配置... "
grep -q "'/api/v2/monitoring/stats'" "${BASE_DIR}/api/app/api/v2/monitoring_api.py" && \
grep -q "'/api/v2/nas/status'" "${BASE_DIR}/api/app/api/v2/nas_api.py"
test_result "API路由配置正确"

# 测试5.5: 测试前端API配置
echo -n "5.5 测试前端API配置... "
grep -q "API_BASE_URL" "${BASE_DIR}/src/app/config/env.ts" && \
grep -q "envConfig" "${BASE_DIR}/src/app/services/api-new.ts"
test_result "前端API配置正确"

echo ""

# =====================================================
# 测试结果汇总
# =====================================================

echo -e "${BLUE}=========================================="
echo "测试结果汇总"
echo -e "==========================================${NC}"
echo ""
echo "  总计: ${TOTAL}"
echo -e "  通过: ${GREEN}${PASS}${NC}"
echo -e "  失败: ${RED}${FAIL}${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}=========================================="
    echo "✅ 所有测试通过！P0任务完成"
    echo -e "==========================================${NC}"
    echo ""
    echo "下一步："
    echo "  1. 使用 './scripts/stack-manager.sh development start' 启动服务"
    echo "  2. 访问 http://localhost:6001 查看前端"
    echo "  3. 查看 './scripts/health-check.sh' 验证服务状态"
    echo ""
    exit 0
else
    echo -e "${RED}=========================================="
    echo "❌ 部分测试失败，请检查"
    echo -e "==========================================${NC}"
    echo ""
    echo "失败的测试："
    echo "  请查看上面的测试结果"
    echo ""
    exit 1
fi
