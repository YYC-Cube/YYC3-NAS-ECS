# YYC³ NAS-ECS 详细部署指南

> YYC³ NAS-ECS 企业级智能管理平台 - 完整部署指南
>
> **言启象限 | 语枢未来**

---

## 📋 目录

- [部署前准备](#部署前准备)
- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [详细配置](#详细配置)
- [服务管理](#服务管理)
- [监控与维护](#监控与维护)
- [故障排除](#故障排除)
- [高级配置](#高级配置)

---

## 🎯 部署前准备

### 系统检查清单

- [ ] 操作系统版本符合要求
- [ ] Docker和Docker Compose已安装
- [ ] 系统资源充足（内存、磁盘、网络）
- [ ] 防火墙规则已配置
- [ ] 域名DNS已配置（如需外部访问）
- [ ] SSL证书已准备（生产环境）

### 端口规划

| 端口 | 服务 | 必需 | 说明 |
|------|------|------|------|
| 5173 | 前端应用 | ✅ | Web UI访问 |
| 6000 | API服务 | ✅ | 后端API |
| 7500 | FRP管理 | ⚠️ | 内网穿透管理面板 |
| 8080 | DDNS API | ⚠️ | DDNS服务 |
| 6379 | Redis | ✅ | 缓存服务 |
| 5432 | PostgreSQL | ✅ | 数据库 |

---

## 🖥️ 环境要求

### 操作系统支持

- **Ubuntu**: 20.04 LTS / 22.04 LTS
- **CentOS**: 7 / 8 / 9 Stream
- **Debian**: 10 / 11 / 12
- **Rocky Linux**: 8 / 9
- **AlmaLinux**: 8 / 9

### 软件依赖

| 软件 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Docker | 20.10 | 24.0+ |
| Docker Compose | 2.0 | 2.20+ |
| Git | 2.20+ | 最新版本 |
| curl/wget | 任意 | 最新版本 |

### 硬件要求

| 资源 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 2核 | 4核+ |
| 内存 | 4GB | 8GB+ |
| 磁盘 | 20GB | 50GB+ SSD |
| 网络 | 10Mbps | 100Mbps+ |

---

## 🚀 快速部署

### 一键部署（推荐）

```bash
# 1. 下载部署包
wget https://github.com/YYC-Cube/YYC3-NAS-ECS/releases/latest/download/nas-ecs.tar.gz
# 或使用git
git clone --depth 1 --branch main https://github.com/YYC-Cube/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS
./scripts/package-deployment.sh

# 2. 解压并进入目录
tar -xzf nas-ecs.tar.gz
cd nas-ecs

# 3. 配置环境变量
cp config/.env.example config/.env.production
vim config/.env.production

# 4. 快速启动
chmod +x scripts/*.sh
./scripts/quick-start.sh
```

### 分步部署

#### 步骤1：环境配置

```bash
# 复制环境变量模板
cp config/.env.example config/.env.production

# 编辑配置文件
vim config/.env.production

# 或使用环境变量
export APP_NAME=YYC3-NAS-ECS
export ENVIRONMENT=production
```

#### 步骤2：Docker服务启动

```bash
# 启动主服务
cd docker
docker-compose -f docker-compose.yml up -d

# 查看启动日志
docker-compose -f docker-compose.yml logs -f
```

#### 步骤3：健康检查

```bash
# 等待服务启动（约30秒）
sleep 30

# 执行健康检查
./scripts/health-check.sh

# 查看服务状态
./scripts/stack-manager.sh status
```

#### 步骤4：访问验证

```bash
# 检查前端服务
curl -I http://localhost:5173

# 检查API服务
curl -I http://localhost:6000/api/v2/health

# 检查FRP服务（如启用）
curl -I http://localhost:7500
```

---

## ⚙️ 详细配置

### 基础配置

#### 应用配置

```bash
# config/.env.production
APP_NAME=YYC3-NAS-ECS
APP_VERSION=1.0.0
APP_TIMEZONE=Asia/Shanghai
ENVIRONMENT=production
LOG_LEVEL=info
```

#### API配置

```bash
# config/.env.production
API_PREFIX=/api/v2
API_VERSION=2.0.0
API_TIMEOUT=30000
API_RATE_LIMIT=100

# JWT配置
API_JWT_SECRET=your-very-secure-secret-key-here
API_JWT_EXPIRES_IN=7d
```

#### 安全配置

```bash
# config/.env.production
SECURE_COOKIE=true
CSRF_ENABLED=true
CSRF_SECRET=your-csrf-secret-key-here
```

### 数据库配置

#### PostgreSQL配置

```bash
# config/.env.production
DATABASE_URL=postgresql://postgres:your-password@postgres:5432/yyc3_nas_ecs
SQLALCHEMY_ECHO=false
SQLALCHEMY_RECORD_QUERIES=false
```

**数据库初始化**：

```bash
# 创建数据库和用户
docker exec -it postgres psql -U postgres -c "CREATE DATABASE yyc3_nas_ecs;"
docker exec -it postgres psql -U postgres -c "CREATE USER yyc3_user WITH PASSWORD 'your-password';"
docker exec -it postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE yyc3_nas_ecs TO yyc3_user;"

# 运行数据库迁移
docker exec -it api flask db upgrade
```

### Redis配置

```bash
# config/.env.production
REDIS_URL=redis://:your-redis-password@redis:6379/0
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_TLS=false

# 缓存配置
CACHE_ENABLED=true
CACHE_TYPE=redis
CACHE_TTL=3600
```

### CORS配置

```bash
# config/.env.production
CORS_ENABLED=true
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH
CORS_HEADERS=Content-Type,Authorization,X-API-Key,X-Requested-With
```

### FRP内网穿透配置

#### 基础配置

```bash
# config/.env.production
FRP_SERVER_ADDR=your-frp-server.com
FRP_SERVER_PORT=7000
FRP_TOKEN=your-frp-token
FRP_DASHBOARD_PORT=7500
FRP_DASHBOARD_USER=admin
FRP_DASHBOARD_PASSWORD=your-dashboard-password
```

#### 服务映射配置

```bash
# 编辑FRP配置文件
vim docker/frp/frpc.ini

# 添加服务映射示例
[api]
type = tcp
local_ip = 127.0.0.1
local_port = 6000
remote_port = 6000

[web]
type = http
local_ip = 127.0.0.1
local_port = 5173
custom_domains = your-domain.com
```

### DDNS配置

```bash
# config/.env.production
DDNS_ENABLED=true
DDNS_PROVIDER=aliyun
DDNS_DOMAIN=your-domain.com
DDNS_SUBDOMAIN=ddns
DDNS_ACCESS_KEY_ID=your-access-key-id
DDNS_ACCESS_KEY_SECRET=your-access-key-secret
```

### 日志配置

```bash
# config/.env.production
LOG_LEVEL=info
LOG_FILE=/var/log/yyc3-nas-ecs/app.log
LOG_MAX_SIZE=100M
LOG_MAX_FILES=5

# 监控配置
METRICS_ENABLED=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30
```

---

## 🔧 服务管理

### 启动服务

```bash
# 启动所有服务
./scripts/quick-start.sh

# 启动生产环境
ENVIRONMENT=production ./scripts/quick-start.sh

# 启动预发布环境
ENVIRONMENT=staging ./scripts/quick-start.sh

# 启动开发环境
ENVIRONMENT=development ./scripts/quick-start.sh
```

### 停止服务

```bash
# 停止所有服务
./scripts/quick-stop.sh

# 停止特定环境
ENVIRONMENT=production ./scripts/quick-stop.sh
```

### 重启服务

```bash
# 重启所有服务
./scripts/quick-restart.sh

# 重启特定服务
SERVICE=api ./scripts/quick-restart.sh
SERVICE=redis ./scripts/quick-restart.sh
SERVICE=postgres ./scripts/quick-restart.sh
```

### 查看服务状态

```bash
# 查看所有服务状态
./scripts/stack-manager.sh status

# 查看Docker容器状态
docker-compose -f docker/docker-compose.yml ps

# 查看详细容器信息
docker ps -a
```

### 查看服务日志

```bash
# 查看所有服务日志
docker-compose -f docker/docker-compose.yml logs -f

# 查看特定服务日志
docker-compose -f docker/docker-compose.yml logs -f api
docker-compose -f docker/docker-compose.yml logs -f redis
docker-compose -f docker/docker-compose.yml logs -f postgres

# 查看最近100行日志
docker-compose -f docker/docker-compose.yml logs --tail=100 api
```

---

## 📊 监控与维护

### 健康检查

```bash
# 执行完整健康检查
./scripts/health-check.sh

# 检查特定服务
SERVICE=api ./scripts/health-check.sh
SERVICE=redis ./scripts/health-check.sh
SERVICE=postgres ./scripts/health-check.sh
```

### 性能监控

```bash
# 查看资源使用
docker stats

# 查看容器资源使用
docker stats --no-stream

# 查看系统资源
free -h
df -h
top -bn1 | head -20
```

### 日志管理

```bash
# 查看应用日志
docker logs api --tail=100 -f

# 查看Nginx日志
docker logs nginx --tail=100 -f

# 清理旧日志
find /var/log/yyc3-nas-ecs/ -name "*.log" -mtime +30 -delete
```

### 数据备份

```bash
# 数据库备份
docker exec postgres pg_dump -U postgres yyc3_nas_ecs > backup_$(date +%Y%m%d).sql

# Redis备份
docker exec redis redis-cli BGSAVE

# 完整备份
docker-compose exec postgres pg_dumpall -U postgres > full_backup_$(date +%Y%m%d).sql
```

### 数据恢复

```bash
# 数据库恢复
cat backup_YYYYMMDD.sql | docker exec -i postgres psql -U postgres yyc3_nas_ecs

# Redis恢复
docker exec redis redis-cli --rdb /path/to/dump.rdb
```

---

## 🔧 高级配置

### SSL/TLS配置

#### 使用Let's Encrypt

```bash
# 安装Certbot
apt update && apt install -y certbot

# 获取证书
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 配置Nginx使用证书
vim docker/nginx/nginx.conf

# 自动续期
certbot renew --dry-run
```

#### 自签名证书（开发环境）

```bash
# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key -out server.crt

# 配置应用使用证书
export SSL_CERT_PATH=/path/to/server.crt
export SSL_KEY_PATH=/path/to/server.key
```

### 负载均衡配置

```bash
# 配置多实例负载均衡
vim docker/nginx/nginx.conf

upstream backend {
    server localhost:6000;
    server localhost:6001;
    server localhost:6002;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

### 高可用配置

```bash
# 配置主从数据库
vim config/.env.production
DATABASE_REPLICA_URL=postgresql://postgres:password@replica:5432/dbname

# 配置Redis哨兵
vim docker/docker-compose.yml
redis-sentinel:
  image: redis:latest
  command: redis-sentinel /etc/redis/sentinel.conf
```

---

## 🔍 故障排除

### 常见问题

#### 服务无法启动

**症状**：服务启动失败或立即退出

**解决方法**：

```bash
# 1. 检查Docker服务状态
docker ps -a

# 2. 查看容器日志
docker-compose logs <service-name>

# 3. 检查端口占用
lsof -i :<port>
netstat -tuln | grep <port>

# 4. 检查磁盘空间
df -h

# 5. 检查内存使用
free -h
```

#### 连接超时

**症状**：无法访问服务或连接超时

**解决方法**：

```bash
# 1. 检查防火墙规则
sudo ufw status
sudo firewall-cmd --list-all

# 2. 检查服务监听端口
netstat -tuln | grep LISTEN

# 3. 检查网络连接
ping <service-host>
telnet <service-host> <port>

# 4. 检查DNS解析
nslookup your-domain.com
dig your-domain.com
```

#### 数据库连接失败

**症状**：应用无法连接数据库

**解决方法**：

```bash
# 1. 检查PostgreSQL状态
docker-compose ps postgres
docker-compose logs postgres

# 2. 测试数据库连接
docker exec -it postgres psql -U postgres -h localhost

# 3. 检查连接数
docker exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 4. 检查数据库大小
docker exec postgres psql -U postgres -c "SELECT pg_size_database('yyc3_nas_ecs');"
```

#### Redis连接问题

**症状**：缓存服务无法访问

**解决方法**：

```bash
# 1. 检查Redis状态
docker-compose ps redis
docker-compose logs redis

# 2. 测试Redis连接
docker exec -it redis redis-cli ping

# 3. 检查Redis内存使用
docker exec redis redis-cli INFO memory

# 4. 检查连接数
docker exec redis redis-cli INFO clients
```

### 日志分析

```bash
# 查看错误日志
docker-compose logs --tail=100 api | grep ERROR

# 查看警告日志
docker-compose logs --tail=100 api | grep WARNING

# 实时监控日志
docker-compose logs -f api | grep --line-buffered ERROR
```

### 性能优化

```bash
# 优化Docker资源限制
vim docker/docker-compose.yml

services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

# 优化数据库连接池
vim config/.env.production
SQLALCHEMY_POOL_SIZE=20
SQLALCHEMY_MAX_OVERFLOW=40
SQLALCHEMY_POOL_TIMEOUT=30
```

---

## 📞 技术支持

### 获取帮助

- **文档**: <https://github.com/YYC-Cube/YYC3-NAS-ECS/docs>
- **问题反馈**: <https://github.com/YYC-Cube/YYC3-NAS-ECS/issues>
- **讨论区**: <https://github.com/YYC-Cube/YYC3-NAS-ECS/discussions>
- **邮箱**: <admin@0379.email>

### 联系信息

- **项目主页**: <https://github.com/YYC-Cube/YYC3-NAS-ECS>
- **维护团队**: YYC³ Team
- **技术支持**: admin@0379.email

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**部署成功后，请记得修改所有默认密码！** 🔐

Made with ❤️ by YYC³ Team

</div>
