/**
 * @file 模型适配器实现
 * @description 实现可插拔式AI模型适配器，支持多种AI模型提供商
 * @module core/pluggable/ModelAdapter
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 */

import { EventEmitter } from 'events';
import {
  IModelAdapter,
  ModelConfig,
  ModelRequest,
  ModelResponse,
  ModelCapabilities
} from './types';
import {
  ValidationError,
  NetworkError,
  InternalError,
  TimeoutError,
  AuthenticationError,
  isRetryable
} from '../error-handler/ErrorTypes';
import { ErrorHandler } from '../error-handler/ErrorHandler';

export class ModelAdapter extends EventEmitter implements IModelAdapter {
  name: string;
  version: string;
  private config: ModelConfig;
  private isInitialized: boolean = false;
  private requestQueue: Map<string, Promise<ModelResponse>> = new Map();
  private capabilities: ModelCapabilities;
  private errorHandler: ErrorHandler;
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(name: string, version: string = '1.0.0', errorHandler?: ErrorHandler) {
    super();
    this.name = name;
    this.version = version;
    this.errorHandler = errorHandler || new ErrorHandler({ enableAutoRecovery: true });
    this.capabilities = {
      supportsStreaming: false,
      supportsFunctionCalling: false,
      supportsVision: false,
      supportsAudio: false,
      maxContextLength: 4096,
      supportedLanguages: ['zh', 'en']
    };
  }

  async initialize(config: ModelConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new ValidationError('Invalid model configuration', 'config', {
        additionalData: { 
          providedConfig: config,
          requiredFields: ['name', 'version', 'provider']
        }
      });
    }

    this.config = {
      name: config.name,
      version: config.version,
      provider: config.provider,
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      maxTokens: config.maxTokens ?? 2048,
      temperature: config.temperature ?? 0.7,
      topP: config.topP ?? 1.0,
      frequencyPenalty: config.frequencyPenalty ?? 0,
      presencePenalty: config.presencePenalty ?? 0,
      timeout: config.timeout ?? 30000
    };

