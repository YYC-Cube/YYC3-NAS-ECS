# YYC3 Rdeis API 参考文档

> 📋 **API版本**: v3.0.0 | **更新时间**: 2025-12-08 | **基础URL**: https://redis.0379.email/api

## 📖 API概述

YYC3 Rdeis API提供完整的Redis集群管理接口，支持数据操作、集群管理、监控统计、配置管理等功能。API采用RESTful设计，支持JSON格式的请求和响应。

### 基本信息

- **基础URL**: `https://redis.0379.email/api`
- **API版本**: `v3.0.0`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8
- **HTTP方法**: GET, POST, PUT, DELETE, PATCH

### 请求头格式

```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
User-Agent: YYC3-Rdeis/3.0.0
Accept: application/json
X-API-Version: 3.0.0
```

## 🔐 认证接口

### 用户登录

```http
POST /auth/login
```

**请求体**:
```json
{
  "username": "admin",
  "password": "secure_password",
  "remember_me": false
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_here",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@0379.email",
      "role": "administrator",
      "permissions": ["read", "write", "admin"],
      "last_login": "2025-12-08T06:00:00.000Z"
    },
    "expires_in": 86400
  }
}
```

### 刷新令牌

```http
POST /auth/refresh
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "refresh_token": "refresh_token_here"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here",
    "expires_in": 86400
  }
}
```

### 用户登出

```http
POST /auth/logout
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

## 📊 系统状态接口

### 获取系统状态

```http
GET /status
Authorization: Bearer {token}
```

**查询参数**:
- `details` (boolean): 是否返回详细状态信息，默认false

**响应**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-08T06:00:00.000Z",
    "uptime": 86400,
    "version": "3.0.0",
    "environment": "production",
    "cluster": {
      "status": "online",
      "nodes_count": 6,
      "masters_count": 3,
      "slaves_count": 3,
      "quorum_ok": true
    },
    "performance": {
      "operations_per_second": 15420,
      "avg_response_time": 2.3,
      "hit_rate": 0.95,
      "memory_usage": 67.5,
      "cpu_usage": 45.2
    },
    "connections": {
      "active": 145,
      "max_allowed": 1000,
      "rejected_today": 0
    }
  }
}
```

### 获取详细系统信息

```http
GET /status/details
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "system": {
      "hostname": "rdeis-api-01",
      "platform": "linux",
      "architecture": "x64",
      "node_version": "v18.17.0",
      "memory": {
        "total": 8589934592,
        "used": 2899102924,
        "free": 5690831668,
        "usage_percentage": 33.8
      },
      "cpu": {
        "cores": 4,
        "usage_percentage": 45.2,
        "load_average": [1.2, 1.5, 1.8]
      }
    },
    "redis_info": {
      "redis_version": "7.0.8",
      "redis_mode": "cluster",
      "os": "Linux 5.4.0-109-generic x86_64",
      "arch_bits": 64,
      "multiplexing_api": "epoll",
      "process_id": 12345,
      "uptime_in_seconds": 86400,
      "uptime_in_days": 1
    },
    "cluster_details": {
      "cluster_state": "ok",
      "cluster_size": 3,
      "cluster_slots_assigned": 16384,
      "cluster_slots_ok": 16384,
      "cluster_slots_pfail": 0,
      "cluster_slots_fail": 0
    }
  }
}
```

## 🏗️ 集群管理接口

### 获取集群信息

```http
GET /cluster/info
Authorization: Bearer {token}
```

**查询参数**:
- `include_nodes` (boolean): 是否包含节点详情，默认true
- `include_shards` (boolean): 是否包含分片信息，默认true

