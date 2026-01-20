/**
 * @file 服务模块索引文件
 * @description 导出所有AI服务模块
 * @module services/index
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-19
 */

export { AIChatService } from './AIChatService';
export type {
  AIProvider,
  AIModel,
  ChatMessage,
  ChatOptions,
  StreamChunk,
} from './AIChatService';

export { ModelManagementService } from './ModelManagementService';
export type {
  ModelCacheEntry,
  ModelFilterOptions,
} from './ModelManagementService';

export { PromptTemplateService } from './PromptTemplateService';
export type {
  PromptTemplate,
  PromptVariable,
  TemplateCategory,
  TemplateFilterOptions,
  CompiledTemplate,
} from './PromptTemplateService';

export { APIKeyManagementService } from './APIKeyManagementService';
export type {
  APIKey,
  APIKeyTestResult,
  APIKeyStatistics,
} from './APIKeyManagementService';

export { AIServiceManager } from './AIServiceManager';
