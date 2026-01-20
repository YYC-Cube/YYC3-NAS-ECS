/**
 * @file AI服务管理器实现
 * @description 统一管理所有AI服务，提供服务之间的协调和集成
 * @module services/AIServiceManager
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-19
 */

import { EventEmitter } from 'events';
import { AIChatService, AIProvider, ChatOptions, ChatMessage, StreamChunk } from './AIChatService';
import { ModelManagementService, ModelFilterOptions, AIModel } from './ModelManagementService';
import { PromptTemplateService, PromptTemplate, TemplateFilterOptions, CompiledTemplate } from './PromptTemplateService';
import { APIKeyManagementService, APIKey, APIKeyTestResult, APIKeyStatistics } from './APIKeyManagementService';

export interface AIServiceConfig {
  chatService?: {
    defaultProvider?: string;
    defaultModel?: string;
  };
  modelService?: {
    cacheTTL?: number;
  };
  templateService?: {
    storageKey?: string;
  };
  keyService?: {
    storageKey?: string;
    encryptionKey?: string;
  };
}

export interface ServiceInitializationResult {
  success: boolean;
  service: string;
  error?: string;
}

export class AIServiceManager extends EventEmitter {
  private chatService: AIChatService;
  private modelService: ModelManagementService;
  private templateService: PromptTemplateService;
  private keyService: APIKeyManagementService;
  private isInitialized: boolean = false;

  constructor(config?: AIServiceConfig) {
    super();

    this.keyService = new APIKeyManagementService(
      config?.keyService?.storageKey,
      config?.keyService?.encryptionKey
    );

    this.modelService = new ModelManagementService(
      config?.modelService?.cacheTTL
    );

    this.templateService = new PromptTemplateService(
      config?.templateService?.storageKey
    );

    this.chatService = new AIChatService();

    this.setupServiceIntegration();
  }

  private setupServiceIntegration(): void {
    this.keyService.on('key:added', async (key: APIKey) => {
      const provider = this.chatService.getProviders().find(p => p.id === key.provider);
      if (provider) {
        await this.chatService.configureProvider(key.provider, {
          apiKey: key.key,
        });
        await this.modelService.refreshModels(key.provider);
      }
    });

    this.keyService.on('key:updated', async (key: APIKey) => {
      const provider = this.chatService.getProviders().find(p => p.id === key.provider);
      if (provider && key.isActive) {
        await this.chatService.configureProvider(key.provider, {
          apiKey: key.key,
        });
      }
    });

    this.keyService.on('key:deleted', async (key: APIKey) => {
      const provider = this.chatService.getProviders().find(p => p.id === key.provider);
      if (provider) {
        await this.chatService.configureProvider(key.provider, {
          apiKey: undefined,
        });
      }
    });

    this.modelService.on('refreshing:completed', async ({ providerId, models }) => {
      const provider = this.chatService.getProviders().find(p => p.id === providerId);
      if (provider) {
        provider.models = models;
        this.chatService.getProviders();
      }
    });

    this.templateService.on('template:used', ({ templateId, variables }) => {
      this.emit('template:used', { templateId, variables });
    });
  }

