# YYC3 Rdeis 组件技术文档

> 📋 **文档版本**: v3.0.0 | **更新时间**: 2025-12-08 | **维护团队**: YYC3 AI Family

## 📖 项目概述

YYC3 Rdeis 组件是基于Redis的分布式缓存和会话管理系统，为YYC3 AI Family平台提供高性能的数据存储、缓存、消息队列和实时通信功能。该组件集成了Redis集群管理、API服务、监控仪表板和完整的运维工具链。

### 基本信息

- **项目名称**: YYC3 Rdeis Component
- **版本**: 3.0.0
- **技术栈**: Redis 7.0+ | Node.js 18+ | Express.js | Docker | Kubernetes
- **架构模式**: 分布式缓存集群 + 微服务API
- **部署环境**: 生产环境 (YYC3-121) | 开发环境 (YYC3-33)
- **代码仓库**: `https://github.com/YYC-Cube/yyc3-rdeis.git`

## 🏗️ 系统架构

### 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        YYC3 Rdeis 架构                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   API Gateway   │    │  Management UI  │    │  Monitor Dashboard│  │
│  │     (6606)      │    │     (6607)      │    │     (6608)      │  │
│  │                 │    │                 │    │                 │  │
│  │ • RESTful API   │    │ • 集群管理      │    │ • 实时监控      │  │
│  │ • 认证授权      │    │ • 配置管理      │    │ • 性能分析      │  │
│  │ • 负载均衡      │    │ • 用户权限      │    │ • 告警通知      │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│           │                       │                       │       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Redis 集群层                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │  │
│  │  │ Master-01   │  │ Master-02   │  │ Master-03   │  │Sentinel │  │  │
│  │  │   (6379)    │  │   (6380)    │  │   (6381)    │  │ (26379) │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │  │
│  │           │                │                │                │     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │  │
│  │  │ Slave-01    │  │ Slave-02    │  │ Slave-03    │  │ Cluster │  │  │
│  │  │   (6479)    │  │   (6480)    │  │   (6481)    │  │ Manager│  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│           │                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    数据持久化层                                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │  │
│  │  │   RDB AOF   │  │   Backup    │  │   NAS Sync  │            │  │
│  │  │  Persistence│  │   Storage   │  │   Service   │            │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 核心组件

| 组件 | 端口 | 功能描述 | 技术特性 |
|------|------|----------|----------|
| **Redis API服务** | 6606 | Redis管理API、数据操作接口 | RESTful API, JWT认证 |
| **管理控制台** | 6607 | 集群管理、配置界面、用户权限 | React + Ant Design |
| **监控仪表板** | 6608 | 实时监控、性能分析、告警系统 | WebSocket + ECharts |
| **Redis集群** | 6379-6481 | 分布式缓存、数据存储 | 主从复制 + Sentinel |
| **Cluster Manager** | - | 集群状态管理、故障转移 | Redis Cluster |
| **备份服务** | - | 数据备份、恢复、NAS同步 | 自动化脚本 |

## 📁 项目结构详解

### 目录树结构

