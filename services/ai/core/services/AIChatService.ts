/**
 * @file AI对话服务实现
 * @description 实现完整的AI对话交互系统，包括用户输入处理、请求发送、响应接收和展示功能
 * @module services/AIChatService
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-19
 */

import { EventEmitter } from 'events';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'ollama';
  apiKey?: string;
  baseURL?: string;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'error' | 'read';
  error?: string;
}

export interface ChatOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export class AIChatService extends EventEmitter {
  private providers: Map<string, AIProvider> = new Map();
  private currentProviderId: string | null = null;
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private conversationHistory: ChatMessage[] = [];
  private isGenerating: boolean = false;

  constructor() {
    super();
    this.initializeDefaultProviders();
  }

  private initializeDefaultProviders(): void {
    const defaultProviders: AIProvider[] = [
      {
        id: 'openai',
        name: 'OpenAI',
        type: 'openai',
        models: [
          {
            id: 'gpt-4-turbo-preview',
            name: 'GPT-4 Turbo',
            provider: 'openai',
            contextLength: 128000,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsTools: true,
          },
          {
            id: 'gpt-4',
            name: 'GPT-4',
            provider: 'openai',
            contextLength: 8192,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsTools: true,
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            provider: 'openai',
            contextLength: 16385,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsTools: true,
          },
        ],
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        type: 'anthropic',
        models: [
          {
            id: 'claude-3-opus-20240229',
            name: 'Claude 3 Opus',
            provider: 'anthropic',
            contextLength: 200000,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsTools: true,
          },
          {
            id: 'claude-3-sonnet-20240229',
            name: 'Claude 3 Sonnet',
            provider: 'anthropic',
            contextLength: 200000,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsTools: true,
          },
          {
            id: 'claude-3-haiku-20240307',
            name: 'Claude 3 Haiku',
            provider: 'anthropic',
            contextLength: 200000,
            maxTokens: 4096,
            supportsStreaming: true,
            supportsTools: true,
          },
        ],
      },
      {
        id: 'ollama',
        name: 'Ollama (本地)',
        type: 'ollama',
        baseURL: 'http://localhost:11434',
        models: [
          {
            id: 'llama2',
            name: 'Llama 2',
            provider: 'ollama',
            contextLength: 4096,
            maxTokens: 2048,
            supportsStreaming: true,
            supportsTools: false,
          },
          {
            id: 'mistral',
            name: 'Mistral',
            provider: 'ollama',
            contextLength: 8192,
            maxTokens: 2048,
            supportsStreaming: true,
            supportsTools: false,
          },
        ],
      },
    ];

    defaultProviders.forEach(provider => {
      this.providers.set(provider.id, provider);
    });

    this.currentProviderId = 'openai';
  }

  async configureProvider(providerId: string, config: Partial<AIProvider>): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    Object.assign(provider, config);
    this.providers.set(providerId, provider);

