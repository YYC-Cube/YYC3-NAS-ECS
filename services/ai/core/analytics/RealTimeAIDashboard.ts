import {
  AIDashboard,
  AIMetrics,
  KPIOverview,
  RealTimeMonitoring,
  PredictionWidgets,
  AlertDashboard,
  SuggestionWidgets,
  DataStream,
  AlertEngine,
  KPITracker
} from './types';
import { PerformanceMonitor, PerformanceMetric, Alert } from '../monitoring/PerformanceMonitor';

export class RealTimeAIDashboard {
  private dataStream: DataStream;
  private alertEngine: AlertEngine;
  private kpiTracker: KPITracker;
  private performanceMonitor: PerformanceMonitor;
  private updateInterval?: NodeJS.Timeout;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private realTimeMetricsHistory: Map<string, any[]> = new Map();
  private maxHistorySize: number = 1000;

  constructor(performanceMonitor?: PerformanceMonitor) {
    this.dataStream = new DataStream();
    this.alertEngine = new AlertEngine();
    this.kpiTracker = new KPITracker();
    this.performanceMonitor = performanceMonitor || new PerformanceMonitor({
      enableAnomalyDetection: true,
      checkInterval: 30000
    });
  }

  async createAIDashboard(): Promise<AIDashboard> {
    const realTimeData = await this.dataStream.getRealTimeData();
    const aiEnhancedMetrics = await this.enrichWithAIMetrics(realTimeData);
    await this.alertEngine.processAlerts(aiEnhancedMetrics);
    await this.kpiTracker.trackMetrics(aiEnhancedMetrics);

    return {
      kpiOverview: await this.createKPIOverview(aiEnhancedMetrics),
      realTimeMonitoring: await this.createRealTimeMonitoring(aiEnhancedMetrics),
      predictions: await this.createPredictionWidgets(aiEnhancedMetrics),
      intelligentAlerts: await this.createAlertDashboard(aiEnhancedMetrics),
      optimizationSuggestions: await this.createSuggestionWidgets(aiEnhancedMetrics)
    };
  }

  private async createKPIOverview(metrics: AIMetrics): Promise<KPIOverview> {
    return {
      revenue: {
        current: metrics.revenue.current,
        target: metrics.revenue.target,
        trend: await this.analyzeRevenueTrend(metrics.revenue),
        prediction: await this.predictRevenue(metrics.revenue)
      },
      conversion: {
        rate: metrics.conversion.rate,
        trend: metrics.conversion.trend,
        breakdown: await this.analyzeConversionFunnel(metrics.conversion),
        optimization: await this.suggestConversionOptimizations(metrics.conversion)
      },
      customerSatisfaction: {
        score: metrics.satisfaction.score,
        trend: metrics.satisfaction.trend,
        drivers: await this.analyzeSatisfactionDrivers(metrics.satisfaction),
        improvement: await this.suggestSatisfactionImprovements(metrics.satisfaction)
      },
      operationalEfficiency: {
        callsPerHour: metrics.efficiency.callsPerHour,
        talkTime: metrics.efficiency.averageTalkTime,
        utilization: metrics.efficiency.agentUtilization,
        optimization: await this.suggestEfficiencyImprovements(metrics.efficiency)
      }
    };
  }

  private async enrichWithAIMetrics(data: any): Promise<AIMetrics> {
    return {
      revenue: {
        current: data.revenue || 0,
        target: data.target || 0,
        trend: data.trend || {}
      },
      conversion: {
        rate: data.conversionRate || 0,
        trend: data.conversionTrend || {}
      },
      satisfaction: {
        score: data.satisfactionScore || 0,
        trend: data.satisfactionTrend || {}
      },
      efficiency: {
        callsPerHour: data.callsPerHour || 0,
        averageTalkTime: data.averageTalkTime || 0,
        agentUtilization: data.agentUtilization || 0
      }
    };
  }

