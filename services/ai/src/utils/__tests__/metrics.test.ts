/**
 * @file 性能指标收集系统测试
 * @description 测试Metrics类的功能
 * @module utils/__tests__/metrics.test.ts
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { metrics } from '../metrics';

describe('Metrics', () => {
  beforeEach(() => {
    // 清除所有指标
    metrics.clear();
  });

  describe('Counter', () => {
    it('应该增加计数器的值', () => {
      metrics.increment('test.counter', 1);
      metrics.increment('test.counter', 2);

      const counter = metrics.getMetric('test.counter');
      expect(counter?.value).toBe(3);
    });

    it('应该支持标签', () => {
      metrics.increment('test.counter', 1, { label1: 'value1' });
      metrics.increment('test.counter', 2, { label1: 'value2' });

      const counter1 = metrics.getMetric('test.counter', { label1: 'value1' });
      const counter2 = metrics.getMetric('test.counter', { label1: 'value2' });

      expect(counter1?.value).toBe(1);
      expect(counter2?.value).toBe(2);
    });
  });

  describe('Gauge', () => {
    it('应该设置仪表盘的值', () => {
      metrics.gauge('test.gauge', 100);
      metrics.gauge('test.gauge', 200);

      const gauge = metrics.getMetric('test.gauge');
      expect(gauge?.value).toBe(200);
    });

    it('应该支持标签', () => {
      metrics.gauge('test.gauge', 100, { type: 'memory' });
      metrics.gauge('test.gauge', 200, { type: 'cpu' });

      const gauge1 = metrics.getMetric('test.gauge', { type: 'memory' });
      const gauge2 = metrics.getMetric('test.gauge', { type: 'cpu' });

      expect(gauge1?.value).toBe(100);
      expect(gauge2?.value).toBe(200);
    });
  });

  describe('Histogram', () => {
    it('应该记录直方图的值', () => {
      metrics.histogram('test.histogram', 100);
      metrics.histogram('test.histogram', 200);
      metrics.histogram('test.histogram', 300);

      const histogram = metrics.getMetric('test.histogram');
      expect(histogram?.type).toBe('histogram');
    });

    it('应该计算百分位数', () => {
      metrics.histogram('test.histogram', 100);
      metrics.histogram('test.histogram', 200);
      metrics.histogram('test.histogram', 300);

      const histogram = metrics.getMetric('test.histogram') as any;
      expect(histogram?.value.p50).toBeDefined();
      expect(histogram?.value.p95).toBeDefined();
      expect(histogram?.value.p99).toBeDefined();
    });
  });

  describe('Summary', () => {
    it('应该记录摘要的值', () => {
      metrics.summary('test.summary', 100);
      metrics.summary('test.summary', 200);
      metrics.summary('test.summary', 300);

      const summary = metrics.getMetric('test.summary');
      expect(summary?.type).toBe('summary');
    });
  });

  describe('getAllMetrics', () => {
    it('应该返回所有指标', () => {
      metrics.increment('test.counter', 1);
      metrics.gauge('test.gauge', 100);
      metrics.histogram('test.histogram', 150);

      const allMetrics = metrics.getAllMetrics();

      expect(Object.keys(allMetrics)).toHaveLength(3);
      expect(allMetrics['test.counter']).toBeDefined();
      expect(allMetrics['test.gauge']).toBeDefined();
      expect(allMetrics['test.histogram']).toBeDefined();
    });
  });

  describe('clear', () => {
    it('应该清除所有指标', () => {
      metrics.increment('test.counter', 1);
      metrics.gauge('test.gauge', 100);

      metrics.clear();

      const allMetrics = metrics.getAllMetrics();
      expect(Object.keys(allMetrics)).toHaveLength(0);
    });
  });
});
