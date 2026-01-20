/**
 * @file metrics.ts - 性能指标收集系统
 * @description YYC³ MovAISys 智能浮窗系统 - 基础设施层
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

import { logger } from './logger';

/**
 * 指标类型
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

/**
 * 指标数据点
 */
interface MetricData {
  name: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

/**
 * 指标配置
 */
interface MetricsConfig {
  enabled: boolean;
  flushInterval: number;
  maxBufferSize: number;
}

/**
 * 性能指标收集器
 *
 * 设计理念：
 * 1. 四种指标类型：Counter、Gauge、Histogram、Summary
 * 2. 支持标签系统，便于多维度分析
 * 3. 批量发送，减少网络开销
 * 4. 内存缓冲，防止内存泄漏
 */
export class MetricsCollector {
  private config: MetricsConfig;
  private buffer: MetricData[] = [];
  private flushTimer?: ReturnType<typeof setInterval>;
  private metrics: Map<string, Map<string, number>> = new Map();

  constructor(config: Partial<MetricsConfig> = {}) {
    this.config = {
      enabled: config.enabled !== false,
      flushInterval: config.flushInterval || 10000, // 10秒
      maxBufferSize: config.maxBufferSize || 1000
    };

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * 启动自动刷新定时器
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * 记录指标
   */
  private record(data: MetricData): void {
    if (!this.config.enabled) {
      return;
    }

    // 添加到缓冲区
    this.buffer.push(data);

    // 检查缓冲区大小
    if (this.buffer.length >= this.config.maxBufferSize) {
      this.flush();
    }

    // 更新内存指标
    this.updateInMemoryMetrics(data);
  }

  /**
   * 更新内存中的指标
   */
  private updateInMemoryMetrics(data: MetricData): void {
    const labelsKey = JSON.stringify(data.labels || {});

    if (!this.metrics.has(data.name)) {
      this.metrics.set(data.name, new Map());
    }

    const metricMap = this.metrics.get(data.name)!;

    if (data.type === MetricType.COUNTER) {
      const current = metricMap.get(labelsKey) || 0;
      metricMap.set(labelsKey, current + data.value);
    } else if (data.type === MetricType.GAUGE) {
      metricMap.set(labelsKey, data.value);
    } else {
      // Histogram和Summary
      const current = metricMap.get(labelsKey) || 0;
      metricMap.set(labelsKey, current + data.value);
    }
  }

  /**
   * 刷新指标到存储
   */
  private flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    logger.debug('刷新指标', 'Metrics', {
      count: this.buffer.length
    });

    // TODO: 发送到Prometheus、InfluxDB等存储系统
    // 这里简化为清空缓冲区
    this.buffer = [];
  }

  // ============ 公共指标方法 ============

  /**
   * Counter：计数器，只能增加
   */
  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.record({
      name,
      type: MetricType.COUNTER,
      value,
      timestamp: new Date(),
      labels
    });
  }

  /**
   * Gauge：仪表盘，可以增减
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.record({
      name,
      type: MetricType.GAUGE,
      value,
      timestamp: new Date(),
      labels
    });
  }

  /**
   * Histogram：直方图，记录分布
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void {
    this.record({
      name,
      type: MetricType.HISTOGRAM,
      value,
      timestamp: new Date(),
      labels
    });
  }

  /**
   * Summary：摘要，记录统计信息
   */
  summary(name: string, value: number, labels?: Record<string, string>): void {
    this.record({
      name,
      type: MetricType.SUMMARY,
      value,
      timestamp: new Date(),
      labels
    });
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};

    Array.from(this.metrics.entries()).forEach(([name, metricMap]) => {
      result[name] = {};
      Array.from(metricMap.entries()).forEach(([labels, value]) => {
        result[name][labels] = value;
      });
    });

    return result;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// ============ 全局指标实例 ============

export const metrics = new MetricsCollector({
  enabled: process.env.NODE_ENV === 'production',
  flushInterval: 10000,
  maxBufferSize: 1000
});

// 导出便捷方法
export const { increment, gauge, histogram, summary } = metrics;
