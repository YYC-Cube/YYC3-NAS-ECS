/**
 * @file OpenAI模型适配器实现
 * @description 实现OpenAI API的模型适配器
 * @module adapters/OpenAIModelAdapter
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { ModelAdapter, ModelGenerationRequest, ModelGenerationResponse } from './ModelAdapter';
import { AutonomousAIConfig } from '../autonomous-ai-widget/types';
import { AITool } from '../tools/types';
import { 
  ValidationError, 
  NetworkError, 
  TimeoutError,
  AuthenticationError,
  isRetryable
} from '../error-handler/ErrorTypes';
import { ErrorHandler } from '../error-handler/ErrorHandler';

/**
 * OpenAI模型适配器实现
 * 封装了OpenAI API的调用逻辑，实现了ModelAdapter接口
 */
export class OpenAIModelAdapter implements ModelAdapter {
  private config: AutonomousAIConfig;
  private status: 'idle' | 'initializing' | 'generating' | 'error' = 'idle';
  private abortController: AbortController | null = null;
  private supportedTools: string[] = ['search', 'calculator', 'code_interpreter', 'retrieval'];
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private responseTimes: number[] = [];
  private errorHandler: ErrorHandler;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(config: AutonomousAIConfig, errorHandler?: ErrorHandler) {
    this.config = config;
    this.errorHandler = errorHandler || new ErrorHandler({ enableAutoRecovery: true });
  }

  /**
   * 初始化适配器
   * @param config 配置信息
   */
  async initialize(config: AutonomousAIConfig): Promise<void> {
    this.status = 'initializing';
    this.config = config;

    if (!this.config.apiType) {
      throw new ValidationError('apiType is required', 'apiType', {
        additionalData: { config: this.config }
      });
    }

    if (!this.config.modelName) {
      throw new ValidationError('modelName is required', 'modelName', {
        additionalData: { config: this.config }
      });
    }

    if (this.config.apiType === 'openai' && !this.config.apiKey) {
      throw new ValidationError('apiKey is required for OpenAI API', 'apiKey', {
        additionalData: { apiType: this.config.apiType }
      });
    }

    this.status = 'idle';
  }

