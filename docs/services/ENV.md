# 环境变量规范

本仓库使用 `.env.*` 文件与命令行环境变量统一管理密码、健康检查参数与时区。

## 文件说明

- `.env.example` 示例变量文件（可复制为 `.env.local` 使用）
- `.env.local` 本地环境变量（不提交版本库）
- 其他 `.env.*` 文件（如 `.env.devops`、`.env.nas`、`.env.network`、`.env.test`、`.env.ecs`）按各自场景使用

## 关键变量

- `REDIS_PROD_PASSWORD` 生产环境 Redis 密码（需与 `redis-prod.conf` 中 `requirepass` 一致）
- `REDIS_HEALTH_ATTEMPTS` 健康检查重试次数（默认 10）
- `REDIS_HEALTH_DELAY` 健康检查每次重试的延迟毫秒（默认 500）
- `TZ` 容器时区（默认 `Asia/Shanghai`）

## 使用方式

- 初始化：`cp .env.example .env.local`
- 自动加载：管理脚本会自动读取 `.env.local`（不存在则回退 `.env.example`），无需手动 `source`
- 内联覆盖：`REDIS_PROD_PASSWORD=xxxx bash scripts/redis-manager.sh health --env prod`
- 深度健康：`REDIS_HEALTH_DEEP=1 bash scripts/redis-manager.sh health --env dev|prod`

## 与 Compose 的关联

- `config/docker-compose.yml` 的 `redis-prod` 服务会读取 `REDIS_PROD_PASSWORD` 用于健康检查命令（`CMD-SHELL redis-cli -a "$REDIS_PROD_PASSWORD" -p 6379 ping`）
- 如变更密码，请同步更新：
  - `config/redis-prod.conf` 中的 `requirepass`
  - `.env.local` 或 CI/CD 环境变量中的 `REDIS_PROD_PASSWORD`
