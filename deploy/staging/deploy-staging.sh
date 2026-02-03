#!/bin/bash
################################################################################
# YYC3-NAS-ECS Staging 环境一键部署脚本
################################################################################
# 用途：自动化 Staging 环境的完整部署流程
# 使用：./deploy-staging.sh [--skip-backup] [--skip-tests] [--verbose]
################################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STAGING_COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.staging.yml"
LOG_FILE="${PROJECT_ROOT}/logs/staging-deploy-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="${PROJECT_ROOT}/backups/staging"

# 参数解析
SKIP_BACKUP=false
SKIP_TESTS=false
VERBOSE=false
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

# 显示使用方法
show_usage() {
    cat << EOF
${BLUE}YYC3-NAS-ECS Staging 部署脚本${NC}

用法: $0 [选项]

选项:
    --skip-backup      跳过备份步骤
    --skip-tests       跳过测试验证
    --verbose          显示详细输出
    --dry-run          模拟运行（不实际执行）
    -h, --help         显示此帮助信息

示例:
    $0                      # 完整部署
    $0 --skip-tests         # 跳过测试
    $0 --dry-run --verbose  # 模拟运行并显示详情

EOF
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                set -x
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

# 检查前置条件
check_prerequisites() {
    log "检查前置条件..."

    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装"
        exit 1
    fi

    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose 未安装"
        exit 1
    fi

    # 检查 docker-compose.staging.yml
    if [[ ! -f "$STAGING_COMPOSE_FILE" ]]; then
        error "Staging Compose 文件不存在: $STAGING_COMPOSE_FILE"
        exit 1
    fi

    # 创建必要的目录
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$BACKUP_DIR"

    log "前置条件检查通过"
}

# 备份当前部署
backup_current_deployment() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        warn "跳过备份步骤"
        return 0
    fi

    log "备份当前部署..."

    local backup_name="staging-backup-$(date +%Y%m%d-%H%M%S)"
    local backup_path="${BACKUP_DIR}/${backup_name}"

    mkdir -p "$backup_path"

    # 备份数据库
    info "备份数据库..."
    if [[ "$DRY_RUN" == false ]]; then
        docker-compose -f "$STAGING_COMPOSE_FILE" exec -T postgres \
            pg_dump -U postgres yyc3 > "${backup_path}/database.sql" 2>/dev/null || warn "数据库备份失败"
    fi

    # 备份环境变量
    info "备份环境变量..."
    cp "${PROJECT_ROOT}/.env.staging" "${backup_path}/.env" 2>/dev/null || warn "环境变量备份失败"

    # 记录当前 Git 版本
    info "记录 Git 版本..."
    cd "$PROJECT_ROOT"
    git rev-parse HEAD > "${backup_path}/git-commit.txt" 2>/dev/null
    git log -1 --pretty=format:"%H - %s (%cr)" > "${backup_path}/git-info.txt" 2>/dev/null

    log "备份完成: $backup_path"
}

# 停止当前服务
stop_services() {
    log "停止当前服务..."

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将执行: docker-compose -f $STAGING_COMPOSE_FILE down"
        return 0
    fi

    docker-compose -f "$STAGING_COMPOSE_FILE" down

    log "服务已停止"
}

# 拉取最新代码
pull_latest_code() {
    log "拉取最新代码..."

    cd "$PROJECT_ROOT"

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将执行: git pull origin staging"
        return 0
    fi

    git fetch origin
    git checkout staging
    git pull origin staging

    log "代码已更新到: $(git rev-parse --short HEAD)"
}

# 构建镜像
build_images() {
    log "构建 Docker 镜像..."

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将执行: docker-compose -f $STAGING_COMPOSE_FILE build"
        return 0
    fi

    docker-compose -f "$STAGING_COMPOSE_FILE" build --no-cache

    log "镜像构建完成"
}

# 启动服务
start_services() {
    log "启动服务..."

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将执行: docker-compose -f $STAGING_COMPOSE_FILE up -d"
        return 0
    fi

    docker-compose -f "$STAGING_COMPOSE_FILE" up -d

    log "服务已启动"
}

# 等待服务就绪
wait_for_services() {
    log "等待服务就绪..."

    local max_wait=300  # 最多等待 5 分钟
    local waited=0

    while [[ $waited -lt $max_wait ]]; do
        if [[ "$DRY_RUN" == true ]]; then
            info "[DRY RUN] 跳过健康检查"
            return 0
        fi

        # 检查 API 健康状态
        if curl -f http://localhost:3200/api/v2/health &> /dev/null; then
            log "服务已就绪"
            return 0
        fi

        echo -n "."
        sleep 5
        waited=$((waited + 5))
    done

    echo
    error "服务启动超时"
    return 1
}

# 运行数据库迁移
run_migrations() {
    log "运行数据库迁移..."

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将执行: docker-compose exec api python scripts/migrate.py upgrade"
        return 0
    fi

    docker-compose -f "$STAGING_COMPOSE_FILE" exec -T api python scripts/migrate.py upgrade

    log "数据库迁移完成"
}

# 验证部署
verify_deployment() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warn "跳过验证步骤"
        return 0
    fi

    log "验证部署..."

    # 运行验证脚本
    if [[ -f "${SCRIPT_DIR}/verify-staging.sh" ]]; then
        bash "${SCRIPT_DIR}/verify-staging.sh"
    else
        warn "验证脚本不存在，跳过"
    fi
}

# 显示部署状态
show_status() {
    log "部署状态:"

    if [[ "$DRY_RUN" == true ]]; then
        info "[DRY RUN] 将显示服务状态"
        return 0
    fi

    docker-compose -f "$STAGING_COMPOSE_FILE" ps

    # 显示服务地址
    echo ""
    info "Staging 环境地址:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - API: http://localhost:3200"
    echo "  - Grafana: http://localhost:3001"
    echo "  - Jaeger: http://localhost:16686"
}

# 主流程
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  YYC3-NAS-ECS Staging 部署${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    parse_args "$@"
    check_prerequisites

    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"

    log "开始 Staging 部署流程..."
    log "日志文件: $LOG_FILE"

    # 执行部署步骤
    backup_current_deployment
    stop_services
    pull_latest_code
    build_images
    start_services
    wait_for_services
    run_migrations
    verify_deployment
    show_status

    log "✅ Staging 部署完成！"

    # 显示后续步骤
    echo ""
    info "后续步骤:"
    echo "  1. 访问 http://localhost:3000 验证前端"
    echo "  2. 访问 http://localhost:3200/api/v2/health 检查 API 健康"
    echo "  3. 访问 http://localhost:3001 查看 Grafana 监控"
    echo "  4. 运行 ${SCRIPT_DIR}/test-staging.sh 进行功能测试"
    echo ""
}

# 执行主流程
main "$@"