```
Rdeis/
├── 📁 api/                    # API服务模块
│   ├── 📄 index.js           # API服务入口
│   ├── 📄 server.js          # Express服务器配置
│   ├── 📄 config.js          # 配置管理
│   ├── 📁 controllers/       # 控制器层
│   │   ├── statusController.js
│   │   └── userController.js
│   ├── 📁 routes/            # 路由定义
│   │   ├── status.js
│   │   └── user.js
│   ├── 📁 middleware/        # 中间件
│   │   ├── auth.js           # JWT认证
│   │   ├── rateLimit.js      # 限流控制
│   │   ├── logger.js         # 日志记录
│   │   └── role.js           # 权限控制
│   ├── 📁 services/          # 业务服务层
│   │   ├── redis.js          # Redis客户端
│   │   ├── config.js         # 配置服务
│   │   └── mail.js           # 邮件服务
│   ├── 📁 models/            # 数据模型
│   │   └── users.js
│   ├── 📁 validators/        # 数据验证
│   ├── 📁 sdk/               # SDK开发包
│   ├── 📁 docs/              # API文档
│   └── 📄 swagger.yaml       # Swagger规范
├── 📁 config/                # Redis配置文件
│   ├── 📄 redis-base.conf    # 基础配置
│   ├── 📄 redis-dev.conf     # 开发环境配置
│   ├── 📄 redis-prod.conf    # 生产环境配置
│   └── 📄 docker-compose.yml # 容器编排配置
├── 📁 scripts/               # 运维脚本
│   ├── 📄 redis-manager.sh   # Redis管理脚本
│   ├── 📄 backup-restore.sh  # 备份恢复脚本
│   ├── 📄 start-redis-docker.sh
│   └── 📄 health-keys.sh     # 健康检查脚本
├── 📁 docs/                  # 项目文档
│   ├── 📄 API-COMPOSE.md     # API组合文档
│   ├── 📄 NAS-DEPLOY.md      # NAS部署文档
│   ├── 📄 OPS.md             # 运维手册
│   └── 📄 SECURITY.md        # 安全配置文档
└── 📄 QUICK_START.md         # 快速开始指南
```

### 核心模块说明

#### 1. API服务 (`api/index.js`)

```javascript
// API服务核心功能
• Redis集群管理接口
• 数据操作CRUD API
• 用户认证与权限控制
• 实时监控数据接口
• 系统配置管理
• 邮件通知服务
```

**主要端点**:
- `GET /api/status` - 系统状态查询
- `GET /api/cluster/info` - 集群信息
- `POST /api/data/set` - 数据设置
- `GET /api/data/get` - 数据获取
- `DELETE /api/data/delete` - 数据删除

#### 2. Redis服务 (`api/services/redis.js`)

```javascript
// Redis客户端核心功能
• 连接池管理
• 主从自动切换
• 集群状态监控
• 数据持久化
• 缓存策略管理
• 性能统计收集
```

**支持的Redis命令**:
- 字符串操作: `GET`, `SET`, `MGET`, `MSET`
- 哈希操作: `HGET`, `HSET`, `HMGET`, `HMSET`
- 列表操作: `LPUSH`, `RPUSH`, `LPOP`, `RPOP`
- 集合操作: `SADD`, `SREM`, `SMEMBERS`
- 有序集合: `ZADD`, `ZREM`, `ZRANGE`
- 发布订阅: `PUBLISH`, `SUBSCRIBE`

#### 3. 管理控制台 (React UI)

```javascript
// 管理控制台核心功能
• 集群拓扑可视化
• 实时性能监控
• 配置参数管理
• 用户权限控制
• 数据查看编辑
• 日志查看分析
```

**主要页面**:
- 仪表板: 集群概览、关键指标
- 节点管理: 主从节点状态管理
- 数据管理: 数据查看、编辑、导入导出
- 配置管理: Redis参数配置、集群配置
- 监控告警: 性能监控、告警规则设置

## 🚀 部署配置

### 环境变量配置

#### 开发环境 (.env.dev)
```bash
# API服务配置
NODE_ENV=development
API_PORT=6606
API_HOST=0.0.0.0

# Redis集群配置
REDIS_CLUSTER_NODES=127.0.0.1:6379,127.0.0.1:6380,127.0.0.1:6381
REDIS_SENTINEL_NODES=127.0.0.1:26379,127.0.0.1:26380,127.0.0.1:26381
REDIS_PASSWORD=dev_redis_password
REDIS_DB=0

# 监控配置
MONITOR_INTERVAL=5000
METRICS_RETENTION_DAYS=7
ALERT_EMAIL_RECIPIENTS=admin@0379.email

# 日志配置
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/rdeis-api.log
LOG_MAX_SIZE=100m
LOG_MAX_FILES=10

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rdeis_dev
DB_USER=dev_user
DB_PASSWORD=dev_password

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=dev@0379.email
SMTP_PASSWORD=dev_mail_password
```

