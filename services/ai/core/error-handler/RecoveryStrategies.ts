import { YYC3Error, ErrorCategory } from './ErrorTypes';
import { ErrorRecoveryStrategy } from './ErrorHandler';

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  halfOpenMaxCalls: number;
}

export interface FallbackConfig {
  fallbackValue?: any;
  fallbackFunction?: () => Promise<any>;
  cacheKey?: string;
  cacheTTL?: number;
}

export class RetryStrategy implements ErrorRecoveryStrategy {
  private config: RetryConfig;
  private attemptCounts: Map<string, number> = new Map();

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      initialDelay: config.initialDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      jitter: config.jitter ?? true
    };
  }

  canRecover(error: YYC3Error): boolean {
    return error.retryable && this.getAttemptCount(error) < this.config.maxAttempts;
  }

  async recover(error: YYC3Error): Promise<boolean> {
    const attemptCount = this.getAttemptCount(error);
    const delay = this.calculateDelay(attemptCount);

    await this.sleep(delay);

    this.incrementAttemptCount(error);

    return true;
  }

  private calculateDelay(attempt: number): number {
    let delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt);
    delay = Math.min(delay, this.config.maxDelay);

    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return delay;
  }

  private getAttemptCount(error: YYC3Error): number {
    const key = `${error.code}_${error.message}`;
    return this.attemptCounts.get(key) || 0;
  }

  private incrementAttemptCount(error: YYC3Error): void {
    const key = `${error.code}_${error.message}`;
    const current = this.attemptCounts.get(key) || 0;
    this.attemptCounts.set(key, current + 1);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(): void {
    this.attemptCounts.clear();
  }
}

export class CircuitBreakerStrategy implements ErrorRecoveryStrategy {
  private config: CircuitBreakerConfig;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private halfOpenCallCount = 0;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      timeout: config.timeout ?? 60000,
      halfOpenMaxCalls: config.halfOpenMaxCalls ?? 3
    };
  }

  canRecover(error: YYC3Error): boolean {
    this.updateState();
    if (this.state === 'open') {
      return false;
    }
    if (this.state === 'half-open' && this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
      return false;
    }
    return true;
  }

  async recover(error: YYC3Error): Promise<boolean> {
    this.updateState();
    
    if (this.state === 'open') {
      return false;
    }

    if (this.state === 'half-open') {
      this.halfOpenCallCount++;
      return this.halfOpenCallCount <= this.config.halfOpenMaxCalls;
    }

    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      this.failureCount = 0;
      this.successCount = 0;
    }

    return this.state !== 'open';
  }

  recordSuccess(): void {
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
        this.failureCount = 0;
        this.halfOpenCallCount = 0;
      }
    } else if (this.state === 'closed') {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  private updateState(): void {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.config.timeout) {
        this.state = 'half-open';
        this.halfOpenCallCount = 0;
        this.successCount = 0;
      }
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenCallCount = 0;
  }
}

export class FallbackStrategy implements ErrorRecoveryStrategy {
  private config: FallbackConfig;
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  constructor(config: FallbackConfig = {}) {
    this.config = config;
  }

  canRecover(error: YYC3Error): boolean {
    return this.config.fallbackValue !== undefined ||
           this.config.fallbackFunction !== undefined ||
           this.hasCachedValue(error);
  }

  async recover(error: YYC3Error): Promise<boolean> {
    if (this.hasCachedValue(error)) {
      return true;
    }

    if (this.config.fallbackFunction) {
      try {
        const result = await this.config.fallbackFunction();
        if (this.config.cacheKey) {
          this.cacheValue(this.config.cacheKey, result);
        }
        return true;
      } catch (fallbackError) {
        console.error('Fallback function failed:', fallbackError);
      }
    }

    return this.config.fallbackValue !== undefined;
  }

  private hasCachedValue(error: YYC3Error): boolean {
    if (!this.config.cacheKey) {
      return false;
    }

    const cached = this.cache.get(this.config.cacheKey);
    if (!cached) {
      return false;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(this.config.cacheKey);
      return false;
    }

    return true;
  }

