import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorClassifier } from '../../../core/error-handler/ErrorClassifier';
import {
  YYC3Error,
  ErrorSeverity,
  ErrorCategory,
  NetworkError,
  TimeoutError,
  ValidationError
} from '../../../core/error-handler/ErrorTypes';

describe('ErrorClassifier', () => {
  let classifier: ErrorClassifier;

  beforeEach(() => {
    classifier = new ErrorClassifier();
  });

  afterEach(() => {
    classifier.reset();
  });

  describe('错误分类', () => {
    it('应该正确分类网络错误', () => {
      const error = new Error('Network connection failed');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('应该正确分类超时错误', () => {
      const error = new Error('Operation timed out');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.TIMEOUT);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
    });

    it('应该正确分类验证错误', () => {
      const error = new Error('Validation failed for field email');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.VALIDATION);
      expect(result.severity).toBe(ErrorSeverity.LOW);
    });

    it('应该正确分类认证错误', () => {
      const error = new Error('Authentication failed');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
    });

    it('应该正确分类授权错误', () => {
      const error = new Error('Permission denied');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
    });

    it('应该正确分类未找到错误', () => {
      const error = new Error('Resource not found');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.NOT_FOUND);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('应该正确分类限流错误', () => {
      const error = new Error('Rate limit exceeded');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('应该正确分类冲突错误', () => {
      const error = new Error('Conflict detected');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.CONFLICT);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('应该正确分类内部错误', () => {
      const error = new Error('Internal server error');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.INTERNAL);
      expect(result.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('应该正确处理YYC3Error', () => {
      const error = new NetworkError('Connection failed');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.confidence).toBe(1.0);
    });

    it('应该对未知错误返回UNKNOWN分类', () => {
      const error = new Error('Some unknown error');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.UNKNOWN);
      expect(result.confidence).toBe(0.0);
    });
  });

  describe('错误严重性调整', () => {
    it('应该根据错误频率提高严重性', () => {
      const error = new Error('Validation failed');

      for (let i = 0; i < 5; i++) {
        classifier.recordError(error);
      }

      const result = classifier.classify(error);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('应该保持高严重性错误不变', () => {
      const error = new Error('Internal server error');

      for (let i = 0; i < 10; i++) {
        classifier.recordError(error);
      }

      const result = classifier.classify(error);
      expect(result.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('应该记录错误严重性历史', () => {
      const error = new Error('Network error');

      classifier.recordError(error);
      classifier.recordError(error);
      classifier.recordError(error);

      const frequency = classifier.getErrorFrequency('NETWORK_ERROR');
      expect(frequency).toBe(3);
    });
  });

  describe('自定义模式', () => {
    it('应该能够添加自定义模式', () => {
      const customPattern = {
        code: 'CUSTOM_ERROR',
        category: ErrorCategory.INTERNAL,
        severity: ErrorSeverity.HIGH,
        keywords: ['custom', 'special'],
        patterns: [/custom error/i]
      };

      classifier.addCustomPattern(customPattern);

      const error = new Error('This is a custom error');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.INTERNAL);
      expect(result.matchedPattern).toBe('CUSTOM_ERROR');
    });

    it('应该能够移除自定义模式', () => {
      const customPattern = {
        code: 'TEMP_ERROR',
        category: ErrorCategory.INTERNAL,
        severity: ErrorSeverity.MEDIUM,
        keywords: ['temp'],
        patterns: [/temp/i]
      };

      classifier.addCustomPattern(customPattern);
      classifier.removePattern('TEMP_ERROR');

      const error = new Error('This is a temp error');
      const result = classifier.classify(error);

      expect(result.matchedPattern).not.toBe('TEMP_ERROR');
    });

    it('应该支持自定义匹配器', () => {
      const customPattern = {
        code: 'BUSINESS_ERROR',
        category: ErrorCategory.INTERNAL,
        severity: ErrorSeverity.HIGH,
        keywords: [],
        patterns: [],
        customMatcher: (error: Error | YYC3Error) => {
          return error.message.includes('business');
        }
      };

      classifier.addCustomPattern(customPattern);

      const error = new Error('This is a business logic error');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.INTERNAL);
      expect(result.matchedPattern).toBe('BUSINESS_ERROR');
    });
  });

  describe('错误频率统计', () => {
    it('应该正确统计错误频率', () => {
      const error1 = new Error('Network error');
      const error2 = new Error('Timeout error');

      classifier.recordError(error1);
      classifier.recordError(error1);
      classifier.recordError(error2);

      expect(classifier.getErrorFrequency('NETWORK_ERROR')).toBe(2);
      expect(classifier.getErrorFrequency('TIMEOUT_ERROR')).toBe(1);
    });

    it('应该返回高频错误列表', () => {
      const error1 = new Error('Network error');
      const error2 = new Error('Timeout error');
      const error3 = new Error('Validation error');

      for (let i = 0; i < 10; i++) {
        classifier.recordError(error1);
      }
      for (let i = 0; i < 5; i++) {
        classifier.recordError(error2);
      }
      classifier.recordError(error3);

      const topErrors = classifier.getTopErrors(5);
      expect(topErrors.length).toBe(3);
      expect(topErrors[0].code).toBe('NETWORK_ERROR');
      expect(topErrors[0].frequency).toBe(10);
      expect(topErrors[1].code).toBe('TIMEOUT_ERROR');
      expect(topErrors[1].frequency).toBe(5);
    });

    it('应该限制返回的错误数量', () => {
      const errorTypes = [
        'Network error',
        'Timeout error',
        'Validation failed',
        'Authentication failed',
        'Permission denied',
        'Resource not found',
        'Rate limit exceeded',
        'Conflict detected',
        'Internal server error',
        'Another network error',
        'Another timeout error',
        'Another validation error',
        'Another authentication error',
        'Another permission error',
        'Another not found error',
        'Another rate limit error',
        'Another conflict error',
        'Another internal error',
        'Third network error',
        'Third timeout error'
      ];

      for (let i = 0; i < errorTypes.length; i++) {
        const error = new Error(errorTypes[i]);
        classifier.recordError(error);
      }

      const topErrors = classifier.getTopErrors(5);
      expect(topErrors.length).toBe(5);
    });
  });

  describe('重置功能', () => {
    it('应该重置错误频率统计', () => {
      const error = new Error('Network error');

      classifier.recordError(error);
      classifier.recordError(error);

      expect(classifier.getErrorFrequency('NETWORK_ERROR')).toBe(2);

      classifier.reset();

      expect(classifier.getErrorFrequency('NETWORK_ERROR')).toBe(0);
    });

    it('应该重置错误严重性历史', () => {
      const error = new Error('Network error');

      for (let i = 0; i < 10; i++) {
        classifier.recordError(error);
      }

      classifier.reset();

      const result = classifier.classify(error);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('模式获取', () => {
    it('应该返回所有模式', () => {
      const patterns = classifier.getPatterns();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.code === 'NETWORK_ERROR')).toBe(true);
    });

    it('应该包含默认模式', () => {
      const patterns = classifier.getPatterns();

      const defaultCodes = [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'VALIDATION_ERROR',
        'AUTHENTICATION_ERROR',
        'AUTHORIZATION_ERROR',
        'NOT_FOUND_ERROR',
        'RATE_LIMIT_ERROR',
        'CONFLICT_ERROR',
        'INTERNAL_ERROR'
      ];

      for (const code of defaultCodes) {
        expect(patterns.some(p => p.code === code)).toBe(true);
      }
    });
  });

  describe('边界情况', () => {
    it('应该处理空错误消息', () => {
      const error = new Error('');
      const result = classifier.classify(error);

      expect(result.category).toBe(ErrorCategory.UNKNOWN);
    });

    it('应该处理null错误', () => {
      const error = new Error('null');
      const result = classifier.classify(error);

      expect(result).toBeDefined();
    });

    it('应该处理特殊字符', () => {
      const error = new Error('Error with special chars: @#$%^&*()');
      const result = classifier.classify(error);

      expect(result).toBeDefined();
    });

    it('应该处理超长错误消息', () => {
      const longMessage = 'Error '.repeat(1000);
      const error = new Error(longMessage);
      const result = classifier.classify(error);

      expect(result).toBeDefined();
    });
  });
});