**响应**:
```json
{
  "success": true,
  "data": {
    "cluster_id": "rdeis-cluster-01",
    "cluster_name": "YYC3 Redis Cluster",
    "cluster_state": "ok",
    "cluster_size": 3,
    "cluster_slots": 16384,
    "nodes": [
      {
        "id": "a1b2c3d4e5f6g7h8i9j0",
        "host": "redis-01.internal",
        "port": 6379,
        "flags": "master",
        "master": "-",
        "ping_sent": 123456,
        "pong_recv": 123456,
        "config_epoch": 1,
        "link_state": "connected",
        "slots": [
          0,
          5460
        ],
        "status": "online",
        "connected_slaves": 1,
        "memory_used": 536870912,
        "memory_max": 1073741824,
        "keys_count": 15234,
        "operations_per_second": 2340,
        "uptime": 86400,
        "redis_version": "7.0.8"
      }
    ],
    "shards": [
      {
        "id": 0,
        "range": "0-5460",
        "master": "redis-01.internal:6379",
        "slaves": ["redis-04.internal:6379"],
        "key_count": 5432,
        "memory_usage": 234567890
      }
    ],
    "summary": {
      "total_nodes": 6,
      "total_masters": 3,
      "total_slaves": 3,
      "total_keys": 15678,
      "total_memory": 3221225472,
      "max_memory": 3221225472,
      "memory_usage_percentage": 100
    }
  }
}
```

### 获取节点详情

```http
GET /cluster/nodes/{node_id}
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "node_id": "a1b2c3d4e5f6g7h8i9j0",
    "host": "redis-01.internal",
    "port": 6379,
    "role": "master",
    "status": "online",
    "connection_info": {
      "connected": true,
      "last_ping": "2025-12-08T05:59:58.000Z",
      "latency_ms": 1.2,
      "link_state": "connected"
    },
    "memory_info": {
      "used_memory": 536870912,
      "used_memory_human": "512.00M",
      "used_memory_rss": 629145600,
      "used_memory_peak": 576716800,
      "maxmemory": 1073741824,
      "maxmemory_human": "1.00G",
      "maxmemory_policy": "allkeys-lru"
    },
    "persistence_info": {
      "loading": false,
      "rdb_changes_since_last_save": 1234,
      "rdb_bgsave_in_progress": false,
      "rdb_last_save_time": 1701974400,
      "rdb_last_bgsave_status": "ok",
      "aof_enabled": true,
      "aof_rewrite_in_progress": false,
      "aof_last_rewrite_time": 1701967200
    },
    "stats_info": {
      "total_connections_received": 15420,
      "total_commands_processed": 125678,
      "instantaneous_ops_per_sec": 234,
      "keyspace_hits": 118450,
      "keyspace_misses": 6228,
      "expired_keys": 145,
      "evicted_keys": 0
    },
    "keyspace_info": [
      {
        "db": 0,
        "keys": 15234,
        "expires": 3456,
        "avg_ttl": 86400
      }
    ]
  }
}
```

### 集群故障转移

```http
POST /cluster/failover
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "node_id": "a1b2c3d4e5f6g7h8i9j0",
  "force": false,
  "timeout": 30
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "failover_initiated": true,
    "node_id": "a1b2c3d4e5f6g7h8i9j0",
    "new_master_id": "b2c3d4e5f6g7h8i9j0a",
    "status": "in_progress",
    "estimated_completion": "2025-12-08T06:00:30.000Z"
  }
}
```

### 集群配置更新

```http
PUT /cluster/config
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "config_type": "redis_config",
  "node_id": "a1b2c3d4e5f6g7h8i9j0",
  "parameters": {
    "maxmemory": "2gb",
    "maxmemory-policy": "allkeys-lru",
    "timeout": 300,
    "tcp-keepalive": 60
  },
  "apply_mode": "graceful"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "config_updated": true,
    "node_id": "a1b2c3d4e5f6g7h8i9j0",
    "applied_parameters": {
      "maxmemory": "2gb",
      "maxmemory-policy": "allkeys-lru"
    },
    "restart_required": false,
    "applied_at": "2025-12-08T06:00:00.000Z"
  }
}
```

## 💾 数据操作接口

### 设置数据

