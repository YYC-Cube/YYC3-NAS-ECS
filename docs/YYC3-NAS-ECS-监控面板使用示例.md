# YYC³ NAS-ECS 监控面板使用示例

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

**创建日期**: 2026-01-25  
**作者**: YYC³ Team  
**版本**: 1.0.0

---

## 📋 目录

1. [快速入门](#快速入门)
2. [基础使用示例](#基础使用示例)
3. [高级使用示例](#高级使用示例)
4. [API使用示例](#api使用示例)
5. [自定义监控示例](#自定义监控示例)
6. [告警配置示例](#告警配置示例)
7. [故障排查示例](#故障排查示例)
8. [最佳实践](#最佳实践)

---

## 快速入门

### 1. 访问监控面板

**步骤**:

1. 登录YYC³ NAS-ECS系统
2. 点击左侧导航栏的"监控面板"
3. 进入实时监控界面

**界面说明**:

```
┌─────────────────────────────────────────────────┐
│  监控面板                        [刷新] [设置]  │
├─────────────────────────────────────────────────┤
│  CPU: 45%  ████████████████░░░░░░░░░░░░   │
│  内存: 62%  ████████████████████████░░░░░░   │
│  磁盘: 78%  ███████████████████████████░░░   │
│  网络: ↑ 1.2MB/s  ↓ 0.8MB/s              │
├─────────────────────────────────────────────────┤
│  [CPU历史] [内存历史] [磁盘历史] [网络历史]  │
└─────────────────────────────────────────────────┘
```

### 2. 查看系统状态

**系统状态指标**:

- **CPU使用率**: 当前CPU使用百分比
- **内存使用率**: 当前内存使用百分比
- **磁盘使用率**: 当前磁盘使用百分比
- **网络流量**: 上传和下载速度
- **系统负载**: 系统平均负载
- **运行时间**: 系统连续运行时间

**状态颜色说明**:

- 🟢 绿色: 正常（< 70%）
- 🟡 黄色: 警告（70-90%）
- 🔴 红色: 严重（> 90%）

### 3. 设置告警阈值

**步骤**:

1. 点击右上角"设置"按钮
2. 进入告警配置页面
3. 设置各项告警阈值:
   - CPU告警阈值: 默认80%
   - 内存告警阈值: 默认85%
   - 磁盘告警阈值: 默认90%
4. 点击"保存"按钮

**配置示例**:

```typescript
// 告警阈值配置
const alertThresholds = {
  cpu: 80,      // CPU使用率超过80%时告警
  memory: 85,   // 内存使用率超过85%时告警
  disk: 90,     // 磁盘使用率超过90%时告警
  network: 100,  // 网络流量超过100MB/s时告警
  load: 5,      // 系统负载超过5时告警
};
```

### 4. 查看历史数据

**步骤**:

1. 点击"历史"按钮
2. 选择时间范围:
   - 1小时
   - 24小时
   - 7天
   - 30天
3. 选择数据类型:
   - CPU
   - 内存
   - 磁盘
   - 网络
4. 查看历史趋势图

**导出数据**:

```typescript
// 导出历史数据为CSV
const exportData = async (timeRange: string, dataType: string) => {
  const response = await fetch(`/api/v2/monitor/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeRange,
      dataType,
      format: 'csv',
    }),
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `monitor_${dataType}_${timeRange}.csv`;
  a.click();
};
```

---

## 基础使用示例

### 示例1: 获取实时系统状态

```typescript
// 获取实时系统状态
const getSystemStats = async () => {
  try {
    const response = await fetch('/api/v2/system/stats');
    const data = await response.json();

    if (data.success) {
      const stats = data.data;
      console.log('系统状态:', stats);
      
      // 显示CPU使用率
      console.log(`CPU使用率: ${stats.cpu.usage}%`);
      
      // 显示内存使用情况
      console.log(`内存使用: ${stats.memory.used}MB / ${stats.memory.total}MB`);
      
      // 显示磁盘使用情况
      console.log(`磁盘使用: ${stats.disk.used}GB / ${stats.disk.total}GB`);
      
      // 显示网络流量
      console.log(`网络流量: ↑${stats.network.in}KB/s ↓${stats.network.out}KB/s`);
      
      return stats;
    }
  } catch (error) {
    console.error('获取系统状态失败:', error);
  }
};

// 使用示例
getSystemStats();
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "cpu": {
      "usage": 45.5,
      "cores": 8,
      "load": [1.2, 1.5, 1.8]
    },
    "memory": {
      "usage": 62.3,
      "total": 16384,
      "used": 10240,
      "free": 6144
    },
    "disk": {
      "usage": 78.5,
      "total": 1024,
      "used": 804,
      "free": 220
    },
    "network": {
      "in": 1228.8,
      "out": 819.2
    },
    "uptime": 86400
  }
}
```

### 示例2: 设置告警阈值

```typescript
// 设置告警阈值
const setAlertThresholds = async (thresholds: AlertThresholds) => {
  try {
    const response = await fetch('/api/v2/system/alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(thresholds),
    });

    const data = await response.json();

    if (data.success) {
      console.log('告警阈值设置成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('设置告警阈值失败:', error);
  }
};

// 使用示例
const thresholds = {
  cpu: 80,
  memory: 85,
  disk: 90,
  network: 100,
  load: 5,
};

setAlertThresholds(thresholds);
```

**请求示例**:

```json
{
  "cpu": 80,
  "memory": 85,
  "disk": 90,
  "network": 100,
  "load": 5
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "cpu": 80,
    "memory": 85,
    "disk": 90,
    "network": 100,
    "load": 5
  }
}
```

### 示例3: 获取历史监控数据

```typescript
// 获取历史监控数据
const getHistoryData = async (params: HistoryParams) => {
  try {
    const queryParams = new URLSearchParams({
      timeRange: params.timeRange,
      dataType: params.dataType,
      interval: params.interval || '5m',
    });

    const response = await fetch(`/api/v2/monitor/history?${queryParams}`);
    const data = await response.json();

    if (data.success) {
      console.log('历史数据:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('获取历史数据失败:', error);
  }
};

// 使用示例
const historyParams = {
  timeRange: '24h',    // 时间范围: 1h, 6h, 24h, 7d, 30d
  dataType: 'cpu',       // 数据类型: cpu, memory, disk, network
  interval: '5m',       // 数据间隔: 1m, 5m, 15m, 1h
};

getHistoryData(historyParams);
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "dataType": "cpu",
    "timeRange": "24h",
    "interval": "5m",
    "dataPoints": [
      {
        "timestamp": "2026-01-25T00:00:00Z",
        "value": 42.5
      },
      {
        "timestamp": "2026-01-25T00:05:00Z",
        "value": 45.2
      }
    ]
  }
}
```

---

## 高级使用示例

### 示例1: 自定义监控项

```typescript
// 添加自定义监控项
const addCustomMonitor = async (monitor: CustomMonitor) => {
  try {
    const response = await fetch('/api/v2/monitor/custom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(monitor),
    });

    const data = await response.json();

    if (data.success) {
      console.log('自定义监控项添加成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('添加自定义监控项失败:', error);
  }
};

// 使用示例 - 监控特定进程的CPU使用率
const customMonitor = {
  name: 'Node.js进程监控',
  type: 'process',
  query: 'SELECT cpu_usage FROM processes WHERE name = "node"',
  interval: 60,           // 60秒检查一次
  threshold: 90,          // 超过90%时告警
  alert: true,            // 启用告警
  description: '监控Node.js进程的CPU使用率',
};

addCustomMonitor(customMonitor);
```

**请求示例**:

```json
{
  "name": "Node.js进程监控",
  "type": "process",
  "query": "SELECT cpu_usage FROM processes WHERE name = \"node\"",
  "interval": 60,
  "threshold": 90,
  "alert": true,
  "description": "监控Node.js进程的CPU使用率"
}
```

### 示例2: 配置告警通知

```typescript
// 配置告警通知
const configureAlertNotification = async (config: AlertConfig) => {
  try {
    const response = await fetch('/api/v2/monitor/alert/notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();

    if (data.success) {
      console.log('告警通知配置成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('配置告警通知失败:', error);
  }
};

// 使用示例 - 配置邮件和Webhook通知
const alertConfig = {
  email: {
    enabled: true,
    recipients: ['admin@example.com', 'ops@example.com'],
    subject: 'YYC3 NAS-ECS 告警通知',
  },
  webhook: {
    enabled: true,
    url: 'https://hooks.example.com/alerts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },
  sms: {
    enabled: false,
    recipients: [],
  },
  telegram: {
    enabled: false,
    botToken: '',
    chatId: '',
  },
};

configureAlertNotification(alertConfig);
```

### 示例3: 批量获取监控数据

```typescript
// 批量获取多个监控指标
const getBatchMetrics = async (metrics: string[]) => {
  try {
    const response = await fetch('/api/v2/monitor/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ metrics }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('批量监控数据:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('获取批量监控数据失败:', error);
  }
};

// 使用示例
const metrics = [
  'cpu.usage',
  'memory.usage',
  'disk.usage',
  'network.in',
  'network.out',
  'system.load',
];

getBatchMetrics(metrics);
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "cpu.usage": 45.5,
    "memory.usage": 62.3,
    "disk.usage": 78.5,
    "network.in": 1228.8,
    "network.out": 819.2,
    "system.load": [1.2, 1.5, 1.8]
  }
}
```

---

## API使用示例

### 示例1: JavaScript/TypeScript

```typescript
// 创建监控API客户端
class MonitoringAPI {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || '请求失败');
    }

    return data.data;
  }

  // 获取系统状态
  async getSystemStats(): Promise<SystemStats> {
    return this.request<SystemStats>('/api/v2/system/stats');
  }

  // 设置告警阈值
  async setAlertThresholds(thresholds: AlertThresholds): Promise<AlertThresholds> {
    return this.request<AlertThresholds>('/api/v2/system/alert', {
      method: 'POST',
      body: JSON.stringify(thresholds),
    });
  }

  // 获取历史数据
  async getHistoryData(params: HistoryParams): Promise<HistoryData> {
    const queryParams = new URLSearchParams(params as any);
    return this.request<HistoryData>(`/api/v2/monitor/history?${queryParams}`);
  }

  // 添加自定义监控
  async addCustomMonitor(monitor: CustomMonitor): Promise<CustomMonitor> {
    return this.request<CustomMonitor>('/api/v2/monitor/custom', {
      method: 'POST',
      body: JSON.stringify(monitor),
    });
  }
}

// 使用示例
const api = new MonitoringAPI('http://localhost:6000', 'your-token-here');

// 获取系统状态
const stats = await api.getSystemStats();
console.log('系统状态:', stats);

// 设置告警阈值
await api.setAlertThresholds({
  cpu: 80,
  memory: 85,
  disk: 90,
});

// 获取历史数据
const history = await api.getHistoryData({
  timeRange: '24h',
  dataType: 'cpu',
});
console.log('历史数据:', history);
```

### 示例2: Python

```python
import requests
from typing import Dict, Any, List

class MonitoringAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }

    def _request(self, endpoint: str, method: str = 'GET', data: Dict = None) -> Any:
        url = f'{self.base_url}{endpoint}'
        response = requests.request(
            method,
            url,
            headers=self.headers,
            json=data
        )
        
        result = response.json()
        
        if not result.get('success'):
            raise Exception(result.get('error', {}).get('message', '请求失败'))
        
        return result.get('data')

    def get_system_stats(self) -> Dict:
        """获取系统状态"""
        return self._request('/api/v2/system/stats')

    def set_alert_thresholds(self, thresholds: Dict) -> Dict:
        """设置告警阈值"""
        return self._request(
            '/api/v2/system/alert',
            method='POST',
            data=thresholds
        )

    def get_history_data(self, time_range: str, data_type: str, interval: str = '5m') -> Dict:
        """获取历史数据"""
        params = {
            'timeRange': time_range,
            'dataType': data_type,
            'interval': interval
        }
        return self._request(f'/api/v2/monitor/history?{params}')

# 使用示例
api = MonitoringAPI('http://localhost:6000', 'your-token-here')

# 获取系统状态
stats = api.get_system_stats()
print(f'系统状态: {stats}')

# 设置告警阈值
api.set_alert_thresholds({
    'cpu': 80,
    'memory': 85,
    'disk': 90
})

# 获取历史数据
history = api.get_history_data('24h', 'cpu')
print(f'历史数据: {history}')
```

### 示例3: cURL

```bash
# 获取系统状态
curl -X GET \
  -H "Authorization: Bearer your-token-here" \
  http://localhost:6000/api/v2/system/stats

# 设置告警阈值
curl -X POST \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{"cpu":80,"memory":85,"disk":90}' \
  http://localhost:6000/api/v2/system/alert

# 获取历史数据
curl -X GET \
  -H "Authorization: Bearer your-token-here" \
  "http://localhost:6000/api/v2/monitor/history?timeRange=24h&dataType=cpu&interval=5m"

# 添加自定义监控
curl -X POST \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "自定义监控",
    "type": "custom",
    "query": "SELECT * FROM metrics",
    "interval": 60,
    "threshold": 90,
    "alert": true
  }' \
  http://localhost:6000/api/v2/monitor/custom
```

---

## 自定义监控示例

### 示例1: 监控数据库连接数

```typescript
// 添加数据库连接数监控
const dbConnectionMonitor = {
  name: '数据库连接数监控',
  type: 'database',
  query: 'SELECT count(*) FROM pg_stat_activity WHERE datname = '\''yyc3_nas_db'\''',
  interval: 30,           // 30秒检查一次
  threshold: 100,         // 超过100个连接时告警
  alert: true,
  description: '监控PostgreSQL数据库的连接数',
};

addCustomMonitor(dbConnectionMonitor);
```

### 示例2: 监控API响应时间

```typescript
// 添加API响应时间监控
const apiResponseTimeMonitor = {
  name: 'API响应时间监控',
  type: 'api',
  query: 'SELECT avg(response_time) FROM api_logs WHERE timestamp > NOW() - INTERVAL '\''5 minutes'\''',
  interval: 60,           // 60秒检查一次
  threshold: 500,         // 超过500ms时告警
  alert: true,
  description: '监控API平均响应时间',
};

addCustomMonitor(apiResponseTimeMonitor);
```

### 示例3: 监控磁盘I/O

```typescript
// 添加磁盘I/O监控
const diskIOMonitor = {
  name: '磁盘I/O监控',
  type: 'disk',
  query: 'SELECT disk_read_bytes, disk_write_bytes FROM system_metrics',
  interval: 60,           // 60秒检查一次
  threshold: 100 * 1024 * 1024,  // 超过100MB/s时告警
  alert: true,
  description: '监控磁盘读写速度',
};

addCustomMonitor(diskIOMonitor);
```

---

## 告警配置示例

### 示例1: 配置多级告警

```typescript
// 配置多级告警规则
const multiLevelAlerts = {
  name: 'CPU多级告警',
  metric: 'cpu.usage',
  rules: [
    {
      level: 'warning',
      threshold: 70,
      duration: 300,      // 持续5分钟
      actions: ['log', 'email'],
    },
    {
      level: 'critical',
      threshold: 90,
      duration: 60,       // 持续1分钟
      actions: ['log', 'email', 'webhook', 'sms'],
    },
  ],
};

const configureMultiLevelAlerts = async (config: any) => {
  const response = await fetch('/api/v2/monitor/alert/multi-level', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });

  const data = await response.json();
  console.log('多级告警配置成功:', data.data);
};

configureMultiLevelAlerts(multiLevelAlerts);
```

### 示例2: 配置智能告警

```typescript
// 配置智能告警（基于机器学习）
const smartAlertConfig = {
  name: '智能CPU告警',
  metric: 'cpu.usage',
  algorithm: 'anomaly_detection',  // 异常检测算法
  sensitivity: 'medium',           // 敏感度
  baselinePeriod: '7d',            // 基线周期
  alertThreshold: 2.0,            // 异常倍数
  actions: ['log', 'email', 'webhook'],
};

const configureSmartAlert = async (config: any) => {
  const response = await fetch('/api/v2/monitor/alert/smart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });

  const data = await response.json();
  console.log('智能告警配置成功:', data.data);
};

configureSmartAlert(smartAlertConfig);
```

---

## 故障排查示例

### 示例1: 检查监控服务状态

```typescript
// 检查监控服务状态
const checkMonitorService = async () => {
  try {
    const response = await fetch('/api/v2/monitor/health');
    const data = await response.json();

    if (data.success) {
      const health = data.data;
      console.log('监控服务状态:', health);
      
      // 检查各项服务状态
      if (health.database === 'healthy') {
        console.log('✅ 数据库服务正常');
      } else {
        console.log('❌ 数据库服务异常');
      }
      
      if (health.redis === 'healthy') {
        console.log('✅ Redis服务正常');
      } else {
        console.log('❌ Redis服务异常');
      }
      
      if (health.collector === 'healthy') {
        console.log('✅ 数据采集服务正常');
      } else {
        console.log('❌ 数据采集服务异常');
      }
      
      return health;
    }
  } catch (error) {
    console.error('检查监控服务状态失败:', error);
  }
};

checkMonitorService();
```

### 示例2: 查看监控日志

```typescript
// 查看监控日志
const getMonitorLogs = async (params: LogParams) => {
  try {
    const queryParams = new URLSearchParams({
      level: params.level || 'info',
      limit: params.limit?.toString() || '100',
      offset: params.offset?.toString() || '0',
    });

    const response = await fetch(`/api/v2/monitor/logs?${queryParams}`);
    const data = await response.json();

    if (data.success) {
      console.log('监控日志:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('获取监控日志失败:', error);
  }
};

// 使用示例 - 查看最近的错误日志
getMonitorLogs({
  level: 'error',
  limit: 50,
});
```

### 示例3: 重启监控服务

```typescript
// 重启监控服务
const restartMonitorService = async () => {
  try {
    const response = await fetch('/api/v2/monitor/restart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log('监控服务重启成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('重启监控服务失败:', error);
  }
};

restartMonitorService();
```

---

## 最佳实践

### 1. 合理设置告警阈值

**建议**:

- CPU告警阈值: 80-85%
- 内存告警阈值: 85-90%
- 磁盘告警阈值: 90-95%
- 网络告警阈值: 根据带宽设置
- 系统负载: 根据CPU核心数设置（如8核心设置为5）

**示例**:

```typescript
const recommendedThresholds = {
  cpu: 80,
  memory: 85,
  disk: 90,
  network: 100,  // 100MB/s
  load: 5,       // 8核心CPU
};
```

### 2. 使用多级告警

**优势**:

- 避免告警疲劳
- 区分告警严重程度
- 提高告警准确性

**示例**:

```typescript
const multiLevelAlerts = {
  warning: { threshold: 70, actions: ['log'] },
  critical: { threshold: 90, actions: ['log', 'email', 'webhook'] },
};
```

### 3. 定期审查监控配置

**建议**:

- 每月审查一次告警阈值
- 每季度审查一次监控项
- 根据实际情况调整配置

### 4. 使用智能告警

**优势**:

- 基于历史数据学习
- 自动识别异常
- 减少误报

**示例**:

```typescript
const smartAlertConfig = {
  algorithm: 'anomaly_detection',
  sensitivity: 'medium',
  baselinePeriod: '7d',
};
```

### 5. 建立告警响应流程

**建议**:

1. 接收告警通知
2. 评估告警严重程度
3. 查看监控数据和日志
4. 采取相应措施
5. 记录处理过程
6. 复盘和优化

---

## 常见问题

### Q1: 如何添加自定义监控项？

**A**: 使用`/api/v2/monitor/custom`接口添加自定义监控项，需要提供监控名称、查询语句、检查间隔、告警阈值等信息。

### Q2: 如何配置多个告警通知渠道？

**A**: 使用`/api/v2/monitor/alert/notification`接口配置多个通知渠道，包括邮件、Webhook、短信、Telegram等。

### Q3: 如何导出监控数据？

**A**: 使用`/api/v2/monitor/export`接口导出监控数据，支持CSV、JSON等格式。

### Q4: 如何查看历史监控数据？

**A**: 使用`/api/v2/monitor/history`接口查看历史数据，可以指定时间范围、数据类型、数据间隔等参数。

### Q5: 如何设置多级告警？

**A**: 使用`/api/v2/monitor/alert/multi-level`接口配置多级告警，可以设置不同级别的阈值和响应动作。

---

**文档版本**: 1.0.0  
**最后更新**: 2026-01-25  
**维护团队**: YYC³ Team

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
