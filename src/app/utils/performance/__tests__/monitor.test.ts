import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PerformanceMonitor,
  ReactPerformanceTracker,
  performanceMonitor,
  recordMetric,
  mark,
  measure,
  measureRender,
  measureAPICall,
  measureMemory,
  getPerformanceReport,
  clearPerformanceMetrics,
  PerformanceMetric,
} from '../monitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearPerformanceMetrics();
  });

  afterEach(() => {
    clearPerformanceMetrics();
  });

  describe('recordMetric', () => {
    it('应该记录性能指标', () => {
      recordMetric('test_metric', 100, 'custom');

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test_metric');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].category).toBe('custom');
    });

    it('应该限制最大指标数量', () => {
      const monitor = PerformanceMonitor.getInstance({ maxMetrics: 3 });

      for (let i = 0; i < 5; i++) {
        monitor.recordMetric(`metric_${i}`, i, 'custom');
      }

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(3);
    });
  });

  describe('mark and measure', () => {
    it('应该标记和测量性能', () => {
      mark('test_operation');

      const duration = measure('test_operation');

      expect(duration).toBeGreaterThanOrEqual(0);
      expect(typeof duration).toBe('number');
    });

    it('应该处理不存在的标记', () => {
      const duration = measure('nonexistent_mark');

      expect(duration).toBeNull();
    });

    it('应该支持元数据', () => {
      mark('test_with_meta', { key: 'value' });

      const duration = measure('test_with_meta');

      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('measureRender', () => {
    it('应该测量组件渲染时间', () => {
      measureRender('TestComponent');

      const metrics = performanceMonitor.getMetrics({ category: 'render' });
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].name).toContain('render_TestComponent');
    });
  });

  describe('measureAPICall', () => {
    it('应该测量API调用时间', () => {
      measureAPICall('/api/test', 150);

      const metrics = performanceMonitor.getMetrics({ category: 'api' });
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].name).toContain('api_/api/test');
      expect(metrics[0].value).toBe(150);
    });
  });

  describe('measureMemory', () => {
    it('应该测量内存使用', () => {
      measureMemory();

      const metrics = performanceMonitor.getMetrics({ category: 'memory' });
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].name).toBe('memory_used');
    });
  });

  describe('getMetrics', () => {
    it('应该返回所有指标', () => {
      recordMetric('metric1', 100, 'custom');
      recordMetric('metric2', 200, 'api');
      recordMetric('metric3', 300, 'render');

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(3);
    });

    it('应该按类别过滤', () => {
      recordMetric('metric1', 100, 'custom');
      recordMetric('metric2', 200, 'api');
      recordMetric('metric3', 300, 'render');

      const apiMetrics = performanceMonitor.getMetrics({ category: 'api' });
      expect(apiMetrics).toHaveLength(1);
      expect(apiMetrics[0].category).toBe('api');
    });

    it('应该按名称过滤', () => {
      recordMetric('test_metric_1', 100, 'custom');
      recordMetric('test_metric_2', 200, 'custom');
      recordMetric('other_metric', 300, 'custom');

      const testMetrics = performanceMonitor.getMetrics({ name: 'test_metric' });
      expect(testMetrics).toHaveLength(2);
    });

    it('应该按时间过滤', () => {
      const now = Date.now();
      recordMetric('old_metric', 100, 'custom');

      setTimeout(() => {
        recordMetric('new_metric', 200, 'custom');

        const recentMetrics = performanceMonitor.getMetrics({ since: now - 100 });
        expect(recentMetrics.length).toBe(1);
        expect(recentMetrics[0].name).toBe('new_metric');
      }, 150);
    });
  });

  describe('getReport', () => {
    it('应该生成性能报告', () => {
      recordMetric('metric1', 100, 'custom');
      recordMetric('metric2', 200, 'api');
      recordMetric('metric3', 300, 'render');

      const report = getPerformanceReport();

      expect(report.metrics).toHaveLength(3);
      expect(report.summary.totalMetrics).toBe(3);
      expect(report.summary.byCategory.custom).toBe(1);
      expect(report.summary.byCategory.api).toBe(1);
      expect(report.summary.byCategory.render).toBe(1);
    });

    it('应该计算平均值', () => {
      recordMetric('metric1', 100, 'custom');
      recordMetric('metric2', 200, 'custom');
      recordMetric('metric3', 300, 'custom');

      const report = getPerformanceReport();
      expect(report.summary.averageValues.metric1).toBe(100);
      expect(report.summary.averageValues.metric2).toBe(200);
      expect(report.summary.averageValues.metric3).toBe(300);
    });

    it('应该计算最小值和最大值', () => {
      recordMetric('metric1', 100, 'custom');
      recordMetric('metric2', 200, 'custom');
      recordMetric('metric3', 300, 'custom');

      const report = getPerformanceReport();
      expect(report.summary.minValues.metric1).toBe(100);
      expect(report.summary.maxValues.metric1).toBe(100);
      expect(report.summary.minValues.metric2).toBe(200);
      expect(report.summary.maxValues.metric2).toBe(200);
    });
  });

  describe('clearMetrics', () => {
    it('应该清除所有指标', () => {
      recordMetric('metric1', 100, 'custom');
      recordMetric('metric2', 200, 'api');

      clearPerformanceMetrics();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('应该按类别清除指标', () => {
      recordMetric('metric1', 100, 'custom');
      recordMetric('metric2', 200, 'api');
      recordMetric('metric3', 300, 'render');

      clearPerformanceMetrics({ category: 'api' });

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(2);
      expect(metrics.every((m: PerformanceMetric) => m.category !== 'api')).toBe(true);
    });

    it('应该按名称清除指标', () => {
      recordMetric('test_metric_1', 100, 'custom');
      recordMetric('test_metric_2', 200, 'custom');
      recordMetric('other_metric', 300, 'custom');

      clearPerformanceMetrics({ name: 'test_metric' });

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('other_metric');
    });
  });

  describe('autoReport', () => {
    it('应该自动生成报告', () => {
      return new Promise<void>((resolve) => {
        const monitor = PerformanceMonitor.getInstance({
          autoReport: true,
          reportInterval: 100,
        });

        const consoleSpy = vi.spyOn(console, 'info');

        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalled();
          monitor.dispose();
          resolve();
        }, 200);
      });
    });
  });
});

