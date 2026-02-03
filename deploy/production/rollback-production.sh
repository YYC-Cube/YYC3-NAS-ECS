#!/bin/bash
################################################################################
# YYC3-NAS-ECS 生产环境回滚脚本
# ⚠️  警告：此脚本将回滚生产环境到上一版本
################################################################################
# 用途：在生产环境出现问题时快速回滚到稳定版本
# 使用：./rollback-production.sh [--backup-name] [--database]
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
LOG_FILE="${PROJECT_ROOT}/logs/production-rollback-${TIMESTAMP}.log"
BACKUP_DIR="${PROJECT_ROOT}/backups/production"

# 参数
RESTORE_DATABASE=false
BACKUP_NAME=""
FORCE=false
VERBOSE=false

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
    echo "║ ⚠️  警告：生产环境回滚                                         ║"
    echo "╠═══════════════════════════════════════════════════════════════╣"
    echo "║  此操作将回滚生产环境，可能造成：                             ║"
    echo "║    • 短暂的服务中断                                            ║"
    echo "║    • 最新功能不可用                                            ║"
    echo "║    • 数据库状态回退                                            ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 显示使用方法
show_usage() {
    cat << EOF
${BLUE}YYC3-NAS-ECS 生产环境回滚脚本${NC}

用法: $0 [选项]

选项:
    --database         同时回滚数据库
    --backup-name NAME  恢复指定备份
    --force            跳过所有确认提示
    --verbose          显示详细输出
    -h, --help         显示此帮助信息

⚠️  回滚类型:
    • 代码回滚: 回滚到上一个 Git 版本
    • 数据库回滚: 恢复到备份数据库
    • 完整回滚: 代码 + 数据库同时回滚

EOF
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --database)
                RESTORE_DATABASE=true
                shift
                ;;
            --backup-name)
                BACKUP_NAME="$2"
                shift 2
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                set -x
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
    log "当前生产环境状态:"

    cd "$PROJECT_ROOT"

    # 显示当前 Git 版本
    echo ""
    info "当前 Git 版本:"
    git log -1 --pretty=format:"  %h - %s (%cr)" 2>/dev/null || echo "  无法获取 Git 信息"

    # 显示运行中的容器
    echo ""
    info "运行中的容器:"
    docker-compose ps 2>/dev/null || echo "  无运行中的容器"

    # 显示最近部署
    echo ""
    info "最近部署:"
    ls -t "$BACKUP_DIR" 2>/dev/null | head -3 | while read backup; do
        echo "  - $backup"
        if [[ -f "$BACKUP_DIR/$backup/git-info.txt" ]]; then
            head -1 "$BACKUP_DIR/$backup/git-info.txt" | sed 's/^/    /'
        fi
    done
}

# 记录当前状态（用于回滚前的快照）
snapshot_current_state() {
    log "记录当前状态..."

    local snapshot_file="${PROJECT_ROOT}/.rollback-snapshot-${TIMESTAMP}"

    cat > "$snapshot_file" << EOF
# 回滚前快照
时间: $(date)
目录: $(pwd)

# Git 状态
$(git rev-parse HEAD > ${snapshot_file}-git-commit 2>/dev/null)
$(git log -1 --pretty=format:"%H - %s (%cr)" > ${snapshot_file}-git-info 2>/dev/null)

# 容器状态
$(docker-compose ps > ${snapshot_file}-containers 2>/dev/null)

# 日志（最后 50 行）
$(docker-compose logs --tail=50 api > ${snapshot_file}-api-logs 2>/dev/null)
EOF

    log "当前状态已记录到: $snapshot_file"
}

# 停止服务
stop_services() {
    log "停止生产服务..."

    docker-compose down

    log "生产服务已停止"
}

# 回滚代码
rollback_code() {
    log "回滚代码到上一版本..."

    cd "$PROJECT_ROOT"

    # 检查是否有未提交的更改
    if [[ -n $(git status --porcelain) ]]; then
        warn "工作目录有未提交的更改"
        git status --short
    fi

    # 回滚到上一版本
    git reset --hard HEAD~1

    log "代码已回滚到: $(git rev-parse --short HEAD)"
}

