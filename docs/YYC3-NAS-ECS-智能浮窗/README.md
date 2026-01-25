# YYC³ AI智能浮窗系统

> 智能插拔式可移动AI系统 · 基于五标五高五化设计原则

## 📖 简介

YYC³ AI智能浮窗系统是一个企业级的智能AI交互解决方案，提供可插拔、可移动、可定制的AI助手功能。系统采用事件驱动+目标驱动的混合架构，支持多模型切换、工具编排、知识库接入等高级特性。

## ✨ 核心特性

### 🧠 智能自治引擎 (AgenticCore)

- **目标驱动**: 自动分解复杂任务为可执行子任务
- **智能规划**: 支持BFS、DFS、A*等多种规划策略
- **自主执行**: 动态调度和执行任务流程
- **反思学习**: 任务完成后自动反思和优化
- **持续学习**: 从历史执行中积累经验

### 🎨 可拖拽UI组件

- **自由移动**: 鼠标拖拽到任意位置
- **弹性调整**: 自定义窗口大小
- **最小化/最大化**: 灵活的窗口控制
- **响应式设计**: 适配各种屏幕尺寸
- **快捷键支持**: Ctrl/Cmd + K 快速唤起

### 🤖 多模型支持

- **智谱GLM系列**: GLM-4-Flash、GLM-4-Plus、GLM-4V
- **阿里通义千问**: 通义千问Max、Plus等
- **百度文心一言**: 文心一言4.0、3.5等
- **Ollama本地模型**: Llama 3、Mistral等
- **LM Studio**: 支持本地私有化部署

### 🔌 可插拔架构

- **工具注册中心**: 动态注册和发现工具
- **知识库接入**: 支持向量搜索和RAG
- **模型适配器**: 统一的模型调用接口
- **能力扩展**: 轻松添加新功能模块

## 🎯 系统架构升级 (v1.1.0)

### 新增核心组件

#### 1. **消息总线系统 (MessageBus)**

- ✅ 发布-订阅模式
- ✅ 优先级队列
- ✅ 重试机制（指数退避）
- ✅ 死信队列
- ✅ 消息持久化

#### 2. **任务调度器 (TaskScheduler)**

- ✅ 优先级调度
- ✅ 并发控制（可配置）
- ✅ 超时管理
- ✅ 依赖解析
- ✅ 任务取消

#### 3. **状态管理器 (StateManager)**

- ✅ 状态快照
- ✅ 历史回溯（撤销/重做）
- ✅ 自动持久化
- ✅ 校验和验证
- ✅ 计数器管理

#### 4. **工具编排引擎 (ToolOrchestrator)**

- ✅ 工具注册与发现
- ✅ 参数验证
- ✅ 依赖分析
- ✅ 并发执行
- ✅ 性能统计

#### 5. **模型路由器 (ModelRouter)**

- ✅ 智能模型选择
- ✅ 成本优化
- ✅ 负载均衡
- ✅ 故障转移
- ✅ 性能监控

#### 6. **高级拖拽系统 (AdvancedDragSystem)**

- ✅ 惯性模拟
- ✅ 磁性吸附
- ✅ 边界约束
- ✅ 网格对齐
- ✅ 多指触控

#### 7. **目标管理系统 (GoalManagementSystem)** ✨NEW

- ✅ 目标生命周期管理（8阶段）
- ✅ SMART目标验证
- ✅ OKR框架支持
- ✅ 进度追踪与里程碑
- ✅ 风险识别与缓解
- ✅ 价值评估与ROI分析
- ✅ 协作与对齐检查

#### 8. **技术成熟度模型 (TechnicalMaturityModel)** ✨NEW

- ✅ 五级成熟度评估（CMMI风格）
- ✅ 8维度评估体系
- ✅ 自动化评分引擎
- ✅ 差距分析
- ✅ 改进路线图规划
- ✅ 行业基准对比
- ✅ 趋势分析

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local` 并配置：

```bash
# 智谱AI
ZHIPU_API_KEY=your_zhipu_api_key

# 阿里云通义千问
ALIBABA_API_KEY=your_alibaba_api_key

# 百度文心一言
BAIDU_API_KEY=your_baidu_api_key
BAIDU_SECRET_KEY=your_baidu_secret_key

