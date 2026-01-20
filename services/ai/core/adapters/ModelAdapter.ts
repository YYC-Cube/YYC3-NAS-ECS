/**
 * @file AI模型适配器接口定义
 * @description 定义AI模型适配器的核心接口和请求/响应类型
 * @module adapters/ModelAdapter
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { AITool } from '../tools/types';
import { AutonomousAIConfig } from '../autonomous-ai-widget/types';

/**
 * AI模型生成请求参数
 */
export interface ModelGenerationRequest {
  /** 提示词内容 */
  prompt: string;
  /** 可选的上下文消息 */
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  /** 可用的工具列表 */
  tools?: AITool[];
  /** 是否强制使用工具 */
  forceToolUse?: boolean;
  /** 模型配置覆盖 */
  modelConfig?: Partial<AutonomousAIConfig>;
}

/**
 * AI模型生成响应
 */
export interface ModelGenerationResponse {
  /** 生成的内容 */
  content: string;
  /** 是否使用了工具 */
  toolUsed: boolean;
  /** 使用的工具信息（如果有） */
  toolCall?: {
    name: string;
    params: Record<string, any>;
  };
  /** 模型使用的令牌统计 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** 生成时间戳 */
  timestamp: number;
  /** 模型ID */
  modelId: string;
}

/**
 * AI模型适配器接口
 * 定义了所有AI模型适配器必须实现的方法
 */
export interface ModelAdapter {
  /**
   * 初始化适配器
   * @param config 配置信息
   */
  initialize(config: AutonomousAIConfig): Promise<void>;

  /**
   * 生成AI响应
   * @param request 生成请求参数
   * @returns 生成响应
   */
  generate(request: ModelGenerationRequest): Promise<ModelGenerationResponse>;

  /**
   * 取消当前生成任务
   */
  cancel(): Promise<void>;

  /**
   * 获取模型支持的工具类型
   */
  getSupportedTools(): string[];

  /**
   * 检查模型是否支持指定工具
   * @param toolName 工具名称
   */
  supportsTool(toolName: string): boolean;

  /**
   * 获取适配器状态
   */
  getStatus(): 'idle' | 'initializing' | 'generating' | 'error';

  /**
   * 获取适配器配置
   */
  getConfig(): AutonomousAIConfig;

  /**
   * 获取适配器指标
   */
  getMetrics(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
}

/**
 * 模型适配器工厂函数类型
 */
export type ModelAdapterFactory = (config: AutonomousAIConfig) => ModelAdapter;

/**
 * 模型适配器注册信息
 */
export interface ModelAdapterRegistration {
  /** 适配器名称 */
  name: string;
  /** 适配器工厂函数 */
  factory: ModelAdapterFactory;
  /** 支持的API类型 */
  supportedApiTypes: Array<'internal' | 'openai' | 'azure' | 'custom'>;
  /** 描述信息 */
  description?: string;
}
