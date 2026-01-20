import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextManager, ContextData } from '../../../core/context-manager/ContextManager';

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化', () => {
    it('应该成功初始化上下文管理器', () => {
      expect(contextManager).toBeDefined();
      const context = contextManager.getContext();
      expect(context).toBeDefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('应该初始化时包含时间戳', () => {
      const context = contextManager.getContext();
      expect(context.timestamp).toBeInstanceOf(Date);
      const now = new Date();
      const timeDiff = Math.abs(context.timestamp.getTime() - now.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });
  });

  describe('updateContext', () => {
    it('应该能够更新用户信息', () => {
      contextManager.updateContext({ user: 'test-user' });
      const context = contextManager.getContext();
      expect(context.user).toBe('test-user');
    });

    it('应该能够更新页面上下文', () => {
      const pageContext = { url: 'https://example.com', title: 'Test Page' };
      contextManager.updateContext({ pageContext });
      const context = contextManager.getContext();
      expect(context.pageContext).toEqual(pageContext);
    });

    it('应该能够更新对话历史', () => {
      const conversationHistory = [{ role: 'user', content: 'Hello' }];
      contextManager.updateContext({ conversationHistory });
      const context = contextManager.getContext();
      expect(context.conversationHistory).toEqual(conversationHistory);
    });

    it('应该能够更新用户偏好', () => {
      const userPreferences = { theme: 'dark', language: 'zh-CN' };
      contextManager.updateContext({ userPreferences });
      const context = contextManager.getContext();
      expect(context.userPreferences).toEqual(userPreferences);
    });

    it('应该能够更新业务上下文', () => {
      const businessContext = { projectId: '123', teamId: '456' };
      contextManager.updateContext({ businessContext });
      const context = contextManager.getContext();
      expect(context.businessContext).toEqual(businessContext);
    });

    it('应该能够同时更新多个字段', () => {
      contextManager.updateContext({
        user: 'test-user',
        pageContext: { url: 'https://example.com' },
        userPreferences: { theme: 'dark' }
      });
      const context = contextManager.getContext();
      expect(context.user).toBe('test-user');
      expect(context.pageContext).toEqual({ url: 'https://example.com' });
      expect(context.userPreferences).toEqual({ theme: 'dark' });
    });

    it('更新时应该更新时间戳', async () => {
      const initialContext = contextManager.getContext();
      await new Promise(resolve => setTimeout(resolve, 10));
      contextManager.updateContext({ user: 'test-user' });
      const updatedContext = contextManager.getContext();
      expect(updatedContext.timestamp.getTime()).toBeGreaterThan(initialContext.timestamp.getTime());
    });

    it('应该保留未更新的字段', () => {
      contextManager.updateContext({ user: 'test-user' });
      contextManager.updateContext({ pageContext: { url: 'https://example.com' } });
      const context = contextManager.getContext();
      expect(context.user).toBe('test-user');
      expect(context.pageContext).toEqual({ url: 'https://example.com' });
    });
  });

  describe('getContext', () => {
    it('应该返回完整的上下文对象', () => {
      contextManager.updateContext({
        user: 'test-user',
        pageContext: { url: 'https://example.com' },
        conversationHistory: [{ role: 'user', content: 'Hello' }],
        userPreferences: { theme: 'dark' },
        businessContext: { projectId: '123' }
      });
      const context = contextManager.getContext();
      expect(context.user).toBe('test-user');
      expect(context.pageContext).toEqual({ url: 'https://example.com' });
      expect(context.conversationHistory).toEqual([{ role: 'user', content: 'Hello' }]);
      expect(context.userPreferences).toEqual({ theme: 'dark' });
      expect(context.businessContext).toEqual({ projectId: '123' });
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('应该返回上下文对象', () => {
      contextManager.updateContext({ user: 'test-user' });
      const context1 = contextManager.getContext();
      const context2 = contextManager.getContext();
      expect(context1).toEqual(context2);
    });
  });

  describe('getMetrics', () => {
    it('应该返回上下文大小', () => {
      contextManager.updateContext({
        user: 'test-user',
        pageContext: { url: 'https://example.com' },
        conversationHistory: [{ role: 'user', content: 'Hello' }]
      });
      const metrics = contextManager.getMetrics();
      expect(metrics.contextSize).toBeGreaterThan(0);
      expect(metrics.contextSize).toBeGreaterThanOrEqual(3);
    });

    it('应该返回最后更新时间', () => {
      contextManager.updateContext({ user: 'test-user' });
      const metrics = contextManager.getMetrics();
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
      const now = new Date();
      const timeDiff = Math.abs(metrics.lastUpdated.getTime() - now.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });

    it('应该正确计算上下文大小', () => {
      const metrics1 = contextManager.getMetrics();
      contextManager.updateContext({ user: 'test-user' });
      const metrics2 = contextManager.getMetrics();
      expect(metrics2.contextSize).toBeGreaterThan(metrics1.contextSize);
    });
  });

  describe('getPageContext', () => {
    it('应该返回页面上下文信息', async () => {
      const pageContext = await contextManager.getPageContext();
      expect(pageContext).toBeDefined();
      expect(pageContext.url).toBeDefined();
      expect(pageContext.title).toBeDefined();
      expect(pageContext.timestamp).toBeInstanceOf(Date);
    });

    it('应该包含当前URL', async () => {
      const pageContext = await contextManager.getPageContext();
      expect(pageContext.url).toBeDefined();
      expect(typeof pageContext.url).toBe('string');
    });

    it('应该包含页面标题', async () => {
      const pageContext = await contextManager.getPageContext();
      expect(pageContext.title).toBeDefined();
      expect(typeof pageContext.title).toBe('string');
    });

    it('应该包含时间戳', async () => {
      const pageContext = await contextManager.getPageContext();
      expect(pageContext.timestamp).toBeInstanceOf(Date);
      const now = new Date();
      const timeDiff = Math.abs(pageContext.timestamp.getTime() - now.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });
  });

  describe('边界情况处理', () => {
    it('应该处理空更新', () => {
      const initialContext = contextManager.getContext();
      contextManager.updateContext({});
      const updatedContext = contextManager.getContext();
      expect(updatedContext).toEqual(initialContext);
    });

    it('应该处理undefined值', () => {
      contextManager.updateContext({ user: 'test-user' });
      contextManager.updateContext({ user: undefined });
      const context = contextManager.getContext();
      expect(context.user).toBeUndefined();
    });

    it('应该处理null值', () => {
      contextManager.updateContext({ user: 'test-user' });
      contextManager.updateContext({ user: null as any });
      const context = contextManager.getContext();
      expect(context.user).toBeNull();
    });

    it('应该处理复杂对象', () => {
      const complexObject = {
        nested: {
          deeply: {
            value: 'test'
          }
        },
        array: [1, 2, 3]
      };
      contextManager.updateContext({ businessContext: complexObject });
      const context = contextManager.getContext();
      expect(context.businessContext).toEqual(complexObject);
    });

    it('应该处理空数组', () => {
      contextManager.updateContext({ conversationHistory: [] });
      const context = contextManager.getContext();
      expect(context.conversationHistory).toEqual([]);
    });

    it('应该处理空对象', () => {
      contextManager.updateContext({ pageContext: {} });
      const context = contextManager.getContext();
      expect(context.pageContext).toEqual({});
    });
  });

  describe('性能测试', () => {
    it('应该能够快速更新上下文', () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        contextManager.updateContext({ user: `user-${i}` });
      }
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('应该能够快速获取上下文', () => {
      contextManager.updateContext({
        user: 'test-user',
        pageContext: { url: 'https://example.com' }
      });
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        contextManager.getContext();
      }
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('数据完整性', () => {
    it('应该保持数据类型一致性', () => {
      contextManager.updateContext({
        user: 'string',
        pageContext: { url: 'https://example.com' },
        conversationHistory: [{ role: 'user', content: 'Hello' }],
        userPreferences: { theme: 'dark' },
        businessContext: { projectId: 123 }
      });
      const context = contextManager.getContext();
      expect(typeof context.user).toBe('string');
      expect(typeof context.pageContext).toBe('object');
      expect(Array.isArray(context.conversationHistory)).toBe(true);
      expect(typeof context.userPreferences).toBe('object');
      expect(typeof context.businessContext).toBe('object');
    });

    it('应该正确处理字符串类型', () => {
      contextManager.updateContext({ user: 'test-user' });
      const context = contextManager.getContext();
      expect(typeof context.user).toBe('string');
    });

    it('应该正确处理对象类型', () => {
      const pageContext = { url: 'https://example.com', title: 'Test' };
      contextManager.updateContext({ pageContext });
      const context = contextManager.getContext();
      expect(typeof context.pageContext).toBe('object');
      expect(context.pageContext).toEqual(pageContext);
    });

    it('应该正确处理数组类型', () => {
      const conversationHistory = [{ role: 'user', content: 'Hello' }];
      contextManager.updateContext({ conversationHistory });
      const context = contextManager.getContext();
      expect(Array.isArray(context.conversationHistory)).toBe(true);
      expect(context.conversationHistory).toEqual(conversationHistory);
    });
  });

  describe('时间戳管理', () => {
    it('初始化时应该设置时间戳', () => {
      const context = contextManager.getContext();
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('每次更新都应该更新时间戳', async () => {
      const timestamps: Date[] = [];
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
        contextManager.updateContext({ user: `user-${i}` });
        timestamps.push(contextManager.getContext().timestamp);
      }
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i].getTime()).toBeGreaterThan(timestamps[i - 1].getTime());
      }
    });

    it('getMetrics应该返回正确的时间戳', async () => {
      const context = contextManager.getContext();
      const metrics = contextManager.getMetrics();
      expect(metrics.lastUpdated.getTime()).toBe(context.timestamp.getTime());
    });
  });

  describe('并发安全', () => {
    it('应该能够处理并发更新', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => {
            contextManager.updateContext({ user: `user-${i}` });
          })
        );
      }
      await Promise.all(promises);
      const context = contextManager.getContext();
      expect(context.user).toBeDefined();
      expect(typeof context.user).toBe('string');
    });

    it('应该能够处理并发读取', async () => {
      contextManager.updateContext({ user: 'test-user' });
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(contextManager.getContext());
      }
      const contexts = await Promise.all(promises);
      contexts.forEach(context => {
        expect(context.user).toBe('test-user');
      });
    });
  });
});
