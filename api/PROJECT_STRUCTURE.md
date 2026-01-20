# YYC³（YanYuCloudCube）NAS DDNS API 项目结构

```
nas-ddns-api/
├── app/                              # 应用主目录
│   ├── __init__.py
│   ├── api/                           # API 蓝图
│   │   ├── __init__.py
│   │   └── v2/                       # API v2 版本
│   │       ├── __init__.py             # 蓝图注册
│   │       ├── alerts.py               # 告警管理 API
│   │       ├── ddns.py                 # DDNS 管理 API
│   │       ├── dev.py                  # 开发工具 API
│   │       ├── domains.py              # 域名管理 API
│   │       ├── monitoring.py           # 监控 API
│   │       └── production/            # 生产环境 API
│   │           ├── __init__.py
│   │           └── ha.py              # 高可用 API
│   ├── auth/                          # 认证模块
│   │   ├── __init__.py
│   │   ├── api_keys.py                # API 密钥管理
│   │   └── jwt_manager.py             # JWT 令牌管理
│   ├── middleware/                    # 中间件
│   │   ├── __init__.py
│   │   └── rate_limit.py              # 速率限制
│   ├── models.py                      # 数据模型
│   ├── services/                      # 业务逻辑服务
│   │   └── __init__.py
│   ├── tasks.py                       # Celery 异步任务
│   ├── utils/                         # 工具函数
│   │   └── __init__.py
│   ├── celery.py                      # Celery 配置
│   └── db.py                          # 数据库（如果需要）
│
├── config/                            # 配置文件
│   └── config.py                      # 应用配置
│
├── docker/                            # Docker 相关文件
│   ├── entrypoint.sh                  # 容器启动脚本
│   ├── nginx/                         # Nginx 配置
│   │   ├── nginx.conf                 # 主配置
│   │   └── conf.d/                   # 站点配置
│   │       └── nas-ddns.conf
│   ├── postgres/                      # PostgreSQL 配置
│   │   └── init.sql                   # 初始化脚本
│   └── prometheus/                    # Prometheus 配置
│       └── prometheus.yml
│
├── scripts/                           # 运维脚本
│   ├── backup.sh                      # 备份脚本
│   └── test_api.sh                   # API 测试脚本
│
├── data/                              # 数据目录
│   ├── postgres/                      # PostgreSQL 数据
│   ├── redis/                         # Redis 数据
│   ├── prometheus/                    # Prometheus 数据
│   └── grafana/                      # Grafana 数据
│
├── logs/                              # 日志目录
│
├── backup/                            # 备份目录
│
├── reports/                           # 报告目录
│
├── tests/                             # 测试目录
│
├── app.py                             # 主应用文件
├── Dockerfile                         # Docker 镜像构建文件
├── docker-compose.yml                  # Docker Compose 配置
├── requirements.txt                    # 生产依赖
├── requirements-dev.txt                # 开发依赖
├── .env.example                       # 环境变量示例
├── .gitignore                         # Git 忽略文件
├── .dockerignore                      # Docker 忽略文件
├── README.md                          # 项目说明
├── QUICKSTART.md                      # 快速开始指南
├── deploy.sh                          # 部署脚本
├── start.sh                           # 快速启动脚本
└── PROJECT_STRUCTURE.md                # 本文件
```

## 文件说明

### 核心应用文件

| 文件 | 说明 |
|------|------|
| `app.py` | Flask 应用入口，注册蓝图和中间件 |
| `config/config.py` | 应用配置（开发、生产、测试环境） |
| `app/models.py` | 数据库模型（User, Domain, DNSRecord, Alert 等） |
| `app/celery.py` | Celery 异步任务配置 |
| `app/tasks.py` | Celery 任务定义 |

### API 蓝图

| 文件 | 说明 |
|------|------|
| `app/api/v2/ddns.py` | DDNS 管理 API（状态、记录、更新） |
| `app/api/v2/domains.py` | 域名管理 API（列表、状态、DNSSEC） |
| `app/api/v2/monitoring.py` | 系统监控 API（CPU、内存、服务健康） |
| `app/api/v2/alerts.py` | 告警管理 API（列表、解决、规则） |
| `app/api/v2/dev.py` | 开发工具 API（DNS 测试、配置验证） |
| `app/api/v2/production/ha.py` | 高可用 API（状态、故障转移、备份） |

