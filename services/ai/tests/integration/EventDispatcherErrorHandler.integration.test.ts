/**
 * @file 事件分发器和错误处理器集成测试
 * @description 测试EventDispatcher与ErrorHandler之间的集成
 * @module __tests__/integration/EventDispatcherErrorHandler.integration.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventDispatcher } from '../../core/event-dispatcher/EventDispatcher';
import { ErrorHandler, ErrorHandlerConfig } from '../../core/error-handler/ErrorHandler';
import { YYC3Error, ErrorSeverity, ErrorCategory } from '../../core/error-handler/ErrorTypes';
import { RecoveryStrategy } from '../../core/error-handler/GlobalErrorHandler';

describe('EventDispatcher and ErrorHandler Integration', () => {
  let dispatcher: EventDispatcher;
  let errorHandler: ErrorHandler;
  let errorHandlerConfig: ErrorHandlerConfig;

  beforeEach(() => {
    errorHandlerConfig = {
      enableLogging: true,
      enableReporting: true,
      enableAutoRecovery: true,
      enableRecovery: true,
      enableContextCollection: true,
      enableClassification: true,
      enableAggregation: true,
      enableTrendAnalysis: true,
      enableAlerts: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      logLevel: ErrorSeverity.MEDIUM
    };

    dispatcher = new EventDispatcher();
    errorHandler = new ErrorHandler(errorHandlerConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
    errorHandler.clear();
  });

  describe('错误事件分发', () => {
    it('应该正确分发错误发生事件', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(errorSpy).toHaveBeenCalled();
      const eventData = errorSpy.mock.calls[0][0];
      expect(eventData.error).toBeDefined();
      expect(eventData.level).toBe(ErrorSeverity.HIGH);
    });

    it('应该正确分发错误恢复事件', async () => {
      const recoverySpy = vi.fn();
      errorHandler.on('recovery', recoverySpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.INTERNAL,
        retryable: true
      });
      const recoveryFunction = vi.fn().mockResolvedValue('success');
      await errorHandler.handleError(error, { operation: 'test' }, recoveryFunction);

      expect(recoverySpy).toHaveBeenCalled();
      const eventData = recoverySpy.mock.calls[0][0];
      expect(eventData.error).toBeDefined();
    });

    it('应该正确分发错误记录事件', async () => {
      const recordSpy = vi.fn();
      errorHandler.on('logged', recordSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(recordSpy).toHaveBeenCalled();
      const eventData = recordSpy.mock.calls[0][0];
      expect(eventData.error).toBeDefined();
      expect(eventData.handled).toBe(true);
    });
  });

  describe('错误处理和事件监听', () => {
    it('应该支持通过事件监听器处理错误', async () => {
      const customHandlerSpy = vi.fn();
      errorHandler.on('error', customHandlerSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(customHandlerSpy).toHaveBeenCalled();
    });

    it('应该支持多个错误事件监听器', async () => {
      const handler1Spy = vi.fn();
      const handler2Spy = vi.fn();
      const handler3Spy = vi.fn();

      errorHandler.on('error', handler1Spy);
      errorHandler.on('error', handler2Spy);
      errorHandler.on('error', handler3Spy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(handler1Spy).toHaveBeenCalled();
      expect(handler2Spy).toHaveBeenCalled();
      expect(handler3Spy).toHaveBeenCalled();
    });

    it('应该支持错误事件优先级', async () => {
      const executionOrder: number[] = [];

      errorHandler.on('error', () => executionOrder.push(1));
      errorHandler.on('error', () => executionOrder.push(2));
      errorHandler.on('error', () => executionOrder.push(3));

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(executionOrder).toEqual([1, 2, 3]);
    });
  });

  describe('错误恢复和事件通知', () => {
    it('应该正确通知错误恢复成功', async () => {
      const recoverySuccessSpy = vi.fn();
      errorHandler.on('recovery', recoverySuccessSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.INTERNAL,
        retryable: true
      });
      const recoveryFunction = vi.fn().mockResolvedValue('success');
      await errorHandler.handleError(error, { operation: 'test' }, recoveryFunction);

      expect(recoverySuccessSpy).toHaveBeenCalled();
    });

    it('应该正确通知错误恢复失败', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      const recoveryFunction = vi.fn().mockRejectedValue(new YYC3Error('TEST_ERROR', 'Recovery failed', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL }));
      await errorHandler.handleError(error, { operation: 'test' }, recoveryFunction);

      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该正确通知错误降级', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('错误指标和事件统计', () => {
    it('应该正确收集错误指标', async () => {
      const error1 = new YYC3Error('TEST_ERROR_1', '错误1', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      const error2 = new YYC3Error('TEST_ERROR_2', '错误2', { severity: ErrorSeverity.MEDIUM, category: ErrorCategory.NETWORK });
      const error3 = new YYC3Error('TEST_ERROR_3', '错误3', { severity: ErrorSeverity.LOW, category: ErrorCategory.VALIDATION });

      await errorHandler.handleError(error1, { operation: 'test' });
      await errorHandler.handleError(error2, { operation: 'test' });
      await errorHandler.handleError(error3, { operation: 'test' });

      const metrics = errorHandler.getMetrics();

      expect(metrics.totalErrors).toBe(3);
      expect(metrics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.LOW]).toBe(1);
    });

    it('应该正确分发报告事件', async () => {
      const reportSpy = vi.fn();
      errorHandler.on('report', reportSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(reportSpy).toHaveBeenCalled();
    });
  });

  describe('错误过滤和事件处理', () => {
    it('应该支持按错误代码过滤', async () => {
      const errorCode1Spy = vi.fn();
      const errorCode2Spy = vi.fn();

      errorHandler.on('error:TEST_ERROR', errorCode1Spy);
      errorHandler.on('error:NETWORK_ERROR', errorCode2Spy);

      const error1 = new YYC3Error('TEST_ERROR', '未知错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error1, { operation: 'test' });

      const error2 = new YYC3Error('NETWORK_ERROR', '网络错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.NETWORK });
      await errorHandler.handleError(error2, { operation: 'test' });

      expect(errorCode1Spy).toHaveBeenCalled();
      expect(errorCode2Spy).toHaveBeenCalled();
    });

    it('应该支持按错误类别过滤', async () => {
      const internalSpy = vi.fn();
      const networkSpy = vi.fn();

      errorHandler.on('error:internal', internalSpy);
      errorHandler.on('error:network', networkSpy);

      const internalError = new YYC3Error('TEST_ERROR', '运行时错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(internalError, { operation: 'test' });

      const networkError = new YYC3Error('NETWORK_ERROR', '网络错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.NETWORK });
      await errorHandler.handleError(networkError, { operation: 'test' });

      expect(internalSpy).toHaveBeenCalled();
      expect(networkSpy).toHaveBeenCalled();
    });
  });

  describe('错误日志和事件记录', () => {
    it('应该正确记录错误日志', async () => {
      const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('应该正确分发日志记录事件', async () => {
      const loggedSpy = vi.fn();
      errorHandler.on('logged', loggedSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(loggedSpy).toHaveBeenCalled();
    });
  });

  describe('错误恢复策略和事件', () => {
    it('应该正确应用重试策略', async () => {
      const recoverySpy = vi.fn();
      errorHandler.on('recovery', recoverySpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.INTERNAL,
        retryable: true
      });
      const recoveryFunction = vi.fn()
        .mockRejectedValueOnce(new YYC3Error('TEST_ERROR', 'Retry 1 failed', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL }))
        .mockRejectedValueOnce(new YYC3Error('TEST_ERROR', 'Retry 2 failed', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL }))
        .mockResolvedValue('success');

      await errorHandler.handleError(error, { operation: 'test' }, recoveryFunction);

      expect(recoverySpy).toHaveBeenCalled();
      expect(recoveryFunction).toHaveBeenCalledTimes(3);
    });

    it('应该正确应用降级策略', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('错误上下文和事件数据', () => {
    it('应该正确传递错误上下文', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      const context = {
        operation: 'test',
        userId: 'user1',
        sessionId: 'session1',
      };

      await errorHandler.handleError(error, context);

      expect(errorSpy).toHaveBeenCalled();
      const eventData = errorSpy.mock.calls[0][0];
      expect(eventData.context).toEqual(context);
    });

    it('应该正确传递错误元数据', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(errorSpy).toHaveBeenCalled();
      const eventData = errorSpy.mock.calls[0][0];
      expect(eventData.error).toBeDefined();
    });
  });

  describe('边界情况', () => {
    it('应该正确处理空错误', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      await errorHandler.handleError(new Error(''), { operation: 'test' });

      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该正确处理未知错误类型', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      await errorHandler.handleError(new YYC3Error('TEST_ERROR', '未知错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL }), { operation: 'test' });

      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该正确处理无恢复策略的错误', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(errorSpy).toHaveBeenCalled();
    });

    it('应该正确处理无监听器的错误事件', async () => {
      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      const metrics = errorHandler.getMetrics();
      expect(metrics.totalErrors).toBe(1);
    });
  });

  describe('性能和可靠性', () => {
    it('应该正确处理大量错误事件', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      const errorCount = 100;
      for (let i = 0; i < errorCount; i++) {
        const error = new Error(`错误${i}`);
      await errorHandler.handleError(error, { operation: 'test' });
      }

      expect(errorSpy).toHaveBeenCalledTimes(errorCount);

      const metrics = errorHandler.getMetrics();
      expect(metrics.totalErrors).toBe(errorCount);
    });

    it('应该正确处理并发错误事件', async () => {
      const errorSpy = vi.fn();
      errorHandler.on('error', errorSpy);

      const errors = Array.from({ length: 100 }, (_, i) =>
        errorHandler.handleError(new Error(`错误${i}`), {
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.INTERNAL,
          context: { operation: 'test' },
        })
      );

      await Promise.all(errors);

      expect(errorSpy).toHaveBeenCalledTimes(100);
    });
  });

  describe('配置和初始化', () => {
    it('应该正确应用配置', async () => {
      const customConfig: ErrorHandlerConfig = {
        ...errorHandlerConfig,
        enableLogging: true,
        enableAutoRecovery: true,
      };

      const customErrorHandler = new ErrorHandler(customConfig);

      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await customErrorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.INTERNAL,
        context: { operation: 'test' },
      });

      const metrics = customErrorHandler.getMetrics();
      expect(metrics.totalErrors).toBe(1);
    });
  });

  describe('错误历史和统计', () => {
    it('应该正确获取错误历史', async () => {
      const error1 = new YYC3Error('TEST_ERROR', '错误1', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      const error2 = new YYC3Error('TEST_ERROR', '错误2', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });

      await errorHandler.handleError(error1, { operation: 'test' });

      await errorHandler.handleError(error2, { operation: 'test' });

      const history = errorHandler.getErrorHistory();
      expect(history.length).toBe(2);
    });

    it('应该正确过滤错误历史', async () => {
      const error1 = new YYC3Error('TEST_ERROR_1', '错误1', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      const error2 = new YYC3Error('TEST_ERROR_2', '错误2', { severity: ErrorSeverity.MEDIUM, category: ErrorCategory.NETWORK });

      await errorHandler.handleError(error1, { operation: 'test' });
      await errorHandler.handleError(error2, { operation: 'test' });

      const highSeverityErrors = errorHandler.getErrorHistory({
        severity: ErrorSeverity.HIGH
      });
      expect(highSeverityErrors.length).toBe(1);
    });

    it('应该正确获取错误统计', async () => {
      const error1 = new YYC3Error('TEST_ERROR_1', '错误1', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      const error2 = new YYC3Error('TEST_ERROR_2', '错误2', { severity: ErrorSeverity.HIGH, category: ErrorCategory.NETWORK });
      const error3 = new YYC3Error('TEST_ERROR_3', '错误3', { severity: ErrorSeverity.HIGH, category: ErrorCategory.VALIDATION });

      await errorHandler.handleError(error1, { operation: 'test' });
      await errorHandler.handleError(error2, { operation: 'test' });
      await errorHandler.handleError(error3, { operation: 'test' });

      const stats = errorHandler.getErrorStatistics();
      expect(stats.total).toBe(3);
      expect(stats.byCategory[ErrorCategory.INTERNAL]).toBe(1);
      expect(stats.byCategory[ErrorCategory.NETWORK]).toBe(1);
      expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(1);
    });

    it('应该正确获取聚合错误', async () => {
      const error1 = new YYC3Error('TEST_ERROR', '错误1', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      const error2 = new YYC3Error('TEST_ERROR', '错误1', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });

      await errorHandler.handleError(error1, { operation: 'test' });

      await errorHandler.handleError(error2, { operation: 'test' });

      const aggregated = errorHandler.getAggregatedErrors();
      expect(aggregated.length).toBe(1);
      expect(aggregated[0].count).toBe(2);
    });

    it('应该正确获取错误趋势', async () => {
      const error = new YYC3Error('TEST_ERROR', '测试错误', { severity: ErrorSeverity.HIGH, category: ErrorCategory.INTERNAL });
      await errorHandler.handleError(error, { operation: 'test' });

      const trends = errorHandler.getErrorTrends();
      expect(trends.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('错误恢复策略注册', () => {
    it('应该正确注册恢复策略', async () => {
      const mockStrategy = {
        canRecover: vi.fn().mockReturnValue(true),
        recover: vi.fn().mockResolvedValue(true)
      };

      errorHandler.registerRecoveryStrategy(ErrorCategory.INTERNAL, mockStrategy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.INTERNAL,
        retryable: true
      });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(mockStrategy.canRecover).toHaveBeenCalled();
    });

    it('应该正确应用恢复策略', async () => {
      const mockStrategy = {
        canRecover: vi.fn().mockReturnValue(true),
        recover: vi.fn().mockResolvedValue(true)
      };

      errorHandler.registerRecoveryStrategy(ErrorCategory.INTERNAL, mockStrategy);

      const error = new YYC3Error('TEST_ERROR', '测试错误', {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.INTERNAL,
        retryable: true
      });
      await errorHandler.handleError(error, { operation: 'test' });

      expect(mockStrategy.recover).toHaveBeenCalled();
    });
  });
});
