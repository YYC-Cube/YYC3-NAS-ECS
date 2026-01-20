/**
 * @file 内部模型适配器
 * @description 用于连接项目内部大模型服务的适配器实现
 * @module core/adapters/InternalModelAdapter
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-01-30
 */

import { ModelAdapter, ModelGenerationRequest, ModelGenerationResponse } from './ModelAdapter';
import { AutonomousAIConfig } from '../autonomous-ai-widget/types';
import {
  NetworkError,
  InternalError,
  TimeoutError,
  isRetryable
} from '../error-handler/ErrorTypes';
import { ErrorHandler } from '../error-handler/ErrorHandler';

export class InternalModelAdapter implements ModelAdapter {
  private config: AutonomousAIConfig;
  private status: 'idle' | 'initializing' | 'generating' | 'error' = 'idle';
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private responseTimes: number[] = [];
  private abortController: AbortController | null = null;
  private errorHandler: ErrorHandler;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(config: AutonomousAIConfig, errorHandler?: ErrorHandler) {
    this.config = config;
    this.errorHandler = errorHandler || new ErrorHandler({ enableAutoRecovery: true });
  }

  async initialize(config: AutonomousAIConfig): Promise<void> {
    this.status = 'initializing';
    this.config = config;
    this.status = 'idle';
  }

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
      this.status = 'idle';
      
      return result;
    } catch (error) {
      this.failedRequests++;
      this.status = 'error';
      await this.errorHandler.handleError(error as Error, {
        operation: 'generate',
        adapter: 'InternalModelAdapter',
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
        const baseURL = this.config.baseURL || 'http://localhost:3200';
        const response = await fetch(`${baseURL}/api/internal-ai/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: request.prompt,
            messages: request.messages,
            tools: request.tools,
            config: {
              model: this.config.modelName,
              max_tokens: this.config.maxTokens,
              temperature: this.config.temperature
            }
          }),
          signal: this.abortController?.signal
        });
        
        if (!response.ok) {
          if (response.status === 408 || response.status === 504) {
            throw new TimeoutError(
              `${baseURL}/api/internal-ai/generate`,
              30000
            );
          }

          const errorData = await response.json().catch(() => ({}));

          if (response.status >= 500) {
            if (errorData.critical) {
              throw new InternalError(
                `Internal AI service error: ${response.status}`
              );
            }
            throw new NetworkError(
              `Internal AI service error: ${response.status}`,
              {
                additionalData: { status: response.status }
              }
            );
          }

          throw new InternalError(
            `Internal AI service error: ${response.status}`,
            {
              additionalData: { status: response.status }
            }
          );
        }
        
        const result = await response.json();
        
        return {
          content: result.content || '',
          toolUsed: result.toolUsed || false,
          toolCall: result.toolCall,
          usage: result.usage,
          timestamp: Date.now(),
          modelId: this.config.modelName || 'internal'
        };
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

  async cancel(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.status = 'idle';
  }

  getSupportedTools(): string[] {
    return ['search', 'calculate', 'code'];
  }

  supportsTool(toolName: string): boolean {
    return this.getSupportedTools().includes(toolName);
  }

  getStatus(): 'idle' | 'initializing' | 'generating' | 'error' {
    return this.status;
  }

  getConfig(): AutonomousAIConfig {
    return this.config;
  }

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
}