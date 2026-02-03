# YYC3-NAS-ECS Staging 环境部署检查清单

**文档版本**: 1.0.0
**最后更新**: 2026-02-04
**负责人**: DevOps 团队

---

## 📋 部署前检查清单

### 1. 服务器准备

- [ ] **服务器规格**
  - [ ] CPU: 至少 2 核心
  - [ ] 内存: 至少 4GB RAM
  - [ ] 磁盘: 至少 20GB 可用空间
  - [ ] 网络: 稳定的互联网连接

- [ ] **操作系统**
  - [ ] Ubuntu 20.04+ / Debian 11+ / CentOS 8+
  - [ ] 所有安全补丁已安装
  - [ ] 防火墙规则已配置

- [ ] **必需软件**
  - [ ] Docker 20.10+
  - [ ] Docker Compose 2.0+
  - [ ] Git 2.25+
  - [ ] Python 3.9+ (for migrations)

### 2. 环境配置

- [ ] **环境变量**
  - [ ] 创建 `.env.staging` 文件
  - [ ] 配置数据库连接 (DATABASE_URL)
  - [ ] 配置 JWT 密钥 (至少 32 字符)
  - [ ] 配置应用密钥 (至少 32 字符)
  - [ ] 配置 CORS 源
  - [ ] 配置邮件服务 (可选)
  - [ ] 配置 LLM API (可选)

- [ ] **网络配置**
  - [ ] 端口可用性检查
    - [ ] 3000 (Frontend)
    - [ ] 3200 (API)
    - [ ] 5432 (PostgreSQL)
    - [ ] 6379 (Redis)
    - [ ] 9090 (Prometheus)
    - [ ] 3001 (Grafana)
  - [ ] 域名配置 (如有)

### 3. 数据库准备

- [ ] **PostgreSQL**
  - [ ] 数据库已创建
  - [ ] 用户权限已配置
  - [ ] 连接字符串已验证

- [ ] **Redis (可选)**
  - [ ] Redis 服务运行中
  - [ ] 密码已配置 (如需要)

### 4. 代码准备

- [ ] **Git 仓库**
  - [ ] staging 分支存在
  - [ ] 最新代码已推送到 staging
  - [ ] 无未提交的更改

- [ ] **迁移文件**
  - [ ] 所有迁移文件已创建
  - [ ] 迁移脚本可执行

---

## 🚀 部署步骤

### 步骤 1: 准备部署

```bash
# 1. SSH 登录到 Staging 服务器
ssh user@staging-server

# 2. 导航到项目目录
cd /opt/yyc3-nas-ecs

# 3. 拉取最新代码
git fetch origin
git checkout staging
git pull origin staging
```

### 步骤 2: 配置环境

```bash
# 1. 创建环境文件
cp .env.example .env.staging

# 2. 编辑环境变量
vi .env.staging

# 3. 验证配置
python -c "from config.env_validator import print_validation_report"
```

### 步骤 3: 执行部署

```bash
# 方式 A: 使用部署脚本（推荐）
cd deploy/staging
chmod +x *.sh
./deploy-staging.sh

# 方式 B: 手动部署
docker-compose -f docker-compose.staging.yml pull
docker-compose -f docker-compose.staging.yml up -d
docker-compose -f docker-compose.staging.yml exec -T api python scripts/migrate.py upgrade
```

### 步骤 4: 验证部署

```bash
# 运行验证脚本
cd deploy/staging
./verify-staging.sh --full

# 或手动检查
curl http://localhost:3200/api/v2/health
```

---

## ✅ 功能验证清单

### API 端点

- [ ] `/api/v2/health` - 健康检查
- [ ] `/api/v2/` - API 根端点
- [ ] `/api/v2/auth/login` - 用户登录
- [ ] `/api/v2/monitoring/stats` - 系统统计
- [ ] `/api/v2/ddns/status` - DDNS 状态
- [ ] `/api/v2/nas/status` - NAS 状态

### 服务健康

- [ ] PostgreSQL 连接正常
- [ ] Redis 连接正常 (降级可接受)
- [ ] 磁盘空间充足 (>20%)
- [ ] 内存使用正常 (<80%)

### 日志检查

- [ ] 无严重错误日志
- [ ] API 响应时间正常
- [ ] 数据库查询正常

---

## 🔄 回滚测试清单

### 代码回滚测试

- [ ] 测试 Git reset 回滚
- [ ] 测试服务重启
- [ ] 验证回滚后功能正常

### 数据库回滚测试

- [ ] 测试迁移 downgrade
- [ ] 测试数据恢复
- [ ] 验证回滚后数据一致

### 完整回滚流程测试

- [ ] 停止服务
- [ ] 回滚代码
- [ ] 回滚数据库 (如配置)
- [ ] 重启服务
- [ ] 验证功能

---

## 📊 监控配置

### Prometheus

- [ ] Prometheus 运行正常
- [ ] 访问 http://localhost:9090
- [ ] 检查目标是否 UP
- [ ] 验证指标收集

### Grafana

- [ ] Grafana 运行正常
- [ ] 访问 http://localhost:3001
- [ ] 默认密码已更改
- [ ] 数据源已配置
- [ ] 仪表盘已导入

### Jaeger (可选)

- [ ] Jaeger 运行正常
- [ ] 访问 http://localhost:16686
- [ ] 追踪数据可见

---

## 🧪 压力测试

### API 性能测试

```bash
# 使用 Apache Bench
ab -n 1000 -c 10 http://localhost:3200/api/v2/health

# 使用 wrk
wrk -t4 -c100 -d30s http://localhost:3200/api/v2/monitoring/stats
```

- [ ] 健康检查响应时间 < 100ms
- [ ] API 端点响应时间 < 500ms
- [ ] 无 5xx 错误
- [ ] 并发请求处理正常

---

## 📝 问题记录

### 遇到的问题

| 问题描述 | 解决方案 | 状态 |
|---------|---------|------|
| 示例：数据库连接失败 | 检查 DATABASE_URL 配置 | ✅ 已解决 |

### 待解决问题

| 问题描述 | 优先级 | 负责人 |
|---------|--------|--------|
| 示例：Redis 缓存未启用 | P2 | 待分配 |

---

## 📞 联系信息

**技术支持**: support@yyc3.com
**紧急联系**: +86-xxx-xxxx-xxxx

---

## 📅 部署历史

| 日期 | 版本 | 部署人 | 状态 | 备注 |
|------|------|--------|------|------|
| 2026-02-04 | v1.0.0 | DevOps | ✅ 成功 | 初始 Staging 部署 |

---

## ✍️ 签字确认

**部署工程师**: _______________  日期: _______

**测试工程师**: _______________  日期: _______

**负责人**: _______________  日期: _______
