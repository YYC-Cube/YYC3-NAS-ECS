# YYC³ NAS-ECS 完整部署文档

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

> **创建日期**: 2026-02-04
> **作者**: YYC³ Team
> **版本**: 1.1.0
> **更新日期**: 2026-02-04

---

## 📋 文档概述

本文档提供 YYC³ NAS-ECS 项目的完整部署指南，涵盖从环境准备到生产环境部署的全流程。

### 部署架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         阿里云 ECS                               │
│                      SERVER_IP_PLACEHOLDER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              FRP Server (frps)                          │   │
│  │              端口: 7001 (通信)                            │   │
│  │              端口: 7500 (管理面板)                       │   │
│  │              端口: 18080 (HTTP)                          │   │
│  │              端口: 4443 (HTTPS)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Let's Encrypt SSL                          │   │
│  │              域名: 0379.email                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ FRP 隧道 (TLS加密)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                         本地 NAS                                 │
│                      192.168.3.45                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              FRP Client (frpc)                          │   │
│  │              连接到: SERVER_IP_PLACEHOLDER:7001                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Docker Compose 服务栈                       │   │
│  │              - API服务 (6000)                           │   │
│  │              - 管理面板 (6001)                           │   │
│  │              - LLM服务 (6002)                            │   │
│  │              - 邮件服务 (6003)                            │   │
│  │              - NAS服务 (6009)                            │   │
│  │              - 监控服务 (6006)                           │   │
│  │              - DDNS服务 (6007)                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              基础设施服务                                │   │
│  │              - PostgreSQL 14                            │   │
│  │              - Redis 7                                  │   │
│  │              - Nginx                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 网络架构与域名配置

### 域名映射

| 子域名 | 本地端口 | 公网地址 | 服务描述 |
|--------|----------|----------|----------|
| api.0379.email | 6000 | https://api.0379.email | API主服务 |
| admin.0379.email | 6001 | https://admin.0379.email | 管理面板 |
| llm.0379.email | 6002 | https://llm.0379.email | LLM AI服务 |
| mail.0379.email | 6003 | https://mail.0379.email | 邮件服务 |
| nas.0379.email | 6009 | https://nas.0379.email | NAS管理服务 |
| monitor.0379.email | 6006 | https://monitor.0379.email | 监控面板 |
| ddns.0379.email | 6007 | https://ddns.0379.email | DDNS服务 |

### FRP服务器配置

**服务器**: 阿里云 ECS SERVER_IP_PLACEHOLDER

**配置文件**: `services/frp/frps.toml`

```toml
bindAddr = "0.0.0.0"
bindPort = 7001

auth.method = "token"
auth.token = "yyc3_nas"

webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "yyc3"
webServer.password = "my151001"

vhostHTTPPort = 18080
vhostHTTPSPort = 4443

transport.tls.certFile = "/etc/letsencrypt/live/0379.email/fullchain.pem"
transport.tls.keyFile = "/etc/letsencrypt/live/0379.email/privkey.pem"

allowPorts = [
  { start = 6000, end = 6009 },
  { start = 8080, end = 8080 }
]

subDomainHost = "0379.email"

log.to = "/root/frps/frps.log"
log.level = "warn"
```

### FRP客户端配置

**服务器**: 本地 NAS 192.168.3.45

**配置文件**: `services/frp/frpc.toml`

```toml
serverAddr = "SERVER_IP_PLACEHOLDER"
serverPort = 7001
auth.method = "token"
auth.token = "yyc3_nas"

log.to = "/Volume1/www/frpc/logs/frpc.log"
log.level = "debug"

transport.tls.enable = true

[[proxies]]
name = "api-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6000
subdomain = "api"

[[proxies]]
name = "nas-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6009
subdomain = "nas"

[[proxies]]
name = "mail-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6003
subdomain = "mail"

[[proxies]]
name = "llm-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6002
subdomain = "llm"

[[proxies]]
name = "admin-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6001
subdomain = "admin"

[[proxies]]
name = "monitor-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6006
subdomain = "monitor"

[[proxies]]
name = "ddns-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6007
subdomain = "ddns"
```

