# YYC³ NAS-ECS 阿里云ECS部署实施记录

> **言启象限 | 语枢未来**
>
> **Words Initiate Quadrants, Language Serves as Core for Future**

---

## 📋 文档信息

- **创建日期**: 2026-02-04
- **最后更新**: 2026-02-04
- **文档版本**: 1.0.0
- **作者**: YYC³ Team
- **部署状态**: 🟢 部分完成

---

## 🎯 部署概述

本文档记录 YYC³ NAS-ECS 项目在阿里云ECS服务器上的部署实施过程，包括FRPS内网穿透服务配置和完整项目架构部署。

### 部署目标

- ✅ 在阿里云ECS服务器上部署FRPS内网穿透服务
- 🔄 在/opt/nas-ecs目录部署完整项目架构
- ⏳ 配置项目运行环境和服务
- ⏳ 验证所有服务正常运行

---

## 🖥️ 服务器信息

### 基本配置

| 配置项 | 值 | 说明 |
|---------|-----|------|
| **服务器IP** | SERVER_IP_PLACEHOLDER | 阿里云ECS公网IP |
| **服务器名称** | yyc3-33 | SSH连接别名 |
| **SSH连接** | ssh yyc3-33 | 本地快速连接命令 |
| **操作系统** | Linux (待确认) | 推荐Ubuntu 22.04 LTS |
| **内存配置** | 32GB RAM | 适合生产环境部署 |
| **磁盘配置** | (待确认) | 建议至少100GB SSD |

### 网络配置

| 配置项 | 值 | 说明 |
|---------|-----|------|
| **公网IP** | SERVER_IP_PLACEHOLDER | 用于FRPS和外部访问 |
| **内网IP** | (待确认) | 用于内部服务通信 |
| **安全组** | (待配置) | 需要开放必要端口 |
| **域名** | 0379.email | 主域名 |

### 端口配置

| 端口 | 用途 | 状态 | 说明 |
|------|------|------|------|
| 22 | SSH | ✅ 开放 | 服务器管理 |
| 7001 | FRPS服务 | ✅ 开放 | FRP服务端口 |
| 7500 | FRPS Web管理 | ✅ 开放 | FRP管理面板 |
| 18080 | FRP HTTP代理 | ✅ 开放 | HTTP穿透服务 |
| 4443 | FRP HTTPS代理 | ✅ 开放 | HTTPS穿透服务 |
| 6000 | 主服务API | ⏳ 待配置 | 主应用服务 |
| 6001 | DDNS服务 | ⏳ 待配置 | DDNS API服务 |
| 6002 | 监控服务 | ⏳ 待配置 | 监控API服务 |
| 6003 | 邮件服务 | ⏳ 待配置 | 邮件API服务 |
| 6009 | 日志服务 | ⏳ 待配置 | 日志API服务 |
| 6005 | AI服务 | ⏳ 待配置 | AI API服务 |

---

## 🔌 FRPS内网穿透配置

### 部署位置

```
服务器路径: /frps
状态: ✅ 已实现通畅
```

### FRPS配置文件

**配置文件路径**: `/frps/frps.toml`

```toml
# FRPS服务器配置
bindAddr = "0.0.0.0"
bindPort = 7001

# 认证配置
auth.method = "token"
auth.token = "yyc3_nas"

# Web管理面板
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "yyc3"
webServer.password = "my151001"

# 虚拟主机配置
vhostHTTPPort = 18080
vhostHTTPSPort = 4443

# TLS证书配置
transport.tls.certFile = "/etc/letsencrypt/live/0379.email/fullchain.pem"
transport.tls.keyFile = "/etc/letsencrypt/live/0379.email/privkey.pem"

# 端口范围
allowPorts = [
  { start = 6000, end = 6009 },
  { start = 8080, end = 8080 }
]

# 子域名配置
subDomainHost = "0379.email"

# 日志配置
log.to = "/root/frps/frps.log"
log.level = "warn"
```

### FRPS服务管理

**Systemd服务文件**: `/etc/systemd/system/frps.service`

