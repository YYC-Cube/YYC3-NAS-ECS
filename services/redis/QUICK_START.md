# YYC3 Rdeis 组件快速开始指南

> 💾 YYC3 AI Family 专业Redis缓存服务 - 快速部署和使用指南

## 📋 概述

本指南将帮助您快速部署和启动YYC3 Rdeis组件的Redis缓存服务，包括Redis服务器、管理API、监控工具等核心功能。

## 🚀 快速部署

### 1. 环境准备

```bash
# 检查Redis版本 (推荐6.0+)
redis-server --version

# 检查Node.js版本 (需要18+)
node --version

# 检查Docker (可选)
docker --version
```

### 2. 项目初始化

```bash
# 克隆项目
git clone https://github.com/YYC-Cube/yyc3-api.git
cd yyc3-22/Rdeis

# 安装依赖
cd api
npm install

# 复制环境配置
cp ../.env.example .env
```

### 3. 一键启动

```bash
# 开发环境 (推荐)
bash scripts/redis-manager.sh start --mode docker --env dev

# 生产环境
bash scripts/redis-manager.sh start --mode docker --env prod

# 本地开发
bash scripts/start-redis-dev.sh
```

## 🔧 Redis服务启动

### Docker方式 (推荐)
```bash
# 启动开发环境Redis
docker compose -f config/docker-compose.yml up -d redis-dev

# 启动生产环境Redis
docker compose -f config/docker-compose.yml up -d redis-prod

# 启动API服务
docker compose -f config/docker-compose.yml up -d api-dev
```

### 本地方式
```bash
# 启动Redis服务器
redis-server config/redis-dev.conf

# 启动API管理服务
cd api
npm start
```

## 🔍 服务验证

### Redis连接测试
```bash
# 测试Redis连通性
redis-cli -a your_password ping

# 测试基本操作
redis-cli -a your_password set test "hello"
redis-cli -a your_password get test
```

### API服务验证
```bash
# 检查API服务状态
curl http://localhost:3000/

# 健康检查
curl http://localhost:3000/health

# 获取Redis信息
curl http://localhost:3000/info
```

### 缓存功能测试
```bash
# 设置缓存
curl -X POST http://localhost:3000/api/ops \
  -H "Content-Type: application/json" \
  -d '{"operation": "set", "key": "test", "value": "Hello YYC3"}'

# 获取缓存
curl -X POST http://localhost:3000/api/ops \
  -H "Content-Type: application/json" \
  -d '{"operation": "get", "key": "test"}'

# 查看统计
curl http://localhost:3000/api/stats
```

## 🗄️ 数据库操作

### Redis数据库管理
```bash
# 登录Redis
redis-cli -a your_password

# 切换数据库 (0-15)
SELECT 1

# 查看当前数据库
INFO keyspace

# 设置键值
SET mykey "value"
GET mykey

# 删除键
DEL mykey

# 清空当前数据库
FLUSHDB

# 查看所有键
KEYS *
```

### 数据库用途说明
| 数据库 | 用途 | 示例 |
|--------|------|------|
| db0 | 服务状态缓存 | `cache:services:status` |
| db1 | 用户会话数据 | `session:user:admin` |
| db2 | API响应缓存 | `cache:api:users:list` |
| db3 | AI模型缓存 | `cache:ai:models` |
| db4 | 系统配置缓存 | `config:system:domain` |

## 🛡️ 安全配置

### 生产环境安全设置
```bash
# 严格安全检查
bash scripts/check-redis-prod.sh

# 允许弱安全配置 (本地测试)
ALLOW_WEAK_PROD=1 bash scripts/check-redis-prod.sh
```

### 密码认证
```redis
# 连接带密码的Redis
redis-cli -a your_strong_password

# 或者使用环境变量
REDIS_PASSWORD=your_strong_password redis-cli
```

### ACL权限控制
```redis
# 查看当前用户
ACL WHOAMI

# 列出所有用户
ACL LIST

# 创建只读用户
ACL USER readonly_user on >~* +@read +@string +@list +@set +@sortedset +@hash +@stream

# 创建读写用户
ACL USER readwrite_user on ~* +@all
```

## 📊 监控管理

### 使用管理脚本
```bash
# 统一管理命令
bash scripts/redis-manager.sh status
bash scripts/redis-manager.sh health --env dev
bash scripts/redis-manager.sh logs
bash scripts/redis-manager.sh stop
```

### 健康检查
```bash
# Redis服务健康检查
bash scripts/health-keys.sh

# 生产环境检查
bash scripts/check-redis-prod.sh
```

### 监控指标
```bash
# 内存使用情况
redis-cli info memory

# 键空间统计
redis-cli info keyspace

# 连接数统计
redis-cli info clients

# 命令统计
redis-cli info stats
```

## 🔧 运维管理