---

## 🔧 环境要求

### 硬件要求

#### 阿里云 ECS (FRP服务器)

| 资源 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 1核 | 2核 |
| 内存 | 1GB | 2GB |
| 带宽 | 1Mbps | 5Mbps |
| 磁盘 | 20GB | 40GB |

#### 本地 NAS (应用服务器)

| 资源 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 4核 | 8核 |
| 内存 | 8GB | 16GB |
| 存储 | 100GB | 500GB SSD |

### 软件要求

#### 阿里云 ECS

- **操作系统**: Ubuntu 20.04+ / CentOS 7+
- **FRP**: v0.52.0+
- **Nginx**: 1.18+
- **Let's Encrypt**: certbot

#### 本地 NAS

- **操作系统**: Linux (支持Docker)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Python**: 3.11+
- **Node.js**: 18+
- **PostgreSQL**: 14+
- **Redis**: 7+

---

## 📦 部署步骤

### 阶段一: 阿里云 ECS 准备

#### 1.1 安装 FRP Server

```bash
# 下载 FRP
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -zxvf frp_0.52.3_linux_amd64.tar.gz
cd frp_0.52.3_linux_amd64

# 复制服务端文件
cp frps /usr/local/bin/
chmod +x /usr/local/bin/frps

# 创建配置目录
mkdir -p /etc/frp
cp frps.toml /etc/frp/

# 创建日志目录
mkdir -p /root/frps
```

#### 1.2 配置 SSL 证书

```bash
# 安装 certbot
apt update
apt install certbot

# 申请证书
certbot certonly --standalone -d 0379.email -d *.0379.email

# 证书路径
# /etc/letsencrypt/live/0379.email/fullchain.pem
# /etc/letsencrypt/live/0379.email/privkey.pem
```

#### 1.3 配置 FRP 服务

```bash
# 创建 systemd 服务
cat > /etc/systemd/system/frps.service << 'EOF'
[Unit]
Description=FRP Server Service
After=network.target

[Service]
Type=simple
User=root
Restart=on-failure
RestartSec=5s
ExecStart=/usr/local/bin/frps -c /etc/frp/frps.toml

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
systemctl daemon-reload
systemctl enable frps
systemctl start frps
systemctl status frps
```

#### 1.4 配置防火墙

```bash
# 开放必要端口
ufw allow 7001/tcp  # FRP通信端口
ufw allow 7500/tcp  # FRP管理面板
ufw allow 18080/tcp # HTTP
ufw allow 4443/tcp  # HTTPS
ufw allow 80/tcp    # HTTP (Let's Encrypt)
ufw allow 443/tcp   # HTTPS

# 启用防火墙
ufw enable
```

#### 1.5 验证 FRP Server

```bash
# 检查服务状态
systemctl status frps

# 检查端口监听
netstat -tlnp | grep frps

# 访问管理面板
# http://SERVER_IP_PLACEHOLDER:7500
# 用户名: yyc3
# 密码: my151001
```

---

### 阶段二: 本地 NAS 准备

#### 2.1 安装 Docker 和 Docker Compose

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动 Docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### 2.2 安装 FRP Client

```bash
# 下载 FRP
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -zxvf frp_0.52.3_linux_amd64.tar.gz
cd frp_0.52.3_linux_amd64

# 复制客户端文件
cp frpc /usr/local/bin/
chmod +x /usr/local/bin/frpc

# 创建配置目录
mkdir -p /etc/frp
cp frpc.toml /etc/frp/

# 创建日志目录
mkdir -p /Volume1/www/frpc/logs
```

#### 2.3 配置 FRP Client 服务

```bash
# 创建 systemd 服务
cat > /etc/systemd/system/frpc.service << 'EOF'
[Unit]
Description=FRP Client Service
After=network.target

[Service]
Type=simple
User=root
Restart=on-failure
RestartSec=5s
ExecStart=/usr/local/bin/frpc -c /etc/frp/frpc.toml

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
systemctl daemon-reload
systemctl enable frpc
systemctl start frpc
systemctl status frpc
```

