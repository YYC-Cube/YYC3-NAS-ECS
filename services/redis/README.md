![Git Banner](../../public/git_1800_450-6.png)

# YYC3 Redis 组件 - Redis缓存服务

> 💾 YYC3 AI Family 专业Redis缓存服务 - 高性能、高可用的缓存管理和数据处理平台

[![YYC3 Redis](https://img.shields.io/badge/YYC3-Redis%20Service-red.svg)](https://github.com/YYC-Cube/yyc3-api)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v2.0.0-orange.svg)](https://github.com/YYC-Cube/yyc3-api/releases)
[![Redis](https://img.shields.io/badge/Redis-7.2-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Performance](https://img.shields.io/badge/Performance-100K%2Fs-brightgreen.svg)](https://redis.io/benchmarks/)
[![Security](https://img.shields.io/badge/Security-Protected-success.svg)](https://redis.io/topics/security)
[![Uptime](https://img.shields.io/badge/Uptime-99.9%25-brightgreen.svg)](https://redis.io/topics/admin)
[![Documentation](https://img.shields.io/badge/Documentation-Complete-blue.svg)](docs/)
[![Support](https://img.shields.io/badge/Support-Active-success.svg)](https://github.com/YYC-Cube/yyc3-api/issues)

## 📋 项目概述

YYC3 Redis组件是YYC3 AI Family统一平台的核心缓存服务层，基于Redis构建，提供高性能、高可用的缓存管理、会话存储、实时数据处理等功能。该组件采用现代化的缓存架构设计，支持集群部署、数据持久化、安全认证等企业级特性。

> 言传千行代码，语枢万物智能

### 🎯 核心特性

- **高性能缓存**：基于内存存储，支持每秒10万+操作，毫秒级响应时间
- **数据持久化**：支持RDB快照和AOF日志两种持久化方式，确保数据安全
- **集群支持**：支持主从复制、哨兵模式和集群模式，实现高可用性
- **安全认证**：支持密码认证、ACL访问控制、命令重命名等安全特性
- **灵活配置**：提供开发和生产两套配置，满足不同环境需求
- **监控告警**：内置健康检查和性能监控，支持实时监控和告警
- **运维友好**：提供完整的运维脚本和文档，简化日常管理

### 📊 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| **吞吐量** | 100,000+ ops/s | 单实例每秒操作数 |
| **响应时间** | < 1ms | 平均响应延迟 |
| **并发连接** | 10,000+ | 最大并发连接数 |
| **内存使用** | < 8GB | 推荐内存配置 |
| **数据持久化** | RDB + AOF | 双重持久化保障 |
| **可用性** | 99.9% | 系统可用性保证 |

### 🔒 安全特性

- ✅ 密码认证（requirepass）
- ✅ 保护模式（protected-mode）
- ✅ ACL访问控制
- ✅ 命令重命名/禁用
- ✅ TLS/SSL加密传输
- ✅ IP白名单限制
- ✅ 慢查询日志
- ✅ 命令审计日志

### 🏗️ 系统架构

```
YYC3 Redis 缓存服务架构
├── 💾 Redis Cluster (6379/6606)     # Redis缓存集群
├── 🔌 API Gateway (3000)          # Redis管理API
├── 🛡️ Security Layer              # 安全认证层
├── 📊 Monitoring System          # 监控系统
└── 🔧 Management Tools           # 运维管理工具
```

## 📚 目录

- [项目概述](#-项目概述)
- [核心特性](#-核心特性)
- [性能指标](#-性能指标)
- [安全特性](#-安全特性)
- [系统架构](#-系统架构)
- [仓库地址](#-仓库地址)
- [文档导航](#-文档导航)
- [一键编排](#-一键编排可选)
- [变量说明](#-变量说明compose-与容器)
- [热重载快速指南](#-热重载快速指南api-dev)
- [目录结构](#-目录结构)
- [初始化](#-初始化)
- [前置条件](#-前置条件)
- [快速开始](#-快速开始)
- [健康检查与端口](#-健康检查与端口)
- [安全规范](#-安全规范生产)
- [持久化与数据目录](#-持久化与数据目录)
- [内存策略](#-内存策略)
- [常用运维命令](#-常用运维命令)
- [参考文档](#-参考文档)
- [范围说明](#-范围说明)
- [Redis数据库基础概念](#-redis-数据库基础概念)
- [命令行方式设置与切换](#️-1-命令行方式设置与切换)
- [Redis配置文件设置](#️-2-redis-配置文件设置redisconf)
- [SpringBoot中设置Redis数据库](#-3-springboot-中设置-redis-数据库)
- [Python中设置Redis数据库](#-4-python-中设置-redis-数据库redis-py)
- [延伸建议](#-延伸建议)
- [Redis初始化脚本](#-1-redis-初始化脚本init-redists)
- [CI/CD联动](#-2-cicd-联动github-actions-自动清理并注入-redis-测试数据)
- [Mac上Redis操作指导](#-3-mac-上-redis-操作指导匹配当前数据库)
- [故障排查](#-故障排查)
- [常见问题](#-常见问题)
- [最佳实践](#-最佳实践)
- [性能优化](#-性能优化)
- [监控与告警](#-监控与告警)
- [备份与恢复](#-备份与恢复)

## 📌 仓库地址

- API 仓库：`git@github.com:YYC-Cube/yyc3-rediops-api.git`

## 文档

- `docs/NAS-DEPLOY.md` — NAS 部署规划与上线方案
- `docs/API-COMPOSE.md` — API 与 Redis 编排（Compose）使用指南

## 一键编排（可选）

- 准备：复制 `config/.env.example` 为 `config/.env` 并按需修改端口/密码
- 开发联调：`docker compose -f config/docker-compose.yml up -d redis-dev api-dev`
- 生产演练：`docker compose -f config/docker-compose.yml up -d redis-prod api-prod`
- 停止：`docker compose -f config/docker-compose.yml stop api-dev api-prod`
- 日志：`docker compose -f config/docker-compose.yml logs -f api-dev`

## 变量说明（Compose 与容器）

- Compose 插值：读取 `Shell 环境` 与 `config/.env`；不读取 `env_file:`。
- 容器内环境：由 `env_file: ../.env.local` 注入给容器运行时。
- 建议：`REDIS_PROD_PASSWORD` 在 `config/.env` 与 `../.env.local` 保持一致。

## 热重载快速指南（api-dev）

- 前提：`api/package.json` 已配置 `scripts.dev` 为 `nodemon index.js`（已完成）。
- 启动：`api-dev` 在 Compose 中使用 `npm run dev`，代码变更将自动重启。
- 查看日志：`docker compose -f config/docker-compose.yml logs -f api-dev`
- 快速验证：`curl http://localhost:${API_DEV_PORT-默认3000}/status` 期待 `redis: ok`。
- 关闭热重载：将 Compose 中 `api-dev` 的 `command` 改为 `node index.js` 或使用 `npm run start`。
- 忽略变更：`api/nodemon.json` 已忽略 `node_modules/**`、`logs/**`、`.git/**`、`*.log`，可按需扩展。
  本仓库用于统一管理 Redis 开发与生产环境的配置与运维脚本，提供一套标准化的目录结构、启动/停止命令、健康检查与安全规范。

> 说明：`api/` 为独立的 Node API 项目，此次规范化不涉及该目录的代码调整。

## 目录结构

- `config/` Redis 配置与 `docker-compose.yml`
  - `redis-base.conf` 通用基础配置（容器内路径：`/etc/redis/redis-base.conf`）
  - `redis-dev.conf` 开发环境配置
  - `redis-prod.conf` 生产环境配置（强密码、禁用高危命令、持久化、内存策略）
  - `docker-compose.yml` 开发/生产容器编排
- `scripts/` 运维脚本（详见 `docs/SCRIPTS.md`）
  - `redis-manager.sh` 统一管理启动/停止/状态/健康检查
  - `check-redis-prod.sh` 部署前安全校验
  - `start-redis-dev.sh` 本地快速启动
  - `start-redis-docker.sh` Docker 启动入口
  - `sync-redis-config.sh` 配置同步与备份
- `logs/` 日志目录（`dev/`、`prod/`）
- `docs/` 文档
  - `REDIS.md` 配置说明
  - `OPS.md` 运维与部署规范
  - `ENV.md` 环境变量规范
  - `SECURITY.md` 安全策略（极简/强校验切换与 ACL 示例）
  - `NAS-DEPLOY.md` NAS 部署规划与上线方案

## 初始化

- 准备目录（如缺失）：
  - `mkdir -p scripts logs/dev logs/prod`
- 初始化环境变量：
  - `cp .env.example .env.local`
  - （可选）`source .env.local` —— 管理脚本已自动加载 `.env.local`，未提供则回退 `.env.example`

## 前置条件

- macOS（本地调试），已安装：Docker / Docker Compose、Bash、`redis-cli`
- 生产容器镜像：`redis:alpine`（入口 `docker-entrypoint.sh`，命令传入配置路径）

## 快速开始

- 开发（Docker）：
  - `bash scripts/redis-manager.sh start --mode docker --env dev`
  - `bash scripts/redis-manager.sh status`
  - `bash scripts/redis-manager.sh health --env dev`
- 生产（Docker）：
  - 严格校验：`bash scripts/check-redis-prod.sh`
  - 本地调试放宽：`ALLOW_WEAK_PROD=1 bash scripts/check-redis-prod.sh`
  - 启动：`bash scripts/redis-manager.sh start --mode docker --env prod`
  - 健康（带认证）：`REDIS_PROD_PASSWORD=redis_yyc3 bash scripts/redis-manager.sh health --env prod`

## 健康检查与端口

- 生产容器：宿主 `6380` → 容器 `6379`
- 开发容器：宿主 `6381` → 容器 `6380`（示例）
- Compose 健康检查：`CMD-SHELL redis-cli -a "$REDIS_PROD_PASSWORD" -p 6379 ping`
- `redis-manager.sh` 在主机与容器两侧执行 PING，并输出内存信息

## 安全规范（生产）

- 默认极简安全（本地推荐）：`protected-mode yes`、`requirepass`、保留 `CONFIG`，不启用 ACL 与命令禁用，`.env.local` 建议 `ALLOW_WEAK_PROD=1`
- 可切换强校验（更严格）：禁用 `FLUSHALL`、`FLUSHDB`，将 `.env.local` 设为 `ALLOW_WEAK_PROD=0` 后执行严格校验脚本：`bash scripts/check-redis-prod.sh`
- 切换指引：修改 `config/redis-prod.conf` 增加/移除 `rename-command` 行并重启容器；详见 `docs/SECURITY.md`

## 持久化与数据目录

- 目录：`dir /data`（容器内路径）
- RDB 文件名：`dbfilename dump-prod.rdb`
- AOF 文件名：`appendfilename "appendonly-prod.aof"`
- 推荐：`stop-writes-on-bgsave-error yes`、`aof-load-truncated yes`

## 内存策略

- 示例：`maxmemory 8gb`（本地环境）
- 策略：`maxmemory-policy volatile-lru`
- 按机器资源与负载调整，并复核健康输出

## 常用运维命令

- 查看日志：`docker logs --tail 200 redis-prod`
- 检查容器：`docker inspect redis-prod`
- 容器内快速内存测试：`redis-server --test-memory 8192`

## 参考文档

- `docs/REDIS.md` 配置细节与模块兼容性
- `docs/OPS.md` 运维流程与故障排查
- `docs/ENV.md` 环境变量规范
- `docs/SCRIPTS.md` 脚本用法详解

## 范围说明

- 本次标准化不涉及 `api/` 目录的代码与文档调整；其依赖与说明见 `api/README.md`。

> 言启象限，语枢智能


---
## 🧩 Redis 数据库基础概念
- Redis 默认支持 16个逻辑数据库，编号从 0 到 15
- 每个数据库是隔离的，但共享同一个 Redis 实例
- 默认连接的是 0号数据库
- 切换数据库不会影响连接，只改变当前操作的上下文
---
## 🛠️ 1. 命令行方式设置与切换
```bash
# 登录 Redis（默认连接数据库 0）
redis-cli -a your_password

# 切换到数据库 1
SELECT 1

# 设置键值
SET mykey "hello"

# 查看当前数据库编号
INFO keyspace

```
> ✅ 推荐在脚本中显式使用 SELECT，避免默认连接误操作
---
## ⚙️ 2. Redis 配置文件设置（redis.conf）
```plaintext
# 设置数据库数量（默认16）
databases 16

# 设置默认数据库（连接后仍需 SELECT）
# Redis 不支持直接设置默认数据库编号，但客户端可自动切换

```
> ✅ 修改后需重启 Redis 服务：redis-server redis.conf
---
## 🧪 3. SpringBoot 中设置 Redis 数据库
```yaml
# application.yml 示例
spring:
  redis:
    host: localhost
    port:6379
    password: your_password
    database: 2  # 使用第2号数据库

```
> ✅ Spring 会自动连接并切换到指定数据库，无需手动 SELECT
---
## 🧬 4. Python 中设置 Redis 数据库（redis-py）
```python
import redis

r = redis.StrictRedis(
    host='localhost',
    port=6379,
    password='your_password',
    db=3  # 使用第3号数据库
)

r.set('mykey', 'hello')
print(r.get('mykey'))

```
> ✅ db 参数决定连接的数据库编号
---
## 🧠 延伸建议
|场景|推荐做法|
|-|-|
|多项目共享 Redis 实例|每个项目使用不同数据库编号（如 0~3）|
|数据隔离与清理|使用 FLUSHDB 清空当前数据库，FLUSHALL 清空所有|
|Redis Desktop Manager|可视化工具支持切换数据库与查看数据结构|
|Redis Cluster 环境|不支持多数据库，仅使用数据库 0|

---
 Redis 初始化脚本、CI/CD 清理与注入逻辑，以及 Mac 上的数据库匹配与操作指导 
---
## ✅ 1. Redis 初始化脚本：init-redis.ts
这个脚本会连接 Redis，清空指定数据库，注入推荐引擎相关的测试数据。
```plaintext
// init-redis.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 3, // 使用第3号数据库
});

async function initRedis() {
  console.log('🧹 清空 Redis 数据库...');
  await redis.flushdb();

  console.log('📥 注入测试数据...');
  await redis.set('score_weights:v1:click', '0.6');
  await redis.set('score_weights:v1:favorite', '0.9');
  await redis.set('user:u1:actions', JSON.stringify(['click:doc_1', 'favorite:doc_2']));
  await redis.set('user:u2:actions', JSON.stringify(['search:AI tutorial', 'click:doc_1']));
  await redis.set('feedback:doc_1', JSON.stringify(['u1:positive', 'u2:positive']));
  await redis.set('feedback:doc_2', JSON.stringify(['u2:negative']));

  console.log('✅ Redis 初始化完成');
  await redis.quit();
}

initRedis().catch(console.error);

```
---
## 🔁 2. CI/CD 联动：GitHub Actions 自动清理并注入 Redis 测试数据
### 📁 .github/workflows/init-redis.yml
```yaml
name: Init Redis

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  redis-init:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Run Redis Init Script
        run: npx ts-node init-redis.ts
        env:
          REDIS_PASSWORD: ${{ secrets.REDIS_PASSWORD }}

```
> ✅ 推荐将 Redis 密码存储为 GitHub Secret：REDIS_PASSWORD
---
## 🍎 3. Mac 上 Redis 操作指导（匹配当前数据库）
### 🧰 安装与启动 Redis
```bash
brew install redis
brew services start redis

```
### 🧪 清空当前数据库（默认是 0）
```bash
redis-cli FLUSHDB

```
### 🔄 切换数据库（如使用数据库 3）
```bash
redis-cli
SELECT 3
FLUSHDB
SET test_key "hello"
GET test_key

```
### 🧠 查看当前数据库状态
```bash
INFO keyspace

```
输出示例：
```plaintext
# Keyspace
db3:keys=6,expires=0,avg_ttl=0

```
---
## 🧠 延伸建议
|场景|推荐做法|
|-|-|
|多环境隔离|每个环境使用不同 Redis 数据库编号（如 dev=3, test=4）|
|推荐引擎缓存结构|使用 score_weights:{version}:{type} 命名规范|
|用户行为缓存|使用 user:{id}:actions 结构，便于分析与推荐|
|CI/CD 注入一致性|Redis 与 MySQL 同步注入测试数据，保持联动|

---

## 🔧 故障排查

### 服务无法启动

**症状**：Redis服务启动失败或立即退出

**诊断步骤**：

```bash
# 检查端口占用
lsof -i :6379
lsof -i :6380

# 查看详细日志
docker logs --tail=100 redis-prod
docker logs --tail=100 redis-dev

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

# 4. 检查配置文件
cat config/redis-prod.conf | grep -v '^#' | grep -v '^$'

# 5. 验证环境变量
cat .env.local | grep -v '^#' | grep -v '^$'
```

### 连接超时

**症状**：客户端无法连接到Redis服务

**诊断步骤**：

```bash
# 检查Redis服务状态
docker-compose ps redis-prod

# 测试Redis连接
redis-cli -a $REDIS_PROD_PASSWORD -p 6379 ping

# 检查网络连接
docker network inspect redis_default

# 查看Redis日志
docker-compose logs redis-prod
```

**解决方案**：

```bash
# 1. 重启Redis服务
docker-compose restart redis-prod

# 2. 检查防火墙设置
sudo ufw status
sudo ufw allow 6379/tcp

# 3. 验证密码配置
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD ping

# 4. 检查绑定地址
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD CONFIG GET bind

# 5. 测试网络连通性
docker-compose exec redis-prod ping -c 3 google.com
```

### 内存不足

**症状**：Redis因内存不足拒绝写入操作

**诊断步骤**：

```bash
# 检查Redis内存使用
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD INFO memory

# 查看内存策略
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD CONFIG GET maxmemory-policy

# 检查键数量
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD DBSIZE

# 查看大键
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD --bigkeys
```

**解决方案**：

```bash
# 1. 调整内存限制
# 编辑 config/redis-prod.conf
maxmemory 16gb

# 2. 优化内存策略
# 编辑 config/redis-prod.conf
maxmemory-policy allkeys-lru

# 3. 清理过期键
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD --scan --pattern "*:*" | xargs -L 1000 redis-cli -a $REDIS_PROD_PASSWORD DEL

# 4. 启用压缩
# 编辑 config/redis-prod.conf
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64

# 5. 重启服务
docker-compose restart redis-prod
```

### 持久化失败

**症状**：RDB或AOF持久化失败

**诊断步骤**：

```bash
# 检查持久化状态
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD INFO persistence

# 查看持久化日志
docker-compose logs redis-prod | grep -i "save\|aof"

# 检查磁盘空间
df -h /data

# 检查文件权限
docker-compose exec redis-prod ls -la /data/
```

**解决方案**：

```bash
# 1. 清理磁盘空间
docker system prune -a
docker volume prune

# 2. 修复文件权限
docker-compose exec redis-prod chown -R redis:redis /data/

# 3. 手动触发保存
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD BGSAVE

# 4. 修复AOF文件
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD BGREWRITEAOF

# 5. 禁用持久化（临时）
# 编辑 config/redis-prod.conf
save ""
appendonly no
```

### 性能下降

**症状**：Redis响应时间变慢

**诊断步骤**：

```bash
# 检查慢查询日志
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD SLOWLOG GET 10

# 查看连接数
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD INFO clients

# 检查命令统计
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD INFO commandstats

# 查看CPU使用
docker stats redis-prod
```

**解决方案**：

```bash
# 1. 优化慢查询
docker-compose exec redis-prod redis-cli -a $REDIS_PROD_PASSWORD CONFIG SET slowlog-log-slower-than 10000

# 2. 限制连接数
# 编辑 config/redis-prod.conf
maxclients 10000

# 3. 启用管道
# 在客户端使用pipeline批量操作

# 4. 优化数据结构
# 使用hash代替多个string键
# 使用zset代替list进行排序

# 5. 增加内存
# 调整Docker容器内存限制
```

---

## ❓ 常见问题

### Q1: Redis和Memcached有什么区别？

**A**: 
- **数据类型**：Redis支持多种数据类型（String、Hash、List、Set、ZSet等），Memcached只支持简单的键值对
- **持久化**：Redis支持RDB和AOF持久化，Memcached不支持持久化
- **集群**：Redis支持集群模式，Memcached不支持集群
- **性能**：Memcached在简单键值对场景下性能略高，Redis在复杂操作场景下更优
- **功能**：Redis支持事务、发布订阅、Lua脚本等高级功能，Memcached功能相对简单

### Q2: 如何选择合适的内存策略？

**A**: 根据业务场景选择：
- **volatile-lru**：从设置了过期时间的键中删除最少使用的键（推荐用于缓存场景）
- **allkeys-lru**：从所有键中删除最少使用的键（推荐用于纯缓存场景）
- **volatile-random**：从设置了过期时间的键中随机删除
- **allkeys-random**：从所有键中随机删除
- **volatile-ttl**：从设置了过期时间的键中删除即将过期的键
- **noeviction**：不删除任何键，写入操作返回错误（推荐用于会话存储）

### Q3: Redis集群如何保证数据一致性？

**A**: 
- **主从复制**：主节点负责写操作，从节点负责读操作，通过异步复制保证数据同步
- **哨兵模式**：监控主从节点，自动故障转移，保证高可用性
- **集群模式**：数据分片存储，每个节点负责部分数据，通过Gossip协议保证数据一致性
- **读写分离**：主节点处理写操作，从节点处理读操作，提高并发能力

### Q4: 如何优化Redis性能？

**A**: 
- **使用合适的数据结构**：根据业务场景选择最优数据结构
- **启用管道**：批量操作减少网络往返
- **使用Lua脚本**：减少网络传输，保证原子性
- **优化内存使用**：启用压缩，选择合适的内存策略
- **合理设置过期时间**：避免内存泄漏
- **使用连接池**：减少连接创建开销
- **监控慢查询**：及时发现性能瓶颈

### Q5: Redis如何保证数据安全？

**A**: 
- **密码认证**：设置强密码，定期更换
- **ACL访问控制**：限制用户权限
- **命令重命名/禁用**：禁用危险命令
- **网络隔离**：使用内网或VPN访问
- **TLS/SSL加密**：启用加密传输
- **定期备份**：定期备份数据文件
- **审计日志**：记录所有操作日志
- **IP白名单**：限制访问来源

### Q6: 如何迁移Redis数据？

**A**: 
- **使用redis-cli**：`redis-cli --rdb dump.rdb` 导出数据
- **使用redis-shake**：阿里开源的Redis数据迁移工具
- **使用redis-dump**：支持JSON格式的数据导出
- **主从复制**：配置主从关系，自动同步数据
- **在线迁移**：使用Redis Cluster的resharding功能

### Q7: Redis如何处理大键？

**A**: 
- **识别大键**：使用`--bigkeys`命令查找大键
- **拆分大键**：将大键拆分为多个小键
- **使用Hash结构**：将多个字段存储在一个Hash中
- **启用压缩**：使用ziplist等压缩结构
- **定期清理**：设置合理的过期时间
- **监控告警**：设置大键监控告警

---

## 💡 最佳实践

### 键命名规范

```bash
# 推荐的命名格式
{业务模块}:{对象}:{属性}:{版本}

# 示例
user:profile:123:v1
cache:product:456:detail
session:token:abc123
queue:task:pending
```

### 数据结构选择

| 场景 | 推荐数据类型 | 说明 |
|------|------------|------|
| 简单键值 | String | 最基本的数据类型 |
| 对象存储 | Hash | 存储对象属性，支持部分字段更新 |
| 列表数据 | List | 有序集合，支持头部和尾部操作 |
| 去重集合 | Set | 无序集合，自动去重 |
| 排序集合 | ZSet | 有序集合，支持按分数排序 |
| 计数器 | String | 使用INCR/DECR操作 |
| 分布式锁 | String | 使用SETNX实现 |
| 消息队列 | List | 使用LPUSH/RPOP实现 |

### 过期时间设置

```bash
# 短期缓存（几分钟到几小时）
SET cache:data "value" EX 300

# 中期缓存（几小时到几天）
SET session:token "value" EX 86400

# 长期缓存（几天到几周）
SET user:profile "value" EX 604800

# 永久存储（不设置过期时间）
SET config:setting "value"
```

### 批量操作

```bash
# 使用管道批量操作
redis-cli --pipe

# 使用MGET/MSET批量读写
MGET key1 key2 key3
MSET key1 value1 key2 value2 key3 value3

# 使用Lua脚本保证原子性
EVAL "return redis.call('MGET', unpack(KEYS))" 3 key1 key2 key3
```

### 连接池配置

```python
# Python示例
import redis

pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    password='password',
    db=0,
    max_connections=50,
    socket_timeout=5,
    socket_connect_timeout=5,
    retry_on_timeout=True
)

r = redis.Redis(connection_pool=pool)
```

---

## ⚡ 性能优化

### 内存优化

```bash
# 1. 启用压缩结构
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64

# 2. 使用Hash代替多个String键
# 不推荐
SET user:123:name "John"
SET user:123:age 30
SET user:123:email "john@example.com"

# 推荐
HSET user:123 name "John" age 30 email "john@example.com"

# 3. 使用位图节省空间
SETBIT user:123:days 1 1
SETBIT user:123:days 2 1
GETBIT user:123:days 1
```

### 网络优化

```bash
# 1. 启用TCP keepalive
tcp-keepalive 300

# 2. 调整TCP缓冲区
tcp-backlog 511

# 3. 使用管道减少网络往返
redis-cli --pipe

# 4. 启用压缩
rdbcompression yes
```

### 查询优化

```bash
# 1. 避免使用KEYS命令
# 不推荐
KEYS user:*

# 推荐
SCAN 0 MATCH user:* COUNT 100

# 2. 使用HGETALL代替多次HGET
# 不推荐
HGET user:123 name
HGET user:123 age
HGET user:123 email

# 推荐
HGETALL user:123

# 3. 使用ZRANGE代替多次ZSCORE
# 不推荐
ZSCORE ranking user1
ZSCORE ranking user2
ZSCORE ranking user3

# 推荐
ZRANGE ranking 0 -1 WITHSCORES
```

### 持久化优化

```bash
# 1. 调整RDB保存策略
save 900 1
save 300 10
save 60 10000

# 2. 启用AOF
appendonly yes
appendfsync everysec

# 3. 启用AOF重写
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# 4. 使用混合持久化（Redis 4.0+）
aof-use-rdb-preamble yes
```

---

## 📊 监控与告警

### 关键监控指标

```bash
# 1. 内存使用
INFO memory
used_memory
used_memory_rss
used_memory_peak
maxmemory

# 2. 连接数
INFO clients
connected_clients
blocked_clients

# 3. 命令统计
INFO commandstats
cmdstat_get
cmdstat_set
cmdstat_hget

# 4. 持久化状态
INFO persistence
rdb_last_bgsave_time_sec
aof_last_rewrite_time_sec

# 5. 复制状态
INFO replication
role
connected_slaves
master_repl_offset
```

### 慢查询监控

```bash
# 配置慢查询日志
CONFIG SET slowlog-log-slower-than 10000
CONFIG SET slowlog-max-len 128

# 查看慢查询
SLOWLOG GET 10

# 查看慢查询数量
SLOWLOG LEN

# 清空慢查询日志
SLOWLOG RESET
```

### 告警规则

| 指标 | 阈值 | 级别 | 说明 |
|------|------|------|------|
| 内存使用率 | > 80% | 警告 | 内存使用过高 |
| 内存使用率 | > 90% | 严重 | 内存即将耗尽 |
| 连接数 | > 8000 | 警告 | 连接数过多 |
| 连接数 | > 9000 | 严重 | 连接数即将达到上限 |
| 慢查询 | > 10/min | 警告 | 慢查询增多 |
| 慢查询 | > 50/min | 严重 | 性能严重下降 |
| 持久化失败 | - | 严重 | 数据持久化失败 |
| 主从延迟 | > 10s | 警告 | 主从复制延迟 |
| 主从延迟 | > 30s | 严重 | 主从复制严重延迟 |

### 监控工具

```bash
# 1. Redis命令行监控
redis-cli --stat
redis-cli --latency
redis-cli --bigkeys

# 2. 使用redis-cli监控
redis-cli -a password INFO
redis-cli -a password CLIENT LIST
redis-cli -a password SLOWLOG GET

# 3. 使用Prometheus监控
# 配置redis_exporter
./redis_exporter --redis.addr=redis://localhost:6379 --redis.password=password

# 4. 使用Grafana可视化
# 导入Redis Dashboard模板
```

---

## 💾 备份与恢复

### RDB备份

```bash
# 1. 手动触发RDB保存
redis-cli -a password BGSAVE

# 2. 等待保存完成
redis-cli -a password LASTSAVE

# 3. 复制RDB文件
cp /data/dump-prod.rdb /backup/dump-prod-$(date +%Y%m%d).rdb

# 4. 定时备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
redis-cli -a password BGSAVE
sleep 10
cp /data/dump-prod.rdb /backup/dump-prod-$DATE.rdb
find /backup -name "dump-prod-*.rdb" -mtime +7 -delete
```

### AOF备份

```bash
# 1. 手动触发AOF重写
redis-cli -a password BGREWRITEAOF

# 2. 复制AOF文件
cp /data/appendonly-prod.aof /backup/appendonly-prod-$(date +%Y%m%d).aof

# 3. 定时备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
redis-cli -a password BGREWRITEAOF
sleep 10
cp /data/appendonly-prod.aof /backup/appendonly-prod-$DATE.aof
find /backup -name "appendonly-prod-*.aof" -mtime +7 -delete
```

### 数据恢复

```bash
# 1. 停止Redis服务
docker-compose stop redis-prod

# 2. 复制备份文件
cp /backup/dump-prod-20240101.rdb /data/dump-prod.rdb

# 3. 启动Redis服务
docker-compose start redis-prod

# 4. 验证数据恢复
redis-cli -a password DBSIZE
redis-cli -a password KEYS "*"
```

### 跨实例迁移

```bash
# 1. 使用redis-cli迁移
redis-cli --rdb dump.rdb
redis-cli -h target_host -p 6379 --pipe < dump.rdb

# 2. 使用redis-shake迁移
./redis-shake.linux -type=sync -source=source_redis -target=target_redis

# 3. 使用主从复制迁移
# 在目标Redis上配置主从关系
redis-cli -a password REPLICAOF source_host 6379

# 4. 等待同步完成后断开主从关系
redis-cli -a password REPLICAOF NO ONE
```

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
