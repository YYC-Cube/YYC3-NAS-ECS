import { EventEmitter } from 'events';
import { YYC3Error, ErrorSeverity, isYYC3Error } from './ErrorTypes';
import { ErrorHandler, ErrorReport } from './ErrorHandler';

export interface ErrorBoundaryConfig {
  fallbackComponent?: () => void;
  onError?: (error: YYC3Error, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  context?: Record<string, any>;
  attempt?: number;
  maxRetries?: number;
}

export class ErrorBoundary extends EventEmitter {
  private errorHandler: ErrorHandler;
  private config: Required<ErrorBoundaryConfig>;
  private errorCount: Map<string, number> = new Map();
  private lastErrorTime: Map<string, number> = new Map();

  constructor(
    errorHandler: ErrorHandler,
    config: ErrorBoundaryConfig = {}
  ) {
    super();
    this.errorHandler = errorHandler;
    this.config = {
      fallbackComponent: config.fallbackComponent || this.defaultFallback,
      onError: config.onError || this.defaultErrorHandler,
      enableRecovery: config.enableRecovery ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000
    };
  }

  async captureError(
    error: Error | YYC3Error,
    errorInfo: ErrorInfo = {}
  ): Promise<void> {
    const yyc3Error = this.normalizeError(error);
    const errorKey = this.getErrorKey(yyc3Error);

    this.errorCount.set(errorKey, (this.errorCount.get(errorKey) || 0) + 1);
    this.lastErrorTime.set(errorKey, Date.now());

    const report = await this.errorHandler.handleError(yyc3Error, errorInfo);

    this.config.onError(yyc3Error, errorInfo);

    this.emit('error', { error: yyc3Error, errorInfo, report });
    this.emit(`error:${yyc3Error.code}`, { error: yyc3Error, errorInfo, report });

    if (this.config.fallbackComponent) {
      this.config.fallbackComponent();
    }
  }

  async captureAsyncError<T>(
    fn: () => Promise<T>,
    errorInfo: ErrorInfo = {}
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      await this.captureError(error as Error, errorInfo);
      return null;
    }
  }

  wrapAsync<T>(
    fn: () => Promise<T>,
    errorInfo: ErrorInfo = {}
  ): () => Promise<T | null> {
    return () => this.captureAsyncError(fn, errorInfo);
  }

  wrap<T extends (...args: any[]) => any>(
    fn: T,
    errorInfo: ErrorInfo = {}
  ): T {
    return ((...args: any[]) => {
      try {
        return fn(...args);
      } catch (error) {
        this.captureError(error as Error, errorInfo);
        return null;
      }
    }) as T;
  }

  async withRetry<T>(
    fn: () => Promise<T>,
    errorInfo: ErrorInfo = {},
    maxRetries: number = this.config.maxRetries,
    retryDelay: number = this.config.retryDelay
  ): Promise<T> {
    let lastError: Error | YYC3Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries && this.shouldRetry(error as YYC3Error)) {
          await this.delay(retryDelay * Math.pow(2, attempt));
          continue;
        }

        await this.captureError(error as Error, {
          ...errorInfo,
          attempt,
          maxRetries
        });

        throw error;
      }
    }

    throw lastError;
  }

  private normalizeError(error: Error | YYC3Error): YYC3Error {
    if (isYYC3Error(error)) {
      return error;
    }

    return new YYC3Error(
      'UNKNOWN_ERROR',
      error.message || '未知错误',
      {
        category: 'unknown' as any,
        severity: ErrorSeverity.MEDIUM,
        retryable: false
      },
      {},
      error
    );
  }

  private getErrorKey(error: YYC3Error): string {
    return `${error.code}:${error.category}`;
  }

  private shouldRetry(error: YYC3Error): boolean {
    if (!this.config.enableRecovery) {
      return false;
    }

    const errorKey = this.getErrorKey(error);
    const count = this.errorCount.get(errorKey) || 0;
    const lastTime = this.lastErrorTime.get(errorKey) || 0;
    const timeSinceLastError = Date.now() - lastTime;

    if (count >= this.config.maxRetries) {
      return false;
    }

    if (timeSinceLastError < this.config.retryDelay * 1000) {
      return false;
    }

    return error.retryable;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private defaultFallback(): void {
    console.error('An error occurred. Please refresh the page.');
  }

  private defaultErrorHandler(error: YYC3Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
  }

  getErrorCount(error: YYC3Error): number {
    const errorKey = this.getErrorKey(error);
    return this.errorCount.get(errorKey) || 0;
  }

  getLastErrorTime(error: YYC3Error): number | undefined {
    const errorKey = this.getErrorKey(error);
    return this.lastErrorTime.get(errorKey);
  }

  resetErrorCount(error?: YYC3Error): void {
    if (error) {
      const errorKey = this.getErrorKey(error);
      this.errorCount.delete(errorKey);
      this.lastErrorTime.delete(errorKey);
    } else {
      this.errorCount.clear();
      this.lastErrorTime.clear();
    }
  }

  destroy(): void {
    this.errorCount.clear();
    this.lastErrorTime.clear();
    this.removeAllListeners();
  }
}

export function createErrorBoundary(
  errorHandler: ErrorHandler,
  config?: ErrorBoundaryConfig
): ErrorBoundary {
  return new ErrorBoundary(errorHandler, config);
}
