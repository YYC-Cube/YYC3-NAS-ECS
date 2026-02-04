# YYC3-NAS-ECS 日志服务使用指南

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 📋 目录

- [概述](#概述)
- [日志级别](#日志级别)
- [日志分类](#日志分类)
- [快速开始](#快速开始)
- [基础功能](#基础功能)
- [高级查询](#高级查询)
- [统计分析](#统计分析)
- [导出下载](#导出下载)
- [React集成](#react集成)
- [最佳实践](#最佳实践)
- [API参考](#api参考)

---

## 概述

YYC3-NAS-ECS 日志服务提供全面的日志收集、存储、查询和导出功能，支持多维度日志分析和实时监控。该服务采用本地存储机制，确保日志数据的持久化和快速访问。

### 核心特性

- **多级别日志支持**：DEBUG、INFO、WARN、ERROR、FATAL
- **分类管理**：系统、认证、API、数据库、邮件、FRP、DDNS、LLM、备份、监控
- **灵活查询**：支持多条件组合查询和关键词搜索
- **统计分析**：提供日志统计和错误率分析
- **多格式导出**：支持JSON、CSV、TXT格式导出
- **性能优化**：批量保存机制，减少存储操作

---

## 日志级别

| 级别 | 说明 | 使用场景 |
|------|------|---------|
| `DEBUG` | 调试信息 | 开发调试、详细执行流程 |
| `INFO` | 一般信息 | 正常操作、状态变更 |
| `WARN` | 警告信息 | 潜在问题、非关键错误 |
| `ERROR` | 错误信息 | 操作失败、异常情况 |
| `FATAL` | 致命错误 | 系统崩溃、严重故障 |

---

## 日志分类

| 分类 | 说明 | 示例 |
|------|------|------|
| `SYSTEM` | 系统日志 | 系统启动、配置加载 |
| `AUTH` | 认证日志 | 用户登录、权限验证 |
| `API` | API日志 | 接口调用、请求响应 |
| `DATABASE` | 数据库日志 | 查询执行、数据变更 |
| `EMAIL` | 邮件日志 | 邮件发送、接收状态 |
| `FRP` | FRP日志 | 隧道管理、连接状态 |
| `DDNS` | DDNS日志 | 域名解析、IP更新 |
| `LLM` | LLM日志 | AI调用、模型响应 |
| `BACKUP` | 备份日志 | 备份执行、恢复操作 |
| `MONITORING` | 监控日志 | 性能指标、告警触发 |

---

## 快速开始

### 安装依赖

```bash
npm install
```

### 基础使用

```typescript
import { logService } from '@/services/logService';

// 添加日志
logService.addLog({
  level: 'INFO',
  category: 'SYSTEM',
  service: 'UserService',
  message: '用户登录成功',
  userId: 'user-123'
});

// 查询日志
const logs = logService.getLogs({
  level: 'ERROR',
  category: 'API'
}, 100);

// 获取统计信息
const stats = logService.getStats();
console.log('总日志数:', stats.total);
console.log('错误率:', stats.errorRate);
```

---

## 基础功能

### 添加日志

```typescript
import { logService } from '@/services/logService';
import { LogLevel, LogCategory } from '@/types/logs';

// 基础日志
logService.addLog({
  level: LogLevel.INFO,
  category: LogCategory.SYSTEM,
  service: 'UserService',
  message: '用户登录成功',
  userId: 'user-123'
});

// 带执行时间的日志
logService.addLog({
  level: LogLevel.INFO,
  category: LogCategory.API,
  service: 'APIService',
  message: 'API请求完成',
  duration: 150
});

// 错误日志
logService.addLog({
  level: LogLevel.ERROR,
  category: LogCategory.DATABASE,
  service: 'DatabaseService',
  message: '数据库连接失败',
  userId: 'user-123'
});
```

### 查询日志

```typescript
// 获取所有日志
const allLogs = logService.getLogs();

// 按级别查询
const errorLogs = logService.getLogs({
  level: LogLevel.ERROR
});

// 按分类查询
const apiLogs = logService.getLogs({
  category: LogCategory.API
});

// 按服务查询
const serviceLogs = logService.getLogs({
  service: 'UserService'
});

// 限制返回数量
const recentLogs = logService.getLogs({}, 100);

// 组合条件查询
const filteredLogs = logService.getLogs({
  level: LogLevel.ERROR,
  category: LogCategory.API,
  startTime: '2026-01-01T00:00:00.000Z',
  endTime: '2026-01-31T23:59:59.999Z'
}, 50);
```

### 获取单条日志

```typescript
// 根据ID获取日志
const log = logService.getLogById('1234567890-abc123');

if (log) {
  console.log('日志详情:', log);
}
```

### 获取最近日志

```typescript
// 获取最近100条日志
const recentLogs = logService.getRecentLogs(100);

// 获取最近50条错误日志
const errorLogs = logService.getErrorLogs(50);
```

### 搜索日志

```typescript
// 搜索包含关键词的日志
const searchResults = logService.searchLogs('数据库连接失败');

// 限制搜索结果数量
const limitedResults = logService.searchLogs('API', 100);
```

### 清除日志

```typescript
// 清除所有日志
const remainingCount = logService.clearLogs();

// 清除指定条件的日志
const remainingCount = logService.clearLogs({
  level: LogLevel.DEBUG
});

// 删除单条日志
const deleted = logService.deleteLog('1234567890-abc123');
```

---

## 高级查询

### 时间范围查询

```typescript
// 查询指定时间段的日志
const timeFilteredLogs = logService.getLogs({
  startTime: '2026-01-01T00:00:00.000Z',
  endTime: '2026-01-31T23:59:59.999Z'
});

// 查询最近24小时的日志
const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

const recentLogs = logService.getLogs({
  startTime: yesterday.toISOString(),
  endTime: now.toISOString()
});
```

### 多条件组合查询

```typescript
// 复杂查询条件
const complexQuery = logService.getLogs({
  level: LogLevel.ERROR,
  category: LogCategory.API,
  service: 'UserService',
  startTime: '2026-01-01T00:00:00.000Z',
  endTime: '2026-01-31T23:59:59.999Z',
  keyword: '登录',
  userId: 'user-123',
  minDuration: 100,
  maxDuration: 1000
});
```

### 执行时间过滤

```typescript
// 查询执行时间超过500ms的日志
const slowLogs = logService.getLogs({
  minDuration: 500
});

// 查询执行时间在100-500ms之间的日志
const normalLogs = logService.getLogs({
  minDuration: 100,
  maxDuration: 500
});
```

### 用户日志查询

```typescript
// 查询特定用户的日志
const userLogs = logService.getLogs({
  userId: 'user-123'
});

// 查询特定用户的错误日志
const userErrors = logService.getLogs({
  userId: 'user-123',
  level: LogLevel.ERROR
});
```

---

## 统计分析

### 获取统计信息

```typescript
// 获取所有日志的统计信息
const stats = logService.getStats();

console.log('总日志数:', stats.total);
console.log('错误率:', stats.errorRate);
console.log('平均执行时间:', stats.avgDuration);
console.log('按级别统计:', stats.byLevel);
console.log('按分类统计:', stats.byCategory);
console.log('按服务统计:', stats.byService);
```

### 按条件统计

```typescript
// 统计错误日志
const errorStats = logService.getStats({
  level: LogLevel.ERROR
});

// 统计特定服务的日志
const serviceStats = logService.getStats({
  service: 'UserService'
});

// 统计特定时间段的日志
const timeStats = logService.getStats({
  startTime: '2026-01-01T00:00:00.000Z',
  endTime: '2026-01-31T23:59:59.999Z'
});
```

### 错误率分析

```typescript
// 获取整体错误率
const stats = logService.getStats();
const errorRate = stats.errorRate;

console.log('错误率:', errorRate.toFixed(2) + '%');

// 获取特定服务的错误率
const serviceStats = logService.getStats({
  service: 'UserService'
});
const serviceErrorRate = serviceStats.errorRate;

console.log('UserService错误率:', serviceErrorRate.toFixed(2) + '%');
```

### 性能分析

```typescript
// 分析API性能
const apiStats = logService.getStats({
  category: LogCategory.API
});

console.log('API平均响应时间:', apiStats.avgDuration, 'ms');

// 分析慢查询
const slowQueries = logService.getLogs({
  category: LogCategory.DATABASE,
  minDuration: 1000
});

console.log('慢查询数量:', slowQueries.length);
```

---

## 导出下载

### 导出为JSON

```typescript
// 导出所有日志为JSON
const jsonContent = logService.exportLogs(undefined, {
  format: 'json'
});

// 导出指定条件的日志
const filteredJson = logService.exportLogs({
  level: LogLevel.ERROR,
  category: LogCategory.API
}, {
  format: 'json'
});
```

### 导出为CSV

```typescript
// 导出所有日志为CSV
const csvContent = logService.exportLogs(undefined, {
  format: 'csv'
});

// 导出指定条件的日志
const filteredCsv = logService.exportLogs({
  level: LogLevel.ERROR
}, {
  format: 'csv'
});
```

### 导出为TXT

```typescript
// 导出所有日志为TXT
const txtContent = logService.exportLogs(undefined, {
  format: 'txt'
});

// 导出指定条件的日志
const filteredTxt = logService.exportLogs({
  level: LogLevel.ERROR,
  category: LogCategory.API
}, {
  format: 'txt'
});
```

### 下载日志文件

```typescript
// 下载所有日志为JSON
logService.downloadLogs(undefined, {
  format: 'json'
});

// 下载错误日志为CSV
logService.downloadLogs({
  level: LogLevel.ERROR
}, {
  format: 'csv'
});

// 下载最近24小时的日志为TXT
const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

logService.downloadLogs({
  startTime: yesterday.toISOString(),
  endTime: now.toISOString()
}, {
  format: 'txt'
});
```

---

## React集成

### 日志查看组件

```typescript
import React, { useState, useEffect } from 'react';
import { logService } from '@/services/logService';
import { LogLevel, LogCategory, LogFilter } from '@/types/logs';

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogFilter>({});
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = logService.getLogs(filter, 100);
      setLogs(result);
    } catch (error) {
      console.error('加载日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    logService.downloadLogs(filter, { format });
  };

  const handleClear = () => {
    logService.clearLogs(filter);
    loadLogs();
  };

  return (
    <div className="log-viewer">
      <div className="log-filters">
        <select 
          value={filter.level || ''} 
          onChange={(e) => setFilter({ ...filter, level: e.target.value as LogLevel })}
        >
          <option value="">所有级别</option>
          <option value={LogLevel.DEBUG}>DEBUG</option>
          <option value={LogLevel.INFO}>INFO</option>
          <option value={LogLevel.WARN}>WARN</option>
          <option value={LogLevel.ERROR}>ERROR</option>
          <option value={LogLevel.FATAL}>FATAL</option>
        </select>

        <select 
          value={filter.category || ''} 
          onChange={(e) => setFilter({ ...filter, category: e.target.value as LogCategory })}
        >
          <option value="">所有分类</option>
          <option value={LogCategory.SYSTEM}>系统</option>
          <option value={LogCategory.AUTH}>认证</option>
          <option value={LogCategory.API}>API</option>
          <option value={LogCategory.DATABASE}>数据库</option>
          <option value={LogCategory.EMAIL}>邮件</option>
          <option value={LogCategory.FRP}>FRP</option>
          <option value={LogCategory.DDNS}>DDNS</option>
          <option value={LogCategory.LLM}>LLM</option>
          <option value={LogCategory.BACKUP}>备份</option>
          <option value={LogCategory.MONITORING}>监控</option>
        </select>

        <input 
          type="text" 
          placeholder="搜索关键词"
          value={filter.keyword || ''}
          onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
        />

        <button onClick={loadLogs}>刷新</button>
        <button onClick={() => handleExport('json')}>导出JSON</button>
        <button onClick={() => handleExport('csv')}>导出CSV</button>
        <button onClick={() => handleExport('txt')}>导出TXT</button>
        <button onClick={handleClear}>清除</button>
      </div>

      <div className="log-list">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          logs.map(log => (
            <div key={log.id} className={`log-item log-${log.level.toLowerCase()}`}>
              <div className="log-header">
                <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                <span className={`log-level log-${log.level.toLowerCase()}`}>{log.level}</span>
                <span className="log-category">{log.category}</span>
                <span className="log-service">{log.service}</span>
              </div>
              <div className="log-message">{log.message}</div>
              {log.duration && (
                <div className="log-duration">执行时间: {log.duration}ms</div>
              )}
              {log.userId && (
                <div className="log-user">用户ID: {log.userId}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

### 日志统计组件

```typescript
import React, { useState, useEffect } from 'react';
import { logService } from '@/services/logService';
import { LogStats, LogFilter } from '@/types/logs';

export function LogStats() {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [filter, setFilter] = useState<LogFilter>({});

  const loadStats = () => {
    const result = logService.getStats(filter);
    setStats(result);
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, [filter]);

  if (!stats) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="log-stats">
      <div className="stat-card">
        <h3>总日志数</h3>
        <div className="stat-value">{stats.total}</div>
      </div>

      <div className="stat-card">
        <h3>错误率</h3>
        <div className={`stat-value ${stats.errorRate > 5 ? 'error' : 'normal'}`}>
          {stats.errorRate.toFixed(2)}%
        </div>
      </div>

      {stats.avgDuration && (
        <div className="stat-card">
          <h3>平均执行时间</h3>
          <div className="stat-value">{stats.avgDuration.toFixed(2)}ms</div>
        </div>
      )}

      <div className="stat-section">
        <h3>按级别统计</h3>
        <div className="level-stats">
          <div className="level-item">
            <span className="level-name">DEBUG</span>
            <span className="level-count">{stats.byLevel.DEBUG}</span>
          </div>
          <div className="level-item">
            <span className="level-name">INFO</span>
            <span className="level-count">{stats.byLevel.INFO}</span>
          </div>
          <div className="level-item">
            <span className="level-name">WARN</span>
            <span className="level-count">{stats.byLevel.WARN}</span>
          </div>
          <div className="level-item">
            <span className="level-name">ERROR</span>
            <span className="level-count">{stats.byLevel.ERROR}</span>
          </div>
          <div className="level-item">
            <span className="level-name">FATAL</span>
            <span className="level-count">{stats.byLevel.FATAL}</span>
          </div>
        </div>
      </div>

      <div className="stat-section">
        <h3>按分类统计</h3>
        <div className="category-stats">
          {Object.entries(stats.byCategory).map(([category, count]) => (
            <div key={category} className="category-item">
              <span className="category-name">{category}</span>
              <span className="category-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-section">
        <h3>按服务统计</h3>
        <div className="service-stats">
          {Object.entries(stats.byService)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([service, count]) => (
              <div key={service} className="service-item">
                <span className="service-name">{service}</span>
                <span className="service-count">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
```

### React Hook

```typescript
import { useState, useEffect, useCallback } from 'react';
import { logService } from '@/services/logService';
import { LogEntry, LogFilter, LogStats } from '@/types/logs';

export function useLogs(filter?: LogFilter, limit?: number) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      const result = logService.getLogs(filter, limit);
      setLogs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取日志失败');
    } finally {
      setLoading(false);
    }
  }, [filter, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}

export function useLogStats(filter?: LogFilter) {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      const result = logService.getStats(filter);
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取统计信息失败');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useRecentLogs(count: number = 100) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentLogs = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      const result = logService.getRecentLogs(count);
      setLogs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取最近日志失败');
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    fetchRecentLogs();
    const interval = setInterval(fetchRecentLogs, 10000); // 每10秒刷新
    return () => clearInterval(interval);
  }, [fetchRecentLogs]);

  return { logs, loading, error, refetch: fetchRecentLogs };
}
```

---

## 🎯 高级使用示例

### 场景1：实时日志监控与告警

#### 需求描述
实时监控系统日志，当检测到错误日志时自动发送告警通知。

#### 实现代码

```typescript
import { logService } from '@/services/logService';

interface AlertRule {
  level: string[];
  category: string[];
  keyword?: string;
  threshold: number;
  window: number; // 时间窗口（毫秒）
}

class LogMonitor {
  private alertRules: AlertRule[] = [];
  private logBuffer: any[] = [];
  private monitoring: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  startMonitoring(checkInterval: number = 5000): void {
    if (this.monitoring) {
      console.warn('日志监控已在运行');
      return;
    }

    this.monitoring = true;
    console.log('开始日志监控');

    this.checkInterval = setInterval(() => {
      this.checkLogs();
    }, checkInterval);
  }

  stopMonitoring(): void {
    if (!this.monitoring) {
      return;
    }

    this.monitoring = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log('停止日志监控');
  }

  private async checkLogs(): Promise<void> {
    try {
      const endTime = Date.now();
      const startTime = endTime - 60000; // 查询最近1分钟的日志

      const logs = logService.getLogs({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      }, 1000);

      for (const rule of this.alertRules) {
        const matchedLogs = logs.filter(log => 
          rule.level.includes(log.level) &&
          rule.category.includes(log.category) &&
          (!rule.keyword || log.message.includes(rule.keyword))
        );

        if (matchedLogs.length >= rule.threshold) {
          await this.sendAlert(rule, matchedLogs);
        }
      }
    } catch (error) {
      console.error('检查日志失败:', error);
    }
  }

  private async sendAlert(rule: AlertRule, logs: any[]): Promise<void> {
    const alertMessage = `
日志告警触发！

规则:
- 级别: ${rule.level.join(', ')}
- 分类: ${rule.category.join(', ')}
- 关键词: ${rule.keyword || '无'}
- 阈值: ${rule.threshold}条/${rule.window}ms

触发日志:
${logs.map(log => `- [${log.level}] ${log.category}: ${log.message}`).join('\n')}
    `;

    console.warn(alertMessage);

    // 发送邮件通知
    try {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'admin@example.com',
          subject: '[日志告警] 检测到异常日志',
          body: alertMessage
        })
      });
    } catch (error) {
      console.error('发送告警邮件失败:', error);
    }

    // 发送Webhook通知
    try {
      await fetch(process.env.WEBHOOK_URL || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: alertMessage })
      });
    } catch (error) {
      console.error('发送Webhook通知失败:', error);
    }
  }
}

// 使用示例
const logMonitor = new LogMonitor();

// 添加告警规则
logMonitor.addAlertRule({
  level: ['ERROR', 'FATAL'],
  category: ['API', 'DATABASE'],
  threshold: 5,
  window: 60000 // 1分钟内5个错误
});

logMonitor.addAlertRule({
  level: ['ERROR'],
  category: ['SYSTEM'],
  keyword: '磁盘空间不足',
  threshold: 1,
  window: 300000 // 5分钟内1个关键错误
});

// 启动监控
logMonitor.startMonitoring(10000); // 每10秒检查一次

// 停止监控
// logMonitor.stopMonitoring();
```

### 场景2：日志聚合与分析

#### 需求描述
对日志进行聚合分析，识别常见错误模式和性能瓶颈。

#### 实现代码

```typescript
import { logService } from '@/services/logService';

interface LogPattern {
  pattern: string;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  level: string;
  category: string;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

class LogAnalyzer {
  async analyzeErrorPatterns(
    startTime: Date,
    endTime: Date
  ): Promise<LogPattern[]> {
    const logs = logService.getLogs({
      level: 'ERROR',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    }, 10000);

    const patterns = new Map<string, LogPattern>();

    for (const log of logs) {
      const pattern = this.extractPattern(log.message);
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, {
          pattern,
          count: 0,
          firstOccurrence: log.timestamp,
          lastOccurrence: log.timestamp,
          level: log.level,
          category: log.category
        });
      }

      const patternData = patterns.get(pattern)!;
      patternData.count++;
      
      if (log.timestamp < patternData.firstOccurrence) {
        patternData.firstOccurrence = log.timestamp;
      }
      
      if (log.timestamp > patternData.lastOccurrence) {
        patternData.lastOccurrence = log.timestamp;
      }
    }

    return Array.from(patterns.values())
      .sort((a, b) => b.count - a.count);
  }

  private extractPattern(message: string): string {
    return message
      .replace(/\d+/g, 'N')
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'EMAIL')
      .replace(/https?:\/\/[^\s]+/g, 'URL')
      .trim();
  }

  async analyzePerformance(
    startTime: Date,
    endTime: Date
  ): Promise<PerformanceMetrics> {
    const logs = logService.getLogs({
      category: 'API',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    }, 10000);

    const responseTimes = logs
      .filter(log => log.duration)
      .map(log => log.duration)
      .sort((a, b) => a - b);

    if (responseTimes.length === 0) {
      return {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      };
    }

    const sum = responseTimes.reduce((acc, val) => acc + val, 0);
    const avg = sum / responseTimes.length;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    return {
      avgResponseTime: avg,
      maxResponseTime: responseTimes[responseTimes.length - 1],
      minResponseTime: responseTimes[0],
      p95ResponseTime: responseTimes[p95Index],
      p99ResponseTime: responseTimes[p99Index]
    };
  }

  async generateReport(
    startTime: Date,
    endTime: Date
  ): Promise<string> {
    const errorPatterns = await this.analyzeErrorPatterns(startTime, endTime);
    const performance = await this.analyzePerformance(startTime, endTime);

    const report = `
日志分析报告
========================================

时间范围: ${startTime.toISOString()} ~ ${endTime.toISOString()}

错误模式分析
----------------------------------------
${errorPatterns.slice(0, 10).map((pattern, index) => `
${index + 1}. ${pattern.pattern}
   出现次数: ${pattern.count}
   级别: ${pattern.level}
   分类: ${pattern.category}
   首次出现: ${pattern.firstOccurrence}
   最后出现: ${pattern.lastOccurrence}
`).join('\n')}

性能指标分析
----------------------------------------
平均响应时间: ${performance.avgResponseTime.toFixed(2)}ms
最大响应时间: ${performance.maxResponseTime.toFixed(2)}ms
最小响应时间: ${performance.minResponseTime.toFixed(2)}ms
P95响应时间: ${performance.p95ResponseTime.toFixed(2)}ms
P99响应时间: ${performance.p99ResponseTime.toFixed(2)}ms

========================================
    `;

    return report;
  }
}

// 使用示例
const logAnalyzer = new LogAnalyzer();

// 分析最近24小时的错误模式
const endTime = new Date();
const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

const errorPatterns = await logAnalyzer.analyzeErrorPatterns(startTime, endTime);
console.log('错误模式:', errorPatterns);

// 分析性能指标
const performance = await logAnalyzer.analyzePerformance(startTime, endTime);
console.log('性能指标:', performance);

// 生成完整报告
const report = await logAnalyzer.generateReport(startTime, endTime);
console.log(report);
```

### 场景3：日志导出与归档

#### 需求描述
定期导出日志到外部存储，实现日志归档和长期保存。

#### 实现代码

```typescript
import { logService } from '@/services/logService';

interface ArchiveConfig {
  exportPath: string;
  exportFormat: 'json' | 'csv' | 'txt';
  retentionDays: number;
  compress: boolean;
}

class LogArchiver {
  private config: ArchiveConfig;

  constructor(config: ArchiveConfig) {
    this.config = config;
  }

  async exportLogs(
    startTime: Date,
    endTime: Date
  ): Promise<string> {
    const logs = logService.getLogs({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    }, 100000);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `logs-${timestamp}.${this.config.exportFormat}`;
    const filepath = `${this.config.exportPath}/${filename}`;

    let content: string;

    switch (this.config.exportFormat) {
      case 'json':
        content = JSON.stringify(logs, null, 2);
        break;
      
      case 'csv':
        const headers = Object.keys(logs[0] || {}).join(',');
        const rows = logs.map(log => 
          Object.values(log).map(val => 
            typeof val === 'string' ? `"${val}"` : val
          ).join(',')
        );
        content = [headers, ...rows].join('\n');
        break;
      
      case 'txt':
        content = logs.map(log => 
          `[${log.timestamp}] [${log.level}] [${log.category}] ${log.message}`
        ).join('\n');
        break;
    }

    // 写入文件
    await this.writeFile(filepath, content);

    // 压缩文件
    if (this.config.compress) {
      await this.compressFile(filepath);
    }

    return filepath;
  }

  private async writeFile(filepath: string, content: string): Promise<void> {
    // 在实际应用中，这里应该调用文件系统API
    console.log(`写入文件: ${filepath} (${content.length} bytes)`);
  }

  private async compressFile(filepath: string): Promise<void> {
    // 在实际应用中，这里应该调用压缩API
    const compressedPath = `${filepath}.gz`;
    console.log(`压缩文件: ${filepath} -> ${compressedPath}`);
  }

  async archiveOldLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    console.log(`归档 ${this.config.retentionDays} 天前的日志...`);

    const archivedFile = await this.exportLogs(
      new Date(0),
      cutoffDate
    );

    console.log(`日志已归档到: ${archivedFile}`);

    // 删除已归档的日志
    const deleteCount = logService.deleteLogs({
      endTime: cutoffDate.toISOString()
    });

    console.log(`已删除 ${deleteCount} 条旧日志`);
  }

  async scheduleArchive(intervalHours: number = 24): Promise<void> {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    console.log(`设置日志归档任务，每 ${intervalHours} 小时执行一次`);

    setInterval(async () => {
      try {
        await this.archiveOldLogs();
      } catch (error) {
        console.error('日志归档失败:', error);
      }
    }, intervalMs);
  }
}

// 使用示例
const logArchiver = new LogArchiver({
  exportPath: '/opt/yyc3/archives/logs',
  exportFormat: 'json',
  retentionDays: 30,
  compress: true
});

// 导出指定时间范围的日志
const endTime = new Date();
const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);

const exportedFile = await logArchiver.exportLogs(startTime, endTime);
console.log(`日志已导出到: ${exportedFile}`);

// 归档旧日志
await logArchiver.archiveOldLogs();

// 设置定时归档
await logArchiver.scheduleArchive(24); // 每24小时归档一次
```

### 场景4：日志可视化仪表板

#### 需求描述
创建日志可视化仪表板，实时展示日志统计和趋势。

#### 实现代码

```typescript
import { logService } from '@/services/logService';
import { useState, useEffect } from 'react';

interface LogDashboardData {
  totalLogs: number;
  logsByLevel: { [key: string]: number };
  logsByCategory: { [key: string]: number };
  errorRate: number;
  recentErrors: any[];
  logTrend: { timestamp: string; count: number }[];
}

export function useLogDashboard(refreshInterval: number = 30000) {
  const [data, setData] = useState<LogDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

      const logs = logService.getLogs({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      }, 10000);

      const totalLogs = logs.length;
      const errorLogs = logs.filter(log => log.level === 'ERROR' || log.level === 'FATAL');
      const errorRate = (errorLogs.length / totalLogs) * 100;

      const logsByLevel: { [key: string]: number } = {};
      const logsByCategory: { [key: string]: number } = {};

      for (const log of logs) {
        logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
        logsByCategory[log.category] = (logsByCategory[log.category] || 0) + 1;
      }

      const recentErrors = errorLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      const logTrend = generateLogTrend(logs, startTime, endTime);

      setData({
        totalLogs,
        logsByLevel,
        logsByCategory,
        errorRate,
        recentErrors,
        logTrend
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取仪表板数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { data, loading, error, refetch: fetchDashboardData };
}

function generateLogTrend(
  logs: any[],
  startTime: Date,
  endTime: Date
): { timestamp: string; count: number }[] {
  const trend: { timestamp: string; count: number }[] = [];
  const interval = 60 * 60 * 1000; // 1小时间隔

  for (let time = startTime.getTime(); time < endTime.getTime(); time += interval) {
    const intervalStart = new Date(time);
    const intervalEnd = new Date(time + interval);

    const count = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= intervalStart.getTime() && logTime < intervalEnd.getTime();
    }).length;

    trend.push({
      timestamp: intervalStart.toISOString(),
      count
    });
  }

  return trend;
}

// 使用示例：日志仪表板组件
function LogDashboard() {
  const { data, loading, error } = useLogDashboard(30000);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!data) return null;

  return (
    <div className="log-dashboard">
      <h1>日志仪表板</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>总日志数</h3>
          <p className="stat-value">{data.totalLogs}</p>
        </div>
        
        <div className="stat-card">
          <h3>错误率</h3>
          <p className={`stat-value ${data.errorRate > 5 ? 'error' : 'normal'}`}>
            {data.errorRate.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>日志级别分布</h3>
          <LevelChart data={data.logsByLevel} />
        </div>
        
        <div className="chart-container">
          <h3>日志分类分布</h3>
          <CategoryChart data={data.logsByCategory} />
        </div>
        
        <div className="chart-container">
          <h3>日志趋势</h3>
          <TrendChart data={data.logTrend} />
        </div>
      </div>

      <div className="dashboard-errors">
        <h3>最近错误</h3>
        <ErrorList errors={data.recentErrors} />
      </div>
    </div>
  );
}
```

### 场景5：日志搜索与过滤优化

#### 需求描述
实现高效的日志搜索和过滤功能，支持复杂查询条件。

#### 实现代码

```typescript
import { logService } from '@/services/logService';

interface SearchQuery {
  level?: string[];
  category?: string[];
  service?: string[];
  userId?: string[];
  keyword?: string;
  startTime?: string;
  endTime?: string;
  minDuration?: number;
  maxDuration?: number;
  limit?: number;
}

class LogSearchEngine {
  private searchHistory: Map<string, SearchQuery> = new Map();

  async search(query: SearchQuery): Promise<any[]> {
    const queryKey = this.generateQueryKey(query);
    
    if (this.searchHistory.has(queryKey)) {
      console.log('使用缓存的搜索结果');
      return this.searchHistory.get(queryKey)!;
    }

    const logs = logService.getLogs({
      level: query.level?.join(','),
      category: query.category?.join(','),
      service: query.service?.join(','),
      userId: query.userId?.join(','),
      startTime: query.startTime,
      endTime: query.endTime
    }, query.limit || 1000);

    let filteredLogs = logs;

    if (query.keyword) {
      const keywords = query.keyword.toLowerCase().split(/\s+/);
      filteredLogs = filteredLogs.filter(log => 
        keywords.every(keyword => 
          log.message.toLowerCase().includes(keyword) ||
          log.service?.toLowerCase().includes(keyword)
        )
      );
    }

    if (query.minDuration !== undefined) {
      filteredLogs = filteredLogs.filter(log => 
        log.duration >= query.minDuration!
      );
    }

    if (query.maxDuration !== undefined) {
      filteredLogs = filteredLogs.filter(log => 
        log.duration <= query.maxDuration!
      );
    }

    this.searchHistory.set(queryKey, query);
    return filteredLogs;
  }

  async searchWithHighlight(
    query: SearchQuery,
    highlightFields: string[] = ['message']
  ): Promise<any[]> {
    const logs = await this.search(query);
    const keyword = query.keyword?.toLowerCase();

    if (!keyword) {
      return logs;
    }

    return logs.map(log => {
      const highlightedLog = { ...log };

      for (const field of highlightFields) {
        if (log[field]) {
          highlightedLog[field] = this.highlightText(
            log[field],
            keyword
          );
        }
      }

      return highlightedLog;
    });
  }

  private highlightText(text: string, keyword: string): string {
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private generateQueryKey(query: SearchQuery): string {
    return JSON.stringify(query);
  }

  clearSearchHistory(): void {
    this.searchHistory.clear();
  }

  async getSearchSuggestions(
    field: string,
    prefix: string
  ): Promise<string[]> {
    const logs = logService.getLogs({}, 10000);
    const values = new Set<string>();

    for (const log of logs) {
      if (log[field] && typeof log[field] === 'string') {
        const value = log[field] as string;
        if (value.toLowerCase().startsWith(prefix.toLowerCase())) {
          values.add(value);
        }
      }
    }

    return Array.from(values).slice(0, 20);
  }
}

// 使用示例
const logSearchEngine = new LogSearchEngine();

// 基础搜索
const searchResults = await logSearchEngine.search({
  level: ['ERROR', 'WARN'],
  category: ['API', 'DATABASE'],
  keyword: '连接失败',
  limit: 100
});

console.log('搜索结果:', searchResults);

// 带高亮的搜索
const highlightedResults = await logSearchEngine.searchWithHighlight({
  keyword: '用户登录',
  limit: 50
});

console.log('高亮结果:', highlightedResults);

// 获取搜索建议
const suggestions = await logSearchEngine.getSearchSuggestions('service', 'User');
console.log('搜索建议:', suggestions);

// 清除搜索历史
logSearchEngine.clearSearchHistory();
```

---

## 最佳实践

### 日志级别使用

```typescript
// DEBUG级别：开发调试信息
logService.addLog({
  level: LogLevel.DEBUG,
  category: LogCategory.API,
  service: 'APIService',
  message: 'API请求参数: ' + JSON.stringify(params)
});

// INFO级别：正常操作信息
logService.addLog({
  level: LogLevel.INFO,
  category: LogCategory.AUTH,
  service: 'AuthService',
  message: '用户登录成功',
  userId: userId
});

// WARN级别：潜在问题警告
logService.addLog({
  level: LogLevel.WARN,
  category: LogCategory.DATABASE,
  service: 'DatabaseService',
  message: '数据库连接池使用率超过80%',
  userId: userId
});

// ERROR级别：操作失败错误
logService.addLog({
  level: LogLevel.ERROR,
  category: LogCategory.API,
  service: 'APIService',
  message: 'API请求失败: ' + error.message,
  userId: userId
});

// FATAL级别：系统致命错误
logService.addLog({
  level: LogLevel.FATAL,
  category: LogCategory.SYSTEM,
  service: 'SystemService',
  message: '系统崩溃，无法继续运行'
});
```

### 性能监控

```typescript
// 记录API请求性能
async function apiRequest(url: string, data: any) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    const duration = Date.now() - startTime;
    
    logService.addLog({
      level: LogLevel.INFO,
      category: LogCategory.API,
      service: 'APIService',
      message: `API请求成功: ${url}`,
      duration: duration
    });
    
    return await response.json();
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logService.addLog({
      level: LogLevel.ERROR,
      category: LogCategory.API,
      service: 'APIService',
      message: `API请求失败: ${url} - ${error.message}`,
      duration: duration
    });
    
    throw error;
  }
}
```

### 错误追踪

```typescript
// 记录错误详情
function handleError(error: Error, context: any) {
  logService.addLog({
    level: LogLevel.ERROR,
    category: LogCategory.SYSTEM,
    service: 'ErrorHandler',
    message: `错误: ${error.message}`,
    userId: context.userId
  });
  
  // 记录错误堆栈（DEBUG级别）
  logService.addLog({
    level: LogLevel.DEBUG,
    category: LogCategory.SYSTEM,
    service: 'ErrorHandler',
    message: `错误堆栈: ${error.stack}`
  });
}
```

### 日志清理策略

```typescript
// 定期清理旧日志
function cleanupOldLogs() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const remainingCount = logService.clearLogs({
    endTime: thirtyDaysAgo.toISOString()
  });
  
  console.log('清理后剩余日志数:', remainingCount);
}

