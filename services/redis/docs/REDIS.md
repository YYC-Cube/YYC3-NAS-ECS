# Redis 配置说明

本文档对本仓库中 Redis 配置进行规范化说明，包含文件职责、关键参数与模块兼容性。

## 配置文件职责

- `config/redis-base.conf`
  - 通用基础配置：端口、网络、日志、持久化通用项、内存与性能（`jemalloc-bg-thread` 等）
  - 适配容器与本地：`daemonize no`、`loglevel verbose`、`logfile ""`
- `config/redis-dev.conf`
  - 开发环境：本地快速开发、默认开放端口、可使用简化安全策略
- `config/redis-prod.conf`
  - 生产环境：强密码、危险命令禁用、持久化、内存策略、`protected-mode`
  - 持久化文件名：`dump-prod.rdb`、`appendonly-prod.aof`
  - 数据目录：`/data`（容器内路径）

## 核心参数说明

- 网络
  - `bind 0.0.0.0`（容器通用绑定） + `protected-mode yes`
  - 端口在 `redis-base.conf` 指定为 `6379`
- 安全
  - 默认极简安全：启用 `requirepass` 与 `protected-mode yes`，保留 `CONFIG`，不启用命令禁用与 ACL（本地协同更便利）
  - 可切换强校验：按需启用 `rename-command FLUSHALL ""`、`rename-command FLUSHDB ""` 并关闭弱校验（`ALLOW_WEAK_PROD=0`）；建议参考 `docs/SECURITY.md`
  - 建议：如需限制 `CONFIG SET` 等敏感子命令，使用 ACL 进行细粒度控制，避免直接禁用 `CONFIG`
- 持久化
  - `save 900 1`、`save 300 10`、`stop-writes-on-bgsave-error yes`
  - `dbfilename dump-prod.rdb`、`appendfilename "appendonly-prod.aof"`、`dir /data`
  - `aof-use-rdb-preamble yes`、`no-appendfsync-on-rewrite yes`、`appendfsync everysec`
- 内存
  - 示例：`maxmemory 8gb`（本地环境）
  - 策略：`maxmemory-policy volatile-lru`

## 模块兼容性

本仓库的容器镜像加载以下模块：

- RedisTimeSeries：`redistimeseries.so`
- ReJSON：`rejson.so`
- RediSearch：`search`（依赖 RedisJSON API）

若禁用 `CONFIG`，部分模块初始化与工具可能发生错误或崩溃，因此生产环境不禁用 `CONFIG`。

## 健康检查

- Docker Compose 使用：`CMD-SHELL redis-cli -a "$REDIS_PROD_PASSWORD" -p 6379 ping`
- `scripts/redis-manager.sh` 会同时在宿主与容器内执行 PING，并输出内存信息。

## 调试与故障排查

- 查看日志：`docker logs --tail 200 redis-prod`
- 检查容器：`docker inspect redis-prod`
- 容器内快速内存测试：`redis-server --test-memory 8192`
- 系统检查（容器内）：`redis-server --check-system`

## 变更与同步

- 修改生产密码时，请同时更新：
  - `config/redis-prod.conf` 中的 `requirepass`
  - `config/docker-compose.yml` 中的 `REDIS_PROD_PASSWORD` 环境变量
  - 健康检查脚本环境变量传入（示例命令中已说明）