#### 生产环境 (.env.prod)
```bash
# API服务配置
NODE_ENV=production
API_PORT=6606
API_HOST=0.0.0.0

# Redis集群配置
REDIS_CLUSTER_NODES=redis-01.internal:6379,redis-02.internal:6379,redis-03.internal:6379
REDIS_SENTINEL_NODES=sentinel-01.internal:26379,sentinel-02.internal:26379,sentinel-03.internal:26379
REDIS_PASSWORD=prod_redis_secure_password
REDIS_DB=0

# 监控配置
MONITOR_INTERVAL=3000
METRICS_RETENTION_DAYS=30
ALERT_EMAIL_RECIPIENTS=ops@0379.email,admin@0379.email

# 日志配置
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/rdeis/rdeis-api.log
LOG_MAX_SIZE=1g
LOG_MAX_FILES=30

# 数据库配置
DB_HOST=mysql.internal
DB_PORT=3306
DB_NAME=rdeis_prod
DB_USER=prod_user
DB_PASSWORD=prod_secure_password

# 邮件配置
SMTP_HOST=smtp.0379.email
SMTP_PORT=465
SMTP_USER=noreply@0379.email
SMTP_PASSWORD=prod_mail_password

# 安全配置
JWT_SECRET=prod_jwt_secret_key
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=1000

# 备份配置
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
NAS_BACKUP_ENABLED=true
NAS_HOST=backup.nas.internal
NAS_PATH=/backup/redis/
```

### Docker部署

#### Docker Compose配置
```yaml
version: '3.8'

services:
  redis-api:
    build: ./api
    ports:
      - "6606:6606"
    environment:
      - NODE_ENV=production
      - REDIS_CLUSTER_NODES=redis-master-01:6379,redis-master-02:6379,redis-master-03:6379
    depends_on:
      - redis-master-01
      - redis-master-02
      - redis-master-03
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    restart: unless-stopped
    networks:
      - rdeis-network

  redis-manager-ui:
    build: ./ui
    ports:
      - "6607:80"
    environment:
      - REACT_APP_API_URL=http://redis-api:6606
    depends_on:
      - redis-api
    restart: unless-stopped
    networks:
      - rdeis-network

  redis-monitor:
    build: ./monitor
    ports:
      - "6608:80"
    environment:
      - REDIS_API_URL=http://redis-api:6606
      - WS_REDIS_API_URL=ws://redis-api:6606
    depends_on:
      - redis-api
    restart: unless-stopped
    networks:
      - rdeis-network

  redis-master-01:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - ./config/redis-prod.conf:/usr/local/etc/redis/redis.conf
      - redis-data-01:/data
    restart: unless-stopped
    networks:
      - rdeis-network

  redis-master-02:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - ./config/redis-prod.conf:/usr/local/etc/redis/redis.conf
      - redis-data-02:/data
    restart: unless-stopped
    networks:
      - rdeis-network

  redis-master-03:
    image: redis:7-alpine
    ports:
      - "6381:6379"
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - ./config/redis-prod.conf:/usr/local/etc/redis/redis.conf
      - redis-data-03:/data
    restart: unless-stopped
    networks:
      - rdeis-network

  redis-sentinel:
    image: redis:7-alpine
    ports:
      - "26379:26379"
    command: redis-sentinel /usr/local/etc/redis/sentinel.conf
    volumes:
      - ./config/sentinel.conf:/usr/local/etc/redis/sentinel.conf
    depends_on:
      - redis-master-01
      - redis-master-02
      - redis-master-03
    restart: unless-stopped
    networks:
      - rdeis-network

volumes:
  redis-data-01:
  redis-data-02:
  redis-data-03:

networks:
  rdeis-network:
    driver: bridge
```

### Kubernetes部署

#### Helm Chart配置
```yaml
# values.yaml
replicaCount: 3

image:
  repository: yyc3/rdeis-api
  tag: "v3.0.0"
  pullPolicy: Always

service:
  type: ClusterIP
  ports:
    api: 6606
    manager: 6607
    monitor: 6608

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: redis.0379.email
      paths:
        - path: /
          pathType: Prefix
    - host: redis-manager.0379.email
      paths:
        - path: /
          pathType: Prefix

redis:
  cluster:
    enabled: true
    nodes: 3
    resources:
      requests:
        cpu: 100m
        memory: 256Mi
      limits:
        cpu: 500m
        memory: 1Gi

  persistence:
    enabled: true
    size: 10Gi
    storageClass: ssd

monitoring:
  prometheus:
    enabled: true
    serviceMonitor:
      enabled: true

  grafana:
    enabled: true
    dashboard:
      enabled: true

backup:
  enabled: true
  schedule: "0 2 * * *"
  retention: 30
  storage:
    type: s3
    bucket: yyc3-redis-backups
    region: us-east-1
```

