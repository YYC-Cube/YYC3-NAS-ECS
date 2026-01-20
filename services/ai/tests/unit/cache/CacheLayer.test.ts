/**
 * @file 缓存层测试
 * @description 测试智能缓存层的核心功能
 * @module __tests__/unit/cache/CacheLayer.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  IntelligentCacheLayer,
  CacheLevel,
  CacheStrategy,
  CacheConfig,
  CacheGetOptions,
  CacheSetOptions,
} from '@/cache/CacheLayer';

describe('IntelligentCacheLayer', () => {
  let cache: IntelligentCacheLayer;

  beforeEach(() => {
    cache = new IntelligentCacheLayer({
      l1Size: 100,
      l1TTL: 1000,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('初始化', () => {
    it('应该成功创建缓存层实例', () => {
      expect(cache).toBeDefined();
      expect(cache).toBeInstanceOf(IntelligentCacheLayer);
    });

    it('应该使用默认配置', () => {
      const defaultCache = new IntelligentCacheLayer();
      expect(defaultCache).toBeDefined();
      defaultCache.destroy();
    });

    it('应该使用自定义配置', () => {
      const customCache = new IntelligentCacheLayer({
        l1Size: 200,
        l1TTL: 2000,
        enableCompression: false,
      });
      expect(customCache).toBeDefined();
      customCache.destroy();
    });
  });

  describe('set', () => {
    it('应该成功设置缓存值', async () => {
      await cache.set('key1', 'value1');
      const result = await cache.get('key1');
      expect(result.hit).toBe(true);
      expect(result.value).toBe('value1');
    });

    it('应该支持对象类型', async () => {
      const obj = { name: 'test', value: 123 };
      await cache.set('obj-key', obj);
      const result = await cache.get('obj-key');
      expect(result.hit).toBe(true);
      expect(result.value).toEqual(obj);
    });

    it('应该支持数组类型', async () => {
      const arr = [1, 2, 3, 4, 5];
      await cache.set('arr-key', arr);
      const result = await cache.get('arr-key');
      expect(result.hit).toBe(true);
      expect(result.value).toEqual(arr);
    });

    it('应该支持自定义TTL', async () => {
      await cache.set('ttl-key', 'value', { ttl: 100 });
      const result = await cache.get('ttl-key');
      expect(result.hit).toBe(true);
    });

    it('应该支持标签', async () => {
      await cache.set('tag-key', 'value', { tags: ['user', 'profile'] });
      const result = await cache.get('tag-key');
      expect(result.hit).toBe(true);
    });

    it('应该支持元数据', async () => {
      await cache.set('meta-key', 'value', { metadata: { source: 'api' } });
      const result = await cache.get('meta-key');
      expect(result.hit).toBe(true);
    });

    it('应该覆盖已存在的键', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key1', 'value2');
      const result = await cache.get('key1');
      expect(result.value).toBe('value2');
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', { name: 'test' });
    });

    it('应该成功获取缓存值', async () => {
      const result = await cache.get('key1');
      expect(result.hit).toBe(true);
      expect(result.value).toBe('value1');
      expect(result.source).toBe('L1');
    });

    it('应该返回未命中的结果', async () => {
      const result = await cache.get('non-existent-key');
      expect(result.hit).toBe(false);
      expect(result.value).toBeNull();
    });

    it('应该支持加载器函数', async () => {
      const loader = vi.fn().mockResolvedValue('loaded-value');
      const result = await cache.get('new-key', { loader });
      expect(loader).toHaveBeenCalled();
      expect(result.value).toBe('loaded-value');
    });

    it('应该强制刷新缓存', async () => {
      const loader = vi.fn().mockResolvedValue('new-value');
      const result = await cache.get('key1', { loader, forceRefresh: true });
      expect(loader).toHaveBeenCalled();
      expect(result.value).toBe('new-value');
    });

    it('应该返回缓存元数据', async () => {
      const result = await cache.get('key1');
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
    });

    it('应该成功删除缓存项', async () => {
      await cache.delete('key1');
      const result = await cache.get('key1');
      expect(result.hit).toBe(false);
    });

    it('应该保留其他缓存项', async () => {
      await cache.delete('key1');
      const result = await cache.get('key2');
      expect(result.hit).toBe(true);
    });

    it('应该处理不存在的键', async () => {
      await expect(cache.delete('non-existent-key')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    beforeEach(async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');
    });

    it('应该清空所有缓存', async () => {
      await cache.clear();
      const result1 = await cache.get('key1');
      const result2 = await cache.get('key2');
      const result3 = await cache.get('key3');
      expect(result1.hit).toBe(false);
      expect(result2.hit).toBe(false);
      expect(result3.hit).toBe(false);
    });

    it('应该清空指定级别的缓存', async () => {
      await cache.clear(CacheLevel.L1);
      const metrics = cache.getMetrics(CacheLevel.L1);
      expect(metrics.entries).toBe(0);
    });
  });

  describe('invalidateByTag', () => {
    beforeEach(async () => {
      await cache.set('user1', 'data1', { tags: ['user'] });
      await cache.set('user2', 'data2', { tags: ['user'] });
      await cache.set('profile1', 'data3', { tags: ['profile'] });
    });

    it('应该根据标签失效缓存', async () => {
      await cache.invalidateByTag('user');
      const result1 = await cache.get('user1');
      const result2 = await cache.get('user2');
      const result3 = await cache.get('profile1');
      expect(result1.hit).toBe(false);
      expect(result2.hit).toBe(false);
      expect(result3.hit).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('应该返回缓存指标', () => {
      const metrics = cache.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics).toBeInstanceOf(Map);
    });

    it('应该返回指定级别的指标', () => {
      const metrics = cache.getMetrics(CacheLevel.L1);
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics).toHaveProperty('hitRate');
    });

    it('应该正确记录命中次数', async () => {
      await cache.set('key1', 'value1');
      await cache.get('key1');
      const metrics = cache.getMetrics(CacheLevel.L1);
      expect(metrics.hits).toBeGreaterThan(0);
    });

    it('应该正确记录未命中次数', async () => {
      await cache.get('non-existent-key');
      const metrics = cache.getMetrics(CacheLevel.L1);
      expect(metrics.misses).toBeGreaterThan(0);
    });

    it('应该正确计算命中率', async () => {
      await cache.set('key1', 'value1');
      await cache.get('key1');
      await cache.get('non-existent-key');
      const metrics = cache.getMetrics(CacheLevel.L1);
      expect(metrics.hitRate).toBeGreaterThan(0);
    });
  });

  describe('getHealthStatus', () => {
    it('应该返回健康状态', () => {
      const health = cache.getHealthStatus();
      expect(health).toBeDefined();
      expect(health).toBeInstanceOf(Map);
    });

    it('应该返回指定级别的健康状态', () => {
      const health = cache.getHealthStatus(CacheLevel.L1);
      expect(health).toBeDefined();
      expect(health).toHaveProperty('level');
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('memoryUsage');
      expect(health).toHaveProperty('hitRate');
    });
  });

  describe('warmUp', () => {
    it('应该预热缓存', async () => {
      const loader = vi.fn()
        .mockResolvedValueOnce('value1')
        .mockResolvedValueOnce('value2')
        .mockResolvedValueOnce('value3');

      await cache.warmUp(['key1', 'key2', 'key3'], loader);

      expect(loader).toHaveBeenCalledTimes(3);
      const result1 = await cache.get('key1');
      const result2 = await cache.get('key2');
      const result3 = await cache.get('key3');
      expect(result1.hit).toBe(true);
      expect(result2.hit).toBe(true);
      expect(result3.hit).toBe(true);
    });
  });

  describe('TTL过期', () => {
    it('应该过期已过期的缓存项', async () => {
      await cache.set('expire-key', 'value', { ttl: 50 });
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      const result = await cache.get('expire-key');
      expect(result.hit).toBe(false);
    });

    it('应该保留未过期的缓存项', async () => {
      await cache.set('valid-key', 'value', { ttl: 5000 });
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      const result = await cache.get('valid-key');
      expect(result.hit).toBe(true);
    });
  });

  describe('缓存策略', () => {
    it('应该支持LRU策略', async () => {
      const lruCache = new IntelligentCacheLayer({
        l1Size: 20,
        strategy: CacheStrategy.LRU,
      });

      await lruCache.set('key1', 'value1');
      await lruCache.set('key2', 'value2');
      await lruCache.get('key1');
      await lruCache.set('key3', 'value3');

      const metrics = lruCache.getMetrics(CacheLevel.L1);
      expect(metrics.evictions).toBeGreaterThan(0);

      lruCache.destroy();
    });

    it('应该支持LFU策略', async () => {
      const lfuCache = new IntelligentCacheLayer({
        l1Size: 20,
        strategy: CacheStrategy.LFU,
      });

      await lfuCache.set('key1', 'value1');
      await lfuCache.set('key2', 'value2');
      await lfuCache.get('key1');
      await lfuCache.get('key1');
      await lfuCache.set('key3', 'value3');

      const metrics = lfuCache.getMetrics(CacheLevel.L1);
      expect(metrics.evictions).toBeGreaterThan(0);

      lfuCache.destroy();
    });
  });

  describe('destroy', () => {
    it('应该清理所有缓存', async () => {
      await cache.set('key1', 'value1');
      cache.destroy();
      
      const metrics = cache.getMetrics();
      expect(metrics).toBeInstanceOf(Map);
    });
  });

  describe('集成测试', () => {
    it('应该支持完整的缓存生命周期', async () => {
      await cache.set('key1', 'value1');
      const getResult = await cache.get('key1');
      expect(getResult.hit).toBe(true);

      await cache.set('key1', 'value2');
      const updatedResult = await cache.get('key1');
      expect(updatedResult.value).toBe('value2');

      await cache.delete('key1');
      const deletedResult = await cache.get('key1');
      expect(deletedResult.hit).toBe(false);
    });

    it('应该支持批量操作', async () => {
      const keys = ['key1', 'key2', 'key3'];
      for (const key of keys) {
        await cache.set(key, `value-${key}`);
      }

      for (const key of keys) {
        const result = await cache.get(key);
        expect(result.hit).toBe(true);
      }

      await cache.clear();
      for (const key of keys) {
        const result = await cache.get(key);
        expect(result.hit).toBe(false);
      }
    });
  });
});