```bash
[Unit]
Description=FRP Server Service
After=network.target

[Service]
Type=simple
User=root
Restart=on-failure
RestartSec=5s
ExecStart=/usr/local/bin/frps -c /frps/frps.toml

[Install]
WantedBy=multi-user.target
```

**服务管理命令**:

```bash
# 启动FRPS服务
systemctl start frps

# 停止FRPS服务
systemctl stop frps

# 重启FRPS服务
systemctl restart frps

# 查看FRPS服务状态
systemctl status frps

# 查看FRPS日志
journalctl -u frps -f

# 设置开机自启
systemctl enable frps
```

### FRPS服务映射

| 服务名称 | 外部地址 | 内部地址 | 状态 |
|---------|---------|---------|------|
| Web管理面板 | frp.0379.email:7500 | - | ✅ 正常 |
| 主服务API | api.0379.email:6000 | 192.168.3.45:6000 | ⏳ 待配置 |
| DDNS服务 | ddns.0379.email:6001 | 192.168.3.45:6001 | ⏳ 待配置 |
| 监控服务 | monitor.0379.email:6002 | 192.168.3.45:6002 | ⏳ 待配置 |
| 邮件服务 | mail.0379.email:6003 | 192.168.3.45:6003 | ⏳ 待配置 |
| 日志服务 | log.0379.email:6009 | 192.168.3.45:6009 | ⏳ 待配置 |
| AI服务 | ai.0379.email:6005 | 192.168.3.45:6005 | ⏳ 待配置 |

### FRPS验证测试

```bash
# 检查FRPS服务是否运行
systemctl status frps

# 检查FRPS端口是否监听
netstat -tlnp | grep frps

# 测试FRPS Web管理面板
curl -u yyc3:my151001 http://localhost:7500/api/proxy/tcp

# 查看FRPS日志
tail -f /root/frps/frps.log
```

---

## 📁 项目部署架构

### 部署目录结构

```
/opt/nas-ecs/                          # 项目根目录
├── api/                              # 后端API服务
│   ├── app/                          # Flask应用
│   │   ├── api/                      # API路由
│   │   │   └── v2/               # API v2版本
│   │   ├── auth/                    # 认证模块
│   │   ├── middleware/              # 中间件
│   │   ├── services/                # 业务逻辑
│   │   ├── utils/                   # 工具函数
│   │   ├── models.py                # 数据模型
│   │   ├── tasks.py                 # 异步任务
│   │   ├── celery.py                # Celery配置
│   │   ├── websocket.py             # WebSocket支持
│   │   └── wsgi.py                 # WSGI入口
│   ├── config/                     # 配置文件
│   │   ├── config.py               # 主配置文件
│   │   └── config_annotated.py     # 带注释的配置文件
│   ├── docker/                     # Docker配置
│   │   ├── nginx/                 # Nginx配置
│   │   ├── postgres/              # PostgreSQL配置
│   │   └── prometheus/            # Prometheus配置
│   ├── docs/                       # API文档
│   ├── scripts/                    # 后端脚本
│   ├── docker-compose.yml          # Docker编排
│   ├── Dockerfile                  # Docker镜像
│   ├── requirements.txt            # Python依赖
│   └── wsgi.py                    # WSGI入口
├── services/                      # 独立服务
│   ├── ddns/                      # DDNS服务
│   ├── frp/                       # FRP客户端服务
│   ├── llm/                       # LLM大语言模型服务
│   ├── mail/                      # 邮箱服务
│   ├── redis/                     # Redis缓存服务
│   └── ai/                        # AI智能系统服务
│       ├── core/                    # 核心AI模块
│       ├── src/                     # AI源代码
│       ├── examples/                # 使用示例
│       ├── docs/                    # AI文档
│       └── tests/                   # AI测试
├── config/                        # 配置文件
│   ├── services/                  # 各服务配置
│   ├── .env.base                 # 基础环境变量
│   ├── .env.development         # 开发环境变量
│   ├── .env.staging             # 预发布环境变量
│   └── .env.production          # 生产环境变量
├── scripts/                       # 脚本目录
│   ├── services/                 # 服务脚本
│   ├── health-check.sh          # 健康检查
│   ├── quick-restart.sh         # 快速重启
│   ├── quick-start.sh           # 快速启动
│   ├── quick-stop.sh            # 快速停止
│   └── stack-manager.sh         # 服务管理
├── docs/                          # 文档目录
│   ├── YYC3-NAS-ECS-完整部署文档.md
│   ├── YYC3-NAS-ECS-部署指导/
│   │   ├── YYC3-NAS-ECS-生产环境准备检查清单.md
│   │   └── YYC3-NAS-ECS-部署流程指导.md
│   └── ...                       # 其他文档
├── .env.example                  # 环境变量模板
├── .gitignore                   # Git忽略文件
├── README.md                    # 项目说明
└── docker-compose.yml          # Docker编排文件
```

