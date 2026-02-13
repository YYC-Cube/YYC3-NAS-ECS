# YYC³ NAS-ECS NAS管理使用指南

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

**创建日期**: 2026-01-25  
**作者**: YYC³ Team  
**版本**: 1.0.0  
**更新日期**: 2026-01-25

---

## 📋 目录

1. [快速入门](#快速入门)
2. [NAS管理概述](#nas管理概述)
3. [系统管理](#系统管理)
4. [存储管理](#存储管理)
5. [文件共享](#文件共享)
6. [用户管理](#用户管理)
7. [API使用示例](#api使用示例)
8. [代码示例](#代码示例)
9. [高级使用示例](#高级使用示例)
10. [故障排除](#故障排除)
11. [最佳实践](#最佳实践)

---

## 🚀 快速入门

### 1. 访问NAS管理界面

- **Web界面**: <https://nas.0379.email>
- **API服务**: <http://localhost:6009>
- **健康检查**: <http://nas.0379.email/health>

### 2. 查看NAS状态

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 查看"系统状态"卡片
3. 查看运行状态、CPU使用率、内存使用率等信息

#### 方法2：通过API

```bash
# 获取NAS状态
curl -X GET http://localhost:6009/api/nas/status

# 响应示例
{
  "success": true,
  "data": {
    "running": true,
    "status": "online",
    "uptime": "15天 3小时 45分钟",
    "version": "DSM 7.2.1-69057 Update 3",
    "cpuUsage": 12.5,
    "memoryUsage": 45.3,
    "temperature": 42
  }
}
```

### 3. 查看存储卷信息

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"存储卷"标签页
3. 查看存储卷列表、使用情况、健康状态等信息

#### 方法2：通过API

```bash
# 获取存储卷列表
curl -X GET http://localhost:6009/api/nas/volumes

# 响应示例
{
  "success": true,
  "data": [
    {
      "id": "vol1",
      "name": "Volume 1",
      "type": "Btrfs",
      "total": 16000,
      "used": 8750,
      "available": 7250,
      "health": "healthy",
      "mountPoint": "/volume1"
    },
    {
      "id": "vol2",
      "name": "Volume 2",
      "type": "EXT4",
      "total": 8000,
      "used": 3200,
      "available": 4800,
      "health": "healthy",
      "mountPoint": "/volume2"
    }
  ]
}
```

### 4. 查看文件共享配置

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"文件共享"标签页
3. 查看文件共享列表、类型、权限等信息

#### 方法2：通过API

```bash
# 获取文件共享列表
curl -X GET http://localhost:6009/api/nas/shares

# 响应示例
{
  "success": true,
  "data": [
    {
      "id": "share1",
      "name": "Documents",
      "path": "/volume1/Documents",
      "type": "smb",
      "enabled": true,
      "users": ["admin", "user1"],
      "permissions": "full",
      "status": "active"
    },
    {
      "id": "share2",
      "name": "Media",
      "path": "/volume1/Media",
      "type": "smb",
      "enabled": true,
      "users": ["admin"],
      "permissions": "read",
      "status": "active"
    }
  ]
}
```

---

## 📖 NAS管理概述

### 什么是NAS管理？

NAS（Network Attached Storage）管理是指对网络存储设备进行集中管理，包括存储卷管理、文件共享配置、用户权限管理、系统监控等功能。

### YYC³ NAS管理特点

- ✅ **统一管理**: 提供统一的Web管理界面
- ✅ **实时监控**: 实时监控系统状态和存储使用情况
- ✅ **多协议支持**: 支持SMB、NFS、WebDAV、FTP等多种文件共享协议
- ✅ **RESTful API**: 提供完整的RESTful API接口
- ✅ **权限管理**: 细粒度的用户权限管理
- ✅ **告警通知**: 支持存储告警和系统告警
- ✅ **自动化**: 支持自动化备份和同步

### 系统架构

```
┌─────────────────┐
│   Web界面       │
│  (Nginx/HTTPS) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API服务        │
│  (Flask/6009)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  NAS系统        │
│  (Synology DSM) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  存储设备       │
│  (Volume 1/2)  │
└─────────────────┘
```

---

## 💻 系统管理

### 查看系统状态

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 查看"系统状态"卡片
3. 查看以下信息:
   - 运行状态（在线/离线/维护中）
   - 系统版本
   - 运行时间
   - CPU使用率
   - 内存使用率
   - 系统温度

#### 方法2：通过API

```bash
# 获取系统状态
curl -X GET http://localhost:6009/api/nas/status
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "running": true,
    "status": "online",
    "uptime": "15天 3小时 45分钟",
    "version": "DSM 7.2.1-69057 Update 3",
    "cpuUsage": 12.5,
    "memoryUsage": 45.3,
    "temperature": 42
  }
}
```

### 启动/停止NAS服务

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 在"系统状态"卡片中
3. 点击"启动NAS"或"停止NAS"按钮

#### 方法2：通过API

```bash
# 启动NAS服务
curl -X POST http://localhost:6009/api/nas/start

# 响应示例
{
  "success": true,
  "message": "NAS服务已启动"
}

# 停止NAS服务
curl -X POST http://localhost:6009/api/nas/stop

# 响应示例
{
  "success": true,
  "message": "NAS服务已停止"
}
```

### 重启NAS服务

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 在"系统状态"卡片中
3. 点击"重启NAS"按钮
4. 确认重启操作

#### 方法2：通过API

```bash
# 重启NAS服务
curl -X POST http://localhost:6009/api/nas/restart

# 响应示例
{
  "success": true,
  "message": "NAS服务正在重启"
}
```

### 系统信息查询

```bash
# 获取系统信息
curl -X GET http://localhost:6009/api/nas/info

# 响应示例
{
  "success": true,
  "data": {
    "hostname": "nas-0379",
    "model": "DS920+",
    "serial": "1234ABCD5678",
    "macAddress": "00:11:22:33:44:55",
    "ipAddress": "192.168.1.100",
    "subnetMask": "255.255.255.0",
    "gateway": "192.168.1.1",
    "dnsServers": ["8.8.8.8", "8.8.4.4"],
    "firmwareVersion": "DSM 7.2.1-69057 Update 3",
    "kernelVersion": "4.4.180+"
  }
}
```

---

## 💾 存储管理

### 查看存储卷列表

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"存储卷"标签页
3. 查看存储卷列表

#### 方法2：通过API

```bash
# 获取存储卷列表
curl -X GET http://localhost:6009/api/nas/volumes
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "vol1",
      "name": "Volume 1",
      "type": "Btrfs",
      "total": 16000,
      "used": 8750,
      "available": 7250,
      "health": "healthy",
      "mountPoint": "/volume1"
    },
    {
      "id": "vol2",
      "name": "Volume 2",
      "type": "EXT4",
      "total": 8000,
      "used": 3200,
      "available": 4800,
      "health": "healthy",
      "mountPoint": "/volume2"
    }
  ]
}
```

### 查看存储卷详情

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"存储卷"标签页
3. 点击存储卷名称查看详情

#### 方法2：通过API

```bash
# 获取存储卷详情
curl -X GET http://localhost:6009/api/nas/volumes/vol1

# 响应示例
{
  "success": true,
  "data": {
    "id": "vol1",
    "name": "Volume 1",
    "type": "Btrfs",
    "total": 16000,
    "used": 8750,
    "available": 7250,
    "health": "healthy",
    "mountPoint": "/volume1",
    "createdAt": "2025-01-01T00:00:00Z",
    "lastChecked": "2026-01-25T10:30:00Z",
    "raidLevel": "RAID 1",
    "disks": [
      {
        "id": "disk1",
        "name": "Disk 1",
        "model": "ST16000NM001G",
        "size": 16000,
        "health": "healthy",
        "temperature": 38
      },
      {
        "id": "disk2",
        "name": "Disk 2",
        "model": "ST16000NM001G",
        "size": 16000,
        "health": "healthy",
        "temperature": 40
      }
    ]
  }
}
```

### 创建存储卷

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"存储卷"标签页
3. 点击"创建存储卷"按钮
4. 填写存储卷信息:
   - 存储卷名称
   - 文件系统类型（Btrfs/EXT4）
   - RAID级别
   - 选择磁盘
5. 点击"创建"按钮

#### 方法2：通过API

```bash
# 创建存储卷
curl -X POST http://localhost:6009/api/nas/volumes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Volume 3",
    "type": "Btrfs",
    "raidLevel": "RAID 1",
    "disks": ["disk3", "disk4"]
  }'

# 响应示例
{
  "success": true,
  "data": {
    "id": "vol3",
    "name": "Volume 3",
    "type": "Btrfs",
    "raidLevel": "RAID 1",
    "status": "creating",
    "progress": 0
  }
}
```

### 删除存储卷

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"存储卷"标签页
3. 找到要删除的存储卷
4. 点击"删除"按钮
5. 确认删除操作

#### 方法2：通过API

```bash
# 删除存储卷
curl -X DELETE http://localhost:6009/api/nas/volumes/vol3

# 响应示例
{
  "success": true,
  "message": "存储卷已删除"
}
```

### 存储卷扩容

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"存储卷"标签页
3. 找到要扩容的存储卷
4. 点击"扩容"按钮
5. 选择要添加的磁盘
6. 点击"扩容"按钮

#### 方法2：通过API

```bash
# 扩容存储卷
curl -X POST http://localhost:6009/api/nas/volumes/vol1/expand \
  -H "Content-Type: application/json" \
  -d '{
    "disks": ["disk3"]
  }'

# 响应示例
{
  "success": true,
  "data": {
    "id": "vol1",
    "name": "Volume 1",
    "status": "expanding",
    "progress": 0
  }
}
```

---

## 📁 文件共享

### 查看文件共享列表

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"文件共享"标签页
3. 查看文件共享列表

#### 方法2：通过API

```bash
# 获取文件共享列表
curl -X GET http://localhost:6009/api/nas/shares
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "share1",
      "name": "Documents",
      "path": "/volume1/Documents",
      "type": "smb",
      "enabled": true,
      "users": ["admin", "user1"],
      "permissions": "full",
      "status": "active"
    },
    {
      "id": "share2",
      "name": "Media",
      "path": "/volume1/Media",
      "type": "smb",
      "enabled": true,
      "users": ["admin"],
      "permissions": "read",
      "status": "active"
    }
  ]
}
```

### 创建文件共享

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"文件共享"标签页
3. 点击"创建共享"按钮
4. 填写共享信息:
   - 共享名称
   - 共享路径
   - 共享类型（SMB/NFS/WebDAV/FTP）
   - 用户权限
   - 访问控制
5. 点击"创建"按钮

#### 方法2：通过API

```bash
# 创建文件共享
curl -X POST http://localhost:6009/api/nas/shares \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Backup",
    "path": "/volume1/Backup",
    "type": "smb",
    "enabled": true,
    "users": ["admin"],
    "permissions": "full",
    "accessControl": "allow"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "id": "share3",
    "name": "Backup",
    "path": "/volume1/Backup",
    "type": "smb",
    "enabled": true,
    "users": ["admin"],
    "permissions": "full",
    "status": "active"
  }
}
```

### 更新文件共享配置

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"文件共享"标签页
3. 找到要更新的文件共享
4. 点击"编辑"按钮
5. 修改共享配置
6. 点击"保存"按钮

#### 方法2：通过API

```bash
# 更新文件共享配置
curl -X PUT http://localhost:6009/api/nas/shares/share1 \
  -H "Content-Type: application/json" \
  -d '{
    "users": ["admin", "user1", "user2"],
    "permissions": "full"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "id": "share1",
    "name": "Documents",
    "path": "/volume1/Documents",
    "type": "smb",
    "enabled": true,
    "users": ["admin", "user1", "user2"],
    "permissions": "full",
    "status": "active"
  }
}
```

### 删除文件共享

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"文件共享"标签页
3. 找到要删除的文件共享
4. 点击"删除"按钮
5. 确认删除操作

#### 方法2：通过API

```bash
# 删除文件共享
curl -X DELETE http://localhost:6009/api/nas/shares/share1

# 响应示例
{
  "success": true,
  "message": "文件共享已删除"
}
```

### 启用/禁用文件共享

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"文件共享"标签页
3. 找到要启用/禁用的文件共享
4. 点击"启用"或"禁用"按钮

#### 方法2：通过API

```bash
# 启用文件共享
curl -X POST http://localhost:6009/api/nas/shares/share1/enable

# 响应示例
{
  "success": true,
  "message": "文件共享已启用"
}

# 禁用文件共享
curl -X POST http://localhost:6009/api/nas/shares/share1/disable

# 响应示例
{
  "success": true,
  "message": "文件共享已禁用"
}
```

---

## 👥 用户管理

### 查看用户列表

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"用户管理"标签页
3. 查看用户列表

#### 方法2：通过API

```bash
# 获取用户列表
curl -X GET http://localhost:6009/api/nas/users
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user1",
      "name": "admin",
      "email": "admin@0379.email",
      "role": "administrator",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z",
      "lastLogin": "2026-01-25T10:30:00Z"
    },
    {
      "id": "user2",
      "name": "user1",
      "email": "user1@0379.email",
      "role": "user",
      "status": "active",
      "createdAt": "2025-01-15T00:00:00Z",
      "lastLogin": "2026-01-24T15:20:00Z"
    }
  ]
}
```

### 创建用户

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"用户管理"标签页
3. 点击"创建用户"按钮
4. 填写用户信息:
   - 用户名
   - 邮箱
   - 密码
   - 角色（管理员/普通用户）
   - 用户组
5. 点击"创建"按钮

#### 方法2：通过API

```bash
# 创建用户
curl -X POST http://localhost:6009/api/nas/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user2",
    "email": "user2@0379.email",
    "password": "SecurePassword123!",
    "role": "user",
    "groups": ["users"]
  }'

# 响应示例
{
  "success": true,
  "data": {
    "id": "user3",
    "name": "user2",
    "email": "user2@0379.email",
    "role": "user",
    "status": "active",
    "createdAt": "2026-01-25T10:35:00Z"
  }
}
```

### 更新用户信息

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"用户管理"标签页
3. 找到要更新的用户
4. 点击"编辑"按钮
5. 修改用户信息
6. 点击"保存"按钮

#### 方法2：通过API

```bash
# 更新用户信息
curl -X PUT http://localhost:6009/api/nas/users/user2 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@0379.email",
    "role": "administrator"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "id": "user2",
    "name": "user1",
    "email": "newemail@0379.email",
    "role": "administrator",
    "status": "active",
    "updatedAt": "2026-01-25T10:40:00Z"
  }
}
```

### 删除用户

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 点击"用户管理"标签页
3. 找到要删除的用户
4. 点击"删除"按钮
5. 确认删除操作

#### 方法2：通过API

```bash
# 删除用户
curl -X DELETE http://localhost:6009/api/nas/users/user2

# 响应示例
{
  "success": true,
  "message": "用户已删除"
}
```

---

## 🔌 API使用示例

### API概述

YYC³ NAS管理服务提供完整的RESTful API接口，支持系统管理、存储管理、文件共享、用户管理等功能。

### API基础信息

- **Base URL**: `http://localhost:6009/api/nas`
- **认证方式**: API Key（可选）
- **数据格式**: JSON
- **字符编码**: UTF-8

### API端点列表

| 端点 | 方法 | 描述 |
|------|------|------|
| `/status` | GET | 获取NAS状态 |
| `/info` | GET | 获取系统信息 |
| `/start` | POST | 启动NAS服务 |
| `/stop` | POST | 停止NAS服务 |
| `/restart` | POST | 重启NAS服务 |
| `/volumes` | GET | 获取存储卷列表 |
| `/volumes` | POST | 创建存储卷 |
| `/volumes/{id}` | GET | 获取存储卷详情 |
| `/volumes/{id}` | DELETE | 删除存储卷 |
| `/volumes/{id}/expand` | POST | 扩容存储卷 |
| `/shares` | GET | 获取文件共享列表 |
| `/shares` | POST | 创建文件共享 |
| `/shares/{id}` | GET | 获取文件共享详情 |
| `/shares/{id}` | PUT | 更新文件共享配置 |
| `/shares/{id}` | DELETE | 删除文件共享 |
| `/shares/{id}/enable` | POST | 启用文件共享 |
| `/shares/{id}/disable` | POST | 禁用文件共享 |
| `/users` | GET | 获取用户列表 |
| `/users` | POST | 创建用户 |
| `/users/{id}` | GET | 获取用户详情 |
| `/users/{id}` | PUT | 更新用户信息 |
| `/users/{id}` | DELETE | 删除用户 |

### API使用示例

#### 1. 获取NAS状态

```bash
curl -X GET http://localhost:6009/api/nas/status
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "running": true,
    "status": "online",
    "uptime": "15天 3小时 45分钟",
    "version": "DSM 7.2.1-69057 Update 3",
    "cpuUsage": 12.5,
    "memoryUsage": 45.3,
    "temperature": 42
  }
}
```

#### 2. 获取存储卷列表

```bash
curl -X GET http://localhost:6009/api/nas/volumes
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "vol1",
      "name": "Volume 1",
      "type": "Btrfs",
      "total": 16000,
      "used": 8750,
      "available": 7250,
      "health": "healthy",
      "mountPoint": "/volume1"
    }
  ]
}
```

#### 3. 创建文件共享

```bash
curl -X POST http://localhost:6009/api/nas/shares \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Backup",
    "path": "/volume1/Backup",
    "type": "smb",
    "enabled": true,
    "users": ["admin"],
    "permissions": "full"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "share3",
    "name": "Backup",
    "path": "/volume1/Backup",
    "type": "smb",
    "enabled": true,
    "users": ["admin"],
    "permissions": "full",
    "status": "active"
  }
}
```

#### 4. 创建用户

```bash
curl -X POST http://localhost:6009/api/nas/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user2",
    "email": "user2@0379.email",
    "password": "SecurePassword123!",
    "role": "user"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "user3",
    "name": "user2",
    "email": "user2@0379.email",
    "role": "user",
    "status": "active",
    "createdAt": "2026-01-25T10:35:00Z"
  }
}
```

---

## 💻 代码示例

### Python示例

#### 1. 获取NAS状态

```python
import requests

API_BASE_URL = "http://localhost:6009/api/nas"

def get_nas_status():
    """获取NAS状态"""
    try:
        response = requests.get(f"{API_BASE_URL}/status")
        response.raise_for_status()
        data = response.json()
        
        if data['success']:
            status = data['data']
            print(f"运行状态: {status['running']}")
            print(f"系统状态: {status['status']}")
            print(f"运行时间: {status['uptime']}")
            print(f"系统版本: {status['version']}")
            print(f"CPU使用率: {status['cpuUsage']}%")
            print(f"内存使用率: {status['memoryUsage']}%")
            print(f"系统温度: {status['temperature']}°C")
        else:
            print("获取NAS状态失败")
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")

if __name__ == "__main__":
    get_nas_status()
```

#### 2. 获取存储卷列表

```python
import requests

API_BASE_URL = "http://localhost:6009/api/nas"

def get_volumes():
    """获取存储卷列表"""
    try:
        response = requests.get(f"{API_BASE_URL}/volumes")
        response.raise_for_status()
        data = response.json()
        
        if data['success']:
            volumes = data['data']
            print(f"存储卷数量: {len(volumes)}")
            print()
            
            for volume in volumes:
                print(f"存储卷: {volume['name']}")
                print(f"ID: {volume['id']}")
                print(f"类型: {volume['type']}")
                print(f"总容量: {volume['total']} GB")
                print(f"已使用: {volume['used']} GB")
                print(f"可用: {volume['available']} GB")
                print(f"使用率: {volume['used'] / volume['total'] * 100:.1f}%")
                print(f"健康状态: {volume['health']}")
                print(f"挂载点: {volume['mountPoint']}")
                print()
        else:
            print("获取存储卷列表失败")
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")

if __name__ == "__main__":
    get_volumes()
```

#### 3. 创建文件共享

```python
import requests

API_BASE_URL = "http://localhost:6009/api/nas"

def create_share(name, path, share_type="smb", users=None, permissions="full"):
    """创建文件共享"""
    try:
        payload = {
            "name": name,
            "path": path,
            "type": share_type,
            "enabled": True,
            "users": users or ["admin"],
            "permissions": permissions
        }
        
        response = requests.post(
            f"{API_BASE_URL}/shares",
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        
        if data['success']:
            share = data['data']
            print(f"文件共享创建成功!")
            print(f"ID: {share['id']}")
            print(f"名称: {share['name']}")
            print(f"路径: {share['path']}")
            print(f"类型: {share['type']}")
            print(f"状态: {share['status']}")
            return share['id']
        else:
            print("创建文件共享失败")
            return None
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")
        return None

if __name__ == "__main__":
    create_share(
        name="Backup",
        path="/volume1/Backup",
        share_type="smb",
        users=["admin"],
        permissions="full"
    )
```

### JavaScript/Node.js示例

#### 1. 获取NAS状态

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:6009/api/nas';

async function getNASStatus() {
    try {
        const response = await axios.get(`${API_BASE_URL}/status`);
        const data = response.data;
        
        if (data.success) {
            const status = data.data;
            console.log(`运行状态: ${status.running}`);
            console.log(`系统状态: ${status.status}`);
            console.log(`运行时间: ${status.uptime}`);
            console.log(`系统版本: ${status.version}`);
            console.log(`CPU使用率: ${status.cpuUsage}%`);
            console.log(`内存使用率: ${status.memoryUsage}%`);
            console.log(`系统温度: ${status.temperature}°C`);
        } else {
            console.log('获取NAS状态失败');
        }
    } catch (error) {
        console.error(`请求失败: ${error.message}`);
    }
}

getNASStatus();
```

#### 2. 获取存储卷列表

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:6009/api/nas';

async function getVolumes() {
    try {
        const response = await axios.get(`${API_BASE_URL}/volumes`);
        const data = response.data;
        
        if (data.success) {
            const volumes = data.data;
            console.log(`存储卷数量: ${volumes.length}`);
            console.log();
            
            volumes.forEach(volume => {
                console.log(`存储卷: ${volume.name}`);
                console.log(`ID: ${volume.id}`);
                console.log(`类型: ${volume.type}`);
                console.log(`总容量: ${volume.total} GB`);
                console.log(`已使用: ${volume.used} GB`);
                console.log(`可用: ${volume.available} GB`);
                console.log(`使用率: ${(volume.used / volume.total * 100).toFixed(1)}%`);
                console.log(`健康状态: ${volume.health}`);
                console.log(`挂载点: ${volume.mountPoint}`);
                console.log();
            });
        } else {
            console.log('获取存储卷列表失败');
        }
    } catch (error) {
        console.error(`请求失败: ${error.message}`);
    }
}

getVolumes();
```

### React Hook示例

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:6009/api/nas';

interface NASSystemStatus {
  running: boolean;
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  version: string;
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
}

interface VolumeInfo {
  id: string;
  name: string;
  type: string;
  total: number;
  used: number;
  available: number;
  health: 'healthy' | 'warning' | 'error';
  mountPoint: string;
}

export function useNASStatus() {
  const [status, setStatus] = useState<NASSystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/status`);
      const data = response.data;
      
      if (data.success) {
        setStatus(data.data);
      } else {
        setError('获取NAS状态失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, []);

  return { status, loading, error, refetch: fetchStatus };
}

export function useVolumes() {
  const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVolumes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/volumes`);
      const data = response.data;
      
      if (data.success) {
        setVolumes(data.data);
      } else {
        setError('获取存储卷列表失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
  }, []);

  return { volumes, loading, error, refetch: fetchVolumes };
}
```

---

## 🎯 高级使用示例

### 场景1：自动化备份策略

#### 需求描述
实现自动化备份策略，定期备份重要数据到远程存储或云存储。

#### 配置步骤

**步骤1：创建备份脚本**

```bash
nano /opt/nas-ecs/scripts/nas-backup.sh
```

```bash
#!/bin/bash

BACKUP_CONFIG="/opt/nas-ecs/config/backup.conf"
LOG_FILE="/opt/nas-ecs/logs/backup.log"

source "$BACKUP_CONFIG"

create_backup() {
    local source="$1"
    local dest="$2"
    local backup_name="$3"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [BACKUP] 开始备份: $backup_name" >> "$LOG_FILE"
    
    # 使用rsync进行增量备份
    rsync -avz --delete --progress \
        "$source" \
        "$dest/$backup_name/$(date +%Y%m%d)/" \
        >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [BACKUP] 备份成功: $backup_name" >> "$LOG_FILE"
        return 0
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR [BACKUP] 备份失败: $backup_name" >> "$LOG_FILE"
        return 1
    fi
}

cleanup_old_backups() {
    local backup_dir="$1"
    local keep_days="$2"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [BACKUP] 清理旧备份: $backup_dir (保留 $keep_days 天)" >> "$LOG_FILE"
    
    # 删除超过保留天数的备份
    find "$backup_dir" -type d -mtime +$keep_days -exec rm -rf {} \;
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [BACKUP] 清理完成" >> "$LOG_FILE"
}

upload_to_cloud() {
    local backup_dir="$1"
    local cloud_path="$2"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [BACKUP] 上传到云存储: $cloud_path" >> "$LOG_FILE"
    
    # 使用rclone上传到云存储
    rclone sync "$backup_dir" "$cloud_path" \
        --progress \
        --log-file="$LOG_FILE" \
        --log-level=INFO
    
    if [ $? -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [BACKUP] 云存储上传成功" >> "$LOG_FILE"
        return 0
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR [BACKUP] 云存储上传失败" >> "$LOG_FILE"
        return 1
    fi
}

main() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [BACKUP] ========== 开始备份任务 ==========" >> "$LOG_FILE"
    
    # 备份重要数据
    create_backup "/volume1/Documents" "/volume1/Backups" "Documents"
    create_backup "/volume1/Photos" "/volume1/Backups" "Photos"
    create_backup "/volume1/Music" "/volume1/Backups" "Music"
    
    # 清理旧备份（保留30天）
    cleanup_old_backups "/volume1/Backups" 30
    
    # 上传到云存储（如果配置了）
    if [ "$CLOUD_BACKUP_ENABLED" = "1" ]; then
        upload_to_cloud "/volume1/Backups" "$CLOUD_BACKUP_PATH"
    fi
    
    # 发送备份完成通知
    if [ "$NOTIFICATION_ENABLED" = "1" ]; then
        /opt/nas-ecs/scripts/notify.sh "backup_completed" "备份任务已完成"
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [BACKUP] ========== 备份任务完成 ==========" >> "$LOG_FILE"
}

main
```

**步骤2：配置备份参数**

```bash
nano /opt/nas-ecs/config/backup.conf
```

```bash
# ======================
# 备份配置
# ======================

# 云存储配置
CLOUD_BACKUP_ENABLED="1"
CLOUD_BACKUP_PATH="remote:yyc3-backups/nas"

# 通知配置
NOTIFICATION_ENABLED="1"
NOTIFICATION_TYPE="email"

# 备份保留天数
BACKUP_RETENTION_DAYS="30"

# 备份时间
BACKUP_TIME="02:00"
```

**步骤3：创建备份定时器**

```bash
nano /etc/systemd/system/yyc3-nas-backup.service
```

```ini
[Unit]
Description=YYC³ NAS Backup Service
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/nas-ecs/scripts/nas-backup.sh
User=root
Group=root
```

```bash
nano /etc/systemd/system/yyc3-nas-backup.timer
```

```ini
[Unit]
Description=YYC³ NAS Backup Timer

[Timer]
OnCalendar=*-*-* 02:00:00
Unit=yyc3-nas-backup.service

[Install]
WantedBy=timers.target
```

**步骤4：启用备份定时器**

```bash
# 重新加载Systemd配置
systemctl daemon-reload

# 启用备份定时器
systemctl enable yyc3-nas-backup.timer

# 启动备份定时器
systemctl start yyc3-nas-backup.timer

# 查看定时器状态
systemctl status yyc3-nas-backup.timer

# 手动运行备份
/opt/nas-ecs/scripts/nas-backup.sh

# 查看备份日志
tail -f /opt/nas-ecs/logs/backup.log
```

### 场景2：存储卷监控与告警

#### 需求描述
实时监控存储卷使用情况，当存储空间不足时发送告警通知。

#### 配置步骤

**步骤1：创建存储监控脚本**

```bash
nano /opt/nas-ecs/scripts/nas-storage-monitor.sh
```

```bash
#!/bin/bash

LOG_FILE="/opt/nas-ecs/logs/storage-monitor.log"
ALERT_THRESHOLD=80
CRITICAL_THRESHOLD=90

get_storage_usage() {
    local volume="$1"
    local usage=$(df -h "$volume" | awk 'NR==2 {print $5}' | sed 's/%//')
    echo "$usage"
}

send_alert() {
    local level="$1"
    local volume="$2"
    local usage="$3"
    
    local subject="[NAS存储告警] $level - $volume"
    local message="NAS存储空间告警

级别: $level
存储卷: $volume
使用率: $usage%
时间: $(date '+%Y-%m-%d %H:%M:%S')

请及时清理存储空间或扩容。"
    
    # 发送邮件通知
    if [ "$MAIL_ENABLED" = "1" ]; then
        echo "$message" | mail -s "$subject" "$MAIL_TO"
    fi
    
    # 发送Webhook通知
    if [ "$WEBHOOK_ENABLED" = "1" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"$message\"}" \
            --silent --show-error
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN [STORAGE] 发送告警: $level - $volume ($usage%)" >> "$LOG_FILE"
}

check_storage() {
    local volumes=("/volume1" "/volume2")
    
    for volume in "${volumes[@]}"; do
        if [ -d "$volume" ]; then
            local usage=$(get_storage_usage "$volume")
            
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [STORAGE] $volume 使用率: $usage%" >> "$LOG_FILE"
            
            # 检查是否超过临界阈值
            if [ "$usage" -ge "$CRITICAL_THRESHOLD" ]; then
                send_alert "严重" "$volume" "$usage"
            # 检查是否超过告警阈值
            elif [ "$usage" -ge "$ALERT_THRESHOLD" ]; then
                send_alert "警告" "$volume" "$usage"
            fi
        fi
    done
}

generate_report() {
    local report_file="/opt/nas-ecs/reports/storage-report-$(date +%Y%m%d).txt"
    
    echo "NAS存储报告 - $(date '+%Y-%m-%d %H:%M:%S')" > "$report_file"
    echo "========================================" >> "$report_file"
    echo "" >> "$report_file"
    
    df -h | grep -E "Filesystem|volume" >> "$report_file"
    
    echo "" >> "$report_file"
    echo "详细存储信息:" >> "$report_file"
    echo "" >> "$report_file"
    
    lsblk -o NAME,SIZE,TYPE,MOUNTPOINT >> "$report_file"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [STORAGE] 生成存储报告: $report_file" >> "$LOG_FILE"
}

main() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [STORAGE] ========== 开始存储监控 ==========" >> "$LOG_FILE"
    
    # 检查存储使用情况
    check_storage
    
    # 生成存储报告
    generate_report
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [STORAGE] ========== 存储监控完成 ==========" >> "$LOG_FILE"
}

main
```

**步骤2：创建存储监控定时器**

```bash
nano /etc/systemd/system/yyc3-nas-storage-monitor.service
```

```ini
[Unit]
Description=YYC³ NAS Storage Monitor Service
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/nas-ecs/scripts/nas-storage-monitor.sh
User=root
Group=root
```

```bash
nano /etc/systemd/system/yyc3-nas-storage-monitor.timer
```

```ini
[Unit]
Description=YYC³ NAS Storage Monitor Timer

[Timer]
OnBootSec=5min
OnUnitActiveSec=30min
Unit=yyc3-nas-storage-monitor.service

[Install]
WantedBy=timers.target
```

**步骤3：启用存储监控定时器**

```bash
# 重新加载Systemd配置
systemctl daemon-reload

# 启用存储监控定时器
systemctl enable yyc3-nas-storage-monitor.timer

# 启动存储监控定时器
systemctl start yyc3-nas-storage-monitor.timer

# 查看定时器状态
systemctl status yyc3-nas-storage-monitor.timer

# 手动运行存储监控
/opt/nas-ecs/scripts/nas-storage-monitor.sh

# 查看存储监控日志
tail -f /opt/nas-ecs/logs/storage-monitor.log
```

### 场景3：文件共享权限管理

#### 需求描述
自动化管理文件共享权限，根据用户组动态调整访问权限。

#### 配置步骤

**步骤1：创建权限管理脚本**

```bash
nano /opt/nas-ecs/scripts/nas-permission-manager.sh
```

```bash
#!/bin/bash

LOG_FILE="/opt/nas-ecs/logs/permission-manager.log"

set_share_permissions() {
    local share_path="$1"
    local group="$2"
    local permissions="$3"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERMISSION] 设置共享权限: $share_path -> $group:$permissions" >> "$LOG_FILE"
    
    # 设置目录权限
    chown -R :"$group" "$share_path"
    chmod -R "$permissions" "$share_path"
    
    # 设置SGID位，确保新文件继承组权限
    find "$share_path" -type d -exec chmod g+s {} \;
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERMISSION] 权限设置完成" >> "$LOG_FILE"
}

apply_permission_policy() {
    local policy_file="$1"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERMISSION] 应用权限策略: $policy_file" >> "$LOG_FILE"
    
    while IFS=, read -r share_path group permissions; do
        # 跳过注释行和空行
        [[ "$share_path" =~ ^#.*$ ]] && continue
        [[ -z "$share_path" ]] && continue
        
        # 应用权限
        if [ -d "$share_path" ]; then
            set_share_permissions "$share_path" "$group" "$permissions"
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN [PERMISSION] 共享目录不存在: $share_path" >> "$LOG_FILE"
        fi
    done < "$policy_file"
}

audit_permissions() {
    local audit_file="/opt/nas-ecs/reports/permission-audit-$(date +%Y%m%d).txt"
    
    echo "NAS权限审计报告 - $(date '+%Y-%m-%d %H:%M:%S')" > "$audit_file"
    echo "========================================" >> "$audit_file"
    echo "" >> "$audit_file"
    
    # 检查共享目录权限
    find /volume1 -type d -name "shared*" -exec ls -ld {} \; >> "$audit_file"
    
    echo "" >> "$audit_file"
    echo "异常权限检查:" >> "$audit_file"
    echo "" >> "$audit_file"
    
    # 检查权限过宽的目录
    find /volume1 -type d -perm 777 >> "$audit_file"
    
    # 检查无组权限的目录
    find /volume1 -type d ! -perm -g=rwx >> "$audit_file"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERMISSION] 生成权限审计报告: $audit_file" >> "$LOG_FILE"
}

fix_permission_issues() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERMISSION] 修复权限问题" >> "$LOG_FILE"
    
    # 修复权限过宽的目录
    find /volume1 -type d -perm 777 -exec chmod 775 {} \;
    
    # 修复无组权限的目录
    find /volume1 -type d ! -perm -g=rwx -exec chmod g+rx {} \;
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERMISSION] 权限修复完成" >> "$LOG_FILE"
}

main() {
    case "$1" in
        apply)
            apply_permission_policy "$2"
            ;;
        audit)
            audit_permissions
            ;;
        fix)
            fix_permission_issues
            ;;
        *)
            echo "Usage: $0 {apply|audit|fix} [policy_file]"
            exit 1
            ;;
    esac
}

main "$@"
```

**步骤2：创建权限策略文件**

```bash
nano /opt/nas-ecs/config/permission-policy.conf
```

```bash
# ======================
# 文件共享权限策略
# ======================
# 格式: 共享路径,用户组,权限

# Documents共享 - 管理员组完全访问
/volume1/Documents/shared,admin,770

# Photos共享 - 家庭组读写访问
/volume1/Photos/shared,family,775

# Music共享 - 所有用户只读访问
/volume1/Music/shared,users,755

# Backup共享 - 管理员组完全访问
/volume1/Backup/shared,admin,770
```

**步骤3：应用权限策略**

```bash
# 应用权限策略
/opt/nas-ecs/scripts/nas-permission-manager.sh apply /opt/nas-ecs/config/permission-policy.conf

# 审计权限
/opt/nas-ecs/scripts/nas-permission-manager.sh audit

# 修复权限问题
/opt/nas-ecs/scripts/nas-permission-manager.sh fix

# 查看权限管理日志
tail -f /opt/nas-ecs/logs/permission-manager.log
```

### 场景4：文件同步与镜像

#### 需求描述
实现多台NAS之间的文件同步和镜像，确保数据一致性。

#### 配置步骤

**步骤1：创建文件同步脚本**

```bash
nano /opt/nas-ecs/scripts/nas-sync.sh
```

```bash
#!/bin/bash

LOG_FILE="/opt/nas-ecs/logs/sync.log"
SYNC_CONFIG="/opt/nas-ecs/config/sync.conf"

source "$SYNC_CONFIG"

sync_to_remote() {
    local source="$1"
    local remote_host="$2"
    local remote_path="$3"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [SYNC] 开始同步: $source -> $remote_host:$remote_path" >> "$LOG_FILE"
    
    # 使用rsync同步文件
    rsync -avz --delete --progress \
        -e "ssh -p $SSH_PORT -i $SSH_KEY" \
        "$source" \
        "$SSH_USER@$remote_host:$remote_path" \
        >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [SYNC] 同步成功: $source" >> "$LOG_FILE"
        return 0
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR [SYNC] 同步失败: $source" >> "$LOG_FILE"
        return 1
    fi
}

sync_from_remote() {
    local remote_host="$1"
    local remote_path="$2"
    local dest="$3"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [SYNC] 开始同步: $remote_host:$remote_path -> $dest" >> "$LOG_FILE"
    
    # 使用rsync同步文件
    rsync -avz --delete --progress \
        -e "ssh -p $SSH_PORT -i $SSH_KEY" \
        "$SSH_USER@$remote_host:$remote_path" \
        "$dest" \
        >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [SYNC] 同步成功: $dest" >> "$LOG_FILE"
        return 0
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR [SYNC] 同步失败: $dest" >> "$LOG_FILE"
        return 1
    fi
}

bidirectional_sync() {
    local local_path="$1"
    local remote_host="$2"
    local remote_path="$3"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [SYNC] 开始双向同步: $local_path <-> $remote_host:$remote_path" >> "$LOG_FILE"
    
    # 创建临时目录用于冲突解决
    local temp_dir="/tmp/sync-conflicts-$(date +%Y%m%d%H%M%S)"
    mkdir -p "$temp_dir"
    
    # 先从远程同步到本地
    rsync -avz --backup --backup-dir="$temp_dir" \
        -e "ssh -p $SSH_PORT -i $SSH_KEY" \
        "$SSH_USER@$remote_host:$remote_path" \
        "$local_path" \
        >> "$LOG_FILE" 2>&1
    
    # 再从本地同步到远程
    rsync -avz --backup --backup-dir="$temp_dir" \
        -e "ssh -p $SSH_PORT -i $SSH_KEY" \
        "$local_path" \
        "$SSH_USER@$remote_host:$remote_path" \
        >> "$LOG_FILE" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [SYNC] 双向同步成功" >> "$LOG_FILE"
        
        # 清理临时目录
        rm -rf "$temp_dir"
        return 0
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR [SYNC] 双向同步失败" >> "$LOG_FILE"
        return 1
    fi
}

main() {
    case "$1" in
        push)
            sync_to_remote "$2" "$REMOTE_HOST" "$REMOTE_PATH"
            ;;
        pull)
            sync_from_remote "$REMOTE_HOST" "$REMOTE_PATH" "$2"
            ;;
        bidirectional)
            bidirectional_sync "$2" "$REMOTE_HOST" "$REMOTE_PATH"
            ;;
        *)
            echo "Usage: $0 {push|pull|bidirectional} <local_path>"
            exit 1
            ;;
    esac
}

