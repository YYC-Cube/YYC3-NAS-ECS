# YYC³ NAS-ECS 测试环境配置

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

**创建日期**：2026-02-03
**作者**：YYC³ Team
**版本**：1.0.0
**更新日期**：2026-02-03

---

## 📋 目录

- [环境搭建](#环境搭建)
- [环境配置](#环境配置)
- [环境维护](#环境维护)
- [环境监控](#环境监控)

---

## 🏗️ 环境搭建

### 开发环境

#### 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2核 | 4核 |
| 内存 | 4GB | 8GB |
| 硬盘 | 20GB | 50GB |
| 网络 | 100Mbps | 1Gbps |

#### 软件要求

| 软件 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥18.0.0 | 运行时环境 |
| npm/pnpm | ≥8.0.0 | 包管理器 |
| Git | ≥2.0.0 | 版本控制 |
| VS Code | ≥1.80.0 | 代码编辑器 |

#### 安装步骤

##### 1. 克隆项目

```bash
git clone https://github.com/YYC3/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS
```

##### 2. 安装依赖

```bash
# 使用pnpm安装依赖（推荐）
pnpm install

# 或使用npm安装依赖
npm install
```

##### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

##### 4. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 或使用pnpm
pnpm dev
```

##### 5. 访问应用

```bash
# 打开浏览器访问
open http://localhost:3000
```

### 测试环境

#### 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 4核 | 8核 |
| 内存 | 8GB | 16GB |
| 硬盘 | 50GB | 100GB |
| 网络 | 1Gbps | 10Gbps |

#### 软件要求

| 软件 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥18.0.0 | 运行时环境 |
| npm/pnpm | ≥8.0.0 | 包管理器 |
| Git | ≥2.0.0 | 版本控制 |
| Docker | ≥20.0.0 | 容器化 |
| Docker Compose | ≥2.0.0 | 容器编排 |

#### 安装步骤

##### 1. 克隆项目

```bash
git clone https://github.com/YYC3/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS
```

##### 2. 安装依赖

```bash
# 使用pnpm安装依赖（推荐）
pnpm install

# 或使用npm安装依赖
npm install
```

##### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.test.example .env.test

# 编辑环境变量
vim .env.test
```

##### 4. 启动测试环境

```bash
# 使用Docker Compose启动测试环境
docker-compose -f docker-compose.test.yml up -d

# 或手动启动测试服务器
npm run dev:test
```

##### 5. 验证测试环境

```bash
# 运行测试验证环境
npm run test

# 或使用pnpm
pnpm test
```

### 预发布环境

#### 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 4核 | 8核 |
| 内存 | 8GB | 16GB |
| 硬盘 | 50GB | 100GB |
| 网络 | 1Gbps | 10Gbps |

#### 软件要求

| 软件 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥18.0.0 | 运行时环境 |
| npm/pnpm | ≥8.0.0 | 包管理器 |
| Git | ≥2.0.0 | 版本控制 |
| Docker | ≥20.0.0 | 容器化 |
| Docker Compose | ≥2.0.0 | 容器编排 |
| Nginx | ≥1.20.0 | 反向代理 |

#### 安装步骤

##### 1. 克隆项目

```bash
git clone https://github.com/YYC3/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS
```

##### 2. 安装依赖

```bash
# 使用pnpm安装依赖（推荐）
pnpm install

# 或使用npm安装依赖
npm install
```

##### 3. 构建应用

```bash
# 构建生产版本
npm run build

# 或使用pnpm
pnpm build
```

##### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.staging.example .env.staging

# 编辑环境变量
vim .env.staging
```

##### 5. 启动预发布环境

```bash
# 使用Docker Compose启动预发布环境
docker-compose -f docker-compose.staging.yml up -d

# 或手动启动预发布服务器
npm run start:staging
```

##### 6. 验证预发布环境

```bash
# 访问预发布环境
curl http://staging.example.com/health

# 或在浏览器中打开
open http://staging.example.com
```

### 生产环境

#### 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 8核 | 16核 |
| 内存 | 16GB | 32GB |
| 硬盘 | 100GB | 500GB |
| 网络 | 10Gbps | 100Gbps |

#### 软件要求

| 软件 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥18.0.0 | 运行时环境 |
| npm/pnpm | ≥8.0.0 | 包管理器 |
| Git | ≥2.0.0 | 版本控制 |
| Docker | ≥20.0.0 | 容器化 |
| Docker Compose | ≥2.0.0 | 容器编排 |
| Nginx | ≥1.20.0 | 反向代理 |
| PM2 | ≥5.0.0 | 进程管理 |

#### 安装步骤

##### 1. 克隆项目

```bash
git clone https://github.com/YYC3/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS
```

##### 2. 安装依赖

```bash
# 使用pnpm安装依赖（推荐）
pnpm install --production

# 或使用npm安装依赖
npm install --production
```

##### 3. 构建应用

```bash
# 构建生产版本
npm run build

# 或使用pnpm
pnpm build
```

##### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑环境变量
vim .env.production
```

##### 5. 启动生产环境

```bash
# 使用PM2启动生产环境
pm2 start npm --name "yyc3-nas-ecs" -- start

# 或使用Docker Compose启动生产环境
docker-compose -f docker-compose.production.yml up -d
```

##### 6. 验证生产环境

```bash
# 访问生产环境
curl http://example.com/health

# 或在浏览器中打开
open http://example.com
```

---

## ⚙️ 环境配置

### Vitest配置

#### 配置文件

**文件路径**：`vitest.config.ts`

#### 配置内容

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false
      }
    },
    maxConcurrency: 4,
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    reporter: ['default', 'verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './services'),
    },
  },
});
```

#### 配置说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| globals | 全局API | true |
| environment | 测试环境 | jsdom |
| setupFiles | 测试设置文件 | ./src/test/setup.ts |
| pool | 测试池 | forks |
| maxConcurrency | 最大并发数 | 4 |
| testTimeout | 测试超时时间 | 10000ms |
| hookTimeout | Hook超时时间 | 10000ms |
| coverage.provider | 覆盖率工具 | v8 |
| coverage.reporter | 覆盖率报告格式 | text, json, html |

### Playwright配置

#### 配置文件

**文件路径**：`playwright.config.ts`

#### 配置内容

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

#### 配置说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| testDir | 测试目录 | ./e2e |
| fullyParallel | 完全并行 | true |
| forbidOnly | 禁止only | !!process.env.CI |
| retries | 重试次数 | process.env.CI ? 2 : 0 |
| workers | 工作进程数 | process.env.CI ? 1 : undefined |
| reporter | 报告器 | html |
| use.baseURL | 基础URL | http://localhost:3000 |
| use.trace | 追踪 | on-first-retry |
| use.screenshot | 截图 | only-on-failure |
| use.video | 视频 | retain-on-failure |

### 测试环境变量

#### 开发环境变量

**文件路径**：`.env.development`

```bash
# 应用配置
VITE_APP_ENV=development
VITE_APP_NAME=YYC³ NAS-ECS
VITE_APP_VERSION=1.0.0

