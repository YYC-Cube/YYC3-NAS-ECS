#!/bin/bash
################################################################################
# YYC3-NAS-ECS Staging 环境回滚脚本
################################################################################
# 用途：回滚 Staging 环境到上一个稳定版本
# 使用：./rollback-staging.sh [--backup-name] [--force]
################################################################################

set -e  # 遇到错误立即退出

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
BACKUP_DIR="${PROJECT_ROOT}/backups/staging"
LOG_FILE="${PROJECT_ROOT}/logs/staging-rollback-$(date +%Y%m%d-%H%M%S).log"

# 参数
FORCE=false
BACKUP_NAME=""
RESTORE_DB=false

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
${BLUE}YYC3-NAS-ECS Staging 回滚脚本${NC}

用法: $0 [选项]

选项:
    --backup-name NAME    指定要恢复的备份名称
    --restore-db          同时恢复数据库
    --force               跳过确认提示
    -h, --help            显示此帮助信息

示例:
    $0                                  # 回滚代码到上一版本
    $0 --restore-db                      # 回滚代码并恢复数据库
    $0 --backup-name staging-backup-...  # 恢复指定备份

EOF
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup-name)
                BACKUP_NAME="$2"
                shift 2
                ;;
            --restore-db)
                RESTORE_DB=true
                shift
                ;;
            --force)
                FORCE=true
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

# 确认回滚操作
confirm_rollback() {
    if [[ "$FORCE" == true ]]; then
        return 0
    fi

    echo ""
    warn "警告：此操作将回滚 Staging 环境到上一个版本！"
    warn ""
    warn "这将："
    warn "  1. 停止当前服务"
    warn "  2. 回滚代码到上一 Git 版本"
    if [[ "$RESTORE_DB" == true ]]; then
        warn "  3. 恢复数据库到备份状态"
    fi
    warn "  4. 重新启动服务"
    warn ""

    read -p "确定要继续吗？(yes/no): " confirm

    if [[ "$confirm" != "yes" ]]; then
        info "回滚操作已取消"
        exit 0
    fi
}

# 获取最新备份
get_latest_backup() {
    if [[ -n "$BACKUP_NAME" ]]; then
        echo "$BACKUP_DIR/$BACKUP_NAME"
        return
    fi

    local latest=$(ls -t "$BACKUP_DIR" 2>/dev/null | head -1)
    if [[ -z "$latest" ]]; then
        error "没有找到备份"
        exit 1
    fi

    echo "$BACKUP_DIR/$latest"
}

# 显示当前状态
show_current_status() {
    log "当前状态:"

    cd "$PROJECT_ROOT"

    # 显示当前 Git 版本
    echo ""
    info "当前 Git 版本:"
    git log -1 --pretty=format:"  %h - %s (%cr)" 2>/dev/null || echo "  无法获取 Git 信息"

    # 显示运行中的容器
    echo ""
    info "运行中的容器:"
    docker-compose -f "$STAGING_COMPOSE_FILE" ps 2>/dev/null || echo "  无运行中的容器"
}

# 停止服务
stop_services() {
    log "停止服务..."

    docker-compose -f "$STAGING_COMPOSE_FILE" down

    log "服务已停止"
}

# 回滚代码
rollback_code() {
    log "回滚代码..."

    cd "$PROJECT_ROOT"

    # 记录当前版本
    local current_commit=$(git rev-parse HEAD)
    echo "$current_commit" > "${PROJECT_ROOT}/.rollback-before"

    # 回滚到上一版本
    git reset --hard HEAD~1

    log "代码已回滚到: $(git rev-parse --short HEAD)"
}

# 恢复数据库
restore_database() {
    local backup_path="$1"

    if [[ ! -f "$backup_path/database.sql" ]]; then
        warn "数据库备份文件不存在: $backup_path/database.sql"
        return 1
    fi

    log "恢复数据库..."

    # 启动数据库容器
    docker-compose -f "$STAGING_COMPOSE_FILE" up -d postgres

    # 等待数据库就绪
    log "等待数据库就绪..."
    local max_wait=60
    local waited=0
    while [[ $waited -lt $max_wait ]]; do
        if docker-compose -f "$STAGING_COMPOSE_FILE" exec -T postgres pg_isready -U postgres &> /dev/null; then
            break
        fi
        sleep 2
        waited=$((waited + 2))
    done

    # 恢复数据库
    docker-compose -f "$STAGING_COMPOSE_FILE" exec -T postgres \
        psql -U postgres yyc3 < "$backup_path/database.sql"

    log "数据库已恢复"
}

# 回滚数据库迁移
rollback_migrations() {
    log "回滚数据库迁移..."

    docker-compose -f "$STAGING_COMPOSE_FILE" exec -T api \
        python scripts/migrate.py downgrade

    log "数据库迁移已回滚"
}

# 启动服务
start_services() {
    log "启动服务..."

    docker-compose -f "$STAGING_COMPOSE_FILE" up -d

    log "服务已启动"
}

# 等待服务就绪
wait_for_services() {
    log "等待服务就绪..."

    local max_wait=300
    local waited=0

    while [[ $waited -lt $max_wait ]]; do
        if curl -f http://localhost:3200/api/v2/health &> /dev/null; then
            log "服务已就绪"
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

# 验证回滚
verify_rollback() {
    log "验证回滚结果..."

    # 运行验证脚本
    if [[ -f "${SCRIPT_DIR}/verify-staging.sh" ]]; then
        bash "${SCRIPT_DIR}/verify-staging.sh"
    else
        warn "验证脚本不存在"
    fi
}

# 显示回滚后状态
show_rollback_status() {
    log "回滚后状态:"

    cd "$PROJECT_ROOT"

    # 显示 Git 版本
    echo ""
    info "当前 Git 版本:"
    git log -1 --pretty=format:"  %h - %s (%cr)" 2>/dev/null

    # 显示容器状态
    echo ""
    info "容器状态:"
    docker-compose -f "$STAGING_COMPOSE_FILE" ps
}

# 主流程
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  YYC3-NAS-ECS Staging 回滚${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    parse_args "$@"

    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"

    log "开始回滚流程..."
    log "日志文件: $LOG_FILE"

    # 显示当前状态
    show_current_status

    # 确认回滚
    confirm_rollback

    # 执行回滚
    stop_services

    # 如果指定了备份名称，恢复备份
    if [[ -n "$BACKUP_NAME" ]]; then
        local backup_path="$BACKUP_DIR/$BACKUP_NAME"
        if [[ -d "$backup_path" ]]; then
            restore_database "$backup_path"
        else
            error "备份不存在: $backup_path"
            exit 1
        fi
    elif [[ "$RESTORE_DB" == true ]]; then
        # 获取最新备份并恢复
        local backup_path=$(get_latest_backup)
        restore_database "$backup_path"
    else
        # 仅回滚迁移
        rollback_migrations
    fi

    rollback_code
    start_services
    wait_for_services
    verify_rollback
    show_rollback_status

    log "✅ 回滚完成！"

    # 显示恢复信息
    if [[ -f "${PROJECT_ROOT}/.rollback-before" ]]; then
        local before_commit=$(cat "${PROJECT_ROOT}/.rollback-before")
        echo ""
        info "如需重新回滚到回滚前的版本，使用:"
        echo "  git reset --hard $before_commit"
    fi
}

# 执行主流程
main "$@"
