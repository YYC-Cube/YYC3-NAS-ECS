# YYC³ 自用前闭环规划报告

**生成时间**: 2025-01-05  
**版本**: 1.0.0  
**审核范围**: 全栈服务集成度、配置衔接、系统完整性

---

## 一、整体架构概览

### 1.1 服务拓扑图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户访问层                             │
│  https://*.0379.email (通过FRP暴露到阿里云)                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              阿里云 ECS (8.152.195.33)                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │  FRP Server (frps) - 端口 7001/7500/18080     │    │
│  │  - Token: yyc3_nas                              │    │
│  │  - 管理: frp.0379.email:7500                   │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │  FRP Tunnel (TLS加密)   │
        └────────────┬────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              本地 NAS (192.168.3.45)                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │  FRP Client (frpc) - 本地端口 6000-6007        │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │  前端管理平台 (Vite+React)           │   │    │
│  │  │  - 端口: 6001 (通过FRP暴露)          │   │    │
│  │  │  - 路径: admin.0379.email           │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  │                                                   │    │
│  │  ┌──────────────────────────────────────────┐   │    │
│  │  │  后端微服务 (Docker/原生)             │   │    │
│  │  │  - API服务: 6000 → api.0379.email   │   │    │
│  │  │  - 邮件服务: 6003 → mail.0379.email │   │    │
│  │  │  - LLM服务: 6002 → llm.0379.email   │   │    │
│  │  │  - Redis: 6379 (内网)              │   │    │
│  │  │  - NAS服务: 6004 → nas.0379.email   │   │    │
│  │  │  - 监控服务: 6006 → monitor.0379.email │   │
│  │  │  - DDNS服务: 6007 → ddns.0379.email │   │    │
│  │  └──────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 端口映射表

| 服务名称 | 本地端口 | FRP子域名 | 公网访问地址 | 状态 |
|---------|---------|-----------|-------------|------|
| 前端管理平台 | 6001 | admin | <https://admin.0379.email> | ✅ 已配置 |
| API网关 | 6000 | api | <https://api.0379.email> | ✅ 已配置 |
| 邮件服务 | 6003 | mail | <https://mail.0379.email> | ✅ 已配置 |
| LLM服务 | 6002 | llm | <https://llm.0379.email> | ✅ 已配置 |
| Redis | 6379 | - (内网) | - | ✅ 已配置 |
| NAS管理 | 6004 | nas | <https://nas.0379.email> | ✅ 已配置 |
| 监控面板 | 6006 | monitor | <https://monitor.0379.email> | ✅ 已配置 |
| DDNS服务 | 6007 | ddns | <https://ddns.0379.email> | ✅ 已配置 |

---

## 二、深度审核结果

### 2.1 ✅ 已完成的工作

#### 2.1.1 FRP内网穿透（已打通）

- **FRP服务器**: 阿里云ECS 8.152.195.33:7001
- **FRP客户端**: 本地NAS配置完成
- **TLS加密**: 已启用证书传输
- **管理面板**: frp.0379.email:7500 (账号: yyc3 / 密码: my151001)
- **验证状态**: 7个服务子域名全部配置完成

#### 2.1.2 DDNS动态域名（已打通）

- **阿里云DDNS配置**:
  - AccessKey: LTAI5t9mLFEztQVUsmeeVbPn
  - 域名: 0379.email
  - 子域名: ddns
  - 自动更新: 每5分钟检查
- **验证状态**: ✅ 已正常运行

#### 2.1.3 前端集成（基本完成）

- ✅ 所有服务页面已集成到主App
- ✅ 路由配置完整 (/mail, /frp, /llm, /ddns, /nas等)
- ✅ 侧边栏导航已配置
- ✅ 主题系统已实现
- ✅ UI组件库完整

#### 2.1.4 后端微服务（结构完整）

- ✅ API服务: Python Flask + Celery (完整架构)
- ✅ 邮件服务: Node.js Express (基础API实现)
- ✅ LLM服务: Python FastAPI (基础AI接口)
- ✅ Redis服务: Docker容器化 + 管理脚本
- ✅ DDNS服务: Shell脚本 + 定时器
- ✅ 监控服务: Prometheus + Grafana

