# YYC³ MovAISys - 智能浮窗系统

## 🌟 项目简介

YYC³ MovAISys 是一个教科书级的企业级智能浮窗系统，采用现代化技术栈构建，提供完整的AI能力集成和交互体验。

### ✨ 核心特性

- 🔌 **可插拔架构**：组件化设计，轻松扩展和定制
- 🧠 **多模型支持**：集成 OpenAI、Anthropic、本地模型等多种AI能力
- 📊 **智能监控**：完善的日志、指标和追踪系统
- 🎨 **现代化UI**：基于 React + Zustand 的交互界面
- 🧪 **完整测试**：单元测试、集成测试、E2E测试全覆盖
- 🚀 **容器化部署**：Docker + Docker Compose 一键部署

## 📦 技术栈

### 前端
- **React 18** - UI框架
- **Zustand** - 状态管理
- **TypeScript** - 类型安全
- **Vite** - 构建工具

### 后端
- **Bun** - JavaScript运行时
- **TypeScript** - 类型安全
- **EventEmitter** - 事件驱动

### AI/ML
- **OpenAI API** - 大语言模型
- **Anthropic API** - Claude模型
- **Ollama** - 本地模型推理
- **llama.cpp** - 本地模型加速

### 开发工具
- **Vitest** - 单元测试框架
- **Playwright** - E2E测试框架
- **ESLint** - 代码检查
- **Prettier** - 代码格式化

### 部署
- **Docker** - 容器化
- **Docker Compose** - 容器编排
- **Nginx** - 反向代理

## 🏗️ 项目结构

```
yyc3-Mobile-Intelligent-AI-System/
├── core/                              # 核心AI系统
│   ├── services/                        # AI服务模块（新增）
│   │   ├── AIChatService.ts            # AI对话服务
│   │   ├── ModelManagementService.ts   # 模型管理服务
│   │   ├── PromptTemplateService.ts    # Prompt模板服务
│   │   ├── APIKeyManagementService.ts  # API Key管理服务
│   │   ├── AIServiceManager.ts        # AI服务管理器
│   │   └── index.ts                 # 服务索引
│   ├── adapters/                       # AI模型适配器
│   ├── ai/                            # 智能体系统
│   ├── pluggable/                     # 可插拔式AI引擎
│   ├── autonomous-ai-widget/          # 自治AI组件
│   ├── ui/                            # UI组件
│   ├── NeuralComputingSystem.ts       # 神经计算系统
│   └── index.ts                      # 主入口文件
├── src/                              # 源代码（辅助）
│   ├── learning/                      # 学习系统
│   ├── tool/                          # 工具系统
│   ├── types/                         # 类型定义
│   ├── utils/                         # 工具函数
│   └── widget/                        # Widget组件
├── examples/                         # 使用示例
│   └── AIServiceUsage.ts           # AI服务使用示例
├── docs/                            # 文档
│   ├── AI功能实现文档.md            # AI功能实现文档
│   └── 项目结构文档.md              # 项目结构文档
├── tests/                           # 测试文件
└── .github/                         # GitHub配置
```

### 📋 核心模块

#### AI服务模块 (core/services/)
- **AIChatService**: 完整的AI对话功能，支持多轮对话、消息状态管理、流式输出
- **ModelManagementService**: 动态模型管理，支持模型列表获取、缓存、过滤搜索
- **PromptTemplateService**: Prompt模板管理，支持模板创建、编辑、变量替换、分类收藏
- **APIKeyManagementService**: 安全的API Key管理，支持加密存储、连接测试、使用统计
- **AIServiceManager**: 统一服务管理器，提供所有AI服务的统一接口

#### 智能体系统 (core/ai/)
- **AgentManager**: 智能体管理器，负责智能体注册、消息路由、协调
- **具体智能体**: LayoutAgent、BehaviorAgent、ContentAgent、AssistantAgent、MonitoringAgent

#### 可插拔式AI引擎 (core/pluggable/)
- **AutonomousAIEngine**: 自治AI引擎，提供任务调度、子系统协调、消息处理

#### UI组件 (core/ui/)
- **ChatInterface**: 聊天界面，支持多会话、消息历史、主题定制
- **其他组件**: ToolboxPanel、InsightsDashboard、WorkflowDesigner等

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- Bun >= 1.0.0
- Docker >= 20.10.0
- Docker Compose >= 2.0.0

### 安装依赖

```bash
bun install
```

### 配置环境变量

复制 `.env.example` 到 `.env` 并填入配置：

```bash
cp .env.example .env
```

