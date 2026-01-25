# YYC3-NAS-ECS FRP配置使用指南

> FRP内网穿透配置管理完整指南

## 概述

FRP（Fast Reverse Proxy）是一个高性能的反向代理应用，可以帮助您轻松地进行内网穿透，支持TCP、UDP、HTTP、HTTPS等协议。YYC3-NAS-ECS集成了完整的FRP配置管理功能，提供Web界面管理、AI智能优化、配置备份恢复等功能。

## 功能特性

- **Web界面管理**: 可视化配置FRP隧道
- **多协议支持**: HTTP、HTTPS、TCP、UDP等
- **AI智能优化**: 基于AI的配置优化建议
- **配置备份**: 自动备份和恢复配置
- **实时监控**: 实时查看FRP服务状态
- **日志查看**: 查看FRP运行日志
- **安全认证**: 支持Token认证和TLS加密

## 快速开始

### 1. FRP基本概念

**FRP架构**:
- **frps**: FRP服务端，部署在具有公网IP的服务器上
- **frpc**: FRP客户端，部署在内网机器上
- **代理**: 将内网服务映射到公网

**工作原理**:
```
公网用户 → FRP服务端 → FRP客户端 → 内网服务
```

### 2. 服务器端配置（frps.toml）

```toml
# FRP服务器端配置示例
bindAddr = "0.0.0.0"
bindPort = 7001

# 认证配置
auth.method = "token"
auth.token = "yyc3_nas"

# Web管理界面
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "yyc3"
webServer.password = "my151001"

# HTTP代理端口
vhostHTTPPort = 18080
vhostHTTPSPort = 4443

# TLS证书配置
transport.tls.certFile = "/etc/letsencrypt/live/0379.email/fullchain.pem"
transport.tls.keyFile = "/etc/letsencrypt/live/0379.email/privkey.pem"

# 允许的端口范围
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

**配置说明**:
- `bindAddr`: 绑定地址，0.0.0.0表示监听所有网卡
- `bindPort`: 绑定端口，客户端连接此端口
- `auth.method`: 认证方式，支持token、oidc等
- `auth.token`: 认证令牌，需要与客户端一致
- `webServer.addr/port`: Web管理界面地址和端口
- `vhostHTTPPort`: HTTP虚拟主机端口
- `vhostHTTPSPort`: HTTPS虚拟主机端口
- `allowPorts`: 允许客户端使用的端口范围
- `subDomainHost`: 子域名主机名

### 3. 客户端配置（frpc.toml）

```toml
# FRP客户端配置示例
serverAddr = "8.152.195.33"
serverPort = 7001
auth.method = "token"
auth.token = "yyc3_nas"

# 日志配置
log.to = "/Volume1/www/frpc/logs/frpc.log"
log.level = "debug"

# TLS加密
transport.tls.enable = true

# HTTP代理配置
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

**配置说明**:
- `serverAddr`: 服务器地址
- `serverPort`: 服务器端口
- `auth.method/token`: 认证配置，需与服务器一致
- `proxies`: 代理配置数组
- `name`: 代理名称
- `type`: 代理类型（http、https、tcp、udp、stcp、xtcp）
- `localIP`: 本地服务IP
- `localPort`: 本地服务端口
- `subdomain`: 子域名（HTTP类型）

## 隧道配置

### HTTP代理配置

**基础HTTP代理**:
```toml
[[proxies]]
name = "web-service"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "web"
```

**访问地址**: `http://web.0379.email:18080`

**带认证的HTTP代理**:
```toml
[[proxies]]
name = "secure-web"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "secure"
httpUser = "admin"
httpPassword = "password123"
```

**自定义域名的HTTP代理**:
```toml
[[proxies]]
name = "custom-domain"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
customDomains = ["www.example.com", "api.example.com"]
```

### HTTPS代理配置

```toml
[[proxies]]
name = "https-service"
type = "https"
localIP = "127.0.0.1"
localPort = 443
subdomain = "secure"
crtPath = "/path/to/cert.pem"
keyPath = "/path/to/key.pem"
```

### TCP代理配置

**基础TCP代理**:
```toml
[[proxies]]
name = "ssh-service"
type = "tcp"
localIP = "127.0.0.1"
localPort = 22
remotePort = 6000
```

**访问方式**: `ssh -p 6000 user@server_ip`

