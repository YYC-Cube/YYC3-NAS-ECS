import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PerformanceMonitor,
  PerformanceMetric,
  AlertRule,
  Alert,
  MonitoringConfig,
  SMTPConfig
} from '@/monitoring/PerformanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let config: Partial<MonitoringConfig>;

  beforeEach(() => {
    const smtpConfig: SMTPConfig = {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'password'
      },
      from: 'monitoring@example.com'
    };

    config = {
      retentionPeriod: 60000,
      maxMetrics: 100,
      maxAlerts: 10,
      enableAutoResolution: true,
      checkInterval: 1000,
      notificationChannels: {
        email: { enabled: true, recipients: ['test@example.com'], smtpConfig },
        slack: { enabled: false, webhook: '' },
        webhook: { enabled: false, url: '' },
        sms: { enabled: false, recipients: [] }
      }
    };
    monitor = new PerformanceMonitor(config);
  });

  afterEach(async () => {
    await monitor.shutdown();
  });

  describe('initialize', () => {
    it('应该成功初始化监控器', async () => {
      await expect(monitor.initialize()).resolves.not.toThrow();
    });

    it('应该加载默认告警规则', async () => {
      await monitor.initialize();

      const rules = monitor.getAlertRules();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some(r => r.name === '高CPU使用率')).toBe(true);
    });
  });

  describe('recordMetric', () => {
    it('应该成功记录指标', async () => {
      await monitor.initialize();

      const metric = monitor.recordMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 75.5,
        unit: '%'
      });

      expect(metric).toBeDefined();
      expect(metric.id).toBeDefined();
      expect(metric.timestamp).toBeInstanceOf(Date);
      expect(metric.metricType).toBe('cpu');
      expect(metric.moduleName).toBe('test-module');
      expect(metric.value).toBe(75.5);
      expect(metric.unit).toBe('%');
    });

    it('应该限制指标数量', async () => {
      await monitor.initialize();

      for (let i = 0; i < 150; i++) {
        monitor.recordMetric({
          metricType: 'cpu',
          moduleName: 'test-module',
          value: i,
          unit: '%'
        });
      }

      const metrics = monitor.getMetrics('test-module', 'cpu');
      expect(metrics.length).toBeLessThanOrEqual(100);
    });
  });

  describe('getMetrics', () => {
    it('应该返回所有指标', async () => {
      await monitor.initialize();

      monitor.recordMetric({
        metricType: 'cpu',
        moduleName: 'module1',
        value: 50,
        unit: '%'
      });

      monitor.recordMetric({
        metricType: 'memory',
        moduleName: 'module1',
        value: 60,
        unit: '%'
      });

      const allMetrics = monitor.getMetrics();
      expect(allMetrics.length).toBe(2);
    });

    it('应该按模块名称过滤', async () => {
      await monitor.initialize();

      monitor.recordMetric({
        metricType: 'cpu',
        moduleName: 'module1',
        value: 50,
        unit: '%'
      });

      monitor.recordMetric({
        metricType: 'cpu',
        moduleName: 'module2',
        value: 60,
        unit: '%'
      });

      const metrics = monitor.getMetrics('module1');
      expect(metrics.length).toBe(1);
      expect(metrics[0].moduleName).toBe('module1');
    });

    it('应该按指标类型过滤', async () => {
      await monitor.initialize();

      monitor.recordMetric({
        metricType: 'cpu',
        moduleName: 'module1',
        value: 50,
        unit: '%'
      });

      monitor.recordMetric({
        metricType: 'memory',
        moduleName: 'module1',
        value: 60,
        unit: '%'
      });

      const metrics = monitor.getMetrics(undefined, 'cpu');
      expect(metrics.length).toBe(1);
      expect(metrics[0].metricType).toBe('cpu');
    });

    it('应该按时间范围过滤', async () => {
      await monitor.initialize();

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      monitor.recordMetric({
        metricType: 'cpu',
        moduleName: 'module1',
        value: 50,
        unit: '%'
      });

      const metrics = monitor.getMetrics(undefined, undefined, oneHourAgo, now);
      expect(metrics.length).toBe(1);
    });
  });

  describe('getMetricStats', () => {
    it('应该返回正确的统计信息', async () => {
      await monitor.initialize();

      monitor.recordMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 50,
        unit: '%'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      monitor.recordMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 60,
        unit: '%'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      monitor.recordMetric({
        metricType: 'cpu',
        moduleName: 'test-module',
        value: 70,
        unit: '%'
      });

      const stats = monitor.getMetricStats('test-module', 'cpu');

      expect(stats.current).toBe(70);
      expect(stats.min).toBe(50);
      expect(stats.max).toBe(70);
      expect(stats.avg).toBeCloseTo(60);
      expect(stats.count).toBe(3);
      expect(stats.trend).toBeDefined();
    });

    it('应该正确识别趋势', async () => {
      await monitor.initialize();

      for (let i = 0; i < 5; i++) {
        monitor.recordMetric({
          metricType: 'cpu',
          moduleName: 'test-module',
          value: 50 + i * 10,
          unit: '%'
        });
      }

      const stats = monitor.getMetricStats('test-module', 'cpu');
      expect(stats.trend).toBe('increasing');
    });

    it('应该处理无指标的情况', async () => {
      await monitor.initialize();

      const stats = monitor.getMetricStats('non-existent', 'cpu');

      expect(stats.current).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.avg).toBe(0);
      expect(stats.count).toBe(0);
      expect(stats.trend).toBe('stable');
    });
  });

  describe('addAlertRule', () => {
    it('应该成功添加告警规则', async () => {
      await monitor.initialize();

      const rule = monitor.addAlertRule({
        name: '测试告警',
        description: '测试告警描述',
        metricType: 'cpu',
        condition: 'greater_than',
        threshold: 80,
        duration: 60000,
        severity: 'warning',
        enabled: true,
        cooldown: 300000
      });

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('测试告警');

      const rules = monitor.getAlertRules();
      expect(rules.some(r => r.id === rule.id)).toBe(true);
    });

    it('应该为规则生成唯一ID', async () => {
      await monitor.initialize();

      const rule1 = monitor.addAlertRule({
        name: '告警1',
        description: '描述1',
        metricType: 'cpu',
        condition: 'greater_than',
        threshold: 80,
        duration: 60000,
        severity: 'warning',
        enabled: true,
        cooldown: 300000
      });

      const rule2 = monitor.addAlertRule({
        name: '告警2',
        description: '描述2',
        metricType: 'memory',
        condition: 'greater_than',
        threshold: 90,
        duration: 60000,
        severity: 'critical',
        enabled: true,
        cooldown: 300000
      });

      expect(rule1.id).not.toBe(rule2.id);
    });
  });

  describe('removeAlertRule', () => {
    it('应该成功移除告警规则', async () => {
      await monitor.initialize();

      const rule = monitor.addAlertRule({
        name: '测试告警',
        description: '测试告警描述',
        metricType: 'cpu',
        condition: 'greater_than',
        threshold: 80,
        duration: 60000,
        severity: 'warning',
        enabled: true,
        cooldown: 300000
      });

      const removed = monitor.removeAlertRule(rule.id);
      expect(removed).toBe(true);

      const rules = monitor.getAlertRules();
      expect(rules.some(r => r.id === rule.id)).toBe(false);
    });

    it('应该返回false当规则不存在时', async () => {
      await monitor.initialize();

      const removed = monitor.removeAlertRule('non-existent-id');
      expect(removed).toBe(false);
    });
  });

  describe('getAlerts', () => {
    it('应该返回所有告警', async () => {
      await monitor.initialize();

      const rule = monitor.addAlertRule({
        name: '测试告警',
        description: '测试告警描述',
        metricType: 'cpu',
        moduleName: 'test-module',
        condition: 'greater_than',
        threshold: 50,
        duration: 1000,
        severity: 'warning',
        enabled: true,
        cooldown: 500
      });

      for (let i = 0; i < 3; i++) {
        monitor.recordMetric({
          metricType: 'cpu',
          moduleName: 'test-module',
          value: 75,
          unit: '%'
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const alerts = monitor.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('应该按严重性过滤', async () => {
      await monitor.initialize();

      const rule = monitor.addAlertRule({
        name: '测试告警',
        description: '测试告警描述',
        metricType: 'cpu',
        moduleName: 'test-module',
        condition: 'greater_than',
        threshold: 50,
        duration: 1000,
        severity: 'critical',
        enabled: true,
        cooldown: 500
      });

      for (let i = 0; i < 3; i++) {
        monitor.recordMetric({
          metricType: 'cpu',
          moduleName: 'test-module',
          value: 75,
          unit: '%'
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const criticalAlerts = monitor.getAlerts('critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);

      const warningAlerts = monitor.getAlerts('warning');
      expect(warningAlerts.length).toBe(0);
    });

    it('应该按状态过滤', async () => {
      await monitor.initialize();

      const rule = monitor.addAlertRule({
        name: '测试告警',
        description: '测试告警描述',
        metricType: 'cpu',
        moduleName: 'test-module',
        condition: 'greater_than',
        threshold: 50,
        duration: 1000,
        severity: 'warning',
        enabled: true,
        cooldown: 500
      });

      for (let i = 0; i < 3; i++) {
        monitor.recordMetric({
          metricType: 'cpu',
          moduleName: 'test-module',
          value: 75,
          unit: '%'
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const alerts = monitor.getAlerts();
      if (alerts.length > 0) {
        monitor.acknowledgeAlert(alerts[0].id);

        const acknowledgedAlerts = monitor.getAlerts(undefined, 'acknowledged');
        expect(acknowledgedAlerts.length).toBe(1);
      }
    });
  });

  describe('acknowledgeAlert', () => {
    it('应该成功确认告警', async () => {
      await monitor.initialize();

      const rule = monitor.addAlertRule({
        name: '测试告警',
        description: '测试告警描述',
        metricType: 'cpu',
        moduleName: 'test-module',
        condition: 'greater_than',
        threshold: 50,
        duration: 1000,
        severity: 'warning',
        enabled: true,
        cooldown: 500
      });

      for (let i = 0; i < 3; i++) {
        monitor.recordMetric({
          metricType: 'cpu',
          moduleName: 'test-module',
          value: 75,
          unit: '%'
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const alerts = monitor.getAlerts();
      if (alerts.length > 0) {
        const acknowledged = monitor.acknowledgeAlert(alerts[0].id);
        expect(acknowledged).toBe(true);

        const updatedAlerts = monitor.getAlerts();
        expect(updatedAlerts[0].status).toBe('acknowledged');
      }
    });

    it('应该返回false当告警不存在时', async () => {
      await monitor.initialize();

      const acknowledged = monitor.acknowledgeAlert('non-existent-id');
      expect(acknowledged).toBe(false);
    });
  });

  describe('resolveAlert', () => {
    it('应该成功解决告警', async () => {
      await monitor.initialize();

      const rule = monitor.addAlertRule({
        name: '测试告警',
        description: '测试告警描述',
        metricType: 'cpu',
        moduleName: 'test-module',
        condition: 'greater_than',
        threshold: 50,
        duration: 1000,
        severity: 'warning',
        enabled: true,
        cooldown: 500
      });

      for (let i = 0; i < 3; i++) {
        monitor.recordMetric({
          metricType: 'cpu',
          moduleName: 'test-module',
          value: 75,
          unit: '%'
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const alerts = monitor.getAlerts();
      if (alerts.length > 0) {
        const resolved = monitor.resolveAlert(alerts[0].id);
        expect(resolved).toBe(true);

        const updatedAlerts = monitor.getAlerts();
        expect(updatedAlerts[0].status).toBe('resolved');
        expect(updatedAlerts[0].resolvedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('getNotifications', () => {
    it('应该返回所有通知', async () => {
      await monitor.initialize();

      const rule = monitor.addAlertRule({
        name: '测试告警',
        description: '测试告警描述',
        metricType: 'cpu',
        moduleName: 'test-module',
        condition: 'greater_than',
        threshold: 50,
        duration: 1000,
        severity: 'warning',
        enabled: true,
        cooldown: 500
      });

      for (let i = 0; i < 3; i++) {
        monitor.recordMetric({
          metricType: 'cpu',
          moduleName: 'test-module',
          value: 75,
          unit: '%'
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const notifications = monitor.getNotifications();
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].alertId).toBeDefined();
      expect(notifications[0].channel).toBeDefined();
      expect(notifications[0].recipient).toBeDefined();
      expect(notifications[0].message).toBeDefined();
      expect(notifications[0].sentAt).toBeInstanceOf(Date);
      expect(notifications[0].status).toMatch(/^(sent|failed)$/);
    });
  });

  describe('shutdown', () => {
    it('应该成功关闭监控器', async () => {
      await monitor.initialize();

      await expect(monitor.shutdown()).resolves.not.toThrow();
    });
  });
});
