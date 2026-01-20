cat > /opt/yyc3/scripts/monitor-nas.sh << 'EOF'
#!/bin/bash

# NAS监控脚本
# 定时检查NAS访问状态

LOG_DIR="/opt/yyc3/logs/monitor"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/nas-monitor-$(date +%Y%m%d).log"
DOMAIN="ddns.0379.email"
EXPECTED_IP="8.152.195.33"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查DNS
check_dns() {
    local current_ip=$(dig +short "$DOMAIN" | head -1)
    
    if [ -z "$current_ip" ]; then
        log "❌ DNS解析失败: $DOMAIN"
        return 1
    fi
    
    if [ "$current_ip" = "$EXPECTED_IP" ]; then
        log "✅ DNS解析正确: $DOMAIN → $current_ip"
        return 0
    else
        log "❌ DNS解析错误: $DOMAIN → $current_ip (期望: $EXPECTED_IP)"
        return 1
    fi
}

# 检查HTTP服务
check_http() {
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$DOMAIN/health")
    
    if [ "$http_status" = "200" ]; then
        log "✅ HTTP服务正常: 状态码 $http_status"
        return 0
    else
        log "❌ HTTP服务异常: 状态码 $http_status"
        return 1
    fi
}

# 检查Nginx服务
check_nginx() {
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx服务运行正常"
        return 0
    else
        log "❌ Nginx服务停止"
        return 1
    fi
}

# 检查DDNS服务
check_ddns() {
    if systemctl is-active --quiet yyc3-ddns.timer; then
        log "✅ DDNS定时器运行正常"
        return 0
    else
        log "❌ DDNS定时器停止"
        return 1
    fi
}

# 主监控函数
main_monitor() {
    log "开始NAS监控检查..."
    
    local errors=0
    
    check_dns || ((errors++))
    check_http || ((errors++))
    check_nginx || ((errors++))
    check_ddns || ((errors++))
    
    if [ $errors -eq 0 ]; then
        log "✅ 所有检查通过，系统正常"
    else
        log "❌ 发现 $errors 个问题，请检查"
    fi
    
    log "监控检查完成"
}

# 命令行参数处理
case "$1" in
    "check")
        main_monitor
        ;;
    "logs")
        echo "=== 监控日志 ==="
        tail -50 "$LOG_FILE" 2>/dev/null || echo "无日志记录"
        ;;
    *)
        echo "用法: $0 {check|logs}"
        echo "  check    - 执行监控检查"
        echo "  logs     - 查看监控日志"
        exit 1
        ;;
esac
EOF

chmod +x /opt/yyc3/scripts/monitor-nas.sh