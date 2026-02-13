/**
 * @file 性能监控模块
 * @description 实现应用性能监控、指标收集和性能分析功能
 * @module performance/monitor
 * @author YYC³
 * @version 2.0.0
 * @updated 2026-02-03
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'timing' | 'memory' | 'network' | 'rendering' | 'custom' | 'api' | 'render';
  metadata?: Record<string, unknown>;
}

export interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  entries: PerformanceEntry[];
  summary: {
    totalEntries: number;
    totalMetrics: number;
    averageDuration: number;
    averageValues: Record<string, number>;
    minValues: Record<string, number>;
    maxValues: Record<string, number>;
    byCategory: Record<string, number>;
    slowestEntry: PerformanceEntry | null;
    fastestEntry: PerformanceEntry | null;
  };
  generatedAt: number;
}

export interface PerformanceMonitorOptions {
  maxMetrics?: number;
  maxEntries?: number;
  autoReport?: boolean;
  reportInterval?: number;
}

export interface MetricFilter {
  category?: string;
  name?: string;
  since?: number;
}

export interface ClearOptions {
  category?: string;
  name?: string;
}

type MetricListener = (metric: PerformanceMetric) => void;

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private metrics: Map<string, PerformanceMetric[]>;
  private allMetrics: PerformanceMetric[];
  private marks: Map<string, number>;
  private entries: PerformanceEntry[];
  private entryIds: Map<string, PerformanceEntry>;
  private listeners: MetricListener[];
  private enabled: boolean;
  private maxMetrics: number;
  private maxEntries: number;
  private autoReport: boolean;
  private reportInterval: number;
  private reportTimer?: NodeJS.Timeout;
  private destroyFlag: boolean;

  private constructor(options: PerformanceMonitorOptions = {}) {
    this.metrics = new Map();
    this.allMetrics = [];
    this.marks = new Map();
    this.entries = [];
    this.entryIds = new Map();
    this.listeners = [];
    this.enabled = true;
    this.maxMetrics = options.maxMetrics || 1000;
    this.maxEntries = options.maxEntries || 1000;
    this.autoReport = options.autoReport || false;
    this.reportInterval = options.reportInterval || 60000;
    this.destroyFlag = false;

    if (this.autoReport) {
      this.startAutoReport();
    }
  }

  /**
   * 获取单例实例
   */
  public static getInstance(options?: PerformanceMonitorOptions): PerformanceMonitor {
    // 如果提供了选项，创建独立实例（不作为单例）
    if (options) {
      return new PerformanceMonitor(options);
    }
    // 否则返回单例实例
    if (!PerformanceMonitor.instance || PerformanceMonitor.instance.destroyFlag) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 开始一个新的性能条目
   */
  public startEntry(name: string, metadata?: Record<string, unknown>): string {
    if (!this.enabled) {
      return '';
    }

    const id = this.generateId();
    const entry: PerformanceEntry = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.entries.push(entry);
    this.entryIds.set(id, entry);
    this.trimEntries();

    return id;
  }

  /**
   * 结束一个性能条目
   */
  public endEntry(id: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) {
      return;
    }

    const entry = this.entryIds.get(id);
    if (entry) {
      entry.endTime = performance.now();
      entry.duration = entry.endTime - entry.startTime;
      if (metadata) {
        entry.metadata = { ...entry.metadata, ...metadata };
      }
    }
  }

  /**
   * 获取指定的指标
   */
  public getMetric(id: string): PerformanceMetric | undefined {
    return this.allMetrics.find(m => m.id === id);
  }

  /**
   * 获取所有指标
   */
  public getAllMetrics(): PerformanceMetric[] {
    return [...this.allMetrics];
  }

  /**
   * 记录性能指标
   */
  public recordMetric(name: string, value: number, category: PerformanceMetric['category'] = 'custom', metadata?: Record<string, unknown>): void {
    if (!this.enabled) {
      return;
    }

    const metric: PerformanceMetric = {
      id: this.generateId(),
      name,
      value,
      unit: category === 'memory' ? 'bytes' : category === 'timing' ? 'ms' : '',
      timestamp: Date.now(),
      category,
      metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);
    this.allMetrics.push(metric);

    // 限制总指标数量
    if (this.allMetrics.length > this.maxMetrics) {
      const removed = this.allMetrics.shift()!;
      // 从名称索引中移除
      const nameArray = this.metrics.get(removed.name);
      if (nameArray) {
        const index = nameArray.indexOf(removed);
        if (index > -1) {
          nameArray.splice(index, 1);
        }
        if (nameArray.length === 0) {
          this.metrics.delete(removed.name);
        }
      }
    }

    // 通知监听器
    this.listeners.forEach(listener => listener(metric));
  }

  /**
   * 标记性能点
   */
  public mark(name: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) {
      return;
    }
    this.marks.set(name, performance.now());
    if (metadata) {
      this.entries.push({
        name: `mark_${name}`,
        startTime: performance.now(),
        metadata,
      });
      this.trimEntries();
    }
  }

  /**
   * 测量标记之间的时间或执行函数的时间
   */
  public measure(name: string, fn?: () => Promise<unknown> | unknown): Promise<unknown> | number | null {
    if (!this.enabled) {
      if (fn) {
        const result = fn();
        return result as Promise<unknown> | number | null;
      }
      return null;
    }

    if (fn) {
      const startTime = performance.now();
      const id = this.generateId();
      const entry: PerformanceEntry = {
        name: `measure_${name}`,
        startTime,
        metadata: { success: true },
      };
      this.entries.push(entry);
      this.entryIds.set(id, entry);
      this.trimEntries();

      try {
        const result = fn();
        if (result && typeof result === 'object' && 'then' in result) {
          return (result as Promise<unknown>)
            .then((r) => {
              const duration = performance.now() - startTime;
              entry.endTime = performance.now();
              entry.duration = duration;
              entry.metadata = { success: true };
              this.recordMetric(`measure_${name}`, duration, 'timing', { success: true });
              return r;
            })
            .catch((error) => {
              const duration = performance.now() - startTime;
              entry.endTime = performance.now();
              entry.duration = duration;
              entry.metadata = { success: false, error };
              this.recordMetric(`measure_${name}`, duration, 'timing', { success: false, error });
              throw error;
            });
        } else {
          const duration = performance.now() - startTime;
          entry.endTime = performance.now();
          entry.duration = duration;
          entry.metadata = { success: true };
          this.recordMetric(`measure_${name}`, duration, 'timing', { success: true });
          return result as Promise<unknown> | number | null;
        }
      } catch (error) {
        const duration = performance.now() - startTime;
        entry.endTime = performance.now();
        entry.duration = duration;
        entry.metadata = { success: false, error };
        this.recordMetric(`measure_${name}`, duration, 'timing', { success: false, error });
        throw error;
      }
    }

    if (!this.marks.has(name)) {
      return null;
    }

    const startTime = this.marks.get(name)!;
    const duration = performance.now() - startTime;

    this.recordMetric(`measure_${name}`, duration, 'timing');
    this.marks.delete(name);

    return duration;
  }

  /**
   * 测量组件渲染时间
   */
  public measureRender(componentName: string): void {
    if (!this.enabled) {
      return;
    }
    this.recordMetric(`render_${componentName}`, 0, 'render', { component: componentName });
  }

  /**
   * 测量API调用
   */
  public measureAPICall(endpoint: string, duration: number): void {
    if (!this.enabled) {
      return;
    }
    this.recordMetric(`api_${endpoint}`, duration, 'api', { endpoint });
  }

  /**
   * 测量内存使用
   */
  public measureMemory(): void {
    if (!this.enabled) {
      return;
    }

    // @ts-expect-error - memory API 是非标准的
    if (performance.memory && performance.memory.usedJSHeapSize) {
      // @ts-expect-error - memory API 是非标准的
      const used = performance.memory.usedJSHeapSize;
      this.recordMetric('memory_used', used, 'memory');
    } else {
      // 如果没有 memory API，记录一个模拟值用于测试
      this.recordMetric('memory_used', 1000000, 'memory');
    }
  }

  /**
   * 获取指标
   */
  public getMetrics(filter?: MetricFilter): PerformanceMetric[] {
    let allMetrics: PerformanceMetric[] = [];

    this.metrics.forEach((metricArray) => {
      allMetrics = allMetrics.concat(metricArray);
    });

    if (filter) {
      if (filter.category) {
        allMetrics = allMetrics.filter(m => m.category === filter.category);
      }
      if (filter.name) {
        allMetrics = allMetrics.filter(m => m.name.includes(filter.name!));
      }
      if (filter.since) {
        allMetrics = allMetrics.filter(m => m.timestamp >= filter.since!);
      }
    }

    return allMetrics;
  }

  /**
   * 获取条目
   */
  public getEntries(): PerformanceEntry[] {
    return [...this.entries];
  }

  /**
   * 清除指标（带选项）
   */
  public clearMetrics(options?: ClearOptions): void {
    if (!options) {
      this.metrics.clear();
      this.allMetrics = [];
      return;
    }

    if (options.category) {
      this.metrics.forEach((metricArray, name) => {
        const filtered = metricArray.filter(m => m.category !== options.category);
        if (filtered.length > 0) {
          this.metrics.set(name, filtered);
        } else {
          this.metrics.delete(name);
        }
      });
      this.allMetrics = this.allMetrics.filter(m => m.category !== options.category);
    }

    if (options.name) {
      this.metrics.forEach((_, name) => {
        if (name.includes(options.name!)) {
          this.metrics.delete(name);
        }
      });
      this.allMetrics = this.allMetrics.filter(m => !m.name.includes(options.name!));
    }
  }

  /**
   * 清除条目
   */
  public clearEntries(): void {
    this.entries = [];
    this.entryIds.clear();
  }

  /**
   * 生成性能报告
   */
  public generateReport(): PerformanceReport {
    const allMetrics = this.getMetrics();
    const entriesWithDuration = this.entries.filter(e => e.duration !== undefined);
    const durations = entriesWithDuration.map(e => e.duration!);

    const byCategory: Record<string, number> = {};
    allMetrics.forEach(metric => {
      byCategory[metric.category] = (byCategory[metric.category] || 0) + 1;
    });

    const averageValues: Record<string, number> = {};
    const minValues: Record<string, number> = {};
    const maxValues: Record<string, number> = {};

    allMetrics.forEach(metric => {
      if (!averageValues[metric.name]) {
        const nameMetrics = allMetrics.filter(m => m.name === metric.name);
        const values = nameMetrics.map(m => m.value);
        averageValues[metric.name] = values.reduce((a, b) => a + b, 0) / values.length;
        minValues[metric.name] = Math.min(...values);
        maxValues[metric.name] = Math.max(...values);
      }
    });

    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const slowestEntry = durations.length > 0
      ? entriesWithDuration.reduce((slowest, current) =>
          (current.duration || 0) > (slowest.duration || 0) ? current : slowest)
      : null;

    const fastestEntry = durations.length > 0
      ? entriesWithDuration.reduce((fastest, current) =>
          (current.duration || 0) < (fastest.duration || 0) ? current : fastest)
      : null;

    return {
      metrics: allMetrics,
      entries: this.getEntries(),
      summary: {
        totalEntries: this.entries.length,
        totalMetrics: allMetrics.length,
        averageDuration,
        averageValues,
        minValues,
        maxValues,
        byCategory,
        slowestEntry,
        fastestEntry,
      },
      generatedAt: Date.now(),
    };
  }

  /**
   * 添加指标
   */
  public addMetric(metric: PerformanceMetric): void {
    if (!this.enabled) {
      return;
    }

    const existingIndex = this.allMetrics.findIndex(m => m.id === metric.id);
    if (existingIndex > -1) {
      this.allMetrics[existingIndex] = metric;
      const metricArray = this.metrics.get(metric.name);
      if (metricArray) {
        const nameIndex = metricArray.findIndex(m => m.id === metric.id);
        if (nameIndex > -1) {
          metricArray[nameIndex] = metric;
        }
      }
    } else {
      this.allMetrics.push(metric);
      const metricArray = this.metrics.get(metric.name);
      if (metricArray) {
        metricArray.push(metric);
      } else {
        this.metrics.set(metric.name, [metric]);
      }

      if (this.allMetrics.length > this.maxMetrics) {
        const removed = this.allMetrics.shift()!;
        const nameArray = this.metrics.get(removed.name);
        if (nameArray) {
          const index = nameArray.indexOf(removed);
          if (index > -1) {
            nameArray.splice(index, 1);
          }
          if (nameArray.length === 0) {
            this.metrics.delete(removed.name);
          }
        }
      }
    }

    this.listeners.forEach(listener => listener(metric));
  }

  /**
   * 生成性能报告（别名）
   */
  public getReport(): PerformanceReport {
    return this.generateReport();
  }

  /**
   * 添加监听器
   */
  public addListener(listener: MetricListener): void {
    this.listeners.push(listener);
  }

  /**
   * 移除监听器
   */
  public removeListener(listener: MetricListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 启用监控
   */
  public enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用监控
   */
  public disable(): void {
    this.enabled = false;
  }

  /**
   * 是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 开始自动报告
   */
  private startAutoReport(): void {
    this.reportTimer = setInterval(() => {
      const report = this.getReport();
      // 在开发模式或测试模式下输出报告
      const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
      if (isDevOrTest) {
        console.info('[PerformanceMonitor]', report);
      }
    }, this.reportInterval);
  }

  /**
   * 修剪条目数量
   */
  private trimEntries(): void {
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁监控器
   */
  public dispose(): void {
    this.destroyFlag = true;
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = undefined;
    }
    this.metrics.clear();
    this.allMetrics = [];
    this.marks.clear();
    this.entries = [];
    this.listeners = [];
    PerformanceMonitor.instance = null;
  }
}

