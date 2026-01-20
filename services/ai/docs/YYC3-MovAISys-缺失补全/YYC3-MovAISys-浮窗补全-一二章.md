# YYC³-MovAISys 智能浮窗系统 - 缺失补全完整方案

│ 亲爱的同学/伙伴，非常高兴能与你一起完成这个重要的旅程！
│ 作为你的架构分析师和高级工程师导师，我将用实战经验帮你把卓越的设计转化为卓越的实现。
│ 记住：最好的架构不是设计出来的，而是构建出来的。让我们开始吧！💪

--------

## 📋 目录

• 第一章：项目基础设施搭建
• 第二章：核心引擎MVP实现
• 第三章：模型适配器基础实现
• 第四章：智能交互界面实现
• 第五章：测试体系搭建
• 第六章：部署配置完善

--------

## 第一章：项目基础设施搭建

### 1.1 导师寄语 🌟

│ "千里之行，始于足下。每个伟大的系统都是从第一个package.json开始的。"
│ 让我们从零开始，构建一个企业级项目的基础设施。这看似简单，却决定了未来的扩展性和可维护性。

### 1.2 项目结构设计

# 📁 推荐的企业级项目结构
  
  YYC3-AILP-智能浮窗/
  ├── 📁 src/                          # 源代码目录
  │   ├── 📁 core/                      # 核心引擎
  │   │   ├── AutonomousAIEngine.ts
  │   │   ├── MessageBus.ts
  │   │   ├── TaskScheduler.ts
  │   │   └── StateManager.ts
  │   ├── 📁 model/                     # 模型适配器
  │   │   ├── ModelAdapter.ts
  │   │   ├── OpenAIAdapter.ts
  │   │   ├── LocalModelAdapter.ts
  │   │   └── ModelRouter.ts
  │   ├── 📁 learning/                  # 学习系统
  │   │   ├── LearningSystem.ts
  │   │   ├── DataCollector.ts
  │   │   └── FeatureEngineer.ts
  │   ├── 📁 tools/                     # 工具系统
  │   │   ├── ToolRegistry.ts
  │   │   └── ToolExecutor.ts
  │   ├── 📁 widget/                    # UI组件
  │   │   ├── IntelligentAIWidget.tsx
  │   │   ├── ChatInterface.tsx
  │   │   └── DragSystem.tsx
  │   ├── 📁 types/                     # 类型定义
  │   │   ├── index.ts
  │   │   ├── engine.types.ts
  │   │   └── model.types.ts
  │   ├── 📁 utils/                     # 工具函数
  │   │   ├── logger.ts
  │   │   ├── metrics.ts
  │   │   └── helpers.ts
  │   └── 📁 config/                    # 配置文件
  │       ├── engine.config.ts
  │       └── model.config.ts
  ├── 📁 tests/                         # 测试目录
  │   ├── 📁 unit/                      # 单元测试
  │   ├── 📁 integration/               # 集成测试
  │   └── 📁 e2e/                       # 端到端测试
  ├── 📁 scripts/                       # 脚本目录
  │   ├── build.ts
  │   ├── deploy.ts
  │   └── setup.ts
  ├── 📁 docs/                          # 文档目录
  │   ├── api/                          # API文档
  │   └── guides/                       # 使用指南
  ├── package.json
  ├── tsconfig.json
  ├── bun.lockb                        # Bun锁文件
  ├── .gitignore
  ├── .env.example
  └── README.md

### 1.3 package.json 完整配置

  // 📦 package.json - 基础设施配置文件
  {
    "name": "yyc3-ailp-intelligent-widget",
    "version": "0.1.0",
    "description": "YYC³可插拔式拖拽移动AI系统 - 教科书级企业级实现",
    "type": "module",
    "main": "./dist/index.js",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "scripts": {
      "dev": "bun --hot src/index.ts",
      "build": "bun build src/index.ts --outdir ./dist --target node",
      "build:widget": "bun build src/widget/IntelligentAIWidget.tsx --outdir ./dist/widget",
      "test": "bun test",
      "test:watch": "bun test --watch",
      "test:coverage": "bun test --coverage",
      "lint": "eslint src/**/*.ts",
      "lint:fix": "eslint src/**/*.ts --fix",
      "format": "prettier --write src/**/*.{ts,tsx}",
      "type-check": "tsc --noEmit",
      "clean": "rm -rf dist",
      "setup": "bun run scripts/setup.ts",
      "deploy": "bun run scripts/deploy.ts"
    },
    "keywords": [
      "ai",
      "widget",
      "intelligent",
      "pluggable",
      "drag-drop",
      "enterprise"
    ],
    "author": "YYC³ AI Team",
    "license": "MIT",
    "engines": {
      "bun": ">=1.0.0",
      "node": ">=18.0.0"
    },
    "dependencies": {
      "@anthropic-ai/sdk": "^0.24.0",
      "@openai/api": "^4.0.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-draggable": "^4.4.6",
      "zustand": "^4.4.0"
    },
    "devDependencies": {
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "@typescript-eslint/eslint-plugin": "^6.0.0",
      "@typescript-eslint/parser": "^6.0.0",
      "eslint": "^8.50.0",
      "prettier": "^3.0.0",
      "typescript": "^5.2.0",
      "bun-types": "^1.0.0"
    },
    "peerDependencies": {
      "react": ">=18.0.0",
      "react-dom": ">=18.0.0"
    }
  }