main "$@"
```

**步骤2：配置同步参数**

```bash
nano /opt/nas-ecs/config/sync.conf
```

```bash
# ======================
# 文件同步配置
# ======================

# 远程NAS配置
REMOTE_HOST="192.168.3.46"
SSH_USER="admin"
SSH_PORT="22"
SSH_KEY="/root/.ssh/id_rsa"

# 同步路径
REMOTE_PATH="/volume1/Sync"
```

**步骤3：执行文件同步**

```bash
# 推送到远程NAS
/opt/nas-ecs/scripts/nas-sync.sh push /volume1/Documents

# 从远程NAS拉取
/opt/nas-ecs/scripts/nas-sync.sh pull /volume1/Documents

# 双向同步
/opt/nas-ecs/scripts/nas-sync.sh bidirectional /volume1/Documents

# 查看同步日志
tail -f /opt/nas-ecs/logs/sync.log
```

### 场景5：文件去重与清理

#### 需求描述
自动检测和清理重复文件，优化存储空间使用。

#### 配置步骤

**步骤1：创建文件去重脚本**

```bash
nano /opt/nas-ecs/scripts/nas-dedup.sh
```

```bash
#!/bin/bash

LOG_FILE="/opt/nas-ecs/logs/dedup.log"
REPORT_FILE="/opt/nas-ecs/reports/dedup-report-$(date +%Y%m%d).txt"

