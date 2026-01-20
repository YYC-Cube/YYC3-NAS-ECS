#!/bin/bash
# 功能：部署前强制校验生产配置安全性，禁止危险配置
set -e

# ============================== 环境变量 ==============================
CONF_PROD="/Users/yanyu/Projects/redis-config/config/redis-prod.conf"
REQUIRED_PASSWORD="redis_yyc3"  # 生产强制密码
ALLOW_WEAK_PROD="${ALLOW_WEAK_PROD:-0}"   # 允许弱校验（本地调试用）

# ============================== 安全校验 ==============================
echo "🔒 开始生产环境配置安全校验..."

# 1. 检查配置文件存在
if [ ! -f "$CONF_PROD" ]; then
  echo "❌ 错误：生产配置文件不存在：$CONF_PROD"
  exit 1
fi

# 2. 基本结构校验（环境标识用注释行与关键项替代）
if ! grep -q "生产环境专属配置" "$CONF_PROD"; then
  echo "❌ 错误：生产配置缺少环境注释标识"
  exit 1
fi
if ! grep -q "include /etc/redis/redis-base.conf" "$CONF_PROD"; then
  echo "❌ 错误：生产配置未包含基础配置（容器路径）"
  exit 1
fi
if ! grep -q "protected-mode yes" "$CONF_PROD"; then
  echo "❌ 错误：生产未开启 protected-mode"
  exit 1
fi

# 3. 检查是否启用密码（允许弱校验时跳过）
if [[ "$ALLOW_WEAK_PROD" != "1" ]]; then
  if ! grep -q "requirepass $REQUIRED_PASSWORD" "$CONF_PROD"; then
    echo "❌ 错误：生产环境未设置正确密码（要求：$REQUIRED_PASSWORD）"
    exit 1
  fi
else
  echo "⚠️ 警告：已开启弱校验(ALLOW_WEAK_PROD=1)，跳过密码检查"
fi

# 4. 检查是否禁止开发网段（192.168.3.0/24）
if grep -q "bind 192.168.3." "$CONF_PROD"; then
  echo "❌ 错误：生产配置绑定了开发网段（192.168.3.x），禁止部署！"
  exit 1
fi

# 5. 检查危险命令是否禁用（允许弱校验时跳过）
if [[ "$ALLOW_WEAK_PROD" != "1" ]]; then
  DANGEROUS_COMMANDS=("FLUSHALL" "FLUSHDB")
  for cmd in "${DANGEROUS_COMMANDS[@]}"; do
    if ! grep -q "rename-command $cmd \"\"" "$CONF_PROD"; then
      echo "❌ 错误：生产配置未禁用危险命令 $cmd"
      exit 1
    fi
  done
else
  echo "⚠️ 警告：已开启弱校验(ALLOW_WEAK_PROD=1)，跳过危险命令检查"
fi

# 6. 检查数据目录是否为容器内生产路径
if ! grep -q "dir /data" "$CONF_PROD"; then
  echo "⚠️ 警告：生产数据目录未设置为容器路径 /data，确认后继续..."
  read -p "是否继续？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "✅ 生产环境配置校验通过，安全可部署！"
