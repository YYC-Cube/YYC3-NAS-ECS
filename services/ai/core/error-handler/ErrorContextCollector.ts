import { ErrorContext } from './ErrorTypes';

export interface SystemMetrics {
  cpuUsage: { user: number; system: number };
  memoryUsage: { heapUsed: number; heapTotal: number; external: number };
  memoryTotal: number;
  memoryFree: number;
  uptime: number;
  loadAverage: number[];
  versions?: any;
  nodeVersion?: string;
  platform?: string;
  arch?: string;
}

export interface RequestMetrics {
  url: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body: Record<string, any>;
  ip: string;
  userAgent: string;
  timestamp: number;
  duration?: number;
}

export interface DatabaseMetrics {
  connectionCount: number;
  activeConnections: number;
  queryCount: number;
  slowQueries: number;
  lastQueryTime: number;
}

export interface ApplicationMetrics {
  version: string;
  environment: string;
  activeUsers: number;
  activeSessions: number;
  requestCount: number;
  errorCount: number;
  cacheHitRate: number;
  cpuUsage?: { percent: number };
  uptime?: number;
}

export interface ErrorContextCollectorConfig {
  includeSystemMetrics: boolean;
  includeRequestMetrics: boolean;
  includeDatabaseMetrics: boolean;
  includeApplicationMetrics: boolean;
  includeStackTrace: boolean;
  includeUserAgent: boolean;
  includeCustomData: boolean;
  maxStackTraceLines: number;
  maxContextSize?: number;
  sanitizeSensitiveData: boolean;
  sensitivePatterns: RegExp[];
}

export class ErrorContextCollector {
  private config: Omit<Required<ErrorContextCollectorConfig>, 'maxContextSize'> & { maxContextSize?: number };
  private requestMetrics: Map<string, RequestMetrics> = new Map();
  private applicationMetrics: ApplicationMetrics = {
    version: '1.0.0',
    environment: 'development',
    activeUsers: 0,
    activeSessions: 0,
    requestCount: 0,
    errorCount: 0,
    cacheHitRate: 0
  };

  constructor(config: Partial<ErrorContextCollectorConfig> = {}) {
    this.config = {
      includeSystemMetrics: config.includeSystemMetrics ?? true,
      includeRequestMetrics: config.includeRequestMetrics ?? true,
      includeDatabaseMetrics: config.includeDatabaseMetrics ?? true,
      includeApplicationMetrics: config.includeApplicationMetrics ?? true,
      includeStackTrace: config.includeStackTrace ?? true,
      includeUserAgent: config.includeUserAgent ?? true,
      includeCustomData: config.includeCustomData ?? true,
      maxStackTraceLines: config.maxStackTraceLines ?? 50,
      maxContextSize: config.maxContextSize ?? undefined,
      sanitizeSensitiveData: config.sanitizeSensitiveData ?? true,
      sensitivePatterns: config.sensitivePatterns ?? [
        /password/i,
        /token/i,
        /secret/i,
        /api[_-]?key/i,
        /authorization/i,
        /credit[_-]?card/i,
        /card[_-]?number/i,
        /private[_-]?key/i,
        /ssn/i,
        /passport/i
      ]
    };
  }

  collect(error: Error, customContext: Record<string, any> = {}): ErrorContext {
    const context: ErrorContext = {
      timestamp: Date.now()
    };

    if (this.config.includeStackTrace && error.stack) {
      context.additionalData = context.additionalData || {};
      context.additionalData.stackTrace = this.formatStackTrace(error.stack);
    }

    if (this.config.includeSystemMetrics) {
      context.additionalData = context.additionalData || {};
      context.additionalData.systemMetrics = this.collectSystemMetrics();
    }

    if (this.config.includeApplicationMetrics) {
      context.additionalData = context.additionalData || {};
      context.additionalData.applicationMetrics = this.collectApplicationMetrics();
    }

    if (this.config.includeCustomData && Object.keys(customContext).length > 0) {
      Object.assign(context, customContext);
    }

    if (this.config.sanitizeSensitiveData) {
      this.sanitizeContext(context);
    }

    if (this.config.maxContextSize) {
      this.limitContextSize(context, this.config.maxContextSize);
    }

    return context;
  }

