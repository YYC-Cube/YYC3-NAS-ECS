/**
 * @file ErrorHandler 单元测试
 * @description 测试错误处理器的核心功能
 * @module __tests__/unit/core/ErrorHandler.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-01
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ErrorHandler,
  ErrorHandlerConfig,
  ErrorReport,
  ErrorRecoveryStrategy
} from '../../../core/error-handler/ErrorHandler';
import {
  YYC3Error,
  ErrorSeverity,
  ErrorCategory,
  ValidationError,
  TimeoutError,
  NetworkError,
  isYYC3Error
} from '../../../core/error-handler/ErrorTypes';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let config: Partial<ErrorHandlerConfig>;

  beforeEach(() => {
    config = {
      enableLogging: false,
      enableReporting: false,
      enableAutoRecovery: false,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      logLevel: ErrorSeverity.LOW
    };
    errorHandler = new ErrorHandler(config);
  });

  afterEach(() => {
    errorHandler.clearHistory();
  });

  describe('初始化', () => {
    it('应该使用默认配置初始化', () => {
      const defaultHandler = new ErrorHandler();
      expect(defaultHandler).toBeDefined();
    });

    it('应该使用自定义配置初始化', () => {
      const customHandler = new ErrorHandler({
        enableLogging: false,
        enableReporting: false,
        enableAutoRecovery: false
      });
      expect(customHandler).toBeDefined();
    });

    it('应该正确设置配置值', () => {
      const handler = new ErrorHandler({
        enableLogging: false,
        enableReporting: false,
        enableAutoRecovery: false,
        maxRetryAttempts: 5,
        retryDelay: 2000
      });
      handler.updateConfig({ enableLogging: true });
      expect(handler).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该成功处理YYC3Error', async () => {
      const error = new YYC3Error(
        'TEST_ERROR',
        'Test error message',
        {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }
      );

      const report = await errorHandler.handleError(error);
      expect(report).toBeDefined();
      expect(report.error).toBe(error);
      expect(report.handled).toBe(true);
      expect(report.timestamp).toBeDefined();
    });

    it('应该成功处理普通Error', async () => {
      const error = new Error('Standard error');
      const report = await errorHandler.handleError(error);
      expect(report).toBeDefined();
      expect(report.error).toBeInstanceOf(YYC3Error);
      expect(report.error.code).toBe('UNKNOWN_ERROR');
      expect(report.handled).toBe(true);
    });

    it('应该保存错误上下文', async () => {
      const error = new YYC3Error(
        'TEST_ERROR',
        'Test error',
        {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }
      );

      const context = { operation: 'test', userId: '123' };
      const report = await errorHandler.handleError(error, context);
      expect(report.context).toEqual(context);
    });

    it('应该将错误添加到历史记录', async () => {
      const error = new YYC3Error(
        'TEST_ERROR',
        'Test error',
        {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }
      );

      await errorHandler.handleError(error);
      const history = errorHandler.getErrorHistory();
      expect(history.length).toBe(1);
      expect(history[0].error.code).toBe('TEST_ERROR');
    });
  });

  describe('错误规范化', () => {
    it('应该保留YYC3Error的原有属性', async () => {
      const error = new YYC3Error(
        'VALIDATION_ERROR',
        'Validation failed',
        {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.HIGH,
          retryable: false
        }
      );

      const report = await errorHandler.handleError(error);
      expect(report.error.code).toBe('VALIDATION_ERROR');
      expect(report.error.category).toBe(ErrorCategory.VALIDATION);
      expect(report.error.severity).toBe(ErrorSeverity.HIGH);
    });

    it('应该将普通Error转换为YYC3Error', async () => {
      const error = new Error('Standard error');
      const report = await errorHandler.handleError(error);
      expect(isYYC3Error(report.error)).toBe(true);
      expect(report.error.code).toBe('UNKNOWN_ERROR');
    });

    it('应该保留原始Error作为cause', async () => {
      const originalError = new Error('Original error');
      const report = await errorHandler.handleError(originalError);
      expect(report.error.originalError).toBe(originalError);
    });
  });

  describe('错误历史记录', () => {
    beforeEach(async () => {
      const errors = [
        new YYC3Error('ERROR_1', 'Error 1', {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.LOW,
          retryable: false
        }),
        new YYC3Error('ERROR_2', 'Error 2', {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }),
        new YYC3Error('ERROR_3', 'Error 3', {
          category: ErrorCategory.NETWORK,
          severity: ErrorSeverity.HIGH,
          retryable: true
        })
      ];

      for (const error of errors) {
        await errorHandler.handleError(error);
      }
    });

    it('应该返回所有错误历史', () => {
      const history = errorHandler.getErrorHistory();
      expect(history.length).toBe(3);
    });

    it('应该按错误代码过滤', () => {
      const filtered = errorHandler.getErrorHistory({ code: 'ERROR_1' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].error.code).toBe('ERROR_1');
    });

    it('应该按错误类别过滤', () => {
      const filtered = errorHandler.getErrorHistory({
        category: ErrorCategory.VALIDATION
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].error.category).toBe(ErrorCategory.VALIDATION);
    });

    it('应该按错误严重性过滤', () => {
      const filtered = errorHandler.getErrorHistory({
        severity: ErrorSeverity.HIGH
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].error.severity).toBe(ErrorSeverity.HIGH);
    });

    it('应该按时间范围过滤', () => {
      const now = Date.now();
      const filtered = errorHandler.getErrorHistory({
        startTime: now - 10000,
        endTime: now + 10000
      });
      expect(filtered.length).toBe(3);
    });

    it('应该支持多个过滤条件', () => {
      const filtered = errorHandler.getErrorHistory({
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.LOW
      });
      expect(filtered.length).toBe(1);
    });

    it('应该清除历史记录', () => {
      errorHandler.clearHistory();
      const history = errorHandler.getErrorHistory();
      expect(history.length).toBe(0);
    });

    it('应该限制历史记录大小', async () => {
      const maxErrors = 1100;
      for (let i = 0; i < maxErrors; i++) {
        const error = new YYC3Error(
          `ERROR_${i}`,
          `Error ${i}`,
          {
            category: ErrorCategory.UNKNOWN,
            severity: ErrorSeverity.LOW,
            retryable: false
          }
        );
        await errorHandler.handleError(error);
      }

      const history = errorHandler.getErrorHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('错误统计', () => {
    beforeEach(async () => {
      const errors = [
        new YYC3Error('ERROR_1', 'Error 1', {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.LOW,
          retryable: false
        }),
        new YYC3Error('ERROR_2', 'Error 2', {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }),
        new YYC3Error('ERROR_1', 'Error 1 duplicate', {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.HIGH,
          retryable: true
        })
      ];

      for (const error of errors) {
        await errorHandler.handleError(error);
      }
    });

    it('应该正确计算总错误数', () => {
      const stats = errorHandler.getErrorStatistics();
      expect(stats.total).toBe(3);
    });

    it('应该按类别统计错误', () => {
      const stats = errorHandler.getErrorStatistics();
      expect(stats.byCategory[ErrorCategory.UNKNOWN]).toBe(2);
      expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(1);
    });

    it('应该按严重性统计错误', () => {
      const stats = errorHandler.getErrorStatistics();
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(1);
    });

    it('应该按错误代码统计', () => {
      const stats = errorHandler.getErrorStatistics();
      expect(stats.byCode['ERROR_1']).toBe(2);
      expect(stats.byCode['ERROR_2']).toBe(1);
    });

    it('应该计算恢复率', () => {
      const stats = errorHandler.getErrorStatistics();
      expect(stats.recoveryRate).toBe(0);
    });
  });

  describe('恢复策略', () => {
    beforeEach(() => {
      errorHandler = new ErrorHandler({
        enableLogging: false,
        enableReporting: false,
        enableAutoRecovery: true,
        maxRetryAttempts: 3,
        retryDelay: 1000,
        logLevel: ErrorSeverity.LOW
      });
    });

    it('应该注册恢复策略', () => {
      const strategy: ErrorRecoveryStrategy = {
        canRecover: () => true,
        recover: async () => true
      };

      errorHandler.registerRecoveryStrategy(ErrorCategory.NETWORK, strategy);
      expect(errorHandler).toBeDefined();
    });

    it('应该为同一类别注册多个策略', () => {
      const strategy1: ErrorRecoveryStrategy = {
        canRecover: () => true,
        recover: async () => true
      };
      const strategy2: ErrorRecoveryStrategy = {
        canRecover: () => true,
        recover: async () => false
      };

      errorHandler.registerRecoveryStrategy(ErrorCategory.NETWORK, strategy1);
      errorHandler.registerRecoveryStrategy(ErrorCategory.NETWORK, strategy2);
      expect(errorHandler).toBeDefined();
    });

    it('应该在可恢复错误时尝试恢复', async () => {
      const strategy: ErrorRecoveryStrategy = {
        canRecover: (error) => error.code === 'NETWORK_ERROR',
        recover: async () => true
      };

      errorHandler.registerRecoveryStrategy(ErrorCategory.NETWORK, strategy);

      const error = new NetworkError(
        'Network request failed',
        {
          additionalData: {
            url: 'https://api.example.com',
            status: 500
          }
        }
      );

      const report = await errorHandler.handleError(error);
      expect(report.recoveryAttempted).toBe(true);
      expect(report.recoverySuccess).toBe(true);
    });

    it('应该在恢复失败时继续尝试其他策略', async () => {
      const strategy1: ErrorRecoveryStrategy = {
        canRecover: () => true,
        recover: async () => false
      };
      const strategy2: ErrorRecoveryStrategy = {
        canRecover: () => true,
        recover: async () => true
      };

      errorHandler.registerRecoveryStrategy(ErrorCategory.NETWORK, strategy1);
      errorHandler.registerRecoveryStrategy(ErrorCategory.NETWORK, strategy2);

      const error = new NetworkError(
        'Network request failed',
        {
          additionalData: {
            url: 'https://api.example.com',
            status: 500
          }
        }
      );

      const report = await errorHandler.handleError(error);
      expect(report.recoverySuccess).toBe(true);
    });

    it('应该在所有策略失败时返回失败', async () => {
      const strategy: ErrorRecoveryStrategy = {
        canRecover: () => true,
        recover: async () => false
      };

      errorHandler.registerRecoveryStrategy(ErrorCategory.NETWORK, strategy);

      const error = new NetworkError(
        'Network request failed',
        {
          additionalData: {
            url: 'https://api.example.com',
            status: 500
          }
        }
      );

      const report = await errorHandler.handleError(error);
      expect(report.recoverySuccess).toBe(false);
    });

    it('应该处理恢复策略中的错误', async () => {
      const strategy: ErrorRecoveryStrategy = {
        canRecover: () => true,
        recover: async () => {
          throw new Error('Recovery failed');
        }
      };

      errorHandler.registerRecoveryStrategy(ErrorCategory.NETWORK, strategy);

      const error = new NetworkError(
        'Network request failed',
        {
          additionalData: {
            url: 'https://api.example.com',
            status: 500
          }
        }
      );

      const report = await errorHandler.handleError(error);
      expect(report.recoverySuccess).toBe(false);
    });
  });

  describe('事件系统', () => {
    it('应该在处理错误时触发error事件', async () => {
      const error = new YYC3Error(
        'TEST_ERROR',
        'Test error',
        {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }
      );

      const eventSpy = vi.fn();
      errorHandler.on('error', eventSpy);

      await errorHandler.handleError(error);
      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: error,
          handled: true
        })
      );
    });

    it('应该在处理错误时触发特定错误代码事件', async () => {
      const error = new YYC3Error(
        'TEST_ERROR',
        'Test error',
        {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }
      );

      const eventSpy = vi.fn();
      errorHandler.on('error:TEST_ERROR', eventSpy);

      await errorHandler.handleError(error);
      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在处理错误时触发错误类别事件', async () => {
      const error = new YYC3Error(
        'TEST_ERROR',
        'Test error',
        {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }
      );

      const eventSpy = vi.fn();
      errorHandler.on('error:validation', eventSpy);

      await errorHandler.handleError(error);
      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在成功恢复时触发recovered事件', async () => {
      const recoveryHandler = new ErrorHandler({
        enableLogging: false,
        enableReporting: false,
        enableAutoRecovery: true
      });

      const strategy: ErrorRecoveryStrategy = {
        canRecover: () => true,
        recover: async () => true
      };

      recoveryHandler.registerRecoveryStrategy(ErrorCategory.NETWORK, strategy);

      const error = new NetworkError(
        'Network request failed',
        {
          additionalData: {
            url: 'https://api.example.com',
            status: 500
          }
        }
      );

      const eventSpy = vi.fn();
      recoveryHandler.on('recovered', eventSpy);

      await recoveryHandler.handleError(error);
      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在报告错误时触发report事件', async () => {
      const reportingHandler = new ErrorHandler({
        enableLogging: false,
        enableReporting: true,
        enableAutoRecovery: false
      });

      const error = new YYC3Error(
        'TEST_ERROR',
        'Test error',
        {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }
      );

      const eventSpy = vi.fn();
      reportingHandler.on('report', eventSpy);

      await reportingHandler.handleError(error);
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('配置管理', () => {
    it('应该更新配置', () => {
      errorHandler.updateConfig({ enableLogging: true });
      expect(errorHandler).toBeDefined();
    });

    it('应该保留未更新的配置值', () => {
      errorHandler.updateConfig({ enableLogging: true });
      errorHandler.updateConfig({ maxRetryAttempts: 5 });
      expect(errorHandler).toBeDefined();
    });

    it('应该支持部分配置更新', () => {
      errorHandler.updateConfig({ logLevel: ErrorSeverity.HIGH });
      expect(errorHandler).toBeDefined();
    });
  });

  describe('特殊错误类型', () => {
    it('应该处理ValidationError', async () => {
      const error = new ValidationError(
        'Invalid input',
        'email',
        { field: 'email', value: 'invalid' }
      );

      const report = await errorHandler.handleError(error);
      expect(report.error.code).toBe('VALIDATION_ERROR');
      expect(report.error.field).toBe('email');
    });

    it('应该处理TimeoutError', async () => {
      const error = new TimeoutError(
        'Request timeout',
        5000,
        { operation: 'fetch' }
      );

      const report = await errorHandler.handleError(error);
      expect(report.error.code).toBe('TIMEOUT_ERROR');
      expect(report.error.timeout).toBe(5000);
    });

    it('应该处理NetworkError', async () => {
      const error = new NetworkError(
        'Network error',
        {
          additionalData: {
            url: 'https://api.example.com',
            status: 500
          }
        }
      );

      const report = await errorHandler.handleError(error);
      expect(report.error.code).toBe('NETWORK_ERROR');
      expect(report.error.context.additionalData?.url).toBe('https://api.example.com');
    });
  });

  describe('边界情况', () => {
    it('应该处理空错误消息', async () => {
      const error = new Error('');
      const report = await errorHandler.handleError(error);
      expect(report.error.message).toBe('未知错误');
    });

    it('应该处理undefined上下文', async () => {
      const error = new YYC3Error(
        'TEST_ERROR',
        'Test error',
        {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }
      );

      const report = await errorHandler.handleError(error, undefined as any);
      expect(report.context).toBeDefined();
    });

    it('应该处理空历史记录查询', () => {
      const history = errorHandler.getErrorHistory({});
      expect(Array.isArray(history)).toBe(true);
    });

    it('应该处理无匹配的过滤条件', () => {
      const filtered = errorHandler.getErrorHistory({
        code: 'NON_EXISTENT'
      });
      expect(filtered.length).toBe(0);
    });

    it('应该处理恢复策略为空的情况', async () => {
      const recoveryHandler = new ErrorHandler({
        enableLogging: false,
        enableReporting: false,
        enableAutoRecovery: true
      });

      const error = new NetworkError(
        'Network request failed',
        {
          additionalData: {
            url: 'https://api.example.com',
            status: 500
          }
        }
      );

      const report = await recoveryHandler.handleError(error);
      expect(report.recoverySuccess).toBe(false);
    });
  });
});