### 启动开发服务器

```bash
# 启动后端API
bun run dev

# 启动前端UI
cd widget
bun run dev
```

### 使用AI服务

```typescript
import { AIServiceManager } from './core/services/AIServiceManager';

// 创建服务管理器
const manager = new AIServiceManager();

// 初始化服务
await manager.initialize();

// 配置API Key
await manager.addAPIKey({
  name: 'OpenAI Key',
  provider: 'openai',
  key: 'sk-xxxxxxxx',
  isActive: true,
});

// 发送消息
const message = await manager.sendMessage('你好', {
  model: 'gpt-3.5-turbo',
});

console.log(message.content);

// 使用模板发送消息
const templateMessage = await manager.sendMessageWithTemplate(
  'code-review',
  { code: 'function add(a, b) { return a + b; }', language: 'JavaScript' },
  { model: 'gpt-3.5-turbo' }
);
```

### 使用智能体系统

```typescript
import { AgentSystem } from './core/ai/index';

// 创建智能体系统
const agentSystem = new AgentSystem();

// 初始化
await agentSystem.initialize();

// 创建布局智能体
const layoutAgent = agentSystem.createLayoutAgent({
  id: 'layout-1',
  name: 'Layout Agent',
  capabilities: ['layout', 'responsive'],
});

// 发送消息
const response = await agentSystem.sendMessage({
  id: 'msg-1',
  from: 'user',
  to: 'layout-1',
  type: 'request',
  content: { action: 'optimize-layout' },
  timestamp: new Date(),
});
```

### 运行测试

```bash
# 单元测试
bun run test

# 测试覆盖率
bun run test:coverage

# E2E测试
bun run test:e2e
```

### 构建生产版本

```bash
# 构建后端
bun run build

# 构建前端
cd widget
bun run build
```

### Docker部署

```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d
```

## 📖 使用指南

### 1. 创建引擎实例

```typescript
import { AutonomousAIEngine } from './core/AutonomousAIEngine';
import { EngineConfig } from './types/engine.types';

const config: EngineConfig = {
  version: '0.1.0',
  environment: 'development',
  // ... 其他配置
};

const engine = new AutonomousAIEngine(config);
```

### 2. 使用模型适配器

```typescript
import { OpenAIAdapter } from './model/OpenAIAdapter';
import { ModelProvider } from './types/model.types';

const adapter = new OpenAIAdapter({
  provider: ModelProvider.OPENAI,
  apiKey: 'your-api-key',
  model: 'gpt-4-turbo-preview'
}, modelInfo);

// 生成文本补全
const response = await adapter.generateCompletion({
  provider: ModelProvider.OPENAI,
  model: 'gpt-4-turbo-preview',
  type: ModelType.LLM,
  prompt: 'Hello, world!'
});
```

### 3. 使用日志系统

```typescript
import { logger } from './utils/logger';

logger.info('这是一条信息日志', 'MyContext');
logger.error('这是一条错误日志', 'MyContext', { error });
```

### 4. 使用指标系统

```typescript
import { metrics } from './utils/metrics';

// 计数器
metrics.increment('requests.total');

// 仪表盘
metrics.gauge('memory.usage', value);

// 直方图
metrics.histogram('request.duration', duration);
```

## 📊 当前完成状态

### ✅ 已完成

- **第一章：项目基础设施搭建** (100%)
  - ✅ package.json
  - ✅ tsconfig.json
  - ✅ .env.example
  - ✅ logger.ts
  - ✅ metrics.ts

- **第二章：核心引擎MVP实现** (100%)
  - ✅ engine.types.ts
  - ✅ MessageBus.ts
  - ✅ AutonomousAIEngine.ts

- **第三章：模型适配器基础实现** (100%)
  - ✅ model.types.ts
  - ✅ BaseModelAdapter.ts
  - ✅ OpenAIAdapter.ts
  - ✅ LocalModelAdapter.ts

- **入口文件** (100%)
  - ✅ src/index.ts

### 🔄 进行中

- **第四章：智能交互界面实现** (0%)
  - ⏳ UI组件
  - ⏳ 状态管理

### ⏳ 待完成

- **第五章：测试体系搭建** (0%)
- **第六章：部署配置完善** (0%)

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 👥 团队

YanYuCloudCube Team

## 📞 联系方式

- 项目主页：[GitHub](https://github.com/yyc3/movaisys)
- 文档：[docs](https://docs.0379.email)
- 邮箱：team@0379.email

---

**YYC³ MovAISys** - 重新定义AI交互体验 🚀