## 🔧 API接口文档

### 系统状态接口

#### 获取系统状态
```http
GET /api/status
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-08T06:00:00.000Z",
    "uptime": 86400,
    "version": "3.0.0",
    "cluster": {
      "status": "online",
      "nodes": 6,
      "masters": 3,
      "slaves": 3
    },
    "performance": {
      "operations_per_second": 15420,
      "avg_response_time": 2.3,
      "hit_rate": 0.95,
      "memory_usage": "67%"
    }
  }
}
```

### 集群管理接口

#### 获取集群信息
```http
GET /api/cluster/info
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "cluster_id": "rdeis-cluster-01",
    "cluster_name": "YYC3 Redis Cluster",
    "nodes": [
      {
        "id": "redis-master-01",
        "host": "redis-01.internal",
        "port": 6379,
        "role": "master",
        "status": "online",
        "connected_slaves": 1,
        "memory_used": 536870912,
        "memory_max": 1073741824,
        "keys_count": 15234,
        "operations_per_second": 2340,
        "uptime": 86400,
        "redis_version": "7.0.8"
      }
    ],
    "shards": [
      {
        "id": 0,
        "range": "0-5460",
        "master": "redis-master-01",
        "slaves": ["redis-slave-01"],
        "key_count": 5432
      }
    ],
    "total_keys": 15678,
    "total_memory": 3221225472,
    "max_memory": 3221225472
  }
}
```

### 数据操作接口

#### 设置数据
```http
POST /api/data/set
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "key": "user:session:12345",
  "value": {
    "user_id": 12345,
    "username": "testuser",
    "login_time": "2025-12-08T06:00:00.000Z",
    "ip_address": "192.168.1.100"
  },
  "ttl": 3600,
  "type": "hash",
  "encoding": "utf-8"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "key": "user:session:12345",
    "operation": "SET",
    "ttl": 3600,
    "timestamp": "2025-12-08T06:00:00.000Z",
    "affected_nodes": ["redis-master-01"],
    "execution_time": 2.3
  }
}
```

#### 获取数据
```http
GET /api/data/get?key=user:session:12345
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "key": "user:session:12345",
    "value": {
      "user_id": 12345,
      "username": "testuser",
      "login_time": "2025-12-08T06:00:00.000Z",
      "ip_address": "192.168.1.100"
    },
    "type": "hash",
    "ttl": 3540,
    "encoding": "utf-8",
    "node": "redis-master-01",
    "timestamp": "2025-12-08T06:00:01.000Z"
  }
}
```

#### 删除数据
```http
DELETE /api/data/delete
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "keys": ["user:session:12345", "cache:data:67890"],
  "pattern": null
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "deleted_keys": 2,
    "affected_nodes": ["redis-master-01", "redis-master-02"],
    "execution_time": 1.8,
    "details": [
      {
        "key": "user:session:12345",
        "status": "deleted",
        "node": "redis-master-01"
      },
      {
        "key": "cache:data:67890",
        "status": "deleted",
        "node": "redis-master-02"
      }
    ]
  }
}
```

### 监控接口

#### 获取性能指标
```http
GET /api/monitor/metrics?period=1h&granularity=1m
Authorization: Bearer {token}
```

**查询参数**:
- `period`: 时间范围 (1h, 6h, 24h, 7d)
- `granularity`: 数据粒度 (1m, 5m, 15m, 1h)
- `metrics`: 指标类型 (cpu, memory, operations, latency)

