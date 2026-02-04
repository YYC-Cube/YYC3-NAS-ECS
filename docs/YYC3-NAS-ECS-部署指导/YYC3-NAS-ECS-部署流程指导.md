# YYC³ NAS-ECS 部署流程指导

> **文件标识**: YYC3-NAS-ECS-部署流程指导
> **版本**: 2.1.0
> **创建日期**: 2026-01-20
> **更新日期**: 2026-02-04
> **作者**: YYC³ Team
> **文档类型**: 部署流程指导文档

---

## 🔌 FRP 配置与部署

### FRP 架构说明

YYC³ NAS-ECS 使用 FRP (Fast Reverse Proxy) 实现内网穿透，将本地 NAS 服务通过阿里云 ECS 暴露到公网。

**FRP 配置文件位置**:
- FRP 服务器: [services/frp/frps.toml](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/services/frp/frps.toml)
- FRP 客户端: [frpc.toml](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/frpc.toml) 或 [services/frp/frpc.toml](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/services/frp/frpc.toml)

### FRP 服务器配置

#### 服务器配置文件

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

#### 部署 FRP 服务器

```bash
# 1. SSH 登录到阿里云 ECS
ssh root@8.152.195.33

# 2. 安装 FRP
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -zxvf frp_0.52.3_linux_amd64.tar.gz
cd frp_0.52.3_linux_amd64

# 3. 复制 FRP 服务器配置
cp frps /usr/local/bin/
chmod +x /usr/local/bin/frps

# 4. 创建配置目录
mkdir -p /etc/frp
mkdir -p /root/frps

# 5. 配置 FRP 服务器
cat > /etc/frp/frps.toml << 'EOF'
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
EOF

# 6. 配置 SSL 证书（如果使用 Let's Encrypt）
certbot certonly --standalone -d 0379.email

# 7. 创建 Systemd 服务
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

# 8. 启动 FRP 服务器
systemctl daemon-reload
systemctl enable frps
systemctl start frps

# 9. 检查 FRP 服务器状态
systemctl status frps

# 10. 查看日志
tail -f /root/frps/frps.log

# 11. 访问 FRP 管理后台
# http://8.152.195.33:7500
# 用户名: yyc3
# 密码: my151001
```

### FRP 客户端配置

#### 客户端配置文件

```toml
serverAddr = "8.152.195.33"
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
localPort = 6004
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

#### 部署 FRP 客户端

```bash
# 1. SSH 登录到本地 NAS
ssh user@192.168.3.45

# 2. 安装 FRP
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -zxvf frp_0.52.3_linux_amd64.tar.gz
cd frp_0.52.3_linux_amd64

# 3. 复制 FRP 客户端配置
cp frpc /usr/local/bin/
chmod +x /usr/local/bin/frpc

# 4. 创建配置目录
mkdir -p /Volume1/www/frpc
mkdir -p /Volume1/www/frpc/logs

# 5. 配置 FRP 客户端
cat > /Volume1/www/frpc/frpc.toml << 'EOF'
serverAddr = "8.152.195.33"
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
localPort = 6004
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
EOF

# 6. 创建 Systemd 服务
cat > /etc/systemd/system/frpc.service << 'EOF'
[Unit]
Description=FRP Client Service
After=network.target

[Service]
Type=simple
User=root
Restart=on-failure
RestartSec=5s
ExecStart=/usr/local/bin/frpc -c /Volume1/www/frpc/frpc.toml

[Install]
WantedBy=multi-user.target
EOF

# 7. 启动 FRP 客户端
systemctl daemon-reload
systemctl enable frpc
systemctl start frpc

# 8. 检查 FRP 客户端状态
systemctl status frpc

# 9. 查看日志
tail -f /Volume1/www/frpc/logs/frpc.log
```

### FRP 服务映射表

| 服务名称 | 本地端口 | 子域名 | 外部访问地址 | 状态 |
|---------|---------|--------|------------|------|
| API服务 | 6000 | api | https://api.0379.email | ✅ |
| NAS服务 | 6004 | nas | https://nas.0379.email | ✅ |
| 邮件服务 | 6003 | mail | https://mail.0379.email | ✅ |
| LLM服务 | 6002 | llm | https://llm.0379.email | ✅ |
| 管理服务 | 6001 | admin | https://admin.0379.email | ✅ |
| 监控服务 | 6006 | monitor | https://monitor.0379.email | ✅ |
| DDNS服务 | 6007 | ddns | https://ddns.0379.email | ✅ |

### FRP 验证测试

```bash
# 1. 验证 FRP 服务器
curl http://8.152.195.33:7500

# 2. 验证 FRP 代理服务
curl https://api.0379.email
curl https://nas.0379.email
curl https://mail.0379.email
curl https://llm.0379.email
curl https://admin.0379.email
curl https://monitor.0379.email
curl https://ddns.0379.email

# 3. 检查 FRP 服务器日志
ssh root@8.152.195.33
tail -f /root/frps/frps.log

# 4. 检查 FRP 客户端日志
ssh user@192.168.3.45
tail -f /Volume1/www/frpc/logs/frpc.log

