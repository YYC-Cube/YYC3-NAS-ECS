/**
 * @file 性能监控模块测试
 * @description 测试PerformanceMonitor的功能和性能
 * @module performance/monitor.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-02-03
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PerformanceMonitor,
  getPerformanceMonitor,
  disposePerformanceMonitor,
  PerformanceMetric,
  PerformanceReport,
} from '../monitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor(100);
  });

  afterEach(() => {
    monitor.dispose();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(monitor.isEnabled()).toBe(true);
      expect(monitor.getAllMetrics()).toEqual([]);
      expect(monitor.getEntries()).toEqual([]);
    });

    it('should initialize with custom maxEntries', () => {
      const customMonitor = new PerformanceMonitor(50);
      expect(customMonitor.isEnabled()).toBe(true);
      customMonitor.dispose();
    });
  });

  describe('startEntry', () => {
    it('should start a new entry and return id', () => {
      const id = monitor.startEntry('test-entry');
      expect(id).toBeTruthy();
      expect(id.length).toBeGreaterThan(0);
    });

    it('should add entry to entries array', () => {
      monitor.startEntry('test-entry');
      expect(monitor.getEntries()).toHaveLength(1);
      expect(monitor.getEntries()[0].name).toBe('test-entry');
    });

    it('should include metadata in entry', () => {
      const metadata = { key: 'value' };
      monitor.startEntry('test-entry', metadata);
      expect(monitor.getEntries()[0].metadata).toEqual(metadata);
    });

    it('should not start entry when disabled', () => {
      monitor.disable();
      const id = monitor.startEntry('test-entry');
      expect(id).toBe('');
      expect(monitor.getEntries()).toHaveLength(0);
      monitor.enable();
    });
  });

  describe('endEntry', () => {
    it('should end an existing entry', () => {
      const id = monitor.startEntry('test-entry');
      monitor.endEntry(id);
      const entries = monitor.getEntries();
      expect(entries[0].duration).toBeGreaterThan(0);
      expect(entries[0].endTime).toBeDefined();
    });

    it('should not end non-existent entry', () => {
      monitor.endEntry('non-existent-id');
      const entries = monitor.getEntries();
      expect(entries).toHaveLength(0);
    });

    it('should merge metadata when ending entry', () => {
      const id = monitor.startEntry('test-entry', { initial: 'data' });
      monitor.endEntry(id, { final: 'data' });
      const entries = monitor.getEntries();
      expect(entries[0].metadata).toEqual({ initial: 'data', final: 'data' });
    });
  });

  describe('measure', () => {
    it('should measure async function execution time', async () => {
      const testFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      };
      await monitor.measure('test-measure', testFn);
      const entries = monitor.getEntries();
      expect(entries[0].duration).toBeGreaterThanOrEqual(100);
      expect(entries[0].metadata?.success).toBe(true);
    });

    it('should handle errors in measured function', async () => {
      const errorFn = async () => {
        throw new Error('Test error');
      };
      await expect(monitor.measure('test-measure', errorFn)).rejects.toThrow('Test error');
      const entries = monitor.getEntries();
      expect(entries[0].metadata?.success).toBe(false);
      expect(entries[0].metadata?.error).toBeDefined();
    });

    it('should work with synchronous functions', () => {
      const syncFn = () => {
        return 'result';
      };
      monitor.measure('test-measure', syncFn);
      const entries = monitor.getEntries();
      expect(entries[0].duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('addMetric', () => {
    it('should add a metric', () => {
      const metric: PerformanceMetric = {
        id: 'test-metric',
        name: 'Test Metric',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'timing',
      };
      monitor.addMetric(metric);
      expect(monitor.getMetric('test-metric')).toEqual(metric);
    });

    it('should replace existing metric with same id', () => {
      const metric1: PerformanceMetric = {
        id: 'test-metric',
        name: 'Test Metric 1',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'timing',
      };
      const metric2: PerformanceMetric = {
        id: 'test-metric',
        name: 'Test Metric 2',
        value: 200,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'timing',
      };
      monitor.addMetric(metric1);
      monitor.addMetric(metric2);
      expect(monitor.getMetric('test-metric')).toEqual(metric2);
    });

    it('should not add metric when disabled', () => {
      monitor.disable();
      const metric: PerformanceMetric = {
        id: 'test-metric',
        name: 'Test Metric',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'timing',
      };
      monitor.addMetric(metric);
      expect(monitor.getMetric('test-metric')).toBeUndefined();
      monitor.enable();
    });
  });

  describe('getMetric', () => {
    it('should return metric by id', () => {
      const metric: PerformanceMetric = {
        id: 'test-metric',
        name: 'Test Metric',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'timing',
      };
      monitor.addMetric(metric);
      expect(monitor.getMetric('test-metric')).toEqual(metric);
    });

    it('should return undefined for non-existent metric', () => {
      expect(monitor.getMetric('non-existent')).toBeUndefined();
    });
  });

  describe('getAllMetrics', () => {
    it('should return all metrics', () => {
      const metric1: PerformanceMetric = {
        id: 'metric-1',
        name: 'Metric 1',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'timing',
      };
      const metric2: PerformanceMetric = {
        id: 'metric-2',
        name: 'Metric 2',
        value: 200,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'timing',
      };
      monitor.addMetric(metric1);
      monitor.addMetric(metric2);
      expect(monitor.getAllMetrics()).toHaveLength(2);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      const metric: PerformanceMetric = {
        id: 'test-metric',
        name: 'Test Metric',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'timing',
      };
      monitor.addMetric(metric);
      monitor.clearMetrics();
      expect(monitor.getAllMetrics()).toHaveLength(0);
    });
  });

  describe('clearEntries', () => {
    it('should clear all entries', () => {
      monitor.startEntry('test-entry');
      monitor.clearEntries();
      expect(monitor.getEntries()).toHaveLength(0);
    });
  });

  describe('generateReport', () => {
    it('should generate report with metrics and entries', () => {
      const metric: PerformanceMetric = {
        id: 'test-metric',
        name: 'Test Metric',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'timing',
      };
      monitor.addMetric(metric);
      monitor.startEntry('test-entry');
      monitor.endEntry(monitor.getEntries()[0].name);

      const report: PerformanceReport = monitor.generateReport();
      expect(report.metrics).toHaveLength(1);
      expect(report.entries).toHaveLength(1);
      expect(report.summary.totalEntries).toBe(1);
      expect(report.summary.averageDuration).toBeGreaterThan(0);
    });

    it('should calculate average duration correctly', () => {
      monitor.startEntry('entry-1');
      monitor.endEntry(monitor.getEntries()[0].name);
      monitor.startEntry('entry-2');
      monitor.endEntry(monitor.getEntries()[1].name);

      const report: PerformanceReport = monitor.generateReport();
      expect(report.summary.averageDuration).toBeGreaterThan(0);
    });

    it('should identify slowest and fastest entries', () => {
      monitor.startEntry('fast-entry');
      monitor.endEntry(monitor.getEntries()[0].name);
      monitor.startEntry('slow-entry');
      setTimeout(() => {
        monitor.endEntry(monitor.getEntries()[1].name);
        const report: PerformanceReport = monitor.generateReport();
        expect(report.summary.fastestEntry?.name).toBe('fast-entry');
        expect(report.summary.slowestEntry?.name).toBe('slow-entry');
      }, 200);
    });
  });

  describe('enable/disable', () => {
    it('should enable and disable monitoring', () => {
      expect(monitor.isEnabled()).toBe(true);
      monitor.disable();
      expect(monitor.isEnabled()).toBe(false);
      monitor.enable();
      expect(monitor.isEnabled()).toBe(true);
    });

    it('should prevent operations when disabled', () => {
      monitor.disable();
      monitor.startEntry('test-entry');
      expect(monitor.getEntries()).toHaveLength(0);
      monitor.enable();
    });
  });

  describe('trimEntries', () => {
    it('should trim entries when exceeding maxEntries', () => {
      const smallMonitor = new PerformanceMonitor(5);
      for (let i = 0; i < 10; i++) {
        smallMonitor.startEntry(`entry-${i}`);
      }
      expect(smallMonitor.getEntries().length).toBeLessThanOrEqual(5);
      smallMonitor.dispose();
    });
  });

  describe('dispose', () => {
    it('should clear all data', () => {
      monitor.addMetric({
        id: 'test-metric',
        name: 'Test Metric',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
        category: 'timing',
      });
      monitor.startEntry('test-entry');
      monitor.dispose();
      expect(monitor.getAllMetrics()).toHaveLength(0);
      expect(monitor.getEntries()).toHaveLength(0);
    });
  });
});

describe('getPerformanceMonitor', () => {
  afterEach(() => {
    disposePerformanceMonitor();
  });

  it('should return singleton instance', () => {
    const monitor1 = getPerformanceMonitor();
    const monitor2 = getPerformanceMonitor();
    expect(monitor1).toBe(monitor2);
  });

  it('should create new instance on first call', () => {
    const monitor = getPerformanceMonitor();
    expect(monitor).toBeInstanceOf(PerformanceMonitor);
  });
});

describe('disposePerformanceMonitor', () => {
  it('should dispose global monitor', () => {
    const monitor = getPerformanceMonitor();
    disposePerformanceMonitor();
    const monitor2 = getPerformanceMonitor();
    expect(monitor).not.toBe(monitor2);
  });

  it('should handle when no monitor exists', () => {
    expect(() => disposePerformanceMonitor()).not.toThrow();
  });
});