### 2.2 ⚠️ 发现的问题

#### 2.2.1 环境变量管理混乱

**问题**: 存在多个.env文件，配置分散且重复

```
/Users/yanyu/Downloads/YYC3-NAS-ECS/
├── .env.local          # 前端配置 + 服务密钥
├── .env.development    # 开发环境配置
├── .env.staging        # 预发布环境配置  
├── .env.production     # 生产环境配置
└── .env.ports          # 端口配置独立文件

api/.env.example        # API服务示例配置
llm/.env.example        # LLM服务示例配置
mail/.env.example       # 邮件服务示例配置
ddns/.env.local         # DDNS专用配置
redis/.env.local        # Redis专用配置
```

**影响**:

- 配置重复维护，易出错
- 密钥分散，安全风险高
- 环境切换复杂

#### 2.2.2 API接口未完全对接

**问题**: 前端使用Mock数据，未连接真实后端API

```typescript
// src/app/services/api.ts (当前状态)
export const api: ApiService = {
  system: {
    getStats: async (): Promise<SystemStats> => {
      // ❌ 硬编码Mock数据，未调用真实API
      return generateSystemStats();
    }
  }
}
```

**缺失的API接口**:

- `/api/system/stats` - 系统监控数据
- `/api/frp/configs` - FRP配置管理
- `/api/frp/status` - FRP服务状态
- `/api/nas/status` - NAS服务状态
- `/api/nas/volumes` - 存储卷信息
- `/api/nas/shares` - 文件共享配置
- `/api/ddns/status` - DDNS服务状态
- `/api/logs/*` - 日志查询接口

#### 2.2.3 服务启动脚本不统一

**问题**: 各服务启动方式不一致，缺乏统一管理

```
api/          - docker-compose up (推荐) / start.sh
llm/          - uvicorn main:app --host 0.0.0.0 --port 6002
mail/         - node server.js (手动)
redis/        - docker-compose up
ddns/         - systemd service (本地) + shell脚本
前端           - vite dev / vite build
```

**影响**: 无法一键启动/停止整个系统

#### 2.2.4 监控和告警缺失

**问题**: Prometheus和Grafana已部署，但未配置监控指标

- ✅ Prometheus已安装
- ✅ Grafana已安装
- ❌ 缺少Exporter采集数据
- ❌ 缺少Dashboard展示
- ❌ 缺少AlertManager告警

#### 2.2.5 日志管理不规范

**问题**: 日志分散，无统一收集和分析

```
api/logs/          - Python日志
llm/logs/          - FastAPI日志
mail/logs/         - Node.js日志
ddns/logs/         - Shell脚本日志
redis/logs/        - Redis日志
frp/logs/          - FRP日志
```

**缺失**:

- 统一日志格式
- 日志聚合(ELK/Loki)
- 日志保留策略
- 错误日志告警

#### 2.2.6 安全配置不足

**敏感信息暴露风险**:

- .env.local 包含真实AccessKey和密钥
- .gitignore 需验证是否已忽略所有敏感文件
- API密钥硬编码在配置文件中
- 缺少密钥轮换机制

**权限控制缺失**:

- API接口缺少认证中间件
- FRP管理面板仅有简单密码
- 缺少RBAC权限系统

#### 2.2.7 备份和恢复策略缺失

**问题**: 无自动化备份方案

- 数据库备份脚本存在但未配置定时任务
- 无配置文件备份
- 无灾难恢复演练
- 无异地备份

#### 2.2.8 Docker化不完整

**问题**: 部分服务未Docker化

```bash
✅ API服务           - Docker化完整
✅ Redis服务         - Docker化完整  
✅ LLM服务           - 有Dockerfile但未使用
❌ 邮件服务           - 无Dockerfile
❌ DDNS服务          - Shell脚本，未容器化
❌ 前端              - 仅开发环境Docker支持
```

---

## 三、自用前闭环规划

### 3.1 优先级P0（必须完成，否则无法自用）

#### 3.1.1 统一环境变量管理