### 认证与安全

| 文件 | 说明 |
|------|------|
| `app/auth/jwt_manager.py` | JWT 令牌管理（生成、验证、刷新） |
| `app/auth/api_keys.py` | API 密钥管理（生成、验证、撤销） |
| `app/middleware/rate_limit.py` | 速率限制中间件 |

### Docker 配置

| 文件 | 说明 |
|------|------|
| `Dockerfile` | 应用容器构建文件 |
| `docker-compose.yml` | 服务编排配置 |
| `docker/entrypoint.sh` | 容器启动脚本 |
| `docker/nginx/nginx.conf` | Nginx 主配置 |
| `docker/nginx/conf.d/nas-ddns.conf` | Nginx 站点配置 |
| `docker/postgres/init.sql` | PostgreSQL 初始化脚本 |
| `docker/prometheus/prometheus.yml` | Prometheus 配置 |

### 运维脚本

| 脚本 | 说明 |
|------|------|
| `deploy.sh` | 完整部署脚本 |
| `start.sh` | 快速启动脚本 |
| `scripts/backup.sh` | 数据备份脚本 |
| `scripts/test_api.sh` | API 测试脚本 |

### 配置文件

| 文件 | 说明 |
|------|------|
| `.env.example` | 环境变量模板 |
| `requirements.txt` | 生产环境 Python 依赖 |
| `requirements-dev.txt` | 开发环境 Python 依赖 |

## 目录用途说明

### `/app` - 应用代码

包含所有 Python 应用代码，按模块组织：
- `api/` - API 端点实现
- `auth/` - 认证和安全
- `middleware/` - 请求中间件
- `models/` - 数据模型
- `services/` - 业务逻辑
- `utils/` - 工具函数

### `/config` - 配置文件

存储不同环境的配置文件：
- 开发环境配置
- 生产环境配置
- 测试环境配置

### `/docker` - Docker 配置

Docker 相关的所有配置文件：
- 镜像构建
- 服务编排
- 代理配置
- 监控配置

### `/scripts` - 运维脚本

自动化运维脚本：
- 部署脚本
- 备份脚本
- 测试脚本
- 维护脚本

### `/data` - 数据持久化

服务运行时产生的数据：
- 数据库文件
- Redis 数据
- 监控数据
- 应用数据

### `/logs` - 日志文件

所有服务的日志输出：
- 应用日志
- Nginx 日志
- 系统日志
- 错误日志

### `/backup` - 备份文件

系统备份和快照：
- 数据库备份
- 配置备份
- 数据备份
- 历史备份

## 开发流程

### 1. 本地开发

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements-dev.txt

# 设置环境变量
export FLASK_ENV=development

# 运行应用
python app.py
```

### 2. Docker 开发

```bash
# 启动开发环境
docker-compose up

# 查看日志
docker-compose logs -f api

# 重启服务
docker-compose restart
```

### 3. 添加新 API

1. 在 `app/api/v2/` 创建新的蓝图文件
2. 实现端点函数
3. 在 `app/api/v2/__init__.py` 注册蓝图
4. 编写测试用例

### 4. 数据库迁移

```bash
# 创建迁移
flask db migrate -m "description"

# 应用迁移
flask db upgrade
```

## 部署流程

### 1. 准备环境

```bash
# 复制配置文件
cp .env.example .env

# 编辑配置
nano .env
```

### 2. 启动服务

```bash
# 使用部署脚本
./deploy.sh

# 或手动启动
docker-compose up -d
```

### 3. 验证服务

```bash
# 运行测试
./scripts/test_api.sh

# 检查健康状态
curl http://localhost:8080/api/v2/health
```

## 扩展建议

### 添加新功能

1. 在 `app/api/v2/` 添加新的蓝图
2. 在 `app/services/` 实现业务逻辑
3. 在 `app/models/` 添加数据模型
4. 更新文档和测试

### 集成第三方服务

1. 在 `requirements.txt` 添加依赖
2. 在 `config/config.py` 添加配置
3. 在 `app/services/` 创建服务适配器
4. 更新环境变量模板

### 提升性能

1. 启用 Redis 缓存
2. 使用 Celery 异步任务
3. 配置数据库连接池
4. 启用 CDN
5. 实施负载均衡