### 备份恢复
```bash
# 创建备份
bash scripts/backup-restore.sh backup

# 恢复数据
bash scripts/backup-restore.sh restore

# 同步配置
bash scripts/sync-redis-config.sh
```

### 配置管理
```bash
# 查看当前配置
CONFIG GET *

# 修改配置 (需要重启)
CONFIG SET maxmemory 2gb
CONFIG SET maxmemory-policy volatile-lru

# 重启Redis
systemctl restart redis
```

### 日志管理
```bash
# 查看Redis日志
tail -f /var/log/redis/redis-server.log

# 查看Docker日志
docker logs -f redis-prod
```

## 🚀 生产部署

### 1. 服务器要求
- **CPU**: 2核心以上
- **内存**: 4GB以上
- **存储**: 20GB以上SSD
- **网络**: 100Mbps以上

### 2. 部署步骤
```bash
# 1. 上传代码
scp -r Rdeis/ root@your-server:/opt/yyc3-rdeis/

# 2. 登录服务器
ssh root@your-server

# 3. 安装依赖
cd /opt/yyc3-rdeis
npm install

# 4. 配置环境
cp .env.example .env
vim .env

# 5. 启动服务
pm2 start ecosystem.config.js
```

### 3. 集群部署 (可选)
```bash
# Redis主从配置
# 配置文件：config/redis-prod.conf
# 从服务器配置：slaveof <master-ip> 6379

# 启动集群
bash scripts/start-redis-cluster.sh
```

## 🔗 服务集成

### 与App组件集成
```bash
# 测试服务集成
curl -X POST http://localhost:6600/api/cache/sync \
  -H "Content-Type: application/json" \
  -d '{"service": "app", "data": {"status": "running"}}'

# 验证缓存数据
curl http://localhost:6606/api/cache
```

### API网关配置
```bash
# Nginx配置示例
server {
    listen 80;
    server_name redis.0379.email;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 监控集成
```bash
# Prometheus配置示例
- job_name: 'redis'
  static_configs:
    - targets: ['localhost:9121']
```

## 🛠️ 开发调试

### 开发环境
```bash
# 热重载Redis配置
redis-server config/redis-dev.conf --port 6380

# 使用nodemon监控API
npm run dev

# 调试模式
node --inspect index.js
```

### 测试数据
```bash
# 初始化测试数据
node scripts/init-test-data.js

# 清理测试数据
node scripts/cleanup-test-data.js
```

### 性能测试
```bash
# 内存测试
redis-server --test-memory 1024

# 性能基准测试
redis-benchmark -h localhost -p 6379 -c 50 -n 10000
```

## 🔧 常见问题

### 连接问题
```bash
# 检查Redis端口
netstat -tlnp | grep 6379

# 检查Redis进程
ps aux | grep redis

# 测试网络连通性
telnet localhost 6379
```

### 内存问题
```bash
# 查看内存使用
redis-cli info memory

# 清理过期键
redis-cli --scan --pattern "expired:*" --exec redis-cli DEL

# 内存优化
CONFIG SET maxmemory-policy allkeys-lru
```

### 权限问题
```bash
# 检查ACL设置
ACL LIST

# 重置ACL权限
ACL LOG RESET

# 添加用户权限
ACL SETUSER default on +@all
```

## 📚 文档资源

### 技术文档
- [完整项目文档](../PROJECT_DOCUMENTATION.md)
- [架构详细说明](ARCHITECTURE.md)
- [Redis配置说明](docs/REDIS.md)
- [部署运维指南](docs/OPS.md)
- [安全配置指南](docs/SECURITY.md)

### API文档
- [API接口文档](api/docs/)
- [SDK使用指南](api/docs/sdk.md)
- [错误代码说明](api/docs/error-codes.md)

### 脚本文档
- [运维脚本说明](docs/SCRIPTS.md)
- [环境变量规范](docs/ENV.md)
- [NAS部署指南](docs/NAS-DEPLOY.md)

## 📞 技术支持

### 联系方式
- **技术支持**: dev@0379.email
- **问题反馈**: https://github.com/YYC-Cube/yyc3-api/issues
- **在线文档**: https://docs.0379.email

### 社区资源
- **Redis官方文档**: https://redis.io/documentation
- **Node.js Redis客户端**: https://github.com/NodeRedis/node-redis
- **Redis监控工具**: https://redis.io/commands

---

## 🎉 成功部署

如果您看到Redis服务正常运行并且API管理界面可以访问，恭喜您已经成功部署了YYC3 Rdeis组件！

**下一步**:
1. 配置域名解析
2. 设置监控告警
3. 开始使用缓存服务
4. 集成到YYC3生态系统

---

<div align="center">

**[⬆️ 回到顶部](#yyc3-rdeis-组件快速开始指南)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 🚀

</div>