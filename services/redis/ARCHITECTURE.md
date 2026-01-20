# YYC3 Rdeis 组件架构文档

> 📋 **文档版本**: v2.0.0 | **更新时间**: 2025-12-07 | **维护团队**: YYC3 AI Family

## 📋 项目概述

YYC3 Rdeis组件是YYC3 AI Family统一平台的核心缓存服务层，基于Redis 7.0构建，提供高性能、高可用的缓存管理、会话存储、实时数据处理等功能。该组件采用现代化的缓存架构设计，支持集群部署、数据持久化、安全认证等企业级特性。

> 言传千行代码，语枢万物智能

## 🏗️ 系统架构

### 核心架构

```
YYC3 Rdeis 缓存服务架构
├── 💾 Redis Cluster (6379/6606)     # Redis缓存集群
├── 🔌 API Gateway (3000)          # Redis管理API
├── 🛡️ Security Layer              # 安全认证层
├── 📊 Monitoring System          # 监控系统
└── 🔧 Management Tools           # 运维管理工具
```

### 服务端口映射

| 服务名称 | 开发端口 | 生产端口 | 域名 | 状态 |
|---------|---------|---------|------|------|
| Redis服务 | 6379 | 6606 | redis.0379.email | ✅ 运行中 |
| 管理API | 3000 | 6600 | api.0379.email | ✅ 运行中 |

### 服务器配置

- **生产服务器**: root@8.130.127.121 (yyc3-121)
- **开发服务器**: root@8.152.195.33 (yyc3-33)
- **主域名**: redis.0379.email
- **API集成**: 与app组件的API服务集成

## 💾 Redis缓存架构

### Redis配置特点

- **版本**: Redis 7.0
- **模式**: 独立模式 + 集群支持
- **持久化**: RDB + AOF 双重保障
- **内存策略**: volatile-lru
- **安全认证**: 密码认证 + ACL权限控制

### 数据库设计

- **数据库数量**: 16个逻辑数据库 (0-15)
- **默认数据库**: db0 (服务状态缓存)
- **用户会话**: db1 (用户登录状态)
- **API缓存**: db2 (API响应缓存)
- **AI模型**: db3 (AI模型缓存)
- **系统配置**: db4 (配置信息缓存)

### 数据分类

```javascript
// 缓存键命名规范
{
  "service:status": "服务状态信息",
  "session:user:{userId}": "用户会话数据",
  "cache:api:{endpoint}": "API响应缓存",
  "cache:ai:{modelId}": "AI模型信息",
  "config:system:{key}": "系统配置",
  "temp:{sessionId}": "临时数据"
}
```

## 🔌 API网关架构

### 标准化接口

所有管理操作通过统一的REST API接口：

```bash
# 服务信息
GET /

# 健康检查
GET /health

# 系统信息
GET /info

# 缓存统计
GET /api/stats

# 缓存操作
POST /api/ops
```

### 核心功能

- **缓存管理**: GET/SET/DEL/EXISTS操作
- **批量操作**: KEYS/FLUSHDB
- **数据同步**: 服务状态同步缓存
- **统计监控**: 命中率、内存使用统计

## 🛡️ 安全架构

### 多层安全防护

1. **网络层**: 防火墙配置、端口限制
2. **认证层**: 密码认证、JWT Token
3. **权限层**: Redis ACL权限控制
4. **操作层**: 危险命令重命名/禁用

### 安全配置

```redis
# 基础安全配置
protected-mode yes
requirepass your_redis_password

# ACL权限控制
acl user default on nopass ~* +@read +@write +@admin
acl user admin on allkeys allcommands

# 危险命令重命名
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

## 📊 监控架构

### 监控指标

- **性能指标**: QPS、响应时间、命中率
- **资源指标**: 内存使用、CPU使用、网络IO
- **业务指标**: 键值数量、过期统计、大key监控
- **系统指标**: 连接数、慢查询、错误率

### 健康检查

```bash
# Redis连通性检查
redis-cli -a password ping

# 内存状态检查
redis-cli -a password info memory

# 键空间统计
redis-cli -a password info keyspace
```

## 🔧 运维管理

### 部署方式

1. **Docker容器**: 轻量级容器化部署
2. **Docker Compose**: 多服务编排部署
3. **Kubernetes**: 云原生集群部署
4. **裸机部署**: 传统服务器部署

### 运维脚本

- **redis-manager.sh**: 统一管理脚本
- **health-keys.sh**: 健康检查脚本
- **backup-restore.sh**: 备份恢复脚本
- **sync-redis-config.sh**: 配置同步脚本

### 数据管理

- **数据备份**: 定时RDB快照备份
- **数据恢复**: 快速故障恢复机制
- **数据迁移**: 无缝数据迁移工具
- **数据清理**: 自动过期数据清理

## 🔗 服务集成

### YYC3生态集成

- **与App组件**: 提供缓存服务支持
- **与API服务**: 统一的健康检查接口
- **与管理控制台**: 集成到统一管理界面
- **监控系统**: 与Prometheus/Grafana集成

### 外部服务支持

- **邮件服务**: 缓存邮件模板和发送记录
- **AI服务**: 缓存模型配置和推理结果
- **用户系统**: 缓存用户会话和权限信息

## 🚀 性能优化

### 缓存策略

- **热点数据**: 优先缓存高频访问数据
- **过期策略**: 基于TTL的智能过期
- **内存优化**: 大key拆分和数据压缩
- **批量操作**: Pipeline批量操作优化

### 高可用设计

- **主从复制**: 读写分离部署
- **哨兵模式**: 自动故障转移
- **集群模式**: 水平扩展支持
- **监控告警**: 实时性能监控

## 📈 扩展规划

### 短期扩展 (1-3个月)

- [ ] Redis Cluster集群部署
- [ ] 全量数据备份策略
- [ ] 性能监控仪表板
- [ ] 自动化运维脚本

### 中期扩展 (3-6个月)

- [ ] 多活数据中心
- [ ] 智能缓存预热
- [ ] 数据分析平台
- [ ] 容器编排优化

### 长期扩展 (6个月+)

- [ ] AI驱动的缓存优化
- [ ] 边缘计算缓存
- [ ] 多云部署支持
- [ ] 企业级安全加固

## 🔗 相关文档

### 技术文档

- [API接口文档](api/docs/)
- [配置说明](docs/REDIS.md)
- [部署指南](docs/NAS-DEPLOY.md)
- [运维手册](docs/OPS.md)

### 开发文档

- [环境变量规范](docs/ENV.md)
- [安全策略](docs/SECURITY.md)
- [脚本使用说明](docs/SCRIPTS.md)

---

<div align="center">

**[⬆️ 回到顶部](#yyc3-rdeis-组件架构文档)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 🚀

---

**🎉 YYC3 Rdeis - 企业级缓存服务的最佳实践！**

</div>