# 5. 访问 FRP 管理后台
# http://8.152.195.33:7500
# 用户名: yyc3
# 密码: my151001
```

---

## 📋 文档概述

本文档提供 YYC³ NAS-ECS 项目的完整部署流程指导，涵盖从环境准备到系统上线的全流程操作。文档遵循国家标准化编程规范格式，确保部署过程的标准化、规范化和可追溯性。

### 适用范围

- 本地开发环境部署
- 阿里云 ECS 服务器部署
- Docker 容器化部署
- 多环境配置（开发、测试、生产）

### 预期读者

- 系统运维工程师
- DevOps 工程师
- 技术架构师
- 项目负责人

---

## 🎯 部署目标

### 核心目标

1. **高可用性**: 确保系统 99.9% 可用性
2. **高性能**: API 响应时间 < 200ms
3. **高安全**: 实施完整的安全防护措施
4. **高扩展**: 支持水平扩展和负载均衡
5. **高维护**: 提供完善的监控和日志系统

### 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户访问层                            │
│           (HTTPS/443, HTTP/80, HTTP/5173)              │
│              nas.0379.email, api.0379.email, etc.       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              阿里云 ECS (8.152.195.33)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FRP 服务器 (frps)                      │  │
│  │  - 端口: 7001 (FRP服务)                          │  │
│  │  - 端口: 7500 (管理后台)                          │  │
│  │  - 端口: 18080 (HTTP代理)                         │  │
│  │  - 端口: 4443 (HTTPS代理)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Docker Compose 环境                                │  │
│  │  - API 服务: 端口 6000                          │  │
│  │  - 前端服务: 端口 5173                          │  │
│  │  - Redis 缓存: 端口 6379                         │  │
│  │  - PostgreSQL: 端口 5432                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              本地 NAS (192.168.3.45)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FRP 客户端 (frpc)                      │  │
│  │  - 连接到: 8.152.195.33:7001                     │  │
│  │  - TLS 加密传输                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  本地服务                                          │  │
│  │  - API: 127.0.0.1:6000 → api.0379.email          │  │
│  │  - NAS: 127.0.0.1:6004 → nas.0379.email          │  │
│  │  - 邮件: 127.0.0.1:6003 → mail.0379.email        │  │
│  │  - LLM: 127.0.0.1:6002 → llm.0379.email          │  │
│  │  - 管理: 127.0.0.1:6001 → admin.0379.email       │  │
│  │  - 监控: 127.0.0.1:6006 → monitor.0379.email     │  │
│  │  - DDNS: 127.0.0.1:6007 → ddns.0379.email       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 部署前准备

### 1. 环境要求

#### 1.1 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核 | 4 核及以上 |
| 内存 | 4 GB | 8 GB 及以上 |
| 存储 | 50 GB SSD | 100 GB SSD 及以上 |
| 网络 | 10 Mbps | 100 Mbps 及以上 |

#### 1.2 软件要求

| 软件 | 版本要求 | 用途 |
|------|---------|------|
| 操作系统 | Ubuntu 20.04+ / CentOS 7+ | 服务器操作系统 |
| macOS | 12.0+ | 本地开发环境 |
| Docker | 20.10+ | 容器化部署 |
| Docker Compose | 2.0+ | 多容器编排 |
| Node.js | 18.0+ | 前端构建和运行 |
| pnpm | 8.0+ | 包管理器 |
| Git | 2.0+ | 版本控制 |

#### 1.3 网络要求

- 阿里云 ECS 需要公网 IP
- 本地开发环境需要稳定的网络连接
- 防火墙规则配置正确
- 域名解析配置完成

### 2. 资源准备

#### 2.1 服务器资源

- 阿里云 ECS 实例（已购买并配置）
- 本地开发环境（已准备）
- 域名（已购买并解析）

#### 2.2 访问凭证

- 阿里云 ECS SSH 密钥
- 数据库连接信息
- API 密钥（如需要）

#### 2.3 配置文件

- 环境变量配置文件（.env）
- Docker Compose 配置文件（docker-compose.yml）
- Nginx 配置文件（nginx.conf）

---

## 🚀 快速启动

### 方式一：本地开发环境

```bash
# 1. 克隆代码仓库
git clone https://github.com/YYC-Cube/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
vim .env

# 4. 启动开发服务器
pnpm run dev

# 5. 访问应用
# 浏览器打开: http://localhost:5173
```

### 方式二：Docker 容器化部署

```bash
# 1. 克隆代码仓库
git clone https://github.com/YYC-Cube/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS

# 2. 配置环境变量
cp .env.example .env
vim .env

# 3. 启动 Docker 容器
docker-compose -f api/docker-compose.yml up -d

# 4. 查看日志
docker-compose -f api/docker-compose.yml logs -f

# 5. 访问应用
# 浏览器打开: http://localhost:5173
```

### 方式三：阿里云 ECS 生产部署

```bash
# 1. 连接到 ECS 服务器
ssh root@your-ecs-ip

# 2. 克隆代码仓库
git clone https://github.com/YYC-Cube/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS

# 3. 配置环境变量
cp .env.example .env
vim .env

# 4. 启动服务
docker-compose -f api/docker-compose.yml up -d

# 5. 配置 Nginx 反向代理
sudo vim /etc/nginx/sites-available/yyc3-nas-ecs

# 6. 重载 Nginx
sudo systemctl reload nginx

# 7. 访问应用
# 浏览器打开: https://nas.0379.email
```

---

## 🐳 Docker Compose 配置

### 完整配置文件

项目包含多个 Docker Compose 配置文件：

1. **api/docker-compose.yml** - 主服务配置
2. **api/docker-compose.new.yml** - 新版本服务配置
3. **services/ai/docker-compose.dev.yml** - AI 服务开发环境
4. **services/ai/docker-compose.prod.yml** - AI 服务生产环境

#### 主服务配置示例

```yaml
version: '3.8'

