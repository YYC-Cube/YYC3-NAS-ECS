/**
 * @file 用户认证模块
 * @description 处理用户登录、注册、权限验证等核心功能
 * @module auth
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 * @copyright Copyright (c) 2025 YYC³
 * @license MIT
 */

import type { AITool as ToolAITool } from '../tools/types';

export interface AutonomousAIConfig {
  apiType: 'internal' | 'openai' | 'azure' | 'custom';
  modelName: string;
  maxTokens: number;
  temperature: number;
  timeout?: number;
  
  enableLearning: boolean;
  enableMemory: boolean;
  enableToolUse: boolean;
  enableContextAwareness: boolean;
  
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  language: string;
  
  businessContext?: BusinessContext;
  customTools?: ToolAITool[];
  dataSources?: DataSource[];
  
  apiKey?: string;
  baseURL?: string;
}

export interface AIWidgetInstance {
  id: string;
  config: AutonomousAIConfig;
  state: AIWidgetState;
  capabilities: AICapabilities;
  destroy: () => void;
  updateConfig: (config: Partial<AutonomousAIConfig>) => void;
}

// 辅助接口定义
export interface BusinessContext {
  industry?: string;
  userRole?: string;
  availableFeatures?: string[];
  domain?: string;
  tone?: string;
  responseStyle?: string;
}

export interface DataSource {
  name: string;
  type: string;
  url?: string;
  apiKey?: string;
  query?: string;
}

export interface AIWidgetState {
  isInitialized: boolean;
  isRunning: boolean;
  currentStep: string;
  metrics: {
    usageCount: number;
    learningProgress: number;
    systemHealth: string;
  };
}

export interface AICapabilities {
  autonomousLearning: boolean;
  memoryStorage: boolean;
  toolUsage: boolean;
  contextAwareness: boolean;
  multiModelSupport: boolean;
  realTimeProcessing: boolean;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface UserMessage {
  user: string;
  content: string;
  type?: string;
  tool?: string;
  parameters?: any;
}

export interface AIResponse {
  content: string;
  toolCalls?: any[];
  usage?: any;
  model?: string;
  responseTime?: number;
  data?: any;
}

export interface AIContext {
  timestamp: Date;
  user: string;
  conversationHistory: ConversationMessage[];
  userPreferences: any;
  businessContext?: BusinessContext;
  pageContext?: any;
  availableTools: ToolAITool[];
}

export interface LearningConfig {
  enableReinforcementLearning: boolean;
  enablePatternRecognition: boolean;
  feedbackMechanism: boolean;
}

export interface UserFeedback {
  rating: number;
  comment?: string;
  improvementSuggestions?: string[];
}

export interface LearningInsight {
  id: string;
  type: string;
  content: string;
  confidence: number;
  timestamp: Date;
}

export interface PerformanceMetric {
  responseTime: number;
  relevance: number;
  usefulness: number;
  userSatisfaction: number;
}