**响应**:
```json
{
  "success": true,
  "data": {
    "period": "1h",
    "granularity": "1m",
    "metrics": {
      "operations_per_second": [
        {
          "timestamp": "2025-12-08T05:00:00.000Z",
          "value": 1234
        },
        {
          "timestamp": "2025-12-08T05:01:00.000Z",
          "value": 1256
        }
      ],
      "memory_usage": [
        {
          "timestamp": "2025-12-08T05:00:00.000Z",
          "value": 67.5
        }
      ],
      "avg_response_time": [
        {
          "timestamp": "2025-12-08T05:00:00.000Z",
          "value": 2.1
        }
      ]
    },
    "summary": {
      "avg_operations_per_second": 1245,
      "peak_operations_per_second": 1567,
      "avg_memory_usage": 67.2,
      "peak_memory_usage": 72.8,
      "avg_response_time": 2.15,
      "p95_response_time": 4.2,
      "p99_response_time": 8.5
    }
  }
}
```

## 📊 监控与运维

### 性能监控

#### 关键指标 (KPIs)

| 指标类别 | 指标名称 | 正常范围 | 告警阈值 | 说明 |
|----------|----------|----------|----------|------|
| **连接性** | 连接数 | < 1000 | > 800 | 当前活跃连接 |
| **性能** | QPS | < 50000 | > 40000 | 每秒操作数 |
| **响应时间** | 平均响应时间 | < 5ms | > 10ms | 平均操作延迟 |
| **内存** | 内存使用率 | < 80% | > 90% | 内存占用百分比 |
| **命中率** | 缓存命中率 | > 95% | < 90% | 缓存效率指标 |
| **网络** | 网络I/O | < 1Gbps | > 800Mbps | 网络带宽使用 |

#### Grafana仪表板配置

```json
{
  "dashboard": {
    "title": "YYC3 Rdeis 监控仪表板",
    "panels": [
      {
        "title": "QPS监控",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(redis_commands_total[1m])",
            "legendFormat": "{{instance}}-{{cmd}}"
          }
        ]
      },
      {
        "title": "内存使用",
        "type": "singlestat",
        "targets": [
          {
            "expr": "redis_memory_used_bytes / redis_memory_max_bytes * 100",
            "legendFormat": "内存使用率"
          }
        ]
      },
      {
        "title": "命中率",
        "type": "singlestat",
        "targets": [
          {
            "expr": "redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) * 100",
            "legendFormat": "缓存命中率"
          }
        ]
      }
    ]
  }
}
```

### 日志管理

#### 日志配置示例

```javascript
// api/middleware/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'rdeis-api' },
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 104857600, // 100MB
      maxFiles: 10
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 104857600, // 100MB
      maxFiles: 10
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### 备份策略

#### 自动备份配置

```bash
#!/bin/bash
# scripts/backup-redis.sh

BACKUP_DIR="/backup/redis"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="redis_backup_${DATE}.rdb"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
redis-cli --rdb $BACKUP_DIR/$BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_DIR/$BACKUP_FILE

# 上传到NAS
scp $BACKUP_DIR/${BACKUP_FILE}.gz backup@nas.internal:/backup/redis/

# 清理本地文件 (保留7天)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

# 记录备份日志
echo "$(date): Redis backup completed - ${BACKUP_FILE}.gz" >> $BACKUP_DIR/backup.log
```

#### 备份调度配置

```yaml
# Kubernetes CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: redis-backup
spec:
  schedule: "0 2 * * *"  # 每天凌晨2点
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: redis-backup
            image: redis:7-alpine
            command:
            - /bin/bash
            - -c
            - |
              redis-cli -h redis-master-01 --rdb /backup/redis-backup-$(date +%Y%m%d_%H%M%S).rdb
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: redis-backup-pvc
          restartPolicy: OnFailure
```

## 🔒 安全配置

### Redis安全配置

#### redis.conf 安全配置
```conf
# 网络安全
bind 0.0.0.0
protected-mode yes
port 6379

# 认证配置
requirepass ${REDIS_PASSWORD}

# TLS配置 (生产环境)
tls-cert-file /etc/ssl/certs/redis.crt
tls-key-file /etc/ssl/private/redis.key
tls-ca-cert-file /etc/ssl/certs/ca.crt
tls-port 6380

