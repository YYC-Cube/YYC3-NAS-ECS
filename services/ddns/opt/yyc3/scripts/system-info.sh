#!/bin/bash

echo "=== 系统信息报告 ==="
echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo "1. 系统概览:"
echo "主机名: $(hostname)"
echo "系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
echo "内核: $(uname -r)"
echo "架构: $(uname -m)"
echo ""

echo "2. 网络信息:"
echo "公网IP: $(curl -s ifconfig.me 2>/dev/null || echo "无法获取")"
echo "内网IP: $(hostname -I)"
echo "DNS解析(nas.0379.email): $(dig nas.0379.email +short 2>/dev/null | tr '\n' ' ')"
echo ""

echo "3. 服务状态:"
echo "Nginx: $(systemctl is-active nginx)"
echo "DDNS定时器: $(systemctl is-active yyc3-ddns.timer)"
echo "监控定时器: $(systemctl is-active nas-monitor.timer)"
echo ""

echo "4. 资源使用:"
echo "CPU负载: $(uptime | awk -F'load average:' '{print $2}')"
echo "内存: $(free -h | awk '/^Mem:/ {print $3"/"$2 " ("$3/$2*100"%)"}')"
echo "磁盘(/): $(df -h / | awk 'NR==2 {print $3"/"$2 " ("$5")"}')"
echo "运行时间: $(uptime -p)"
echo ""

echo "5. 最近日志:"
echo "Nginx访问日志:"
tail -5 /var/log/nginx/nas_access.log 2>/dev/null || echo "  无日志"
echo ""
echo "DDNS日志:"
journalctl -u yyc3-ddns.service -n 3 --no-pager 2>/dev/null | grep -E "(开始DDNS检查|IP未变化|更新成功)" || echo "  无相关日志"
echo ""

echo "6. 目录结构:"
echo "/opt/yyc3/ 目录内容:"
ls -la /opt/yyc3/ 2>/dev/null || echo "  目录不存在"
echo ""

echo "=== 报告结束 ==="