    if (provider.type === 'openai' && provider.apiKey) {
      this.openaiClient = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
      });
    } else if (provider.type === 'anthropic' && provider.apiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
      });
    }

    this.emit('provider:configured', provider);
  }

  getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  getCurrentProvider(): AIProvider | undefined {
    if (!this.currentProviderId) return undefined;
    return this.providers.get(this.currentProviderId);
  }

  setCurrentProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    this.currentProviderId = providerId;
    this.emit('provider:changed', this.getCurrentProvider());
  }

  getModels(providerId?: string): AIModel[] {
    const provider = providerId 
      ? this.providers.get(providerId)
      : this.getCurrentProvider();
    
    if (!provider) return [];
    return provider.models;
  }

  async getAvailableModels(): Promise<AIModel[]> {
    const provider = this.getCurrentProvider();
    if (!provider) return [];

    if (provider.type === 'openai' && this.openaiClient) {
      try {
        const models = await this.openaiClient.models.list();
        const availableModels = models.data.map(model => ({
          id: model.id,
          name: model.id,
          provider: 'openai',
          contextLength: this.getContextLength(model.id),
          maxTokens: 4096,
          supportsStreaming: true,
          supportsTools: true,
        }));
        
        provider.models = availableModels;
        return availableModels;
      } catch (error) {
        console.error('Failed to fetch OpenAI models:', error);
        return provider.models;
      }
    } else if (provider.type === 'anthropic' && this.anthropicClient) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': provider.apiKey || '',
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });

        if (response.ok) {
          return provider.models;
        }
      } catch (error) {
        console.error('Failed to fetch Anthropic models:', error);
      }
      return provider.models;
    } else if (provider.type === 'ollama') {
      try {
        const response = await fetch(`${provider.baseURL}/api/tags`);
        if (response.ok) {
          const data = await response.json();
          const availableModels = data.models.map((model: any) => ({
            id: model.name,
            name: model.name,
            provider: 'ollama',
            contextLength: 4096,
            maxTokens: 2048,
            supportsStreaming: true,
            supportsTools: false,
          }));
          
          provider.models = availableModels;
          return availableModels;
        }
      } catch (error) {
        console.error('Failed to fetch Ollama models:', error);
      }
      return provider.models;
    }

    return provider.models;
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

  async sendMessage(
    content: string,
    options: ChatOptions
  ): Promise<ChatMessage> {
    if (this.isGenerating) {
      throw new Error('Already generating a response');
    }

    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      status: 'sent',
    };

    this.conversationHistory.push(userMessage);
    this.emit('message:sent', userMessage);

    this.isGenerating = true;
    this.emit('generating:started');

    try {
      const response = await this.generateResponse(content, options);
      
      const assistantMessage: ChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        status: 'sent',
      };

      this.conversationHistory.push(assistantMessage);
      this.emit('message:received', assistantMessage);

      return assistantMessage;
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.conversationHistory.push(errorMessage);
      this.emit('message:error', errorMessage);
      throw error;
    } finally {
      this.isGenerating = false;
      this.emit('generating:stopped');
    }
  }

  async sendMessageStream(
    content: string,
    options: ChatOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<ChatMessage> {
    if (this.isGenerating) {
      throw new Error('Already generating a response');
    }

    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      status: 'sent',
    };

    this.conversationHistory.push(userMessage);
    this.emit('message:sent', userMessage);

    this.isGenerating = true;
    this.emit('generating:started');

    try {
      const fullResponse = await this.generateResponseStream(content, options, onChunk);
      
      const assistantMessage: ChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: fullResponse,
        timestamp: Date.now(),
        status: 'sent',
      };

      this.conversationHistory.push(assistantMessage);
      this.emit('message:received', assistantMessage);

      return assistantMessage;
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.conversationHistory.push(errorMessage);
      this.emit('message:error', errorMessage);
      throw error;
    } finally {
      this.isGenerating = false;
      this.emit('generating:stopped');
    }
  }

  private async generateResponse(
    prompt: string,
    options: ChatOptions
  ): Promise<string> {
    const provider = this.getCurrentProvider();
    if (!provider) {
      throw new Error('No provider configured');
    }

    if (provider.type === 'openai' && this.openaiClient) {
      const messages = this.buildMessages(prompt, options.systemPrompt);
      
      const response = await this.openaiClient.chat.completions.create({
        model: options.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4096,
      });

      return response.choices[0]?.message?.content || '';
    } else if (provider.type === 'anthropic' && this.anthropicClient) {
      const messages = this.buildAnthropicMessages(prompt, options.systemPrompt);
      
      const response = await this.anthropicClient.messages.create({
        model: options.model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
      });

      return response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '';
    } else if (provider.type === 'ollama') {
      const response = await fetch(`${provider.baseURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model,
          prompt: this.buildOllamaPrompt(prompt, options.systemPrompt),
          stream: false,
        }),
      });

      const data = await response.json();
      return data.response || '';
    }

    throw new Error('Unsupported provider type');
  }

  private async generateResponseStream(
    prompt: string,
    options: ChatOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<string> {
    const provider = this.getCurrentProvider();
    if (!provider) {
      throw new Error('No provider configured');
    }

    if (provider.type === 'openai' && this.openaiClient) {
      const messages = this.buildMessages(prompt, options.systemPrompt);
      
      const stream = await this.openaiClient.chat.completions.create({
        model: options.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4096,
        stream: true,
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk({ content, done: false });
        }
      }

      onChunk({ content: '', done: true });
      return fullResponse;
    } else if (provider.type === 'anthropic' && this.anthropicClient) {
      const messages = this.buildAnthropicMessages(prompt, options.systemPrompt);
      
      const stream = await this.anthropicClient.messages.create({
        model: options.model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        stream: true,
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const content = chunk.delta.text || '';
          if (content) {
            fullResponse += content;
            onChunk({ content, done: false });
          }
        }
      }

      onChunk({ content: '', done: true });
      return fullResponse;
    } else if (provider.type === 'ollama') {
      const response = await fetch(`${provider.baseURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model,
          prompt: this.buildOllamaPrompt(prompt, options.systemPrompt),
          stream: true,
        }),
      });

      let fullResponse = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                fullResponse += data.response;
                onChunk({ content: data.response, done: false });
              }
              if (data.done) {
                onChunk({ content: '', done: true });
                return fullResponse;
              }
            } catch (error) {
            }
          }
        }
      }

      return fullResponse;
    }

    throw new Error('Unsupported provider type or streaming not supported');
  }

  private buildMessages(
    prompt: string,
    systemPrompt?: string
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    const recentMessages = this.conversationHistory.slice(-10);
    for (const msg of recentMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: prompt });

    return messages;
  }

  private buildAnthropicMessages(
    prompt: string,
    systemPrompt?: string
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    const recentMessages = this.conversationHistory.slice(-10);
    for (const msg of recentMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: prompt });

    return messages;
  }

  private buildOllamaPrompt(
    prompt: string,
    systemPrompt?: string
  ): string {
    let fullPrompt = '';

    if (systemPrompt) {
      fullPrompt += `System: ${systemPrompt}\n\n`;
    }

    const recentMessages = this.conversationHistory.slice(-10);
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        fullPrompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        fullPrompt += `Assistant: ${msg.content}\n`;
      }
    }

    fullPrompt += `User: ${prompt}\nAssistant:`;

    return fullPrompt;
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  clearConversationHistory(): void {
    this.conversationHistory = [];
    this.emit('history:cleared');
  }

  deleteMessage(messageId: string): void {
    const index = this.conversationHistory.findIndex(m => m.id === messageId);
    if (index !== -1) {
      const deletedMessage = this.conversationHistory.splice(index, 1)[0];
      this.emit('message:deleted', deletedMessage);
    }
  }

  editMessage(messageId: string, newContent: string): void {
    const message = this.conversationHistory.find(m => m.id === messageId);
    if (message) {
      const oldContent = message.content;
      message.content = newContent;
      message.timestamp = Date.now();
      this.emit('message:edited', { messageId, oldContent, newContent });
    }
  }

  isGeneratingResponse(): boolean {
    return this.isGenerating;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
