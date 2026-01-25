#!/bin/bash
# DDNS服务监控脚本

LOG_FILE="/opt/yyc3/logs/ddns_monitor.log"
API_URL="http://127.0.0.1:8080/health"
STATUS_FILE="/opt/yyc3/run/ddns_status.json"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 检查API服务
check_api() {
    if curl -s --max-time 5 "$API_URL" > /dev/null; then
        log "API服务正常"
        return 0
    else
        log "API服务异常"
        return 1
    fi
}

# 检查DDNS进程
check_ddns() {
    if systemctl is-active --quiet yyc3-ddns.timer; then
        log "DDNS定时器正常"
        return 0
    else
        log "DDNS定时器异常"
        return 1
    fi
}

# 重启服务
restart_service() {
    local service=$1
    log "尝试重启服务: $service"
    systemctl restart "$service"
    
    if systemctl is-active --quiet "$service"; then
        log "服务重启成功: $service"
        return 0
    else
        log "服务重启失败: $service"
        return 1
    fi
}

# 发送通知（如果需要）
send_notification() {
    local message=$1
    # 这里可以添加邮件、钉钉、微信等通知
    log "通知: $message"
}

# 主监控逻辑
main() {
    log "开始DDNS服务监控检查"
    
    # 检查API服务
    if ! check_api; then
        log "API服务异常，尝试重启..."
        if restart_service "ddns-api.service"; then
            send_notification "DDNS API服务已重启"
        else
            send_notification "DDNS API服务重启失败，需要手动检查"
        fi
    fi
    
    # 检查DDNS定时器
    if ! check_ddns; then
        log "DDNS定时器异常，尝试重启..."
        if restart_service "yyc3-ddns.timer"; then
            send_notification "DDNS定时器已重启"
        else
            send_notification "DDNS定时器重启失败，需要手动检查"
        fi
    fi
    
    # 检查Nginx
    if ! systemctl is-active --quiet nginx; then
        log "Nginx服务异常，尝试重启..."
        if restart_service "nginx"; then
            send_notification "Nginx服务已重启"
        else
            send_notification "Nginx服务重启失败，需要手动检查"
        fi
    fi
    
    log "DDNS服务监控检查完成"
}

# 执行主函数
main