### 1.4 tsconfig.json 配置

  // ⚙️ tsconfig.json - TypeScript严格配置
  {
    "compilerOptions": {
      /*基础选项*/
      "target": "ES2022",
      "lib": ["ES2022", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "allowImportingTsExtensions": false,
      "isolatedModules": true,
      "noEmit": false,

      /* 严格类型检查 */
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true,
      "strictBindCallApply": true,
      "strictPropertyInitialization": true,
      "noImplicitThis": true,
      "alwaysStrict": true,

      /* 额外检查 */
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "noUncheckedIndexedAccess": true,
      "noImplicitOverride": true,
      "noPropertyAccessFromIndexSignature": true,
      "allowUnusedLabels": false,
      "allowUnreachableCode": false,

      /* 模块解析 */
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,

      /* 编译选项 */
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true,
      "outDir": "./dist",
      "rootDir": "./src",

      /* JSX配置 */
      "jsx": "react-jsx",
      "jsxFactory": "React.createElement",
      "jsxFragmentFactory": "React.Fragment"
    },
    "include": [
      "src/**/*"
    ],
    "exclude": [
      "node_modules",
      "dist",
      "tests",
      "**/*.test.ts",
      "**/*.spec.ts"
    ]
  }

### 1.5 .env.example 环境配置模板

# 🔐 环境配置示例文件

# 复制此文件为 .env 并填入真实配置

# ================== 应用配置 ==================

  NODE_ENV=development
  APP_NAME=YYC3-AILP-Intelligent-Widget
  APP_VERSION=0.1.0
  LOG_LEVEL=debug

# ================== 服务端口 ==================

  API_PORT=3000
  WS_PORT=3001
  WIDGET_PORT=8080

# ================== AI模型配置 ==================

# OpenAI配置

  OPENAI_API_KEY=sk-your-openai-api-key-here
  OPENAI_BASE_URL=<https://api.openai.com/v1>
  OPENAI_MODEL=gpt-4-turbo-preview
  OPENAI_MAX_TOKENS=4096
  OPENAI_TEMPERATURE=0.7

# Anthropic配置

  ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
  ANTHROPIC_MODEL=claude-3-opus-20240229
  ANTHROPIC_MAX_TOKENS=4096

# 本地模型配置

  LOCAL_MODEL_PATH=/models
  LOCAL_MODEL_ENGINE=llama-cpp

# ================== 存储配置 ==================

# Redis配置

  REDIS_URL=redis://localhost:6379
  REDIS_PASSWORD=
  REDIS_DB=0

# MongoDB配置

  MONGO_URL=mongodb://localhost:27017/yyc3
  MONGO_DB_NAME=yyc3
  MONGO_USER=
  MONGO_PASSWORD=

# PostgreSQL配置

  POSTGRES_URL=postgresql://postgres:password@localhost:5432/yyc3
  POSTGRES_DB=yyc3
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=password

# ================== 缓存配置 ==================

  CACHE_TTL=3600
  CACHE_MAX_SIZE=1000

# ================== 日志配置 ==================

  LOG_FORMAT=json
  LOG_DIR=./logs
  LOG_FILE_MAX_SIZE=10m
  LOG_FILE_MAX_DAYS=7

# ================== 监控配置 ==================

  PROMETHEUS_PORT=9090
  GRAFANA_URL=<http://localhost:3000>
  SENTRY_DSN=

# ================== 安全配置 ==================

  JWT_SECRET=your-jwt-secret-key-change-this
  ENCRYPTION_KEY=your-encryption-key-32-bytes
  CORS_ORIGINS=<http://localhost:3000,http://localhost:8080>

# ================== 功能开关 ==================

  ENABLE_OPENAI=true
  ENABLE_ANTHROPIC=true
  ENABLE_LOCAL_MODEL=false
  ENABLE_LEARNING=true
  ENABLE_MONITORING=true
  ENABLE_ANALYTICS=false

### 1.6 工具函数库实现

  // 📦 src/utils/logger.ts - 结构化日志系统
  import { createWriteStream } from 'node:fs';
  import { join } from 'node:path';

  /**

* 日志级别枚举
   */
  export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    FATAL = 'FATAL'
  }

  /**

* 日志条目接口
   */
  interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    metadata?: Record<string, unknown>;
    error?: {
      name: string;
      message: string;
      stack?: string;
    };
  }

  /**

* 日志配置接口
   */
  interface LoggerConfig {
    level: LogLevel;
    format: 'json' | 'text';
    console: boolean;
    file?: {
      enabled: boolean;
      path: string;
      maxSize?: string;
    };
  }

  /**

* 结构化日志类
*
* 设计理念：
* 1. 统一日志格式，便于解析和分析
* 1. 支持多种输出方式（控制台、文件）
* 1. 支持结构化元数据
* 1. 性能优先，异步写入
   */
  export class Logger {
    private config: LoggerConfig;
    private fileStream?: ReturnType<typeof createWriteStream>;

    constructor(config: Partial<LoggerConfig> = {}) {
      this.config = {
        level: config.level || LogLevel.INFO,
        format: config.format || 'json',
        console: config.console !== false,
        file: config.file
      };

      // 初始化文件流
      if (this.config.file?.enabled) {
        this.initializeFileStream();
      }
    }

    /**
     * 初始化文件写入流
     */
    private initializeFileStream(): void {
      const logPath = this.config.file!.path;
      this.fileStream = createWriteStream(logPath, { flags: 'a' });

      // 错误处理
      this.fileStream.on('error', (error) => {
        console.error('日志文件写入错误:', error);
      });
    }

    /**
     * 判断是否应该输出该级别的日志
     */
    private shouldLog(level: LogLevel): boolean {
      const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
      return levels.indexOf(level) >= levels.indexOf(this.config.level);
    }

    /**
     * 格式化日志条目
     */
    private formatLog(entry: LogEntry): string {
      if (this.config.format === 'json') {
        return JSON.stringify(entry);
      }

      // 文本格式
      const metadataStr = entry.metadata
        ? ` | ${JSON.stringify(entry.metadata)}`
        : '';
      const errorStr = entry.error
        ? `\n${entry.error.stack}`
        : '';

      return `[${entry.timestamp}] [${entry.level}]${entry.context ? ` [${entry.context}]` : ''} ${entry.
message}${metadataStr}${errorStr}`;
    }

    /**
     * 输出日志
     */
    private log(entry: LogEntry): void {
      if (!this.shouldLog(entry.level)) {
        return;
      }

      const formatted = this.formatLog(entry);

      // 控制台输出
      if (this.config.console) {
        const colors = {
          [LogLevel.DEBUG]: '\x1b[36m',  // Cyan
          [LogLevel.INFO]: '\x1b[32m',   // Green
          [LogLevel.WARN]: '\x1b[33m',   // Yellow
          [LogLevel.ERROR]: '\x1b[31m',  // Red
          [LogLevel.FATAL]: '\x1b[35m'   // Magenta
        };
        const reset = '\x1b[0m';

        console.log(`${colors[entry.level]}${formatted}${reset}`);
      }

      // 文件输出
      if (this.fileStream && this.config.file?.enabled) {
        this.fileStream.write(formatted + '\n');
      }
    }

    /**
     * 创建日志条目
     */
    private createEntry(
      level: LogLevel,
      message: string,
      context?: string,
      metadata?: Record<string, unknown>,
      error?: Error
    ): LogEntry {
      return {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      };
    }

    // ============ 公共日志方法 ============

    /**
     * DEBUG级别日志
     */
    debug(message: string, context?: string, metadata?: Record<string, unknown>): void {
      this.log(this.createEntry(LogLevel.DEBUG, message, context, metadata));
    }

    /**
     * INFO级别日志
     */
    info(message: string, context?: string, metadata?: Record<string, unknown>): void {
      this.log(this.createEntry(LogLevel.INFO, message, context, metadata));
    }

    /**
     * WARN级别日志
     */
    warn(message: string, context?: string, metadata?: Record<string, unknown>, error?: Error): void {
      this.log(this.createEntry(LogLevel.WARN, message, context, metadata, error));
    }

    /**
     * ERROR级别日志
     */
    error(message: string, context?: string, metadata?: Record<string, unknown>, error?: Error): void {
      this.log(this.createEntry(LogLevel.ERROR, message, context, metadata, error));
    }

    /**
     * FATAL级别日志
     */
    fatal(message: string, context?: string, metadata?: Record<string, unknown>, error?: Error): void {
      this.log(this.createEntry(LogLevel.FATAL, message, context, metadata, error));
    }

    /**
     * 清理资源
     */
    destroy(): void {
      if (this.fileStream) {
        this.fileStream.end();
      }
    }
  }

  // ============ 全局日志实例 ============

  /**

* 全局日志实例
* 使用单例模式，确保整个应用使用同一个日志实例
   */
  export const logger = new Logger({
    level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
    format: process.env.LOG_FORMAT as 'json' | 'text' || 'json',
    console: true,
    file: {
      enabled: process.env.NODE_ENV === 'production',
      path: process.env.LOG_FILE || join(process.cwd(), 'logs', 'app.log')
    }
  });

  // 导出便捷方法
  export const { debug, info, warn, error, fatal } = logger;

  // 📦 src/utils/metrics.ts - 性能指标收集系统
  import { logger } from './logger';

  /**

* 指标类型
   */
  export enum MetricType {
    COUNTER = 'counter',
    GAUGE = 'gauge',
    HISTOGRAM = 'histogram',
    SUMMARY = 'summary'
  }

  /**

* 指标数据点
   */
  interface MetricData {
    name: string;
    type: MetricType;
    value: number;
    timestamp: Date;
    labels?: Record<string, string>;
  }

  /**

* 指标配置
   */
  interface MetricsConfig {
    enabled: boolean;
    flushInterval: number;
    maxBufferSize: number;
  }

  /**

* 性能指标收集器
*
* 设计理念：
* 1. 四种指标类型：Counter、Gauge、Histogram、Summary
* 1. 支持标签系统，便于多维度分析
* 1. 批量发送，减少网络开销
* 1. 内存缓冲，防止内存泄漏
   */
  export class MetricsCollector {
    private config: MetricsConfig;
    private buffer: MetricData[] = [];
    private flushTimer?: ReturnType<typeof setInterval>;
    private metrics: Map<string, Map<string, number>> = new Map();

    constructor(config: Partial<MetricsConfig> = {}) {
      this.config = {
        enabled: config.enabled !== false,
        flushInterval: config.flushInterval || 10000, // 10秒
        maxBufferSize: config.maxBufferSize || 1000
      };

      if (this.config.enabled) {
        this.startFlushTimer();
      }
    }

    /**
     * 启动自动刷新定时器
     */
    private startFlushTimer(): void {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }

    /**
     * 记录指标
     */
    private record(data: MetricData): void {
      if (!this.config.enabled) {
        return;
      }

      // 添加到缓冲区
      this.buffer.push(data);

      // 检查缓冲区大小
      if (this.buffer.length >= this.config.maxBufferSize) {
        this.flush();
      }

      // 更新内存指标
      this.updateInMemoryMetrics(data);
    }

    /**
     * 更新内存中的指标
     */
    private updateInMemoryMetrics(data: MetricData): void {
      const labelsKey = JSON.stringify(data.labels || {});

      if (!this.metrics.has(data.name)) {
        this.metrics.set(data.name, new Map());
      }

      const metricMap = this.metrics.get(data.name)!;

      if (data.type === MetricType.COUNTER) {
        const current = metricMap.get(labelsKey) || 0;
        metricMap.set(labelsKey, current + data.value);
      } else if (data.type === MetricType.GAUGE) {
        metricMap.set(labelsKey, data.value);
      } else {
        // Histogram和Summary
        const current = metricMap.get(labelsKey) || 0;
        metricMap.set(labelsKey, current + data.value);
      }
    }

    /**
     * 刷新指标到存储
     */
    private flush(): void {
      if (this.buffer.length === 0) {
        return;
      }

      logger.debug('刷新指标', 'Metrics', {
        count: this.buffer.length
      });

      // TODO: 发送到Prometheus、InfluxDB等存储系统
      // 这里简化为清空缓冲区
      this.buffer = [];
    }

    // ============ 公共指标方法 ============

    /**
     * Counter：计数器，只能增加
     */
    increment(name: string, value: number = 1, labels?: Record<string, string>): void {
      this.record({
        name,
        type: MetricType.COUNTER,
        value,
        timestamp: new Date(),
        labels
      });
    }

    /**
     * Gauge：仪表盘，可以增减
     */
    gauge(name: string, value: number, labels?: Record<string, string>): void {
      this.record({
        name,
        type: MetricType.GAUGE,
        value,
        timestamp: new Date(),
        labels
      });
    }

    /**
     * Histogram：直方图，记录分布
     */
    histogram(name: string, value: number, labels?: Record<string, string>): void {
      this.record({
        name,
        type: MetricType.HISTOGRAM,
        value,
        timestamp: new Date(),
        labels
      });
    }

    /**
     * Summary：摘要，记录统计信息
     */
    summary(name: string, value: number, labels?: Record<string, string>): void {
      this.record({
        name,
        type: MetricType.SUMMARY,
        value,
        timestamp: new Date(),
        labels
      });
    }

    /**
     * 获取所有指标
     */
    getAllMetrics(): Record<string, Record<string, number>> {
      const result: Record<string, Record<string, number>> = {};

      for (const [name, metricMap] of this.metrics.entries()) {
        result[name] = {};
        for (const [labels, value] of metricMap.entries()) {
          result[name][labels] = value;
        }
      }

      return result;
    }

    /**
     * 清理资源
     */
    destroy(): void {
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
      this.flush();
    }
  }

  // ============ 全局指标实例 ============

  export const metrics = new MetricsCollector({
    enabled: process.env.NODE_ENV === 'production',
    flushInterval: 10000,
    maxBufferSize: 1000
  });

  // 导出便捷方法
  export const { increment, gauge, histogram, summary } = metrics;