**带端口范围的TCP代理**:
```toml
[[proxies]]
name = "tcp-range"
type = "tcp"
localIP = "127.0.0.1"
localPort = 8080
remotePort = 6001
bandwidthLimit = "1MB"
```

### UDP代理配置

```toml
[[proxies]]
name = "dns-service"
type = "udp"
localIP = "127.0.0.1"
localPort = 53
remotePort = 6002
```

### STCP代理配置（安全TCP）

STCP（Secret TCP）提供更安全的TCP代理，只有知道密钥的客户端才能访问。

```toml
# 服务端配置
[[proxies]]
name = "secret-tcp"
type = "stcp"
localIP = "127.0.0.1"
localPort = 22
sk = "secret_key_123"

# 访问者配置
[[visitors]]
name = "ssh-visitor"
type = "stcp"
serverName = "secret-tcp"
sk = "secret_key_123"
bindAddr = "127.0.0.1"
bindPort = 6000
```

### XTCP代理配置（P2P穿透）

XTCP提供点对点穿透功能，适合需要高带宽的场景。

```toml
# 服务端配置
[[proxies]]
name = "p2p-service"
type = "xtcp"
localIP = "127.0.0.1"
localPort = 22
sk = "p2p_secret_key"

# 访问者配置
[[visitors]]
name = "p2p-visitor"
type = "xtcp"
serverName = "p2p-service"
sk = "p2p_secret_key"
bindAddr = "127.0.0.1"
bindPort = 6000
```

## 高级配置

### 负载均衡

```toml
[[proxies]]
name = "load-balance"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "lb"
healthCheckType = "http"
healthCheckURL = "/health"
healthCheckIntervalS = 10
healthCheckMaxFailed = 3
healthCheckTimeoutS = 3

[[proxies.loadBalancer]]
name = "backend1"
localIP = "192.168.1.10"
localPort = 8080

[[proxies.loadBalancer]]
name = "backend2"
localIP = "192.168.1.11"
localPort = 8080
```

### 健康检查

```toml
[[proxies]]
name = "health-check"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "health"
healthCheckType = "http"
healthCheckURL = "/health"
healthCheckIntervalS = 10
healthCheckMaxFailed = 3
healthCheckTimeoutS = 3
```

### 带宽限制

```toml
[[proxies]]
name = "limited-bandwidth"
type = "tcp"
localIP = "127.0.0.1"
localPort = 8080
remotePort = 6000
bandwidthLimit = "1MB"
bandwidthLimitMode = "client"
```

### 连接池配置

```toml
[[proxies]]
name = "connection-pool"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "pool"
poolCount = 5
```

### 代理组配置

```toml
[[proxies]]
name = "group-proxy-1"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "group1"
group = "web-group"
groupKey = "group_key_123"

[[proxies]]
name = "group-proxy-2"
type = "http"
localIP = "127.0.0.1"
localPort = 8081
subdomain = "group2"
group = "web-group"
groupKey = "group_key_123"
```

## API使用

### 获取FRP状态

```typescript
// 获取FRP客户端状态
const response = await fetch('/api/frp/status');
const data = await response.json();

// 响应示例
{
  "success": true,
  "data": {
    "client": {
      "running": true,
      "connected": true,
      "serverAddr": "8.152.195.33",
      "serverPort": 7001,
      "proxyCount": 7,
      "uptime": "15天 3小时 45分钟"
    },
    "proxies": [
      {
        "id": "api-0379",
        "name": "api-0379",
        "type": "http",
        "localIP": "127.0.0.1",
        "localPort": 6000,
        "subdomain": "api",
        "enabled": true,
        "status": "running"
      }
    ],
    "timestamp": "2026-01-25T10:30:00.000Z"
  }
}
```

### 获取代理列表

```typescript
// 获取FRP代理隧道列表
const response = await fetch('/api/frp/proxies');
const data = await response.json();

// 响应示例
{
  "success": true,
  "data": [
    {
      "id": "api-0379",
      "name": "api-0379",
      "type": "http",
      "localIP": "127.0.0.1",
      "localPort": 6000,
      "subdomain": "api",
      "enabled": true,
      "status": "running"
    }
  ]
}
```

### 创建配置

