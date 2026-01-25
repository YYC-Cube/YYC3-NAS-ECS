/**
 * @file Logger - 专业日志工具
 * @description 提供统一的日志记录接口，支持多级别日志和格式化输出
 * @module utils/logger
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableTimestamp: boolean;
  enablePrefix: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableTimestamp: true,
      enablePrefix: true,
      prefix: '[YYC³]',
      ...config
    };
  }

  private formatMessage(level: string, message: string, ..._args: any[]): string {
    const timestamp = this.config.enableTimestamp ? `[${new Date().toISOString()}]` : '';
    const prefix = this.config.enablePrefix ? this.config.prefix : '';
    const levelTag = `[${level}]`;
    return `${timestamp}${prefix}${levelTag} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enableConsole && level >= this.config.level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formatted = this.formatMessage('DEBUG', message);
      console.debug(formatted, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatMessage('INFO', message);
      console.info(formatted, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formatted = this.formatMessage('WARN', message);
      console.warn(formatted, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formatted = this.formatMessage('ERROR', message);
      console.error(formatted, ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }
}

export const logger = new Logger({
  level: LogLevel.INFO,
  enableConsole: true,
  enableTimestamp: true,
  enablePrefix: true,
  prefix: '[YYC³]'
});

export default logger;
