#!/bin/bash
# 智能引导与统一入口：本地(Brew)与Docker一体化管理
# 用法示例：
#   redis-manager.sh guide
#   redis-manager.sh start --mode brew --env dev
#   redis-manager.sh start --mode docker --env prod
#   redis-manager.sh stop --mode brew|docker
#   redis-manager.sh status
#   redis-manager.sh health --env dev|prod
#   redis-manager.sh logs --mode brew|docker
#   redis-manager.sh --help

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/config/docker-compose.yml"
CONF_DEV="${ROOT_DIR}/config/redis-dev.conf"
CONF_PROD="${ROOT_DIR}/config/redis-prod.conf"
LOGFILE_BREW="/opt/homebrew/var/log/redis/redis-server.log"
PORT_DEV_DEFAULT=6379
PORT_PROD_DEFAULT=6380

# 颜色输出
info(){ echo -e "\033[32m[INFO]\033[0m $*"; }
warn(){ echo -e "\033[33m[WARN]\033[0m $*"; }
error(){ echo -e "\033[31m[ERROR]\033[0m $*"; }

# 读取环境变量文件（按优先级）
load_envs(){
  # 仅优先加载 .env.local，其次回退 .env.example；统一默认值
  if [[ -f "${ROOT_DIR}/.env.local" ]]; then
    set -a; source "${ROOT_DIR}/.env.local"; set +a
    info "加载环境：${ROOT_DIR}/.env.local"
  elif [[ -f "${ROOT_DIR}/.env.example" ]]; then
    set -a; source "${ROOT_DIR}/.env.example"; set +a
    warn "未找到 .env.local，已加载示例：${ROOT_DIR}/.env.example"
  else
    warn "未找到 .env.local 或 .env.example，使用内置默认值"
  fi
  REDIS_HEALTH_ATTEMPTS="${REDIS_HEALTH_ATTEMPTS:-10}"
  REDIS_HEALTH_DELAY="${REDIS_HEALTH_DELAY:-500}"
  REDIS_DEV_PORT="${REDIS_DEV_PORT:-$PORT_DEV_DEFAULT}"
  REDIS_PROD_PORT="${REDIS_PROD_PORT:-$PORT_PROD_DEFAULT}"
  TZ="${TZ:-Asia/Shanghai}"
}

compose_cmd(){
  if command -v docker >/dev/null && docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
  else
    echo ""; return 1
  fi
}

ensure_nas(){
  local dir="${NAS_DEV_DIR:-$HOME/nas/volume2/redis/dev/data}"
  if [[ -d "$dir" ]]; then
    info "NAS目录就绪：$dir"
    return 0
  fi
  warn "NAS目录未找到：$dir，尝试从 ~/.zshrc 加载 nas-mount"
  if [[ -f "$HOME/.zshrc" ]]; then
    # shellcheck disable=SC1090
    source "$HOME/.zshrc" || true
  fi
  if declare -F nas-mount >/dev/null 2>&1; then
    nas-mount || true
  else
    warn "未定义 nas-mount 函数，跳过自动挂载"
  fi
  if [[ -d "$dir" ]]; then
    info "NAS目录挂载成功：$dir"
    return 0
  fi
  warn "NAS仍不可用，将继续启动但可能降级到仅RDB"
}

port_in_use(){
  local p="$1"
  lsof -i tcp:"$p" -sTCP:LISTEN >/dev/null 2>&1 && echo "true" || echo "false"
}

# 查询 docker 映射端口（优先 compose port，其次 docker ps，最后 inspect）
docker_mapped_port(){
  local svc="$1"
  local cport="${2:-6379}"
  local DCMD
  DCMD="$(compose_cmd)" || { echo ""; return 1; }
  # 1) compose port
  local out
  out=$($DCMD -f "$COMPOSE_FILE" port "$svc" "$cport" 2>/dev/null || true)
  if [[ -n "$out" ]]; then
    echo "${out##*:}"; return 0
  fi
  # 2) docker ps 解析端口映射
  local ps_ports
  ps_ports=$(docker ps --filter "name=$svc" --format '{{.Ports}}' 2>/dev/null || true)
  if [[ -n "$ps_ports" ]]; then
    local match
    match=$(echo "$ps_ports" | grep -Eo "0.0.0.0:[0-9]+->$cport/tcp" | head -n1)
    if [[ -n "$match" ]]; then
      local host_port
      host_port="${match#0.0.0.0:}"
      host_port="${host_port%%->*}"
      echo "$host_port"; return 0
    fi
  fi
  # 3) inspect 回退
  local hp
  hp=$(docker inspect -f "{{ (index (index .NetworkSettings.Ports \"$cport/tcp\") 0).HostPort }}" "$svc" 2>/dev/null || true)
  if [[ -n "$hp" && "$hp" != "<no value>" ]]; then
    echo "$hp"; return 0
  fi
  echo ""; return 1
}

