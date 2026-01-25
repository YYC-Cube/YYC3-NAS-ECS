#!/bin/bash
# NAS DDNS 全局配置文件
# 最后更新: $(date '+%Y-%m-%d %H:%M:%S')

# ============================================
# 基础配置
# ============================================
export NAS_DOMAIN="nas.0379.email"
export NAS_SERVER_IP="8.152.195.33"
export NAS_LOCAL_IP="192.168.3.45"
export NAS_SERVER_NAME="yyc3-33"
export NAS_LOCAL_NAME="nas-local"

# ============================================
# 阿里云配置
# ============================================
export ALIYUN_ACCESS_KEY_ID=""
export ALIYUN_ACCESS_KEY_SECRET=""
export ALIYUN_REGION_ID="cn-hangzhou"
export ALIYUN_DOMAIN="0379.email"
export ALIYUN_SUB_DOMAIN="nas"
export ALIYUN_TTL="600"

# ============================================
# 路径配置
# ============================================
export NAS_BASE_DIR="/opt/yyc3"
export NAS_SCRIPTS_DIR="${NAS_BASE_DIR}/scripts"
export NAS_DDNS_DIR="${NAS_BASE_DIR}/ddns"
export NAS_WEB_DIR="${NAS_BASE_DIR}/web/nas"
export NAS_LOGS_DIR="${NAS_BASE_DIR}/logs"
export NAS_REPORTS_DIR="${NAS_BASE_DIR}/reports"
export NAS_RUN_DIR="${NAS_BASE_DIR}/run"
export NAS_BACKUP_DIR="${NAS_BASE_DIR}/backup"

# ============================================
# 服务配置
# ============================================
export DDNS_CHECK_INTERVAL="300"           # DDNS检查间隔（秒）
export MONITOR_CHECK_INTERVAL="1800"       # 监控检查间隔（秒）
export REPORT_GENERATE_TIME="08:00"        # 报告生成时间
export LOG_RETENTION_DAYS="7"              # 日志保留天数
export REPORT_RETENTION_DAYS="30"          # 报告保留天数

# ============================================
# Nginx配置
# ============================================
export NGINX_CONF_DIR="/etc/nginx/conf.d"
export NGINX_CONF_FILE="${NGINX_CONF_DIR}/nas.0379.email.conf"
export NGINX_LOG_DIR="/var/log/nginx"
export NGINX_ACCESS_LOG="${NGINX_LOG_DIR}/nas_access.log"
export NGINX_ERROR_LOG="${NGINX_LOG_DIR}/nas_error.log"
export NGINX_PORT="80"

# ============================================
# 系统服务配置
# ============================================
export SYSTEMD_SERVICE_DIR="/etc/systemd/system"
export DDNS_SERVICE="yyc3-ddns.service"
export DDNS_TIMER="yyc3-ddns.timer"
export MONITOR_SERVICE="nas-monitor.service"
export MONITOR_TIMER="nas-monitor.timer"
export REPORT_SERVICE="nas-daily-report.service"
export REPORT_TIMER="nas-daily-report.timer"

# ============================================
# 监控配置
# ============================================
export MONITOR_ENABLED="true"
export MONITOR_CHECK_DNS="true"
export MONITOR_CHECK_HTTP="true"
export MONITOR_CHECK_SERVICES="true"
export MONITOR_CHECK_RESOURCES="true"
export MONITOR_ALERT_THRESHOLD_CPU="90"
export MONITOR_ALERT_THRESHOLD_MEM="90"
export MONITOR_ALERT_THRESHOLD_DISK="90"

# ============================================
# 通知配置（待配置）
# ============================================
export NOTIFICATION_ENABLED="false"
export NOTIFICATION_TYPE=""                # email/telegram/slack
export NOTIFICATION_EMAIL=""
export NOTIFICATION_TELEGRAM_BOT_TOKEN=""
export NOTIFICATION_TELEGRAM_CHAT_ID=""

# ============================================
# 备份配置
# ============================================
export BACKUP_ENABLED="true"
export BACKUP_SCHEDULE="0 2 * * *"         # 每天2:00备份
export BACKUP_RETENTION_DAYS="7"

# ============================================
# 安全配置
# ============================================
export SECURITY_ENABLE_FIREWALL="true"
export SECURITY_ALLOWED_IPS=""
export SECURITY_RATE_LIMIT="100r/s"
export SECURITY_BLOCK_FAILED_ATTEMPTS="5"