services:
  # API主服务
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: nas-ddns-api
    restart: unless-stopped
    networks:
      - nas-network
    environment:
      ENVIRONMENT: ${ENVIRONMENT:-production}
      NODE_ENV: ${NODE_ENV:-production}
      API_PREFIX: ${API_PREFIX:-/api/v2}
      API_VERSION: ${API_VERSION:-2.0.0}
      CORS_ENABLED: ${CORS_ENABLED:-true}
      CORS_ORIGINS: ${CORS_ORIGINS:-*}
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      REDIS_HOST: ${REDIS_HOST:-redis}
      REDIS_PORT: ${REDIS_PORT:-6379}
      CACHE_ENABLED: ${CACHE_ENABLED:-true}
      CACHE_TYPE: ${CACHE_TYPE:-redis}
      CACHE_TTL: ${CACHE_TTL:-3600}
      RATE_LIMIT_ENABLED: ${RATE_LIMIT_ENABLED:-true}
      RATE_LIMIT_WINDOW: ${RATE_LIMIT_WINDOW:-60}
      RATE_LIMIT_MAX_REQUESTS: ${RATE_LIMIT_MAX_REQUESTS:-100}
      METRICS_ENABLED: ${METRICS_ENABLED:-true}
      METRICS_PORT: ${METRICS_PORT:-9090}
      HEALTH_CHECK_INTERVAL: ${HEALTH_CHECK_INTERVAL:-30}
      ALIYUN_ACCESS_KEY_ID: ${ALIYUN_ACCESS_KEY_ID}
      ALIYUN_ACCESS_KEY_SECRET: ${ALIYUN_ACCESS_KEY_SECRET}
      ALIYUN_DOMAIN: ${ALIYUN_DOMAIN:-0379.email}
      ALIYUN_SUB_DOMAIN: ${ALIYUN_SUB_DOMAIN:-ddns}
      ALIYUN_REGION_ID: ${ALIYUN_REGION_ID:-cn-beijing}
      ALIYUN_TTL: ${ALIYUN_TTL:-600}
      MAIL_ENABLED: ${MAIL_ENABLED:-true}
      MAIL_FROM: ${MAIL_FROM:-info@0379.email}
      MAIL_SMTP_HOST: ${MAIL_SMTP_HOST}
      MAIL_SMTP_PORT: ${MAIL_SMTP_PORT}
      MAIL_SMTP_USERNAME: ${MAIL_SMTP_USERNAME}
      MAIL_SMTP_PASSWORD: ${MAIL_SMTP_PASSWORD}
      LLM_ENABLED: ${LLM_ENABLED:-true}
      LLM_API_URL: ${LLM_API_URL}
      LLM_API_KEY: ${OPENAI_API_KEY}
      LLM_DEFAULT_MODEL: ${LLM_DEFAULT_MODEL:-gpt-4}
      LLM_MAX_TOKENS: ${LLM_MAX_TOKENS:-2048}
      LLM_TEMPERATURE: ${LLM_TEMPERATURE:-0.7}
      FRP_API_URL: ${FRP_API_URL}
      FRP_AUTH_TOKEN: ${FRP_AUTH_TOKEN}
      BASE_DOMAIN: ${BASE_DOMAIN:-0379.email}
      API_DOMAIN: ${API_DOMAIN:-api.0379.email}
      MAIL_DOMAIN: ${MAIL_DOMAIN:-mail.0379.email}
      LLM_DOMAIN: ${LLM_DOMAIN:-llm.0379.email}
      NAS_DOMAIN: ${NAS_DOMAIN:-nas.0379.email}
      ADMIN_DOMAIN: ${ADMIN_DOMAIN:-admin.0379.email}
      MONITOR_DOMAIN: ${MONITOR_DOMAIN:-monitor.0379.email}
      DDNS_DOMAIN: ${DDNS_DOMAIN:-ddns.0379.email}
    volumes:
      - ./app:/app/app
      - ./data:/app/data
      - ./logs:/app/logs
      - ./config:/app/config
      - ./scripts:/app/scripts
      - ./reports:/app/reports
    ports:
      - "${API_SERVICE_PORT:-6000}:8080"
      - "${API_WS_PORT:-8443}:8443"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/v2/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: nas-ddns-nginx
    restart: unless-stopped
    networks:
      - nas-network
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/nginx/conf.d:/etc/nginx/conf.d
      - ./docker/nginx/ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Prometheus监控
  prometheus:
    image: prom/prometheus:latest
    container_name: nas-ddns-prometheus
    restart: unless-stopped
    networks:
      - nas-network
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "${PROMETHEUS_PORT:-9090}:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    depends_on:
      - api
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Grafana可视化
  grafana:
    image: grafana/grafana:latest
    container_name: nas-ddns-grafana
    restart: unless-stopped
    networks:
      - nas-network
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD:-admin}
      GF_INSTALL_PLUGINS: "grafana-piechart-panel"
      GF_SERVER_ROOT_URL: "https://${BASE_DOMAIN:-0379.email}/grafana"
      GF_SERVER_DOMAIN: ${BASE_DOMAIN:-0379.email}
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "${GRAFANA_PORT:-3000}:3000"
    depends_on:
      - prometheus
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Node Exporter (系统监控)
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    networks:
      - nas-network
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    ports:
      - "9100:9100"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  prometheus_data:
    driver: local
  grafana_data:
    driver: local

networks:
  nas-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16
          gateway: 172.21.0.1