**目标**: 创建单一配置源，支持多环境

**方案**:

```bash
# 目录结构
/Users/yanyu/Downloads/YYC3-NAS-ECS/
├── config/
│   ├── .env.base              # 基础配置（所有环境共享）
│   ├── .env.development       # 开发环境覆盖
│   ├── .env.staging           # 预发布环境覆盖
│   ├── .env.production        # 生产环境覆盖
│   └── secrets/               # 敏感信息目录（.gitignore）
│       ├── aliyun.env         # 阿里云密钥
│       ├── llm.env            # LLM API密钥
│       ├── mail.env           # 邮件SMTP密钥
│       └── frp.env            # FRP Token
```

**实施步骤**:

1. 创建 `config/` 目录
2. 合并所有.env文件到对应环境文件
3. 将敏感信息提取到 `config/secrets/`
4. 更新 `docker-compose.yml` 使用 `env_file`
5. 创建 `scripts/load-env.sh` 加载环境变量

**验证方法**:

```bash
# 开发环境启动
./scripts/load-env.sh development && docker-compose up

# 生产环境启动
./scripts/load-env.sh production && docker-compose up
```

#### 3.1.2 完善API接口对接

**目标**: 前端调用真实API，替换Mock数据

**方案1: 优先实现关键接口**

```python
# api/app/api/v2/monitoring.py (新增)
from flask import Blueprint, jsonify

monitoring_bp = Blueprint('monitoring', __name__)

@monitoring_bp.route('/api/v2/system/stats', methods=['GET'])
def get_system_stats():
    """获取系统监控数据"""
    # 调用系统命令获取CPU、内存、磁盘、网络
    stats = {
        'cpuUsage': get_cpu_usage(),
        'memoryUsage': get_memory_usage(),
        'diskUsage': get_disk_usage(),
        'networkIn': get_network_in(),
        'networkOut': get_network_out(),
        'uptime': get_uptime(),
        'timestamp': datetime.now().isoformat()
    }
    return jsonify({'success': True, 'data': stats})

@monitoring_bp.route('/api/v2/nas/status', methods=['GET'])
def get_nas_status():
    """获取NAS服务状态"""
    # 调用NAS API获取状态
    status = call_nas_api('/status')
    return jsonify({'success': True, 'data': status})

@monitoring_bp.route('/api/v2/nas/volumes', methods=['GET'])
def get_nas_volumes():
    """获取存储卷信息"""
    volumes = call_nas_api('/volumes')
    return jsonify({'success': True, 'data': volumes})

@monitoring_bp.route('/api/v2/nas/shares', methods=['GET'])
def get_nas_shares():
    """获取文件共享配置"""
    shares = call_nas_api('/shares')
    return jsonify({'success': True, 'data': shares})
```

**方案2: 创建NAS API代理**

```python
# api/app/api/v2/nas_proxy.py
import requests

NAS_API_URL = os.getenv('NAS_API_URL', 'http://localhost:6004')

@nas_bp.route('/api/v2/nas/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def nas_proxy(path):
    """代理所有NAS API请求"""
    target_url = f"{NAS_API_URL}/{path}"
    
    if request.method == 'GET':
        resp = requests.get(target_url, params=request.args)
    elif request.method == 'POST':
        resp = requests.post(target_url, json=request.json)
    # ... 其他方法
    
    return jsonify(resp.json()), resp.status_code
```

**前端适配**:

```typescript
// src/app/services/api-v2.ts (更新)
export const apiV2: ApiService = {
  system: {
    getStats: async (): Promise<SystemStats> => {
      const response = await fetch('/api/v2/system/stats');
      const data = await response.json();
      return data.data;
    }
  },
  nas: {
    getStatus: async () => {
      const response = await fetch('/api/v2/nas/status');
      return response.json();
    },
    getVolumes: async () => {
      const response = await fetch('/api/v2/nas/volumes');
      return response.json();
    },
    getShares: async () => {
      const response = await fetch('/api/v2/nas/shares');
      return response.json();
    }
  }
}
```

**验证方法**:

