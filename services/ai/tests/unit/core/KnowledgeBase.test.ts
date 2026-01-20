/**
 * @file 知识库系统测试
 * @description 测试知识库的各项功能，包括增删改查、索引、持久化等
 * @module __tests__/unit/core/KnowledgeBase.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KnowledgeBase, KnowledgeItem, KnowledgeQuery } from '../../../core/knowledge-base/KnowledgeBase';
import { NotFoundError, InternalError, ValidationError } from '../../../core/error-handler/ErrorTypes';

describe('KnowledgeBase', () => {
  let kb: KnowledgeBase;
  let mockLocalStorage: Map<string, string>;

  beforeEach(() => {
    mockLocalStorage = new Map();
    
    const mockLocalStorageObj: any = {
      getItem: vi.fn((key: string) => mockLocalStorage.get(key) || null),
      setItem: vi.fn((key: string, value: string) => mockLocalStorage.set(key, value)),
      removeItem: vi.fn((key: string) => mockLocalStorage.delete(key)),
      clear: vi.fn(() => mockLocalStorage.clear()),
      length: 0,
      key: vi.fn((index: number) => null),
    };

    Object.defineProperty(mockLocalStorageObj, 'length', {
      get: () => mockLocalStorage.size,
    });

    Object.defineProperty(mockLocalStorageObj, 'key', {
      value: vi.fn((index: number) => {
        const keys = Array.from(mockLocalStorage.keys());
        return keys[index] || null;
      }),
    });

    global.localStorage = mockLocalStorageObj;

    kb = new KnowledgeBase({
      enablePersistence: true,
      enableIndexing: true,
      enableVersioning: true,
      maxItems: 100,
      enableEmbedding: false,
    });
  });

  afterEach(() => {
    kb.destroy();
    vi.clearAllMocks();
  });

  describe('添加知识项', () => {
    it('应该成功添加知识项', async () => {
      const item = {
        type: 'fact' as const,
        content: { name: '测试事实', value: 42 },
        metadata: { source: 'test' },
        confidence: 0.9,
        source: 'test',
        tags: ['test', 'fact'],
      };

      const id = await kb.add(item);

      expect(id).toBeDefined();
      expect(id).toMatch(/^kb_\d+_[a-z0-9]+$/);

      const retrieved = await kb.get(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.content).toEqual(item.content);
      expect(retrieved?.type).toBe('fact');
      expect(retrieved?.confidence).toBe(0.9);
    });

    it('应该自动生成创建和更新时间戳', async () => {
      const beforeTime = Date.now();
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
      };

      const id = await kb.add(item);
      const afterTime = Date.now();

      const retrieved = await kb.get(id);
      expect(retrieved?.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(retrieved?.createdAt).toBeLessThanOrEqual(afterTime);
      expect(retrieved?.updatedAt).toBe(retrieved?.createdAt);
    });

    it('应该为不同类型的知识项生成唯一ID', async () => {
      const item1 = { type: 'fact' as const, content: { data: 'test1' } };
      const item2 = { type: 'rule' as const, content: { data: 'test2' } };

      const id1 = await kb.add(item1);
      const id2 = await kb.add(item2);

      expect(id1).not.toBe(id2);
    });

    it('当知识库已满时应该抛出错误', async () => {
      const smallKb = new KnowledgeBase({ maxItems: 2 });
      const item = { type: 'fact' as const, content: { data: 'test' } };

      await smallKb.add(item);
      await smallKb.add(item);

      await expect(smallKb.add(item)).rejects.toThrow(InternalError);
      await expect(smallKb.add(item)).rejects.toThrow('Knowledge base is full');
    });

    it('应该正确更新指标', async () => {
      const metricsBefore = kb.getMetrics();
      expect(metricsBefore.totalItems).toBe(0);

      await kb.add({ type: 'fact' as const, content: { data: 'test' } });

      const metricsAfter = kb.getMetrics();
      expect(metricsAfter.totalItems).toBe(1);
      expect(metricsAfter.itemsByType['fact']).toBe(1);
    });
  });

  describe('更新知识项', () => {
    it('应该成功更新知识项', async () => {
      const item = {
        type: 'fact' as const,
        content: { name: '原始内容' },
      };

      const id = await kb.add(item);
      await kb.update(id, {
        content: { name: '更新后的内容' },
        confidence: 0.95,
      });

      const retrieved = await kb.get(id);
      expect(retrieved?.content).toEqual({ name: '更新后的内容' });
      expect(retrieved?.confidence).toBe(0.95);
      expect(retrieved?.type).toBe('fact');
    });

    it('更新时应该更新时间戳', async () => {
      const item = { type: 'fact' as const, content: { data: 'test' } };
      const id = await kb.add(item);

      const original = await kb.get(id);
      const originalUpdatedAt = original?.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));
      await kb.update(id, { content: { data: 'updated' } });

      const updated = await kb.get(id);
      expect(updated?.updatedAt).toBeGreaterThan(originalUpdatedAt!);
    });

    it('当知识项不存在时应该抛出错误', async () => {
      await expect(kb.update('nonexistent-id', { content: {} }))
        .rejects.toThrow(NotFoundError);
    });

    it('应该保留原始创建时间戳', async () => {
      const item = { type: 'fact' as const, content: { data: 'test' } };
      const id = await kb.add(item);

      const original = await kb.get(id);
      const originalCreatedAt = original?.createdAt;

      await kb.update(id, { content: { data: 'updated' } });

      const updated = await kb.get(id);
      expect(updated?.createdAt).toBe(originalCreatedAt);
    });
  });

  describe('删除知识项', () => {
    it('应该成功删除知识项', async () => {
      const item = { type: 'fact' as const, content: { data: 'test' } };
      const id = await kb.add(item);

      await kb.remove(id);

      const retrieved = await kb.get(id);
      expect(retrieved).toBeUndefined();
    });

    it('当知识项不存在时应该抛出错误', async () => {
      await expect(kb.remove('nonexistent-id'))
        .rejects.toThrow(NotFoundError);
    });

    it('应该正确更新删除后的指标', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test1' } });
      await kb.add({ type: 'rule' as const, content: { data: 'test2' } });

      const all = await kb.getAll();
      const id = all[0].id;
      await kb.remove(id);

      const metrics = kb.getMetrics();
      expect(metrics.totalItems).toBe(1);
    });

    it('删除后应该从索引中移除', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['tag1', 'tag2'],
      };
      const id = await kb.add(item);

      await kb.remove(id);

      const byTag = await kb.getByTags(['tag1']);
      expect(byTag).toHaveLength(0);
    });
  });

  describe('查询知识项', () => {
    beforeEach(async () => {
      await kb.add({
        type: 'fact' as const,
        content: { name: '事实1', value: 100 },
        tags: ['important', 'data'],
        confidence: 0.9,
      });

      await kb.add({
        type: 'rule' as const,
        content: { name: '规则1', condition: 'value > 50' },
        tags: ['rule', 'important'],
        confidence: 0.8,
      });

      await kb.add({
        type: 'pattern' as const,
        content: { name: '模式1', regex: '\\d+' },
        tags: ['pattern'],
        confidence: 0.7,
      });
    });

    it('应该按类型查询', async () => {
      const query: KnowledgeQuery = { type: 'fact' };
      const results = await kb.query(query);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('fact');
    });

    it('应该按标签查询', async () => {
      const query: KnowledgeQuery = { tags: ['important'] };
      const results = await kb.query(query);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.tags?.includes('important'))).toBe(true);
    });

    it('应该按内容查询', async () => {
      const query: KnowledgeQuery = { content: '事实1' };
      const results = await kb.query(query);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content.name).toBe('事实1');
    });

    it('应该按最小置信度查询', async () => {
      const query: KnowledgeQuery = { minConfidence: 0.85 };
      const results = await kb.query(query);

      expect(results).toHaveLength(1);
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('应该支持分页查询', async () => {
      const query: KnowledgeQuery = { offset: 0, limit: 2 };
      const results = await kb.query(query);

      expect(results).toHaveLength(2);
    });

    it('应该支持组合查询条件', async () => {
      const query: KnowledgeQuery = {
        type: 'fact',
        tags: ['important'],
        minConfidence: 0.8,
      };
      const results = await kb.query(query);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('fact');
      expect(results[0].tags?.includes('important')).toBe(true);
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('应该更新查询指标', async () => {
      const metricsBefore = kb.getMetrics();
      await kb.query({ type: 'fact' });

      const metricsAfter = kb.getMetrics();
      expect(metricsAfter.totalQueries).toBeGreaterThan(metricsBefore.totalQueries);
    });
  });

  describe('获取知识项', () => {
    it('应该通过ID获取知识项', async () => {
      const item = { type: 'fact' as const, content: { data: 'test' } };
      const id = await kb.add(item);

      const retrieved = await kb.get(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(id);
    });

    it('当ID不存在时应该返回undefined', async () => {
      const retrieved = await kb.get('nonexistent-id');
      expect(retrieved).toBeUndefined();
    });

    it('应该获取所有知识项', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test1' } });
      await kb.add({ type: 'rule' as const, content: { data: 'test2' } });
      await kb.add({ type: 'pattern' as const, content: { data: 'test3' } });

      const all = await kb.getAll();
      expect(all).toHaveLength(3);
    });

    it('应该按类型获取知识项', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test1' } });
      await kb.add({ type: 'fact' as const, content: { data: 'test2' } });
      await kb.add({ type: 'rule' as const, content: { data: 'test3' } });

      const facts = await kb.getByType('fact');
      expect(facts).toHaveLength(2);
      expect(facts.every(f => f.type === 'fact')).toBe(true);
    });

    it('应该按标签获取知识项', async () => {
      await kb.add({
        type: 'fact' as const,
        content: { data: 'test1' },
        tags: ['tag1', 'tag2'],
      });
      await kb.add({
        type: 'rule' as const,
        content: { data: 'test2' },
        tags: ['tag1'],
      });
      await kb.add({
        type: 'pattern' as const,
        content: { data: 'test3' },
        tags: ['tag2'],
      });

      const withTag1 = await kb.getByTags(['tag1']);
      expect(withTag1).toHaveLength(2);
    });
  });

  describe('搜索知识项', () => {
    beforeEach(async () => {
      await kb.add({
        type: 'fact' as const,
        content: { name: '人工智能', description: 'AI技术' },
        tags: ['AI', 'tech'],
        confidence: 0.9,
      });

      await kb.add({
        type: 'rule' as const,
        content: { name: '机器学习', description: 'ML算法' },
        tags: ['ML', 'tech'],
        confidence: 0.8,
      });

      await kb.add({
        type: 'pattern' as const,
        content: { name: '深度学习', description: 'DL模型' },
        tags: ['DL', 'tech'],
        confidence: 0.7,
      });
    });

    it('应该按查询字符串搜索', async () => {
      const results = await kb.search('人工智能');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content.name).toContain('人工智能');
    });

    it('应该限制返回结果数量', async () => {
      const results = await kb.search('tech', 2);
      expect(results).toHaveLength(2);
    });

    it('应该按相关性排序结果', async () => {
      const results = await kb.search('技术');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].confidence).toBeDefined();
    });

    it('应该在内容中匹配查询', async () => {
      const results = await kb.search('AI');
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该在标签中匹配查询', async () => {
      const results = await kb.search('AI');
      const hasMatchingTag = results.some(r => 
        r.tags?.some(tag => tag.toLowerCase().includes('ai'))
      );
      expect(hasMatchingTag).toBe(true);
    });
  });

  describe('指标管理', () => {
    it('应该返回正确的初始指标', () => {
      const metrics = kb.getMetrics();

      expect(metrics.totalItems).toBe(0);
      expect(metrics.totalQueries).toBe(0);
      expect(metrics.averageQueryTime).toBe(0);
      expect(metrics.hitRate).toBe(0);
    });

    it('应该正确计算查询指标', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test' } });
      await kb.query({ type: 'fact' });

      const metrics = kb.getMetrics();
      expect(metrics.totalQueries).toBe(1);
      expect(metrics.hitRate).toBe(1);
    });

    it('应该正确计算命中率', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test' } });
      await kb.query({ type: 'fact' });
      await kb.query({ type: 'nonexistent' });

      const metrics = kb.getMetrics();
      expect(metrics.totalQueries).toBe(2);
      expect(metrics.hitRate).toBe(0.5);
    });

    it('应该计算平均查询时间', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test' } });
      await kb.query({ type: 'fact' });

      const metrics = kb.getMetrics();
      expect(metrics.totalQueries).toBeGreaterThan(0);
    });
  });

  describe('清空知识库', () => {
    it('应该清空所有知识项', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test1' } });
      await kb.add({ type: 'rule' as const, content: { data: 'test2' } });

      await kb.clear();

      const all = await kb.getAll();
      expect(all).toHaveLength(0);
    });

    it('应该重置指标', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test' } });
      await kb.query({ type: 'fact' });

      await kb.clear();

      const metrics = kb.getMetrics();
      expect(metrics.totalItems).toBe(0);
      expect(metrics.totalQueries).toBe(0);
    });

    it('应该清空索引', async () => {
      await kb.add({
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['tag1'],
      });

      await kb.clear();

      const byTag = await kb.getByTags(['tag1']);
      expect(byTag).toHaveLength(0);
    });
  });

  describe('导出和导入', () => {
    it('应该导出知识库数据', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test1' } });
      await kb.add({ type: 'rule' as const, content: { data: 'test2' } });

      const exported = await kb.export();

      expect(exported).toBeDefined();
      const parsed = JSON.parse(exported);
      expect(parsed.items).toHaveLength(2);
      expect(parsed.exportedAt).toBeDefined();
    });

    it('应该导入知识库数据', async () => {
      const data = JSON.stringify({
        items: [
          {
            id: 'kb_1',
            type: 'fact',
            content: { data: 'imported' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      });

      await kb.import(data);

      const all = await kb.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].content).toEqual({ data: 'imported' });
    });

    it('导入后应该正确设置指标', async () => {
      const data = JSON.stringify({
        items: [
          {
            id: 'kb_1',
            type: 'fact',
            content: { data: 'test' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'kb_2',
            type: 'rule',
            content: { data: 'test' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      });

      await kb.import(data);

      const metrics = kb.getMetrics();
      expect(metrics.totalItems).toBe(2);
    });
  });

  describe('索引功能', () => {
    it('应该为标签创建索引', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['tag1', 'tag2'],
      };

      await kb.add(item);

      const results = await kb.getByTags(['tag1']);
      expect(results).toHaveLength(1);
    });

    it('应该为类型创建索引', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test' } });

      const results = await kb.getByType('fact');
      expect(results).toHaveLength(1);
    });

    it('更新时应该重建索引', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['tag1'],
      };
      const id = await kb.add(item);

      await kb.update(id, { tags: ['tag2'] });

      const withTag1 = await kb.getByTags(['tag1']);
      const withTag2 = await kb.getByTags(['tag2']);

      expect(withTag1).toHaveLength(0);
      expect(withTag2).toHaveLength(1);
    });

    it('删除时应该移除索引', async () => {
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['tag1'],
      };
      const id = await kb.add(item);

      await kb.remove(id);

      const results = await kb.getByTags(['tag1']);
      expect(results).toHaveLength(0);
    });
  });

  describe('持久化功能', () => {
    it('应该持久化知识项到localStorage', async () => {
      const item = { type: 'fact' as const, content: { data: 'test' } };
      const id = await kb.add(item);

      expect(global.localStorage.setItem).toHaveBeenCalled();
      const key = `yyc3_kb_${id}`;
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        key,
        expect.stringContaining('test')
      );
    });

    it('应该从localStorage删除知识项', async () => {
      const item = { type: 'fact' as const, content: { data: 'test' } };
      const id = await kb.add(item);

      await kb.remove(id);

      expect(global.localStorage.removeItem).toHaveBeenCalledWith(`yyc3_kb_${id}`);
    });
  });

  describe('配置选项', () => {
    it('应该支持禁用持久化', async () => {
      const noPersistKb = new KnowledgeBase({ enablePersistence: false });
      const item = { type: 'fact' as const, content: { data: 'test' } };

      await noPersistKb.add(item);

      expect(global.localStorage.setItem).not.toHaveBeenCalled();
    });

    it('应该支持禁用索引', async () => {
      const noIndexKb = new KnowledgeBase({ enableIndexing: false });
      const item = {
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['tag1'],
      };

      await noIndexKb.add(item);

      const results = await noIndexKb.getByTags(['tag1']);
      expect(results).toHaveLength(1);
    });

    it('应该支持自定义最大项目数', async () => {
      const smallKb = new KnowledgeBase({ maxItems: 3 });
      const item = { type: 'fact' as const, content: { data: 'test' } };

      await smallKb.add(item);
      await smallKb.add(item);
      await smallKb.add(item);

      await expect(smallKb.add(item)).rejects.toThrow('Knowledge base is full');
    });
  });

  describe('边界情况', () => {
    it('应该处理空查询', async () => {
      const results = await kb.query({});
      expect(results).toEqual([]);
    });

    it('应该处理不存在的类型', async () => {
      const results = await kb.getByType('nonexistent');
      expect(results).toEqual([]);
    });

    it('应该处理不存在的标签', async () => {
      const results = await kb.getByTags(['nonexistent']);
      expect(results).toEqual([]);
    });

    it('应该处理空搜索查询', async () => {
      const results = await kb.search('');
      expect(results).toEqual([]);
    });

    it('应该处理没有标签的知识项', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test' } });

      const results = await kb.getByTags(['any']);
      expect(results).toEqual([]);
    });

    it('应该处理没有置信度的知识项', async () => {
      await kb.add({ type: 'fact' as const, content: { data: 'test' } });

      const results = await kb.query({ minConfidence: 0 });
      expect(results).toHaveLength(1);
    });
  });

  describe('相关性计算', () => {
    it('应该根据内容计算相关性', async () => {
      await kb.add({
        type: 'fact' as const,
        content: { name: '人工智能', description: 'AI技术' },
        confidence: 0.9,
      });

      const results = await kb.search('人工智能');
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该根据标签计算相关性', async () => {
      await kb.add({
        type: 'fact' as const,
        content: { data: 'test' },
        tags: ['AI', 'technology'],
        confidence: 0.8,
      });

      const results = await kb.search('AI');
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该根据元数据计算相关性', async () => {
      await kb.add({
        type: 'fact' as const,
        content: { data: 'test' },
        metadata: { keywords: ['AI', 'machine learning'] },
        confidence: 0.7,
      });

      const results = await kb.search('AI');
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该根据置信度调整相关性', async () => {
      await kb.add({
        type: 'fact' as const,
        content: { name: 'AI' },
        confidence: 0.9,
      });

      await kb.add({
        type: 'fact' as const,
        content: { name: 'AI' },
        confidence: 0.5,
      });

      const results = await kb.search('AI');
      expect(results[0].confidence).toBeGreaterThanOrEqual(results[1].confidence);
    });
  });

  describe('销毁', () => {
    it('应该清理所有资源', () => {
      kb.destroy();

      const metrics = kb.getMetrics();
      expect(metrics.totalItems).toBe(0);
    });
  });
});
