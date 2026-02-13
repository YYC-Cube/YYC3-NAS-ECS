# API 多环境设计方案

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

> **文档编号**: YYC3-LP-技术文档-API多环境设计
> **创建日期**: 2026-01-03
> **版本**: 1.0.0
> **作者**: YYC³ Team
> **更新日期**: 2026-01-03

---

## 📋 概述

本文档详细说明了 YYC³ FRP 管理系统的 API 多环境配置设计方案，包括环境配置管理、API 服务切换、开发工作流程等内容。

### 设计目标

1. **环境隔离**: 开发、测试、生产环境完全隔离，避免相互影响
2. **配置统一**: 统一的环境配置管理，便于维护和切换
3. **灵活切换**: 支持运行时环境切换，便于测试和调试
4. **类型安全**: TypeScript 类型定义完整，编译时检查
5. **开发友好**: 开发环境支持 Mock 数据，提高开发效率

---

## 🏗️ 架构设计

### 环境层次结构

```
┌─────────────────────────────────────────────────────────┐
│                     应用层 (Application)                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │           EnvironmentSwitcher 组件               │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  配置管理层 (Config)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │           EnvironmentConfig 类                   │  │
│  │  - 环境检测                                     │  │
│  │  - 配置加载                                     │  │
│  │  - 环境切换                                     │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  服务层 (Services)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │           ApiServiceFactory 类                  │  │
│  │  - MockDataService (模拟数据)                   │  │
│  │  - RealApiService (真实API)                    │  │
│  │  - ApiClient (HTTP客户端)                      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  数据层 (Data)                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  - .env.development (开发环境)                 │  │
│  │  - .env.staging (预发布环境)                   │  │
│  │  - .env.production (生产环境)                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 环境配置文件

### 开发环境 (.env.development)

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
VITE_LOG_LEVEL=debug
```

**特点**:

- ✅ 使用本地 API 服务
- ✅ 启用 Mock 数据
- ✅ 启用调试模式
- ✅ 详细日志输出
- ✅ 热重载支持

### 预发布环境 (.env.staging)

```bash
# 环境标识
NODE_ENV=staging
VITE_APP_ENV=staging

# API配置
VITE_API_BASE_URL=https://staging-api.0379.email
VITE_API_TIMEOUT=30000

# 功能开关
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=info
```

**特点**:

- ✅ 使用预发布 API 服务
- ✅ 禁用 Mock 数据
- ✅ 启用调试模式
- ✅ 信息级日志
- ✅ 接近生产配置

### 生产环境 (.env.production)

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
VITE_LOG_LEVEL=error
```

**特点**:

- ✅ 使用生产 API 服务
- ✅ 禁用 Mock 数据
- ✅ 禁用调试模式
- ✅ 仅错误日志
- ✅ 性能优化

---

## 💻 核心实现

### 1. 环境配置管理 (env.ts)

```typescript
class EnvironmentConfig {
  private currentEnv: Environment;
  private environments: Record<string, Environment>;

  constructor() {
    this.environments = this.loadEnvironments();
    this.currentEnv = this.detectEnvironment();
  }

  public getCurrentEnvironment(): Environment {
    return this.currentEnv;
  }

  public setEnvironment(name: string): boolean {
    if (this.environments[name]) {
      this.currentEnv = this.environments[name];
      return true;
    }
    return false;
  }

  public shouldUseMockData(): boolean {
    return this.currentEnv.enableMockData;
  }
}
```

**功能**:

- 自动检测当前环境
- 支持运行时环境切换
- 提供环境配置访问接口
- 判断是否使用 Mock 数据

### 2. API 服务工厂 (api-v2.ts)

```typescript
class ApiServiceFactory {
  private static instance: ApiService;
  private mockService: MockDataService;
  private realService: RealApiService;

  private getService(): ApiService {
    const useMock = envConfig.shouldUseMockData();
    return useMock ? this.mockService : this.realService;
  }

  public static getInstance(): ApiService {
    if (!ApiServiceFactory.instance) {
      const factory = new ApiServiceFactory();
      ApiServiceFactory.instance = factory.getService();
    }
    return ApiServiceFactory.instance;
  }
}
```

**功能**:

- 根据 `VITE_ENABLE_MOCK_DATA` 自动选择服务
- 单例模式确保服务唯一性
- 支持服务实例重置
- 统一的 API 接口

### 3. HTTP 客户端 (ApiClient)

```typescript
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
```

**功能**:

- 统一的 HTTP 请求封装
- 自动超时处理
- 错误处理和日志记录
- 支持 GET、POST、PUT、DELETE 方法

---

## 🚀 使用方法

### 开发环境启动

```bash
# 启动开发环境（默认）
npm run dev

# 或明确指定开发环境
npm run dev
```

**访问地址**: <http://localhost:5173>

**特点**:

- 使用 `.env.development` 配置
- 启用 Mock 数据
- 启用热重载
- 详细日志输出

### 预发布环境启动

```bash
# 启动预发布环境
npm run dev:staging
```

**访问地址**: <http://localhost:5173>

**特点**:

- 使用 `.env.staging` 配置
- 连接预发布 API
- 启用调试模式
- 信息级日志

### 生产环境构建

```bash
# 构建生产环境
npm run build

# 预览生产构建
npm run preview
```

**输出目录**: `dist/`

**特点**:

- 使用 `.env.production` 配置
- 代码压缩和优化
- 禁用 Source Map
- 仅错误日志

---

## 🎯 环境切换

### 运行时切换

使用 `EnvironmentSwitcher` 组件可以在运行时切换环境：

```typescript
import { EnvironmentSwitcher } from '@/components/EnvironmentSwitcher';

