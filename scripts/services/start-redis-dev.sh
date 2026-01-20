#!/bin/bash
# 功能：启动本地开发环境Redis，校验配置合法性（防误启动生产配置）
set -e

# ============================== 环境变量（与本地路径匹配） ==============================
CONF_BASE="/Users/yanyu/Projects/redis-config/config/redis-base.conf"
CONF_DEV="/Users/yanyu/Projects/redis-config/config/redis-dev.conf"
NAS_DATA_DIR="/Users/yanyu/nas/volume2/redis/dev/data"
LOG_DIR="/opt/homebrew/var/log/redis"  # Homebrew默认日志路径

# ============================== 前置校验 ==============================
echo "🔍 开始校验开发环境配置..."

# 1. 检查配置文件是否存在
if [ ! -f "$CONF_BASE" ] || [ ! -f "$CONF_DEV" ]; then
  echo "❌ 错误：配置文件缺失，请确保以下文件存在："
  echo "   - $CONF_BASE"
  echo "   - $CONF_DEV"
  exit 1
fi

# 2. 检查是否误引入生产配置
if grep -q "prod_environment_only = true" "$CONF_DEV"; then
  echo "❌ 错误：开发配置文件包含生产环境标识，可能混淆配置！"
  exit 1
fi

# 3. 检查NAS数据目录是否挂载（依赖~/.zshrc的nas-mount）
if [ ! -d "$NAS_DATA_DIR" ]; then
  echo "⚠️ 警告：NAS数据目录未挂载，尝试自动挂载..."
  nas-mount  # 调用~/.zshrc中的挂载函数
  if [ ! -d "$NAS_DATA_DIR" ]; then
    echo "❌ 错误：NAS数据目录挂载失败，请手动执行nas-up后重试"
    exit 1
  fi
fi

# 4. 确保日志目录存在
mkdir -p "$LOG_DIR"

# ============================== 启动Redis ==============================
echo "🚀 启动开发环境Redis（Mac M4 + NAS存储）..."

# 停止可能存在的旧实例

# 用开发配置启动（指定配置文件）
redis-server "$CONF_DEV" &

# 验证启动状态
sleep 2  # 等待服务启动
if redis-cli -p 6379 ping | grep -q "PONG"; then
  echo "✅ 开发环境Redis启动成功！"
  echo "   - 配置文件：$CONF_DEV"
  echo "   - 数据存储：$NAS_DATA_DIR"
  echo "   - 日志路径：$LOG_DIR/redis-server.log"
else
  echo "❌ 启动失败，请查看日志：$LOG_DIR/redis-server.log"
  exit 1
fi