cat > /opt/yyc3/scripts/setup-summary.sh << 'EOF'
#!/bin/bash

# NAS SSH隧道脚本
TUNNEL_PORTS="5000 5001 5002 5003 5005 9557"                                        
LOG_FILE="/opt/yyc3/logs/nas-tunnel.log"
PID_FILE="/opt/yyc3/run/nas-tunnel.pid"

mkdir -p /opt/yyc3/logs /opt/yyc3/run

start_tunnel() {
    echo "启动NAS隧道..."
    
    # 为每个端口创建隧道
    for port in $TUNNEL_PORTS; do
        ssh -f -N -L $port:localhost:$port nas-tunnel
        if [ $? -eq 0 ]; then
            echo "端口 $port 隧道启动成功"
        else
            echo "端口 $port 隧道启动失败"
        fi
    done
    
    # 记录PID（这里简化处理，实际应该记录所有PID）
    echo "隧道启动完成"
    echo "注意：需要确保本地NAS可以通过公网访问"
}

stop_tunnel() {
    echo "停止NAS隧道..."
    pkill -f "ssh.*nas-tunnel"
    echo "隧道已停止"
}

status_tunnel() {
    echo "=== NAS隧道状态 ==="
    echo "隧道端口: $TUNNEL_PORTS"
    echo ""
    
    local running=0
    for port in $TUNNEL_PORTS; do
        if ss -tln | grep -q ":$port "; then
            echo "  ✅ 端口 $port: 监听中"
            running=1
        else
            echo "  ❌ 端口 $port: 未监听"
        fi
    done
    
    if [ $running -eq 1 ]; then
        echo "✅ 隧道运行正常"
    else
        echo "❌ 隧道未运行"
    fi
}

case "$1" in
    start) start_tunnel ;;
    stop) stop_tunnel ;;
    restart) stop_tunnel; sleep 2; start_tunnel ;;
    status) status_tunnel ;;
    *) echo "用法: $0 {start|stop|restart|status}" ;;
esac
[root@yyc3-33 ~]# cat /opt/yyc3/scripts/setup-summary.sh
#!/bin/bash

# NAS DDNS配置总结

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  NAS DDNS 配置完成总结                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║  配置项目:                                                   ║"
echo "║  ✅ 1. DDNS脚本已安装: /opt/yyc3/ddns/                      ║"
echo "║  ✅ 2. 阿里云CLI已配置                                      ║"
echo "║  ✅ 3. Systemd定时服务已设置 (5分钟更新)                   ║"
echo "║  ✅ 4. Nginx反向代理已配置: ddns.0379.email                 ║"
echo "║  ✅ 5. 监控系统已安装 (10分钟检查)                         ║"
echo "║  ✅ 6. 管理脚本已创建: /opt/yyc3/scripts/                  ║"
echo "║                                                              ║"
echo "║  访问信息:                                                   ║"
echo "║  🌐 域名: ddns.0379.email                                    ║"
echo "║  ☁  云服务器: 8.152.195.33                                 ║"
echo "║  🏠 本地NAS: 192.168.3.45                                   ║"
echo "║  ⏰ DDNS更新间隔: 5分钟                                     ║"
echo "║                                                              ║"
echo "║  管理命令:                                                   ║"
echo "║  📊 查看状态: /opt/yyc3/scripts/nas-manager.sh             ║"
echo "║  🔍 监控检查: /opt/yyc3/scripts/monitor-nas.sh check       ║"
echo "║  🛠  手动更新: /opt/yyc3/ddns/ddns-simple.sh              ║"
echo "║  📝 查看日志: journalctl -u yyc3-ddns.service              ║"
echo "║                                                              ║"
echo "║  服务状态:                                                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "正在检查服务状态..."
echo ""

# 检查服务状态
services=("yyc3-ddns.timer" "nas-monitor.timer" "nginx")

for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service"; then
        echo "✅ $service: 运行中"
    else
        echo "❌ $service: 停止"
    fi
done

echo ""
echo "检查DNS解析..."
CURRENT_DNS=$(dig +short ddns.0379.email | head -1)
if [ "$CURRENT_DNS" = "8.152.195.33" ]; then
    echo "✅ DNS解析正确: ddns.0379.email → $CURRENT_DNS"
else
    echo "⚠  DNS解析: ddns.0379.email → $CURRENT_DNS (期望: 8.152.195.33)"
fi

echo ""
echo "测试HTTP访问..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://ddns.0379.email/health")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ HTTP访问正常 (状态码: $HTTP_STATUS)"
else
    echo "⚠  HTTP访问: 状态码 $HTTP_STATUS"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   下一步操作建议                            ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║  1. 访问 http://ddns.0379.email 查看NAS门户                  ║"
echo "║  2. 运行 nas-manager.sh 进行系统管理                        ║"
echo "║  3. 检查 /opt/yyc3/logs/ 目录查看日志                       ║"
echo "║  4. 配置本地NAS到云服务器的隧道（如果需要直接访问）        ║"
echo "║  5. 设置警报通知（邮件/Telegram等）                         ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
EOF

chmod +x /opt/yyc3/scripts/setup-summary.sh