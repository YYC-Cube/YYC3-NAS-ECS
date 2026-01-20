/**
 * @file ContentAgent.test.ts
 * @description ContentAgent 单元测试
 * @module __tests__/unit/ai/agents
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentAgent } from '@/ai/agents/ContentAgent';
import { AgentConfig } from '@/ai/AgentProtocol';
import { Popup } from '@/core/popup/Popup';
import { ValidationError } from '@/error-handler/ErrorTypes';

describe('ContentAgent', () => {
  let contentAgent: ContentAgent;
  let mockPopup: Popup;

  beforeEach(() => {
    const config: AgentConfig = {
      id: 'content-agent-1',
      name: 'Content Agent',
      type: 'content',
      capabilities: [],
      enabled: true
    };

    contentAgent = new ContentAgent(config);

    mockPopup = {
      id: 'popup-1',
      content: null,
      config: {}
    } as any as Popup;

    contentAgent.popup = mockPopup;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该正确初始化ContentAgent', () => {
      expect(contentAgent).toBeDefined();
      expect(contentAgent.config.id).toBe('content-agent-1');
      expect(contentAgent.config.name).toBe('Content Agent');
    });

    it('应该设置正确的能力', () => {
      const capabilities = contentAgent.config.capabilities;
      expect(capabilities).toBeDefined();
      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBeGreaterThan(0);
    });

    it('应该包含内容更新能力', () => {
      const capabilities = contentAgent.config.capabilities;
      const updateCapability = capabilities.find((cap: any) => cap.id === 'content-update');
      expect(updateCapability).toBeDefined();
      expect(updateCapability.name).toBe('内容更新');
    });

    it('应该包含内容重载能力', () => {
      const capabilities = contentAgent.config.capabilities;
      const reloadCapability = capabilities.find((cap: any) => cap.id === 'content-reload');
      expect(reloadCapability).toBeDefined();
      expect(reloadCapability.name).toBe('内容重载');
    });

    it('应该包含内容缓存能力', () => {
      const capabilities = contentAgent.config.capabilities;
      const cacheCapability = capabilities.find((cap: any) => cap.id === 'content-cache');
      expect(cacheCapability).toBeDefined();
      expect(cacheCapability.name).toBe('内容缓存');
    });

    it('应该包含内容历史能力', () => {
      const capabilities = contentAgent.config.capabilities;
      const historyCapability = capabilities.find((cap: any) => cap.id === 'content-history');
      expect(historyCapability).toBeDefined();
      expect(historyCapability.name).toBe('内容历史');
    });

    it('应该包含内容验证能力', () => {
      const capabilities = contentAgent.config.capabilities;
      const validateCapability = capabilities.find((cap: any) => cap.id === 'content-validate');
      expect(validateCapability).toBeDefined();
      expect(validateCapability.name).toBe('内容验证');
    });
  });

  describe('内容更新', () => {
    it('应该能够更新内容', async () => {
      const newContent = { title: '测试标题', body: '测试内容' };

      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content: newContent
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.content).toEqual(newContent);
      expect(mockPopup.content).toEqual(newContent);
    });

    it('应该缓存更新的内容', async () => {
      const newContent = { title: '测试标题', body: '测试内容' };

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content: newContent
          }
        }
      });

      const cachedContent = await contentAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'reloadContent',
          parameters: {}
        }
      });

      expect(cachedContent.success).toBe(true);
      expect(cachedContent.data.content).toEqual(newContent);
    });

    it('应该可以选择不缓存内容', async () => {
      const newContent = { title: '测试标题', body: '测试内容' };

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content: newContent,
            cache: false
          }
        }
      });

      const cachedContent = await contentAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'reloadContent',
          parameters: {}
        }
      });

      // 由于 cache: false，内容不会被缓存，但是历史记录仍然会被添加
      // 所以 reloadContent 会返回失败，因为没有缓存
      expect(cachedContent.data.success).toBe(false);
      expect(cachedContent.data.message).toBe('没有缓存的内容');
    });
  });

  describe('内容重载', () => {
    it('应该能够重新加载缓存的内容', async () => {
      const content = { title: '测试标题', body: '测试内容' };

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content
          }
        }
      });

      mockPopup.content = null;

      const result = await contentAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'reloadContent',
          parameters: {}
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.content).toEqual(content);
      expect(mockPopup.content).toEqual(content);
    });

    it('当没有缓存时应该返回失败', async () => {
      // 确保没有缓存
      await contentAgent.handleMessage({
        id: 'msg-0',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'clearCache',
          parameters: {}
        }
      });

      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'reloadContent',
          parameters: {}
        }
      });

      expect(result.data.success).toBe(false);
      expect(result.data.message).toBe('没有缓存的内容');
    });
  });

  describe('缓存管理', () => {
    it('应该能够清除缓存', async () => {
      const content = { title: '测试标题', body: '测试内容' };

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content
          }
        }
      });

      const result = await contentAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'clearCache',
          parameters: {}
        }
      });

      expect(result.success).toBe(true);

      const reloadResult = await contentAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'reloadContent',
          parameters: {}
        }
      });

      expect(reloadResult.data.success).toBe(false);
      expect(reloadResult.data.message).toBe('没有缓存的内容');
    });
  });

  describe('历史记录', () => {
    it('应该能够获取内容历史', async () => {
      const content1 = { title: '标题1', body: '内容1' };
      const content2 = { title: '标题2', body: '内容2' };

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content: content1
          }
        }
      });

      await contentAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content: content2
          }
        }
      });

      const result = await contentAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getHistory',
          parameters: {}
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.history).toBeDefined();
      expect(result.data.history.length).toBe(2);
      expect(result.data.total).toBe(2);
    });

    it('应该能够限制历史记录数量', async () => {
      const content = { title: '测试标题', body: '测试内容' };

      for (let i = 0; i < 5; i++) {
        await contentAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'content-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'updateContent',
            parameters: {
              content: { ...content, index: i }
            }
          }
        });
      }

      const result = await contentAgent.handleMessage({
        id: 'msg-6',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getHistory',
          parameters: {
            limit: 3
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.history.length).toBe(3);
    });
  });

  describe('内容验证', () => {
    it('应该能够验证有效的内容', async () => {
      const content = { title: '测试标题', body: '测试内容' };

      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'validateContent',
          parameters: {
            content
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.valid).toBe(true);
      expect(result.data.errors).toEqual([]);
    });

    it('应该检测空内容', async () => {
      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'validateContent',
          parameters: {
            content: ''
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(false);
      expect(result.data.valid).toBe(false);
      expect(result.data.message).toBe('内容为空');
    });

    it('应该检测空对象', async () => {
      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'validateContent',
          parameters: {
            content: {}
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.valid).toBe(true);
      expect(result.data.warnings).toContain('内容对象为空');
    });
  });

  describe('内容恢复', () => {
    it('应该能够从历史记录恢复内容', async () => {
      const content1 = { title: '标题1', body: '内容1' };
      const content2 = { title: '标题2', body: '内容2' };

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content: content1
          }
        }
      });

      await contentAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content: content2
          }
        }
      });

      const result = await contentAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'restoreContent',
          parameters: {
            historyIndex: 1
          }
        }
      });

      // 历史记录[1]的oldContent是content1
      expect(result.success).toBe(true);
      expect(result.data.content).toEqual(content1);
      expect(mockPopup.content).toEqual(content1);
    });

    it('当历史记录不存在时应该返回失败', async () => {
      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'restoreContent',
          parameters: {
            historyIndex: 999
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(false);
      expect(result.data.message).toBe('历史记录不存在');
    });
  });

  describe('事件发射', () => {
    it('应该在更新内容时发射事件', async () => {
      const eventSpy = vi.fn();
      contentAgent.on('content:updated', eventSpy);

      const content = { title: '测试标题', body: '测试内容' };

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content
          }
        }
      });

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在重载内容时发射事件', async () => {
      const eventSpy = vi.fn();
      contentAgent.on('content:reloaded', eventSpy);

      const content = { title: '测试标题', body: '测试内容' };

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content
          }
        }
      });

      await contentAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'reloadContent',
          parameters: {}
        }
      });

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在清除缓存时发射事件', async () => {
      const eventSpy = vi.fn();
      contentAgent.on('content:cache-cleared', eventSpy);

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'clearCache',
          parameters: {}
        }
      });

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在验证内容时发射事件', async () => {
      const eventSpy = vi.fn();
      contentAgent.on('content:validated', eventSpy);

      const content = { title: '测试标题', body: '测试内容' };

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'validateContent',
          parameters: {
            content
          }
        }
      });

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在恢复内容时发射事件', async () => {
      const eventSpy = vi.fn();
      contentAgent.on('content:restored', eventSpy);

      const content = { title: '测试标题', body: '测试内容' };

      await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content
          }
        }
      });

      await contentAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'restoreContent',
          parameters: {
            historyIndex: 0
          }
        }
      });

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('当智能体未绑定到弹窗时应该抛出错误', async () => {
      contentAgent.popup = null;

      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content: { title: '测试' }
          }
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('当智能体未绑定到弹窗时重载应该抛出错误', async () => {
      contentAgent.popup = null;

      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'reloadContent',
          parameters: {}
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('当智能体未绑定到弹窗时恢复应该抛出错误', async () => {
      contentAgent.popup = null;

      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'restoreContent',
          parameters: {
            historyIndex: 0
          }
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理空内容更新', async () => {
      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content: null
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该处理大内容对象', async () => {
      const largeContent = {
        data: Array(1000).fill('test').join(',')
      };

      const result = await contentAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'updateContent',
          parameters: {
            content: largeContent
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该限制历史记录大小', async () => {
      const content = { title: '测试', body: '内容' };

      for (let i = 0; i < 60; i++) {
        await contentAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'content-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'updateContent',
            parameters: {
              content: { ...content, index: i }
            }
          }
        });
      }

      const result = await contentAgent.handleMessage({
        id: 'msg-61',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getHistory',
          parameters: {}
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.total).toBeLessThanOrEqual(50);
    });
  });

  describe('性能测试', () => {
    it('应该能够快速更新内容', async () => {
      const content = { title: '测试', body: '内容' };

      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        await contentAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'content-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'updateContent',
            parameters: {
              content: { ...content, index: i }
            }
          }
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('应该能够快速获取历史记录', async () => {
      const content = { title: '测试', body: '内容' };

      for (let i = 0; i < 50; i++) {
        await contentAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'content-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'updateContent',
            parameters: {
              content: { ...content, index: i }
            }
          }
        });
      }

      const startTime = Date.now();

      const result = await contentAgent.handleMessage({
        id: 'msg-51',
        type: 'command',
        from: 'user',
        to: 'content-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getHistory',
          parameters: {}
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100);
    });
  });
});