```bash
# 测试API接口
curl http://localhost:6000/api/v2/system/stats
curl http://localhost:6000/api/v2/nas/status

# 前端访问并查看网络请求，确认调用真实API
```

#### 3.1.3 创建统一启动脚本

**目标**: 一键启动/停止/重启所有服务

**方案**:

```bash
#!/bin/bash
# scripts/stack-manager.sh - 全栈服务管理器

set -e

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV="${1:-development}"
ACTION="${2:-up}"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"
}

# 加载环境变量
load_env() {
    log "加载 ${ENV} 环境配置..."
    if [ -f "${BASE_DIR}/config/.env.${ENV}" ]; then
        source "${BASE_DIR}/config/.env.${ENV}"
        log "环境变量加载完成"
    else
        error "环境配置文件不存在: config/.env.${ENV}"
        exit 1
    fi
    
    # 加载密钥
    if [ -d "${BASE_DIR}/config/secrets" ]; then
        for secret_file in "${BASE_DIR}/config/secrets"/*.env; do
            if [ -f "$secret_file" ]; then
                source "$secret_file"
            fi
        done
    fi
}

# 启动所有服务
start_all() {
    log "=========================================="
    log "启动 YYC³ 全栈服务 (${ENV} 环境)"
    log "=========================================="
    
    # 1. 启动基础服务 (Redis)
    log "启动 Redis 服务..."
    cd "${BASE_DIR}/redis"
    docker-compose -f config/docker-compose.yml up -d redis-${ENV}
    
    # 2. 启动 API 服务
    log "启动 API 服务..."
    cd "${BASE_DIR}/api"
    docker-compose up -d api
    
    # 3. 启动 LLM 服务
    log "启动 LLM 服务..."
    cd "${BASE_DIR}/llm"
    nohup uvicorn main:app --host 0.0.0.0 --port 6002 > logs/llm.log 2>&1 &
    echo $! > logs/llm.pid
    
    # 4. 启动邮件服务
    log "启动邮件服务..."
    cd "${BASE_DIR}/mail"
    nohup node server.js > logs/mail.log 2>&1 &
    echo $! > logs/mail.pid
    
    # 5. 启动 DDNS 服务 (如果是生产环境)
    if [ "$ENV" = "production" ]; then
        log "启动 DDNS 服务..."
        sudo systemctl start yyc3-ddns.timer
    fi
    
    # 6. 启动 FRP 客户端
    log "启动 FRP 客户端..."
    cd "${BASE_DIR}/frp"
    nohup ./frpc -c frpc.toml > logs/frpc.log 2>&1 &
    echo $! > logs/frpc.pid
    
    # 7. 启动前端 (开发环境)
    if [ "$ENV" = "development" ]; then
        log "启动前端开发服务器..."
        cd "${BASE_DIR}"
        bun --hot src/main.tsx > logs/frontend.log 2>&1 &
        echo $! > logs/frontend.pid
    fi
    
    log "=========================================="
    log "✅ 所有服务启动完成"
    log "=========================================="
    show_status
}

# 停止所有服务
stop_all() {
    log "=========================================="
    log "停止 YYC³ 全栈服务"
    log "=========================================="
    
    # 停止前端
    if [ -f "${BASE_DIR}/logs/frontend.pid" ]; then
        kill $(cat "${BASE_DIR}/logs/frontend.pid") 2>/dev/null || true
        rm -f "${BASE_DIR}/logs/frontend.pid"
        log "前端已停止"
    fi
    
    # 停止 FRP 客户端
    if [ -f "${BASE_DIR}/logs/frpc.pid" ]; then
        kill $(cat "${BASE_DIR}/logs/frpc.pid") 2>/dev/null || true
        rm -f "${BASE_DIR}/logs/frpc.pid"
        log "FRP 客户端已停止"
    fi
    
    # 停止邮件服务
    if [ -f "${BASE_DIR}/mail/logs/mail.pid" ]; then
        kill $(cat "${BASE_DIR}/mail/logs/mail.pid") 2>/dev/null || true
        rm -f "${BASE_DIR}/mail/logs/mail.pid"
        log "邮件服务已停止"
    fi
    
    # 停止 LLM 服务
    if [ -f "${BASE_DIR}/llm/logs/llm.pid" ]; then
        kill $(cat "${BASE_DIR}/llm/logs/llm.pid") 2>/dev/null || true
        rm -f "${BASE_DIR}/llm/logs/llm.pid"
        log "LLM 服务已停止"
    fi
    
    # 停止 API 和 Redis
    log "停止 API 和 Redis 服务..."
    cd "${BASE_DIR}/api"
    docker-compose down
    
    log "=========================================="
    log "✅ 所有服务已停止"
    log "=========================================="
}

# 显示服务状态
show_status() {
    log "=========================================="
    log "服务状态检查"
    log "=========================================="
    
    # 检查 Redis
    if docker ps | grep -q redis-${ENV}; then
        log "✅ Redis 服务 - 运行中"
    else
        warn "❌ Redis 服务 - 未运行"
    fi
    
    # 检查 API
    if docker ps | grep -q nas-ddns-api; then
        log "✅ API 服务 - 运行中"
    else
        warn "❌ API 服务 - 未运行"
    fi
    
    # 检查 LLM
    if [ -f "${BASE_DIR}/llm/logs/llm.pid" ] && kill -0 $(cat "${BASE_DIR}/llm/logs/llm.pid") 2>/dev/null; then
        log "✅ LLM 服务 - 运行中"
    else
        warn "❌ LLM 服务 - 未运行"
    fi
    
    # 检查邮件服务
    if [ -f "${BASE_DIR}/mail/logs/mail.pid" ] && kill -0 $(cat "${BASE_DIR}/mail/logs/mail.pid") 2>/dev/null; then
        log "✅ 邮件服务 - 运行中"
    else
        warn "❌ 邮件服务 - 未运行"
    fi
    
    # 检查 FRP 客户端
    if [ -f "${BASE_DIR}/logs/frpc.pid" ] && kill -0 $(cat "${BASE_DIR}/logs/frpc.pid") 2>/dev/null; then
        log "✅ FRP 客户端 - 运行中"
    else
        warn "❌ FRP 客户端 - 未运行"
    fi
    
    log "=========================================="
    log "访问地址:"
    log "  管理平台: https://admin.0379.email"
    log "  API文档:   https://api.0379.email/docs"
    log "  FRP管理:   http://frp.0379.email:7500"
    log "=========================================="
}

# 主函数
main() {
    load_env
    
    case "$ACTION" in
        start|up)
            start_all
            ;;
        stop|down)
            stop_all
            ;;
        restart|reload)
            stop_all
            sleep 3
            start_all
            ;;
        status)
            show_status
            ;;
        logs)
            tail -f "${BASE_DIR}/logs"/*.log
            ;;
        *)
            echo "用法: $0 <环境> <动作>"
            echo ""
            echo "环境: development | staging | production"
            echo "动作: start | stop | restart | status | logs"
            echo ""
            echo "示例:"
            echo "  $0 production start"
            echo "  $0 development stop"
            echo "  $0 production status"
            exit 1
            ;;
    esac
}

main "$@"
```

