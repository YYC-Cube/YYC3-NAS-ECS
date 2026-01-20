/**
 * @file 数据洞察仪表板组件实现
 * @description 实现IInsightsDashboard接口，提供数据可视化和洞察功能
 * @module ui/InsightsDashboard
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';
import {
  IInsightsDashboard,
  MetricData,
  ChartData,
  Insight,
  ExportFormat,
} from './types';

export class InsightsDashboard extends EventEmitter implements IInsightsDashboard {
  private metrics: Map<string, MetricData>;
  private charts: Map<string, ChartData>;
  private insights: Map<string, Insight>;
  private visible: boolean;
  private autoRefresh: boolean;
  private refreshInterval: number | null;

  constructor() {
    super();
    this.metrics = new Map();
    this.charts = new Map();
    this.insights = new Map();
    this.visible = true;
    this.autoRefresh = false;
    this.refreshInterval = null;
    this.initializeDefaultMetrics();
  }

  private initializeDefaultMetrics(): void {
    this.addMetric({
      id: 'messages-sent',
      name: '发送消息数',
      value: 0,
      unit: '条',
      trend: 'up',
      change: 0,
      timestamp: Date.now(),
    });

    this.addMetric({
      id: 'response-time',
      name: '平均响应时间',
      value: 0,
      unit: 'ms',
      trend: 'stable',
      change: 0,
      timestamp: Date.now(),
    });

    this.addMetric({
      id: 'active-sessions',
      name: '活跃会话数',
      value: 0,
      unit: '个',
      trend: 'stable',
      change: 0,
      timestamp: Date.now(),
    });

    this.addMetric({
      id: 'tools-used',
      name: '工具使用次数',
      value: 0,
      unit: '次',
      trend: 'up',
      change: 0,
      timestamp: Date.now(),
    });
  }

  addMetric(metric: MetricData): void {
    const existing = this.metrics.get(metric.id);
    
    if (existing) {
      metric.change = metric.value - existing.value;
      if (metric.change > 0) {
        metric.trend = 'up';
      } else if (metric.change < 0) {
        metric.trend = 'down';
      } else {
        metric.trend = 'stable';
      }
    }

    this.metrics.set(metric.id, metric);
    this.emit('metric:added', metric);
  }

  removeMetric(metricId: string): void {
    const metric = this.metrics.get(metricId);
    if (metric) {
      this.metrics.delete(metricId);
      this.emit('metric:removed', metricId);
    }
  }

  getMetrics(): MetricData[] {
    return Array.from(this.metrics.values());
  }

  addChart(chart: ChartData): void {
    this.charts.set(chart.id, chart);
    this.emit('chart:added', chart);
  }

  removeChart(chartId: string): void {
    const chart = this.charts.get(chartId);
    if (chart) {
      this.charts.delete(chartId);
      this.emit('chart:removed', chartId);
    }
  }

  getCharts(): ChartData[] {
    return Array.from(this.charts.values());
  }

  addInsight(insight: Insight): void {
    this.insights.set(insight.id, insight);
    this.emit('insight:added', insight);
  }

  removeInsight(insightId: string): void {
    const insight = this.insights.get(insightId);
    if (insight) {
      this.insights.delete(insightId);
      this.emit('insight:removed', insightId);
    }
  }

  getInsights(): Insight[] {
    return Array.from(this.insights.values())
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  private getPriorityWeight(priority: Insight['priority']): number {
    const weights = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return weights[priority];
  }

  async refresh(): Promise<void> {
    this.emit('refreshing');
    
    await Promise.all([
      this.refreshMetrics(),
      this.refreshCharts(),
      this.generateInsights(),
    ]);

    this.emit('refreshed');
  }

  private async refreshMetrics(): Promise<void> {
    for (const metric of this.metrics.values()) {
      const newValue = await this.fetchMetricValue(metric.id);
      if (newValue !== undefined) {
        const oldValue = metric.value;
        metric.value = newValue;
        metric.change = newValue - oldValue;
        metric.timestamp = Date.now();
        
        if (metric.change > 0) {
          metric.trend = 'up';
        } else if (metric.change < 0) {
          metric.trend = 'down';
        }
        
        this.emit('metric:updated', metric);
      }
    }
  }

  private async fetchMetricValue(metricId: string): Promise<number | undefined> {
    return Math.floor(Math.random() * 100);
  }

  private async refreshCharts(): Promise<void> {
    for (const chart of this.charts.values()) {
      const newData = await this.fetchChartData(chart.id);
      if (newData) {
        chart.data = newData;
        this.emit('chart:updated', chart);
      }
    }
  }

  private async fetchChartData(chartId: string): Promise<any[] | undefined> {
    const dataPoints = 10;
    return Array.from({ length: dataPoints }, (_, i) => ({
      x: i,
      y: Math.floor(Math.random() * 100),
    }));
  }

  private async generateInsights(): Promise<void> {
    const insights: Insight[] = [];

    const metrics = this.getMetrics();
    for (const metric of metrics) {
      if (metric.trend === 'up' && metric.change > 50) {
        insights.push({
          id: this.generateId(),
          type: 'success',
          title: `${metric.name}显著增长`,
          description: `${metric.name}增长了 ${metric.change} ${metric.unit}，表现良好`,
          timestamp: Date.now(),
          priority: 'medium',
        });
      } else if (metric.trend === 'down' && metric.change < -50) {
        insights.push({
          id: this.generateId(),
          type: 'warning',
          title: `${metric.name}显著下降`,
          description: `${metric.name}下降了 ${Math.abs(metric.change)} ${metric.unit}，需要关注`,
          timestamp: Date.now(),
          priority: 'high',
          actions: [
            {
              label: '查看详情',
              action: () => console.log(`查看${metric.name}详情`),
              style: 'primary',
            },
          ],
        });
      }
    }

    for (const insight of insights) {
      this.addInsight(insight);
    }
  }

  async exportData(format: ExportFormat): Promise<any> {
    const data = {
      metrics: this.getMetrics(),
      charts: this.getCharts(),
      insights: this.getInsights(),
      exportedAt: Date.now(),
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'markdown':
        return this.convertToMarkdown(data);
      case 'txt':
        return this.convertToText(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private convertToMarkdown(data: any): string {
    let markdown = '# 数据洞察报告\n\n';
    markdown += `导出时间: ${new Date(data.exportedAt).toLocaleString('zh-CN')}\n\n`;

    markdown += '## 指标数据\n\n';
    for (const metric of data.metrics) {
      markdown += `- **${metric.name}**: ${metric.value} ${metric.unit} (${metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} ${metric.change})\n`;
    }

    markdown += '\n## 洞察\n\n';
    for (const insight of data.insights) {
      markdown += `### ${this.getInsightEmoji(insight.type)} ${insight.title}\n`;
      markdown += `${insight.description}\n\n`;
    }

    return markdown;
  }

  private convertToText(data: any): string {
    let text = '数据洞察报告\n';
    text += `导出时间: ${new Date(data.exportedAt).toLocaleString('zh-CN')}\n\n`;

    text += '指标数据:\n';
    for (const metric of data.metrics) {
      text += `- ${metric.name}: ${metric.value} ${metric.unit}\n`;
    }

    text += '\n洞察:\n';
    for (const insight of data.insights) {
      text += `- ${insight.title}: ${insight.description}\n`;
    }

    return text;
  }

  private getInsightEmoji(type: Insight['type']): string {
    const emojis = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌',
    };
    return emojis[type];
  }

  show(): void {
    this.visible = true;
    this.emit('visibility:changed', { visible: true });
  }

  hide(): void {
    this.visible = false;
    this.emit('visibility:changed', { visible: false });
  }

  startAutoRefresh(intervalMs: number = 30000): void {
    this.autoRefresh = true;
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, intervalMs) as unknown as number;
    this.emit('autoRefresh:started', { interval: intervalMs });
  }

  stopAutoRefresh(): void {
    this.autoRefresh = false;
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.emit('autoRefresh:stopped');
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
