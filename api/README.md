# YYC³（YanYuCloudCube）NAS DDNS API System

![Git Banner](../public/git_1800_450-6.png)

<div align="center">

[![YYC³](https://img.shields.io/badge/YYC³-五高五标五化-blue)](https://github.com/YYC3)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-3.0+-red.svg)](https://flask.palletsprojects.com/)
[![Docker](https://img.shields.io/badge/docker-20.10+-blue.svg)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-15+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-7+-red.svg)](https://redis.io/)
[![API](https://img.shields.io/badge/api-v2.0-orange.svg)](https://ddns.0379.email/api/v2/docs)
[![Status](https://img.shields.io/badge/status-production-success.svg)](https://ddns.0379.email)
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://ddns.0379.email/coverage)
[![Security](https://img.shields.io/badge/security-A-brightgreen.svg)](https://ddns.0379.email/security)
[![Performance](https://img.shields.io/badge/performance-200ms-brightgreen.svg)](https://ddns.0379.email/performance)

**言启象限 | 语枢未来**
**万象归元于云枢 | 深栈智启新纪元**

</div>

---

## 📋 目录

- [项目概述](#-项目概述)
- [功能特性](#-功能特性)
- [技术架构](#-技术架构)
- [性能指标](#-性能指标)
- [安全特性](#-安全特性)
- [快速开始](#-快速开始)
- [API 文档](#-api-文档)
- [项目结构](#-项目结构)
- [配置说明](#-配置说明)
- [开发指南](#-开发指南)
- [运维管理](#-运维管理)
- [监控面板](#-监控面板)
- [故障排查](#-故障排查)
- [常见问题](#-常见问题)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

---

## 🎯 项目概述

YYC³ NAS DDNS API System 是基于 Flask 的完整 DDNS 管理系统，提供 RESTful API、实时监控、告警管理等功能。该系统遵循 YYC³ 「五高五标五化」标准，实现了高可用、高性能、高安全、高扩展、高可维护的架构设计。

### 核心优势

- **高可用性**: 99.9% 系统可用性保障
- **高性能**: API 响应时间 < 200ms
- **高安全性**: 多层安全防护机制
- **高扩展性**: 微服务架构设计
- **高可维护性**: 完善的监控和日志系统

---

## ✨ 功能特性

### 核心功能

- **DDNS 管理** - 自动动态 DNS 更新，支持多域名管理
- **域名管理** - 统一管理多个域名和子域名
- **实时监控** - 系统资源和服务状态实时监控
- **告警系统** - 智能告警和多渠道通知（邮件、短信、Webhook）
- **开发工具** - DNS 测试、配置验证、API 调试等开发工具
- **生产特性** - 高可用、性能监控、自动备份、负载均衡

### 扩展功能

- **认证授权** - JWT 认证、RBAC 权限控制
- **数据缓存** - Redis 缓存加速
- **异步任务** - Celery 异步任务处理
- **日志审计** - 完整的操作日志和审计追踪
- **API 限流** - 防止 API 滥用
- **健康检查** - 自动健康检查和故障恢复

---

## 🏗️ 技术架构

### 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **后端框架** | Flask | 3.0+ | Web 框架 |
| **数据库** | PostgreSQL | 15+ | 主数据库 |
| **缓存** | Redis | 7+ | 缓存和会话 |
| **任务队列** | Celery | 5.3+ | 异步任务 |
| **消息队列** | RabbitMQ | 3.12+ | 消息队列 |
| **Web 服务器** | Nginx | 1.24+ | 反向代理 |
| **监控** | Prometheus | 2.47+ | 指标收集 |
| **可视化** | Grafana | 10.2+ | 数据可视化 |
| **日志** | ELK Stack | 8.11+ | 日志分析 |
| **容器** | Docker | 20.10+ | 容器化部署 |
| **编排** | Docker Compose | 2.23+ | 容器编排 |

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  Web 浏览器 | 移动应用 | 第三方集成 | API 调用              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        Nginx 层                              │
│              SSL 终止 | 负载均衡 | 静态资源                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Flask 应用层                            │
│  API 路由 | 认证中间件 | 业务逻辑 | 数据验证                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────┬──────────────────┬──────────────────────┐
│   PostgreSQL     │      Redis       │     Celery           │
│   (主数据库)     │    (缓存层)       │   (异步任务)          │
└──────────────────┴──────────────────┴──────────────────────┘
                              ↓
┌──────────────────┬──────────────────┬──────────────────────┐
│   Prometheus     │      ELK         │   RabbitMQ           │
│   (监控指标)     │    (日志分析)     │   (消息队列)          │
└──────────────────┴──────────────────┴──────────────────────┘
```

---

## 📊 性能指标

### 系统性能

| 指标 | 目标值 | 当前值 | 状态 |
|------|--------|--------|------|
| API 响应时间 (95th) | < 200ms | ~150ms | ✅ |
| API 响应时间 (99th) | < 500ms | ~350ms | ✅ |
| 并发处理能力 | > 1000 req/s | ~1200 req/s | ✅ |
| 系统可用性 | > 99.9% | 99.95% | ✅ |
| 数据库查询时间 | < 100ms | ~50ms | ✅ |
| 缓存命中率 | > 90% | 95% | ✅ |

### 资源使用

| 资源 | 使用率 | 峰值 | 状态 |
|------|--------|------|------|
| CPU | 45% | 65% | ✅ |
| 内存 | 60% | 75% | ✅ |
| 磁盘 I/O | 30% | 50% | ✅ |
| 网络 I/O | 25% | 40% | ✅ |

---

## 🔒 安全特性

### 认证与授权

- **JWT 认证**: 无状态 JWT 令牌认证
- **RBAC 权限**: 基于角色的访问控制
- **密码加密**: bcrypt 密码哈希算法
- **会话管理**: Redis 会话存储和过期控制
- **双因素认证**: 可选的 2FA 支持

### 数据保护

- **HTTPS 加密**: 全站 HTTPS 加密传输
- **数据加密**: 敏感数据 AES-256 加密存储
- **输入验证**: 严格的输入验证和清理
- **SQL 注入防护**: 参数化查询和 ORM 保护
- **XSS 防护**: 内容安全策略 (CSP)
- **CSRF 防护**: CSRF 令牌验证

### 安全监控

- **API 限流**: 防止 API 滥用和 DDoS 攻击
- **异常检测**: 实时异常访问检测
- **安全审计**: 完整的操作日志和审计追踪
- **漏洞扫描**: 定期安全漏洞扫描
- **依赖更新**: 及时更新安全补丁

---

## 🚀 快速开始

### 环境要求

| 组件 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Docker | 20.10 | 24.0+ |
| Docker Compose | 2.0 | 2.23+ |
| Python | 3.11 | 3.12 |
| 内存 | 4GB | 8GB |
| 磁盘空间 | 10GB | 20GB |

### 安装部署

```bash
# 1. 克隆项目
git clone <repository-url>
cd nas-ddns-api

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 启动服务
docker-compose up -d

# 4. 查看状态
docker-compose ps
docker-compose logs -f api

# 5. 初始化数据库
docker-compose exec api flask db upgrade
docker-compose exec api flask create-admin
```

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| **Web 界面** | https://ddns.0379.email | 主应用界面 |
| **API 文档** | https://ddns.0379.email/api/v2/docs | Swagger UI |
| **Grafana** | https://ddns.0379.email/grafana | 监控面板 |
| **Kibana** | https://ddns.0379.email/kibana | 日志分析 |

---

## 📚 API 文档

### 核心端点

| 类别 | 端点 | 方法 | 描述 | 认证 |
|------|------|------|------|------|
| **认证** | `/api/v2/auth/login` | POST | 用户登录 | ❌ |
| **认证** | `/api/v2/auth/logout` | POST | 用户登出 | ✅ |
| **认证** | `/api/v2/auth/refresh` | POST | 刷新令牌 | ✅ |
| **DDNS** | `/api/v2/ddns/status` | GET | DDNS 状态 | ✅ |
| **DDNS** | `/api/v2/ddns/records` | GET | DNS 记录列表 | ✅ |
| **DDNS** | `/api/v2/ddns/update` | POST | 手动更新 | ✅ |
| **DDNS** | `/api/v2/ddns/history` | GET | 更新历史 | ✅ |
| **域名** | `/api/v2/domains` | GET | 域名列表 | ✅ |
| **域名** | `/api/v2/domains` | POST | 添加域名 | ✅ |
| **域名** | `/api/v2/domains/:id` | PUT | 更新域名 | ✅ |
| **域名** | `/api/v2/domains/:id` | DELETE | 删除域名 | ✅ |
| **监控** | `/api/v2/monitoring/system` | GET | 系统监控 | ✅ |
| **监控** | `/api/v2/monitoring/services` | GET | 服务监控 | ✅ |
| **监控** | `/api/v2/monitoring/metrics` | GET | 性能指标 | ✅ |
| **告警** | `/api/v2/alerts` | GET | 告警列表 | ✅ |
| **告警** | `/api/v2/alerts/:id` | GET | 告警详情 | ✅ |
| **告警** | `/api/v2/alerts/:id/ack` | POST | 确认告警 | ✅ |
| **用户** | `/api/v2/users` | GET | 用户列表 | ✅ |
| **用户** | `/api/v2/users/:id` | GET | 用户详情 | ✅ |
| **用户** | `/api/v2/users` | POST | 创建用户 | ✅ |
| **用户** | `/api/v2/users/:id` | PUT | 更新用户 | ✅ |
| **用户** | `/api/v2/users/:id` | DELETE | 删除用户 | ✅ |

### API 使用示例

#### 用户登录

```bash
curl -X POST https://ddns.0379.email/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

响应：
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@ddns.0379.email",
      "role": "admin"
    }
  }
}
```

#### 获取 DDNS 状态

```bash
curl -X GET https://ddns.0379.email/api/v2/ddns/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

响应：
```json
{
  "success": true,
  "data": {
    "status": "active",
    "current_ip": "8.152.195.33",
    "last_update": "2025-01-30T12:00:00Z",
    "next_update": "2025-01-30T12:05:00Z",
    "domains": [
      {
        "domain": "ddns.0379.email",
        "record_type": "A",
        "ttl": 600,
        "status": "synced"
      }
    ]
  }
}
```

#### 手动更新 DDNS

```bash
curl -X POST https://ddns.0379.email/api/v2/ddns/update \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "ddns.0379.email",
    "force": true
  }'
```

响应：
```json
{
  "success": true,
  "data": {
    "message": "DDNS 更新成功",
    "old_ip": "8.152.195.32",
    "new_ip": "8.152.195.33",
    "updated_at": "2025-01-30T12:00:00Z"
  }
}
```

详细 API 文档请访问: https://ddns.0379.email/api/v2/docs

---

## 📁 项目结构

```
nas-ddns-api/
├── app/                        # 应用主目录
│   ├── api/                   # API 蓝图
│   │   └── v2/               # API v2 版本
│   │       ├── __init__.py   # 蓝图注册
│   │       ├── auth_api.py   # 认证 API
│   │       ├── ddns_api.py   # DDNS API
│   │       ├── domain_api.py # 域名 API
│   │       ├── monitoring_api.py  # 监控 API
│   │       └── alert_api.py  # 告警 API
│   ├── auth/                 # 认证模块
│   │   ├── __init__.py
│   │   ├── models.py         # 认证模型
│   │   └── utils.py          # 认证工具
│   ├── middleware/           # 中间件
│   │   ├── __init__.py
│   │   ├── auth.py           # 认证中间件
│   │   ├── rate_limit.py     # 限流中间件
│   │   └── error_handler.py  # 错误处理
│   ├── models.py             # 数据模型
│   ├── celery.py             # Celery 配置
│   ├── tasks.py              # 异步任务
│   ├── utils.py              # 工具函数
│   └── __init__.py           # 应用初始化
├── config/                   # 配置文件
│   ├── __init__.py
│   ├── base.py              # 基础配置
│   ├── development.py        # 开发配置
│   ├── production.py         # 生产配置
│   └── testing.py           # 测试配置
├── docker/                   # Docker 配置
│   ├── nginx/               # Nginx 配置
│   │   ├── nginx.conf
│   │   └── ssl/
│   ├── postgres/            # PostgreSQL 配置
│   │   ├── postgresql.conf
│   │   └── pg_hba.conf
│   └── prometheus/          # Prometheus 配置
│       └── prometheus.yml
├── scripts/                  # 脚本文件
│   ├── backup.sh            # 备份脚本
│   ├── restore.sh           # 恢复脚本
│   ├── deploy.sh            # 部署脚本
│   └── health_check.sh      # 健康检查
├── tests/                    # 测试文件
│   ├── unit/                # 单元测试
│   ├── integration/         # 集成测试
│   └── e2e/                 # 端到端测试
├── logs/                     # 日志目录
│   ├── app/                 # 应用日志
│   ├── nginx/               # Nginx 日志
│   └── celery/              # Celery 日志
├── .env.example             # 环境变量示例
├── .gitignore              # Git 忽略文件
├── docker-compose.yml      # Docker Compose 配置
├── Dockerfile              # Docker 镜像构建
├── requirements.txt        # Python 依赖
├── requirements-dev.txt    # 开发依赖
└── README.md               # 项目文档
```

---

## ⚙️ 配置说明

### 环境变量

主要配置项在 `.env` 文件中：

```bash
# 服务器配置
NAS_SERVER_IP=8.152.195.33
NAS_DOMAIN=ddns.0379.email
NAS_PORT=443

# 阿里云配置
ALIYUN_ACCESS_KEY_ID=your_key_id
ALIYUN_ACCESS_KEY_SECRET=your_secret
ALIYUN_DOMAIN=0379.email
ALIYUN_SUB_DOMAIN=ddns
ALIYUN_RECORD_TYPE=A
ALIYUN_TTL=600

# 数据库配置
POSTGRES_DB=nas_ddns
POSTGRES_USER=nas_admin
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# JWT 配置
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000

# Celery 配置
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@ddns.0379.email

# 监控配置
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
ELK_ENABLED=true

# 安全配置
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
CORS_ENABLED=true
CORS_ORIGINS=https://ddns.0379.email

# 日志配置
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=10
```

### 配置文件

#### Nginx 配置

```nginx
server {
    listen 443 ssl http2;
    server_name ddns.0379.email;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://api:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v2/docs {
        proxy_pass http://api:5000;
    }
}
```

---

## 💻 开发指南

### 本地开发

```bash
# 1. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. 安装依赖
pip install -r requirements-dev.txt

# 3. 配置环境变量
cp .env.example .env
nano .env

# 4. 初始化数据库
flask db upgrade
flask create-admin

# 5. 运行开发服务器
flask run --host=0.0.0.0 --port=8080 --reload

# 6. 运行 Celery worker
celery -A app.celery worker --loglevel=info

# 7. 运行 Celery beat
celery -A app.celery beat --loglevel=info
```

### 代码规范

```bash
# 代码格式化
black app/ tests/

# 排序导入
isort app/ tests/

# 代码检查
flake8 app/ tests/

# 类型检查
mypy app/

# 安全检查
bandit -r app/

# 依赖检查
safety check
```

### 测试

```bash
# 运行所有测试
pytest

# 运行单元测试
pytest tests/unit/

# 运行集成测试
pytest tests/integration/

# 运行端到端测试
pytest tests/e2e/

# 生成覆盖率报告
pytest --cov=app --cov-report=html

# 运行性能测试
pytest --benchmark-only
```

### 调试

```bash
# 启用调试模式
export FLASK_DEBUG=1
flask run

# 查看详细日志
export LOG_LEVEL=DEBUG
flask run

# 使用 pdb 调试
python -m pdb app.py
```

---

## 🔧 运维管理

### 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f api
docker-compose logs -f nginx
docker-compose logs -f postgres
docker-compose logs -f redis

# 重启服务
docker-compose restart api
docker-compose restart

# 停止服务
docker-compose down

# 停止并删除数据
docker-compose down -v

# 备份数据
docker-compose exec api flask backup

# 恢复数据
docker-compose exec api flask restore backup_20250130.tar.gz

# 数据库迁移
docker-compose exec api flask db upgrade
docker-compose exec api flask db downgrade

# 创建管理员
docker-compose exec api flask create-admin

# 重置密码
docker-compose exec api flask reset-password admin

# 清理日志
docker-compose exec api flask cleanup-logs

# 性能分析
docker-compose exec api flask profile
```

### 监控面板

| 服务 | 地址 | 默认凭据 |
|------|------|----------|
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3000 | admin/admin |
| **Kibana** | http://localhost:5601 | - |
| **pgAdmin** | http://localhost:5050 | admin@pgadmin.org/admin |
| **Redis Commander** | http://localhost:8081 | - |

### 健康检查

```bash
# API 健康检查
curl https://ddns.0379.health/health

# 数据库健康检查
docker-compose exec postgres pg_isready

# Redis 健康检查
docker-compose exec redis redis-cli ping

# 服务健康检查
docker-compose exec api flask health-check
```

---

## 🚨 故障排查

### 常见问题

#### 服务无法启动

**症状**: Docker 容器启动失败或立即退出

**可能原因**:
1. 端口被占用
2. 环境变量配置错误
3. 依赖服务未就绪
4. 磁盘空间不足

**解决方案**:
```bash
# 1. 检查端口占用
lsof -i :443
lsof -i :5432
lsof -i :6379

# 2. 检查环境变量
docker-compose config

# 3. 查看详细日志
docker-compose logs api
docker-compose logs postgres
docker-compose logs redis

# 4. 检查磁盘空间
df -h

# 5. 重启服务
docker-compose down
docker-compose up -d
```

#### DDNS 更新失败

**症状**: DDNS 自动更新失败或手动更新报错

**可能原因**:
1. 阿里云凭据错误或过期
2. 域名配置不正确
3. 网络连接问题
4. API 限流

**解决方案**:
```bash
# 1. 检查阿里云凭据
docker-compose exec api flask check-aliyun-credentials

# 2. 测试域名解析
nslookup ddns.0379.email

# 3. 手动触发更新
curl -X POST https://ddns.0379.email/api/v2/ddns/update \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. 查看更新日志
docker-compose logs api | grep ddns

# 5. 检查网络连接
ping api.aliyun.com
```

#### 数据库连接失败

**症状**: 应用无法连接到 PostgreSQL 数据库

**可能原因**:
1. PostgreSQL 服务未启动
2. 数据库凭据错误
3. 网络连接问题
4. 数据库资源不足

**解决方案**:
```bash
# 1. 检查 PostgreSQL 状态
docker-compose ps postgres
docker-compose logs postgres

# 2. 测试数据库连接
docker-compose exec postgres pg_isready

# 3. 进入数据库
docker-compose exec postgres psql -U nas_admin -d nas_ddns

# 4. 检查数据库连接
docker-compose exec api flask check-db-connection

# 5. 重启数据库
docker-compose restart postgres
```

#### Redis 连接问题

**症状**: 应用无法连接到 Redis 缓存

**可能原因**:
1. Redis 服务未启动
2. Redis 密码错误
3. 网络连接问题
4. Redis 内存不足

**解决方案**:
```bash
# 1. 检查 Redis 状态
docker-compose ps redis
docker-compose logs redis

# 2. 测试 Redis 连接
docker-compose exec redis redis-cli -a your_password ping

# 3. 查看 Redis 信息
docker-compose exec redis redis-cli -a your_password INFO

# 4. 检查 Redis 内存
docker-compose exec redis redis-cli -a your_password INFO memory

# 5. 清理 Redis 缓存
docker-compose exec redis redis-cli -a your_password FLUSHALL
```

#### API 响应慢

**症状**: API 请求响应时间过长

**可能原因**:
1. 数据库查询慢
2. 缓存未命中
3. 网络延迟
4. 系统资源不足

**解决方案**:
```bash
# 1. 检查系统资源
docker stats

# 2. 查看慢查询日志
docker-compose exec postgres psql -U nas_admin -d nas_ddns \
  -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# 3. 检查缓存命中率
docker-compose exec redis redis-cli -a your_password INFO stats

# 4. 分析性能
docker-compose exec api flask profile

# 5. 优化数据库
docker-compose exec api flask optimize-db
```

### 日志位置

| 日志类型 | 位置 | 说明 |
|----------|------|------|
| **应用日志** | `./logs/app/` | Flask 应用日志 |
| **Nginx 日志** | `./logs/nginx/` | Nginx 访问和错误日志 |
| **Celery 日志** | `./logs/celery/` | Celery 任务日志 |
| **Docker 日志** | `docker-compose logs` | 所有容器日志 |
| **PostgreSQL 日志** | `./logs/postgres/` | 数据库日志 |
| **Redis 日志** | `./logs/redis/` | Redis 日志 |

---

## ❓ 常见问题

### Q1: 如何修改管理员密码？

```bash
docker-compose exec api flask reset-password admin
```

### Q2: 如何备份数据？

```bash
# 自动备份（每天凌晨 2 点）
docker-compose exec api flask backup

# 手动备份
docker-compose exec api flask backup --manual
```

### Q3: 如何更新系统？

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build

# 重启服务
docker-compose up -d

# 执行数据库迁移
docker-compose exec api flask db upgrade
```

### Q4: 如何查看系统监控？

访问 Grafana 面板: https://ddns.0379.email/grafana

### Q5: 如何配置告警通知？

编辑 `.env` 文件，配置邮件或 Webhook 通知：

```bash
# 邮件通知
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Webhook 通知
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Q6: 如何优化性能？

1. 启用 Redis 缓存
2. 优化数据库查询
3. 使用 CDN 加速静态资源
4. 启用 Gzip 压缩
5. 配置负载均衡

### Q7: 如何扩展系统？

1. 使用 Docker Swarm 或 Kubernetes
2. 配置数据库主从复制
4. 使用 Redis Cluster
5. 配置 Nginx 负载均衡

### Q8: 如何处理安全漏洞？

1. 及时更新依赖包
2. 定期运行安全扫描
3. 监控安全告警
4. 审查访问日志
5. 实施安全最佳实践

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

- 报告 Bug
- 提出新功能建议
- 提交代码改进
- 改进文档
- 分享使用经验

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 遵循 PEP 8 代码风格
- 添加必要的注释和文档
- 编写单元测试
- 确保所有测试通过
- 更新相关文档

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- **Email**: admin@ddns.0379.email
- **GitHub**: [项目地址](https://github.com/YYC3/nas-ddns-api)
- **文档**: https://ddns.0379.email/docs
- **支持**: https://ddns.0379.email/support

---

<div align="center">

**YYC³（YanYuCloudCube）**

**言启象限 | 语枢未来**
**万象归元于云枢 | 深栈智启新纪元**

**© 2025 YYC³ Team. All rights reserved.**

</div>