### 当前部署状态

| 组件 | 部署路径 | 状态 | 说明 |
|------|---------|------|------|
| **FRPS服务** | /frps | ✅ 已完成 | 内网穿透服务正常运行 |
| **项目目录** | /opt/nas-ecs | ✅ 已创建 | 项目架构已部署 |
| **后端API** | /opt/nas-ecs/api | ⏳ 待部署 | Flask应用服务 |
| **前端应用** | /opt/nas-ecs/frontend | ⏳ 待部署 | React应用服务 |
| **数据库** | /opt/nas-ecs/db | ⏳ 待部署 | PostgreSQL数据库 |
| **Redis缓存** | /opt/nas-ecs/redis | ⏳ 待部署 | Redis缓存服务 |
| **DDNS服务** | /opt/nas-ecs/services/ddns | ⏳ 待部署 | DDNS动态域名服务 |
| **FRP客户端** | /opt/nas-ecs/services/frp | ⏳ 待部署 | FRP客户端服务 |
| **邮件服务** | /opt/nas-ecs/services/mail | ⏳ 待部署 | 邮箱服务 |
| **AI服务** | /opt/nas-ecs/services/ai | ⏳ 待部署 | AI智能服务 |

---

## 🔧 部署步骤记录

### 阶段一：FRPS服务部署 ✅

**完成时间**: 2026-02-04

**执行步骤**:

1. **创建FRPS目录**
   ```bash
   mkdir -p /frps
   cd /frps
   ```

2. **下载FRPS二进制文件**
   ```bash
   wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
   tar -zxvf frp_0.52.3_linux_amd64.tar.gz
   cd frp_0.52.3_linux_amd64
   ```

3. **安装FRPS**
   ```bash
   cp frps /usr/local/bin/
   chmod +x /usr/local/bin/frps
   ```

4. **创建配置文件**
   ```bash
   mkdir -p /etc/frp
   mkdir -p /root/frps
   ```

5. **配置FRPS**
   - 创建 `/frps/frps.toml` 配置文件
   - 配置认证、Web管理面板、TLS证书等

6. **配置SSL证书**
   ```bash
   # 使用Let's Encrypt获取证书
   certbot certonly --standalone -d 0379.email
   ```

7. **创建Systemd服务**
   - 创建 `/etc/systemd/system/frps.service`
   - 配置服务自动启动和重启

8. **启动FRPS服务**
   ```bash
   systemctl daemon-reload
   systemctl enable frps
   systemctl start frps
   ```

9. **验证FRPS服务**
   ```bash
   systemctl status frps
   curl -u yyc3:my151001 http://localhost:7500/api/proxy/tcp
   ```

**结果**: ✅ FRPS服务正常运行，Web管理面板可访问

---

### 阶段二：项目目录部署 ✅

**完成时间**: 2026-02-04

**执行步骤**:

1. **创建项目根目录**
   ```bash
   mkdir -p /opt/nas-ecs
   cd /opt/nas-ecs
   ```

2. **上传项目代码**
   ```bash
   # 通过SCP或其他方式上传完整代码
   scp -r YYC3-NAS-ECS/* root@SERVER_IP_PLACEHOLDER:/opt/nas-ecs/
   
   # 或在服务器上克隆项目
   git clone https://github.com/YYC-Cube/YYC3-NAS-ECS.git .
   ```

