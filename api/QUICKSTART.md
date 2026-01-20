# YYC³（YanYuCloudCube）NAS DDNS API 快速开始指南

![Git Banner](../public/git_1800_450-6.png)

<div align="center">

[![YYC³](https://img.shields.io/badge/YYC³-五高五标五化-blue)](https://github.com/YYC3)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-3.0+-red.svg)](https://flask.palletsprojects.com/)
[![Docker](https://img.shields.io/badge/docker-20.10+-blue.svg)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/docker--compose-2.0+-blue.svg)](https://docs.docker.com/compose/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-7+-red.svg)](https://redis.io/)
[![API](https://img.shields.io/badge/api-v2.0-orange.svg)](https://ddns.0379.email/api/v2/docs)
[![Status](https://img.shields.io/badge/status-production-success.svg)](https://ddns.0379.email)
[![Quick Start](https://img.shields.io/badge/start-5%20min-brightgreen.svg)](#快速启动)
[![Documentation](https://img.shields.io/badge/docs-complete-brightgreen.svg)](README.md)
[![Support](https://img.shields.io/badge/support-active-brightgreen.svg)](https://github.com/YYC3/issues)

**言启象限 | 语枢未来**
**万象归元于云枢 | 深栈智启新纪元**

</div>

---

## 📋 目录

- [前置要求](#-前置要求)
- [快速启动](#-快速启动)
- [访问地址](#-访问地址)
- [常用命令](#-常用命令)
- [配置说明](#-配置说明)
- [故障排查](#-故障排查)
- [API 使用示例](#-api-使用示例)
- [生产部署建议](#-生产部署建议)
- [性能优化](#-性能优化)
- [安全配置](#-安全配置)
- [下一步](#-下一步)
- [获取帮助](#-获取帮助)

---

## 🚀 前置要求

### 系统要求

| 组件 | 最低版本 | 推荐版本 | 用途 |
|------|----------|----------|------|
| **Docker** | 20.10+ | 24.0+ | 容器运行时 |
| **Docker Compose** | 2.0+ | 2.23+ | 容器编排 |
| **操作系统** | Linux/macOS/Windows | Ubuntu 22.04 LTS | 运行环境 |
| **CPU** | 2 核 | 4 核+ | 处理能力 |
| **内存** | 4GB | 8GB+ | 运行内存 |
| **磁盘空间** | 10GB | 20GB+ | 存储空间 |

### 软件依赖

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker-compose --version

# 检查系统资源
free -h
df -h
```

### 网络要求

- 稳定的互联网连接（用于下载镜像和依赖）
- 开放必要的端口（8080, 5432, 6379, 9090, 3000）
- 如需外网访问，需要配置域名和 DNS 解析

### 权限要求

- Docker 运行权限（非 root 用户需要添加到 docker 组）
- 文件系统读写权限
- 网络配置权限（如需修改防火墙规则）

---

## ⚡ 快速启动

### 1. 克隆项目

```bash
# 克隆项目仓库
git clone <repository-url>
cd nas-ddns-api

# 或者下载压缩包
wget <download-url>
unzip <zip-file>
cd nas-ddns-api
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量文件
nano .env
# 或使用其他编辑器
vim .env
# 或
code .env
```

#### 必需配置项

编辑 `.env` 文件，设置以下必要配置：

```bash
# ========================================
# 阿里云配置（必需）
# ========================================
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_DOMAIN=your_domain.com
ALIYUN_SUB_DOMAIN=ddns

# ========================================
# 服务器配置（必需）
# ========================================
NAS_SERVER_IP=your_server_ip
NAS_DOMAIN=ddns.your_domain.com

# ========================================
# 运行环境配置
# ========================================
ENVIRONMENT=production    # development, production, testing
API_PORT=8080
DEBUG=false
LOG_LEVEL=info

# ========================================
# 数据库配置
# ========================================
POSTGRES_DB=nas_ddns
POSTGRES_USER=nas_admin
POSTGRES_PASSWORD=your_secure_password

# ========================================
# Redis 配置
# ========================================
REDIS_PASSWORD=your_redis_password

# ========================================
# 监控配置
# ========================================
GRAFANA_ADMIN_PASSWORD=your_grafana_password
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# ========================================
# 安全配置
# ========================================
JWT_SECRET_KEY=your_jwt_secret_key_min_32_chars
API_RATE_LIMIT=100
```

#### 配置说明

| 配置项 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `ALIYUN_ACCESS_KEY_ID` | 阿里云访问密钥 ID | ✅ | - |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云访问密钥 Secret | ✅ | - |
| `ALIYUN_DOMAIN` | 主域名 | ✅ | - |
| `ALIYUN_SUB_DOMAIN` | 子域名 | ✅ | ddns |
| `NAS_SERVER_IP` | 服务器 IP 地址 | ✅ | - |
| `NAS_DOMAIN` | DDNS 域名 | ✅ | - |
| `ENVIRONMENT` | 运行环境 | ❌ | production |
| `API_PORT` | API 端口 | ❌ | 8080 |
| `DEBUG` | 调试模式 | ❌ | false |
| `LOG_LEVEL` | 日志级别 | ❌ | info |

### 3. 启动服务

#### 方式一：使用快速启动脚本（推荐）

```bash
# 赋予执行权限
chmod +x start.sh

# 启动所有服务
./start.sh

# 查看启动日志
docker-compose logs -f
```

#### 方式二：使用完整部署脚本

```bash
# 赋予执行权限
chmod +x deploy.sh

# 执行完整部署（包括数据库初始化）
./deploy.sh

# 部署脚本会自动执行：
# 1. 拉取 Docker 镜像
# 2. 创建必要的目录
# 3. 初始化数据库
# 4. 启动所有服务
# 5. 运行健康检查
```

#### 方式三：手动启动

```bash
# 拉取最新镜像
docker-compose pull

# 构建自定义镜像（如果需要）
docker-compose build

# 启动所有服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看启动日志
docker-compose logs -f api
```

#### 启动流程

```
┌─────────────────────────────────────────────────────────────┐
│                        启动流程                              │
├─────────────────────────────────────────────────────────────┤
│  1. 检查环境变量配置                                         │
│  2. 拉取 Docker 镜像                                        │
│  3. 创建网络和卷                                            │
│  4. 启动 PostgreSQL 数据库                                  │
│  5. 启动 Redis 缓存服务                                     │
│  6. 初始化数据库结构                                        │
│  7. 启动 Flask API 服务                                     │
│  8. 启动 Prometheus 监控                                    │
│  9. 启动 Grafana 可视化                                     │
│ 10. 运行健康检查                                            │
└─────────────────────────────────────────────────────────────┘
```

### 4. 验证服务

#### 自动验证

```bash
# 运行 API 测试脚本
chmod +x scripts/test_api.sh
./scripts/test_api.sh
```

#### 手动验证

```bash
# 检查服务健康状态
curl http://localhost:8080/api/v2/health

# 检查 DDNS 状态
curl http://localhost:8080/api/v2/ddns/status

# 检查 API 版本
curl http://localhost:8080/api/v2/version

# 检查系统监控
curl http://localhost:8080/api/v2/monitoring/system
```

#### 预期响应

健康检查成功响应示例：

```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2025-01-30T12:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "aliyun": "connected"
  }
}
```

---

## 🌐 访问地址

启动成功后，可以访问以下地址：

| 服务 | 地址 | 说明 | 认证 |
|------|------|------|------|
| **主 API** | http://localhost:8080/ | RESTful API | JWT |
| **API 文档** | http://localhost:8080/api/v2/docs | Swagger 文档 | 无需认证 |
| **健康检查** | http://localhost:8080/api/v2/health | 服务健康状态 | 无需认证 |
| **Prometheus** | http://localhost:9090 | 监控指标 | 无需认证 |
| **Grafana** | http://localhost:3000 | 监控面板 | admin/admin |

### 服务访问说明

#### API 文档

访问 Swagger 文档页面，可以：

- 查看所有 API 端点
- 测试 API 请求
- 查看请求/响应示例
- 在线调试 API

#### Prometheus

Prometheus 提供以下功能：

- 查询监控指标
- 查看目标状态
- 执行 PromQL 查询
- 导出监控数据

#### Grafana

Grafana 默认登录信息：

- 用户名：`admin`
- 密码：`admin`（首次登录后需修改）

功能包括：

- 创建自定义仪表板
- 可视化监控数据
- 设置告警规则
- 导入预置仪表板

---

## 🛠️ 常用命令

### 服务管理

```bash
# 查看服务状态
docker-compose ps

# 查看所有服务日志
docker-compose logs -f

# 查看 API 服务日志
docker-compose logs -f api

# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart api

# 停止服务
docker-compose stop

# 停止并删除容器
docker-compose down

# 完全清理（包括数据卷）
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build

# 查看资源使用情况
docker stats
```

### 数据库管理

```bash
# 初始化数据库
docker-compose exec api flask db upgrade

# 创建管理员用户
docker-compose exec api flask create-admin

# 填充测试数据
docker-compose exec api flask seed

# 进入数据库命令行
docker-compose exec postgres psql -U nas_admin -d nas_ddns

# 执行 SQL 脚本
docker-compose exec -T postgres psql -U nas_admin -d nas_ddns < script.sql

# 备份数据库
docker-compose exec postgres pg_dump -U nas_admin nas_ddns > backup.sql

# 查看数据库大小
docker-compose exec postgres psql -U nas_admin -d nas_ddns -c "SELECT pg_size_pretty(pg_database_size('nas_ddns'));"
```

### Redis 管理

```bash
# 进入 Redis 命令行
docker-compose exec redis redis-cli

# 测试 Redis 连接
docker-compose exec redis redis-cli ping

# 查看所有键
docker-compose exec redis redis-cli KEYS '*'

# 清空所有缓存
docker-compose exec redis redis-cli FLUSHALL

# 查看内存使用
docker-compose exec redis redis-cli INFO memory

# 监控 Redis 命令
docker-compose exec redis redis-cli MONITOR
```

### 备份与恢复

```bash
# 执行完整备份
docker-compose exec api python scripts/backup.sh

# 仅备份数据库
docker-compose exec postgres pg_dump -U nas_admin nas_ddns > db_backup.sql

# 仅备份配置
tar -czf config_backup.tar.gz .env docker-compose.yml

# 恢复数据库
docker-compose exec -T postgres psql -U nas_admin -d nas_ddns < db_backup.sql

# 恢复数据库（使用 pg_restore）
docker-compose exec -T postgres pg_restore -d nas_ddns -U nas_admin /backup/database.dump

# 恢复配置
tar -xzf config_backup.tar.gz
```

### 监控与调试

```bash
# 查看 API 日志（实时）
docker-compose logs -f api

# 查看所有服务日志（实时）
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100 api

# 进入 API 容器
docker-compose exec api bash

# 进入数据库容器
docker-compose exec postgres bash

# 查看容器资源使用
docker-compose top

# 查看容器网络
docker network ls
docker network inspect nas-ddns-api_default

# 检查容器健康状态
docker-compose ps
```

### 日志管理

```bash
# 查看错误日志
docker-compose logs api | grep ERROR

# 查看警告日志
docker-compose logs api | grep WARNING

# 导出日志到文件
docker-compose logs api > api.log

# 清理日志
docker-compose logs --tail=0 api

# 查看特定时间段的日志
docker-compose logs --since="2025-01-30T00:00:00" --until="2025-01-30T23:59:59" api
```

---

## ⚙️ 配置说明

### 环境变量

主要配置项位于 `.env` 文件：

```bash
# ========================================
# 运行环境
# ========================================
ENVIRONMENT=production    # development, production, testing

# ========================================
# API 配置
# ========================================
API_PORT=8080
DEBUG=false
LOG_LEVEL=info           # debug, info, warning, error, critical

# ========================================
# 数据库配置
# ========================================
POSTGRES_DB=nas_ddns
POSTGRES_USER=nas_admin
POSTGRES_PASSWORD=your_secure_password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# ========================================
# Redis 配置
# ========================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# ========================================
# 阿里云配置
# ========================================
ALIYUN_ACCESS_KEY_ID=your_key
ALIYUN_ACCESS_KEY_SECRET=your_secret
ALIYUN_DOMAIN=your_domain.com
ALIYUN_SUB_DOMAIN=ddns
ALIYUN_RECORD_TYPE=A
ALIYUN_TTL=600

# ========================================
# 监控配置
# ========================================
GRAFANA_ADMIN_PASSWORD=admin
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# ========================================
# 安全配置
# ========================================
JWT_SECRET_KEY=your_jwt_secret_key_min_32_chars
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000
API_RATE_LIMIT=100
CORS_ORIGINS=*

# ========================================
# DDNS 配置
# ========================================
DDNS_UPDATE_INTERVAL=300
DDNS_CHECK_INTERVAL=60
DDNS_IP_CHECK_URL=https://api.ipify.org

# ========================================
# 告警配置
# ========================================
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_SMTP_HOST=smtp.gmail.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_USERNAME=your_email@gmail.com
ALERT_EMAIL_PASSWORD=your_email_password
ALERT_EMAIL_FROM=noreply@your_domain.com
ALERT_EMAIL_TO=admin@your_domain.com
```

### 配置文件说明

| 文件 | 说明 | 优先级 |
|------|------|--------|
| `.env` | 环境变量配置 | 最高 |
| `.env.example` | 环境变量模板 | - |
| `docker-compose.yml` | Docker Compose 配置 | 中 |
| `config/config.py` | 应用配置 | 低 |
| `config/production.py` | 生产环境配置 | 低 |
| `config/development.py` | 开发环境配置 | 低 |

### 调整资源配置

编辑 `docker-compose.yml` 中的资源配置：

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    environment:
      - WORKERS=4
      - THREADS=2

  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    command:
      - "postgres"
      - "-c"
      - "max_connections=200"
      - "-c"
      - "shared_buffers=512MB"
      - "-c"
      - "effective_cache_size=2GB"

  redis:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    command:
      - "redis-server"
      - "--maxmemory"
      - "512mb"
      - "--maxmemory-policy"
      - "allkeys-lru"
```

### Nginx 配置示例

如果使用 Nginx 作为反向代理，配置示例：

```nginx
server {
    listen 80;
    server_name ddns.your_domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ddns.your_domain.com;

    # SSL 证书配置
    ssl_certificate /etc/ssl/certs/your_domain.crt;
    ssl_certificate_key /etc/ssl/private/your_domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # API 代理
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 静态文件缓存
    location /static {
        alias /path/to/static/files;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔧 故障排查

### 服务无法启动

**症状**：服务启动失败或立即退出

**诊断步骤**：

```bash
# 检查端口占用
lsof -i :8080
lsof -i :5432
lsof -i :6379
lsof -i :9090
lsof -i :3000

# 查看详细日志
docker-compose logs --tail=100 api
docker-compose logs --tail=100 postgres
docker-compose logs --tail=100 redis

# 检查磁盘空间
df -h

# 检查内存使用
free -h

# 检查 Docker 状态
docker ps -a
docker system df
```

**解决方案**：

```bash
# 1. 停止占用端口的进程
kill -9 <PID>

# 2. 清理 Docker 资源
docker system prune -a

# 3. 重新启动服务
docker-compose down -v
docker-compose up -d

# 4. 检查环境变量配置
cat .env | grep -v '^#' | grep -v '^$'

# 5. 验证 Docker 网络连接
docker network inspect nas-ddns-api_default
```

### 数据库连接失败

**症状**：API 无法连接到 PostgreSQL 数据库

**诊断步骤**：

```bash
# 检查 PostgreSQL 状态
docker-compose ps postgres

# 测试数据库连接
docker-compose exec postgres pg_isready

# 查看 PostgreSQL 日志
docker-compose logs postgres

# 检查数据库连接配置
docker-compose exec api env | grep POSTGRES

# 测试从 API 容器连接数据库
docker-compose exec api ping -c 3 postgres
```

**解决方案**：

```bash
# 1. 重启 PostgreSQL 服务
docker-compose restart postgres

# 2. 检查数据库凭证
docker-compose exec postgres psql -U nas_admin -d nas_ddns -c "SELECT version();"

# 3. 重新初始化数据库
docker-compose exec api flask db upgrade

# 4. 检查网络连接
docker-compose exec api nc -zv postgres 5432

# 5. 验证数据库权限
docker-compose exec postgres psql -U nas_admin -d nas_ddns -c "\l"
```

### Redis 连接问题

**症状**：API 无法连接到 Redis 缓存

**诊断步骤**：

```bash
# 检查 Redis 状态
docker-compose ps redis

# 测试 Redis 连接
docker-compose exec redis redis-cli ping

# 查看 Redis 日志
docker-compose logs redis

# 检查 Redis 配置
docker-compose exec redis redis-cli CONFIG GET '*'

# 测试从 API 容器连接 Redis
docker-compose exec api nc -zv redis 6379
```

**解决方案**：

```bash
# 1. 重启 Redis 服务
docker-compose restart redis

# 2. 测试 Redis 命令
docker-compose exec redis redis-cli SET test "hello"
docker-compose exec redis redis-cli GET test

# 3. 清空 Redis 缓存
docker-compose exec redis redis-cli FLUSHALL

# 4. 检查 Redis 密码配置
docker-compose exec redis redis-cli -a your_password PING

# 5. 验证 Redis 内存使用
docker-compose exec redis redis-cli INFO memory
```

### DDNS 更新失败

**症状**：DDNS 记录无法更新或更新失败

**诊断步骤**：

```bash
# 检查阿里云凭据
docker-compose exec api python -c "from app.utils.aliyun import test_credentials; test_credentials()"

# 查看 DDNS 日志
docker-compose logs api | grep ddns

# 检查当前 IP 地址
curl https://api.ipify.org

# 查看域名 DNS 记录
nslookup ddns.your_domain.com

# 检查 API 配置
docker-compose exec api env | grep ALIYUN
```

**解决方案**：

```bash
# 1. 验证阿里云访问密钥
docker-compose exec api python -c "
import os
from app.utils.aliyun import AliyunDDNS
print('Access Key ID:', os.getenv('ALIYUN_ACCESS_KEY_ID'))
print('Domain:', os.getenv('ALIYUN_DOMAIN'))
print('Sub Domain:', os.getenv('ALIYUN_SUB_DOMAIN'))
"

# 2. 手动触发 DDNS 更新
docker-compose exec api python -c "
from app.utils.aliyun import AliyunDDNS
ddns = AliyunDDNS()
result = ddns.update_ddns()
print('Update result:', result)
"

# 3. 检查域名解析
nslookup ddns.your_domain.com
dig ddns.your_domain.com

# 4. 验证 IP 地址
curl https://api.ipify.org
curl https://api64.ipify.org

# 5. 查看阿里云 DNS 记录
docker-compose exec api python -c "
from app.utils.aliyun import AliyunDDNS
ddns = AliyunDDNS()
records = ddns.get_domain_records()
print('Current records:', records)
"
```

### API 响应缓慢

**症状**：API 请求响应时间过长

**诊断步骤**：

```bash
# 检查系统负载
uptime
top

# 检查数据库查询性能
docker-compose exec postgres psql -U nas_admin -d nas_ddns -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
"

# 检查 Redis 缓存命中率
docker-compose exec redis redis-cli INFO stats | grep keyspace

# 检查网络延迟
ping -c 10 api.ipify.org

# 查看 API 日志中的慢查询
docker-compose logs api | grep "slow query"
```

**解决方案**：

```bash
# 1. 优化数据库查询
docker-compose exec postgres psql -U nas_admin -d nas_ddns -c "
CREATE INDEX IF NOT EXISTS idx_ddns_records_created_at 
ON ddns_records(created_at);
CREATE INDEX IF NOT EXISTS idx_ddns_records_domain 
ON ddns_records(domain);
"

# 2. 清理 Redis 缓存
docker-compose exec redis redis-cli FLUSHALL

# 3. 增加缓存时间
# 编辑 .env 文件
REDIS_CACHE_TTL=3600

# 4. 启用查询缓存
# 编辑 config/config.py
SQLALCHEMY_CACHE_ENABLED=True

# 5. 优化数据库连接池
# 编辑 docker-compose.yml
environment:
  - SQLALCHEMY_POOL_SIZE=20
  - SQLALCHEMY_MAX_OVERFLOW=10
  - SQLALCHEMY_POOL_TIMEOUT=30
```

### 内存不足

**症状**：容器因内存不足被终止

**诊断步骤**：

```bash
# 检查内存使用情况
free -h
docker stats --no-stream

# 查看容器内存限制
docker inspect api | grep -i memory

# 检查内存泄漏
docker-compose exec api python -c "
import tracemalloc
tracemalloc.start()
# 运行应用程序
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:10]:
    print(stat)
"

# 查看系统日志
dmesg | grep -i "out of memory"
journalctl -xe | grep -i "killed process"
```

**解决方案**：

```bash
# 1. 增加内存限制
# 编辑 docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G

  postgres:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  redis:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

# 2. 优化 Redis 内存使用
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 3. 清理 Docker 资源
docker system prune -a --volumes

# 4. 优化数据库缓存
docker-compose exec postgres psql -U nas_admin -d nas_ddns -c "
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET work_mem = '16MB';
SELECT pg_reload_conf();
"

# 5. 重启服务
docker-compose restart
```

### 权限错误

**症状**：文件访问或操作权限被拒绝

**诊断步骤**：

```bash
# 检查文件权限
ls -la
ls -la data/

# 检查用户组
groups
id

# 查看容器用户
docker-compose exec api whoami
docker-compose exec postgres whoami

# 检查 SELinux 状态（如果使用）
getenforce
sestatus
```

**解决方案**：

```bash
# 1. 修复文件权限
sudo chown -R $USER:$USER data/
sudo chmod -R 755 data/

# 2. 添加用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 3. 修复 Docker 卷权限
docker-compose down
sudo chown -R $USER:$USER /var/lib/docker/volumes/
docker-compose up -d

# 4. 禁用 SELinux（临时）
sudo setenforce 0

# 5. 配置 SELinux 上下文（永久）
sudo semanage fcontext -a -t container_file_t "/path/to/data(/.*)?"
sudo restorecon -Rv /path/to/data
```

### 日志文件过大

**症状**：磁盘空间被日志文件占用

**诊断步骤**：

```bash
# 查看日志文件大小
du -sh /var/lib/docker/containers/*/*-json.log
docker-compose logs --tail=0 api

# 查看磁盘使用情况
df -h
du -sh ./*

# 查看容器日志配置
docker inspect api | grep -i log
```

**解决方案**：

```bash
# 1. 配置日志轮转
# 编辑 /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# 2. 重启 Docker 服务
sudo systemctl restart docker

# 3. 清理旧日志
docker-compose logs --tail=0 api
docker system prune -a

# 4. 手动清理日志文件
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log

# 5. 配置应用日志级别
# 编辑 .env 文件
LOG_LEVEL=warning
```

---

## 📚 API 使用示例

### 认证流程

#### 1. 获取访问令牌

```bash
# 使用管理员账号登录
curl -X POST http://localhost:8080/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

#### 2. 使用令牌访问 API

```bash
# 在请求头中包含令牌
curl -X GET http://localhost:8080/api/v2/ddns/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 3. 刷新令牌

```bash
# 使用刷新令牌获取新的访问令牌
curl -X POST http://localhost:8080/api/v2/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### DDNS 管理

#### 1. 获取 DDNS 状态

```bash
curl -X GET http://localhost:8080/api/v2/ddns/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "current_ip": "123.45.67.89",
    "domain": "ddns.example.com",
    "last_update": "2025-01-30T12:00:00Z",
    "status": "active",
    "ttl": 600
  }
}
```

#### 2. 手动更新 DDNS

```bash
curl -X POST http://localhost:8080/api/v2/ddns/update \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "force": true
  }'
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "old_ip": "123.45.67.89",
    "new_ip": "123.45.67.90",
    "updated_at": "2025-01-30T12:05:00Z",
    "message": "DDNS record updated successfully"
  }
}
```

#### 3. 获取更新历史

```bash
curl -X GET "http://localhost:8080/api/v2/ddns/history?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "total": 100,
    "page": 1,
    "per_page": 10,
    "records": [
      {
        "id": 1,
        "ip": "123.45.67.90",
        "updated_at": "2025-01-30T12:05:00Z",
        "status": "success"
      }
    ]
  }
}
```

### 域名管理

#### 1. 获取所有域名

```bash
curl -X GET http://localhost:8080/api/v2/domains \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 2. 添加新域名

```bash
curl -X POST http://localhost:8080/api/v2/domains \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "sub_domain": "ddns",
    "record_type": "A",
    "ttl": 600
  }'
```

#### 3. 更新域名配置

```bash
curl -X PUT http://localhost:8080/api/v2/domains/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ttl": 300
  }'
```

#### 4. 删除域名

```bash
curl -X DELETE http://localhost:8080/api/v2/domains/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 监控与统计

#### 1. 获取系统监控数据

```bash
curl -X GET http://localhost:8080/api/v2/monitoring/system \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "cpu_usage": 25.5,
    "memory_usage": 45.2,
    "disk_usage": 60.8,
    "network_in": 1024.5,
    "network_out": 512.3,
    "uptime": 86400
  }
}
```

#### 2. 获取 API 统计

```bash
curl -X GET http://localhost:8080/api/v2/monitoring/api \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "total_requests": 10000,
    "successful_requests": 9800,
    "failed_requests": 200,
    "avg_response_time": 150.5,
    "requests_per_minute": 50
  }
}
```

#### 3. 获取 DDNS 统计

```bash
curl -X GET http://localhost:8080/api/v2/monitoring/ddns \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "total_updates": 500,
    "successful_updates": 495,
    "failed_updates": 5,
    "last_update": "2025-01-30T12:05:00Z",
    "avg_update_time": 2.5
  }
}
```

### 用户管理

#### 1. 获取用户列表

```bash
curl -X GET http://localhost:8080/api/v2/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 2. 创建用户

```bash
curl -X POST http://localhost:8080/api/v2/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "secure_password",
    "role": "user"
  }'
```

#### 3. 更新用户

```bash
curl -X PUT http://localhost:8080/api/v2/users/2 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com"
  }'
```

#### 4. 删除用户

```bash
curl -X DELETE http://localhost:8080/api/v2/users/2 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 错误处理

所有 API 错误响应都遵循统一格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息",
    "details": {}
  }
}
```

**常见错误码**：

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| `INVALID_TOKEN` | 无效的访问令牌 | 401 |
| `EXPIRED_TOKEN` | 令牌已过期 | 401 |
| `INSUFFICIENT_PERMISSIONS` | 权限不足 | 403 |
| `RESOURCE_NOT_FOUND` | 资源不存在 | 404 |
| `VALIDATION_ERROR` | 请求参数验证失败 | 400 |
| `INTERNAL_SERVER_ERROR` | 服务器内部错误 | 500 |

### 多语言示例

#### Python

```python
import requests

BASE_URL = "http://localhost:8080/api/v2"

# 登录获取令牌
response = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "admin",
    "password": "your_password"
})
token = response.json()["data"]["access_token"]

# 使用令牌访问 API
headers = {"Authorization": f"Bearer {token}"}

# 获取 DDNS 状态
response = requests.get(f"{BASE_URL}/ddns/status", headers=headers)
print(response.json())

# 手动更新 DDNS
response = requests.post(f"{BASE_URL}/ddns/update", 
                        headers=headers, 
                        json={"force": True})
print(response.json())
```

#### JavaScript

```javascript
const BASE_URL = "http://localhost:8080/api/v2";

// 登录获取令牌
async function login() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "admin",
      password: "your_password"
    })
  });
  const data = await response.json();
  return data.data.access_token;
}

// 使用令牌访问 API
async function getDDNSStatus(token) {
  const response = await fetch(`${BASE_URL}/ddns/status`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return await response.json();
}

// 手动更新 DDNS
async function updateDDNS(token) {
  const response = await fetch(`${BASE_URL}/ddns/update`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ force: true })
  });
  return await response.json();
}

// 使用示例
(async () => {
  const token = await login();
  const status = await getDDNSStatus(token);
  console.log(status);
  
  const update = await updateDDNS(token);
  console.log(update);
})();
```

#### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

const BASE_URL = "http://localhost:8080/api/v2"

type LoginRequest struct {
    Username string `json:"username"`
    Password string `json:"password"`
}

type LoginResponse struct {
    Success bool `json:"success"`
    Data    struct {
        AccessToken string `json:"access_token"`
    } `json:"data"`
}

func login() (string, error) {
    reqBody, _ := json.Marshal(LoginRequest{
        Username: "admin",
        Password: "your_password",
    })
    
    resp, err := http.Post(
        BASE_URL+"/auth/login",
        "application/json",
        bytes.NewBuffer(reqBody),
    )
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var result LoginResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return result.Data.AccessToken, nil
}

func getDDNSStatus(token string) {
    req, _ := http.NewRequest("GET", BASE_URL+"/ddns/status", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer resp.Body.Close()
    
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    fmt.Println(result)
}

func main() {
    token, err := login()
    if err != nil {
        fmt.Println("Login failed:", err)
        return
    }
    
    getDDNSStatus(token)
}
```

---

## 🚀 生产部署建议

### 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                        生产环境架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   用户      │───▶│   Nginx     │───▶│  API 服务   │      │
│  │             │    │  (反向代理)  │    │  (Flask)    │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                            │                  │              │
│                            │                  │              │
│                            ▼                  ▼              │
│                     ┌─────────────┐    ┌─────────────┐      │
│                     │   静态文件   │    │ PostgreSQL  │      │
│                     │   (CDN)     │    │   (主库)    │      │
│                     └─────────────┘    └─────────────┘      │
│                                              │              │
│                                              │              │
│                                              ▼              │
│                                       ┌─────────────┐      │
│                                       │ PostgreSQL  │      │
│                                       │   (从库)    │      │
│                                       └─────────────┘      │
│                                              │              │
│                                              │              │
│                                              ▼              │
│                                       ┌─────────────┐      │
│                                       │   Redis     │      │
│                                       │   (缓存)    │      │
│                                       └─────────────┘      │
│                                              │              │
│                                              │              │
│                                              ▼              │
│                                       ┌─────────────┐      │
│                                       │ Prometheus  │      │
│                                       │   + Grafana │      │
│                                       └─────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 环境配置

#### 生产环境变量

```bash
# .env.production

# ========================================
# 运行环境
# ========================================
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=warning

# ========================================
# API 配置
# ========================================
API_PORT=8080
WORKERS=4
THREADS=2

# ========================================
# 数据库配置
# ========================================
POSTGRES_DB=nas_ddns
POSTGRES_USER=nas_admin
POSTGRES_PASSWORD=<strong_password>
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_POOL_SIZE=20
POSTGRES_MAX_OVERFLOW=10

# ========================================
# Redis 配置
# ========================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<strong_password>
REDIS_DB=0
REDIS_MAX_CONNECTIONS=50

# ========================================
# 安全配置
# ========================================
JWT_SECRET_KEY=<very_long_secret_key_min_32_chars>
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000
API_RATE_LIMIT=100
CORS_ORIGINS=https://yourdomain.com

# ========================================
# SSL/TLS 配置
# ========================================
SSL_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/your_domain.crt
SSL_KEY_PATH=/etc/ssl/private/your_domain.key

# ========================================
# 监控配置
# ========================================
GRAFANA_ADMIN_PASSWORD=<strong_password>
PROMETHEUS_RETENTION=15d
GRAFANA_PORT=3000
PROMETHEUS_PORT=9090

# ========================================
# 告警配置
# ========================================
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_SMTP_HOST=smtp.gmail.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_USERNAME=your_email@gmail.com
ALERT_EMAIL_PASSWORD=<email_password>
ALERT_EMAIL_FROM=noreply@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com

# ========================================
# 备份配置
# ========================================
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=7
BACKUP_S3_BUCKET=your-backup-bucket
```

### Nginx 配置

```nginx
# /etc/nginx/sites-available/nas-ddns-api

upstream api_backend {
    least_conn;
    server api:8080 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ddns.yourdomain.com;

    # Let's Encrypt 验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ddns.yourdomain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/ddns.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ddns.yourdomain.com/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 日志
    access_log /var/log/nginx/api_access.log;
    error_log /var/log/nginx/api_error.log;

    # 客户端上传大小限制
    client_max_body_size 10M;

    # 超时配置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # API 代理
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 缓冲配置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # 禁用缓存
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # 静态文件
    location /static {
        alias /var/www/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 健康检查
    location /health {
        proxy_pass http://api_backend/api/v2/health;
        access_log off;
    }

    # 监控端点（仅内网访问）
    location /metrics {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://api_backend/metrics;
    }
}
```

### Docker Compose 生产配置

```yaml
# docker-compose.prod.yml

version: '3.8'

services:
  api:
    image: nas-ddns-api:latest
    container_name: nas-ddns-api
    restart: unless-stopped
    environment:
      - ENVIRONMENT=production
      - DEBUG=false
      - LOG_LEVEL=warning
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - nas-network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/v2/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    image: postgres:15-alpine
    container_name: nas-ddns-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - nas-network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    container_name: nas-ddns-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - nas-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  prometheus:
    image: prom/prometheus:latest
    container_name: nas-ddns-prometheus
    restart: unless-stopped
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
    networks:
      - nas-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  grafana:
    image: grafana/grafana:latest
    container_name: nas-ddns-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - nas-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    container_name: nas-ddns-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./config/nginx/sites-available:/etc/nginx/sites-available:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - api
    networks:
      - nas-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  certbot:
    image: certbot/certbot:latest
    container_name: nas-ddns-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - nas-network

networks:
  nas-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
```

### 部署脚本

```bash
#!/bin/bash

# deploy-production.sh

set -e

echo "🚀 开始部署生产环境..."

# 1. 检查环境变量
if [ ! -f .env.production ]; then
    echo "❌ 错误: .env.production 文件不存在"
    exit 1
fi

# 2. 拉取最新镜像
echo "📥 拉取最新镜像..."
docker-compose -f docker-compose.prod.yml pull

# 3. 备份数据库
echo "💾 备份数据库..."
docker-compose exec postgres pg_dump -U nas_admin nas_ddns > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. 停止旧服务
echo "🛑 停止旧服务..."
docker-compose -f docker-compose.prod.yml down

# 5. 启动新服务
echo "▶️  启动新服务..."
docker-compose -f docker-compose.prod.yml up -d

# 6. 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 30

# 7. 运行数据库迁移
echo "🔄 运行数据库迁移..."
docker-compose exec api flask db upgrade

# 8. 健康检查
echo "🏥 执行健康检查..."
for i in {1..10}; do
    if curl -f http://localhost:8080/api/v2/health; then
        echo "✅ 健康检查通过"
        break
    fi
    echo "⏳ 等待服务启动... ($i/10)"
    sleep 5
done

# 9. 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

echo "✅ 部署完成！"
```

### 备份策略

#### 自动备份脚本

```bash
#!/bin/bash

# backup.sh

set -e

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "📦 备份数据库..."
docker-compose exec -T postgres pg_dump -U nas_admin nas_ddns > $BACKUP_DIR/db_backup_$DATE.sql

# 备份配置文件
echo "📄 备份配置文件..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz .env docker-compose.yml

# 备份 Redis 数据
echo "🗄️  备份 Redis 数据..."
docker-compose exec redis redis-cli --rdb /data/dump.rdb
docker cp nas-ddns-redis:/data/dump.rdb $BACKUP_DIR/redis_backup_$DATE.rdb

# 上传到 S3（如果配置了）
if [ ! -z "$BACKUP_S3_BUCKET" ]; then
    echo "☁️  上传到 S3..."
    aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql s3://$BACKUP_S3_BUCKET/
    aws s3 cp $BACKUP_DIR/config_backup_$DATE.tar.gz s3://$BACKUP_S3_BUCKET/
    aws s3 cp $BACKUP_DIR/redis_backup_$DATE.rdb s3://$BACKUP_S3_BUCKET/
fi

# 清理旧备份
echo "🧹 清理旧备份..."
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "config_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "redis_backup_*.rdb" -mtime +$RETENTION_DAYS -delete

echo "✅ 备份完成！"
```

#### 定时任务配置

```bash
# 添加到 crontab
crontab -e

# 每天凌晨 2 点执行备份
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

---

## ⚡ 性能优化

### 数据库优化

#### 1. 索引优化

```sql
-- 创建必要的索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ddns_records_domain 
ON ddns_records(domain);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ddns_records_created_at 
ON ddns_records(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ddns_records_status 
ON ddns_records(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON users(email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_logs_timestamp 
ON api_logs(timestamp DESC);

-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM ddns_records 
WHERE domain = 'ddns.example.com' 
ORDER BY created_at DESC 
LIMIT 10;
```

#### 2. 查询优化

```sql
-- 使用连接池
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- 启用查询缓存
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- 重新加载配置
SELECT pg_reload_conf();
```

#### 3. 定期维护

```sql
-- 定期清理旧数据
DELETE FROM ddns_records 
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM api_logs 
WHERE timestamp < NOW() - INTERVAL '30 days';

-- 定期清理死元组
VACUUM ANALYZE ddns_records;
VACUUM ANALYZE api_logs;

-- 重建索引
REINDEX TABLE ddns_records;
REINDEX TABLE api_logs;

-- 更新统计信息
ANALYZE ddns_records;
ANALYZE api_logs;
```

### Redis 优化

#### 1. 内存优化

```bash
# 配置最大内存
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb

# 设置内存淘汰策略
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 查看内存使用
docker-compose exec redis redis-cli INFO memory
```

#### 2. 连接优化

```bash
# 配置最大连接数
docker-compose exec redis redis-cli CONFIG SET maxclients 10000

# 配置超时时间
docker-compose exec redis redis-cli CONFIG SET timeout 300

# 查看连接信息
docker-compose exec redis redis-cli INFO clients
```

#### 3. 持久化优化

```bash
# 启用 RDB 持久化
docker-compose exec redis redis-cli CONFIG SET save "900 1 300 10 60 10000"

# 配置 RDB 文件名
docker-compose exec redis redis-cli CONFIG SET dbfilename dump.rdb

# 启用 AOF 持久化
docker-compose exec redis redis-cli CONFIG SET appendonly yes

# 配置 AOF 刷盘策略
docker-compose exec redis redis-cli CONFIG SET appendfsync everysec
```

### API 优化

#### 1. 启用缓存

```python
# config/config.py

# Redis 缓存配置
REDIS_CACHE_ENABLED = True
REDIS_CACHE_TTL = 3600  # 1小时
REDIS_CACHE_KEY_PREFIX = "nas_ddns:"

# 启用查询缓存
SQLALCHEMY_CACHE_ENABLED = True
SQLALCHEMY_CACHE_TTL = 300  # 5分钟
```

#### 2. 连接池优化

```python
# config/config.py

# 数据库连接池
SQLALCHEMY_POOL_SIZE = 20
SQLALCHEMY_MAX_OVERFLOW = 10
SQLALCHEMY_POOL_TIMEOUT = 30
SQLALCHEMY_POOL_RECYCLE = 3600

# Redis 连接池
REDIS_POOL_SIZE = 50
REDIS_SOCKET_TIMEOUT = 5
REDIS_SOCKET_CONNECT_TIMEOUT = 5
```

#### 3. 异步处理

```python
# 使用 Celery 处理异步任务
from celery import Celery

celery = Celery('nas_ddns', 
                broker='redis://redis:6379/0',
                backend='redis://redis:6379/0')

@celery.task
def update_ddns_async():
    """异步更新 DDNS"""
    from app.utils.aliyun import AliyunDDNS
    ddns = AliyunDDNS()
    return ddns.update_ddns()

# 调用异步任务
update_ddns_async.delay()
```

### Nginx 优化

```nginx
# 启用 gzip 压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript 
           application/json application/javascript application/xml+rss 
           application/rss+xml font/truetype font/opentype 
           application/vnd.ms-fontobject image/svg+xml;

# 启用缓存
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m 
                 max_size=1g inactive=60m use_temp_path=off;

# 缓存配置
proxy_cache api_cache;
proxy_cache_valid 200 302 10m;
proxy_cache_valid 404 1m;
proxy_cache_bypass $http_cache_control;
add_header X-Cache-Status $upstream_cache_status;

# 连接优化
keepalive_timeout 65;
keepalive_requests 100;
client_body_timeout 12;
client_header_timeout 12;
send_timeout 10;
```

### 监控优化

#### Prometheus 配置

```yaml
# config/prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'nas-ddns-production'
    environment: 'production'

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s
```

#### 告警规则

```yaml
# config/prometheus/alerts.yml

groups:
  - name: api_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(api_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API 错误率过高"
          description: "API 错误率超过 10% (当前值: {{ $value }})"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(api_response_time_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API 响应时间过长"
          description: "API 95% 响应时间超过 1秒 (当前值: {{ $value }}s)"

      - alert: DatabaseConnectionPoolExhausted
        expr: postgres_connections_active / postgres_connections_max > 0.8
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "数据库连接池耗尽"
          description: "数据库连接使用率超过 80% (当前值: {{ $value }})"

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis 内存使用率过高"
          description: "Redis 内存使用率超过 80% (当前值: {{ $value }})"
```

---

## 🔒 安全配置

### 认证与授权

#### 1. JWT 配置

```python
# config/config.py

import jwt
from datetime import datetime, timedelta

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

def generate_access_token(user_id):
    """生成访问令牌"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + JWT_ACCESS_TOKEN_EXPIRES,
        'iat': datetime.utcnow(),
        'type': 'access'
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def generate_refresh_token(user_id):
    """生成刷新令牌"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + JWT_REFRESH_TOKEN_EXPIRES,
        'iat': datetime.utcnow(),
        'type': 'refresh'
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
```

#### 2. 权限控制

```python
# decorators/auth.py

from functools import wraps
from flask import request, jsonify
import jwt

def require_auth(f):
    """需要认证的装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'success': False, 'error': 'Missing token'}), 401
        
        try:
            token = token.replace('Bearer ', '')
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            request.user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    return decorated

def require_admin(f):
    """需要管理员权限的装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'success': False, 'error': 'Missing token'}), 401
        
        try:
            token = token.replace('Bearer ', '')
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            
            if payload.get('role') != 'admin':
                return jsonify({'success': False, 'error': 'Insufficient permissions'}), 403
            
            request.user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    return decorated
```

### 数据保护

#### 1. 密码加密

```python
# utils/security.py

import bcrypt
import secrets

def hash_password(password: str) -> str:
    """加密密码"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """验证密码"""
    return bcrypt.checkpw(
        password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def generate_api_key() -> str:
    """生成 API 密钥"""
    return secrets.token_urlsafe(32)
```

#### 2. 敏感数据加密

```python
# utils/encryption.py

from cryptography.fernet import Fernet
import os

class DataEncryption:
    def __init__(self):
        self.key = os.getenv('ENCRYPTION_KEY')
        self.cipher = Fernet(self.key)
    
    def encrypt(self, data: str) -> str:
        """加密数据"""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """解密数据"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
```

### 输入验证

```python
# utils/validation.py

from marshmallow import Schema, fields, validate, ValidationError

class DDNSUpdateSchema(Schema):
    """DDNS 更新验证"""
    domain = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    sub_domain = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    record_type = fields.Str(required=True, validate=validate.OneOf(['A', 'AAAA', 'CNAME']))
    ttl = fields.Int(required=True, validate=validate.Range(min=60, max=86400))

class UserCreateSchema(Schema):
    """用户创建验证"""
    username = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))
    role = fields.Str(required=True, validate=validate.OneOf(['user', 'admin']))

def validate_request(schema_class):
    """请求验证装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                schema = schema_class()
                data = schema.load(request.json)
                return f(data, *args, **kwargs)
            except ValidationError as err:
                return jsonify({
                    'success': False,
                    'error': 'Validation failed',
                    'details': err.messages
                }), 400
        return decorated
    return decorator
```

### 速率限制

```python
# utils/rate_limit.py

from flask import request, jsonify
from functools import wraps
import redis
import time

redis_client = redis.Redis(host='redis', port=6379, db=0)

def rate_limit(max_requests=100, window=60):
    """速率限制装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # 获取客户端 IP
            client_ip = request.remote_addr
            
            # 生成 Redis 键
            key = f"rate_limit:{client_ip}:{f.__name__}"
            
            # 检查请求次数
            current = redis_client.get(key)
            
            if current is None:
                redis_client.setex(key, window, 1)
            else:
                current = int(current)
                if current >= max_requests:
                    return jsonify({
                        'success': False,
                        'error': 'Rate limit exceeded'
                    }), 429
                redis_client.incr(key)
            
            return f(*args, **kwargs)
        return decorated
    return decorator
```

### CORS 配置

```python
# config/cors.py

from flask_cors import CORS

def init_cors(app):
    """初始化 CORS"""
    allowed_origins = os.getenv('CORS_ORIGINS', '*').split(',')
    
    CORS(app,
         resources={
             r"/api/*": {
                 "origins": allowed_origins,
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization"],
                 "max_age": 3600
             }
         })
```

### 安全头

```python
# middleware/security.py

from flask import after_this_request

def add_security_headers(response):
    """添加安全头"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response
```

---

## 📖 下一步

### 学习资源

- [Flask 官方文档](https://flask.palletsprojects.com/)
- [Docker 官方文档](https://docs.docker.com/)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Redis 官方文档](https://redis.io/docs/)
- [Prometheus 官方文档](https://prometheus.io/docs/)
- [Grafana 官方文档](https://grafana.com/docs/)

### 进阶功能

- [ ] 实现多域名 DDNS 支持
- [ ] 添加 WebSocket 实时通知
- [ ] 集成第三方 DNS 服务商
- [ ] 实现 API 网关
- [ ] 添加机器学习预测
- [ ] 实现自动化测试
- [ ] 添加 CI/CD 流水线
- [ ] 实现灰度发布

### 社区贡献

欢迎贡献代码、报告问题或提出建议！

- [GitHub Issues](https://github.com/YYC3/nas-ddns-api/issues)
- [Pull Requests](https://github.com/YYC3/nas-ddns-api/pulls)
- [Discussions](https://github.com/YYC3/nas-ddns-api/discussions)

---

## 💬 获取帮助

### 文档资源

- [主 README](README.md) - 项目概述和功能介绍
- [API 文档](http://localhost:8080/api/v2/docs) - Swagger API 文档
- [架构文档](../docs/ARCHITECTURE.md) - 系统架构设计
- [部署文档](../docs/DEPLOYMENT.md) - 部署指南
- [开发文档](../docs/DEVELOPMENT.md) - 开发指南

### 技术支持

- **邮箱**: admin@0379.email
- **GitHub Issues**: https://github.com/YYC3/nas-ddns-api/issues
- **Discussions**: https://github.com/YYC3/nas-ddns-api/discussions

### 常见问题

#### Q: 如何重置管理员密码？

```bash
# 进入数据库容器
docker-compose exec postgres psql -U nas_admin -d nas_ddns

# 重置密码
UPDATE users SET password_hash = '$2b$12$...' WHERE username = 'admin';
```

#### Q: 如何迁移数据到新服务器？

```bash
# 备份旧服务器数据
docker-compose exec postgres pg_dump -U nas_admin nas_ddns > backup.sql

# 在新服务器恢复
docker-compose exec -T postgres psql -U nas_admin -d nas_ddns < backup.sql
```

#### Q: 如何升级到新版本？

```bash
# 拉取最新镜像
docker-compose pull

# 运行数据库迁移
docker-compose exec api flask db upgrade

# 重启服务
docker-compose up -d
```

### 反馈与建议

我们非常重视您的反馈！如果您有任何建议或发现问题，请：

1. 查看 [GitHub Issues](https://github.com/YYC3/nas-ddns-api/issues) 确认是否已被报告
2. 如果没有，创建新的 Issue，详细描述问题
3. 如果您有解决方案，欢迎提交 Pull Request

---

<div align="center">

## 🎉 感谢使用 YYC³ NAS DDNS API！

**言启象限 | 语枢未来**
**万象归元于云枢 | 深栈智启新纪元**

[![YYC³](https://img.shields.io/badge/YYC³-五高五标五化-blue)](https://github.com/YYC3)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Support](https://img.shields.io/badge/support-active-brightgreen.svg)](https://github.com/YYC3/issues)

**© 2025 YYC³ Team. All rights reserved.**

</div>
curl -X POST http://localhost:8080/api/v2/ddns/manual-update

# 3. 检查网络连接
docker-compose exec api ping -c 3 api.aliyun.com

# 4. 查看详细错误信息
docker-compose logs api | grep -i error

# 5. 测试 DNS 解析
dig ddns.your_domain.com
```

### API 响应缓慢

**症状**：API 响应时间过长或超时

**诊断步骤**：

```bash
# 测试 API 响应时间
time curl http://localhost:8080/api/v2/health

# 查看系统资源使用
docker stats

# 检查数据库查询性能
docker-compose exec postgres psql -U nas_admin -d nas_ddns -c "SELECT * FROM pg_stat_activity;"

# 查看 Redis 缓存命中率
docker-compose exec redis redis-cli INFO stats | grep keyspace

# 分析慢查询日志
docker-compose logs postgres | grep "duration:"
```

**解决方案**：

```bash
# 1. 增加 API worker 数量
docker-compose exec api env | grep WORKERS

# 2. 清理 Redis 缓存
docker-compose exec redis redis-cli FLUSHALL

# 3. 优化数据库查询
docker-compose exec postgres psql -U nas_admin -d nas_ddns -c "VACUUM ANALYZE;"

# 4. 重启服务
docker-compose restart api

# 5. 检查网络延迟
docker-compose exec api ping -c 10 postgres
docker-compose exec api ping -c 10 redis
```

### 内存不足

**症状**：容器因内存不足被杀死

**诊断步骤**：

```bash
# 查看容器内存使用
docker stats --no-stream

# 检查系统内存
free -h

# 查看容器日志
docker-compose logs api | grep "out of memory"

# 检查 OOM Killer 日志
dmesg | grep -i "killed process"
```

**解决方案**：

```bash
# 1. 增加容器内存限制
# 编辑 docker-compose.yml，增加 memory 限制

# 2. 清理未使用的 Docker 资源
docker system prune -a

# 3. 重启服务
docker-compose restart

# 4. 优化应用内存使用
# 减少缓存大小、优化数据库连接池等

# 5. 增加系统交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📡 API 使用示例

### 获取 DDNS 状态

```bash
curl http://localhost:8080/api/v2/ddns/status
```

### 列出 DNS 记录

```bash
curl http://localhost:8080/api/v2/ddns/records
```

### 查看系统监控

```bash
curl http://localhost:8080/api/v2/monitoring/system
```

### 查看告警

```bash
curl http://localhost:8080/api/v2/alerts
```

### 手动触发 DDNS 更新

```bash
curl -X POST http://localhost:8080/api/v2/ddns/manual-update
```

## 生产部署建议

### 1. 安全配置

- 修改所有默认密码
- 使用强 JWT 密钥和 API 密钥
- 配置防火墙规则
- 启用 HTTPS
- 限制 API 访问

### 2. 性能优化

- 调整数据库连接池大小
- 启用 Redis 缓存
- 配置适当的 Gunicorn worker 数量
- 启用 CDN（如果适用）

### 3. 监控告警

- 配置 Prometheus 告警规则
- 设置 Grafana 仪表板
- 配置邮件/Telegram 通知
- 定期检查备份

### 4. 高可用

- 配置负载均衡
- 设置数据库主从复制
- 配置多实例部署
- 实施灾难恢复计划

## 下一步

1. 配置域名和 SSL 证书
2. 设置定时备份
3. 配置监控告警
4. 集成 CI/CD
5. 编写自动化测试

## 获取帮助

- 查看完整文档：`README.md`
- 提交问题：GitHub Issues
- 查看日志：`docker-compose logs -f`
