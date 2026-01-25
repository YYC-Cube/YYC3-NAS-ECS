/**
 * @file LogService - 日志服务
 * @description 提供日志收集、存储、查询和导出功能
 * @module services/log
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import { LogEntry, LogLevel, LogFilter, LogExportOptions, LogStats, LogCategory } from '../types/logs';
import { logger } from '../utils/logger';

class LogService {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private storageKey = 'yyc3-system-logs';
  private isLocalStorageAvailable: boolean = false;

  constructor() {
    this.checkLocalStorageAvailability();
    this.loadLogs();
  }

  private checkLocalStorageAvailability(): void {
    try {
      const testKey = '__yyc3_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
    } catch (error) {
      logger.warn('localStorage is not available:', error);
      this.isLocalStorageAvailable = false;
    }
  }

  private loadLogs(): void {
    if (!this.isLocalStorageAvailable) {
      return;
    }
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load logs:', error);
    }
  }

  private saveLogs(): void {
    if (!this.isLocalStorageAvailable) {
      return;
    }
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      logger.error('Failed to save logs:', error);
    }
  }

  addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry {
    const log: LogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.logs.push(log);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Only save to storage periodically to improve performance
    if (this.logs.length % 100 === 0 || this.logs.length === 1) {
      this.saveLogs();
    }
    
    return log;
  }

  queryLogs(filter: LogFilter): LogEntry[] {
    let filtered = [...this.logs];

    if (filter.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }

    if (filter.category) {
      filtered = filtered.filter(log => log.category === filter.category);
    }

    if (filter.service) {
      filtered = filtered.filter(log => 
        log.service.toLowerCase().includes(filter.service!.toLowerCase())
      );
    }

    if (filter.startTime) {
      filtered = filtered.filter(log => log.timestamp >= filter.startTime!);
    }

    if (filter.endTime) {
      filtered = filtered.filter(log => log.timestamp <= filter.endTime!);
    }

    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(keyword) ||
        log.service.toLowerCase().includes(keyword)
      );
    }

    if (filter.userId) {
      filtered = filtered.filter(log => log.userId === filter.userId);
    }

    if (filter.minDuration !== undefined) {
      filtered = filtered.filter(log => 
        log.duration !== undefined && log.duration >= filter.minDuration!
      );
    }

    if (filter.maxDuration !== undefined) {
      filtered = filtered.filter(log => 
        log.duration !== undefined && log.duration <= filter.maxDuration!
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getLogs(filter?: LogFilter, limit?: number): LogEntry[] {
    const filtered = filter ? this.queryLogs(filter) : [...this.logs];
    return limit ? filtered.slice(0, limit) : filtered;
  }

  getLogById(id: string): LogEntry | undefined {
    return this.logs.find(log => log.id === id);
  }

  getStats(filter?: LogFilter): LogStats {
    const filtered = filter ? this.queryLogs(filter) : this.logs;

    const byLevel: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.FATAL]: 0
    };

    const byCategory: Record<LogCategory, number> = {
      [LogCategory.SYSTEM]: 0,
      [LogCategory.AUTH]: 0,
      [LogCategory.API]: 0,
      [LogCategory.DATABASE]: 0,
      [LogCategory.EMAIL]: 0,
      [LogCategory.FRP]: 0,
      [LogCategory.DDNS]: 0,
      [LogCategory.LLM]: 0,
      [LogCategory.BACKUP]: 0,
      [LogCategory.MONITORING]: 0
    };

    const byService: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;

    filtered.forEach(log => {
      byLevel[log.level]++;
      byCategory[log.category]++;
      byService[log.service] = (byService[log.service] || 0) + 1;

      if (log.duration !== undefined) {
        totalDuration += log.duration;
        durationCount++;
      }
    });

    const errorCount = byLevel[LogLevel.ERROR] + byLevel[LogLevel.FATAL];
    const errorRate = filtered.length > 0 ? (errorCount / filtered.length) * 100 : 0;

    return {
      total: filtered.length,
      byLevel,
      byCategory,
      byService,
      errorRate,
      avgDuration: durationCount > 0 ? totalDuration / durationCount : undefined
    };
  }

  exportLogs(filter?: LogFilter, options?: LogExportOptions): string {
    const logs = filter ? this.queryLogs(filter) : this.logs;

    switch (options?.format || 'json') {
      case 'json':
        return JSON.stringify(logs, null, 2);

      case 'csv':
        const headers = ['timestamp', 'level', 'category', 'service', 'message', 'userId', 'duration'];
        const rows = logs.map(log => [
          log.timestamp,
          log.level,
          log.category,
          log.service,
          `"${log.message.replace(/"/g, '""')}"`,
          log.userId || '',
          log.duration || ''
        ].join(','));
        return [headers.join(','), ...rows].join('\n');

      case 'txt':
        return logs.map(log => 
          `[${log.timestamp}] [${log.level}] [${log.category}] [${log.service}] ${log.message}`
        ).join('\n');

      default:
        return JSON.stringify(logs, null, 2);
    }
  }

  downloadLogs(filter?: LogFilter, options?: LogExportOptions): void {
    const content = this.exportLogs(filter, options);
    const format = options?.format || 'json';
    const mimeType = format === 'json' ? 'application/json' : 
                    format === 'csv' ? 'text/csv' : 'text/plain';
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  clearLogs(filter?: LogFilter): number {
    if (filter) {
      const toRemove = this.queryLogs(filter);
      this.logs = this.logs.filter(log => !toRemove.includes(log));
    } else {
      this.logs = [];
    }
    this.saveLogs();
    return this.logs.length;
  }

  /**
   * 删除指定ID的日志
   * @param id 日志ID
   * @returns 是否删除成功
   */
  deleteLog(id: string): boolean {
    const index = this.logs.findIndex(log => log.id === id);
    if (index === -1) {
      return false;
    }
    this.logs.splice(index, 1);
    this.saveLogs();
    return true;
  }



  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  getErrorLogs(count: number = 50): LogEntry[] {
    return this.logs
      .filter(log => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL)
      .slice(-count);
  }

  searchLogs(keyword: string, limit?: number): LogEntry[] {
    const results = this.logs.filter(log => 
      log.message.toLowerCase().includes(keyword.toLowerCase()) ||
      log.service.toLowerCase().includes(keyword.toLowerCase())
    );
    return limit ? results.slice(0, limit) : results;
  }
}

export { LogService };
export const logService = new LogService();
