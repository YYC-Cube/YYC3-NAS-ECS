/**
 * @file MonitoringAgent.ts
 * @description 监控智能体 - 负责弹窗监控和性能分析
 * @module core/ai/agents
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { BaseAgent } from '../BaseAgent';
import { AgentConfig } from '../AgentProtocol';

export interface MonitoringPerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  threshold?: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export class MonitoringAgent extends BaseAgent {
  private metrics: Map<string, MonitoringPerformanceMetric[]> = new Map();
  private alerts: Alert[] = [];
  private thresholds: Map<string, number> = new Map();
  private monitoringInterval: number | null = null;

  constructor(config: AgentConfig) {
    super(config);
  }

  protected setupCapabilities(): void {
    this.addCapability({
      id: 'monitoring-metrics',
      name: '指标收集',
      description: '收集性能指标',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'monitoring-alerts',
      name: '告警',
      description: '监控并发出告警',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'monitoring-analytics',
      name: '分析',
      description: '分析性能数据',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'monitoring-report',
      name: '报告',
      description: '生成监控报告',
      version: '1.0.0',
      enabled: true
    });
  }

  protected setupCommandHandlers(): void {
    this.registerCommandHandler('recordMetric', this.handleRecordMetric.bind(this));
    this.registerCommandHandler('getMetrics', this.handleGetMetrics.bind(this));
    this.registerCommandHandler('setThreshold', this.handleSetThreshold.bind(this));
    this.registerCommandHandler('getAlerts', this.handleGetAlerts.bind(this));
    this.registerCommandHandler('clearAlerts', this.handleClearAlerts.bind(this));
    this.registerCommandHandler('analyze', this.handleAnalyze.bind(this));
    this.registerCommandHandler('generateReport', this.handleGenerateReport.bind(this));
    this.registerCommandHandler('startMonitoring', this.handleStartMonitoring.bind(this));
    this.registerCommandHandler('stopMonitoring', this.handleStopMonitoring.bind(this));
  }

  private async handleRecordMetric(params: { name: string; value: number; unit: string }): Promise<any> {
    const metric: MonitoringPerformanceMetric = {
      name: params.name,
      value: params.value,
      unit: params.unit,
      timestamp: Date.now(),
      threshold: this.thresholds.get(params.name)
    };

    if (!this.metrics.has(params.name)) {
      this.metrics.set(params.name, []);
    }

    const metricHistory = this.metrics.get(params.name)!;
    metricHistory.push(metric);

    if (metricHistory.length > 1000) {
      metricHistory.shift();
    }

    this.checkThreshold(metric);

    this.emit('monitoring:metric-recorded', {
      metric,
      timestamp: Date.now()
    });

    return { success: true, metric };
  }

  private async handleGetMetrics(params?: { name?: string; limit?: number }): Promise<any> {
    if (params?.name) {
      const metricHistory = this.metrics.get(params.name) || [];
      const limit = params.limit || 100;
      return {
        success: true,
        name: params.name,
        metrics: metricHistory.slice(-limit),
        total: metricHistory.length
      };
    }

    const allMetrics: Record<string, any> = {};
    for (const [name, history] of this.metrics.entries()) {
      const limit = params?.limit || 100;
      allMetrics[name] = history.slice(-limit);
    }

    return {
      success: true,
      metrics: allMetrics
    };
  }

  private async handleSetThreshold(params: { name: string; threshold: number }): Promise<any> {
    this.thresholds.set(params.name, params.threshold);

    this.emit('monitoring:threshold-set', {
      name: params.name,
      threshold: params.threshold,
      timestamp: Date.now()
    });

    return { success: true, name: params.name, threshold: params.threshold };
  }

  private async handleGetAlerts(params?: { type?: string; limit?: number }): Promise<any> {
    let filteredAlerts = this.alerts;

    if (params?.type) {
      filteredAlerts = this.alerts.filter(a => a.type === params.type);
    }

    const limit = params?.limit || 50;
    return {
      success: true,
      alerts: filteredAlerts.slice(-limit),
      total: filteredAlerts.length
    };
  }

  private async handleClearAlerts(params?: { type?: string }): Promise<any> {
    if (params?.type) {
      this.alerts = this.alerts.filter(a => a.type !== params.type);
    } else {
      this.alerts = [];
    }

    this.emit('monitoring:alerts-cleared', {
      type: params?.type || 'all',
      timestamp: Date.now()
    });

    return { success: true };
  }

  private async handleAnalyze(params?: { metricName?: string; period?: number }): Promise<any> {
    const period = params?.period || 3600000;
    const now = Date.now();
    const startTime = now - period;

    const analysis: any = {
      period,
      startTime,
      endTime: now,
      metrics: {}
    };

    for (const [name, history] of this.metrics.entries()) {
      if (params?.metricName && params.metricName !== name) continue;

      const recentMetrics = history.filter(m => m.timestamp >= startTime);
      if (recentMetrics.length === 0) continue;

      const values = recentMetrics.map(m => m.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      analysis.metrics[name] = {
        count: recentMetrics.length,
        sum,
        average: avg,
        min,
        max,
        trend: this.calculateTrend(recentMetrics)
      };
    }

    this.emit('monitoring:analyzed', {
      analysis,
      timestamp: Date.now()
    });

    return { success: true, analysis };
  }

  private async handleGenerateReport(params?: { format?: 'json' | 'text' }): Promise<any> {
    const format = params?.format || 'json';
    console.log(`生成监控报告，格式: ${format}`);
    
    const analysis = await this.handleAnalyze();
    const alerts = await this.handleGetAlerts();

    const report = {
      generatedAt: Date.now(),
      analysis: analysis.analysis,
      alerts: alerts.alerts,
      summary: this.generateSummary(analysis.analysis, alerts.alerts)
    };

    this.emit('monitoring:report-generated', {
      report,
      timestamp: Date.now()
    });

    return { success: true, report };
  }

  private async handleStartMonitoring(params?: { interval?: number }): Promise<any> {
    if (this.monitoringInterval) {
      return { success: false, message: '监控已在运行' };
    }

    const interval = params?.interval || 5000;

    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics();
    }, interval);

    this.emit('monitoring:started', {
      interval,
      timestamp: Date.now()
    });

    return { success: true, interval };
  }

  private async handleStopMonitoring(): Promise<any> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoring:stopped', {
      timestamp: Date.now()
    });

    return { success: true };
  }

  private checkThreshold(metric: MonitoringPerformanceMetric): void {
    if (metric.threshold && metric.value > metric.threshold) {
      const alert: Alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'warning',
        message: `指标 ${metric.name} 超过阈值`,
        metric: metric.name,
        value: metric.value,
        threshold: metric.threshold,
        timestamp: Date.now()
      };

      this.alerts.push(alert);

      this.emit('monitoring:alert-triggered', {
        alert,
        timestamp: Date.now()
      });
    }
  }

  private calculateTrend(metrics: MonitoringPerformanceMetric[]): 'up' | 'down' | 'stable' {
    if (metrics.length < 2) return 'stable';

    const first = metrics[0].value;
    const last = metrics[metrics.length - 1].value;
    const change = ((last - first) / first) * 100;

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  private generateSummary(analysis: any, alerts: any[]): any {
    return {
      totalMetrics: Object.keys(analysis.metrics).length,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter((a: any) => a.type === 'error').length,
      warningAlerts: alerts.filter((a: any) => a.type === 'warning').length
    };
  }

  private collectMetrics(): void {
    const perf = performance as any;
    if (perf && perf.memory) {
      this.handleRecordMetric({
        name: 'memory-used',
        value: perf.memory.usedJSHeapSize,
        unit: 'bytes'
      });

      this.handleRecordMetric({
        name: 'memory-total',
        value: perf.memory.totalJSHeapSize,
        unit: 'bytes'
      });
    }
  }

  getMonitoringInterval(): number | null {
    return this.monitoringInterval;
  }

  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    super.destroy();
  }
}