```

### 环境变量配置

#### 环境变量文件结构

项目包含多个环境变量文件：

1. **.env.example** - 环境变量模板
2. **.env** - 主环境变量文件
3. **.env.development** - 开发环境配置
4. **.env.staging** - 测试环境配置
5. **.env.production** - 生产环境配置
6. **.env.ports** - 端口配置
7. **config/.env.base** - 基础配置
8. **config/.env.development** - 开发环境配置
9. **config/.env.production** - 生产环境配置
10. **config/services/.env** - 服务配置

#### 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

**必需配置项**:

```bash
# 应用环境
NODE_ENV=production

# 服务端口配置
API_SERVICE_PORT=6000
MAIL_SERVICE_PORT=6003
LLM_SERVICE_PORT=6002
REDIS_API_PORT=6379
NAS_SERVICE_PORT=6004
ADMIN_SERVICE_PORT=6001
MONITOR_SERVICE_PORT=6006
DDNS_SERVICE_PORT=6007

# 数据库配置
POSTGRES_USER=yyc3_nas_user
POSTGRES_PASSWORD=your-strong-password
POSTGRES_DB=yyc3_nas_db
DATABASE_URL=postgresql://yyc3_nas_user:your-strong-password@localhost:5432/yyc3_nas_db

# Redis 配置
REDIS_URL=redis://redis:6379/0
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# API 配置
API_PREFIX=/api/v2
API_VERSION=2.0.0
API_TIMEOUT=30000
API_RATE_LIMIT=100

# CORS 配置
CORS_ENABLED=true
CORS_ORIGINS=http://localhost:5173,https://ddns.0379.email
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-API-Key

# 安全配置
API_JWT_SECRET=your-jwt-secret-key-change-me
API_JWT_EXPIRES_IN=7d
SECURE_COOKIE=true
CSRF_ENABLED=true
CSRF_SECRET=your-csrf-secret-key

# 缓存配置
CACHE_ENABLED=true
CACHE_TYPE=redis
CACHE_TTL=3600

# 速率限制配置
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=100

# 监控配置
METRICS_ENABLED=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30

# 阿里云 DDNS 配置
ALIYUN_ACCESS_KEY_ID=your-aliyun-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-aliyun-access-key-secret
ALIYUN_DOMAIN=0379.email
ALIYUN_SUB_DOMAIN=ddns
ALIYUN_REGION_ID=cn-beijing
ALIYUN_TTL=600

# 邮件配置
MAIL_ENABLED=true
MAIL_FROM=info@0379.email
MAIL_REPLY_TO=noreply@0379.email
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USERNAME=admin@0379.email
MAIL_SMTP_PASSWORD=your-app-specific-password
MAIL_SMTP_SECURE=true
MAIL_SMTP_TLS=true
MAIL_SMTP_AUTH=true

# LLM 配置
LLM_ENABLED=true
LLM_API_URL=http://localhost:11434/v1
LLM_API_KEY=
LLM_DEFAULT_MODEL=gpt-4
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.7

# 域名配置
BASE_DOMAIN=0379.email
API_DOMAIN=api.0379.email
MAIL_DOMAIN=mail.0379.email
LLM_DOMAIN=llm.0379.email
NAS_DOMAIN=nas.0379.email
ADMIN_DOMAIN=admin.0379.email
MONITOR_DOMAIN=monitor.0379.email
DDNS_DOMAIN=ddns.0379.email

# FRP 配置
FRP_API_URL=http://localhost:7500
FRP_AUTH_TOKEN=yyc3_nas

# Grafana 配置
GRAFANA_ADMIN_PASSWORD=admin

# Prometheus 配置
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
```

---

## 🔧 部署脚本

### 现有部署脚本

项目包含多个部署脚本：

1. **api/deploy.sh** - API 服务部署脚本
2. **services/ai/scripts/deploy.ts** - AI 服务部署脚本
3. **scripts/quick-start.sh** - 快速启动脚本
4. **scripts/stack-manager.sh** - 服务栈管理脚本

### API 服务部署脚本

使用 [api/deploy.sh](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/api/deploy.sh) 进行部署：

```bash
# 1. 进入 API 目录
cd api

# 2. 赋予执行权限
chmod +x deploy.sh

# 3. 运行部署脚本
./deploy.sh
```

### AI 服务部署脚本

使用 [services/ai/scripts/deploy.ts](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/services/ai/scripts/deploy.ts) 进行部署：

```bash
# 1. 进入 AI 服务目录
cd services/ai

# 2. 运行部署脚本
bun run scripts/deploy.ts

# 或设置环境变量后运行
NODE_ENV=production bun run scripts/deploy.ts
```

### 快速启动脚本

使用 [scripts/quick-start.sh](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/scripts/quick-start.sh) 进行快速启动：

```bash
# 1. 赋予执行权限
chmod +x scripts/quick-start.sh

# 2. 运行快速启动脚本
./scripts/quick-start.sh
```

### 一键部署脚本示例

如果需要创建自定义的一键部署脚本，可以参考以下示例：

```bash
#!/bin/bash

set -e

echo "🚀 YYC³ NAS-ECS 部署脚本"
echo "================================"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，从 .env.example 创建"
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请编辑配置后重新运行"
    exit 1
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose -f api/docker-compose.yml down

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker-compose -f api/docker-compose.yml pull

# 构建镜像
echo "🔨 构建镜像..."
docker-compose -f api/docker-compose.yml build

# 启动服务
echo "🚀 启动服务..."
docker-compose -f api/docker-compose.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose -f api/docker-compose.yml ps

# 显示日志
echo "📋 显示服务日志..."
docker-compose -f api/docker-compose.yml logs --tail=50