# 客户端限制
maxclients 1000
timeout 300

# 命令安全重命名
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG "CONFIG_b835c3f8a8d4e7f2"
rename-command SHUTDOWN "SHUTDOWN_b835c3f8a8d4e7f2"
rename-command DEBUG ""

# 访问日志
loglevel notice
logfile /var/log/redis/redis-server.log
syslog-enabled yes
syslog-ident redis
```

### API安全配置

#### JWT认证中间件
```javascript
// api/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '访问令牌缺失'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '访问令牌无效或已过期'
        }
      });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

#### API限流配置
```javascript
// api/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // 记录限流日志
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '请求频率过高，请稍后重试'
        }
      });
    }
  });
};

// 不同端点的限流策略
const apiLimiter = createRateLimit(15 * 60 * 1000, 1000, '15分钟内最多1000个请求');
const dataLimiter = createRateLimit(15 * 60 * 1000, 5000, '15分钟内最多5000个数据操作请求');
const configLimiter = createRateLimit(60 * 60 * 1000, 50, '1小时内最多50个配置修改请求');

module.exports = {
  apiLimiter,
  dataLimiter,
  configLimiter
};
```

### 网络安全

#### Nginx反向代理配置
```nginx
server {
    listen 443 ssl http2;
    server_name redis.0379.email;

    # SSL配置
    ssl_certificate /etc/letsencrypt/live/0379.email/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/0379.email/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API代理
    location /api/ {
        proxy_pass http://localhost:6606;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时配置
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket支持
    location /ws/ {
        proxy_pass http://localhost:6606;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 🧪 测试配置

### 单元测试

```javascript
// tests/services/redis.test.js
const RedisService = require('../api/services/redis');
const redis = new RedisService();

describe('Redis Service', () => {
  beforeEach(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.disconnect();
  });

  test('SET and GET operations', async () => {
    await redis.set('test:key', 'test:value');
    const value = await redis.get('test:key');
    expect(value).toBe('test:value');
  });

  test('HSET and HGET operations', async () => {
    await redis.hset('test:hash', 'field1', 'value1');
    await redis.hset('test:hash', 'field2', 'value2');

    const value1 = await redis.hget('test:hash', 'field1');
    const value2 = await redis.hget('test:hash', 'field2');

    expect(value1).toBe('value1');
    expect(value2).toBe('value2');
  });

  test('EXPIRE operation', async () => {
    await redis.set('expire:key', 'expire:value');
    await redis.expire('expire:key', 1);

    // 等待过期
    await new Promise(resolve => setTimeout(resolve, 1100));

    const value = await redis.get('expire:key');
    expect(value).toBeNull();
  });
});
```

### 集成测试

```javascript
// tests/integration/api.test.js
const request = require('supertest');
const app = require('../api/server');

describe('API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    // 获取认证token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass'
      });

    authToken = response.body.data.token;
  });

  test('GET /api/status', async () => {
    const response = await request(app)
      .get('/api/status')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
  });

  test('POST /api/data/set', async () => {
    const response = await request(app)
      .post('/api/data/set')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        key: 'integration:test',
        value: 'test data',
        ttl: 3600
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.key).toBe('integration:test');
  });

  test('GET /api/data/get', async () => {
    const response = await request(app)
      .get('/api/data/get?key=integration:test')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.value).toBe('test data');
  });
});
```

### 性能测试

```javascript
// tests/performance/load.test.js
const { performance } = require('perf_hooks');
const RedisService = require('../api/services/redis');