```http
POST /data/set
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "key": "user:session:12345",
  "value": {
    "user_id": 12345,
    "username": "testuser",
    "login_time": "2025-12-08T06:00:00.000Z",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0..."
  },
  "ttl": 3600,
  "type": "hash",
  "nx": false,
  "xx": false,
  "encoding": "utf-8"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "operation": "SET",
    "key": "user:session:12345",
    "ttl": 3600,
    "type": "hash",
    "affected_nodes": ["redis-master-01"],
    "execution_time": 2.3,
    "timestamp": "2025-12-08T06:00:00.000Z",
    "node": "redis-master-01:6379"
  }
}
```

### 获取数据

```http
GET /data/get
Authorization: Bearer {token}
```

**查询参数**:
- `key` (string): 要获取的键名
- `type` (string): 数据类型 (string|hash|list|set|zset)
- `encoding` (string): 编码格式 (utf-8|base64)

**响应**:
```json
{
  "success": true,
  "data": {
    "key": "user:session:12345",
    "value": {
      "user_id": 12345,
      "username": "testuser",
      "login_time": "2025-12-08T06:00:00.000Z",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0..."
    },
    "type": "hash",
    "ttl": 3540,
    "encoding": "utf-8",
    "node": "redis-master-01:6379",
    "timestamp": "2025-12-08T06:00:01.000Z"
  }
}
```

### 删除数据

```http
DELETE /data/delete
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "keys": ["user:session:12345", "cache:data:67890"],
  "pattern": null,
  "async": false
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "operation": "DELETE",
    "deleted_keys": 2,
    "affected_nodes": ["redis-master-01", "redis-master-02"],
    "execution_time": 1.8,
    "details": [
      {
        "key": "user:session:12345",
        "status": "deleted",
        "node": "redis-master-01:6379"
      },
      {
        "key": "cache:data:67890",
        "status": "deleted",
        "node": "redis-master-02:6379"
      }
    ],
    "timestamp": "2025-12-08T06:00:02.000Z"
  }
}
```

### 批量操作

```http
POST /data/mset
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "key_value_pairs": [
    {
      "key": "cache:user:1",
      "value": {"name": "Alice", "age": 25},
      "ttl": 1800
    },
    {
      "key": "cache:user:2",
      "value": {"name": "Bob", "age": 30},
      "ttl": 1800
    },
    {
      "key": "cache:user:3",
      "value": {"name": "Charlie", "age": 35},
      "ttl": 1800
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "operation": "MSET",
    "processed_keys": 3,
    "successful_keys": 3,
    "failed_keys": [],
    "affected_nodes": ["redis-master-01", "redis-master-02"],
    "execution_time": 5.2,
    "timestamp": "2025-12-08T06:00:03.000Z"
  }
}
```

### 哈希操作

#### 设置哈希字段

```http
POST /data/hash/hset
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "key": "user:profile:12345",
  "fields": {
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "+86 138 0013 8000",
    "department": "技术部",
    "position": "高级工程师"
  },
  "ttl": 7200
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "operation": "HSET",
    "key": "user:profile:12345",
    "fields_set": 5,
    "ttl": 7200,
    "node": "redis-master-01:6379",
    "execution_time": 1.8,
    "timestamp": "2025-12-08T06:00:04.000Z"
  }
}
```

#### 获取哈希字段

```http
GET /data/hash/hget
Authorization: Bearer {token}
```

**查询参数**:
- `key` (string): 哈希键名
- `field` (string): 字段名
- `fields` (string): 多个字段名，逗号分隔

**响应**:
```json
{
  "success": true,
  "data": {
    "key": "user:profile:12345",
    "fields": {
      "name": "张三",
      "email": "zhangsan@example.com",
      "phone": "+86 138 0013 8000",
      "department": "技术部",
      "position": "高级工程师"
    },
    "ttl": 7150,
    "node": "redis-master-01:6379",
    "timestamp": "2025-12-08T06:00:05.000Z"
  }
}
```