  async initialize(): Promise<ServiceInitializationResult[]> {
    if (this.isInitialized) {
      throw new Error('Service manager already initialized');
    }

    const results: ServiceInitializationResult[] = [];

    try {
      await this.keyService.initialize();
      results.push({ success: true, service: 'APIKeyManagementService' });
    } catch (error) {
      results.push({
        success: false,
        service: 'APIKeyManagementService',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      await this.templateService.initialize();
      results.push({ success: true, service: 'PromptTemplateService' });
    } catch (error) {
      results.push({
        success: false,
        service: 'PromptTemplateService',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      await this.syncProvidersWithKeys();
      results.push({ success: true, service: 'ProviderSync' });
    } catch (error) {
      results.push({
        success: false,
        service: 'ProviderSync',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    this.isInitialized = true;
    this.emit('initialized', results);

    return results;
  }

  private async syncProvidersWithKeys(): Promise<void> {
    const keys = this.keyService.getActiveKeys();

    for (const key of keys) {
      const provider = this.chatService.getProviders().find(p => p.id === key.provider);
      if (provider) {
        await this.chatService.configureProvider(key.provider, {
          apiKey: key.key,
        });

        this.modelService.registerProvider({
          ...provider,
          apiKey: key.key,
        });

        try {
          await this.modelService.refreshModels(key.provider);
        } catch (error) {
          console.error(`Failed to refresh models for ${key.provider}:`, error);
        }
      }
    }
  }

  async sendMessage(
    content: string,
    options: ChatOptions
  ): Promise<ChatMessage> {
    return this.chatService.sendMessage(content, options);
  }

  async sendMessageStream(
    content: string,
    options: ChatOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<ChatMessage> {
    return this.chatService.sendMessageStream(content, options, onChunk);
  }

  async sendMessageWithTemplate(
    templateId: string,
    variables: Record<string, any>,
    options: ChatOptions
  ): Promise<ChatMessage> {
    const compiled = await this.templateService.compileTemplate(templateId, variables);
    return this.chatService.sendMessage(compiled.content, options);
  }

  async sendMessageStreamWithTemplate(
    templateId: string,
    variables: Record<string, any>,
    options: ChatOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<ChatMessage> {
    const compiled = await this.templateService.compileTemplate(templateId, variables);
    return this.chatService.sendMessageStream(compiled.content, options, onChunk);
  }

  getProviders(): AIProvider[] {
    return this.chatService.getProviders();
  }

  getCurrentProvider(): AIProvider | undefined {
    return this.chatService.getCurrentProvider();
  }

  setCurrentProvider(providerId: string): void {
    this.chatService.setCurrentProvider(providerId);
  }

  getModels(options?: ModelFilterOptions): AIModel[] {
    return this.modelService.getModels(options);
  }

  async refreshModels(providerId?: string): Promise<AIModel[]> {
    if (providerId) {
      return this.modelService.refreshModels(providerId);
    }
    const results = await this.modelService.refreshAllModels();
    const allModels: AIModel[] = [];
    for (const models of results.values()) {
      allModels.push(...models);
    }
    return allModels;
  }

  getTemplates(options?: TemplateFilterOptions): PromptTemplate[] {
    return this.templateService.getTemplates(options);
  }

  async createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<PromptTemplate> {
    return this.templateService.createTemplate(template);
  }

  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
    return this.templateService.updateTemplate(id, updates);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.templateService.deleteTemplate(id);
  }

  async compileTemplate(id: string, variables: Record<string, any>): Promise<CompiledTemplate> {
    return this.templateService.compileTemplate(id, variables);
  }

  getCategories() {
    return this.templateService.getCategories();
  }

  getAPIKeys(provider?: string): APIKey[] {
    return this.keyService.getKeys(provider);
  }

  async addAPIKey(keyData: Omit<APIKey, 'id' | 'createdAt' | 'updatedAt' | 'lastUsed' | 'usageCount'>): Promise<APIKey> {
    const key = await this.keyService.addKey(keyData);

    const provider = this.chatService.getProviders().find(p => p.id === key.provider);
    if (provider) {
      await this.chatService.configureProvider(key.provider, {
        apiKey: key.key,
      });
      this.modelService.registerProvider({
        ...provider,
        apiKey: key.key,
      });
      await this.modelService.refreshModels(key.provider);
    }

    return key;
  }

  async updateAPIKey(id: string, updates: Partial<APIKey>): Promise<APIKey> {
    return this.keyService.updateKey(id, updates);
  }

  async deleteAPIKey(id: string): Promise<void> {
    return this.keyService.deleteKey(id);
  }

  async testAPIKey(id: string): Promise<APIKeyTestResult> {
    return this.keyService.testKey(id);
  }

  async testAllAPIKeys(): Promise<APIKeyTestResult[]> {
    return this.keyService.testAllKeys();
  }

  getConversationHistory(): ChatMessage[] {
    return this.chatService.getConversationHistory();
  }

  clearConversationHistory(): void {
    this.chatService.clearConversationHistory();
  }

  getChatService(): AIChatService {
    return this.chatService;
  }

  getModelService(): ModelManagementService {
    return this.modelService;
  }

  getTemplateService(): PromptTemplateService {
    return this.templateService;
  }

  getKeyService(): APIKeyManagementService {
    return this.keyService;
  }

  getStatistics(): {
    chat: {
      isGenerating: boolean;
      conversationLength: number;
    };
    models: {
      totalModels: number;
      modelsByProvider: Map<string, number>;
      streamingSupported: number;
      toolsSupported: number;
    };
    templates: {
      totalTemplates: number;
      templatesByCategory: Map<string, number>;
      totalUsage: number;
      favoriteCount: number;
    };
    keys: {
      totalKeys: number;
      activeKeys: number;
      keysByProvider: Map<string, number>;
      totalUsage: number;
    };
  } {
    return {
      chat: {
        isGenerating: this.chatService.isGeneratingResponse(),
        conversationLength: this.chatService.getConversationHistory().length,
      },
      models: this.modelService.getModelStatistics(),
      templates: this.templateService.getTemplateStatistics(),
      keys: {
        totalKeys: this.keyService.getStatistics().totalKeys,
        activeKeys: this.keyService.getStatistics().activeKeys,
        keysByProvider: this.keyService.getStatistics().keysByProvider,
        totalUsage: this.keyService.getStatistics().totalUsage,
      },
    };
  }

  async exportData(): Promise<{
    templates: PromptTemplate[];
    keys: APIKey[];
  }> {
    const templates = await this.templateService.exportTemplates();
    const keys = await this.keyService.exportKeys(false);

    return { templates, keys };
  }

  async importData(data: {
    templates?: PromptTemplate[];
    keys?: Omit<APIKey, 'id' | 'createdAt' | 'updatedAt'>[];
  }): Promise<void> {
    if (data.templates) {
      await this.templateService.importTemplates(data.templates);
    }

    if (data.keys) {
      await this.keyService.importKeys(data.keys);
    }
  }

  async shutdown(): Promise<void> {
    this.emit('shutdown');
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }
}