# Ollama本地模型 (可选)
OLLAMA_BASE_URL=http://localhost:11434
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 <http://localhost:3000/ai-floating-demo> 查看演示页面。

## 💻 使用方法

### 方式一：全局集成（推荐）

AI浮窗已默认集成在主应用布局中，全局可用：

```tsx
// app/layout.tsx (已配置)
import { AIWidgetProvider } from '@/components/ai-floating-widget';

export default function RootLayout({ children }) {
  return (
    <AIWidgetProvider autoInit={true}>
      {children}
    </AIWidgetProvider>
  );
}
```

**快捷键**: 按 `Ctrl/Cmd + K` 即可在任意页面唤起AI助手。

### 方式二：手动集成

在需要的页面中使用 Hook：

```tsx
'use client';

import { useAIWidget, AIWidgetTrigger } from '@/components/ai-floating-widget';

export default function MyPage() {
  const { showWidget, hideWidget, toggleWidget } = useAIWidget();
  
  return (
    <div>
      <button onClick={showWidget}>打开AI助手</button>
      {/* 或使用预制按钮 */}
      <AIWidgetTrigger className="btn btn-primary" />
    </div>
  );
}
```

### 方式三：独立使用

创建自己的AgenticCore实例：

```tsx
'use client';

import { useState, useEffect } from 'react';
import { AgenticCore, type AgentConfig } from '@/lib/agentic-core';
import { IntelligentAIWidget } from '@/components/ai-floating-widget';

export default function CustomPage() {
  const [agenticCore, setAgenticCore] = useState<AgenticCore | null>(null);

  useEffect(() => {
    const config: AgentConfig = {
      agentId: 'custom-agent',
      name: '自定义AI助手',
      goalConfig: {
        maxGoalDepth: 5,
        goalTimeout: 30000,
        priorityWeights: { urgency: 0.4, importance: 0.3, complexity: 0.3 }
      },
      planningConfig: {
        maxPlanSteps: 10,
        planningStrategy: 'astar',
        replanningThreshold: 0.7
      },
      toolConfig: {
        enabledTools: ['search', 'calculator'],
        toolTimeout: 10000,
        maxConcurrentTools: 3
      },
      reflectionConfig: {
        enableReflection: true,
        reflectionInterval: 5000,
        learningRate: 0.01
      },
      knowledgeConfig: {
        enableKnowledgeBase: false
      },
      contextConfig: {
        maxHistoryLength: 50,
        contextWindow: 4096,
        persistContext: true
      },
      learningConfig: {
        enableLearning: true,
        learningStrategy: 'hybrid',
        feedbackThreshold: 0.8
      }
    };

    const core = new AgenticCore(config);
    setAgenticCore(core);

    return () => core.destroy();
  }, []);

  return (
    <div>
      {agenticCore && (
        <IntelligentAIWidget 
          agenticCore={agenticCore}
          onClose={() => console.log('Widget closed')}
        />
      )}
    </div>
  );
}
```

## 🏗️ 架构设计

### 核心模块

```
lib/
├── agentic-core/              # 智能自治引擎
│   ├── AgenticCore.ts         # 核心引擎类
│   ├── MessageBus.ts          # 消息总线 ✨NEW
│   ├── TaskScheduler.ts       # 任务调度器 ✨NEW
│   ├── StateManager.ts        # 状态管理器 ✨NEW
│   └── index.ts               # 模块导出
├── model-adapter/             # 模型适配器
│   ├── types.ts               # 类型定义
│   ├── ZhipuAdapter.ts        # 智谱GLM适配器
│   ├── ModelAdapterFactory.ts # 适配器工厂
│   ├── ModelRouter.ts         # 模型路由器 ✨NEW
│   └── index.ts               # 模块导出
├── tool-orchestrator/         # 工具编排 ✨NEW
│   ├── ToolOrchestrator.ts    # 工具编排引擎
│   └── index.ts               # 模块导出
├── advanced-drag/             # 高级拖拽 ✨NEW
│   ├── AdvancedDragSystem.ts  # 高级拖拽系统
│   └── index.ts               # 模块导出
├── goal-management/           # 目标管理 ✨NEW
│   ├── GoalManagementSystem.ts # 目标管理系统
│   └── index.ts               # 模块导出
├── maturity-model/            # 成熟度模型 ✨NEW
│   ├── TechnicalMaturityModel.ts # 技术成熟度模型
│   └── index.ts               # 模块导出
components/
└── ai-floating-widget/        # AI浮窗组件
    ├── IntelligentAIWidget.tsx    # 主组件
    ├── AIWidgetProvider.tsx       # 全局Provider
    └── index.ts                   # 模块导出
```