# API配置
VITE_API_BASE_URL=http://localhost:6000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_TIMES=3
VITE_API_RETRY_DELAY=1000

# 认证配置
VITE_AUTH_JWT_SECRET=test-jwt-secret-for-testing-only
VITE_AUTH_TOKEN_STORAGE=localStorage
VITE_AUTH_REFRESH_TOKEN_ENABLED=true
VITE_AUTH_TOKEN_EXPIRE_TIME=3600

# 日志配置
VITE_LOG_LEVEL=debug
VITE_LOG_TO_CONSOLE=true
VITE_LOG_TO_SERVER=false

# 缓存配置
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL=300000
VITE_DEBOUNCE_DELAY=300

# 主题配置
VITE_THEME=default
VITE_LANGUAGE=zh-CN
VITE_TIMEZONE=Asia/Shanghai

# 性能配置
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_PERFORMANCE_SAMPLE_RATE=0.1

# 功能开关
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEBUG=true
VITE_ENABLE_FEATURE_X=true
```

#### 测试环境变量

**文件路径**：`.env.test`

```bash
# 应用配置
VITE_APP_ENV=test
VITE_APP_NAME=YYC³ NAS-ECS
VITE_APP_VERSION=1.0.0

# API配置
VITE_API_BASE_URL=http://localhost:6000
VITE_API_TIMEOUT=30000
VITE_API_RETRY_TIMES=3
VITE_API_RETRY_DELAY=1000

# 认证配置
VITE_AUTH_JWT_SECRET=test-jwt-secret-for-testing-only
VITE_AUTH_TOKEN_STORAGE=localStorage
VITE_AUTH_REFRESH_TOKEN_ENABLED=true
VITE_AUTH_TOKEN_EXPIRE_TIME=3600

# 日志配置
VITE_LOG_LEVEL=debug
VITE_LOG_TO_CONSOLE=true
VITE_LOG_TO_SERVER=false

# 缓存配置
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL=300000
VITE_DEBOUNCE_DELAY=300

# 主题配置
VITE_THEME=default
VITE_LANGUAGE=zh-CN
VITE_TIMEZONE=Asia/Shanghai

# 性能配置
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_PERFORMANCE_SAMPLE_RATE=0.1

# 功能开关
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEBUG=true
VITE_ENABLE_FEATURE_X=true
```

#### 生产环境变量

**文件路径**：`.env.production`

```bash
# 应用配置
VITE_APP_ENV=production
VITE_APP_NAME=YYC³ NAS-ECS
VITE_APP_VERSION=1.0.0

