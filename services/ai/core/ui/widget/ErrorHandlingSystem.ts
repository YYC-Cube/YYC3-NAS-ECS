/**
 * @file 错误处理系统
 * @description 统一的错误处理、错误恢复和错误报告系统
 * @module core/ui/widget/ErrorHandlingSystem
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 * @updated 2026-01-03
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { EventEmitter } from 'events';

export interface ErrorHandlingConfig {
  enabled?: boolean;
  enableAutoRecovery?: boolean;
  enableErrorReporting?: boolean;
  enableErrorLogging?: boolean;
  enableErrorAlerting?: boolean;
  maxErrorHistory?: number;
  errorRetentionDays?: number;
  recoveryAttempts?: number;
  recoveryDelay?: number;
  onCriticalError?: (error: CriticalError) => void;
  onErrorRecovered?: (error: ErrorInfo) => void;
  onErrorLogged?: (error: ErrorInfo) => void;
}

export interface ErrorInfo {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  message: string;
  stack?: string;
  component: string;
  timestamp: number;
  context: Record<string, any>;
  userImpact: UserImpact;
  recoveryStatus: RecoveryStatus;
  recoveryAttempts: number;
  resolved: boolean;
  resolvedAt?: number;
}

export type ErrorType = 
  | 'runtime'
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'resource'
  | 'configuration'
  | 'dependency'
  | 'system'
  | 'custom';

export type ErrorSeverity = 
  | 'info'
  | 'warning'
  | 'error'
  | 'critical';

export type UserImpact = 
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type RecoveryStatus = 
  | 'pending'
  | 'attempting'
  | 'recovering'
  | 'recovered'
  | 'failed'
  | 'manual_required';

export interface CriticalError extends ErrorInfo {
  requiresImmediateAction: boolean;
  affectedSystems: string[];
  suggestedActions: string[];
}

export interface ErrorRecoveryStrategy {
  id: string;
  name: string;
  errorTypes: ErrorType[];
  severity: ErrorSeverity[];
  action: RecoveryAction;
  priority: number;
  maxAttempts: number;
  cooldownPeriod: number;
}

export type RecoveryAction = 
  | 'retry'
  | 'restart_component'
  | 'reset_state'
  | 'fallback'
  | 'degrade_service'
  | 'manual_intervention'
  | 'ignore';

export interface ErrorReport {
  id: string;
  errors: ErrorInfo[];
  summary: ErrorSummary;
  generatedAt: number;
  period: {
    start: number;
    end: number;
  };
}

export interface ErrorSummary {
  totalErrors: number;
  byType: Record<ErrorType, number>;
  bySeverity: Record<ErrorSeverity, number>;
  byComponent: Record<string, number>;
  topErrors: Array<{
    error: ErrorInfo;
    count: number;
  }>;
  trends: {
    increasing: ErrorType[];
    decreasing: ErrorType[];
    stable: ErrorType[];
  };
}

export interface ErrorMetrics {
  totalErrors: number;
  criticalErrors: number;
  recoveredErrors: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  errorRate: number;
  lastErrorTime: number;
  recoverySuccessRate: number;
}

export class ErrorHandlingSystem extends EventEmitter {
  private config: Required<ErrorHandlingConfig>;
  private errors: ErrorInfo[];
  private criticalErrors: CriticalError[];
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy>;
  private metrics: ErrorMetrics;
  private enabled: boolean;
  private autoRecoveryEnabled: boolean;
  private errorReportingEnabled: boolean;
  private errorLoggingEnabled: boolean;
  private errorAlertingEnabled: boolean;
  private maxErrorHistory: number;
  private errorRetentionDays: number;
  private recoveryAttempts: number;
  private recoveryDelay: number;
  private activeRecoveries: Map<string, NodeJS.Timeout>;

  constructor(config: ErrorHandlingConfig = {}) {
    super();

    this.config = {
      enabled: true,
      enableAutoRecovery: true,
      enableErrorReporting: true,
      enableErrorLogging: true,
      enableErrorAlerting: true,
      maxErrorHistory: 1000,
      errorRetentionDays: 30,
      recoveryAttempts: 3,
      recoveryDelay: 1000,
      onCriticalError: undefined,
      onErrorRecovered: undefined,
      onErrorLogged: undefined,
      ...config,
    };

    this.errors = [];
    this.criticalErrors = [];
    this.recoveryStrategies = new Map();
    this.activeRecoveries = new Map();
    this.metrics = {
      totalErrors: 0,
      criticalErrors: 0,
      recoveredErrors: 0,
      failedRecoveries: 0,
      averageRecoveryTime: 0,
      errorRate: 0,
      lastErrorTime: 0,
      recoverySuccessRate: 0,
    };

    this.enabled = this.config.enabled;
    this.autoRecoveryEnabled = this.config.enableAutoRecovery;
    this.errorReportingEnabled = this.config.enableErrorReporting;
    this.errorLoggingEnabled = this.config.enableErrorLogging;
    this.errorAlertingEnabled = this.config.enableErrorAlerting;
    this.maxErrorHistory = this.config.maxErrorHistory;
    this.errorRetentionDays = this.config.errorRetentionDays;
    this.recoveryAttempts = this.config.recoveryAttempts;
    this.recoveryDelay = this.config.recoveryDelay;

    this.initializeDefaultStrategies();
    this.startErrorCleanup();
  }

  private initializeDefaultStrategies(): void {
    const defaultStrategies: ErrorRecoveryStrategy[] = [
      {
        id: 'network-retry',
        name: 'Network Error Retry',
        errorTypes: ['network'],
        severity: ['error'],
        action: 'retry',
        priority: 1,
        maxAttempts: 3,
        cooldownPeriod: 2000,
      },
      {
        id: 'resource-restart',
        name: 'Resource Restart',
        errorTypes: ['resource'],
        severity: ['critical'],
        action: 'restart_component',
        priority: 2,
        maxAttempts: 2,
        cooldownPeriod: 5000,
      },
      {
        id: 'validation-fallback',
        name: 'Validation Fallback',
        errorTypes: ['validation'],
        severity: ['warning', 'error'],
        action: 'fallback',
        priority: 3,
        maxAttempts: 1,
        cooldownPeriod: 0,
      },
      {
        id: 'system-reset',
        name: 'System Reset',
        errorTypes: ['system'],
        severity: ['critical'],
        action: 'reset_state',
        priority: 1,
        maxAttempts: 2,
        cooldownPeriod: 10000,
      },
      {
        id: 'degrade-service',
        name: 'Service Degradation',
        errorTypes: ['runtime', 'dependency'],
        severity: ['error'],
        action: 'degrade_service',
        priority: 4,
        maxAttempts: 1,
        cooldownPeriod: 0,
      },
    ];

    defaultStrategies.forEach(strategy => {
      this.recoveryStrategies.set(strategy.id, strategy);
    });
  }

  private startErrorCleanup(): void {
    setInterval(() => {
      this.cleanupOldErrors();
    }, 3600000);
  }

  private cleanupOldErrors(): void {
    const cutoffTime = Date.now() - (this.errorRetentionDays * 24 * 60 * 60 * 1000);
    
    this.errors = this.errors.filter(error => error.timestamp > cutoffTime);
    this.criticalErrors = this.criticalErrors.filter(error => error.timestamp > cutoffTime);
  }

  public handleError(error: Error | ErrorInfo, component: string = 'unknown', context: Record<string, any> = {}): ErrorInfo {
    if (!this.enabled) {
      return this.createErrorInfo(error, component, context);
    }

    const errorInfo = this.createErrorInfo(error, component, context);
    
    this.errors.push(errorInfo);
    this.metrics.totalErrors++;
    this.metrics.lastErrorTime = Date.now();

    if (errorInfo.severity === 'critical') {
      const criticalError = this.createCriticalError(errorInfo);
      this.criticalErrors.push(criticalError);
      this.metrics.criticalErrors++;

      this.emit('critical:error', criticalError);

      if (this.config.onCriticalError) {
        this.config.onCriticalError(criticalError);
      }

      if (this.errorAlertingEnabled) {
        this.sendCriticalAlert(criticalError);
      }
    }

    if (this.errorLoggingEnabled) {
      this.logError(errorInfo);

      if (this.config.onErrorLogged) {
        this.config.onErrorLogged(errorInfo);
      }
    }

    this.emit('error:occurred', errorInfo);

    if (this.autoRecoveryEnabled && errorInfo.recoveryStatus === 'pending') {
      this.attemptRecovery(errorInfo);
    }

    this.cleanupOldErrors();

    return errorInfo;
  }

  private createErrorInfo(error: Error | ErrorInfo, component: string, context: Record<string, any>): ErrorInfo {
    if (this.isErrorInfo(error)) {
      return error;
    }

    return {
      id: this.generateErrorId(),
      type: this.determineErrorType(error),
      severity: this.determineErrorSeverity(error),
      code: error.name || 'UNKNOWN',
      message: error.message || 'Unknown error occurred',
      stack: error.stack,
      component,
      timestamp: Date.now(),
      context,
      userImpact: this.determineUserImpact(error),
      recoveryStatus: 'pending',
      recoveryAttempts: 0,
      resolved: false,
    };
  }

  private isErrorInfo(error: any): error is ErrorInfo {
    return error && typeof error === 'object' && 'id' in error && 'type' in error;
  }

  private createCriticalError(errorInfo: ErrorInfo): CriticalError {
    return {
      ...errorInfo,
      requiresImmediateAction: true,
      affectedSystems: this.determineAffectedSystems(errorInfo),
      suggestedActions: this.generateSuggestedActions(errorInfo),
    };
  }

  private determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('request')) {
      return 'network';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return 'authentication';
    }
    if (message.includes('permission') || message.includes('access')) {
      return 'authorization';
    }
    if (message.includes('memory') || message.includes('resource')) {
      return 'resource';
    }
    if (message.includes('config') || message.includes('setting')) {
      return 'configuration';
    }
    if (message.includes('dependency') || message.includes('module')) {
      return 'dependency';
    }

    return 'runtime';
  }

  private determineErrorSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical';
    }
    if (message.includes('error') || message.includes('fail')) {
      return 'error';
    }
    if (message.includes('warning') || message.includes('warn')) {
      return 'warning';
    }

    return 'info';
  }

  private determineUserImpact(error: Error): UserImpact {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal') || message.includes('crash')) {
      return 'critical';
    }
    if (message.includes('error') || message.includes('fail')) {
      return 'high';
    }
    if (message.includes('warning') || message.includes('degrade')) {
      return 'medium';
    }

    return 'low';
  }

  private determineAffectedSystems(errorInfo: ErrorInfo): string[] {
    const affected: string[] = [errorInfo.component];

    if (errorInfo.type === 'network') {
      affected.push('ExecutionSystem', 'WebSocketManager');
    }
    if (errorInfo.type === 'resource') {
      affected.push('ManagementSystem', 'OptimizationSystem');
    }
    if (errorInfo.type === 'system') {
      affected.push('AnalysisSystem', 'ExecutionSystem', 'OptimizationSystem', 'LearningSystem', 'ManagementSystem');
    }

    return affected;
  }

  private generateSuggestedActions(errorInfo: ErrorInfo): string[] {
    const actions: string[] = [];

    switch (errorInfo.type) {
      case 'network':
        actions.push('Check network connection');
        actions.push('Verify API endpoints are accessible');
        actions.push('Review firewall settings');
        break;
      case 'resource':
        actions.push('Check system resources (CPU, memory)');
        actions.push('Close unnecessary applications');
        actions.push('Increase resource allocation');
        break;
      case 'authentication':
        actions.push('Verify user credentials');
        actions.push('Check authentication token validity');
        actions.push('Review authentication service status');
        break;
      case 'system':
        actions.push('Restart the application');
        actions.push('Check system logs for details');
        actions.push('Contact support if issue persists');
        break;
      default:
        actions.push('Review error details');
        actions.push('Check system logs');
        actions.push('Contact support if needed');
    }

    return actions;
  }

  private async attemptRecovery(errorInfo: ErrorInfo): Promise<void> {
    const strategy = this.findRecoveryStrategy(errorInfo);

    if (!strategy) {
      errorInfo.recoveryStatus = 'manual_required';
      return;
    }

    errorInfo.recoveryStatus = 'attempting';
    this.emit('recovery:attempting', errorInfo, strategy);

    const recoveryId = `${errorInfo.id}-${Date.now()}`;

    const timeoutId = setTimeout(async () => {
      try {
        const recovered = await this.executeRecoveryAction(errorInfo, strategy);

        if (recovered) {
          errorInfo.recoveryStatus = 'recovered';
          errorInfo.resolved = true;
          errorInfo.resolvedAt = Date.now();
          this.metrics.recoveredErrors++;

          this.emit('recovery:success', errorInfo, strategy);

          if (this.config.onErrorRecovered) {
            this.config.onErrorRecovered(errorInfo);
          }
        } else {
          errorInfo.recoveryStatus = 'failed';
          this.metrics.failedRecoveries++;

          this.emit('recovery:failed', errorInfo, strategy);
        }
      } catch (recoveryError) {
        errorInfo.recoveryStatus = 'failed';
        this.metrics.failedRecoveries++;

        this.emit('recovery:error', errorInfo, recoveryError);
      } finally {
        this.activeRecoveries.delete(recoveryId);
      }
    }, this.recoveryDelay);

    this.activeRecoveries.set(recoveryId, timeoutId);
  }

  private findRecoveryStrategy(errorInfo: ErrorInfo): ErrorRecoveryStrategy | null {
    const strategies = Array.from(this.recoveryStrategies.values());

    const matchingStrategies = strategies.filter(strategy =>
      strategy.errorTypes.includes(errorInfo.type) &&
      strategy.severity.includes(errorInfo.severity)
    );

    if (matchingStrategies.length === 0) {
      return null;
    }

    matchingStrategies.sort((a, b) => a.priority - b.priority);

    return matchingStrategies[0];
  }

  private async executeRecoveryAction(errorInfo: ErrorInfo, strategy: ErrorRecoveryStrategy): Promise<boolean> {
    const startTime = Date.now();

    try {
      switch (strategy.action) {
        case 'retry':
          return await this.executeRetry(errorInfo, strategy);
        case 'restart_component':
          return await this.executeComponentRestart(errorInfo, strategy);
        case 'reset_state':
          return await this.executeStateReset(errorInfo, strategy);
        case 'fallback':
          return await this.executeFallback(errorInfo, strategy);
        case 'degrade_service':
          return await this.executeServiceDegradation(errorInfo, strategy);
        default:
          return false;
      }
    } finally {
      const recoveryTime = Date.now() - startTime;
      this.updateRecoveryMetrics(recoveryTime);
    }
  }

  private async executeRetry(errorInfo: ErrorInfo, strategy: ErrorRecoveryStrategy): Promise<boolean> {
    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, strategy.cooldownPeriod * attempt));

        this.emit('retry:attempt', errorInfo, attempt);

        return true;
      } catch (error) {
        if (attempt === strategy.maxAttempts) {
          return false;
        }
      }
    }

    return false;
  }

  private async executeComponentRestart(errorInfo: ErrorInfo, strategy: ErrorRecoveryStrategy): Promise<boolean> {
    this.emit('component:restart', errorInfo.component);

    return true;
  }

  private async executeStateReset(errorInfo: ErrorInfo, strategy: ErrorRecoveryStrategy): Promise<boolean> {
    this.emit('state:reset', errorInfo.component);

    return true;
  }

  private async executeFallback(errorInfo: ErrorInfo, strategy: ErrorRecoveryStrategy): Promise<boolean> {
    this.emit('fallback:activated', errorInfo);

    return true;
  }

  private async executeServiceDegradation(errorInfo: ErrorInfo, strategy: ErrorRecoveryStrategy): Promise<boolean> {
    this.emit('service:degraded', errorInfo.component);

    return true;
  }

  private updateRecoveryMetrics(recoveryTime: number): void {
    const totalRecoveries = this.metrics.recoveredErrors + this.metrics.failedRecoveries;
    
    if (totalRecoveries > 0) {
      this.metrics.averageRecoveryTime = 
        (this.metrics.averageRecoveryTime * (totalRecoveries - 1) + recoveryTime) / totalRecoveries;
    }

    if (totalRecoveries > 0) {
      this.metrics.recoverySuccessRate = this.metrics.recoveredErrors / totalRecoveries;
    }
  }

  private logError(errorInfo: ErrorInfo): void {
    const logLevel = this.getLogLevel(errorInfo.severity);
    const logMessage = `[${errorInfo.component}] ${errorInfo.type.toUpperCase()}: ${errorInfo.message}`;

    switch (logLevel) {
      case 'error':
        console.error(logMessage, errorInfo);
        break;
      case 'warn':
        console.warn(logMessage, errorInfo);
        break;
      default:
        console.info(logMessage, errorInfo);
    }
  }

  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'error';
      case 'warning':
        return 'warn';
      default:
        return 'info';
    }
  }

  private sendCriticalAlert(error: CriticalError): void {
    this.emit('alert:critical', error);
  }

  public generateErrorReport(period?: { start: number; end: number }): ErrorReport {
    const now = Date.now();
    const start = period?.start || now - 86400000;
    const end = period?.end || now;

    const filteredErrors = this.errors.filter(error =>
      error.timestamp >= start && error.timestamp <= end
    );

    const summary = this.generateErrorSummary(filteredErrors);

    return {
      id: this.generateReportId(),
      errors: filteredErrors,
      summary,
      generatedAt: now,
      period: { start, end },
    };
  }

  private generateErrorSummary(errors: ErrorInfo[]): ErrorSummary {
    const byType: Record<ErrorType, number> = {} as any;
    const bySeverity: Record<ErrorSeverity, number> = {} as any;
    const byComponent: Record<string, number> = {};

    const errorCounts = new Map<string, number>();

    Object.values<ErrorType>('runtime', 'network', 'validation', 'authentication', 'authorization', 'resource', 'configuration', 'dependency', 'system', 'custom').forEach(type => {
      byType[type] = 0;
    });

    Object.values<ErrorSeverity>('info', 'warning', 'error', 'critical').forEach(severity => {
      bySeverity[severity] = 0;
    });

    errors.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
      byComponent[error.component] = (byComponent[error.component] || 0) + 1;

      const errorKey = `${error.type}:${error.code}`;
      errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([key, count]) => ({
        error: errors.find(e => `${e.type}:${e.code}` === key)!,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: errors.length,
      byType,
      bySeverity,
      byComponent,
      topErrors,
      trends: {
        increasing: [],
        decreasing: [],
        stable: [],
      },
    };
  }

  public getErrorById(errorId: string): ErrorInfo | undefined {
    return this.errors.find(error => error.id === errorId);
  }

  public getErrorsByComponent(component: string): ErrorInfo[] {
    return this.errors.filter(error => error.component === component);
  }

  public getErrorsByType(type: ErrorType): ErrorInfo[] {
    return this.errors.filter(error => error.type === type);
  }

  public getErrorsBySeverity(severity: ErrorSeverity): ErrorInfo[] {
    return this.errors.filter(error => error.severity === severity);
  }

  public getCriticalErrors(): CriticalError[] {
    return this.criticalErrors;
  }

  public getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  public addRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.id, strategy);
  }

  public removeRecoveryStrategy(strategyId: string): void {
    this.recoveryStrategies.delete(strategyId);
  }

  public clearErrors(): void {
    this.errors = [];
    this.criticalErrors = [];
    this.metrics.totalErrors = 0;
    this.metrics.criticalErrors = 0;
  }

  public enable(): void {
    this.enabled = true;
    this.emit('enabled');
  }

  public disable(): void {
    this.enabled = false;
    this.emit('disabled');
  }

  public enableAutoRecovery(): void {
    this.autoRecoveryEnabled = true;
  }

  public disableAutoRecovery(): void {
    this.autoRecoveryEnabled = false;
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public destroy(): void {
    this.activeRecoveries.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.activeRecoveries.clear();
    this.removeAllListeners();
  }
}
