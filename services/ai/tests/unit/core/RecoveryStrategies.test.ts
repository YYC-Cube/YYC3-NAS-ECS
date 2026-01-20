import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RetryStrategy,
  CircuitBreakerStrategy,
  FallbackStrategy,
  TimeoutRecoveryStrategy,
  CompositeRecoveryStrategy,
  AdaptiveRecoveryStrategy
} from '../../../core/error-handler/RecoveryStrategies';
import { YYC3Error, ErrorCategory, ErrorSeverity, NetworkError, TimeoutError } from '../../../core/error-handler/ErrorTypes';

describe('RetryStrategy', () => {
  let retryStrategy: RetryStrategy;

  beforeEach(() => {
    retryStrategy = new RetryStrategy({
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      jitter: false
    });
  });

  afterEach(() => {
    retryStrategy.reset();
  });

  describe('canRecover', () => {
    it('应该允许重试可重试的错误', () => {
      const error = new NetworkError('Connection failed');
      expect(retryStrategy.canRecover(error)).toBe(true);
    });

    it('应该拒绝重试不可重试的错误', () => {
      const error = new YYC3Error(
        'NON_RETRYABLE',
        'Non-retryable error',
        {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.LOW,
          retryable: false
        }
      );
      expect(retryStrategy.canRecover(error)).toBe(false);
    });

    it('应该在达到最大重试次数后拒绝重试', async () => {
      const error = new NetworkError('Connection failed');

      for (let i = 0; i < 3; i++) {
        await retryStrategy.recover(error);
      }

      expect(retryStrategy.canRecover(error)).toBe(false);
    });
  });

  describe('recover', () => {
    it('应该成功恢复错误', async () => {
      const error = new NetworkError('Connection failed');
      const result = await retryStrategy.recover(error);

      expect(result).toBe(true);
    });

    it('应该使用指数退避', async () => {
      const error = new NetworkError('Connection failed');
      const delays: number[] = [];

      const originalSleep = retryStrategy['sleep'];
      retryStrategy['sleep'] = async (ms: number) => {
        delays.push(ms);
        return originalSleep.call(retryStrategy, ms);
      };

      await retryStrategy.recover(error);
      await retryStrategy.recover(error);

      expect(delays[1]).toBeGreaterThan(delays[0]);
    });

    it('应该限制最大延迟', async () => {
      const retryStrategyWithMaxDelay = new RetryStrategy({
        maxAttempts: 10,
        initialDelay: 100,
        maxDelay: 200,
        backoffMultiplier: 10,
        jitter: false
      });

      const error = new NetworkError('Connection failed');
      const delays: number[] = [];

      const originalSleep = retryStrategyWithMaxDelay['sleep'];
      retryStrategyWithMaxDelay['sleep'] = async (ms: number) => {
        delays.push(ms);
        return originalSleep.call(retryStrategyWithMaxDelay, ms);
      };

      await retryStrategyWithMaxDelay.recover(error);
      await retryStrategyWithMaxDelay.recover(error);
      await retryStrategyWithMaxDelay.recover(error);

      delays.forEach(delay => {
        expect(delay).toBeLessThanOrEqual(200);
      });
    });

    it('应该支持抖动', async () => {
      const retryStrategyWithJitter = new RetryStrategy({
        maxAttempts: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        jitter: true
      });

      const error = new NetworkError('Connection failed');
      const delays: number[] = [];

      const originalSleep = retryStrategyWithJitter['sleep'];
      retryStrategyWithJitter['sleep'] = async (ms: number) => {
        delays.push(ms);
        return originalSleep.call(retryStrategyWithJitter, ms);
      };

      await retryStrategyWithJitter.recover(error);
      await retryStrategyWithJitter.recover(error);

      const baseDelay = 100;
      const expectedDelay = baseDelay * 2;

      expect(delays[1]).toBeGreaterThan(expectedDelay * 0.5);
      expect(delays[1]).toBeLessThan(expectedDelay * 1.5);
    });
  });

  describe('reset', () => {
    it('应该重置重试计数', async () => {
      const error = new NetworkError('Connection failed');

      await retryStrategy.recover(error);
      await retryStrategy.recover(error);

      expect(retryStrategy.canRecover(error)).toBe(true);

      retryStrategy.reset();

      expect(retryStrategy.canRecover(error)).toBe(true);
    });
  });
});

