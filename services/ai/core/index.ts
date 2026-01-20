/**
 * @file YYC³ 自治AI浮窗系统主入口
 * @description 导出所有核心功能和组件
 * @module index
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 * @updated 2025-12-30
 * @copyright Copyright (c) 2025 YYC³
 * @license MIT
 */

import type { AutonomousAIConfig, AIWidgetInstance } from './autonomous-ai-widget/types';
import { ClosedLoopSystem } from './closed-loop/ClosedLoopSystem';
import { AutonomousAIEngine as PluggableAIEngine } from './pluggable/AutonomousAIEngine';

// 核心配置和实例接口
export type { AutonomousAIConfig, AIWidgetInstance } from './autonomous-ai-widget/types';

export { AutonomousAIEngine } from './autonomous-ai-widget/AutonomousAIEngine';
export { AutonomousAIEngine as PluggableAIEngineExport } from './pluggable/AutonomousAIEngine';

// AI模型适配器
export * from './adapters/ModelAdapter';
export { OpenAIModelAdapter } from './adapters/OpenAIModelAdapter';
export { InternalModelAdapter } from './adapters/InternalModelAdapter';

// AI服务
export * from './services/AIChatService';
export * from './services/ModelManagementService';
export * from './services/PromptTemplateService';
export * from './services/APIKeyManagementService';
export * from './services/AIServiceManager';
export { AIChatService } from './services/AIChatService';
export { ModelManagementService } from './services/ModelManagementService';
export { PromptTemplateService } from './services/PromptTemplateService';
export { APIKeyManagementService } from './services/APIKeyManagementService';
export { AIServiceManager } from './services/AIServiceManager';

// 学习系统
export * from './learning/types';
export { LearningSystem } from './learning/LearningSystem';

// 记忆系统
export { MemorySystem } from './memory/MemorySystem';

// 工具系统
export * from './tools/types';
export { ToolRegistry } from './tools/ToolRegistry';
export * from './tools/core-tools';

// 上下文管理器
export { ContextManager } from './context-manager/ContextManager';

// 消息总线系统
export * from './message-bus/MessageBus';
export { MessageBus } from './message-bus/MessageBus';

// 任务调度器
export * from './task-scheduler/TaskScheduler';
export { TaskScheduler } from './task-scheduler/TaskScheduler';

// 状态管理器
export * from './state-manager/StateManager';
export { StateManager } from './state-manager/StateManager';

// 事件分发器
export * from './event-dispatcher/EventDispatcher';
export { EventDispatcher } from './event-dispatcher/EventDispatcher';

// 知识库系统
export * from './knowledge-base/KnowledgeBase';
export { KnowledgeBase } from './knowledge-base/KnowledgeBase';

// 智能缓存层
export * from './cache/CacheLayer';
export { IntelligentCacheLayer } from './cache/CacheLayer';

// 性能优化引擎
export * from './performance/OptimizationEngine';
export { PerformanceOptimizer } from './performance/OptimizationEngine';

// 统一错误处理系统
export * from './error-handler';
export { ErrorHandler, ErrorBoundary } from './error-handler';

// 可插拔式拖拽移动AI系统
export * from './pluggable/types';
export * from './pluggable/AutonomousAIEngine';
export * from './pluggable/ModelAdapter';
export { ModelAdapter, OpenAIAdapter, AnthropicAdapter, LocalModelAdapter } from './pluggable/ModelAdapter';
export { createEngine, createModelAdapter } from './pluggable';

// 闭环系统
export { ClosedLoopSystem } from './closed-loop/ClosedLoopSystem';

// 价值创建维度
export { GoalManagementSystem } from './closed-loop/value-creation/GoalManagementSystem';

// 技术演进维度
export { TechnicalMaturityModel } from './closed-loop/technical-evolution/TechnicalMaturityModel';
export { TechnologyRoadmap } from './closed-loop/technical-evolution/TechnologyRoadmap';

// UI全局页面系统
export * from './ui/types';
export * from './ui/ChatInterface';
export * from './ui/ToolboxPanel';
export * from './ui/InsightsDashboard';
export * from './ui/WorkflowDesigner';
export * from './ui/UIManager';
export * from './ui/UISystem';
export { ChatInterface } from './ui/ChatInterface';
export { ToolboxPanel } from './ui/ToolboxPanel';
export { InsightsDashboard } from './ui/InsightsDashboard';
export { WorkflowDesigner } from './ui/WorkflowDesigner';
export { UIManager } from './ui/UIManager';
export { UISystem } from './ui/UISystem';
export type { UISystemConfig } from './ui/UISystem';