find_duplicates() {
    local search_path="$1"
    local min_size="$2"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DEDUP] 查找重复文件: $search_path (最小大小: ${min_size}MB)" >> "$LOG_FILE"
    
    # 使用fdupes查找重复文件
    fdupes -r -S "$min_size" "$search_path" > /tmp/duplicates.txt
    
    local duplicate_count=$(grep -c "^$" /tmp/duplicates.txt)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DEDUP] 发现 $duplicate_count 组重复文件" >> "$LOG_FILE"
    
    cat /tmp/duplicates.txt
}

generate_dedup_report() {
    local search_path="$1"
    
    echo "文件去重报告 - $(date '+%Y-%m-%d %H:%M:%S')" > "$REPORT_FILE"
    echo "========================================" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "扫描路径: $search_path" >> "$REPORT_FILE"
    echo "扫描时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "重复文件组:" >> "$REPORT_FILE"
    echo "----------------------------------------" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # 查找重复文件并生成报告
    fdupes -r "$search_path" | awk '
        /^$/ { print ""; next }
        { print "  " $0 }
    ' >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    echo "========================================" >> "$REPORT_FILE"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DEDUP] 生成去重报告: $REPORT_FILE" >> "$LOG_FILE"
}

interactive_dedup() {
    local duplicates_file="$1"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DEDUP] 开始交互式去重" >> "$LOG_FILE"`
    
    # 读取重复文件列表
    local group=1
    local files=()
    
    while IFS= read -r line; do
        if [ -z "$line" ]; then
            if [ ${#files[@]} -gt 0 ]; then
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DEDUP] 处理重复组 #$group" >> "$LOG_FILE"
                
                # 显示重复文件
                echo "重复组 #$group:"
                for i in "${!files[@]}"; do
                    echo "  [$((i+1))] ${files[$i]}"
                done
                
                # 询问用户要保留哪个文件
                echo -n "请选择要保留的文件编号 (1-${#files[@]}, 跳过按s): "
                read choice
                
                if [ "$choice" = "s" ]; then
                    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DEDUP] 跳过重复组 #$group" >> "$LOG_FILE"
                elif [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le ${#files[@]} ]; then
                    local keep_index=$((choice - 1))
                    local keep_file="${files[$keep_index]}"
                    
                    # 删除其他重复文件
                    for i in "${!files[@]}"; do
                        if [ "$i" -ne "$keep_index" ]; then
                            rm -f "${files[$i]}"
                            echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DEDUP] 删除重复文件: ${files[$i]}" >> "$LOG_FILE"
                        fi
                    done
                    
                    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DEDUP] 保留文件: $keep_file" >> "$LOG_FILE"
                fi
                
                group=$((group + 1))
                files=()
            fi
        else
            files+=("$line")
        fi
    done < "$duplicates_file"
}

