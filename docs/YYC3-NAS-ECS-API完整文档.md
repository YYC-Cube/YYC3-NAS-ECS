# YYC³ NAS-ECS API 完整文档

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

> **文档编号**: YYC3-NAS-ECS-API-001
> **创建日期**: 2026-01-31
> **版本**: 1.0.0
> **作者**: YYC³ Team
> **更新日期**: 2026-01-31

---

## 📋 概述

YYC³ NAS-ECS API 是一个功能完整的网络附加存储管理系统 API，提供系统监控、文件管理、邮件服务、AI 对话、DDNS 服务、FRP 配置、备份管理、日志查看等功能。

### 设计原则

- **RESTful 设计**: 遵循 REST 架构风格
- **类型安全**: 完整的 TypeScript 类型定义
- **环境隔离**: 支持开发、预发布、生产环境
- **安全防护**: XSS 防护、速率限制、输入验证
- **性能优化**: 缓存机制、请求去重、错误重试

---

## 🔐 认证与授权

### 认证方式

系统使用基于 JWT 的认证机制：

```typescript
interface AuthResponse {
  token: string;
  user: User;
}

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'guest';
  avatar?: string;
}
```

### 请求头

所有需要认证的请求都需要包含以下请求头：

```http
Authorization: Bearer <token>
Content-Type: application/json
X-Request-ID: <uuid>
```

### 速率限制

- **默认限制**: 100 请求/分钟
- **突发限制**: 20 请求/秒
- **响应头**:
  - `X-RateLimit-Limit`: 总限制
  - `X-RateLimit-Remaining`: 剩余请求数
  - `X-RateLimit-Reset`: 重置时间戳

---

## 📊 API 端点

### 1. 认证模块 (Auth)

#### 1.1 用户登录

**端点**: `POST /auth/login`

**请求体**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "username": "admin",
      "role": "admin",
      "avatar": "https://github.com/shadcn.png"
    }
  }
}
```

**错误响应** (401):
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

#### 1.2 用户登出

**端点**: `POST /auth/logout`

**请求头**: `Authorization: Bearer <token>`

**响应** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2. 系统监控模块 (System)

#### 2.1 获取系统统计信息

**端点**: `GET /system/stats`

**响应** (200):
```json
{
  "success": true,
  "data": {
    "cpuUsage": 25.5,
    "memoryUsage": 45.2,
    "diskUsage": 35.5,
    "networkIn": 1024,
    "networkOut": 512,
    "uptime": 1298400,
    "timestamp": "2026-01-31T10:30:00Z"
  }
}
```

#### 2.2 获取详细系统信息

**端点**: `GET /api/v2/monitoring/stats`

**响应** (200):
```json
{
  "success": true,
  "data": {
    "cpu": {
      "usage": 12.5,
      "cores": 4,
      "model": "Intel(R) Xeon(R) CPU E5-2680 v4"
    },
    "memory": {
      "usage": 45.3,
      "total": 16,
      "used": 7.25,
      "available": 8.75
    },
    "disk": {
      "usage": 35.5,
      "total": 1000,
      "used": 355,
      "available": 645
    },
    "network": {
      "in": 1024,
      "out": 512
    },
    "system": {
      "uptime": "15天 3小时 45分钟",
      "hostname": "nas-0379"
    }
  }
}
```

---

### 3. FRP 配置模块 (FRP)

#### 3.1 获取 FRP 状态

**端点**: `GET /api/v2/frp/status`

**响应** (200):
```json
{
  "success": true,
  "data": {
    "client": {
      "running": true,
      "connected": true,
      "serverAddr": "8.152.195.33",
      "serverPort": 7001,
      "proxyCount": 5,
      "uptime": "15天 3小时 45分钟"
    },
    "proxies": [
      {
        "id": "frp-0",
        "name": "Service 1",
        "type": "tcp",
        "localIp": "127.0.0.1",
        "localPort": 8000,
        "remotePort": 6000,
        "status": "running"
      }
    ],
    "timestamp": "2026-01-31T10:30:00Z"
  }
}
```

#### 3.2 获取 FRP 配置列表

**端点**: `GET /api/v2/frp/configs`

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "frp-0",
      "name": "Service 1",
      "type": "tcp",
      "localIp": "127.0.0.1",
      "localPort": 8000,
      "remotePort": 6000,
      "status": "running"
    }
  ]
}
```

#### 3.3 更新 FRP 配置

**端点**: `PUT /api/v2/frp/configs/:id`

**请求体**:
```json
{
  "name": "Service 1 Updated",
  "type": "tcp",
  "localIp": "127.0.0.1",
  "localPort": 8001,
  "remotePort": 6001
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "frp-0",
    "name": "Service 1 Updated",
    "type": "tcp",
    "localIp": "127.0.0.1",
    "localPort": 8001,
    "remotePort": 6001,
    "status": "running"
  }
}
```

