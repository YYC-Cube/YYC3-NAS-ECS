import { EventEmitter } from 'events';
import {
  YYC3Error,
  ErrorSeverity,
  ErrorCategory,
  isYYC3Error,
  getErrorCode,
  getErrorCategory,
  getErrorSeverity,
  isRetryable
} from './ErrorTypes';

export interface ErrorReport {
  error: YYC3Error;
  timestamp: number;
  handled: boolean;
  recoveryAttempted: boolean;
  recoverySuccess?: boolean;
  success: boolean;
  context?: Record<string, any>;
  message?: string;
  level?: ErrorSeverity;
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableAutoRecovery: boolean;
  enableRecovery: boolean;
  enableContextCollection: boolean;
  enableClassification: boolean;
  enableAggregation: boolean;
  enableTrendAnalysis: boolean;
  enableAlerts: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  logLevel: ErrorSeverity;
  loggingConfig?: {
    enableAggregation: boolean;
    enableTrendAnalysis: boolean;
    enableAlerts: boolean;
    aggregationWindow: number;
    aggregationThreshold: number;
    alertRules: Array<{
      severity: ErrorSeverity;
      threshold: number;
      window: number;
    }>;
    retentionPeriod: number;
    maxLogEntries: number;
  };
  recoveryConfig?: {
    defaultStrategy: string;
    retryConfig: {
      maxAttempts: number;
      initialDelay: number;
      maxDelay: number;
      backoffMultiplier: number;
      jitter: boolean;
    };
    circuitBreakerConfig: {
      failureThreshold: number;
      successThreshold: number;
      timeout: number;
    };
    fallbackConfig: {
      fallbackFunction: () => any;
    };
  };
  contextCollectorConfig?: {
    includeStackTrace: boolean;
    includeSystemMetrics: boolean;
    includeApplicationMetrics: boolean;
    includeRequestMetrics: boolean;
    sanitizeSensitiveData: boolean;
    maxContextSize: number;
    retentionPeriod: number;
  };
}

export interface ErrorRecoveryStrategy {
  canRecover(error: YYC3Error): boolean;
  recover(error: YYC3Error): Promise<boolean>;
}