auto_dedup() {
    local search_path="$1"
    local strategy="$2"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DEDUP] 开始自动去重: $strategy" >> "$LOG_FILE"
    
    # 使用fdupes查找重复文件
    fdupes -r "$search_path" | awk '
        /^$/ { 
            if (count > 1) {
                # 根据策略选择要保留的文件
                if (strategy == "newest") {
                    keep = files[1]
                    for (i = 2; i <= count; i++) {
                        if (stat(files[i], "mtime") > stat(keep, "mtime")) {
                            keep = files[i]
                        }
                    }
                } else if (strategy == "oldest") {
                    keep = files[1]
                    for (i = 2; i <= count; i++) {
                        if (stat(files[i], "mtime") < stat(keep, "mtime")) {
                            keep = files[i]
                        }
                    }
                } else if (strategy == "largest") {
                    keep = files[1]
                    for (i = 2; i <= count; i++) {
                        if (stat(files[i], "size") > stat(keep, "size")) {
                            keep = files[i]
                        }
                    }
                } else if (strategy == "smallest") {
                    keep = files[1]
                    for (i = 2; i <= count; i++) {
                        if (stat(files[i], "size") < stat(keep, "size")) {
                            keep = files[i]
                        }
                    }
                }
                
                # 删除其他重复文件
                for (i = 1; i <= count; i++) {
                    if (files[i] != keep) {
                        system("rm -f \"" files[i] "\"")
                        print "删除: " files[i]
                    }
                }
                print "保留: " keep
                print ""
            }
            count = 0
            delete files
            next
        }
        {
            count++
            files[count] = $0
        }
    ' strategy="$strategy"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DEDUP] 自动去重完成" >> "$LOG_FILE"
}