```typescript
// 创建新的FRP隧道配置
const newConfig = {
  name: "new-service",
  type: "http",
  localIP: "127.0.0.1",
  localPort: 8080,
  subdomain: "new"
};

const response = await fetch('/api/frp/configs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newConfig)
});

const data = await response.json();

// 响应示例
{
  "success": true,
  "data": {
    "id": "new-service",
    "name": "new-service",
    "type": "http",
    "localIP": "127.0.0.1",
    "localPort": 8080,
    "subdomain": "new",
    "enabled": true,
    "status": "stopped"
  },
  "message": "FRP隧道配置创建成功"
}
```

### 更新配置

```typescript
// 更新FRP隧道配置
const updatedConfig = {
  name: "api-0379",
  type: "http",
  localIP: "127.0.0.1",
  localPort: 8080,
  subdomain: "api",
  enabled: true
};

const response = await fetch('/api/frp/configs/api-0379', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updatedConfig)
});

const data = await response.json();

// 响应示例
{
  "success": true,
  "data": {
    "id": "api-0379",
    "name": "api-0379",
    "type": "http",
    "localIP": "127.0.0.1",
    "localPort": 8080,
    "subdomain": "api",
    "enabled": true,
    "status": "running"
  },
  "message": "FRP隧道配置更新成功"
}
```

### 删除配置

```typescript
// 删除FRP隧道配置
const response = await fetch('/api/frp/configs/api-0379', {
  method: 'DELETE'
});

const data = await response.json();

// 响应示例
{
  "success": true,
  "message": "FRP隧道配置删除成功"
}
```

### 服务管理

```typescript
// 启动FRP客户端
const response = await fetch('/api/frp/client/start', {
  method: 'POST'
});

// 停止FRP客户端
const response = await fetch('/api/frp/client/stop', {
  method: 'POST'
});

// 重启FRP客户端
const response = await fetch('/api/frp/client/restart', {
  method: 'POST'
});
```

### 配置验证

```typescript
// 验证FRP配置文件
const configContent = `
serverAddr = "8.152.195.33"
serverPort = 7001
auth.method = "token"
auth.token = "yyc3_nas"

[[proxies]]
name = "test"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "test"
`;

const response = await fetch('/api/frp/configs/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ content: configContent })
});

const data = await response.json();

// 响应示例
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": [],
  "message": "Configuration validation completed"
}
```

### 配置备份

```typescript
// 备份FRP配置文件
const response = await fetch('/api/frp/configs/backup', {
  method: 'POST'
});

const data = await response.json();

// 响应示例
{
  "success": true,
  "message": "Configuration backed up successfully",
  "data": {
    "backup_file": "frpc_backup_20260125_103000.toml",
    "backup_path": "/frp/backups/frpc_backup_20260125_103000.toml",
    "timestamp": "20260125_103000"
  }
}

// 获取备份列表
const response = await fetch('/api/frp/configs/backups');
const data = await response.json();

// 响应示例
{
  "success": true,
  "data": [
    {
      "filename": "frpc_backup_20260125_103000.toml",
      "path": "/frp/backups/frpc_backup_20260125_103000.toml",
      "size": 1024,
      "created": "2026-01-25T10:30:00.000Z",
      "timestamp": "20260125_103000"
    }
  ],
  "total": 1
}

// 恢复配置
const response = await fetch('/api/frp/configs/restore', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ backup_file: "frpc_backup_20260125_103000.toml" })
});
```

### 获取日志

```typescript
// 获取FRP客户端日志
const response = await fetch('/api/frp/logs?lines=100');
const data = await response.json();

// 响应示例
{
  "success": true,
  "data": {
    "logs": [
      "2026/01/25 10:30:00 [I] [service.go:205] login to server success, get run id [xxx]",
      "2026/01/25 10:30:01 [I] [proxy.go:126] [xxx] start proxy success"
    ],
    "total": 100,
    "returned": 100
  }
}
```

## AI智能优化

YYC3-NAS-ECS集成了AI智能优化功能，可以自动分析FRP配置并提供优化建议。

### 使用AI优化器

```typescript
import { FRPAIConfigOptimizer } from '@/components/frp/FRPAIConfigOptimizer';

// 在React组件中使用
function MyComponent() {
  return (
    <FRPAIConfigOptimizer />
  );
}
```

### AI优化功能