# API配置
VITE_API_BASE_URL=https://api.example.com
VITE_API_TIMEOUT=30000
VITE_API_RETRY_TIMES=3
VITE_API_RETRY_DELAY=1000

# 认证配置
VITE_AUTH_JWT_SECRET=your-production-jwt-secret
VITE_AUTH_TOKEN_STORAGE=localStorage
VITE_AUTH_REFRESH_TOKEN_ENABLED=true
VITE_AUTH_TOKEN_EXPIRE_TIME=3600

# 日志配置
VITE_LOG_LEVEL=warn
VITE_LOG_TO_CONSOLE=false
VITE_LOG_TO_SERVER=true

# 缓存配置
VITE_CACHE_ENABLED=true
VITE_CACHE_TTL=300000
VITE_DEBOUNCE_DELAY=300

# 主题配置
VITE_THEME=default
VITE_LANGUAGE=zh-CN
VITE_TIMEZONE=Asia/Shanghai

# 性能配置
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_PERFORMANCE_SAMPLE_RATE=0.01

# 功能开关
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG=false
VITE_ENABLE_FEATURE_X=false
```

### 测试数据配置

#### 测试用户数据

**文件路径**：`src/test/mockData/users.ts`

```typescript
export const mockUsers = [
  {
    id: 'user-001',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://example.com/avatar/admin.png',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-002',
    username: 'user',
    email: 'user@example.com',
    role: 'user',
    avatar: 'https://example.com/avatar/user.png',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-003',
    username: 'guest',
    email: 'guest@example.com',
    role: 'guest',
    avatar: 'https://example.com/avatar/guest.png',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];
```

#### 测试日志数据

**文件路径**：`src/test/mockData/logs.ts`

```typescript
export const mockLogs = [
  {
    id: 'log-001',
    level: 'info',
    message: 'System started',
    source: 'system',
    category: 'general',
    timestamp: '2026-01-01T00:00:00Z',
    details: 'System initialization completed successfully'
  },
  {
    id: 'log-002',
    level: 'warn',
    message: 'High memory usage',
    source: 'monitoring',
    category: 'monitoring',
    timestamp: '2026-01-01T00:00:00Z',
    details: 'Memory usage exceeded 80%'
  },
  {
    id: 'log-003',
    level: 'error',
    message: 'Database connection failed',
    source: 'database',
    category: 'database',
    timestamp: '2026-01-01T00:00:00Z',
    details: 'Unable to connect to database server'
  }
];
```

#### 测试配置数据

**文件路径**：`src/test/mockData/configs.ts`

```typescript
export const mockConfigs = [
  {
    id: 'config-001',
    key: 'theme',
    value: 'dark',
    category: 'ui',
    description: 'Application theme',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'config-002',
    key: 'language',
    value: 'zh-CN',
    category: 'i18n',
    description: 'Application language',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'config-003',
    key: 'timezone',
    value: 'Asia/Shanghai',
    category: 'i18n',
    description: 'Application timezone',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];
```

---

## 🔧 环境维护

### 日常维护

#### 每日维护

- [ ] 检查环境状态
- [ ] 检查磁盘空间
- [ ] 检查内存使用
- [ ] 检查网络连接
- [ ] 检查日志文件

#### 每周维护

- [ ] 清理临时文件
- [ ] 清理日志文件
- [ ] 更新依赖包
- [ ] 检查安全更新
- [ ] 备份配置文件

#### 每月维护

- [ ] 更新系统软件
- [ ] 更新测试工具
- [ ] 清理测试数据
- [ ] 优化数据库
- [ ] 检查性能指标

### 故障处理

#### 环境故障

**症状**：测试环境无法访问

**处理步骤**：

1. 检查服务状态
```bash
# 检查服务是否运行
pm2 status

# 或检查Docker容器
docker ps
```

2. 检查日志文件
```bash
# 查看应用日志
tail -f logs/app.log

# 或查看Docker日志
docker logs <container-id>
```

3. 重启服务
```bash
# 重启PM2服务
pm2 restart all

# 或重启Docker容器
docker-compose restart
```

4. 验证服务
```bash
# 检查服务健康状态
curl http://localhost:3000/health

# 或在浏览器中打开
open http://localhost:3000
```

#### 依赖故障

**症状**：依赖包安装失败

**处理步骤**：

1. 清理缓存
```bash
# 清理npm缓存
npm cache clean --force

# 或清理pnpm缓存
pnpm store prune
```

2. 删除node_modules
```bash
# 删除node_modules
rm -rf node_modules

# 或删除.pnpm-store
rm -rf .pnpm-store
```

3. 重新安装依赖
```bash
# 使用pnpm重新安装
pnpm install

# 或使用npm重新安装
npm install
```

4. 验证安装
```bash
# 检查依赖是否安装成功
npm list

# 或运行测试
npm run test
```

#### 配置故障

**症状**：环境变量配置错误

**处理步骤**：

1. 检查环境变量文件
```bash
# 查看环境变量文件
cat .env

# 或查看特定环境变量
echo $VITE_API_BASE_URL
```

2. 验证环境变量格式
```bash
# 检查环境变量格式
grep -E '^[A-Z_]+=' .env
```

3. 重新加载环境变量
```bash
# 重新加载环境变量
source .env

# 或重启服务
pm2 restart all
```

4. 验证配置
```bash
# 检查配置是否生效
curl http://localhost:3000/api/config
```

---

## 📊 环境监控

### 监控指标

#### 系统指标

| 指标 | 说明 | 目标值 | 告警阈值 |
|------|------|--------|---------|
| CPU使用率 | CPU使用百分比 | <70% | >90% |
| 内存使用率 | 内存使用百分比 | <70% | >90% |
| 磁盘使用率 | 磁盘使用百分比 | <70% | >90% |
| 网络I/O | 网络输入输出 | <1Gbps | >5Gbps |

#### 应用指标

| 指标 | 说明 | 目标值 | 告警阈值 |
|------|------|--------|---------|
| 响应时间 | API响应时间 | <200ms | >500ms |
| 错误率 | 错请求数/总请求数 | <1% | >5% |
| 并发数 | 并发连接数 | <1000 | >2000 |
| 吞吐量 | 每秒请求数 | >1000 | <500 |

#### 测试指标

| 指标 | 说明 | 目标值 | 告警阈值 |
|------|------|--------|---------|
| 测试通过率 | 通过测试数/总测试数 | >95% | <90% |
| 测试覆盖率 | 覆盖代码行/总代码行 | >90% | <80% |
| 测试执行时间 | 测试执行时间 | <10min | >30min |
| 测试失败数 | 失败测试数 | <10 | >20 |

### 监控工具

#### 系统监控

**工具**：PM2

**配置**：

```javascript
module.exports = {
  apps: [{
    name: 'yyc3-nas-ecs',
    script: 'npm',
    args: 'run dev',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

**使用**：

```bash
# 启动监控
pm2 start ecosystem.config.js

# 查看监控
pm2 monit

# 查看日志
pm2 logs

# 重启服务
pm2 restart all
```

#### 应用监控

**工具**：自定义监控脚本

**配置**：

```typescript
import { performance } from 'perf_hooks';

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetricAverage(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getMetricPercentile(name: string, percentile: number): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

**使用**：

```typescript
// 记录API响应时间
const start = performance.now();
await api.system.getStats();
const end = performance.now();
performanceMonitor.recordMetric('api_response_time', end - start);

// 获取平均响应时间
const avgResponseTime = performanceMonitor.getMetricAverage('api_response_time');
console.log(`Average response time: ${avgResponseTime}ms`);
```

#### 测试监控

**工具**：Vitest内置监控

**配置**：

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: [
      'default',
      ['html', { outputFolder: './test-results' }],
      ['json', { outputFile: './test-results/results.json' }]
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage'
    }
  }
});
```

**使用**：

```bash
# 运行测试并生成报告
npm run test:coverage

# 查看测试报告
open test-results/index.html

# 查看覆盖率报告
open coverage/index.html
```

### 告警配置

#### 告警规则

| 规则 | 条件 | 动作 |
|------|------|------|
| CPU告警 | CPU使用率>90% | 发送邮件通知 |
| 内存告警 | 内存使用率>90% | 发送邮件通知 |
| 磁盘告警 | 磁盘使用率>90% | 发送邮件通知 |
| 响应时间告警 | API响应时间>500ms | 发送邮件通知 |
| 错误率告警 | 错误率>5% | 发送邮件通知 |
| 测试失败告警 | 测试失败数>20 | 发送邮件通知 |

#### 告警通知

**邮件通知**：

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'alert@example.com',
    pass: 'password'
  }
});

async function sendAlert(subject: string, message: string) {
  await transporter.sendMail({
    from: 'alert@example.com',
    to: 'team@example.com',
    subject: subject,
    text: message
  });
}

// 使用示例
await sendAlert('CPU告警', 'CPU使用率超过90%');
```

---

## 📚 相关文档

- [YYC³ NAS-ECS 测试策略](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-测试策略.md)
- [YYC³ NAS-ECS 测试计划](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-测试计划.md)
- [YYC³ NAS-ECS 测试用例规范](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-测试用例规范.md)
- [YYC³ NAS-ECS 缺陷管理流程](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-缺陷管理流程.md)
- [YYC³ NAS-ECS 测试报告模板](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-测试报告模板.md)
- [YYC³ NAS-ECS 测试覆盖率管理](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-测试体系/YYC3-NAS-ECS-测试覆盖率管理.md)

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
