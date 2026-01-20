#!/bin/bash
# test_api.sh - API测试脚本

BASE_URL="http://localhost:8080/api/v2"

echo "=========================================="
echo "NAS DDNS API 测试"
echo "基础URL: $BASE_URL"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_endpoint() {
    local name=$1
    local endpoint=$2
    local method=$3
    local data=$4

    echo -n "测试 $name ... "
    response=$(curl -s -w "\n%{http_code}" \
        -X "$method" \
        -H "Content-Type: application/json" \
        ${data:+-d "$data"} \
        "$BASE_URL$endpoint" 2>/dev/null)

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ (HTTP $http_code)${NC}"
        if [ "$SHOW_DETAILS" = "true" ]; then
            echo "响应: $body" | head -c 100
            echo "..."
        fi
        return 0
    else
        echo -e "${RED}✗ (HTTP $http_code)${NC}"
        if [ "$SHOW_ERRORS" = "true" ]; then
            echo "错误: $body"
        fi
        return 1
    fi
}

echo "📋 开始测试"
echo ""

# 测试计数器
total_tests=0
passed_tests=0

# 1. 测试 API 根端点
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. API 根端点"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "API根" "/" "GET"
total_tests=$((total_tests + 1))
if [ $? -eq 0 ]; then passed_tests=$((passed_tests + 1)); fi
echo ""

# 2. 测试健康检查
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. 健康检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "健康检查" "/health" "GET"
total_tests=$((total_tests + 1))
if [ $? -eq 0 ]; then passed_tests=$((passed_tests + 1)); fi
echo ""

# 3. 测试 DDNS 状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. DDNS 状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "DDNS状态" "/ddns/status" "GET"
total_tests=$((total_tests + 1))
if [ $? -eq 0 ]; then passed_tests=$((passed_tests + 1)); fi
echo ""

# 4. 测试 DDNS 记录列表
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. DDNS 记录列表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "DDNS记录" "/ddns/records" "GET"
total_tests=$((total_tests + 1))
if [ $? -eq 0 ]; then passed_tests=$((passed_tests + 1)); fi
echo ""

# 5. 测试域名列表
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. 域名列表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "域名列表" "/domains" "GET"
total_tests=$((total_tests + 1))
if [ $? -eq 0 ]; then passed_tests=$((passed_tests + 1)); fi
echo ""

# 6. 测试系统监控
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. 系统监控"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "系统监控" "/monitoring/system" "GET"
total_tests=$((total_tests + 1))
if [ $? -eq 0 ]; then passed_tests=$((passed_tests + 1)); fi
echo ""

# 7. 测试服务状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. 服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "服务状态" "/monitoring/services" "GET"
total_tests=$((total_tests + 1))
if [ $? -eq 0 ]; then passed_tests=$((passed_tests + 1)); fi
echo ""

# 8. 测试告警列表
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. 告警列表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "告警列表" "/alerts" "GET"
total_tests=$((total_tests + 1))
if [ $? -eq 0 ]; then passed_tests=$((passed_tests + 1)); fi
echo ""

# 9. 测试高可用状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. 高可用状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "HA状态" "/ha/status" "GET"
total_tests=$((total_tests + 1))
if [ $? -eq 0 ]; then passed_tests=$((passed_tests + 1)); fi
echo ""

# 10. 测试 DNS 健康检查
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. DNS 健康检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "DNS健康" "/monitoring/dns/health" "GET"
total_tests=$((total_tests + 1))
if [ $? -eq 0 ]; then passed_tests=$((passed_tests + 1)); fi
echo ""

# 显示测试结果
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试结果汇总"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "总测试数: $total_tests"
echo -n "通过: "
if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}$passed_tests${NC}"
else
    echo -e "${YELLOW}$passed_tests${NC}"
fi
echo -n "失败: "
failed_tests=$((total_tests - passed_tests))
if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}$failed_tests${NC}"
else
    echo -e "${RED}$failed_tests${NC}"
fi

# 计算通过率
if [ $total_tests -gt 0 ]; then
    pass_rate=$((passed_tests * 100 / total_tests))
    echo "通过率: ${pass_rate}%"
fi

echo ""

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 部分测试失败${NC}"
    exit 1
fi
