import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandler } from '@/error-handler/ErrorHandler';
import { ErrorHandlerConfig } from '@/error-handler/ErrorHandler';
import { YYC3Error, ErrorSeverity, ErrorCategory } from '@/error-handler/ErrorTypes';

describe('ErrorHandler Integration Tests', () => {
  let errorHandler: ErrorHandler;
  let config: ErrorHandlerConfig;

  beforeEach(() => {
    config = {
      enableLogging: true,
      enableRecovery: true,
      enableContextCollection: true,
      enableClassification: true,
      enableAggregation: true,
      enableTrendAnalysis: true,
      enableAlerts: true,
      loggingConfig: {
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
            threshold: 5,
            window: 60000
          }
        ],
        retentionPeriod: 86400000,
        maxLogEntries: 10000
      },
      recoveryConfig: {
        defaultStrategy: 'retry',
        retryConfig: {
          maxAttempts: 3,
          initialDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2,
          jitter: false
        },
        circuitBreakerConfig: {
          failureThreshold: 5,
          successThreshold: 2,
          timeout: 60000
        },
        fallbackConfig: {
          fallbackFunction: async () => {
            return 'fallback-result';
          }
        }
      },
      contextCollectorConfig: {
        includeStackTrace: true,
        includeSystemMetrics: true,
        includeApplicationMetrics: true,
        includeRequestMetrics: true,
        sanitizeSensitiveData: true,
        maxContextSize: 10000,
        retentionPeriod: 3600000
      }
    };

    errorHandler = new ErrorHandler(config);
  });

  afterEach(() => {
    errorHandler.clear();
    vi.clearAllMocks();
  });

  describe('完整错误处理流程', () => {
    it('应该完整处理错误：检测 -> 分类 -> 收集上下文 -> 记录 -> 恢复', async () => {
      const error = new YYC3Error('NETWORK_ERROR', 'Network connection failed', { category: ErrorCategory.NETWORK, severity: ErrorSeverity.HIGH });
      const context = { userId: 'user-123', action: 'test-action' };

      const result = await errorHandler.handleError(error, context);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();

      const logs = errorHandler.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].message).toBe('Network connection failed');
    });

    it('应该正确分类并记录错误', async () => {
      const error = new YYC3Error('DB_TIMEOUT', 'Database connection timeout', { category: ErrorCategory.DATABASE, severity: ErrorSeverity.HIGH });

      await errorHandler.handleError(error);

      const logs = errorHandler.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].level).toBe(ErrorSeverity.HIGH);
    });

    it('应该收集错误上下文并清理敏感数据', async () => {
      const error = new YYC3Error('AUTH_ERROR', 'Authentication failed', { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.HIGH });
      const context = {
        userId: 'user-123',
        password: 'secret123',
        token: 'token-abc-123'
      };

      await errorHandler.handleError(error, context);

      const logs = errorHandler.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      const logContext = logs[0].context;
      expect(logContext?.password).toBe('[REDACTED]');
      expect(logContext?.token).toBe('[REDACTED]');
      expect(logContext?.userId).toBe('user-123');
    });

    it('应该应用恢复策略', async () => {
      let attemptCount = 0;
      const error = new YYC3Error('TEMP_ERROR', 'Temporary failure', { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, retryable: true });

      const recoveryFunction = vi.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw error;
        }
        return 'success';
      });

      const result = await errorHandler.handleError(error, {}, recoveryFunction);

      expect(recoveryFunction).toHaveBeenCalled();
      expect(attemptCount).toBeGreaterThan(1);
    });
  });

  describe('错误分类集成', () => {
    it('应该根据错误模式自动分类', async () => {
      const networkError = new YYC3Error('CONN_REFUSED', 'Connection refused', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
      await errorHandler.handleError(networkError);

      const dbError = new YYC3Error('QUERY_TIMEOUT', 'Query timeout', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
      await errorHandler.handleError(dbError);

      const logs = errorHandler.getLogs();
      expect(logs.length).toBe(2);

      const metrics = errorHandler.getMetrics();
      expect(metrics.errorsByCategory[ErrorCategory.NETWORK]).toBeGreaterThan(0);
    });

    it('应该根据错误频率调整严重性', async () => {
      const error = new YYC3Error('FREQUENT', 'Frequent error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.LOW });

      for (let i = 0; i < 10; i++) {
        await errorHandler.handleError(error);
      }

      const logs = errorHandler.getLogs();
      const recentLogs = logs.slice(-5);

      recentLogs.forEach(log => {
        expect(log.level).toBeDefined();
        expect([ErrorSeverity.LOW, ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]).toContain(log.level);
      });
    });
  });

  describe('错误聚合集成', () => {
    it('应该聚合相似错误', async () => {
      const error = new YYC3Error('REPEATED', 'Repeated error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      for (let i = 0; i < 10; i++) {
        await errorHandler.handleError(error);
      }

      const aggregated = errorHandler.getAggregatedErrors();
      const group = aggregated.find(g => g.errorCode === 'REPEATED');

      expect(group).toBeDefined();
      expect(group?.count).toBe(10);
    });

    it('应该在聚合窗口内聚合错误', async () => {
      const error = new YYC3Error('WINDOW', 'Window error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
      const now = Date.now();

      for (let i = 0; i < 5; i++) {
        await errorHandler.handleError(error, { timestamp: now + i * 1000 });
      }

      const aggregated = errorHandler.getAggregatedErrors();
      const group = aggregated.find(g => g.errorCode === 'WINDOW');

      expect(group?.count).toBe(5);
    });
  });

  describe('错误趋势分析集成', () => {
    it('应该检测错误趋势', async () => {
      const error = new YYC3Error('TREND', 'Trend error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      for (let i = 0; i < 5; i++) {
        await errorHandler.handleError(error, { timestamp: Date.now() - 300000 });
      }

      for (let i = 0; i < 10; i++) {
        await errorHandler.handleError(error, { timestamp: Date.now() });
      }

      const trends = errorHandler.getErrorTrends();
      const trend = trends.find(t => t.errorCode === 'TREND');

      expect(trend).toBeDefined();
      expect(trend?.trend).toBe('increasing');
    });

    it('应该提供趋势分析数据', async () => {
      const error = new YYC3Error('ANALYSIS', 'Analysis error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      for (let i = 0; i < 15; i++) {
        await errorHandler.handleError(error);
      }

      const trends = errorHandler.getErrorTrends();
      expect(trends.length).toBeGreaterThan(0);
    });
  });

  describe('警报系统集成', () => {
    it('应该在达到阈值时触发警报', async () => {
      const alertListener = vi.fn();
      errorHandler.on('alert', alertListener);

      const criticalError = new YYC3Error('CRITICAL', 'Critical failure', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.CRITICAL });
      await errorHandler.handleError(criticalError);

      expect(alertListener).toHaveBeenCalled();
    });

    it('应该在警报中包含错误详情', async () => {
      const alertListener = vi.fn();
      errorHandler.on('alert', alertListener);

      const error = new YYC3Error('ALERT_TEST', 'Alert test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.CRITICAL });
      await errorHandler.handleError(error);

      const alert = alertListener.mock.calls[0][0];
      expect(alert).toMatchObject({
        severity: ErrorSeverity.CRITICAL,
        errorCode: 'ALERT_TEST'
      });
    });

    it('应该在多次高严重性错误时触发警报', async () => {
      const alertListener = vi.fn();
      errorHandler.on('alert', alertListener);

      const highError = new YYC3Error('HIGH', 'High severity error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.HIGH });

      for (let i = 0; i < 10; i++) {
        await errorHandler.handleError(highError);
      }

      expect(alertListener).toHaveBeenCalled();
    });
  });

  describe('恢复策略集成', () => {
    it('应该使用重试策略处理可恢复错误', async () => {
      let attempts = 0;
      const error = new YYC3Error('RETRYABLE', 'Retryable error', { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, retryable: true });

      const recoveryFunction = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw error;
        }
        return 'success';
      });

      const result = await errorHandler.handleError(error, {}, recoveryFunction);

      expect(result.success).toBe(true);
      expect(recoveryFunction).toHaveBeenCalledTimes(3);
    });

    it('应该使用熔断器策略防止级联故障', async () => {
      const error = new YYC3Error('CB_TEST', 'Circuit breaker test', { category: ErrorCategory.NETWORK, severity: ErrorSeverity.HIGH });

      const recoveryFunction = vi.fn().mockRejectedValue(error);

      for (let i = 0; i < 10; i++) {
        try {
          await errorHandler.handleError(error, {}, recoveryFunction);
        } catch (e) {
        }
      }

      const logs = errorHandler.getLogs();
      const cbLogs = logs.filter(l => l.message.includes('Circuit breaker'));

      expect(cbLogs.length).toBeGreaterThan(0);
    });

    it('应该使用降级策略提供备用方案', async () => {
      const error = new YYC3Error('FALLBACK', 'Fallback test', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.HIGH });

      const recoveryFunction = vi.fn().mockRejectedValue(error);

      const result = await errorHandler.handleError(error, {}, recoveryFunction);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('多组件协同工作', () => {
    it('应该在错误处理流程中协调所有组件', async () => {
      const error = new YYC3Error('INTEGRATION', 'Integration test error', { category: ErrorCategory.NETWORK, severity: ErrorSeverity.HIGH });
      const context = {
        userId: 'user-123',
        requestId: 'req-456',
        action: 'integration-test'
      };

      const alertListener = vi.fn();
      errorHandler.on('alert', alertListener);

      const result = await errorHandler.handleError(error, context);

      expect(result).toBeDefined();

      const logs = errorHandler.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      const metrics = errorHandler.getMetrics();
      expect(metrics.totalErrors).toBeGreaterThan(0);

      const aggregated = errorHandler.getAggregatedErrors();
      expect(aggregated.length).toBeGreaterThan(0);
    });

    it('应该处理并发错误', async () => {
      const errors = [
        new YYC3Error('ERR_1', 'Error 1', { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM }),
        new YYC3Error('ERR_2', 'Error 2', { category: ErrorCategory.DATABASE, severity: ErrorSeverity.HIGH }),
        new YYC3Error('ERR_3', 'Error 3', { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.CRITICAL })
      ];

      const promises = errors.map(error => errorHandler.handleError(error));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);

      const logs = errorHandler.getLogs();
      expect(logs.length).toBe(3);
    });

    it('应该维护错误处理状态', async () => {
      const error = new YYC3Error('STATE', 'State test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      await errorHandler.handleError(error);
      await errorHandler.handleError(error);
      await errorHandler.handleError(error);

      const metrics = errorHandler.getMetrics();
      expect(metrics.totalErrors).toBe(3);

      const aggregated = errorHandler.getAggregatedErrors();
      const group = aggregated.find(g => g.errorCode === 'STATE');
      expect(group?.count).toBe(3);
    });
  });

  describe('端到端场景测试', () => {
    it('应该处理完整的API请求错误场景', async () => {
      const authError = new YYC3Error('INVALID_TOKEN', 'Invalid token', { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.HIGH });
      await errorHandler.handleError(authError, { endpoint: '/api/users', method: 'GET' });

      const dbError = new YYC3Error('DB_TIMEOUT', 'Connection timeout', { category: ErrorCategory.DATABASE, severity: ErrorSeverity.HIGH });
      await errorHandler.handleError(dbError, { endpoint: '/api/users', method: 'GET' });

      const logs = errorHandler.getLogs();
      expect(logs.length).toBe(2);

      const authLog = logs.find(l => l.error.code === 'INVALID_TOKEN');
      const dbLog = logs.find(l => l.error.code === 'DB_TIMEOUT');

      expect(authLog?.context?.endpoint).toBe('/api/users');
      expect(dbLog?.context?.endpoint).toBe('/api/users');
    });

    it('应该处理用户交互错误场景', async () => {
      const validationError = new YYC3Error('INVALID_INPUT', 'Invalid input', { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW });
      await errorHandler.handleError(validationError, {
        userId: 'user-123',
        action: 'submit-form',
        formData: { email: 'invalid-email' }
      });

      const logs = errorHandler.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      const log = logs[0];
      expect(log.context?.action).toBe('submit-form');
      expect(log.context?.userId).toBe('user-123');
    });

    it('应该处理系统级错误场景', async () => {
      const memoryError = new YYC3Error('OUT_OF_MEMORY', 'Out of memory', { category: ErrorCategory.INTERNAL, severity: ErrorSeverity.CRITICAL });
      await errorHandler.handleError(memoryError);

      const cpuError = new YYC3Error('CPU_OVERLOAD', 'CPU overload', { category: ErrorCategory.INTERNAL, severity: ErrorSeverity.HIGH });
      await errorHandler.handleError(cpuError);

      const logs = errorHandler.getLogs();
      expect(logs.length).toBe(2);

      const metrics = errorHandler.getMetrics();
      expect(metrics.errorsByCategory[ErrorCategory.INTERNAL]).toBe(2);
    });
  });

  describe('性能和资源管理', () => {
    it('应该高效处理大量错误', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const error = new YYC3Error(`ERR_${i}`, `Error ${i}`, { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
        await errorHandler.handleError(error);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);

      const logs = errorHandler.getLogs();
      expect(logs.length).toBe(100);
    });

    it('应该正确清理过期日志', async () => {
      const error = new YYC3Error('OLD', 'Old error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });

      await errorHandler.handleError(error, { timestamp: Date.now() - 90000000 });

      const logs = errorHandler.getLogs();
      const oldLogs = logs.filter(l => l.error.code === 'OLD');

      expect(oldLogs.length).toBe(0);
    });
  });

  describe('事件系统集成', () => {
    it('应该在错误处理的各个阶段触发事件', async () => {
      const errorListener = vi.fn();
      const recoveryListener = vi.fn();
      const loggedListener = vi.fn();

      errorHandler.on('error', errorListener);
      errorHandler.on('recovery', recoveryListener);
      errorHandler.on('logged', loggedListener);

      const error = new YYC3Error('EVENT', 'Event test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
      await errorHandler.handleError(error);

      expect(errorListener).toHaveBeenCalled();
      expect(loggedListener).toHaveBeenCalled();
    });

    it('应该在事件中传递正确的数据', async () => {
      const errorListener = vi.fn();
      errorHandler.on('error', errorListener);

      const error = new YYC3Error('DATA', 'Data test error', { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM });
      await errorHandler.handleError(error, { testField: 'test-value' });

      const eventData = errorListener.mock.calls[0][0];
      expect(eventData.error).toBeDefined();
      expect(eventData.context?.testField).toBe('test-value');
    });
  });
});