  collectForRequest(
    error: Error,
    requestId: string,
    customContext: Record<string, any> = {}
  ): ErrorContext {
    const context = this.collect(error, customContext);
    const requestMetrics = this.requestMetrics.get(requestId);

    if (requestMetrics && this.config.includeRequestMetrics) {
      context.additionalData = context.additionalData || {};
      context.additionalData.requestMetrics = this.sanitizeRequestMetrics(requestMetrics);
      context.requestId = requestId;
      context.path = requestMetrics.url;
      context.method = requestMetrics.method;
      context.ip = requestMetrics.ip;
      if (this.config.includeUserAgent) {
        context.userAgent = requestMetrics.userAgent;
      }
    }

    return context;
  }

  private formatStackTrace(stackTrace: string | undefined): string {
    if (!stackTrace || stackTrace.trim() === '') {
      return '';
    }

    const lines = stackTrace.split('\n');
    const formatted = lines
      .slice(0, this.config.maxStackTraceLines)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    return formatted;
  }

  private collectSystemMetrics(): Partial<SystemMetrics> {
    const metrics: Partial<SystemMetrics> = {
      uptime: process.uptime()
    };

    if (process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      metrics.memoryUsage = {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external
      };
    }

    if (process.cpuUsage) {
      const cpuUsage = process.cpuUsage();
      metrics.cpuUsage = {
        user: cpuUsage.user,
        system: cpuUsage.system
      };
    }

    if (process.versions) {
      metrics.versions = process.versions;
      metrics.nodeVersion = process.versions.node;
    }

    if (process.platform) {
      metrics.platform = process.platform;
    }

    if (process.arch) {
      metrics.arch = process.arch;
    }

    return metrics;
  }

  private collectApplicationMetrics(): ApplicationMetrics {
    const systemMetrics = this.collectSystemMetrics();
    let cpuUsagePercent = 0;
    
    if (systemMetrics.cpuUsage && systemMetrics.uptime) {
      const totalCpuTime = (systemMetrics.cpuUsage.user + systemMetrics.cpuUsage.system) / 1000000;
      const uptime = systemMetrics.uptime;
      cpuUsagePercent = Math.min(100, (totalCpuTime / uptime) * 100);
    }
    
    return {
      ...this.applicationMetrics,
      cpuUsage: { percent: cpuUsagePercent },
      uptime: systemMetrics.uptime
    };
  }