### 数据流

```
用户输入 → AgenticCore
    ↓
意图识别 → 任务创建
    ↓
智能规划 → 生成子任务
    ↓
任务执行 → 调用模型/工具
    ↓
结果反思 → 质量评估
    ↓
持续学习 → 经验积累
    ↓
响应生成 → 返回用户
```

## 🔧 配置选项

### AgentConfig 配置详解

```typescript
interface AgentConfig {
  // 基础配置
  agentId: string;        // 唯一标识
  name: string;           // 助手名称
  
  // 目标配置
  goalConfig: {
    maxGoalDepth: number;           // 最大目标层级 (推荐: 5)
    goalTimeout: number;            // 目标超时时间ms (推荐: 30000)
    priorityWeights: {              // 优先级权重
      urgency: number;              // 紧急度 (0-1)
      importance: number;           // 重要度 (0-1)
      complexity: number;           // 复杂度 (0-1)
    };
  };
  
  // 规划配置
  planningConfig: {
    maxPlanSteps: number;           // 最大规划步骤 (推荐: 10)
    planningStrategy: 'bfs' | 'dfs' | 'astar';  // 规划策略
    replanningThreshold: number;    // 重新规划阈值 (0-1)
  };
  
  // 工具配置
  toolConfig: {
    enabledTools: string[];         // 启用的工具列表
    toolTimeout: number;            // 工具超时时间ms
    maxConcurrentTools: number;     // 最大并发工具数
  };
  
  // 反思配置
  reflectionConfig: {
    enableReflection: boolean;      // 是否启用反思
    reflectionInterval: number;     // 反思间隔ms
    learningRate: number;           // 学习率 (0-1)
  };
  
  // 知识库配置
  knowledgeConfig: {
    enableKnowledgeBase: boolean;   // 是否启用知识库
    vectorDbUrl?: string;           // 向量数据库URL
    embeddingModel?: string;        // 嵌入模型
  };
  
  // 上下文配置
  contextConfig: {
    maxHistoryLength: number;       // 最大历史长度
    contextWindow: number;          // 上下文窗口大小
    persistContext: boolean;        // 是否持久化上下文
  };
  
  // 学习配置
  learningConfig: {
    enableLearning: boolean;        // 是否启用学习
    learningStrategy: 'online' | 'offline' | 'hybrid';
    feedbackThreshold: number;      // 反馈阈值 (0-1)
  };
}
```

## 📊 系统指标

AgenticCore提供实时运行指标：

```typescript
const metrics = agenticCore.getMetrics();
console.log(metrics);
// {
//   totalTasks: 100,
//   completedTasks: 95,
//   failedTasks: 5,
//   averageDuration: 1234 // ms
// }
```

## 🎯 事件监听

AgenticCore基于EventEmitter，支持丰富的事件监听：

```typescript
// 任务创建
agenticCore.on('task:created', (task) => {
  console.log('任务已创建:', task.id);
});

// 任务完成
agenticCore.on('task:completed', (task) => {
  console.log('任务已完成:', task.id);
});

// 任务失败
agenticCore.on('task:failed', (task, error) => {
  console.error('任务失败:', task.id, error);
});

// 状态变更
agenticCore.on('state:changed', (oldState, newState) => {
  console.log(`状态变更: ${oldState} -> ${newState}`);
});

// 反思完成
agenticCore.on('reflection:completed', ({ task, performance }) => {
  console.log('反思完成:', performance);
});

// 学习完成
agenticCore.on('learning:completed', (learningData) => {
  console.log('学习完成:', learningData);
});
```

## 🔐 安全注意事项