  private async createRealTimeMonitoring(metrics: AIMetrics): Promise<RealTimeMonitoring> {
    const systemMetrics = await this.getSystemMetrics();
    const activeAlerts = await this.performanceMonitor.getActiveAlerts();
    
    return {
      liveMetrics: {
        timestamp: new Date(),
        callsInProgress: metrics.efficiency.callsPerHour,
        averageWaitTime: metrics.efficiency.averageTalkTime,
        serviceLevel: metrics.efficiency.agentUtilization
      },
      activeAgents: [],
      queueStatus: {
        waitingCalls: 0,
        longestWaitTime: 0,
        abandonedCalls: 0
      },
      systemHealth: {
        cpuUsage: systemMetrics.cpu || 0,
        memoryUsage: systemMetrics.memory || 0,
        networkStatus: systemMetrics.networkStatus || 'healthy',
        lastUpdated: new Date(),
        activeAlerts: activeAlerts.length,
        criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length
      }
    };
  }

  private async getSystemMetrics(): Promise<{ cpu: number; memory: number; networkStatus: string }> {
    const cpuMetrics = this.performanceMonitor.getMetricsByType('cpu');
    const memoryMetrics = this.performanceMonitor.getMetricsByType('memory');
    
    let cpu = 0;
    let memory = 0;
    
    if (cpuMetrics.length > 0) {
      const latestCpu = cpuMetrics[cpuMetrics.length - 1];
      cpu = latestCpu.value;
    }
    
    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1];
      memory = latestMemory.value;
    }
    
    return {
      cpu,
      memory,
      networkStatus: 'healthy'
    };
  }

  private async createPredictionWidgets(metrics: AIMetrics): Promise<PredictionWidgets> {
    return {
      demandForecast: {
        timeframe: '24h',
        predictedVolume: metrics.efficiency.callsPerHour * 24,
        confidence: metrics.satisfaction.score / 100,
        factors: ['conversion', 'satisfaction']
      },
      churnPrediction: {
        atRiskCustomers: Math.floor(metrics.revenue.current / 100),
        riskFactors: ['low satisfaction', 'high churn'],
        recommendedActions: ['improve service', 'increase engagement']
      },
      revenueForecast: {
        period: 'monthly',
        predictedRevenue: metrics.revenue.current * 30,
        growthRate: metrics.conversion.rate * 100,
        confidence: metrics.satisfaction.score / 100
      },
      riskAlerts: []
    };
  }

  private async createAlertDashboard(metrics: AIMetrics): Promise<AlertDashboard> {
    const performanceAlerts = await this.performanceMonitor.getActiveAlerts();
    const alertHistory = await this.performanceMonitor.getAlertHistory();
    
    const activeAlerts = performanceAlerts.map(alert => ({
      id: alert.id,
      type: alert.severity === 'critical' ? 'critical' : 'warning',
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.triggeredAt,
      acknowledged: alert.status === 'acknowledged',
      metrics: alert.metrics,
      ruleId: alert.ruleId,
      ruleName: alert.ruleName
    }));
    
    if (metrics.revenue.current < metrics.revenue.target * 0.8) {
      activeAlerts.push({
        id: 'revenue-low',
        type: 'warning',
        severity: 'high' as const,
        message: 'Revenue is below 80% of target',
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    if (metrics.satisfaction.score < 70) {
      activeAlerts.push({
        id: 'satisfaction-low',
        type: 'critical',
        severity: 'critical' as const,
        message: 'Customer satisfaction is below 70',
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    if (metrics.efficiency.agentUtilization > 90) {
      activeAlerts.push({
        id: 'utilization-high',
        type: 'warning',
        severity: 'high' as const,
        message: 'Agent utilization is above 90%',
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    return {
      activeAlerts,
      alertHistory: alertHistory.slice(0, 50),
      alertTrends: await this.analyzeAlertTrends(alertHistory)
    };
  }

  private async analyzeAlertTrends(alertHistory: Alert[]): Promise<any[]> {
    const trends: any[] = [];
    const severityCounts = {
      critical: 0,
      warning: 0,
      info: 0
    };
    
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentAlerts = alertHistory.filter(a => a.triggeredAt.getTime() > last24Hours);
    
    recentAlerts.forEach(alert => {
      severityCounts[alert.severity]++;
    });
    
    trends.push({
      type: 'severity_distribution',
      data: severityCounts,
      period: '24h'
    });
    
    const hourlyAlerts = new Map<number, number>();
    recentAlerts.forEach(alert => {
      const hour = alert.triggeredAt.getHours();
      hourlyAlerts.set(hour, (hourlyAlerts.get(hour) || 0) + 1);
    });
    
    trends.push({
      type: 'hourly_distribution',
      data: Array.from(hourlyAlerts.entries()).map(([hour, count]) => ({ hour, count })),
      period: '24h'
    });
    
    return trends;
  }

  private async createSuggestionWidgets(metrics: AIMetrics): Promise<SuggestionWidgets> {
    const efficiencySuggestions = [];
    const qualitySuggestions = [];
    const customerExperienceSuggestions = [];
    
    if (metrics.efficiency.averageTalkTime > 600) {
      efficiencySuggestions.push({
        id: 'talk-time-high',
        type: 'efficiency',
        description: 'Consider training to reduce average talk time',
        expectedImpact: '15-20% improvement',
        effort: 'medium',
        priority: 'high'
      });
    }
    
    if (metrics.conversion.rate < 0.3) {
      qualitySuggestions.push({
        id: 'conversion-low',
        type: 'quality',
        description: 'Review sales scripts and agent training',
        expectedImpact: '20-30% improvement',
        effort: 'high',
        priority: 'high'
      });
    }
    
    if (metrics.satisfaction.score < 80) {
      customerExperienceSuggestions.push({
        id: 'satisfaction-improve',
        type: 'customer-experience',
        description: 'Implement customer feedback loops',
        expectedImpact: '10-15% improvement',
        effort: 'medium',
        priority: 'high'
      });
    }
    
    return {
      efficiencySuggestions,
      qualitySuggestions,
      customerExperienceSuggestions
    };
  }

  private async analyzeRevenueTrend(revenue: any): Promise<any> {
    return { revenue };
  }

  private async predictRevenue(revenue: any): Promise<any> {
    return { revenue };
  }

  private async analyzeConversionFunnel(conversion: any): Promise<any> {
    return { conversion };
  }

  private async suggestConversionOptimizations(conversion: any): Promise<any> {
    return { conversion };
  }

  private async analyzeSatisfactionDrivers(satisfaction: any): Promise<any> {
    return { satisfaction };
  }

  private async suggestSatisfactionImprovements(satisfaction: any): Promise<any> {
    return { satisfaction };
  }

  private async suggestEfficiencyImprovements(efficiency: any): Promise<any> {
    return { efficiency };
  }

  async updateRealTimeMetrics(): Promise<void> {
    await this.performanceMonitor.initialize();
  }

  async recordSystemMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<void> {
    await this.performanceMonitor.recordMetricAsync({
      ...metric,
      id: `${metric.moduleName}-${metric.metricType}-${Date.now()}`,
      timestamp: new Date()
    });
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return await this.performanceMonitor.getActiveAlerts();
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.performanceMonitor.acknowledgeAlert(alertId);
  }

  async resolveAlert(alertId: string): Promise<void> {
    await this.performanceMonitor.resolveAlert(alertId);
  }

  async addAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    return await this.performanceMonitor.addAlertRule({
      ...rule,
      id: `rule-${Date.now()}`
    });
  }

  async removeAlertRule(ruleId: string): Promise<void> {
    await this.performanceMonitor.removeAlertRule(ruleId);
  }

  async getMetricsByType(metricType: PerformanceMetric['metricType']): Promise<PerformanceMetric[]> {
    return await this.performanceMonitor.getMetricsByType(metricType);
  }

  async getMetricStats(moduleName: string, metricType: PerformanceMetric['metricType']): Promise<any> {
    return await this.performanceMonitor.getMetricStats(moduleName, metricType);
  }

  async getSystemHealth(): Promise<{
    cpu: number;
    memory: number;
    activeAlerts: number;
    criticalAlerts: number;
    lastUpdated: Date
  }> {
    const systemMetrics = await this.getSystemMetrics();
    const activeAlerts = await this.performanceMonitor.getActiveAlerts();
    
    return {
      cpu: systemMetrics.cpu,
      memory: systemMetrics.memory,
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
      lastUpdated: new Date()
    };
  }

  async getAnomalyReport(): Promise<any> {
    const allMetrics: any[] = [];
    const cpuMetrics = await this.performanceMonitor.getMetricsByType('cpu');
    const memoryMetrics = await this.performanceMonitor.getMetricsByType('memory');
    const responseTimeMetrics = await this.performanceMonitor.getMetricsByType('response_time');
    
    allMetrics.push(...cpuMetrics.map(m => ({ ...m, moduleName: 'system', metricType: 'cpu' })));
    allMetrics.push(...memoryMetrics.map(m => ({ ...m, moduleName: 'system', metricType: 'memory' })));
    allMetrics.push(...responseTimeMetrics.map(m => ({ ...m, moduleName: 'system', metricType: 'response_time' })));
    
    if (allMetrics.length === 0) {
      return {
        timestamp: new Date(),
        anomalies: [],
        severity: 'none',
        impact: 'none',
        recommendations: [],
        escalation: null
      };
    }
    
    return {
      timestamp: new Date(),
      anomalies: [],
      severity: 'none',
      impact: 'none',
      recommendations: [],
      escalation: null
    };
  }

  async startRealTimeUpdates(intervalMs: number = 5000): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    await this.performanceMonitor.initialize();

    this.updateInterval = setInterval(async () => {
      await this.updateRealTimeMetrics();
      const dashboardData = await this.createAIDashboard();
      this.notifySubscribers('dashboard', dashboardData);
      
      const systemHealth = await this.getSystemHealth();
      this.notifySubscribers('health', systemHealth);
      
      const activeAlerts = await this.getActiveAlerts();
      this.notifySubscribers('alerts', activeAlerts);
    }, intervalMs);
  }

  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    const subscribers = this.subscribers.get(eventType)!;
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  private notifySubscribers(eventType: string, data: any): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`订阅者回调错误 (${eventType}):`, error);
        }
      });
    }
  }

  async getRealTimeMetricsHistory(metricType: string, limit?: number): Promise<any[]> {
    const history = this.realTimeMetricsHistory.get(metricType) || [];
    return history.slice(-limit || this.maxHistorySize);
  }

  private addToHistory(metricType: string, data: any): void {
    if (!this.realTimeMetricsHistory.has(metricType)) {
      this.realTimeMetricsHistory.set(metricType, []);
    }
    
    const history = this.realTimeMetricsHistory.get(metricType)!;
    history.push({
      ...data,
      timestamp: new Date()
    });

    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  async getEnhancedAlertDashboard(): Promise<any> {
    const activeAlerts = await this.getActiveAlerts();
    const alertHistory = await this.performanceMonitor.getAlertHistory();
    const alertTrends = await this.analyzeAlertTrends(alertHistory);
    const systemHealth = await this.getSystemHealth();

    const enhancedAlerts = activeAlerts.map(alert => ({
      ...alert,
      trend: this.getAlertTrend(alert.id, alertHistory),
      relatedAlerts: this.findRelatedAlerts(alert, activeAlerts),
      suggestedActions: this.getSuggestedActions(alert)
    }));

    return {
      activeAlerts: enhancedAlerts,
      alertHistory: alertHistory.slice(0, 100),
      alertTrends,
      systemHealth,
      summary: {
        total: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        warning: activeAlerts.filter(a => a.severity === 'warning').length,
        info: activeAlerts.filter(a => a.severity === 'info').length
      },
      recommendations: await this.generateAlertRecommendations(activeAlerts)
    };
  }

  private getAlertTrend(alertId: string, alertHistory: any[]): string {
    const relatedAlerts = alertHistory.filter(a => 
      a.ruleId === alertId || a.message.includes(alertId)
    );
    
    if (relatedAlerts.length < 2) return 'unknown';
    
    const recentCount = relatedAlerts.filter(a => 
      Date.now() - a.triggeredAt.getTime() < 24 * 60 * 60 * 1000
    ).length;
    
    if (recentCount > 5) return 'increasing';
    if (recentCount > 2) return 'stable';
    return 'decreasing';
  }

  private findRelatedAlerts(alert: any, allAlerts: any[]): any[] {
    return allAlerts.filter(a => 
      a.id !== alert.id && 
      (a.metricType === alert.metricType || a.moduleName === alert.moduleName)
    );
  }

  private getSuggestedActions(alert: any): string[] {
    const actions: string[] = [];
    
    switch (alert.severity) {
      case 'critical':
        actions.push('立即检查相关系统');
        actions.push('通知运维团队');
        actions.push('准备应急响应方案');
        break;
      case 'warning':
        actions.push('监控告警状态');
        actions.push('分析根本原因');
        actions.push('考虑优化措施');
        break;
      case 'info':
        actions.push('记录告警信息');
        actions.push('定期审查');
        break;
    }

    if (alert.metricType === 'cpu') {
      actions.push('检查CPU密集型进程');
      actions.push('考虑扩容或优化算法');
    } else if (alert.metricType === 'memory') {
      actions.push('检查内存泄漏');
      actions.push('优化内存使用');
    } else if (alert.metricType === 'response_time') {
      actions.push('检查网络延迟');
      actions.push('优化数据库查询');
    }

    return actions;
  }

  private async generateAlertRecommendations(activeAlerts: any[]): Promise<any[]> {
    const recommendations: any[] = [];
    
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push({
        priority: 'high',
        type: 'immediate',
        message: `存在 ${criticalAlerts.length} 个严重告警，需要立即处理`,
        actions: criticalAlerts.map(a => a.id)
      });
    }

    const cpuAlerts = activeAlerts.filter(a => a.metricType === 'cpu');
    if (cpuAlerts.length > 2) {
      recommendations.push({
        priority: 'medium',
        type: 'optimization',
        message: 'CPU告警频繁，建议进行性能优化',
        actions: ['review-cpu-usage', 'optimize-algorithms', 'scale-resources']
      });
    }

    const memoryAlerts = activeAlerts.filter(a => a.metricType === 'memory');
    if (memoryAlerts.length > 2) {
      recommendations.push({
        priority: 'medium',
        type: 'optimization',
        message: '内存告警频繁，建议检查内存使用情况',
        actions: ['check-memory-leaks', 'optimize-memory', 'increase-memory']
      });
    }

    return recommendations;
  }

  async getRealTimePerformanceMetrics(): Promise<any> {
    const cpuStats = await this.performanceMonitor.getMetricStats('*', 'cpu');
    const memoryStats = await this.performanceMonitor.getMetricStats('*', 'memory');
    const responseTimeStats = await this.performanceMonitor.getMetricStats('*', 'response_time');
    const throughputStats = await this.performanceMonitor.getMetricStats('*', 'throughput');

    return {
      timestamp: new Date(),
      cpu: {
        current: cpuStats.current,
        min: cpuStats.min,
        max: cpuStats.max,
        avg: cpuStats.avg,
        trend: cpuStats.trend,
        unit: '%'
      },
      memory: {
        current: memoryStats.current,
        min: memoryStats.min,
        max: memoryStats.max,
        avg: memoryStats.avg,
        trend: memoryStats.trend,
        unit: '%'
      },
      responseTime: {
        current: responseTimeStats.current,
        min: responseTimeStats.min,
        max: responseTimeStats.max,
        avg: responseTimeStats.avg,
        trend: responseTimeStats.trend,
        unit: 'ms'
      },
      throughput: {
        current: throughputStats.current,
        min: throughputStats.min,
        max: throughputStats.max,
        avg: throughputStats.avg,
        trend: throughputStats.trend,
        unit: 'req/s'
      },
      health: await this.getSystemHealth()
    };
  }
}