main() {
    case "$1" in
        find)
            find_duplicates "$2" "${3:-1}"
            ;;
        report)
            generate_dedup_report "$2"
            ;;
        interactive)
            find_duplicates "$2" "${3:-1}" > /tmp/duplicates.txt
            interactive_dedup /tmp/duplicates.txt
            ;;
        auto)
            auto_dedup "$2" "$3"
            ;;
        *)
            echo "Usage: $0 {find|report|interactive|auto} <search_path> [min_size|strategy]"
            echo ""
            echo "示例:"
            echo "  $0 find /volume1/Documents 10      # 查找大于10MB的重复文件"
            echo "  $0 report /volume1/Documents       # 生成去重报告"
            echo "  $0 interactive /volume1/Documents # 交互式去重"
            echo "  $0 auto /volume1/Documents newest # 自动去重（保留最新的）"
            echo ""
            echo "自动去重策略:"
            echo "  newest   - 保留最新的文件"
            echo "  oldest   - 保留最旧的文件"
            echo "  largest  - 保留最大的文件"
            echo "  smallest - 保留最小的文件"
            exit 1
            ;;
    esac
}

main "$@"
```

**步骤2：执行文件去重**

```bash
# 查找重复文件（大于10MB）
/opt/nas-ecs/scripts/nas-dedup.sh find /volume1/Documents 10

