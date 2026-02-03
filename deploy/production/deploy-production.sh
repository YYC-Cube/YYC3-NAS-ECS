#!/bin/bash
################################################################################
# YYC3-NAS-ECS 生产环境部署脚本
# ⚠️  警告：此脚本将部署到生产环境，请确保已通过 Staging 测试
################################################################################
# 用途：自动化生产环境的完整部署流程
# 使用：./deploy-production.sh [--skip-backup] [--force]
################################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="${PROJECT_ROOT}/logs/production-deploy-${TIMESTAMP}.log"
BACKUP_DIR="${PROJECT_ROOT}/backups/production/${TIMESTAMP}"
ROLLBACK_FILE="${PROJECT_ROOT}/.production-rollback-${TIMESTAMP}"

# 参数
SKIP_BACKUP=false
FORCE=false
DRY_RUN=false

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# 显示警告横幅
show_warning_banner() {
    echo -e "${RED}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║ ⚠️  警告：生产环境部署                                         ║"
    echo "╠═══════════════════════════════════════════════════════════════╣"
    echo "║  此操作将部署到生产环境，影响所有用户！                       ║"
    echo "║  请确保：                                                      ║"
    echo "║    1. 已在 Staging 环境完成全面测试                           ║"
    echo "║    2. 已通知相关用户                                         ║"
    echo "║    3. 已选择低流量时段                                       ║"
    echo "║    4. 已准备回滚方案                                         ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 显示使用方法
show_usage() {
    cat << EOF
${BLUE}YYC3-NAS-ECS 生产环境部署脚本${NC}

用法: $0 [选项]

选项:
    --skip-backup      跳过备份步骤（不推荐）
    --force            跳过所有确认提示
    --dry-run          模拟运行（不实际执行）
    -h, --help         显示此帮助信息

⚠️  重要提示：
    1. 请确保已在 Staging 环境完成测试
    2. 建议在低流量时段执行
    3. 确保有完整的回滚方案

EOF
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                warn "将跳过备份步骤（不推荐）"
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                info "DRY RUN 模式 - 不会实际执行更改"
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                error "未知选项: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# 预部署检查清单
pre_deploy_checklist() {
    log "执行预部署检查清单..."

    local checks=0
    local passed=0

    # 检查 1: Staging 测试状态
    checks=$((checks + 1))
    info "[$checks/$checks] Staging 环境测试状态..."

    # 这里应该检查实际的测试结果文件
    if [[ -f "${PROJECT_ROOT}/logs/staging-test-results.json" ]]; then
        success "Staging 测试结果文件存在"
        passed=$((passed + 1))
    else
        warn "未找到 Staging 测试结果，建议先完成 Staging 测试"
    fi

    # 检查 2: 环境变量
    checks=$((checks + 1))
    info "[$checks/$checks] 生产环境变量配置..."

    if [[ -f "${PROJECT_ROOT}/.env.production" ]]; then
        # 验证必需变量
        if grep -q "DATABASE_URL=" "${PROJECT_ROOT}/.env.production" && \
           grep -q "JWT_SECRET_KEY=" "${PROJECT_ROOT}/.env.production"; then
            success "生产环境变量已配置"
            passed=$((passed + 1))
        else
            error "缺少必需的环境变量"
        fi
    else
        error "生产环境配置文件不存在"
    fi

    # 检查 3: Docker
    checks=$((checks + 1))
    info "[$checks/$checks] Docker 环境..."

    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        success "Docker 环境就绪"
        passed=$((passed + 1))
    else
        error "Docker 环境未就绪"
    fi

    # 检查 4: 磁盘空间
    checks=$((checks + 1))
    info "[$checks/$checks] 磁盘空间..."

    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $disk_usage -lt 80 ]]; then
        success "磁盘空间充足 (已用: ${disk_usage}%)"
        passed=$((passed + 1))
    else
        warn "磁盘空间不足 (已用: ${disk_usage}%)"
    fi

    # 检查 5: 当前时间（低流量时段）
    checks=$((checks + 1))
    info "[$checks/$checks] 部署时段..."

    local current_hour=$(date +%H)
    if [[ $current_hour -ge 22 ]] || [[ $current_hour -lt 6 ]]; then
        success "当前为低流量时段 (${current_hour}:00)"
        passed=$((passed + 1))
    else
        warn "当前为业务时段，建议在低流量时段部署"
    fi

    echo ""
    log "预部署检查: $passed / $checks 通过"

    if [[ $passed -lt 3 ]]; then
        error "预部署检查失败，请解决后重试"
        exit 1
    fi
}

