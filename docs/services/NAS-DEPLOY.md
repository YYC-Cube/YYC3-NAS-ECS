# NAS 部署规划与上线方案

面向“专线、单人、多机”的本地协同环境，本文提供一套可落地的 NAS 上线方案（以 Redis 为核心状态服务，API 为业务服务）。方案强调极简安全、最大便利，同时保留可选的强校验模式，以便在需要时切换。

## 目标与意义

- 统一：用一个仓库管理 Redis 配置、脚本与文档，避免分散和漂移。
- 协同：在多机场景下通过私网/专线共享数据（NAS 挂载），保证一致性与持久化。
- 稳定：提供健康检查与可观测项，减少“看不见”的故障。
- 可切换：默认极简安全（requirepass），按需启用强校验（禁用高危命令+严格校验脚本）。

## 架构选型

- 模式A（推荐）：在开发主机（macOS）运行 Docker 容器，数据目录映射到 NAS 挂载路径。
  - Redis（dev/prod）容器运行在 macOS；`/data` 指向 NAS（如 `/Users/yanyu/nas/volume2/redis/*/data`）。
  - 适合快速联调与统一管理，日志与快照集中在工作区内。
- 模式B（可选）：在 NAS 设备上运行 Docker（如 Synology），工作机仅做管理与联调。
  - 需要在 NAS 设备上提供 Docker 与 Compose 能力，管理机通过 SSH 或 API 触发部署。
  - 适合长期运行的家庭/小型办公环境，减少对工作机的依赖。

## 环境与前置条件

- 宿主机：macOS（含 Docker Desktop）
- NAS：以专线挂载到宿主机（例如 `/Users/yanyu/nas/volume2`）
- 仓库路径：`/Users/yanyu/Projects/redis-config`
- 时区：`TZ=Asia/Shanghai`
- 端口：
  - 开发（宿主→容器）：`REDIS_DEV_PORT:6380`
  - 生产（宿主→容器）：`REDIS_PROD_PORT:6379`

## 目录与映射约定

- Compose 中的卷已约定：
  - dev 数据：`/Users/yanyu/nas/volume2/redis/dev/data:/data`
  - prod 数据：`/Users/yanyu/nas/volume2/redis/prod/data:/data`
  - 日志：`/Users/yanyu/Projects/redis-config/logs/*:/var/log/redis`
- 如需调整 NAS 路径，请同步修改 `config/docker-compose.yml` 与 `.env.example` 中的说明。

## 安全策略

- 默认极简安全（推荐本地协同）：
  - `requirepass` 启用；`protected-mode yes`；保留 `CONFIG`。
  - 不禁用命令；启用弱校验：`.env.local` 中 `ALLOW_WEAK_PROD=1`。
- 可选强校验（需要更严控制时）：
  - 在 `redis-prod.conf` 启用 `rename-command FLUSHALL ""`、`rename-command FLUSHDB ""`。
  - 关闭弱校验：`.env.local` 中 `ALLOW_WEAK_PROD=0`；运行 `scripts/check-redis-prod.sh`。
- 细粒度限制建议用 ACL 控制子命令（例如 `CONFIG SET`），避免直接禁用 `CONFIG`。

## 上线流程（模式A：宿主机容器 + NAS 存储）

1. 初始化工作区
   - `git clone` 仓库并进入目录：`cd /Users/yanyu/Projects/redis-config`
   - 复制环境模板：`cp .env.example .env.local`
   - 编辑 `.env.local`：设置 `REDIS_PROD_PASSWORD`、端口、可选 `ALLOW_WEAK_PROD`。
2. 挂载 NAS（如尚未挂载）
   - 参考 `scripts/redis-manager.sh` 的 `ensure_nas` 行为，或手动挂载为 `/Users/yanyu/nas/volume2`。
3. 启动与校验
   - 开发：`bash scripts/redis-manager.sh start --mode docker --env dev`
   - 生产：
     - 弱校验：`ALLOW_WEAK_PROD=1 bash scripts/redis-manager.sh start --mode docker --env prod`
     - 强校验：`ALLOW_WEAK_PROD=0 bash scripts/check-redis-prod.sh && bash scripts/redis-manager.sh start --mode docker --env prod`
   - 健康：
     - 基础：`bash scripts/redis-manager.sh health --env dev|prod`
     - 深度（写读临时键）：`REDIS_HEALTH_DEEP=1 bash scripts/redis-manager.sh health --env prod`