**使用方法**:

```bash
# 生产环境一键启动
./scripts/stack-manager.sh production start

# 开发环境一键停止
./scripts/stack-manager.sh development stop

# 查看服务状态
./scripts/stack-manager.sh production status

# 查看实时日志
./scripts/stack-manager.sh production logs
```

### 3.2 优先级P1（自用后2周内完成）

#### 3.2.1 配置监控Dashboard

**目标**: 完善Prometheus + Grafana监控体系

**方案**:

**1. 部署Node Exporter (系统监控)**

```yaml
# api/docker-compose.yml (追加)
services:
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
```

**2. 配置Prometheus采集**

```yaml
# api/docker/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
  
  - job_name: 'api'
    static_configs:
      - targets: ['api:8080']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
  
  - job_name: 'llm'
    static_configs:
      - targets: ['llm:6002']
```

**3. 导入Grafana Dashboard**

- Dashboard ID: 1860 (Node Exporter Full)
- Dashboard ID: 11835 (Redis Dashboard)
- Dashboard ID: 14645 (Python Flask Dashboard)

**验证方法**:

```bash
# 访问Grafana
http://localhost:3000

# 登录后导入Dashboard
Dashboard → Import → 输入ID → Load
```

#### 3.2.2 配置日志聚合

**目标**: 使用Loki + Grafana聚合所有日志

