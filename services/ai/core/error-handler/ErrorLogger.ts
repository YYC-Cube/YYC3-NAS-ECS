import { EventEmitter } from 'events';
import { YYC3Error, ErrorSeverity, ErrorCategory } from './ErrorTypes';
import { ErrorReport } from './ErrorHandler';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: ErrorSeverity;
  message: string;
  error?: YYC3Error;
  context?: Record<string, any>;
  tags?: string[];
  source?: string;
}

export interface ErrorAggregation {
  errorKey: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  samples: ErrorReport[];
  affectedUsers: Set<string>;
  severity: ErrorSeverity;
  category: ErrorCategory;
}

export interface ErrorTrend {
  period: string;
  totalErrors: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  topErrors: Array<{ code: string; count: number }>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: ErrorMetrics) => boolean;
  threshold: number;
  window: number;
  enabled: boolean;
  notificationChannels: string[];
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsByCode: Record<string, number>;
  errorRate: number;
  recoveryRate: number;
  avgResponseTime: number;
}

export interface ErrorLoggerConfig {
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  enableAggregation: boolean;
  enableTrendAnalysis: boolean;
  enableAlerts: boolean;
  aggregationWindow: number;
  aggregationThreshold?: number;
  maxAggregatedSamples: number;
  logLevel: ErrorSeverity;
  logFilePath?: string;
  maxLogFileSize: number;
  maxLogFiles: number;
  alertRules?: Array<{
    severity?: ErrorSeverity;
    threshold: number;
    window: number;
  }>;
  retentionPeriod?: number;
  maxLogEntries?: number;
}

