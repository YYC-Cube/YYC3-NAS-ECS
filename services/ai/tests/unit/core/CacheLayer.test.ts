import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  IntelligentCacheLayer,
  CacheLevel,
  CacheStrategy,
  CacheConfig,
  CacheEntry,
  CacheResult,
  CacheMetrics,
  CacheHealthStatus,
  CacheGetOptions,
  CacheSetOptions
} from '../../../core/cache/CacheLayer';

describe('IntelligentCacheLayer', () => {
  let cacheLayer: IntelligentCacheLayer;

  beforeEach(() => {
    cacheLayer = new IntelligentCacheLayer({
      defaultTTL: 60000,
      maxSize: 100,
      strategy: CacheStrategy.LRU,
      enableMetrics: true,
      enableHealthCheck: true
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化', () => {
    it('应该成功初始化缓存层', () => {
      expect(cacheLayer).toBeDefined();
    });

    it('应该使用默认配置初始化', () => {
      const defaultCache = new IntelligentCacheLayer();
      expect(defaultCache).toBeDefined();
    });

    it('应该使用自定义配置初始化', () => {
      const customCache = new IntelligentCacheLayer({
        defaultTTL: 120000,
        maxSize: 200,
        strategy: CacheStrategy.LFU
      });
      expect(customCache).toBeDefined();
    });

    it('应该支持所有缓存策略', () => {
      const strategies = [
        CacheStrategy.LRU,
        CacheStrategy.LFU,
        CacheStrategy.ARC,
        CacheStrategy.MRU,
        CacheStrategy.FIFO,
        CacheStrategy.TTL,
        CacheStrategy.HYBRID
      ];
      strategies.forEach(strategy => {
        const cache = new IntelligentCacheLayer({ strategy });
        expect(cache).toBeDefined();
      });
    });
  });

  describe('set', () => {
    it('应该能够设置缓存值', async () => {
      await cacheLayer.set('test-key', 'test-value');
      const result = await cacheLayer.get('test-key');
      expect(result.value).toBe('test-value');
      expect(result.hit).toBe(true);
    });

    it('应该能够设置对象类型缓存', async () => {
      const testObject = { name: 'test', value: 123 };
      await cacheLayer.set('object-key', testObject);
      const result = await cacheLayer.get('object-key');
      expect(result.value).toEqual(testObject);
      expect(result.hit).toBe(true);
    });

    it('应该能够设置数组类型缓存', async () => {
      const testArray = [1, 2, 3, 4, 5];
      await cacheLayer.set('array-key', testArray);
      const result = await cacheLayer.get('array-key');
      expect(result.value).toEqual(testArray);
      expect(result.hit).toBe(true);
    });

    it('应该支持自定义TTL', async () => {
      await cacheLayer.set('ttl-key', 'ttl-value', { ttl: 1000 });
      const result = await cacheLayer.get('ttl-key');
      expect(result.value).toBe('ttl-value');
      expect(result.hit).toBe(true);
    });

    it('应该支持设置缓存级别', async () => {
      await cacheLayer.set('l2-key', 'l2-value', { level: CacheLevel.L2 });
      const result = await cacheLayer.get('l2-key');
      expect(result.value).toBe('l2-value');
      expect(result.hit).toBe(true);
    });

    it('应该能够覆盖已存在的键', async () => {
      await cacheLayer.set('override-key', 'value1');
      await cacheLayer.set('override-key', 'value2');
      const result = await cacheLayer.get('override-key');
      expect(result.value).toBe('value2');
    });

    it('应该处理null值', async () => {
      await cacheLayer.set('null-key', null);
      const result = await cacheLayer.get('null-key');
      expect(result.value).toBeNull();
      expect(result.hit).toBe(true);
    });

    it('应该处理undefined值', async () => {
      await cacheLayer.set('undefined-key', undefined);
      const result = await cacheLayer.get('undefined-key');
      expect(result.value).toBeUndefined();
      expect(result.hit).toBe(true);
    });
  });

  describe('get', () => {
    it('应该能够获取已设置的缓存值', async () => {
      await cacheLayer.set('get-key', 'get-value');
      const result = await cacheLayer.get('get-key');
      expect(result.value).toBe('get-value');
      expect(result.hit).toBe(true);
    });

    it('应该返回未命中结果对于不存在的键', async () => {
      const result = await cacheLayer.get('non-existent-key');
      expect(result.value).toBeNull();
      expect(result.hit).toBe(false);
      expect(result.source).toBe('none');
    });

    it('应该包含元数据', async () => {
      await cacheLayer.set('metadata-key', 'metadata-value', { metadata: { test: 'data' } });
      const result = await cacheLayer.get('metadata-key');
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.test).toBe('data');
    });

    it('应该指示缓存来源', async () => {
      await cacheLayer.set('source-key', 'source-value');
      const result = await cacheLayer.get('source-key');
      expect(result.source).toBe('L1');
    });

    it('应该支持强制刷新', async () => {
      const loader = vi.fn().mockResolvedValue('refreshed-value');
      await cacheLayer.set('refresh-key', 'old-value');
      const result = await cacheLayer.get('refresh-key', { forceRefresh: true, loader });
      expect(loader).toHaveBeenCalled();
      expect(result.value).toBe('refreshed-value');
      expect(result.hit).toBe(false);
    });

    it('应该使用loader函数加载未命中的数据', async () => {
      const loader = vi.fn().mockResolvedValue('loaded-value');
      const result = await cacheLayer.get('loader-key', { loader });
      expect(loader).toHaveBeenCalled();
      expect(result.value).toBe('loaded-value');
      expect(result.hit).toBe(false);
      expect(result.source).toBe('loader');
    });

    it('应该处理loader函数抛出错误', async () => {
      const loader = vi.fn().mockRejectedValue(new Error('Load failed'));
      await expect(cacheLayer.get('error-loader-key', { loader })).rejects.toThrow('Load failed');
    });
  });

  describe('delete', () => {
    it('应该能够删除已存在的键', async () => {
      await cacheLayer.set('delete-key', 'delete-value');
      await cacheLayer.delete('delete-key');
      const result = await cacheLayer.get('delete-key');
      expect(result.hit).toBe(false);
    });

    it('应该能够删除不存在的键而不报错', async () => {
      await expect(cacheLayer.delete('non-existent-key')).resolves.not.toThrow();
    });

    it('应该能够删除多个键', async () => {
      await cacheLayer.set('key1', 'value1');
      await cacheLayer.set('key2', 'value2');
      await cacheLayer.delete('key1');
      await cacheLayer.delete('key2');
      const result1 = await cacheLayer.get('key1');
      const result2 = await cacheLayer.get('key2');
      expect(result1.hit).toBe(false);
      expect(result2.hit).toBe(false);
    });
  });

  describe('clear', () => {
    it('应该能够清空所有缓存', async () => {
      await cacheLayer.set('clear-key1', 'value1');
      await cacheLayer.set('clear-key2', 'value2');
      await cacheLayer.clear();
      const result1 = await cacheLayer.get('clear-key1');
      const result2 = await cacheLayer.get('clear-key2');
      expect(result1.hit).toBe(false);
      expect(result2.hit).toBe(false);
    });

    it('应该能够清空指定级别的缓存', async () => {
      await cacheLayer.set('clear-key1', 'value1');
      await cacheLayer.set('clear-key2', 'value2');
      
      const resultBeforeClear = await cacheLayer.get('clear-key1');
      expect(resultBeforeClear.hit).toBe(true);
      
      await cacheLayer.clear(CacheLevel.L1);
      
      const resultAfterClear = await cacheLayer.get('clear-key1');
      expect(resultAfterClear.hit).toBe(true);
      expect(resultAfterClear.source).not.toBe('L1');
    });
  });

  describe('getMetrics', () => {
    it('应该返回缓存指标', async () => {
      await cacheLayer.set('metrics-key', 'metrics-value');
      await cacheLayer.get('metrics-key');
      const metrics = cacheLayer.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics).toBeInstanceOf(Map);
      expect(metrics.size).toBeGreaterThan(0);
    });

    it('应该包含命中和未命中统计', async () => {
      await cacheLayer.set('hit-key', 'hit-value');
      await cacheLayer.get('hit-key');
      await cacheLayer.get('miss-key');
      const metrics = cacheLayer.getMetrics();
      expect(metrics).toBeInstanceOf(Map);
      metrics.forEach((metric, level) => {
        expect(metric.hits).toBeGreaterThanOrEqual(0);
        expect(metric.misses).toBeGreaterThanOrEqual(0);
      });
    });

    it('应该计算命中率', async () => {
      await cacheLayer.set('calc-key', 'calc-value');
      await cacheLayer.get('calc-key');
      const metrics = cacheLayer.getMetrics();
      expect(metrics).toBeInstanceOf(Map);
      metrics.forEach((metric) => {
        expect(metric.hitRate).toBeGreaterThanOrEqual(0);
      });
    });

    it('应该跟踪每个缓存级别的指标', async () => {
      await cacheLayer.set('l1-key', 'l1-value');
      await cacheLayer.set('l2-key', 'l2-value');
      await cacheLayer.get('l1-key');
      await cacheLayer.get('l2-key');
      const metrics = cacheLayer.getMetrics();
      expect(metrics).toBeInstanceOf(Map);
      expect(metrics.size).toBe(4);
    });
  });

  describe('getHealthStatus', () => {
    it('应该返回健康状态', () => {
      const health = cacheLayer.getHealthStatus();
      expect(health).toBeDefined();
      expect(health).toBeInstanceOf(Map);
      expect(health.size).toBeGreaterThan(0);
    });

    it('应该包含每个缓存级别的健康状态', () => {
      const health = cacheLayer.getHealthStatus();
      expect(health).toBeInstanceOf(Map);
      expect(health.size).toBe(4);
    });

    it('应该包含内存使用情况', () => {
      const health = cacheLayer.getHealthStatus();
      expect(health).toBeInstanceOf(Map);
      health.forEach((status) => {
        expect(status.memoryUsage).toBeDefined();
        expect(status.memoryUsage).toBeGreaterThanOrEqual(0);
      });
    });

    it('应该包含状态信息', () => {
      const health = cacheLayer.getHealthStatus();
      expect(health).toBeInstanceOf(Map);
      health.forEach((status) => {
        expect(status.status).toBeDefined();
        expect(['healthy', 'degraded', 'unhealthy']).toContain(status.status);
      });
    });
  });

  describe('TTL过期', () => {
    it('应该过期短TTL的缓存', async () => {
      await cacheLayer.set('short-ttl-key', 'short-ttl-value', { ttl: 10 });
      await new Promise(resolve => setTimeout(resolve, 20));
      const result = await cacheLayer.get('short-ttl-key');
      expect(result.hit).toBe(false);
    });

    it('应该不过期长TTL的缓存', async () => {
      await cacheLayer.set('long-ttl-key', 'long-ttl-value', { ttl: 10000 });
      await new Promise(resolve => setTimeout(resolve, 10));
      const result = await cacheLayer.get('long-ttl-key');
      expect(result.hit).toBe(true);
    });

    it('应该使用默认TTL当未指定时', async () => {
      const defaultTTLCache = new IntelligentCacheLayer({ defaultTTL: 100 });
      await defaultTTLCache.set('default-ttl-key', 'default-ttl-value');
      await new Promise(resolve => setTimeout(resolve, 50));
      const result = await defaultTTLCache.get('default-ttl-key');
      expect(result.hit).toBe(true);
    });
  });

  describe('多级缓存', () => {
    it('应该从L1缓存读取', async () => {
      await cacheLayer.set('l1-key', 'l1-value', { level: CacheLevel.L1 });
      const result = await cacheLayer.get('l1-key');
      expect(result.source).toBe('L1');
    });

    it('应该支持设置到不同缓存级别', async () => {
      await cacheLayer.set('l2-key', 'l2-value', { level: CacheLevel.L2 });
      const result = await cacheLayer.get('l2-key');
      expect(result.hit).toBe(true);
      expect(result.value).toBe('l2-value');
    });

    it('应该支持设置到L3缓存级别', async () => {
      await cacheLayer.set('l3-key', 'l3-value', { level: CacheLevel.L3 });
      const result = await cacheLayer.get('l3-key');
      expect(result.hit).toBe(true);
      expect(result.value).toBe('l3-value');
    });

    it('应该支持设置到L4缓存级别', async () => {
      await cacheLayer.set('l4-key', 'l4-value', { level: CacheLevel.L4 });
      const result = await cacheLayer.get('l4-key');
      expect(result.hit).toBe(true);
      expect(result.value).toBe('l4-value');
    });
  });

  describe('缓存策略', () => {
    it('应该支持LRU策略', async () => {
      const lruCache = new IntelligentCacheLayer({ strategy: CacheStrategy.LRU, maxSize: 2 });
      await lruCache.set('key1', 'value1');
      await lruCache.set('key2', 'value2');
      await lruCache.set('key3', 'value3');
      const result1 = await lruCache.get('key1');
      const result2 = await lruCache.get('key2');
      const result3 = await lruCache.get('key3');
      expect(result3.hit).toBe(true);
      expect(result3.value).toBe('value3');
    });

    it('应该支持LFU策略', async () => {
      const lfuCache = new IntelligentCacheLayer({ strategy: CacheStrategy.LFU, maxSize: 2 });
      await lfuCache.set('key1', 'value1');
      await lfuCache.set('key2', 'value2');
      await lfuCache.get('key1');
      await lfuCache.set('key3', 'value3');
      const result1 = await lfuCache.get('key1');
      const result3 = await lfuCache.get('key3');
      expect(result3.hit).toBe(true);
      expect(result3.value).toBe('value3');
    });
  });

  describe('边界情况处理', () => {
    it('应该处理空字符串键', async () => {
      await cacheLayer.set('', 'empty-key-value');
      const result = await cacheLayer.get('');
      expect(result.value).toBe('empty-key-value');
    });

    it('应该处理特殊字符键', async () => {
      const specialKey = 'key-with-special-chars-!@#$%^&*()';
      await cacheLayer.set(specialKey, 'special-value');
      const result = await cacheLayer.get(specialKey);
      expect(result.value).toBe('special-value');
    });

    it('应该处理大对象', async () => {
      const largeObject = { data: 'x'.repeat(10000) };
      await cacheLayer.set('large-key', largeObject);
      const result = await cacheLayer.get('large-key');
      expect(result.value).toEqual(largeObject);
    });

    it('应该处理大量键值对', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(cacheLayer.set(`key-${i}`, `value-${i}`));
      }
      await Promise.all(promises);
      const result = await cacheLayer.get('key-50');
      expect(result.hit).toBe(true);
      expect(result.value).toBe('value-50');
    });
  });

  describe('性能测试', () => {
    it('应该能够快速设置缓存', async () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        await cacheLayer.set(`perf-key-${i}`, `perf-value-${i}`);
      }
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('应该能够快速获取缓存', async () => {
      for (let i = 0; i < 100; i++) {
        await cacheLayer.set(`get-perf-key-${i}`, `get-perf-value-${i}`);
      }
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        await cacheLayer.get(`get-perf-key-${i % 100}`);
      }
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('并发安全', () => {
    it('应该能够处理并发设置', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(cacheLayer.set(`concurrent-key-${i}`, `concurrent-value-${i}`));
      }
      await Promise.all(promises);
      const result = await cacheLayer.get('concurrent-key-50');
      expect(result.hit).toBe(true);
    });

    it('应该能够处理并发获取', async () => {
      await cacheLayer.set('concurrent-get-key', 'concurrent-get-value');
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(cacheLayer.get('concurrent-get-key'));
      }
      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result.hit).toBe(true);
        expect(result.value).toBe('concurrent-get-value');
      });
    });

    it('应该能够处理并发删除', async () => {
      for (let i = 0; i < 50; i++) {
        await cacheLayer.set(`delete-key-${i}`, `delete-value-${i}`);
      }
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(cacheLayer.delete(`delete-key-${i}`));
      }
      await Promise.all(promises);
      const result = await cacheLayer.get('delete-key-25');
      expect(result.hit).toBe(false);
    });
  });

  describe('数据完整性', () => {
    it('应该保持数据类型一致性', async () => {
      const testData = {
        string: 'test',
        number: 123,
        boolean: true,
        object: { nested: 'value' },
        array: [1, 2, 3],
        null: null,
        undefined: undefined
      };
      await cacheLayer.set('integrity-key', testData);
      const result = await cacheLayer.get('integrity-key');
      expect(result.value).toEqual(testData);
    });

    it('应该正确处理嵌套对象', async () => {
      const nestedObject = {
        level1: {
          level2: {
            level3: {
              value: 'deeply-nested'
            }
          }
        }
      };
      await cacheLayer.set('nested-key', nestedObject);
      const result = await cacheLayer.get('nested-key');
      expect(result.value).toEqual(nestedObject);
    });

    it('应该正确处理复杂嵌套结构', async () => {
      const complexObject = {
        users: [
          { id: 1, name: 'User1', roles: ['admin', 'user'] },
          { id: 2, name: 'User2', roles: ['user'] }
        ],
        metadata: {
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }
      };
      await cacheLayer.set('complex-key', complexObject);
      const result = await cacheLayer.get('complex-key');
      expect(result.value).toEqual(complexObject);
    });
  });
});