    this.isInitialized = true;
    this.emit('initialized', this.config);
  }

  async generateResponse(request: ModelRequest): Promise<ModelResponse> {
    if (!this.isInitialized) {
      const error = new InternalError('Model adapter not initialized', { adapterName: this.name });
      await this.errorHandler.handleError(error, { operation: 'generateResponse', adapter: this.name });
      throw error;
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      const response = await this.executeWithRetry(request, requestId);
      
      const result: ModelResponse = {
        content: response.content,
        tokensUsed: response.tokensUsed,
        model: this.config.name,
        finishReason: response.finishReason,
        metadata: {
          ...response.metadata,
          requestId,
          duration: Date.now() - startTime,
          timestamp: new Date()
        }
      };

      this.emit('responseGenerated', result);
      this.retryAttempts.delete(requestId);
      return result;
    } catch (error) {
      this.emit('error', error);
      await this.errorHandler.handleError(error as Error, { 
        operation: 'generateResponse', 
        adapter: this.name,
        requestId,
        request 
      });
      throw error;
    }
  }

  private async executeWithRetry(request: ModelRequest, requestId: string): Promise<any> {
    let lastError: Error | null = null;
    const currentAttempts = this.retryAttempts.get(requestId) || 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeRequest(request);
      } catch (error) {
        lastError = error as Error;
        
        if (!isRetryable(error as Error) || attempt >= this.maxRetries) {
          break;
        }

        this.retryAttempts.set(requestId, attempt + 1);
        this.emit('retry', { requestId, attempt: attempt + 1, error });
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt)));
      }
    }

    throw lastError;
  }

  async *generateStreamingResponse(request: ModelRequest): AsyncGenerator<string> {
    if (!this.isInitialized) {
      throw new InternalError('Model adapter not initialized', {
        additionalData: { 
          adapterName: this.name,
          adapterVersion: this.version,
          requestedOperation: 'generateStreamingResponse'
        }
      });
    }

    if (!this.capabilities.supportsStreaming) {
      const response = await this.generateResponse(request);
      yield response.content;
      return;
    }

    try {
      const chunks = await this.executeStreamingRequest(request);
      for (const chunk of chunks) {
        this.emit('streamChunk', chunk);
        yield chunk;
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  getCapabilities(): ModelCapabilities {
    return { ...this.capabilities };
  }

  validateConfig(config: ModelConfig): boolean {
    if (!config.name || !config.version || !config.provider) {
      return false;
    }

    if (config.provider === 'openai' && !config.apiKey) {
      return false;
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      return false;
    }

    if (config.topP !== undefined && (config.topP < 0 || config.topP > 1)) {
      return false;
    }

    if (config.maxTokens !== undefined && config.maxTokens <= 0) {
      return false;
    }

    return true;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const testRequest: ModelRequest = {
        prompt: 'test',
        messages: [{ role: 'user', content: 'test' }],
        parameters: { maxTokens: 10 }
      };

      const response = await this.executeRequest(testRequest);
      return response !== null && response.content !== undefined;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  private async executeRequest(request: ModelRequest): Promise<any> {
    const parameters = {
      ...request.parameters,
      max_tokens: request.parameters?.maxTokens ?? this.config.maxTokens,
      temperature: request.parameters?.temperature ?? this.config.temperature,
      top_p: request.parameters?.topP ?? this.config.topP,
      frequency_penalty: request.parameters?.frequencyPenalty ?? this.config.frequencyPenalty,
      presence_penalty: request.parameters?.presencePenalty ?? this.config.presencePenalty
    };

    const requestBody = {
      model: this.config.name,
      messages: request.messages || [{ role: 'user', content: request.prompt }],
      ...parameters
    };

    const response = await this.makeApiRequest(requestBody);
    return this.parseResponse(response);
  }

  private async executeStreamingRequest(request: ModelRequest): Promise<string[]> {
    const chunks: string[] = [];
    
    const parameters = {
      ...request.parameters,
      max_tokens: request.parameters?.maxTokens ?? this.config.maxTokens,
      temperature: request.parameters?.temperature ?? this.config.temperature,
      stream: true
    };

    const requestBody = {
      model: this.config.name,
      messages: request.messages || [{ role: 'user', content: request.prompt }],
      ...parameters
    };

    const stream = await this.makeStreamingApiRequest(requestBody);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return chunks;
  }

  private async makeApiRequest(body: any): Promise<any> {
    const endpoint = this.config.endpoint || this.getDefaultEndpoint();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError(
            `Authentication failed: ${response.status} ${response.statusText}`,
            endpoint,
            {
              additionalData: { status: response.status, statusText: response.statusText }
            }
          );
        }

        if (response.status === 408 || response.status === 504) {
          throw new TimeoutError(
            `Request timeout: ${response.status} ${response.statusText}`,
            endpoint,
            {
              additionalData: { status: response.status, statusText: response.statusText }
            }
          );
        }

        if (response.status >= 500) {
          throw new NetworkError(
            `Server error: ${response.status} ${response.statusText}`,
            endpoint,
            {
              additionalData: { status: response.status, statusText: response.statusText },
              retryable: true
            }
          );
        }

        throw new NetworkError(
          `API request failed: ${response.status} ${response.statusText}`,
          endpoint,
          {
            additionalData: { status: response.status, statusText: response.statusText }
          }
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError(
          `Network error: ${error.message}`,
          endpoint,
          {
            additionalData: { originalError: error.message },
            retryable: true
          }
        );
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(
          `Request aborted due to timeout`,
          endpoint,
          {
            additionalData: { timeout: this.config.timeout }
          }
        );
      }

      throw error;
    }
  }

  private async *makeStreamingApiRequest(body: any): AsyncGenerator<string> {
    const endpoint = this.config.endpoint || this.getDefaultEndpoint();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new NetworkError(
        `API request failed: ${response.status} ${response.statusText}`,
        endpoint,
        {
          additionalData: { status: response.status, statusText: response.statusText }
        }
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new InternalError('Response body is not readable', {
        additionalData: { 
          endpoint,
          responseStatus: response.status,
          hasBody: !!response.body
        }
      });
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (error) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private parseResponse(response: any): any {
    const choice = response.choices?.[0];
    return {
      content: choice?.message?.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      finishReason: choice?.finish_reason || 'unknown',
      metadata: {
        model: response.model,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens
      }
    };
  }

  private getDefaultEndpoint(): string {
    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages';
      case 'azure':
        return `https://${this.config.endpoint}.openai.azure.com/openai/deployments/${this.config.name}/chat/completions?api-version=2023-05-15`;
      default:
        throw new ValidationError(`Unknown provider: ${this.config.provider}`, { provider: this.config.provider });
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class OpenAIAdapter extends ModelAdapter {
  constructor() {
    super('openai-adapter', '1.0.0');
    this.capabilities = {
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      supportsAudio: true,
      maxContextLength: 128000,
      supportedLanguages: ['zh', 'en', 'ja', 'ko', 'es', 'fr', 'de']
    };
  }
}

export class AnthropicAdapter extends ModelAdapter {
  constructor() {
    super('anthropic-adapter', '1.0.0');
    this.capabilities = {
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      supportsAudio: false,
      maxContextLength: 200000,
      supportedLanguages: ['zh', 'en', 'ja', 'ko', 'es', 'fr', 'de']
    };
  }
}

export class LocalModelAdapter extends ModelAdapter {
  constructor() {
    super('local-adapter', '1.0.0');
    this.capabilities = {
      supportsStreaming: true,
      supportsFunctionCalling: false,
      supportsVision: false,
      supportsAudio: false,
      maxContextLength: 8192,
      supportedLanguages: ['zh', 'en']
    };
  }

  private localModelEndpoint: string = 'http://localhost:11434/api/generate';

  async initialize(config: ModelConfig): Promise<void> {
    await super.initialize(config);
    this.localModelEndpoint = config.endpoint || this.localModelEndpoint;
  }

  private getDefaultEndpoint(): string {
    return this.localModelEndpoint;
  }
}
