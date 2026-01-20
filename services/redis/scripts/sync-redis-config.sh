#!/bin/bash
# 功能：从GitHub拉取最新Redis配置，覆盖本地配置（支持多设备同步）
set -e

# ============================== 环境变量（你的GitHub信息） ==============================
GIT_REPO="https://github.com/yanyu/redis-config-multi-device.git"  # 仓库地址（yanyu为你的Git用户名）
LOCAL_CONFIG_DIR="/Users/yanyu/Projects/redis-config"  # 本地仓库根目录
TMP_DIR="/tmp/redis-config-tmp"                        # 临时目录

# ============================== 同步逻辑 ==============================
echo "🔄 开始从GitHub同步Redis配置（多设备同步）..."

# 1. 克隆仓库到临时目录
rm -rf "$TMP_DIR" 2>/dev/null
if ! git clone "$GIT_REPO" "$TMP_DIR"; then
  echo "❌ 错误：GitHub仓库克隆失败，请检查仓库地址或网络"
  exit 1
fi

# 2. 检查仓库核心文件是否完整
REQUIRED_FILES=(
  "config/redis-base.conf"
  "config/redis-dev.conf"
  "config/redis-prod.conf"
  "config/docker-compose.yml"
  "scripts/start-redis-dev.sh"
  "scripts/check-redis-prod.sh"
  "scripts/start-redis-docker.sh"
)
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$TMP_DIR/$file" ]; then
    echo "❌ 错误：GitHub仓库缺少必要文件：$file"
    rm -rf "$TMP_DIR"
    exit 1
  fi
done

# 3. 备份本地旧配置（按日期创建备份目录）
BACKUP_DIR="$LOCAL_CONFIG_DIR/backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 备份本地旧配置到：$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/config" "$BACKUP_DIR/scripts"
cp -r "$LOCAL_CONFIG_DIR/config"/*.conf "$BACKUP_DIR/config/" 2>/dev/null
cp -r "$LOCAL_CONFIG_DIR/scripts"/*.sh "$BACKUP_DIR/scripts/" 2>/dev/null

# 4. 复制新配置到本地（覆盖旧文件）
cp -r "$TMP_DIR/config"/*.conf "$LOCAL_CONFIG_DIR/config/"
cp -r "$TMP_DIR/scripts"/*.sh "$LOCAL_CONFIG_DIR/scripts/"
cp -r "$TMP_DIR/docker-compose.yml" "$LOCAL_CONFIG_DIR/config/" 2>/dev/null  # 同步docker配置

# 5. 修复文件权限（脚本可执行，配置文件只读）
chmod 644 "$LOCAL_CONFIG_DIR/config"/*.conf
chmod +x "$LOCAL_CONFIG_DIR/scripts"/*.sh

# 6. 清理临时目录
rm -rf "$TMP_DIR"

echo "✅ GitHub配置同步完成！本地路径：$LOCAL_CONFIG_DIR"
echo "💡 提示：同步后需重启服务生效："
echo "   - 本地启动：$LOCAL_CONFIG_DIR/scripts/start-redis-dev.sh"
echo "   - Docker启动：$LOCAL_CONFIG_DIR/scripts/start-redis-docker.sh"
