# YYC3-NAS-ECS Staging 环境部署指南

**版本**: 1.0.0
**更新时间**: 2026-02-04

---

## 📋 目录

1. [环境要求](#环境要求)
2. [快速开始](#快速开始)
3. [详细部署步骤](#详细部署步骤)
4. [验证部署](#验证部署)
5. [回滚流程](#回滚流程)
6. [常见问题](#常见问题)
7. [维护操作](#维护操作)

---

## 环境要求

### 服务器规格

| 资源 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核 | 4 核 |
| 内存 | 4GB | 8GB |
| 磁盘 | 20GB | 50GB SSD |
| 操作系统 | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### 软件依赖

```bash
# Docker 20.10+
docker --version

# Docker Compose 2.0+
docker-compose --version

# Git 2.25+
git --version

# Python 3.9+ (for migrations)
python3 --version
```

### 网络端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 3000 | Web 界面 |
| API | 3200 | REST API |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| Prometheus | 9090 | 监控指标 |
| Grafana | 3001 | 监控面板 |
| Jaeger | 16686 | 分布式追踪 |

---

## 快速开始

### 1. 克隆代码

```bash
# 克隆仓库
git clone <repository-url> /opt/yyc3-nas-ecs
cd /opt/yyc3-nas-ecs

# 切换到 staging 分支
git checkout staging
```

### 2. 配置环境

```bash
# 创建环境配置文件
cp deploy/staging/.env.staging.template .env.staging

# 编辑配置（至少修改以下项）
vi .env.staging
```

**必需修改的配置**:
- `DATABASE_URL` - 数据库连接字符串
- `JWT_SECRET_KEY` - JWT 密钥（至少 32 字符）
- `SECRET_KEY` - 应用密钥（至少 32 字符）
- `REDIS_PASSWORD` - Redis 密码

### 3. 部署

```bash
# 使用一键部署脚本
cd deploy/staging
./deploy-staging.sh
```

### 4. 验证

```bash
# 运行验证脚本
./verify-staging.sh --full
```

---

## 详细部署步骤

### 步骤 1: 准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 添加用户到 docker 组
sudo usermod -aG docker $USER

# 重新登录以应用组更改
```

### 步骤 2: 配置防火墙

```bash
# 允许必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 3200/tcp  # API

# 启用防火墙
sudo ufw enable
```

### 步骤 3: 创建目录结构

```bash
# 创建项目目录
sudo mkdir -p /opt/yyc3-nas-ecs
sudo chown $USER:$USER /opt/yyc3-nas-ecs

# 创建日志目录
mkdir -p /opt/yyc3-nas-ecs/logs

# 创建备份目录
mkdir -p /opt/yyc3-nas-ecs/backups/staging
```

### 步骤 4: 部署应用

```bash
# 进入部署目录
cd /opt/yyc3-nas-ecs/deploy/staging

# 检查部署前置条件
./deploy-staging.sh --dry-run --verbose

# 执行部署
./deploy-staging.sh
```

**部署过程**:
1. ✅ 检查前置条件
2. ✅ 备份当前部署（如存在）
3. ✅ 停止当前服务
4. ✅ 拉取最新代码
5. ✅ 构建 Docker 镜像
6. ✅ 启动服务
7. ✅ 等待服务就绪
8. ✅ 运行数据库迁移
9. ✅ 验证部署

### 步骤 5: 访问服务

部署完成后，可以访问以下服务：

| 服务 | URL | 说明 |
|------|-----|------|
| 前端 | http://your-server:3000 | Web 界面 |
| API | http://your-server:3200 | API 文档 |
| 健康检查 | http://your-server:3200/api/v2/health | 服务状态 |
| Grafana | http://your-server:3001 | 监控面板 (admin/staging-admin) |
| Prometheus | http://your-server:9090 | 指标数据 |
| Jaeger | http://your-server:16686 | 分布式追踪 |

---

## 验证部署

### 自动化验证

```bash
cd /opt/yyc3-nas-ecs/deploy/staging

# 运行完整验证
./verify-staging.sh --full
```

验证内容：
- ✅ Docker 服务状态
- ✅ 容器运行状态
- ✅ API 健康检查
- ✅ 数据库连接
- ✅ Redis 连接
- ✅ 前端服务
- ✅ API 端点
- ✅ 日志检查

### 手动验证

```bash
# 1. 检查容器状态
docker-compose -f docker-compose.staging.yml ps

# 2. 检查 API 健康
curl http://localhost:3200/api/v2/health

# 3. 检查日志
docker-compose -f docker-compose.staging.yml logs --tail=50 api

# 4. 测试 API 端点
curl http://localhost:3200/api/v2/
```

---

## 回滚流程

### 快速回滚（代码回滚）

```bash
cd /opt/yyc3-nas-ecs/deploy/staging

# 回滚到上一版本
./rollback-staging.sh
```

### 完整回滚（代码 + 数据库）

```bash
# 回滚并恢复数据库
./rollback-staging.sh --restore-db
```

### 恢复特定备份

```bash
# 列出可用备份
ls -lt /opt/yyc3-nas-ecs/backups/staging/

# 恢复指定备份
./rollback-staging.sh --backup-name staging-backup-20260204-120000
```

### 手动回滚

```bash
# 1. 停止服务
docker-compose -f docker-compose.staging.yml down

# 2. 回滚代码
cd /opt/yyc3-nas-ecs
git reset --hard HEAD~1

# 3. 回滚数据库迁移
docker-compose -f docker-compose.staging.yml run --rm api python scripts/migrate.py downgrade

# 4. 重启服务
docker-compose -f docker-compose.staging.yml up -d
```

---

## 常见问题

### 问题 1: 容器无法启动

**症状**:
```bash
$ docker-compose up -d
ERROR: for api  Cannot start service api: ...
```

**解决方案**:
```bash
# 检查容器日志
docker-compose logs api

# 检查端口占用
sudo netstat -tulpn | grep :3200

# 检查磁盘空间
df -h

# 重新构建镜像
docker-compose build --no-cache
```

### 问题 2: 数据库连接失败

**症状**:
```json
{
  "status": "unhealthy",
  "checks": {
    "database": {
      "status": "unhealthy",
      "message": "Database connection failed"
    }
  }
}
```

**解决方案**:
```bash
# 检查数据库容器状态
docker-compose ps postgres

# 检查数据库日志
docker-compose logs postgres

# 验证数据库连接
docker-compose exec postgres pg_isready -U postgres

# 重新创建数据库
docker-compose down -v
docker-compose up -d postgres
```

### 问题 3: 迁移失败

**症状**:
```bash
$ python scripts/migrate.py upgrade
ERROR: ...
```

**解决方案**:
```bash
# 检查当前迁移状态
python scripts/migrate.py status

# 回滚到已知状态
python scripts/migrate.py downgrade base

# 重新运行迁移
python scripts/migrate.py upgrade
```

### 问题 4: 健康检查超时

**症状**:
```bash
$ curl http://localhost:3200/api/v2/health
curl: (7) Failed to connect to localhost port 3200
```

**解决方案**:
```bash
# 检查服务是否启动
docker-compose ps

# 检查服务日志
docker-compose logs api

# 手动重启服务
docker-compose restart api

# 等待更长时间
sleep 30
curl http://localhost:3200/api/v2/health
```

---

## 维护操作

### 查看日志

```bash
# 实时日志
docker-compose -f docker-compose.staging.yml logs -f api

# 最近 100 行
docker-compose -f docker-compose.staging.yml logs --tail=100 api

# 所有服务日志
docker-compose -f docker-compose.staging.yml logs
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.staging.yml restart

# 重启单个服务
docker-compose -f docker-compose.staging.yml restart api
```

### 更新代码

```bash
# 拉取最新代码
cd /opt/yyc3-nas-ecs
git pull origin staging

# 重新部署
cd deploy/staging
./deploy-staging.sh
```

### 清理资源

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的卷
docker volume prune

# 清理未使用的网络
docker network prune
```

### 备份数据

```bash
# 备份数据库
docker-compose -f docker-compose.staging.yml exec -T postgres \
    pg_dump -U postgres yyc3_staging > backup-$(date +%Y%m%d).sql

# 备份环境变量
cp .env.staging backups/staging/.env-$(date +%Y%m%d)

# 备份 Git 版本
git rev-parse HEAD > backups/staging/git-commit-$(date +%Y%m%d).txt
```

---

## 监控和告警

### Prometheus 指标

访问 http://your-server:9090 查看以下指标：

- `http_requests_total` - HTTP 请求总数
- `http_request_duration_seconds` - 请求延迟
- `database_connections` - 数据库连接数
- `redis_commands_total` - Redis 命令总数

### Grafana 仪表盘

访问 http://your-server:3001 使用以下凭据：

- 用户名: `admin`
- 密码: `staging-admin`（首次登录后更改）

推荐的仪表盘：
- System Overview
- API Performance
- Database Metrics
- Cache Performance

### 告警配置

在 `prometheus/alerts.yml` 中配置告警规则：

```yaml
groups:
  - name: staging_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        annotations:
          summary: "API 错误率过高"
```

---

## 安全建议

### 密钥管理

1. **定期轮换密钥**
   ```bash
   # 生成新密钥
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **不要提交密钥到代码库**
   ```bash
   # 添加到 .gitignore
   echo ".env.staging" >> .gitignore
   ```

3. **使用密钥管理服务**（生产环境）
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault

### 网络安全

1. **使用 SSL/TLS**
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
   }
   ```

2. **配置防火墙规则**
   ```bash
   # 仅允许特定 IP
   sudo ufw allow from 192.168.1.0/24 to any port 3200
   ```

3. **启用速率限制**
   ```bash
   # 在 .env.staging 中配置
   RATE_LIMIT_ENABLED=true
   RATE_LIMIT_MAX_REQUESTS=100
   ```

---

## 联系支持

如遇到问题，请联系：

- **技术支持**: support@yyc3.com
- **文档**: https://docs.yyc3.com
- **GitHub Issues**: https://github.com/yyc3/YYC3-NAS-ECS/issues
