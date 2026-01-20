/**
 * @file logger.ts - 结构化日志系统
 * @description YYC³ MovAISys 智能浮窗系统 - 基础设施层
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

import { createWriteStream } from 'node:fs';
import { join } from 'node:path';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

/**
 * 日志条目接口
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * 日志配置接口
 */
interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'text';
  console: boolean;
  file?: {
    enabled: boolean;
    path: string;
    maxSize?: string;
  };
}

/**
 * 结构化日志类
 *
 * 设计理念：
 * 1. 统一日志格式，便于解析和分析
 * 2. 支持多种输出方式（控制台、文件）
 * 3. 支持结构化元数据
 * 4. 性能优先，异步写入
 */
export class Logger {
  private config: LoggerConfig;
  private fileStream?: ReturnType<typeof createWriteStream>;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || LogLevel.INFO,
      format: config.format || 'json',
      console: config.console !== false,
      file: config.file
    };

    // 初始化文件流
    if (this.config.file?.enabled) {
      this.initializeFileStream();
    }
  }

  /**
   * 初始化文件写入流
   */
  private initializeFileStream(): void {
    const logPath = this.config.file!.path;
    this.fileStream = createWriteStream(logPath, { flags: 'a' });

    // 错误处理
    this.fileStream.on('error', (error) => {
      console.error('日志文件写入错误:', error);
    });
  }

  /**
   * 判断是否应该输出该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  /**
   * 格式化日志条目
   */
  private formatLog(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }

    // 文本格式
    const metadataStr = entry.metadata
      ? ` | ${JSON.stringify(entry.metadata)}`
      : '';
    const errorStr = entry.error
      ? `\n${entry.error.stack}`
      : '';

    return `[${entry.timestamp}] [${entry.level}]${entry.context ? ` [${entry.context}]` : ''} ${entry.message}${metadataStr}${errorStr}`;
  }

  /**
   * 输出日志
   */
  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formatted = this.formatLog(entry);

    // 控制台输出
    if (this.config.console) {
      const colors = {
        [LogLevel.DEBUG]: '\x1b[36m',  // Cyan
        [LogLevel.INFO]: '\x1b[32m',   // Green
        [LogLevel.WARN]: '\x1b[33m',   // Yellow
        [LogLevel.ERROR]: '\x1b[31m',  // Red
        [LogLevel.FATAL]: '\x1b[35m'   // Magenta
      };
      const reset = '\x1b[0m';

      console.log(`${colors[entry.level]}${formatted}${reset}`);
    }

    // 文件输出
    if (this.fileStream && this.config.file?.enabled) {
      this.fileStream.write(formatted + '\n');
    }
  }

  /**
   * 创建日志条目
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
  }

  // ============ 公共日志方法 ============

  /**
   * DEBUG级别日志
   */
  debug(message: string, context?: string, metadata?: Record<string, unknown>): void {
    this.log(this.createEntry(LogLevel.DEBUG, message, context, metadata));
  }

  /**
   * INFO级别日志
   */
  info(message: string, context?: string, metadata?: Record<string, unknown>): void {
    this.log(this.createEntry(LogLevel.INFO, message, context, metadata));
  }

  /**
   * WARN级别日志
   */
  warn(message: string, context?: string, metadata?: Record<string, unknown>, error?: Error): void {
    this.log(this.createEntry(LogLevel.WARN, message, context, metadata, error));
  }

  /**
   * ERROR级别日志
   */
  error(message: string, context?: string, metadata?: Record<string, unknown>, error?: Error): void {
    this.log(this.createEntry(LogLevel.ERROR, message, context, metadata, error));
  }

  /**
   * FATAL级别日志
   */
  fatal(message: string, context?: string, metadata?: Record<string, unknown>, error?: Error): void {
    this.log(this.createEntry(LogLevel.FATAL, message, context, metadata, error));
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.fileStream) {
      this.fileStream.end();
    }
  }
}

// ============ 全局日志实例 ============

/**
 * 全局日志实例
 * 使用单例模式，确保整个应用使用同一个日志实例
 */
export const logger = new Logger({
  level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
  format: process.env.LOG_FORMAT as 'json' | 'text' || 'json',
  console: true,
  file: {
    enabled: process.env.NODE_ENV === 'production',
    path: process.env.LOG_FILE || join(process.cwd(), 'logs', 'app.log')
  }
});

// 导出便捷方法
export const { debug, info, warn, error, fatal } = logger;
