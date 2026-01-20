# API接口文档 - 性能监控系统

> **YYC³（YanYu Cloud Cube）**
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***英文***：*All Realms Converge at Cloud Nexus, DeepStack Ignites a New Era*

---

**创建日期**：2026-01-08
**作者**：YYC³团队
**版本**：1.0.0
**更新日期**：2026-01-08

---

## 📋 目录

- [1. 接口概述](#1-接口概述)
- [2. 认证方式](#2-认证方式)
- [3. 接口列表](#3-接口列表)
  - [3.1 PerformanceMonitor - 性能监控核心类](#31-performancemonitor---性能监控核心类)
  - [3.2 RealTimeAIDashboard - 实时AI仪表板](#32-realtim eaidashboard---实时ai仪表板)
  - [3.3 AnomalyDetection - 异常检测引擎](#33-anomalydetection---异常检测引擎)
- [4. 错误码说明](#4-错误码说明)
- [5. 示例代码](#5-示例代码)
- [6. 最佳实践](#6-最佳实践)

---

## 1. 接口概述

YYC³ MovAISys 性能监控系统API提供了一套完整的性能监控、异常检测和智能告警功能。系统基于"五高五标五化"核心机制设计，支持实时数据采集、智能分析和自动化响应。

### 核心功能

- **实时性能监控**：支持CPU、内存、响应时间、吞吐量、错误率等多种性能指标的实时采集和监控
- **智能异常检测**：集成Z-score、IQR、趋势分析等多种异常检测算法，自动识别性能异常
- **灵活告警规则**：支持自定义告警规则，包括阈值告警、趋势告警、百分比变化告警等多种告警类型
- **多渠道通知**：支持邮件、Slack、Webhook、短信等多种通知渠道，确保告警及时送达
- **实时仪表板**：提供可视化的实时监控仪表板，直观展示系统性能状态和告警信息
- **历史数据分析**：支持历史指标数据的存储和查询，便于性能趋势分析和问题排查

### 适用场景

- 企业级应用性能监控
- 微服务架构监控
- 云原生应用监控
- AI系统运行监控
- 实时数据分析平台

---

## 2. 认证方式

当前版本API采用内部调用模式，暂无需外部认证。未来版本将支持以下认证方式：

### 2.1 API密钥认证（规划中）

```typescript
// 请求头示例
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

### 2.2 JWT令牌认证（规划中）

```typescript
// 请求头示例
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

---

## 3. 接口列表

### 3.1 PerformanceMonitor - 性能监控核心类

#### 3.1.1 类概述

`PerformanceMonitor` 是性能监控系统的核心类，负责性能指标的采集、存储、分析和告警。

#### 3.1.2 构造函数

```typescript
constructor(config?: Partial<MonitoringConfig>)
```

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| config | Partial\<MonitoringConfig\> | 否 | 监控配置对象 |

**MonitoringConfig 接口**

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| retentionPeriod | number | 86400000 (24小时) | 数据保留时间（毫秒） |
| maxMetrics | number | 10000 | 最大指标数量 |
| maxAlerts | number | 1000 | 最大告警数量 |
| enableAutoResolution | boolean | true | 是否启用自动解决告警 |
| checkInterval | number | 60000 (1分钟) | 检查间隔（毫秒） |
| enableAnomalyDetection | boolean | false | 是否启用异常检测 |
| anomalyDetectionConfig | Partial\<AnomalyDetectionConfig\> | undefined | 异常检测配置 |
| notificationChannels | NotificationChannels | - | 通知渠道配置 |

**示例代码**

```typescript
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';

const monitor = new PerformanceMonitor({
  retentionPeriod: 24 * 60 * 60 * 1000,
  maxMetrics: 10000,
  checkInterval: 30000,
  enableAnomalyDetection: true,
  notificationChannels: {
    email: {
      enabled: true,
      recipients: ['admin@example.com'],
      smtpConfig: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'user@example.com',
          pass: 'password'
        },
        from: 'monitoring@example.com'
      }
    },
    slack: {
      enabled: true,
      webhook: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
    }
  }
});
```

#### 3.1.3 方法列表

##### 3.1.3.1 initialize - 初始化监控

```typescript
async initialize(): Promise<void>
```

**功能说明**：初始化监控系统，启动定时检查任务，加载默认告警规则。

**返回值**：Promise\<void\>

**示例代码**

```typescript
await monitor.initialize();
```

##### 3.1.3.2 recordMetric - 记录性能指标

```typescript
recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): PerformanceMetric
```

**功能说明**：同步方式记录性能指标数据。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| metric | Omit\<PerformanceMetric, 'id' \| 'timestamp'\> | 是 | 性能指标数据 |

**PerformanceMetric 接口**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| metricType | 'cpu' \| 'memory' \| 'response_time' \| 'throughput' \| 'error_rate' \| 'custom' | 是 | 指标类型 |
| moduleName | string | 是 | 模块名称 |
| value | number | 是 | 指标值 |
| unit | string | 是 | 单位 |
| metadata | Record\<string, any\> | 否 | 元数据 |

**返回值**：PerformanceMetric - 完整的性能指标对象（包含自动生成的id和timestamp）

**示例代码**

```typescript
const metric = monitor.recordMetric({
  metricType: 'cpu',
  moduleName: 'web-server',
  value: 75.5,
  unit: '%',
  metadata: {
    hostname: 'server-01',
    region: 'us-east-1'
  }
});
```

##### 3.1.3.3 recordMetricAsync - 异步记录性能指标

```typescript
async recordMetricAsync(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<PerformanceMetric>
```

**功能说明**：异步方式记录性能指标数据。

**参数说明**：同 recordMetric

**返回值**：Promise\<PerformanceMetric\>

**示例代码**

```typescript
const metric = await monitor.recordMetricAsync({
  metricType: 'memory',
  moduleName: 'database',
  value: 85.2,
  unit: '%'
});
```

##### 3.1.3.4 getMetrics - 获取性能指标

```typescript
getMetrics(
  moduleName?: string,
  metricType?: PerformanceMetric['metricType'],
  startTime?: Date,
  endTime?: Date
): PerformanceMetric[]
```

**功能说明**：根据条件查询性能指标数据。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| moduleName | string | 否 | 模块名称（支持'*'通配符） |
| metricType | PerformanceMetric['metricType'] | 否 | 指标类型 |
| startTime | Date | 否 | 开始时间 |
| endTime | Date | 否 | 结束时间 |

**返回值**：PerformanceMetric[] - 性能指标数组，按时间倒序排列

**示例代码**

```typescript
const allMetrics = monitor.getMetrics();

const cpuMetrics = monitor.getMetrics(undefined, 'cpu');

const webServerMetrics = monitor.getMetrics('web-server');

const recentMetrics = monitor.getMetrics(
  undefined,
  undefined,
  new Date(Date.now() - 3600000),
  new Date()
);
```

##### 3.1.3.5 getMetricsByType - 按类型获取指标

```typescript
getMetricsByType(metricType: PerformanceMetric['metricType']): PerformanceMetric[]
```

**功能说明**：获取指定类型的所有性能指标。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| metricType | PerformanceMetric['metricType'] | 是 | 指标类型 |

**返回值**：PerformanceMetric[] - 性能指标数组

**示例代码**

```typescript
const cpuMetrics = monitor.getMetricsByType('cpu');
const memoryMetrics = monitor.getMetricsByType('memory');
```

##### 3.1.3.6 getMetricStats - 获取指标统计信息

```typescript
getMetricStats(
  moduleName: string,
  metricType: PerformanceMetric['metricType'],
  timeWindow?: number
): MetricStats
```

**功能说明**：获取指定模块和指标类型的统计信息。

**参数说明**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| moduleName | string | 是 | - | 模块名称 |
| metricType | PerformanceMetric['metricType'] | 是 | - | 指标类型 |
| timeWindow | number | 否 | 60000 (1分钟) | 时间窗口（毫秒） |

**返回值**：MetricStats - 统计信息对象

**MetricStats 接口**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| current | number | 当前值 |
| min | number | 最小值 |
| max | number | 最大值 |
| avg | number | 平均值 |
| count | number | 数据点数量 |
| trend | 'increasing' \| 'decreasing' \| 'stable' | 趋势 |

**示例代码**

```typescript
const stats = monitor.getMetricStats('web-server', 'cpu', 60000);
console.log(`当前CPU使用率: ${stats.current}%`);
console.log(`平均CPU使用率: ${stats.avg}%`);
console.log(`趋势: ${stats.trend}`);
```

##### 3.1.3.7 addAlertRule - 添加告警规则

```typescript
addAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule
```

**功能说明**：添加新的告警规则。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| rule | Omit\<AlertRule, 'id'\> | 是 | 告警规则（不包含id） |

**AlertRule 接口**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 规则名称 |
| description | string | 是 | 规则描述 |
| metricType | PerformanceMetric['metricType'] | 是 | 监控指标类型 |
| moduleName | string | 否 | 模块名称（不指定则监控所有模块） |
| condition | 'greater_than' \| 'less_than' \| 'equals' \| 'not_equals' \| 'percentage_change' | 是 | 条件类型 |
| threshold | number | 是 | 阈值 |
| duration | number | 是 | 持续时间（毫秒） |
| severity | 'info' \| 'warning' \| 'critical' | 是 | 严重程度 |
| enabled | boolean | 是 | 是否启用 |
| cooldown | number | 是 | 冷却时间（毫秒） |

**返回值**：AlertRule - 完整的告警规则对象（包含自动生成的id）

**示例代码**

```typescript
const rule = monitor.addAlertRule({
  name: '高CPU使用率告警',
  description: 'CPU使用率超过80%持续5分钟',
  metricType: 'cpu',
  moduleName: 'web-server',
  condition: 'greater_than',
  threshold: 80,
  duration: 300000,
  severity: 'warning',
  enabled: true,
  cooldown: 600000
});
```

##### 3.1.3.8 removeAlertRule - 删除告警规则

```typescript
removeAlertRule(ruleId: string): boolean
```

**功能说明**：删除指定的告警规则。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ruleId | string | 是 | 规则ID |

**返回值**：boolean - 是否删除成功

**示例代码**

```typescript
const success = monitor.removeAlertRule('rule-id');
```

##### 3.1.3.9 getAlertRules - 获取所有告警规则

```typescript
getAlertRules(): AlertRule[]
```

**功能说明**：获取所有告警规则列表。

**返回值**：AlertRule[] - 告警规则数组

**示例代码**

```typescript
const rules = monitor.getAlertRules();
rules.forEach(rule => {
  console.log(`${rule.name}: ${rule.enabled ? '启用' : '禁用'}`);
});
```

##### 3.1.3.10 getAlerts - 获取告警列表

```typescript
getAlerts(
  severity?: AlertRule['severity'],
  status?: Alert['status'],
  startTime?: Date,
  endTime?: Date
): Alert[]
```

**功能说明**：根据条件查询告警列表。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| severity | 'info' \| 'warning' \| 'critical' | 否 | 严重程度 |
| status | 'active' \| 'resolved' \| 'acknowledged' | 否 | 告警状态 |
| startTime | Date | 否 | 开始时间 |
| endTime | Date | 否 | 结束时间 |

**返回值**：Alert[] - 告警数组，按时间倒序排列

**示例代码**

```typescript
const allAlerts = monitor.getAlerts();

const activeAlerts = monitor.getAlerts(undefined, 'active');

const criticalAlerts = monitor.getAlerts('critical');

const recentAlerts = monitor.getAlerts(
  undefined,
  undefined,
  new Date(Date.now() - 3600000),
  new Date()
);
```

##### 3.1.3.11 getActiveAlerts - 获取活跃告警

```typescript
getActiveAlerts(): Alert[]
```

**功能说明**：获取所有活跃状态的告警。

**返回值**：Alert[] - 活跃告警数组

**示例代码**

```typescript
const activeAlerts = monitor.getActiveAlerts();
console.log(`当前活跃告警数: ${activeAlerts.length}`);
```

##### 3.1.3.12 getAlertHistory - 获取告警历史

```typescript
getAlertHistory(): Alert[]
```

**功能说明**：获取所有历史告警记录。

**返回值**：Alert[] - 告警历史数组

**示例代码**

```typescript
const history = monitor.getAlertHistory();
```

##### 3.1.3.13 acknowledgeAlert - 确认告警

```typescript
acknowledgeAlert(alertId: string): boolean
```

**功能说明**：确认指定的告警，将状态改为已确认。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| alertId | string | 是 | 告警ID |

**返回值**：boolean - 是否确认成功

**示例代码**

```typescript
const success = monitor.acknowledgeAlert('alert-id');
```

##### 3.1.3.14 resolveAlert - 解决告警

```typescript
resolveAlert(alertId: string): boolean
```

**功能说明**：解决指定的告警，将状态改为已解决。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| alertId | string | 是 | 告警ID |

**返回值**：boolean - 是否解决成功

**示例代码**

```typescript
const success = monitor.resolveAlert('alert-id');
```

##### 3.1.3.15 getNotifications - 获取通知记录

```typescript
getNotifications(): AlertNotification[]
```

**功能说明**：获取所有通知发送记录。

**返回值**：AlertNotification[] - 通知记录数组

**示例代码**

```typescript
const notifications = monitor.getNotifications();
```

##### 3.1.3.16 shutdown - 关闭监控

```typescript
async shutdown(): Promise<void>
```

**功能说明**：关闭监控系统，停止定时检查任务。

**返回值**：Promise\<void\>

**示例代码**

```typescript
await monitor.shutdown();
```

---

### 3.2 RealTimeAIDashboard - 实时AI仪表板

#### 3.2.1 类概述

`RealTimeAIDashboard` 提供实时AI监控仪表板功能，集成性能监控、KPI追踪、预测分析和智能告警。

#### 3.2.2 构造函数

```typescript
constructor(performanceMonitor?: PerformanceMonitor)
```

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| performanceMonitor | PerformanceMonitor | 否 | 性能监控实例（不提供则自动创建） |

**示例代码**

```typescript
import { RealTimeAIDashboard } from '@/analytics/RealTimeAIDashboard';
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';

const monitor = new PerformanceMonitor({ enableAnomalyDetection: true });
const dashboard = new RealTimeAIDashboard(monitor);
```

#### 3.2.3 方法列表

##### 3.2.3.1 createAIDashboard - 创建AI仪表板

```typescript
async createAIDashboard(): Promise<AIDashboard>
```

**功能说明**：创建完整的AI仪表板，包含KPI概览、实时监控、预测、告警和建议。

**返回值**：Promise\<AIDashboard\> - AI仪表板数据

**AIDashboard 接口**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| kpiOverview | KPIOverview | KPI概览 |
| realTimeMonitoring | RealTimeMonitoring | 实时监控 |
| predictions | PredictionWidgets | 预测组件 |
| intelligentAlerts | AlertDashboard | 智能告警 |
| optimizationSuggestions | SuggestionWidgets | 优化建议 |

**示例代码**

```typescript
const dashboard = await dashboard.createAIDashboard();
console.log('KPI概览:', dashboard.kpiOverview);
console.log('活跃告警:', dashboard.intelligentAlerts.activeAlerts);
```

##### 3.2.3.2 updateRealTimeMetrics - 更新实时指标

```typescript
async updateRealTimeMetrics(): Promise<void>
```

**功能说明**：更新实时指标数据。

**返回值**：Promise\<void\>

**示例代码**

```typescript
await dashboard.updateRealTimeMetrics();
```

##### 3.2.3.3 recordSystemMetric - 记录系统指标

```typescript
async recordSystemMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<void>
```

**功能说明**：记录系统性能指标。

**参数说明**：同 PerformanceMonitor.recordMetric

**返回值**：Promise\<void\>

**示例代码**

```typescript
await dashboard.recordSystemMetric({
  metricType: 'cpu',
  moduleName: 'system',
  value: 75.5,
  unit: '%'
});
```

##### 3.2.3.4 getActiveAlerts - 获取活跃告警

```typescript
async getActiveAlerts(): Promise<Alert[]>
```

**功能说明**：获取所有活跃告警。

**返回值**：Promise\<Alert[]\>

**示例代码**

```typescript
const activeAlerts = await dashboard.getActiveAlerts();
```

##### 3.2.3.5 acknowledgeAlert - 确认告警

```typescript
async acknowledgeAlert(alertId: string): Promise<void>
```

**功能说明**：确认指定的告警。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| alertId | string | 是 | 告警ID |

**返回值**：Promise\<void\>

**示例代码**

```typescript
await dashboard.acknowledgeAlert('alert-id');
```

##### 3.2.3.6 resolveAlert - 解决告警

```typescript
async resolveAlert(alertId: string): Promise<void>
```

**功能说明**：解决指定的告警。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| alertId | string | 是 | 告警ID |

**返回值**：Promise\<void\>

**示例代码**

```typescript
await dashboard.resolveAlert('alert-id');
```

##### 3.2.3.7 addAlertRule - 添加告警规则

```typescript
async addAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule>
```

**功能说明**：添加新的告警规则。

**参数说明**：同 PerformanceMonitor.addAlertRule

**返回值**：Promise\<AlertRule\>

**示例代码**

```typescript
const rule = await dashboard.addAlertRule({
  name: '高内存使用率',
  description: '内存使用率超过90%',
  metricType: 'memory',
  condition: 'greater_than',
  threshold: 90,
  duration: 300000,
  severity: 'critical',
  enabled: true,
  cooldown: 600000
});
```

##### 3.2.3.8 removeAlertRule - 删除告警规则

```typescript
async removeAlertRule(ruleId: string): Promise<void>
```

**功能说明**：删除指定的告警规则。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ruleId | string | 是 | 规则ID |

**返回值**：Promise\<void\>

**示例代码**

```typescript
await dashboard.removeAlertRule('rule-id');
```

##### 3.2.3.9 getMetricsByType - 按类型获取指标

```typescript
async getMetricsByType(metricType: PerformanceMetric['metricType']): Promise<PerformanceMetric[]>
```

**功能说明**：获取指定类型的所有性能指标。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| metricType | PerformanceMetric['metricType'] | 是 | 指标类型 |

**返回值**：Promise\<PerformanceMetric[]\>

**示例代码**

```typescript
const cpuMetrics = await dashboard.getMetricsByType('cpu');
```

##### 3.2.3.10 getMetricStats - 获取指标统计信息

```typescript
async getMetricStats(moduleName: string, metricType: PerformanceMetric['metricType']): Promise<any>
```

**功能说明**：获取指定模块和指标类型的统计信息。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| moduleName | string | 是 | 模块名称 |
| metricType | PerformanceMetric['metricType'] | 是 | 指标类型 |

**返回值**：Promise\<any\> - 统计信息对象

**示例代码**

```typescript
const stats = await dashboard.getMetricStats('web-server', 'cpu');
```

##### 3.2.3.11 getSystemHealth - 获取系统健康状态

```typescript
async getSystemHealth(): Promise<SystemHealthStatus>
```

**功能说明**：获取系统健康状态概览。

**返回值**：Promise\<SystemHealthStatus\> - 系统健康状态

**SystemHealthStatus 接口**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| cpu | number | CPU使用率 |
| memory | number | 内存使用率 |
| activeAlerts | number | 活跃告警数 |
| criticalAlerts | number | 严重告警数 |
| lastUpdated | Date | 最后更新时间 |

**示例代码**

```typescript
const health = await dashboard.getSystemHealth();
console.log(`CPU: ${health.cpu}%, 内存: ${health.memory}%`);
console.log(`活跃告警: ${health.activeAlerts}, 严重告警: ${health.criticalAlerts}`);
```

##### 3.2.3.12 startRealTimeUpdates - 启动实时更新

```typescript
async startRealTimeUpdates(intervalMs?: number): Promise<void>
```

**功能说明**：启动实时数据更新，定期刷新仪表板数据。

**参数说明**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| intervalMs | number | 否 | 5000 | 更新间隔（毫秒） |

**返回值**：Promise\<void\>

**示例代码**

```typescript
await dashboard.startRealTimeUpdates(5000);
```

##### 3.2.3.13 stopRealTimeUpdates - 停止实时更新

```typescript
stopRealTimeUpdates(): void
```

**功能说明**：停止实时数据更新。

**返回值**：void

**示例代码**

```typescript
dashboard.stopRealTimeUpdates();
```

##### 3.2.3.14 subscribe - 订阅事件

```typescript
subscribe(eventType: string, callback: (data: any) => void): () => void
```

**功能说明**：订阅指定类型的事件更新。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| eventType | string | 是 | 事件类型（'dashboard', 'health', 'alerts'） |
| callback | (data: any) => void | 是 | 回调函数 |

**返回值**：() => void - 取消订阅函数

**示例代码**

```typescript
const unsubscribe = dashboard.subscribe('dashboard', (data) => {
  console.log('仪表板数据更新:', data);
});

// 取消订阅
unsubscribe();
```

##### 3.2.3.15 getRealTimeMetricsHistory - 获取历史指标数据

```typescript
async getRealTimeMetricsHistory(metricType: string, limit?: number): Promise<any[]>
```

**功能说明**：获取指定类型的历史指标数据。

**参数说明**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| metricType | string | 是 | - | 指标类型 |
| limit | number | 否 | 1000 | 返回数量限制 |

**返回值**：Promise\<any[]\> - 历史指标数据数组

**示例代码**

```typescript
const history = await dashboard.getRealTimeMetricsHistory('cpu', 100);
```

##### 3.2.3.16 getEnhancedAlertDashboard - 获取增强告警仪表板

```typescript
async getEnhancedAlertDashboard(): Promise<EnhancedAlertDashboard>
```

**功能说明**：获取增强的告警仪表板，包含告警趋势、相关告警和建议操作。

**返回值**：Promise\<EnhancedAlertDashboard\> - 增强告警仪表板数据

**EnhancedAlertDashboard 接口**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| activeAlerts | EnhancedAlert[] | 增强的活跃告警列表 |
| alertHistory | Alert[] | 告警历史 |
| alertTrends | AlertTrend[] | 告警趋势 |
| systemHealth | SystemHealthStatus | 系统健康状态 |
| summary | AlertSummary | 告警摘要 |
| recommendations | AlertRecommendation[] | 推荐操作 |

**示例代码**

```typescript
const enhanced = await dashboard.getEnhancedAlertDashboard();
console.log('告警摘要:', enhanced.summary);
console.log('推荐操作:', enhanced.recommendations);
```

##### 3.2.3.17 getRealTimePerformanceMetrics - 获取实时性能指标

```typescript
async getRealTimePerformanceMetrics(): Promise<RealTimePerformanceMetrics>
```

**功能说明**：获取完整的实时性能指标数据。

**返回值**：Promise\<RealTimePerformanceMetrics\> - 实时性能指标

**RealTimePerformanceMetrics 接口**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| timestamp | Date | 时间戳 |
| cpu | MetricData | CPU指标 |
| memory | MetricData | 内存指标 |
| responseTime | MetricData | 响应时间指标 |
| throughput | MetricData | 吞吐量指标 |
| health | SystemHealthStatus | 系统健康状态 |

**MetricData 接口**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| current | number | 当前值 |
| min | number | 最小值 |
| max | number | 最大值 |
| avg | number | 平均值 |
| trend | 'increasing' \| 'decreasing' \| 'stable' | 趋势 |
| unit | string | 单位 |

**示例代码**

```typescript
const metrics = await dashboard.getRealTimePerformanceMetrics();
console.log('CPU:', metrics.cpu);
console.log('内存:', metrics.memory);
```
| criticalAlerts | number | 严重告警数 |
| lastUpdated | Date | 最后更新时间 |

**示例代码**

```typescript
const health = await dashboard.getSystemHealth();
console.log(`CPU: ${health.cpu}%, 内存: ${health.memory}%`);
console.log(`活跃告警: ${health.activeAlerts}, 严重告警: ${health.criticalAlerts}`);
```

##### 3.2.3.12 getAnomalyReport - 获取异常报告

```typescript
async getAnomalyReport(): Promise<any>
```

**功能说明**：获取异常检测报告。

**返回值**：Promise\<any\> - 异常报告对象

**示例代码**

```typescript
const report = await dashboard.getAnomalyReport();
console.log('异常数量:', report.anomalies.length);
console.log('严重程度:', report.severity);
console.log('影响:', report.impact);
```

---

### 3.3 AnomalyDetection - 异常检测引擎

#### 3.3.1 类概述

`AnomalyDetection` 提供智能异常检测功能，支持多种异常检测算法，包括Z-score、IQR和趋势分析。

#### 3.3.2 构造函数

```typescript
constructor(config?: Partial<AnomalyDetectionConfig>)
```

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| config | Partial\<AnomalyDetectionConfig\> | 否 | 异常检测配置 |

**AnomalyDetectionConfig 接口**

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| zScoreThreshold | number | 3 | Z-score阈值 |
| iqrMultiplier | number | 1.5 | IQR乘数 |
| minDataPoints | number | 30 | 最小数据点数 |
| windowSize | number | 100 | 窗口大小 |

**示例代码**

```typescript
import { AnomalyDetection } from '@/analytics/AnomalyDetection';

const anomalyDetection = new AnomalyDetection({
  zScoreThreshold: 3,
  iqrMultiplier: 1.5,
  minDataPoints: 30,
  windowSize: 100
});
```

#### 3.3.3 方法列表

##### 3.3.3.1 monitorBusinessOperations - 监控业务运营

```typescript
async monitorBusinessOperations(): Promise<AnomalyMonitoring>
```

**功能说明**：获取业务运营监控配置信息。

**返回值**：Promise\<AnomalyMonitoring\> - 监控配置

**AnomalyMonitoring 接口**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| monitoring | MonitoringConfig | 监控配置 |
| detection | DetectionConfig | 检测配置 |
| response | ResponseConfig | 响应配置 |

**示例代码**

```typescript
const monitoring = await anomalyDetection.monitorBusinessOperations();
console.log('实时监控:', monitoring.monitoring.realTime);
console.log('统计异常检测:', monitoring.detection.statisticalOutliers);
```

##### 3.3.3.2 detectOperationalAnomalies - 检测运营异常

```typescript
async detectOperationalAnomalies(metrics: any[]): Promise<AnomalyReport>
```

**功能说明**：检测运营数据中的异常。

**参数说明**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| metrics | any[] | 是 | 性能指标数组 |

**返回值**：Promise\<AnomalyReport\> - 异常报告

**AnomalyReport 接口**

| 字段名 | 类型 | 说明 |
|--------|------|------|
| timestamp | Date | 检测时间 |
| anomalies | AnomalyData[] | 异常数据数组 |
| severity | string | 整体严重程度 |
| impact | string | 整体影响 |
| recommendations | string[] | 建议措施 |
| escalation | any | 升级路径 |

**示例代码**

```typescript
const metrics = [
  { moduleName: 'web-server', metricType: 'cpu', value: 95.5 },
  { moduleName: 'database', metricType: 'memory', value: 88.2 }
];

const report = await anomalyDetection.detectOperationalAnomalies(metrics);
console.log('检测到异常:', report.anomalies.length);
console.log('严重程度:', report.severity);
console.log('建议措施:', report.recommendations);
```

---

## 4. 错误码说明

### 4.1 错误码列表

| 错误码 | 说明 | HTTP状态码 | 处理建议 |
|--------|------|------------|----------|
| 400 | 请求参数错误 | 400 | 检查请求参数格式和类型 |
| 401 | 未授权 | 401 | 检查认证信息 |
| 403 | 禁止访问 | 403 | 检查权限设置 |
| 404 | 资源不存在 | 404 | 检查资源ID或路径 |
| 500 | 服务器内部错误 | 500 | 联系系统管理员 |
| 503 | 服务不可用 | 503 | 稍后重试或检查服务状态 |

### 4.2 错误响应格式

```typescript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息",
    "details": {
      "field": "具体字段错误信息"
    },
    "timestamp": "2026-01-08T10:30:00Z"
  }
}
```

### 4.3 常见错误处理

#### 4.3.1 参数验证错误

```typescript
try {
  const metric = monitor.recordMetric({
    metricType: 'cpu',
    moduleName: 'web-server',
    value: 'invalid', // 错误：应该是number类型
    unit: '%'
  });
} catch (error) {
  console.error('参数错误:', error.message);
}
```

#### 4.3.2 资源不存在错误

```typescript
const success = monitor.removeAlertRule('non-existent-rule-id');
if (!success) {
  console.error('告警规则不存在');
}
```

#### 4.3.3 配置错误

```typescript
try {
  const monitor = new PerformanceMonitor({
    checkInterval: -1000 // 错误：应该是正数
  });
} catch (error) {
  console.error('配置错误:', error.message);
}
```

---

## 5. 示例代码

### 5.1 完整的监控系统集成示例

```typescript
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';
import { RealTimeAIDashboard } from '@/analytics/RealTimeAIDashboard';

class MonitoringSystem {
  private monitor: PerformanceMonitor;
  private dashboard: RealTimeAIDashboard;

  constructor() {
    this.monitor = new PerformanceMonitor({
      retentionPeriod: 24 * 60 * 60 * 1000,
      maxMetrics: 10000,
      maxAlerts: 1000,
      enableAutoResolution: true,
      checkInterval: 30000,
      enableAnomalyDetection: true,
      notificationChannels: {
        email: {
          enabled: true,
          recipients: ['admin@example.com'],
          smtpConfig: {
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER || 'user@example.com',
              pass: process.env.SMTP_PASSWORD || 'password'
            },
            from: 'monitoring@example.com'
          }
        },
        slack: {
          enabled: true,
          webhook: process.env.SLACK_WEBHOOK || 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        }
      }
    });

    this.dashboard = new RealTimeAIDashboard(this.monitor);
  }

  async initialize(): Promise<void> {
    await this.monitor.initialize();
    await this.dashboard.startRealTimeUpdates(5000);

    this.setupAlertRules();
    this.setupSubscriptions();
  }

  private setupAlertRules(): void {
    this.monitor.addAlertRule({
      name: '高CPU使用率',
      description: 'CPU使用率超过80%持续5分钟',
      metricType: 'cpu',
      condition: 'greater_than',
      threshold: 80,
      duration: 5 * 60 * 1000,
      severity: 'warning',
      enabled: true,
      cooldown: 10 * 60 * 1000
    });

    this.monitor.addAlertRule({
      name: '内存使用率过高',
      description: '内存使用率超过90%持续5分钟',
      metricType: 'memory',
      condition: 'greater_than',
      threshold: 90,
      duration: 5 * 60 * 1000,
      severity: 'critical',
      enabled: true,
      cooldown: 10 * 60 * 1000
    });

    this.monitor.addAlertRule({
      name: '响应时间过长',
      description: '响应时间超过500ms持续3分钟',
      metricType: 'response_time',
      condition: 'greater_than',
      threshold: 500,
      duration: 3 * 60 * 1000,
      severity: 'warning',
      enabled: true,
      cooldown: 5 * 60 * 1000
    });
  }

  private setupSubscriptions(): void {
    this.dashboard.subscribe('alerts', async (alerts) => {
      if (alerts.length > 0) {
        console.log(`收到 ${alerts.length} 个新告警`);
        
        const criticalAlerts = alerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length > 0) {
          await this.handleCriticalAlerts(criticalAlerts);
        }
      }
    });

    this.dashboard.subscribe('health', (health) => {
      console.log('系统健康状态更新:', health);
      
      if (health.criticalAlerts > 0) {
        console.warn(`系统存在 ${health.criticalAlerts} 个严重告警`);
      }
    });
  }

  private async handleCriticalAlerts(alerts: any[]): Promise<void> {
    console.error('处理严重告警:', alerts);
    
    for (const alert of alerts) {
      await this.dashboard.acknowledgeAlert(alert.id);
      console.log(`已确认告警: ${alert.id}`);
    }
  }

  async recordMetrics(): Promise<void> {
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = await this.getMemoryUsage();
    const responseTime = await this.getResponseTime();

    this.monitor.recordMetric({
      metricType: 'cpu',
      moduleName: 'application',
      value: cpuUsage,
      unit: '%'
    });

    this.monitor.recordMetric({
      metricType: 'memory',
      moduleName: 'application',
      value: memoryUsage,
      unit: '%'
    });

    this.monitor.recordMetric({
      metricType: 'response_time',
      moduleName: 'api',
      value: responseTime,
      unit: 'ms'
    });
  }

  private async getCPUUsage(): Promise<number> {
    return Math.random() * 100;
  }

  private async getMemoryUsage(): Promise<number> {
    return Math.random() * 100;
  }

  private async getResponseTime(): Promise<number> {
    return Math.random() * 1000;
  }

  async shutdown(): Promise<void> {
    this.dashboard.stopRealTimeUpdates();
    await this.monitor.shutdown();
  }
}

// 使用示例
const monitoringSystem = new MonitoringSystem();
await monitoringSystem.initialize();

// 定期记录指标
setInterval(() => {
  monitoringSystem.recordMetrics();
}, 10000);
```

### 5.2 实时监控仪表板示例

```typescript
import { RealTimeAIDashboard } from '@/analytics/RealTimeAIDashboard';

class MonitoringDashboard {
  private dashboard: RealTimeAIDashboard;
  private updateInterval?: NodeJS.Timeout;

  constructor(dashboard: RealTimeAIDashboard) {
    this.dashboard = dashboard;
  }

  async start(): Promise<void> {
    await this.dashboard.startRealTimeUpdates(5000);
    this.setupSubscriptions();
    this.startPeriodicUpdates();
  }

  private setupSubscriptions(): void {
    this.dashboard.subscribe('dashboard', (data) => {
      this.updateDashboardUI(data);
    });

    this.dashboard.subscribe('health', (health) => {
      this.updateHealthUI(health);
    });

    this.dashboard.subscribe('alerts', (alerts) => {
      this.updateAlertsUI(alerts);
    });
  }

  private updateDashboardUI(data: any): void {
    console.log('更新仪表板UI:', data);
  }

  private updateHealthUI(health: any): void {
    console.log('更新健康状态UI:', health);
  }

  private updateAlertsUI(alerts: any[]): void {
    console.log('更新告警UI:', alerts);
  }

  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(async () => {
      const metrics = await this.dashboard.getRealTimePerformanceMetrics();
      this.displayMetrics(metrics);
    }, 5000);
  }

  private displayMetrics(metrics: any): void {
    console.log('=== 实时性能指标 ===');
    console.log(`CPU: ${metrics.cpu.current}% (${metrics.cpu.trend})`);
    console.log(`内存: ${metrics.memory.current}% (${metrics.memory.trend})`);
    console.log(`响应时间: ${metrics.responseTime.current}ms (${metrics.responseTime.trend})`);
    console.log(`吞吐量: ${metrics.throughput.current} req/s (${metrics.throughput.trend})`);
    console.log('===================');
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.dashboard.stopRealTimeUpdates();
  }
}

// 使用示例
const monitor = new PerformanceMonitor({ enableAnomalyDetection: true });
const dashboard = new RealTimeAIDashboard(monitor);
const ui = new MonitoringDashboard(dashboard);

await ui.start();
```

### 5.3 告警管理示例

```typescript
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';

class AlertManager {
  private monitor: PerformanceMonitor;

  constructor(monitor: PerformanceMonitor) {
    this.monitor = monitor;
  }

  async setupAlerts(): Promise<void> {
    this.setupCPUAlerts();
    this.setupMemoryAlerts();
    this.setupResponseTimeAlerts();
    this.setupErrorRateAlerts();
  }

  private setupCPUAlerts(): void {
    this.monitor.addAlertRule({
      name: 'CPU使用率警告',
      description: 'CPU使用率超过70%持续5分钟',
      metricType: 'cpu',
      condition: 'greater_than',
      threshold: 70,
      duration: 5 * 60 * 1000,
      severity: 'warning',
      enabled: true,
      cooldown: 10 * 60 * 1000
    });

    this.monitor.addAlertRule({
      name: 'CPU使用率严重',
      description: 'CPU使用率超过90%持续3分钟',
      metricType: 'cpu',
      condition: 'greater_than',
      threshold: 90,
      duration: 3 * 60 * 1000,
      severity: 'critical',
      enabled: true,
      cooldown: 5 * 60 * 1000
    });
  }

  private setupMemoryAlerts(): void {
    this.monitor.addAlertRule({
      name: '内存使用率警告',
      description: '内存使用率超过75%持续10分钟',
      metricType: 'memory',
      condition: 'greater_than',
      threshold: 75,
      duration: 10 * 60 * 1000,
      severity: 'warning',
      enabled: true,
      cooldown: 15 * 60 * 1000
    });

    this.monitor.addAlertRule({
      name: '内存使用率严重',
      description: '内存使用率超过90%持续5分钟',
      metricType: 'memory',
      condition: 'greater_than',
      threshold: 90,
      duration: 5 * 60 * 1000,
      severity: 'critical',
      enabled: true,
      cooldown: 10 * 60 * 1000
    });
  }

  private setupResponseTimeAlerts(): void {
    this.monitor.addAlertRule({
      name: '响应时间警告',
      description: '响应时间超过300ms持续5分钟',
      metricType: 'response_time',
      condition: 'greater_than',
      threshold: 300,
      duration: 5 * 60 * 1000,
      severity: 'warning',
      enabled: true,
      cooldown: 10 * 60 * 1000
    });

    this.monitor.addAlertRule({
      name: '响应时间严重',
      description: '响应时间超过1000ms持续3分钟',
      metricType: 'response_time',
      condition: 'greater_than',
      threshold: 1000,
      duration: 3 * 60 * 1000,
      severity: 'critical',
      enabled: true,
      cooldown: 5 * 60 * 1000
    });
  }

  private setupErrorRateAlerts(): void {
    this.monitor.addAlertRule({
      name: '错误率警告',
      description: '错误率超过1%持续5分钟',
      metricType: 'error_rate',
      condition: 'greater_than',
      threshold: 1,
      duration: 5 * 60 * 1000,
      severity: 'warning',
      enabled: true,
      cooldown: 10 * 60 * 1000
    });

    this.monitor.addAlertRule({
      name: '错误率严重',
      description: '错误率超过5%持续3分钟',
      metricType: 'error_rate',
      condition: 'greater_than',
      threshold: 5,
      duration: 3 * 60 * 1000,
      severity: 'critical',
      enabled: true,
      cooldown: 5 * 60 * 1000
    });
  }

  async getAlertSummary(): Promise<any> {
    const activeAlerts = this.monitor.getActiveAlerts();
    const alertHistory = this.monitor.getAlertHistory();

    return {
      active: {
        total: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        warning: activeAlerts.filter(a => a.severity === 'warning').length,
        info: activeAlerts.filter(a => a.severity === 'info').length
      },
      history: {
        total: alertHistory.length,
        last24h: alertHistory.filter(a => 
          Date.now() - a.triggeredAt.getTime() < 24 * 60 * 60 * 1000
        ).length
      }
    };
  }
}

// 使用示例
const monitor = new PerformanceMonitor({ enableAnomalyDetection: true });
await monitor.initialize();

const alertManager = new AlertManager(monitor);
await alertManager.setupAlerts();

const summary = await alertManager.getAlertSummary();
console.log('告警摘要:', summary);
```

### 5.4 性能趋势分析示例

```typescript
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';

class PerformanceAnalyzer {
  private monitor: PerformanceMonitor;

  constructor(monitor: PerformanceMonitor) {
    this.monitor = monitor;
  }

  analyzeCPU(hour: number = 1): any {
    const stats = this.monitor.getMetricStats('*', 'cpu', hour * 60 * 60 * 1000);
    const metrics = this.monitor.getMetricsByType('cpu');

    return {
      current: stats.current,
      average: stats.avg,
      minimum: stats.min,
      maximum: stats.max,
      trend: stats.trend,
      dataPoints: stats.count,
      hourlyBreakdown: this.getHourlyBreakdown(metrics)
    };
  }

  analyzeMemory(hour: number = 1): any {
    const stats = this.monitor.getMetricStats('*', 'memory', hour * 60 * 60 * 1000);
    const metrics = this.monitor.getMetricsByType('memory');

    return {
      current: stats.current,
      average: stats.avg,
      minimum: stats.min,
      maximum: stats.max,
      trend: stats.trend,
      dataPoints: stats.count,
      hourlyBreakdown: this.getHourlyBreakdown(metrics)
    };
  }

  analyzeResponseTime(hour: number = 1): any {
    const stats = this.monitor.getMetricStats('*', 'response_time', hour * 60 * 60 * 1000);
    const metrics = this.monitor.getMetricsByType('response_time');

    return {
      current: stats.current,
      average: stats.avg,
      minimum: stats.min,
      maximum: stats.max,
      trend: stats.trend,
      dataPoints: stats.count,
      hourlyBreakdown: this.getHourlyBreakdown(metrics)
    };
  }

  private getHourlyBreakdown(metrics: any[]): any[] {
    const hourlyData = new Map<number, number[]>();

    metrics.forEach(metric => {
      const hour = metric.timestamp.getHours();
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(metric.value);
    });

    return Array.from(hourlyData.entries()).map(([hour, values]) => ({
      hour,
      average: values.reduce((sum, v) => sum + v, 0) / values.length,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      count: values.length
    }));
  }

  generateReport(): any {
    return {
      cpu: this.analyzeCPU(24),
      memory: this.analyzeMemory(24),
      responseTime: this.analyzeResponseTime(24),
      alerts: {
        active: this.monitor.getActiveAlerts().length,
        critical: this.monitor.getAlerts('critical').length,
        warning: this.monitor.getAlerts('warning').length
      },
      generatedAt: new Date()
    };
  }
}

// 使用示例
const monitor = new PerformanceMonitor({ enableAnomalyDetection: true });
await monitor.initialize();

const analyzer = new PerformanceAnalyzer(monitor);
const report = analyzer.generateReport();
console.log('性能分析报告:', JSON.stringify(report, null, 2));
```

### 5.1 完整示例：性能监控系统初始化和使用

```typescript
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';
import { RealTimeAIDashboard } from '@/analytics/RealTimeAIDashboard';

async function initializeMonitoringSystem() {
  const monitor = new PerformanceMonitor({
    retentionPeriod: 24 * 60 * 60 * 1000,
    maxMetrics: 10000,
    checkInterval: 30000,
    enableAnomalyDetection: true,
    notificationChannels: {
      email: {
        enabled: true,
        recipients: ['admin@example.com'],
        smtpConfig: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: {
            user: 'monitoring@example.com',
            pass: 'password'
          },
          from: 'monitoring@example.com'
        }
      },
      slack: {
        enabled: true,
        webhook: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
      }
    }
  });

  await monitor.initialize();

  const dashboard = new RealTimeAIDashboard(monitor);

  return { monitor, dashboard };
}

async function main() {
  const { monitor, dashboard } = await initializeMonitoringSystem();

  setInterval(async () => {
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;

    await monitor.recordMetricAsync({
      metricType: 'cpu',
      moduleName: 'web-server',
      value: cpuUsage,
      unit: '%'
    });

    await monitor.recordMetricAsync({
      metricType: 'memory',
      moduleName: 'database',
      value: memoryUsage,
      unit: '%'
    });

    const health = await dashboard.getSystemHealth();
    console.log('系统健康状态:', health);

    const activeAlerts = await dashboard.getActiveAlerts();
    if (activeAlerts.length > 0) {
      console.log('活跃告警:', activeAlerts);
    }
  }, 5000);
}

main().catch(console.error);
```

### 5.2 示例：自定义告警规则

```typescript
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor';

const monitor = new PerformanceMonitor();

await monitor.initialize();

monitor.addAlertRule({
  name: '响应时间过长',
  description: 'API响应时间超过3秒',
  metricType: 'response_time',
  moduleName: 'api-gateway',
  condition: 'greater_than',
  threshold: 3000,
  duration: 60000,
  severity: 'warning',
  enabled: true,
  cooldown: 300000
});

monitor.addAlertRule({
  name: '错误率过高',
  description: '错误率超过10%',
  metricType: 'error_rate',
  condition: 'greater_than',
  threshold: 10,
  duration: 300000,
  severity: 'critical',
  enabled: true,
  cooldown: 600000
});

monitor.addAlertRule({
  name: '吞吐量下降',
  description: '吞吐量下降超过50%',
  metricType: 'throughput',
  condition: 'percentage_change',
  threshold: 50,
  duration: 300000,
  severity: 'warning',
  enabled: true,
  cooldown: 600000
});
```

### 5.3 示例：异常检测

```typescript
import { AnomalyDetection } from '@/analytics/AnomalyDetection';

const anomalyDetection = new AnomalyDetection({
  zScoreThreshold: 3,
  iqrMultiplier: 1.5,
  minDataPoints: 30,
  windowSize: 100
});

async function detectAnomalies() {
  const metrics = [];
  
  for (let i = 0; i < 50; i++) {
    metrics.push({
      moduleName: 'web-server',
      metricType: 'cpu',
      value: 50 + Math.random() * 20
    });
  }
  
  metrics.push({
    moduleName: 'web-server',
    metricType: 'cpu',
    value: 95
  });

  const report = await anomalyDetection.detectOperationalAnomalies(metrics);
  
  console.log('异常报告:');
  console.log('- 异常数量:', report.anomalies.length);
  console.log('- 严重程度:', report.severity);
  console.log('- 影响:', report.impact);
  console.log('- 建议措施:', report.recommendations);
  
  if (report.anomalies.length > 0) {
    console.log('\n异常详情:');
    report.anomalies.forEach(anomaly => {
      console.log(`- ${anomaly.type}: ${anomaly.description}`);
      console.log(`  严重程度: ${anomaly.severity}`);
      console.log(`  影响: ${anomaly.impact}`);
    });
  }
}

detectAnomalies().catch(console.error);
```

### 5.4 示例：实时监控仪表板

```typescript
import { RealTimeAIDashboard } from '@/analytics/RealTimeAIDashboard';

const dashboard = new RealTimeAIDashboard();

async function updateDashboard() {
  const aiDashboard = await dashboard.createAIDashboard();
  
  console.log('=== AI仪表板 ===');
  console.log('\nKPI概览:');
  console.log('- 收入:', aiDashboard.kpiOverview.revenue);
  console.log('- 转化率:', aiDashboard.kpiOverview.conversion);
  console.log('- 客户满意度:', aiDashboard.kpiOverview.customerSatisfaction);
  console.log('- 运营效率:', aiDashboard.kpiOverview.operationalEfficiency);
  
  console.log('\n实时监控:');
  console.log('- 活跃指标:', aiDashboard.realTimeMonitoring.liveMetrics);
  console.log('- 系统健康:', aiDashboard.realTimeMonitoring.systemHealth);
  
  console.log('\n预测:');
  console.log('- 需求预测:', aiDashboard.predictions.demandForecast);
  console.log('- 流失预测:', aiDashboard.predictions.churnPrediction);
  console.log('- 收入预测:', aiDashboard.predictions.revenueForecast);
  
  console.log('\n智能告警:');
  console.log('- 活跃告警数:', aiDashboard.intelligentAlerts.activeAlerts.length);
  aiDashboard.intelligentAlerts.activeAlerts.forEach(alert => {
    console.log(`  - [${alert.severity}] ${alert.message}`);
  });
  
  console.log('\n优化建议:');
  console.log('- 效率建议:', aiDashboard.optimizationSuggestions.efficiencySuggestions);
  console.log('- 质量建议:', aiDashboard.optimizationSuggestions.qualitySuggestions);
  console.log('- 客户体验建议:', aiDashboard.optimizationSuggestions.customerExperienceSuggestions);
}

setInterval(updateDashboard, 30000);
```

---

## 6. 最佳实践

### 6.1 性能优化建议

#### 6.1.1 合理设置检查间隔

```typescript
const monitor = new PerformanceMonitor({
  checkInterval: 30000 // 30秒检查一次，平衡实时性和性能
});
```

#### 6.1.2 控制数据保留量

```typescript
const monitor = new PerformanceMonitor({
  retentionPeriod: 24 * 60 * 60 * 1000, // 保留24小时数据
  maxMetrics: 10000, // 最多保留10000条指标
  maxAlerts: 1000 // 最多保留1000条告警
});
```

#### 6.1.3 使用异步方法

```typescript
await monitor.recordMetricAsync(metric); // 使用异步方法，避免阻塞
```

### 6.2 告警规则设计

#### 6.2.1 设置合理的冷却时间

```typescript
monitor.addAlertRule({
  name: '高CPU使用率',
  condition: 'greater_than',
  threshold: 80,
  duration: 300000, // 持续5分钟
  cooldown: 600000 // 冷却10分钟，避免频繁告警
});
```

#### 6.2.2 分级设置严重程度

```typescript
monitor.addAlertRule({
  name: 'CPU使用率警告',
  threshold: 80,
  severity: 'warning' // 警告级别
});

monitor.addAlertRule({
  name: 'CPU使用率严重',
  threshold: 95,
  severity: 'critical' // 严重级别
});
```

#### 6.2.3 使用百分比变化检测

```typescript
monitor.addAlertRule({
  name: '吞吐量异常',
  condition: 'percentage_change',
  threshold: 50, // 变化超过50%
  severity: 'warning'
});
```

### 6.3 异常检测配置

#### 6.3.1 调整Z-score阈值

```typescript
const anomalyDetection = new AnomalyDetection({
  zScoreThreshold: 3, // 标准阈值
  minDataPoints: 30, // 至少30个数据点
  windowSize: 100 // 窗口大小100
});
```

#### 6.3.2 组合多种检测算法

```typescript
const anomalyDetection = new AnomalyDetection({
  zScoreThreshold: 3, // Z-score检测
  iqrMultiplier: 1.5 // IQR检测
});
```

### 6.4 监控数据管理

#### 6.4.1 定期清理历史数据

```typescript
async function cleanupOldData() {
  const now = Date.now();
  const retentionPeriod = 24 * 60 * 60 * 1000; // 24小时
  
  const metrics = monitor.getMetrics();
  const oldMetrics = metrics.filter(m => 
    now - m.timestamp.getTime() > retentionPeriod
  );
  
  console.log(`清理 ${oldMetrics.length} 条历史数据`);
}
```

#### 6.4.2 导出监控数据

```typescript
async function exportMetrics(startTime: Date, endTime: Date) {
  const metrics = monitor.getMetrics(undefined, undefined, startTime, endTime);
  
  const csv = metrics.map(m => 
    `${m.timestamp},${m.moduleName},${m.metricType},${m.value},${m.unit}`
  ).join('\n');
  
  return csv;
}
```

### 6.5 错误处理和日志记录

#### 6.5.1 完善的错误处理

```typescript
try {
  await monitor.recordMetricAsync(metric);
} catch (error) {
  console.error('记录指标失败:', error);
  
  if (error instanceof ValidationError) {
    console.error('验证错误:', error.details);
  } else if (error instanceof ConfigurationError) {
    console.error('配置错误:', error.message);
  } else {
    console.error('未知错误:', error);
  }
}
```

#### 6.5.2 结构化日志记录

```typescript
function logMetric(metric: PerformanceMetric) {
  console.log(JSON.stringify({
    timestamp: metric.timestamp,
    level: 'info',
    event: 'metric_recorded',
    data: {
      module: metric.moduleName,
      type: metric.metricType,
      value: metric.value,
      unit: metric.unit
    }
  }));
}
```

### 6.6 安全建议

#### 6.6.1 敏感信息保护

```typescript
const monitor = new PerformanceMonitor({
  notificationChannels: {
    email: {
      smtpConfig: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD // 从环境变量读取
        }
      }
    }
  }
});
```

#### 6.6.2 访问控制

```typescript
function checkPermission(user: User, action: string): boolean {
  const permissions = {
    admin: ['read', 'write', 'delete'],
    operator: ['read', 'write'],
    viewer: ['read']
  };
  
  return permissions[user.role]?.includes(action) || false;
}

if (!checkPermission(currentUser, 'delete')) {
  throw new Error('权限不足');
}
```

---

## 附录

### A. 相关文档

- [18-YYC3-MovAISys-性能监控系统.md](./18-YYC3-MovAISys-性能监控系统.md) - 性能监控系统详细文档
- [YYC3-MovAISys-模版规范-文档规范-闭环标准.md](../YYC3-MovAISys-格式规范模版/YYC3-MovAISys-模版规范-文档规范-闭环标准.md) - 文档规范标准

### B. 技术支持

如有问题或建议，请联系：

- 邮箱：admin@0379.email
- 项目地址：https://github.com/yyc3/yyc3-Mobile-Intelligent-AI-System

### C. 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-01-08 | 初始版本 |

---

**YYC³（YanYu Cloud Cube）**
**万象归元于云枢 | 深栈智启新纪元**
