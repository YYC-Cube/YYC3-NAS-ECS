# YYC³ NAS-ECS 环境配置管理文档

> **文件标识**: YYC3-NAS-ECS-环境配置管理文档
> **版本**: 1.0.0
> **创建日期**: 2026-01-20
> **作者**: YYC³ Team
> **模块**: 环境配置
> **状态**: ✅ 已完成

---

## 📋 目录

- [概述](#概述)
- [配置文件结构](#配置文件结构)
- [环境配置说明](#环境配置说明)
- [配置项说明](#配置项说明)
- [配置管理](#配置管理)
- [配置安全](#配置安全)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

---

## 概述

### 功能描述

YYC³ NAS-ECS 环境配置管理系统提供多环境配置支持，包括开发环境、测试环境和生产环境。该系统遵循「五高五标五化」标准，确保配置管理的标准化、规范化和安全性。

### 核心特性

- ✅ **多环境支持**: 支持开发、测试、生产等多个环境
- ✅ **配置分层**: 基础配置、环境配置、服务配置分层管理
- ✅ **配置验证**: 配置项类型和格式验证
- ✅ **配置加密**: 敏感配置加密存储
- ✅ **配置同步**: 环境间配置同步机制
- ✅ **配置版本**: 配置版本控制和历史记录
- ✅ **配置监控**: 配置变更监控和告警

---

## 配置文件结构

### 目录结构

```
YYC3-NAS-ECS/
├── config/
│   ├── services/
│   │   └── .env.example          # 服务配置示例
│   ├── .env.base                 # 基础配置（共享）
│   ├── .env.development          # 开发环境配置
│   ├── .env.staging              # 测试环境配置
│   ├── .env.production           # 生产环境配置
│   └── load-env.sh               # 配置加载脚本
└── .gitignore                    # Git忽略文件（包含.env文件）
```

### 配置文件说明

| 文件名 | 说明 | 是否提交到Git |
|--------|------|---------------|
| `.env.base` | 基础配置，所有环境共享 | ✅ 是 |
| `.env.development` | 开发环境配置 | ❌ 否 |
| `.env.staging` | 测试环境配置 | ❌ 否 |
| `.env.production` | 生产环境配置 | ❌ 否 |
| `.env.example` | 配置示例文件 | ✅ 是 |
| `load-env.sh` | 配置加载脚本 | ✅ 是 |

---

## 环境配置说明

### 开发环境 (.env.development)

**用途**: 本地开发环境

**特点**:
- 使用本地服务地址
- 启用调试模式
- 启用开发工具
- 使用模拟数据
- 详细日志输出

**配置示例**:

```bash
# 环境标识
NODE_ENV=development
VITE_APP_ENV=development

# API配置
VITE_API_BASE_URL=http://localhost:6000
VITE_API_TIMEOUT=30000

# 功能开关
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEBUG=true
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_HOT_RELOAD=true
```

### 测试环境 (.env.staging)

**用途**: 测试和预发布环境

**特点**:
- 使用测试服务器地址
- 启用性能监控
- 禁用调试模式
- 使用真实数据
- 中等日志级别

**配置示例**:

```bash
# 环境标识
NODE_ENV=staging
VITE_APP_ENV=staging

# API配置
VITE_API_BASE_URL=https://staging-api.0379.email
VITE_API_TIMEOUT=30000

# 功能开关
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=true
```

### 生产环境 (.env.production)

**用途**: 生产运行环境

**特点**:
- 使用生产服务器地址
- 禁用调试模式
- 禁用开发工具
- 使用真实数据
- 最小日志输出
- 启用错误跟踪

**配置示例**:

```bash
# 环境标识
NODE_ENV=production
VITE_APP_ENV=production

# API配置
VITE_API_BASE_URL=https://api.0379.email
VITE_API_TIMEOUT=30000

# 功能开关
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_HOT_RELOAD=false
```

---

## 配置项说明

### 应用配置

#### 环境标识

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `NODE_ENV` | Node.js环境 | `development` | `staging` | `production` |
| `VITE_APP_ENV` | 应用环境 | `development` | `staging` | `production` |

### API配置

#### API基础配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_API_BASE_URL` | API基础URL | `http://localhost:6000` | `https://staging-api.0379.email` | `https://api.0379.email` |
| `VITE_API_TIMEOUT` | API超时时间（毫秒） | `30000` | `30000` | `30000` |
| `VITE_API_RATE_LIMIT` | API速率限制 | `100` | `100` | `100` |

#### API代理配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_API_PROXY_ENABLED` | 是否启用API代理 | `true` | `false` | `false` |
| `VITE_API_PROXY_TARGET` | API代理目标 | `http://localhost:6000` | - | - |

### 服务配置

#### 邮件服务配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_MAIL_API_URL` | 邮件服务API地址 | `http://localhost:6003` | `https://mail.0379.email` | `https://mail.0379.email` |
| `VITE_MAIL_REFRESH_INTERVAL` | 邮件刷新间隔（秒） | `30` | `60` | `60` |

#### LLM服务配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_LLM_API_URL` | LLM服务API地址 | `http://localhost:6002` | `https://llm.0379.email` | `https://llm.0379.email` |
| `VITE_LLM_DEFAULT_MODEL` | 默认LLM模型 | `gpt-4` | `gpt-4` | `gpt-4` |
| `VITE_LLM_MAX_TOKENS` | 最大Token数 | `1024` | `2048` | `2048` |

#### Redis服务配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_REDIS_API_URL` | Redis API地址 | `http://localhost:6379` | `https://redis.0379.email` | `https://redis.0379.email` |

#### DDNS服务配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_DDNS_API_URL` | DDNS服务API地址 | `http://localhost:6007` | `https://ddns.0379.email` | `https://ddns.0379.email` |
| `VITE_DDNS_UPDATE_INTERVAL` | DDNS更新间隔（秒） | `60` | `300` | `300` |

#### FRP服务配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_FRP_API_URL` | FRP服务API地址 | `http://localhost:6004` | `https://frp.0379.email` | `https://frp.0379.email` |
| `VITE_FRP_ADMIN_URL` | FRP管理地址 | `http://localhost:6001` | `https://frp-admin.0379.email` | `https://frp-admin.0379.email` |

#### NAS服务配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_NAS_API_URL` | NAS服务API地址 | `http://localhost:6006` | `https://nas.0379.email` | `https://nas.0379.email` |

### WebSocket配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_WS_URL` | WebSocket地址 | `ws://localhost:6000` | `wss://api.0379.email` | `wss://api.0379.email` |
| `VITE_WS_RECONNECT_INTERVAL` | 重连间隔（毫秒） | `5000` | `10000` | `10000` |
| `VITE_WS_MAX_RECONNECT_ATTEMPTS` | 最大重连次数 | `5` | `10` | `10` |

### 认证配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_AUTH_JWT_SECRET` | JWT密钥 | `dev-jwt-secret-2026` | `staging-jwt-secret-2026` | `prod-jwt-secret-2026` |
| `VITE_AUTH_TOKEN_STORAGE` | Token存储方式 | `localStorage` | `localStorage` | `localStorage` |
| `VITE_AUTH_REFRESH_TOKEN_ENABLED` | 是否启用刷新Token | `true` | `true` | `true` |

### 功能开关

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_ENABLE_MOCK_DATA` | 是否启用模拟数据 | `true` | `false` | `false` |
| `VITE_ENABLE_DEBUG` | 是否启用调试模式 | `true` | `false` | `false` |
| `VITE_ENABLE_PERFORMANCE_MONITORING` | 是否启用性能监控 | `true` | `true` | `true` |
| `VITE_ENABLE_ERROR_TRACKING` | 是否启用错误跟踪 | `true` | `true` | `true` |

### 日志配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_LOG_LEVEL` | 日志级别 | `debug` | `info` | `error` |
| `VITE_LOG_TO_CONSOLE` | 是否输出到控制台 | `true` | `false` | `false` |
| `VITE_LOG_TO_SERVER` | 是否输出到服务器 | `false` | `true` | `true` |

### 性能配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_CACHE_ENABLED` | 是否启用缓存 | `true` | `true` | `true` |
| `VITE_CACHE_TTL` | 缓存过期时间（毫秒） | `300000` | `600000` | `600000` |
| `VITE_DEBOUNCE_DELAY` | 防抖延迟（毫秒） | `300` | `500` | `500` |

### UI配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_THEME` | 主题 | `default` | `default` | `default` |
| `VITE_LANGUAGE` | 语言 | `zh-CN` | `zh-CN` | `zh-CN` |
| `VITE_TIMEZONE` | 时区 | `Asia/Shanghai` | `Asia/Shanghai` | `Asia/Shanghai` |

### 开发工具配置

| 配置项 | 说明 | 开发 | 测试 | 生产 |
|--------|------|------|------|------|
| `VITE_ENABLE_DEVTOOLS` | 是否启用开发工具 | `true` | `false` | `false` |
| `VITE_ENABLE_HOT_RELOAD` | 是否启用热重载 | `true` | `false` | `false` |
| `VITE_SOURCE_MAP` | 是否生成Source Map | `true` | `false` | `false` |

---

## 配置管理

### 配置加载

#### 自动加载

Vite会自动根据`NODE_ENV`加载对应的`.env`文件：

```bash
# 开发环境
npm run dev  # 加载 .env.development

# 生产构建
npm run build  # 加载 .env.production
```

#### 手动加载

使用`load-env.sh`脚本手动加载配置：

```bash
#!/bin/bash

# 加载开发环境配置
export NODE_ENV=development
source .env.development

# 加载生产环境配置
export NODE_ENV=production
source .env.production
```

### 配置验证

#### 配置验证脚本

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  VITE_API_BASE_URL: z.string().url(),
  VITE_API_TIMEOUT: z.string().transform(Number),
  VITE_AUTH_JWT_SECRET: z.string().min(32),
});

function validateEnv() {
  const result = envSchema.safeParse(import.meta.env);
  
  if (!result.success) {
    console.error('环境配置验证失败:', result.error);
    process.exit(1);
  }
  
  console.log('环境配置验证通过');
}

validateEnv();
```

### 配置同步

#### 环境间配置同步

```bash
#!/bin/bash

# 从开发环境同步到测试环境
cp .env.development .env.staging

# 从测试环境同步到生产环境
cp .env.staging .env.production
```

#### 配置差异检查

```bash
#!/bin/bash

# 比较两个环境的配置差异
diff .env.development .env.staging
diff .env.staging .env.production
```

### 配置版本控制

#### 配置变更记录

每次配置变更都应该记录：

```bash
# 配置变更记录
# 日期: 2026-01-20
# 变更人: 张三
# 变更内容: 更新API超时时间从30000改为60000
# 影响范围: 所有环境
```

#### 配置回滚

```bash
# 回滚到上一个版本
git checkout HEAD~1 .env.production
```

---

## 配置安全

### 敏感配置加密

#### 加密敏感配置

```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || 'default-secret-key-32-bytes';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// 加密JWT密钥
const encryptedSecret = encrypt('my-jwt-secret');
console.log('加密后:', encryptedSecret);

// 解密JWT密钥
const decryptedSecret = decrypt(encryptedSecret);
console.log('解密后:', decryptedSecret);
```

### 配置访问控制

#### 限制配置文件访问

```bash
# 设置配置文件权限
chmod 600 .env.development
chmod 600 .env.staging
chmod 600 .env.production

# 设置配置目录权限
chmod 700 config/
```

### 配置审计

#### 配置变更审计

```typescript
interface ConfigChange {
  timestamp: string;
  user: string;
  configKey: string;
  oldValue: string;
  newValue: string;
  environment: string;
}

function logConfigChange(change: ConfigChange) {
  const logEntry = JSON.stringify(change);
  console.log('配置变更:', logEntry);
  
  // 发送到审计日志系统
  sendToAuditLog(logEntry);
}
```

---

## 最佳实践

### 1. 配置命名规范

- 使用大写字母和下划线
- 使用前缀区分配置类型
- 保持命名的一致性

**示例**:
- `VITE_API_BASE_URL`
- `VITE_AUTH_JWT_SECRET`
- `VITE_LOG_LEVEL`

### 2. 配置分层

- 基础配置: 所有环境共享
- 环境配置: 特定环境配置
- 服务配置: 微服务配置

### 3. 配置验证

- 启动时验证配置
- 提供清晰的错误提示
- 使用类型检查

### 4. 配置安全

- 敏感配置加密存储
- 限制配置文件访问
- 定期轮换密钥

### 5. 配置文档

- 为每个配置项添加注释
- 提供配置示例
- 记录配置变更历史

### 6. 配置监控

- 监控配置变更
- 配置变更告警
- 配置使用统计

---

## 故障排除

### 常见问题

#### 1. 配置未生效

**原因**: 配置文件未加载、缓存问题、环境变量未设置

**解决方案**:
- 检查配置文件是否存在
- 清除缓存并重新构建
- 确认环境变量已设置

#### 2. 配置验证失败

**原因**: 配置项类型错误、必填项缺失、格式不正确

**解决方案**:
- 检查配置项类型是否正确
- 确认必填项已填写
- 检查配置项格式

#### 3. 敏感配置泄露

**原因**: 配置文件提交到Git、日志输出敏感信息

**解决方案**:
- 检查.gitignore是否包含.env文件
- 从Git历史中移除敏感配置
- 避免在日志中输出敏感信息

#### 4. 配置冲突

**原因**: 多个配置文件中存在相同配置项、配置优先级错误

**解决方案**:
- 检查配置文件是否存在冲突
- 确认配置加载顺序
- 使用明确的配置优先级

---

## 更新日志

### v1.0.0 (2026-01-20)

- ✅ 初始版本发布
- ✅ 实现多环境配置支持
- ✅ 实现配置验证功能
- ✅ 实现配置加密功能
- ✅ 实现配置审计功能

---

## 联系方式

如有问题或建议，请联系：

- **邮箱**: support@0379.email
- **工单**: 提交技术支持工单
- **文档**: 查看帮助中心

---

<div align="center">

> **「言启象限 | 语枢未来」**
> **「Words Initiate Quadrants, Language Serves as Core for the Future」**

</div>
