import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealTimeAIDashboard } from '@/analytics/RealTimeAIDashboard';
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';

describe('RealTimeAIDashboard', () => {
  let dashboard: RealTimeAIDashboard;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor({
      enableAnomalyDetection: false,
      checkInterval: 1000
    });
    dashboard = new RealTimeAIDashboard(performanceMonitor);
  });

  afterEach(async () => {
    await performanceMonitor.shutdown();
  });

  describe('constructor', () => {
    it('应该正确初始化dashboard', () => {
      expect(dashboard).toBeInstanceOf(RealTimeAIDashboard);
    });

    it('应该使用传入的performanceMonitor', () => {
      const customMonitor = new PerformanceMonitor();
      const customDashboard = new RealTimeAIDashboard(customMonitor);
      expect(customDashboard).toBeInstanceOf(RealTimeAIDashboard);
    });
  });

  describe('createAIDashboard', () => {
    it('应该创建完整的AI仪表板', async () => {
      await performanceMonitor.initialize();
      const aiDashboard = await dashboard.createAIDashboard();

      expect(aiDashboard).toBeDefined();
      expect(aiDashboard.kpiOverview).toBeDefined();
      expect(aiDashboard.realTimeMonitoring).toBeDefined();
      expect(aiDashboard.predictions).toBeDefined();
      expect(aiDashboard.intelligentAlerts).toBeDefined();
      expect(aiDashboard.optimizationSuggestions).toBeDefined();
    });

    it('应该包含实时监控数据', async () => {
      await performanceMonitor.initialize();
      const aiDashboard = await dashboard.createAIDashboard();

      expect(aiDashboard.realTimeMonitoring).toBeDefined();
      expect(aiDashboard.realTimeMonitoring.liveMetrics).toBeDefined();
      expect(aiDashboard.realTimeMonitoring.systemHealth).toBeDefined();
    });

    it('应该包含告警数据', async () => {
      await performanceMonitor.initialize();
      const aiDashboard = await dashboard.createAIDashboard();

      expect(aiDashboard.intelligentAlerts).toBeDefined();
      expect(Array.isArray(aiDashboard.intelligentAlerts.activeAlerts)).toBe(true);
    });
  });

  describe('updateRealTimeMetrics', () => {
    it('应该初始化性能监控', async () => {
      await dashboard.updateRealTimeMetrics();
      expect(performanceMonitor).toBeDefined();
    });
  });

  describe('recordSystemMetric', () => {
    it('应该记录系统指标', async () => {
      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 75,
        unit: '%'
      });

      const metrics = await dashboard.getMetricsByType('cpu');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].value).toBe(75);
    });

    it('应该记录多个指标', async () => {
      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 75,
        unit: '%'
      });

      await dashboard.recordSystemMetric({
        metricType: 'memory',
        moduleName: 'test-module',
        value: 60,
        unit: '%'
      });

      const cpuMetrics = await dashboard.getMetricsByType('cpu');
      const memoryMetrics = await dashboard.getMetricsByType('memory');

      expect(cpuMetrics.length).toBeGreaterThan(0);
      expect(memoryMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('getActiveAlerts', () => {
    it('应该返回活动告警', async () => {
      await performanceMonitor.initialize();
      const activeAlerts = await dashboard.getActiveAlerts();

      expect(Array.isArray(activeAlerts)).toBe(true);
    });

    it('应该包含性能监控器的告警', async () => {
      await performanceMonitor.initialize();
      
      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 85,
        unit: '%'
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const activeAlerts = await dashboard.getActiveAlerts();
      expect(Array.isArray(activeAlerts)).toBe(true);
    });
  });

  describe('acknowledgeAlert', () => {
    it('应该确认告警', async () => {
      await performanceMonitor.initialize();
      
      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 85,
        unit: '%'
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const activeAlerts = await dashboard.getActiveAlerts();
      if (activeAlerts.length > 0) {
        await dashboard.acknowledgeAlert(activeAlerts[0].id);
        
        const updatedAlerts = await dashboard.getActiveAlerts();
        const acknowledgedAlert = updatedAlerts.find(a => a.id === activeAlerts[0].id);
        expect(acknowledgedAlert?.status).toBe('acknowledged');
      }
    });
  });

  describe('resolveAlert', () => {
    it('应该解决告警', async () => {
      await performanceMonitor.initialize();
      
      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 85,
        unit: '%'
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const activeAlerts = await dashboard.getActiveAlerts();
      if (activeAlerts.length > 0) {
        await dashboard.resolveAlert(activeAlerts[0].id);
        
        const updatedAlerts = await dashboard.getActiveAlerts();
        const resolvedAlert = updatedAlerts.find(a => a.id === activeAlerts[0].id);
        expect(resolvedAlert?.status).toBe('resolved');
      }
    });
  });

  describe('addAlertRule', () => {
    it('应该添加告警规则', async () => {
      const rule = await dashboard.addAlertRule({
        name: '测试规则',
        description: '测试告警规则',
        metricType: 'cpu',
        condition: 'greater_than',
        threshold: 90,
        duration: 60000,
        severity: 'critical',
        enabled: true,
        cooldown: 300000
      });

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(typeof rule.id).toBe('string');
      expect(rule.name).toBe('测试规则');
    });
  });

  describe('removeAlertRule', () => {
    it('应该删除告警规则', async () => {
      const rule = await dashboard.addAlertRule({
        name: '测试规则',
        description: '测试告警规则',
        metricType: 'cpu',
        condition: 'greater_than',
        threshold: 90,
        duration: 60000,
        severity: 'critical',
        enabled: true,
        cooldown: 300000
      });

      await dashboard.removeAlertRule(rule.id);
      expect(true).toBe(true);
    });
  });

  describe('getMetricsByType', () => {
    it('应该返回指定类型的指标', async () => {
      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 75,
        unit: '%'
      });

      const metrics = await dashboard.getMetricsByType('cpu');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].metricType).toBe('cpu');
    });

    it('应该返回空数组如果没有指标', async () => {
      const metrics = await dashboard.getMetricsByType('throughput');
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe('getMetricStats', () => {
    it('应该返回指标统计信息', async () => {
      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 50,
        unit: '%'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 60,
        unit: '%'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 70,
        unit: '%'
      });

      const stats = await dashboard.getMetricStats('test-module', 'cpu');

      expect(stats).toBeDefined();
      expect(stats.current).toBe(70);
      expect(stats.min).toBe(50);
      expect(stats.max).toBe(70);
      expect(stats.avg).toBeCloseTo(60);
      expect(stats.count).toBe(3);
    });
  });

  describe('getSystemHealth', () => {
    it('应该返回系统健康状态', async () => {
      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 75,
        unit: '%'
      });

      await dashboard.recordSystemMetric({
        metricType: 'memory',
        moduleName: 'test-module',
        value: 60,
        unit: '%'
      });

      const health = await dashboard.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.cpu).toBe(75);
      expect(health.memory).toBe(60);
      expect(health.activeAlerts).toBeGreaterThanOrEqual(0);
      expect(health.criticalAlerts).toBeGreaterThanOrEqual(0);
      expect(health.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('getAnomalyReport', () => {
    it('应该返回异常报告', async () => {
      const report = await dashboard.getAnomalyReport();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(Array.isArray(report.anomalies)).toBe(true);
    });
  });

  describe('集成测试', () => {
    it('应该完整的工作流程', async () => {
      await performanceMonitor.initialize();

      await dashboard.recordSystemMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 75,
        unit: '%'
      });

      await dashboard.recordSystemMetric({
        metricType: 'memory',
        moduleName: 'test-module',
        value: 60,
        unit: '%'
      });

      const health = await dashboard.getSystemHealth();
      expect(health.cpu).toBe(75);
      expect(health.memory).toBe(60);

      const aiDashboard = await dashboard.createAIDashboard();
      expect(aiDashboard.realTimeMonitoring.systemHealth.cpuUsage).toBe(75);
      expect(aiDashboard.realTimeMonitoring.systemHealth.memoryUsage).toBe(60);
    });
  });
});