describe('Performance Tests', () => {
  let redis;

  beforeAll(async () => {
    redis = new RedisService();
  });

  test('SET operations performance', async () => {
    const operations = 10000;
    const startTime = performance.now();

    for (let i = 0; i < operations; i++) {
      await redis.set(`perf:test:${i}`, `value:${i}`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const opsPerSecond = (operations / duration) * 1000;

    expect(opsPerSecond).toBeGreaterThan(1000);
    console.log(`SET Performance: ${opsPerSecond.toFixed(2)} ops/sec`);
  });

  test('GET operations performance', async () => {
    // 预设数据
    for (let i = 0; i < 10000; i++) {
      await redis.set(`perf:get:test:${i}`, `value:${i}`);
    }

    const operations = 10000;
    const startTime = performance.now();

    for (let i = 0; i < operations; i++) {
      await redis.get(`perf:get:test:${i}`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const opsPerSecond = (operations / duration) * 1000;

    expect(opsPerSecond).toBeGreaterThan(5000);
    console.log(`GET Performance: ${opsPerSecond.toFixed(2)} ops/sec`);
  });
});
```

## 📋 部署检查清单

### 部署前检查

- [ ] **环境变量配置**
  - [ ] 开发环境变量设置完成
  - [ ] 生产环境变量设置完成
  - [ ] 敏感信息使用环境变量存储

- [ ] **Redis集群配置**
  - [ ] 主节点配置正确
  - [ ] 从节点配置正确
  - [ ] Sentinel配置正确
  - [ ] 集群拓扑验证

- [ ] **安全配置**
  - [ ] Redis密码设置
  - [ ] TLS证书配置
  - [ ] 网络访问控制
  - [ ] 命令权限控制

- [ ] **监控配置**
  - [ ] Prometheus指标配置
  - [ ] Grafana仪表板配置
  - [ ] 告警规则设置
  - [ ] 日志收集配置

### 部署后验证

- [ ] **服务可用性检查**
  ```bash
  # API服务健康检查
  curl -f https://redis.0379.email/api/status

  # Redis集群状态检查
  redis-cli cluster info

  # 节点连通性检查
  redis-cli -h redis-master-01 ping
  ```

- [ ] **性能基准测试**
  ```bash
  # 基础性能测试
  redis-benchmark -h redis-master-01 -c 50 -n 10000

  # API性能测试
  ab -n 1000 -c 10 https://redis.0379.email/api/status
  ```

- [ ] **监控仪表板验证**
  - [ ] Grafana仪表板显示正常
  - [ ] Prometheus指标收集正常
  - [ ] 告警通知测试通过

### 运维手册

#### 故障排查流程

1. **服务无法启动**
   ```bash
   # 检查日志
   journalctl -u rdeis-api -f

   # 检查端口占用
   netstat -tlnp | grep 6606

   # 验证配置文件
   redis-server --test-config /etc/redis/redis.conf
   ```

2. **Redis集群故障**
   ```bash
   # 检查集群状态
   redis-cli cluster nodes

   # 检查主从同步
   redis-cli -h redis-slave-01 info replication

   # Sentinel状态检查
   redis-sentinel ckquorum mymaster
   ```

3. **性能问题排查**
   ```bash
   # 慢查询日志
   redis-cli slowlog get 10

   # 内存使用分析
   redis-cli info memory

   # 客户端连接统计
   redis-cli info clients
   ```

## 📞 技术支持

### 联系方式

- **技术支持**: <dev@0379.email>
- **紧急联系**: 系统告警通知
- **文档更新**: GitHub Wiki

### 相关链接

- **项目仓库**: <https://github.com/YYC-Cube/yyc3-rdeis>
- **API文档**: <https://redis.0379.email/api/docs>
- **监控面板**: <https://redis.0379.email/monitor>
- **管理后台**: <https://redis.0379.email/manager>

### 版本更新日志

#### v3.0.0 (2025-12-08)

**新增功能**:
- ✨ 支持Redis 7.0新特性
- ✨ 集群自动扩缩容功能
- ✨ 增强的监控告警系统
- ✨ 新增数据迁移工具

**性能优化**:
- 🔧 API响应时间优化30%
- 🔧 内存使用效率提升20%
- 🔧 集群故障切换时间缩短至5秒

**安全增强**:
- 🔒 增强TLS 1.3支持
- 🔒 改进访问控制机制
- 🔒 增加审计日志功能

**Bug修复**:
- 🐛 修复高并发下的内存泄漏问题
- 🐛 修复集群脑裂问题
- 🐛 修复监控数据不准确问题

---

<div align="center">

**[⬆️ 回到顶部](#yyc3-rdeis-组件技术文档)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 🚀

</div>