1. **API密钥保护**:
   - 不要在客户端直接暴露API密钥
   - 使用环境变量存储敏感信息
   - 考虑使用代理服务器转发请求

2. **用户权限控制**:
   - 在AgentContext中设置permissions
   - 工具调用前验证用户权限
   - 限制敏感操作的访问

3. **速率限制**:
   - 实施请求频率限制
   - 监控API使用量
   - 设置合理的超时时间

## 📚 扩展开发

### 添加新的模型适配器

1. 创建适配器类实现 `IModelAdapter` 接口：

```typescript
import { IModelAdapter, ModelConfig, ChatRequest, ChatResponse } from './types';

export class CustomAdapter implements IModelAdapter {
  provider = ModelProvider.CUSTOM;
  config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // 实现聊天逻辑
  }

  async chatStream(request: ChatRequest, callback: StreamCallback): Promise<void> {
    // 实现流式聊天逻辑
  }

  async getModelInfo(): Promise<ModelInfo> {
    // 返回模型信息
  }

  validateConfig(): boolean {
    // 验证配置
  }

  estimateTokens(text: string): number {
    // 估算tokens
  }
}
```

2. 在 `ModelAdapterFactory` 中注册：

```typescript
// lib/model-adapter/ModelAdapterFactory.ts
case ModelProvider.CUSTOM:
  adapter = new CustomAdapter(config);
  break;
```

### 添加自定义工具

```typescript
// 在AgenticCore中注册工具
agenticCore.on('tool:register', (toolName, toolFunction) => {
  // 实现工具注册逻辑
});
```

## 📚 高级功能 API 文档

### 1. 消息总线系统 (MessageBus)

**核心能力**：事件驱动通信、优先级队列、重试机制

```typescript
import { AgenticCore, MessageBus } from '@/lib/agentic-core';

// 获取消息总线实例
const core = new AgenticCore(config);
const messageBus = core.getMessageBus();

// 发布消息
await messageBus.publish({
  type: 'goal:created',
  priority: 5,
  payload: { goalId: 'goal-123', name: '数据分析' },
  persistent: true
});

// 订阅消息
const unsubscribe = messageBus.subscribe(
  'goal:created', 
  async (message) => {
    console.log('收到新目标:', message.payload);
  },
  { priority: 3 }
);

// 取消订阅
unsubscribe();
```

**配置选项**：

- `maxQueueSize`: 队列最大长度（默认1000）
- `maxRetries`: 最大重试次数（默认3）
- `backoffMultiplier`: 退避乘数（默认2）

### 2. 任务调度器 (TaskScheduler)

**核心能力**：优先级调度、并发控制、依赖解析

```typescript
import { TaskScheduler } from '@/lib/agentic-core';

// 获取任务调度器
const scheduler = core.getTaskScheduler();

// 调度任务
const taskId = await scheduler.schedule({
  name: '数据抓取',
  priority: 4, // 1-5，5最高
  execute: async () => {
    const data = await fetchData();
    return data;
  },
  timeout: 30000,
  dependencies: ['task-abc'] // 可选：依赖任务ID
});

// 等待任务完成
const result = await scheduler.waitForTask(taskId);

// 取消任务
await scheduler.cancelTask(taskId);

// 批量等待
await scheduler.waitAll(['task-1', 'task-2', 'task-3']);
```

**配置选项**：

- `maxConcurrent`: 最大并发数（默认10）
- `defaultTimeout`: 默认超时（默认60秒）

### 3. 状态管理器 (StateManager)

**核心能力**：状态快照、撤销/重做、自动持久化

```typescript
import { StateManager } from '@/lib/agentic-core';

// 获取状态管理器
const stateManager = core.getStateManager();

// 设置状态
await stateManager.setState('user.preferences', {
  theme: 'dark',
  language: 'zh-CN'
});

// 获取状态
const prefs = stateManager.getState('user.preferences');

// 创建快照
const snapshotId = await stateManager.createSnapshot('用户配置更新');

// 恢复快照
await stateManager.restoreSnapshot(snapshotId);

// 撤销/重做
await stateManager.undo(); // 撤销上一次操作
await stateManager.redo(); // 重做

// 计数器操作
await stateManager.incrementCounter('api.requests', 1);
const count = stateManager.getCounter('api.requests');
```

