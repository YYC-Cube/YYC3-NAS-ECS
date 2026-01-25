# YYC³ NAS-ECS NAS管理使用指南

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
9. [故障排除](#故障排除)
10. [最佳实践](#最佳实践)

---

## 🚀 快速入门

### 1. 访问NAS管理界面

- **Web界面**: <https://nas.0379.email>
- **API服务**: <http://localhost:6004>
- **健康检查**: <http://nas.0379.email/health>

### 2. 查看NAS状态

#### 方法1：通过Web界面

1. 访问NAS管理界面: <https://nas.0379.email>
2. 查看"系统状态"卡片
3. 查看运行状态、CPU使用率、内存使用率等信息

#### 方法2：通过API

```bash
# 获取NAS状态
curl -X GET http://localhost:6004/api/nas/status

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
curl -X GET http://localhost:6004/api/nas/volumes

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
curl -X GET http://localhost:6004/api/nas/shares

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
│  (Flask/6004)  │
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
curl -X GET http://localhost:6004/api/nas/status
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
curl -X POST http://localhost:6004/api/nas/start

# 响应示例
{
  "success": true,
  "message": "NAS服务已启动"
}

# 停止NAS服务
curl -X POST http://localhost:6004/api/nas/stop

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
curl -X POST http://localhost:6004/api/nas/restart

# 响应示例
{
  "success": true,
  "message": "NAS服务正在重启"
}
```

### 系统信息查询

```bash
# 获取系统信息
curl -X GET http://localhost:6004/api/nas/info

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
curl -X GET http://localhost:6004/api/nas/volumes
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
curl -X GET http://localhost:6004/api/nas/volumes/vol1

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
curl -X POST http://localhost:6004/api/nas/volumes \
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
curl -X DELETE http://localhost:6004/api/nas/volumes/vol3

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
curl -X POST http://localhost:6004/api/nas/volumes/vol1/expand \
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
curl -X GET http://localhost:6004/api/nas/shares
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
curl -X POST http://localhost:6004/api/nas/shares \
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
curl -X PUT http://localhost:6004/api/nas/shares/share1 \
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
curl -X DELETE http://localhost:6004/api/nas/shares/share1

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
curl -X POST http://localhost:6004/api/nas/shares/share1/enable

# 响应示例
{
  "success": true,
  "message": "文件共享已启用"
}

# 禁用文件共享
curl -X POST http://localhost:6004/api/nas/shares/share1/disable

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
curl -X GET http://localhost:6004/api/nas/users
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
curl -X POST http://localhost:6004/api/nas/users \
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
curl -X PUT http://localhost:6004/api/nas/users/user2 \
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
curl -X DELETE http://localhost:6004/api/nas/users/user2

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

- **Base URL**: `http://localhost:6004/api/nas`
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
curl -X GET http://localhost:6004/api/nas/status
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
curl -X GET http://localhost:6004/api/nas/volumes
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
curl -X POST http://localhost:6004/api/nas/shares \
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
curl -X POST http://localhost:6004/api/nas/users \
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

API_BASE_URL = "http://localhost:6004/api/nas"

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

API_BASE_URL = "http://localhost:6004/api/nas"

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

API_BASE_URL = "http://localhost:6004/api/nas"

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

const API_BASE_URL = 'http://localhost:6004/api/nas';

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

const API_BASE_URL = 'http://localhost:6004/api/nas';

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

const API_BASE_URL = 'http://localhost:6004/api/nas';

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
netstat -tln | grep 6004

# 重启服务
systemctl restart nas-api.service
```

#### 2. 存储卷无法访问

**问题**: 存储卷无法访问或显示错误

**解决方案**:

```bash
# 检查存储卷状态
curl -X GET http://localhost:6004/api/nas/volumes

# 检查存储卷健康状态
curl -X GET http://localhost:6004/api/nas/volumes/vol1

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
curl -X GET http://localhost:6004/api/nas/shares

# 检查文件共享是否启用
curl -X GET http://localhost:6004/api/nas/shares/share1

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
curl -X GET http://localhost:6004/api/nas/users

# 检查用户详情
curl -X GET http://localhost:6004/api/nas/users/user1

# 重置用户密码
curl -X PUT http://localhost:6004/api/nas/users/user1/reset-password \
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
curl -X GET http://localhost:6004/api/nas/status

# 检查系统信息
curl -X GET http://localhost:6004/api/nas/info
```

#### 存储诊断

```bash
# 检查存储卷列表
curl -X GET http://localhost:6004/api/nas/volumes

# 检查存储卷详情
curl -X GET http://localhost:6004/api/nas/volumes/vol1

# 检查磁盘健康状态
smartctl -a /dev/sda
```

#### 网络诊断

```bash
# 检查网络连接
ping nas.0379.email

# 检查端口连接
telnet nas.0379.email 6004

# 检查DNS解析
nslookup nas.0379.email

# 检查防火墙
firewall-cmd --list-all | grep 6004
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

- **服务器IP**: 8.152.195.33
- **域名**: nas.0379.email
- **部署时间**: 2026-01-25

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