#### 3.4 启动 FRP 客户端

**端点**: `POST /api/v2/frp/start`

**响应** (200):
```json
{
  "success": true,
  "message": "FRP client started successfully"
}
```

#### 3.5 停止 FRP 客户端

**端点**: `POST /api/v2/frp/stop`

**响应** (200):
```json
{
  "success": true,
  "message": "FRP client stopped successfully"
}
```

---

### 4. DDNS 服务模块 (DDNS)

#### 4.1 获取 DDNS 状态

**端点**: `GET /api/v2/ddns/status`

**响应** (200):
```json
{
  "success": true,
  "data": {
    "running": true,
    "enabled": true,
    "provider": "aliyun",
    "domain": "ddns.0379.email",
    "currentIP": "8.152.195.33",
    "expectedIP": "8.152.195.33",
    "lastUpdate": "2026-01-31T10:30:00Z",
    "nextUpdate": 1706696700000,
    "updateInterval": 300,
    "status": "success",
    "message": "DDNS运行正常"
  }
}
```

#### 4.2 更新 DDNS 配置

**端点**: `PUT /api/v2/ddns/config`

**请求体**:
```json
{
  "provider": "aliyun",
  "domain": "ddns.0379.email",
  "updateInterval": 300
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "provider": "aliyun",
    "domain": "ddns.0379.email",
    "updateInterval": 300
  }
}
```

#### 4.3 手动更新 DDNS

**端点**: `POST /api/v2/ddns/update`

**响应** (200):
```json
{
  "success": true,
  "message": "DDNS updated successfully"
}
```

#### 4.4 获取 DDNS 历史记录

**端点**: `GET /api/v2/ddns/history?limit=10`

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "timestamp": "2026-01-31T10:30:00Z",
      "oldIP": "8.152.195.32",
      "newIP": "8.152.195.33",
      "status": "success"
    }
  ]
}
```

---

### 5. NAS 管理模块 (NAS)

#### 5.1 获取 NAS 状态

**端点**: `GET /api/v2/nas/status`

**响应** (200):
```json
{
  "success": true,
  "data": {
    "system": {
      "uptime": "15天 3小时 45分钟",
      "cpuUsage": 25.5,
      "memoryUsage": 45.2,
      "temperature": "45°C"
    },
    "volumes": [
      {
        "id": "vol-1",
        "name": "Data Volume 1",
        "type": "ext4",
        "capacity": "2 TB",
        "used": "800 GB",
        "available": "1.2 TB",
        "usagePercent": 40,
        "status": "healthy"
      }
    ],
    "services": [
      {
        "name": "SMB Service",
        "status": "running",
        "uptime": "15天 3小时 45分钟"
      }
    ]
  }
}
```

#### 5.2 获取存储卷列表

**端点**: `GET /api/v2/nas/volumes`

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "vol-1",
      "name": "Data Volume 1",
      "type": "ext4",
      "capacity": "2 TB",
      "used": "800 GB",
      "available": "1.2 TB",
      "usagePercent": 40,
      "status": "healthy"
    }
  ]
}
```

#### 5.3 获取文件列表

**端点**: `GET /api/v2/nas/files?parentId=xxx`

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "file-1",
      "name": "Document.pdf",
      "type": "file",
      "size": 1024000,
      "updatedAt": "2026-01-31T10:30:00Z",
      "parentId": "root"
    }
  ]
}
```

#### 5.4 获取共享列表

**端点**: `GET /api/v2/nas/shares`

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "share-1",
      "name": "Documents",
      "path": "/data/documents",
      "permissions": "read-write",
      "users": ["admin", "user1"],
      "status": "active"
    }
  ]
}
```

#### 5.5 启动服务

**端点**: `POST /api/v2/nas/services/:serviceName/start`

**响应** (200):
```json
{
  "success": true,
  "message": "Service started successfully"
}
```

#### 5.6 停止服务

**端点**: `POST /api/v2/nas/services/:serviceName/stop`

**响应** (200):
```json
{
  "success": true,
  "message": "Service stopped successfully"
}
```

---

### 6. 邮件服务模块 (Mail)

#### 6.1 获取邮件列表