### 列表操作

#### 推送列表元素

```http
POST /data/list/lpush
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "key": "queue:tasks:pending",
  "values": [
    {
      "id": "task_001",
      "type": "email_send",
      "data": {"to": "user@example.com", "subject": "Welcome"},
      "priority": 1,
      "created_at": "2025-12-08T06:00:00.000Z"
    },
    {
      "id": "task_002",
      "type": "data_sync",
      "data": {"source": "db", "target": "cache"},
      "priority": 2,
      "created_at": "2025-12-08T06:00:01.000Z"
    }
  ],
  "ttl": 86400
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "operation": "LPUSH",
    "key": "queue:tasks:pending",
    "elements_added": 2,
    "list_length": 8,
    "ttl": 86400,
    "node": "redis-master-02:6379",
    "execution_time": 2.1,
    "timestamp": "2025-12-08T06:00:06.000Z"
  }
}
```

#### 弹出列表元素

```http
POST /data/list/rpop
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "key": "queue:tasks:pending",
  "count": 1
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "operation": "RPOP",
    "key": "queue:tasks:pending",
    "elements": [
      {
        "id": "task_001",
        "type": "email_send",
        "data": {"to": "user@example.com", "subject": "Welcome"},
        "priority": 1,
        "created_at": "2025-12-08T06:00:00.000Z"
      }
    ],
    "list_length": 7,
    "node": "redis-master-02:6379",
    "execution_time": 1.2,
    "timestamp": "2025-12-08T06:00:07.000Z"
  }
}
```

## 📈 监控统计接口

### 获取性能指标

```http
GET /monitor/metrics
Authorization: Bearer {token}
```

**查询参数**:
- `period` (string): 时间范围 (1h, 6h, 24h, 7d, 30d)
- `granularity` (string): 数据粒度 (1m, 5m, 15m, 1h, 1d)
- `metrics` (string): 指标类型，逗号分隔 (cpu, memory, operations, latency, network, connections)
- `nodes` (string): 节点过滤，逗号分隔

**响应**:
```json
{
  "success": true,
  "data": {
    "period": "1h",
    "granularity": "1m",
    "metrics": {
      "operations": [
        {
          "timestamp": "2025-12-08T05:00:00.000Z",
          "value": 1234,
          "node": "redis-master-01"
        },
        {
          "timestamp": "2025-12-08T05:01:00.000Z",
          "value": 1256,
          "node": "redis-master-01"
        }
      ],
      "latency": [
        {
          "timestamp": "2025-12-08T05:00:00.000Z",
          "avg": 2.1,
          "p50": 1.8,
          "p95": 4.2,
          "p99": 8.5,
          "node": "redis-master-01"
        }
      ],
      "memory": [
        {
          "timestamp": "2025-12-08T05:00:00.000Z",
          "used": 536870912,
          "max": 1073741824,
          "percentage": 50.0,
          "node": "redis-master-01"
        }
      ],
      "connections": [
        {
          "timestamp": "2025-12-08T05:00:00.000Z",
          "connected": 145,
          "rejected": 0,
          "node": "redis-master-01"
        }
      ]
    },
    "summary": {
      "operations": {
        "total": 74520,
        "avg_per_second": 1245,
        "peak_per_second": 1567,
        "min_per_second": 890
      },
      "latency": {
        "avg_ms": 2.15,
        "p50_ms": 1.8,
        "p95_ms": 4.2,
        "p99_ms": 8.5,
        "max_ms": 15.2
      },
      "memory": {
        "avg_usage_percentage": 52.3,
        "peak_usage_percentage": 67.8,
        "min_usage_percentage": 45.1
      },
      "connections": {
        "avg_connected": 142,
        "peak_connected": 189,
        "total_rejected": 0
      }
    }
  }
}
```

### 获取实时统计