--------

## 第二章：核心引擎MVP实现

### 2.1 导师寄语 🌟

│ "核心引擎是系统的心脏。不要一次性追求完美，先让它跳动起来。" MVP（最小可行产品）不等于低质量，它是最小但完整的实现。
│ 我们将实现一个可以接收消息、调用模型、返回响应的核心引擎。

### 2.2 核心类型定义

  // 📦 src/types/engine.types.ts - 核心引擎类型定义
  import { EventEmitter } from 'node:events';

  /**

* ================== 基础类型定义 ==================
   */

  /**

* 消息类型枚举
   */
  export enum MessageType {
    // 系统消息
    SYSTEM_START = 'system:start',
    SYSTEM_STOP = 'system:stop',
    SYSTEM_ERROR = 'system:error',

    // 任务消息
    TASK_CREATED = 'task:created',
    TASK_COMPLETED = 'task:completed',
    TASK_FAILED = 'task:failed',
    TASK_CANCELLED = 'task:cancelled',

    // 用户消息
    USER_MESSAGE = 'user:message',
    USER_COMMAND = 'user:command',

    // AI消息
    AI_RESPONSE = 'ai:response',
    AI_ERROR = 'ai:error',

    // 工具消息
    TOOL_INVOKED = 'tool:invoked',
    TOOL_RESULT = 'tool:result',
    TOOL_ERROR = 'tool:error',

    // 子系统消息
    SUBSYSTEM_REGISTERED = 'subsystem:registered',
    SUBSYSTEM_UNREGISTERED = 'subsystem:unregistered',
    SUBSYSTEM_ERROR = 'subsystem:error'
  }

  /**

* 引擎状态枚举
   */
  export enum EngineStatus {
    STOPPED = 'STOPPED',
    INITIALIZING = 'INITIALIZING',
    STARTING = 'STARTING',
    RUNNING = 'RUNNING',
    PAUSING = 'PAUSING',
    PAUSED = 'PAUSED',
    STOPPING = 'STOPPING',
    ERROR = 'ERROR'
  }

  /**

* 消息接口
   */
  export interface AgentMessage {
    id: string;
    type: MessageType;
    content: unknown;
    timestamp: Date;
    source?: string;
    metadata?: Record<string, unknown>;
    correlationId?: string;
  }

  /**

* 消息响应接口
   */
  export interface AgentResponse {
    success: boolean;
    content: unknown;
    metadata?: {
      processingTime: number;
      traceId?: string;
      modelUsed?: string;
      tokensUsed?: number;
    };
    error?: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
  }

  /**

* ================== 任务相关类型 ==================
   */

  /**

* 任务状态枚举
   */
  export enum TaskStatus {
    PENDING = 'PENDING',
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    TIMEOUT = 'TIMEOUT'
  }

  /**

* 任务优先级
   */
  export enum TaskPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
  }

  /**

* 任务接口
   */
  export interface AgentTask {
    id: string;
    type: string;
    priority: TaskPriority;
    status: TaskStatus;
    input: unknown;
    output?: unknown;
    error?: Error;
    progress: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    timeout?: number;
    metadata?: Record<string, unknown>;
  }

  /**

* ================== 系统配置类型 ==================
   */

  /**

* 引擎配置接口
   */
  export interface EngineConfig {
    version: string;
    environment: 'development' | 'staging' | 'production';

    // 消息配置
    messageConfig: {
      maxQueueSize: number;
      retryPolicy: {
        maxRetries: number;
        backoffFactor: number;
      };
    };

    // 任务配置
    taskConfig: {
      maxConcurrentTasks: number;
      timeoutMs: number;
      priorityLevels: number;
    };

    // 状态配置
    stateConfig: {
      autoPersist: boolean;
      persistInterval: number;
      maxHistory: number;
    };

    // 日志配置
    logConfig: {
      level: string;
      format: 'json' | 'text';
    };
  }

  /**

* ================== 子系统类型 ==================
   */

  /**

* 子系统接口
   */
  export interface ISubsystem {
    name: string;
    version: string;
    status: string;
    initialize(config?: unknown): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getStatus(): string;
    handleMessage(message: AgentMessage): Promise<void>;
  }

  /**

* ================== 监控与诊断类型 ==================
   */

  /**

* 引擎状态接口
   */
  export interface EngineState {
    status: EngineStatus;
    uptime: number;
    tasks: {
      total: number;
      active: number;
      completed: number;
      failed: number;
    };
    subsystems: string[];
    metrics: {
      messageThroughput: number;
      averageResponseTime: number;
      errorRate: number;
    };
  }

  /**

* 引擎指标接口
   */
  export interface EngineMetrics {
    uptime: number;
    status: EngineStatus;
    taskCount: number;
    activeTasks: number;
    queuedTasks: number;
    completedTasks: number;
    failedTasks: number;
    messageThroughput: number;
    memoryUsage: NodeJS.MemoryUsage;
    subsystemHealth: Record<string, { status: string; lastCheck: Date }>;
    errorRate: number;
    responseTimes: {
      p50: number;
      p95: number;
      p99: number;
      average: number;
    };
  }

  /**

* ================== 消息处理相关类型 ==================
   */

  /**

* 消息处理器函数类型
   */
  export type MessageHandler = (
    message: AgentMessage,
    context: ProcessingContext
  ) => Promise<AgentResponse>;

  /**

* 处理上下文接口
   */
  export interface ProcessingContext {
    traceId: string;
    message: AgentMessage;
    engineState: EngineState;
    availableSubsystems: string[];
    currentTime: Date;
    userContext?: {
      userId?: string;
      sessionId?: string;
      preferences?: Record<string, unknown>;
    };
    systemConstraints?: {
      maxExecutionTime: number;
      maxMemoryUsage: number;
    };
  }

  /**

* ================== 辅助函数 ==================
   */

  /**

* 生成唯一ID
   */
  export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**

