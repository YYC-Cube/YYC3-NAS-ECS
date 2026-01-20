import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorContextCollector, ErrorContextCollectorConfig } from '../../../core/error-handler/ErrorContextCollector';
import { ErrorContext } from '../../../core/error-handler/ErrorTypes';

describe('ErrorContextCollector', () => {
  let collector: ErrorContextCollector;
  let testError: Error;

  beforeEach(() => {
    const config: ErrorContextCollectorConfig = {
      includeStackTrace: true,
      includeSystemMetrics: true,
      includeApplicationMetrics: true,
      includeRequestMetrics: true,
      sanitizeSensitiveData: true,
      maxContextSize: 10000,
      retentionPeriod: 3600000
    };

    collector = new ErrorContextCollector(config);
    testError = new Error('Test error message');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('collect', () => {
    it('应该收集基本的错误上下文', () => {
      const context = collector.collect(testError);

      expect(context).toBeDefined();
      expect(context.timestamp).toBeTypeOf('number');
      expect(context.additionalData).toBeDefined();
    });

    it('应该包含堆栈跟踪信息', () => {
      const context = collector.collect(testError);

      expect(context.additionalData?.stackTrace).toBeDefined();
      expect(context.additionalData?.stackTrace).toBeTypeOf('string');
    });

    it('应该包含系统指标', () => {
      const context = collector.collect(testError);

      expect(context.additionalData?.systemMetrics).toBeDefined();
      expect(context.additionalData?.systemMetrics).toMatchObject({
        platform: expect.any(String),
        nodeVersion: expect.any(String),
        memoryUsage: expect.any(Object)
      });
    });

    it('应该包含应用指标', () => {
      const context = collector.collect(testError);

      expect(context.additionalData?.applicationMetrics).toBeDefined();
      expect(context.additionalData?.applicationMetrics).toMatchObject({
        uptime: expect.any(Number),
        cpuUsage: expect.any(Object)
      });
    });

    it('应该包含自定义上下文', () => {
      const customContext = {
        userId: 'user-123',
        action: 'test-action',
        requestId: 'req-456'
      };

      const context = collector.collect(testError, customContext);

      expect(context.userId).toBe('user-123');
      expect(context.action).toBe('test-action');
      expect(context.requestId).toBe('req-456');
    });

    it('应该清理敏感数据', () => {
      const customContext = {
        password: 'secret123',
        token: 'abc-def-ghi',
        apiKey: 'xyz-789',
        normalField: 'safe-data'
      };

      const context = collector.collect(testError, customContext);

      expect(context.password).toBe('[REDACTED]');
      expect(context.token).toBe('[REDACTED]');
      expect(context.apiKey).toBe('[REDACTED]');
      expect(context.normalField).toBe('safe-data');
    });

    it('应该处理没有堆栈跟踪的错误', () => {
      const errorWithoutStack = new Error('No stack error');
      delete errorWithoutStack.stack;

      const config: ErrorContextCollectorConfig = {
        includeStackTrace: true,
        includeSystemMetrics: false,
        includeApplicationMetrics: false,
        includeRequestMetrics: false,
        sanitizeSensitiveData: false
      };

      const collectorWithStack = new ErrorContextCollector(config);
      const context = collectorWithStack.collect(errorWithoutStack);

      expect(context.additionalData?.stackTrace).toBeUndefined();
    });

    it('应该根据配置选择性收集指标', () => {
      const config: ErrorContextCollectorConfig = {
        includeStackTrace: false,
        includeSystemMetrics: false,
        includeApplicationMetrics: false,
        includeRequestMetrics: false,
        sanitizeSensitiveData: false
      };

      const minimalCollector = new ErrorContextCollector(config);
      const context = minimalCollector.collect(testError);

      expect(context.additionalData).toBeUndefined();
    });

    it('应该正确格式化堆栈跟踪', () => {
      const context = collector.collect(testError);
      const stackTrace = context.additionalData?.stackTrace as string;

      expect(stackTrace).toContain('Error:');
      expect(stackTrace).toContain('at ');
    });
  });

  describe('sanitizeContext', () => {
    it('应该清理密码字段', () => {
      const context: ErrorContext = {
        timestamp: Date.now(),
        password: 'my-secret-password',
        userPassword: 'another-secret'
      };

      collector['sanitizeContext'](context);

      expect(context.password).toBe('[REDACTED]');
      expect(context.userPassword).toBe('[REDACTED]');
    });

    it('应该清理token字段', () => {
      const context: ErrorContext = {
        timestamp: Date.now(),
        accessToken: 'token-123',
        refreshToken: 'refresh-456',
        authToken: 'auth-789'
      };

      collector['sanitizeContext'](context);

      expect(context.accessToken).toBe('[REDACTED]');
      expect(context.refreshToken).toBe('[REDACTED]');
      expect(context.authToken).toBe('[REDACTED]');
    });

    it('应该清理API密钥', () => {
      const context: ErrorContext = {
        timestamp: Date.now(),
        apiKey: 'api-key-123',
        secretKey: 'secret-456',
        privateKey: 'private-789'
      };

      collector['sanitizeContext'](context);

      expect(context.apiKey).toBe('[REDACTED]');
      expect(context.secretKey).toBe('[REDACTED]');
      expect(context.privateKey).toBe('[REDACTED]');
    });

    it('应该清理信用卡信息', () => {
      const context: ErrorContext = {
        timestamp: Date.now(),
        creditCard: '4111111111111111',
        cardNumber: '5500000000000004'
      };

      collector['sanitizeContext'](context);

      expect(context.creditCard).toBe('[REDACTED]');
      expect(context.cardNumber).toBe('[REDACTED]');
    });

    it('应该清理嵌套对象中的敏感数据', () => {
      const context: ErrorContext = {
        timestamp: Date.now(),
        user: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'secret123'
        },
        request: {
          headers: {
            authorization: 'Bearer token123'
          }
        }
      };

      collector['sanitizeContext'](context);

      expect(context.user.password).toBe('[REDACTED]');
      expect(context.request.headers.authorization).toBe('[REDACTED]');
      expect(context.user.name).toBe('Test User');
      expect(context.user.email).toBe('test@example.com');
    });

    it('应该清理数组中的敏感数据', () => {
      const context: ErrorContext = {
        timestamp: Date.now(),
        users: [
          { name: 'User1', password: 'pass1' },
          { name: 'User2', password: 'pass2' }
        ]
      };

      collector['sanitizeContext'](context);

      expect(context.users[0].password).toBe('[REDACTED]');
      expect(context.users[1].password).toBe('[REDACTED]');
      expect(context.users[0].name).toBe('User1');
      expect(context.users[1].name).toBe('User2');
    });

    it('应该不清理非敏感字段', () => {
      const context: ErrorContext = {
        timestamp: Date.now(),
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        message: 'Normal message'
      };

      collector['sanitizeContext'](context);

      expect(context.userId).toBe('user-123');
      expect(context.username).toBe('testuser');
      expect(context.email).toBe('test@example.com');
      expect(context.message).toBe('Normal message');
    });
  });

  describe('collectSystemMetrics', () => {
    it('应该收集系统平台信息', () => {
      const metrics = collector['collectSystemMetrics']();

      expect(metrics).toBeDefined();
      expect(metrics.platform).toBeTypeOf('string');
      expect(metrics.nodeVersion).toBeTypeOf('string');
    });

    it('应该收集内存使用情况', () => {
      const metrics = collector['collectSystemMetrics']();

      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.memoryUsage.heapUsed).toBeTypeOf('number');
      expect(metrics.memoryUsage.heapTotal).toBeTypeOf('number');
      expect(metrics.memoryUsage.external).toBeTypeOf('number');
    });

    it('应该收集CPU使用情况', () => {
      const metrics = collector['collectSystemMetrics']();

      expect(metrics.cpuUsage).toBeDefined();
      expect(metrics.cpuUsage.user).toBeTypeOf('number');
      expect(metrics.cpuUsage.system).toBeTypeOf('number');
    });
  });

  describe('collectApplicationMetrics', () => {
    it('应该收集应用运行时间', () => {
      const metrics = collector['collectApplicationMetrics']();

      expect(metrics).toBeDefined();
      expect(metrics.uptime).toBeGreaterThan(0);
    });

    it('应该收集CPU使用率', () => {
      const metrics = collector['collectApplicationMetrics']();

      expect(metrics.cpuUsage).toBeDefined();
      expect(metrics.cpuUsage.percent).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage.percent).toBeLessThanOrEqual(100);
    });
  });

  describe('formatStackTrace', () => {
    it('应该格式化堆栈跟踪', () => {
      const stackTrace = `
Error: Test error
    at Object.<anonymous> (/path/to/file.js:10:5)
    at Module._compile (internal/modules/cjs/loader.js:999:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1023:10)
      `;

      const formatted = collector['formatStackTrace'](stackTrace);

      expect(formatted).toBeTypeOf('string');
      expect(formatted).toContain('Error: Test error');
    });

    it('应该处理空堆栈跟踪', () => {
      const formatted = collector['formatStackTrace']('');

      expect(formatted).toBe('');
    });

    it('应该处理undefined堆栈跟踪', () => {
      const formatted = collector['formatStackTrace'](undefined as any);

      expect(formatted).toBe('');
    });
  });

  describe('上下文大小限制', () => {
    it('应该限制上下文大小', () => {
      const config: ErrorContextCollectorConfig = {
        includeStackTrace: false,
        includeSystemMetrics: false,
        includeApplicationMetrics: false,
        includeRequestMetrics: false,
        includeCustomData: true,
        sanitizeSensitiveData: false,
        maxContextSize: 10000
      };

      const limitedCollector = new ErrorContextCollector(config);
      const largeContext: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        largeContext[`field${i}`] = 'x'.repeat(100);
      }

      const context = limitedCollector.collect(testError, largeContext);

      const contextSize = JSON.stringify(context).length;
      expect(contextSize).toBeLessThanOrEqual(10000);
    });

    it('应该在超过限制时截断数据', () => {
      const config: ErrorContextCollectorConfig = {
        includeStackTrace: false,
        includeSystemMetrics: false,
        includeApplicationMetrics: false,
        includeRequestMetrics: false,
        includeCustomData: true,
        sanitizeSensitiveData: false,
        maxContextSize: 100
      };

      const limitedCollector = new ErrorContextCollector(config);
      const largeData = { data: 'x'.repeat(200) };

      const context = limitedCollector.collect(testError, largeData);

      const contextSize = JSON.stringify(context).length;
      expect(contextSize).toBeLessThanOrEqual(100);
    });
  });

  describe('性能测试', () => {
    it('应该快速收集上下文', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        collector.collect(new Error(`Error ${i}`));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('应该快速清理敏感数据', () => {
      const context: ErrorContext = {
        timestamp: Date.now(),
        password: 'secret',
        token: 'token123',
        apiKey: 'key456',
        user: {
          password: 'user-secret',
          data: 'normal'
        }
      };

      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        collector['sanitizeContext'](context);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });
});