**端点**: `GET /api/v2/mail/emails?folder=inbox&limit=20&offset=0`

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "email-1",
      "from": "user@example.com",
      "to": "me@admin.com",
      "subject": "Project Update",
      "body": "Hello, here is the update...",
      "timestamp": "2026-01-31T10:30:00Z",
      "read": false,
      "folder": "inbox"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0
  }
}
```

#### 6.2 发送邮件

**端点**: `POST /api/v2/mail/send`

**请求体**:
```json
{
  "to": ["user@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "Test Email",
  "body": "This is a test email",
  "attachments": [],
  "priority": "normal"
}
```

**响应** (200):
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "id": "email-new",
    "timestamp": "2026-01-31T10:30:00Z"
  }
}
```

#### 6.3 回复邮件

**端点**: `POST /api/v2/mail/reply/:emailId`

**请求体**:
```json
{
  "to": "user@example.com",
  "subject": "Re: Test Email",
  "body": "This is a reply"
}
```

**响应** (200):
```json
{
  "success": true,
  "message": "Reply sent successfully"
}
```

#### 6.4 转发邮件

**端点**: `POST /api/v2/mail/forward/:emailId`

**请求体**:
```json
{
  "to": ["user2@example.com"],
  "subject": "Fwd: Test Email",
  "body": "This is a forwarded email"
}
```

**响应** (200):
```json
{
  "success": true,
  "message": "Email forwarded successfully"
}
```

#### 6.5 标记邮件为已读

**端点**: `PUT /api/v2/mail/emails/:emailId/read`

**响应** (200):
```json
{
  "success": true,
  "message": "Email marked as read"
}
```

#### 6.6 删除邮件

**端点**: `DELETE /api/v2/mail/emails/:emailId`

**响应** (200):
```json
{
  "success": true,
  "message": "Email deleted successfully"
}
```

---

### 7. LLM 服务模块 (LLM)

#### 7.1 发送消息

**端点**: `POST /api/v2/llm/chat`

**请求体**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "model": "qwen:7b",
  "stream": true
}
```

**响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "msg-1",
    "role": "assistant",
    "content": "I'm doing well, thank you!",
    "timestamp": "2026-01-31T10:30:00Z"
  }
}
```

#### 7.2 获取模型列表

**端点**: `GET /api/v2/llm/models`

**响应** (200):
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "name": "qwen:7b",
        "size": "4.7GB",
        "modified_at": "2025-01-20T10:30:00Z"
      },
      {
        "name": "llama3:8b",
        "size": "4.9GB",
        "modified_at": "2025-01-18T14:20:00Z"
      }
    ]
  }
}
```

#### 7.3 拉取模型

**端点**: `POST /api/v2/llm/models/pull`

**请求体**:
```json
{
  "modelName": "qwen:7b"
}
```

**响应** (200):
```json
{
  "success": true,
  "message": "Model pull started",
  "data": {
    "status": "pulling",
    "modelName": "qwen:7b"
  }
}
```

#### 7.4 删除模型

**端点**: `DELETE /api/v2/llm/models/:modelName`

**响应** (200):
```json
{
  "success": true,
  "message": "Model deleted successfully"
}
```

---

### 8. 监控模块 (Monitoring)

#### 8.1 获取监控统计

**端点**: `GET /api/v2/monitoring/stats`

**响应** (200):
```json
{
  "success": true,
  "data": {
    "cpu": {
      "usage": 25.5,
      "cores": 8,
      "model": "Intel(R) Xeon(R) CPU E5-2680 v4"
    },
    "memory": {
      "total": 32768,
      "used": 14800,
      "available": 17968,
      "percent": 45.2
    },
    "disk": {
      "total": 6291456,
      "used": 3276800,
      "available": 3014656,
      "percent": 52.1
    },
    "network": {
      "bytesSent": 1073741824,
      "bytesRecv": 2147483648,
      "packetsSent": 1000000,
      "packetsRecv": 2000000
    },
    "loadAverage": [0.5, 0.8, 1.2],
    "uptime": 1298400
  }
}
```

#### 8.2 获取进程列表

**端点**: `GET /api/v2/monitoring/processes?limit=20&sortBy=cpu`

**响应** (200):
```json
{
  "success": true,
  "data": {
    "processes": [
      {
        "pid": 1000,
        "name": "nginx",
        "username": "root",
        "cpu_percent": 5.2,
        "memory_percent": 2.1
      }
    ],
    "total": 20
  }
}
```

---

### 9. 日志模块 (Logs)

#### 9.1 获取日志列表

**端点**: `GET /api/v2/logs?level=info&limit=50&offset=0`

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "log-1",
      "level": "info",
      "message": "System event: Operation completed successfully",
      "source": "System",
      "timestamp": "2026-01-31T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1000,
    "limit": 50,
    "offset": 0
  }
}
```

#### 9.2 清空日志

**端点**: `DELETE /api/v2/logs`

**响应** (200):
```json
{
  "success": true,
  "message": "Logs cleared successfully"
}
```

---

### 10. 备份模块 (Backup)

#### 10.1 获取备份列表

**端点**: `GET /api/v2/backups`