* 生成追踪ID
   */
  export function generateTraceId(): string {
    return `trace-${generateId()}`;
  }

### 2.3 消息总线实现

  // 📦 src/core/MessageBus.ts - 消息总线实现
  import { EventEmitter } from 'node:events';
  import { logger } from '../utils/logger';
  import { metrics } from '../utils/metrics';
  import { AgentMessage, MessageType, MessageHandler, ProcessingContext } from '../types/engine.types';

  /**

* 消息总线配置接口
   */
  interface MessageBusConfig {
    maxQueueSize: number;
    retryPolicy: {
      maxRetries: number;
      backoffFactor: number;
    };
  }

  /**

* 消息条目（包含重试信息）
   */
  interface MessageEntry {
    message: AgentMessage;
    retries: number;
    nextRetryAt?: Date;
  }

  /**

* 消息总线实现
*
* 设计理念：
* 1. 基于EventEmitter实现发布-订阅模式
* 1. 支持消息持久化，防止消息丢失
* 1. 支持消息重试，提高可靠性
* 1. 支持优先级队列，确保重要消息优先处理
* 1. 监控消息吞吐量和延迟
   */
  export class MessageBus extends EventEmitter {
    private config: MessageBusConfig;
    private handlers: Map<MessageType, MessageHandler[]> = new Map();
    private queue: MessageEntry[] = [];
    private processing: boolean = false;
    private metrics = {
      published: 0,
      processed: 0,
      failed: 0,
      retried: 0
    };

    constructor(config: MessageBusConfig) {
      super();
      this.config = config;
      this.setMaxListeners(100); // 增加最大监听器数量

      logger.info('消息总线初始化', 'MessageBus', {
        maxQueueSize: config.maxQueueSize,
        retryPolicy: config.retryPolicy
      });
    }

    /**
     * 发布消息
     */
    async publish(message: AgentMessage): Promise<void> {
      // 验证消息
      if (!message.id) {
        message.id = this.generateId();
      }
      if (!message.timestamp) {
        message.timestamp = new Date();
      }

      // 检查队列大小
      if (this.queue.length >= this.config.maxQueueSize) {
        logger.warn('消息队列已满，丢弃最旧的消息', 'MessageBus', {
          queueSize: this.queue.length,
          maxSize: this.config.maxQueueSize
        });
        this.queue.shift(); // 移除最旧的消息
      }

      // 添加到队列
      this.queue.push({
        message,
        retries: 0
      });

      // 更新指标
      this.metrics.published++;
      metrics.increment('message_bus.published');

      logger.debug('消息已发布', 'MessageBus', {
        messageId: message.id,
        messageType: message.type,
        queueSize: this.queue.length
      });

      // 触发事件
      this.emit('message:published', message);

      // 如果不在处理中，开始处理
      if (!this.processing) {
        this.processQueue();
      }
    }

    /**
     * 订阅消息类型
     */
    subscribe(type: MessageType, handler: MessageHandler): void {
      if (!this.handlers.has(type)) {
        this.handlers.set(type, []);
      }

      this.handlers.get(type)!.push(handler);

      logger.debug('消息处理器已注册', 'MessageBus', {
        messageType: type,
        handlersCount: this.handlers.get(type)!.length
      });
    }

    /**
     * 取消订阅
     */
    unsubscribe(type: MessageType, handler: MessageHandler): void {
      const handlers = this.handlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
          logger.debug('消息处理器已取消注册', 'MessageBus', {
            messageType: type
          });
        }
      }
    }

    /**
     * 处理消息队列
     */
    private async processQueue(): Promise<void> {
      if (this.processing) {
        return;
      }

      this.processing = true;

      while (this.queue.length > 0) {
        const entry = this.queue[0];

        // 检查是否需要等待重试
        if (entry.nextRetryAt && entry.nextRetryAt > new Date()) {
          break;
        }

        // 从队列中取出
        this.queue.shift();

        // 处理消息
        try {
          await this.processMessage(entry);
        } catch (error) {
          logger.error('消息处理失败', 'MessageBus', {
            messageId: entry.message.id,
            error
          });

          // 检查是否需要重试
          if (entry.retries < this.config.retryPolicy.maxRetries) {
            entry.retries++;
            entry.nextRetryAt = this.calculateNextRetry(entry.retries);

            // 重新加入队列
            this.queue.push(entry);

            this.metrics.retried++;
            metrics.increment('message_bus.retried');
          } else {
            // 超过最大重试次数，丢弃消息
            this.metrics.failed++;
            metrics.increment('message_bus.failed');

            this.emit('message:failed', entry.message, error);
          }
        }
      }

      this.processing = false;
    }

    /**
     * 处理单个消息
     */
    private async processMessage(entry: MessageEntry): Promise<void> {
      const { message } = entry;

      logger.debug('处理消息', 'MessageBus', {
        messageId: message.id,
        messageType: message.type
      });

      // 触发事件
      this.emit('message:processing', message);

      // 查找处理器
      const handlers = this.handlers.get(message.type);

      if (!handlers || handlers.length === 0) {
        logger.warn('没有找到消息处理器', 'MessageBus', {
          messageType: message.type
        });
        return;
      }

      // 创建处理上下文
      const context: ProcessingContext = {
        traceId: this.generateTraceId(),
        message,
        engineState: {
          status: 'RUNNING',
          uptime: 0,
          tasks: { total: 0, active: 0, completed: 0, failed: 0 },
          subsystems: [],
          metrics: {
            messageThroughput: 0,
            averageResponseTime: 0,
            errorRate: 0
          }
        },
        availableSubsystems: Array.from(this.handlers.keys()),
        currentTime: new Date()
      };

      // 并发调用所有处理器
      const results = await Promise.allSettled(
        handlers.map(handler => handler(message, context))
      );

      // 处理结果
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.debug('消息处理完成', 'MessageBus', {
        messageId: message.id,
        successful,
        failed
      });

      // 更新指标
      this.metrics.processed++;
      metrics.increment('message_bus.processed');
      metrics.histogram('message_bus.processing_time', Date.now() - message.timestamp.getTime());

      // 触发事件
      this.emit('message:processed', message, results);
    }

    /**
     * 计算下次重试时间（指数退避）
     */
    private calculateNextRetry(retryCount: number): Date {
      const delay = Math.pow(this.config.retryPolicy.backoffFactor, retryCount) * 1000;
      return new Date(Date.now() + delay);
    }

    /**
     * 获取队列状态
     */
    getQueueStatus(): {
      size: number;
      processing: boolean;
      metrics: typeof this.metrics;
    } {
      return {
        size: this.queue.length,
        processing: this.processing,
        metrics: { ...this.metrics }
      };
    }

    /**
     * 清空队列
     */
    clear(): void {
      this.queue = [];
      logger.info('消息队列已清空', 'MessageBus');
    }

    /**
     * 销毁消息总线
     */
    destroy(): void {
      this.clear();
      this.handlers.clear();
      this.removeAllListeners();
      logger.info('消息总线已销毁', 'MessageBus');
    }

    // ============ 辅助方法 ============

    private generateId(): string {
      return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    private generateTraceId(): string {
      return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
  }

### 2.4 核心引擎MVP实现

  // 📦 src/core/AutonomousAIEngine.ts - 核心引擎MVP实现
  import { logger } from '../utils/logger';
  import { metrics } from '../utils/metrics';
  import { MessageBus } from './MessageBus';
  import {
    IAutonomousAIEngine,
    EngineConfig,
    EngineStatus,
    AgentMessage,
    AgentResponse,
    MessageType,
    ISubsystem,
    EngineState,
    EngineMetrics,
    ProcessingContext
  } from '../types/engine.types';

  /**

* 核心引擎MVP实现
*
* 设计理念：
* 1. 最小可用产品（MVP）原则：实现核心功能，确保可用性
* 1. 渐进式增强：先让系统跑起来，再逐步完善
* 1. 错误优先：完整的错误处理和恢复机制
* 1. 可观测性：完善的日志和监控
* 1. 测试友好：便于单元测试和集成测试
   */
  export class AutonomousAIEngine implements IAutonomousAIEngine {
    // ============ 核心组件 ============
    private messageBus: MessageBus;
    private subsystems: Map<string, ISubsystem> = new Map();
    private messageHandlers: Map<MessageType, Function> = new Map();

    // ============ 运行时状态 ============
    private status: EngineStatus = EngineStatus.STOPPED;
    private startTime?: Date;
    private taskCount: number = 0;
    private completedTasks: number = 0;
    private failedTasks: number = 0;

    // ============ 配置 ============
    private config: EngineConfig;

    // ============ 性能统计 ============
    private performanceStats = {
      messageCount: 0,
      totalProcessingTime: 0,
      errorCount: 0
    };

    constructor(config: EngineConfig) {
      this.config = config;
      this.messageBus = new MessageBus(config.messageConfig);

      logger.info('自治AI引擎初始化', 'AutonomousAIEngine', {
        version: config.version,
        environment: config.environment
      });

      // 设置默认消息处理器
      this.setupDefaultHandlers();
    }

    // ================= 生命周期管理 =================

    async initialize(config: EngineConfig): Promise<void> {
      logger.info('引擎初始化中...', 'AutonomousAIEngine');
      this.status = EngineStatus.INITIALIZING;

      try {
        // 1. 更新配置
        this.config = { ...this.config, ...config };

        // 2. 初始化消息总线
        // 消息总线已经在构造函数中初始化

        // 3. 加载子系统
        for (const [name, subsystem] of this.subsystems) {
          try {
            await subsystem.initialize();
            logger.info(`子系统 ${name} 初始化成功`, 'AutonomousAIEngine');
          } catch (error) {
            logger.error(`子系统 ${name} 初始化失败`, 'AutonomousAIEngine', { error });
          }
        }

        this.status = EngineStatus.STOPPED;
        logger.info('引擎初始化完成', 'AutonomousAIEngine');
      } catch (error) {
        this.status = EngineStatus.ERROR;
        logger.error('引擎初始化失败', 'AutonomousAIEngine', { error });
        throw error;
      }
    }

    async start(): Promise<void> {
      logger.info('启动引擎...', 'AutonomousAIEngine');
      this.status = EngineStatus.STARTING;

      try {
        // 1. 记录启动时间
        this.startTime = new Date();

        // 2. 启动消息总线（如果需要）

        // 3. 启动所有子系统
        for (const [name, subsystem] of this.subsystems) {
          try {
            await subsystem.start();
            logger.info(`子系统 ${name} 启动成功`, 'AutonomousAIEngine');
          } catch (error) {
            logger.error(`子系统 ${name} 启动失败`, 'AutonomousAIEngine', { error });
          }
        }

        // 4. 发布系统启动消息
        await this.messageBus.publish({
          id: this.generateId(),
          type: MessageType.SYSTEM_START,
          content: { timestamp: new Date() },
          timestamp: new Date()
        });

        this.status = EngineStatus.RUNNING;
        logger.info('引擎启动成功', 'AutonomousAIEngine');

        // 5. 启动健康检查定时器
        this.startHealthCheck();
      } catch (error) {
        this.status = EngineStatus.ERROR;
        logger.error('引擎启动失败', 'AutonomousAIEngine', { error });
        throw error;
      }
    }

    async pause(): Promise<void> {
      logger.info('暂停引擎...', 'AutonomousAIEngine');
      this.status = EngineStatus.PAUSING;

      try {
        // 暂停消息处理
        // 暂停子系统

        this.status = EngineStatus.PAUSED;
        logger.info('引擎已暂停', 'AutonomousAIEngine');
      } catch (error) {
        logger.error('引擎暂停失败', 'AutonomousAIEngine', { error });
        throw error;
      }
    }

    async shutdown(): Promise<void> {
      logger.info('关闭引擎...', 'AutonomousAIEngine');
      this.status = EngineStatus.STOPPING;

      try {
        // 1. 停止所有子系统
        for (const [name, subsystem] of this.subsystems) {
          try {
            await subsystem.stop();
            logger.info(`子系统 ${name} 已停止`, 'AutonomousAIEngine');
          } catch (error) {
            logger.error(`子系统 ${name} 停止失败`, 'AutonomousAIEngine', { error });
          }
        }

        // 2. 清空消息队列
        this.messageBus.clear();

        // 3. 记录最终指标
        const finalMetrics = this.getMetrics();
        logger.info('引擎关闭，最终指标', 'AutonomousAIEngine', finalMetrics);

        this.status = EngineStatus.STOPPED;
        logger.info('引擎已关闭', 'AutonomousAIEngine');
      } catch (error) {
        logger.error('引擎关闭失败', 'AutonomousAIEngine', { error });
        throw error;
      }
    }

    getStatus(): EngineStatus {
      return this.status;
    }

    // ================= 消息处理 =================

    async processMessage(input: AgentMessage): Promise<AgentResponse> {
      if (this.status !== EngineStatus.RUNNING) {
        throw new Error(`引擎状态错误：${this.status}，无法处理消息`);
      }

      const startTime = Date.now();
      const traceId = this.generateTraceId();

      logger.debug('开始处理消息', 'AutonomousAIEngine', {
        messageId: input.id,
        messageType: input.type,
        traceId
      });

      try {
        // 1. 发布消息到总线
        await this.messageBus.publish(input);

        // 2. 查找并调用处理器
        const handler = this.messageHandlers.get(input.type);
        if (!handler) {
          throw new Error(`没有找到消息类型的处理器：${input.type}`);
        }

        // 3. 创建处理上下文
        const context = this.createProcessingContext(input, traceId);

        // 4. 调用处理器
        const response = await handler(input, context);

        // 5. 更新性能统计
        const processingTime = Date.now() - startTime;
        this.performanceStats.messageCount++;
        this.performanceStats.totalProcessingTime += processingTime;

        // 6. 更新指标
        metrics.increment('engine.messages_processed');
        metrics.histogram('engine.processing_time', processingTime);

        logger.debug('消息处理完成', 'AutonomousAIEngine', {
          messageId: input.id,
          processingTime,
          traceId
        });

        return response;
      } catch (error) {
        // 错误处理
        const processingTime = Date.now() - startTime;
        this.performanceStats.errorCount++;

        logger.error('消息处理失败', 'AutonomousAIEngine', {
          messageId: input.id,
          error,
          processingTime,
          traceId
        });

        metrics.increment('engine.messages_failed');

        // 返回错误响应
        return {
          success: false,
          content: null,
          error: {
            code: 'MESSAGE_PROCESSING_ERROR',
            message: error instanceof Error ? error.message : String(error),
            details: { traceId }
          },
          metadata: {
            processingTime,
            traceId
          }
        };
      }
    }

    registerMessageHandler(type: MessageType, handler: Function): void {
      this.messageHandlers.set(type, handler);
      logger.info('消息处理器已注册', 'AutonomousAIEngine', {
        messageType: type
      });
    }

    unregisterMessageHandler(type: MessageType): void {
      this.messageHandlers.delete(type);
      logger.info('消息处理器已取消注册', 'AutonomousAIEngine', {
        messageType: type
      });
    }

    // ================= 决策与规划 =================

    async planTask(goal: unknown): Promise<unknown> {
      // MVP简化版本：直接返回目标
      logger.info('规划任务', 'AutonomousAIEngine', { goal });
      return goal;
    }

    async executeTask(taskId: string): Promise<unknown> {
      // MVP简化版本
      logger.info('执行任务', 'AutonomousAIEngine', { taskId });
      this.taskCount++;
      return { taskId, status: 'completed' };
    }

    async cancelTask(taskId: string): Promise<void> {
      logger.info('取消任务', 'AutonomousAIEngine', { taskId });
    }

    getTaskProgress(taskId: string): unknown {
      return { taskId, progress: 0 };
    }

    // ================= 系统协调 =================

    registerSubsystem(subsystem: ISubsystem): void {
      this.subsystems.set(subsystem.name, subsystem);
      logger.info('子系统已注册', 'AutonomousAIEngine', {
        subsystemName: subsystem.name,
        version: subsystem.version
      });
    }

    unregisterSubsystem(name: string): void {
      this.subsystems.delete(name);
      logger.info('子系统已取消注册', 'AutonomousAIEngine', {
        subsystemName: name
      });
    }

    getSubsystem(name: string): ISubsystem | undefined {
      return this.subsystems.get(name);
    }

    broadcastEvent(event: unknown): void {
      logger.info('广播事件', 'AutonomousAIEngine', { event });
    }

    // ================= 状态管理 =================

    getState(): EngineState {
      const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
      const avgProcessingTime = this.performanceStats.messageCount > 0
        ? this.performanceStats.totalProcessingTime / this.performanceStats.messageCount
        : 0;

      return {
        status: this.status,
        uptime,
        tasks: {
          total: this.taskCount,
          active: 0,
          completed: this.completedTasks,
          failed: this.failedTasks
        },
        subsystems: Array.from(this.subsystems.keys()),
        metrics: {
          messageThroughput: uptime > 0
            ? (this.performanceStats.messageCount / (uptime / 1000)).toFixed(2)
            : '0',
          averageResponseTime: avgProcessingTime.toFixed(2),
          errorRate: this.performanceStats.messageCount > 0
            ? ((this.performanceStats.errorCount / this.performanceStats.messageCount) * 100).toFixed(2)
            : '0'
        }
      };
    }

    async saveState(): Promise<unknown> {
      const state = this.getState();
      logger.info('保存状态', 'AutonomousAIEngine', { state });
      return state;
    }

    async restoreState(snapshot: unknown): Promise<void> {
      logger.info('恢复状态', 'AutonomousAIEngine', { snapshot });
      // MVP简化版本：不实现状态恢复
    }

    async resetState(): Promise<void> {
      logger.info('重置状态', 'AutonomousAIEngine');
      this.performanceStats = {
        messageCount: 0,
        totalProcessingTime: 0,
        errorCount: 0
      };
    }

    // ================= 监控与诊断 =================

    getMetrics(): EngineMetrics {
      const state = this.getState();
      return {
        uptime: state.uptime,
        status: this.status,
        taskCount: state.tasks.total,
        activeTasks: state.tasks.active,
        queuedTasks: 0,
        completedTasks: state.tasks.completed,
        failedTasks: state.tasks.failed,
        messageThroughput: Number(state.metrics.messageThroughput),
        memoryUsage: process.memoryUsage(),
        subsystemHealth: {},
        errorRate: Number(state.metrics.errorRate),
        responseTimes: {
          p50: Number(state.metrics.averageResponseTime),
          p95: Number(state.metrics.averageResponseTime),
          p99: Number(state.metrics.averageResponseTime),
          average: Number(state.metrics.averageResponseTime)
        }
      };
    }

    async diagnose(): Promise<unknown> {
      logger.info('诊断引擎', 'AutonomousAIEngine');
      const metrics = this.getMetrics();
      const state = this.getState();

      return {
        timestamp: new Date(),
        metrics,
        state,
        health: this.calculateHealth(metrics)
      };
    }

    enableDebugMode(): void {
      logger.info('启用调试模式', 'AutonomousAIEngine');
    }

    disableDebugMode(): void {
      logger.info('禁用调试模式', 'AutonomousAIEngine');
    }

    // ============ 私有方法 ============

    /**
     * 设置默认消息处理器
     */
    private setupDefaultHandlers(): void {
      // 用户消息处理器
      this.registerMessageHandler(MessageType.USER_MESSAGE, async (message, context) => {
        logger.info('处理用户消息', 'AutonomousAIEngine', {
          messageId: message.id,
          content: message.content
        });

        // MVP简化版本：返回一个简单的响应
        return {
          success: true,
          content: {
            text: '这是AI的回复（MVP版本）',
            timestamp: new Date()
          },
          metadata: {
            processingTime: 0,
            traceId: context.traceId
          }
        };
      });

      // 系统错误处理器
      this.registerMessageHandler(MessageType.SYSTEM_ERROR, async (message, context) => {
        logger.error('处理系统错误', 'AutonomousAIEngine', {
          messageId: message.id,
          content: message.content
        });

        return {
          success: true,
          content: null
        };
      });
    }

    /**
     * 创建处理上下文
     */
    private createProcessingContext(message: AgentMessage, traceId: string): ProcessingContext {
      return {
        traceId,
        message,
        engineState: this.getState(),
        availableSubsystems: Array.from(this.subsystems.keys()),
        currentTime: new Date()
      };
    }

    /**
     * 启动健康检查
     */
    private startHealthCheck(): void {
      setInterval(() => {
        if (this.status === EngineStatus.RUNNING) {
          const metrics = this.getMetrics();
          logger.debug('健康检查', 'AutonomousAIEngine', {
            status: this.status,
            uptime: metrics.uptime,
            taskCount: metrics.taskCount
          });

          // 记录健康指标
          metrics.gauge('engine.uptime', metrics.uptime);
          metrics.gauge('engine.task_count', metrics.taskCount);
          metrics.gauge('engine.memory_usage', metrics.memoryUsage.heapUsed);
        }
      }, 30000); // 每30秒检查一次
    }

    /**
     * 计算健康度
     */
    private calculateHealth(metrics: EngineMetrics): string {
      if (this.status !== EngineStatus.RUNNING) {
        return 'UNHEALTHY';
      }

      // 检查内存使用
      const memoryUsage = metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal;
      if (memoryUsage > 0.9) {
        return 'CRITICAL';
      }

      // 检查错误率
      if (metrics.errorRate > 0.1) {
        return 'WARNING';
      }

      return 'HEALTHY';
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
      return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * 生成追踪ID
     */
    private generateTraceId(): string {
      return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
  }

  // ============ 导出 ============

  export default AutonomousAIEngine;

--------