3. **验证目录结构**
   ```bash
   ls -la /opt/nas-ecs
   ```

4. **配置环境变量**
   ```bash
   cp .env.example .env
   vim .env
   ```

5. **设置文件权限**
   ```bash
   chmod -R 755 /opt/nas-ecs
   chown -R www-data:www-data /opt/nas-ecs
   ```

**部署结果**: ✅ 完整代码文档架构已上传至 /opt/nas-ecs

**验证内容**:
- ✅ 后端API服务代码已部署
- ✅ 前端应用代码已部署
- ✅ 配置文件已部署
- ✅ 文档目录已部署
- ✅ 脚本文件已部署
- ✅ Docker配置文件已部署

---

### 阶段三：环境配置 ⏳

**预计完成时间**: 2026-02-05

**待执行步骤**:

1. **安装Python环境**
   ```bash
   # 安装Python 3.11+
   apt update
   apt install -y python3.11 python3.11-venv python3-pip
   ```

2. **安装Node.js环境**
   ```bash
   # 安装Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs
   ```

3. **安装Docker和Docker Compose**
   ```bash
   # 安装Docker
   curl -fsSL https://get.docker.com | sh
   systemctl enable docker
   systemctl start docker

   # 安装Docker Compose
   curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

4. **安装PostgreSQL**
   ```bash
   # 安装PostgreSQL 14
   apt install -y postgresql-14 postgresql-contrib-14
   systemctl enable postgresql
   systemctl start postgresql
   ```

5. **安装Redis**
   ```bash
   # 安装Redis
   apt install -y redis-server
   systemctl enable redis
   systemctl start redis
   ```

6. **安装Nginx**
   ```bash
   # 安装Nginx
   apt install -y nginx
   systemctl enable nginx
   systemctl start nginx
   ```

---

### 阶段四：数据库配置 ⏳

**预计完成时间**: 2026-02-05

**待执行步骤**:

1. **创建数据库用户**
   ```bash
   sudo -u postgres psql
   CREATE USER nas_user WITH PASSWORD 'your_password';
   ALTER USER nas_user WITH SUPERUSER;
   ```

2. **创建数据库**
   ```sql
   CREATE DATABASE nas_db OWNER nas_user;
   CREATE DATABASE nas_ddns OWNER nas_user;
   ```

3. **配置PostgreSQL远程访问**
   ```bash
   vim /etc/postgresql/14/main/pg_hba.conf
   # 添加: host all all 0.0.0.0/0 md5

   vim /etc/postgresql/14/main/postgresql.conf
   # 修改: listen_addresses = '*'

   systemctl restart postgresql
   ```

4. **初始化数据库**
   ```bash
   cd /opt/nas-ecs/api
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   flask db upgrade
   ```

---

### 阶段五：后端服务部署 ⏳

**预计完成时间**: 2026-02-05

**待执行步骤**:

1. **配置后端环境变量**
   ```bash
   cd /opt/nas-ecs/api
   vim .env
   ```

2. **安装Python依赖**
   ```bash
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **初始化数据库**
   ```bash
   flask db upgrade
   flask seed all
   ```

4. **配置Gunicorn**
   ```bash
   # 创建Gunicorn配置文件
   vim /etc/systemd/system/nas-api.service
   ```

5. **启动后端服务**
   ```bash
   systemctl daemon-reload
   systemctl enable nas-api
   systemctl start nas-api
   ```

6. **配置Nginx反向代理**
   ```bash
   vim /etc/nginx/sites-available/nas-api
   ln -s /etc/nginx/sites-available/nas-api /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

---

### 阶段六：前端服务部署 ⏳

**预计完成时间**: 2026-02-05

**待执行步骤**:

1. **安装前端依赖**
   ```bash
   cd /opt/nas-ecs/frontend
   npm install
   ```

2. **构建前端应用**
   ```bash
   npm run build
   ```

3. **配置Nginx静态文件服务**
   ```bash
   vim /etc/nginx/sites-available/nas-frontend
   ln -s /etc/nginx/sites-available/nas-frontend /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

