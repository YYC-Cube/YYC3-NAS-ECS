/**
 * @file 错误处理系统集成
 * @description 整合统一错误处理系统与全局错误处理器
 * @module error-handler
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 */

import { ErrorHandler, ErrorBoundary, YYC3Error, ErrorCategory, ErrorSeverity } from './ErrorHandler';
import { GlobalErrorHandler, ErrorContext as GlobalErrorContext } from './GlobalErrorHandler';

export class IntegratedErrorHandler {
  private errorHandler: ErrorHandler;
  private globalErrorHandler: GlobalErrorHandler;
  private errorBoundary: ErrorBoundary;

  constructor() {
    this.errorHandler = new ErrorHandler({
      enableLogging: true,
      enableReporting: true,
      enableAutoRecovery: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      logLevel: ErrorSeverity.MEDIUM
    });

    this.globalErrorHandler = new GlobalErrorHandler({
      enableLogging: true,
      enableMetrics: true,
      enableAutoRecovery: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      errorRetentionPeriod: '7d',
      notifyOnCritical: true,
      notifyOnHigh: true
    });

    this.errorBoundary = new ErrorBoundary(this.errorHandler, {
      enableRecovery: true,
      maxRetries: 3,
      retryDelay: 1000
    });

    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    this.errorHandler.on('error', (report) => {
      const globalContext: GlobalErrorContext = {
        timestamp: new Date(report.context.timestamp || Date.now()),
        component: report.context.component,
        operation: report.context.operation,
        metadata: report.context
      };

      this.globalErrorHandler.handleError(
        report.error,
        globalContext
      );
    });

    this.errorBoundary.on('error', ({ error, errorInfo, report }) => {
      const globalContext: GlobalErrorContext = {
        timestamp: new Date(),
        component: errorInfo.componentStack || 'Unknown',
        operation: errorInfo.componentStack ? 'render' : 'unknown',
        metadata: errorInfo
      };

      this.globalErrorHandler.handleError(
        error,
        globalContext
      );
    });
  }

  async handleError(error: Error | YYC3Error, context: Record<string, any> = {}): Promise<any> {
    return this.errorHandler.handleError(error, context);
  }

  async captureError(error: Error | YYC3Error, errorInfo: any = {}): Promise<void> {
    return this.errorBoundary.captureError(error, errorInfo);
  }

  getErrorHandler(): ErrorHandler {
    return this.errorHandler;
  }

  getGlobalErrorHandler(): GlobalErrorHandler {
    return this.globalErrorHandler;
  }

  getErrorBoundary(): ErrorBoundary {
    return this.errorBoundary;
  }

  registerRecoveryStrategy(category: ErrorCategory, strategy: any): void {
    this.errorHandler.registerRecoveryStrategy(category, strategy);
  }

  async getStatistics(): Promise<any> {
    return this.globalErrorHandler.getStatistics();
  }

  async getErrorHistory(): Promise<any[]> {
    return this.globalErrorHandler.getErrorHistory();
  }

  async clearHistory(): Promise<void> {
    return this.globalErrorHandler.clearHistory();
  }

  destroy(): void {
    this.errorHandler.removeAllListeners();
    this.errorBoundary.removeAllListeners();
    this.globalErrorHandler.removeAllListeners();
  }
}

let instance: IntegratedErrorHandler | null = null;

export const getIntegratedErrorHandler = (): IntegratedErrorHandler => {
  if (!instance) {
    instance = new IntegratedErrorHandler();
  }
  return instance;
};

export const createIntegratedErrorHandler = (): IntegratedErrorHandler => {
  return new IntegratedErrorHandler();
};

export default IntegratedErrorHandler;
