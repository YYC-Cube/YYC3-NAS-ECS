export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum LogCategory {
  SYSTEM = 'SYSTEM',
  AUTH = 'AUTH',
  API = 'API',
  DATABASE = 'DATABASE',
  EMAIL = 'EMAIL',
  FRP = 'FRP',
  DDNS = 'DDNS',
  LLM = 'LLM',
  BACKUP = 'BACKUP',
  MONITORING = 'MONITORING'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  service: string;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  ip?: string;
  duration?: number;
  stackTrace?: string;
}

export interface LogFilter {
  level?: LogLevel;
  category?: LogCategory;
  service?: string;
  startTime?: string;
  endTime?: string;
  keyword?: string;
  userId?: string;
  minDuration?: number;
  maxDuration?: number;
}

export interface LogExportOptions {
  format: 'json' | 'csv' | 'txt';
  includeDetails: boolean;
  compress: boolean;
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<LogCategory, number>;
  byService: Record<string, number>;
  errorRate: number;
  avgDuration?: number;
}