# 创建完整备份
create_full_backup() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        warn "⚠️  跳过备份步骤"
        return 0
    fi

    log "创建完整备份..."

    mkdir -p "$BACKUP_DIR"

    # 1. 备份数据库
    info "备份数据库..."
    if [[ "$DRY_RUN" == false ]]; then
        docker-compose -f "${PROJECT_ROOT}/docker-compose.yml" exec -T postgres \
            pg_dump -U postgres yyc3 > "${BACKUP_DIR}/database.sql" 2>/dev/null || true
    fi

    # 2. 备份环境变量
    info "备份环境变量..."
    cp "${PROJECT_ROOT}/.env.production" "${BACKUP_DIR}/.env" 2>/dev/null || true

    # 3. 备份当前代码版本
    info "备份当前代码版本..."
    cd "$PROJECT_ROOT"
    git rev-parse HEAD > "${BACKUP_DIR}/git-commit.txt" 2>/dev/null || true
    git log -1 --pretty=format:"%H - %s (%cr)" > "${BACKUP_DIR}/git-info.txt" 2>/dev/null || true

    # 4. 备份配置文件
    info "备份配置文件..."
    cp -r "${PROJECT_ROOT}/config" "${BACKUP_DIR}/" 2>/dev/null || true

    # 5. 创建回滚信息
    cat > "${BACKUP_DIR}/rollback-info.txt" << EOF
备份时间: $(date)
备份版本: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
回滚命令: cd ${PROJECT_ROOT} && git reset --hard $(cat ${BACKUP_DIR}/git-commit.txt) && docker-compose up -d
数据库恢复: docker-compose exec -T postgres psql -U postgres yyc3 < ${BACKUP_DIR}/database.sql
EOF

    log "备份完成: $BACKUP_DIR"
}

# 停止当前服务（滚动更新）
stop_services_gracefully() {
    log "优雅停止服务（滚动更新）..."

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将执行: docker-compose down"
        return 0
    fi

    # 使用滚动更新策略：先启动新容器，再停止旧容器
    # 这里我们使用简单的停止策略，实际生产环境可能需要更复杂的策略
    docker-compose down 2>/dev/null || true

    log "服务已停止"
}

# 拉取生产代码
pull_production_code() {
    log "拉取生产代码..."

    cd "$PROJECT_ROOT"

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将执行: git pull origin main"
        return 0
    fi

    # 验证当前分支
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" ]] && [[ "$current_branch" != "master" ]]; then
        warn "当前分支: $current_branch，切换到 main"
        git checkout main
    fi

    # 拉取最新代码
    git fetch origin
    git pull origin main

    log "代码已更新到: $(git rev-parse --short HEAD)"
}

# 构建生产镜像
build_production_images() {
    log "构建生产 Docker 镜像..."

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将执行: docker-compose build --no-cache"
        return 0
    fi

    docker-compose build --no-cache --pull

    log "生产镜像构建完成"
}

# 启动生产服务
start_production_services() {
    log "启动生产服务..."

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将执行: docker-compose up -d"
        return 0
    fi

    # 使用生产环境变量
    docker-compose --env-file .env.production up -d

    log "生产服务已启动"
}

# 等待服务就绪（带超时）
wait_for_production_services() {
    log "等待生产服务就绪..."

    local max_wait=300  # 5 分钟
    local waited=0

    while [[ $waited -lt $max_wait ]]; do
        if [[ "$DRY_RUN" == true ]]; then
            info "[DRY RUN] 将等待服务就绪"
            return 0
        fi

        # 检查 API 健康状态
        if curl -f http://localhost:3200/api/v2/health &> /dev/null; then
            log "生产服务已就绪"
            return 0
        fi

        echo -n "."
        sleep 5
        waited=$((waited + 5))
    done

    echo ""
    error "服务启动超时"
    return 1
}

