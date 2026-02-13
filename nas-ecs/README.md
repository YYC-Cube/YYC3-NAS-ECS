# YYC³ NAS-ECS 部署包

> YYC³ NAS-ECS 企业级智能管理平台 - 统一部署包
>
> **言启象限 | 语枢未来**
>
> **Words Initiate Quadrants, Language Serves as Core for Future**

---

## 📦 包结构

```
nas-ecs/
├── docker/                    # Docker Compose 配置文件
│   ├── docker-compose.yml           # 生产环境配置
│   ├── docker-compose.staging.yml  # 预发布环境配置
│   ├── docker-compose.override.yml  # 覆盖配置
│   ├── docker-compose.ai.prod.yml  # AI服务生产配置
│   └── docker-compose.ai.dev.yml  # AI服务开发配置
├── config/                    # 环境变量配置
│   ├── .env.production           # 生产环境变量
│   ├── .env.staging            # 预发布环境变量
│   ├── .env.development        # 开发环境变量
│   ├── .env.example            # 环境变量模板
│   ├── .env.ports              # 端口配置
│   └── .env.services           # 服务配置
├── scripts/                   # 部署脚本
│   ├── quick-start.sh           # 快速启动脚本
│   ├── quick-stop.sh            # 快速停止脚本
│   ├── quick-restart.sh        # 快速重启脚本
│   ├── health-check.sh          # 健康检查脚本
│   ├── stack-manager.sh         # 服务管理脚本
│   ├── start.sh                # 服务启动脚本
│   └── init-system.sh          # 系统初始化脚本
└── docs/                     # 部署文档
    ├── DEPLOYMENT.md          # 详细部署说明
    └── DEPLOYMENT-DELIVERY.md # 部署交付文档
```

---

## 🚀 快速开始

### 环境要求

- **操作系统**: Linux (Ubuntu 20.04+ / CentOS 7+ / Debian 10+)
- **Docker**: >= 20.10
- **Docker Compose**: >= 2.0
- **内存**: >= 4GB
- **磁盘**: >= 20GB
- **网络**: 稳定的互联网连接

### 快速部署

```bash
# 1. 解压部署包
tar -xzf nas-ecs.tar.gz
cd nas-ecs

# 2. 配置环境变量
cp config/.env.example config/.env.production
vim config/.env.production

# 3. 启动服务
chmod +x scripts/quick-start.sh
./scripts/quick-start.sh

# 4. 检查服务状态
./scripts/health-check.sh
```

---

## ⚙️ 环境配置

### 必须配置的变量

编辑 `config/.env.production` 文件：

```bash
# 应用配置
APP_NAME=YYC3-NAS-ECS
APP_VERSION=1.0.0

# API配置
API_JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis配置
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# 安全配置
SECURE_COOKIE=true
CSRF_SECRET=your-csrf-secret

# 域名配置（如需FRP穿透）
DOMAIN=your-domain.com
```

### 端口配置

编辑 `config/.env.ports` 文件：

```bash
# 主服务端口
MAIN_API_PORT=6000
MAIN_WEB_PORT=5173

# FRP服务端口
FRP_DASHBOARD_PORT=7500
FRP_SSH_PORT=6000
FRP_DDNS_PORT=6001
FRP_MONITOR_PORT=6002
FRP_MAIL_PORT=6003
FRP_LOG_PORT=6009
FRP_AI_PORT=6005

# DDNS服务端口
DDNS_API_PORT=8080

# Redis端口
REDIS_PORT=6379

# 数据库端口
POSTGRES_PORT=5432
```

---

## 🐳 Docker部署

### 生产环境部署

```bash
# 启动生产环境
cd docker
docker-compose -f docker-compose.yml up -d

# 查看服务状态
docker-compose -f docker-compose.yml ps

# 查看日志
docker-compose -f docker-compose.yml logs -f

# 停止服务
docker-compose -f docker-compose.yml down
```

### 预发布环境部署

```bash
# 启动预发布环境
cd docker
docker-compose -f docker-compose.staging.yml up -d
```

### AI服务部署

```bash
# 启动AI服务（生产）
cd docker
docker-compose -f docker-compose.ai.prod.yml up -d

# 启动AI服务（开发）
cd docker
docker-compose -f docker-compose.ai.dev.yml up -d
```

### 自定义配置部署

```bash
# 使用覆盖配置
cd docker
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

---

## 📜 脚本使用说明

### 快速启动

```bash
# 启动所有服务
./scripts/quick-start.sh

# 启动特定环境
ENVIRONMENT=staging ./scripts/quick-start.sh
ENVIRONMENT=development ./scripts/quick-start.sh
```

### 快速停止

```bash
# 停止所有服务
./scripts/quick-stop.sh

# 停止特定环境
ENVIRONMENT=staging ./scripts/quick-stop.sh
```

### 快速重启

```bash
# 重启所有服务
./scripts/quick-restart.sh

# 重启特定服务
SERVICE=api ./scripts/quick-restart.sh
SERVICE=redis ./scripts/quick-restart.sh
```

### 健康检查

```bash
# 检查所有服务健康状态
./scripts/health-check.sh

# 检查特定服务
SERVICE=api ./scripts/health-check.sh
SERVICE=redis ./scripts/health-check.sh
```

### 服务管理

```bash
# 启动所有服务
./scripts/stack-manager.sh start

# 停止所有服务
./scripts/stack-manager.sh stop

# 重启所有服务
./scripts/stack-manager.sh restart

# 查看服务状态
./scripts/stack-manager.sh status
```

### 系统初始化

```bash
# 初始化系统（首次部署）
./scripts/init-system.sh
```

---

## 🔧 故障排除

### 服务无法启动

```bash
# 检查Docker服务
docker ps -a

# 查看容器日志
docker-compose logs <service-name>

# 检查端口占用
lsof -i :<port>
```

### 环境变量问题

```bash
# 验证环境变量格式
docker-compose config

# 检查特定变量
docker-compose config | grep <variable-name>
```

### 权限问题

```bash
# 添加执行权限
chmod +x scripts/*.sh

# 添加Docker权限
sudo usermod -aG docker $USER
```

---

## 📊 服务访问地址

部署成功后，可通过以下地址访问各服务：

| 服务 | 地址 | 说明 |
|------|------|------|
| 主应用 | http://localhost:5173 | 前端应用 |
| API服务 | http://localhost:6000 | 后端API |
| FRP管理 | http://localhost:7500 | FRP Web面板 |
| DDNS API | http://localhost:8080 | DDNS服务API |
| Redis | localhost:6379 | Redis缓存服务 |
| PostgreSQL | localhost:5432 | 数据库服务 |

---

## 🔐 安全建议

1. **修改默认密码**: 部署后立即修改所有默认密码
2. **配置防火墙**: 只开放必要的端口
3. **启用SSL**: 生产环境使用HTTPS
4. **定期备份**: 配置自动备份策略
5. **监控日志**: 定期检查服务日志

---

## 📞 技术支持

- **项目主页**: <https://github.com/YYC-Cube/YYC3-NAS-ECS>
- **问题反馈**: <https://github.com/YYC-Cube/YYC3-NAS-ECS/issues>
- **邮箱**: <admin@0379.email>

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**Made with ❤️ by YYC³ Team**

</div>