**方案**:

```yaml
# api/docker-compose.yml (追加)
services:
  loki:
    image: grafana/loki:latest
    container_name: loki
    restart: unless-stopped
    ports:
      - "3100:3100"
    volumes:
      - ./docker/loki:/etc/loki
  
  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    restart: unless-stopped
    volumes:
      - /var/log:/var/log:ro
      - ./docker/promtail:/etc/promtail
    depends_on:
      - loki
```

**日志收集配置**:

```yaml
# docker/promtail/promtail-config.yml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: api-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: api
          __path__: /var/log/yyc3/api/*.log
  
  - job_name: llm-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: llm
          __path__: /var/log/yyc3/llm/*.log
  
  - job_name: mail-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: mail
          __path__: /var/log/yyc3/mail/*.log
```

#### 3.2.3 实施自动化备份

**目标**: 每日自动备份配置和数据

**方案**:

```bash
#!/bin/bash
# scripts/backup.sh - 自动化备份脚本

BACKUP_DIR="/backup/yyc3"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# 创建备份目录
mkdir -p "${BACKUP_DIR}/${BACKUP_DATE}"

# 备份数据库
docker exec nas-ddns-postgres pg_dump -U nas_admin nas_ddns > \
  "${BACKUP_DIR}/${BACKUP_DATE}/postgres.sql"

# 备份Redis数据
docker exec redis-${ENV} redis-cli --rdb /data/dump.rdb
docker cp redis-${ENV}:/data/dump.rdb "${BACKUP_DIR}/${BACKUP_DATE}/"

# 备份配置文件
cp -r /opt/yyc3/config "${BACKUP_DIR}/${BACKUP_DATE}/"
cp /opt/yyc3/frp/frpc.toml "${BACKUP_DIR}/${BACKUP_DATE}/"
cp /opt/yyc3/frp/frps.toml "${BACKUP_DIR}/${BACKUP_DATE}/"

# 压缩备份
cd "${BACKUP_DIR}"
tar -czf "yyc3_backup_${BACKUP_DATE}.tar.gz" "${BACKUP_DATE}"
rm -rf "${BACKUP_DATE}"

# 清理旧备份
find "${BACKUP_DIR}" -name "yyc3_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

# 上传到云端 (阿里云OSS)
# ossutil cp "${BACKUP_DIR}/yyc3_backup_${BACKUP_DATE}.tar.gz" oss://yyc3-backup/

echo "备份完成: yyc3_backup_${BACKUP_DATE}.tar.gz"
```

**配置定时任务**:

```bash
# /etc/systemd/system/yyc3-backup.service
[Unit]
Description=YYC³ Daily Backup
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/yyc3/scripts/backup.sh
User=root

# /etc/systemd/system/yyc3-backup.timer
[Unit]
Description=YYC³ Daily Backup Timer

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target

# 启动定时备份
sudo systemctl enable yyc3-backup.timer
sudo systemctl start yyc3-backup.timer
```

### 3.3 优先级P2（优化提升，1个月内完成）

#### 3.3.1 完善安全配置

