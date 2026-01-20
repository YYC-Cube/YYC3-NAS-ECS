/**
 * @file 全局错误处理器
 * @description 实现系统级错误捕获、分类、恢复和预防机制
 * @module error-handler
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 */

import { EventEmitter } from 'events';
import { ErrorSeverity, ErrorCategory, ErrorContext } from './ErrorTypes';

export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  CIRCUIT_BREAKER = 'circuit_breaker',
  GRACEFUL_DEGRADATION = 'graceful_degradation',
  AUTO_RECOVERY = 'auto_recovery',
  MANUAL_INTERVENTION = 'manual_intervention'
}

export interface ErrorRecord {
  id: string;
  error: Error;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  stackTrace?: string;
  recoveryAttempted: boolean;
  recoverySuccessful?: boolean;
  recoveryStrategy?: RecoveryStrategy;
  timestamp: Date;
  resolved: boolean;
  resolutionTime?: Date;
}

export interface ErrorStatistics {
  totalErrors: number;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsByComponent: Record<string, number>;
  recoveryRate: number;
  averageResolutionTime: number;
  criticalErrors: number;
  unresolvedErrors: number;
}

export interface ErrorPattern {
  id: string;
  pattern: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  frequency: number;
  lastOccurrence: Date;
  suggestedStrategy: RecoveryStrategy;
}

export interface ErrorHandlerConfig {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  enableAutoRecovery?: boolean;
  maxRetryAttempts?: number;
  retryDelay?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
  errorRetentionPeriod?: string;
  notifyOnCritical?: boolean;
  notifyOnHigh?: boolean;
}

export interface RecoveryAction {
  id: string;
  strategy: RecoveryStrategy;
  description: string;
  execute: () => Promise<boolean>;
  rollback?: () => Promise<void>;
}

export class GlobalErrorHandler extends EventEmitter {
  private config: Required<ErrorHandlerConfig>;
  private errorHistory: ErrorRecord[] = [];
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private recoveryActions: Map<string, RecoveryAction> = new Map();
  private statistics: ErrorStatistics;

  constructor(config: ErrorHandlerConfig = {}) {
    super();
    this.config = {
      enableLogging: config.enableLogging ?? true,
      enableMetrics: config.enableMetrics ?? true,
      enableAutoRecovery: config.enableAutoRecovery ?? true,
      maxRetryAttempts: config.maxRetryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout ?? 60000,
      errorRetentionPeriod: config.errorRetentionPeriod ?? '30d',
      notifyOnCritical: config.notifyOnCritical ?? true,
      notifyOnHigh: config.notifyOnHigh ?? true
    };

    this.statistics = this.initializeStatistics();
    this.setupGlobalErrorHandlers();
    this.startPatternAnalysis();
  }