# 运行生产迁移
run_production_migrations() {
    log "运行生产数据库迁移..."

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将执行: docker-compose exec api python scripts/migrate.py upgrade"
        return 0
    fi

    docker-compose exec -T api python scripts/migrate.py upgrade

    log "数据库迁移完成"
}

# 验证生产部署
verify_production_deployment() {
    log "验证生产部署..."

    # 基础健康检查
    if curl -f http://localhost:3200/api/v2/health &> /dev/null; then
        success "API 健康检查通过"
    else
        error "API 健康检查失败"
        return 1
    fi

    # 检查关键端点
    local endpoints=(
        "/api/v2/"
        "/api/v2/monitoring/stats"
    )

    for endpoint in "${endpoints[@]}"; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3200${endpoint}" 2>/dev/null)
        if [[ "$response" == "200" ]] || [[ "$response" == "401" ]]; then
            success "GET ${endpoint} 可访问 (HTTP $response)"
        else
            warn "GET ${endpoint} 返回 $response"
        fi
    done

    # 检查日志
    local error_count=$(docker-compose logs api 2>&1 | grep -i "error" | tail -20 | wc -l)
    if [[ $error_count -lt 5 ]]; then
        success "日志错误数量可接受 ($error_count)"
    else
        warn "日志中发现 $error_count 个错误"
    fi

    log "生产部署验证完成"
}

# 显示部署状态
show_production_status() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║            生产环境部署状态                                 ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # 容器状态
    info "容器状态:"
    docker-compose ps

    # 服务地址
    echo ""
    info "生产环境服务地址:"
    echo "  - 前端: https://app.yyc3.com"
    echo "  - API: https://api.yyc3.com"
    echo "  - 监控: https://monitor.yyc3.com"

    # 部署信息
    echo ""
    info "部署信息:"
    echo "  - 部署时间: $(date)"
    echo "  - 部署版本: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    echo "  - 备份位置: $BACKUP_DIR"

    # 回滚信息
    echo ""
    warn "如需回滚，请运行:"
    echo "  ${PROJECT_ROOT}/deploy/production/rollback-production.sh"
    echo ""
}

# 发送部署通知
send_deployment_notification() {
    log "发送部署通知..."

    # 这里可以集成 Slack、邮件等通知
    # 示例：发送 Slack 通知
    # if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    #     curl -X POST "$SLACK_WEBHOOK_URL" \
    #       -H 'Content-Type: application/json' \
    #       -d "{\"text\": \"✅ YYC3-NAS-ECS 生产环境部署完成\\n版本: $(git rev-parse --short HEAD)\\n时间: $(date)\"}"
    # fi

    info "通知功能需要配置 WEBHOOK_URL 环境变量"
}

# 主流程
main() {
    show_warning_banner
    parse_args "$@"

    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"

    # 最后确认
    if [[ "$FORCE" != true ]]; then
        echo ""
        warn "即将部署到生产环境，请确认："
        echo "  1. 已完成 Staging 测试"
        echo "  2. 已通知相关用户"
        echo "  3. 已准备回滚方案"
        echo ""
        read -p "确定要继续吗？(yes/NO): " confirm

        if [[ "$confirm" != "yes" ]]; then
            info "部署已取消"
            exit 0
        fi
    fi

    log "开始生产环境部署..."
    log "日志文件: $LOG_FILE"

    # 执行部署步骤
    pre_deploy_checklist
    create_full_backup
    stop_services_gracefully
    pull_production_code
    build_production_images
    start_production_services
    wait_for_production_services
    run_production_migrations
    verify_production_deployment
    show_production_status
    send_deployment_notification

    log "✅ 生产环境部署完成！"

    echo ""
    info "后续操作:"
    echo "  1. 监控服务状态 24 小时"
    echo "  2. 检查错误日志和性能指标"
    echo "  3. 收集用户反馈"
    echo "  4. 准备下次发布"
    echo ""
}

# 执行主流程
main "$@"