/**
 * React性能跟踪器
 */
export class ReactPerformanceTracker {
  private monitor: PerformanceMonitor;

  constructor(monitor?: PerformanceMonitor) {
    this.monitor = monitor || defaultInstance;
  }

  /**
   * 跟踪组件渲染
   */
  public trackComponentRender(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.monitor.recordMetric(
        `render_${componentName}`,
        duration,
        'render',
        { component: componentName }
      );
    };
  }

  /**
   * 跟踪Hook执行
   */
  public trackHook<T extends (...args: unknown[]) => unknown>(
    hookName: string,
    hookFn: T
  ): T {
    return ((...args: unknown[]) => {
      const startTime = performance.now();

      try {
        const result = hookFn(...args);
        const duration = performance.now() - startTime;

        this.monitor.recordMetric(
          `hook_${hookName}`,
          duration,
          'timing',
          { hook: hookName }
        );

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        this.monitor.recordMetric(
          `hook_${hookName}_error`,
          duration,
          'timing',
          { hook: hookName, error: true }
        );

        throw error;
      }
    }) as T;
  }

  /**
   * 跟踪异步操作
   */
  public trackAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.monitor.measure(name, fn) as Promise<T>;
  }
}

// 初始化默认实例
let defaultInstance = PerformanceMonitor.getInstance();

