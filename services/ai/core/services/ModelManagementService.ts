/**
 * @file 模型管理服务实现
 * @description 实现模型列表动态获取、缓存和管理功能
 * @module services/ModelManagementService
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-19
 */

import { EventEmitter } from 'events';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIModel } from './AIChatService';

export interface ModelCacheEntry {
  model: AIModel;
  cachedAt: number;
  ttl: number;
}

export interface ModelFilterOptions {
  provider?: string;
  supportsStreaming?: boolean;
  supportsTools?: boolean;
  minContextLength?: number;
  searchQuery?: string;
}

export class ModelManagementService extends EventEmitter {
  private providers: Map<string, AIProvider> = new Map();
  private modelCache: Map<string, ModelCacheEntry> = new Map();
  private cacheTTL: number = 3600000;
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private isLoading: boolean = false;

  constructor(cacheTTL: number = 3600000) {
    super();
    this.cacheTTL = cacheTTL;
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
    this.emit('provider:registered', provider);
  }

  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
    this.clearCacheForProvider(providerId);
    this.emit('provider:unregistered', providerId);
  }

  getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  async refreshModels(providerId: string): Promise<AIModel[]> {
    if (this.isLoading) {
      throw new Error('Already refreshing models');
    }

    this.isLoading = true;
    this.emit('refreshing:started', providerId);

    try {
      const provider = this.providers.get(providerId);
      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`);
      }

      let models: AIModel[] = [];

      if (provider.type === 'openai') {
        models = await this.fetchOpenAIModels(provider);
      } else if (provider.type === 'anthropic') {
        models = await this.fetchAnthropicModels(provider);
      } else if (provider.type === 'ollama') {
        models = await this.fetchOllamaModels(provider);
      }

      provider.models = models;
      this.providers.set(providerId, provider);

      this.cacheModels(providerId, models);
      this.emit('refreshing:completed', { providerId, models });

      return models;
    } catch (error) {
      this.emit('refreshing:failed', { providerId, error });
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async refreshAllModels(): Promise<Map<string, AIModel[]>> {
    const results = new Map<string, AIModel[]>();

    for (const providerId of this.providers.keys()) {
      try {
        const models = await this.refreshModels(providerId);
        results.set(providerId, models);
      } catch (error) {
        console.error(`Failed to refresh models for ${providerId}:`, error);
      }
    }

    return results;
  }

  private async fetchOpenAIModels(provider: AIProvider): Promise<AIModel[]> {
    if (!provider.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.openaiClient = new OpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseURL,
    });

    try {
      const response = await this.openaiClient.models.list();
      const models = response.data.map(model => ({
        id: model.id,
        name: this.formatModelName(model.id),
        provider: provider.id,
        contextLength: this.getContextLength(model.id),
        maxTokens: 4096,
        supportsStreaming: true,
        supportsTools: this.supportsTools(model.id),
      }));

      return models;
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return provider.models;
    }
  }

  private async fetchAnthropicModels(provider: AIProvider): Promise<AIModel[]> {
    if (!provider.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    this.anthropicClient = new Anthropic({
      apiKey: provider.apiKey,
      baseURL: provider.baseURL,
    });

    try {
      const models: AIModel[] = [
        {
          id: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus',
          provider: provider.id,
          contextLength: 200000,
          maxTokens: 4096,
          supportsStreaming: true,
          supportsTools: true,
        },
        {
          id: 'claude-3-sonnet-20240229',
          name: 'Claude 3 Sonnet',
          provider: provider.id,
          contextLength: 200000,
          maxTokens: 4096,
          supportsStreaming: true,
          supportsTools: true,
        },
        {
          id: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku',
          provider: provider.id,
          contextLength: 200000,
          maxTokens: 4096,
          supportsStreaming: true,
          supportsTools: true,
        },
        {
          id: 'claude-2.1',
          name: 'Claude 2.1',
          provider: provider.id,
          contextLength: 200000,
          maxTokens: 4096,
          supportsStreaming: true,
          supportsTools: false,
        },
      ];

      return models;
    } catch (error) {
      console.error('Failed to fetch Anthropic models:', error);
      return provider.models;
    }
  }

  private async fetchOllamaModels(provider: AIProvider): Promise<AIModel[]> {
    try {
      const response = await fetch(`${provider.baseURL}/api/tags`);
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      const models = data.models.map((model: any) => ({
        id: model.name,
        name: model.name,
        provider: provider.id,
        contextLength: 4096,
        maxTokens: 2048,
        supportsStreaming: true,
        supportsTools: false,
      }));

      return models;
    } catch (error) {
      console.error('Failed to fetch Ollama models:', error);
      return provider.models;
    }
  }

  private formatModelName(modelId: string): string {
    const nameMap: Record<string, string> = {
      'gpt-4-turbo-preview': 'GPT-4 Turbo',
      'gpt-4-1106-preview': 'GPT-4 Turbo (1106)',
      'gpt-4-0125-preview': 'GPT-4 Turbo (0125)',
      'gpt-4': 'GPT-4',
      'gpt-4-32k': 'GPT-4 32K',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K',
    };
    return nameMap[modelId] || modelId;
  }

  private getContextLength(modelId: string): number {
    const contextLengths: Record<string, number> = {
      'gpt-4-turbo-preview': 128000,
      'gpt-4-1106-preview': 128000,
      'gpt-4-0125-preview': 128000,
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-3.5-turbo': 16385,
      'gpt-3.5-turbo-16k': 16385,
    };
    return contextLengths[modelId] || 4096;
  }

  private supportsTools(modelId: string): boolean {
    const toolSupportedModels = [
      'gpt-4-turbo-preview',
      'gpt-4-1106-preview',
      'gpt-4-0125-preview',
      'gpt-4',
      'gpt-3.5-turbo',
    ];
    return toolSupportedModels.includes(modelId);
  }

  private cacheModels(providerId: string, models: AIModel[]): void {
    for (const model of models) {
      const cacheKey = `${providerId}:${model.id}`;
      this.modelCache.set(cacheKey, {
        model,
        cachedAt: Date.now(),
        ttl: this.cacheTTL,
      });
    }
    this.emit('cache:updated', { providerId, count: models.length });
  }

  private clearCacheForProvider(providerId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.modelCache.keys()) {
      if (key.startsWith(`${providerId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.modelCache.delete(key));
    this.emit('cache:cleared', providerId);
  }

  clearAllCache(): void {
    this.modelCache.clear();
    this.emit('cache:cleared', 'all');
  }

  getCachedModels(providerId?: string): AIModel[] {
    const now = Date.now();
    const models: AIModel[] = [];

    for (const [key, entry] of this.modelCache) {
      if (providerId && !key.startsWith(`${providerId}:`)) {
        continue;
      }

      if (now - entry.cachedAt > entry.ttl) {
        this.modelCache.delete(key);
        continue;
      }

      models.push(entry.model);
    }

    return models;
  }

  getModels(options?: ModelFilterOptions): AIModel[] {
    let models: AIModel[] = [];

    if (options?.provider) {
      const provider = this.providers.get(options.provider);
      if (provider) {
        models = [...provider.models];
      }
    } else {
      for (const provider of this.providers.values()) {
        models.push(...provider.models);
      }
    }

    if (options?.supportsStreaming !== undefined) {
      models = models.filter(m => m.supportsStreaming === options.supportsStreaming);
    }

    if (options?.supportsTools !== undefined) {
      models = models.filter(m => m.supportsTools === options.supportsTools);
    }

    if (options?.minContextLength !== undefined) {
      models = models.filter(m => m.contextLength >= options.minContextLength!);
    }

    if (options?.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      models = models.filter(m => 
        m.name.toLowerCase().includes(query) || 
        m.id.toLowerCase().includes(query)
      );
    }

    return models;
  }

  getModel(providerId: string, modelId: string): AIModel | undefined {
    const provider = this.providers.get(providerId);
    if (!provider) return undefined;

    return provider.models.find(m => m.id === modelId);
  }

  async testModelConnection(providerId: string, modelId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    try {
      if (provider.type === 'openai' && provider.apiKey) {
        const client = new OpenAI({ apiKey: provider.apiKey });
        await client.chat.completions.create({
          model: modelId,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        });
        return true;
      } else if (provider.type === 'anthropic' && provider.apiKey) {
        const client = new Anthropic({ apiKey: provider.apiKey });
        await client.messages.create({
          model: modelId,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        });
        return true;
      } else if (provider.type === 'ollama') {
        const response = await fetch(`${provider.baseURL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelId,
            prompt: 'Hi',
            stream: false,
          }),
        });
        return response.ok;
      }

      return false;
    } catch (error) {
      console.error(`Failed to test model ${modelId}:`, error);
      return false;
    }
  }

  getModelStatistics(): {
    totalModels: number;
    modelsByProvider: Map<string, number>;
    streamingSupported: number;
    toolsSupported: number;
  } {
    const modelsByProvider = new Map<string, number>();
    let streamingSupported = 0;
    let toolsSupported = 0;

    for (const provider of this.providers.values()) {
      modelsByProvider.set(provider.id, provider.models.length);
      streamingSupported += provider.models.filter(m => m.supportsStreaming).length;
      toolsSupported += provider.models.filter(m => m.supportsTools).length;
    }

    const totalModels = Array.from(modelsByProvider.values()).reduce((sum, count) => sum + count, 0);

    return {
      totalModels,
      modelsByProvider,
      streamingSupported,
      toolsSupported,
    };
  }

  isRefreshing(): boolean {
    return this.isLoading;
  }

  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
    this.emit('config:updated', { cacheTTL: ttl });
  }

  getCacheTTL(): number {
    return this.cacheTTL;
  }
}