4. 观察日志与状态
   - `bash scripts/redis-manager.sh status`
   - `bash scripts/redis-manager.sh logs --mode docker`

## 上线流程（模式B：NAS 设备容器 + 远程管理）

1. 在 NAS 设备安装 Docker 与 Compose（或使用 Synology 提供的套件）。
2. 将本仓库 `config/redis-*.conf`、`docker-compose.yml` 同步到 NAS（保留主机绝对路径或改为 NAS 本地路径）。
3. 在 NAS 上准备 `.env.local`（含 `REDIS_PROD_PASSWORD`、`TZ` 等）。
4. 在 NAS 执行：`docker compose up -d redis-prod` 与健康检查命令（可在 NAS 上执行 `redis-cli -a "$REDIS_PROD_PASSWORD" -p 6379 ping`）。
5. 管理机通过 SSH 执行日志查看与状态监控（或用 NAS 自带界面）。

## API 与 Redis 的端到端联调

- API 项目（`api/`）的 `.env.example` 将提供 Redis 连接段：
  - `REDIS_HOST=127.0.0.1`
  - `REDIS_PORT=${REDIS_DEV_PORT 或 6380}`
  - `REDIS_PASSWORD=${REDIS_PROD_PASSWORD 或空}`
- 联调建议：
  - 开发指向 `redis-dev` 的宿主映射端口；生产指向 `redis-prod` 的宿主映射端口。
  - 若 API 与 Redis 在同一机位，可用容器网络名（如 `redis-prod`）直接连接容器端口。

## 备份与恢复

- RDB/AOF 存储在 `/data`（NAS目录），可直接备份该目录。
- 日常建议：
  - 定期触发保存：`redis-cli bgsave`（或配置 `save` 策略）
  - AOF 重写：`redis-cli bgrewriteaof`
- 恢复流程：
  - 停止容器 → 替换 `/data` 下的 RDB/AOF 文件 → 启动容器 → 验证健康与关键键。

## 密码轮换（生产）

- 建议频率：每季度 1 次或按重大变更前后。
- 灰度步骤：
  1. 在 `.env.local` 中准备新密码并导出用于健康脚本；
  2. 在 `redis-prod.conf` 中更新 `requirepass` 并重启容器；
  3. 测试健康与深度探针（含写读临时键）；
  4. 清理旧密码引用（CI/CD、脚本、说明文件）。

## 可观测性与巡检

- 基础健康：`PING` 与内存信息（`used_memory_human`、`maxmemory_human`）。
- 深度健康：写入临时键（`__health_probe:<ts>`，TTL=2s）并读回，统计耗时。
- 日志：`docker logs --tail 200 redis-*`；宿主日志目录 `logs/*`。

## 回滚策略

- 容器级回滚：`docker compose rm -f -s redis-prod && docker compose up -d redis-prod`（使用上一个稳定配置）
- 数据回滚：在 NAS 目录保留近期快照（RDB/AOF），恢复时按“备份与恢复”流程执行。

## Checklist（上线前）

- NAS 挂载就绪（路径与权限一致）
- `.env.local` 正确填写（密码、端口、时区）
- 选择安全模式（极简或强校验），并确认校验脚本结果
- 健康检查通过，深度探针无误
- 日志目录写入正常，观察 5–10 分钟负载情况

## 附：命令速查

- 开发启动：`bash scripts/redis-manager.sh start --mode docker --env dev`
- 生产启动（弱校验）：`ALLOW_WEAK_PROD=1 bash scripts/redis-manager.sh start --mode docker --env prod`
- 生产强校验：`ALLOW_WEAK_PROD=0 bash scripts/check-redis-prod.sh`
- 健康检查：`bash scripts/redis-manager.sh health --env dev|prod`
- 深度探针：`REDIS_HEALTH_DEEP=1 bash scripts/redis-manager.sh health --env prod`
- 日志查看：`bash scripts/redis-manager.sh logs --mode docker`