1. **配置分析**: 自动分析FRP配置文件
2. **问题检测**: 识别配置中的错误和警告
3. **优化建议**: 提供性能、安全、可靠性优化建议
4. **一键应用**: 直接应用优化建议
5. **配置评分**: 对配置进行评分（0-100）

### 优化示例

**原始配置**:
```toml
[[proxies]]
name = "web"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "web"
```

**AI优化建议**:
```toml
[[proxies]]
name = "web"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "web"
healthCheckType = "http"
healthCheckURL = "/health"
healthCheckIntervalS = 10
healthCheckMaxFailed = 3
healthCheckTimeoutS = 3
```

**优化原因**: 添加健康检查可以提高服务可用性，自动检测服务状态。

## Web界面使用

### 配置管理器

YYC3-NAS-ECS提供了可视化的FRP配置管理器，支持以下功能：

1. **代理列表管理**: 添加、编辑、删除代理配置
2. **配置编辑器**: 使用Monaco编辑器编辑配置
3. **服务控制**: 启动、停止、重启FRP服务
4. **状态监控**: 实时查看服务状态
5. **配置备份**: 备份和恢复配置
6. **AI优化**: 使用AI优化配置

### 使用步骤

1. **访问FRP管理页面**
   - 登录YYC3-NAS-ECS系统
   - 导航到"网络管理" > "FRP配置"

2. **查看服务状态**
   - 顶部显示FRP服务运行状态
   - 显示客户端连接状态
   - 显示代理数量和运行时间

3. **管理代理配置**
   - 左侧代理列表显示所有配置
   - 点击代理名称切换编辑
   - 点击"添加"按钮创建新代理
   - 点击删除图标删除代理

4. **编辑配置**
   - 使用Monaco编辑器编辑配置
   - 支持语法高亮和自动补全
   - 实时验证配置语法

5. **保存和应用**
   - 点击"保存配置"保存更改
   - 系统自动备份当前配置
   - 重启FRP服务应用更改

6. **配置备份**
   - 点击"配置备份"查看备份列表
   - 点击"创建备份"手动备份
   - 点击恢复图标恢复备份
   - 点击删除图标删除备份

7. **AI优化**
   - 切换到"AI优化器"标签
   - 粘贴FRP配置内容
   - 点击"开始分析"
   - 查看分析结果和优化建议
   - 应用优化建议

## 故障排除

### 常见问题

#### 1. 客户端无法连接服务器

**症状**: FRP客户端显示连接失败

**可能原因**:
- 服务器地址或端口错误
- 网络防火墙阻止连接
- Token认证失败
- 服务器未启动

**解决方案**:
```bash
# 检查服务器是否运行
ps aux | grep frps

# 检查端口是否开放
telnet server_ip 7001

# 检查防火墙规则
sudo iptables -L -n | grep 7001

# 检查Token是否一致
# 确保frps.toml和frpc.toml中的auth.token相同
```

#### 2. 代理无法访问

**症状**: 代理配置正确但无法访问服务

**可能原因**:
- 本地服务未启动
- 端口被占用
- 子域名冲突
- DNS解析问题

**解决方案**:
```bash
# 检查本地服务是否运行
netstat -tlnp | grep 8080

# 检查FRP客户端日志
tail -f /Volume1/www/frpc/logs/frpc.log

# 测试本地服务
curl http://127.0.0.1:8080

# 检查DNS解析
nslookup api.0379.email
```

#### 3. 性能问题

**症状**: 访问速度慢或连接不稳定

**可能原因**:
- 带宽限制
- 网络延迟
- 连接池配置不当
- 服务器负载过高

**解决方案**:
```toml
# 增加连接池大小
[[proxies]]
name = "high-performance"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "perf"
poolCount = 10

# 启用TCP多路复用
transport.tcpMux = true
transport.tcpMuxKeepaliveInterval = 60

# 配置心跳
heartbeatInterval = 30
heartbeatTimeout = 90
```

#### 4. 安全问题

**症状**: 担心配置安全性

**解决方案**:
```toml
# 启用TLS加密
transport.tls.enable = true

# 使用强Token
auth.token = "your_strong_random_token_here"

# 配置HTTP认证
[[proxies]]
name = "secure"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "secure"
httpUser = "admin"
httpPassword = "strong_password"

# 使用STCP代理
[[proxies]]
name = "secret"
type = "stcp"
localIP = "127.0.0.1"
localPort = 22
sk = "secret_key_here"
```