// 智能体系统
export * from './ai/AgentProtocol';
export * from './ai/BaseAgent';
export * from './ai/AgentManager';
export * from './ai/agents/LayoutAgent';
export * from './ai/agents/BehaviorAgent';
export * from './ai/agents/ContentAgent';
export * from './ai/agents/AssistantAgent';
export * from './ai/agents/MonitoringAgent';
export * from './ai/index';
export { BaseAgent } from './ai/BaseAgent';
export { AgentManager } from './ai/AgentManager';
export type { AgentManagerConfig } from './ai/AgentManager';
export { LayoutAgent } from './ai/agents/LayoutAgent';
export { BehaviorAgent } from './ai/agents/BehaviorAgent';
export { ContentAgent } from './ai/agents/ContentAgent';
export { AssistantAgent } from './ai/agents/AssistantAgent';
export { MonitoringAgent } from './ai/agents/MonitoringAgent';
export { AgentSystem } from './ai/index';

// 智能体系统集成
export * from './integration/AgentSystemIntegration';
export { AgentSystemIntegration } from './integration/AgentSystemIntegration';

// 版本信息
export const VERSION = '1.0.0';

// 系统信息
export const SYSTEM_INFO = {
  name: 'YYC³ 自治AI浮窗系统',
  description: '完全自治的智能AI浮窗系统，具备独立运行、模块复用、自主学习等高级能力',
  version: VERSION,
  author: 'YYC³ Team',
  license: 'MIT',
  created: '2025-12-30'
};

/**
 * 创建新的AI浮窗实例
 * @param config AI浮窗配置
 * @returns AI浮窗实例
 */
export const createAIWidget = (config: AutonomousAIConfig): AIWidgetInstance => {
  const id = `ai-widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    config,
    state: {
      isInitialized: true,
      isRunning: true,
      currentStep: 'idle',
      metrics: {
        usageCount: 0,
        learningProgress: 0,
        systemHealth: 'healthy'
      }
    },
    capabilities: {
      autonomousLearning: config.enableLearning,
      memoryStorage: config.enableMemory,
      toolUsage: config.enableToolUse,
      contextAwareness: config.enableContextAwareness,
      multiModelSupport: true,
      realTimeProcessing: true
    },
    destroy: () => {
      console.log(`Destroying AI widget instance: ${id}`);
    },
    updateConfig: (newConfig: Partial<AutonomousAIConfig>) => {
      console.log(`Updated config for AI widget instance: ${id}`, newConfig);
    }
  };
};

/**
 * 初始化整个YYC³ AI系统
 * @param config 系统配置
 * @returns 初始化结果
 */
export const initializeYYC3AI = async (config: AutonomousAIConfig) => {
  try {
    console.log('Initializing YYC³ AI System...');
    
    const engineConfig = {
      maxConcurrentTasks: 10,
      taskTimeout: 300000,
      enablePersistence: false,
      enableMetrics: true,
      debugMode: false,
      logLevel: 'info' as const,
      modelAdapter: config.apiType || 'internal',
      subsystems: ['learning', 'memory', 'tools', 'context']
    };
    
    const engine = new PluggableAIEngine(engineConfig);
    await engine.initialize(engineConfig);
    await engine.start();
    
    const closedLoopSystem = new ClosedLoopSystem(config);
    
    // 初始化智能体系统集成
    const { AgentSystemIntegration } = await import('./integration/AgentSystemIntegration');
    const agentSystemIntegration = new AgentSystemIntegration({
      enableAutoAgents: true,
      enableLayoutAgent: true,
      enableBehaviorAgent: true,
      enableContentAgent: true,
      enableAssistantAgent: true,
      enableMonitoringAgent: true
    });
    
    await agentSystemIntegration.initialize();
    await agentSystemIntegration.integrateWithEngine(engine);
    
    // 启动学习系统
    if (config.enableLearning) {
      console.log('Starting learning system...');
    }
    
    console.log('YYC³ AI System initialized successfully!');
    
    return {
      engine,
      closedLoopSystem,
      agentSystemIntegration,
      widget: createAIWidget(config),
      systemInfo: SYSTEM_INFO
    };
  } catch (error) {
    console.error('Failed to initialize YYC³ AI System:', error);
    throw error;
  }
};