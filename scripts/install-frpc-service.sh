#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVICE_FILE="$PROJECT_ROOT/systemd/frpc.service"
SYSTEMD_DIR="/etc/systemd/system"
SERVICE_PATH="$SYSTEMD_DIR/frpc.service"
FRPC_CONFIG_PATH="$PROJECT_ROOT/frpc.toml"
TARGET_CONFIG_PATH="/opt/nas-ecs/frpc/frpc.toml"

echo "=========================================="
echo "  YYC3 NAS-ECS FRPC 服务安装"
echo "=========================================="
echo ""

if [ "$(id -u)" -ne 0 ]; then
    echo "错误: 此脚本需要 root 权限运行"
    echo "请使用: sudo $0"
    exit 1
fi

echo "1. 检查 frpc 可执行文件..."
if ! command -v frpc &> /dev/null; then
    echo "错误: frpc 未安装"
    echo "请先安装 frpc: https://github.com/fatedier/frp"
    exit 1
fi
echo "  ✓ frpc 已安装: $(which frpc)"
echo ""

echo "2. 创建配置目录..."
mkdir -p /opt/nas-ecs/frpc
echo "  ✓ 目录已创建: /opt/nas-ecs/frpc"
echo ""

echo "3. 复制配置文件..."
if [ -f "$FRPC_CONFIG_PATH" ]; then
    cp "$FRPC_CONFIG_PATH" "$TARGET_CONFIG_PATH"
    echo "  ✓ 配置文件已复制: $TARGET_CONFIG_PATH"
else
    echo "错误: 配置文件不存在: $FRPC_CONFIG_PATH"
    exit 1
fi
echo ""

echo "4. 设置配置文件权限..."
chmod 644 "$TARGET_CONFIG_PATH"
chown root:root "$TARGET_CONFIG_PATH"
echo "  ✓ 权限已设置"
echo ""

echo "5. 安装 systemd 服务..."
if [ -f "$SERVICE_FILE" ]; then
    cp "$SERVICE_FILE" "$SERVICE_PATH"
    echo "  ✓ 服务文件已安装: $SERVICE_PATH"
else
    echo "错误: 服务文件不存在: $SERVICE_FILE"
    exit 1
fi
chmod 644 "$SERVICE_PATH"
echo ""

echo "6. 重载 systemd 配置..."
systemctl daemon-reload
echo "  ✓ systemd 配置已重载"
echo ""

echo "7. 启用 frpc 服务..."
systemctl enable frpc.service
echo "  ✓ frpc 服务已启用开机自启"
echo ""

echo "8. 启动 frpc 服务..."
systemctl start frpc.service
echo "  ✓ frpc 服务已启动"
echo ""

echo "9. 检查服务状态..."
sleep 2
if systemctl is-active --quiet frpc.service; then
    echo "  ✓ frpc 服务运行正常"
else
    echo "  ⚠ frpc 服务可能未正常启动"
fi
echo ""

echo "=========================================="
echo "  安装完成！"
echo "=========================================="
echo ""
echo "常用命令："
echo "  查看状态:  systemctl status frpc.service"
echo "  重启服务:  systemctl restart frpc.service"
echo "  停止服务:  systemctl stop frpc.service"
echo "  查看日志:  journalctl -u frpc -f"
echo ""
echo "配置文件: $TARGET_CONFIG_PATH"
echo "服务文件: $SERVICE_PATH"
echo ""
