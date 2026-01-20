/**
 * @file AssistantAgent.test.ts
 * @description AssistantAgent单元测试
 * @module tests/unit/ai/agents
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AssistantAgent } from '@/ai/agents/AssistantAgent';
import { AgentConfig } from '@/ai/AgentProtocol';

describe('AssistantAgent', () => {
  let assistantAgent: AssistantAgent;
  let testConfig: AgentConfig;
  let mockPopup: any;

  beforeEach(() => {
    testConfig = {
      id: 'assistant-agent-1',
      name: 'Assistant Agent',
      description: 'Assistant agent for unit testing',
      capabilities: [],
      policies: {
        maxConcurrentRequests: 10,
        rateLimit: 100,
        privacyLevel: 'medium',
        dataRetention: 30
      }
    };

    mockPopup = {
      id: 'popup-1',
      title: 'Test Popup',
      content: {},
      position: { x: 100, y: 100 },
      size: { width: 400, height: 300 },
      visible: true,
      zIndex: 100
    };

    global.window = {
      innerWidth: 1024,
      innerHeight: 768
    } as any;

    global.navigator = {
      platform: 'MacIntel',
      language: 'zh-CN'
    } as any;

    assistantAgent = new AssistantAgent(testConfig);
  });

  afterEach(() => {
    assistantAgent.destroy();
  });

  describe('初始化', () => {
    it('应该正确初始化配置', () => {
      expect(assistantAgent.config).toBe(testConfig);
      expect(assistantAgent['conversationHistory']).toEqual([]);
      expect(assistantAgent['contextMemory']).toBeInstanceOf(Map);
      expect(assistantAgent['suggestions']).toEqual([]);
    });

    it('应该设置所有能力', () => {
      const capabilities = assistantAgent.config.capabilities;
      expect(capabilities).toHaveLength(5);
      expect(capabilities.map(c => c.id)).toEqual([
        'assistant-chat',
        'assistant-suggest',
        'assistant-context',
        'assistant-translate',
        'assistant-summarize'
      ]);
    });

    it('应该设置所有命令处理器', () => {
      const handlers = assistantAgent['commandHandlers'];
      expect(handlers.size).toBe(7);
      expect(Array.from(handlers.keys())).toEqual([
        'sendMessage',
        'getSuggestions',
        'setContext',
        'getContext',
        'translate',
        'summarize',
        'clearHistory'
      ]);
    });
  });

  describe('发送消息', () => {
    it('应该成功发送消息', async () => {
      const messageSpy = vi.fn();
      assistantAgent.on('assistant:message-sent', messageSpy);

      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'sendMessage',
          parameters: {
            message: '你好'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.response).toContain('AI响应');
      expect(result.data.conversation).toHaveLength(2);
      expect(messageSpy).toHaveBeenCalled();
    });

    it('应该记录对话历史', async () => {
      await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'sendMessage',
          parameters: {
            message: '第一条消息'
          }
        }
      });

      await assistantAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'sendMessage',
          parameters: {
            message: '第二条消息'
          }
        }
      });

      expect(assistantAgent['conversationHistory']).toHaveLength(4);
    });

    it('应该保存上下文信息', async () => {
      await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'sendMessage',
          parameters: {
            message: '你好',
            context: { userId: 'user-1' }
          }
        }
      });

      expect(assistantAgent['contextMemory'].size).toBeGreaterThan(0);
    });
  });

  describe('获取建议', () => {
    it('应该返回基础建议', async () => {
      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getSuggestions',
          parameters: {}
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.suggestions).toBeInstanceOf(Array);
      expect(result.data.suggestions.length).toBeGreaterThan(0);
    });

    it('应该基于上下文生成建议', async () => {
      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getSuggestions',
          parameters: {
            context: '翻译'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.suggestions[0]).toContain('翻译');
    });
  });

  describe('上下文管理', () => {
    it('应该设置上下文', async () => {
      const contextSetSpy = vi.fn();
      assistantAgent.on('assistant:context-set', contextSetSpy);

      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setContext',
          parameters: {
            key: 'userId',
            value: 'user-123'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(assistantAgent['contextMemory'].get('userId')).toBe('user-123');
      expect(contextSetSpy).toHaveBeenCalled();
    });

    it('应该获取上下文', async () => {
      assistantAgent['contextMemory'].set('userId', 'user-123');

      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getContext',
          parameters: {
            key: 'userId'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.value).toBe('user-123');
    });

    it('应该返回不存在的上下文', async () => {
      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getContext',
          parameters: {
            key: 'nonexistent'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.value).toBeUndefined();
    });
  });

  describe('翻译功能', () => {
    it('应该翻译文本', async () => {
      const translatedSpy = vi.fn();
      assistantAgent.on('assistant:translated', translatedSpy);

      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'translate',
          parameters: {
            text: '你好',
            targetLanguage: 'English'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.originalText).toBe('你好');
      expect(result.data.translatedText).toContain('翻译结果');
      expect(result.data.targetLanguage).toBe('English');
      expect(translatedSpy).toHaveBeenCalled();
    });
  });

  describe('摘要功能', () => {
    it('应该生成摘要', async () => {
      const summarizedSpy = vi.fn();
      assistantAgent.on('assistant:summarized', summarizedSpy);

      const longText = '这是一段很长的文本内容，需要进行摘要处理。这段文本包含了很多信息，我们需要提取其中的关键内容。';

      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'summarize',
          parameters: {
            text: longText,
            maxLength: 50
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.originalText).toBe(longText);
      expect(result.data.summary).toContain('摘要');
      expect(summarizedSpy).toHaveBeenCalled();
    });

    it('应该限制摘要长度', async () => {
      const longText = '这是一段很长的文本内容，需要进行摘要处理。这段文本包含了很多信息，我们需要提取其中的关键内容。这段文本继续延伸，包含更多的细节和信息，确保它足够长以触发摘要长度限制功能。';

      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'summarize',
          parameters: {
            text: longText,
            maxLength: 20
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.summary.length).toBeLessThanOrEqual(20 + 9);
    });
  });

  describe('清除历史', () => {
    it('应该清除对话历史', async () => {
      await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'sendMessage',
          parameters: {
            message: '第一条消息'
          }
        }
      });

      expect(assistantAgent['conversationHistory'].length).toBeGreaterThan(0);

      const historyClearedSpy = vi.fn();
      assistantAgent.on('assistant:history-cleared', historyClearedSpy);

      const result = await assistantAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'clearHistory',
          parameters: {}
        }
      });

      expect(result.success).toBe(true);
      expect(assistantAgent['conversationHistory']).toHaveLength(0);
      expect(historyClearedSpy).toHaveBeenCalled();
    });
  });

  describe('查询处理', () => {
    it('应该处理chat类型查询', async () => {
      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'query',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          type: 'chat',
          message: '你好'
        }
      });

      expect(result.success).toBe(true);
      expect(result.response).toContain('AI响应');
    });

    it('应该拒绝不支持的查询类型', async () => {
      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'query',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          type: 'unsupported'
        }
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('QUERY_NOT_SUPPORTED');
    });
  });

  describe('事件发射', () => {
    it('应该发射消息发送事件', async () => {
      const messageSpy = vi.fn();
      assistantAgent.on('assistant:message-sent', messageSpy);

      await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'sendMessage',
          parameters: {
            message: '你好'
          }
        }
      });

      expect(messageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userMessage: expect.any(Object),
          assistantMessage: expect.any(Object)
        })
      );
    });

    it('应该发射翻译事件', async () => {
      const translatedSpy = vi.fn();
      assistantAgent.on('assistant:translated', translatedSpy);

      await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'translate',
          parameters: {
            text: '你好',
            targetLanguage: 'English'
          }
        }
      });

      expect(translatedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          originalText: '你好',
          translatedText: expect.any(String),
          targetLanguage: 'English'
        })
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理不支持的命令', async () => {
      const result = await assistantAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'assistant-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'unsupportedCommand',
          parameters: {}
        }
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('COMMAND_NOT_SUPPORTED');
    });
  });
});
