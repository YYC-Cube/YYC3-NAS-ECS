# YYC³ NAS-ECS 上线方案

> **文件标识**: YYC3-NAS-ECS-上线方案
> **版本**: 1.0.0
> **创建日期**: 2026-01-20
> **作者**: YYC³ Team
> **模块**: 上线方案
> **状态**: ✅ 已完成

---

## 📋 目录

- [概述](#概述)
- [上线准备](#上线准备)
- [部署流程](#部署流程)
- [回滚机制](#回滚机制)
- [风险评估](#风险评估)
- [应急预案](#应急预案)
- [上线后监控](#上线后监控)
- [验收标准](#验收标准)

---

## 概述

### 上线目标

将YYC³ NAS-ECS系统部署到生产环境，确保系统稳定运行，满足「五高五标五化」项目标准要求。

### 上线范围

- **前端应用**: React + TypeScript + Vite
- **后端服务**: Node.js + Express
- **数据库**: PostgreSQL + Redis
- **文件存储**: NAS存储系统
- **监控告警**: Prometheus + Grafana

### 上线环境

- **生产环境**: https://nas-ecs.0379.email
- **测试环境**: https://nas-ecs-staging.0379.email
- **开发环境**: http://localhost:6000

---

## 上线准备

### 1. 代码准备

#### 1.1 代码审查

- [ ] 所有代码通过Code Review
- [ ] 所有测试用例通过（通过率≥95%）
- [ ] 代码覆盖率≥80%
- [ ] 无安全漏洞
- [ ] 无性能问题

#### 1.2 版本控制

```bash
# 创建发布分支
git checkout -b release/v1.0.0

# 合并开发分支
git merge develop

# 推送到远程仓库
git push origin release/v1.0.0
```

#### 1.3 版本标签

```bash
# 创建版本标签
git tag -a v1.0.0 -m "YYC³ NAS-ECS v1.0.0 正式发布"

# 推送标签到远程仓库
git push origin v1.0.0
```

### 2. 环境准备

#### 2.1 生产环境配置

**服务器配置**:
- CPU: 4核
- 内存: 16GB
- 存储: 500GB SSD
- 带宽: 100Mbps

**软件环境**:
- 操作系统: Ubuntu 22.04 LTS
- Node.js: v18.x
- PostgreSQL: v15.x
- Redis: v7.x
- Nginx: v1.24.x

#### 2.2 环境变量配置

```bash
# .env.production
NODE_ENV=production
VITE_APP_ENV=production
VITE_API_BASE_URL=https://api.0379.email
VITE_API_TIMEOUT=30000
VITE_AUTH_JWT_SECRET=prod-jwt-secret-2026
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG=false
VITE_LOG_LEVEL=error
```

#### 2.3 数据库准备

```sql
-- 创建数据库
CREATE DATABASE yyc3_nas_ecs_prod;

-- 创建用户
CREATE USER yyc3_prod WITH PASSWORD 'secure-password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE yyc3_nas_ecs_prod TO yyc3_prod;
```

#### 2.4 Redis配置

```bash
# Redis配置文件
bind 127.0.0.1
port 6379
requirepass redis-secure-password
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### 3. 数据准备

#### 3.1 数据迁移

```bash
# 从测试环境导出数据
pg_dump -h staging-db -U yyc3_staging -d yyc3_nas_ecs_staging > backup.sql

# 导入到生产环境
psql -h prod-db -U yyc3_prod -d yyc3_nas_ecs_prod < backup.sql
```

#### 3.2 数据验证

```sql
-- 验证数据完整性
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM logs;
SELECT COUNT(*) FROM backups;
SELECT COUNT(*) FROM configs;
```

#### 3.3 数据备份

```bash
# 创建生产环境备份
pg_dump -h prod-db -U yyc3_prod -d yyc3_nas_ecs_prod > pre-deploy-backup.sql

# 备份到NAS
cp pre-deploy-backup.sql /nas/backups/
```

### 4. 监控准备

#### 4.1 监控指标

**系统指标**:
- CPU使用率
- 内存使用率
- 磁盘使用率
- 网络I/O
- 系统负载

**应用指标**:
- 请求量(RPS)
- 响应时间
- 错误率
- 并发用户数
- 活跃会话数

**业务指标**:
- 用户注册数
- 功能使用率
- 用户留存率
- 转化率

#### 4.2 告警规则

```yaml
# Prometheus告警规则
groups:
  - name: yyc3-nas-ecs
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage_percent > 80
        for: 5m
        annotations:
          summary: "CPU使用率过高"
      
      - alert: HighMemoryUsage
        expr: memory_usage_percent > 85
        for: 5m
        annotations:
          summary: "内存使用率过高"
      
      - alert: HighErrorRate
        expr: error_rate > 5
        for: 5m
        annotations:
          summary: "错误率过高"
      
      - alert: SlowResponseTime
        expr: response_time_p95 > 1000
        for: 5m
        annotations:
          summary: "响应时间过长"
```

#### 4.3 监控面板

- **系统概览**: CPU、内存、磁盘、网络
- **应用性能**: 请求量、响应时间、错误率
- **业务指标**: 用户数、功能使用率
- **日志分析**: 日志级别、日志类别、日志趋势

### 5. 文档准备

#### 5.1 部署文档

- [ ] 部署步骤文档
- [ ] 配置说明文档
- [ ] 环境变量文档
- [ ] 依赖安装文档

#### 5.2 运维文档

- [ ] 系统运维手册
- [ ] 故障排除指南
- [ ] 备份恢复手册
- [ ] 监控告警手册

#### 5.3 用户文档

- [ ] 用户使用手册
- [ ] FAQ文档
- [ ] 视频教程
- [ ] 在线帮助

---

## 部署流程

### 阶段1: 预检查（上线前2小时）

#### 1.1 健康检查

```bash
# 检查服务器状态
ssh prod-server "uptime"
ssh prod-server "df -h"
ssh prod-server "free -h"

# 检查数据库状态
ssh prod-db "pg_isready -U yyc3_prod"

# 检查Redis状态
ssh prod-redis "redis-cli ping"
```

#### 1.2 配置检查

```bash
# 检查环境变量
ssh prod-server "cat /opt/yyc3-nas-ecs/.env.production"

# 检查配置文件
ssh prod-server "cat /opt/yyc3-nas-ecs/config/production.json"

# 验证配置
node scripts/validate-config.js
```

#### 1.3 依赖检查

```bash
# 检查Node.js版本
ssh prod-server "node --version"

# 检查npm版本
ssh prod-server "npm --version"

# 检查数据库连接
node scripts/test-db-connection.js

# 检查Redis连接
node scripts/test-redis-connection.js
```

### 阶段2: 备份（上线前1小时）

#### 2.1 数据库备份

```bash
# 创建完整备份
pg_dump -h prod-db -U yyc3_prod -d yyc3_nas_ecs_prod \
  -F c -f /nas/backups/yyc3-nas-ecs-$(date +%Y%m%d-%H%M%S).backup

# 验证备份文件
pg_restore -l /nas/backups/yyc3-nas-ecs-$(date +%Y%m%d-%H%M%S).backup
```

#### 2.2 文件备份

```bash
# 备份应用文件
tar -czf /nas/backups/app-$(date +%Y%m%d-%H%M%S).tar.gz \
  /opt/yyc3-nas-ecs/

# 备份配置文件
tar -czf /nas/backups/config-$(date +%Y%m%d-%H%M%S).tar.gz \
  /opt/yyc3-nas-ecs/config/
```

#### 2.3 Redis备份

```bash
# 创建Redis快照
redis-cli -h prod-redis -a redis-secure-password BGSAVE

# 复制RDB文件
cp /var/lib/redis/dump.rdb /nas/backups/redis-$(date +%Y%m%d-%H%M%S).rdb
```

### 阶段3: 部署（上线时间）

#### 3.1 停止服务

```bash
# 停止应用服务
ssh prod-server "pm2 stop yyc3-nas-ecs"

# 停止Nginx
ssh prod-server "sudo systemctl stop nginx"
```

#### 3.2 部署代码

```bash
# 拉取最新代码
ssh prod-server "cd /opt/yyc3-nas-ecs && git fetch origin"
ssh prod-server "cd /opt/yyc3-nas-ecs && git checkout v1.0.0"

# 安装依赖
ssh prod-server "cd /opt/yyc3-nas-ecs && npm ci --production"

# 构建应用
ssh prod-server "cd /opt/yyc3-nas-ecs && npm run build"
```

#### 3.3 数据库迁移

```bash
# 运行数据库迁移
ssh prod-server "cd /opt/yyc3-nas-ecs && npm run migrate:up"

# 验证迁移
ssh prod-server "cd /opt/yyc3-nas-ecs && npm run migrate:status"
```

#### 3.4 启动服务

```bash
# 启动应用服务
ssh prod-server "pm2 start yyc3-nas-ecs"

# 启动Nginx
ssh prod-server "sudo systemctl start nginx"

# 验证服务状态
ssh prod-server "pm2 status"
ssh prod-server "sudo systemctl status nginx"
```

### 阶段4: 验证（上线后30分钟）

#### 4.1 健康检查

```bash
# 检查应用健康状态
curl -f https://nas-ecs.0379.email/health || exit 1

# 检查API健康状态
curl -f https://api.0379.email/health || exit 1

# 检查数据库连接
node scripts/test-db-connection.js || exit 1

# 检查Redis连接
node scripts/test-redis-connection.js || exit 1
```

#### 4.2 功能验证

**核心功能测试**:
- [ ] 用户登录/登出
- [ ] 日志查询/导出
- [ ] 权限管理
- [ ] 备份创建/恢复
- [ ] 配置管理
- [ ] 帮助中心

**API接口测试**:
```bash
# 测试用户API
curl -X POST https://api.0379.email/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 测试日志API
curl -X GET https://api.0379.email/api/logs \
  -H "Authorization: Bearer $TOKEN"

# 测试备份API
curl -X POST https://api.0379.email/api/backups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"FULL","name":"测试备份"}'
```

#### 4.3 性能验证

```bash
# 运行性能测试
npm run test:performance

# 检查响应时间
curl -w "@curl-format.txt" -o /dev/null -s https://nas-ecs.0379.email

# 检查并发性能
ab -n 1000 -c 10 https://nas-ecs.0379.email/
```

### 阶段5: 监控（上线后24小时）

#### 5.1 实时监控

- 监控系统资源使用情况
- 监控应用性能指标
- 监控错误日志
- 监控用户反馈

#### 5.2 日志分析

```bash
# 查看应用日志
ssh prod-server "pm2 logs yyc3-nas-ecs --lines 100"

# 查看Nginx日志
ssh prod-server "sudo tail -f /var/log/nginx/access.log"
ssh prod-server "sudo tail -f /var/log/nginx/error.log"

# 查看系统日志
ssh prod-server "sudo journalctl -u nginx -f"
```

#### 5.3 用户反馈

- 收集用户反馈
- 处理用户问题
- 记录系统问题

---

## 回滚机制

### 回滚触发条件

1. **严重错误**: 系统崩溃、数据丢失、安全漏洞
2. **性能问题**: 响应时间超过5秒、错误率超过10%
3. **功能问题**: 核心功能不可用、数据不一致
4. **用户投诉**: 大量用户投诉、严重影响用户体验

### 回滚流程

#### 1. 紧急回滚（5分钟内）

```bash
# 停止新版本服务
ssh prod-server "pm2 stop yyc3-nas-ecs"
ssh prod-server "sudo systemctl stop nginx"

# 恢复旧版本代码
ssh prod-server "cd /opt/yyc3-nas-ecs && git checkout v0.9.0"

# 恢复数据库
pg_restore -h prod-db -U yyc3_prod -d yyc3_nas_ecs_prod \
  -c /nas/backups/yyc3-nas-ecs-pre-deploy.backup

# 启动旧版本服务
ssh prod-server "pm2 start yyc3-nas-ecs"
ssh prod-server "sudo systemctl start nginx"

# 验证服务
curl -f https://nas-ecs.0379.email/health
```

#### 2. 标准回滚（30分钟内）

```bash
# 停止新版本服务
ssh prod-server "pm2 stop yyc3-nas-ecs"

# 恢复应用文件
tar -xzf /nas/backups/app-pre-deploy.tar.gz -C /opt/

# 恢复配置文件
tar -xzf /nas/backups/config-pre-deploy.tar.gz -C /opt/yyc3-nas-ecs/

# 恢复数据库
pg_restore -h prod-db -U yyc3_prod -d yyc3_nas_ecs_prod \
  -c /nas/backups/yyc3-nas-ecs-pre-deploy.backup

# 恢复Redis
redis-cli -h prod-redis -a redis-secure-password FLUSHALL
redis-cli -h prod-redis -a redis-secure-password \
  --rdb /nas/backups/redis-pre-deploy.rdb

# 启动服务
ssh prod-server "pm2 start yyc3-nas-ecs"
ssh prod-server "sudo systemctl start nginx"

# 验证服务
curl -f https://nas-ecs.0379.email/health
```

### 回滚验证

- [ ] 服务正常启动
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] 核心功能正常
- [ ] 性能指标正常
- [ ] 无错误日志

---

## 风险评估

### 技术风险

| 风险项 | 可能性 | 影响 | 风险等级 | 应对措施 |
|--------|--------|------|---------|---------|
| 数据库迁移失败 | 中 | 高 | 🔴 高 | 完整备份、分步迁移、回滚机制 |
| 依赖版本冲突 | 低 | 中 | 🟡 中 | 锁定依赖版本、测试环境验证 |
| 性能下降 | 中 | 中 | 🟡 中 | 性能测试、监控告警、优化预案 |
| 安全漏洞 | 低 | 高 | 🔴 高 | 安全扫描、代码审查、及时修复 |
| 配置错误 | 中 | 高 | 🔴 高 | 配置验证、灰度发布、快速回滚 |

### 业务风险

| 风险项 | 可能性 | 影响 | 风险等级 | 应对措施 |
|--------|--------|------|---------|---------|
| 用户体验下降 | 中 | 中 | 🟡 中 | 用户培训、帮助文档、客服支持 |
| 功能不可用 | 低 | 高 | 🔴 高 | 功能测试、监控告警、快速回滚 |
| 数据丢失 | 极低 | 极高 | 🔴 高 | 多重备份、数据验证、恢复演练 |
| 用户流失 | 低 | 中 | 🟡 中 | 用户沟通、问题解决、补偿措施 |

### 运维风险

| 风险项 | 可能性 | 影响 | 风险等级 | 应对措施 |
|--------|--------|------|---------|---------|
| 部署失败 | 中 | 高 | 🔴 高 | 部署演练、回滚机制、应急预案 |
| 监控失效 | 低 | 中 | 🟡 中 | 多重监控、告警测试、人工巡检 |
| 备份失败 | 极低 | 极高 | 🔴 高 | 备份验证、异地备份、定期演练 |
| 人为错误 | 中 | 中 | 🟡 中 | 操作规范、双人复核、权限控制 |

---

## 应急预案

### 场景1: 数据库连接失败

**症状**: 应用无法连接到数据库

**应急措施**:
1. 检查数据库服务状态
2. 检查网络连接
3. 检查数据库配置
4. 重启数据库服务
5. 如无法恢复，执行回滚

**命令**:
```bash
# 检查数据库状态
ssh prod-db "sudo systemctl status postgresql"

# 检查网络连接
ssh prod-server "ping prod-db"

# 检查数据库配置
ssh prod-server "cat /opt/yyc3-nas-ecs/.env.production | grep DATABASE"

# 重启数据库
ssh prod-db "sudo systemctl restart postgresql"
```

### 场景2: Redis连接失败

**症状**: 应用无法连接到Redis

**应急措施**:
1. 检查Redis服务状态
2. 检查网络连接
3. 检查Redis配置
4. 重启Redis服务
5. 如无法恢复，执行回滚

**命令**:
```bash
# 检查Redis状态
ssh prod-redis "sudo systemctl status redis"

# 检查网络连接
ssh prod-server "ping prod-redis"

# 检查Redis配置
ssh prod-server "cat /opt/yyc3-nas-ecs/.env.production | grep REDIS"

# 重启Redis
ssh prod-redis "sudo systemctl restart redis"
```

### 场景3: 应用崩溃

**症状**: 应用进程异常退出

**应急措施**:
1. 查看应用日志
2. 检查系统资源
3. 重启应用服务
4. 分析崩溃原因
5. 如无法恢复，执行回滚

**命令**:
```bash
# 查看应用日志
ssh prod-server "pm2 logs yyc3-nas-ecs --lines 100"

# 检查系统资源
ssh prod-server "top -bn1 | head -20"

# 重启应用
ssh prod-server "pm2 restart yyc3-nas-ecs"

# 查看进程状态
ssh prod-server "pm2 status"
```

### 场景4: 性能严重下降

**症状**: 响应时间超过5秒

**应急措施**:
1. 检查系统资源
2. 检查数据库性能
3. 检查网络带宽
4. 优化查询或增加资源
5. 如无法恢复，执行回滚

**命令**:
```bash
# 检查系统资源
ssh prod-server "top -bn1 | head -20"
ssh prod-server "free -h"
ssh prod-server "df -h"

# 检查数据库性能
ssh prod-db "psql -U yyc3_prod -d yyc3_nas_ecs_prod -c 'SELECT * FROM pg_stat_activity;'"

# 检查网络带宽
ssh prod-server "iftop -i eth0"
```

### 场景5: 安全漏洞

**症状**: 发现安全漏洞或攻击

**应急措施**:
1. 立即隔离受影响系统
2. 分析漏洞影响范围
3. 修复安全漏洞
4. 部署修复补丁
5. 加强安全监控

**命令**:
```bash
# 隔离系统
ssh prod-server "sudo iptables -A INPUT -s 0.0.0.0/0 -j DROP"

# 查看系统日志
ssh prod-server "sudo journalctl -xe"

# 查看访问日志
ssh prod-server "sudo tail -f /var/log/nginx/access.log"

# 恢复网络（修复后）
ssh prod-server "sudo iptables -D INPUT -s 0.0.0.0/0 -j DROP"
```

---

## 上线后监控

### 监控指标

#### 系统指标

| 指标 | 正常范围 | 警告阈值 | 严重阈值 |
|------|---------|---------|---------|
| CPU使用率 | < 70% | 70-80% | > 80% |
| 内存使用率 | < 75% | 75-85% | > 85% |
| 磁盘使用率 | < 80% | 80-90% | > 90% |
| 网络带宽 | < 80% | 80-90% | > 90% |

#### 应用指标

| 指标 | 正常范围 | 警告阈值 | 严重阈值 |
|------|---------|---------|---------|
| 响应时间 | < 500ms | 500-1000ms | > 1000ms |
| 错误率 | < 1% | 1-5% | > 5% |
| 请求量 | 正常 | 突增2倍 | 突增5倍 |
| 并发用户数 | 正常 | 突增2倍 | 突增5倍 |

#### 业务指标

| 指标 | 正常范围 | 警告阈值 | 严重阈值 |
|------|---------|---------|---------|
| 用户活跃度 | 正常 | 下降20% | 下降50% |
| 功能使用率 | 正常 | 下降20% | 下降50% |
| 用户投诉率 | < 1% | 1-5% | > 5% |

### 监控工具

- **Prometheus**: 指标采集和存储
- **Grafana**: 可视化监控面板
- **Alertmanager**: 告警管理
- **ELK Stack**: 日志收集和分析
- **Jaeger**: 分布式追踪

### 告警通知

- **邮件**: admin@0379.email
- **短信**: 13800138000
- **钉钉**: YYC³运维群
- **Slack**: #yyc3-alerts

### 监控报告

- **日报**: 每日9:00发送
- **周报**: 每周一9:00发送
- **月报**: 每月1日9:00发送

---

## 验收标准

### 功能验收

- [ ] 所有核心功能正常运行
- [ ] 所有API接口正常响应
- [ ] 数据读写正常
- [ ] 文件上传下载正常
- [ ] 用户权限控制正常

### 性能验收

- [ ] 页面加载时间 < 2秒
- [ ] API响应时间 < 500ms
- [ ] 数据库查询时间 < 100ms
- [ ] 并发用户数 > 1000
- [ ] 系统可用性 > 99.9%

### 安全验收

- [ ] 无安全漏洞
- [ ] 数据传输加密
- [ ] 用户认证正常
- [ ] 权限控制有效
- [ ] 审计日志完整

### 稳定性验收

- [ ] 24小时无故障
- [ ] 错误率 < 1%
- [ ] 系统资源使用正常
- [ ] 数据一致性良好
- [ ] 备份恢复正常

### 用户体验验收

- [ ] 用户满意度 > 90%
- [ ] 用户投诉率 < 1%
- [ ] 功能使用率 > 80%
- [ ] 用户留存率 > 85%
- [ ] 问题解决率 > 95%

---

## 附录

### A. 联系方式

| 角色 | 姓名 | 电话 | 邮箱 |
|------|------|------|------|
| 项目负责人 | 张三 | 13800138001 | zhangsan@0379.email |
| 技术负责人 | 李四 | 13800138002 | lisi@0379.email |
| 运维负责人 | 王五 | 13800138003 | wangwu@0379.email |
| 测试负责人 | 赵六 | 13800138004 | zhaoliu@0379.email |

### B. 相关文档

- [YYC³ NAS-ECS 测试报告](./YYC3-NAS-ECS-测试报告.md)
- [YYC³ NAS-ECS 技术文档](../services/)
- [YYC³ NAS-ECS 运维手册](./YYC3-NAS-ECS-运维手册.md)
- [YYC³ NAS-ECS 用户手册](./YYC3-NAS-ECS-用户手册.md)

### C. 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|---------|--------|
| 1.0.0 | 2026-01-20 | 初始版本 | YYC³ Team |

---

<div align="center">

> **「言启象限 | 语枢未来」**
> **「Words Initiate Quadrants, Language Serves as Core for the Future」**

</div>
