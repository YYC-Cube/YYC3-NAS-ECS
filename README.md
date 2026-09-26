<div align="center">

![YYC³ NAS-ECS](./public/yyc3-family.png)

# YYC³ NAS-ECS 企业级智能管理平台

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

[![Version](./public/badges/version.svg)](https://github.com/YYC-Cube/YYC3-NAS-ECS/releases)
[![License](./public/badges/license.svg)](LICENSE)
[![React](./public/badges/react.svg)](https://reactjs.org/)
[![TypeScript](./public/badges/typescript.svg)](https://www.typescriptlang.org/)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/YYC-Cube/YYC3-NAS-ECS/YYC3-NAS-ECS%20CI%2FCD%20Pipeline?branch=main&label=CI%2FCD&logo=githubactions&logoColor=white)](https://github.com/YYC-Cube/YYC3-NAS-ECS/actions/workflows/ci-cd.yml)
[![Pages](https://img.shields.io/github/actions/workflow/status/YYC-Cube/YYC3-NAS-ECS/Deploy%20to%20GitHub%20Pages?branch=main&label=Pages%20Deploy&logo=github&logoColor=white)](https://cloud.yyc3.top)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/YYC-Cube/YYC3-NAS-ECS/Security%20Scan?branch=main&label=Security&logo=github&logoColor=white)](https://github.com/YYC-Cube/YYC3-NAS-ECS/actions/workflows/security-scan.yml)
[![gitleaks](https://img.shields.io/badge/gitleaks-protected-4c1?logo=shield&logoColor=white)](https://github.com/YYC-Cube/YYC3-NAS-ECS/actions/workflows/gitleaks.yml)
[![Bun](https://img.shields.io/badge/bun-%3E%3D1.1-f472b6?logo=bun&logoColor=white)](https://bun.sh)
[![Stars](https://img.shields.io/github/stars/YYC-Cube/YYC3-NAS-ECS?style=social)](https://github.com/YYC-Cube/YYC3-NAS-ECS/stargazers)
[![Forks](https://img.shields.io/github/forks/YYC-Cube/YYC3-NAS-ECS?style=social)](https://github.com/YYC-Cube/YYC3-NAS-ECS/network/members)
[![Issues](https://img.shields.io/github/issues/YYC-Cube/YYC3-NAS-ECS)](https://github.com/YYC-Cube/YYC3-NAS-ECS/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

</div>

---

## 📋 项目概述

YYC³ NAS-ECS 是一个基于云原生架构的企业级智能管理平台，提供 NAS 管理、DDNS 动态解析、内网穿透、监控告警等完整功能。

### 核心特性

| 特性 | 说明 | 技术实现 |
| ------ | ------ | ---------- |
| 🔒 **安全管理** | 企业级认证授权、数据加密、安全审计 | JWT + RBAC + HTTPS |
| 🌐 **内网穿透** | 基于 FRP 的稳定内网穿透服务 | FRP 0.52+ + Nginx |
| 📡 **DDNS 服务** | 支持阿里云、腾讯云、Cloudflare 等 DNS 服务 | 定时任务 + DNS API |
| 📊 **实时监控** | CPU、内存、磁盘、网络全方位监控 | Prometheus + Grafana |
| 📧 **智能备份** | 自动化备份、恢复、版本管理 | Docker 卷 + 定时任务 |
| 🤖 **AI 集成** | 智能分析、自动化运维、预测性维护 | LLM API + 智能助手 |

### 技术栈

```mermaid
graph TB
    subgraph "前端层 Frontend"
        A1[React 18.3]
        A2[TypeScript 5.x strict]
        A3[Vite 6.4]
        A4[TailwindCSS 4.1]
        A1 --> A2
        A1 --> A3
        A1 --> A4
    end

    subgraph "后端层 Backend"
        B1[Python 3.11]
        B2[Flask 3.0]
        B3[Gunicorn + Gevent]
        B4[JWT Auth + RBAC]
        B1 --> B2
        B2 --> B3
        B2 --> B4
    end

    subgraph "数据层 Data"
        C1[PostgreSQL 14]
        C2[Redis 7]
        C3[SQLite]
        C1 -.-> C2
    end

    subgraph "基础设施层 Infrastructure"
        D1[Docker 24+]
        D2[Nginx 1.x]
        D3[FRP 0.52+]
        D4[Prometheus]
        D5[Grafana]
    end

    A4 --> B2
    B2 --> C1
    B2 --> C2
    B2 --> D2
    D1 --> B3
    D1 --> C1
    D1 --> C2
    D2 --> D3
    D4 --> D5
```

---

## 🚀 快速开始

### 前置要求

| 依赖 | 版本要求 | 用途 |
| ------ | ---------- | ------ |
| Node.js | >= 18.0 | 前端运行环境 |
| Python | >= 3.10 | 后端运行环境 |
| Docker | >= 20.10 | 容器化部署 |
| Git | >= 2.30 | 版本控制 |

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/YYC-Cube/YYC3-NAS-ECS.git
cd YYC3-NAS-ECS
```

#### 2. 配置环境变量

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件，设置实际值
vim .env
```

**重要提示**：

- 请参考 [docs/开发者指南-敏感信息占位符使用说明.md](./docs/开发者指南-敏感信息占位符使用说明.md) 了解占位符说明
- 不要将包含实际敏感信息的 `.env` 文件提交到 Git
- 使用强密码和安全的密钥

#### 3. 安装依赖

```bash
# 前端依赖（项目统一使用 Bun）
bun install

# 后端依赖（如需独立运行后端）
cd api
pip install -r requirements.txt
```

#### 4. 启动开发环境

```bash
# 启动前端开发服务器（端口 3030 起）
bun run dev
```

#### 5. 构建生产版本

```bash
# 构建前端
bun run build

# 构建输出到 dist/ 目录
```

---

## 📁 项目结构

```
YYC3-NAS-ECS/
├── src/                      # 前端源代码
│   ├── app/                # React 应用
│   │   ├── components/      # UI 组件
│   │   ├── services/        # API 服务
│   │   ├── config/          # 配置管理
│   │   └── utils/           # 工具函数
│   ├── styles/             # 样式文件
│   └── main.tsx            # 入口文件
├── api/                      # 后端源代码
│   ├── app/                # Flask 应用
│   ├── config/             # 配置文件
│   ├── migrations/          # 数据库迁移
│   ├── docker/             # Docker 配置
│   └── requirements.txt     # Python 依赖
├── services/                 # 微服务
│   ├── ai/                # AI 服务
│   ├── ddns/              # DDNS 服务
│   ├── mail/              # 邮件服务
│   ├── frp/               # FRP 服务
│   └── redis/             # Redis 服务
├── scripts/                  # 部署脚本
│   ├── replace-secrets.sh  # 占位符替换脚本
│   └── *.sh              # 其他脚本
├── docs/                     # 文档
│   ├── architecture.md     # 技术架构文档
│   ├── 开发者指南-敏感信息占位符使用说明.md
│   └── *.md             # 详细文档
├── nas-ecs/                  # 部署包
│   ├── docker/             # Docker 配置
│   ├── config/             # 环境配置
│   └── scripts/            # 部署脚本
├── public/                   # 静态资源
│   └── badges/             # 徽章图标
├── .env.example               # 环境变量模板
├── .env                      # 实际环境变量（不提交）
├── .gitignore                # Git 忽略规则
├── package.json               # Node.js 依赖
├── docker-compose.yml         # Docker 编排
└── README.md                 # 本文件
```

---

## 🔧 环境变量配置

### 核心配置项

| 配置项 | 说明 | 占位符 | 必填 |
| ------- | ------ | -------- | ------ |
| `POSTGRES_USER` | 数据库用户名 | `DB_USER_PLACEHOLDER` | ✅ |
| `POSTGRES_PASSWORD` | 数据库密码 | `DB_PASSWORD_PLACEHOLDER` | ✅ |
| `JWT_SECRET_KEY` | JWT 签名密钥 | `JWT_SECRET_PLACEHOLDER` | ✅ |
| `SESSION_SECRET` | Session 加密密钥 | `SESSION_SECRET_PLACEHOLDER` | ✅ |
| `API_KEY` | API 访问密钥 | `API_KEY_PLACEHOLDER` | ✅ |
| `SERVER_IP` | 服务器 IP 地址 | `SERVER_IP_PLACEHOLDER` | ✅ |
| `ALIYUN_ACCESS_KEY_ID` | 阿里云 AccessKey ID | `ALIYUN_ACCESS_KEY_ID_PLACEHOLDER` | ❌ |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云 AccessKey Secret | `ALIYUN_ACCESS_KEY_SECRET_PLACEHOLDER` | ❌ |

### 环境类型

- **development** - 开发环境
- **staging** - 预发布环境
- **production** - 生产环境

详细配置说明请参考：

- [docs/开发者指南-敏感信息占位符使用说明.md](./docs/开发者指南-敏感信息占位符使用说明.md)
- [docs/architecture.md](./docs/architecture.md) - 完整技术架构文档

---

## 📝 可用脚本

### 占位符替换脚本

```bash
./scripts/replace-secrets.sh
```

功能：批量将项目中的敏感信息替换为占位符

### 快速启动脚本

```bash
./scripts/quick-start.sh
```

功能：快速启动所有开发服务

### 部署脚本

```bash
./scripts/deploy.sh
```

功能：部署到生产环境

---

## 🏗️ 功能架构

### 系统功能模块

```mermaid
graph LR
    User[用户]

    subgraph "用户界面层"
        Dashboard[仪表板]
        DDNS[DDNS管理]
        FRP[FRP配置]
        Monitor[监控中心]
        Settings[系统设置]
    end

    subgraph "业务服务层"
        AuthService[认证服务]
        DDNSService[DDNS服务]
        FRPService[FRP服务]
        MonitorService[监控服务]
        BackupService[备份服务]
    end

    subgraph "数据存储层"
        PG[(PostgreSQL)]
        Redis[(Redis)]
        Files[文件存储]
    end

    subgraph "外部服务"
        Aliyun[阿里云DNS]
        Email[邮件服务]
        AI[AI服务]
    end

    User --> Dashboard
    User --> DDNS
    User --> FRP
    User --> Monitor
    User --> Settings

    Dashboard --> AuthService
    DDNS --> DDNSService
    FRP --> FRPService
    Monitor --> MonitorService
    Settings --> BackupService

    AuthService --> PG
    AuthService --> Redis
    DDNSService --> Redis
    DDNSService --> Aliyun
    MonitorService --> PG
    BackupService --> Files

    FRPService --> Email
    DDNSService --> AI

    style Dashboard fill:#4A90E2,color:#fff
    style DDNS fill:#3B82F6,color:#fff
    style FRP fill:#10B981,color:#fff
    style Monitor fill:#F59E0B,color:#fff
    style Settings fill:#6366F1,color:#fff
```

### 数据流转

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as 前端界面
    participant API as API网关
    participant Service as 业务服务
    participant DB as 数据库
    participant External as 外部服务

    User->>UI: 访问系统
    UI->>API: 请求资源
    API->>Service: 调用服务
    Service->>DB: 查询数据
    DB-->>Service: 返回数据
    Service-->>API: 响应结果
    API-->>UI: 返回响应
    UI-->>User: 展示界面

    User->>UI: DDNS更新
    UI->>API: 发起更新
    API->>Service: 处理更新
    Service->>External: 调用DNS API
    External-->>Service: 更新成功
    Service->>DB: 保存记录
    Service-->>API: 更新完成
    API-->>UI: 通知结果
    UI-->>User: 显示成功
```

---

## 🔒 安全最佳实践

### 密码管理

✅ **推荐做法**：

- 使用至少 16 位的强密码
- 包含大小写字母、数字和特殊字符
- 定期轮换密码（建议每 90 天）
- 使用密码管理器（如 1Password、Bitwarden）

❌ **避免做法**：

- 使用简单密码（如 `password123`）
- 在代码中硬编码密码
- 多个服务使用相同密码

### 密钥管理

✅ **推荐做法**：

- 使用环境特定的密钥（开发/测试/生产）
- 使用密钥管理服务
- 生成足够长度的密钥（至少 32 字符）
- 使用加密存储

❌ **避免做法**：

- 在代码中硬编码密钥
- 将密钥提交到版本控制
- 在文档中记录实际密钥

### Git 安全

✅ **推荐做法**：

- 确保 `.env` 在 `.gitignore` 中
- 使用 `pre-commit` 钩子检查敏感信息
- 定期审查 Git 历史记录

❌ **避免做法**：

- 提交 `.env` 文件
- 提交包含密钥的配置文件

---

## 📚 文档导航

### 文档架构体系总览

```
📚 docs/ 文档架构体系
│
├── 🚀 快速启动 ──── YYC3-NAS-ECS-快速启动/
│   ├── 📧 QUICK_START_EMAIL.md
│   └── 📖 README-快速启动.md
│
├── 🚢 部署指导 ──── YYC3-NAS-ECS-部署指导/
│   ├── 👥 非技术人士部署指南.md
│   ├── 🗓️ 总体执行计划.md
│   └── 🎨 用户体验优化方案.md
│
├── 👨‍💻 开发指导 ──── YYC3-NAS-ECS-开发指导/
│   └── 📘 开发指导.md
│
├── 🛡️ 审核报告 ──── YYC3-NAS-ECS-审核报告/
│   ├── 📊 综合审核报告.md
│   ├── 🔒 安全审计报告.md
│   ├── ⚡ 性能基准测试报告.md
│   ├── 🧪 测试报告.md
│   └── 🗄️ archive/（历史报告归档）
│
├── 🧪 测试体系 ──── YYC3-NAS-ECS-测试体系/
│   ├── 📋 测试策略 / 测试计划 / 测试用例规范
│   └── 🐞 缺陷管理流程 / 测试环境配置
│
├── 🏷️ 类型定义 ──── YYC3-NAS-ECS-类型定义/
│   └── 🔗 类型关系图谱 / 定义索引 / 规范
│
├── 🤖 智能浮窗 ──── YYC3-NAS-ECS-智能浮窗/
├── 📮 邮箱系统 ──── YYC3-NAS-ECS-邮箱系统/
├── 📐 模版文档 ──── YYC3-NAS-ECS-模版文档/
├── 🗂️ 团队规范 ──── YYC3-团队资产-标准规范/
│   ├── 🏛️ 架构总纲 / 编码规范
│   └── 🔐 安全合规 / 部署运维 / 测试策略
│
└── 📄 根级专题文档
    ├── 🌐 系统架构图.md / architecture.md
    ├── 🔌 API 完整文档 / API 模块使用指南
    ├── 📡 DDNS / FRP / LLM / NAS / 邮件 服务指南
    ├── 🎛️ 监控面板 / 日志服务 / 权限管理 技术文档
    └── ⚙️ 环境变量配置指导 / PWA / 国际化
```

### 核心文档

| 图标 | 文档 | 说明 | 链接 |
| :--: | ------ | ------ | ------ |
| 🏛️ | 技术架构文档 | 完整的系统架构、数据流、部署架构 | [docs/architecture.md](./docs/architecture.md) |
| 🗺️ | 文档中心导航 | 全量文档索引与分类规范 | [docs/README.md](./docs/README.md) |
| 👨‍💻 | 开发者指南 | 占位符完整说明、安全最佳实践 | [docs/开发者指南-敏感信息占位符使用说明.md](./docs/开发者指南-敏感信息占位符使用说明.md) |
| 🌐 | FRP 配置指南 | FRP 内网穿透详细配置 | [docs/YYC3-NAS-ECS-FRP配置使用指南.md](./docs/YYC3-NAS-ECS-FRP配置使用指南.md) |
| 👥 | 非技术部署指南 | 简化部署流程、快速上手 | [docs/YYC3-NAS-ECS-部署指导/YYC3-NAS-ECS-非技术人士部署指南.md](./docs/YYC3-NAS-ECS-部署指导/YYC3-NAS-ECS-非技术人士部署指南.md) |
| 🛡️ | 安全策略 | 安全策略与漏洞披露流程 | [SECURITY.md](./SECURITY.md) |
| 🤝 | 贡献指南 | 环境搭建、提交规范、PR 流程 | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| 📜 | 更新日志 | 版本变更历史 | [CHANGELOG.md](./CHANGELOG.md) |
| ⚖️ | 行为准则 | 社区参与规范 | [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) |

### 快速链接

- 🚀 [在线演示](https://cloud.yyc3.top)
- 📖 [API 文档](https://api.0379.email/docs)
- 📧 [技术支持](mailto:admin@0379.email)
- 🐛 [问题反馈](https://github.com/YYC-Cube/YYC3-NAS-ECS/issues)

---

## 🤝 贡献指南

完整的贡献流程请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

### 开发流程

```mermaid
graph LR
    A[Fork 项目] --> B[创建特性分支]
    B --> C[提交更改]
    C --> D[推送到分支]
    D --> E[开启 Pull Request]
    E --> F[代码审查]
    F --> G[合并到主分支]

    style A fill:#4A90E2,color:#fff
    style B fill:#3B82F6,color:#fff
    style C fill:#10B981,color:#fff
    style D fill:#F59E0B,color:#fff
    style E fill:#6366F1,color:#fff
    style F fill:#EC4899,color:#fff
    style G fill:#8B5CF6,color:#fff
```

### 提交代码

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 代码规范

- 遵循 YYC³ 代码规范
- 使用占位符替代敏感信息
- 编写单元测试
- 更新相关文档

### 提交信息规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建或辅助工具变动

---

## 📊 项目统计

<div align="center">

![GitHub Stars](https://img.shields.io/github/stars/YYC-Cube/YYC3-NAS-ECS?style=for-the-badge)
![GitHub Forks](https://img.shields.io/github/forks/YYC-Cube/YYC3-NAS-ECS?style=for-the-badge)
![GitHub Issues](https://img.shields.io/github/issues/YYC-Cube/YYC3-NAS-ECS?style=for-the-badge)
![GitHub License](https://img.shields.io/github/license/YYC-Cube/YYC3-NAS-ECS?style=for-the-badge)

</div>

### 贡献者

感谢所有为 YYC³ NAS-ECS 做出贡献的开发者！

<a href="https://github.com/YYC-Cube/YYC3-NAS-ECS/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=YYC-Cube/YYC3-NAS-ECS" alt="Contributors" />
</a>

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📞 技术支持

| 支持类型 | 联系方式 |
| ---------- | ---------- |
| **技术邮箱** | <admin@0379.email> |
| **GitHub Issues** | <https://github.com/YYC-Cube/YYC3-NAS-ECS/issues> |
| **文档中心** | <https://docs.0379.email> |
| **在线支持** | <https://support.0379.email> |

---

<div align="center">

> **言启象限 | 语枢未来**
>
> **Words Initiate Quadrants, Language Serves as Core for the Future**
>
> 万象归元于云枢 | 深栈智启新纪元
>
> **All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence**

---

**项目版本**: 1.0.0
**最后更新**: 2026-02-13
**维护者**: YYC³ Team
**许可协议**: MIT
**项目地址**: <https://github.com/YYC-Cube/YYC3-NAS-ECS>

---

<div align="center">

Made with ❤️ by YYC³ Team

</div>

</div>