describe('CircuitBreakerStrategy', () => {
  let circuitBreaker: CircuitBreakerStrategy;

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerStrategy({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      halfOpenMaxCalls: 2
    });
  });

  afterEach(() => {
    circuitBreaker.reset();
  });

  describe('canRecover', () => {
    it('应该在关闭状态下允许恢复', () => {
      const error = new NetworkError('Connection failed');
      expect(circuitBreaker.canRecover(error)).toBe(true);
    });

    it('应该在达到失败阈值后拒绝恢复', async () => {
      const error = new NetworkError('Connection failed');

      for (let i = 0; i < 3; i++) {
        await circuitBreaker.recover(error);
      }

      expect(circuitBreaker.canRecover(error)).toBe(false);
    });

    it('应该在超时后进入半开状态', async () => {
      const error = new NetworkError('Connection failed');

      for (let i = 0; i < 3; i++) {
        await circuitBreaker.recover(error);
      }

      expect(circuitBreaker.canRecover(error)).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(circuitBreaker.canRecover(error)).toBe(true);
    });
  });

  describe('recover', () => {
    it('应该记录失败并更新状态', async () => {
      const error = new NetworkError('Connection failed');

      await circuitBreaker.recover(error);
      expect(circuitBreaker.getState()).toBe('closed');

      await circuitBreaker.recover(error);
      await circuitBreaker.recover(error);
      expect(circuitBreaker.getState()).toBe('open');
    });

    it('应该在半开状态下限制调用次数', async () => {
      const error = new NetworkError('Connection failed');

      for (let i = 0; i < 3; i++) {
        await circuitBreaker.recover(error);
      }

      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(circuitBreaker.canRecover(error)).toBe(true);
      await circuitBreaker.recover(error);
      await circuitBreaker.recover(error);

      expect(circuitBreaker.canRecover(error)).toBe(false);
    });
  });

  describe('recordSuccess', () => {
    it('应该在半开状态下记录成功并转换到关闭状态', async () => {
      const error = new NetworkError('Connection failed');

      for (let i = 0; i < 3; i++) {
        await circuitBreaker.recover(error);
      }

      expect(circuitBreaker.getState()).toBe('open');

      await new Promise(resolve => setTimeout(resolve, 1100));

      circuitBreaker.canRecover(error);
      expect(circuitBreaker.getState()).toBe('half-open');

      await circuitBreaker.recover(error);
      circuitBreaker.recordSuccess();

      expect(circuitBreaker.getState()).toBe('half-open');

      await circuitBreaker.recover(error);
      circuitBreaker.recordSuccess();

      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('应该在关闭状态下减少失败计数', async () => {
      const error = new NetworkError('Connection failed');

      await circuitBreaker.recover(error);
      await circuitBreaker.recover(error);

      expect(circuitBreaker.getState()).toBe('closed');

      circuitBreaker.recordSuccess();

      const state = circuitBreaker.getState();
      expect(state).toBe('closed');
    });
  });

  describe('getState', () => {
    it('应该返回当前状态', async () => {
      expect(circuitBreaker.getState()).toBe('closed');

      const error = new NetworkError('Connection failed');

      for (let i = 0; i < 3; i++) {
        await circuitBreaker.recover(error);
      }

      expect(circuitBreaker.getState()).toBe('open');
    });
  });
});

