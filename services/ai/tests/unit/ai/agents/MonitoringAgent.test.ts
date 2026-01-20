/**
 * @file MonitoringAgent.test.ts
 * @description MonitoringAgent单元测试
 * @module tests/unit/ai/agents
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MonitoringAgent } from '@/ai/agents/MonitoringAgent';

describe('MonitoringAgent', () => {
  let monitoringAgent: MonitoringAgent;

  beforeEach(() => {
    window.performance = {
      memory: {
        usedJSHeapSize: 1024 * 1024 * 50,
        totalJSHeapSize: 1024 * 1024 * 256
      }
    } as any;

    monitoringAgent = new MonitoringAgent({
      id: 'monitoring-agent-1',
      name: '监控智能体',
      description: '性能监控智能体',
      capabilities: [],
      type: 'monitoring',
      version: '1.0.0'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (monitoringAgent) {
      monitoringAgent.destroy();
    }
  });

  describe('初始化', () => {
    it('应该正确初始化MonitoringAgent', () => {
      expect(monitoringAgent).toBeDefined();
      expect(monitoringAgent.config.id).toBe('monitoring-agent-1');
      expect(monitoringAgent.config.name).toBe('监控智能体');
      expect(monitoringAgent.config.type).toBe('monitoring');
    });

    it('应该设置正确的能力', () => {
      const capabilities = monitoringAgent.config.capabilities;
      expect(capabilities.length).toBe(4);
    });

    it('应该包含指标收集能力', () => {
      const capabilities = monitoringAgent.config.capabilities;
      const metricsCapability = capabilities.find(c => c.id === 'monitoring-metrics');
      expect(metricsCapability).toBeDefined();
      expect(metricsCapability?.name).toBe('指标收集');
    });

    it('应该包含告警能力', () => {
      const capabilities = monitoringAgent.config.capabilities;
      const alertsCapability = capabilities.find(c => c.id === 'monitoring-alerts');
      expect(alertsCapability).toBeDefined();
      expect(alertsCapability?.name).toBe('告警');
    });

    it('应该包含分析能力', () => {
      const capabilities = monitoringAgent.config.capabilities;
      const analyticsCapability = capabilities.find(c => c.id === 'monitoring-analytics');
      expect(analyticsCapability).toBeDefined();
      expect(analyticsCapability?.name).toBe('分析');
    });

    it('应该包含报告能力', () => {
      const capabilities = monitoringAgent.config.capabilities;
      const reportCapability = capabilities.find(c => c.id === 'monitoring-report');
      expect(reportCapability).toBeDefined();
      expect(reportCapability?.name).toBe('报告');
    });
  });

  describe('指标记录', () => {
    it('应该能够记录指标', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'recordMetric',
          parameters: {
            name: 'cpu-usage',
            value: 75.5,
            unit: 'percent'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.data.metric.name).toBe('cpu-usage');
      expect(result.data.metric.value).toBe(75.5);
      expect(result.data.metric.unit).toBe('percent');
    });

    it('应该能够记录多个指标', async () => {
      await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'recordMetric',
          parameters: {
            name: 'cpu-usage',
            value: 75.5,
            unit: 'percent'
          }
        }
      });

      await monitoringAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'recordMetric',
          parameters: {
            name: 'memory-usage',
            value: 1024,
            unit: 'mb'
          }
        }
      });

      const result = await monitoringAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getMetrics'
        }
      });

      expect(result.success).toBe(true);
      expect(Object.keys(result.data.metrics).length).toBe(2);
      expect(result.data.metrics['cpu-usage']).toBeDefined();
      expect(result.data.metrics['memory-usage']).toBeDefined();
    });

    it('应该在记录指标时发射事件', async () => {
      const recordSpy = vi.spyOn(monitoringAgent, 'emit');

      await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'recordMetric',
          parameters: {
            name: 'cpu-usage',
            value: 75.5,
            unit: 'percent'
          }
        }
      });

      expect(recordSpy).toHaveBeenCalledWith('monitoring:metric-recorded', expect.objectContaining({
        metric: expect.objectContaining({
          name: 'cpu-usage',
          value: 75.5
        })
      }));
    });

    it('应该处理指标历史限制', async () => {
      for (let i = 0; i < 1005; i++) {
        await monitoringAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'monitoring-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'recordMetric',
            parameters: {
              name: 'cpu-usage',
              value: i,
              unit: 'percent'
            }
          }
        });
      }

      const result = await monitoringAgent.handleMessage({
        id: 'msg-1006',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getMetrics',
          parameters: {
            name: 'cpu-usage'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(1000);
    });
  });

  describe('指标获取', () => {
    beforeEach(async () => {
      for (let i = 0; i < 10; i++) {
        await monitoringAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'monitoring-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'recordMetric',
            parameters: {
              name: 'cpu-usage',
              value: i * 10,
              unit: 'percent'
            }
          }
        });
      }
    });

    it('应该能够获取所有指标', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getMetrics'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.metrics['cpu-usage']).toBeDefined();
      expect(result.data.metrics['cpu-usage'].length).toBe(10);
    });

    it('应该能够获取特定指标', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getMetrics',
          parameters: {
            name: 'cpu-usage'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('cpu-usage');
      expect(result.data.metrics.length).toBe(10);
    });

    it('应该能够限制返回的指标数量', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getMetrics',
          parameters: {
            name: 'cpu-usage',
            limit: 5
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.metrics.length).toBe(5);
      expect(result.data.total).toBe(10);
    });

    it('应该处理不存在的指标', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getMetrics',
          parameters: {
            name: 'non-existent'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.metrics.length).toBe(0);
    });
  });

  describe('阈值设置', () => {
    it('应该能够设置阈值', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setThreshold',
          parameters: {
            name: 'cpu-usage',
            threshold: 80
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('cpu-usage');
      expect(result.data.threshold).toBe(80);
    });

    it('应该在设置阈值时发射事件', async () => {
      const setThresholdSpy = vi.spyOn(monitoringAgent, 'emit');

      await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setThreshold',
          parameters: {
            name: 'cpu-usage',
            threshold: 80
          }
        }
      });

      expect(setThresholdSpy).toHaveBeenCalledWith('monitoring:threshold-set', expect.objectContaining({
        name: 'cpu-usage',
        threshold: 80
      }));
    });

    it('应该能够更新现有阈值', async () => {
      await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setThreshold',
          parameters: {
            name: 'cpu-usage',
            threshold: 80
          }
        }
      });

      const result = await monitoringAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setThreshold',
          parameters: {
            name: 'cpu-usage',
            threshold: 90
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.threshold).toBe(90);
    });
  });

  describe('告警', () => {
    beforeEach(async () => {
      await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setThreshold',
          parameters: {
            name: 'cpu-usage',
            threshold: 80
          }
        }
      });

      await monitoringAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'recordMetric',
          parameters: {
            name: 'cpu-usage',
            value: 85,
            unit: 'percent'
          }
        }
      });
    });

    it('应该能够获取所有告警', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getAlerts'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.alerts.length).toBe(1);
      expect(result.data.alerts[0].type).toBe('warning');
    });

    it('应该能够获取特定类型告警', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getAlerts',
          parameters: {
            type: 'warning'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.alerts.length).toBe(1);
    });

    it('应该能够清除所有告警', async () => {
      await monitoringAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'clearAlerts'
        }
      });

      const result = await monitoringAgent.handleMessage({
        id: 'msg-4',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getAlerts'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.alerts.length).toBe(0);
    });

    it('应该能够清除特定类型告警', async () => {
      await monitoringAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'clearAlerts',
          parameters: {
            type: 'warning'
          }
        }
      });

      const result = await monitoringAgent.handleMessage({
        id: 'msg-4',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getAlerts',
          parameters: {
            type: 'warning'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.alerts.length).toBe(0);
    });

    it('应该在超过阈值时触发告警', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getAlerts'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.alerts.length).toBe(1);
      expect(result.data.alerts[0].metric).toBe('cpu-usage');
      expect(result.data.alerts[0].value).toBe(85);
      expect(result.data.alerts[0].threshold).toBe(80);
    });

    it('应该在触发告警时发射事件', async () => {
      const alertSpy = vi.spyOn(monitoringAgent, 'emit');

      await monitoringAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'recordMetric',
          parameters: {
            name: 'cpu-usage',
            value: 85,
            unit: 'percent'
          }
        }
      });

      expect(alertSpy).toHaveBeenCalledWith('monitoring:alert-triggered', expect.objectContaining({
        alert: expect.objectContaining({
          metric: 'cpu-usage',
          value: 85
        })
      }));
    });
  });

  describe('分析', () => {
    beforeEach(async () => {
      for (let i = 0; i < 10; i++) {
        await monitoringAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'monitoring-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'recordMetric',
            parameters: {
              name: 'cpu-usage',
              value: 50 + i * 5,
              unit: 'percent'
            }
          }
        });
      }
    });

    it('应该能够分析所有指标', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'analyze'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.analysis.metrics['cpu-usage']).toBeDefined();
      expect(result.data.analysis.metrics['cpu-usage'].count).toBe(10);
    });

    it('应该能够分析特定指标', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'analyze',
          parameters: {
            metricName: 'cpu-usage'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(Object.keys(result.data.analysis.metrics).length).toBe(1);
      expect(result.data.analysis.metrics['cpu-usage']).toBeDefined();
    });

    it('应该计算统计信息', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'analyze'
        }
      });

      const analysis = result.data.analysis.metrics['cpu-usage'];
      expect(analysis.count).toBe(10);
      expect(analysis.sum).toBe(725);
      expect(analysis.average).toBe(72.5);
      expect(analysis.min).toBe(50);
      expect(analysis.max).toBe(95);
    });

    it('应该计算趋势', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'analyze'
        }
      });

      const analysis = result.data.analysis.metrics['cpu-usage'];
      expect(analysis.trend).toBe('up');
    });

    it('应该在分析时发射事件', async () => {
      const analyzeSpy = vi.spyOn(monitoringAgent, 'emit');

      await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'analyze'
        }
      });

      expect(analyzeSpy).toHaveBeenCalledWith('monitoring:analyzed', expect.objectContaining({
        analysis: expect.any(Object)
      }));
    });
  });

  describe('报告生成', () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await monitoringAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'monitoring-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'recordMetric',
            parameters: {
              name: 'cpu-usage',
              value: 50 + i * 10,
              unit: 'percent'
            }
          }
        });
      }

      await monitoringAgent.handleMessage({
        id: 'msg-5',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setThreshold',
          parameters: {
            name: 'cpu-usage',
            threshold: 80
          }
        }
      });

      await monitoringAgent.handleMessage({
        id: 'msg-6',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'recordMetric',
          parameters: {
            name: 'cpu-usage',
            value: 85,
            unit: 'percent'
          }
        }
      });
    });

    it('应该能够生成报告', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-7',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'generateReport'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.report).toBeDefined();
      expect(result.data.report.generatedAt).toBeDefined();
    });

    it('报告应该包含分析结果', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-7',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'generateReport'
        }
      });

      expect(result.data.report.analysis).toBeDefined();
      expect(result.data.report.analysis.metrics).toBeDefined();
    });

    it('报告应该包含告警', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-7',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'generateReport'
        }
      });

      expect(result.data.report.alerts).toBeDefined();
      expect(result.data.report.alerts.length).toBeGreaterThan(0);
    });

    it('报告应该包含摘要', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-7',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'generateReport'
        }
      });

      expect(result.data.report.summary).toBeDefined();
      expect(result.data.report.summary.totalMetrics).toBeDefined();
      expect(result.data.report.summary.totalAlerts).toBeDefined();
    });

    it('应该在生成报告时发射事件', async () => {
      const reportSpy = vi.spyOn(monitoringAgent, 'emit');

      await monitoringAgent.handleMessage({
        id: 'msg-7',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'generateReport'
        }
      });

      expect(reportSpy).toHaveBeenCalledWith('monitoring:report-generated', expect.objectContaining({
        report: expect.any(Object)
      }));
    });
  });

  describe('监控控制', () => {
    beforeEach(async () => {
      await monitoringAgent.handleMessage({
        id: 'cleanup-start',
        type: 'command',
        from: 'test',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'stopMonitoring'
        }
      });
    });

    afterEach(async () => {
      await monitoringAgent.handleMessage({
        id: 'cleanup',
        type: 'command',
        from: 'test',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'stopMonitoring'
        }
      });
    });

    it('应该能够启动监控', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'startMonitoring',
          parameters: {
            interval: 1000
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.interval).toBe(1000);
    });

    it('应该能够停止监控', async () => {
      await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'startMonitoring'
        }
      });

      const result = await monitoringAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'stopMonitoring'
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该在启动监控时发射事件', async () => {
      const startSpy = vi.spyOn(monitoringAgent, 'emit');

      await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'startMonitoring'
        }
      });

      expect(startSpy).toHaveBeenCalledWith('monitoring:started', expect.objectContaining({
        interval: 5000
      }));
    });

    it('应该在停止监控时发射事件', async () => {
      const stopSpy = vi.spyOn(monitoringAgent, 'emit');

      await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'startMonitoring'
        }
      });

      await monitoringAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'stopMonitoring'
        }
      });

      expect(stopSpy).toHaveBeenCalledWith('monitoring:stopped', expect.any(Object));
    });

    it('应该防止重复启动监控', async () => {
      const firstResult = await (monitoringAgent as any).handleStartMonitoring();

      expect(firstResult.success).toBe(true);
      const intervalAfterFirst = monitoringAgent.getMonitoringInterval();
      console.log('Interval after first start:', intervalAfterFirst);
      expect(intervalAfterFirst).not.toBeNull();

      const secondResult = await (monitoringAgent as any).handleStartMonitoring();

      const intervalAfterSecond = monitoringAgent.getMonitoringInterval();
      console.log('Interval after second start:', intervalAfterSecond);
      console.log('Second result:', secondResult);

      expect(secondResult.success).toBe(false);
      expect(secondResult.message).toBe('监控已在运行');
      expect(intervalAfterSecond).toBe(intervalAfterFirst);
    });
  });

  describe('边界情况', () => {
    it('应该处理零指标数据', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'analyze'
        }
      });

      expect(result.success).toBe(true);
      expect(Object.keys(result.data.analysis.metrics).length).toBe(0);
    });

    it('应该处理大量指标数据', async () => {
      for (let i = 0; i < 500; i++) {
        await monitoringAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'monitoring-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'recordMetric',
            parameters: {
              name: 'cpu-usage',
              value: i,
              unit: 'percent'
            }
          }
        });
      }

      const result = await monitoringAgent.handleMessage({
        id: 'msg-501',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getMetrics',
          parameters: {
            name: 'cpu-usage'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(500);
    });

    it('应该处理负值指标', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'recordMetric',
          parameters: {
            name: 'temperature',
            value: -10,
            unit: 'celsius'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.metric.value).toBe(-10);
    });

    it('应该处理零值指标', async () => {
      const result = await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'recordMetric',
          parameters: {
            name: 'idle-time',
            value: 0,
            unit: 'seconds'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.metric.value).toBe(0);
    });

    it('应该处理稳定趋势', async () => {
      for (let i = 0; i < 10; i++) {
        await monitoringAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'monitoring-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'recordMetric',
            parameters: {
              name: 'cpu-usage',
              value: 50,
              unit: 'percent'
            }
          }
        });
      }

      const result = await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'analyze'
        }
      });

      const analysis = result.data.analysis.metrics['cpu-usage'];
      expect(analysis.trend).toBe('stable');
    });

    it('应该处理下降趋势', async () => {
      for (let i = 0; i < 10; i++) {
        await monitoringAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'monitoring-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'recordMetric',
            parameters: {
              name: 'cpu-usage',
              value: 100 - i * 10,
              unit: 'percent'
            }
          }
        });
      }

      const result = await monitoringAgent.handleMessage({
        id: 'msg-11',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'analyze'
        }
      });

      const analysis = result.data.analysis.metrics['cpu-usage'];
      expect(analysis.trend).toBe('down');
    });
  });

  describe('性能测试', () => {
    it('应该能够快速记录指标', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        await monitoringAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'monitoring-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'recordMetric',
            parameters: {
              name: 'cpu-usage',
              value: i,
              unit: 'percent'
            }
          }
        });
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('应该能够快速获取指标', async () => {
      for (let i = 0; i < 100; i++) {
        await monitoringAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'monitoring-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'recordMetric',
            parameters: {
              name: 'cpu-usage',
              value: i,
              unit: 'percent'
            }
          }
        });
      }

      const startTime = Date.now();
      const result = await monitoringAgent.handleMessage({
        id: 'msg-101',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getMetrics'
        }
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('组合操作', () => {
    it('应该能够连续执行多个监控操作', async () => {
      const operations = [
        { action: 'recordMetric', parameters: { name: 'cpu-usage', value: 50, unit: 'percent' } },
        { action: 'recordMetric', parameters: { name: 'memory-usage', value: 1024, unit: 'mb' } },
        { action: 'setThreshold', parameters: { name: 'cpu-usage', threshold: 80 } },
        { action: 'analyze' }
      ];

      const results = [];
      for (let i = 0; i < operations.length; i++) {
        const result = await monitoringAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'monitoring-agent-1',
          timestamp: Date.now(),
          payload: operations[i]
        });
        results.push(result);
      }

      expect(results.every(r => r.success)).toBe(true);
    });

    it('应该能够在监控期间记录指标', async () => {
      await monitoringAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'startMonitoring',
          parameters: {
            interval: 100
          }
        }
      });

      await new Promise(resolve => setTimeout(resolve, 250));

      const result = await monitoringAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getMetrics'
        }
      });

      expect(result.success).toBe(true);
      expect(Object.keys(result.data.metrics).length).toBeGreaterThan(0);

      await monitoringAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'monitoring-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'stopMonitoring'
        }
      });
    });
  });
});