echo "✅ 部署完成！"
echo "🌐 访问地址: http://localhost:5173"
echo "📊 监控面板: http://localhost:9090"
echo "📝 查看日志: docker-compose -f api/docker-compose.yml logs -f"
```

### 使用部署脚本

```bash
# 1. 赋予执行权限
chmod +x scripts/deploy.sh

# 2. 运行部署脚本
./scripts/deploy.sh
```

---

## ✅ 验证测试

### 1. 健康检查

```bash
# 检查前端服务
curl http://localhost:5173

# 检查 API 服务
curl http://localhost:6000/api/v2/health

# 检查 Redis 连接
docker exec -it nas-ddns-redis redis-cli ping

# 检查 PostgreSQL 连接
docker exec -it nas-ddns-postgres pg_isready
```

### 2. 功能测试

```bash
# 测试 API 端点
curl -X GET http://localhost:6000/api/v2/status

# 测试数据库连接
docker exec -it nas-ddns-postgres psql -U yyc3_nas_user -d yyc3_nas_db -c "SELECT version();"

# 测试 Redis 缓存
docker exec -it nas-ddns-redis redis-cli set test "hello"
docker exec -it nas-ddns-redis redis-cli get test
```

### 3. 性能测试

```bash
# 使用 Apache Bench 进行压力测试
ab -n 1000 -c 10 http://localhost:6000/

# 检查响应时间
curl -o /dev/null -s -w "%{time_total}\n" http://localhost:6000
```

---

## 📊 监控运维

### 1. 日志管理

```bash
# 查看所有服务日志
docker-compose -f api/docker-compose.yml logs -f

# 查看特定服务日志
docker-compose -f api/docker-compose.yml logs -f api
docker-compose -f api/docker-compose.yml logs -f nginx
docker-compose -f api/docker-compose.yml logs -f prometheus

# 导出日志
docker-compose -f api/docker-compose.yml logs > logs/$(date +%Y%m%d).log
```

### 2. 服务管理

```bash
# 查看服务状态
docker-compose -f api/docker-compose.yml ps

# 重启服务
docker-compose -f api/docker-compose.yml restart api

# 停止服务
docker-compose -f api/docker-compose.yml stop api

# 启动服务
docker-compose -f api/docker-compose.yml start api
```

### 3. 数据备份

```bash
# 备份数据库
docker exec nas-ddns-postgres pg_dump -U yyc3_nas_user yyc3_nas_db > backup/postgres_$(date +%Y%m%d).sql

# 备份 Redis 数据
docker exec nas-ddns-redis redis-cli --rdb /backup/redis_$(date +%Y%m%d).rdb

# 备份配置文件
tar -czf backup/config_$(date +%Y%m%d).tar.gz .env api/docker-compose.yml
```

---

## 🔒 安全配置

### 1. 环境变量安全

```bash
# 设置 .env 文件权限
chmod 600 .env

# 确保 .env 在 .gitignore 中
echo ".env" >> .gitignore
```

### 2. Docker 安全

```bash
# 使用非 root 用户运行容器
# 在 docker-compose.yml 中指定 user

# 限制容器资源
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
    reservations:
      cpus: '1'
      memory: 2G
```

### 3. 网络安全

```bash
# 配置防火墙规则
sudo ufw allow 6000/tcp
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw allow 5173/tcp