# 生成去重报告
/opt/nas-ecs/scripts/nas-dedup.sh report /volume1/Documents

# 交互式去重
/opt/nas-ecs/scripts/nas-dedup.sh interactive /volume1/Documents 10

# 自动去重（保留最新的文件）
/opt/nas-ecs/scripts/nas-dedup.sh auto /volume1/Documents newest

# 查看去重日志
tail -f /opt/nas-ecs/logs/dedup.log

# 查看去重报告
cat /opt/nas-ecs/reports/dedup-report-$(date +%Y%m%d).txt
```

---

## 🔍 故障排除

### 常见问题

#### 1. NAS服务无法启动

**问题**: NAS服务启动失败

**解决方案**:

```bash
# 检查NAS服务状态
systemctl status nas-api.service

# 查看服务日志
journalctl -u nas-api.service -n 50

# 检查端口占用
netstat -tln | grep 6009

# 重启服务
systemctl restart nas-api.service
```

#### 2. 存储卷无法访问

**问题**: 存储卷无法访问或显示错误

**解决方案**:

```bash
# 检查存储卷状态
curl -X GET http://localhost:6009/api/nas/volumes

# 检查存储卷健康状态
curl -X GET http://localhost:6009/api/nas/volumes/vol1

# 查看系统日志
journalctl -u nas-api.service | grep -i volume

