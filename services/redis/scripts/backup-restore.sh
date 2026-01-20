#!/bin/bash
# Redis 数据备份/恢复脚本（NAS 挂载路径为主）
# 用法：
#   备份开发：bash scripts/backup-restore.sh backup dev
#   备份生产：bash scripts/backup-restore.sh backup prod
#   恢复开发：bash scripts/backup-restore.sh restore dev /path/to/backup_dir
#   恢复生产：bash scripts/backup-restore.sh restore prod /path/to/backup_dir
# 依赖：.env.local 中的 NAS_DEV_DIR、NAS_PROD_DIR

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 加载环境（与管理脚本一致）
if [[ -f "${ROOT_DIR}/.env.local" ]]; then
  set -a; source "${ROOT_DIR}/.env.local"; set +a
elif [[ -f "${ROOT_DIR}/.env.example" ]]; then
  set -a; source "${ROOT_DIR}/.env.example"; set +a
fi

NAS_DEV_DIR="${NAS_DEV_DIR:-$HOME/nas/volume2/redis/dev/data}"
NAS_PROD_DIR="${NAS_PROD_DIR:-$HOME/nas/volume2/redis/prod/data}"
BACKUP_ROOT="${ROOT_DIR}/backups/redis"
mkdir -p "$BACKUP_ROOT/dev" "$BACKUP_ROOT/prod"

cmd="${1:-}"; envn="${2:-dev}"; srcdir=""; ts=$(date +%Y%m%d-%H%M%S)
case "$envn" in
  dev) srcdir="$NAS_DEV_DIR";;
  prod) srcdir="$NAS_PROD_DIR";;
  *) echo "[ERROR] unknown env: $envn"; exit 1;;
}

if [[ "$cmd" == "backup" ]]; then
  [[ -d "$srcdir" ]] || { echo "[ERROR] data dir not found: $srcdir"; exit 1; }
  outdir="$BACKUP_ROOT/$envn/$ts"
  mkdir -p "$outdir"
  echo "[INFO] copying RDB/AOF from $srcdir to $outdir"
  cp -a "$srcdir"/*.rdb "$outdir" 2>/dev/null || echo "[WARN] no RDB files"
  cp -a "$srcdir"/*.aof "$outdir" 2>/dev/null || echo "[WARN] no AOF files"
  echo "[INFO] backup done: $outdir"
elif [[ "$cmd" == "restore" ]]; then
  backup_dir="${3:-}"
  [[ -n "$backup_dir" ]] || { echo "[ERROR] need backup_dir for restore"; exit 1; }
  [[ -d "$backup_dir" ]] || { echo "[ERROR] backup_dir not exists: $backup_dir"; exit 1; }
  [[ -d "$srcdir" ]] || { echo "[ERROR] target data dir not found: $srcdir"; exit 1; }
  echo "[INFO] restoring files from $backup_dir to $srcdir"
  # 停止容器以保证一致性（如存在）
  if docker ps -a --format '{{.Names}}' | grep -q "^redis-$envn$"; then
    echo "[INFO] stopping container redis-$envn"
    docker stop "redis-$envn" >/dev/null 2>&1 || true
  fi
  cp -a "$backup_dir"/*.rdb "$srcdir" 2>/dev/null || echo "[WARN] no RDB files in backup"
  cp -a "$backup_dir"/*.aof "$srcdir" 2>/dev/null || echo "[WARN] no AOF files in backup"
  echo "[INFO] files restored. starting container if existed"
  if docker ps -a --format '{{.Names}}' | grep -q "^redis-$envn$"; then
    docker start "redis-$envn" >/dev/null 2>&1 || true
  fi
  echo "[INFO] restore done"
else
  echo "Usage: backup-restore.sh <backup|restore> <dev|prod> [backup_dir]"; exit 1
fi