# 启用 HTTPS
# 配置 SSL 证书
```

---

## 📚 附录

### A. 端口映射表

| 服务 | 内部端口 | 外部端口 | 协议 | 说明 |
|------|---------|---------|------|------|
| 前端服务 | 5173 | 5173 | HTTP | Web 应用界面 |
| API 服务 | 8080 | 6000 | HTTP | API 服务 |
| Redis | 6379 | 6379 | TCP | 缓存服务 |
| PostgreSQL | 5432 | 5432 | TCP | 数据库服务 |
| Prometheus | 9090 | 9090 | HTTP | 监控服务 |
| Grafana | 3000 | 3000 | HTTP | 可视化服务 |
| Node Exporter | 9100 | 9100 | HTTP | 系统监控 |

### B. 环境变量清单

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | development | 应用环境 |
| API_SERVICE_PORT | 6000 | API 服务端口 |
| MAIL_SERVICE_PORT | 6003 | 邮件服务端口 |
| LLM_SERVICE_PORT | 6002 | LLM 服务端口 |
| REDIS_API_PORT | 6379 | Redis API 端口 |
| NAS_SERVICE_PORT | 6004 | NAS 服务端口 |
| ADMIN_SERVICE_PORT | 6001 | 管理服务端口 |
| MONITOR_SERVICE_PORT | 6006 | 监控服务端口 |
| DDNS_SERVICE_PORT | 6007 | DDNS 服务端口 |
| POSTGRES_USER | yyc3_nas_user | 数据库用户 |
| POSTGRES_PASSWORD | - | 数据库密码 |
| POSTGRES_DB | yyc3_nas_db | 数据库名称 |
| REDIS_URL | redis://redis:6379/0 | Redis 连接地址 |
| REDIS_HOST | redis | Redis 主机 |
| REDIS_PORT | 6379 | Redis 端口 |
| API_PREFIX | /api/v2 | API 前缀 |
| API_VERSION | 2.0.0 | API 版本 |
| CORS_ENABLED | true | CORS 启用 |
| CORS_ORIGINS | * | CORS 允许的源 |
| API_JWT_SECRET | - | JWT 密钥 |
| API_JWT_EXPIRES_IN | 7d | JWT 过期时间 |
| CACHE_ENABLED | true | 缓存启用 |
| CACHE_TYPE | redis | 缓存类型 |
| CACHE_TTL | 3600 | 缓存过期时间 |
| RATE_LIMIT_ENABLED | true | 速率限制启用 |
| RATE_LIMIT_WINDOW | 60 | 速率限制窗口 |
| RATE_LIMIT_MAX_REQUESTS | 100 | 速率限制最大请求数 |
| METRICS_ENABLED | true | 监控启用 |
| METRICS_PORT | 9090 | 监控端口 |
| HEALTH_CHECK_INTERVAL | 30 | 健康检查间隔 |
| ALIYUN_ACCESS_KEY_ID | - | 阿里云 Access Key ID |
| ALIYUN_ACCESS_KEY_SECRET | - | 阿里云 Access Key Secret |
| ALIYUN_DOMAIN | 0379.email | 阿里云域名 |
| ALIYUN_SUB_DOMAIN | ddns | 阿里云子域名 |
| ALIYUN_REGION_ID | cn-beijing | 阿里云区域 ID |
| ALIYUN_TTL | 600 | 阿里云 TTL |
| MAIL_ENABLED | true | 邮件启用 |
| MAIL_FROM | info@0379.email | 邮件发件人 |
| MAIL_SMTP_HOST | smtp.gmail.com | SMTP 服务器 |
| MAIL_SMTP_PORT | 587 | SMTP 端口 |
| MAIL_SMTP_USERNAME | admin@0379.email | SMTP 用户名 |
| MAIL_SMTP_PASSWORD | - | SMTP 密码 |
| LLM_ENABLED | true | LLM 启用 |
| LLM_API_URL | http://localhost:11434/v1 | LLM API 地址 |
| LLM_API_KEY | - | LLM API 密钥 |
| LLM_DEFAULT_MODEL | gpt-4 | LLM 默认模型 |
| LLM_MAX_TOKENS | 2048 | LLM 最大 Token 数 |
| LLM_TEMPERATURE | 0.7 | LLM 温度 |
| BASE_DOMAIN | 0379.email | 基础域名 |
| API_DOMAIN | api.0379.email | API 域名 |
| MAIL_DOMAIN | mail.0379.email | 邮件域名 |
| LLM_DOMAIN | llm.0379.email | LLM 域名 |
| NAS_DOMAIN | nas.0379.email | NAS 域名 |
| ADMIN_DOMAIN | admin.0379.email | 管理域名 |
| MONITOR_DOMAIN | monitor.0379.email | 监控域名 |
| DDNS_DOMAIN | ddns.0379.email | DDNS 域名 |
| FRP_API_URL | http://localhost:7500 | FRP API 地址 |
| FRP_AUTH_TOKEN | yyc3_nas | FRP 认证令牌 |
| GRAFANA_ADMIN_PASSWORD | admin | Grafana 管理员密码 |
| PROMETHEUS_PORT | 9090 | Prometheus 端口 |
| GRAFANA_PORT | 3000 | Grafana 端口 |

### C. 常用命令

```bash
# 启动开发环境
pnpm run dev

# 构建生产版本
pnpm run build

# 启动 Docker 容器
docker-compose -f api/docker-compose.yml up -d

# 停止 Docker 容器
docker-compose -f api/docker-compose.yml down

# 查看服务日志
docker-compose -f api/docker-compose.yml logs -f

# 重启服务
docker-compose -f api/docker-compose.yml restart

# 清理未使用的镜像
docker system prune -a

# 查看容器资源使用
docker stats
```

### D. 故障排查

#### 问题1：容器无法启动

**症状**: Docker 容器启动失败或立即退出

**可能原因**:
- 端口被占用
- 环境变量配置错误
- 依赖服务未启动
- 资源不足

**解决方案**:

```bash
# 1. 查看容器日志
docker-compose -f api/docker-compose.yml logs

# 2. 检查端口占用
sudo netstat -tlnp | grep 6000
sudo lsof -i :6000

# 3. 检查 Docker 守护进程
sudo systemctl status docker

# 4. 查看容器详细信息
docker inspect nas-ddns-api

# 5. 手动运行容器进行调试
docker run -it --rm nas-ddns-api bash

# 6. 检查环境变量
docker exec nas-ddns-api env | grep -v '^#' | sort
```

#### 问题2：数据库连接失败

**症状**: 应用无法连接到 PostgreSQL 数据库

**可能原因**:
- 数据库容器未启动
- 连接字符串配置错误
- 网络隔离问题
- 数据库用户权限不足

**解决方案**:

```bash
# 1. 检查数据库容器状态
docker ps | grep postgres

# 2. 查看数据库日志
docker logs nas-ddns-postgres

# 3. 测试数据库连接
docker exec -it nas-ddns-postgres psql -U yyc3_nas_user -d yyc3_nas_db

# 4. 检查数据库用户权限
docker exec -it nas-ddns-postgres psql -U postgres -c "\du"

# 5. 检查数据库连接字符串
echo $DATABASE_URL

# 6. 重启数据库容器
docker-compose -f api/docker-compose.yml restart postgres

# 7. 检查网络连接
docker exec nas-ddns-api ping nas-ddns-postgres
```

#### 问题3：前端无法访问

**症状**: 无法通过浏览器访问前端应用

**可能原因**:
- 前端容器未启动
- 端口映射配置错误
- Nginx 配置错误
- 防火墙阻止访问

**解决方案**:

```bash
# 1. 检查前端容器状态
docker ps | grep frontend

# 2. 查看前端日志
docker logs nas-ddns-frontend

