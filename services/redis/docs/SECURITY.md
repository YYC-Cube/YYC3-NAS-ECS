# 安全策略指南

本指南明确两种安全模式的选择与切换方法，适配“专线、单人、多机”的本地环境：默认采用极简安全（低摩擦），可按需切换为强校验（更严格）。

## 策略概览

- 默认极简安全（推荐本地场景）
  - 启用 `requirepass` 与 `protected-mode yes`。
  - 保留 `CONFIG`（便于运维与模块兼容），不启用 ACL 与命令禁用。
  - 运行脚本时启用弱校验：`.env.local` 配置 `ALLOW_WEAK_PROD=1`。
- 可切换强校验（生产严格场景）
  - 禁用高危命令：`FLUSHALL`、`FLUSHDB`。
  - 关闭弱校验：`.env.local` 配置 `ALLOW_WEAK_PROD=0`，校验脚本将强制检查密码与命令禁用项。
  - 可选：使用 ACL 对 `CONFIG` 子命令做更细粒度限制（例如禁止 `CONFIG SET`）。

## 默认极简安全

- 配置文件关键项（`config/redis-prod.conf`）：
  - `protected-mode yes`
  - `requirepass <你的密码>`（示例：`redis_yyc3`）
  - 保留 `CONFIG`（不限制）
- 脚本与 Compose：
  - `docs/ENV.md` 说明环境变量；`REDIS_PROD_PASSWORD` 用于健康检查与脚本认证。
  - `.env.local` 建议：
    - `REDIS_PROD_PASSWORD=redis_yyc3`
    - `ALLOW_WEAK_PROD=1`（弱校验，跳过危险命令禁用检查）
- 适用场景：本地专线、单人多机、操作便利优先。

## 强校验（可切换）

- 修改 `config/redis-prod.conf`：

```
# 安全：强校验示例
requirepass <你的密码>
rename-command FLUSHALL ""
rename-command FLUSHDB ""
# 保留 CONFIG，或配合 ACL 限制敏感子命令
```

- 更新 `.env.local`：

```
ALLOW_WEAK_PROD=0
```

- 校验与启动：
  - 严格校验：`bash scripts/check-redis-prod.sh`
  - 启动：`bash scripts/redis-manager.sh start --mode docker --env prod`
- 回退到极简安全：
  - 移除上述 `rename-command` 行并将 `ALLOW_WEAK_PROD=1`。

## ACL（可选进阶）

- 在极简或强校验模式下，如需限制敏感子命令（例如 `CONFIG SET`），可使用 ACL：
  - 添加只读用户：`acl setuser readonly on >password ~* +@read -@write -config|set`
  - 添加读写但限制配置的用户：`acl setuser writer on >password ~* +@read +@write -config|set`
- 使用说明：
  - 创建用户后，客户端以 `redis://user:password@host:port` 连接。
  - ACL 规则需结合业务角色分配，谨慎操作。

## 风险与注意

- 本地极简安全不适合公网场景；如需公网直连，至少启用强校验并配置防火墙规则或隧道。
- 变更密码需同步：配置文件（`requirepass`）、`.env.local`（`REDIS_PROD_PASSWORD`）、Compose 健康检查。
- 禁用 `CONFIG` 可能导致部分模块或工具初始化失败；推荐保留 `CONFIG`，用 ACL 管理子命令。

## 关联文档

- `docs/ENV.md` 环境变量规范
- `docs/OPS.md` 运维与部署规范
- `docs/REDIS.md` 配置说明（持久化/内存策略）