  /**
   * 生成AI响应
   * @param request 生成请求参数
   * @returns 生成响应
   */
  async generate(request: ModelGenerationRequest): Promise<ModelGenerationResponse> {
    this.status = 'generating';
    this.abortController = new AbortController();
    const startTime = Date.now();
    this.totalRequests++;

    try {
      const result = await this.generateWithRetry(request);
      
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      this.successfulRequests++;
      
      return result;
    } catch (error) {
      this.failedRequests++;
      this.status = 'error';
      await this.errorHandler.handleError(error as Error, {
        operation: 'generate',
        adapter: 'OpenAIModelAdapter',
        request
      });
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  private async generateWithRetry(request: ModelGenerationRequest): Promise<ModelGenerationResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const openaiRequest = this.buildOpenAIRequest(request);
        const response = await this.callOpenAIAPI(openaiRequest);
        return this.convertOpenAIResponse(response);
      } catch (error) {
        lastError = error as Error;
        
        if (!isRetryable(error as Error) || attempt >= this.maxRetries) {
          break;
        }

        const delay = this.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * 取消当前生成任务
   */
  async cancel(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.status = 'idle';
  }

  /**
   * 获取模型支持的工具类型
   */
  getSupportedTools(): string[] {
    return [...this.supportedTools];
  }

  /**
   * 检查模型是否支持指定工具
   * @param toolName 工具名称
   */
  supportsTool(toolName: string): boolean {
    return this.supportedTools.includes(toolName);
  }

  /**
   * 获取适配器状态
   */
  getStatus(): 'idle' | 'initializing' | 'generating' | 'error' {
    return this.status;
  }

  /**
   * 获取适配器配置
   */
  getConfig(): AutonomousAIConfig {
    return { ...this.config };
  }

  /**
   * 获取适配器指标
   */
  getMetrics(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  } {
    const averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      averageResponseTime,
    };
  }

  /**
   * 构建OpenAI API请求
   * @param request 生成请求参数
   */
  private buildOpenAIRequest(request: ModelGenerationRequest): any {
    const openaiMessages: Array<{ role: string; content: string; tool_calls?: any[] }> = [];

    // 添加系统提示
    if (request.messages?.find(m => m.role === 'system')) {
      openaiMessages.push(...request.messages);
    } else {
      openaiMessages.push({ role: 'system', content: 'You are a helpful AI assistant.' });
      if (request.messages) {
        openaiMessages.push(...request.messages);
      }
    }

    // 添加用户提示
    openaiMessages.push({ role: 'user', content: request.prompt });

    // 构建工具配置
    const tools = request.tools?.map(tool => this.convertToOpenAITool(tool));

    return {
      model: this.config.modelName,
      messages: openaiMessages,
      max_tokens: request.modelConfig?.maxTokens || this.config.maxTokens || 4096,
      temperature: request.modelConfig?.temperature || this.config.temperature || 0.7,
      tools: tools || [],
      tool_choice: request.forceToolUse ? 'auto' : 'none',
    };
  }

  /**
   * 调用OpenAI API
   * @param request OpenAI请求参数
   */
  private async callOpenAIAPI(request: any): Promise<any> {
    const apiKey = this.config.apiKey;
    const baseURL = this.config.baseURL || 'https://api.openai.com/v1/chat/completions';

    try {
      const response = await fetch(baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError(
            `OpenAI authentication failed: ${response.status} ${response.statusText} ${errorData.error?.message}`,
            {
              path: baseURL,
              additionalData: { 
                status: response.status, 
                statusText: response.statusText,
                errorData
              }
            }
          );
        }

        if (response.status === 408 || response.status === 504) {
          throw new TimeoutError(
            `OpenAI request timeout: ${response.status} ${response.statusText}`,
            this.config.timeout || 30000,
            {
              path: baseURL,
              additionalData: { 
                status: response.status, 
                statusText: response.statusText,
                errorData
              }
            }
          );
        }

        if (response.status === 429) {
          throw new NetworkError(
            `OpenAI rate limit exceeded: ${response.statusText}`,
            {
              path: baseURL,
              additionalData: { 
                status: response.status, 
                statusText: response.statusText,
                errorData
              }
            }
          );
        }

        if (response.status >= 500) {
          throw new NetworkError(
            `OpenAI server error: ${response.status} ${response.statusText}`,
            {
              path: baseURL,
              additionalData: { 
                status: response.status, 
                statusText: response.statusText,
                errorData
              }
            }
          );
        }

        throw new NetworkError(
          `OpenAI API error: ${response.status} ${response.statusText} ${errorData.error?.message}`,
          {
            path: baseURL,
            additionalData: { 
              status: response.status, 
              statusText: response.statusText,
              errorData
            }
          }
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError(
          `Network error connecting to OpenAI: ${error.message}`,
          {
            path: baseURL,
            additionalData: { originalError: error.message }
          }
        );
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(
          `OpenAI request was cancelled`,
          this.config.timeout || 30000,
          {
            path: baseURL,
            additionalData: { reason: 'aborted' }
          }
        );
      }

      throw error;
    }
  }

  /**
   * 转换OpenAI响应为统一格式
   * @param openaiResponse OpenAI API响应
   * @param request 原始请求
   */
  private convertOpenAIResponse(openaiResponse: any): ModelGenerationResponse {
    const message = openaiResponse.choices[0].message;
    const toolCall = message.tool_calls?.[0];

    this.status = 'idle';

    return {
      content: message.content || '',
      toolUsed: !!toolCall,
      toolCall: toolCall
        ? {
            name: toolCall.function.name,
            params: JSON.parse(toolCall.function.arguments),
          }
        : undefined,
      usage: openaiResponse.usage
        ? {
            promptTokens: openaiResponse.usage.prompt_tokens,
            completionTokens: openaiResponse.usage.completion_tokens,
            totalTokens: openaiResponse.usage.total_tokens,
          }
        : undefined,
      timestamp: Date.now(),
      modelId: openaiResponse.model,
    };
  }

  /**
   * 转换工具定义为OpenAI格式
   * @param tool 工具定义
   */
  private convertToOpenAITool(tool: AITool): any {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    };
  }
}