- 配置HTTPS证书 (Let's Encrypt自动续期)
- 实施API认证 (JWT + API Key)
- 配置RBAC权限系统
- 定期密钥轮换脚本
- 配置防火墙规则

#### 3.3.2 完成Docker化

- 为邮件服务创建Dockerfile
- 为DDNS服务创建Dockerfile
- 为前端创建生产环境Docker镜像
- 编写完整的docker-compose.yml

#### 3.3.3 实施CI/CD

- 配置GitHub Actions自动构建
- 配置自动化测试
- 配置自动化部署
- 配置环境一致性检查

---

## 四、实施检查清单

### 第一阶段（自用前，P0）

- [ ] 统一环境变量管理
- [ ] 完善API接口对接
- [ ] 创建统一启动脚本
- [ ] 验证所有服务正常启动
- [ ] 验证FRP和DDNS连接
- [ ] 验证前端访问公网域名

### 第二阶段（自用后2周，P1）

- [ ] 配置Prometheus监控
- [ ] 配置Grafana Dashboard
- [ ] 配置Loki日志聚合
- [ ] 配置自动化备份
- [ ] 验证备份恢复流程
- [ ] 配置告警通知

### 第三阶段（优化提升，P2）

- [ ] 完善HTTPS配置
- [ ] 实施API认证
- [ ] 完成Docker化
- [ ] 配置CI/CD
- [ ] 性能优化
- [ ] 文档完善

---

## 五、紧急问题处理

### 5.1 服务无法启动

**检查步骤**:

1. 查看服务日志: `./scripts/stack-manager.sh production logs`
2. 检查端口占用: `netstat -tlnp | grep 320`
3. 检查Docker状态: `docker ps -a`
4. 检查环境变量: `./scripts/stack-manager.sh production status`

### 5.2 FRP连接失败

**检查步骤**:

1. 验证服务器IP: `ping 8.152.195.33`
2. 检查FRP服务器状态: 访问 `http://frp.0379.email:7500`
3. 查看frpc日志: `tail -f frp/logs/frpc.log`
4. 验证Token: 对比 frpc.toml 和 frps.toml

### 5.3 DDNS不更新

**检查步骤**:

1. 验证阿里云密钥: 测试API调用
2. 检查定时器状态: `sudo systemctl status yyc3-ddns.timer`
3. 查看DDNS日志: `tail -f /opt/yyc3/logs/ddns/ddns-*.log`
4. 手动执行: `bash /opt/yyc3/ddns/aliyun-ddns.sh`

### 5.4 前端无法访问

**检查步骤**:

1. 检查FRP配置: 确认 admin-0379 子域名
2. 检查前端服务: `curl http://localhost:6005`
3. 检查浏览器控制台错误
4. 验证API连接: 检查Network请求

---

## 六、技术债务清单

| 问题 | 影响 | 优先级 | 预计工时 | 状态 |
|-----|------|-------|---------|------|
| 环境变量分散 | 配置维护困难 | P0 | 4h | 待解决 |
| API未对接 | 功能不完整 | P0 | 8h | 待解决 |
| 启动脚本不统一 | 运维效率低 | P0 | 6h | 待解决 |
| 缺少监控告警 | 故障发现延迟 | P1 | 12h | 待解决 |
| 日志分散 | 排查困难 | P1 | 8h | 待解决 |
| 无自动化备份 | 数据丢失风险 | P1 | 4h | 待解决 |
| Docker化不完整 | 部署复杂 | P2 | 16h | 待解决 |
| 安全配置不足 | 安全风险 | P2 | 12h | 待解决 |

---

## 七、总结

### 当前状态

- ✅ FRP和DDNS已打通阿里云和本地NAS
- ✅ 前端页面集成基本完成
- ✅ 后端微服务架构完整
- ⚠️ 配置管理混乱
- ⚠️ API未完全对接
- ⚠️ 缺少统一管理

### 自用前必须完成（P0）

1. **统一环境变量管理** - 4小时
2. **完善API接口对接** - 8小时
3. **创建统一启动脚本** - 6小时

**预计总工时**: 18小时  
**建议时间**: 2-3个工作日

### 自用后优化（P1）

1. **配置监控Dashboard** - 12小时
2. **配置日志聚合** - 8小时
3. **实施自动化备份** - 4小时

**预计总工时**: 24小时  
**建议时间**: 1周

### 风险提示

1. **密钥安全**: 立即从.git提交历史中移除所有敏感信息
2. **数据备份**: 在生产环境部署前完成备份方案
3. **监控告警**: 避免服务故障无法及时发现
4. **容量规划**: 监控服务器资源使用情况

---

**报告生成**: Crush AI Assistant  
**审核时间**: 2025-01-05  
**下次审核**: P0完成后
