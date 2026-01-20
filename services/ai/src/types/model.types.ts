/**
 * @file model.types.ts - 模型适配器类型定义
 * @description YYC³ MovAISys 智能浮窗系统 - 类型定义层
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

/**
 * ================== 基础类型定义 ==================
 */

/**
 * 模型提供商枚举
 */
export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  AZURE = 'azure',
  LOCAL = 'local',
  CUSTOM = 'custom'
}

/**
 * 模型类型枚举
 */
export enum ModelType {
  // 大语言模型
  LLM = 'llm',
  CHAT_LLM = 'chat_llm',

  // 多模态模型
  MULTIMODAL = 'multimodal',
  VISION = 'vision',
  AUDIO = 'audio',

  // 专用模型
  EMBEDDING = 'embedding',
  CODE = 'code',
  TRANSLATION = 'translation',
  CLASSIFICATION = 'classification'
}

/**
 * 模型能力枚举
 */
export enum ModelCapability {
  TEXT_GENERATION = 'text_generation',
  TEXT_COMPLETION = 'text_completion',
  CHAT_COMPLETION = 'chat_completion',
  STREAMING = 'streaming',
  FUNCTION_CALLING = 'function_calling',
  IMAGE_GENERATION = 'image_generation',
  VISION_UNDERSTANDING = 'vision_understanding',
  AUDIO_TRANSCRIPTION = 'audio_transcription',
  EMBEDDING = 'embedding'
}

/**
 * ================== 请求类型定义 ==================
 */

/**
 * 基础请求接口
 */
export interface BaseRequest {
  provider: ModelProvider;
  model: string;
  timeout?: number;
  metadata?: Record<string, unknown>;
}

/**
 * 文本补全请求
 */
export interface CompletionRequest extends BaseRequest {
  type: ModelType.LLM;
  prompt: string;
  parameters?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    logitBias?: Record<number, number>;
  };
}

/**
 * 聊天补全请求
 */
export interface ChatRequest extends BaseRequest {
  type: ModelType.CHAT_LLM;
  messages: ChatMessage[];
  parameters?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    functionCall?: 'auto' | 'none' | { name: string };
    functions?: FunctionDefinition[];
  };
}

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | MultimodalContent[];
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

/**
 * 多模态内容
 */
export interface MultimodalContent {
  type: 'text' | 'image_url' | 'audio';
  text?: string;
  imageUrl?: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

/**
 * 函数定义接口
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * 向量嵌入请求
 */
export interface EmbeddingRequest extends BaseRequest {
  type: ModelType.EMBEDDING;
  input: string | string[];
  parameters?: {
    dimensions?: number;
    model?: string;
  };
}

/**
 * 流式请求
 */
export interface StreamRequest extends BaseRequest {
  stream: true;
  streamOptions?: {
    includeUsage?: boolean;
  };
}

/**
 * ================== 响应类型定义 ==================
 */

/**
 * 基础响应接口
 */
export interface BaseResponse {
  success: boolean;
  model: string;
  provider: ModelProvider;
  timestamp: Date;
  processingTime: number;
  traceId?: string;
  error?: ErrorResponse;
}

/**
 * 文本补全响应
 */
export interface CompletionResponse extends BaseResponse {
  type: ModelType.LLM;
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'unknown';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  alternatives?: string[];
}

/**
 * 聊天补全响应
 */
export interface ChatResponse extends BaseResponse {
  type: ModelType.CHAT_LLM;
  message: ChatMessage;
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter' | 'unknown';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  functionCall?: {
    name: string;
    arguments: string;
  };
}

/**
 * 向量嵌入响应
 */
export interface EmbeddingResponse extends BaseResponse {
  type: ModelType.EMBEDDING;
  embeddings: number[] | number[][];
  dimensions: number;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
  suggestedRetryAfter?: number; // 秒
}

/**
 * ================== 流式类型定义 ==================
 */

/**
 * 流式数据块
 */
export interface StreamChunk {
  delta: {
    content?: string;
    role?: string;
    functionCall?: {
      name?: string;
      arguments?: string;
    };
  };
  finishReason?: string;
  index: number;
  isComplete: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * ================== 模型信息类型 ==================
 */

/**
 * 模型信息接口
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  type: ModelType;
  capabilities: ModelCapability[];
  pricing?: {
    inputPrice: number;  // 每1K tokens价格
    outputPrice: number;  // 每1K tokens价格
    currency: string;
  };
  limits?: {
    maxInputTokens: number;
    maxOutputTokens: number;
    maxRequestsPerMinute: number;
    maxTokensPerMinute: number;
  };
  version?: string;
  status: 'available' | 'deprecated' | 'experimental';
}

/**
 * ================== 适配器配置类型 ==================
 */

/**
 * 模型适配器配置
 */
export interface ModelAdapterConfig {
  provider: ModelProvider;
  apiKey?: string;
  baseURL?: string;
  model: string;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffFactor: number;
    initialDelay: number;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  metrics?: {
    enabled: boolean;
  };
  logging?: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * ================== 路由相关类型 ==================
 */

/**
 * 路由请求
 */
export interface RoutingRequest {
  request: CompletionRequest | ChatRequest | EmbeddingRequest;
  constraints?: {
    maxLatency?: number;        // 最大延迟（毫秒）
    maxCost?: number;           // 最大成本
    minQuality?: number;        // 最小质量（0-1）
    capabilities?: ModelCapability[];  // 必需能力
  };
  preferences?: {
    provider?: ModelProvider;
    model?: string;
  };
}

/**
 * 路由决策
 */
export interface RoutingDecision {
  adapter: any; // IModelAdapter
  model: string;
  reason: string;
  score: number;
  estimatedLatency: number;
  estimatedCost: number;
}

/**
 * ================== 性能监控类型 ==================
 */

/**
 * 模型性能指标
 */
export interface ModelMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  totalTokens: number;
  totalCost: number;
  errorRate: number;
}

/**
 * ================== 工具函数 ==================
 */

/**
 * 生成追踪ID
 */
export function generateTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 计算成本
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  inputPrice: number,
  outputPrice: number
): number {
  return (inputTokens / 1000) * inputPrice + (outputTokens / 1000) * outputPrice;
}