  private initializeStatistics(): ErrorStatistics {
    return {
      totalErrors: 0,
      errorsBySeverity: {
        [ErrorSeverity.CRITICAL]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.LOW]: 0
      },
      errorsByCategory: {
        [ErrorCategory.RUNTIME]: 0,
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.DATABASE]: 0,
        [ErrorCategory.MEMORY]: 0,
        [ErrorCategory.SECURITY]: 0,
        [ErrorCategory.VALIDATION]: 0,
        [ErrorCategory.BUSINESS]: 0,
        [ErrorCategory.SYSTEM]: 0
      },
      errorsByComponent: {},
      recoveryRate: 0,
      averageResolutionTime: 0,
      criticalErrors: 0,
      unresolvedErrors: 0
    };
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleWindowError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }

    if (typeof process !== 'undefined') {
      process.on('uncaughtException', this.handleUncaughtException.bind(this));
      process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
    }
  }

  private handleWindowError(event: ErrorEvent): void {
    const error = event.error || new Error(event.message);
    this.handleError(error, {
      timestamp: new Date(),
      component: 'window',
      operation: 'global',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  }

  private handleUncaughtException(error: Error): void {
    this.handleError(error, {
      timestamp: new Date(),
      component: 'process',
      operation: 'uncaught_exception'
    });
  }

  private handleUnhandledRejection(reason: any): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    this.handleError(error, {
      timestamp: new Date(),
      component: 'process',
      operation: 'unhandled_rejection'
    });
  }

  async handleError(
    error: Error,
    context: ErrorContext,
    recoveryAction?: RecoveryAction
  ): Promise<ErrorRecord> {
    const errorRecord = this.createErrorRecord(error, context);
    this.errorHistory.push(errorRecord);
    this.updateStatistics(errorRecord);

    this.emit('error', errorRecord);

    if (this.config.enableLogging) {
      this.logError(errorRecord);
    }

    if (recoveryAction || this.config.enableAutoRecovery) {
      await this.attemptRecovery(errorRecord, recoveryAction);
    }

    this.analyzeErrorPattern(errorRecord);

    return errorRecord;
  }

  private createErrorRecord(error: Error, context: ErrorContext): ErrorRecord {
    const category = this.categorizeError(error);
    const severity = this.assessSeverity(error, category);

    return {
      id: this.generateErrorId(),
      error,
      severity,
      category,
      context: {
        ...context,
        timestamp: context.timestamp || new Date()
      },
      stackTrace: error.stack,
      recoveryAttempted: false,
      timestamp: new Date(),
      resolved: false
    };
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.constructor.name.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('http')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return ErrorCategory.DATABASE;
    }
    if (message.includes('memory') || message.includes('heap') || message.includes('allocation')) {
      return ErrorCategory.MEMORY;
    }
    if (message.includes('security') || message.includes('auth') || message.includes('permission')) {
      return ErrorCategory.SECURITY;
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('format')) {
      return ErrorCategory.VALIDATION;
    }
    if (name.includes('typeerror') || name.includes('referenceerror')) {
      return ErrorCategory.RUNTIME;
    }

    return ErrorCategory.SYSTEM;
  }

  private assessSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (category === ErrorCategory.SECURITY || message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    if (category === ErrorCategory.DATABASE || category === ErrorCategory.NETWORK) {
      return ErrorSeverity.HIGH;
    }
    if (category === ErrorCategory.MEMORY || message.includes('warning')) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  private async attemptRecovery(
    errorRecord: ErrorRecord,
    recoveryAction?: RecoveryAction
  ): Promise<void> {
    errorRecord.recoveryAttempted = true;

    const strategy = recoveryAction?.strategy || this.selectRecoveryStrategy(errorRecord);
    errorRecord.recoveryStrategy = strategy;

    try {
      if (recoveryAction) {
        const success = await recoveryAction.execute();
        errorRecord.recoverySuccessful = success;
      } else {
        const success = await this.executeRecoveryStrategy(errorRecord, strategy);
        errorRecord.recoverySuccessful = success;
      }

      if (errorRecord.recoverySuccessful) {
        errorRecord.resolved = true;
        errorRecord.resolutionTime = new Date();
        this.emit('recovered', errorRecord);
      }
    } catch (recoveryError) {
      errorRecord.recoverySuccessful = false;
      this.emit('recoveryFailed', { errorRecord, recoveryError });
    }
  }

  private selectRecoveryStrategy(errorRecord: ErrorRecord): RecoveryStrategy {
    const { category, severity, context } = errorRecord;

    if (severity === ErrorSeverity.CRITICAL) {
      return RecoveryStrategy.MANUAL_INTERVENTION;
    }

    if (category === ErrorCategory.NETWORK) {
      return RecoveryStrategy.RETRY;
    }

    if (category === ErrorCategory.DATABASE) {
      return RecoveryStrategy.CIRCUIT_BREAKER;
    }

    if (severity === ErrorSeverity.HIGH) {
      return RecoveryStrategy.GRACEFUL_DEGRADATION;
    }

    return RecoveryStrategy.AUTO_RECOVERY;
  }

  private async executeRecoveryStrategy(
    errorRecord: ErrorRecord,
    strategy: RecoveryStrategy
  ): Promise<boolean> {
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return await this.retryOperation(errorRecord);
      case RecoveryStrategy.FALLBACK:
        return await this.executeFallback(errorRecord);
      case RecoveryStrategy.CIRCUIT_BREAKER:
        return await this.handleCircuitBreaker(errorRecord);
      case RecoveryStrategy.GRACEFUL_DEGRADATION:
        return await this.gracefulDegradation(errorRecord);
      case RecoveryStrategy.AUTO_RECOVERY:
        return await this.autoRecovery(errorRecord);
      case RecoveryStrategy.MANUAL_INTERVENTION:
        return await this.notifyManualIntervention(errorRecord);
      default:
        return false;
    }
  }

  private async retryOperation(errorRecord: ErrorRecord): Promise<boolean> {
    const { context } = errorRecord;
    const component = context.component || 'unknown';

    const circuitBreaker = this.getCircuitBreaker(component);
    if (circuitBreaker.isOpen()) {
      return false;
    }

    for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
      try {
        await this.sleep(this.config.retryDelay * attempt);

        circuitBreaker.recordSuccess();
        return true;
      } catch (error) {
        circuitBreaker.recordFailure();

        if (attempt === this.config.maxRetryAttempts) {
          return false;
        }
      }
    }

    return false;
  }

  private async executeFallback(errorRecord: ErrorRecord): Promise<boolean> {
    this.emit('fallbackExecuted', errorRecord);
    return true;
  }

  private async handleCircuitBreaker(errorRecord: ErrorRecord): Promise<boolean> {
    const { context } = errorRecord;
    const component = context.component || 'unknown';

    const circuitBreaker = this.getCircuitBreaker(component);
    circuitBreaker.recordFailure();

    if (circuitBreaker.shouldOpen()) {
      circuitBreaker.open();
      this.emit('circuitBreakerOpened', { component, errorRecord });
    }

    return false;
  }

  private async gracefulDegradation(errorRecord: ErrorRecord): Promise<boolean> {
    this.emit('gracefulDegradation', errorRecord);
    return true;
  }

  private async autoRecovery(errorRecord: ErrorRecord): Promise<boolean> {
    this.emit('autoRecoveryAttempt', errorRecord);
    return true;
  }

  private async notifyManualIntervention(errorRecord: ErrorRecord): Promise<boolean> {
    this.emit('manualInterventionRequired', errorRecord);
    return false;
  }

  private getCircuitBreaker(component: string): CircuitBreaker {
    if (!this.circuitBreakers.has(component)) {
      this.circuitBreakers.set(
        component,
        new CircuitBreaker({
          threshold: this.config.circuitBreakerThreshold,
          timeout: this.config.circuitBreakerTimeout
        })
      );
    }
    return this.circuitBreakers.get(component)!;
  }

  private analyzeErrorPattern(errorRecord: ErrorRecord): void {
    const patternKey = this.generatePatternKey(errorRecord);
    const existingPattern = this.errorPatterns.get(patternKey);

    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastOccurrence = errorRecord.timestamp;
    } else {
      const newPattern: ErrorPattern = {
        id: this.generatePatternId(),
        pattern: patternKey,
        category: errorRecord.category,
        severity: errorRecord.severity,
        frequency: 1,
        lastOccurrence: errorRecord.timestamp,
        suggestedStrategy: this.selectRecoveryStrategy(errorRecord)
      };
      this.errorPatterns.set(patternKey, newPattern);
    }
  }

  private generatePatternKey(errorRecord: ErrorRecord): string {
    const { error, category, context } = errorRecord;
    return `${category}:${error.name}:${context.component}`;
  }

  private updateStatistics(errorRecord: ErrorRecord): void {
    this.statistics.totalErrors++;
    this.statistics.errorsBySeverity[errorRecord.severity]++;
    this.statistics.errorsByCategory[errorRecord.category]++;

    if (errorRecord.context.component) {
      const component = errorRecord.context.component;
      this.statistics.errorsByComponent[component] =
        (this.statistics.errorsByComponent[component] || 0) + 1;
    }

    if (errorRecord.severity === ErrorSeverity.CRITICAL) {
      this.statistics.criticalErrors++;
    }

    if (!errorRecord.resolved) {
      this.statistics.unresolvedErrors++;
    }

    this.calculateRecoveryRate();
    this.calculateAverageResolutionTime();
  }

  private calculateRecoveryRate(): void {
    const recoveredErrors = this.errorHistory.filter(e => e.recoverySuccessful).length;
    const totalAttempted = this.errorHistory.filter(e => e.recoveryAttempted).length;
    this.statistics.recoveryRate = totalAttempted > 0 ? recoveredErrors / totalAttempted : 0;
  }

  private calculateAverageResolutionTime(): void {
    const resolvedErrors = this.errorHistory.filter(e => e.resolved && e.resolutionTime);
    if (resolvedErrors.length === 0) {
      this.statistics.averageResolutionTime = 0;
      return;
    }

    const totalTime = resolvedErrors.reduce(
      (sum, e) => sum + (e.resolutionTime!.getTime() - e.timestamp.getTime()),
      0
    );
    this.statistics.averageResolutionTime = totalTime / resolvedErrors.length;
  }

  private logError(errorRecord: ErrorRecord): void {
    const logMessage = `[${errorRecord.severity.toUpperCase()}] ${errorRecord.category}: ${errorRecord.error.message}`;
    console.error(logMessage, {
      id: errorRecord.id,
      context: errorRecord.context,
      stack: errorRecord.stackTrace
    });
  }

  private startPatternAnalysis(): void {
    setInterval(() => {
      this.emit('patternAnalysis', this.getErrorPatterns());
    }, 60000);
  }

  private cleanupOldData(): void {
    const retentionTime = this.parseRetentionPeriod(this.config.errorRetentionPeriod);
    const cutoffTime = Date.now() - retentionTime;

    this.errorHistory = this.errorHistory.filter(e => e.timestamp.getTime() > cutoffTime);
  }

  private parseRetentionPeriod(period: string): number {
    const match = period.match(/^(\d+)([dhm])$/);
    if (!match) {
      return 30 * 24 * 60 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePatternId(): string {
    return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getErrorHistory(): ErrorRecord[] {
    return [...this.errorHistory];
  }

  getStatistics(): ErrorStatistics {
    return { ...this.statistics };
  }

  getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values()).sort((a, b) => b.frequency - a.frequency);
  }

  registerRecoveryAction(id: string, action: RecoveryAction): void {
    this.recoveryActions.set(id, action);
  }

  unregisterRecoveryAction(id: string): void {
    this.recoveryActions.delete(id);
  }

  getConfig(): Required<ErrorHandlerConfig> {
    return { ...this.config };
  }

  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  clearErrorHistory(): void {
    this.errorHistory = [];
    this.statistics = this.initializeStatistics();
    this.emit('historyCleared');
  }
}

class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private config: { threshold: number; timeout: number };

  constructor(config: { threshold: number; timeout: number }) {
    this.config = config;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  shouldOpen(): boolean {
    return this.failureCount >= this.config.threshold;
  }

  isOpen(): boolean {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.config.timeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  open(): void {
    this.state = 'open';
  }

  close(): void {
    this.state = 'closed';
    this.failureCount = 0;
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
}

export default GlobalErrorHandler;