describe('ReactPerformanceTracker', () => {
  let tracker: ReactPerformanceTracker;

  beforeEach(() => {
    tracker = new ReactPerformanceTracker();
  });

  afterEach(() => {
    clearPerformanceMetrics();
  });

  describe('trackComponentRender', () => {
    it('应该跟踪组件渲染', () => {
      const trackFn = tracker.trackComponentRender('TestComponent');

      trackFn();

      const metrics = performanceMonitor.getMetrics({ category: 'render' });
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].metadata?.component).toBe('TestComponent');
    });
  });

  describe('trackHook', () => {
    it('应该跟踪Hook执行', () => {
      const mockFn = vi.fn(() => 'result');
      const trackedFn = tracker.trackHook('useTest', mockFn);

      const result = trackedFn();

      expect(mockFn).toHaveBeenCalled();
      expect(result).toBe('result');

      const metrics = performanceMonitor.getMetrics({ name: 'hook_useTest' });
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('应该跟踪Hook错误', () => {
      const mockFn = vi.fn(() => {
        throw new Error('Test error');
      });
      const trackedFn = tracker.trackHook('useTestError', mockFn);

      expect(() => trackedFn()).toThrow('Test error');

      const metrics = performanceMonitor.getMetrics({ name: 'hook_useTestError_error' });
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].metadata?.error).toBe(true);
    });
  });
});

describe('导出函数', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  it('应该正确导出recordMetric函数', () => {
    expect(recordMetric).toBeDefined();
    recordMetric('test', 100, 'custom');
    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toHaveLength(1);
  });

  it('应该正确导出mark函数', () => {
    expect(mark).toBeDefined();
    mark('test_mark');
    const duration = measure('test_mark');
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('应该正确导出measure函数', () => {
    expect(measure).toBeDefined();
    mark('test_measure');
    const duration = measure('test_measure');
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('应该正确导出measureRender函数', () => {
    expect(measureRender).toBeDefined();
    measureRender('TestComponent');
    const metrics = performanceMonitor.getMetrics({ category: 'render' });
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('应该正确导出measureAPICall函数', () => {
    expect(measureAPICall).toBeDefined();
    measureAPICall('/api/test', 150);
    const metrics = performanceMonitor.getMetrics({ category: 'api' });
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('应该正确导出measureMemory函数', () => {
    expect(measureMemory).toBeDefined();
    measureMemory();
    const metrics = performanceMonitor.getMetrics({ category: 'memory' });
    expect(metrics.length).toBeGreaterThan(0);
  });

  it('应该正确导出getPerformanceReport函数', () => {
    expect(getPerformanceReport).toBeDefined();
    recordMetric('test', 100, 'custom');
    const report = getPerformanceReport();
    expect(report.metrics).toHaveLength(1);
  });

  it('应该正确导出clearPerformanceMetrics函数', () => {
    expect(clearPerformanceMetrics).toBeDefined();
    recordMetric('test', 100, 'custom');
    clearPerformanceMetrics();
    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toHaveLength(0);
  });
});
