# AI智能浮窗系统 - 集成示例

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

本文档展示如何综合使用AI智能浮窗系统的所有高级功能。

## 📋 目录

- [AI智能浮窗系统 - 集成示例](#ai智能浮窗系统---集成示例)
  - [📋 目录](#-目录)
  - [完整集成示例](#完整集成示例)
  - [场景一：智能任务调度](#场景一智能任务调度)
  - [场景二：多工具协同](#场景二多工具协同)
  - [场景三：成本优化的模型选择](#场景三成本优化的模型选择)
  - [场景四：状态持久化与恢复](#场景四状态持久化与恢复)
  - [场景五：高级拖拽体验](#场景五高级拖拽体验)
  - [🎯 最佳实践](#-最佳实践)
    - [1. 性能优化](#1-性能优化)
    - [2. 错误处理](#2-错误处理)
    - [3. 资源管理](#3-资源管理)
  - [📖 更多资源](#-更多资源)

---

## 完整集成示例

展示如何在一个完整的应用中集成所有高级功能：

```tsx
// app/ai-demo/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { AgenticCore } from '@/lib/agentic-core';
import { ToolOrchestrator } from '@/lib/tool-orchestrator';
import { ModelRouter } from '@/lib/model-adapter';
import { AdvancedDragSystem } from '@/lib/advanced-drag';
import { IntelligentAIWidget } from '@/components/ai-floating-widget';

export default function AIIntegrationDemo() {
  const [core, setCore] = useState<AgenticCore | null>(null);
  const [orchestrator, setOrchestrator] = useState<ToolOrchestrator | null>(null);
  const [router, setRouter] = useState<ModelRouter | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. 初始化核心引擎
    const agenticCore = new AgenticCore({
      agentId: 'ai-demo-agent',
      name: 'AI智能助手',
      version: '1.1.0',
      modelConfig: {
        provider: 'zhipu',
        model: 'glm-4-flash',
        temperature: 0.7,
        maxTokens: 2048
      }
    });

    // 2. 初始化工具编排器
    const toolOrchestrator = new ToolOrchestrator();
    
    // 注册示例工具
    registerSampleTools(toolOrchestrator);

    // 3. 初始化模型路由器
    const modelRouter = new ModelRouter({
      weights: {
        performance: 0.3,
        cost: 0.2,
        quality: 0.3,
        latency: 0.15,
        availability: 0.05
      }
    });

    // 4. 设置消息总线监听
    setupMessageBusListeners(agenticCore);

    // 5. 初始化高级拖拽（如果有拖拽元素）
    if (widgetRef.current) {
      const dragSystem = new AdvancedDragSystem({
        friction: 0.95,
        snapThreshold: 20,
        enableInertia: true,
        enableSnap: true,
        bounds: {
          left: 0,
          top: 0,
          right: window.innerWidth,
          bottom: window.innerHeight
        }
      });

      dragSystem.init(widgetRef.current);

      // 监听拖拽事件
      dragSystem.on('dragEnd', (state) => {
        // 保存位置到状态管理器
        agenticCore.getStateManager().setState('widget.position', state.position);
      });
    }

    // 6. 恢复上次状态
    restorePreviousState(agenticCore);

    setCore(agenticCore);
    setOrchestrator(toolOrchestrator);
    setRouter(modelRouter);

    return () => {
      agenticCore.destroy();
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">AI智能浮窗系统 - 完整集成示例</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 系统状态面板 */}
        <SystemStatusPanel core={core} />
        
        {/* 工具执行面板 */}
        <ToolExecutionPanel orchestrator={orchestrator} />
        
        {/* 模型路由面板 */}
        <ModelRoutingPanel router={router} />
        
        {/* 任务调度面板 */}
        <TaskSchedulePanel core={core} />
      </div>

      {/* AI浮窗 */}
      <div ref={widgetRef}>
        {core && <IntelligentAIWidget agenticCore={core} />}
      </div>
    </div>
  );
}

// 注册示例工具
function registerSampleTools(orchestrator: ToolOrchestrator) {
  // 天气查询工具
  orchestrator.registerTool({
    name: 'weather',
    description: '查询指定城市的天气信息',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名称' }
      },
      required: ['city']
    },
    execute: async (params: { city: string }) => {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        temperature: 22,
        condition: '晴朗',
        humidity: 65,
        city: params.city
      };
    }
  });

  // 翻译工具
  orchestrator.registerTool({
    name: 'translate',
    description: '翻译文本',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '要翻译的文本' },
        targetLang: { type: 'string', description: '目标语言' }
      },
      required: ['text', 'targetLang']
    },
    execute: async (params: { text: string; targetLang: string }) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        original: params.text,
        translated: `[${params.targetLang}] ${params.text}`,
        language: params.targetLang
      };
    }
  });

  // 数据分析工具
  orchestrator.registerTool({
    name: 'analyze',
    description: '分析数据并生成报告',
    parameters: {
      type: 'object',
      properties: {
        data: { type: 'array', description: '要分析的数据' },
        type: { type: 'string', description: '分析类型' }
      },
      required: ['data', 'type']
    },
    execute: async (params: { data: any[]; type: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        summary: `对${params.data.length}条数据进行了${params.type}分析`,
        insights: ['趋势上升', '异常值检测到3个', '相关性系数0.85'],
        recommendations: ['建议进一步调研', '优化数据采集流程']
      };
    }
  });
}

// 设置消息总线监听
function setupMessageBusListeners(core: AgenticCore) {
  const messageBus = core.getMessageBus();

  // 监听目标创建事件
  messageBus.subscribe('goal:created', async (message) => {
    console.log('新目标创建:', message.payload);
    
    // 自动调度任务
    const scheduler = core.getTaskScheduler();
    await scheduler.schedule({
      name: `处理目标-${message.payload.goalId}`,
      priority: 4,
      execute: async () => {
        // 执行目标相关任务
        return { status: 'success' };
      }
    });
  });

  // 监听任务完成事件
  messageBus.subscribe('task:completed', async (message) => {
    console.log('任务完成:', message.payload);
    
    // 更新状态
    const stateManager = core.getStateManager();
    await stateManager.incrementCounter('tasks.completed', 1);
  });

  // 监听错误事件
  messageBus.subscribe('error:*', async (message) => {
    console.error('系统错误:', message.payload);
    
    // 创建错误快照
    const stateManager = core.getStateManager();
    await stateManager.createSnapshot(`错误快照-${Date.now()}`);
  });
}

// 恢复上次状态
async function restorePreviousState(core: AgenticCore) {
  const stateManager = core.getStateManager();
  
  // 恢复窗口位置
  const position = stateManager.getState('widget.position');
  if (position) {
    console.log('恢复窗口位置:', position);
  }

  // 恢复用户偏好
  const preferences = stateManager.getState('user.preferences');
  if (preferences) {
    console.log('恢复用户偏好:', preferences);
  }
}
```

---

## 场景一：智能任务调度

使用TaskScheduler进行复杂任务的优先级调度和依赖管理：

```typescript
import { AgenticCore } from '@/lib/agentic-core';

async function intelligentTaskScheduling() {
  const core = new AgenticCore(config);
  const scheduler = core.getTaskScheduler();

  // 场景：数据处理管道
  // 1. 数据采集（高优先级，无依赖）
  const collectTaskId = await scheduler.schedule({
    name: '数据采集',
    priority: 5, // 最高优先级
    execute: async () => {
      console.log('开始采集数据...');
      const data = await fetchRawData();
      return data;
    },
    timeout: 10000
  });

  // 2. 数据清洗（依赖采集任务）
  const cleanTaskId = await scheduler.schedule({
    name: '数据清洗',
    priority: 4,
    dependencies: [collectTaskId],
    execute: async () => {
      console.log('清洗数据...');
      const rawData = await scheduler.getTaskResult(collectTaskId);
      return cleanData(rawData);
    }
  });

  // 3. 数据分析（依赖清洗任务）
  const analyzeTaskId = await scheduler.schedule({
    name: '数据分析',
    priority: 4,
    dependencies: [cleanTaskId],
    execute: async () => {
      console.log('分析数据...');
      const cleanedData = await scheduler.getTaskResult(cleanTaskId);
      return analyzeData(cleanedData);
    }
  });

  // 4. 生成报告（依赖分析任务，低优先级）
  const reportTaskId = await scheduler.schedule({
    name: '生成报告',
    priority: 2,
    dependencies: [analyzeTaskId],
    execute: async () => {
      console.log('生成报告...');
      const analysis = await scheduler.getTaskResult(analyzeTaskId);
      return generateReport(analysis);
    }
  });

  // 5. 发送通知（并行任务，不依赖报告）
  const notifyTaskId = await scheduler.schedule({
    name: '发送通知',
    priority: 3,
    dependencies: [analyzeTaskId],
    execute: async () => {
      console.log('发送通知...');
      await sendNotification('数据分析完成');
    }
  });

  // 等待所有任务完成
  await scheduler.waitAll([reportTaskId, notifyTaskId]);
  console.log('所有任务完成！');
}
```

---

## 场景二：多工具协同

使用ToolOrchestrator编排多个工具协同工作：

```typescript
import { ToolOrchestrator } from '@/lib/tool-orchestrator';

async function multiToolOrchestration() {
  const orchestrator = new ToolOrchestrator();

  // 场景：智能天气播报系统
  // 1. 查询天气
  // 2. 翻译成英文
  // 3. 生成语音
  // 4. 发送邮件

  const result = await orchestrator.orchestrate([
    {
      toolName: 'weather',
      params: { city: '北京' }
    },
    {
      toolName: 'translate',
      params: {
        text: '${weather.condition}', // 引用上一步结果
        targetLang: 'en'
      },
      dependencies: ['weather']
    },
    {
      toolName: 'textToSpeech',
      params: {
        text: '今天${weather.city}的天气是${translate.translated}，温度${weather.temperature}度'
      },
      dependencies: ['weather', 'translate']
    },
    {
      toolName: 'sendEmail',
      params: {
        to: 'user@example.com',
        subject: '天气播报',
        body: '${textToSpeech.audioUrl}'
      },
      dependencies: ['textToSpeech']
    }
  ]);

  console.log('工具编排结果:', result);
  
  // 查看工具执行统计
  const weatherStats = orchestrator.getToolStats('weather');
  console.log(`天气工具调用${weatherStats.executionCount}次，平均耗时${weatherStats.averageExecutionTime}ms`);
}
```

---

## 场景三：成本优化的模型选择

使用ModelRouter根据需求自动选择最优模型：

```typescript
import { ModelRouter } from '@/lib/model-adapter';
import { ZhipuAdapter } from '@/lib/model-adapter/ZhipuAdapter';

async function costOptimizedModelSelection() {
  const router = new ModelRouter({
    weights: {
      performance: 0.2,  // 降低性能权重
      cost: 0.4,         // 提高成本权重（成本敏感）
      quality: 0.2,
      latency: 0.15,
      availability: 0.05
    }
  });

  // 注册多个模型
  router.registerAdapter(new ZhipuAdapter({
    apiKey: process.env.ZHIPU_API_KEY!,
    model: 'glm-4-flash',
    cost: 0.001 // 每1k tokens成本
  }));

  router.registerAdapter(new ZhipuAdapter({
    apiKey: process.env.ZHIPU_API_KEY!,
    model: 'glm-4',
    cost: 0.01
  }));

  // 场景1：简单问答（选择便宜模型）
  const simpleResult = await router.route({
    prompt: '今天星期几？',
    requirements: {
      minQuality: 0.6,   // 质量要求不高
      maxCost: 0.005,    // 成本限制严格
      maxLatency: 3000
    }
  });
  console.log(`简单问答使用模型: ${simpleResult.modelUsed}, 成本: $${simpleResult.cost}`);

  // 场景2：复杂分析（选择高质量模型）
  const complexResult = await router.route({
    prompt: '分析这份财务报表的异常点...',
    requirements: {
      minQuality: 0.9,   // 高质量要求
      maxCost: 0.1,      // 成本限制宽松
      maxLatency: 10000,
      preferredModels: ['glm-4'] // 优先使用高级模型
    }
  });
  console.log(`复杂分析使用模型: ${complexResult.modelUsed}, 成本: $${complexResult.cost}`);

  // 查看总体成本
  const metrics = router.getMetrics();
  console.log(`总请求: ${metrics.totalRequests}, 总成本: $${metrics.totalCost.toFixed(4)}`);
  console.log(`平均成本: $${(metrics.totalCost / metrics.totalRequests).toFixed(6)}`);
}
```

---

## 场景四：状态持久化与恢复

使用StateManager实现应用状态的持久化和历史回溯：

```typescript
import { AgenticCore } from '@/lib/agentic-core';

async function statePersistenceAndRecovery() {
  const core = new AgenticCore(config);
  const stateManager = core.getStateManager();

  // 场景：用户编辑文档，支持撤销/重做

  // 1. 初始状态
  await stateManager.setState('document', {
    title: '未命名文档',
    content: '',
    author: '用户A'
  });

  // 2. 用户编辑（自动创建快照）
  await stateManager.setState('document.title', '项目计划书');
  await stateManager.createSnapshot('修改标题');

  await stateManager.setState('document.content', '第一段内容...');
  await stateManager.createSnapshot('添加内容');

  await stateManager.setState('document.content', '第一段内容...\n第二段内容...');
  await stateManager.createSnapshot('继续编辑');

  // 3. 用户误删除，撤销操作
  await stateManager.setState('document.content', '');
  await stateManager.createSnapshot('清空内容');

  console.log('当前文档:', stateManager.getState('document'));
  // 输出: { title: '项目计划书', content: '', author: '用户A' }

  // 撤销删除
  await stateManager.undo();
  console.log('撤销后:', stateManager.getState('document.content'));
  // 输出: '第一段内容...\n第二段内容...'

  // 4. 查看历史快照
  const snapshots = stateManager.getSnapshots();
  console.log('历史快照:', snapshots.map(s => s.description));
  // 输出: ['修改标题', '添加内容', '继续编辑', '清空内容']

  // 5. 恢复到特定版本
  const targetSnapshot = snapshots.find(s => s.description === '添加内容');
  if (targetSnapshot) {
    await stateManager.restoreSnapshot(targetSnapshot.id);
    console.log('恢复到"添加内容"版本:', stateManager.getState('document'));
  }

  // 6. 统计编辑次数
  await stateManager.incrementCounter('document.editCount', 1);
  const editCount = stateManager.getCounter('document.editCount');
  console.log(`文档已编辑${editCount}次`);
}
```

---

## 场景五：高级拖拽体验

使用AdvancedDragSystem实现物理模拟的拖拽交互：

```tsx
import { useEffect, useRef } from 'react';
import { AdvancedDragSystem } from '@/lib/advanced-drag';

export function DraggableWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragSystemRef = useRef<AdvancedDragSystem | null>(null);

  useEffect(() => {
    if (!widgetRef.current) return;

    // 初始化拖拽系统
    const dragSystem = new AdvancedDragSystem({
      // 物理模拟
      friction: 0.95,          // 摩擦系数（越小减速越快）
      enableInertia: true,     // 启用惯性滚动

      // 磁性吸附
      enableSnap: true,
      snapThreshold: 20,       // 20像素内吸附
      snapPoints: [
        { x: window.innerWidth / 2, y: 50 },          // 顶部中心
        { x: 50, y: window.innerHeight / 2 },         // 左侧中心
        { x: window.innerWidth - 50, y: window.innerHeight / 2 }  // 右侧中心
      ],

      // 边界约束
      bounds: {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight
      },

      // 网格对齐
      gridSize: 10,            // 10像素网格

      // 碰撞检测
      enableCollision: true,
      collisionElements: [
        document.querySelector('.sidebar'),
        document.querySelector('.header')
      ].filter(Boolean) as HTMLElement[]
    });

    dragSystem.init(widgetRef.current);
    dragSystemRef.current = dragSystem;

    // 监听拖拽事件
    dragSystem.on('dragStart', (state) => {
      console.log('开始拖拽', state.position);
      widgetRef.current?.classList.add('dragging');
    });

    dragSystem.on('dragMove', (state) => {
      console.log('拖拽速度', state.velocity);
    });

    dragSystem.on('dragEnd', (state) => {
      console.log('结束拖拽', state.position);
      widgetRef.current?.classList.remove('dragging');
      
      // 保存位置
      localStorage.setItem('widget-position', JSON.stringify(state.position));
    });

    dragSystem.on('snap', (point) => {
      console.log('吸附到点', point);
      // 触觉反馈（如果支持）
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    });

    dragSystem.on('collision', (element) => {
      console.log('碰撞检测', element);
      widgetRef.current?.classList.add('collision-warning');
      setTimeout(() => {
        widgetRef.current?.classList.remove('collision-warning');
      }, 200);
    });

    // 恢复上次位置
    const savedPosition = localStorage.getItem('widget-position');
    if (savedPosition) {
      const position = JSON.parse(savedPosition);
      dragSystem.setPosition(position.x, position.y);
    }

    return () => {
      dragSystem.destroy();
    };
  }, []);

  return (
    <div
      ref={widgetRef}
      className="fixed w-80 h-96 bg-white rounded-lg shadow-2xl transition-shadow duration-200 cursor-move"
      style={{
        touchAction: 'none' // 禁用默认触摸行为
      }}
    >
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">可拖拽窗口</h3>
        <p className="text-sm text-gray-600">
          尝试拖拽此窗口，体验：
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside mt-2">
          <li>惯性滚动效果</li>
          <li>磁性吸附（靠近边缘）</li>
          <li>边界约束</li>
          <li>网格对齐（10px）</li>
          <li>碰撞检测</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 🎯 最佳实践

### 1. 性能优化

```typescript
// 使用事件委托减少监听器数量
messageBus.subscribe('goal:*', handler); // 匹配所有goal事件

// 批量操作减少状态更新
await stateManager.setState({
  'user.name': 'Alice',
  'user.age': 30,
  'user.role': 'admin'
});

// 并行执行独立任务
await scheduler.scheduleAll([
  { name: 'task1', execute: task1Fn },
  { name: 'task2', execute: task2Fn }
]);
```

### 2. 错误处理

```typescript
// 消息总线自动重试
messageBus.publish({
  type: 'critical:operation',
  payload: data,
  retryable: true,
  maxRetries: 5
});

// 任务超时保护
await scheduler.schedule({
  name: 'long-task',
  execute: longRunningFn,
  timeout: 30000 // 30秒超时
});

// 模型路由故障转移
await router.route({
  prompt: '...',
  requirements: {
    fallbackModels: ['glm-4-flash', 'glm-3-turbo'] // 备选模型
  }
});
```

### 3. 资源管理

```typescript
// 清理未使用的快照
const oldSnapshots = stateManager.getSnapshots()
  .filter(s => Date.now() - s.timestamp > 7 * 24 * 60 * 60 * 1000);
oldSnapshots.forEach(s => stateManager.removeSnapshot(s.id));

// 取消不需要的任务
await scheduler.cancelTask(taskId);

// 销毁不使用的组件
useEffect(() => {
  return () => {
    dragSystem.destroy();
    orchestrator.clear();
  };
}, []);
```

---

## 📖 更多资源

- [API完整文档](./README.md#高级功能-api-文档)
- [设计文档](./01-可插拔式拖拽移动AI系统.md)
- [故障排查指南](./troubleshooting.md)

---

**© 2025 YYC³ - 企业级智能AI解决方案**
