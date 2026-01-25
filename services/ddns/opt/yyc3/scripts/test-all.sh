#!/bin/bash

echo "=== NAS DDNS配置完整测试 ==="
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo "1. 测试DNS解析:"
DNS_IP=$(dig nas.0379.email +short 2>/dev/null | head -1)
if [ -n "$DNS_IP" ]; then
    echo "✅ nas.0379.email → $DNS_IP"
else
    echo "❌ DNS解析失败"
fi
echo ""

echo "2. 测试HTTP访问:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://nas.0379.email/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ HTTP访问正常 (状态码: $HTTP_CODE)"
    # 显示健康信息
    echo "健康信息: $(curl -s --connect-timeout 3 "http://nas.0379.email/health" | tr -d '\n')"
else
    echo "❌ HTTP访问异常 (状态码: $HTTP_CODE)"
fi
echo ""

echo "3. 测试服务状态:"
services=("nginx" "yyc3-ddns.timer" "nas-monitor.timer")
for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service"; then
        echo "✅ $service: 运行中"
    else
        echo "❌ $service: 停止"
    fi
done
echo ""

echo "4. 查看DDNS日志:"
journalctl -u yyc3-ddns.service -n 3 --no-pager 2>/dev/null | grep -E "(开始DDNS检查|IP未变化|更新成功|错误)" || echo "无相关日志"
echo ""

echo "5. 查看Nginx日志:"
if [ -f "/var/log/nginx/nas_access.log" ]; then
    echo "最近访问记录:"
    tail -3 /var/log/nginx/nas_access.log
else
    echo "Nginx日志文件不存在"
fi
echo ""

echo "6. 系统资源检查:"
echo "内存使用: $(free -h | awk '/^Mem:/ {print $3"/"$2 " ("$3/$2*100"%)"}')"
echo "磁盘使用: $(df -h / | awk 'NR==2 {print $3"/"$2 " ("$5")"}')"
echo "运行时间: $(uptime -p)"
echo ""

echo "=== 测试完成 ==="
echo "总结:"
if [ "$HTTP_CODE" = "200" ] && [ -n "$DNS_IP" ] && [ "$DNS_IP" = "8.152.195.33" ]; then
    echo "✅ 所有服务运行正常！"
    echo "您现在可以通过 http://nas.0379.email 访问NAS门户"
else
    echo "⚠️  发现一些问题，请检查以上输出"
fi