#### 2.4 配置环境变量

```bash
# 创建 secrets 目录
mkdir -p config/secrets

# 创建环境变量文件
cat > config/secrets/database.env << 'EOF'
POSTGRES_PASSWORD=your_strong_password_here
EOF

cat > config/secrets/redis.env << 'EOF'
REDIS_PASSWORD=your_strong_redis_password_here
EOF

cat > config/secrets/api.env << 'EOF'
API_JWT_SECRET=your_jwt_secret_here
CSRF_SECRET=your_csrf_secret_here
EOF

cat > config/secrets/llm.env << 'EOF'
OPENAI_API_KEY=your_openai_api_key_here
EOF

cat > config/secrets/mail.env << 'EOF'
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_PORT=587
MAIL_SMTP_SECURE=false
MAIL_SMTP_TLS=true
MAIL_SMTP_AUTH=true
MAIL_SMTP_USERNAME=your_email@gmail.com
MAIL_SMTP_PASSWORD=your_app_password
MAIL_IMAP_HOST=imap.gmail.com
MAIL_IMAP_PORT=993
MAIL_IMAP_SECURE=true
MAIL_IMAP_AUTH=true
MAIL_IMAP_USERNAME=your_email@gmail.com
MAIL_IMAP_PASSWORD=your_app_password
EOF

cat > config/secrets/nas.env << 'EOF'
NAS_USERNAME=your_nas_username
NAS_PASSWORD=your_nas_password
EOF

cat > config/secrets/ddns.env << 'EOF'
ALIYUN_ACCESS_KEY_ID=your_aliyun_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_aliyun_access_key_secret
EOF

cat > config/secrets/frp.env << 'EOF'
FRP_AUTH_TOKEN=ChangeMe_V3ry_S3cur3_FRP_T0k3n_F0r_Auth3nticati0n_2026!
FRP_DASHBOARD_USERNAME=yyc3
FRP_DASHBOARD_PASSWORD=ChangeMe_FRP_D@shb04rd_P@ssw0rd_2026!
FRP_TLS_ENABLED=true
FRP_TLS_CERT_FILE=/etc/letsencrypt/live/0379.email/fullchain.pem
FRP_TLS_KEY_FILE=/etc/letsencrypt/live/0379.email/privkey.pem
EOF
```

---

### 阶段三: 部署应用服务

#### 3.1 克隆项目代码

```bash
# 克隆仓库
git clone https://github.com/YYC-Cube/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS

# 切换到生产分支
git checkout main
```

#### 3.2 构建并启动服务

```bash
# 进入 API 目录
cd api

# 加载环境变量
source ../config/.env.production

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 3.3 验证服务启动

```bash
# 检查所有容器状态
docker ps

# 检查健康状态
curl http://localhost:6000/api/v2/health

# 检查各服务端口
netstat -tlnp | grep -E '6000|6001|6002|6003|6009|6006|6007'
```

---

### 阶段四: 配置 Nginx 反向代理

#### 4.1 创建 Nginx 配置

```bash
# 创建 Nginx 配置目录
mkdir -p docker/nginx/conf.d