```http
GET /monitor/stats/realtime
Authorization: Bearer {token}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-12-08T06:00:00.000Z",
    "instantaneous": {
      "ops_per_sec": 1456,
      "input_kbps": 234.5,
      "output_kbps": 567.8,
      "connected_clients": 167,
      "blocked_clients": 2,
      "used_memory": 589824512,
      "used_memory_percentage": 54.9
    },
    "cumulative": {
      "total_connections_received": 1234567,
      "total_commands_processed": 9876543,
      "total_net_input_bytes": 1234567890,
      "total_net_output_bytes": 2345678901,
      "keyspace_hits": 8765432,
      "keyspace_misses": 123456,
      "expired_keys": 5678,
      "evicted_keys": 0,
      "rejected_connections": 0
    },
    "rates": {
      "hit_rate": 0.986,
      "miss_rate": 0.014,
      "expiry_rate": 0.001,
      "eviction_rate": 0.0,
      "connection_rejection_rate": 0.0
    }
  }
}
```

### 获取慢查询日志

```http
GET /monitor/slowlog
Authorization: Bearer {token}
```

**查询参数**:
- `limit` (integer): 返回条数限制，默认10，最大100
- `node_id` (string): 节点ID过滤
- `min_duration` (integer): 最小执行时间（微秒），默认10000

**响应**:
```json
{
  "success": true,
  "data": {
    "slowlog_length": 15,
    "entries": [
      {
        "id": 123456789,
        "timestamp": "2025-12-08T05:59:58.000Z",
        "duration_us": 45000,
        "command": "KEYS",
        "arguments": ["user:*"],
        "client_ip": "192.168.1.100",
        "client_name": "client_001"
      },
      {
        "id": 123456788,
        "timestamp": "2025-12-08T05:59:55.000Z",
        "duration_us": 32000,
        "command": "FLUSHDB",
        "arguments": [],
        "client_ip": "192.168.1.101",
        "client_name": "admin_client"
      }
    ],
    "summary": {
      "total_slow_queries": 1567,
      "avg_duration_us": 23456,
      "max_duration_us": 123456,
      "most_common_commands": [
        {"command": "KEYS", "count": 234},
        {"command": "FLUSHDB", "count": 45},
        {"command": "SCAN", "count": 123}
      ]
    }
  }
}
```

### 获取键空间信息

```http
GET /monitor/keyspace
Authorization: Bearer {token}
```

**查询参数**:
- `node_id` (string): 节点ID过滤
- `db` (integer): 数据库编号，默认0
- `pattern` (string): 键名模式过滤
- `detailed` (boolean): 是否返回详细信息，默认false

**响应**:
```json
{
  "success": true,
  "data": {
    "db": 0,
    "total_keys": 15678,
    "keys_with_ttl": 8234,
    "keys_without_ttl": 7444,
    "avg_ttl": 43200,
    "memory_usage": {
      "total_bytes": 3221225472,
      "avg_key_size_bytes": 205,
      "total_human": "3.00G"
    },
    "key_patterns": [
      {
        "pattern": "user:*",
        "count": 3456,
        "percentage": 22.0,
        "avg_ttl": 3600
      },
      {
        "pattern": "session:*",
        "count": 2234,
        "percentage": 14.2,
        "avg_ttl": 1800
      },
      {
        "pattern": "cache:*",
        "count": 4567,
        "percentage": 29.1,
        "avg_ttl": 7200
      }
    ],
    "data_types": [
      {
        "type": "string",
        "count": 5678,
        "percentage": 36.2
      },
      {
        "type": "hash",
        "count": 4567,
        "percentage": 29.1
      },
      {
        "type": "list",
        "count": 2345,
        "percentage": 15.0
      },
      {
        "type": "set",
        "count": 1890,
        "percentage": 12.1
      },
      {
        "type": "zset",
        "count": 1198,
        "percentage": 7.6
      }
    ],
    "detailed_keys": [
      {
        "key": "user:profile:12345",
        "type": "hash",
        "size": 256,
        "ttl": 3540,
        "node": "redis-master-01:6379"
      }
    ]
  }
}
```