**配置选项**：

- `maxSnapshots`: 最大快照数（默认100）
- `autoSaveInterval`: 自动保存间隔（默认60秒）
- `persistenceKey`: 本地存储键（默认'state-manager'）

### 4. 工具编排引擎 (ToolOrchestrator)

**核心能力**：工具注册、参数验证、依赖解析、并发执行

```typescript
import { ToolOrchestrator } from '@/lib/tool-orchestrator';

const orchestrator = new ToolOrchestrator();

// 注册工具
orchestrator.registerTool({
  name: 'weather',
  description: '查询天气信息',
  parameters: {
    type: 'object',
    properties: {
      city: { type: 'string', description: '城市名称' }
    },
    required: ['city']
  },
  execute: async (params: { city: string }) => {
    const weather = await fetchWeather(params.city);
    return { temperature: weather.temp, condition: weather.desc };
  }
});

// 执行单个工具
const result = await orchestrator.executeTool('weather', { city: '北京' });

// 编排多个工具（自动解析依赖）
const results = await orchestrator.orchestrate([
  { toolName: 'weather', params: { city: '北京' } },
  { toolName: 'translate', params: { text: '${weather.condition}' }, dependencies: ['weather'] }
]);

// 搜索工具
const tools = await orchestrator.searchTools('天气');

// 统计信息
const stats = orchestrator.getToolStats('weather');
console.log(`执行${stats.executionCount}次，成功${stats.successCount}次`);
```

### 5. 模型路由器 (ModelRouter)

**核心能力**：智能模型选择、成本优化、自动故障转移

```typescript
import { ModelRouter } from '@/lib/model-adapter';

const router = new ModelRouter({
  weights: {
    performance: 0.3,  // 性能权重30%
    cost: 0.2,         // 成本权重20%
    quality: 0.3,      // 质量权重30%
    latency: 0.15,     // 延迟权重15%
    availability: 0.05 // 可用性权重5%
  }
});

// 注册模型适配器
router.registerAdapter(zhipuAdapter);
router.registerAdapter(alibabaAdapter);

// 智能路由
const result = await router.route({
  prompt: '请解释量子计算原理',
  requirements: {
    minQuality: 0.8,      // 最低质量要求
    maxCost: 0.05,        // 最高成本限制
    maxLatency: 5000,     // 最大延迟（毫秒）
    preferredModels: ['glm-4-flash'],
    excludedModels: ['gpt-3.5']
  }
});

console.log(`使用模型: ${result.modelUsed}`);
console.log(`响应内容: ${result.response}`);
console.log(`花费: $${result.cost.toFixed(4)}`);

// 查询成本统计
const metrics = router.getMetrics();
console.log(`总请求: ${metrics.totalRequests}`);
console.log(`总成本: $${metrics.totalCost.toFixed(2)}`);
console.log(`平均延迟: ${metrics.averageLatency}ms`);
```

**评分规则**：

- 性能得分：基于模型benchmark分数
- 成本得分：1 - (实际成本/最高成本)
- 质量得分：历史执行质量评估
- 延迟得分：1 - (实际延迟/最大延迟)
- 可用性得分：当前可用性状态

### 6. 高级拖拽系统 (AdvancedDragSystem)

**核心能力**：惯性模拟、磁性吸附、碰撞检测、多指触控

```typescript
import { AdvancedDragSystem } from '@/lib/advanced-drag';

const dragSystem = new AdvancedDragSystem({
  friction: 0.95,          // 摩擦系数（0-1）
  snapThreshold: 20,       // 磁性吸附阈值（像素）
  enableInertia: true,     // 启用惯性
  enableSnap: true,        // 启用吸附
  enableCollision: true,   // 启用碰撞检测
  bounds: {                // 边界约束
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight
  },
  snapPoints: [            // 吸附点
    { x: window.innerWidth / 2, y: 50 },      // 顶部中心
    { x: window.innerWidth - 100, y: 100 }    // 右上角
  ],
  gridSize: 10             // 网格对齐大小
});

// 初始化拖拽
const elementRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (elementRef.current) {
    dragSystem.init(elementRef.current);
  }
  return () => dragSystem.destroy();
}, []);

// 监听拖拽事件
dragSystem.on('dragStart', (state) => {
  console.log('开始拖拽', state.position);
});

dragSystem.on('dragMove', (state) => {
  console.log('拖拽中', state.velocity);
});

dragSystem.on('dragEnd', (state) => {
  console.log('结束拖拽', state.position);
  // 保存位置
  localStorage.setItem('widget-position', JSON.stringify(state.position));
});

dragSystem.on('snap', (point) => {
  console.log('吸附到', point);
});
```