# 检查磁盘状态
lsblk
df -h
```

#### 3. 文件共享无法连接

**问题**: 无法连接到文件共享

**解决方案**:

```bash
# 检查文件共享状态
curl -X GET http://localhost:6009/api/nas/shares

# 检查文件共享是否启用
curl -X GET http://localhost:6009/api/nas/shares/share1

# 测试SMB连接
smbclient -L //nas.0379.email -U admin

# 测试NFS连接
showmount -e nas.0379.email

# 重启SMB服务
systemctl restart smbd.service
```

#### 4. 用户无法登录

**问题**: 用户无法登录NAS

**解决方案**:

```bash
# 检查用户状态
curl -X GET http://localhost:6009/api/nas/users

# 检查用户详情
curl -X GET http://localhost:6009/api/nas/users/user1

# 重置用户密码
curl -X PUT http://localhost:6009/api/nas/users/user1/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NewSecurePassword123!"
  }'

# 查看认证日志
journalctl -u nas-api.service | grep -i auth
```

### 诊断工具

#### 系统状态检查

```bash
# 检查系统状态
curl -X GET http://localhost:6009/api/nas/status

# 检查系统信息
curl -X GET http://localhost:6009/api/nas/info
```

#### 存储诊断

```bash
# 检查存储卷列表
curl -X GET http://localhost:6009/api/nas/volumes