// 清理DEBUG级别日志
function cleanupDebugLogs() {
  const remainingCount = logService.clearLogs({
    level: LogLevel.DEBUG
  });
  
  console.log('清理后剩余日志数:', remainingCount);
}
```

### 日志导出策略

```typescript
// 定期导出错误日志
function exportErrorLogs() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  logService.downloadLogs({
    level: LogLevel.ERROR,
    startTime: yesterday.toISOString(),
    endTime: now.toISOString()
  }, {
    format: 'json'
  });
}

// 导出性能日志
function exportPerformanceLogs() {
  logService.downloadLogs({
    category: LogCategory.API,
    minDuration: 500
  }, {
    format: 'csv'
  });
}
```

---

## API参考

### LogService

#### 方法

##### `addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry`

添加日志条目。

**参数：**
- `entry` - 日志条目（不包含ID和时间戳）

**返回：**
- `LogEntry` - 添加的日志条目（包含自动生成的ID和时间戳）

**示例：**
```typescript
const log = logService.addLog({
  level: LogLevel.INFO,
  category: LogCategory.SYSTEM,
  service: 'UserService',
  message: '用户登录成功',
  userId: 'user-123'
});
```

---

##### `getLogs(filter?: LogFilter, limit?: number): LogEntry[]`

获取日志列表。

**参数：**
- `filter` - 可选，日志过滤条件
- `limit` - 可选，返回日志数量限制

**返回：**
- `LogEntry[]` - 日志列表

**示例：**
```typescript
const logs = logService.getLogs({
  level: LogLevel.ERROR
}, 100);
```

---

##### `getLogById(id: string): LogEntry | undefined`

根据ID获取日志条目。

**参数：**
- `id` - 日志ID

**返回：**
- `LogEntry | undefined` - 日志条目，如果不存在则返回undefined

**示例：**
```typescript
const log = logService.getLogById('1234567890-abc123');
```

---

##### `getStats(filter?: LogFilter): LogStats`

获取日志统计信息。

**参数：**
- `filter` - 可选，日志过滤条件

**返回：**
- `LogStats` - 统计信息

**示例：**
```typescript
const stats = logService.getStats({
  level: LogLevel.ERROR
});
```

---

##### `exportLogs(filter?: LogFilter, options?: LogExportOptions): string`

导出日志为字符串。

**参数：**
- `filter` - 可选，日志过滤条件
- `options` - 可选，导出选项（格式：json、csv、txt）

**返回：**
- `string` - 导出的日志字符串

**示例：**
```typescript
const jsonContent = logService.exportLogs(undefined, {
  format: 'json'
});
```

---

##### `downloadLogs(filter?: LogFilter, options?: LogExportOptions): void`

下载日志文件。

**参数：**
- `filter` - 可选，日志过滤条件
- `options` - 可选，导出选项（格式：json、csv、txt）

**返回：**
- `void`

**示例：**
```typescript
logService.downloadLogs({
  level: LogLevel.ERROR
}, {
  format: 'csv'
});
```

---

##### `clearLogs(filter?: LogFilter): number`

清除日志。

**参数：**
- `filter` - 可选，日志过滤条件

**返回：**
- `number` - 剩余日志数量

**示例：**
```typescript
const remainingCount = logService.clearLogs({
  level: LogLevel.DEBUG
});
```

---

##### `deleteLog(id: string): boolean`

删除指定ID的日志。

**参数：**
- `id` - 日志ID

**返回：**
- `boolean` - 是否删除成功

**示例：**
```typescript
const deleted = logService.deleteLog('1234567890-abc123');
```

---

##### `getRecentLogs(count?: number): LogEntry[]`

获取最近的日志。

**参数：**
- `count` - 可选，日志数量，默认100

**返回：**
- `LogEntry[]` - 日志列表

**示例：**
```typescript
const recentLogs = logService.getRecentLogs(100);
```

---

##### `getErrorLogs(count?: number): LogEntry[]`

获取错误日志。

**参数：**
- `count` - 可选，日志数量，默认50

**返回：**
- `LogEntry[]` - 错误日志列表

**示例：**
```typescript
const errorLogs = logService.getErrorLogs(50);
```

---

##### `searchLogs(keyword: string, limit?: number): LogEntry[]`

搜索日志。

**参数：**
- `keyword` - 搜索关键词
- `limit` - 可选，返回结果数量限制

**返回：**
- `LogEntry[]` - 搜索结果列表

**示例：**
```typescript
const results = logService.searchLogs('API', 100);
```

---

### 类型定义

#### LogEntry

```typescript
interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  service: string;
  message: string;
  userId?: string;
  duration?: number;
}
```

#### LogLevel

```typescript
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}
```

#### LogCategory

```typescript
enum LogCategory {
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
```

#### LogFilter

```typescript
interface LogFilter {
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
```

#### LogStats

```typescript
interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<LogCategory, number>;
  byService: Record<string, number>;
  errorRate: number;
  avgDuration?: number;
}
```

#### LogExportOptions

```typescript
interface LogExportOptions {
  format?: 'json' | 'csv' | 'txt';
}
```

---

## 常见问题

### Q: 如何限制日志数量？

A: 日志服务会自动限制日志数量，默认最大10000条。当日志数量超过限制时，会自动删除最旧的日志。

### Q: 如何提高日志查询性能？

A: 日志服务采用批量保存机制，每100条日志保存一次，减少存储操作。对于大量日志，建议使用过滤条件限制查询范围。

### Q: 日志数据存储在哪里？

A: 日志数据存储在浏览器的localStorage中，使用键名`yyc3-system-logs`。

### Q: 如何备份日志数据？

A: 使用`downloadLogs`方法导出日志文件，支持JSON、CSV、TXT格式。

### Q: 日志服务是否支持多标签页同步？

A: 当前版本不支持多标签页同步，每个标签页维护独立的日志实例。

---

## 更新日志

### v1.0.0 (2026-01-24)

- 初始版本发布
- 支持多级别日志记录
- 支持多维度日志查询
- 支持日志统计分析
- 支持多格式日志导出
- 支持React集成

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