4. **配置SSL证书**
   ```bash
   certbot --nginx -d nas.0379.email
   ```

---

### 阶段七：FRP客户端配置 ⏳

**预计完成时间**: 2026-02-05

**待执行步骤**:

1. **创建FRP客户端配置**
   ```bash
   cd /opt/nas-ecs/services/frp
   vim frpc.toml
   ```

2. **配置服务代理**
   ```toml
   serverAddr = "SERVER_IP_PLACEHOLDER"
   serverPort = 7001
   auth.token = "yyc3_nas"

   [[proxies]]
   name = "nas-api"
   type = "tcp"
   localIP = "127.0.0.1"
   localPort = 6000
   remotePort = 6000
   ```

3. **创建FRP客户端服务**
   ```bash
   vim /etc/systemd/system/frpc.service
   ```

4. **启动FRP客户端**
   ```bash
   systemctl daemon-reload
   systemctl enable frpc
   systemctl start frpc
   ```

---

### 阶段八：服务验证 ⏳

**预计完成时间**: 2026-02-05

**待执行步骤**:

1. **验证后端API**
   ```bash
   curl http://localhost:6000/api/v2/health
   ```

2. **验证前端应用**
   ```bash
   curl http://localhost:80/
   ```

3. **验证FRP穿透**
   ```bash
   curl http://api.0379.email/api/v2/health
   ```

4. **验证数据库连接**
   ```bash
   psql -h localhost -U nas_user -d nas_db
   ```

5. **验证Redis连接**
   ```bash
   redis-cli ping
   ```

6. **验证所有服务**
   ```bash
   systemctl status nas-api
   systemctl status nas-frontend
   systemctl status frpc
   systemctl status postgresql
   systemctl status redis
   systemctl status nginx
   ```

---

## 📊 部署进度

### 总体进度

| 阶段 | 任务 | 状态 | 完成度 |
|------|------|------|--------|
| 阶段一 | FRPS服务部署 | ✅ 已完成 | 100% |
| 阶段二 | 项目目录部署 | ✅ 已完成 | 100% |
| 阶段三 | 环境配置 | ⏳ 进行中 | 0% |
| 阶段四 | 数据库配置 | ⏳ 待开始 | 0% |
| 阶段五 | 后端服务部署 | ⏳ 待开始 | 0% |
| 阶段六 | 前端服务部署 | ⏳ 待开始 | 0% |
| 阶段七 | FRP客户端配置 | ⏳ 待开始 | 0% |
| 阶段八 | 服务验证 | ⏳ 待开始 | 0% |
| **总体** | **全部部署** | 🟡 **进行中** | **25%** |

### 服务部署状态

| 服务 | 状态 | 进度 | 备注 |
|------|------|------|------|
| FRPS服务 | ✅ 运行中 | 100% | 内网穿透服务正常 |
| 项目目录 | ✅ 已创建 | 100% | 代码已同步 |
| PostgreSQL | ⏳ 待部署 | 0% | 数据库服务 |
| Redis | ⏳ 待部署 | 0% | 缓存服务 |
| 后端API | ⏳ 待部署 | 0% | Flask应用 |
| 前端应用 | ⏳ 待部署 | 0% | React应用 |
| Nginx | ⏳ 待配置 | 0% | 反向代理 |
| FRP客户端 | ⏳ 待配置 | 0% | 内网穿透客户端 |
| Celery | ⏳ 待部署 | 0% | 异步任务 |
| DDNS服务 | ⏳ 待部署 | 0% | 动态域名服务 |

---

## 🔍 验证清单

### FRPS服务验证 ✅

- [x] FRPS服务运行正常
- [x] FRPS端口监听正常
- [x] Web管理面板可访问
- [x] SSL证书配置正确
- [x] 防火墙规则已配置

### 项目部署验证 ⏳

- [ ] 项目目录结构正确
- [ ] 环境变量配置正确
- [ ] 文件权限设置正确
- [ ] Git仓库同步正常

### 环境配置验证 ⏳