### 日志分析

#### 客户端日志

```bash
# 查看实时日志
tail -f /Volume1/www/frpc/logs/frpc.log

# 查看错误日志
grep ERROR /Volume1/www/frpc/logs/frpc.log

# 查看连接日志
grep "login to server" /Volume1/www/frpc/logs/frpc.log
```

#### 服务器日志

```bash
# 查看实时日志
tail -f /root/frps/frps.log

# 查看连接日志
grep "new proxy" /root/frps/frps.log

# 查看错误日志
grep ERROR /root/frps/frps.log
```

### 性能监控

#### 使用Web Dashboard

访问FRP Web Dashboard: `http://server_ip:7500`

- 查看代理状态
- 查看流量统计
- 查看连接信息
- 查看服务器资源使用

#### 使用API监控

```typescript
// 定期检查FRP状态
setInterval(async () => {
  const response = await fetch('/api/frp/status');
  const data = await response.json();
  
  if (!data.data.client.connected) {
    console.error('FRP客户端未连接');
    // 发送告警
  }
}, 60000); // 每分钟检查一次
```

## 最佳实践

### 1. 安全配置

- 使用强Token认证
- 启用TLS加密
- 配置HTTP认证
- 使用STCP代理敏感服务
- 定期更新Token
- 限制访问IP

### 2. 性能优化

- 合理配置连接池
- 启用TCP多路复用
- 配置健康检查
- 使用负载均衡
- 限制带宽使用
- 优化心跳间隔

### 3. 可靠性保障

- 配置健康检查
- 启用自动重连
- 定期备份配置
- 监控服务状态
- 配置告警通知
- 使用多个服务器

### 4. 运维管理

- 使用配置管理工具
- 版本控制配置文件
- 文档化配置变更
- 定期审计配置
- 建立应急预案
- 定期测试备份

### 5. 开发建议

- 使用环境变量管理配置
- 实现配置热重载
- 提供配置验证功能
- 实现配置对比功能
- 提供配置模板
- 支持批量操作

## 高级场景

### 1. 多服务器负载均衡

```toml
# 服务器1配置
[[proxies]]
name = "web-server-1"
type = "http"
localIP = "192.168.1.10"
localPort = 8080
subdomain = "web"
group = "web-group"
groupKey = "group_key"

# 服务器2配置
[[proxies]]
name = "web-server-2"
type = "http"
localIP = "192.168.1.11"
localPort = 8080
subdomain = "web"
group = "web-group"
groupKey = "group_key"
```

### 2. 灰度发布

```toml
# 新版本服务
[[proxies]]
name = "web-v2"
type = "http"
localIP = "127.0.0.1"
localPort = 8081
subdomain = "web-v2"

# 旧版本服务
[[proxies]]
name = "web-v1"
type = "http"
localIP = "127.0.0.1"
localPort = 8080
subdomain = "web-v1"
```

### 3. 多环境部署

```toml
# 开发环境
[[proxies]]
name = "dev-api"
type = "http"
localIP = "127.0.0.1"
localPort = 3000
subdomain = "dev-api"

# 测试环境
[[proxies]]
name = "test-api"
type = "http"
localIP = "127.0.0.1"
localPort = 3001
subdomain = "test-api"

# 生产环境
[[proxies]]
name = "prod-api"
type = "http"
localIP = "127.0.0.1"
localPort = 3002
subdomain = "api"
```

### 4. 监控集成

```typescript
// 集成到监控系统
async function monitorFRP() {
  const response = await fetch('/api/frp/status');
  const data = await response.json();
  
  // 发送到监控系统
  await sendToMonitoring({
    service: 'frp',
    status: data.data.client.connected ? 'up' : 'down',
    proxies: data.data.proxies.length,
    uptime: data.data.client.uptime
  });
}
```

## 参考资源

- [FRP官方文档](https://github.com/fatedier/frp)
- [FRP配置示例](https://github.com/fatedier/frp/tree/master/examples)
- [YYC3-NAS-ECS项目文档](./README.md)
- [YYC3团队规范](../YYC3团队规范.md)

## 技术支持

如有问题，请联系YYC3团队：
- 邮箱: admin@0379.email
- 项目地址: https://github.com/yyc3-team/YYC3-NAS-ECS

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
