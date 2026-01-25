# YYC³ NAS-ECS API模块使用指南

**创建日期**: 2026-01-25  
**作者**: YYC³ Team  
**版本**: 1.0.0  
**更新日期**: 2026-01-25

---

## 📋 目录

1. [快速入门](#快速入门)
2. [API模块概述](#api模块概述)
3. [认证接口](#认证接口)
4. [系统监控接口](#系统监控接口)
5. [FRP管理接口](#frp管理接口)
6. [DDNS管理接口](#ddns管理接口)
7. [NAS管理接口](#nas管理接口)
8. [邮件服务接口](#邮件服务接口)
9. [LLM服务接口](#llm服务接口)
10. [日志服务接口](#日志服务接口)
11. [API使用示例](#api使用示例)
12. [代码示例](#代码示例)
13. [故障排除](#故障排除)
14. [最佳实践](#最佳实践)

---

## 🚀 快速入门

### 1. API基础配置

#### 环境变量配置

```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:6000

# 测试环境
VITE_API_BASE_URL=https://test-api.0379.email

# 生产环境
VITE_API_BASE_URL=https://api.0379.email
```

#### API客户端初始化

```typescript
import { apiV2 } from '@/services/api';

// API客户端已自动配置
// 所有请求都会自动添加认证头
// 所有响应都会自动处理错误
```

### 2. 基础API调用

#### GET请求

```typescript
// 获取系统状态
const stats = await apiV2.system.getStats();
console.log('系统状态:', stats);
```

#### POST请求

```typescript
// 用户登录
const user = await apiV2.auth.login('admin');
console.log('用户信息:', user);
```

#### PUT请求

```typescript
// 更新FRP配置
const config = await apiV2.frp.updateConfig('frp-1', {
  name: 'Updated Service',
  enabled: true
});
console.log('更新后的配置:', config);
```

#### DELETE请求

```typescript
// 删除FRP配置
await apiV2.frp.deleteConfig('frp-1');
console.log('配置已删除');
```

### 3. 错误处理

```typescript
try {
  const stats = await apiV2.system.getStats();
  console.log('系统状态:', stats);
} catch (error) {
  if (error instanceof Error) {
    console.error('请求失败:', error.message);
    
    // 根据错误类型处理
    if (error.message.includes('401')) {
      console.error('未授权，请重新登录');
    } else if (error.message.includes('404')) {
      console.error('资源不存在');
    } else if (error.message.includes('500')) {
      console.error('服务器错误');
    }
  }
}
```

---

## 📖 API模块概述

### 什么是API模块？

API模块是YYC³ NAS-ECS系统的核心服务层，提供统一的RESTful API接口，用于访问和管理系统的各项功能。

### API模块特点

- ✅ **统一接口**: 提供统一的API接口规范
- ✅ **自动认证**: 自动处理JWT令牌认证
- ✅ **错误处理**: 统一的错误处理机制
- ✅ **类型安全**: 完整的TypeScript类型定义
- ✅ **Mock数据**: 支持Mock数据模式，便于开发测试
- ✅ **请求拦截**: 支持请求和响应拦截器
- ✅ **缓存机制**: 内置请求缓存机制

### API架构

```
┌─────────────────┐
│   前端应用       │
│  (React/Next.js) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API客户端       │
│  (api.ts)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API网关        │
│  (Nginx/HTTPS)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  后端服务       │
│  (Flask/FastAPI)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  数据库/缓存     │
│  (PostgreSQL/   │
│   Redis)        │
└─────────────────┘
```

### API端点分类

| 分类 | 端点前缀 | 功能 |
|------|----------|------|
| 认证 | `/api/v2/auth` | 用户认证、令牌管理 |
| 系统监控 | `/api/v2/system` | 系统状态、性能监控 |
| FRP管理 | `/api/v2/frp` | FRP配置管理 |
| DDNS管理 | `/api/v2/ddns` | DDNS服务管理 |
| NAS管理 | `/api/v2/nas` | NAS存储管理 |
| 邮件服务 | `/api/v2/mail` | 邮件发送管理 |
| LLM服务 | `/api/v2/llm` | AI对话服务 |
| 日志服务 | `/api/v2/logs` | 日志查询管理 |

---

## 🔐 认证接口

### 用户登录

```typescript
// 登录接口
const user = await apiV2.auth.login('admin');

// 响应数据
interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  avatar: string;
  token?: string;
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';

async function handleLogin(username: string) {
  try {
    const user = await apiV2.auth.login(username);
    console.log('登录成功:', user);
    
    // 保存用户信息
    localStorage.setItem('user', JSON.stringify(user));
    
    // 保存令牌（如果有）
    if (user.token) {
      localStorage.setItem('auth_token', user.token);
    }
    
    return user;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}
```

### 用户登出

```typescript
// 登出接口
await apiV2.auth.logout();
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';

async function handleLogout() {
  try {
    await apiV2.auth.logout();
    console.log('登出成功');
    
    // 清除本地存储
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    
    // 跳转到登录页
    window.location.href = '/login';
  } catch (error) {
    console.error('登出失败:', error);
    throw error;
  }
}
```

---

## 📊 系统监控接口

### 获取系统状态

```typescript
// 获取系统状态
const stats = await apiV2.system.getStats();

// 响应数据
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

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';
import { useState, useEffect } from 'react';

function SystemStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiV2.system.getStats();
        setStats(data);
      } catch (error) {
        console.error('获取系统状态失败:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // 每5秒刷新
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div>加载中...</div>;

  return (
    <div>
      <h2>系统状态</h2>
      <p>CPU使用率: {stats.cpuUsage.toFixed(1)}%</p>
      <p>内存使用率: {stats.memoryUsage.toFixed(1)}%</p>
      <p>磁盘使用率: {stats.diskUsage.toFixed(1)}%</p>
      <p>网络入站: {stats.networkIn.toFixed(0)} KB/s</p>
      <p>网络出站: {stats.networkOut.toFixed(0)} KB/s</p>
      <p>运行时间: {Math.floor(stats.uptime / 3600)} 小时</p>
    </div>
  );
}
```

### 获取详细统计

```typescript
// 获取详细统计
const detailedStats = await apiV2.system.getDetailedStats();

// 响应数据
interface DetailedStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    usage: number;
    total: number;
    used: number;
  };
  disk: {
    usage: number;
    total: number;
    used: number;
  };
  network: {
    in: number;
    out: number;
  };
  system: {
    uptime: string;
    hostname: string;
  };
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';

async function getDetailedSystemInfo() {
  try {
    const stats = await apiV2.system.getDetailedStats();
    console.log('CPU信息:', stats.cpu);
    console.log('内存信息:', stats.memory);
    console.log('磁盘信息:', stats.disk);
    console.log('网络信息:', stats.network);
    console.log('系统信息:', stats.system);
    
    return stats;
  } catch (error) {
    console.error('获取详细统计失败:', error);
    throw error;
  }
}
```

---

## 🌐 FRP管理接口

### 获取FRP配置列表

```typescript
// 获取FRP配置列表
const configs = await apiV2.frp.getConfigs();

// 响应数据
interface FrpConfig {
  id: string;
  name: string;
  type: 'tcp' | 'udp' | 'http' | 'https';
  localIp: string;
  localPort: number;
  remotePort: number;
  subdomain?: string;
  enabled: boolean;
  status: 'running' | 'stopped' | 'error';
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';
import { useState, useEffect } from 'react';

function FRPConfigList() {
  const [configs, setConfigs] = useState<FrpConfig[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await apiV2.frp.getConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('获取FRP配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return (
    <div>
      <h2>FRP配置列表</h2>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>本地地址</th>
              <th>远程端口</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {configs.map(config => (
              <tr key={config.id}>
                <td>{config.name}</td>
                <td>{config.type}</td>
                <td>{config.localIp}:{config.localPort}</td>
                <td>{config.remotePort}</td>
                <td>{config.status}</td>
                <td>
                  <button onClick={() => handleToggle(config.id)}>
                    {config.enabled ? '停止' : '启动'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### 创建FRP配置

```typescript
// 创建FRP配置
const config = await apiV2.frp.createConfig({
  name: 'Web Service',
  type: 'http',
  localIp: '127.0.0.1',
  localPort: 8080,
  subdomain: 'web',
  enabled: true
});
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';

async function createFRPConfig() {
  try {
    const config = await apiV2.frp.createConfig({
      name: 'Web Service',
      type: 'http',
      localIp: '127.0.0.1',
      localPort: 8080,
      subdomain: 'web',
      enabled: true
    });
    
    console.log('FRP配置创建成功:', config);
    return config;
  } catch (error) {
    console.error('创建FRP配置失败:', error);
    throw error;
  }
}
```

### 更新FRP配置

```typescript
// 更新FRP配置
const config = await apiV2.frp.updateConfig('frp-1', {
  name: 'Updated Service',
  enabled: false
});
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';

async function updateFRPConfig(configId: string) {
  try {
    const config = await apiV2.frp.updateConfig(configId, {
      name: 'Updated Service',
      enabled: false
    });
    
    console.log('FRP配置更新成功:', config);
    return config;
  } catch (error) {
    console.error('更新FRP配置失败:', error);
    throw error;
  }
}
```

### 删除FRP配置

```typescript
// 删除FRP配置
await apiV2.frp.deleteConfig('frp-1');
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';

async function deleteFRPConfig(configId: string) {
  try {
    await apiV2.frp.deleteConfig(configId);
    console.log('FRP配置删除成功');
  } catch (error) {
    console.error('删除FRP配置失败:', error);
    throw error;
  }
}
```

---

## 🌐 DDNS管理接口

### 获取DDNS状态

```typescript
// 获取DDNS状态
const status = await apiV2.ddns.getStatus();

// 响应数据
interface DDNSStatus {
  running: boolean;
  enabled: boolean;
  provider: string;
  domain: string;
  currentIP: string;
  expectedIP: string;
  lastUpdate: string;
  nextUpdate: number;
  updateInterval: number;
  status: string;
  message: string;
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';
import { useState, useEffect } from 'react';

function DDNSStatus() {
  const [status, setStatus] = useState<DDNSStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiV2.ddns.getStatus();
        setStatus(data);
      } catch (error) {
        console.error('获取DDNS状态失败:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, []);

  if (!status) return <div>加载中...</div>;

  return (
    <div>
      <h2>DDNS状态</h2>
      <p>运行状态: {status.running ? '运行中' : '已停止'}</p>
      <p>域名: {status.domain}</p>
      <p>当前IP: {status.currentIP}</p>
      <p>最后更新: {status.lastUpdate}</p>
      <p>下次更新: {new Date(status.nextUpdate).toLocaleString()}</p>
    </div>
  );
}
```

### 手动更新DDNS

```typescript
// 手动更新DDNS
const result = await apiV2.ddns.update();

// 响应数据
interface DDNSUpdateResult {
  success: boolean;
  oldIP: string;
  newIP: string;
  changed: boolean;
  message: string;
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';

async function updateDDNS() {
  try {
    const result = await apiV2.ddns.update();
    console.log('DDNS更新结果:', result);
    
    if (result.changed) {
      console.log(`IP地址已变化: ${result.oldIP} -> ${result.newIP}`);
    } else {
      console.log('IP地址未变化，无需更新');
    }
    
    return result;
  } catch (error) {
    console.error('更新DDNS失败:', error);
    throw error;
  }
}
```

---

## 💾 NAS管理接口

### 获取NAS状态

```typescript
// 获取NAS状态
const status = await apiV2.nas.getStatus();

// 响应数据
interface NASStatus {
  running: boolean;
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  version: string;
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';
import { useState, useEffect } from 'react';

function NASStatus() {
  const [status, setStatus] = useState<NASStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiV2.nas.getStatus();
        setStatus(data);
      } catch (error) {
        console.error('获取NAS状态失败:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, []);

  if (!status) return <div>加载中...</div>;

  return (
    <div>
      <h2>NAS状态</h2>
      <p>运行状态: {status.status}</p>
      <p>系统版本: {status.version}</p>
      <p>运行时间: {status.uptime}</p>
      <p>CPU使用率: {status.cpuUsage.toFixed(1)}%</p>
      <p>内存使用率: {status.memoryUsage.toFixed(1)}%</p>
      <p>系统温度: {status.temperature}°C</p>
    </div>
  );
}
```

### 获取存储卷列表

```typescript
// 获取存储卷列表
const volumes = await apiV2.nas.getVolumes();

// 响应数据
interface VolumeInfo {
  id: string;
  name: string;
  type: string;
  total: number;
  used: number;
  available: number;
  health: 'healthy' | 'warning' | 'error';
  mountPoint: string;
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';
import { useState, useEffect } from 'react';

function VolumeList() {
  const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVolumes = async () => {
    setLoading(true);
    try {
      const data = await apiV2.nas.getVolumes();
      setVolumes(data);
    } catch (error) {
      console.error('获取存储卷列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
  }, []);

  return (
    <div>
      <h2>存储卷列表</h2>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>总容量</th>
              <th>已使用</th>
              <th>可用</th>
              <th>健康状态</th>
            </tr>
          </thead>
          <tbody>
            {volumes.map(volume => (
              <tr key={volume.id}>
                <td>{volume.name}</td>
                <td>{volume.type}</td>
                <td>{volume.total} GB</td>
                <td>{volume.used} GB</td>
                <td>{volume.available} GB</td>
                <td>{volume.health}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## 📧 邮件服务接口

### 发送邮件

```typescript
// 发送邮件
const result = await apiV2.mail.sendEmail({
  to: 'user@example.com',
  subject: '测试邮件',
  body: '这是一封测试邮件',
  html: '<p>这是一封测试邮件</p>'
});

// 响应数据
interface EmailResult {
  success: boolean;
  messageId: string;
  status: string;
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';

async function sendEmail() {
  try {
    const result = await apiV2.mail.sendEmail({
      to: 'user@example.com',
      subject: '测试邮件',
      body: '这是一封测试邮件',
      html: '<p>这是一封测试邮件</p>'
    });
    
    console.log('邮件发送成功:', result);
    return result;
  } catch (error) {
    console.error('发送邮件失败:', error);
    throw error;
  }
}
```

### 批量发送邮件

```typescript
// 批量发送邮件
const result = await apiV2.mail.sendBulkEmail({
  recipients: [
    { to: 'user1@example.com', name: 'User 1' },
    { to: 'user2@example.com', name: 'User 2' }
  ],
  subject: '批量邮件',
  body: '这是一封批量邮件',
  html: '<p>这是一封批量邮件</p>'
});
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';

async function sendBulkEmail() {
  try {
    const result = await apiV2.mail.sendBulkEmail({
      recipients: [
        { to: 'user1@example.com', name: 'User 1' },
        { to: 'user2@example.com', name: 'User 2' }
      ],
      subject: '批量邮件',
      body: '这是一封批量邮件',
      html: '<p>这是一封批量邮件</p>'
    });
    
    console.log('批量邮件发送成功:', result);
    return result;
  } catch (error) {
    console.error('发送批量邮件失败:', error);
    throw error;
  }
}
```

---

## 🤖 LLM服务接口

### 发送AI对话

```typescript
// 发送AI对话
const response = await apiV2.llm.generateChat({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: '你是一个有用的助手' },
    { role: 'user', content: '你好，请介绍一下自己' }
  ],
  stream: true
});

// 响应数据
interface LLMResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';
import { useState } from 'react';

function AIChat() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const newMessages = [
        ...messages,
        { role: 'user', content: input }
      ];
      
      const response = await apiV2.llm.generateChat({
        model: 'gpt-4',
        messages: newMessages,
        stream: false
      });
      
      const assistantMessage = response.choices[0].message;
      setMessages([
        ...newMessages,
        assistantMessage
      ]);
      
      setInput('');
    } catch (error) {
      console.error('发送AI对话失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>AI对话</h2>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入消息..."
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? '发送中...' : '发送'}
      </button>
    </div>
  );
}
```

### 获取模型列表

```typescript
// 获取模型列表
const models = await apiV2.llm.listModels();

// 响应数据
interface LLMModel {
  id: string;
  name: string;
  provider: string;
  type: string;
  contextLength: number;
  pricing: {
    input: number;
    output: number;
  };
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';
import { useState, useEffect } from 'react';

function ModelList() {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const data = await apiV2.llm.listModels();
      setModels(data);
    } catch (error) {
      console.error('获取模型列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <div>
      <h2>AI模型列表</h2>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>提供商</th>
              <th>类型</th>
              <th>上下文长度</th>
            </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr key={model.id}>
                <td>{model.name}</td>
                <td>{model.provider}</td>
                <td>{model.type}</td>
                <td>{model.contextLength}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

## 📝 日志服务接口

### 获取日志列表

```typescript
// 获取日志列表
const logs = await apiV2.logs.getLogs({
  level: 'info',
  limit: 100,
  offset: 0
});

// 响应数据
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  source: string;
  metadata?: Record<string, any>;
}
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';
import { useState, useEffect } from 'react';

function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiV2.logs.getLogs({
        level: 'info',
        limit: 100,
        offset: 0
      });
      setLogs(data);
    } catch (error) {
      console.error('获取日志列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <h2>日志查看器</h2>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>级别</th>
              <th>来源</th>
              <th>消息</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.timestamp}</td>
                <td>{log.level}</td>
                <td>{log.source}</td>
                <td>{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### 搜索日志

```typescript
// 搜索日志
const logs = await apiV2.logs.searchLogs({
  query: 'error',
  level: 'error',
  startTime: '2026-01-01T00:00:00Z',
  endTime: '2026-01-25T23:59:59Z',
  limit: 50
});
```

**使用示例**:
```typescript
import { apiV2 } from '@/services/api';

async function searchErrorLogs() {
  try {
    const logs = await apiV2.logs.searchLogs({
      query: 'error',
      level: 'error',
      startTime: '2026-01-01T00:00:00Z',
      endTime: '2026-01-25T23:59:59Z',
      limit: 50
    });
    
    console.log('搜索到错误日志:', logs);
    return logs;
  } catch (error) {
    console.error('搜索日志失败:', error);
    throw error;
  }
}
```

---

## 💻 API使用示例

### 完整的API客户端封装

```typescript
// api-client.ts
import { apiV2 } from '@/services/api';

class APIClient {
  private static instance: APIClient;

  private constructor() {}

  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  // 系统管理
  async getSystemStats() {
    return await apiV2.system.getStats();
  }

  async getDetailedStats() {
    return await apiV2.system.getDetailedStats();
  }

  // FRP管理
  async getFRPConfigs() {
    return await apiV2.frp.getConfigs();
  }

  async createFRPConfig(config: any) {
    return await apiV2.frp.createConfig(config);
  }

  async updateFRPConfig(id: string, config: any) {
    return await apiV2.frp.updateConfig(id, config);
  }

  async deleteFRPConfig(id: string) {
    return await apiV2.frp.deleteConfig(id);
  }

  // DDNS管理
  async getDDNSStatus() {
    return await apiV2.ddns.getStatus();
  }

  async updateDDNS() {
    return await apiV2.ddns.update();
  }

  // NAS管理
  async getNASStatus() {
    return await apiV2.nas.getStatus();
  }

  async getVolumes() {
    return await apiV2.nas.getVolumes();
  }

  // 邮件服务
  async sendEmail(email: any) {
    return await apiV2.mail.sendEmail(email);
  }

  async sendBulkEmail(email: any) {
    return await apiV2.mail.sendBulkEmail(email);
  }

  // LLM服务
  async generateChat(chat: any) {
    return await apiV2.llm.generateChat(chat);
  }

  async listModels() {
    return await apiV2.llm.listModels();
  }

  // 日志服务
  async getLogs(options: any) {
    return await apiV2.logs.getLogs(options);
  }

  async searchLogs(options: any) {
    return await apiV2.logs.searchLogs(options);
  }
}

export const apiClient = APIClient.getInstance();
```

### 使用API客户端

```typescript
import { apiClient } from './api-client';

// 获取系统状态
const stats = await apiClient.getSystemStats();

// 获取FRP配置
const configs = await apiClient.getFRPConfigs();

// 创建FRP配置
const config = await apiClient.createFRPConfig({
  name: 'Web Service',
  type: 'http',
  localIp: '127.0.0.1',
  localPort: 8080,
  subdomain: 'web',
  enabled: true
});

// 发送邮件
const result = await apiClient.sendEmail({
  to: 'user@example.com',
  subject: '测试邮件',
  body: '这是一封测试邮件'
});

// 发送AI对话
const response = await apiClient.generateChat({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: '你好' }
  ]
});
```

---

## 🔧 代码示例

### React Hook示例

```typescript
// hooks/useSystemStats.ts
import { useState, useEffect } from 'react';
import { apiV2 } from '@/services/api';

interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: number;
  timestamp: string;
}

export function useSystemStats(refreshInterval = 5000) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiV2.system.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取系统状态失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { stats, loading, error, refetch: fetchStats };
}
```

### 使用React Hook

```typescript
import { useSystemStats } from '@/hooks/useSystemStats';

function SystemStatsComponent() {
  const { stats, loading, error, refetch } = useSystemStats(5000);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h2>系统状态</h2>
      <p>CPU使用率: {stats.cpuUsage.toFixed(1)}%</p>
      <p>内存使用率: {stats.memoryUsage.toFixed(1)}%</p>
      <p>磁盘使用率: {stats.diskUsage.toFixed(1)}%</p>
      <button onClick={refetch}>刷新</button>
    </div>
  );
}
```

---

## 🔍 故障排除

### 常见问题

#### 1. API请求失败

**问题**: API请求返回错误

**解决方案**:

```typescript
try {
  const result = await apiV2.system.getStats();
  console.log(result);
} catch (error) {
  if (error instanceof Error) {
    console.error('错误信息:', error.message);
    
    // 检查网络连接
    if (error.message.includes('Failed to fetch')) {
      console.error('网络连接失败，请检查网络设置');
    }
    
    // 检查认证
    if (error.message.includes('401')) {
      console.error('认证失败，请重新登录');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    // 检查服务器状态
    if (error.message.includes('500')) {
      console.error('服务器错误，请稍后重试');
    }
  }
}
```

#### 2. Mock数据不生效

**问题**: 使用Mock数据模式时仍然请求真实API

**解决方案**:

```typescript
// 检查环境变量配置
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Use Mock Data:', import.meta.env.VITE_USE_MOCK_DATA);

// 确保Mock数据模式已启用
if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
  console.log('Mock数据模式已启用');
} else {
  console.log('Mock数据模式未启用，将使用真实API');
}
```

#### 3. 认证令牌过期

**问题**: 认证令牌过期导致请求失败

**解决方案**:

```typescript
// 添加请求拦截器
apiV2.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return config;
});

// 添加响应拦截器
apiV2.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 令牌过期，尝试刷新令牌
      try {
        const newToken = await refreshToken();
        localStorage.setItem('auth_token', newToken);
        
        // 重试原始请求
        return apiV2.request(error.config);
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 📚 最佳实践

### 1. 错误处理

```typescript
// 统一的错误处理
async function handleAPICall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(errorMessage, error);
    
    if (error instanceof Error) {
      // 显示错误提示
      toast.error(error.message);
    }
    
    return null;
  }
}

// 使用示例
const stats = await handleAPICall(
  () => apiV2.system.getStats(),
  '获取系统状态失败'
);
```

### 2. 请求重试

```typescript
// 请求重试机制
async function retryAPICall<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

// 使用示例
const stats = await retryAPICall(
  () => apiV2.system.getStats(),
  3,
  1000
);
```

### 3. 请求取消

```typescript
// 请求取消
import { AbortController } from 'abort-controller';

async function fetchWithCancel() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const stats = await apiV2.system.getStats({
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return stats;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('请求超时');
    } else {
      console.error('请求失败:', error);
    }
    throw error;
  }
}
```

### 4. 请求缓存

```typescript
// 简单的请求缓存
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 60000; // 1分钟

async function cachedAPICall<T>(
  key: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('使用缓存数据:', key);
    return cached.data;
  }
  
  const data = await apiCall();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// 使用示例
const stats = await cachedAPICall(
  'system-stats',
  () => apiV2.system.getStats()
);
```

---

## 📞 联系方式

如有问题，请检查日志文件或联系系统管理员。

- **服务器IP**: 8.152.195.33
- **API服务**: <https://api.0379.email>
- **部署时间**: 2026-01-25

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