# 3. 检查端口映射
docker port nas-ddns-frontend 5173

# 4. 测试本地访问
curl http://localhost:5173

# 5. 检查 Nginx 配置
sudo nginx -t

# 6. 重启 Nginx
sudo systemctl restart nginx

# 7. 检查防火墙规则
sudo ufw status
sudo ufw allow 5173/tcp
```

#### 问题4：FRP 连接失败

**症状**: FRP 客户端无法连接到 FRP 服务器

**可能原因**:
- FRP 服务器未启动
- 网络连接问题
- 防火墙阻止连接
- 认证令牌错误

**解决方案**:

```bash
# 1. 检查 FRP 服务器状态
ssh root@8.152.195.33
systemctl status frps

# 2. 查看 FRP 服务器日志
ssh root@8.152.195.33
tail -f /root/frps/frps.log

# 3. 检查 FRP 客户端状态
ssh user@192.168.3.45
systemctl status frpc

# 4. 查看 FRP 客户端日志
ssh user@192.168.3.45
tail -f /Volume1/www/frpc/logs/frpc.log

# 5. 测试网络连接
ssh user@192.168.3.45
telnet 8.152.195.33 7001

# 6. 检查防火墙规则
ssh root@8.152.195.33
sudo ufw allow 7001/tcp

# 7. 验证认证令牌
grep "auth.token" /etc/frp/frps.toml
grep "auth.token" /Volume1/www/frpc/frpc.toml
```

#### 问题5：SSL 证书问题

**症状**: HTTPS 访问失败或证书警告

**可能原因**:
- SSL 证书未配置
- 证书过期
- 证书域名不匹配
- 证书链不完整

**解决方案**:

```bash
# 1. 检查 SSL 证书状态
sudo certbot certificates

# 2. 查看证书详细信息
sudo openssl x509 -in /etc/letsencrypt/live/0379.email/cert.pem -text -noout

# 3. 检查证书有效期
sudo openssl x509 -in /etc/letsencrypt/live/0379.email/cert.pem -noout -dates

# 4. 续期 SSL 证书
sudo certbot renew

# 5. 强制续期 SSL 证书
sudo certbot renew --force-renewal

# 6. 重启 FRP 服务器
ssh root@8.152.195.33
sudo systemctl restart frps

# 7. 验证 SSL 证书
curl -vI https://api.0379.email
```

#### 问题6：Redis 连接失败

**症状**: 应用无法连接到 Redis 缓存

**可能原因**:
- Redis 容器未启动
- 连接字符串配置错误
- Redis 密码配置错误
- 内存不足

**解决方案**:

```bash
# 1. 检查 Redis 容器状态
docker ps | grep redis

# 2. 查看 Redis 日志
docker logs nas-ddns-redis

# 3. 测试 Redis 连接
docker exec -it nas-ddns-redis redis-cli ping

# 4. 检查 Redis 配置
docker exec -it nas-ddns-redis redis-cli CONFIG GET requirepass

# 5. 重启 Redis 容器
docker-compose -f api/docker-compose.yml restart redis

# 6. 检查 Redis 内存使用
docker stats nas-ddns-redis
```

#### 问题7：API 响应缓慢

**症状**: API 接口响应时间过长

**可能原因**:
- 数据库查询慢
- 缓存未命中
- 网络延迟
- 服务器资源不足

**解决方案**:

```bash
# 1. 检查 API 响应时间
curl -o /dev/null -s -w "%{time_total}\n" http://localhost:6000/api/v2/health

# 2. 查看数据库查询日志
docker logs nas-ddns-postgres | grep "duration:"

# 3. 检查 Redis 缓存命中率
docker exec -it nas-ddns-redis redis-cli INFO stats | grep keyspace

# 4. 检查服务器资源使用
docker stats nas-ddns-api

# 5. 查看应用日志
docker logs nas-ddns-api | grep "slow query"

# 6. 优化数据库查询
docker exec -it nas-ddns-postgres psql -U yyc3_nas_user -d yyc3_nas_db -c "EXPLAIN ANALYZE SELECT ..."

# 7. 清理 Redis 缓存
docker exec -it nas-ddns-redis redis-cli FLUSHDB
```

#### 问题8：磁盘空间不足

**症状**: 容器无法启动或写入失败

**可能原因**:
- 磁盘空间不足
- 日志文件过大
- Docker 镜像占用空间

**解决方案**:

```bash
# 1. 检查磁盘使用情况
df -h

# 2. 检查 Docker 磁盘使用
docker system df

# 3. 清理未使用的镜像
docker system prune -a

# 4. 清理未使用的容器
docker container prune

# 5. 清理未使用的卷
docker volume prune

# 6. 清理日志文件
docker exec nas-ddns-api sh -c "truncate -s 0 /app/logs/*.log"

# 7. 设置日志轮转
# 在 docker-compose.yml 中添加
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

#### 问题9：内存溢出

**症状**: 容器被 OOM Killer 杀死

**可能原因**:
- 内存限制过低
- 内存泄漏
- 并发请求过多

**解决方案**:

```bash
# 1. 检查容器内存使用
docker stats nas-ddns-api

# 2. 查看系统日志
dmesg | grep -i "killed process"

# 3. 增加容器内存限制
# 在 docker-compose.yml 中添加
deploy:
  resources:
    limits:
      memory: 4G
    reservations:
      memory: 2G

# 4. 检查内存泄漏
docker exec nas-ddps-api node --inspect

# 5. 优化应用内存使用
# 检查代码中的内存泄漏
# 使用流处理大文件
# 限制并发请求数量
```