export class ErrorHandler extends EventEmitter {
  private config: Required<ErrorHandlerConfig>;
  private errorHistory: ErrorReport[] = [];
  private maxHistorySize = 1000;
  private recoveryStrategies: Map<ErrorCategory, ErrorRecoveryStrategy[]> = new Map();
  private alertHistory: Map<string, number> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    super();
    this.config = {
      enableLogging: config.enableLogging ?? true,
      enableReporting: config.enableReporting ?? true,
      enableAutoRecovery: config.enableAutoRecovery ?? true,
      enableRecovery: config.enableRecovery ?? true,
      enableContextCollection: config.enableContextCollection ?? true,
      enableClassification: config.enableClassification ?? true,
      enableAggregation: config.enableAggregation ?? true,
      enableTrendAnalysis: config.enableTrendAnalysis ?? true,
      enableAlerts: config.enableAlerts ?? true,
      maxRetryAttempts: config.maxRetryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      logLevel: config.logLevel ?? ErrorSeverity.MEDIUM,
      loggingConfig: config.loggingConfig ?? {
        enableAggregation: true,
        enableTrendAnalysis: true,
        enableAlerts: true,
        aggregationWindow: 60000,
        aggregationThreshold: 5,
        alertRules: [],
        retentionPeriod: 86400000,
        maxLogEntries: 10000
      },
      recoveryConfig: config.recoveryConfig ?? {
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
          fallbackFunction: async () => 'fallback-result'
        }
      },
      contextCollectorConfig: config.contextCollectorConfig ?? {
        includeStackTrace: true,
        includeSystemMetrics: true,
        includeApplicationMetrics: true,
        includeRequestMetrics: true,
        sanitizeSensitiveData: true,
        maxContextSize: 10000,
        retentionPeriod: 3600000
      }
    };
  }

  registerRecoveryStrategy(
    category: ErrorCategory,
    strategy: ErrorRecoveryStrategy
  ): void {
    if (!this.recoveryStrategies.has(category)) {
      this.recoveryStrategies.set(category, []);
    }
    this.recoveryStrategies.get(category)!.push(strategy);
  }

  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    if (!this.config.contextCollectorConfig?.sanitizeSensitiveData) {
      return context;
    }

    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken', 'authToken'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async handleError(
    error: Error | YYC3Error,
    context: Record<string, any> = {},
    recoveryFunction?: () => Promise<any>
  ): Promise<ErrorReport> {
    const yyc3Error = this.normalizeError(error);
    const sanitizedContext = this.sanitizeContext(context);
    const report: ErrorReport = {
      error: yyc3Error,
      timestamp: context.timestamp || Date.now(),
      handled: false,
      recoveryAttempted: false,
      success: false,
      message: yyc3Error.message,
      level: yyc3Error.severity,
      context: sanitizedContext
    };

    if (this.shouldLog(yyc3Error)) {
      this.logError(yyc3Error, context);
      this.emit('logged', report);
    }

    if (this.config.enableReporting) {
      this.reportError(yyc3Error, context);
    }

    if (this.config.enableAlerts && this.shouldTriggerAlert(yyc3Error)) {
      this.triggerAlert(yyc3Error, report);
    }

    if (this.config.enableAutoRecovery && isRetryable(yyc3Error)) {
      report.recoveryAttempted = true;
      if (recoveryFunction) {
        const maxAttempts = this.config.recoveryConfig?.retryConfig?.maxAttempts || this.config.maxRetryAttempts;
        const retryDelay = this.config.recoveryConfig?.retryConfig?.initialDelay || this.config.retryDelay;

        let lastError: any;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const result = await recoveryFunction();
            report.recoverySuccess = true;
            report.success = true;
            this.emit('recovery', { error: yyc3Error, result });
            break;
          } catch (recoveryError) {
            lastError = recoveryError;
            if (attempt < maxAttempts - 1) {
              await this.sleep(retryDelay);
            }
          }
        }

        if (!report.recoverySuccess) {
          report.recoverySuccess = false;
          report.success = false;
        }
      } else {
        report.recoverySuccess = await this.attemptRecovery(yyc3Error, context);
        report.success = report.recoverySuccess;
      }
    }

    report.handled = true;
    this.addToHistory(report);

    this.emit('error', report);
    this.emit(`error:${yyc3Error.code}`, report);
    this.emit(`error:${yyc3Error.category}`, report);

    return report;
  }

  private normalizeError(error: Error | YYC3Error): YYC3Error {
    if (isYYC3Error(error)) {
      return this.autoClassifyError(error);
    }

    const yyc3Error = new YYC3Error(
      'UNKNOWN_ERROR',
      error.message || '未知错误',
      {
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        retryable: false
      },
      {},
      error
    );

    return this.autoClassifyError(yyc3Error);
  }

  private autoClassifyError(error: YYC3Error): YYC3Error {
    const code = error.code.toUpperCase();
    const message = error.message.toLowerCase();

    let autoCategory = error.category;
    let autoSeverity = error.severity;

    if (autoCategory === ErrorCategory.UNKNOWN) {
      if (code.includes('CONN') || code.includes('NETWORK') || code.includes('TIMEOUT') ||
          message.includes('connection') || message.includes('network')) {
        autoCategory = ErrorCategory.NETWORK;
      } else if (code.includes('QUERY') || code.includes('DB') || code.includes('DATABASE') ||
                 message.includes('query') || message.includes('database')) {
        autoCategory = ErrorCategory.DATABASE;
      } else if (code.includes('AUTH') || code.includes('LOGIN') || code.includes('TOKEN') ||
                 message.includes('auth') || message.includes('login')) {
        autoCategory = ErrorCategory.AUTHENTICATION;
      }
    }

    autoSeverity = this.adjustSeverityByFrequency(error);

    if (autoCategory !== error.category || autoSeverity !== error.severity) {
      return new YYC3Error(
        error.code,
        error.message,
        {
          category: autoCategory,
          severity: autoSeverity,
          retryable: error.retryable
        },
        error.context,
        error.originalError
      );
    }

    return error;
  }

  private adjustSeverityByFrequency(error: YYC3Error): ErrorSeverity {
    const now = Date.now();
    const frequencyWindow = 300000;

    const recentErrors = this.errorHistory.filter(report => {
      return report.error.code === error.code &&
             now - report.timestamp < frequencyWindow;
    });

    const severityOrder = [ErrorSeverity.LOW, ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL];
    const currentIndex = severityOrder.indexOf(error.severity);

    if (recentErrors.length >= 10 && currentIndex < severityOrder.length - 1) {
      return severityOrder[currentIndex + 1];
    } else if (recentErrors.length >= 5 && currentIndex < severityOrder.length - 2) {
      return severityOrder[currentIndex + 1];
    }

    return error.severity;
  }

  private shouldLog(error: YYC3Error): boolean {
    const severityLevels = {
      [ErrorSeverity.LOW]: 1,
      [ErrorSeverity.MEDIUM]: 2,
      [ErrorSeverity.HIGH]: 3,
      [ErrorSeverity.CRITICAL]: 4
    };

    return severityLevels[error.severity] >= severityLevels[this.config.logLevel];
  }

  private logError(error: YYC3Error, context: Record<string, any>): void {
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.code}] ${error.message}`, {
      category: error.category,
      severity: error.severity,
      retryable: error.retryable,
      context,
      stack: error.stack
    });
  }

  private getLogMethod(severity: ErrorSeverity): (...args: any[]) => void {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.info;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private reportError(error: YYC3Error, context: Record<string, any>): void {
    this.emit('report', {
      error: error.toJSON(),
      context,
      timestamp: Date.now()
    });
  }

  private async attemptRecovery(
    error: YYC3Error,
    context: Record<string, any>
  ): Promise<boolean> {
    const strategies = this.recoveryStrategies.get(error.category) || [];

    for (const strategy of strategies) {
      if (strategy.canRecover(error)) {
        try {
          const success = await strategy.recover(error);
          if (success) {
            this.emit('recovered', { error, strategy });
            return true;
          }
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError);
        }
      }
    }

    return false;
  }

  private addToHistory(report: ErrorReport): void {
    this.errorHistory.push(report);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }

    this.cleanupOldLogs();
  }

  private cleanupOldLogs(): void {
    if (!this.config.loggingConfig) return;

    const now = Date.now();
    const retentionPeriod = this.config.loggingConfig.retentionPeriod;
    const maxLogEntries = this.config.loggingConfig.maxLogEntries;

    this.errorHistory = this.errorHistory.filter(report => {
      return now - report.timestamp < retentionPeriod;
    });

    if (this.errorHistory.length > maxLogEntries) {
      this.errorHistory = this.errorHistory.slice(-maxLogEntries);
    }
  }

  private shouldTriggerAlert(error: YYC3Error): boolean {
    if (!this.config.loggingConfig || !this.config.loggingConfig.alertRules) {
      return false;
    }

    const now = Date.now();
    const alertRules = this.config.loggingConfig.alertRules;

    for (const rule of alertRules) {
      if (error.severity === rule.severity) {
        const key = `${error.code}_${error.severity}`;
        const lastAlertTime = this.alertHistory.get(key) || 0;

        if (now - lastAlertTime >= rule.window) {
          const recentErrors = this.errorHistory.filter(report => {
            return report.error.code === error.code &&
                   report.error.severity === error.severity &&
                   now - report.timestamp < rule.window;
          });

          if (recentErrors.length >= rule.threshold - 1) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private triggerAlert(error: YYC3Error, report: ErrorReport): void {
    const key = `${error.code}_${error.severity}`;
    this.alertHistory.set(key, Date.now());

    this.emit('alert', {
      errorCode: error.code,
      severity: error.severity,
      category: error.category,
      message: error.message,
      timestamp: Date.now(),
      report
    });
  }

  getErrorHistory(filter?: {
    code?: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    startTime?: number;
    endTime?: number;
  }): ErrorReport[] {
    let filtered = [...this.errorHistory];

    if (filter) {
      if (filter.code) {
        filtered = filtered.filter(r => r.error.code === filter.code);
      }
      if (filter.category) {
        filtered = filtered.filter(r => r.error.category === filter.category);
      }
      if (filter.severity) {
        filtered = filtered.filter(r => r.error.severity === filter.severity);
      }
      if (filter.startTime) {
        filtered = filtered.filter(r => r.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        filtered = filtered.filter(r => r.timestamp <= filter.endTime!);
      }
    }

    return filtered;
  }

  getErrorStatistics(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    byCode: Record<string, number>;
    recoveryRate: number;
  } {
    const stats = {
      total: this.errorHistory.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byCode: {} as Record<string, number>,
      recoveryRate: 0
    };

    let recoveryAttempts = 0;
    let recoverySuccesses = 0;

    for (const report of this.errorHistory) {
      stats.byCategory[report.error.category] =
        (stats.byCategory[report.error.category] || 0) + 1;
      stats.bySeverity[report.error.severity] =
        (stats.bySeverity[report.error.severity] || 0) + 1;
      stats.byCode[report.error.code] =
        (stats.byCode[report.error.code] || 0) + 1;

      if (report.recoveryAttempted) {
        recoveryAttempts++;
        if (report.recoverySuccess) {
          recoverySuccesses++;
        }
      }
    }

    stats.recoveryRate = recoveryAttempts > 0
      ? recoverySuccesses / recoveryAttempts
      : 0;

    return stats;
  }

  clearHistory(): void {
    this.errorHistory = [];
  }

  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getLogs(filter?: {
    code?: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    startTime?: number;
    endTime?: number;
  }): ErrorReport[] {
    return this.getErrorHistory(filter);
  }

  getMetrics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByCode: Record<string, number>;
    recoveryRate: number;
  } {
    const stats = this.getErrorStatistics();
    return {
      totalErrors: stats.total,
      errorsByCategory: stats.byCategory,
      errorsBySeverity: stats.bySeverity,
      errorsByCode: stats.byCode,
      recoveryRate: stats.recoveryRate
    };
  }

  getAggregatedErrors(): Array<{
    errorCode: string;
    count: number;
    firstSeen: number;
    lastSeen: number;
    category: ErrorCategory;
    severity: ErrorSeverity;
  }> {
    const aggregated = new Map<string, {
      errorCode: string;
      count: number;
      firstSeen: number;
      lastSeen: number;
      category: ErrorCategory;
      severity: ErrorSeverity;
    }>();

    for (const report of this.errorHistory) {
      const key = report.error.code;
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          errorCode: report.error.code,
          count: 0,
          firstSeen: report.timestamp,
          lastSeen: report.timestamp,
          category: report.error.category,
          severity: report.error.severity
        });
      }

      const agg = aggregated.get(key)!;
      agg.count++;
      agg.lastSeen = report.timestamp;
    }

    return Array.from(aggregated.values());
  }

  getErrorTrends(): Array<{
    errorCode: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    recentCount: number;
    olderCount: number;
  }> {
    const trends = new Map<string, {
      errorCode: string;
      recentCount: number;
      olderCount: number;
    }>();

    const now = Date.now();
    const recentWindow = 300000;
    const olderWindow = 300000;

    for (const report of this.errorHistory) {
      const key = report.error.code;
      if (!trends.has(key)) {
        trends.set(key, {
          errorCode: report.error.code,
          recentCount: 0,
          olderCount: 0
        });
      }

      const trend = trends.get(key)!;
      if (report.timestamp >= now - recentWindow) {
        trend.recentCount++;
      } else if (report.timestamp >= now - recentWindow - olderWindow) {
        trend.olderCount++;
      }
    }

    return Array.from(trends.values()).map(t => ({
      errorCode: t.errorCode,
      trend: t.recentCount > t.olderCount ? 'increasing' :
              t.recentCount < t.olderCount ? 'decreasing' : 'stable',
      recentCount: t.recentCount,
      olderCount: t.olderCount
    }));
  }

  clear(): void {
    this.clearHistory();
    this.alertHistory.clear();
  }
}

export const globalErrorHandler = new ErrorHandler();
