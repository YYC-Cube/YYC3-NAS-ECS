#!/bin/bash
# 功能：一键启动开发/生产环境Docker容器，支持环境选择与非交互参数
set -e

# ============================== 环境变量 ==============================
COMPOSE_FILE="/Users/yanyu/Projects/redis-config/config/docker-compose.yml"
ENV_CHOICE=""

# 选择 docker compose 命令
if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
  DCMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DCMD="docker-compose"
else
  echo "❌ 错误：未检测到 docker compose 或 docker-compose"
  exit 1
fi

# ============================== 参数解析 ==============================
# 支持：--env dev|prod（默认 dev）
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_FLAG="$2"; shift 2;;
    -e)
      ENV_FLAG="$2"; shift 2;;
    *) shift;;
  esac
done

if [[ -n "$ENV_FLAG" ]]; then
  if [[ "$ENV_FLAG" == "dev" ]]; then ENV_CHOICE="1"; fi
  if [[ "$ENV_FLAG" == "prod" ]]; then ENV_CHOICE="2"; fi
fi

# ============================== 交互选择（无参数时） ==============================
if [[ -z "$ENV_CHOICE" ]]; then
  echo "📌 请选择启动的环境："
  echo "   1. 开发环境（redis-dev，192.168.3.x网段，无密码）"
  echo "   2. 生产环境（redis-prod，需先通过check-redis-prod.sh校验）"
  read -p "输入选项(1/2)：" ENV_CHOICE
fi

# 校验输入
if [ "$ENV_CHOICE" != "1" ] && [ "$ENV_CHOICE" != "2" ]; then
  echo "❌ 错误：无效选项，必须输入1或2"
  exit 1
fi

# ============================== 启动容器 ==============================
# 确保docker-compose文件存在
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ 错误：docker-compose.yml不存在：$COMPOSE_FILE"
  exit 1
fi

# 启动开发环境
if [ "$ENV_CHOICE" = "1" ]; then
  echo "🚀 启动开发环境Docker容器（redis-dev）..."
  $DCMD -f "$COMPOSE_FILE" up -d redis-dev
  
  # 验证开发容器状态
  if docker ps | grep -q "redis-dev"; then
    echo "✅ 开发环境启动成功！可通过 redis-cli -p 6379 连接"
  else
    echo "❌ 开发环境启动失败，查看日志：docker logs redis-dev"
    exit 1
  fi
fi

# 启动生产环境（需先校验）
if [ "$ENV_CHOICE" = "2" ]; then
  echo "🔒 检查生产配置合法性..."
  /Users/yanyu/Projects/redis-config/scripts/check-redis-prod.sh
  
  echo "🚀 启动生产环境Docker容器（redis-prod）..."
  $DCMD -f "$COMPOSE_FILE" up -d redis-prod
  
  # 验证生产容器状态
  if docker ps | grep -q "redis-prod"; then
    echo "✅ 生产环境启动成功！可通过 redis-cli -p 6380 -a redis_yyc3 连接"
  else
    echo "❌ 生产环境启动失败，查看日志：docker logs redis-prod"
    exit 1
  fi
fi