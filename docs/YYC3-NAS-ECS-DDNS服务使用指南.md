# YYC³ NAS-ECS DDNS服务使用指南

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
2. [DDNS服务概述](#ddns服务概述)
3. [阿里云DDNS配置](#阿里云ddns配置)
4. [域名管理](#域名管理)
5. [IP更新机制](#ip更新机制)
6. [监控和告警](#监控和告警)
7. [API使用示例](#api使用示例)
8. [代码示例](#代码示例)
9. [高级使用示例](#高级使用示例)
10. [故障排除](#故障排除)
11. [最佳实践](#最佳实践)

---

## 🚀 快速入门

### 1. 配置阿里云Access Key

#### 步骤1：获取阿里云Access Key

1. 登录阿里云控制台
2. 进入"AccessKey管理"页面
3. 创建或查看AccessKey ID和Secret
4. 确保AccessKey有DNS修改权限

#### 步骤2：配置DDNS服务

```bash
# 运行配置向导
/opt/yyc3/scripts/configure-ddns.sh

# 或手动编辑配置文件
nano /opt/yyc3/config/ddns.conf
```

#### 步骤3：编辑配置文件

```bash
# DDNS 配置文件
# 更新时间: 2026-01-25

# ======================
# 阿里云配置
# ======================
# 请替换为您的阿里云Access Key
ALIYUN_ACCESS_KEY_ID="your-access-key-id"
ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"

# ======================
# 域名配置
# ======================
# 主域名（注意：不要带www）
DOMAIN="0379.email"
# 子域名（如果要更新根域名记录，使用 @）
SUB_DOMAIN="ddns"
# 记录类型（A记录或AAAA记录）
RECORD_TYPE="A"
# TTL时间（单位：秒）
TTL="600"

# ======================
# 服务配置
# ======================
# 检查公网IP的服务（支持多个，空格分隔）
IP_CHECK_SERVICES="ifconfig.me ipinfo.io/ip api.ipify.org"
# 检查间隔（单位：秒）
CHECK_INTERVAL="300"
# 是否启用通知（0=禁用，1=启用）
ENABLE_NOTIFICATION="0"

# ======================
# 日志配置
# ======================
# 日志文件路径
LOG_FILE="/opt/yyc3/logs/ddns.log"
# 日志级别（debug, info, warning, error）
LOG_LEVEL="info"
```

### 2. 启动服务

```bash
# 启动所有服务
systemctl start ddns-api.service
systemctl start nginx

# 启用开机自启
systemctl enable ddns-api.service
systemctl enable nginx
```

### 3. 测试DDNS功能

```bash
# 手动运行DDNS脚本
/opt/yyc3/scripts/ddns.sh

# 测试Web界面
curl -s http://127.0.0.1 | grep -q "DDNS" && echo "Web界面正常"
```

### 4. 访问管理界面

- **Web界面**: <https://ddns.0379.email>
- **API服务**: <http://127.0.0.1:8080>
- **健康检查**: <http://ddns.0379.email/api/ddns/health>

---

## 📖 DDNS服务概述

### 什么是DDNS？

DDNS（Dynamic DNS）是一种将动态IP地址映射到固定域名的服务。当您的公网IP地址发生变化时，DDNS服务会自动更新DNS记录，确保域名始终指向正确的IP地址。

### YYC³ DDNS服务特点

- ✅ **自动更新**: 每5分钟自动检查并更新IP地址
- ✅ **多域名支持**: 支持同时管理多个域名
- ✅ **Web管理界面**: 提供友好的Web管理界面
- ✅ **RESTful API**: 提供完整的RESTful API接口
- ✅ **监控告警**: 实时监控DDNS状态，支持告警通知
- ✅ **日志记录**: 详细的日志记录，便于故障排查
- ✅ **高可用**: 支持多IP检查服务，确保可靠性

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
│  (Flask/8080)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DDNS脚本       │
│  (Bash/Timer)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  阿里云DNS API  │
└─────────────────┘
```

---

## 🔧 阿里云DDNS配置

### 获取阿里云Access Key

#### 步骤1：登录阿里云控制台

1. 访问阿里云控制台: <https://console.aliyun.com>
2. 登录您的阿里云账号

#### 步骤2：创建Access Key

1. 点击右上角头像 → "AccessKey管理"
2. 点击"创建AccessKey"
3. 选择"继续使用AccessKey"
4. 记录AccessKey ID和AccessKey Secret
5. **重要**: AccessKey Secret只显示一次，请妥善保存

#### 步骤3：授权DNS权限

1. 进入"访问控制" → "用户管理"
2. 找到创建的AccessKey用户
3. 点击"添加权限"
4. 搜索并添加以下权限:
   - `AliyunDNSFullAccess`: 完整的DNS管理权限
   - 或 `AliyunDNSReadOnlyAccess`: 只读权限（用于测试）

### 配置DDNS服务

#### 方法1：使用配置向导（推荐）

```bash
# 运行配置向导
/opt/yyc3/scripts/configure-ddns.sh

# 按照提示输入配置信息
# 1. 输入阿里云Access Key ID
# 2. 输入阿里云Access Key Secret
# 3. 输入主域名（如：0379.email）
# 4. 输入子域名（如：ddns）
# 5. 选择记录类型（A记录或AAAA记录）
# 6. 设置TTL时间（默认600秒）
# 7. 设置检查间隔（默认300秒）
```

#### 方法2：手动编辑配置文件

```bash
# 编辑配置文件
nano /opt/yyc3/config/ddns.conf

# 修改以下配置项
ALIYUN_ACCESS_KEY_ID="your-access-key-id"
ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
DOMAIN="0379.email"
SUB_DOMAIN="ddns"
RECORD_TYPE="A"
TTL="600"
CHECK_INTERVAL="300"
```

### 验证配置

```bash
# 测试DDNS脚本（不实际更新DNS）
/opt/yyc3/scripts/ddns.sh test

# 检查配置文件
cat /opt/yyc3/config/ddns.conf | grep -v "^#"

# 查看DDNS日志
tail -f /opt/yyc3/logs/ddns.log
```

---

## 🌐 域名管理

### 添加新域名

#### 方法1：通过Web界面

1. 访问Web管理界面: <https://ddns.0379.email>
2. 点击"添加域名"按钮
3. 填写域名信息:
   - 主域名（如：0379.email）
   - 子域名（如：ddns）
   - 记录类型（A记录或AAAA记录）
   - TTL时间（默认600秒）
4. 点击"保存"按钮

#### 方法2：通过API

```bash
# 添加新域名
curl -X POST http://127.0.0.1:8080/api/ddns/domains \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "0379.email",
    "sub_domain": "ddns",
    "record_type": "A",
    "ttl": 600
  }'
```

#### 方法3：通过配置文件

```bash
# 编辑配置文件
nano /opt/yyc3/config/ddns.conf

# 添加新域名配置
DOMAIN_1="0379.email"
SUB_DOMAIN_1="ddns"
RECORD_TYPE_1="A"

DOMAIN_2="example.com"
SUB_DOMAIN_2="home"
RECORD_TYPE_2="A"
```

### 查看域名列表

#### 方法1：通过Web界面

1. 访问Web管理界面: <https://ddns.0379.email>
2. 查看"域名列表"页面

#### 方法2：通过API

```bash
# 获取域名列表
curl -X GET http://127.0.0.1:8080/api/ddns/domains

# 响应示例
{
  "success": true,
  "data": [
    {
      "id": 1,
      "domain": "0379.email",
      "sub_domain": "ddns",
      "record_type": "A",
      "current_ip": "8.152.195.33",
      "last_updated": "2026-01-25T10:30:00Z",
      "status": "active"
    }
  ]
}
```

### 删除域名

#### 方法1：通过Web界面

1. 访问Web管理界面: <https://ddns.0379.email>
2. 在"域名列表"页面找到要删除的域名
3. 点击"删除"按钮
4. 确认删除操作

#### 方法2：通过API

```bash
# 删除域名
curl -X DELETE http://127.0.0.1:8080/api/ddns/domains/1

# 响应示例
{
  "success": true,
  "message": "域名已删除"
}
```

### 更新域名配置

#### 方法1：通过Web界面

1. 访问Web管理界面: <https://ddns.0379.email>
2. 在"域名列表"页面找到要更新的域名
3. 点击"编辑"按钮
4. 修改域名配置
5. 点击"保存"按钮

#### 方法2：通过API

```bash
# 更新域名配置
curl -X PUT http://127.0.0.1:8080/api/ddns/domains/1 \
  -H "Content-Type: application/json" \
  -d '{
    "sub_domain": "ddns",
    "record_type": "A",
    "ttl": 300
  }'

# 响应示例
{
  "success": true,
  "message": "域名配置已更新"
}
```

---

## 🔄 IP更新机制

### 自动更新机制

DDNS服务通过Systemd定时器每5分钟自动运行一次，检查公网IP地址是否发生变化：

```bash
# 查看定时器状态
systemctl status yyc3-ddns.timer

# 查看下次运行时间
systemctl list-timers yyc3-ddns.timer

# 查看定时器日志
journalctl -u yyc3-ddns.timer -f
```

### 手动更新IP

#### 方法1：运行DDNS脚本

```bash
# 正常模式（检查IP并更新）
/opt/yyc3/scripts/ddns.sh

# 测试模式（不实际更新DNS）
/opt/yyc3/scripts/ddns.sh test

# 强制更新模式（忽略IP检查，强制更新）
/opt/yanyu/Downloads/YYC3-NAS-ECS/services/opt/yyc3/scripts/ddns.sh force
```

#### 方法2：通过API

```bash
# 手动触发IP更新
curl -X POST http://127.0.0.1:8080/api/ddns/update \
  -H "Content-Type: application/json" \
  -d '{
    "domain_id": 1,
    "force": false
  }'

# 响应示例
{
  "success": true,
  "data": {
    "old_ip": "8.152.195.33",
    "new_ip": "8.152.195.33",
    "changed": false,
    "message": "IP地址未变化，无需更新"
  }
}
```

### IP检查服务

DDNS服务支持多个IP检查服务，确保获取公网IP的可靠性：

```bash
# 配置IP检查服务
IP_CHECK_SERVICES="ifconfig.me ipinfo.io/ip api.ipify.org"

# 测试IP检查服务
curl -s ifconfig.me
curl -s ipinfo.io/ip
curl -s api.ipify.org
```

### IP更新日志

```bash
# 查看DDNS更新日志
tail -f /opt/yyc3/logs/ddns.log

# 日志示例
2026-01-25 10:30:00 INFO [DDNS] 检查公网IP: 8.152.195.33
2026-01-25 10:30:00 INFO [DDNS] 当前DNS记录IP: 8.152.195.33
2026-01-25 10:30:00 INFO [DDNS] IP地址未变化，无需更新
2026-01-25 10:35:00 INFO [DDNS] 检查公网IP: 8.152.195.34
2026-01-25 10:35:00 INFO [DDNS] 当前DNS记录IP: 8.152.195.33
2026-01-25 10:35:00 INFO [DDNS] IP地址已变化，开始更新DNS记录
2026-01-25 10:35:01 INFO [DDNS] DNS记录更新成功: ddns.0379.email -> 8.152.195.34
```

---

## 📊 监控和告警

### 监控DDNS状态

#### 方法1：通过Web界面

1. 访问Web管理界面: <https://ddns.0379.email>
2. 查看"监控"页面

#### 方法2：通过API

```bash
# 获取DDNS状态
curl -X GET http://127.0.0.1:8080/api/ddns/status

# 响应示例
{
  "success": true,
  "data": {
    "status": "online",
    "current_ip": "8.152.195.33",
    "last_updated": "2026-01-25T10:30:00Z",
    "next_update": "2026-01-25T10:35:00Z",
    "domains": [
      {
        "domain": "0379.email",
        "sub_domain": "ddns",
        "record_type": "A",
        "current_ip": "8.152.195.33",
        "status": "active"
      }
    ]
  }
}
```

#### 方法3：通过健康检查

```bash
# 健康检查
curl -X GET http://ddns.0379.email/api/ddns/health

# 响应示例
{
  "status": "healthy",
  "timestamp": "2026-01-25T10:30:00Z",
  "services": {
    "ddns": "running",
    "api": "running",
    "nginx": "running"
  }
}
```

### 配置告警

#### 启用邮件通知

```bash
# 编辑配置文件
nano /opt/yyc3/config/ddns.conf

# 启用邮件通知
ENABLE_NOTIFICATION="1"

# 配置邮件服务器
MAIL_ENABLED="1"
MAIL_SERVER="smtp.example.com"
MAIL_PORT="587"
MAIL_USER="your-email@example.com"
MAIL_PASSWORD="your-password"
MAIL_TO="admin@example.com"
```

#### 告警类型

- **IP地址变化告警**: 当IP地址发生变化时发送通知
- **DNS更新失败告警**: 当DNS记录更新失败时发送通知
- **服务异常告警**: 当DDNS服务异常时发送通知

### 查看告警历史

```bash
# 通过API获取告警列表
curl -X GET http://127.0.0.1:8080/api/ddns/alerts

# 响应示例
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "ip_changed",
      "message": "IP地址已变化: 8.152.195.33 -> 8.152.195.34",
      "timestamp": "2026-01-25T10:35:00Z",
      "resolved": true
    }
  ]
}
```

---

## 🔌 API使用示例

### API概述

YYC³ DDNS服务提供完整的RESTful API接口，支持域名管理、IP更新、监控查询等功能。

### API基础信息

- **Base URL**: `http://127.0.0.1:8080/api/ddns`
- **认证方式**: API Key（可选）
- **数据格式**: JSON
- **字符编码**: UTF-8

### API端点列表

| 端点 | 方法 | 描述 |
|------|------|------|
| `/status` | GET | 获取DDNS状态 |
| `/health` | GET | 健康检查 |
| `/domains` | GET | 获取域名列表 |
| `/domains` | POST | 添加新域名 |
| `/domains/{id}` | GET | 获取域名详情 |
| `/domains/{id}` | PUT | 更新域名配置 |
| `/domains/{id}` | DELETE | 删除域名 |
| `/update` | POST | 手动触发IP更新 |
| `/records` | GET | 获取DNS记录列表 |
| `/alerts` | GET | 获取告警列表 |
| `/alerts/{id}/resolve` | POST | 解决告警 |

### API使用示例

#### 1. 获取DDNS状态

```bash
curl -X GET http://127.0.0.1:8080/api/ddns/status
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "online",
    "current_ip": "8.152.195.33",
    "last_updated": "2026-01-25T10:30:00Z",
    "next_update": "2026-01-25T10:35:00Z",
    "domains": [
      {
        "domain": "0379.email",
        "sub_domain": "ddns",
        "record_type": "A",
        "current_ip": "8.152.195.33",
        "status": "active"
      }
    ]
  }
}
```

#### 2. 添加新域名

```bash
curl -X POST http://127.0.0.1:8080/api/ddns/domains \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "0379.email",
    "sub_domain": "ddns",
    "record_type": "A",
    "ttl": 600
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "domain": "0379.email",
    "sub_domain": "ddns",
    "record_type": "A",
    "ttl": 600,
    "current_ip": "8.152.195.33",
    "status": "active",
    "created_at": "2026-01-25T10:30:00Z"
  }
}
```

#### 3. 更新域名配置

```bash
curl -X PUT http://127.0.0.1:8080/api/ddns/domains/1 \
  -H "Content-Type: application/json" \
  -d '{
    "sub_domain": "ddns",
    "record_type": "A",
    "ttl": 300
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "domain": "0379.email",
    "sub_domain": "ddns",
    "record_type": "A",
    "ttl": 300,
    "current_ip": "8.152.195.33",
    "status": "active",
    "updated_at": "2026-01-25T10:35:00Z"
  }
}
```

#### 4. 手动触发IP更新

```bash
curl -X POST http://127.0.0.1:8080/api/ddns/update \
  -H "Content-Type: application/json" \
  -d '{
    "domain_id": 1,
    "force": false
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "old_ip": "8.152.195.33",
    "new_ip": "8.152.195.34",
    "changed": true,
    "message": "DNS记录更新成功: ddns.0379.email -> 8.152.195.34"
  }
}
```

#### 5. 获取告警列表

```bash
curl -X GET http://127.0.0.1:8080/api/ddns/alerts
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "ip_changed",
      "message": "IP地址已变化: 8.152.195.33 -> 8.152.195.34",
      "timestamp": "2026-01-25T10:35:00Z",
      "resolved": true
    }
  ]
}
```

---

## 💻 代码示例

### Python示例

#### 1. 获取DDNS状态

```python
import requests

API_BASE_URL = "http://127.0.0.1:8080/api/ddns"

def get_ddns_status():
    """获取DDNS状态"""
    try:
        response = requests.get(f"{API_BASE_URL}/status")
        response.raise_for_status()
        data = response.json()
        
        if data['success']:
            status = data['data']
            print(f"状态: {status['status']}")
            print(f"当前IP: {status['current_ip']}")
            print(f"最后更新: {status['last_updated']}")
            print(f"下次更新: {status['next_update']}")
            
            for domain in status['domains']:
                print(f"\n域名: {domain['sub_domain']}.{domain['domain']}")
                print(f"记录类型: {domain['record_type']}")
                print(f"当前IP: {domain['current_ip']}")
                print(f"状态: {domain['status']}")
        else:
            print("获取DDNS状态失败")
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")

if __name__ == "__main__":
    get_ddns_status()
```

#### 2. 添加新域名

```python
import requests

API_BASE_URL = "http://127.0.0.1:8080/api/ddns"

def add_domain(domain, sub_domain, record_type="A", ttl=600):
    """添加新域名"""
    try:
        payload = {
            "domain": domain,
            "sub_domain": sub_domain,
            "record_type": record_type,
            "ttl": ttl
        }
        
        response = requests.post(
            f"{API_BASE_URL}/domains",
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        
        if data['success']:
            domain_data = data['data']
            print(f"域名添加成功!")
            print(f"ID: {domain_data['id']}")
            print(f"域名: {domain_data['sub_domain']}.{domain_data['domain']}")
            print(f"记录类型: {domain_data['record_type']}")
            print(f"TTL: {domain_data['ttl']}")
            return domain_data['id']
        else:
            print("添加域名失败")
            return None
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")
        return None

if __name__ == "__main__":
    add_domain("0379.email", "ddns", "A", 600)
```

#### 3. 手动触发IP更新

```python
import requests

API_BASE_URL = "http://127.0.0.1:8080/api/ddns"

def update_ip(domain_id, force=False):
    """手动触发IP更新"""
    try:
        payload = {
            "domain_id": domain_id,
            "force": force
        }
        
        response = requests.post(
            f"{API_BASE_URL}/update",
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        
        if data['success']:
            update_data = data['data']
            print(f"IP更新结果: {update_data['message']}")
            print(f"旧IP: {update_data['old_ip']}")
            print(f"新IP: {update_data['new_ip']}")
            print(f"是否变化: {update_data['changed']}")
            return True
        else:
            print("IP更新失败")
            return False
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")
        return False

if __name__ == "__main__":
    update_ip(1, force=False)
```

### JavaScript/Node.js示例

#### 1. 获取DDNS状态

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:8080/api/ddns';

async function getDDNSStatus() {
    try {
        const response = await axios.get(`${API_BASE_URL}/status`);
        const data = response.data;
        
        if (data.success) {
            const status = data.data;
            console.log(`状态: ${status.status}`);
            console.log(`当前IP: ${status.current_ip}`);
            console.log(`最后更新: ${status.last_updated}`);
            console.log(`下次更新: ${status.next_update}`);
            
            status.domains.forEach(domain => {
                console.log(`\n域名: ${domain.sub_domain}.${domain.domain}`);
                console.log(`记录类型: ${domain.record_type}`);
                console.log(`当前IP: ${domain.current_ip}`);
                console.log(`状态: ${domain.status}`);
            });
        } else {
            console.log('获取DDNS状态失败');
        }
    } catch (error) {
        console.error(`请求失败: ${error.message}`);
    }
}

getDDNSStatus();
```

#### 2. 添加新域名

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:8080/api/ddns';

async function addDomain(domain, subDomain, recordType = 'A', ttl = 600) {
    try {
        const payload = {
            domain: domain,
            sub_domain: subDomain,
            record_type: recordType,
            ttl: ttl
        };
        
        const response = await axios.post(`${API_BASE_URL}/domains`, payload);
        const data = response.data;
        
        if (data.success) {
            const domainData = data.data;
            console.log('域名添加成功!');
            console.log(`ID: ${domainData.id}`);
            console.log(`域名: ${domainData.sub_domain}.${domainData.domain}`);
            console.log(`记录类型: ${domainData.record_type}`);
            console.log(`TTL: ${domainData.ttl}`);
            return domainData.id;
        } else {
            console.log('添加域名失败');
            return null;
        }
    } catch (error) {
        console.error(`请求失败: ${error.message}`);
        return null;
    }
}

addDomain('0379.email', 'ddns', 'A', 600);
```

### React Hook示例

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8080/api/ddns';

interface DDNSStatus {
  status: string;
  current_ip: string;
  last_updated: string;
  next_update: string;
  domains: Array<{
    id: number;
    domain: string;
    sub_domain: string;
    record_type: string;
    current_ip: string;
    status: string;
  }>;
}

export function useDDNSStatus() {
  const [status, setStatus] = useState<DDNSStatus | null>(null);
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
        setError('获取DDNS状态失败');
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

export function useDDNSUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateIP = async (domainId: number, force = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/update`, {
        domain_id: domainId,
        force
      });
      const data = response.data;
      
      if (data.success) {
        return data.data;
      } else {
        setError('IP更新失败');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateIP, loading, error };
}
```

---

## 🎯 高级使用示例

### 场景1：多域名DDNS配置

#### 需求描述
同时管理多个子域名，将它们都指向同一个公网IP地址。

#### 配置步骤

**步骤1：编辑配置文件**

```bash
nano /opt/yyc3/config/ddns.conf
```

**步骤2：添加多域名配置**

```bash
# ======================
# 域名配置 - 多域名模式
# ======================

# 主域名1
DOMAIN_1="0379.email"
SUB_DOMAIN_1="ddns"
RECORD_TYPE_1="A"
TTL_1="600"

# 主域名2
DOMAIN_2="0379.email"
SUB_DOMAIN_2="home"
RECORD_TYPE_2="A"
TTL_2="600"

# 主域名3
DOMAIN_3="0379.email"
SUB_DOMAIN_3="nas"
RECORD_TYPE_3="A"
TTL_3="600"

# 主域名4
DOMAIN_4="0379.email"
SUB_DOMAIN_4="api"
RECORD_TYPE_4="A"
TTL_4="300"
```

**步骤3：通过API批量添加域名**

```bash
# 添加第一个域名
curl -X POST http://127.0.0.1:8080/api/ddns/domains \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "0379.email",
    "sub_domain": "ddns",
    "record_type": "A",
    "ttl": 600
  }'

# 添加第二个域名
curl -X POST http://127.0.0.1:8080/api/ddns/domains \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "0379.email",
    "sub_domain": "home",
    "record_type": "A",
    "ttl": 600
  }'

# 添加第三个域名
curl -X POST http://127.0.0.1:8080/api/ddns/domains \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "0379.email",
    "sub_domain": "nas",
    "record_type": "A",
    "ttl": 600
  }'

# 添加第四个域名（API专用，TTL更短）
curl -X POST http://127.0.0.1:8080/api/ddns/domains \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "0379.email",
    "sub_domain": "api",
    "record_type": "A",
    "ttl": 300
  }'
```

**步骤4：验证配置**

```bash
# 查看所有域名
curl -X GET http://127.0.0.1:8080/api/ddns/domains

# 测试域名解析
nslookup ddns.0379.email
nslookup home.0379.email
nslookup nas.0379.email
nslookup api.0379.email

# 检查DDNS日志
tail -f /opt/yyc3/logs/ddns.log
```

#### Python批量管理脚本

```python
import requests

API_BASE_URL = "http://127.0.0.1:8080/api/ddns"

def add_multiple_domains(domains):
    """批量添加域名"""
    results = []
    for domain_config in domains:
        try:
            response = requests.post(
                f"{API_BASE_URL}/domains",
                json=domain_config
            )
            response.raise_for_status()
            data = response.json()
            
            if data['success']:
                results.append({
                    'domain': domain_config['sub_domain'],
                    'status': 'success',
                    'id': data['data']['id']
                })
                print(f"✓ {domain_config['sub_domain']}.{domain_config['domain']} 添加成功")
            else:
                results.append({
                    'domain': domain_config['sub_domain'],
                    'status': 'failed',
                    'error': data.get('message', 'Unknown error')
                })
                print(f"✗ {domain_config['sub_domain']}.{domain_config['domain']} 添加失败")
        except Exception as e:
            results.append({
                'domain': domain_config['sub_domain'],
                'status': 'error',
                'error': str(e)
            })
            print(f"✗ {domain_config['sub_domain']}.{domain_config['domain']} 发生错误: {e}")
    
    return results

if __name__ == "__main__":
    domains = [
        {
            "domain": "0379.email",
            "sub_domain": "ddns",
            "record_type": "A",
            "ttl": 600
        },
        {
            "domain": "0379.email",
            "sub_domain": "home",
            "record_type": "A",
            "ttl": 600
        },
        {
            "domain": "0379.email",
            "sub_domain": "nas",
            "record_type": "A",
            "ttl": 600
        },
        {
            "domain": "0379.email",
            "sub_domain": "api",
            "record_type": "A",
            "ttl": 300
        }
    ]
    
    results = add_multiple_domains(domains)
    
    print("\n批量添加结果:")
    for result in results:
        print(f"  {result['domain']}: {result['status']}")
```

### 场景2：IP变化实时监控与通知

#### 需求描述
实时监控IP地址变化，并通过多种方式发送通知（邮件、Webhook、Telegram）。

#### 配置步骤

**步骤1：启用通知功能**

```bash
nano /opt/yyc3/config/ddns.conf
```

```bash
# ======================
# 通知配置
# ======================
ENABLE_NOTIFICATION="1"

# 邮件通知
MAIL_ENABLED="1"
MAIL_SERVER="smtp.example.com"
MAIL_PORT="587"
MAIL_USER="your-email@example.com"
MAIL_PASSWORD="your-password"
MAIL_TO="admin@example.com"
MAIL_FROM="ddns@0379.email"

# Webhook通知
WEBHOOK_ENABLED="1"
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
WEBHOOK_METHOD="POST"
WEBHOOK_HEADERS='{"Content-Type": "application/json"}'

# Telegram通知
TELEGRAM_ENABLED="1"
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
```

**步骤2：创建通知脚本**

```bash
nano /opt/yyc3/scripts/ddns-notify.sh
```

```bash
#!/bin/bash

DDNS_CONFIG="/opt/yyc3/config/ddns.conf"
LOG_FILE="/opt/yyc3/logs/ddns.log"

source "$DDNS_CONFIG"

send_email_notification() {
    local subject="$1"
    local message="$2"
    
    if [ "$MAIL_ENABLED" = "1" ]; then
        echo "$message" | mail -s "$subject" -r "$MAIL_FROM" "$MAIL_TO"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [NOTIFICATION] 邮件通知已发送: $subject" >> "$LOG_FILE"
    fi
}

send_webhook_notification() {
    local message="$1"
    
    if [ "$WEBHOOK_ENABLED" = "1" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"$message\"}" \
            --silent --show-error
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [NOTIFICATION] Webhook通知已发送" >> "$LOG_FILE"
    fi
}

send_telegram_notification() {
    local message="$1"
    
    if [ "$TELEGRAM_ENABLED" = "1" ]; then
        curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d "chat_id=$TELEGRAM_CHAT_ID" \
            -d "text=$message" \
            --silent --show-error
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [NOTIFICATION] Telegram通知已发送" >> "$LOG_FILE"
    fi
}

case "$1" in
    ip_changed)
        local old_ip="$2"
        local new_ip="$3"
        local domain="$4"
        
        local subject="[DDNS] IP地址已变化 - $domain"
        local message="DDNS IP地址已变化

域名: $domain
旧IP: $old_ip
新IP: $new_ip
时间: $(date '+%Y-%m-%d %H:%M:%S')

请确认此IP变化是否正常。"
        
        send_email_notification "$subject" "$message"
        send_webhook_notification "$message"
        send_telegram_notification "$message"
        ;;
    dns_update_failed)
        local domain="$2"
        local error="$3"
        
        local subject="[DDNS] DNS更新失败 - $domain"
        local message="DDNS DNS更新失败

域名: $domain
错误: $error
时间: $(date '+%Y-%m-%d %H:%M:%S')

请检查配置和网络连接。"
        
        send_email_notification "$subject" "$message"
        send_webhook_notification "$message"
        send_telegram_notification "$message"
        ;;
    *)
        echo "Usage: $0 {ip_changed|dns_update_failed} ..."
        exit 1
        ;;
esac
```

**步骤3：修改DDNS脚本以集成通知**

```bash
nano /opt/yyc3/scripts/ddns.sh
```

在IP更新成功后添加通知调用：

```bash
# IP已变化，更新DNS记录
echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DDNS] IP地址已变化，开始更新DNS记录" >> "$LOG_FILE"

# 更新DNS记录
update_result=$(update_dns_record "$domain" "$sub_domain" "$record_type" "$current_ip" "$ttl")

if [ "$update_result" = "success" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DDNS] DNS记录更新成功: $sub_domain.$domain -> $current_ip" >> "$LOG_FILE"
    
    # 发送IP变化通知
    /opt/yyc3/scripts/ddns-notify.sh ip_changed "$old_ip" "$current_ip" "$sub_domain.$domain"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR [DDNS] DNS记录更新失败: $update_result" >> "$LOG_FILE"
    
    # 发送DNS更新失败通知
    /opt/yyc3/scripts/ddns-notify.sh dns_update_failed "$sub_domain.$domain" "$update_result"
fi
```

**步骤4：测试通知功能**

```bash
# 测试IP变化通知
/opt/yyc3/scripts/ddns-notify.sh ip_changed "8.152.195.33" "8.152.195.34" "ddns.0379.email"

# 测试DNS更新失败通知
/opt/yyc3/scripts/ddns-notify.sh dns_update_failed "ddns.0379.email" "阿里云API调用失败"

# 检查通知日志
tail -f /opt/yyc3/logs/ddns.log
```

### 场景3：故障自动恢复

#### 需求描述
当DDNS服务出现故障时，自动尝试恢复并记录故障信息。

#### 配置步骤

**步骤1：创建故障检测脚本**

```bash
nano /opt/yyc3/scripts/ddns-health-check.sh
```

```bash
#!/bin/bash

LOG_FILE="/opt/yyc3/logs/ddns.log"
MAX_RETRIES=3
RETRY_DELAY=60

check_service_status() {
    local service="$1"
    systemctl is-active --quiet "$service"
    return $?
}

check_api_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/ddns/health)
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

restart_service() {
    local service="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN [HEALTH] 尝试重启服务: $service" >> "$LOG_FILE"
    systemctl restart "$service"
    sleep 5
    check_service_status "$service"
}

check_dns_resolution() {
    local domain="$1"
    local expected_ip="$2"
    local resolved_ip=$(nslookup "$domain" | grep -A 1 "Name:" | tail -1 | awk '{print $2}')
    
    if [ "$resolved_ip" = "$expected_ip" ]; then
        return 0
    else
        return 1
    fi
}

main() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [HEALTH] 开始健康检查" >> "$LOG_FILE"
    
    local health_status="healthy"
    local issues=()
    
    # 检查DDNS服务状态
    if ! check_service_status "yyc3-ddns.timer"; then
        issues+=("DDNS定时器未运行")
        health_status="unhealthy"
        
        # 尝试重启DDNS定时器
        for i in $(seq 1 $MAX_RETRIES); do
            if restart_service "yyc3-ddns.timer"; then
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [HEALTH] DDNS定时器重启成功" >> "$LOG_FILE"
                break
            else
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR [HEALTH] DDNS定时器重启失败 (尝试 $i/$MAX_RETRIES)" >> "$LOG_FILE"
                if [ $i -lt $MAX_RETRIES ]; then
                    sleep $RETRY_DELAY
                fi
            fi
        done
    fi
    
    # 检查API服务状态
    if ! check_service_status "ddns-api.service"; then
        issues+=("API服务未运行")
        health_status="unhealthy"
        
        # 尝试重启API服务
        for i in $(seq 1 $MAX_RETRIES); do
            if restart_service "ddns-api.service"; then
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [HEALTH] API服务重启成功" >> "$LOG_FILE"
                break
            else
                echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR [HEALTH] API服务重启失败 (尝试 $i/$MAX_RETRIES)" >> "$LOG_FILE"
                if [ $i -lt $MAX_RETRIES ]; then
                    sleep $RETRY_DELAY
                fi
            fi
        done
    fi
    
    # 检查API健康端点
    if ! check_api_health; then
        issues+=("API健康检查失败")
        health_status="unhealthy"
    fi
    
    # 检查DNS解析
    local current_ip=$(curl -s ifconfig.me)
    if ! check_dns_resolution "ddns.0379.email" "$current_ip"; then
        issues+=("DNS解析不匹配")
        health_status="unhealthy"
        
        # 手动触发IP更新
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN [HEALTH] DNS解析不匹配，手动触发IP更新" >> "$LOG_FILE"
        /opt/yyc3/scripts/ddns.sh force
    fi
    
    # 输出健康检查结果
    if [ "$health_status" = "healthy" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [HEALTH] 健康检查通过" >> "$LOG_FILE"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR [HEALTH] 健康检查失败，发现问题: ${issues[*]}" >> "$LOG_FILE"
    fi
    
    return 0
}

main
```

**步骤2：创建Systemd定时器用于健康检查**

```bash
nano /etc/systemd/system/yyc3-ddns-health-check.service
```

```ini
[Unit]
Description=YYC³ DDNS Health Check Service
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/yyc3/scripts/ddns-health-check.sh
User=root
Group=root
```

```bash
nano /etc/systemd/system/yyc3-ddns-health-check.timer
```

```ini
[Unit]
Description=YYC³ DDNS Health Check Timer

[Timer]
OnBootSec=5min
OnUnitActiveSec=10min
Unit=yyc3-ddns-health-check.service

[Install]
WantedBy=timers.target
```

**步骤3：启用健康检查定时器**

```bash
# 重新加载Systemd配置
systemctl daemon-reload

# 启用健康检查定时器
systemctl enable yyc3-ddns-health-check.timer

# 启动健康检查定时器
systemctl start yyc3-ddns-health-check.timer

# 查看定时器状态
systemctl status yyc3-ddns-health-check.timer

# 查看下次运行时间
systemctl list-timers yyc3-ddns-health-check.timer
```

**步骤4：手动测试健康检查**

```bash
# 手动运行健康检查
/opt/yyc3/scripts/ddns-health-check.sh

# 查看健康检查日志
tail -f /opt/yyc3/logs/ddns.log | grep HEALTH
```

### 场景4：性能监控与优化

#### 需求描述
监控DDNS服务的性能指标，包括响应时间、成功率、更新频率等，并根据监控结果进行优化。

#### 配置步骤

**步骤1：创建性能监控脚本**

```bash
nano /opt/yyc3/scripts/ddns-performance-monitor.sh
```

```bash
#!/bin/bash

LOG_FILE="/opt/yyc3/logs/ddns.log"
METRICS_FILE="/opt/yyc3/metrics/ddns-performance.json"

measure_api_response_time() {
    local endpoint="$1"
    local start_time=$(date +%s%N)
    curl -s "$endpoint" > /dev/null
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    echo "$duration"
}

measure_dns_resolution_time() {
    local domain="$1"
    local start_time=$(date +%s%N)
    nslookup "$domain" > /dev/null
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))
    echo "$duration"
}

calculate_update_frequency() {
    local log_file="$1"
    local updates=$(grep "DNS记录更新成功" "$log_file" | wc -l)
    local time_range=$(tail -1 "$log_file" | grep -oP '\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}')
    local end_time=$(date -d "$time_range" +%s)
    local start_time=$(head -1 "$log_file" | grep -oP '\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}' | head -1)
    start_time=$(date -d "$start_time" +%s)
    local duration=$(( (end_time - start_time) / 60 ))
    local frequency=$(echo "scale=2; $updates / $duration" | bc)
    echo "$frequency"
}

calculate_success_rate() {
    local log_file="$1"
    local total=$(grep "DNS记录" "$log_file" | wc -l)
    local success=$(grep "DNS记录更新成功" "$log_file" | wc -l)
    local rate=$(echo "scale=2; $success * 100 / $total" | bc)
    echo "$rate"
}

main() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERFORMANCE] 开始性能监控" >> "$LOG_FILE"
    
    # 测量API响应时间
    local status_time=$(measure_api_response_time "http://127.0.0.1:8080/api/ddns/status")
    local health_time=$(measure_api_response_time "http://127.0.0.1:8080/api/ddns/health")
    local domains_time=$(measure_api_response_time "http://127.0.0.1:8080/api/ddns/domains")
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERFORMANCE] API响应时间 - 状态: ${status_time}ms, 健康: ${health_time}ms, 域名: ${domains_time}ms" >> "$LOG_FILE"
    
    # 测量DNS解析时间
    local dns_time=$(measure_dns_resolution_time "ddns.0379.email")
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERFORMANCE] DNS解析时间: ${dns_time}ms" >> "$LOG_FILE"
    
    # 计算更新频率
    local update_frequency=$(calculate_update_frequency "$LOG_FILE")
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERFORMANCE] IP更新频率: ${update_frequency}次/分钟" >> "$LOG_FILE"
    
    # 计算成功率
    local success_rate=$(calculate_success_rate "$LOG_FILE")
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERFORMANCE] DNS更新成功率: ${success_rate}%" >> "$LOG_FILE"
    
    # 保存性能指标到JSON文件
    cat > "$METRICS_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "api_response_time": {
    "status": $status_time,
    "health": $health_time,
    "domains": $domains_time
  },
  "dns_resolution_time": $dns_time,
  "update_frequency": $update_frequency,
  "success_rate": $success_rate
}
EOF
    
    # 性能优化建议
    if [ "$status_time" -gt 1000 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN [PERFORMANCE] API响应时间过长，建议优化API服务" >> "$LOG_FILE"
    fi
    
    if [ "$dns_time" -gt 500 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN [PERFORMANCE] DNS解析时间过长，建议更换DNS服务器" >> "$LOG_FILE"
    fi
    
    if [ "$success_rate" -lt 95 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN [PERFORMANCE] DNS更新成功率过低，建议检查网络和API配置" >> "$LOG_FILE"
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [PERFORMANCE] 性能监控完成" >> "$LOG_FILE"
}

main
```

**步骤2：创建性能监控定时器**

```bash
nano /etc/systemd/system/yyc3-ddns-performance-monitor.service
```

```ini
[Unit]
Description=YYC³ DDNS Performance Monitor Service
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/yyc3/scripts/ddns-performance-monitor.sh
User=root
Group=root
```

```bash
nano /etc/systemd/system/yyc3-ddns-performance-monitor.timer
```

```ini
[Unit]
Description=YYC³ DDNS Performance Monitor Timer

[Timer]
OnBootSec=10min
OnUnitActiveSec=30min
Unit=yyc3-ddns-performance-monitor.service

[Install]
WantedBy=timers.target
```

**步骤3：启用性能监控定时器**

```bash
# 重新加载Systemd配置
systemctl daemon-reload

# 启用性能监控定时器
systemctl enable yyc3-ddns-performance-monitor.timer

# 启动性能监控定时器
systemctl start yyc3-ddns-performance-monitor.timer

# 查看定时器状态
systemctl status yyc3-ddns-performance-monitor.timer
```

**步骤4：查看性能指标**

```bash
# 手动运行性能监控
/opt/yyc3/scripts/ddns-performance-monitor.sh

# 查看性能指标JSON文件
cat /opt/yyc3/metrics/ddns-performance.json

# 查看性能监控日志
tail -f /opt/yyc3/logs/ddns.log | grep PERFORMANCE
```

### 场景5：Webhook集成示例

#### 需求描述
将DDNS事件集成到第三方服务，如Slack、Discord、企业微信等。

#### 配置步骤

**步骤1：创建Webhook集成脚本**

```bash
nano /opt/yyc3/scripts/ddns-webhook.sh
```

```bash
#!/bin/bash

DDNS_CONFIG="/opt/yyc3/config/ddns.conf"
LOG_FILE="/opt/yyc3/logs/ddns.log"

source "$DDNS_CONFIG"

send_slack_webhook() {
    local webhook_url="$1"
    local message="$2"
    local color="$3"
    
    curl -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d "{
            \"attachments\": [{
                \"color\": \"$color\",
                \"text\": \"$message\",
                \"footer\": \"YYC³ DDNS\",
                \"ts\": $(date +%s)
            }]
        }" \
        --silent --show-error
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [WEBHOOK] Slack通知已发送" >> "$LOG_FILE"
}

send_discord_webhook() {
    local webhook_url="$1"
    local message="$2"
    local color="$3"
    
    curl -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d "{
            \"embeds\": [{
                \"description\": \"$message\",
                \"color\": $color,
                \"footer\": {
                    \"text\": \"YYC³ DDNS\"
                },
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
            }]
        }" \
        --silent --show-error
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [WEBHOOK] Discord通知已发送" >> "$LOG_FILE"
}

send_wechat_work_webhook() {
    local webhook_url="$1"
    local message="$2"
    
    curl -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d "{
            \"msgtype\": \"markdown\",
            \"markdown\": {
                \"content\": \"$message\"
            }
        }" \
        --silent --show-error
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [WEBHOOK] 企业微信通知已发送" >> "$LOG_FILE"
}

case "$1" in
    slack)
        local webhook_url="$2"
        local message="$3"
        local color="$4"
        send_slack_webhook "$webhook_url" "$message" "$color"
        ;;
    discord)
        local webhook_url="$2"
        local message="$3"
        local color="$4"
        send_discord_webhook "$webhook_url" "$message" "$color"
        ;;
    wechat)
        local webhook_url="$2"
        local message="$3"
        send_wechat_work_webhook "$webhook_url" "$message"
        ;;
    *)
        echo "Usage: $0 {slack|discord|wechat} ..."
        exit 1
        ;;
esac
```

**步骤2：配置Webhook URL**

```bash
nano /opt/yyc3/config/ddns.conf
```

```bash
# ======================
# Webhook配置
# ======================

# Slack Webhook
SLACK_WEBHOOK_ENABLED="1"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Discord Webhook
DISCORD_WEBHOOK_ENABLED="1"
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"

# 企业微信 Webhook
WECHAT_WEBHOOK_ENABLED="1"
WECHAT_WEBHOOK_URL="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY"
```

**步骤3：在DDNS脚本中集成Webhook**

```bash
nano /opt/yyc3/scripts/ddns.sh
```

在IP更新成功后添加Webhook调用：

```bash
# IP已变化，更新DNS记录
echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DDNS] IP地址已变化，开始更新DNS记录" >> "$LOG_FILE"

# 更新DNS记录
update_result=$(update_dns_record "$domain" "$sub_domain" "$record_type" "$current_ip" "$ttl")

if [ "$update_result" = "success" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO [DDNS] DNS记录更新成功: $sub_domain.$domain -> $current_ip" >> "$LOG_FILE"
    
    # 发送Slack通知（绿色表示成功）
    if [ "$SLACK_WEBHOOK_ENABLED" = "1" ]; then
        /opt/yyc3/scripts/ddns-webhook.sh slack "$SLACK_WEBHOOK_URL" \
            "DDNS IP地址已更新\n\n*域名*: $sub_domain.$domain\n*旧IP*: $old_ip\n*新IP*: $current_ip\n*时间*: $(date '+%Y-%m-%d %H:%M:%S')" \
            "good"
    fi
    
    # 发送Discord通知（绿色表示成功）
    if [ "$DISCORD_WEBHOOK_ENABLED" = "1" ]; then
        /opt/yyc3/scripts/ddns-webhook.sh discord "$DISCORD_WEBHOOK_URL" \
            "DDNS IP地址已更新\n\n**域名**: $sub_domain.$domain\n**旧IP**: $old_ip\n**新IP**: $current_ip\n**时间**: $(date '+%Y-%m-%d %H:%M:%S')" \
            "52280"
    fi
    
    # 发送企业微信通知
    if [ "$WECHAT_WEBHOOK_ENABLED" = "1" ]; then
        /opt/yyc3/scripts/ddns-webhook.sh wechat "$WECHAT_WEBHOOK_URL" \
            "## DDNS IP地址已更新\n\n> 域名：$sub_domain.$domain\n> 旧IP：$old_ip\n> 新IP：$current_ip\n> 时间：$(date '+%Y-%m-%d %H:%M:%S')"
    fi
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR [DDNS] DNS记录更新失败: $update_result" >> "$LOG_FILE"
    
    # 发送Slack通知（红色表示失败）
    if [ "$SLACK_WEBHOOK_ENABLED" = "1" ]; then
        /opt/yyc3/scripts/ddns-webhook.sh slack "$SLACK_WEBHOOK_URL" \
            "DDNS DNS更新失败\n\n*域名*: $sub_domain.$domain\n*错误*: $update_result\n*时间*: $(date '+%Y-%m-%d %H:%M:%S')" \
            "danger"
    fi
    
    # 发送Discord通知（红色表示失败）
    if [ "$DISCORD_WEBHOOK_ENABLED" = "1" ]; then
        /opt/yyc3/scripts/ddns-webhook.sh discord "$DISCORD_WEBHOOK_URL" \
            "DDNS DNS更新失败\n\n**域名**: $sub_domain.$domain\n**错误**: $update_result\n**时间**: $(date '+%Y-%m-%d %H:%M:%S')" \
            "15548997"
    fi
    
    # 发送企业微信通知
    if [ "$WECHAT_WEBHOOK_ENABLED" = "1" ]; then
        /opt/yyc3/scripts/ddns-webhook.sh wechat "$WECHAT_WEBHOOK_URL" \
            "## DDNS DNS更新失败\n\n> 域名：$sub_domain.$domain\n> 错误：$update_result\n> 时间：$(date '+%Y-%m-%d %H:%M:%S')"
    fi
fi
```

**步骤4：测试Webhook集成**

```bash
# 测试Slack Webhook
/opt/yyc3/scripts/ddns-webhook.sh slack "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
    "DDNS测试消息\n\n这是一条测试消息" "good"

# 测试Discord Webhook
/opt/yyc3/scripts/ddns-webhook.sh discord "https://discord.com/api/webhooks/YOUR/WEBHOOK/URL" \
    "DDNS测试消息\n\n这是一条测试消息" "52280"

# 测试企业微信Webhook
/opt/yyc3/scripts/ddns-webhook.sh wechat "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY" \
    "## DDNS测试消息\n\n这是一条测试消息"

# 检查Webhook日志
tail -f /opt/yyc3/logs/ddns.log | grep WEBHOOK
```

---

## 🔍 故障排除

### 常见问题

#### 1. DDNS服务无法启动

**问题**: DDNS服务启动失败

**解决方案**:

```bash
# 检查服务状态
systemctl status ddns-api.service

# 查看服务日志
journalctl -u ddns-api.service -n 50

# 检查配置文件
cat /opt/yyc3/config/ddns.conf | grep -v "^#"

# 检查端口占用
netstat -tln | grep 8080

# 重启服务
systemctl restart ddns-api.service
```

#### 2. IP地址更新失败

**问题**: IP地址无法更新到DNS记录

**解决方案**:

```bash
# 检查阿里云Access Key权限
# 确保Access Key有DNS修改权限

# 测试DDNS脚本
/opt/yyc3/scripts/ddns.sh test

# 查看DDNS日志
tail -f /opt/yyc3/logs/ddns.log

# 手动测试阿里云DNS API
aliyun alidns DescribeDomainRecords --DomainName 0379.email

# 强制更新IP
/opt/yyc3/scripts/ddns.sh force
```

#### 3. Web界面无法访问

**问题**: 无法访问Web管理界面

**解决方案**:

```bash
# 检查Nginx状态
systemctl status nginx

# 检查Nginx配置
nginx -t

# 检查端口监听
netstat -tln | grep -E ':(80|443)'

# 检查防火墙
firewall-cmd --list-all | grep -E '(http|https)'

# 查看Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 重启Nginx
systemctl restart nginx
```

#### 4. 定时器不工作

**问题**: DDNS定时器不自动运行

**解决方案**:

```bash
# 检查定时器状态
systemctl status yyc3-ddns.timer

# 查看下次运行时间
systemctl list-timers yyc3-ddns.timer

# 查看定时器日志
journalctl -u yyc3-ddns.timer -f

# 重启定时器
systemctl restart yyc3-ddns.timer

# 启用定时器
systemctl enable yyc3-ddns.timer
```

### 诊断工具

#### 系统状态检查

```bash
# 运行系统状态检查脚本
/opt/yyc3/scripts/system-status.sh
```

#### DDNS诊断

```bash
# 运行DDNS诊断脚本
/opt/yyc3/scripts/diagnose-ddns.sh
```

#### Web界面测试

```bash
# 运行Web界面测试脚本
/opt/yyc3/scripts/test-web.sh
```

### 日志分析

#### DDNS日志

```bash
# 查看DDNS日志
tail -f /opt/yyc3/logs/ddns.log

# 搜索错误日志
grep -i error /opt/yyc3/logs/ddns.log

# 搜索警告日志
grep -i warning /opt/yyc3/logs/ddns.log

# 统计更新次数
grep "DNS记录更新成功" /opt/yyc3/logs/ddns.log | wc -l
```

#### API服务日志

```bash
# 查看API服务日志
journalctl -u ddns-api.service -f

# 搜索错误日志
journalctl -u ddns-api.service | grep -i error

# 搜索警告日志
journalctl -u ddns-api.service | grep -i warning
```

#### Nginx日志

```bash
# 查看Nginx访问日志
tail -f /var/log/nginx/access.log

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log

# 统计访问次数
grep "ddns.0379.email" /var/log/nginx/access.log | wc -l
```

---

## 📚 最佳实践

### 安全建议

1. **保护Access Key**:
   - 不要将Access Key提交到版本控制系统
   - 使用环境变量或配置文件存储Access Key
   - 定期轮换Access Key

2. **使用HTTPS**:
   - 确保Web界面使用HTTPS
   - 配置SSL证书
   - 启用HSTS

3. **限制API访问**:
   - 使用API Key认证
   - 限制API访问IP
   - 实施速率限制

### 性能优化

1. **合理设置TTL**:
   - TTL设置过短会增加DNS查询压力
   - TTL设置过长会导致IP更新延迟
   - 建议TTL设置为300-600秒

2. **优化检查间隔**:
   - 检查间隔设置过短会增加服务器负载
   - 检查间隔设置过长会导致IP更新延迟
   - 建议检查间隔设置为300秒（5分钟）

3. **使用多个IP检查服务**:
   - 配置多个IP检查服务
   - 确保获取公网IP的可靠性
   - 避免单一服务故障

### 监控建议

1. **监控DDNS状态**:
   - 定期检查DDNS服务状态
   - 监控IP地址更新情况
   - 设置告警通知

2. **监控DNS记录**:
   - 定期检查DNS记录是否正确
   - 监控DNS解析延迟
   - 设置DNS记录异常告警

3. **监控服务性能**:
   - 监控API服务响应时间
   - 监控Nginx访问日志
   - 监控系统资源使用情况

### 备份建议

1. **备份配置文件**:
   ```bash
   # 备份DDNS配置
   cp /opt/yyc3/config/ddns.conf /opt/yyc3/config/ddns.conf.backup
   
   # 备份Nginx配置
   cp /etc/nginx/conf.d/ddns.conf /etc/nginx/conf.d/ddns.conf.backup
   ```

2. **备份系统配置**:
   ```bash
   # 创建完整备份
   tar -czf ddns-backup-$(date +%Y%m%d).tar.gz \
     /opt/yyc3 \
     /etc/systemd/system/ddns-api.service \
     /etc/nginx/conf.d/ddns.conf
   ```

3. **定期备份**:
   - 设置定时任务定期备份
   - 保留多个版本的备份
   - 测试备份恢复流程

---

## 📞 联系方式

如有问题，请检查日志文件或联系系统管理员。

- **服务器IP**: 8.152.195.33
- **域名**: ddns.0379.email
- **部署时间**: 2026-01-25

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
