#!/bin/bash
# quick-restart.sh - 快速重启脚本

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "YYC³ 重启所有服务"
echo "=========================================="
echo ""

# 先停止
"${SCRIPT_DIR}/quick-stop.sh"

# 等待3秒
echo ""
echo "等待 3 秒..."
sleep 3

# 再启动
echo ""
"${SCRIPT_DIR}/quick-start.sh"