# 检查存储卷详情
curl -X GET http://localhost:6009/api/nas/volumes/vol1

# 检查磁盘健康状态
smartctl -a /dev/sda
```

#### 网络诊断

```bash
# 检查网络连接
ping nas.0379.email

# 检查端口连接
telnet nas.0379.email 6009

# 检查DNS解析
nslookup nas.0379.email

# 检查防火墙
firewall-cmd --list-all | grep 6009
```

---

## 📚 最佳实践

### 安全建议

1. **使用强密码**:
   - 为所有用户设置强密码
   - 定期更换密码
   - 启用双因素认证

2. **限制访问权限**:
   - 为用户分配最小必要权限
   - 定期审核用户权限
   - 禁用未使用的账户

3. **启用加密**:
   - 使用HTTPS访问Web界面
   - 启用SMB加密
   - 使用VPN远程访问

### 性能优化

1. **合理规划存储**:
   - 根据使用需求选择RAID级别
   - 定期清理无用文件
   - 监控存储使用情况

2. **优化文件共享**:
   - 合理设置共享权限
   - 避免过多小文件
   - 使用适当的文件系统

3. **监控系统性能**:
   - 定期检查CPU和内存使用率
   - 监控磁盘IO性能
   - 设置性能告警

### 备份建议

1. **定期备份**:
   - 设置自动备份任务
   - 备份重要数据到多个位置
   - 测试备份恢复流程

2. **备份策略**:
   - 全量备份 + 增量备份
   - 保留多个备份版本
   - 异地备份重要数据

3. **备份验证**:
   - 定期验证备份完整性
   - 测试备份恢复流程
   - 记录备份日志

### 监控建议

1. **监控存储使用**:
   - 设置存储使用率告警
   - 监控存储卷健康状态
   - 定期检查磁盘错误

2. **监控系统性能**:
   - 监控CPU和内存使用率
   - 监控网络流量
   - 监控系统温度

3. **监控服务状态**:
   - 监控NAS服务状态
   - 监控文件共享状态
   - 设置服务异常告警

---

## 📞 联系方式

如有问题，请检查日志文件或联系系统管理员。

- **服务器IP**: SERVER_IP_PLACEHOLDER
- **域名**: nas.0379.email
- **部署时间**: 2026-01-25

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