#### 问题10：权限问题

**症状**: 容器无法访问文件或目录

**可能原因**:
- 文件权限不正确
- 用户 ID 不匹配
- SELinux 限制

**解决方案**:

```bash
# 1. 检查文件权限
ls -la /path/to/file

# 2. 修改文件权限
chmod 644 /path/to/file
chmod 755 /path/to/directory

# 3. 修改文件所有者
chown -R user:group /path/to/directory

# 4. 检查 SELinux 状态
getenforce

# 5. 临时禁用 SELinux
sudo setenforce 0

# 6. 在 docker-compose.yml 中指定用户
services:
  api:
    user: "1000:1000"

# 7. 使用 Docker 卷的权限选项
volumes:
  - ./data:/app/data:rw
```

### E. 相关链接

- **项目仓库**: https://github.com/YYC-Cube/YYC3-NAS-ECS
- **文档中心**: https://docs.yyc3.com
- **技术支持**: admin@0379.email
- **问题反馈**: https://github.com/YYC-Cube/YYC3-NAS-ECS/issues

---

## 📝 版本更新说明

### v2.1.0 (2026-02-04)

#### 新增功能

1. **FRP 配置与部署**
   - 新增完整的 FRP 服务器配置说明
   - 新增完整的 FRP 客户端配置说明
   - 新增 FRP 部署脚本和 Systemd 服务配置
   - 新增 FRP 服务映射表，包含7个服务
   - 新增 FRP 验证测试命令

2. **部署架构更新**
   - 更新部署架构图，包含 FRP 服务器和客户端
   - 新增阿里云 ECS (8.152.195.33) 和本地 NAS (192.168.3.45) 的架构说明
   - 新增 FRP 代理服务的端口映射说明

3. **故障排查增强**
   - 新增 FRP 连接失败问题排查
   - 新增 SSL 证书问题排查
   - 新增 Redis 连接失败问题排查
   - 新增 API 响应缓慢问题排查
   - 新增磁盘空间不足问题排查
   - 新增内存溢出问题排查
   - 新增权限问题排查
   - 扩展现有问题排查的解决方案，包含更详细的诊断步骤

#### 文档改进

1. **环境配置要求文档**
   - 更新检查日期为 2026-02-04
   - 更新文档版本为 2.0.0
   - 新增 FRP 配置检查项
   - 新增 FRP 服务器和客户端配置说明
   - 新增 FRP 服务映射表
   - 更新部署步骤，包含 FRP 配置
   - 更新验证测试，包含 FRP 代理验证

2. **部署流程指导文档**
   - 更新文档版本为 2.1.0
   - 更新更新日期为 2026-02-04
   - 新增 FRP 配置与部署章节
   - 更新部署架构图
   - 扩展故障排查章节

#### 技术更新

1. **FRP 配置**
   - FRP 服务器: 8.152.195.33:7001
   - FRP 管理后台: http://8.152.195.33:7500
   - FRP 客户端: 192.168.3.45
   - TLS 加密传输
   - 子域名支持: api, nas, mail, llm, admin, monitor, ddns

2. **服务映射**
   - API 服务: 127.0.0.1:6000 → api.0379.email
   - NAS 服务: 127.0.0.1:6004 → nas.0379.email
   - 邮件服务: 127.0.0.1:6003 → mail.0379.email
   - LLM 服务: 127.0.0.1:6002 → llm.0379.email
   - 管理服务: 127.0.0.1:6001 → admin.0379.email
   - 监控服务: 127.0.0.1:6006 → monitor.0379.email
   - DDNS 服务: 127.0.0.1:6007 → ddns.0379.email

#### 兼容性说明

- 向后兼容 v2.0.0 的所有配置
- 新增 FRP 配置为可选功能
- 现有部署无需修改即可继续使用
- 建议新部署采用 FRP 配置以实现内网穿透

#### 升级指南

1. **从 v2.0.0 升级到 v2.1.0**

   ```bash
   # 1. 拉取最新代码
   git pull origin main

   # 2. 更新环境变量（可选）
   cp .env.example .env
   # 检查新增的 FRP 相关配置

   # 3. 配置 FRP 服务器（如果需要内网穿透）
   ssh root@8.152.195.33
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

   # 2. 按照部署流程指导文档进行部署
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

### v2.0.0 (2026-01-25)

#### 新增功能

1. **完整的部署流程指导**
   - 新增环境准备章节
   - 新增快速启动章节
   - 新增 Docker Compose 配置章节
   - 新增环境变量配置章节
   - 新增部署脚本章节
   - 新增验证测试章节
   - 新增监控运维章节
   - 新增安全配置章节

2. **多环境支持**
   - 支持开发环境
   - 支持测试环境
   - 支持生产环境

3. **容器化部署**
   - Docker Compose 配置
   - 多服务编排
   - 健康检查
   - 日志管理

4. **监控和告警**
   - Prometheus 集成
   - Grafana 可视化
   - Node Exporter 系统监控

#### 文档改进

1. **结构化文档**
   - 清晰的章节划分
   - 完整的目录索引
   - 详细的配置说明

2. **实用性强**
   - 提供完整的配置示例
   - 提供详细的部署步骤
   - 提供实用的故障排查

---

<div align="center">

> **「YanYuCloudCube」**
> **「言启象限 | 语枢未来」**
> **「Words Initiate Quadrants, Language Serves as Core for Future」**
> **「万象归元于云枢 | 深栈智启新纪元」**
> **「All things converge in cloud pivot; Deep stacks ignite a new era of intelligence」**

</div>