describe('FallbackStrategy', () => {
  let fallbackStrategy: FallbackStrategy;

  beforeEach(() => {
    fallbackStrategy = new FallbackStrategy({
      fallbackValue: 'default value',
      cacheKey: 'test_key',
      cacheTTL: 1000
    });
  });

  describe('canRecover', () => {
    it('应该在有fallback值时允许恢复', () => {
      const error = new NetworkError('Connection failed');
      expect(fallbackStrategy.canRecover(error)).toBe(true);
    });

    it('应该在没有fallback值时拒绝恢复', () => {
      const strategy = new FallbackStrategy({});
      const error = new NetworkError('Connection failed');
      expect(strategy.canRecover(error)).toBe(false);
    });
  });

  describe('recover', () => {
    it('应该成功恢复', async () => {
      const error = new NetworkError('Connection failed');
      const result = await fallbackStrategy.recover(error);

      expect(result).toBe(true);
    });

    it('应该使用fallback函数', async () => {
      const fallbackFn = vi.fn().mockResolvedValue('fallback result');
      const strategy = new FallbackStrategy({
        fallbackFunction: fallbackFn
      });

      const error = new NetworkError('Connection failed');
      await strategy.recover(error);

      expect(fallbackFn).toHaveBeenCalled();
    });

    it('应该缓存fallback结果', async () => {
      const fallbackFn = vi.fn().mockResolvedValue('cached result');
      const strategy = new FallbackStrategy({
        fallbackFunction: fallbackFn,
        cacheKey: 'test_key',
        cacheTTL: 1000
      });

      const error = new NetworkError('Connection failed');
      await strategy.recover(error);
      await strategy.recover(error);

      expect(fallbackFn).toHaveBeenCalledTimes(1);
    });

    it('应该在缓存过期时重新调用fallback函数', async () => {
      const fallbackFn = vi.fn().mockResolvedValue('cached result');
      const strategy = new FallbackStrategy({
        fallbackFunction: fallbackFn,
        cacheKey: 'test_key',
        cacheTTL: 100
      });

      const error = new NetworkError('Connection failed');
      await strategy.recover(error);

      await new Promise(resolve => setTimeout(resolve, 150));

      await strategy.recover(error);

      expect(fallbackFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('getFallbackValue', () => {
    it('应该返回fallback值', () => {
      const error = new NetworkError('Connection failed');
      const value = fallbackStrategy.getFallbackValue(error);

      expect(value).toBe('default value');
    });

    it('应该返回缓存的值', async () => {
      const fallbackFn = vi.fn().mockResolvedValue('cached result');
      const strategy = new FallbackStrategy({
        fallbackFunction: fallbackFn,
        cacheKey: 'test_key',
        cacheTTL: 1000
      });

      const error = new NetworkError('Connection failed');
      await strategy.recover(error);

      const value = strategy.getFallbackValue(error);
      expect(value).toBe('cached result');
    });
  });

  describe('clearCache', () => {
    it('应该清除缓存', async () => {
      const fallbackFn = vi.fn().mockResolvedValue('cached result');
      const strategy = new FallbackStrategy({
        fallbackFunction: fallbackFn,
        cacheKey: 'test_key',
        cacheTTL: 1000
      });

      const error = new NetworkError('Connection failed');
      await strategy.recover(error);

      strategy.clearCache();

      const value = strategy.getFallbackValue(error);
      expect(value).toBeUndefined();
    });
  });
});

describe('TimeoutRecoveryStrategy', () => {
  let timeoutStrategy: TimeoutRecoveryStrategy;

  beforeEach(() => {
    timeoutStrategy = new TimeoutRecoveryStrategy();
  });

  describe('canRecover', () => {
    it('应该允许恢复超时错误', () => {
      const error = new TimeoutError('Operation timeout', 5000);
      expect(timeoutStrategy.canRecover(error)).toBe(true);
    });

    it('应该拒绝恢复非超时错误', () => {
      const error = new NetworkError('Connection failed');
      expect(timeoutStrategy.canRecover(error)).toBe(false);
    });
  });

  describe('recover', () => {
    it('应该成功恢复超时错误', async () => {
      const error = new TimeoutError('Operation timeout', 5000);
      const result = await timeoutStrategy.recover(error);

      expect(result).toBe(true);
    });

    it('应该增加超时时间', async () => {
      const error = new TimeoutError('Operation timeout', 5000);

      const initialTimeout = timeoutStrategy.getTimeout(error);
      await timeoutStrategy.recover(error);
      const increasedTimeout = timeoutStrategy.getTimeout(error);

      expect(increasedTimeout).toBeGreaterThan(initialTimeout);
    });

    it('应该限制最大超时时间', async () => {
      const error = new TimeoutError('Operation timeout', 5000);

      for (let i = 0; i < 10; i++) {
        await timeoutStrategy.recover(error);
      }

      const timeout = timeoutStrategy.getTimeout(error);
      expect(timeout).toBeLessThanOrEqual(60000);
    });
  });

  describe('resetTimeout', () => {
    it('应该重置超时时间', async () => {
      const error = new TimeoutError('Operation timeout', 5000);

      await timeoutStrategy.recover(error);
      timeoutStrategy.resetTimeout(error);

      const timeout = timeoutStrategy.getTimeout(error);
      expect(timeout).toBe(30000);
    });
  });
});

describe('CompositeRecoveryStrategy', () => {
  let compositeStrategy: CompositeRecoveryStrategy;
  let retryStrategy: RetryStrategy;
  let fallbackStrategy: FallbackStrategy;

  beforeEach(() => {
    retryStrategy = new RetryStrategy({ maxAttempts: 2 });
    fallbackStrategy = new FallbackStrategy({ fallbackValue: 'default' });
    compositeStrategy = new CompositeRecoveryStrategy(
      [retryStrategy, fallbackStrategy],
      true
    );
  });

  describe('canRecover', () => {
    it('应该在任何策略可以恢复时返回true', () => {
      const error = new NetworkError('Connection failed');
      expect(compositeStrategy.canRecover(error)).toBe(true);
    });

    it('应该在所有策略都不能恢复时返回false', () => {
      const strategy = new CompositeRecoveryStrategy([], true);
      const error = new NetworkError('Connection failed');
      expect(strategy.canRecover(error)).toBe(false);
    });
  });

  describe('recover', () => {
    it('应该在第一个成功策略后停止', async () => {
      const error = new NetworkError('Connection failed');
      const result = await compositeStrategy.recover(error);

      expect(result).toBe(true);
    });

    it('应该尝试所有策略', async () => {
      const strategy1 = {
        canRecover: vi.fn().mockReturnValue(true),
        recover: vi.fn().mockResolvedValue(false)
      };
      const strategy2 = {
        canRecover: vi.fn().mockReturnValue(true),
        recover: vi.fn().mockResolvedValue(true)
      };

      const composite = new CompositeRecoveryStrategy(
        [strategy1, strategy2],
        false
      );

      const error = new NetworkError('Connection failed');
      const result = await composite.recover(error);

      expect(strategy1.recover).toHaveBeenCalled();
      expect(strategy2.recover).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('addStrategy', () => {
    it('应该添加新策略', () => {
      const newStrategy = new FallbackStrategy({ fallbackValue: 'new' });
      compositeStrategy.addStrategy(newStrategy);

      const strategies = compositeStrategy.getStrategies();
      expect(strategies).toContain(newStrategy);
    });
  });

  describe('removeStrategy', () => {
    it('应该移除策略', () => {
      compositeStrategy.removeStrategy(fallbackStrategy);

      const strategies = compositeStrategy.getStrategies();
      expect(strategies).not.toContain(fallbackStrategy);
    });
  });
});

describe('AdaptiveRecoveryStrategy', () => {
  let adaptiveStrategy: AdaptiveRecoveryStrategy;
  let retryStrategy: RetryStrategy;
  let fallbackStrategy: FallbackStrategy;

  beforeEach(() => {
    retryStrategy = new RetryStrategy({ maxAttempts: 2 });
    fallbackStrategy = new FallbackStrategy({ fallbackValue: 'default' });
    adaptiveStrategy = new AdaptiveRecoveryStrategy();

    adaptiveStrategy.registerStrategy(ErrorCategory.NETWORK, retryStrategy);
    adaptiveStrategy.registerStrategy(ErrorCategory.NETWORK, fallbackStrategy);
  });

  describe('canRecover', () => {
    it('应该在有可用策略时返回true', () => {
      const error = new NetworkError('Connection failed');
      expect(adaptiveStrategy.canRecover(error)).toBe(true);
    });

    it('应该在无可用策略时返回false', () => {
      const error = new YYC3Error(
        'UNKNOWN',
        'Unknown error',
        {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          retryable: false
        }
      );
      expect(adaptiveStrategy.canRecover(error)).toBe(false);
    });
  });

  describe('recover', () => {
    it('应该选择成功率最高的策略', async () => {
      const error = new NetworkError('Connection failed');

      await adaptiveStrategy.recover(error);
      await adaptiveStrategy.recover(error);

      const metrics = adaptiveStrategy.getPerformanceMetrics();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
    });

    it('应该记录恢复结果', async () => {
      const error = new NetworkError('Connection failed');

      await adaptiveStrategy.recover(error);

      const metrics = adaptiveStrategy.getPerformanceMetrics();
      const key = `${ErrorCategory.NETWORK}_${error.code}`;
      expect(metrics[key]).toBeDefined();
    });
  });

  describe('registerStrategy', () => {
    it('应该注册新策略', () => {
      const newStrategy = new FallbackStrategy({ fallbackValue: 'new' });
      adaptiveStrategy.registerStrategy(ErrorCategory.TIMEOUT, newStrategy);

      const error = new TimeoutError('Operation timeout', 5000);
      expect(adaptiveStrategy.canRecover(error)).toBe(true);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('应该返回性能指标', async () => {
      const error = new NetworkError('Connection failed');

      await adaptiveStrategy.recover(error);

      const metrics = adaptiveStrategy.getPerformanceMetrics();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
    });

    it('应该计算成功率', async () => {
      const error = new NetworkError('Connection failed');

      await adaptiveStrategy.recover(error);

      const metrics = adaptiveStrategy.getPerformanceMetrics();
      const key = `${ErrorCategory.NETWORK}_${error.code}`;
      expect(metrics[key].successRate).toBeGreaterThanOrEqual(0);
      expect(metrics[key].successRate).toBeLessThanOrEqual(1);
    });
  });
});
