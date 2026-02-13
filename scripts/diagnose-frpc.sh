#!/bin/bash

echo "=========================================="
echo "  FRPC 服务诊断脚本"
echo "=========================================="
echo ""

echo "1. 检查 frpc 可执行文件..."
if [ -f "/usr/local/bin/frpc" ]; then
    echo "  ✓ frpc 文件存在: /usr/local/bin/frpc"
    echo "  文件大小: $(ls -lh /usr/local/bin/frpc | awk '{print $5}')"
    echo "  文件权限: $(ls -l /usr/local/bin/frpc | awk '{print $1}')"
    
    if [ -x "/usr/local/bin/frpc" ]; then
        echo "  ✓ 文件有执行权限"
    else
        echo "  ✗ 文件缺少执行权限"
        echo "  解决: sudo chmod +x /usr/local/bin/frpc"
    fi
    
    echo "  架构: $(file /usr/local/bin/frpc | grep -oE '[0-9]+-bit')"
    echo "  文件类型: $(file /usr/local/bin/frpc | cut -d: -f2-)"
else
    echo "  ✗ frpc 文件不存在: /usr/local/bin/frpc"
    echo ""
    echo "查找 frpc 可能位置..."
    for path in /usr/local/bin/frpc /usr/bin/frpc /opt/frpc/frpc /root/frp/frpc; do
        if [ -f "$path" ]; then
            echo "  找到: $path"
        fi
    done
    echo ""
    echo "解决: 请先安装 frpc"
    echo "  下载地址: https://github.com/fatedier/frp/releases"
fi
echo ""

echo "2. 检查配置文件..."
CONFIG_FILE="/Volume1/www/frpc/frpc.toml"
if [ -f "$CONFIG_FILE" ]; then
    echo "  ✓ 配置文件存在: $CONFIG_FILE"
    echo "  文件权限: $(ls -l "$CONFIG_FILE" | awk '{print $1}')"
    
    echo ""
    echo "  测试配置文件语法..."
    /usr/local/bin/frpc -c "$CONFIG_FILE" --dry-run 2>&1 | head -20
    if [ $? -eq 0 ]; then
        echo "  ✓ 配置文件语法正确"
    else
        echo "  ✗ 配置文件有错误"
    fi
else
    echo "  ✗ 配置文件不存在: $CONFIG_FILE"
    echo "  解决: 确保配置文件路径正确"
fi
echo ""

echo "3. 检查日志目录..."
LOG_DIR="/Volume1/www/frpc/logs"
if [ -d "$LOG_DIR" ]; then
    echo "  ✓ 日志目录存在: $LOG_DIR"
    echo "  目录权限: $(ls -ld "$LOG_DIR" | awk '{print $1}')"
    
    if [ -w "$LOG_DIR" ]; then
        echo "  ✓ 日志目录可写"
    else
        echo "  ✗ 日志目录不可写"
        echo "  解决: sudo chmod 755 $LOG_DIR && sudo chown root:root $LOG_DIR"
    fi
else
    echo "  ✗ 日志目录不存在: $LOG_DIR"
    echo "  解决: mkdir -p $LOG_DIR"
fi
echo ""

echo "4. 检查网络连接..."
echo "  测试连接到 frps 服务器 (SERVER_IP_PLACEHOLDER:7001)..."
if timeout 3 bash -c "cat < /dev/null > /dev/tcp/SERVER_IP_PLACEHOLDER/7001" 2>/dev/null; then
    echo "  ✓ 可以连接到 frps 服务器"
else
    echo "  ✗ 无法连接到 frps 服务器"
    echo "  解决: 检查网络连接和防火墙设置"
fi
echo ""

echo "5. 检查本地端口..."
for port in 6000 6001 6002 6003 6006 6007 6009 8989; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "  ✓ 端口 $port 正在监听"
    else
        echo "  - 端口 $port 未监听"
    fi
done
echo ""

echo "6. 检查 systemd 服务..."
if systemctl list-unit-files | grep -q "frpc.service"; then
    echo "  ✓ frpc.service 已安装"
    systemctl cat frpc.service | grep -E "(ExecStart|WorkingDirectory|User|Group)"
else
    echo "  ✗ frpc.service 未安装"
fi
echo ""

echo "7. 手动测试 frpc..."
if [ -x "/usr/local/bin/frpc" ] && [ -f "$CONFIG_FILE" ]; then
    echo "  尝试手动启动 frpc（5秒超时）..."
    timeout 5 /usr/local/bin/frpc -c "$CONFIG_FILE" 2>&1 | head -30
    RESULT=$?
    if [ $RESULT -eq 124 ]; then
        echo ""
        echo "  ✓ frpc 启动成功（超时退出是正常的）"
    elif [ $RESULT -eq 0 ]; then
        echo ""
        echo "  ✓ frpc 运行正常"
    else
        echo ""
        echo "  ✗ frpc 启动失败，退出码: $RESULT"
    fi
fi
echo ""

echo "=========================================="
echo "  诊断完成"
echo "=========================================="