function App() {
  return (
    <div>
      <EnvironmentSwitcher />
      {/* 其他组件 */}
    </div>
  );
}
```

**切换流程**:

1. 用户点击环境切换按钮
2. 调用 `envConfig.setEnvironment(name)`
3. 更新当前环境配置
4. 重新加载页面应用新配置

### 编译时切换

通过 Vite 的 `--mode` 参数指定环境：

```bash
npm run dev --mode development  # 开发环境
npm run dev --mode staging      # 预发布环境
npm run dev --mode production   # 生产环境
```

---

## 📊 配置参数说明

### API 配置

| 参数 | 说明 | 开发环境 | 预发布 | 生产 |
|------|------|----------|--------|------|
| `VITE_API_BASE_URL` | API 基础 URL | `http://localhost:6000` | `https://staging-api.0379.email` | `https://api.0379.email` |
| `VITE_API_TIMEOUT` | 请求超时时间 (ms) | 30000 | 30000 | 30000 |
| `VITE_API_RATE_LIMIT` | 速率限制 (请求/分钟) | 100 | 100 | 100 |

### 功能开关

| 参数 | 说明 | 开发环境 | 预发布 | 生产 |
|------|------|----------|--------|------|
| `VITE_ENABLE_MOCK_DATA` | 启用 Mock 数据 | true | false | false |
| `VITE_ENABLE_DEBUG` | 启用调试模式 | true | true | false |
| `VITE_ENABLE_PERFORMANCE_MONITORING` | 启用性能监控 | true | true | true |
| `VITE_ENABLE_ERROR_TRACKING` | 启用错误追踪 | true | true | true |

### 日志配置

| 参数 | 说明 | 开发环境 | 预发布 | 生产 |
|------|------|----------|--------|------|
| `VITE_LOG_LEVEL` | 日志级别 | debug | info | error |
| `VITE_LOG_TO_CONSOLE` | 输出到控制台 | true | true | false |
| `VITE_LOG_TO_SERVER` | 发送到服务器 | false | true | true |

---

## 🔐 安全考虑

### 敏感信息保护

1. **环境变量隔离**: 不同环境使用不同的配置文件
2. **密钥管理**: 生产环境密钥不提交到代码仓库
3. **HTTPS**: 生产环境强制使用 HTTPS
4. **CORS**: 配置正确的 CORS 策略

### 安全最佳实践

```typescript
// ✅ 正确：使用环境变量
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// ❌ 错误：硬编码敏感信息
const apiUrl = 'https://api.0379.email';

// ✅ 正确：条件判断
if (envConfig.isDebugEnabled()) {
  console.log('Debug info');
}

// ❌ 错误：生产环境输出敏感信息
console.log('User data:', userData);
```

---

## 📈 性能优化

### 开发环境优化

- ✅ 热模块替换 (HMR)
- ✅ 快速刷新
- ✅ Source Map 启用
- ✅ 详细错误信息

### 生产环境优化

- ✅ 代码压缩和混淆
- ✅ Tree Shaking
- ✅ 代码分割
- ✅ 资源优化
- ✅ Gzip 压缩

---

## 🧪 测试策略

### 单元测试

```typescript
import { envConfig } from '../config/env';

describe('EnvironmentConfig', () => {
  it('should detect development environment', () => {
    expect(envConfig.isDevelopment()).toBe(true);
  });

  it('should enable mock data in development', () => {
    expect(envConfig.shouldUseMockData()).toBe(true);
  });
});
```

### 集成测试

```typescript
import { api } from '../services/api-v2';

describe('API Service', () => {
  it('should use mock data in development', async () => {
    const stats = await api.system.getStats();
    expect(stats).toBeDefined();
  });
});
```

---

## 📝 最佳实践

### 1. 环境配置管理

- ✅ 为每个环境创建独立的配置文件
- ✅ 使用 `.env.local` 存储本地开发配置
- ✅ 不要将 `.env.local` 提交到版本控制
- ✅ 使用 `.env.example` 提供配置模板

### 2. API 调用

- ✅ 使用统一的 API 服务接口
- ✅ 正确处理错误和异常
- ✅ 实现请求重试机制
- ✅ 添加请求取消功能

### 3. 环境切换

- ✅ 提供清晰的环境标识
- ✅ 切换前提示用户确认
- ✅ 切换后重新加载页面
- ✅ 记录环境切换日志

---

## 🔍 故障排查

### 常见问题

#### 1. 环境变量未生效

**症状**: 配置修改后不生效

**解决方案**:

```bash
# 重启开发服务器
npm run dev

# 清除缓存
rm -rf node_modules/.vite
npm run dev
```

#### 2. API 请求失败

**症状**: API 请求返回 404 或连接错误

**解决方案**:

- 检查 `VITE_API_BASE_URL` 配置
- 确认后端服务是否运行
- 检查网络连接和防火墙设置
- 查看浏览器控制台错误信息

#### 3. Mock 数据未启用

**症状**: 开发环境仍使用真实 API

**解决方案**:

- 检查 `VITE_ENABLE_MOCK_DATA=true`
- 确认使用正确的环境配置文件
- 重启开发服务器

---

## 📚 相关文档

- [YYC³ 团队智能应用开发标准规范](../../.trae/rules/project_rules.md)
- [API 文档](../YYC3-LP-API文档/)
- [部署发布文档](../YYC3-LP-部署发布/)
- [运维手册](../YYC3-LP-运维阶段/)

---

## 📞 联系方式

**技术支持**: <admin@0379.email>
**文档维护**: YYC³ 技术团队
**最后更新**: 2026-01-03

---

<div align="center">

---

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」


</div>