# 创建主配置文件
cat > docker/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    include /etc/nginx/conf.d/*.conf;
}
EOF

# 创建 API 服务配置
cat > docker/nginx/conf.d/api.conf << 'EOF'
upstream api_backend {
    server api:8080;
}

server {
    listen 80;
    server_name api.0379.email;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.0379.email;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
```

#### 4.2 重启 Nginx

```bash
# 重启 Nginx 容器
docker-compose restart nginx

# 验证配置
docker-compose exec nginx nginx -t

# 查看日志
docker-compose logs -f nginx
```

---

### 阶段五: 配置监控服务

#### 5.1 配置 Prometheus

```bash
# 创建 Prometheus 配置目录
mkdir -p docker/prometheus

# 创建 Prometheus 配置文件
cat > docker/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:8080']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF
```

#### 5.2 配置 Grafana

```bash
# 访问 Grafana
# http://localhost:3000
# 默认用户名: admin
# 默认密码: admin

# 添加 Prometheus 数据源
# Configuration -> Data Sources -> Add data source
# 选择 Prometheus
# URL: http://prometheus:9090
```

---

## 🔒 安全配置

### SSL/TLS 配置

```bash
# 确保证书自动续期
certbot renew --dry-run

# 添加自动续期任务
crontab -e

# 添加以下行
0 0,12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### 防火墙配置

```bash
# 本地 NAS 防火墙
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 6000:6007/tcp  # 应用服务
ufw allow 6379/tcp  # Redis
ufw allow 5432/tcp  # PostgreSQL
ufw allow 9090/tcp  # Prometheus
ufw allow 3000/tcp  # Grafana
ufw enable
```

### 密钥管理

```bash
# 设置文件权限
chmod 600 config/secrets/*.env
chmod 644 config/.env.*

# 定期轮换密钥
# 建议每 30 天轮换一次 JWT 密钥
# 建议每 90 天轮换一次 API 密钥
```

---

## 📊 监控与日志

### 系统监控

访问 Grafana 仪表板:
- URL: https://monitor.0379.email
- 默认用户名: admin
- 默认密码: admin (首次登录后修改)

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs -f api
docker-compose logs -f nginx

# 查看最近 100 行日志
docker-compose logs --tail=100 api

# 查看系统日志
journalctl -u frpc -f
journalctl -u frps -f
```

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看CPU使用
top
```

---

## 🚨 故障排除

### FRP 连接问题

**问题**: FRP 客户端无法连接到服务器

**解决方案**:
```bash
# 检查 FRP 服务器状态
systemctl status frps

# 检查端口监听
netstat -tlnp | grep 7001

# 检查防火墙
ufw status

# 查看 FRP 客户端日志
journalctl -u frpc -f
```

### Docker 容器启动失败

**问题**: Docker 容器无法启动

**解决方案**:
```bash
# 查看容器日志
docker-compose logs <service_name>

# 检查容器状态
docker-compose ps

# 重启容器
docker-compose restart <service_name>

# 重建容器
docker-compose up -d --force-recreate <service_name>
```

### SSL 证书问题

**问题**: SSL 证书过期或无效

**解决方案**:
```bash
# 手动续期证书
certbot renew

# 检查证书有效期
certbot certificates

# 重新申请证书
certbot certonly --force-renewal -d 0379.email -d *.0379.email
```

### 数据库连接问题

**问题**: 无法连接到 PostgreSQL

**解决方案**:
```bash
# 检查 PostgreSQL 状态
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres

# 进入数据库容器
docker-compose exec postgres psql -U nas_admin -d nas_ddns

# 检查连接
docker-compose exec api python -c "from app import db; print(db.engine.url)"
```

### Redis 连接问题

**问题**: 无法连接到 Redis

**解决方案**:
```bash
# 检查 Redis 状态
docker-compose ps redis

# 查看 Redis 日志
docker-compose logs redis

# 测试 Redis 连接
docker-compose exec redis redis-cli ping

# 检查 Redis 密码
docker-compose exec redis redis-cli -a your_password ping
```

---

## 📈 性能优化

### 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_level ON logs(level);

-- 定期清理旧数据
DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '30 days';

-- 定期分析表
ANALYZE users;
ANALYZE logs;
```

### Redis 优化

```bash
# 配置 Redis 持久化
# 在 redis.conf 中添加
save 900 1
save 300 10
save 60 10000

# 设置最大内存
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### Nginx 优化

```nginx
# 在 nginx.conf 中添加
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
}

http {
    # 启用缓存
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

    # 启用压缩
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript;
}
```

---

## 🔄 备份与恢复

### 数据库备份

```bash
# 创建备份脚本
cat > scripts/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U nas_admin nas_ddns > $BACKUP_DIR/nas_ddns_$DATE.sql

# 保留最近 7 天的备份
find $BACKUP_DIR -name "nas_ddns_*.sql" -mtime +7 -delete
EOF

chmod +x scripts/backup_db.sh

# 添加定时任务
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /path/to/scripts/backup_db.sh
```

### 数据库恢复

```bash
# 恢复数据库
docker-compose exec -T postgres psql -U nas_admin nas_ddns < /backup/postgres/nas_ddns_20260204_020000.sql
```

### 配置文件备份

```bash
# 备份配置文件
tar -czf backup/config_$(date +%Y%m%d).tar.gz config/

# 备份 Docker 卷
docker run --rm -v yyc3-nas-ecs_prometheus_data:/data -v $(pwd)/backup:/backup alpine tar -czf /backup/prometheus_$(date +%Y%m%d).tar.gz -C /data .
```

---

## 📝 维护计划

### 日常维护

- **每日**: 检查服务状态和日志
- **每周**: 检查磁盘空间和性能指标
- **每月**: 检查安全更新和证书有效期

### 定期任务

| 任务 | 频率 | 负责人 |
|------|------|--------|
| 系统更新 | 每月 | 运维团队 |
| 安全扫描 | 每月 | 安全团队 |
| 备份验证 | 每周 | 运维团队 |
| 性能评估 | 每月 | 开发团队 |
| 审计日志 | 每月 | 安全团队 |

---

## 📞 支持与联系

### 技术支持

- **Email**: admin@0379.email
- **GitHub**: https://github.com/YYC-Cube/YYC3-NAS-ECS
- **文档**: https://docs.0379.email

### 紧急联系

- **24/7 热线**: +86-XXX-XXXX-XXXX
- **紧急邮箱**: emergency@0379.email

---

## 📚 附录

### A. 端口映射表

| 服务 | 内部端口 | 外部端口 | 协议 |
|------|----------|----------|------|
| API | 8080 | 6000 | HTTP |
| Admin | 8080 | 6001 | HTTP |
| LLM | 8080 | 6002 | HTTP |
| Mail | 8080 | 6003 | HTTP |
| NAS | 8080 | 6009 | HTTP |
| Monitor | 8080 | 6006 | HTTP |
| DDNS | 8080 | 6007 | HTTP |
| PostgreSQL | 5432 | 5432 | TCP |
| Redis | 6379 | 6379 | TCP |
| Prometheus | 9090 | 9090 | HTTP |
| Grafana | 3000 | 3000 | HTTP |
| FRP Server | 7001 | 7001 | TCP |
| FRP Dashboard | 7500 | 7500 | HTTP |

### B. 环境变量参考

详见 `config/.env.production` 文件。

### C. 相关文档

- [部署流程指导](./YYC3-NAS-ECS-部署指导/YYC3-NAS-ECS-部署流程指导.md)
- [环境配置管理文档](./YYC3-NAS-ECS-环境配置管理文档.md)
- [APM监控系统配置指南](./YYC3-NAS-ECS-部署指导/YYC3-NAS-ECS-APM监控系统配置指南.md)
- [生产环境准备检查清单](./YYC3-NAS-ECS-部署指导/YYC3-NAS-ECS-生产环境准备检查清单.md)

---

## 📝 版本更新说明

### v1.1.0 (2026-02-04)

#### 新增功能

1. **FRP 内网穿透支持**
   - 新增完整的 FRP 服务器配置说明
   - 新增完整的 FRP 客户端配置说明
   - 新增 FRP 部署脚本和 Systemd 服务配置
   - 新增 FRP 服务映射表，包含7个服务
   - 新增 FRP 验证测试命令

2. **部署架构更新**
   - 更新部署架构图，包含 FRP 服务器和客户端
   - 新增阿里云 ECS (SERVER_IP_PLACEHOLDER) 和本地 NAS (192.168.3.45) 的架构说明
   - 新增 FRP 代理服务的端口映射说明
   - 新增 Let's Encrypt SSL 证书配置说明

3. **域名映射完善**
   - 新增完整的域名映射表
   - 新增 FRP 子域名配置说明
   - 新增 HTTPS 访问地址说明

#### 文档改进

1. **部署流程指导文档**
   - 更新文档版本为 2.1.0
   - 新增 FRP 配置与部署章节
   - 更新部署架构图
   - 扩展故障排查章节，新增7个常见问题

2. **环境配置要求文档**
   - 更新检查日期为 2026-02-04
   - 更新文档版本为 2.0.0
   - 新增 FRP 配置检查项
   - 新增 FRP 服务器和客户端配置说明
   - 更新部署步骤，包含 FRP 配置

3. **完整部署文档**
   - 更新文档版本为 1.1.0
   - 新增版本更新说明章节
   - 更新部署架构图，包含 FRP 配置

#### 技术更新

1. **FRP 配置**
   - FRP 服务器: SERVER_IP_PLACEHOLDER:7001
   - FRP 管理后台: http://SERVER_IP_PLACEHOLDER:7500
   - FRP 客户端: 192.168.3.45
   - TLS 加密传输
   - 子域名支持: api, admin, llm, mail, nas, monitor, ddns

2. **服务映射**
   - API 服务: 127.0.0.1:6000 → api.0379.email
   - 管理服务: 127.0.0.1:6001 → admin.0379.email
   - LLM 服务: 127.0.0.1:6002 → llm.0379.email
   - 邮件服务: 127.0.0.1:6003 → mail.0379.email
   - NAS 服务: 127.0.0.1:6009 → nas.0379.email
   - 监控服务: 127.0.0.1:6006 → monitor.0379.email
   - DDNS 服务: 127.0.0.1:6007 → ddns.0379.email

#### 兼容性说明

- 向后兼容 v1.0.0 的所有配置
- 新增 FRP 配置为可选功能
- 现有部署无需修改即可继续使用
- 建议新部署采用 FRP 配置以实现内网穿透

#### 升级指南

1. **从 v1.0.0 升级到 v1.1.0**

   ```bash
   # 1. 拉取最新代码
   git pull origin main

   # 2. 更新环境变量（可选）
   cp .env.example .env
   # 检查新增的 FRP 相关配置

   # 3. 配置 FRP 服务器（如果需要内网穿透）
   ssh root@SERVER_IP_PLACEHOLDER
   # 按照 FRP 配置章节进行配置

   # 4. 配置 FRP 客户端（如果需要内网穿透）
   ssh user@192.168.3.45
   # 按照 FRP 配置章节进行配置

   # 5. 重启服务
   docker-compose -f api/docker-compose.yml restart

   # 6. 验证部署
   # 按照 FRP 验证测试章节进行验证
   ```

2. **全新部署**

   ```bash
   # 1. 克隆代码仓库
   git clone https://github.com/YYC-Cube/YYC3-NAS-ECS.git
   cd YYC3-NAS-ECS

   # 2. 按照完整部署文档进行部署
   # 包含 FRP 配置与部署章节
   ```

#### 已知问题

- FRP 服务器需要配置 SSL 证书才能使用 HTTPS 代理
- FRP 客户端需要与 FRP 服务器网络连通
- FRP 代理服务的子域名需要在 DNS 中配置

#### 下一步计划

- 支持 FRP TCP 代理
- 支持 FRP STCP 代理
- 支持 FRP XTCP 代理
- 优化 FRP 性能和稳定性
- 添加 FRP 监控和告警

---

### v1.0.0 (2026-02-04)

#### 初始版本

1. **完整的部署文档**
   - 部署架构说明
   - 网络架构与域名配置
   - 环境准备
   - 快速启动指南
   - Docker Compose 配置
   - 环境变量配置
   - 部署脚本
   - 验证测试
   - 监控运维
   - 安全配置
   - 备份恢复
   - 维护计划

2. **多环境支持**
   - 开发环境配置
   - 测试环境配置
   - 生产环境配置

3. **容器化部署**
   - Docker Compose 配置
   - 多服务编排
   - 健康检查
   - 日志管理

4. **监控和告警**
   - Prometheus 集成
   - Grafana 可视化
   - Node Exporter 系统监控

5. **备份和恢复**
   - 数据库备份
   - 数据库恢复
   - 配置文件备份
   - 定期备份策略

---

<div align="center">

> **「***YanYuCloudCube***」**
> **「***<admin@0379.email>***」**
> **「***Words Initiate Quadrants, Language Serves as Core for the Future***」**
> **「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」**

</div>
