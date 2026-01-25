#!/bin/bash

REPORT_DIR="/opt/yyc3/reports"
mkdir -p "$REPORT_DIR"

REPORT_FILE="$REPORT_DIR/daily-report-$(date +%Y%m%d).txt"

{
    echo "=== NAS DDNS 每日报告 ==="
    echo "报告日期: $(date '+%Y-%m-%d')"
    echo "生成时间: $(date '+%H:%M:%S')"
    echo ""
    
    echo "1. DNS解析状态:"
    DNS_IP=$(dig nas.0379.email +short 2>/dev/null | head -1)
    if [ "$DNS_IP" = "8.152.195.33" ]; then
        echo "✅ 解析正确: nas.0379.email → $DNS_IP"
    else
        echo "❌ 解析异常: nas.0379.email → $DNS_IP (期望: 8.152.195.33)"
    fi
    echo ""
    
    echo "2. 服务可用性:"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "http://nas.0379.email/health")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ HTTP服务正常 (状态码: $HTTP_CODE)"
    else
        echo "❌ HTTP服务异常 (状态码: $HTTP_CODE)"
    fi
    echo ""
    
    echo "3. 服务运行状态:"
    for service in nginx yyc3-ddns.timer nas-monitor.timer; do
        if systemctl is-active --quiet "$service"; then
            echo "✅ $service: 运行中"
        else
            echo "❌ $service: 停止"
        fi
    done
    echo ""
    
    echo "4. 资源监控:"
    echo "CPU负载: $(uptime | awk -F'load average:' '{print $2}')"
    echo "内存使用: $(free -h | awk '/^Mem:/ {print $3"/"$2}')"
    echo "磁盘使用: $(df -h / | awk 'NR==2 {print $3"/"$2 " ("$5")"}')"
    echo ""
    
    echo "5. 24小时访问统计:"
    if [ -f "/var/log/nginx/nas_access.log" ]; then
        echo "总访问次数: $(grep -c "GET /" /var/log/nginx/nas_access.log 2>/dev/null || echo 0)"
        echo "健康检查次数: $(grep -c "GET /health" /var/log/nginx/nas_access.log 2>/dev/null || echo 0)"
    else
        echo "Nginx日志文件不存在"
    fi
    echo ""
    
    echo "6. DDNS更新记录:"
    journalctl -u yyc3-ddns.service --since="24 hours ago" --no-pager 2>/dev/null | \
        grep -E "(开始DDNS检查|IP未变化|更新成功|错误)" | tail -10 || echo "无相关记录"
    echo ""
    
    echo "=== 报告结束 ==="
} > "$REPORT_FILE"

echo "每日报告已生成: $REPORT_FILE"

# 保留最近7天的报告
find "$REPORT_DIR" -name "daily-report-*.txt" -mtime +7 -delete
