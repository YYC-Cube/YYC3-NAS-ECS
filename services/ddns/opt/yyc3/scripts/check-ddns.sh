#!/bin/bash
# DDNS快速检查脚本

echo "=== DDNS服务状态检查 ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "主机: $(hostname)"
echo "IP: $(hostname -I | awk '{print $1}')"
echo ""

# 服务状态
echo "服务状态:"
echo "  DDNS API: $(systemctl is-active ddns-api.service 2>/dev/null || echo 'unknown')"
echo "  DDNS定时器: $(systemctl is-active yyc3-ddns.timer 2>/dev/null || echo 'unknown')"
echo "  Nginx: $(systemctl is-active nginx 2>/dev/null || echo 'unknown')"
echo ""

# API测试
echo "API测试:"
if curl -s --max-time 3 http://127.0.0.1:8080/health > /dev/null; then
    echo "  ✓ API服务响应正常"
    STATUS=$(curl -s http://127.0.0.1:8080/api/ddns/status 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f'  DDNS状态: {\"运行中\" if data.get(\"ddns_running\") else \"停止\"}')
    print(f'  当前IP: {data.get(\"current_ip\", \"未知\")}')
except:
    print('  DDNS状态: 获取失败')
")
    echo "$STATUS"
else
    echo "  ✗ API服务无响应"
fi
echo ""

# 端口检查
echo "端口监听:"
netstat -tlnp 2>/dev/null | grep -E ':(80|443|8080)' | awk '{print "  " $4 " -> " $7}' | sort
echo ""

# 最近日志
echo "最近日志 (最后5行):"
journalctl -u ddns-api.service -n 5 --no-pager 2>/dev/null | tail -5 | sed 's/^/  /'
