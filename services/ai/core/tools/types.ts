/**
 * @file 工具系统类型定义
 * @description 定义工具系统的核心类型和接口
 * @module tools/types
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

/**
 * 工具执行上下文
 */
export interface ToolExecutionContext {
  /** 当前用户ID */
  userId?: string;
  /** 当前会话ID */
  sessionId?: string;
  /** 当前上下文消息 */
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  /** 业务上下文 */
  businessContext?: Record<string, any>;
  /** 工具执行时间限制（毫秒） */
  timeout?: number;
  /** 临时存储 */
  tempStorage?: Record<string, any>;
}

/**
 * 工具执行结果
 */
export interface ToolExecutionResult {
  /** 执行成功标志 */
  success: boolean;
  /** 执行结果内容 */
  content: string;
  /** 结构化结果数据（如果有） */
  data?: any;
  /** 错误信息（如果执行失败） */
  error?: string;
  /** 执行时间（毫秒） */
  executionTime: number;
  /** 工具名称 */
  toolName: string;
  /** 执行时间戳 */
  timestamp: number;
}

/**
 * 工具参数定义
 */
export interface ToolParameter {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** 参数描述 */
  description: string;
  /** 是否必填 */
  required: boolean;
  /** 默认值 */
  default?: any;
  /** 参数验证规则 */
  validation?: {
    /** 最小值（适用于数字类型） */
    min?: number;
    /** 最大值（适用于数字类型） */
    max?: number;
    /** 最小长度（适用于字符串类型） */
    minLength?: number;
    /** 最大长度（适用于字符串类型） */
    maxLength?: number;
    /** 正则表达式验证（适用于字符串类型） */
    pattern?: string;
    /** 枚举值（适用于所有类型） */
    enum?: any[];
  };
}

/**
 * 工具定义
 */
export interface AITool {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 工具版本 */
  version: string;
  /** 工具分组 */
  group: string;
  /** 工具作者 */
  author: string;
  /** 工具参数定义 */
  parameters: ToolParameter[];
  /** 工具执行函数 */
  execute: (
    params: Record<string, any>,
    context: ToolExecutionContext
  ) => Promise<ToolExecutionResult>;
  /** 工具示例 */
  examples?: Array<{
    /** 示例名称 */
    name: string;
    /** 示例描述 */
    description: string;
    /** 示例参数 */
    params: Record<string, any>;
    /** 示例结果 */
    result: ToolExecutionResult;
  }>;
  /** 工具元数据 */
  metadata?: {
    /** 工具标签 */
    tags: string[];
    /** 工具图标 */
    icon?: string;
    /** 工具文档URL */
    documentationUrl?: string;
    /** 工具依赖 */
    dependencies?: string[];
    /** 工具执行权限 */
    permissions?: string[];
  };
}

/**
 * 工具组定义
 */
export interface ToolGroup {
  /** 工具组名称 */
  name: string;
  /** 工具组描述 */
  description: string;
  /** 工具组图标 */
  icon?: string;
  /** 工具组内的工具列表 */
  tools: string[];
}

/**
 * 工具使用统计
 */
export interface ToolUsageStats {
  /** 工具名称 */
  toolName: string;
  /** 总调用次数 */
  totalCalls: number;
  /** 成功调用次数 */
  successfulCalls: number;
  /** 失败调用次数 */
  failedCalls: number;
  /** 平均执行时间（毫秒） */
  averageExecutionTime: number;
  /** 最近调用时间 */
  lastCalled: number;
  /** 用户调用统计 */
  userStats?: Record<string, {
    calls: number;
    successful: number;
  }>;
}

/**
 * 工具推荐结果
 */
export interface ToolRecommendation {
  /** 推荐的工具列表 */
  tools: Array<{
    /** 工具名称 */
    name: string;
    /** 推荐分数（0-100） */
    score: number;
    /** 推荐理由 */
    reason: string;
  }>;
  /** 推荐依据 */
  context: {
    /** 输入关键词 */
    keywords: string[];
    /** 上下文分析 */
    analysis: string;
  };
}
