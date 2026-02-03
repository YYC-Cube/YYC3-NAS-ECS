#!/bin/bash
################################################################################
# YYC3-NAS-ECS Staging 环境验证脚本
################################################################################
# 用途：验证 Staging 环境部署是否成功
# 使用：./verify-staging.sh [--full] [--verbose]
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STAGING_COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.staging.yml"
API_BASE_URL="http://localhost:3200"
FRONTEND_URL="http://localhost:3000"

# 统计
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# 日志函数
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 执行检查
run_check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

# 检查 Docker 服务
check_docker_services() {
    echo ""
    info "=== 检查 Docker 服务 ==="

    run_check
    if docker ps &> /dev/null; then
        pass "Docker 服务运行中"
    else
        error "Docker 服务未运行"
        return 1
    fi

    # 检查容器状态
    run_check
    local containers=$(docker-compose -f "$STAGING_COMPOSE_FILE" ps -q 2>/dev/null | wc -l)
    if [[ $containers -gt 0 ]]; then
        pass "Docker 容器运行中 ($containers 个)"
    else
        error "没有运行中的容器"
        return 1
    fi
}

# 检查 API 健康端点
check_api_health() {
    echo ""
    info "=== 检查 API 健康状态 ==="

    run_check
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/v2/health" 2>/dev/null)
    if [[ "$response" == "200" ]]; then
        pass "API 健康检查通过 (HTTP $response)"

        # 显示健康检查详情
        local health_data=$(curl -s "$API_BASE_URL/api/v2/health" 2>/dev/null)
        info "健康状态详情:"
        echo "$health_data" | grep -o '"status":"[^"]*"' | sed 's/"status":/  Status:/' | sed 's/"//g'
    else
        error "API 健康检查失败 (HTTP $response)"
        return 1
    fi
}

# 检查数据库连接
check_database() {
    echo ""
    info "=== 检查数据库连接 ==="

    run_check
    local health_data=$(curl -s "$API_BASE_URL/api/v2/health" 2>/dev/null)
    if echo "$health_data" | grep -q '"database".*"healthy"'; then
        pass "数据库连接正常"
    else
        error "数据库连接失败"
        return 1
    fi

    # 直接检查 PostgreSQL
    run_check
    if docker-compose -f "$STAGING_COMPOSE_FILE" exec -T postgres pg_isready -U postgres &> /dev/null; then
        pass "PostgreSQL 服务响应正常"
    else
        warn "PostgreSQL 直接检查失败"
    fi
}

# 检查 Redis 连接
check_redis() {
    echo ""
    info "=== 检查 Redis 连接 ==="

    run_check
    local health_data=$(curl -s "$API_BASE_URL/api/v2/health" 2>/dev/null)
    if echo "$health_data" | grep -q '"redis".*"healthy"'; then
        pass "Redis 连接正常"
    elif echo "$health_data" | grep -q '"redis".*"degraded"'; then
        warn "Redis 连接降级（可能不影响功能）"
    else
        warn "Redis 连接检查失败（可能未启用）"
    fi
}

# 检查前端服务
check_frontend() {
    echo ""
    info "=== 检查前端服务 ==="

    run_check
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null)
    if [[ "$response" == "200" ]]; then
        pass "前端服务可访问 (HTTP $response)"
    else
        error "前端服务不可访问 (HTTP $response)"
        return 1
    fi
}

# 检查 API 端点
check_api_endpoints() {
    echo ""
    info "=== 检查 API 端点 ==="

    # 检查根端点
    run_check
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/v2/" 2>/dev/null)
    if [[ "$response" == "200" ]]; then
        pass "GET /api/v2/ 可访问 (HTTP $response)"
    else
        error "GET /api/v2/ 失败 (HTTP $response)"
    fi

    # 检查监控端点
    run_check
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/v2/monitoring/stats" 2>/dev/null)
    if [[ "$response" == "200" ]] || [[ "$response" == "401" ]]; then
        pass "GET /api/v2/monitoring/stats 可访问 (HTTP $response)"
    else
        warn "GET /api/v2/monitoring/stats 返回 $response"
    fi

    # 检查 DDNS 端点
    run_check
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/v2/ddns/status" 2>/dev/null)
    if [[ "$response" == "200" ]] || [[ "$response" == "401" ]]; then
        pass "GET /api/v2/ddns/status 可访问 (HTTP $response)"
    else
        warn "GET /api/v2/ddns/status 返回 $response"
    fi
}

