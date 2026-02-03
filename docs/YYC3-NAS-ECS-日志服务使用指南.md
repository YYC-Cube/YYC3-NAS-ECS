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
