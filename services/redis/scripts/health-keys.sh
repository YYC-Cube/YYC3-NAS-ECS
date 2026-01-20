#!/bin/bash
# 深度健康探针：针对 Redis 做写读临时键，并统计耗时
# 用法：
#   bash scripts/health-keys.sh --env dev|prod
#   REDIS_PROD_PASSWORD=xxx bash scripts/health-keys.sh --env prod
#   结合管理器：REDIS_HEALTH_DEEP=1 bash scripts/redis-manager.sh health --env prod

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENVN="dev"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENVN="$2"; shift 2;;
    *) shift;;
  esac
done

# 载入环境变量（与 redis-manager.sh 一致的优先级）
if [[ -f "${ROOT_DIR}/.env.local" ]]; then
  set -a; source "${ROOT_DIR}/.env.local"; set +a
elif [[ -f "${ROOT_DIR}/.env.example" ]]; then
  set -a; source "${ROOT_DIR}/.env.example"; set +a
fi
REDIS_DEV_PORT="${REDIS_DEV_PORT:-6379}"
REDIS_PROD_PORT="${REDIS_PROD_PORT:-6380}"
TZ="${TZ:-Asia/Shanghai}"

probe_dev(){
  local port="${REDIS_DEV_PORT}"
  local key="__health_probe:$(date +%s%3N)"
  local val="$(uuidgen 2>/dev/null || echo $RANDOM)"
  local start_ts=$(date +%s%3N)
  redis-cli -p "$port" set "$key" "$val" EX 2 >/dev/null || { echo "[ERROR] 写入失败(port=$port)"; return 1; }
  local got
  got=$(redis-cli -p "$port" get "$key" 2>/dev/null || echo "")
  local end_ts=$(date +%s%3N)
  local cost=$((end_ts - start_ts))
  if [[ "$got" == "$val" ]]; then
    echo "[INFO] 深度健康(dev): OK cost=${cost}ms key=$key"
    return 0
  else
    echo "[ERROR] 深度健康(dev): 读回不一致 cost=${cost}ms"
    return 1
  fi
}

probe_prod(){
  local port="${REDIS_PROD_PORT}"
  local pass="${REDIS_PROD_PASSWORD:-redis_yyc3}"
  local key="__health_probe:$(date +%s%3N)"
  local val="$(uuidgen 2>/dev/null || echo $RANDOM)"
  local start_ts=$(date +%s%3N)
  redis-cli -a "$pass" -p "$port" set "$key" "$val" EX 2 >/dev/null || { echo "[ERROR] 写入失败(port=$port)"; return 1; }
  local got
  got=$(redis-cli -a "$pass" -p "$port" get "$key" 2>/dev/null || echo "")
  local end_ts=$(date +%s%3N)
  local cost=$((end_ts - start_ts))
  if [[ "$got" == "$val" ]]; then
    echo "[INFO] 深度健康(prod): OK cost=${cost}ms key=$key"
    return 0
  else
    echo "[ERROR] 深度健康(prod): 读回不一致 cost=${cost}ms"
    return 1
  fi
}

case "$ENVN" in
  dev) probe_dev;;
  prod) probe_prod;;
  *) echo "[ERROR] Unknown env: $ENVN"; exit 1;;
}
