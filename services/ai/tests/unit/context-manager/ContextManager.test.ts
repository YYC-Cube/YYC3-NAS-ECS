/**
 * @file 上下文管理器测试
 * @description 测试上下文管理器的核心功能
 * @module __tests__/unit/context-manager/ContextManager.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextManager } from '@/context-manager/ContextManager';

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager();
  });

  describe('初始化', () => {
    it('应该成功创建上下文管理器实例', () => {
      expect(contextManager).toBeDefined();
      expect(contextManager).toBeInstanceOf(ContextManager);
    });

    it('应该初始化默认上下文', () => {
      const context = contextManager.getContext();
      expect(context).toBeDefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getContext', () => {
    it('应该返回当前上下文', () => {
      const context = contextManager.getContext();
      expect(context).toBeDefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('应该返回完整的上下文对象', () => {
      const context = contextManager.getContext();
      expect(context).toHaveProperty('timestamp');
    });
  });

  describe('updateContext', () => {
    it('应该更新上下文信息', () => {
      const updates = {
        user: 'test-user',
        pageContext: { url: 'https://example.com' }
      };

      contextManager.updateContext(updates);
      const context = contextManager.getContext();

      expect(context.user).toBe('test-user');
      expect(context.pageContext).toEqual({ url: 'https://example.com' });
    });

    it('应该保留原有上下文信息', () => {
      const initialContext = contextManager.getContext();
      const initialTimestamp = initialContext.timestamp;

      contextManager.updateContext({ user: 'test-user' });
      const updatedContext = contextManager.getContext();

      expect(updatedContext.user).toBe('test-user');
      expect(updatedContext.timestamp).toBeInstanceOf(Date);
    });

    it('应该更新时间戳', () => {
      const initialContext = contextManager.getContext();
      const initialTimestamp = initialContext.timestamp;

      setTimeout(() => {
        contextManager.updateContext({ user: 'test-user' });
        const updatedContext = contextManager.getContext();

        expect(updatedContext.timestamp.getTime()).toBeGreaterThan(initialTimestamp.getTime());
      }, 10);
    });

    it('应该支持部分更新', () => {
      contextManager.updateContext({ user: 'user1' });
      contextManager.updateContext({ pageContext: { url: 'test' } });

      const context = contextManager.getContext();
      expect(context.user).toBe('user1');
      expect(context.pageContext).toEqual({ url: 'test' });
    });

    it('应该支持嵌套对象更新', () => {
      const updates = {
        userPreferences: {
          theme: 'dark',
          language: 'zh-CN'
        }
      };

      contextManager.updateContext(updates);
      const context = contextManager.getContext();

      expect(context.userPreferences).toEqual(updates.userPreferences);
    });

    it('应该支持数组更新', () => {
      const updates = {
        conversationHistory: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' }
        ]
      };

      contextManager.updateContext(updates);
      const context = contextManager.getContext();

      expect(context.conversationHistory).toEqual(updates.conversationHistory);
    });
  });

  describe('getMetrics', () => {
    it('应该返回上下文指标', () => {
      const metrics = contextManager.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('contextSize');
      expect(metrics).toHaveProperty('lastUpdated');
    });

    it('应该正确计算上下文大小', () => {
      const initialMetrics = contextManager.getMetrics();
      const initialSize = initialMetrics.contextSize;

      contextManager.updateContext({
        user: 'test',
        pageContext: { url: 'test' },
        userPreferences: { theme: 'dark' }
      });

      const updatedMetrics = contextManager.getMetrics();
      expect(updatedMetrics.contextSize).toBeGreaterThan(initialSize);
    });

    it('应该返回最后更新时间', () => {
      const metrics = contextManager.getMetrics();
      expect(metrics.lastUpdated).toBeInstanceOf(Date);
    });

    it('应该反映上下文更新后的时间', () => {
      const initialMetrics = contextManager.getMetrics();
      const initialTime = initialMetrics.lastUpdated;

      setTimeout(() => {
        contextManager.updateContext({ user: 'test' });
        const updatedMetrics = contextManager.getMetrics();

        expect(updatedMetrics.lastUpdated.getTime()).toBeGreaterThan(initialTime.getTime());
      }, 10);
    });
  });

  describe('getPageContext', () => {
    it('应该返回页面上下文', async () => {
      const pageContext = await contextManager.getPageContext();
      expect(pageContext).toBeDefined();
      expect(pageContext).toHaveProperty('url');
      expect(pageContext).toHaveProperty('title');
      expect(pageContext).toHaveProperty('timestamp');
    });

    it('应该处理浏览器环境', async () => {
      const pageContext = await contextManager.getPageContext();
      expect(pageContext.url).toBeDefined();
      expect(pageContext.title).toBeDefined();
    });

    it('应该返回当前时间戳', async () => {
      const pageContext = await contextManager.getPageContext();
      expect(pageContext.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('集成测试', () => {
    it('应该支持完整的上下文生命周期', () => {
      const initialContext = contextManager.getContext();

      contextManager.updateContext({
        user: 'test-user',
        pageContext: { url: 'https://example.com' },
        userPreferences: { theme: 'dark' }
      });

      const updatedContext = contextManager.getContext();
      const metrics = contextManager.getMetrics();

      expect(updatedContext.user).toBe('test-user');
      expect(updatedContext.pageContext).toEqual({ url: 'https://example.com' });
      expect(updatedContext.userPreferences).toEqual({ theme: 'dark' });
      expect(metrics.contextSize).toBeGreaterThan(0);
    });

    it('应该支持多次更新', () => {
      contextManager.updateContext({ user: 'user1' });
      contextManager.updateContext({ pageContext: { url: 'url1' } });
      contextManager.updateContext({ userPreferences: { theme: 'dark' } });

      const context = contextManager.getContext();
      expect(context.user).toBe('user1');
      expect(context.pageContext).toEqual({ url: 'url1' });
      expect(context.userPreferences).toEqual({ theme: 'dark' });
    });

    it('应该支持覆盖更新', () => {
      contextManager.updateContext({ user: 'user1' });
      contextManager.updateContext({ user: 'user2' });

      const context = contextManager.getContext();
      expect(context.user).toBe('user2');
    });
  });
});