# ============================================
# 颜色配置（用于脚本输出）
# ============================================
export COLOR_RED='\033[0;31m'
export COLOR_GREEN='\033[0;32m'
export COLOR_YELLOW='\033[1;33m'
export COLOR_BLUE='\033[0;34m'
export COLOR_PURPLE='\033[0;35m'
export COLOR_CYAN='\033[0;36m'
export COLOR_WHITE='\033[1;37m'
export COLOR_RESET='\033[0m'

# ============================================
# 版本信息
# ============================================
export NAS_DDNS_VERSION="1.0.0"
export NAS_DDNS_BUILD_DATE="$(date '+%Y%m%d')"
export NAS_DDNS_AUTHOR="System Admin"
export NAS_DDNS_DESCRIPTION="NAS DDNS and Proxy System"

# ============================================
# 工具函数
# ============================================
# 加载配置
load_config() {
    if [ -f "${NAS_BASE_DIR}/config/env.sh" ]; then
        source "${NAS_BASE_DIR}/config/env.sh"
    fi
}

# 日志函数
log_info() {
    echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${COLOR_GREEN}[SUCCESS]${COLOR_RESET} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${COLOR_YELLOW}[WARNING]${COLOR_RESET} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "命令 $1 不存在，请安装后重试"
        return 1
    fi
    return 0
}

# 检查服务状态
check_service() {
    if systemctl is-active --quiet "$1"; then
        log_success "服务 $1 正在运行"
        return 0
    else
        log_error "服务 $1 未运行"
        return 1
    fi
}

# 检查文件是否存在
check_file() {
    if [ -f "$1" ]; then
        log_success "文件 $1 存在"
        return 0
    else
        log_error "文件 $1 不存在"
        return 1
    fi
}

# 检查目录是否存在
check_dir() {
    if [ -d "$1" ]; then
        log_success "目录 $1 存在"
        return 0
    else
        log_error "目录 $1 不存在"
        return 1
    fi
}

# 创建目录（如果不存在）
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        log_info "创建目录: $1"
    fi
}

# 备份文件
backup_file() {
    local file="$1"
    local backup_dir="${NAS_BACKUP_DIR}/$(date +%Y%m%d)"
    
    create_dir "$backup_dir"
    
    if [ -f "$file" ]; then
        cp "$file" "${backup_dir}/$(basename "$file").$(date +%H%M%S).bak"
        log_info "备份文件: $file"
    fi
}

# 恢复文件
restore_file() {
    local file="$1"
    local backup_date="$2"
    local backup_dir="${NAS_BACKUP_DIR}/${backup_date}"
    
    if [ -f "${backup_dir}/$(basename "$file").bak" ]; then
        cp "${backup_dir}/$(basename "$file").bak" "$file"
        log_info "恢复文件: $file"
        return 0
    else
        log_error "备份文件不存在: ${backup_dir}/$(basename "$file").bak"
        return 1
    fi
}

# 清理旧文件
cleanup_old_files() {
    local dir="$1"
    local pattern="$2"
    local days="$3"
    
    if [ -d "$dir" ]; then
        find "$dir" -name "$pattern" -mtime +$days -delete
        log_info "清理 $dir 中超过 $days 天的 $pattern 文件"
    fi
}

# 发送通知（待实现）
send_notification() {
    local title="$1"
    local message="$2"
    local level="$3"
    
    if [ "$NOTIFICATION_ENABLED" = "true" ]; then
        case "$NOTIFICATION_TYPE" in
            "email")
                # 邮件通知实现
                ;;
            "telegram")
                # Telegram通知实现
                ;;
            "slack")
                # Slack通知实现
                ;;
            *)
                log_warning "未配置通知类型"
                ;;
        esac
    fi
}

# 初始化环境
init_environment() {
    # 创建必要目录
    create_dir "${NAS_LOGS_DIR}"
    create_dir "${NAS_REPORTS_DIR}"
    create_dir "${NAS_RUN_DIR}"
    create_dir "${NAS_BACKUP_DIR}"
    create_dir "${NAS_BACKUP_DIR}/config"
    
    # 设置权限
    chmod 750 "${NAS_BASE_DIR}"
    chmod 644 "${NAS_BASE_DIR}/config/env.sh"
    
    log_success "环境初始化完成"
}

# 加载配置
load_config