resolve_port_for_env(){
  local env_name="$1" # dev|prod
  if [[ "$env_name" == "dev" ]]; then
    local envp="${REDIS_DEV_PORT:-$PORT_DEV_DEFAULT}"
    local mapped; mapped="$(docker_mapped_port redis-dev 6380 || true)"
    [[ -n "$mapped" ]] && echo "$mapped" || echo "$envp"
  else
    local envp="${REDIS_PROD_PORT:-$PORT_PROD_DEFAULT}"
    local mapped; mapped="$(docker_mapped_port redis-prod 6379 || true)"
    [[ -n "$mapped" ]] && echo "$mapped" || echo "$envp"
  fi
}

start_brew(){
  local port="${REDIS_DEV_PORT:-$PORT_DEV_DEFAULT}"
  if [[ "$(port_in_use "$port")" == "true" ]]; then
    warn "端口 $port 已被占用，跳过启动或请修改 REDIS_DEV_PORT"
  else
    info "使用配置启动：$CONF_DEV"
    nohup redis-server "$CONF_DEV" --logfile "$LOGFILE_BREW" --pidfile "/opt/homebrew/var/run/redis/redis-server.pid" >/dev/null 2>&1 &
    sleep 2
  fi
  if redis-cli -p "$port" ping | grep -q "PONG"; then
    info "开发环境(Brew)启动成功：端口 $port"
  else
    error "开发环境(Brew)启动失败；查看日志：$LOGFILE_BREW"
    return 1
  fi
}

stop_brew(){
  local port="${REDIS_DEV_PORT:-$PORT_DEV_DEFAULT}"
  info "尝试通过 SHUTDOWN 关闭本地实例(port=$port)"
  redis-cli -p "$port" shutdown >/dev/null 2>&1 || true
  pkill -f "redis-server .*redis-dev.conf" >/dev/null 2>&1 || true
  info "本地实例已停止(若仍在运行，请手动检查)"
}

retry_ping(){
  local port="$1"; local attempts="${2:-${REDIS_HEALTH_ATTEMPTS:-5}}"; local delay="${3:-${REDIS_HEALTH_DELAY:-1}}"
  local i
  for i in $(seq 1 "$attempts"); do
    if redis-cli -p "$port" ping 2>/dev/null | grep -q PONG; then return 0; fi
    sleep "$delay"
  done
  return 1
}

start_docker(){
  local env_name="$1" # dev|prod
  local DCMD
  DCMD="$(compose_cmd)" || { error "未检测到 docker compose/compose"; return 1; }
  [[ -f "$COMPOSE_FILE" ]] || { error "缺少 compose 文件：$COMPOSE_FILE"; return 1; }
  if [[ "$env_name" == "dev" ]]; then
    local want_port="${REDIS_DEV_PORT:-$PORT_DEV_DEFAULT}"
    local alt_port=6381
    if [[ "$(port_in_use "$want_port")" == "true" ]]; then
      warn "主机端口 $want_port 已占用，自动切换到 $alt_port"
      REDIS_DEV_PORT="$alt_port" $DCMD -f "$COMPOSE_FILE" up -d redis-dev
      info "容器 redis-dev 已启动，映射端口：$alt_port -> 6380"
      info "连接：redis://127.0.0.1:$alt_port"
    else
      info "启动 docker 服务：redis-dev 映射端口：$want_port -> 6380"
      REDIS_DEV_PORT="$want_port" $DCMD -f "$COMPOSE_FILE" up -d redis-dev
      info "连接：redis://127.0.0.1:$want_port"
    fi
  else
    local want_port_p="${REDIS_PROD_PORT:-$PORT_PROD_DEFAULT}"
    local alt_port_p=6382
    if [[ "$(port_in_use "$want_port_p")" == "true" ]]; then
      warn "主机端口 $want_port_p 已占用，自动切换到 $alt_port_p"
      REDIS_PROD_PORT="$alt_port_p" $DCMD -f "$COMPOSE_FILE" up -d redis-prod
      info "容器 redis-prod 已启动，映射端口：$alt_port_p -> 6379"
      info "连接：redis://127.0.0.1:$alt_port_p"
    else
      info "启动 docker 服务：redis-prod 映射端口：$want_port_p -> 6379 (先行校验)"
      "${ROOT_DIR}/scripts/check-redis-prod.sh"
      REDIS_PROD_PORT="$want_port_p" $DCMD -f "$COMPOSE_FILE" up -d redis-prod
      info "连接：redis://127.0.0.1:$want_port_p"
    fi
  fi
}

stop_docker(){
  local env_name="$1"
  local DCMD
  DCMD="$(compose_cmd)" || { error "未检测到 docker compose/compose"; return 1; }
  local svc="redis-dev"; [[ "$env_name" == "prod" ]] && svc="redis-prod"
  info "停止并移除容器：$svc"
  $DCMD -f "$COMPOSE_FILE" rm -f -s "$svc" || docker rm -f "$svc" || true
}

