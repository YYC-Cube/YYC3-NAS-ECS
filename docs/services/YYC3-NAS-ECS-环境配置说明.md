# YYC³ NAS-ECS 环境配置说明文档

> **文件标识**: YYC3-NAS-ECS-环境配置说明
> **版本**: 1.0.0
> **创建日期**: 2026-01-20
> **作者**: YYC³ Team
> **模块**: 环境配置
> **状态**: ✅ 已完成

---

## 📋 目录

- [概述](#概述)
- [环境类型](#环境类型)
- [配置项说明](#配置项说明)
- [环境配置文件](#环境配置文件)
- [配置验证](#配置验证)
- [最佳实践](#最佳实践)

---

## 概述

### 配置管理

YYC³ NAS-ECS系统使用环境变量进行配置管理，支持多环境配置（开发、测试、生产）。所有配置项都以`VITE_`前缀开头，便于识别和管理。

### 配置文件位置

- 开发环境: `.env.development`
- 测试环境: `.env.staging`
- 生产环境: `.env.production`
- 本地覆盖: `.env.local`（不提交到Git）

### 配置加载优先级

1. `.env.local`（最高优先级）
2. `.env.{environment}`（当前环境）
3. `.env`（基础配置）
4. 默认值

---

## 环境类型

### 开发环境 (development)

**用途**: 本地开发和调试

**特点**:
- 使用本地服务地址
- 启用调试模式
- 启用开发工具
- 使用模拟数据
- 详细日志输出

**配置文件**: `.env.development`

### 测试环境 (staging)

**用途**: 测试和预发布

**特点**:
- 使用测试服务器地址
- 启用性能监控
- 禁用调试模式
- 使用真实数据
- 中等日志级别

**配置文件**: `.env.staging`

### 生产环境 (production)

**用途**: 生产运行环境

**特点**:
- 使用生产服务器地址
- 禁用调试模式
- 禁用开发工具
- 使用真实数据
- 最小日志输出
- 启用错误跟踪

**配置文件**: `.env.production`

---

## 配置项说明

### 应用配置

#### NODE_ENV

**类型**: string  
**默认值**: `development`  
**可选值**: `development`, `staging`, `production`  
**说明**: Node.js运行环境标识

**示例**:
```bash
NODE_ENV=production
```

#### VITE_APP_ENV

**类型**: string  
**默认值**: `development`  
**可选值**: `development`, `staging`, `production`  
**说明**: 应用环境标识，用于应用内部逻辑判断

**示例**:
```bash
VITE_APP_ENV=production
```

### API配置

#### VITE_API_BASE_URL

**类型**: url  
**默认值**: `http://localhost:6000`  
**说明**: API基础URL，所有API请求的基础地址

**开发环境**: `http://localhost:6000`  
**测试环境**: `https://staging-api.0379.email`  
**生产环境**: `https://api.0379.email`

**示例**:
```bash
VITE_API_BASE_URL=https://api.0379.email
```

#### VITE_API_TIMEOUT

**类型**: number  
**默认值**: `30000`  
**单位**: 毫秒  
**说明**: API请求超时时间

**示例**:
```bash
VITE_API_TIMEOUT=30000
```

#### VITE_API_RATE_LIMIT

**类型**: number  
**默认值**: `100`  
**单位**: 请求/分钟  
**说明**: API速率限制

**示例**:
```bash
VITE_API_RATE_LIMIT=100
```

#### VITE_API_PROXY_ENABLED

**类型**: boolean  
**默认值**: `true`（开发环境），`false`（生产环境）  
**说明**: 是否启用API代理

**示例**:
```bash
VITE_API_PROXY_ENABLED=true
```

#### VITE_API_PROXY_TARGET

**类型**: url  
**默认值**: `http://localhost:6000`  
**说明**: API代理目标地址

**示例**:
```bash
VITE_API_PROXY_TARGET=http://localhost:6000
```

### 服务配置

#### VITE_MAIL_API_URL

**类型**: url  
**默认值**: `http://localhost:6003`（开发环境）  
**说明**: 邮件服务API地址

**示例**:
```bash
VITE_MAIL_API_URL=https://mail.0379.email
```

#### VITE_MAIL_REFRESH_INTERVAL

**类型**: number  
**默认值**: `30`（开发环境），`60`（生产环境）  
**单位**: 秒  
**说明**: 邮件刷新间隔

**示例**:
```bash
VITE_MAIL_REFRESH_INTERVAL=60
```

#### VITE_LLM_API_URL

**类型**: url  
**默认值**: `http://localhost:6002`（开发环境）  
**说明**: LLM服务API地址

**示例**:
```bash
VITE_LLM_API_URL=https://llm.0379.email
```

#### VITE_LLM_DEFAULT_MODEL

**类型**: string  
**默认值**: `gpt-4`  
**说明**: 默认LLM模型

**示例**:
```bash
VITE_LLM_DEFAULT_MODEL=gpt-4
```

#### VITE_LLM_MAX_TOKENS

**类型**: number  
**默认值**: `1024`（开发环境），`2048`（生产环境）  
**说明**: LLM最大Token数

**示例**:
```bash
VITE_LLM_MAX_TOKENS=2048
```

#### VITE_REDIS_API_URL

**类型**: url  
**默认值**: `http://localhost:6379`（开发环境）  
**说明**: Redis API地址

**示例**:
```bash
VITE_REDIS_API_URL=https://redis.0379.email
```

#### VITE_DDNS_API_URL

**类型**: url  
**默认值**: `http://localhost:6007`（开发环境）  
**说明**: DDNS服务API地址

**示例**:
```bash
VITE_DDNS_API_URL=https://ddns.0379.email
```

#### VITE_DDNS_UPDATE_INTERVAL

**类型**: number  
**默认值**: `60`（开发环境），`300`（生产环境）  
**单位**: 秒  
**说明**: DDNS更新间隔

**示例**:
```bash
VITE_DDNS_UPDATE_INTERVAL=300
```

#### VITE_FRP_API_URL

**类型**: url  
**默认值**: `http://localhost:6004`（开发环境）  
**说明**: FRP服务API地址

**示例**:
```bash
VITE_FRP_API_URL=https://frp.0379.email
```

#### VITE_FRP_ADMIN_URL

**类型**: url  
**默认值**: `http://localhost:6001`（开发环境）  
**说明**: FRP管理地址

**示例**:
```bash
VITE_FRP_ADMIN_URL=https://frp-admin.0379.email
```

#### VITE_NAS_API_URL

**类型**: url  
**默认值**: `http://localhost:6006`（开发环境）  
**说明**: NAS服务API地址

**示例**:
```bash
VITE_NAS_API_URL=https://nas.0379.email
```

### WebSocket配置

#### VITE_WS_URL

**类型**: url  
**默认值**: `ws://localhost:6000`（开发环境）  
**说明**: WebSocket连接地址

**示例**:
```bash
VITE_WS_URL=wss://api.0379.email
```

#### VITE_WS_RECONNECT_INTERVAL

**类型**: number  
**默认值**: `5000`（开发环境），`10000`（生产环境）  
**单位**: 毫秒  
**说明**: WebSocket重连间隔

**示例**:
```bash
VITE_WS_RECONNECT_INTERVAL=10000
```

#### VITE_WS_MAX_RECONNECT_ATTEMPTS

**类型**: number  
**默认值**: `5`（开发环境），`10`（生产环境）  
**说明**: WebSocket最大重连次数

**示例**:
```bash
VITE_WS_MAX_RECONNECT_ATTEMPTS=10
```

### 认证配置

#### VITE_AUTH_JWT_SECRET

**类型**: string  
**默认值**: `dev-jwt-secret-2026`（开发环境）  
**说明**: JWT密钥，用于Token签名和验证

**安全要求**:
- 长度至少32个字符
- 使用强随机字符串
- 不同环境使用不同密钥

**示例**:
```bash
VITE_AUTH_JWT_SECRET=prod-jwt-secret-2026
```

#### VITE_AUTH_TOKEN_STORAGE

**类型**: string  
**默认值**: `localStorage`  
**可选值**: `localStorage`, `sessionStorage`  
**说明**: Token存储方式

**示例**:
```bash
VITE_AUTH_TOKEN_STORAGE=localStorage
```

#### VITE_AUTH_REFRESH_TOKEN_ENABLED

**类型**: boolean  
**默认值**: `true`  
**说明**: 是否启用Token刷新

**示例**:
```bash
VITE_AUTH_REFRESH_TOKEN_ENABLED=true
```

### 功能开关

#### VITE_ENABLE_MOCK_DATA

**类型**: boolean  
**默认值**: `true`（开发环境），`false`（生产环境）  
**说明**: 是否启用模拟数据

**示例**:
```bash
VITE_ENABLE_MOCK_DATA=false
```

#### VITE_ENABLE_DEBUG

**类型**: boolean  
**默认值**: `true`（开发环境），`false`（生产环境）  
**说明**: 是否启用调试模式

**示例**:
```bash
VITE_ENABLE_DEBUG=false
```

#### VITE_ENABLE_PERFORMANCE_MONITORING

**类型**: boolean  
**默认值**: `true`  
**说明**: 是否启用性能监控

**示例**:
```bash
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

#### VITE_ENABLE_ERROR_TRACKING

**类型**: boolean  
**默认值**: `true`  
**说明**: 是否启用错误跟踪

**示例**:
```bash
VITE_ENABLE_ERROR_TRACKING=true
```

### 日志配置

#### VITE_LOG_LEVEL

**类型**: string  
**默认值**: `debug`（开发环境），`info`（测试环境），`error`（生产环境）  
**可选值**: `debug`, `info`, `warn`, `error`, `fatal`  
**说明**: 日志级别

**示例**:
```bash
VITE_LOG_LEVEL=error
```

#### VITE_LOG_TO_CONSOLE

**类型**: boolean  
**默认值**: `true`（开发环境），`false`（生产环境）  
**说明**: 是否输出日志到控制台

**示例**:
```bash
VITE_LOG_TO_CONSOLE=false
```

#### VITE_LOG_TO_SERVER

**类型**: boolean  
**默认值**: `false`（开发环境），`true`（生产环境）  
**说明**: 是否输出日志到服务器

**示例**:
```bash
VITE_LOG_TO_SERVER=true
```

### 性能配置

#### VITE_CACHE_ENABLED

**类型**: boolean  
**默认值**: `true`  
**说明**: 是否启用缓存

**示例**:
```bash
VITE_CACHE_ENABLED=true
```

#### VITE_CACHE_TTL

**类型**: number  
**默认值**: `300000`（开发环境），`600000`（生产环境）  
**单位**: 毫秒  
**说明**: 缓存过期时间

**示例**:
```bash
VITE_CACHE_TTL=600000
```

#### VITE_DEBOUNCE_DELAY

**类型**: number  
**默认值**: `300`（开发环境），`500`（生产环境）  
**单位**: 毫秒  
**说明**: 防抖延迟

**示例**:
```bash
VITE_DEBOUNCE_DELAY=500
```

### UI配置

#### VITE_THEME

**类型**: string  
**默认值**: `default`  
**可选值**: `default`, `dark`, `light`  
**说明**: 应用主题

**示例**:
```bash
VITE_THEME=default
```

#### VITE_LANGUAGE

**类型**: string  
**默认值**: `zh-CN`  
**可选值**: `zh-CN`, `en-US`, `ja-JP`  
**说明**: 应用语言

**示例**:
```bash
VITE_LANGUAGE=zh-CN
```

#### VITE_TIMEZONE

**类型**: string  
**默认值**: `Asia/Shanghai`  
**说明**: 应用时区

**示例**:
```bash
VITE_TIMEZONE=Asia/Shanghai
```

### 开发工具配置

#### VITE_ENABLE_DEVTOOLS

**类型**: boolean  
**默认值**: `true`（开发环境），`false`（生产环境）  
**说明**: 是否启用开发工具

**示例**:
```bash
VITE_ENABLE_DEVTOOLS=false
```

#### VITE_ENABLE_HOT_RELOAD

**类型**: boolean  
**默认值**: `true`（开发环境），`false`（生产环境）  
**说明**: 是否启用热重载

**示例**:
```bash
VITE_ENABLE_HOT_RELOAD=false
```

#### VITE_SOURCE_MAP

**类型**: boolean  
**默认值**: `true`（开发环境），`false`（生产环境）  
**说明**: 是否生成Source Map

**示例**:
```bash
VITE_SOURCE_MAP=false
```

---

## 环境配置文件

### 开发环境配置 (.env.development)

```bash
# 环境标识
NODE_ENV=development
VITE_APP_ENV=development

# API配置
VITE_API_BASE_URL=http://localhost:6000
VITE_API_TIMEOUT=30000
VITE_API_RATE_LIMIT=100
VITE_API_PROXY_ENABLED=true

# 认证配置
VITE_AUTH_JWT_SECRET=dev-jwt-secret-2026
VITE_AUTH_TOKEN_STORAGE=localStorage
VITE_AUTH_REFRESH_TOKEN_ENABLED=true

# 功能开关
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=true

# 日志配置
VITE_LOG_LEVEL=debug
VITE_LOG_TO_CONSOLE=true
VITE_LOG_TO_SERVER=false

# 开发工具配置
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_HOT_RELOAD=true
VITE_SOURCE_MAP=true
```

### 测试环境配置 (.env.staging)

```bash
# 环境标识
NODE_ENV=staging
VITE_APP_ENV=staging

# API配置
VITE_API_BASE_URL=https://staging-api.0379.email
VITE_API_TIMEOUT=30000
VITE_API_RATE_LIMIT=100
VITE_API_PROXY_ENABLED=false

# 认证配置
VITE_AUTH_JWT_SECRET=staging-jwt-secret-2026
VITE_AUTH_TOKEN_STORAGE=localStorage
VITE_AUTH_REFRESH_TOKEN_ENABLED=true

# 功能开关
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=true

# 日志配置
VITE_LOG_LEVEL=info
VITE_LOG_TO_CONSOLE=false
VITE_LOG_TO_SERVER=true

# 开发工具配置
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_HOT_RELOAD=false
VITE_SOURCE_MAP=false
```

### 生产环境配置 (.env.production)

```bash
# 环境标识
NODE_ENV=production
VITE_APP_ENV=production

# API配置
VITE_API_BASE_URL=https://api.0379.email
VITE_API_TIMEOUT=30000
VITE_API_RATE_LIMIT=100
VITE_API_PROXY_ENABLED=false

# 认证配置
VITE_AUTH_JWT_SECRET=prod-jwt-secret-2026
VITE_AUTH_TOKEN_STORAGE=localStorage
VITE_AUTH_REFRESH_TOKEN_ENABLED=true

# 功能开关
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=true

# 日志配置
VITE_LOG_LEVEL=error
VITE_LOG_TO_CONSOLE=false
VITE_LOG_TO_SERVER=true

# 开发工具配置
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_HOT_RELOAD=false
VITE_SOURCE_MAP=false
```

---

## 配置验证

### 必需配置项

以下配置项为必需项，必须正确配置：

1. `VITE_API_BASE_URL` - API基础URL
2. `VITE_AUTH_JWT_SECRET` - JWT密钥（长度≥32）
3. `VITE_APP_ENV` - 应用环境

### 配置验证方法

```typescript
import { configManager } from '@/services/configService';

// 验证配置
const result = configManager.validate();

if (!result.isValid) {
  console.error('配置验证失败:', result.errors);
  // 处理错误
}
```

### 配置错误处理

当配置验证失败时，系统会：

1. 在控制台输出错误信息
2. 记录到错误日志
3. 显示友好的错误提示
4. 阻止应用启动（对于严重错误）

---

## 最佳实践

### 1. 配置安全

- ✅ 不要将敏感配置提交到Git
- ✅ 使用`.env.local`存储本地配置
- ✅ 定期轮换JWT密钥
- ✅ 使用强随机字符串作为密钥
- ✅ 不同环境使用不同密钥

### 2. 配置管理

- ✅ 为每个环境创建独立的配置文件
- ✅ 使用有意义的配置项名称
- ✅ 为配置项添加注释说明
- ✅ 保持配置文件版本控制
- ✅ 定期审查和更新配置

### 3. 配置验证

- ✅ 在应用启动时验证配置
- ✅ 提供清晰的错误提示
- ✅ 使用类型检查确保配置正确
- ✅ 为配置项设置合理的默认值

### 4. 配置文档

- ✅ 为每个配置项编写文档
- ✅ 说明配置项的用途和默认值
- ✅ 提供配置示例
- ✅ 记录配置变更历史

### 5. 配置监控

- ✅ 监控配置变更
- ✅ 记录配置使用情况
- ✅ 设置配置变更告警
- ✅ 定期审计配置

---

## 附录

### A. 配置项速查表

| 配置项 | 类型 | 默认值 | 必需 | 说明 |
|--------|------|--------|------|------|
| NODE_ENV | string | development | 否 | Node.js环境 |
| VITE_APP_ENV | string | development | 是 | 应用环境 |
| VITE_API_BASE_URL | url | http://localhost:6000 | 是 | API基础URL |
| VITE_API_TIMEOUT | number | 30000 | 否 | API超时时间(ms) |
| VITE_AUTH_JWT_SECRET | string | - | 是 | JWT密钥 |
| VITE_LOG_LEVEL | string | debug | 否 | 日志级别 |
| VITE_ENABLE_DEBUG | boolean | true | 否 | 调试模式 |
| VITE_ENABLE_MOCK_DATA | boolean | true | 否 | 模拟数据 |

### B. 相关文档

- [环境配置管理文档](../services/YYC3-NAS-ECS-环境配置管理文档.md)
- [配置管理服务文档](../services/YYC3-NAS-ECS-设置模块技术文档.md)
- [部署指南](./YYC3-NAS-ECS-上线方案.md)

### C. 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|---------|--------|
| 1.0.0 | 2026-01-20 | 初始版本 | YYC³ Team |

---

<div align="center">

> **「言启象限 | 语枢未来」**
> **「Words Initiate Quadrants, Language Serves as Core for the Future」**

</div>
