/**
 * @file EventDispatcher 单元测试
 * @description 测试事件分发器的核心功能
 * @module __tests__/unit/core/EventDispatcher.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-01
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  EventDispatcher,
  SystemEvent,
  EventHandler,
  EventDispatcherConfig,
  EventMetrics
} from '../../../core/event-dispatcher/EventDispatcher';

describe('EventDispatcher', () => {
  let dispatcher: EventDispatcher;
  let config: EventDispatcherConfig;

  beforeEach(() => {
    config = {
      enableMetrics: true,
      enableHistory: true,
      maxHistorySize: 1000,
      enableAsync: true,
      maxConcurrentHandlers: 10
    };
    dispatcher = new EventDispatcher(config);
  });

  afterEach(() => {
    dispatcher.destroy();
  });

  describe('初始化', () => {
    it('应该使用默认配置初始化', () => {
      const defaultDispatcher = new EventDispatcher();
      expect(defaultDispatcher).toBeDefined();
      expect(defaultDispatcher.getMetrics().totalEvents).toBe(0);
    });

    it('应该使用自定义配置初始化', () => {
      const customDispatcher = new EventDispatcher({
        enableMetrics: false,
        enableHistory: false,
        enableAsync: false
      });
      expect(customDispatcher).toBeDefined();
    });

    it('应该正确设置配置值', () => {
      const customDispatcher = new EventDispatcher({
        maxHistorySize: 500,
        maxConcurrentHandlers: 5
      });
      expect(customDispatcher).toBeDefined();
    });
  });

  describe('事件分发', () => {
    it('应该成功分发事件', async () => {
      const handlerSpy = vi.fn();
      dispatcher.onEvent('test_event', handlerSpy);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy).toHaveBeenCalled();
    });

    it('应该为事件生成唯一ID和时间戳', async () => {
      const handlerSpy = vi.fn();
      dispatcher.onEvent('test_event', handlerSpy);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy).toHaveBeenCalledTimes(1);
      const event = handlerSpy.mock.calls[0][0] as SystemEvent;
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(typeof event.id).toBe('string');
      expect(typeof event.timestamp).toBe('number');
    });

    it('应该使用默认优先级', async () => {
      const handlerSpy = vi.fn();
      dispatcher.onEvent('test_event', handlerSpy);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      const event = handlerSpy.mock.calls[0][0] as SystemEvent;
      expect(event.priority).toBe('normal');
    });

    it('应该使用自定义优先级', async () => {
      const handlerSpy = vi.fn();
      dispatcher.onEvent('test_event', handlerSpy);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' },
        priority: 'high'
      });

      const event = handlerSpy.mock.calls[0][0] as SystemEvent;
      expect(event.priority).toBe('high');
    });

    it('应该保留元数据', async () => {
      const handlerSpy = vi.fn();
      dispatcher.onEvent('test_event', handlerSpy);

      const metadata = { userId: '123', sessionId: '456' };
      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' },
        metadata
      });

      const event = handlerSpy.mock.calls[0][0] as SystemEvent;
      expect(event.metadata).toEqual(metadata);
    });

    it('应该触发event_dispatched事件', async () => {
        const eventSpy = vi.fn();
        dispatcher.on('event_dispatched', eventSpy);

        await dispatcher.dispatch({
          type: 'test_event',
          source: 'test',
          payload: { data: 'test' }
        });

        expect(eventSpy).toHaveBeenCalled();
      });

      it('应该在无处理器时触发event_no_handlers事件', async () => {
        const noHandlerSpy = vi.fn();
        dispatcher.on('event_no_handlers', noHandlerSpy);

        await dispatcher.dispatch({
          type: 'no_handler_event',
          source: 'test',
          payload: { data: 'test' }
        });

        expect(noHandlerSpy).toHaveBeenCalled();
      });
  });

  describe('事件处理器注册', () => {
    it('应该成功注册处理器', () => {
      const handlerSpy = vi.fn();
      const handlerId = dispatcher.onEvent('test_event', handlerSpy);

      expect(handlerId).toBeDefined();
      expect(typeof handlerId).toBe('string');
      expect(handlerId).toMatch(/^handler_/);
    });

    it('应该为同一事件类型注册多个处理器', async () => {
      const handlerSpy1 = vi.fn();
      const handlerSpy2 = vi.fn();

      dispatcher.onEvent('test_event', handlerSpy1);
      dispatcher.onEvent('test_event', handlerSpy2);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy1).toHaveBeenCalled();
      expect(handlerSpy2).toHaveBeenCalled();
    });

    it('应该为不同事件类型注册处理器', async () => {
      const handlerSpy1 = vi.fn();
      const handlerSpy2 = vi.fn();

      dispatcher.onEvent('event_1', handlerSpy1);
      dispatcher.onEvent('event_2', handlerSpy2);

      await dispatcher.dispatch({
        type: 'event_1',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy1).toHaveBeenCalled();
      expect(handlerSpy2).not.toHaveBeenCalled();
    });

    it('应该返回处理器列表', () => {
      const handlerSpy = vi.fn();
      dispatcher.onEvent('test_event', handlerSpy);

      const handlers = dispatcher.getHandlers('test_event');
      expect(handlers.length).toBe(1);
      expect(handlers[0].eventType).toBe('test_event');
    });

    it('应该返回所有处理器', () => {
      const handlerSpy1 = vi.fn();
      const handlerSpy2 = vi.fn();

      dispatcher.onEvent('event_1', handlerSpy1);
      dispatcher.onEvent('event_2', handlerSpy2);

      const handlers = dispatcher.getHandlers();
      expect(handlers.length).toBe(2);
    });

    it('应该触发handler_registered事件', () => {
      const eventSpy = vi.fn();
      dispatcher.on('handler_registered', eventSpy);

      dispatcher.onEvent('test_event', vi.fn());

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('事件处理器注销', () => {
    it('应该通过ID注销处理器', async () => {
      const handlerSpy = vi.fn();
      const handlerId = dispatcher.onEvent('test_event', handlerSpy);

      dispatcher.off(handlerId);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy).not.toHaveBeenCalled();
    });

    it('应该触发handler_unregistered事件', () => {
      const eventSpy = vi.fn();
      dispatcher.on('handler_unregistered', eventSpy);

      const handlerId = dispatcher.onEvent('test_event', vi.fn());
      dispatcher.off(handlerId);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该注销指定事件类型的所有处理器', async () => {
      const handlerSpy1 = vi.fn();
      const handlerSpy2 = vi.fn();

      dispatcher.onEvent('event_1', handlerSpy1);
      dispatcher.onEvent('event_1', handlerSpy2);
      dispatcher.onEvent('event_2', vi.fn());

      dispatcher.offAll('event_1');

      await dispatcher.dispatch({
        type: 'event_1',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy1).not.toHaveBeenCalled();
      expect(handlerSpy2).not.toHaveBeenCalled();
    });

    it('应该注销所有处理器', async () => {
      const handlerSpy1 = vi.fn();
      const handlerSpy2 = vi.fn();

      dispatcher.onEvent('event_1', handlerSpy1);
      dispatcher.onEvent('event_2', handlerSpy2);

      dispatcher.offAll();

      await dispatcher.dispatch({
        type: 'event_1',
        source: 'test',
        payload: { data: 'test' }
      });

      await dispatcher.dispatch({
        type: 'event_2',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy1).not.toHaveBeenCalled();
      expect(handlerSpy2).not.toHaveBeenCalled();
    });

    it('应该触发handlers_unregistered事件', () => {
      const eventSpy = vi.fn();
      dispatcher.on('handlers_unregistered', eventSpy);

      dispatcher.onEvent('event_1', vi.fn());
      dispatcher.onEvent('event_1', vi.fn());
      dispatcher.offAll('event_1');

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该触发all_handlers_unregistered事件', () => {
      const eventSpy = vi.fn();
      dispatcher.on('all_handlers_unregistered', eventSpy);

      dispatcher.onEvent('event_1', vi.fn());
      dispatcher.onEvent('event_2', vi.fn());
      dispatcher.offAll();

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('事件过滤', () => {
    it('应该根据过滤条件执行处理器', async () => {
      const handlerSpy = vi.fn();

      dispatcher.onEvent('test_event', handlerSpy, {
        filter: (event) => event.payload.data === 'valid'
      });

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'valid' }
      });

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'invalid' }
      });

      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    it('应该支持复杂过滤条件', async () => {
      const handlerSpy = vi.fn();

      dispatcher.onEvent('test_event', handlerSpy, {
        filter: (event) => 
          event.payload.data === 'valid' && 
          event.priority === 'high'
      });

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'valid' },
        priority: 'high'
      });

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'valid' },
        priority: 'normal'
      });

      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('优先级处理', () => {
    it('应该按优先级顺序执行处理器', async () => {
      const executionOrder: number[] = [];

      dispatcher.onEvent('test_event', () => { executionOrder.push(1); }, { priority: 1 });
      dispatcher.onEvent('test_event', () => { executionOrder.push(2); }, { priority: 2 });
      dispatcher.onEvent('test_event', () => { executionOrder.push(3); }, { priority: 0 });

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(executionOrder).toEqual([2, 1, 3]);
    });

    it('应该使用默认优先级0', async () => {
      const executionOrder: number[] = [];

      dispatcher.onEvent('test_event', () => { executionOrder.push(1); }, { priority: 1 });
      dispatcher.onEvent('test_event', () => { executionOrder.push(2); });

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(executionOrder[0]).toBe(1);
      expect(executionOrder[1]).toBe(2);
    });
  });

  describe('一次性处理器', () => {
    it('应该只执行一次', async () => {
      const handlerSpy = vi.fn();

      dispatcher.onceEvent('test_event', handlerSpy);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    it('应该支持once方法', async () => {
      const handlerSpy = vi.fn();

      dispatcher.onceEvent('test_event', handlerSpy);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('事件历史记录', () => {
    it('应该记录事件历史', async () => {
      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      const history = dispatcher.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].type).toBe('test_event');
    });

    it('应该限制历史记录大小', async () => {
      const limitedDispatcher = new EventDispatcher({
        maxHistorySize: 5
      });

      for (let i = 0; i < 10; i++) {
        await limitedDispatcher.dispatch({
          type: 'test_event',
          source: 'test',
          payload: { index: i }
        });
      }

      const history = limitedDispatcher.getHistory();
      expect(history.length).toBe(5);
    });

    it('应该支持限制返回的历史记录数量', async () => {
      for (let i = 0; i < 10; i++) {
        await dispatcher.dispatch({
          type: 'test_event',
          source: 'test',
          payload: { index: i }
        });
      }

      const history = dispatcher.getHistory(3);
      expect(history.length).toBe(3);
    });

    it('应该清除历史记录', async () => {
      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      dispatcher.clearHistory();

      const history = dispatcher.getHistory();
      expect(history.length).toBe(0);
    });

    it('应该触发history_cleared事件', () => {
      const eventSpy = vi.fn();
      dispatcher.on('history_cleared', eventSpy);

      dispatcher.clearHistory();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在禁用历史记录时不记录', async () => {
      const noHistoryDispatcher = new EventDispatcher({
        enableHistory: false
      });

      await noHistoryDispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      const history = noHistoryDispatcher.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('指标收集', () => {
    it('应该正确统计总事件数', async () => {
      await dispatcher.dispatch({
        type: 'event_1',
        source: 'test',
        payload: { data: 'test' }
      });

      await dispatcher.dispatch({
        type: 'event_2',
        source: 'test',
        payload: { data: 'test' }
      });

      const metrics = dispatcher.getMetrics();
      expect(metrics.totalEvents).toBe(2);
    });

    it('应该按事件类型统计', async () => {
      await dispatcher.dispatch({
        type: 'event_1',
        source: 'test',
        payload: { data: 'test' }
      });

      await dispatcher.dispatch({
        type: 'event_1',
        source: 'test',
        payload: { data: 'test' }
      });

      await dispatcher.dispatch({
        type: 'event_2',
        source: 'test',
        payload: { data: 'test' }
      });

      const metrics = dispatcher.getMetrics();
      expect(metrics.eventsByType['event_1']).toBe(2);
      expect(metrics.eventsByType['event_2']).toBe(1);
    });

    it('应该统计处理器数量', () => {
      dispatcher.onEvent('event_1', vi.fn());
      dispatcher.onEvent('event_1', vi.fn());
      dispatcher.onEvent('event_2', vi.fn());

      const metrics = dispatcher.getMetrics();
      expect(metrics.handlersCount).toBe(3);
    });

    it('应该统计成功和错误次数', async () => {
      const successHandler = vi.fn();
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });

      dispatcher.onEvent('test_event', successHandler);
      dispatcher.onEvent('test_event', errorHandler);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      const metrics = dispatcher.getMetrics();
      expect(metrics.successCount).toBe(1);
      expect(metrics.errorCount).toBe(1);
    });

    it('应该计算平均处理时间', async () => {
      const handlerSpy = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      dispatcher.onEvent('test_event', handlerSpy);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      const metrics = dispatcher.getMetrics();
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
    });

    it('应该清除指标', () => {
      dispatcher.onEvent('event_1', vi.fn());
      dispatcher.clearMetrics();

      const metrics = dispatcher.getMetrics();
      expect(metrics.totalEvents).toBe(0);
      expect(metrics.handlersCount).toBe(0);
    });

    it('应该触发metrics_cleared事件', () => {
      const eventSpy = vi.fn();
      dispatcher.on('metrics_cleared', eventSpy);

      dispatcher.clearMetrics();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在禁用指标时不收集', async () => {
      const noMetricsDispatcher = new EventDispatcher({
        enableMetrics: false
      });

      await noMetricsDispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      const metrics = noMetricsDispatcher.getMetrics();
      expect(metrics.totalEvents).toBe(0);
    });
  });

  describe('处理器启用/禁用', () => {
    it('应该禁用处理器', async () => {
      const handlerSpy = vi.fn();
      const handlerId = dispatcher.onEvent('test_event', handlerSpy);

      dispatcher.disableHandler(handlerId);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy).not.toHaveBeenCalled();
    });

    it('应该启用已禁用的处理器', async () => {
      const handlerSpy = vi.fn();
      const handlerId = dispatcher.onEvent('test_event', handlerSpy);

      dispatcher.disableHandler(handlerId);
      dispatcher.enableHandler(handlerId);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy).toHaveBeenCalled();
    });

    it('应该触发handler_enabled事件', () => {
      const eventSpy = vi.fn();
      dispatcher.on('handler_enabled', eventSpy);

      const handlerId = dispatcher.onEvent('test_event', vi.fn());
      dispatcher.enableHandler(handlerId);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该触发handler_disabled事件', () => {
      const eventSpy = vi.fn();
      dispatcher.on('handler_disabled', eventSpy);

      const handlerId = dispatcher.onEvent('test_event', vi.fn());
      dispatcher.disableHandler(handlerId);

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('通配符事件', () => {
    it('应该为所有事件触发通配符处理器', async () => {
      const wildcardSpy = vi.fn();

      dispatcher.onEvent('*', wildcardSpy);

      await dispatcher.dispatch({
        type: 'event_1',
        source: 'test',
        payload: { data: 'test' }
      });

      await dispatcher.dispatch({
        type: 'event_2',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(wildcardSpy).toHaveBeenCalledTimes(2);
    });

    it('应该同时触发特定处理器和通配符处理器', async () => {
      const specificSpy = vi.fn();
      const wildcardSpy = vi.fn();

      dispatcher.onEvent('test_event', specificSpy);
      dispatcher.onEvent('*', wildcardSpy);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(specificSpy).toHaveBeenCalled();
      expect(wildcardSpy).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该捕获处理器中的错误', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });

      const successHandler = vi.fn();

      dispatcher.onEvent('test_event', errorHandler);
      dispatcher.onEvent('test_event', successHandler);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(successHandler).toHaveBeenCalled();
    });

    it('应该触发handler_error事件', async () => {
      const errorSpy = vi.fn();
      dispatcher.on('handler_error', errorSpy);

      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });

      dispatcher.onEvent('test_event', errorHandler);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('异步处理', () => {
    it('应该支持异步处理器', async () => {
      const asyncHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      dispatcher.onEvent('test_event', asyncHandler);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(asyncHandler).toHaveBeenCalled();
    });

    it('应该支持同步模式', async () => {
      const syncDispatcher = new EventDispatcher({
        enableAsync: false
      });

      const executionOrder: number[] = [];

      syncDispatcher.onEvent('test_event', async () => {
        executionOrder.push(1);
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      syncDispatcher.onEvent('test_event', async () => {
        executionOrder.push(2);
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      await syncDispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(executionOrder).toEqual([1, 2]);
    });
  });

  describe('边界情况', () => {
    it('应该处理空负载', async () => {
      const handlerSpy = vi.fn();
      dispatcher.onEvent('test_event', handlerSpy);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: {}
      });

      expect(handlerSpy).toHaveBeenCalled();
    });

    it('应该处理undefined负载', async () => {
      const handlerSpy = vi.fn();
      dispatcher.onEvent('test_event', handlerSpy);

      await dispatcher.dispatch({
        type: 'test_event',
        source: 'test',
        payload: undefined as any
      });

      expect(handlerSpy).toHaveBeenCalled();
    });

    it('应该处理不存在的处理器ID', () => {
      expect(() => {
        dispatcher.off('non_existent_id');
      }).not.toThrow();
    });

    it('应该处理不存在的处理器启用/禁用', () => {
      expect(() => {
        dispatcher.enableHandler('non_existent_id');
        dispatcher.disableHandler('non_existent_id');
      }).not.toThrow();
    });

    it('应该处理空事件类型', async () => {
      const handlerSpy = vi.fn();
      dispatcher.onEvent('', handlerSpy);

      await dispatcher.dispatch({
        type: '',
        source: 'test',
        payload: { data: 'test' }
      });

      expect(handlerSpy).toHaveBeenCalled();
    });
  });

  describe('销毁', () => {
    it('应该清理所有资源', () => {
      dispatcher.onEvent('event_1', vi.fn());
      dispatcher.onEvent('event_2', vi.fn());

      dispatcher.destroy();

      expect(dispatcher.getHandlers().length).toBe(0);
      expect(dispatcher.getHistory().length).toBe(0);
      expect(dispatcher.getMetrics().totalEvents).toBe(0);
    });
  });
});
