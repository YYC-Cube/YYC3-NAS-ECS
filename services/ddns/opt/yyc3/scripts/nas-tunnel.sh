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
