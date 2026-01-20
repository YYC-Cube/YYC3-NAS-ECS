# 脚本使用指南

统一说明 `scripts/` 目录下的脚本功能与用法。

## redis-manager.sh

- 作用：统一管理 Redis 的启动、停止、状态与健康检查
- 语法：`bash scripts/redis-manager.sh <start|stop|status|health> --mode <brew|docker> --env <dev|prod>`
- 环境加载：自动读取仓库根目录 `.env.local`（不存在则回退 `.env.example`），无需手动 `source`
- 示例：
  - 开发（Docker）：`bash scripts/redis-manager.sh start --mode docker --env dev`
  - 生产（Docker）：`bash scripts/redis-manager.sh start --mode docker --env prod`
  - 健康（生产，带密码）：`REDIS_PROD_PASSWORD=redis_yyc3 bash scripts/redis-manager.sh health --env prod`
- 环境变量：
  - `REDIS_PROD_PASSWORD`（生产密码）
  - `REDIS_HEALTH_ATTEMPTS`（健康检查重试次数）
  - `REDIS_HEALTH_DELAY`（健康检查重试延迟毫秒）

## check-redis-prod.sh

- 作用：生产配置安全校验（注释标识、基础配置、`protected-mode`、密码、危险命令、数据目录）
- 严格校验：`bash scripts/check-redis-prod.sh`
- 弱校验（本地调试）：`ALLOW_WEAK_PROD=1 bash scripts/check-redis-prod.sh`

## start-redis-dev.sh

- 作用：快速启动本地开发环境（Brew场景示例）
- 用法：`bash scripts/start-redis-dev.sh`

## start-redis-docker.sh

- 作用：交互式选择并启动 Docker 环境（dev 或 prod）
- 用法：`bash scripts/start-redis-docker.sh`

## sync-redis-config.sh

- 作用：从远端仓库或路径同步配置到本地，并备份旧版本
- 用法：`bash scripts/sync-redis-config.sh`

## health-keys.sh

- 作用：深度健康探针（写入临时键并读回，统计耗时）
- 用法：
  - `bash scripts/health-keys.sh --env dev|prod`
  - 结合管理器：`REDIS_HEALTH_DEEP=1 bash scripts/redis-manager.sh health --env prod`
- 变量：
  - `REDIS_PROD_PASSWORD`（生产认证）
  - `REDIS_DEV_PORT`、`REDIS_PROD_PORT`（宿主映射端口）

## backup-restore.sh

- 作用：基于 NAS 挂载路径的 RDB/AOF 备份与恢复
- 用法：
  - 备份：`bash scripts/backup-restore.sh backup dev|prod`
  - 恢复：`bash scripts/backup-restore.sh restore dev|prod /path/to/backup_dir`
- 变量：
  - `NAS_DEV_DIR`、`NAS_PROD_DIR`（数据目录路径）
  - `TZ`（时区，可用于命名与日志）

## 常见问题

- 健康检查失败：确认密码一致（配置文件、环境变量与 Compose）、端口映射正确、未禁用 `CONFIG`
- 启动崩溃：检查模块兼容、内存策略与系统检查（`redis-server --check-system`）
