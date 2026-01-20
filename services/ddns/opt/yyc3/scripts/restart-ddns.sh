#!/bin/bash
# DDNS服务重启脚本 - 完整重启DDNS相关服务

# 设置变量
LOG_FILE="/opt/yyc3/logs/restart-ddns.log"
DDNS_SERVICE="ddns-api.service"
NGINX_SERVICE="nginx.service"
HEALTH_CHECK_URL="http://127.0.0.1:5000/health"

# 确保日志目录存在
mkdir -p /opt/yyc3/logs

# 记录开始时间
echo "=======================================" >> $LOG_FILE
echo "DDNS服务重启开始: $(date)" >> $LOG_FILE

# 重启DDNS API服务
echo "重启DDNS API服务..."
echo "重启DDNS API服务..." >> $LOG_FILE
systemctl restart $DDNS_SERVICE

sleep 3

# 检查DDNS API服务状态
if systemctl is-active --quiet $DDNS_SERVICE; then
    echo "✓ DDNS API服务重启成功"
    echo "DDNS API服务重启成功" >> $LOG_FILE
else
    echo "✗ DDNS API服务重启失败"
    echo "DDNS API服务重启失败" >> $LOG_FILE
    journalctl -u $DDNS_SERVICE -n 20 --no-pager >> $LOG_FILE
    exit 1
fi

# 重启Nginx服务
echo "重启Nginx服务..."
echo "重启Nginx服务..." >> $LOG_FILE
systemctl restart $NGINX_SERVICE

sleep 2

# 检查Nginx服务状态
if systemctl is-active --quiet $NGINX_SERVICE; then
    echo "✓ Nginx服务重启成功"
    echo "Nginx服务重启成功" >> $LOG_FILE
else
    echo "✗ Nginx服务重启失败"
    echo "Nginx服务重启失败" >> $LOG_FILE
    journalctl -u $NGINX_SERVICE -n 20 --no-pager >> $LOG_FILE
    exit 1
fi

# 健康检查
echo -e "\n执行服务健康检查..."
echo "执行服务健康检查..." >> $LOG_FILE

# 等待服务完全启动
sleep 3

# 测试API状态
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL)

if [ "$API_STATUS" -eq 200 ]; then
    echo "✓ API健康检查通过"
    echo "API健康检查通过 (HTTP $API_STATUS)" >> $LOG_FILE
    
    # 获取详细健康信息
    HEALTH_DETAILS=$(curl -s $HEALTH_CHECK_URL)
    echo "API状态详情: $HEALTH_DETAILS" >> $LOG_FILE
    
    # 提取并显示API状态
    API_STATUS_TEXT=$(echo $HEALTH_DETAILS | python3 -c "
import json, sys
try:
    data = json.loads(sys.stdin.read())
    print(data.get('status', '未知'))
except:
    print('解析错误')")
    echo "API状态: $API_STATUS_TEXT"
else
    echo "✗ API健康检查失败 (HTTP $API_STATUS)"
    echo "API健康检查失败 (HTTP $API_STATUS)" >> $LOG_FILE
    
    # 尝试获取错误信息
    ERROR_INFO=$(curl -s $HEALTH_CHECK_URL 2>&1)
    echo "错误信息: $ERROR_INFO" >> $LOG_FILE
fi

# 测试Nginx反向代理
PROXY_URL="http://127.0.0.1/health"
PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $PROXY_URL)

if [ "$PROXY_STATUS" -eq 200 ]; then
    echo "✓ Nginx反向代理工作正常"
    echo "Nginx反向代理工作正常 (HTTP $PROXY_STATUS)" >> $LOG_FILE
else
    echo "✗ Nginx反向代理失败 (HTTP $PROXY_STATUS)"
    echo "Nginx反向代理失败 (HTTP $PROXY_STATUS)" >> $LOG_FILE
fi

# 检查日志文件
echo -e "\n检查最新日志:"
echo "检查最新日志..." >> $LOG_FILE

# 显示API日志最后10行
echo -e "\nDDNS API服务日志 (最后10行):"
journalctl -u $DDNS_SERVICE -n 10 --no-pager

# 显示Nginx日志最后10行
echo -e "\nNginx服务日志 (最后10行):"
journalctl -u $NGINX_SERVICE -n 10 --no-pager

# 记录结束时间
echo "DDNS服务重启完成: $(date)" >> $LOG_FILE
echo "=======================================" >> $LOG_FILE
echo -e "\n重启过程已记录到: $LOG_FILE"
echo "重启完成: $(date)"