**响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "backup-1",
      "name": "Daily Backup",
      "type": "full",
      "size": "1024000000",
      "status": "completed",
      "createdAt": "2026-01-31T10:30:00Z",
      "path": "/backups/daily-backup-20260131.tar.gz"
    }
  ]
}
```

#### 10.2 创建备份

**端点**: `POST /api/v2/backups`

**请求体**:
```json
{
  "name": "Manual Backup",
  "type": "incremental",
  "paths": ["/data/documents", "/data/media"]
}
```

**响应** (200):
```json
{
  "success": true,
  "message": "Backup created successfully",
  "data": {
    "id": "backup-new",
    "name": "Manual Backup",
    "type": "incremental",
    "status": "in_progress",
    "createdAt": "2026-01-31T10:30:00Z"
  }
}
```

#### 10.3 恢复备份

**端点**: `POST /api/v2/backups/:backupId/restore`

**响应** (200):
```json
{
  "success": true,
  "message": "Backup restore started",
  "data": {
    "status": "restoring",
    "backupId": "backup-1"
  }
}
```

#### 10.4 删除备份

**端点**: `DELETE /api/v2/backups/:backupId`

**响应** (200):
```json
{
  "success": true,
  "message": "Backup deleted successfully"
}
```

---

## 📚 数据类型定义

### User
```typescript
interface User {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'guest';
  avatar?: string;
}
```

### SystemStats
```typescript
interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: number;
  timestamp: string;
}
```

### FrpConfig
```typescript
interface FrpConfig {
  id: string;
  name: string;
  type: 'tcp' | 'udp' | 'http' | 'https';
  localIp: string;
  localPort: number;
  remotePort: number;
  status: 'running' | 'stopped';
}
```

### LogEntry
```typescript
interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  timestamp: string;
}
```

### Email
```typescript
interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive';
}
```

### LLMMessage
```typescript
interface LLMMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}
```

### NasFile
```typescript
interface NasFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  updatedAt: string;
  parentId?: string;
}
```

---

## 🔒 安全特性

### XSS 防护

所有 API 响应都经过 XSS 清理：

```typescript
import { sanitizeObject } from '../utils/security/xss-protection';

const data = await response.json();
return sanitizeObject(data);
```

### 速率限制

API 客户端实现了速率限制：

```typescript
import { RateLimiter } from '../utils/security/xss-protection';

const rateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
});

const result = rateLimiter.check('api-client');
if (!result.success) {
  throw new Error(`Rate limit exceeded`);
}
```

### 输入验证

所有用户输入都经过验证：

```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});
```

---

## 🚀 使用示例

### 基础使用

```typescript
import { api } from '@/services/api-v2';

async function getSystemStats() {
  try {
    const stats = await api.system.getStats();
    console.log('CPU Usage:', stats.cpuUsage);
    console.log('Memory Usage:', stats.memoryUsage);
  } catch (error) {
    console.error('Failed to get system stats:', error);
  }
}
```

### 发送邮件

```typescript
async function sendEmail() {
  try {
    await api.mail.sendEmail(
      'user@example.com',
      'Test Subject',
      'This is a test email',
      ['cc@example.com'],
      ['bcc@example.com'],
      []
    );
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
```

### AI 对话

```typescript
async function chatWithAI() {
  try {
    const response = await api.llm.sendMessage('Hello, how are you?');
    console.log('AI Response:', response.content);
  } catch (error) {
    console.error('Failed to chat with AI:', error);
  }
}
```

---

## 📊 错误处理

### 错误响应格式

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}
```

### 常见错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| `AUTH_INVALID` | 认证失败 | 401 |
| `AUTH_EXPIRED` | Token 过期 | 401 |
| `RATE_LIMIT_EXCEEDED` | 速率限制 | 429 |
| `VALIDATION_ERROR` | 输入验证失败 | 400 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `INTERNAL_ERROR` | 内部错误 | 500 |

### 错误处理示例

```typescript
try {
  const result = await api.system.getStats();
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Rate limit exceeded')) {
      console.log('Please wait before retrying');
    } else if (error.message.includes('401')) {
      console.log('Please login again');
    } else {
      console.log('An error occurred:', error.message);
    }
  }
}
```

---

## 📈 性能优化

### 缓存策略

- **内存缓存**: 5 分钟 TTL
- **共享缓存**: 30 分钟 TTL
- **持久化缓存**: 24 小时 TTL

### 请求优化

- **请求去重**: 相同请求在 100ms 内只发送一次
- **批量请求**: 支持批量操作减少请求次数
- **分页加载**: 大数据集使用分页

### 监控指标

- **响应时间**: < 200ms (95th percentile)
- **可用性**: > 99.9%
- **错误率**: < 0.1%

---

## 📞 联系方式

**技术支持**: <admin@0379.email>
**文档维护**: YYC³ 技术团队
**最后更新**: 2026-01-31

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