# 检查日志错误
check_logs() {
    echo ""
    info "=== 检查服务日志 ==="

    run_check
    local error_count=$(docker-compose -f "$STAGING_COMPOSE_FILE" logs api 2>&1 | grep -i "error" | tail -20 | wc -l)
    if [[ $error_count -lt 10 ]]; then
        pass "API 日志错误数量可接受 ($error_count)"
    else
        warn "API 日志中发现 $error_count 个错误"
    fi

    # 显示最近的错误
    if [[ $error_count -gt 0 ]]; then
        info "最近的错误:"
        docker-compose -f "$STAGING_COMPOSE_FILE" logs api 2>&1 | grep -i "error" | tail -5 | while read line; do
            echo "  $line"
        done
    fi
}

# 检查资源使用
check_resources() {
    echo ""
    info "=== 检查资源使用 ==="

    run_check
    local mem_usage=$(docker stats --no-stream --format "{{.MemUsage}}" $(docker-compose -f "$STAGING_COMPOSE_FILE" ps -q api) 2>/dev/null)
    if [[ -n "$mem_usage" ]]; then
        pass "API 容器内存使用: $mem_usage"
    else
        warn "无法获取内存使用信息"
    fi
}

# 检查网络连接
check_network() {
    echo ""
    info "=== 检查网络连接 ==="

    run_check
    if docker network ls | grep -q "nas-network"; then
        pass "Docker 网络已创建"
    else
        error "Docker 网络未找到"
        return 1
    fi
}

# 完整功能测试
run_full_tests() {
    echo ""
    info "=== 运行完整功能测试 ==="

    # 测试用户认证
    run_check
    local response=$(curl -s -X POST "$API_BASE_URL/api/v2/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' 2>/dev/null)
    if [[ $? -eq 0 ]]; then
        pass "登录端点响应正常"
    else
        warn "登录端点测试失败"
    fi

    # 测试系统状态
    run_check
    response=$(curl -s "$API_BASE_URL/api/v2/monitoring/system" 2>/dev/null)
    if [[ $? -eq 0 ]]; then
        pass "系统状态端点响应正常"
    else
        warn "系统状态端点测试失败"
    fi
}

# 显示报告
show_report() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  验证报告${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "总检查数: ${BLUE}$TOTAL_CHECKS${NC}"
    echo -e "通过: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "失败: ${RED}$FAILED_CHECKS${NC}"
    echo -e "警告: ${YELLOW}$WARNINGS${NC}"
    echo ""

    if [[ $FAILED_CHECKS -eq 0 ]]; then
        echo -e "${GREEN}✅ 所有检查通过！Staging 环境可以正常使用。${NC}"
        return 0
    else
        echo -e "${RED}❌ 有 $FAILED_CHECKS 个检查失败，请检查日志。${NC}"
        return 1
    fi
}

# 主流程
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  YYC3-NAS-ECS Staging 验证${NC}"
    echo -e "${BLUE}========================================${NC}"

    local full_tests=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --full)
                full_tests=true
                shift
                ;;
            --verbose)
                set -x
                shift
                ;;
            *)
                echo "未知选项: $1"
                echo "用法: $0 [--full] [--verbose]"
                exit 1
                ;;
        esac
    done

    # 执行检查
    check_docker_services
    check_network
    check_api_health
    check_database
    check_redis
    check_frontend
    check_api_endpoints
    check_logs
    check_resources

    if [[ "$full_tests" == true ]]; then
        run_full_tests
    fi

    # 显示报告
    show_report
}

# 执行主流程
main "$@"