## ⚙️ 配置管理接口

### 获取配置

```http
GET /config
Authorization: Bearer {token}
```

**查询参数**:
- `node_id` (string): 节点ID，不指定则返回全局配置
- `section` (string): 配置节 (memory|persistence|network|security|performance)

**响应**:
```json
{
  "success": true,
  "data": {
    "node_id": "redis-master-01",
    "config_version": "3.0.0",
    "last_updated": "2025-12-08T05:00:00.000Z",
    "sections": {
      "memory": {
        "maxmemory": "1073741824",
        "maxmemory-policy": "allkeys-lru",
        "maxmemory-samples": 5
      },
      "persistence": {
        "save": "900 1 300 10 60 10000",
        "stop-writes-on-bgsave-error": "yes",
        "rdbcompression": "yes",
        "rdbchecksum": "yes",
        "appendonly": "yes",
        "appendfilename": "appendonly.aof",
        "no-appendfsync-on-rewrite": "no",
        "auto-aof-rewrite-percentage": "100",
        "auto-aof-rewrite-min-size": "64mb"
      },
      "network": {
        "port": 6379,
        "tcp-backlog": 511,
        "timeout": 0,
        "tcp-keepalive": 300,
        "maxclients": 10000
      },
      "security": {
        "requirepass": "******",
        "rename-command": {
          "CONFIG": "CONFIG_b835c3f8a8d4e7f2",
          "SHUTDOWN": "SHUTDOWN_b835c3f8a8d4e7f2"
        }
      },
      "performance": {
        "hash-max-ziplist-entries": 512,
        "hash-max-ziplist-value": 64,
        "list-max-ziplist-size": -2,
        "list-compress-depth": 0,
        "set-max-intset-entries": 512,
        "zset-max-ziplist-entries": 128,
        "zset-max-ziplist-value": 64,
        "hll-sparse-max-bytes": 3000
      }
    }
  }
}
```

### 更新配置

```http
PUT /config
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "node_id": "redis-master-01",
  "section": "memory",
  "parameters": {
    "maxmemory": "2147483648",
    "maxmemory-policy": "volatile-lru",
    "maxmemory-samples": 10
  },
  "apply_mode": "graceful",
  "backup": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "config_updated": true,
    "node_id": "redis-master-01",
    "section": "memory",
    "applied_parameters": {
      "maxmemory": "2147483648",
      "maxmemory-policy": "volatile-lru",
      "maxmemory-samples": 10
    },
    "restart_required": false,
    "backup_created": true,
    "backup_file": "/backup/config/redis-master-01_20251208_060000.conf",
    "applied_at": "2025-12-08T06:00:00.000Z"
  }
}
```

### 重置配置

```http
POST /config/reset
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "node_id": "redis-master-01",
  "reset_to": "default",
  "backup": true,
  "confirm": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "config_reset": true,
    "node_id": "redis-master-01",
    "reset_to": "default",
    "backup_created": true,
    "backup_file": "/backup/config/redis-master-01_before_reset_20251208_060000.conf",
    "restart_required": true,
    "restart_initiated": true,
    "estimated_downtime": 30,
    "reset_at": "2025-12-08T06:00:00.000Z"
  }
}
```

## 🔍 错误处理