  private sanitizeRequestMetrics(metrics: RequestMetrics): Partial<RequestMetrics> {
    const sanitized: Partial<RequestMetrics> = {
      url: metrics.url,
      method: metrics.method,
      timestamp: metrics.timestamp,
      duration: metrics.duration
    };

    if (this.config.includeUserAgent) {
      sanitized.userAgent = metrics.userAgent;
    }

    sanitized.ip = this.sanitizeIP(metrics.ip);
    sanitized.headers = this.sanitizeHeaders(metrics.headers);
    sanitized.query = this.sanitizeData(metrics.query);
    sanitized.body = this.sanitizeData(metrics.body);

    return sanitized;
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (this.isSensitive(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitive(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeIP(ip: string): string {
    if (!ip) {
      return ip;
    }

    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }

    return ip;
  }

  private sanitizeContext(context: ErrorContext): void {
    const sanitized = this.sanitizeDataRecursive(context);
    Object.assign(context, sanitized);
  }

  private sanitizeDataRecursive(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeDataRecursive(item));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitive(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeDataRecursive(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private isSensitive(key: string): boolean {
    return this.config.sensitivePatterns.some(pattern => pattern.test(key));
  }

  private limitContextSize(context: ErrorContext, maxSize: number): void {
    let contextStr = JSON.stringify(context);
    if (contextStr.length <= maxSize) {
      return;
    }

    const timestamp = context.timestamp;
    const contextCopy: Record<string, any> = { timestamp };
    
    let currentSize = JSON.stringify(contextCopy).length;
    
    const allEntries = Object.entries(context).filter(([key]) => key !== 'timestamp');
    
    for (const [key, value] of allEntries) {
      const remainingSize = maxSize - currentSize - 20;
      
      if (remainingSize <= 30) {
        break;
      }
      
      const truncatedValue = this.truncateValue(value, remainingSize);
      const entrySize = JSON.stringify({ [key]: truncatedValue }).length;
      
      if (currentSize + entrySize <= maxSize) {
        contextCopy[key] = truncatedValue;
        currentSize += entrySize;
      } else {
        break;
      }
    }

    currentSize = JSON.stringify(contextCopy).length;
    
    if (currentSize > maxSize) {
      const keys = Object.keys(contextCopy).filter(key => key !== 'timestamp');
      for (const key of keys) {
        delete contextCopy[key];
        currentSize = JSON.stringify(contextCopy).length;
        if (currentSize <= maxSize) {
          break;
        }
      }
    }

    currentSize = JSON.stringify(contextCopy).length;
    
    if (currentSize > maxSize) {
      const timestampValue = contextCopy.timestamp;
      const minimalContext: Record<string, any> = {
        t: timestampValue
      };
      
      Object.keys(contextCopy).forEach(key => delete contextCopy[key]);
      Object.assign(contextCopy, minimalContext);
      currentSize = JSON.stringify(minimalContext).length;
    }

    Object.keys(context).forEach(key => delete (context as any)[key]);
    Object.assign(context, contextCopy);
  }

  private truncateValue(value: any, maxSize: number): any {
    if (typeof value === 'string') {
      const maxLen = Math.max(0, maxSize - 10);
      if (maxLen <= 0) {
        return '[TRUNCATED]';
      }
      const truncated = value.substring(0, maxLen);
      const truncatedWithSuffix = truncated + '...';
      const truncatedSize = JSON.stringify(truncatedWithSuffix).length;
      if (truncatedSize <= maxSize) {
        return truncatedWithSuffix;
      } else {
        return '[TRUNCATED]';
      }
    }

    if (Array.isArray(value)) {
      return this.truncateData(value, maxSize);
    }

    if (typeof value === 'object' && value !== null) {
      return this.truncateData(value, maxSize);
    }

    return value;
  }

  private truncateData(data: any, maxSize: number): any {
    if (typeof data === 'string') {
      const maxLen = Math.max(0, maxSize - 10);
      return maxLen > 0 ? data.substring(0, maxLen) + '...' : '[TRUNCATED]';
    }

    if (Array.isArray(data)) {
      const truncated: any[] = [];
      let currentSize = 2;

      for (const item of data) {
        const itemSize = JSON.stringify(item).length + 1;
        if (currentSize + itemSize <= maxSize) {
          truncated.push(item);
          currentSize += itemSize;
        } else {
          if (currentSize + 17 <= maxSize) {
            truncated.push('[...TRUNCATED...]');
          }
          break;
        }
      }
      return truncated;
    }

    if (typeof data === 'object' && data !== null) {
      const truncated: Record<string, any> = {};
      let currentSize = 2;

      for (const [key, value] of Object.entries(data)) {
        const entrySize = JSON.stringify({ [key]: value }).length;
        if (currentSize + entrySize <= maxSize) {
          truncated[key] = value;
          currentSize += entrySize;
        }
      }
      return truncated;
    }

    return data;
  }

  setRequestMetrics(requestId: string, metrics: RequestMetrics): void {
    this.requestMetrics.set(requestId, metrics);
  }

  removeRequestMetrics(requestId: string): void {
    this.requestMetrics.delete(requestId);
  }

  updateApplicationMetrics(metrics: Partial<ApplicationMetrics>): void {
    this.applicationMetrics = {
      ...this.applicationMetrics,
      ...metrics
    };
  }

  incrementRequestCount(): void {
    this.applicationMetrics.requestCount++;
  }

  incrementErrorCount(): void {
    this.applicationMetrics.errorCount++;
  }

  updateActiveUsers(count: number): void {
    this.applicationMetrics.activeUsers = count;
  }

  updateActiveSessions(count: number): void {
    this.applicationMetrics.activeSessions = count;
  }

  updateCacheHitRate(rate: number): void {
    this.applicationMetrics.cacheHitRate = rate;
  }

  getApplicationMetrics(): ApplicationMetrics {
    return { ...this.applicationMetrics };
  }

  getRequestMetrics(requestId: string): RequestMetrics | undefined {
    return this.requestMetrics.get(requestId);
  }

  clearRequestMetrics(): void {
    this.requestMetrics.clear();
  }

  reset(): void {
    this.requestMetrics.clear();
    this.applicationMetrics = {
      version: '1.0.0',
      environment: 'development',
      activeUsers: 0,
      activeSessions: 0,
      requestCount: 0,
      errorCount: 0,
      cacheHitRate: 0
    };
  }
}

export const globalErrorContextCollector = new ErrorContextCollector();