- [ ] Python 3.11+ 已安装
- [ ] Node.js 18+ 已安装
- [ ] Docker 已安装并运行
- [ ] Docker Compose 已安装
- [ ] PostgreSQL 已安装并运行
- [ ] Redis 已安装并运行
- [ ] Nginx 已安装并运行

### 数据库配置验证 ⏳

- [ ] PostgreSQL服务运行正常
- [ ] 数据库用户已创建
- [ ] 数据库已创建
- [ ] 远程访问已配置
- [ ] 数据库已初始化

### 后端服务验证 ⏳

- [ ] Python依赖已安装
- [ ] 数据库已迁移
- [ ] Gunicorn服务运行正常
- [ ] API健康检查通过
- [ ] Nginx反向代理配置正确

### 前端服务验证 ⏳

- [ ] Node.js依赖已安装
- [ ] 前端应用已构建
- [ ] 静态文件服务正常
- [ ] SSL证书配置正确
- [ ] 前端应用可访问

### FRP客户端验证 ⏳

- [ ] FRP客户端配置正确
- [ ] FRP客户端服务运行正常
- [ ] 服务代理配置正确
- [ ] 外部访问测试通过

### 整体验证 ⏳

- [ ] 所有服务运行正常
- [ ] 服务间通信正常
- [ ] 外部访问正常
- [ ] 日志记录正常
- [ ] 监控告警配置完成

---

## 📝 环境变量配置

### 生产环境变量示例

```bash
# 基础配置
ENVIRONMENT=production
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# 数据库配置
DATABASE_URL=postgresql://nas_user:password@localhost:5432/nas_db

# Redis配置
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# 服务器配置
NAS_SERVER_IP=SERVER_IP_PLACEHOLDER
NAS_DOMAIN=nas.0379.email

# 阿里云配置
ALIYUN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_DOMAIN=0379.email
ALIYUN_SUB_DOMAIN=ddns
ALIYUN_TTL=600

# 日志配置
LOG_LEVEL=INFO

# CORS配置
CORS_ORIGINS=https://nas.0379.email,https://app.0379.email

# Sentry配置（可选）
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.2
```

---

## 🚨 故障排除

### FRPS服务问题

**问题**: FRPS服务无法启动

**解决方案**:
```bash
# 检查配置文件语法
frps verify /frps/frps.toml

# 检查端口占用
netstat -tlnp | grep 7001

# 查看详细日志
journalctl -u frps -n 50
```

**问题**: FRPS Web管理面板无法访问

**解决方案**:
```bash
# 检查防火墙规则
ufw status
ufw allow 7500/tcp

# 检查服务状态
systemctl status frps

# 测试本地访问
curl -u yyc3:my151001 http://localhost:7500/api/proxy/tcp
```

### 数据库连接问题

**问题**: 无法连接到PostgreSQL

**解决方案**:
```bash
# 检查PostgreSQL服务状态
systemctl status postgresql

# 检查端口监听
netstat -tlnp | grep 5432

# 检查连接配置
cat /etc/postgresql/14/main/pg_hba.conf

# 测试连接
psql -h localhost -U nas_user -d nas_db
```

### 后端服务问题

**问题**: 后端API无法启动

**解决方案**:
```bash
# 检查环境变量
cat .env

# 检查Python依赖
pip list

# 检查数据库连接
flask db upgrade

# 查看详细日志
journalctl -u nas-api -f
```

### FRP客户端问题

**问题**: FRP客户端无法连接到服务器

**解决方案**:
```bash
# 检查FRPS服务状态
systemctl status frps

# 检查FRP客户端配置
frpc verify /opt/nas-ecs/services/frp/frpc.toml

# 查看FRP客户端日志
journalctl -u frpc -f

# 测试网络连接
telnet SERVER_IP_PLACEHOLDER 7001
```

---

## 📞 联系方式

- **项目仓库**: https://github.com/YYC-Cube/YYC3-NAS-ECS
- **问题反馈**: https://github.com/YYC-Cube/YYC3-NAS-ECS/issues
- **技术支持**: admin@0379.email

---

## 📄 许可证

Copyright (c) 2025 YYC³

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
