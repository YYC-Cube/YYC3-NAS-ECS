# 运维与部署规范

本文档提供生产与开发环境的标准化运维流程与校验步骤。

## 环境

- 宿主：macOS（本地测试）
- 容器：`redis:alpine`
- 端口映射：
  - 生产：宿主 `6380` → 容器 `6379`
  - 开发：宿主 `6381` → 容器 `6380`（示例）

## 启动流程

### 开发环境（Docker）

- 启动：`bash scripts/redis-manager.sh start --mode docker --env dev`
- 健康：`bash scripts/redis-manager.sh health --env dev`

### 生产环境（Docker）

- 严格校验：`bash scripts/check-redis-prod.sh`
- （本地调试可临时放宽）`ALLOW_WEAK_PROD=1 bash scripts/check-redis-prod.sh`
- 启动：`bash scripts/redis-manager.sh start --mode docker --env prod`
- 健康（带认证）：`REDIS_PROD_PASSWORD=redis_yyc3 bash scripts/redis-manager.sh health --env prod`

## 安全基线

- 默认极简安全：启用 `requirepass` 与 `protected-mode yes`，保留 `CONFIG`，不禁用命令
- 可选强校验：禁用 `FLUSHALL`、`FLUSHDB`（`rename-command`），并关闭弱校验 `ALLOW_WEAK_PROD=0`
- 敏感子命令建议通过 ACL 管理（如限制 `CONFIG SET`），避免直接禁用 `CONFIG`

## 持久化策略

- 数据目录：`/data`
- 文件名：`dump-prod.rdb`、`appendonly-prod.aof`
- 推荐：`stop-writes-on-bgsave-error yes`、`aof-load-truncated yes`

## 故障排查

- 查看日志：`docker logs --tail 200 redis-prod`
- 检查容器：`docker inspect redis-prod`
- 容器内执行：
  - 内存测试：`redis-server --test-memory 8192`
  - 系统检查：`redis-server --check-system`
- 健康检查失败常见原因：
  - 密码不一致（配置文件与 Compose 环境变量不匹配）
  - 禁用了 `CONFIG` 导致模块或工具初始化失败
  - 端口映射错误（宿主与容器端口不一致）

## 变更管理

- 变更生产密码时：同步更新配置文件、Compose 环境变量与健康检查脚本调用
- 调整内存时：根据宿主资源与业务需求设置 `maxmemory`，并观察健康输出与命中率

### 生产密码轮换（建议）

- 周期：每季度 1 次，或在重大变更前后进行
- 步骤：
  1. 准备新密码：在 `.env.local` 写入 `REDIS_PROD_PASSWORD` 的新值；避免同时暴露旧密码
  2. 更新配置：修改 `config/redis-prod.conf` 中的 `requirepass`，重启 `redis-prod` 容器
  3. 健康验证：执行 `bash scripts/redis-manager.sh health --env prod` 与 `REDIS_HEALTH_DEEP=1 ...` 深度探针
  4. 清理引用：确认 CI/CD、脚本与文档不再引用旧密码
- 回滚：保留上一次配置版本，若健康验证失败则回滚到旧配置并重新演练轮换流程

## 范围说明

- 本仓库规范化不涉及 `api/` 目录的代码与文档调整，相关内容请参阅其自身 `README.md`。
