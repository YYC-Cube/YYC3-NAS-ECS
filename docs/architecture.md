# YYC³ NAS-ECS 技术架构

> **言启象限 | 语枢未来**
> **Words Initiate Quadrants, Language Serves as Core for the Future**
> 万象归元于云枢 | 深栈智启新纪元
> **All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence**

---

> **文档版本**: 1.0.0  
> **创建日期**: 2026-02-13  
> **作者**: YYC³ Team  
> **最后更新**: 2026-02-13  
> **分类**: 技术架构文档  

---

## 📋 目录

1. [系统架构概览](#系统架构概览)
2. [技术栈分层](#技术栈分层)
3. [数据流向](#数据流向)
4. [服务依赖关系](#服务依赖关系)
5. [部署架构](#部署架构)

---

## 系统架构概览

YYC³ NAS-ECS 采用微服务架构，各服务独立部署但通过API和消息总线协同工作。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     YYC³ NAS-ECS 系统架构                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  用户界面    │  │  API 网关   │  │  监控系统    │  │
│  │  (React)    │  │  (Flask)     │  │  (Prometheus) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                   │                   │             │
│         │                   │                   │             │
│  ┌──────▼──────┐  ┌──────▼───────────┐  ┌──────▼───────┐  │
│  │  业务服务层  │  │  微服务集群      │  │  告警通知    │  │
│  └──────┬───────┘  └──────┬───────────┘  └──────┬───────┘  │
│         │                   │                   │             │
│  ┌──────▼──────────────────────────────────────────────┐         │
│  │  数据层                                      │         │
│  └──────┬──────────────────────────────────────┬─────────┘         │
│         │                                      │                   │
│  ┌──────▼──────┐  ┌──────────────────▼──────┐      │
│  │ PostgreSQL  │  │  Redis                 │      │
│  └─────────────┘  └─────────────────────────┘      │
│                                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 技术栈分层

### 前端层 (Frontend Layer)

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| React | 18.3.1 | UI 框架 | 组件化开发 |
| TypeScript | 5.x | 类型系统 | 类型安全 |
| Vite | 6.4 | 构建工具 | 快速热更新 |
| TailwindCSS | 3.x | 样式框架 | 原子化样式 |
| Zustand | 4.x | 状态管理 | 轻量级状态管理 |

### 后端层 (Backend Layer)

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| Python | 3.11 | 编程语言 | 主要开发语言 |
| Flask | 2.x | Web 框架 | RESTful API |
| Gunicorn | 21.x | WSGI 服务器 | 生产服务器 |
| JWT | - | 认证 | 令牌认证 |

### 数据层 (Data Layer)

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| PostgreSQL | 14 | 关系型数据库 | 持久化存储 |
| Redis | 7 | 缓存数据库 | 高速缓存 |
| SQLite | - | 轻量级存储 | 配置和临时数据 |

### 基础设施层 (Infrastructure Layer)

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| Docker | 24+ | 容器化 | 服务容器化 |
| Nginx | 1.x | 反向代理 | 负载均衡 |
| FRP | 0.52+ | 内网穿透 | 远程访问 |
| Prometheus | - | 监控收集 | 指标采集 |
| Grafana | - | 可视化 | 监控仪表板 |

---

## 数据流向

### 用户请求流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Frontend as 前端界面
    participant API as API网关
    participant Auth as 认证服务
    participant Cache as Redis缓存
    participant DB as PostgreSQL数据库
    participant Service as 业务服务
    participant External as 外部服务

    User->>Frontend: 访问系统
    Frontend->>API: 请求资源
    API->>Cache: 检查缓存
    alt 缓存命中
        Cache-->>API: 返回缓存数据
        API-->>Frontend: 响应数据
    else 缓存未命中
        API->>Auth: 验证令牌
        Auth->>API: 令牌有效
        API->>Service: 调用业务逻辑
        Service->>DB: 查询数据
        DB-->>Service: 返回数据
        Service-->>API: 返回结果
        API->>Cache: 更新缓存
        API-->>Frontend: 响应数据
    end

    Frontend->>External: DDNS更新请求
    External-->>Frontend: 更新结果
```

### DDNS 更新流程

```mermaid
sequenceDiagram
    participant System as 系统定时器
    participant DDNS as DDNS服务
    participant Aliyun as 阿里云DNS
    participant Cache as 缓存服务
    participant User as 用户界面

    System->>DDNS: 每5分钟触发
    DDNS->>DDNS: 获取当前公网IP
    DDNS->>Cache: 检查IP是否变化
    
    alt IP未变化
        Cache-->>DDNS: IP相同
        DDNS->>User: 无需更新通知
    else IP已变化
        DDNS->>Aliyun: 调用DNS更新API
        Aliyun-->>DDNS: 更新成功
        DDNS->>Cache: 更新缓存
        DDNS->>User: 更新成功通知
    end
```

### FRP 连接流程

```mermaid
sequenceDiagram
    participant Client as 外部客户端
    participant FRP as FRP服务器
    participant Nginx as 反向代理
    participant Service as 目标服务
    participant Monitor as 监控系统

    Client->>FRP: 发起连接请求
    FRP->>Monitor: 记录连接日志
    FRP->>Nginx: 建立隧道
    Nginx->>Service: 转发流量
    Service-->>Client: 返回响应数据
    
    Monitor->>Monitor: 定期健康检查
    alt 连接异常
        Monitor->>FRP: 发送告警
        FRP->>Client: 断开连接
    else 连接正常
        Monitor->>FRP: 正常状态
    end
```

---

## 服务依赖关系

### 核心服务依赖

```mermaid
graph TB
    subgraph "前端层"
        UI[用户界面<br/>React + TypeScript]
        Styles[样式系统<br/>TailwindCSS]
    end
    
    subgraph "API层"
        Gateway[API网关<br/>Flask + Gunicorn]
        Auth[认证服务<br/>JWT]
        DDNS[DDNS服务<br/>阿里云API]
        Mail[邮件服务<br/>SMTP/IMAP]
        AI[AI服务<br/>大模型API]
    end
    
    subgraph "数据层"
        PG[(PostgreSQL<br/>关系型数据库)]
        Redis[(Redis<br/>缓存数据库)]
        Files[文件存储<br/>NAS文件系统]
    end
    
    subgraph "基础设施"
        Docker[Docker容器<br/>服务编排]
        Nginx[Nginx<br/>反向代理]
        FRP[FRP服务<br/>内网穿透]
        Monitor[监控系统<br/>Prometheus + Grafana]
    end
    
    UI --> Gateway
    UI --> Styles
    Gateway --> Auth
    Gateway --> DDNS
    Gateway --> Mail
    Gateway --> AI
    Auth --> PG
    Auth --> Redis
    DDNS --> Redis
    DDNS --> Files
    Mail --> Redis
    AI --> Redis
    Gateway --> Monitor
    DDNS --> Monitor
    Gateway --> Nginx
    FRP --> Nginx
    
    style PG fill:#336791
    style Redis fill:#DC382D
    style Files fill:#F59E0B
    style Docker fill:#2496ED
    style Nginx fill:#009639
    style FRP fill:#4CAF50
    style Monitor fill:#E91E63
```

---

## 部署架构

### 生产环境部署

```mermaid
graph LR
    subgraph "外部网络"
        Internet[互联网]
        Domain[域名解析<br/>ddns.0379.email]
        User[用户访问]
    end
    
    subgraph "云服务器"
        FRPS[FRP服务器]
        Docker[Docker Compose<br/>服务编排]
        
        subgraph "容器服务"
            API[nas-ecs-api<br/>端口: 6009]
            DDNS[yyc3-ddns<br/>定时服务]
            Monitor[yyc3-monitor<br/>监控服务]
            Redis[Redis<br/>端口: 6379]
            PG[PostgreSQL<br/>端口: 5432]
        end
        
        Nginx[Nginx<br/>端口: 80/443]
        Logs[日志系统<br/>/opt/yyc3/logs]
    end
    
    Internet --> Domain
    Domain --> FRPS
    FRPS --> Docker
    Docker --> API
    Docker --> DDNS
    Docker --> Monitor
    Docker --> Redis
    Docker --> PG
    API --> Redis
    API --> PG
    DDNS --> Redis
    Monitor --> Logs
    
    User --> Domain
    User --> FRPS
    FRPS --> Nginx
    Nginx --> API
    
    style API fill:#4A90E2
    style DDNS fill:#3B82F6
    style Monitor fill:#10B981
    style Redis fill:#DC382D
    style PG fill:#336791
    style Nginx fill:#009639
    style FRPS fill:#F59E0B
```

### 网络拓扑

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        互联网                                    │
└──────────────────────┬────────────────────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   DNS解析层              │
        │   ddns.0379.email        │
        └──────────────┬─────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   内网穿透层              │
        │   frp.0379.email          │
        └──────────────┬─────────────┘
                       │
        ┌─────────────────────────────────────────────────────────┐
        │          云服务器 (8.152.195.33)               │
        ├─────────────────────────────────────────────────────────┤
        │                                                   │
        │  ┌─────────────┐  ┌─────────────┐  ┌───────┐  │
        │  │ Nginx      │  │ Docker      │  │ FRP   │  │
        │  │ :80/:443   │  │ Compose    │  │ Client │  │
        │  └──────┬─────┘  └──────┬──────┘  └───────┘  │
        │         │                   │                   │         │
        │  ┌──────▼──────────────────────────────────────┐  │
        │  │ 容器服务层                            │  │
        │  │                                        │  │
        │  │  ┌──────────┐  ┌──────────┐  ┌─────┐ │
        │  │  │ API      │  │ DDNS     │  │Redis │ │
        │  │  │ :6009     │  │ Timer    │  │:6379│ │
        │  │  └──────────┘  └──────────┘  └─────┘ │
        │  │                                        │  │
        │  └──────────────────────────────────────────────┘  │
        │                                             │
        └─────────────────────────────────────────────────────┘
```

---

## 安全架构

### 认证与授权

```mermaid
graph TB
    User[用户]
    UI[前端界面]
    API[API网关]
    JWT[JWT服务]
    Session[Session管理]
    RBAC[权限控制]
    
    User --> UI
    UI --> API
    API --> JWT
    API --> Session
    JWT --> RBAC
    Session --> RBAC
    
    subgraph "权限层级"
        Admin[管理员]
        User[普通用户]
        Guest[访客]
    end
    
    RBAC --> Admin
    RBAC --> User
    RBAC --> Guest
    
    style Admin fill:#EF4444,color:#fff
    style User fill:#10B981,color:#fff
    style Guest fill:#6B7280,color:#fff
```

### 数据安全

| 安全措施 | 实现方式 | 保护范围 |
|----------|----------|----------|
| 数据加密 | PostgreSQL SSL + 传输加密 | 数据库连接 |
| 密码哈希 | bcrypt | 用户密码 |
| 会话安全 | JWT + HttpOnly Cookie | 用户会话 |
| API 鉴权 | Bearer Token + RBAC | API 访问 |
| 输入验证 | 参数校验 + SQL 注入防护 | 所有输入 |
| 敏感信息 | 占位符 + 环境变量 | 配置文件 |

---

## 监控架构

### 监控数据流

```mermaid
graph LR
    subgraph "数据源"
        App[应用服务]
        System[系统指标]
        DDNS[DDNS服务]
        FRP[FRP连接]
    end
    
    subgraph "采集层"
        Prometheus[Prometheus<br/>指标采集]
        Logs[日志收集<br/>文件日志]
    end
    
    subgraph "存储层"
        TSDB[时序数据库<br/>Prometheus DB]
        LogStore[日志存储<br/>Rotated Files]
    end
    
    subgraph "展示层"
        Grafana[Grafana<br/>可视化仪表板]
        Alerts[告警系统<br/>邮件通知]
    end
    
    App --> Prometheus
    System --> Prometheus
    DDNS --> Logs
    FRP --> Logs
    Prometheus --> TSDB
    Logs --> LogStore
    TSDB --> Grafana
    LogStore --> Alerts
    Grafana --> Alerts
    
    style Prometheus fill:#E6522D,color:#fff
    style Grafana fill:#F46800,color:#fff
    style Alerts fill:#EF4444,color:#fff
```

---

## 性能优化

### 缓存策略

| 缓存类型 | TTL | 存储内容 | 缓存方式 |
|----------|-----|----------|----------|
| Redis 会话缓存 | 24小时 | 用户会话数据 |
| Redis API 缓存 | 5分钟 | API 响应数据 |
| Redis DDNS 缓存 | 5分钟 | DNS 解析结果 |
| PostgreSQL 查询缓存 | 永久 | 热点数据索引 |

### 负载均衡

```mermaid
graph TB
    Client[客户端请求]
    
    subgraph "负载均衡层"
        LB[Nginx<br/>反向代理]
    end
    
    subgraph "应用层"
        API1[nas-ecs-api<br/>容器1]
        API2[nas-ecs-api<br/>容器2]
        API3[nas-ecs-api<br/>容器3]
    end
    
    subgraph "数据层"
        PG[(PostgreSQL<br/>连接池)]
        Redis[(Redis<br/>主从)]
    end
    
    Client --> LB
    LB --> API1
    LB --> API2
    LB --> API3
    API1 --> PG
    API2 --> PG
    API3 --> PG
    API1 --> Redis
    API2 --> Redis
    API3 --> Redis
    
    style LB fill:#009639,color:#fff
    style PG fill:#336791,color:#fff
    style Redis fill:#DC382D,color:#fff
```

---

## 扩展性设计

### 水平扩展

- **无状态服务**: API 服务设计为无状态，可轻松水平扩展
- **容器化部署**: Docker Compose 支持快速扩容
- **负载均衡**: Nginx 支持多实例负载分发
- **数据库连接池**: PostgreSQL 连接池优化，支持高并发

### 垂直扩展

- **硬件升级**: 支持更多 CPU/内存配置
- **数据库优化**: 索引优化、查询优化
- **缓存分层**: Redis 多级缓存，减少数据库压力

---

<div align="center">

> **言启象限 | 语枢未来**
>
> **Words Initiate Quadrants, Language Serves as Core for the Future**
>
> 万象归元于云枢 | 深栈智启新纪元
>
> **All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence**

</div>

---

**文档版本**: 1.0.0  
**最后更新**: 2026-02-13  
**维护者**: YYC³ Team  
**许可协议**: MIT
