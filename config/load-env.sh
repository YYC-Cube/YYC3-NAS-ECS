#!/bin/bash
# load-env.sh - 环境变量加载脚本
# 用途：根据环境加载相应的配置文件

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="${BASE_DIR}/config"
SECRETS_DIR="${CONFIG_DIR}/secrets"

# 默认环境
ENV="${1:-development}"

# 验证环境参数
if [[ ! "$ENV" =~ ^(development|staging|production)$ ]]; then
    error "无效的环境: $ENV"
    echo "用法: $0 [development|staging|production]"
    exit 1
fi

log "加载 ${ENV} 环境配置..."

# 检查配置文件是否存在
if [ ! -f "${CONFIG_DIR}/.env.base" ]; then
    error "基础配置文件不存在: ${CONFIG_DIR}/.env.base"
    exit 1
fi

if [ ! -f "${CONFIG_DIR}/.env.${ENV}" ]; then
    error "环境配置文件不存在: ${CONFIG_DIR}/.env.${ENV}"
    exit 1
fi

# 加载基础配置
log "加载基础配置..."
set -a
source "${CONFIG_DIR}/.env.base"
set +a

# 加载环境特定配置
log "加载 ${ENV} 环境配置..."
set -a
source "${CONFIG_DIR}/.env.${ENV}"
set +a

# 加载密钥配置
if [ -d "${SECRETS_DIR}" ]; then
    log "加载密钥配置..."
    
    for secret_file in "${SECRETS_DIR}"/*.env; do
        if [ -f "$secret_file" ]; then
            log "  - $(basename "$secret_file")"
            set -a
            source "$secret_file"
            set +a
        fi
    done
else
    warn "密钥目录不存在: ${SECRETS_DIR}"
fi

log "✅ 环境变量加载完成"
log "环境: ${ENV}"
log "应用: ${APP_NAME}"
log "版本: ${APP_VERSION}"

# 导出关键环境变量（供子进程使用）
export ENVIRONMENT=$ENV
export NODE_ENV=$ENV
export VITE_APP_ENV=$ENV
export FLASK_ENV=$ENV

# 输出配置摘要（隐藏敏感信息）
echo ""
log "配置摘要:"
echo "  - 环境: ${ENVIRONMENT}"
echo "  - 调试模式: ${DEBUG}"
echo "  - API端口: ${API_SERVICE_PORT}"
echo "  - 数据库: postgresql://${POSTGRES_USER}:***@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
echo "  - Redis: redis://:***@${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}"
echo "  - 域名: ${BASE_DOMAIN}"
echo ""

# 如果是第二个参数是 'export'，则导出所有变量
if [ "$2" = "export" ]; then
    log "导出所有环境变量..."
    export -p
fi