### 标准错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息",
    "details": {
      "field": "具体错误字段",
      "value": "错误值"
    },
    "request_id": "req_123456789",
    "timestamp": "2025-12-08T06:00:00.000Z"
  }
}
```

### 常见错误代码

| 错误代码 | HTTP状态码 | 描述 | 解决方案 |
|----------|------------|------|----------|
| `INVALID_REQUEST` | 400 | 请求格式错误 | 检查请求体格式 |
| `UNAUTHORIZED` | 401 | 未授权访问 | 提供有效的JWT token |
| `FORBIDDEN` | 403 | 权限不足 | 联系管理员分配权限 |
| `NOT_FOUND` | 404 | 资源不存在 | 检查键名是否正确 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 | 降低请求频率 |
| `REDIS_ERROR` | 500 | Redis操作错误 | 检查Redis集群状态 |
| `CLUSTER_ERROR` | 500 | 集群操作错误 | 检查集群健康状态 |
| `CONFIG_ERROR` | 400 | 配置参数错误 | 检查配置参数格式 |

### Redis相关错误

| 错误代码 | 描述 |
|----------|------|
| `REDIS_CONNECTION_FAILED` | Redis连接失败 |
| `REDIS_AUTH_FAILED` | Redis认证失败 |
| `REDIS_TIMEOUT` | Redis操作超时 |
| `REDIS_MEMORY_FULL` | Redis内存不足 |
| `REDIS_KEY_NOT_FOUND` | 键不存在 |
| `REDIS_KEY_EXISTS` | 键已存在 |
| `REDIS_TYPE_MISMATCH` | 数据类型不匹配 |
| `REDIS_INVALID_TTL` | TTL值无效 |
| `CLUSTER_DOWN` | 集群不可用 |
| `CLUSTER_NO_MASTER` | 集群无主节点 |
| `CLUSTER_QUORUM_FAILED` | 集群仲裁失败 |

## 📝 代码示例

### JavaScript/Node.js

```javascript
const axios = require('axios');

class YYC3RdeisAPI {
  constructor(baseURL = 'https://redis.0379.email/api') {
    this.baseURL = baseURL;
    this.token = null;
  }