// 更新全局引用的函数
function updateDefaultInstance(): void {
  defaultInstance = PerformanceMonitor.getInstance();
}

// 全局实例导出
export const performanceMonitor = defaultInstance;

/**
 * 记录性能指标
 */
export function recordMetric(
  name: string,
  value: number,
  category: PerformanceMetric['category'] = 'custom',
  metadata?: Record<string, unknown>
): void {
  defaultInstance.recordMetric(name, value, category, metadata);
}

/**
 * 标记性能点
 */
export function mark(name: string, metadata?: Record<string, unknown>): void {
  defaultInstance.mark(name, metadata);
}

/**
 * 测量标记之间的时间
 */
export function measure(name: string): number | null {
  return defaultInstance.measure(name) as number | null;
}

/**
 * 测量组件渲染
 */
export function measureRender(componentName: string): void {
  defaultInstance.measureRender(componentName);
}

/**
 * 测量API调用
 */
export function measureAPICall(endpoint: string, duration: number): void {
  defaultInstance.measureAPICall(endpoint, duration);
}

/**
 * 测量内存使用
 */
export function measureMemory(): void {
  defaultInstance.measureMemory();
}

/**
 * 获取性能报告
 */
export function getPerformanceReport(): PerformanceReport {
  return defaultInstance.getReport();
}

/**
 * 清除性能指标
 */
export function clearPerformanceMetrics(options?: ClearOptions): void {
  defaultInstance.clearMetrics(options);
  defaultInstance.clearEntries();
}

/**
 * 重置性能监控器（用于测试）
 */
export function resetPerformanceMonitor(): void {
  const instance = PerformanceMonitor.getInstance();
  if (instance) {
    instance.dispose();
  }
  // 重新创建默认实例
  updateDefaultInstance();
}

/**
 * 获取性能监控器
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  return defaultInstance;
}

/**
 * 销毁性能监控器
 */
export function disposePerformanceMonitor(): void {
  const instance = PerformanceMonitor.getInstance();
  if (instance) {
    instance.dispose();
    updateDefaultInstance();
  }
}