status(){
  info "Brew 进程："
  pgrep -fl "redis-server" || echo "(无)"
  info "Docker 容器："
  docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || echo "(Docker 未运行)"
}

health(){
  local env_name="${1:-dev}"
  local port
  port="$(resolve_port_for_env "$env_name")"
  info "健康检查环境：$env_name (port=$port)"
  if [[ "$env_name" == "prod" ]]; then
    # 生产环境需要认证
    if redis-cli -a "${REDIS_PROD_PASSWORD:-redis_yyc3}" -p "$port" ping 2>/dev/null | grep -q PONG; then
      info "PING: PONG"
    else
      info "PING: fail"
    fi
    info "内存: $(redis-cli -a "${REDIS_PROD_PASSWORD:-redis_yyc3}" -p "$port" info memory 2>/dev/null | grep -E "^(used_memory_human|maxmemory_human)" | xargs)"
  else
    if retry_ping "$port"; then
      info "PING: PONG"
    else
      info "PING: fail"
    fi
    info "内存: $(redis-cli -p "$port" info memory 2>/dev/null | grep -E "^(used_memory_human|maxmemory_human)" | xargs)"
  fi
  # 深度健康探针（写读临时键）
  if [[ "${REDIS_HEALTH_DEEP:-0}" == "1" ]]; then
    "${ROOT_DIR}/scripts/health-keys.sh" --env "$env_name" || warn "深度健康探针失败"
  fi
  # 容器内部健康检查
  if docker ps -a --format '{{.Names}}' | grep -q '^redis-dev$'; then
    local dping
    dping=$(docker exec redis-dev redis-cli -p 6380 ping 2>/dev/null || echo fail)
    info "Docker容器(redis-dev) PING: ${dping}"
    local mapped
    mapped="$(docker_mapped_port redis-dev 6380 || true)"
    [[ -n "$mapped" ]] && info "容器映射端口：$mapped -> 6380"
  fi
  if docker ps -a --format '{{.Names}}' | grep -q '^redis-prod$'; then
    local dpp
    dpp=$(docker exec redis-prod redis-cli -a "${REDIS_PROD_PASSWORD:-redis_yyc3}" -p 6379 ping 2>/dev/null || echo fail)
    info "Docker容器(redis-prod) PING: ${dpp}"
    local mappedp
    mappedp="$(docker_mapped_port redis-prod 6379 || true)"
    [[ -n "$mappedp" ]] && info "容器映射端口：$mappedp -> 6379"
  fi
}

logs(){
  local mode="${1:-brew}"
  if [[ "$mode" == "brew" ]]; then
    [[ -f "$LOGFILE_BREW" ]] && tail -n 200 "$LOGFILE_BREW" || warn "找不到日志：$LOGFILE_BREW"
  else
    docker logs --tail 200 redis-dev 2>/dev/null || docker logs --tail 200 redis-prod 2>/dev/null || warn "无容器日志"
  fi
}

guide(){
  info "开始智能引导..."
  load_envs
  ensure_nas
  local DCMD="$(compose_cmd || true)"
  if [[ -z "$DCMD" ]]; then
    warn "未检测到 Docker；建议走 Brew 模式或先安装 Docker Desktop"
    info "执行：brew 模式启动"
    start_brew || return 1
  else
    info "检测到 Docker；优先 Docker 模式(dev)"
    start_docker dev || { warn "Docker 启动失败，回退 Brew 模式"; start_brew || return 1; }
  fi
  status
  health dev
  info "引导完成：可用命令 -> start/stop/status/health/logs"
}

usage(){
  cat <<EOF
用法：redis-manager.sh [command] [options]
command:
  guide                 智能引导并自动选择模式
  start --mode M --env E  启动(M=brew|docker, E=dev|prod; 默认 dev)
  stop  --mode M          停止(M=brew|docker)
  status                显示状态
  health --env E        健康检查(PING/内存; E=dev|prod)
  logs --mode M         查看日志(M=brew|docker; 默认 brew)
  --help                查看帮助
EOF
}
# 自动加载环境变量（所有子命令均生效）
load_envs

# 参数解析
CMD="${1:-guide}"; shift || true
MODE="brew"; ENVN="dev"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2;;
    --env)  ENVN="$2"; shift 2;;
    --help|-h) usage; exit 0;;
    *) shift;;
  esac
done

case "$CMD" in
  guide) guide;;
  start)
    if [[ "$MODE" == "brew" ]]; then start_brew; else start_docker "$ENVN"; fi;;
  stop)
    if [[ "$MODE" == "brew" ]]; then stop_brew; else stop_docker "$ENVN"; fi;;
  status) status;;
  health) health "$ENVN";;
  logs) logs "$MODE";;
  *) usage; exit 1;;
esac