  private cacheValue(key: string, value: any): void {
    const ttl = this.config.cacheTTL ?? 300000;
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  getFallbackValue(error: YYC3Error): any {
    if (this.hasCachedValue(error)) {
      return this.cache.get(this.config.cacheKey!)!.value;
    }
    return this.config.fallbackValue;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export class TimeoutRecoveryStrategy implements ErrorRecoveryStrategy {
  private timeouts: Map<string, number> = new Map();

  canRecover(error: YYC3Error): boolean {
    return error.category === ErrorCategory.TIMEOUT;
  }

  async recover(error: YYC3Error): Promise<boolean> {
    const key = `${error.code}_${error.message}`;
    const currentTimeout = this.timeouts.get(key) || 30000;

    const newTimeout = Math.min(currentTimeout * 2, 60000);
    this.timeouts.set(key, newTimeout);

    return true;
  }

  getTimeout(error: YYC3Error): number {
    const key = `${error.code}_${error.message}`;
    return this.timeouts.get(key) || 30000;
  }

  resetTimeout(error: YYC3Error): void {
    const key = `${error.code}_${error.message}`;
    this.timeouts.delete(key);
  }

  reset(): void {
    this.timeouts.clear();
  }
}

export class CompositeRecoveryStrategy implements ErrorRecoveryStrategy {
  private strategies: ErrorRecoveryStrategy[] = [];
  private stopOnFirstSuccess: boolean;

  constructor(strategies: ErrorRecoveryStrategy[], stopOnFirstSuccess: boolean = true) {
    this.strategies = strategies;
    this.stopOnFirstSuccess = stopOnFirstSuccess;
  }

  canRecover(error: YYC3Error): boolean {
    return this.strategies.some(strategy => strategy.canRecover(error));
  }

  async recover(error: YYC3Error): Promise<boolean> {
    let success = false;

    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        const result = await strategy.recover(error);
        if (result && this.stopOnFirstSuccess) {
          return true;
        }
        success = success || result;
      }
    }

    return success;
  }

  addStrategy(strategy: ErrorRecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  removeStrategy(strategy: ErrorRecoveryStrategy): void {
    const index = this.strategies.indexOf(strategy);
    if (index > -1) {
      this.strategies.splice(index, 1);
    }
  }

  getStrategies(): ErrorRecoveryStrategy[] {
    return [...this.strategies];
  }
}

export class AdaptiveRecoveryStrategy implements ErrorRecoveryStrategy {
  private strategies: Map<ErrorCategory, ErrorRecoveryStrategy[]> = new Map();
  private performanceMetrics: Map<string, { success: number; failure: number }> = new Map();

  canRecover(error: YYC3Error): boolean {
    const strategies = this.strategies.get(error.category) || [];
    return strategies.some(strategy => strategy.canRecover(error));
  }

  async recover(error: YYC3Error): Promise<boolean> {
    const strategies = this.strategies.get(error.category) || [];
    const strategyKey = `${error.category}_${error.code}`;

    let bestStrategy: ErrorRecoveryStrategy | null = null;
    let bestSuccessRate = -1;

    for (const strategy of strategies) {
      if (strategy.canRecover(error)) {
        const metrics = this.performanceMetrics.get(strategyKey) || { success: 0, failure: 0 };
        const total = metrics.success + metrics.failure;
        const successRate = total > 0 ? metrics.success / total : 0.5;

        if (successRate > bestSuccessRate) {
          bestSuccessRate = successRate;
          bestStrategy = strategy;
        }
      }
    }

    if (!bestStrategy) {
      return false;
    }

    try {
      const result = await bestStrategy.recover(error);
      this.recordResult(strategyKey, result);
      return result;
    } catch (recoveryError) {
      this.recordResult(strategyKey, false);
      return false;
    }
  }

  private recordResult(key: string, success: boolean): void {
    const metrics = this.performanceMetrics.get(key) || { success: 0, failure: 0 };
    if (success) {
      metrics.success++;
    } else {
      metrics.failure++;
    }
    this.performanceMetrics.set(key, metrics);
  }

  registerStrategy(category: ErrorCategory, strategy: ErrorRecoveryStrategy): void {
    if (!this.strategies.has(category)) {
      this.strategies.set(category, []);
    }
    this.strategies.get(category)!.push(strategy);
  }

  getPerformanceMetrics(): Record<string, { success: number; failure: number; successRate: number }> {
    const result: Record<string, { success: number; failure: number; successRate: number }> = {};

    for (const [key, metrics] of this.performanceMetrics.entries()) {
      const total = metrics.success + metrics.failure;
      result[key] = {
        success: metrics.success,
        failure: metrics.failure,
        successRate: total > 0 ? metrics.success / total : 0
      };
    }

    return result;
  }

  reset(): void {
    this.performanceMetrics.clear();
  }
}
