# YYC³ NAS-ECS 监控面板使用指南

**创建日期**: 2026-01-25  
**作者**: YYC³ Team  
**版本**: 1.0.0

---

## 📋 目录

1. [概述](#概述)
2. [快速开始](#快速开始)
3. [基础使用](#基础使用)
4. [高级功能](#高级功能)
5. [自定义监控](#自定义监控)
6. [性能优化](#性能优化)
7. [故障排查](#故障排查)
8. [最佳实践](#最佳实践)

---

## 概述

YYC³ NAS-ECS监控面板是一个功能强大的实时监控和性能分析工具，提供系统状态、资源使用、性能指标等全方位监控能力。

### 主要特性

- **实时监控**: 实时显示系统状态和性能指标
- **历史数据**: 查看历史性能趋势和统计信息
- **告警通知**: 自定义告警规则和通知方式
- **可视化图表**: 丰富的图表和可视化展示
- **性能分析**: 深度性能分析和优化建议
- **多维度监控**: CPU、内存、磁盘、网络等多维度监控

---

## 快速开始

### 安装依赖

```bash
# 安装监控相关依赖
npm install @newrelic/browser newrelic recharts
```

### 基础配置

```typescript
// src/app/config/monitoring.ts
export const monitoringConfig = {
  enabled: process.env.NEXT_PUBLIC_MONITORING_ENABLED === 'true',
  sampleRate: parseFloat(process.env.NEXT_PUBLIC_MONITORING_SAMPLE_RATE || '1.0'),
  apiEndpoint: process.env.NEXT_PUBLIC_MONITORING_API_ENDPOINT,
  refreshInterval: parseInt(process.env.NEXT_PUBLIC_MONITORING_REFRESH_INTERVAL || '5000'),
};
```

### 环境变量配置

```bash
# .env.local
NEXT_PUBLIC_MONITORING_ENABLED=true
NEXT_PUBLIC_MONITORING_SAMPLE_RATE=1.0
NEXT_PUBLIC_MONITORING_REFRESH_INTERVAL=5000
NEXT_PUBLIC_MONITORING_API_ENDPOINT=/api/monitoring
```

---

## 基础使用

### 1. 监控面板组件

```typescript
// src/app/components/dashboard/MonitorPanel.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    upload: number;
    download: number;
  };
  uptime: number;
  status: 'healthy' | 'warning' | 'critical';
}

export function MonitorPanel() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitoring/stats');
      const data = await response.json();
      setStats(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>系统监控</CardTitle>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(stats.status)}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(stats.status)}
                  <span className="capitalize">{stats.status}</span>
                </div>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">CPU使用率</div>
              <div className="text-2xl font-bold text-blue-700">
                {stats.cpu.toFixed(1)}%
              </div>
              <div className="text-xs text-blue-500 mt-1">
                {stats.cpu > 80 ? '高负载' : '正常'}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">内存使用率</div>
              <div className="text-2xl font-bold text-purple-700">
                {stats.memory.toFixed(1)}%
              </div>
              <div className="text-xs text-purple-500 mt-1">
                {stats.memory > 85 ? '内存紧张' : '正常'}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">磁盘使用率</div>
              <div className="text-2xl font-bold text-green-700">
                {stats.disk.toFixed(1)}%
              </div>
              <div className="text-xs text-green-500 mt-1">
                {stats.disk > 90 ? '磁盘空间不足' : '正常'}
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">系统运行时间</div>
              <div className="text-2xl font-bold text-orange-700">
                {Math.floor(stats.uptime / 3600)}h
              </div>
              <div className="text-xs text-orange-500 mt-1">
                {(stats.uptime % 3600 / 60).toFixed(0)}min
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>网络流量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-cyan-50 rounded-lg">
              <div className="text-sm text-cyan-600 mb-1">上传速度</div>
              <div className="text-2xl font-bold text-cyan-700">
                {stats.network.upload.toFixed(2)} MB/s
              </div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="text-sm text-indigo-600 mb-1">下载速度</div>
              <div className="text-2xl font-bold text-indigo-700">
                {stats.network.download.toFixed(2)} MB/s
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 text-center">
        最后更新: {lastUpdate.toLocaleString()}
      </div>
    </div>
  );
}
```

### 2. 性能图表组件

```typescript
// src/app/components/dashboard/PerformanceChart.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
}

export function PerformanceChart() {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/monitoring/performance?range=${timeRange}`);
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>性能趋势</CardTitle>
          <div className="flex gap-2">
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-sm ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip
              labelFormatter={(label) => `时间: ${formatTimestamp(label)}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#3b82f6"
              name="CPU %"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="memory"
              stroke="#8b5cf6"
              name="内存 %"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="disk"
              stroke="#10b981"
              name="磁盘 %"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### 3. 告警列表组件

```typescript
// src/app/components/dashboard/AlertList.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  acknowledged: boolean;
}

export function AlertList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/monitoring/alerts');
        const data = await response.json();
        setAlerts(data.alerts);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'active') return !alert.resolved;
    if (filter === 'resolved') return alert.resolved;
    return true;
  });

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      setAlerts(alerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      setAlerts(alerts.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'critical':
        return <Badge variant="destructive">严重</Badge>;
      case 'warning':
        return <Badge variant="secondary">警告</Badge>;
      case 'info':
        return <Badge>信息</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>告警列表</CardTitle>
          <div className="flex gap-2">
            {(['all', 'active', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-sm ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? '全部' : f === 'active' ? '活跃' : '已解决'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无告警
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.resolved
                    ? 'bg-gray-50 border-gray-200'
                    : alert.type === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getAlertIcon(alert.type)}
                      {getAlertBadge(alert.type)}
                      <h3 className="font-semibold">{alert.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {alert.message}
                    </p>
                    <div className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  {!alert.resolved && (
                    <div className="flex gap-2 ml-4">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          确认
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        解决
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 高级功能

### 1. 自定义监控指标

```typescript
// src/app/utils/customMetrics.ts
import { logService } from '@/app/services/logService';
import { LogCategory, LogLevel } from '@/app/types/logs';

export class CustomMetrics {
  private static metrics: Map<string, number[]> = new Map();

  static recordMetric(name: string, value: number, tags?: Record<string, string>) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push({
      value,
      timestamp: Date.now(),
      tags
    });

    if (this.metrics.get(name)!.length > 1000) {
      this.metrics.get(name)!.shift();
    }

    logService.addLog({
      category: LogCategory.SYSTEM,
      level: LogLevel.INFO,
      service: 'monitoring',
      message: `Metric recorded: ${name}`,
      details: { value, tags }
    });
  }

  static getMetricStats(name: string) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const numericValues = values.map(v => v.value);
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const avg = sum / numericValues.length;
    const max = Math.max(...numericValues);
    const min = Math.min(...numericValues);

    return {
      count: numericValues.length,
      avg,
      max,
      min,
      sum
    };
  }

  static recordAPILatency(endpoint: string, duration: number) {
    this.recordMetric(`api_latency_${endpoint}`, duration, {
      type: 'api',
      endpoint
    });
  }

  static recordDatabaseQuery(query: string, duration: number) {
    const queryType = query.split(' ')[0].toUpperCase();
    this.recordMetric(`db_query_${queryType.toLowerCase()}`, duration, {
      type: 'database',
      query_type: queryType
    });
  }

  static recordUserAction(action: string, duration?: number) {
    this.recordMetric(`user_action_${action}`, duration || 0, {
      type: 'user_action',
      action
    });
  }

  static recordBusinessMetric(name: string, value: number, context?: Record<string, any>) {
    this.recordMetric(`business_${name}`, value, {
      type: 'business',
      ...context
    });
  }
}
```

### 2. 性能分析工具

```typescript
// src/app/utils/performanceAnalyzer.ts
export class PerformanceAnalyzer {
  static analyzePagePerformance() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    const metrics = {
      DNS查询: navigation.domainLookupEnd - navigation.domainLookupStart,
      TCP连接: navigation.connectEnd - navigation.connectStart,
      请求响应: navigation.responseStart - navigation.requestStart,
      DOM解析: navigation.domComplete - navigation.domInteractive,
      首次绘制: paintEntries.find((e: any) => e.name === 'first-paint')?.startTime || 0,
      首次内容绘制: paintEntries.find((e: any) => e.name === 'first-contentful-paint')?.startTime || 0,
      页面加载: navigation.loadEventEnd - navigation.navigationStart,
      DOM内容加载: navigation.domContentLoadedEventEnd - navigation.navigationStart,
    };

    return metrics;
  }

  static analyzeResourcePerformance() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const analysis = {
      总资源数: resources.length,
      总大小: 0,
      总加载时间: 0,
      按类型: {} as Record<string, any>,
      慢资源: [] as any[]
    };

    resources.forEach(resource => {
      const type = this.getResourceType(resource.initiatorType);
      const size = resource.transferSize || 0;
      const duration = resource.duration;

      analysis.总大小 += size;
      analysis.总加载时间 += duration;

      if (!analysis.按类型[type]) {
        analysis.按类型[type] = {
          数量: 0,
          总大小: 0,
          平均加载时间: 0
        };
      }

      analysis.按类型[type].数量++;
      analysis.按类型[type].总大小 += size;
      analysis.按类型[type].平均加载时间 += duration;

      if (duration > 1000) {
        analysis.慢资源.push({
          url: resource.name,
          duration,
          size
        });
      }
    });

    Object.keys(analysis.按类型).forEach(type => {
      const typeData = analysis.按类型[type];
      typeData.平均加载时间 = typeData.平均加载时间 / typeData.数量;
    });

    return analysis;
  }

  private static getResourceType(initiatorType: string): string {
    const typeMap: Record<string, string> = {
      'script': '脚本',
      'link': '样式表',
      'img': '图片',
      'xmlhttprequest': 'AJAX',
      'fetch': 'Fetch',
      'other': '其他'
    };
    return typeMap[initiatorType] || '其他';
  }

  static generatePerformanceReport() {
    const pageMetrics = this.analyzePagePerformance();
    const resourceMetrics = this.analyzeResourcePerformance();

    return {
      页面性能: pageMetrics,
      资源性能: resourceMetrics,
      优化建议: this.generateOptimizationSuggestions(pageMetrics, resourceMetrics)
    };
  }

  private static generateOptimizationSuggestions(
    pageMetrics: any,
    resourceMetrics: any
  ): string[] {
    const suggestions: string[] = [];

    if (pageMetrics.页面加载 > 3000) {
      suggestions.push('页面加载时间过长，建议优化资源加载顺序和大小');
    }

    if (pageMetrics.首次内容绘制 > 1500) {
      suggestions.push('首次内容绘制时间过长，建议优化关键渲染路径');
    }

    if (resourceMetrics.慢资源.length > 5) {
      suggestions.push(`发现${resourceMetrics.慢资源.length}个慢加载资源，建议优化或使用CDN`);
    }

    if (resourceMetrics.总大小 > 5000000) {
      suggestions.push('页面总资源大小过大，建议压缩图片和代码');
    }

    return suggestions;
  }
}
```

### 3. 实时性能监控

```typescript
// src/app/hooks/usePerformanceMonitor.ts
import { useEffect, useState, useCallback } from 'react';

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    latency: 0
  });

  const measureFPS = useCallback(() => {
    let lastTime = performance.now();
    let frames = 0;

    const measure = () => {
      const now = performance.now();
      frames++;

      if (now >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frames = 0;
        lastTime = now;
      }

      requestAnimationFrame(measure);
    };

    measure();
  }, []);

  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      setMetrics(prev => ({ ...prev, memory: usedMB }));
    }
  }, []);

  const measureLatency = useCallback(() => {
    const start = performance.now();
    
    Promise.resolve().then(() => {
      const latency = performance.now() - start;
      setMetrics(prev => ({ ...prev, latency }));
    });
  }, []);

  useEffect(() => {
    measureFPS();
    const memoryInterval = setInterval(measureMemory, 1000);
    const latencyInterval = setInterval(measureLatency, 100);

    return () => {
      clearInterval(memoryInterval);
      clearInterval(latencyInterval);
    };
  }, [measureFPS, measureMemory, measureLatency]);

  return metrics;
}
```

---

## 自定义监控

### 1. 创建自定义监控面板

```typescript
// src/app/components/dashboard/CustomMonitorPanel.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';

interface CustomWidget {
  id: string;
  name: string;
  type: 'chart' | 'metric' | 'table';
  config: any;
}

export function CustomMonitorPanel() {
  const [widgets, setWidgets] = useState<CustomWidget[]>([]);
  const [showAddWidget, setShowAddWidget] = useState(false);

  useEffect(() => {
    const loadWidgets = async () => {
      try {
        const response = await fetch('/api/monitoring/widgets');
        const data = await response.json();
        setWidgets(data.widgets || []);
      } catch (error) {
        console.error('Failed to load widgets:', error);
      }
    };

    loadWidgets();
  }, []);

  const addWidget = async (widget: Omit<CustomWidget, 'id'>) => {
    try {
      const response = await fetch('/api/monitoring/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(widget)
      });
      const data = await response.json();
      setWidgets([...widgets, data]);
    } catch (error) {
      console.error('Failed to add widget:', error);
    }
  };

  const removeWidget = async (widgetId: string) => {
    try {
      await fetch(`/api/monitoring/widgets/${widgetId}`, {
        method: 'DELETE'
      });
      setWidgets(widgets.filter(w => w.id !== widgetId));
    } catch (error) {
      console.error('Failed to remove widget:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">自定义监控面板</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            设置
          </Button>
          <Button size="sm" onClick={() => setShowAddWidget(true)}>
            <Plus className="w-4 h-4 mr-2" />
            添加组件
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget) => (
          <Card key={widget.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{widget.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWidget(widget.id)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">
                {widget.type} 组件
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAddWidget && (
        <AddWidgetModal
          onClose={() => setShowAddWidget(false)}
          onAdd={addWidget}
        />
      )}
    </div>
  );
}

function AddWidgetModal({ onClose, onAdd }: { onClose: () => void; onAdd: (widget: any) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'chart' | 'metric' | 'table'>('metric');

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd({ name, type, config: {} });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">添加监控组件</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="输入组件名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">类型</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="metric">指标</option>
              <option value="chart">图表</option>
              <option value="table">表格</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>取消</Button>
            <Button onClick={handleSubmit}>添加</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 性能优化

### 1. 监控数据缓存

```typescript
// src/app/utils/monitoringCache.ts
export class MonitoringCache {
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly DEFAULT_TTL = 5000;

  static get(key: string, ttl: number = this.DEFAULT_TTL): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
  }

  static clear(): void {
    this.cache.clear();
  }

  static async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    const cached = this.get(key, ttl);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data);
    return data;
  }
}
```

### 2. 批量数据获取

```typescript
// src/app/utils/batchMonitoring.ts
export class BatchMonitoring {
  private static queue: Array<{ key: string; fetcher: () => Promise<any> }> = [];
  private static processing = false;

  static async batchFetch(keys: string[], fetcher: (key: string) => Promise<any>): Promise<any[]> {
    const results = await Promise.all(keys.map(fetcher));
    return results;
  }

  static enqueue(key: string, fetcher: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        key,
        fetcher: async () => {
          try {
            const result = await fetcher();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private static async processQueue() {
    if (this.queue.length === 0 || this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, 10);
      await Promise.all(batch.map(item => item.fetcher()));
    }

    this.processing = false;
  }
}
```

---

## 故障排查

### 1. 监控数据异常检测

```typescript
// src/app/utils/anomalyDetection.ts
export class AnomalyDetection {
  static detectAnomaly(data: number[], threshold: number = 2): boolean {
    if (data.length < 3) return false;

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    const latestValue = data[data.length - 1];
    const zScore = Math.abs((latestValue - mean) / stdDev);

    return zScore > threshold;
  }

  static detectTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  static detectSpike(data: number[], spikeThreshold: number = 1.5): boolean {
    if (data.length < 2) return false;

    const previous = data[data.length - 2];
    const current = data[data.length - 1];

    const change = Math.abs((current - previous) / previous);
    return change > spikeThreshold;
  }
}
```

### 2. 性能瓶颈分析

```typescript
// src/app/utils/bottleneckAnalysis.ts
export class BottleneckAnalysis {
  static analyzeAPIPerformance(latencies: number[]): {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    bottlenecks: string[];
  } {
    const sorted = [...latencies].sort((a, b) => a - b);
    const avg = sorted.reduce((sum, val) => sum + val, 0) / sorted.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    const bottlenecks: string[] = [];

    if (avg > 500) bottlenecks.push('平均响应时间过长');
    if (p95 > 1000) bottlenecks.push('95%请求响应时间过长');
    if (p99 > 2000) bottlenecks.push('99%请求响应时间过长');

    return { avg, p50, p95, p99, bottlenecks };
  }

  static analyzeResourceUsage(resources: { cpu: number[]; memory: number[]; disk: number[] }): {
    cpuBottleneck: boolean;
    memoryBottleneck: boolean;
    diskBottleneck: boolean;
    recommendations: string[];
  } {
    const avgCpu = resources.cpu.reduce((sum, val) => sum + val, 0) / resources.cpu.length;
    const avgMemory = resources.memory.reduce((sum, val) => sum + val, 0) / resources.memory.length;
    const avgDisk = resources.disk.reduce((sum, val) => sum + val, 0) / resources.disk.length;

    const recommendations: string[] = [];

    if (avgCpu > 80) {
      recommendations.push('CPU使用率过高，建议优化算法或增加CPU资源');
    }
    if (avgMemory > 85) {
      recommendations.push('内存使用率过高，建议优化内存使用或增加内存');
    }
    if (avgDisk > 90) {
      recommendations.push('磁盘使用率过高，建议清理磁盘或扩容');
    }

    return {
      cpuBottleneck: avgCpu > 80,
      memoryBottleneck: avgMemory > 85,
      diskBottleneck: avgDisk > 90,
      recommendations
    };
  }
}
```

---

## 最佳实践

### 1. 监控数据采样

```typescript
// src/app/utils/samplingStrategy.ts
export class SamplingStrategy {
  static shouldSample(sampleRate: number): boolean {
    return Math.random() < sampleRate;
  }

  static adaptiveSampling(baseRate: number, load: number): number {
    if (load > 0.8) {
      return Math.max(0.1, baseRate * 0.5);
    } else if (load > 0.5) {
      return baseRate * 0.8;
    }
    return baseRate;
  }

  static intelligentSampling(
    baseRate: number,
    metrics: { errorRate: number; latency: number; throughput: number }
  ): number {
    let adjustedRate = baseRate;

    if (metrics.errorRate > 0.01) {
      adjustedRate *= 1.5;
    }

    if (metrics.latency > 500) {
      adjustedRate *= 1.3;
    }

    if (metrics.throughput > 1000) {
      adjustedRate *= 0.7;
    }

    return Math.min(1.0, Math.max(0.1, adjustedRate));
  }
}
```

### 2. 监控告警聚合

```typescript
// src/app/utils/alertAggregation.ts
export class AlertAggregation {
  private static activeAlerts: Map<string, { count: number; firstSeen: number }> = new Map();
  private static readonly AGGREGATION_WINDOW = 60000;

  static processAlert(alert: { id: string; type: string; message: string }): boolean {
    const key = `${alert.type}:${alert.message}`;
    const now = Date.now();

    const existing = this.activeAlerts.get(key);
    if (existing) {
      const age = now - existing.firstSeen;
      if (age > this.AGGREGATION_WINDOW) {
        this.activeAlerts.set(key, { count: 1, firstSeen: now });
        return true;
      } else {
        existing.count++;
        return existing.count % 10 === 0;
      }
    } else {
      this.activeAlerts.set(key, { count: 1, firstSeen: now });
      return true;
    }
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, alert] of this.activeAlerts.entries()) {
      if (now - alert.firstSeen > this.AGGREGATION_WINDOW * 2) {
        this.activeAlerts.delete(key);
      }
    }
  }
}
```

---

## 总结

YYC³ NAS-ECS监控面板提供了全面的系统监控和性能分析能力。通过本指南，您可以：

1. 快速集成监控功能到应用中
2. 创建自定义监控面板和组件
3. 实现高级性能分析和优化
4. 设置智能告警和异常检测
5. 遵循最佳实践进行监控优化

建议定期审查监控策略，根据实际需求调整监控指标和告警规则，以确保系统稳定运行。

---

*本使用指南由YYC³ Team编写，包含监控面板的完整使用说明和代码示例。*