export class ErrorLogger extends EventEmitter {
  private config: Required<ErrorLoggerConfig>;
  private logEntries: LogEntry[] = [];
  private errorAggregations: Map<string, ErrorAggregation> = new Map();
  private errorTrends: ErrorTrend[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private errorMetrics: ErrorMetrics = this.initializeMetrics();
  private logIdCounter = 0;
  private alertRuleConfigs: Map<string, {
    severity?: ErrorSeverity;
    threshold: number;
    window: number;
  }> = new Map();

  constructor(config: Partial<ErrorLoggerConfig> = {}) {
    super();
    this.config = {
      enableConsoleLogging: config.enableConsoleLogging ?? true,
      enableFileLogging: config.enableFileLogging ?? false,
      enableAggregation: config.enableAggregation ?? true,
      enableTrendAnalysis: config.enableTrendAnalysis ?? true,
      enableAlerts: config.enableAlerts ?? true,
      aggregationWindow: config.aggregationWindow ?? 300000,
      aggregationThreshold: config.aggregationThreshold,
      maxAggregatedSamples: config.maxAggregatedSamples ?? 10,
      logLevel: config.logLevel ?? ErrorSeverity.LOW,
      logFilePath: config.logFilePath ?? './logs/errors.log',
      maxLogFileSize: config.maxLogFileSize ?? 10485760,
      maxLogFiles: config.maxLogFiles ?? 5,
      alertRules: config.alertRules ?? [],
      retentionPeriod: config.retentionPeriod ?? 86400000,
      maxLogEntries: config.maxLogEntries ?? 10000
    };

    if (this.config.alertRules && this.config.alertRules.length > 0) {
      for (const ruleConfig of this.config.alertRules) {
        const ruleId = this.addAlertRule({
          name: `Alert for ${ruleConfig.severity || 'ALL'} errors`,
          condition: (metrics) => {
            if (ruleConfig.severity) {
              const count = metrics.errorsBySeverity[ruleConfig.severity] || 0;
              return count >= ruleConfig.threshold;
            }
            return metrics.totalErrors >= ruleConfig.threshold;
          },
          threshold: ruleConfig.threshold,
          window: ruleConfig.window,
          enabled: true,
          notificationChannels: []
        });
        this.alertRuleConfigs.set(ruleId, ruleConfig);
      }
    }
  }

  log(report: ErrorReport, tags: string[] = [], source: string = 'unknown'): LogEntry {
    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: report.timestamp,
      level: report.error.severity,
      message: report.error.message,
      error: report.error,
      context: report.context,
      tags,
      source
    };

    this.logEntries.push(entry);
    this.updateMetrics(report);

    if (this.shouldLog(entry)) {
      this.logToConsole(entry);
    }

    if (this.config.enableAggregation) {
      this.aggregateError(report);
    }

    if (this.config.enableTrendAnalysis) {
      this.analyzeTrends();
    }

    if (this.config.enableAlerts) {
      this.checkAlerts();
    }

    this.emit('logged', entry);
    this.emit(`logged:${report.error.code}`, entry);
    this.emit(`logged:${report.error.category}`, entry);

    return entry;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${this.logIdCounter++}`;
  }

  private shouldLog(entry: LogEntry): boolean {
    const severityLevels = {
      [ErrorSeverity.LOW]: 1,
      [ErrorSeverity.MEDIUM]: 2,
      [ErrorSeverity.HIGH]: 3,
      [ErrorSeverity.CRITICAL]: 4
    };

    return severityLevels[entry.level] >= severityLevels[this.config.logLevel];
  }

  private logToConsole(entry: LogEntry): void {
    const logMethod = this.getLogMethod(entry.level);
    const formattedMessage = this.formatLogEntry(entry);
    logMethod(formattedMessage);
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

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const tags = entry.tags?.length > 0 ? `[${entry.tags.join(', ')}]` : '';
    const source = entry.source ? `[${entry.source}]` : '';

    return `${timestamp} ${source} ${tags} [${entry.level.toUpperCase()}] ${entry.message}`;
  }

  private aggregateError(report: ErrorReport): void {
    const errorKey = this.generateErrorKey(report.error);

    if (!this.errorAggregations.has(errorKey)) {
      this.errorAggregations.set(errorKey, {
        errorKey,
        count: 0,
        firstSeen: report.timestamp,
        lastSeen: report.timestamp,
        samples: [],
        affectedUsers: new Set(),
        severity: report.error.severity,
        category: report.error.category
      });
    }

    const aggregation = this.errorAggregations.get(errorKey)!;
    aggregation.count++;
    aggregation.lastSeen = report.timestamp;

    if (aggregation.samples.length < this.config.maxAggregatedSamples) {
      aggregation.samples.push(report);
    }

    if (report.context?.userId) {
      aggregation.affectedUsers.add(report.context.userId);
    }

    this.emit('aggregated', aggregation);
  }

  private generateErrorKey(error: YYC3Error): string {
    return `${error.code}_${error.category}_${error.message.substring(0, 50)}`;
  }

  private analyzeTrends(): void {
    const now = Date.now();
    const windowSize = 3600000;

    const recentErrors = this.logEntries.filter(
      entry => now - entry.timestamp <= windowSize
    );

    const trend: ErrorTrend = {
      period: new Date(now - windowSize).toISOString(),
      totalErrors: recentErrors.length,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byCategory: {} as Record<ErrorCategory, number>,
      topErrors: []
    };

    const errorCounts = new Map<string, number>();

    for (const entry of recentErrors) {
      trend.bySeverity[entry.level] = (trend.bySeverity[entry.level] || 0) + 1;

      if (entry.error) {
        trend.byCategory[entry.error.category] =
          (trend.byCategory[entry.error.category] || 0) + 1;

        const code = entry.error.code;
        errorCounts.set(code, (errorCounts.get(code) || 0) + 1);
      }
    }

    trend.topErrors = Array.from(errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.errorTrends.push(trend);

    if (this.errorTrends.length > 24) {
      this.errorTrends.shift();
    }

    this.emit('trend', trend);
  }

  private checkAlerts(): void {
    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (rule.enabled && rule.condition(this.errorMetrics)) {
        const ruleConfig = this.alertRuleConfigs.get(ruleId);
        const severity = ruleConfig?.severity;
        const actualCount = severity 
          ? (this.errorMetrics.errorsBySeverity[severity] || 0)
          : this.errorMetrics.totalErrors;

        this.emit('alert', {
          rule,
          metrics: this.errorMetrics,
          timestamp: Date.now(),
          severity,
          threshold: rule.threshold,
          actualCount
        });
      }
    }
  }

  private updateMetrics(report: ErrorReport): void {
    this.errorMetrics.totalErrors++;
    this.errorMetrics.errorsBySeverity[report.error.severity] =
      (this.errorMetrics.errorsBySeverity[report.error.severity] || 0) + 1;
    this.errorMetrics.errorsByCategory[report.error.category] =
      (this.errorMetrics.errorsByCategory[report.error.category] || 0) + 1;
    this.errorMetrics.errorsByCode[report.error.code] =
      (this.errorMetrics.errorsByCode[report.error.code] || 0) + 1;

    const now = Date.now();
    const windowSize = 60000;
    const recentErrors = this.logEntries.filter(
      entry => now - entry.timestamp <= windowSize
    );
    this.errorMetrics.errorRate = recentErrors.length / (windowSize / 1000);

    if (report.recoveryAttempted) {
      const totalRecoveryAttempts = Object.values(this.errorMetrics.errorsByCode)
        .reduce((sum, count) => sum + count, 0);
      this.errorMetrics.recoveryRate = report.recoverySuccess
        ? (this.errorMetrics.recoveryRate * (totalRecoveryAttempts - 1) + 1) / totalRecoveryAttempts
        : this.errorMetrics.recoveryRate * (totalRecoveryAttempts - 1) / totalRecoveryAttempts;
    }
  }

  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsByCode: {} as Record<string, number>,
      errorRate: 0,
      recoveryRate: 0,
      avgResponseTime: 0
    };
  }

  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alertRule: AlertRule = {
      id,
      ...rule
    };
    this.alertRules.set(id, alertRule);
    return id;
  }

  removeAlertRule(id: string): void {
    this.alertRules.delete(id);
  }

  enableAlertRule(id: string): void {
    const rule = this.alertRules.get(id);
    if (rule) {
      rule.enabled = true;
    }
  }

  disableAlertRule(id: string): void {
    const rule = this.alertRules.get(id);
    if (rule) {
      rule.enabled = false;
    }
  }

  getLogs(filter?: {
    level?: ErrorSeverity;
    category?: ErrorCategory;
    code?: string;
    startTime?: number;
    endTime?: number;
    tags?: string[];
    source?: string;
  }): LogEntry[] {
    let filtered = [...this.logEntries];

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter(entry => entry.level === filter.level);
      }
      if (filter.category) {
        filtered = filtered.filter(entry => entry.error?.category === filter.category);
      }
      if (filter.code) {
        filtered = filtered.filter(entry => entry.error?.code === filter.code);
      }
      if (filter.startTime) {
        filtered = filtered.filter(entry => entry.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        filtered = filtered.filter(entry => entry.timestamp <= filter.endTime!);
      }
      if (filter.tags && filter.tags.length > 0) {
        filtered = filtered.filter(entry =>
          filter.tags!.some(tag => entry.tags?.includes(tag))
        );
      }
      if (filter.source) {
        filtered = filtered.filter(entry => entry.source === filter.source);
      }
    }

    return filtered;
  }

  getAggregations(): ErrorAggregation[] {
    return Array.from(this.errorAggregations.values());
  }

  getAggregation(errorKey: string): ErrorAggregation | undefined {
    return this.errorAggregations.get(errorKey);
  }

  getTrends(): ErrorTrend[] {
    return [...this.errorTrends];
  }

  getErrorTrends(): Array<{ errorCode: string; trend: 'increasing' | 'decreasing' | 'stable'; count: number }> {
    const trends: Array<{ errorCode: string; trend: 'increasing' | 'decreasing' | 'stable'; count: number }> = [];
    const errorCounts = new Map<string, number[]>();

    for (const entry of this.logEntries) {
      if (entry.error) {
        const code = entry.error.code;
        if (!errorCounts.has(code)) {
          errorCounts.set(code, []);
        }
        errorCounts.get(code)!.push(entry.timestamp);
      }
    }

    const now = Date.now();
    const windowSize = 300000;

    for (const [code, timestamps] of errorCounts.entries()) {
      const recentCount = timestamps.filter(t => now - t <= windowSize).length;
      const olderCount = timestamps.filter(t => now - t > windowSize && now - t <= windowSize * 2).length;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentCount > olderCount * 1.5) {
        trend = 'increasing';
      } else if (recentCount < olderCount * 0.5) {
        trend = 'decreasing';
      }

      trends.push({
        errorCode: code,
        trend,
        count: timestamps.length
      });
    }

    return trends;
  }

  getMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  exportLogs(filter?: {
    level?: ErrorSeverity;
    tags?: string[];
    source?: string;
    startTime?: number;
    endTime?: number;
  }): { logs: LogEntry[]; metrics: ErrorMetrics; exportedAt: number } {
    const logs = filter ? this.getLogs(filter) : [...this.logEntries];
    return {
      logs,
      metrics: this.getMetrics(),
      exportedAt: Date.now()
    };
  }

  clearLogs(olderThan?: number): void {
    if (olderThan !== undefined) {
      this.logEntries = this.logEntries.filter(entry => entry.timestamp >= olderThan);
    } else {
      this.logEntries = [];
      this.errorAggregations.clear();
      this.resetMetrics();
    }
  }

  clearAggregations(olderThan?: number): void {
    if (olderThan !== undefined) {
      for (const [key, aggregation] of this.errorAggregations.entries()) {
        if (aggregation.lastSeen < olderThan) {
          this.errorAggregations.delete(key);
        }
      }
    } else {
      this.errorAggregations.clear();
    }
  }

  resetMetrics(): void {
    this.errorMetrics = this.initializeMetrics();
  }

  query(filter?: {
    level?: ErrorSeverity;
    tags?: string[];
    source?: string;
    startTime?: number;
    endTime?: number;
  }, options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp';
    sortOrder?: 'asc' | 'desc';
  }): LogEntry[] {
    let results = [...this.logEntries];

    if (filter) {
      if (filter.level !== undefined) {
        results = results.filter(entry => entry.level === filter.level);
      }
      if (filter.tags && filter.tags.length > 0) {
        results = results.filter(entry => 
          filter.tags!.some(tag => entry.tags?.includes(tag))
        );
      }
      if (filter.source !== undefined) {
        results = results.filter(entry => entry.source === filter.source);
      }
      if (filter.startTime !== undefined) {
        results = results.filter(entry => entry.timestamp >= filter.startTime!);
      }
      if (filter.endTime !== undefined) {
        results = results.filter(entry => entry.timestamp <= filter.endTime!);
      }
    }

    if (options) {
      if (options.sortBy === 'timestamp') {
        results.sort((a, b) => {
          const diff = a.timestamp - b.timestamp;
          return options.sortOrder === 'desc' ? -diff : diff;
        });
      }
      if (options.offset !== undefined) {
        results = results.slice(options.offset);
      }
      if (options.limit !== undefined) {
        results = results.slice(0, options.limit);
      }
    }

    return results;
  }

  getAggregatedErrors(): ErrorAggregation[] {
    return Array.from(this.errorAggregations.values());
  }

  reset(): void {
    this.logEntries = [];
    this.errorAggregations.clear();
    this.errorTrends = [];
    this.resetMetrics();
    this.logIdCounter = 0;
  }

  clear(): void {
    this.reset();
  }

  updateConfig(config: Partial<ErrorLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const globalErrorLogger = new ErrorLogger();
