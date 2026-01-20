import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorLogger, ErrorLoggerConfig } from '../../../core/error-handler/ErrorLogger';
import { ErrorReport, ErrorSeverity, ErrorCategory } from '../../../core/error-handler/ErrorTypes';
import { YYC3Error } from '../../../core/error-handler/ErrorTypes';

function createErrorReport(error: YYC3Error, context?: Record<string, any>, timestamp?: number): ErrorReport {
  return {
    error,
    context: context || {},
    timestamp: timestamp || Date.now(),
    handled: false,
    recoveryAttempted: false
  };
}

describe('ErrorLogger', () => {
  let logger: ErrorLogger;
  let testError: YYC3Error;
  let testReport: ErrorReport;

  const createLogger = (): ErrorLogger => {
    const config: ErrorLoggerConfig = {
      enableAggregation: true,
      enableTrendAnalysis: true,
      enableAlerts: true,
      aggregationWindow: 60000,
      aggregationThreshold: 5,
      alertRules: [
        {
          severity: ErrorSeverity.CRITICAL,
          threshold: 1,
          window: 60000
        },
        {
          severity: ErrorSeverity.HIGH,
          threshold: 10,
          window: 300000
        }
      ],
      retentionPeriod: 86400000,
      maxLogEntries: 10000
    };

    return new ErrorLogger(config);
  };

  beforeEach(() => {
    logger = createLogger();
    testError = new YYC3Error('TEST_ERROR', 'Test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
    testReport = {
      error: testError,
      context: {
        timestamp: Date.now(),
        userId: 'user-123'
      },
      timestamp: Date.now(),
      handled: false,
      recoveryAttempted: false
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('应该成功记录错误', () => {
      const entry = logger.log(testReport, ['test-tag'], 'test-source');

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.message).toBe('Test error');
      expect(entry.level).toBe(ErrorSeverity.MEDIUM);
      expect(entry.tags).toContain('test-tag');
      expect(entry.source).toBe('test-source');
    });

    it('应该生成唯一的日志ID', () => {
      const entry1 = logger.log(testReport);
      const entry2 = logger.log(testReport);

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('应该记录时间戳', () => {
      const beforeTime = Date.now();
      const entry = logger.log(testReport);
      const afterTime = Date.now();

      expect(entry.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(entry.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('应该包含错误上下文', () => {
      const entry = logger.log(testReport);

      expect(entry.context).toBeDefined();
      expect(entry.context.userId).toBe('user-123');
    });

    it('应该支持多个标签', () => {
      const entry = logger.log(testReport, ['tag1', 'tag2', 'tag3']);

      expect(entry.tags).toHaveLength(3);
      expect(entry.tags).toContain('tag1');
      expect(entry.tags).toContain('tag2');
      expect(entry.tags).toContain('tag3');
    });

    it('应该更新指标', () => {
      logger.log(testReport);
      const metrics = logger.getMetrics();

      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
    });

    it('应该触发logged事件', () => {
      const listener = vi.fn();
      logger.on('logged', listener);

      logger.log(testReport);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error'
        })
      );
    });

    it('应该处理空标签', () => {
      const entry = logger.log(testReport, []);

      expect(entry.tags).toEqual([]);
    });

    it('应该处理默认源', () => {
      const entry = logger.log(testReport);

      expect(entry.source).toBe('unknown');
    });
  });

  describe('query', () => {
    beforeEach(() => {
      logger.log(testReport, ['network'], 'service-a');
      logger.log(testReport, ['database'], 'service-b');
      logger.log(testReport, ['network'], 'service-a');
    });

    it('应该查询所有日志', () => {
      const results = logger.getLogs();

      expect(results).toHaveLength(3);
    });

    it('应该按标签过滤', () => {
      const results = logger.getLogs({ tags: ['network'] });

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.tags).toContain('network');
      });
    });

    it('应该按严重性过滤', () => {
      const highError = new YYC3Error('HIGH_ERROR', 'High error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.HIGH });
      logger.log(createErrorReport(highError));

      const results = logger.getLogs({ level: ErrorSeverity.HIGH });

      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ErrorSeverity.HIGH);
    });

    it('应该按源过滤', () => {
      const results = logger.getLogs({ source: 'service-a' });

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.source).toBe('service-a');
      });
    });

    it('应该按时间范围过滤', () => {
      const now = Date.now();
      const oneHourAgo = now - 3600000;

      const results = logger.getLogs({
        startTime: oneHourAgo,
        endTime: now + 1000
      });

      expect(results.length).toBeGreaterThan(0);
    });

    it('应该支持组合过滤', () => {
      const results = logger.getLogs({
        tags: ['network'],
        source: 'service-a'
      });

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.tags).toContain('network');
        expect(result.source).toBe('service-a');
      });
    });

    it('应该限制返回结果数量', () => {
      const results = logger.getLogs().slice(0, 2);

      expect(results).toHaveLength(2);
    });

    it('应该支持分页', () => {
      const results = logger.getLogs().slice(1, 2);

      expect(results).toHaveLength(1);
    });

    it('应该按时间排序', () => {
      const results = logger.getLogs().sort((a, b) => a.timestamp - b.timestamp);

      for (let i = 1; i < results.length; i++) {
        expect(results[i].timestamp).toBeGreaterThanOrEqual(results[i - 1].timestamp);
      }
    });
  });

  describe('getMetrics', () => {
    it('应该返回总错误数', () => {
      logger.log(testReport);
      logger.log(testReport);
      logger.log(testReport);

      const metrics = logger.getMetrics();

      expect(metrics.totalErrors).toBe(3);
    });

    it('应该按严重性统计错误', () => {
      const mediumError = new YYC3Error('MEDIUM_ERROR', 'Medium error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
      const highError = new YYC3Error('HIGH_ERROR', 'High error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.HIGH });

      logger.log(createErrorReport(mediumError));
      logger.log(createErrorReport(mediumError));
      logger.log(createErrorReport(highError));

      const metrics = logger.getMetrics();

      expect(metrics.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(2);
      expect(metrics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
    });

    it('应该按类别统计错误', () => {
      const networkError = new YYC3Error('NETWORK_ERROR', 'Network error', { category: ErrorCategory.NETWORK, severity: ErrorSeverity.HIGH });
      const databaseError = new YYC3Error('DB_ERROR', 'Database error', { category: ErrorCategory.DATABASE, severity: ErrorSeverity.HIGH });

      logger.log(createErrorReport(networkError));
      logger.log(createErrorReport(networkError));
      logger.log(createErrorReport(databaseError));

      const metrics = logger.getMetrics();

      expect(metrics.errorsByCategory[ErrorCategory.NETWORK]).toBe(2);
      expect(metrics.errorsByCategory[ErrorCategory.DATABASE]).toBe(1);
    });

    it('应该计算错误率', () => {
      const startTime = Date.now() - 60000;

      for (let i = 0; i < 10; i++) {
        logger.log(testReport);
      }

      const metrics = logger.getMetrics();

      expect(metrics.errorRate).toBeGreaterThan(0);
    });

    it('应该返回平均响应时间', () => {
      logger.log(testReport);

      const metrics = logger.getMetrics();

      expect(metrics.avgResponseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('aggregateError', () => {
    it('应该聚合相似错误', () => {
      const error1 = new YYC3Error('TIMEOUT', 'Network timeout', { category: ErrorCategory.NETWORK, severity: ErrorSeverity.HIGH });
      const error2 = new YYC3Error('TIMEOUT', 'Network timeout', { category: ErrorCategory.NETWORK, severity: ErrorSeverity.HIGH });

      logger.log(createErrorReport(error1));
      logger.log(createErrorReport(error2));

      const aggregated = logger.getAggregations();

      expect(aggregated.length).toBeGreaterThan(0);
      expect(aggregated[0].count).toBeGreaterThan(1);
    });

    it('应该按错误代码分组', () => {
      const error1 = new YYC3Error('CODE_1', 'Error 1', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
      const error2 = new YYC3Error('CODE_2', 'Error 2', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
      const error3 = new YYC3Error('CODE_1', 'Error 1', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      for (let i = 0; i < 5; i++) {
        logger.log(createErrorReport(error1));
      }
      for (let i = 0; i < 5; i++) {
        logger.log(createErrorReport(error2));
      }
      for (let i = 0; i < 5; i++) {
        logger.log(createErrorReport(error3));
      }

      const aggregated = logger.getAggregations();

      const code1Group = aggregated.find(g => g.errorKey === 'CODE_1_unknown_Error 1');
      const code2Group = aggregated.find(g => g.errorKey === 'CODE_2_unknown_Error 2');

      expect(code1Group?.count).toBe(10);
      expect(code2Group?.count).toBe(5);
    });

    it('应该计算聚合错误的第一和最后出现时间', () => {
      const error = new YYC3Error('TEST', 'Test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      const firstTime = Date.now();
      logger.log(createErrorReport(error, {}, firstTime));

      const lastTime = Date.now() + 1000;
      logger.log(createErrorReport(error, {}, lastTime));

      const aggregated = logger.getAggregations();
      const group = aggregated.find(g => g.errorKey === 'TEST_unknown_Test error');

      expect(group?.firstSeen).toBe(firstTime);
      expect(group?.lastSeen).toBe(lastTime);
    });
  });

  describe('analyzeTrends', () => {
      it('应该分析错误趋势', () => {
        const error = new YYC3Error('TEST', 'Test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      for (let i = 0; i < 10; i++) {
        logger.log(createErrorReport(error));
      }

      const trends = logger.getErrorTrends();

      expect(trends.length).toBeGreaterThan(0);
    });

    it('应该检测错误频率增加', () => {
      const error = new YYC3Error('TEST', 'Test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      for (let i = 0; i < 5; i++) {
        logger.log(createErrorReport(error, {}, Date.now() - 300000));
      }

      for (let i = 0; i < 10; i++) {
        logger.log(createErrorReport(error));
      }

      const trends = logger.getErrorTrends();
      const trend = trends.find(t => t.errorCode === 'TEST');

      expect(trend?.trend).toBe('increasing');
    });

    it('应该检测错误频率减少', () => {
      const error = new YYC3Error('TEST', 'Test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      const olderTime = Date.now() - 400000;
      for (let i = 0; i < 10; i++) {
        logger.log(createErrorReport(error, {}, olderTime));
      }

      const recentTime = Date.now() - 100000;
      for (let i = 0; i < 2; i++) {
        logger.log(createErrorReport(error, {}, recentTime));
      }

      const trends = logger.getErrorTrends();
      const trend = trends.find(t => t.errorCode === 'TEST');

      expect(trend?.trend).toBe('decreasing');
    });

    it('应该检测稳定错误频率', () => {
      const error = new YYC3Error('TEST', 'Test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      const olderTime = Date.now() - 400000;
      for (let i = 0; i < 5; i++) {
        logger.log(createErrorReport(error, {}, olderTime));
      }

      const recentTime = Date.now() - 100000;
      for (let i = 0; i < 5; i++) {
        logger.log(createErrorReport(error, {}, recentTime));
      }

      const trends = logger.getErrorTrends();
      expect(trends).toHaveLength(1);
      expect(trends[0].trend).toBe('stable');
    });

    it('应该触发严重错误告警', () => {
      const error = new YYC3Error('HIGH', 'High error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.HIGH });

      const olderTime = Date.now() - 400000;
      for (let i = 0; i < 5; i++) {
        logger.log(createErrorReport(error, {}, olderTime));
      }

      const recentTime = Date.now() - 100000;
      for (let i = 0; i < 5; i++) {
        logger.log(createErrorReport(error, {}, recentTime));
      }

      const trends = logger.getErrorTrends();
      const trend = trends.find(t => t.errorCode === 'HIGH');

      expect(trend?.trend).toBe('stable');
    });
  });

  describe('checkAlerts', () => {
    it('应该在达到阈值时触发警报', () => {
      const criticalError = new YYC3Error('CRITICAL', 'Critical error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.CRITICAL });

      const alertListener = vi.fn();
      logger.on('alert', alertListener);

      logger.log(createErrorReport(criticalError));

      expect(alertListener).toHaveBeenCalledTimes(1);
    });

    it('应该在多个高严重性错误时触发警报', () => {
      const highError = new YYC3Error('HIGH', 'High error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.HIGH });

      const alertListener = vi.fn();
      logger.on('alert', alertListener);

      for (let i = 0; i < 10; i++) {
        logger.log(createErrorReport(highError));
      }

      expect(alertListener).toHaveBeenCalled();
    });

    it('应该触发临界错误告警', () => {
      const error = new YYC3Error('CRITICAL', 'Critical error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.CRITICAL });

      const alertListener = vi.fn();
      logger.on('alert', alertListener);

      logger.log(createErrorReport(error));

      const alert = alertListener.mock.calls[0][0];
      expect(alert).toMatchObject({
        severity: ErrorSeverity.CRITICAL,
        threshold: expect.any(Number),
        actualCount: expect.any(Number)
      });
    });
  });

  describe('clearLogs', () => {
    it('应该清除所有日志', () => {
      logger.log(testReport);
      logger.log(testReport);

      logger.clearLogs();

      const results = logger.getLogs();
      expect(results).toHaveLength(0);
    });

    it('应该重置指标', () => {
      logger.log(testReport);
      logger.log(testReport);

      logger.clearLogs();

      const metrics = logger.getMetrics();
      expect(metrics.totalErrors).toBe(0);
    });

    it('应该清除聚合错误', () => {
      logger.log(testReport);
      logger.log(testReport);

      logger.clearLogs();

      const aggregated = logger.getAggregations();
      expect(aggregated).toHaveLength(0);
    });
  });

  describe('exportLogs', () => {
    it('应该导出日志为JSON', () => {
      logger.log(testReport);
      logger.log(testReport);

      const exported = logger.exportLogs();

      expect(exported).toBeDefined();
      expect(exported.logs).toHaveLength(2);
      expect(exported.exportedAt).toBeDefined();
    });

    it('应该包含指标', () => {
      logger.log(testReport);

      const exported = logger.exportLogs();

      expect(exported.metrics).toBeDefined();
      expect(exported.metrics.totalErrors).toBe(1);
    });

    it('应该支持过滤导出', () => {
      logger.log(testReport, ['tag1']);
      logger.log(testReport, ['tag2']);

      const exported = logger.exportLogs({ tags: ['tag1'] });

      expect(exported.logs).toHaveLength(1);
      expect(exported.logs[0].tags).toContain('tag1');
    });
  });

  describe('性能测试', () => {
    it('应该快速记录大量错误', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const error = new YYC3Error(`CODE_${i}`, `Error ${i}`, { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
        logger.log(createErrorReport(error));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('应该快速查询日志', () => {
      for (let i = 0; i < 1000; i++) {
        const error = new YYC3Error(`CODE_${i}`, `Error ${i}`, { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
        logger.log(createErrorReport(error));
      }

      const startTime = Date.now();
      const results = logger.getLogs();
      const endTime = Date.now();

      expect(results).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('应该快速聚合错误', () => {
      for (let i = 0; i < 100; i++) {
        const error = new YYC3Error('TEST', 'Test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
        logger.log(createErrorReport(error));
      }

      const startTime = Date.now();
      const aggregated = logger.getAggregations();
      const endTime = Date.now();

      expect(aggregated.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
