/**
 * @file ModelAdapter 单元测试
 * @description 测试AI模型适配器的核心功能
 * @module __tests__/unit/core/ModelAdapter.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModelAdapter, ModelGenerationRequest, ModelGenerationResponse } from '@/adapters/ModelAdapter';
import { OpenAIModelAdapter } from '@/adapters/OpenAIModelAdapter';
import { InternalModelAdapter } from '@/adapters/InternalModelAdapter';
import { AutonomousAIConfig } from '@/autonomous-ai-widget/types';

describe('ModelAdapter', () => {
  describe('OpenAIModelAdapter', () => {
    let adapter: OpenAIModelAdapter;
    let config: AutonomousAIConfig;

    beforeEach(() => {
      config = {
        apiType: 'openai',
        apiKey: 'test-api-key',
        modelName: 'gpt-4',
        maxTokens: 4096,
        temperature: 0.7,
        enableLearning: true,
        enableMemory: true,
        enableToolUse: true,
        enableContextAwareness: true,
        position: 'bottom-right',
        theme: 'light',
        language: 'zh-CN'
      };
      adapter = new OpenAIModelAdapter(config);
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Mocked AI response',
              role: 'assistant'
            }
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          },
          model: 'gpt-4'
        })
      }) as any;
    });

    afterEach(async () => {
      if (adapter) {
        await adapter.cancel();
      }
    });

    describe('初始化', () => {
      it('应该成功初始化适配器', async () => {
        await adapter.initialize(config);
        expect(adapter.getStatus()).toBe('idle');
      });

      it('应该抛出错误如果API密钥缺失', async () => {
        const invalidConfig: any = { ...config, apiKey: undefined };
        await expect(adapter.initialize(invalidConfig)).rejects.toThrow();
      });

      it('应该正确存储配置', async () => {
        await adapter.initialize(config);
        const storedConfig = adapter.getConfig();
        expect(storedConfig.apiType).toBe('openai');
        expect(storedConfig.modelName).toBe('gpt-4');
      });
    });

    describe('生成响应', () => {
      beforeEach(async () => {
        await adapter.initialize(config);
      });

      it('应该成功生成响应', async () => {
        const request: ModelGenerationRequest = {
          prompt: 'Hello, AI!'
        };
        const response = await adapter.generate(request);
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.timestamp).toBeDefined();
        expect(response.modelId).toBeDefined();
      });

      it('应该处理带有消息历史的请求', async () => {
        const request: ModelGenerationRequest = {
          prompt: 'Hello again!',
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ]
        };
        const response = await adapter.generate(request);
        expect(response).toBeDefined();
      });

      it('应该处理带有工具的请求', async () => {
        const request: ModelGenerationRequest = {
          prompt: 'Use a tool',
          tools: [
            {
              name: 'calculator',
              description: 'Perform calculations',
              parameters: {
                type: 'object',
                properties: {
                  expression: { type: 'string' }
                }
              }
            }
          ]
        };
        const response = await adapter.generate(request);
        expect(response).toBeDefined();
      });

      it('应该返回令牌使用统计', async () => {
        const request: ModelGenerationRequest = {
          prompt: 'Generate a long response'
        };
        const response = await adapter.generate(request);
        expect(response.usage).toBeDefined();
        expect(response.usage?.promptTokens).toBeGreaterThanOrEqual(0);
        expect(response.usage?.completionTokens).toBeGreaterThanOrEqual(0);
        expect(response.usage?.totalTokens).toBeGreaterThanOrEqual(0);
      });

      it('应该处理空提示词', async () => {
        const request: ModelGenerationRequest = {
          prompt: ''
        };
        const response = await adapter.generate(request);
        expect(response).toBeDefined();
      });
    });

    describe('取消操作', () => {
      beforeEach(async () => {
        await adapter.initialize(config);
      });

      it('应该成功取消生成任务', async () => {
        const request: ModelGenerationRequest = {
          prompt: 'Long prompt'
        };
        const generatePromise = adapter.generate(request);
        await adapter.cancel();
        await expect(generatePromise).resolves.toBeDefined();
      });

      it('应该在取消后重置状态', async () => {
        await adapter.initialize(config);
        await adapter.cancel();
        expect(adapter.getStatus()).toBe('idle');
      });
    });

    describe('工具支持', () => {
      beforeEach(async () => {
        await adapter.initialize(config);
      });

      it('应该返回支持的工具列表', () => {
        const supportedTools = adapter.getSupportedTools();
        expect(Array.isArray(supportedTools)).toBe(true);
      });

      it('应该检查工具是否支持', () => {
        const isSupported = adapter.supportsTool('calculator');
        expect(typeof isSupported).toBe('boolean');
      });

      it('应该正确处理不支持的工具', () => {
        const isSupported = adapter.supportsTool('non-existent-tool');
        expect(isSupported).toBe(false);
      });
    });

    describe('状态管理', () => {
      it('应该返回正确的状态', async () => {
        expect(adapter.getStatus()).toBe('idle');
        await adapter.initialize(config);
        expect(adapter.getStatus()).toBe('idle');
      });

      it('应该在生成时更新状态', async () => {
        await adapter.initialize(config);
        const request: ModelGenerationRequest = {
          prompt: 'Hello'
        };
        const generatePromise = adapter.generate(request);
        expect(adapter.getStatus()).toBe('generating');
        await generatePromise;
        expect(adapter.getStatus()).toBe('idle');
      });

      it('应该在错误时更新状态', async () => {
        await adapter.initialize(config);
        const request: ModelGenerationRequest = {
          prompt: 'Hello'
        };
        vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
        await expect(adapter.generate(request)).rejects.toThrow('Network error');
        expect(adapter.getStatus()).toBe('error');
      });
    });

    describe('错误处理', () => {
      it('应该处理API错误', async () => {
        const invalidConfig: any = { 
          ...config, 
          apiKey: undefined,
          modelName: undefined
        };
        await expect(adapter.initialize(invalidConfig)).rejects.toThrow();
      });

      it('应该处理网络错误', async () => {
        await adapter.initialize(config);
        const request: ModelGenerationRequest = {
          prompt: 'Hello'
        };
        vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
        await expect(adapter.generate(request)).rejects.toThrow('Network error');
      });

      it('应该处理超时错误', async () => {
        await adapter.initialize(config);
        const request: ModelGenerationRequest = {
          prompt: 'Hello'
        };
        vi.spyOn(global, 'fetch').mockImplementationOnce(() => 
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
        );
        await expect(adapter.generate(request)).rejects.toThrow('Timeout');
      });
    });
  });

  describe('InternalModelAdapter', () => {
    let adapter: InternalModelAdapter;
    let config: AutonomousAIConfig;

    beforeEach(() => {
      config = {
        apiType: 'internal',
        enableLearning: true,
        enableMemory: true,
        enableToolUse: true,
        enableContextAwareness: true
      };
      adapter = new InternalModelAdapter();
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Mocked AI response',
          toolUsed: false,
          usage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30
          }
        })
      }) as any;
    });

    afterEach(async () => {
      if (adapter) {
        await adapter.cancel();
      }
      vi.restoreAllMocks();
    });

    describe('初始化', () => {
      it('应该成功初始化适配器', async () => {
        await adapter.initialize(config);
        expect(adapter.getStatus()).toBe('idle');
      });

      it('应该正确存储配置', async () => {
        await adapter.initialize(config);
        const storedConfig = adapter.getConfig();
        expect(storedConfig.apiType).toBe('internal');
      });
    });

    describe('生成响应', () => {
      beforeEach(async () => {
        await adapter.initialize(config);
      });

      it('应该成功生成响应', async () => {
        const request: ModelGenerationRequest = {
          prompt: 'Hello, AI!'
        };
        const response = await adapter.generate(request);
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.timestamp).toBeDefined();
        expect(response.modelId).toBeDefined();
      });

      it('应该处理带有消息历史的请求', async () => {
        const request: ModelGenerationRequest = {
          prompt: 'Hello again!',
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ]
        };
        const response = await adapter.generate(request);
        expect(response).toBeDefined();
      });

      it('应该处理带有工具的请求', async () => {
        const request: ModelGenerationRequest = {
          prompt: 'Use a tool',
          tools: [
            {
              name: 'calculator',
              description: 'Perform calculations',
              parameters: {
                type: 'object',
                properties: {
                  expression: { type: 'string' }
                }
              }
            }
          ]
        };
        const response = await adapter.generate(request);
        expect(response).toBeDefined();
      });

      it('应该返回令牌使用统计', async () => {
        const request: ModelGenerationRequest = {
          prompt: 'Generate a long response'
        };
        const response = await adapter.generate(request);
        expect(response.usage).toBeDefined();
      });
    });

    describe('取消操作', () => {
      beforeEach(async () => {
        await adapter.initialize(config);
      });

      it('应该成功取消生成任务', async () => {
        const request: ModelGenerationRequest = {
          prompt: 'Long prompt'
        };
        const generatePromise = adapter.generate(request);
        await adapter.cancel();
        await expect(generatePromise).resolves.toBeDefined();
      });
    });

    describe('工具支持', () => {
      beforeEach(async () => {
        await adapter.initialize(config);
      });

      it('应该返回支持的工具列表', () => {
        const supportedTools = adapter.getSupportedTools();
        expect(Array.isArray(supportedTools)).toBe(true);
      });

      it('应该检查工具是否支持', () => {
        const isSupported = adapter.supportsTool('calculator');
        expect(typeof isSupported).toBe('boolean');
      });
    });

    describe('状态管理', () => {
      it('应该返回正确的状态', async () => {
        expect(adapter.getStatus()).toBe('idle');
        await adapter.initialize(config);
        expect(adapter.getStatus()).toBe('idle');
      });

      it('应该在生成时更新状态', async () => {
        await adapter.initialize(config);
        const request: ModelGenerationRequest = {
          prompt: 'Hello'
        };
        const generatePromise = adapter.generate(request);
        expect(adapter.getStatus()).toBe('generating');
        await generatePromise;
        expect(adapter.getStatus()).toBe('idle');
      });
    });
  });

  describe('ModelAdapter接口一致性', () => {
    it('OpenAIModelAdapter应该实现所有必需方法', () => {
      const adapter = new OpenAIModelAdapter();
      expect(typeof adapter.initialize).toBe('function');
      expect(typeof adapter.generate).toBe('function');
      expect(typeof adapter.cancel).toBe('function');
      expect(typeof adapter.getSupportedTools).toBe('function');
      expect(typeof adapter.supportsTool).toBe('function');
      expect(typeof adapter.getStatus).toBe('function');
      expect(typeof adapter.getConfig).toBe('function');
    });

    it('InternalModelAdapter应该实现所有必需方法', () => {
      const adapter = new InternalModelAdapter();
      expect(typeof adapter.initialize).toBe('function');
      expect(typeof adapter.generate).toBe('function');
      expect(typeof adapter.cancel).toBe('function');
      expect(typeof adapter.getSupportedTools).toBe('function');
      expect(typeof adapter.supportsTool).toBe('function');
      expect(typeof adapter.getStatus).toBe('function');
      expect(typeof adapter.getConfig).toBe('function');
    });
  });

  describe('配置覆盖', () => {
    it('应该允许在请求中覆盖模型配置', async () => {
      const config: AutonomousAIConfig = {
        apiType: 'openai',
        apiKey: 'test-api-key',
        modelName: 'gpt-4',
        maxTokens: 4096,
        temperature: 0.7,
        enableLearning: true,
        enableMemory: true,
        enableToolUse: true,
        enableContextAwareness: true,
        position: 'bottom-right',
        theme: 'light',
        language: 'zh-CN'
      };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Mocked AI response',
              role: 'assistant'
            }
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          },
          model: 'gpt-3.5-turbo'
        })
      }) as any;
      
      const adapter = new OpenAIModelAdapter(config);
      await adapter.initialize(config);

      const request: ModelGenerationRequest = {
        prompt: 'Hello',
        modelConfig: {
          modelName: 'gpt-3.5-turbo',
          temperature: 0.8
        }
      };

      const response = await adapter.generate(request);
      expect(response).toBeDefined();
      await adapter.cancel();
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内生成响应', async () => {
      const config: AutonomousAIConfig = {
        apiType: 'internal',
        modelName: 'internal-model',
        maxTokens: 4096,
        temperature: 0.7,
        enableLearning: true,
        enableMemory: true,
        enableToolUse: true,
        enableContextAwareness: true,
        position: 'bottom-right',
        theme: 'light',
        language: 'zh-CN'
      };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Mocked AI response',
          toolUsed: false,
          usage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30
          }
        })
      }) as any;
      
      const adapter = new InternalModelAdapter();
      await adapter.initialize(config);

      const startTime = Date.now();
      const request: ModelGenerationRequest = {
        prompt: 'Hello'
      };
      await adapter.generate(request);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
      await adapter.cancel();
    });

    it('应该能够处理多个并发请求', async () => {
      const config: AutonomousAIConfig = {
        apiType: 'internal',
        modelName: 'internal-model',
        maxTokens: 4096,
        temperature: 0.7,
        enableLearning: true,
        enableMemory: true,
        enableToolUse: true,
        enableContextAwareness: true,
        position: 'bottom-right',
        theme: 'light',
        language: 'zh-CN'
      };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Mocked AI response',
          toolUsed: false,
          usage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30
          }
        })
      }) as any;
      
      const adapter = new InternalModelAdapter();
      await adapter.initialize(config);

      const requests = Array(5).fill(null).map((_, i) => ({
        prompt: `Hello ${i}`
      }));

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => adapter.generate(req))
      );
      const endTime = Date.now();

      expect(responses).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(10000);
      await adapter.cancel();
    });
  });
});
