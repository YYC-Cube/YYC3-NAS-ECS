/**
 * @file DataFlowManager 测试文件
 * @description 测试数据流转管理器的功能
 * @module integration
 * @author YYC
 * @version 1.0.0
 * @created 2025-01-07
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DataFlowManager,
  DataFlowOptions,
  DataFlowResult,
  DataFlowMetrics,
  EventBus,
  CacheManager,
  RetryManager,
  MonitoringService,
  DataFlowError
} from '@/integration/DataFlow';

describe('DataFlowManager', () => {
  let manager: DataFlowManager;
  let eventBus: EventBus;
  let cacheManager: CacheManager;
  let retryManager: RetryManager;
  let monitoringService: MonitoringService;

  beforeEach(() => {
    manager = new DataFlowManager();
    eventBus = manager.getEventBus();
    cacheManager = manager.getCacheManager();
    retryManager = new RetryManager();
    monitoringService = manager.getMonitoringService();
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  describe('sendData', () => {
    it('应该成功发送数据', async () => {
      const testData = { message: 'test data' };
      const targetModule = 'test-module';

      eventBus.subscribe(`${targetModule}.data.receive`, (data) => {
        expect(data.data).toEqual(testData);
      });

      const result = await manager.sendData(
        'source-module',
        targetModule,
        testData
      );

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.flowId).toBeDefined();
    });

    it('应该处理数据转换', async () => {
      const testData = { value: 1 };
      const transform = async (data: any) => ({ ...data, value: data.value * 2 });

      eventBus.subscribe('test-module.data.receive', (data) => {
        expect(data.data.value).toBe(2);
      });

      const result = await manager.sendData(
        'source-module',
        'test-module',
        testData,
        { transform }
      );

      expect(result.success).toBe(true);
    });

    it('应该使用缓存', async () => {
      const testData = { message: 'test data' };
      const options: DataFlowOptions = {
        useCache: true,
        cacheResult: true,
        cacheTTL: 60000
      };

      eventBus.subscribe('test-module.data.receive', () => {
        throw new Error('Should not be called');
      });

      const firstResult = await manager.sendData(
        'source-module',
        'test-module',
        testData,
        options
      );

      const secondResult = await manager.sendData(
        'source-module',
        'test-module',
        testData,
        options
      );

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);
    });

    it('应该处理空数据错误', async () => {
      await expect(
        manager.sendData('source-module', 'test-module', null)
      ).rejects.toThrow('数据不能为空');
    });

    it('应该记录数据流转指标', async () => {
      const testData = { message: 'test data' };

      eventBus.subscribe('test-module.data.receive', () => {});

      await manager.sendData('source-module', 'test-module', testData);

      const metrics = manager.getMetrics();
      expect(metrics.totalFlows).toBe(1);
      expect(metrics.successfulFlows).toBe(1);
    });
  });

  describe('broadcastData', () => {
    it('应该广播数据到多个模块', async () => {
      const testData = { message: 'broadcast test' };
      const targetModules = ['module1', 'module2', 'module3'];

      targetModules.forEach(module => {
        eventBus.subscribe(`${module}.data.receive`, (data) => {
          expect(data.data).toEqual(testData);
        });
      });

      const results = await manager.broadcastData(
        'source-module',
        targetModules,
        testData
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('应该处理部分失败', async () => {
      const testData = { message: 'broadcast test' };
      const targetModules = ['module1', 'module2', 'module3'];

      eventBus.subscribe('module1.data.receive', () => {
        throw new Error('Module1 error');
      });

      eventBus.subscribe('module2.data.receive', () => {});
      eventBus.subscribe('module3.data.receive', () => {});

      const results = await manager.broadcastData(
        'source-module',
        targetModules,
        testData
      );

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
    });
  });

  describe('receiveData', () => {
    it('应该成功接收并处理数据', async () => {
      const testData = { message: 'test data' };
      const handler = async (data: any) => {
        return { processed: true, ...data };
      };

      const result = await manager.receiveData(
        'source-module',
        'flow-123',
        testData,
        handler
      );

      expect(result.processed).toBe(true);
      expect(result.message).toBe('test data');
    });

    it('应该处理处理程序错误', async () => {
      const testData = { message: 'test data' };
      const handler = async () => {
        throw new Error('Processing error');
      };

      await expect(
        manager.receiveData('source-module', 'flow-123', testData, handler)
      ).rejects.toThrow('数据处理失败');
    });
  });

  describe('CacheManager', () => {
    it('应该缓存数据', async () => {
      await cacheManager.set('key1', 'value1');
      const value = await cacheManager.get('key1');
      expect(value).toBe('value1');
    });

    it('应该处理过期缓存', async () => {
      await cacheManager.set('key1', 'value1', 100);
      await new Promise(resolve => setTimeout(resolve, 150));
      const value = await cacheManager.get('key1');
      expect(value).toBeNull();
    });

    it('应该删除缓存', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.delete('key1');
      const value = await cacheManager.get('key1');
      expect(value).toBeNull();
    });

    it('应该清理所有缓存', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');
      await cacheManager.clear();
      
      const value1 = await cacheManager.get('key1');
      const value2 = await cacheManager.get('key2');
      
      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });
  });

  describe('RetryManager', () => {
    it('应该重试失败的操作', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary error');
        }
        return 'success';
      };

      const result = await retryManager.execute(fn, { maxRetries: 3 });
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('应该在达到最大重试次数后失败', async () => {
      const fn = async () => {
        throw new Error('Persistent error');
      };

      await expect(
        retryManager.execute(fn, { maxRetries: 2 })
      ).rejects.toThrow('Persistent error');
    });
  });

  describe('MonitoringService', () => {
    it('应该记录数据流转指标', () => {
      const metrics: DataFlowMetrics = {
        flowId: 'flow-123',
        sourceModule: 'module1',
        targetModule: 'module2',
        duration: 100,
        dataSize: 1024,
        success: true
      };

      monitoringService.recordDataFlow(metrics);

      const result = monitoringService.getMetrics();
      expect(result.totalFlows).toBe(1);
      expect(result.successfulFlows).toBe(1);
    });

    it('应该记录缓存命中率', () => {
      monitoringService.recordCacheHit('flow-123');
      monitoringService.recordCacheHit('flow-124');
      monitoringService.recordCacheMiss('flow-125');

      const result = monitoringService.getMetrics();
      expect(result.cacheHitRate).toBeCloseTo(0.666, 2);
    });

    it('应该计算平均持续时间', () => {
      monitoringService.recordDataFlow({
        flowId: 'flow-1',
        sourceModule: 'module1',
        targetModule: 'module2',
        duration: 100,
        dataSize: 1024,
        success: true
      });

      monitoringService.recordDataFlow({
        flowId: 'flow-2',
        sourceModule: 'module1',
        targetModule: 'module2',
        duration: 200,
        dataSize: 1024,
        success: true
      });

      const result = monitoringService.getMetrics();
      expect(result.averageDuration).toBe(150);
    });

    it('应该清理指标', () => {
      monitoringService.recordDataFlow({
        flowId: 'flow-123',
        sourceModule: 'module1',
        targetModule: 'module2',
        duration: 100,
        dataSize: 1024,
        success: true
      });

      monitoringService.clear();

      const result = monitoringService.getMetrics();
      expect(result.totalFlows).toBe(0);
    });
  });

  describe('EventBus', () => {
    it('应该发布和订阅事件', async () => {
      const handler = vi.fn();
      eventBus.subscribe('test-topic', handler);

      await eventBus.publish('test-topic', { data: 'test' });

      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('应该取消订阅事件', async () => {
      const handler = vi.fn();
      eventBus.subscribe('test-topic', handler);
      eventBus.unsubscribe('test-topic', handler);

      await eventBus.publish('test-topic', { data: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