# 恢复数据库
restore_database() {
    local backup_path="$1"

    if [[ ! -d "$backup_path" ]]; then
        error "备份目录不存在: $backup_path"
        return 1
    fi

    if [[ ! -f "$backup_path/database.sql" ]]; then
        error "数据库备份文件不存在: $backup_path/database.sql"
        return 1
    fi

    log "恢复数据库..."

    # 启动数据库容器
    docker-compose up -d postgres

    # 等待数据库就绪
    log "等待数据库就绪..."
    local max_wait=60
    local waited=0

    while [[ $waited -lt $max_wait ]]; do
        if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
            break
        fi
        sleep 2
        waited=$((waited + 2))
    done

    # 停止数据库连接（防止恢复时冲突）
    docker-compose stop api

    # 恢复数据库
    docker-compose exec -T postgres psql -U postgres yyc3 < "$backup_path/database.sql"

    log "数据库已恢复"
}

# 回滚数据库迁移
rollback_migrations() {
    log "回滚数据库迁移..."

    docker-compose exec -T api python scripts/migrate.py downgrade

    log "数据库迁移已回滚"
}

# 启动服务
start_services() {
    log "启动生产服务..."

    docker-compose --env-file .env.production up -d

    log "生产服务已启动"
}

# 等待服务就绪
wait_for_services() {
    log "等待生产服务就绪..."

    local max_wait=300
    local waited=0

    while [[ $waited -lt $max_wait ]]; do
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

# 验证回滚
verify_rollback() {
    log "验证回滚结果..."

    # 健康检查
    if curl -f http://localhost:3200/api/v2/health &> /dev/null; then
        success "API 健康检查通过"
    else
        error "API 健康检查失败"
        return 1
    fi

    # 检查版本
    local current_version=$(git rev-parse --short HEAD)
    log "当前版本: $current_version"

    # 检查容器
    docker-compose ps
}

# 显示回滚后状态
show_rollback_status() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║            生产环境回滚状态                                 ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Git 版本
    info "回滚后版本:"
    git log -1 --pretty=format:"  %h - %s (%cr)"

    # 容器状态
    echo ""
    info "容器状态:"
    docker-compose ps

    # 回滚信息
    echo ""
    info "回滚时间: $(date)"
    info "回滚日志: $LOG_FILE"
    echo ""

    warn "请仔细检查所有功能是否正常"
}

# 发送回滚通知
send_rollback_notification() {
    log "发送回滚通知..."

    # 这里可以集成 Slack、邮件等通知
    warn "请手动通知相关人员生产环境已回滚"
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
        warn "即将回滚生产环境，请确认："
        echo "  1. 已通知相关用户服务将中断"
        echo "  2. 已评估回滚影响范围"
        echo "  3. 已准备后续修复计划"
        echo ""
        read -p "确定要继续吗？(yes/NO): " confirm

        if [[ "$confirm" != "yes" ]]; then
            info "回滚已取消"
            exit 0
        fi
    fi

    log "开始生产环境回滚..."
    log "日志文件: $LOG_FILE"

    # 执行回滚步骤
    show_current_status
    snapshot_current_state

    # 如果指定了备份名称，恢复备份
    if [[ -n "$BACKUP_NAME" ]]; then
        local backup_path="$BACKUP_DIR/$BACKUP_NAME"
        if [[ -d "$backup_path" ]]; then
            log "恢复指定备份: $backup_path"
            stop_services
            restore_database "$backup_path"
            # 从备份恢复代码
            if [[ -f "$backup_path/git-commit.txt" ]]; then
                cd "$PROJECT_ROOT"
                git reset --hard "$(cat "$backup_path/git-commit.txt")"
            fi
            start_services
        else
            error "备份不存在: $backup_path"
            exit 1
        fi
    elif [[ "$RESTORE_DATABASE" == true ]]; then
        # 完整回滚（代码 + 数据库）
        stop_services
        rollback_code
        restore_database "$(get_latest_backup)"
        start_services
    else
        # 仅代码回滚
        stop_services
        rollback_code
        rollback_migrations
        start_services
    fi

    wait_for_services
    verify_rollback
    show_rollback_status
    send_rollback_notification

    log "✅ 生产环境回滚完成！"

    echo ""
    warn "后续操作:"
    echo "  1. 全面测试所有功能"
    echo "  2. 监控错误日志"
    echo "  3. 分析回滚原因"
    echo "  4. 准备热修复补丁"
    echo ""
}

# 执行主流程
main "$@"