  async login(username, password) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        username,
        password
      });

      this.token = response.data.data.token;
      return response.data;
    } catch (error) {
      throw new Error(`登录失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async setData(key, value, ttl = 3600) {
    try {
      const response = await axios.post(`${this.baseURL}/data/set`, {
        key,
        value,
        ttl
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`设置数据失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getData(key) {
    try {
      const response = await axios.get(`${this.baseURL}/data/get`, {
        params: { key },
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`获取数据失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getClusterInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/cluster/info`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`获取集群信息失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getMetrics(period = '1h', granularity = '1m') {
    try {
      const response = await axios.get(`${this.baseURL}/monitor/metrics`, {
        params: { period, granularity },
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`获取监控指标失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

// 使用示例
const api = new YYC3RdeisAPI();

async function example() {
  // 登录
  const loginResult = await api.login('admin', 'secure_password');
  console.log('登录成功:', loginResult.data.user.username);

  // 设置数据
  const setResult = await api.setData('user:session:123', {
    user_id: 123,
    username: 'testuser',
    login_time: new Date().toISOString()
  }, 3600);
  console.log('数据设置成功:', setResult.data.key);

  // 获取数据
  const getResult = await api.getData('user:session:123');
  console.log('获取数据成功:', getResult.data.value);

  // 获取集群信息
  const clusterInfo = await api.getClusterInfo();
  console.log('集群节点数:', clusterInfo.data.summary.total_nodes);

  // 获取监控指标
  const metrics = await api.getMetrics('1h', '5m');
  console.log('平均QPS:', metrics.data.summary.operations.avg_per_second);
}

example().catch(console.error);
```

### Python

```python
import requests
import json

class YYC3RdeisAPI:
    def __init__(self, base_url='https://redis.0379.email/api'):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()

    def login(self, username, password):
        try:
            response = self.session.post(
                f'{self.base_url}/auth/login',
                json={
                    'username': username,
                    'password': password
                }
            )

            if response.status_code == 200:
                data = response.json()
                self.token = data['data']['token']
                return data
            else:
                raise Exception(f'登录失败: {response.json().get("error", {}).get("message")}')

        except Exception as e:
            raise Exception(f'登录请求失败: {str(e)}')

    def set_data(self, key, value, ttl=3600):
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            data = {
                'key': key,
                'value': value,
                'ttl': ttl
            }

            response = self.session.post(
                f'{self.base_url}/data/set',
                headers=headers,
                json=data
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f'设置数据失败: {response.json().get("error", {}).get("message")}')

        except Exception as e:
            raise Exception(f'设置数据请求失败: {str(e)}')

    def get_data(self, key):
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            params = {'key': key}

            response = self.session.get(
                f'{self.base_url}/data/get',
                headers=headers,
                params=params
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f'获取数据失败: {response.json().get("error", {}).get("message")}')

        except Exception as e:
            raise Exception(f'获取数据请求失败: {str(e)}')

    def get_cluster_info(self):
        try:
            headers = {'Authorization': f'Bearer {self.token}'}

            response = self.session.get(
                f'{self.base_url}/cluster/info',
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f'获取集群信息失败: {response.json().get("error", {}).get("message")}')

        except Exception as e:
            raise Exception(f'获取集群信息请求失败: {str(e)}')

# 使用示例
def example():
    api = YYC3RdeisAPI()

    # 登录
    login_result = api.login('admin', 'secure_password')
    print(f'登录成功: {login_result["data"]["user"]["username"]}')

    # 设置数据
    set_result = api.set_data('user:session:123', {
        'user_id': 123,
        'username': 'testuser',
        'login_time': '2025-12-08T06:00:00.000Z'
    }, 3600)
    print(f'数据设置成功: {set_result["data"]["key"]}')

    # 获取数据
    get_result = api.get_data('user:session:123')
    print(f'获取数据成功: {get_result["data"]["value"]}')

    # 获取集群信息
    cluster_info = api.get_cluster_info()
    print(f'集群节点数: {cluster_info["data"]["summary"]["total_nodes"]}')

if __name__ == '__main__':
    example()
```

### cURL

```bash
# 用户登录
curl -X POST https://redis.0379.email/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "secure_password"
  }'

# 获取系统状态
curl -X GET "https://redis.0379.email/api/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 获取集群信息
curl -X GET "https://redis.0379.email/api/cluster/info" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 设置数据
curl -X POST https://redis.0379.email/api/data/set \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "key": "user:session:123",
    "value": {"user_id": 123, "username": "testuser"},
    "ttl": 3600
  }'

# 获取数据
curl -X GET "https://redis.0379.email/api/data/get?key=user:session:123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 删除数据
curl -X DELETE https://redis.0379.email/api/data/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "keys": ["user:session:123", "cache:data:456"]
  }'

# 获取监控指标
curl -X GET "https://redis.0379.email/api/monitor/metrics?period=1h&granularity=5m" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 获取实时统计
curl -X GET "https://redis.0379.email/api/monitor/stats/realtime" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔄 版本变更

### v3.0.0 (2025-12-08)

**新增功能**:
- ✨ 新增集群自动故障转移功能
- ✨ 支持Redis 7.0新特性
- ✨ 增强的实时监控指标
- ✨ 新增数据迁移工具API

**改进优化**:
- 🔧 API响应时间优化25%
- 🔧 增加更多性能监控指标
- 🔧 改进错误处理和日志记录
- 🔧 优化批量操作性能

**安全增强**:
- 🔒 增强API认证机制
- 🔒 改进权限控制系统
- 🔒 增加操作审计日志
- 🔒 加强敏感数据保护

**兼容性**:
- ✅ 向后兼容v2.x API
- ⚠️ 部分接口参数格式变更
- ❌ 移除废弃的v1.x接口

---

## 📞 技术支持

- **API文档**: <https://redis.0379.email/api/docs>
- **Swagger UI**: <https://redis.0379.email/api/swagger>
- **监控面板**: <https://redis.0379.email/monitor>
- **技术支持**: <dev@0379.email>
- **问题反馈**: <https://github.com/YYC-Cube/yyc3-rdeis/issues>

---

<div align="center">

**[⬆️ 回到顶部](#yyc3-rdeis-api-参考文档)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 🚀

</div>