**物理模拟**：

- 惯性速度：根据拖拽速度计算初始速度
- 摩擦衰减：每帧速度乘以摩擦系数（0.95）
- 磁性吸附：距离吸附点<20px时自动吸附
- 碰撞检测：自动避免与其他元素重叠

### 7. 目标管理系统 (GoalManagementSystem)

**核心能力**：完整的目标生命周期管理，支持SMART验证、OKR框架、进度追踪

```typescript
import { GoalManagementSystem } from '@/lib/goal-management';

const goalSystem = new GoalManagementSystem({
  enableAutoAdjustment: true,
  riskThreshold: 0.7,
  enableCollaboration: true,
});

// 创建并管理目标
const lifecycle = await goalSystem.manageGoalLifecycle({
  title: '提升系统性能',
  description: '优化核心模块，减少响应时间50%',
  category: 'technical',
  priority: 5,
  deadline: new Date('2025-03-31'),
  owner: 'tech-team',
  kpis: [
    { name: '响应时间', target: 200, current: 400, unit: 'ms' }
  ]
});

// 查看执行结果
console.log('目标创建:', lifecycle.creation);
console.log('执行计划:', lifecycle.planning.plan);
console.log('价值评估:', lifecycle.evaluation.valueDelivered);

// 获取统计信息
const stats = goalSystem.getStats();
console.log(`完成率: ${(stats.successRate * 100).toFixed(1)}%`);
```

**8个生命周期阶段**：创建→规划→执行→监控→调整→完成→评估→学习

### 8. 技术成熟度模型 (TechnicalMaturityModel)

**核心能力**：五级成熟度评估、8维度评分、改进路线图

```typescript
import { TechnicalMaturityModel, MaturityLevel } from '@/lib/maturity-model';

const maturityModel = new TechnicalMaturityModel({
  targetLevel: MaturityLevel.MANAGED
});

// 执行评估
const assessment = await maturityModel.assessMaturity();

console.log('成熟度等级:', MaturityLevel[assessment.maturityLevel]);
console.log('总体评分:', assessment.overallScore, '/100');

// 查看改进路线图
assessment.roadmap.phases.forEach(phase => {
  console.log(`${phase.name}: ${phase.duration}天`);
  console.log('  目标:', phase.objectives);
});

// 行业对比
console.log('行业位置:', assessment.benchmarking.position);
console.log('百分位:', assessment.benchmarking.percentile);

// 导出报告
const report = maturityModel.exportReport('markdown');
```

**五级成熟度**: Initial (1) → Repeatable (2) → Defined (3) → Managed (4) → Optimizing (5)

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test -- AgenticCore

# 生成覆盖率报告
pnpm test:coverage
```

## 📖 技术文档

详细的设计文档位于 `docs/AI智能浮窗系统/` 目录：

- [00-智能插拔式移动AI系统设计.md](../docs/AI智能浮窗系统/00-智能插拔式移动AI系统设计.md) - 总体设计
- [01-可插拔式拖拽移动AI系统.md](../docs/AI智能浮窗系统/01-可插拔式拖拽移动AI系统.md) - UI交互设计
- [02-智能插拔式可移动AI执行方案.md](../docs/AI智能浮窗系统/02-智能插拔式可移动AI执行方案.md) - 执行架构
- [03-AI功能组件深度设计.md](../docs/AI智能浮窗系统/03-AI功能组件深度设计.md) - 功能组件

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 👥 团队

YYC³ 开发团队

- 邮箱: <admin@0379.email>
- 网站: <https://github.com/your-org/yyc3-mana>

---

**© 2025 YYC³ - 企业级智能AI解决方案**
