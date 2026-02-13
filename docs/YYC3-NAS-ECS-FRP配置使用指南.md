# YYC³ NAS-ECS FRP 配置完整指南

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 📋 目录

- [FRP 概述](#frp-概述)
- [服务端口规划](#服务端口规划)
- [功能与 FRP 对应关系](#功能与-frp-对应关系)
- [FRP 配置模板](#frp-配置模板)
- [Nginx 配置](#nginx-配置)
- [配置验证](#配置验证)
- [常见问题](#常见问题)

---

## 🎯 FRP 概述

YYC³ NAS-ECS 使用 FRP (Fast Reverse Proxy) 实现内网穿透，将本地服务暴露到公网。

### FRP 架构

```
┌─────────────────┐
│   公网访问    │
│ 0379.email   │
└──────┬────────┘
       │
       │ FRP Server (SERVER_IP_PLACEHOLDER:7001)
       │
       ▼
┌──────────────────────────────────────┐
│       FRP Client (frpc.toml)     │
│       运行在您的 NAS 上           │
└──────────┬───────────────────────┘
           │
           │
   ┌───────┴────────┬────────┬─────────┐
   │               │        │         │
┌──▼──┐      ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
│ API  │      │ NAS  │  │ Mail │  │ LLM  │
│:6000 │      │:6009 │  │:6003│  │:6002 │
└──────┘      └──────┘  └──────┘  └──────┘
```

---

## 📊 服务端口规划

### 端口分配表

| 序号 | 功能模块 | 本地端口 | 子域名 | 公网地址 | 状态 |
|------|---------|----------|--------|------|
| 1 | **API 服务** | 6000 | api | https://api.0379.email | ✅ |
| 2 | **NAS 服务** | 6009 | nas | https://nas.0379.email | ✅ |
| 3 | **邮件服务** | 6003 | mail | https://mail.0379.email | ✅ |
| 4 | **LLM 服务** | 6002 | llm | https://llm.0379.email | ✅ |
| 5 | **管理后台** | 6001 | admin | https://admin.0379.email | ✅ |
| 6 | **监控面板** | 6006 | monitor | https://monitor.0379.email | ✅ |
| 7 | **DDNS 服务** | 6007 | ddns | https://ddns.0379.email | ✅ |
| 8 | **日志查看** | 6004 | logs | https://logs.0379.email | 🔴 待添加 |
| 9 | **备份恢复** | 6005 | backup | https://backup.0379.email | 🔴 待添加 |
| 10 | **AI Widget** | 6008 | widget | https://widget.0379.email | 🔴 待添加 |
| 11 | **NAS HTTPS** | 8989 | nas.0379.pro | https://nas.0379.pro | ✅ |
| 12 | **PostgreSQL** | 5432 | 54320 (TCP) | SERVER_IP_PLACEHOLDER:54320 | ✅ |

### 端口说明

#### 已配置端口 (6000-6009, 8989)
- **6000**: API 服务主端口
- **6001**: 管理后台 / 设置 / 帮助中心
- **6002**: LLM AI 服务
- **6003**: 邮件服务
- **6004**: 日志查看服务
- **6005**: 备份恢复服务
- **6006**: 监控面板 / FRP 服务
- **6007**: DDNS 服务
- **6008**: AI Widget Demo
- **6009**: NAS 服务
- **8989**: NAS HTTPS (自定义域名)
- **5432**: PostgreSQL 数据库 (TCP)

---

## 🔗 功能与 FRP 对应关系

### 完整功能映射表

| 功能模块 | FRP 配置名 | 本地端口 | 子域名 | 访问地址 |
|---------|------------|----------|--------|---------|
| **API 服务** | api-0379 | 6000 | api | https://api.0379.email |
| **邮件服务** | mail-0379 | 6003 | mail | https://mail.0379.email |
| **FRP 服务** | monitor-0379 | 6006 | monitor | https://monitor.0379.email |
| **LLM 服务** | llm-0379 | 6002 | llm | https://llm.0379.email |
| **DDNS 服务** | ddns-0379 | 6007 | ddns | https://ddns.0379.email |
| **NAS 服务** | nas-0379 | 6009 | nas | https://nas.0379.email |
| **API 服务** | api-0379 | 6000 | api | https://api.0379.email |
| **日志查看** | logs-0379 | 6004 | logs | https://logs.0379.email |
| **权限管理** | admin-0379 | 6001 | admin | https://admin.0379.email |
| **备份恢复** | backup-0379 | 6005 | backup | https://backup.0379.email |
| **AI Widget Demo** | widget-0379 | 6008 | widget | https://widget.0379.email |
| **设置** | admin-0379 | 6001 | admin | https://admin.0379.email |
| **帮助中心** | admin-0379 | 6001 | admin | https://admin.0379.email |

### 服务复用说明

以下功能模块共享同一个 FRP 配置：

- **管理后台** (admin-0379) 包含：
  - 权限管理
  - 设置
  - 帮助中心

- **监控面板** (monitor-0379) 包含：
  - FRP 服务
  - 监控面板

---

## ⚙️ FRP 配置模板

### 当前 frpc.toml 配置

```toml
serverAddr = "SERVER_IP_PLACEHOLDER"
serverPort = 7001
auth.method = "token"
auth.token = "yyc3_nas"

log.to = "/Volume1/www/frpc/logs/frpc.log"
log.level = "debug"

transport.tls.enable = true

# API 服务
[[proxies]]
name = "api-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6000
subdomain = "api"

# NAS 服务
[[proxies]]
name = "nas-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6009
subdomain = "nas"

# 邮件服务
[[proxies]]
name = "mail-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6003
subdomain = "mail"

# LLM 服务
[[proxies]]
name = "llm-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6002
subdomain = "llm"

# 管理后台（权限管理、设置、帮助中心）
[[proxies]]
name = "admin-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6001
subdomain = "admin"

# 监控面板（FRP 服务）
[[proxies]]
name = "monitor-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6006
subdomain = "monitor"

# DDNS 服务
[[proxies]]
name = "ddns-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6007
subdomain = "ddns"

# NAS HTTPS (自定义域名)
[[proxies]]
name = "nas-tos-https"
type = "https"
localIP = "127.0.0.1"
localPort = 8989
customDomains = ["nas.0379.pro"]

# PostgreSQL (TCP)
[[proxies]]
name = "pg-0379"
type = "tcp"
localIP = "127.0.0.1"
localPort = 5432
remotePort = 54320
```

### 需要添加的配置

#### 1. 日志查看服务

```toml
[[proxies]]
name = "logs-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6004
subdomain = "logs"
```

**添加位置**: 在 `[[proxies]] name = "ddns-0379"` 之后添加

---

#### 2. 备份恢复服务

```toml
[[proxies]]
name = "backup-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6005
subdomain = "backup"
```

**添加位置**: 在 `[[proxies]] name = "logs-0379"` 之后添加

---

#### 3. AI Widget Demo 服务

```toml
[[proxies]]
name = "widget-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6008
subdomain = "widget"
```

**添加位置**: 在 `[[proxies]] name = "backup-0379"` 之后添加

---

### 完整 frpc.toml 配置

将以下三个配置块添加到您 NAS 上的 `frpc.toml` 文件末尾：

```toml
# 在 PostgreSQL 配置之后添加以下内容：

# 日志查看服务
[[proxies]]
name = "logs-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6004
subdomain = "logs"

# 备份恢复服务
[[proxies]]
name = "backup-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6005
subdomain = "backup"

# AI Widget Demo 服务
[[proxies]]
name = "widget-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6008
subdomain = "widget"
```

---

## 🌐 Nginx 配置

### 域名路由配置

需要在 Nginx 中配置所有子域名的反向代理：

```nginx
# 日志服务
server {
    listen 80;
    listen [::]:80;
    server_name logs.0379.email;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name logs.0379.email;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://127.0.0.1:6004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 备份服务
server {
    listen 80;
    listen [::]:80;
    server_name backup.0379.email;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name backup.0379.email;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://127.0.0.1:6005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Widget 服务
server {
    listen 80;
    listen [::]:80;
    server_name widget.0379.email;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name widget.0379.email;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://127.0.0.1:6008;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## ✅ 配置验证

### 1. 重启 FRP 客户端

```bash
# SSH 到 NAS
ssh root@<NAS-IP>

# 重启 frpc 服务
systemctl restart frpc

# 或手动运行
frpc -c /path/to/frpc.toml
```

### 2. 检查 FRP 状态

```bash
# 查看 FRP 日志
tail -f /Volume1/www/frpc/logs/frpc.log

# 检查进程
ps aux | grep frpc

# 检查端口监听
netstat -tlnp | grep -E '6000|6001|6002|6003|6004|6005|6006|6007|6008|6009'
```

### 3. 验证公网访问

| 服务 | 验证命令 |
|------|---------|
| API | `curl -I https://api.0379.email/api/v2/health` |
| NAS | `curl -I https://nas.0379.email` |
| Mail | `curl -I https://mail.0379.email` |
| LLM | `curl -I https://llm.0379.email` |
| Admin | `curl -I https://admin.0379.email` |
| Monitor | `curl -I https://monitor.0379.email` |
| DDNS | `curl -I https://ddns.0379.email` |
| Logs | `curl -I https://logs.0379.email` |
| Backup | `curl -I https://backup.0379.email` |
| Widget | `curl -I https://widget.0379.email` |

---

## 🚨 常见问题

### Q1: FRP 客户端启动失败？

**A**: 检查以下几点：
1. FRP 服务器地址和端口是否正确
2. Token 是否正确
3. NAS 防火墙是否放行相关端口
4. FRP 服务器是否正常运行

```bash
# 检查 FRP 服务器连接
telnet SERVER_IP_PLACEHOLDER 7001

# 查看详细日志
frpc -c /path/to/frpc.toml -d
```

### Q2: 服务可以访问但页面显示异常？

**A**: 检查：
1. 本地服务是否正常运行
2. 端口是否正确
3. Nginx 反向代理配置是否正确

```bash
# 检查本地服务
curl http://localhost:6004

# 检查 Nginx 配置
nginx -t

# 重载 Nginx
nginx -s reload
```

### Q3: 如何添加新的 FRP 代理？

**A**: 按照 FRP 配置模板章节的格式添加：

```toml
[[proxies]]
name = "服务名"
type = "http"  # 或 "https", "tcp"
localIP = "127.0.0.1"
localPort = 本地端口
subdomain = "子域名"  # 或 customDomains
```

### Q4: 如何查看 FRP 代理状态？

**A**: 访问 FRP 管理面板：

```
https://SERVER_IP_PLACEHOLDER:7500
用户名: yyc3
密码: my151001
```

在管理面板中可以看到所有已连接的代理及其状态。

---

## 📝 配置检查清单

### FRP 配置检查

- [ ] API 服务 (6000) 已配置
- [ ] NAS 服务 (6009) 已配置
- [ ] 邮件服务 (6003) 已配置
- [ ] LLM 服务 (6002) 已配置
- [ ] 管理后台 (6001) 已配置
- [ ] 监控面板 (6006) 已配置
- [ ] DDNS 服务 (6007) 已配置
- [ ] **日志查看 (6004) 已添加**
- [ ] **备份恢复 (6005) 已添加**
- [ ] **AI Widget (6008) 已添加**
- [ ] NAS HTTPS (8989) 已配置
- [ ] PostgreSQL (5432) 已配置

### Nginx 配置检查

- [ ] logs.0379.email 已配置
- [ ] backup.0379.email 已配置
- [ ] widget.0379.email 已配置
- [ ] SSL 证书已配置
- [ ] HTTP 到 HTTPS 重定向已配置

### 服务验证检查

- [ ] 所有本地服务正常运行
- [ ] FRP 客户端已重启
- [ ] 所有公网地址可访问
- [ ] DNS 解析正确
- [ ] SSL 证书有效

---

## 📞 技术支持

| 支持类型 | 联系方式 |
|----------|----------|
| **技术邮箱** | admin@0379.email |
| **FRP 管理面板** | https://SERVER_IP_PLACEHOLDER:7500 |
| **API 文档** | https://api.0379.email/api/v2/docs |

---

<div align="center">

> **言启象限 | 语枢未来**
>
> **Words Initiate Quadrants, Language Serves as Core for the Future**

---

**文档版本**: 1.0.0
**最后更新**: 2026-02-13
**文档作者**: YYC³ Team

</div>
