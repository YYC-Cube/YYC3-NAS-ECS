# YYC³ NAS-ECS 企业级智能管理平台 - 非技术人士部署指南

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

> **文档说明**: 本文档专为非技术背景人士编写，用通俗易懂的语言解释整个系统的功能、部署方法和日常维护
> 
> **创建日期**: 2026-02-11
> **作者**: YYC³ Team
> **版本**: 1.0.0
> **适用对象**: 企业管理者、IT管理员、非技术背景人员
> **预计部署时间**: 2-4小时

---

## 📖 目录

- [什么是YYC³ NAS-ECS？](#什么是yyc-nas-ecs)
- [系统功能一览](#系统功能一览)
- [需要准备什么](#需要准备什么)
- [部署架构说明](#部署架构说明)
- [详细部署步骤](#详细部署步骤)
- [系统管理指南](#系统管理指南)
- [常见问题解答](#常见问题解答)
- [获取技术支持](#获取技术支持)

---

## 🎯 什么是YYC³ NAS-ECS？

### 用一句话说明

YYC³ NAS-ECS是一个**企业级智能管理系统**，可以帮助您在网络上管理公司的重要数据、监控服务器状态、发送邮件、使用AI助手等所有事情。

### 通俗比喻

想象您的公司有一个"中央档案室"（NAS），里面存放了所有重要文件。过去，您必须亲自到档案室，翻找文件，记录日志，还要担心档案室的安全。

YYC³ NAS-ECS就像给这个档案室配备了一个**智能管家**，让您可以：

1. **远程访问**：在任何地方通过网络访问档案室
2. **实时监控**：随时看到档案室的温度、湿度、访问情况
3. **智能助手**：有问题可以问AI，得到快速解答
4. **自动备份**：重要文件自动备份，不会丢失
5. **安全防护**：只有授权的人才能进入，所有操作都有记录

### 适合谁使用？

- **企业管理者**：需要管理公司数据，但不想学习复杂的技术
- **IT管理员**：需要快速部署一套完整的管理系统
- **小公司/工作室**：需要一个成本可控但功能完整的数据管理方案
- **个人工作室**：需要远程管理家中的服务器和文件

---

## ✨ 系统功能一览

### 一、实时监控面板 📊

**这是什么？**

就像汽车仪表盘一样，您可以实时看到系统的各项指标。

**能做什么？**

- 查看CPU使用率（就像电脑的"大脑"忙碌程度）
- 查看内存使用情况（就像工作台的占用空间）
- 查看磁盘使用情况（还有多少存储空间）
- 查看网络流量（数据上传下载的速度）
- 设置告警阈值（当某个指标超过设定值时，系统会通知您）

**应用场景：**

> 您是公司IT经理，某天下午收到一条通知："服务器CPU使用率超过90%了"。您可以立即登录系统，查看是哪个程序占用了资源，及时处理，避免系统崩溃。

### 二、企业邮箱服务 📧

**这是什么？**

一个完整的邮件管理系统，可以像使用Gmail或Outlook一样管理邮件。

**能做什么？**

- 收发邮件
- 管理邮件分类（收件箱、发件箱、草稿箱、垃圾箱）
- AI智能分类（AI会自动将邮件分类，比如"重要"、"工作"、"促销"）
- 搜索邮件（快速找到过去的邮件）
- 附件管理（上传下载各种格式的文件）

**应用场景：**

> 公司有多个项目组，每个组都有自己的邮箱。通过这个系统，管理员可以统一管理所有邮箱，查看邮件流量，监控异常情况。

### 三、FRP内网穿透 🔌

**这是什么？**

这是最"神奇"的功能！简单来说，它让您可以从外面访问家里的内部网络。

**通俗解释：**

想象您家里的路由器有一个"大门"，这个大门只对家里人开放。FRP就是给您配了一把"万能钥匙"，让您在外面也能打开大门，进入家里的网络。

**能做什么？**

- 从公司访问家里的服务器
- 从咖啡厅访问公司的内部系统
- 无需公网IP（大多数家庭宽带都没有公网IP）
- 安全加密连接

**应用场景：**

> 您是一名程序员，在公司上班时突然想起家里服务器上有一个重要文件需要修改。使用FRP，您可以在公司直接访问家里的服务器，下载文件并修改，非常方便。

### 四、DDNS动态域名服务 🌐

**这是什么？**

给您的服务器配一个固定的"名字"，即使IP地址变化了，这个名字也能找到它。

**通俗解释：**

您的网络服务器的IP地址就像电话号码，可能会变化。DDNS就像给服务器配了一个"域名"（比如`ddns.0379.email`），无论IP怎么变，用这个名字都能找到服务器。

**能做什么？**

- 自动检测IP变化
- 自动更新DNS记录
- 支持多个域名服务商（阿里云、腾讯云、Cloudflare）
- 实时监控DDNS服务状态

**应用场景：**

> 您使用的是家庭宽带，IP地址会定期变化。配置了DDNS后，您只需要记住`ddns.0379.email`这个域名，不用每次都去查新的IP地址。

### 五、日志管理 📝

**这是什么？**

记录系统所有操作的"日记本"。

**能做什么？**

- 查看系统运行日志
- 搜索特定事件
- 导出日志用于分析
- 实时日志流（像看实时新闻一样看日志）

**应用场景：**

> 某天系统出现故障，您不知道是什么原因。通过查看日志，您发现是某个程序在特定时间崩溃了，从而快速定位问题。

### 六、AI智能助手 🤖

**这是什么？**

一个能聊天的AI助手，可以帮助您解决各种问题。

**能做什么？**

- 自然语言对话（像和人聊天一样）
- 语音输入（说话就能发问）
- 多语言支持（中文、英文、日文等）
- 会话管理（可以保存多个对话）
- 消息历史（不会忘记之前说的话）

**应用场景：**

> 您想备份系统，但不知道怎么操作。您可以问AI："怎么备份我的服务器？"AI会给出详细的步骤说明。

### 七、NAS文件管理 📁

**这是什么？**

管理存储在NAS上的所有文件。

**能做什么？**

- 浏览文件夹和文件
- 上传下载文件
- 创建、删除、重命名文件夹
- 文件搜索
- 权限管理（谁能访问哪些文件）

**应用场景：**

> 公司有一个共享文件夹，存放所有项目文档。通过NAS文件管理功能，您可以轻松地找到"2025年度财务报告"这个文件，并下载查看。

### 八、LLM大语言模型集成 🧠

**这是什么？**

将强大的人工智能语言模型集成到系统中。

**能做什么？**

- 文档智能分析
- 内容自动生成
- 智能搜索
- 数据分析

**应用场景：**

> 您有一个100页的技术文档，想快速了解主要内容。让LLM分析后，它会给出一份详细的摘要，帮您节省时间。

### 九、备份管理 💾

**这是什么？**

确保数据不会丢失的安全保障。

**能做什么？**

- 定期自动备份
- 手动备份
- 备份恢复
- 备份历史管理

**应用场景：**

> 系统设置每天凌晨2点自动备份。某天不小心删除了重要文件，您可以从昨天的备份中恢复，数据不会丢失。

### 十、配置管理 ⚙️

**这是什么？**

管理系统的所有设置。

**能做什么？**

- 修改系统配置
- 环境变量管理
- 配置导入导出

**应用场景：**

> 公司换了新的SMTP邮件服务器，您需要在配置管理中修改邮件服务的设置，让系统使用新的服务器发送邮件。

### 十一、权限管理(RBAC) 🔐

**这是什么？**

控制谁能访问系统，以及能做什么。

**能做什么？**

- 用户管理（创建、删除用户）
- 角色管理（管理员、普通用户、访客）
- 权限分配（每个角色能做什么）
- 操作审计（记录谁做了什么）

**应用场景：**

> 公司有10个员工，其中3个是管理员，5个是普通用户，2个是访客。通过权限管理，您可以确保普通用户只能查看文件，不能修改系统配置。

### 十二、帮助中心 ❓

**这是什么？**

系统的使用说明书和常见问题解答。

**能做什么？**

- 查看功能使用说明
- 搜索常见问题
- 联系技术支持

**应用场景：**

> 您想使用监控面板，但不知道怎么设置告警阈值。在帮助中心搜索"告警"，就能找到详细的设置说明。

---

## 📦 需要准备什么

### 硬件要求

#### 阿里云ECS（云服务器，用于FRP服务器）

| 配置项 | 最低要求 | 推荐配置 | 说明 |
|--------|----------|----------|------|
| CPU | 1核 | 2核 | 处理器，1核相当于1个"大脑" |
| 内存 | 1GB | 2GB | 内存，相当于工作台大小 |
| 带宽 | 1Mbps | 5Mbps | 网络速度，带宽越大速度越快 |
| 磁盘 | 20GB | 40GB | 存储空间，存放程序和日志 |
| 操作系统 | Linux | Ubuntu 20.04+ | 服务器操作系统 |

**费用估算**（阿里云，仅供参考）：
- 最低配置：约 30-50元/月
- 推荐配置：约 80-120元/月

#### 本地NAS（应用服务器）

| 配置项 | 最低要求 | 推荐配置 | 说明 |
|--------|----------|----------|------|
| CPU | 4核 | 8核 | 处理器 |
| 内存 | 8GB | 16GB | 内存 |
| 存储 | 100GB | 500GB SSD | 存储空间，建议使用SSD硬盘 |
| 操作系统 | Linux | 任意支持Docker的系统 | 可以是NAS专用系统（如群晖、威联通） |

**常见NAS品牌**：
- 群晖
- 威联通
- 自建NAS（使用普通电脑）

### 软件要求

#### 必须安装的软件

| 软件 | 版本要求 | 用途 | 安装难度 |
|------|----------|------|----------|
| Docker | 20.10+ | 运行应用程序 | ⭐⭐ 简单 |
| Docker Compose | 2.0+ | 管理多个应用 | ⭐⭐ 简单 |
| Python | 3.11+ | 后端服务 | ⭐⭐⭐ 中等 |
| Node.js | 18+ | 前端应用 | ⭐⭐ 简单 |
| PostgreSQL | 14+ | 数据库 | ⭐⭐⭐ 中等 |
| Redis | 7+ | 缓存 | ⭐⭐ 简单 |

#### 需要注册的账号

| 服务 | 用途 | 费用 |
|------|------|------|
| 阿里云账号 | 购买ECS服务器、DDNS服务 | 按使用量计费 |
| 域名服务商账号 | 管理域名 | 按域名计费 |
| 邮件服务商 | 发送邮件（如使用第三方SMTP） | 按发送量计费 |
| OpenAI/LLM服务商 | 使用AI功能 | 按使用量计费 |

### 网络要求

#### 阿里云ECS服务器

- 需要配置防火墙规则，开放以下端口：
  - 7001（FRP通信端口）
  - 7500（FRP管理面板）
  - 18080（HTTP访问）
  - 4443（HTTPS访问）

#### 本地NAS

- 需要开放以下端口用于内部通信：
  - 6000（API主服务）
  - 6001（管理面板）
  - 6002（LLM服务）
  - 6003（邮件服务）
  - 6009（NAS服务）
  - 6006（监控服务）
  - 6007（DDNS服务）

### 知识准备

**您不需要是程序员！** 但需要了解以下基础概念：

- **IP地址**：网络设备的"门牌号"
- **域名**：IP地址的"别名"，更易记
- **端口**：服务器上的"通道号"，不同的服务使用不同的端口
- **命令行**：输入文字命令来操作电脑（我们会提供所有需要的命令）
- **SSH**：一种远程连接服务器的方式（我们会教您怎么用）

---

## 🏗️ 部署架构说明

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          互联网（您使用电脑或手机）                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                                   通过域名访问
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         阿里云ECS服务器                               │
│                       SERVER_IP_PLACEHOLDER（示例IP）                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              FRP Server（FRP服务器）                        │   │
│  │              就像一个"中转站"，把外网连接转到内网              │   │
│  │              端口: 7001（通信）                              │   │
│  │              端口: 7500（管理面板）                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Let's Encrypt SSL证书                            │   │
│  │              就像一个"电子身份证"，确保连接安全                   │   │
│  │              域名: 0379.email（示例域名）                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                              │ FRP隧道（安全加密通道）
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         本地NAS（您的服务器）                            │
│                       192.168.3.45（示例IP）                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              FRP Client（FRP客户端）                        │   │
│  │              连接到阿里云ECS的FRP服务器                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Docker Compose（容器管理）                        │   │
│  │              运行7个核心服务                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              核心服务列表                                      │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 1. API主服务 (端口6000)                                  │   │
│  │    - 系统的核心，处理所有请求                              │   │
│  │    - 对外域名: api.0379.email                          │   │
│  │                                                             │   │
│  │ 2. 管理面板 (端口6001)                                    │   │
│  │    - 您登录使用的界面                                        │   │
│  │    - 对外域名: admin.0379.email                        │   │
│  │                                                             │   │
│  │ 3. LLM服务 (端口6002)                                     │   │
│  │    - AI助手的后端服务                                       │   │
│  │    - 对外域名: llm.0379.email                          │   │
│  │                                                             │   │
│  │ 4. 邮件服务 (端口6003)                                    │   │
│  │    - 邮件管理系统                                         │   │
│  │    - 对外域名: mail.0379.email                        │   │
│  │                                                             │   │
│  │ 5. NAS服务 (端口6009)                                     │   │
│  │    - 文件管理功能                                          │   │
│  │    - 对外域名: nas.0379.email                          │   │
│  │                                                             │   │
│  │ 6. 监控服务 (端口6006)                                    │   │
│  │    - 系统监控面板                                          │   │
│  │    - 对外域名: monitor.0379.email                    │   │
│  │                                                             │   │
│  │ 7. DDNS服务 (端口6007)                                    │   │
│  │    - 动态域名更新                                          │   │
│  │    - 对外域名: ddns.0379.email                       │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              基础设施服务                                      │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ - PostgreSQL 14（数据库，存放所有数据）                       │   │
│  │ - Redis 7（缓存，加速数据访问）                             │   │
│  │ - Nginx（反向代理，转发请求）                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 数据流向说明

**场景1：您想查看系统监控面板**

1. 您在浏览器输入 `https://monitor.0379.email`
2. 请求通过互联网到达阿里云ECS（SERVER_IP_PLACEHOLDER）
3. FRP服务器接收到请求，识别出这是要访问"monitor"服务
4. FRP通过安全隧道将请求转发到您的本地NAS（192.168.3.45）
5. 本地NAS的监控服务（端口6006）处理请求，返回监控数据
6. 数据沿着原路返回，您在浏览器上看到监控面板

**场景2：您想使用AI助手**

1. 您在管理界面输入问题
2. 请求发送到API服务（端口6000）
3. API服务将问题转发到LLM服务（端口6002）
4. LLM服务调用AI模型，生成回答
5. 回答返回到API服务
6. API服务将回答显示在您的界面上

---

## 🚀 详细部署步骤

### 阶段一：准备工作（预计30分钟）

#### 步骤1：购买并配置阿里云ECS

1. **登录阿里云**
   - 访问 https://www.aliyun.com
   - 使用您的阿里云账号登录

2. **购买ECS实例**
   - 进入"云服务器ECS"页面
   - 点击"创建实例"
   - 选择配置：
     - **地域**：选择离您最近的地域（如华北2-北京）
     - **实例规格**：选择"2核 vCPU"（推荐）
     - **镜像**：选择"Ubuntu 20.04 64位"
     - **存储**：选择"40GB ESSD"
     - **带宽**：选择"5Mbps"
   - 点击"下一步：网络和安全组"

3. **配置网络**
   - 网络类型：选择"专有网络"
   - 分配公网IP：勾选"分配公网IPv4地址"
   - 带宽计费：选择"按固定带宽"

4. **配置安全组**
   - 点击"配置规则"
   - 添加以下入方向规则：
     
     | 端口范围 | 协议 | 授权对象 | 说明 |
     |----------|------|----------|------|
     | 22/22 | TCP | 0.0.0.0/0 | SSH远程连接 |
     | 7001/7001 | TCP | 0.0.0.0/0 | FRP通信 |
     | 7500/7500 | TCP | 0.0.0.0/0 | FRP管理面板 |
     | 18080/18080 | TCP | 0.0.0.0/0 | HTTP访问 |
     | 4443/4443 | TCP | 0.0.0.0/0 | HTTPS访问 |
     | 80/80 | TCP | 0.0.0.0/0 | Web访问 |
     | 443/443 | TCP | 0.0.0.0/0 | HTTPS访问 |

5. **设置密码**
   - 选择"自定义密码"
   - 设置root用户密码（请记住！）
   - 密码要求：8-30个字符，包含字母、数字和符号

6. **确认订单**
   - 检查所有配置
   - 设置购买时长（建议1年，有折扣）
   - 点击"确认订单"
   - 支付费用

7. **等待实例启动**
   - 等待约1-3分钟，实例状态变为"运行中"
   - 记录实例的公网IP地址（如：SERVER_IP_PLACEHOLDER）

#### 步骤2：配置域名和SSL证书

1. **购买域名**（如果还没有）
   - 在阿里云域名注册页面购买
   - 输入想要的域名（如：0379.email）
   - 完成支付

2. **配置DNS解析**
   - 进入"云解析DNS"页面
   - 选择您的域名
   - 添加以下解析记录：

     | 主机记录 | 记录类型 | 记录值 | TTL |
     |----------|----------|----------|-----|
     | @ | A | SERVER_IP_PLACEHOLDER（您的ECS IP） | 600 |
     | * | A | SERVER_IP_PLACEHOLDER（您的ECS IP） | 600 |

3. **申请SSL证书**
   - SSH登录到阿里云ECS（我们稍后会教您如何SSH）
   - 执行以下命令：

```bash
# 安装certbot
sudo apt update
sudo apt install certbot -y

# 申请SSL证书（替换0379.email为您的域名）
sudo certbot certonly --standalone -d 0379.email -d *.0379.email

# 按提示输入邮箱地址，同意服务条款
# 证书申请成功后，会保存在：
# /etc/letsencrypt/live/0379.email/
```

#### 步骤3：准备本地NAS

1. **检查系统要求**
   - 确认NAS操作系统支持Docker
   - 确认有足够的存储空间（至少100GB）
   - 确认有足够的内存（至少8GB）

2. **安装Docker**

**对于群晖NAS**：
- 打开"套件中心"
- 搜索"Docker"
- 点击"安装"

**对于威联通NAS**：
- 打开"App Center"
- 搜索"Container Station"
- 点击"安装"

**对于Linux系统**：
```bash
# SSH登录到NAS
ssh 用户名@您的NAS IP地址

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

3. **安装Docker Compose**
```bash
# 下载Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

4. **创建项目目录**
```bash
# 创建主目录
mkdir -p /opt/yyc3-nas-ecs

# 创建子目录
cd /opt/yyc3-nas-ecs
mkdir -p data logs config
```

### 阶段二：部署阿里云ECS（FRP服务器）（预计30分钟）

#### 步骤1：SSH连接到ECS

**Windows用户**：
1. 下载PuTTY：https://www.putty.org/
2. 打开PuTTY
3. 输入ECS的公网IP地址（如：SERVER_IP_PLACEHOLDER）
4. 端口：22
5. 点击"Open"
6. 输入用户名：root
7. 输入密码（购买时设置的）

**Mac/Linux用户**：
1. 打开终端
2. 执行命令：

```bash
ssh root@SERVER_IP_PLACEHOLDER
# 替换SERVER_IP_PLACEHOLDER为您的ECS IP地址
```
3. 输入密码

**首次连接提示**：
- 会提示"无法确认主机真实性"
- 输入"yes"继续
- 这是正常的安全提示

#### 步骤2：安装FRP Server

```bash
# 1. 下载FRP
cd /tmp
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz

# 2. 解压
tar -zxvf frp_0.52.3_linux_amd64.tar.gz

# 3. 进入目录
cd frp_0.52.3_linux_amd64

# 4. 复制服务端程序
sudo cp frps /usr/local/bin/
sudo chmod +x /usr/local/bin/frps

# 5. 创建配置目录
sudo mkdir -p /etc/frp
```

#### 步骤3：配置FRP Server

```bash
# 创建FRP配置文件
sudo vi /etc/frp/frps.toml
```

按`i`进入编辑模式，复制以下内容（**请修改密码和域名**）：

```toml
# FRP Server配置文件

# 绑定地址
bindAddr = "0.0.0.0"
bindPort = 7001

# 认证配置（请修改为强密码）
auth.method = "token"
auth.token = "yyc3_nas_请修改这个密码"

# Web管理面板配置
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "yyc3"
webServer.password = "my151001_请修改这个密码"

# 虚拟主机配置
vhostHTTPPort = 18080
vhostHTTPSPort = 4443

# SSL证书配置（替换为您的域名）
transport.tls.certFile = "/etc/letsencrypt/live/0379.email/fullchain.pem"
transport.tls.keyFile = "/etc/letsencrypt/live/0379.email/privkey.pem"

# 允许的端口范围
allowPorts = [
  { start = 6000, end = 6009 },
  { start = 8080, end = 8080 }
]

# 子域名配置（替换为您的域名）
subDomainHost = "0379.email"

# 日志配置
log.to = "/root/frps/frps.log"
log.level = "warn"
```

编辑完成后：
- 按`ESC`键退出编辑模式
- 输入`:wq`保存并退出

#### 步骤4：配置FRP系统服务

```bash
# 创建systemd服务文件
sudo vi /etc/systemd/system/frps.service
```

按`i`进入编辑模式，复制以下内容：

```ini
[Unit]
Description=FRP Server Service
After=network.target

[Service]
Type=simple
User=root
Restart=on-failure
RestartSec=5s
ExecStart=/usr/local/bin/frps -c /etc/frp/frps.toml

[Install]
WantedBy=multi-user.target
```

编辑完成后：
- 按`ESC`键退出编辑模式
- 输入`:wq`保存并退出

#### 步骤5：启动FRP服务

```bash
# 重新加载systemd配置
sudo systemctl daemon-reload

# 启动FRP服务
sudo systemctl start frps

# 设置开机自启动
sudo systemctl enable frps

# 检查服务状态
sudo systemctl status frps

# 查看日志
sudo tail -f /root/frps/frps.log
```

如果看到类似以下输出，说明启动成功：
```
frps uses config file: /etc/frp/frps.toml
frps started successfully
```

#### 步骤6：验证FRP服务

1. **测试管理面板**
   - 在浏览器访问：`http://SERVER_IP_PLACEHOLDER:7500`
   - 输入用户名：yyc3
   - 输入密码：my151001（或您设置的密码）
   - 应该能看到FRP管理界面

2. **检查端口监听**
```bash
# 检查FRP是否在监听端口
sudo netstat -tlnp | grep frps
```

应该看到类似输出：
```
tcp        0      0 0.0.0.0:7001            0.0.0.0:*               LISTEN      12345/frps
tcp        0      0 0.0.0.0:7500            0.0.0.0:*               LISTEN      12345/frps
```

### 阶段三：部署本地NAS（预计1-2小时）

#### 步骤1：下载项目代码

**方式A：使用Git（推荐）**
```bash
# SSH登录到NAS
ssh 用户名@您的NAS IP地址

# 进入项目目录
cd /opt/yyc3-nas-ecs

# 克隆项目（如果您有访问权限）
git clone https://github.com/YYC-Cube/YYC3-NAS-ECS.git .

# 如果没有访问权限，请联系项目维护者获取代码包
```

**方式B：上传代码包**
1. 在您的电脑上下载项目代码（压缩包）
2. 使用文件传输工具（如FileZilla、WinSCP）上传到NAS的`/opt/yyc3-nas-ecs`目录
3. 在NAS上解压：

```bash
cd /opt/yyc3-nas-ecs
# 如果是zip文件
unzip YYC3-NAS-ECS.zip
# 如果是tar.gz文件
tar -zxvf YYC3-NAS-ECS.tar.gz
```

#### 步骤2：配置环境变量

```bash
# 进入项目目录
cd /opt/yyc3-nas-ecs

# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vi .env
```

按`i`进入编辑模式，修改以下关键配置：

```bash
# ======================
# 数据库配置
# ======================
POSTGRES_USER=DB_PASSWORD_PLACEHOLDER
POSTGRES_PASSWORD=请设置强密码
POSTGRES_DB=DB_PASSWORD_PLACEHOLDER

# ======================
# Redis配置
# ======================
REDIS_URL=redis://redis:6379/0

# ======================
# 邮件服务配置
# ======================
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# ======================
# AI服务配置
# ======================
OPENAI_API_KEY=your-openai-api-key
LLM_MODEL=gpt-4-turbo-preview

# ======================
# 阿里云DDNS配置
# ======================
ALIYUN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_REGION_ID=cn-beijing
ALIYUN_DOMAIN=0379.email
ALIYUN_SUB_DOMAIN=ddns
ALIYUN_TTL=600
```

**重要提示**：
- 所有密码请设置为强密码（至少16位，包含字母、数字、符号）
- API密钥请到相应服务商处获取
- 不要将`.env`文件分享给任何人

编辑完成后：
- 按`ESC`键退出编辑模式
- 输入`:wq`保存并退出

#### 步骤3：配置FRP客户端

```bash
# 创建FRP客户端配置
vi frpc.toml
```

按`i`进入编辑模式，复制以下内容（**请修改IP和密码**）：

```toml
# FRP Client配置文件

# 服务器配置（替换为您的ECS IP）
serverAddr = "SERVER_IP_PLACEHOLDER"
serverPort = 7001

# 认证配置（必须与服务器端一致）
auth.method = "token"
auth.token = "yyc3_nas_请修改这个密码"

# 日志配置
log.to = "/opt/yyc3-nas-ecs/logs/frpc.log"
log.level = "debug"

# 启用TLS加密
transport.tls.enable = true

# ======================
# 服务映射配置
# ======================

[[proxies]]
name = "api-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6000
subdomain = "api"

[[proxies]]
name = "nas-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6009
subdomain = "nas"

[[proxies]]
name = "mail-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6003
subdomain = "mail"

[[proxies]]
name = "llm-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6002
subdomain = "llm"

[[proxies]]
name = "admin-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6001
subdomain = "admin"

[[proxies]]
name = "monitor-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6006
subdomain = "monitor"

[[proxies]]
name = "ddns-0379"
type = "http"
localIP = "127.0.0.1"
localPort = 6007
subdomain = "ddns"
```

编辑完成后：
- 按`ESC`键退出编辑模式
- 输入`:wq`保存并退出

#### 步骤4：启动Docker服务

```bash
# 进入项目目录
cd /opt/yyc3-nas-ecs

# 启动所有服务（首次启动会下载镜像，需要时间）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务的日志
docker-compose logs api
docker-compose logs postgres
```

**首次启动可能需要5-10分钟**，因为需要：
- 下载Docker镜像
- 初始化数据库
- 启动各个服务

#### 步骤5：验证服务启动

```bash
# 检查所有容器是否运行
docker-compose ps

# 应该看到类似以下输出：
# NAME                 STATUS         PORTS
# yyc3-nas-ecs-api    Up             0.0.0.0:6000->8080/tcp
# yyc3-nas-ecs-postgres Up             0.0.0.0:5432->5432/tcp
# yyc3-nas-ecs-redis    Up             0.0.0.0:6379->6379/tcp
```

如果所有服务的状态都是"Up"，说明启动成功。

#### 步骤6：启动FRP客户端

```bash
# 下载FRP客户端
cd /tmp
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -zxvf frp_0.52.3_linux_amd64.tar.gz

# 复制客户端程序
sudo cp frp_0.52.3_linux_amd64/frpc /usr/local/bin/
sudo chmod +x /usr/local/bin/frpc

# 配置为系统服务
sudo vi /etc/systemd/system/frpc.service
```

按`i`进入编辑模式，复制以下内容：

```ini
[Unit]
Description=FRP Client Service
After=network.target docker.service

[Service]
Type=simple
User=root
Restart=on-failure
RestartSec=5s
ExecStart=/usr/local/bin/frpc -c /opt/yyc3-nas-ecs/frpc.toml

[Install]
WantedBy=multi-user.target
```

编辑完成后：
- 按`ESC`键退出编辑模式
- 输入`:wq`保存并退出

```bash
# 启动FRP客户端
sudo systemctl daemon-reload
sudo systemctl start frpc
sudo systemctl enable frpc

# 检查状态
sudo systemctl status frpc

# 查看日志
sudo tail -f /opt/yyc3-nas-ecs/logs/frpc.log
```

### 阶段四：验证部署（预计15分钟）

#### 步骤1：验证外网访问

在您的电脑浏览器中，依次访问以下网址（替换0379.email为您的域名）：

| 服务 | 访问地址 | 说明 |
|------|----------|------|
| 管理面板 | https://admin.0379.email | 系统主界面 |
| API服务 | https://api.0379.email | API接口 |
| NAS服务 | https://nas.0379.email | 文件管理 |
| 邮件服务 | https://mail.0379.email | 邮箱管理 |
| 监控服务 | https://monitor.0379.email | 监控面板 |
| DDNS服务 | https://ddns.0379.email | DDNS配置 |
| LLM服务 | https://llm.0379.email | AI服务 |

**注意**：
- 首次访问可能会有SSL证书警告（如果是自签名证书），点击"继续访问"即可
- 如果使用Let's Encrypt证书，应该不会有警告

#### 步骤2：检查FRP连接

1. **访问FRP管理面板**
   - 浏览器访问：`http://SERVER_IP_PLACEHOLDER:7500`
   - 输入用户名和密码
   - 应该能看到所有连接的客户端

2. **检查隧道状态**
   - 在管理面板中，应该能看到7个隧道都处于"online"状态
   - 对应我们配置的7个服务

#### 步骤3：系统健康检查

```bash
# 在NAS上执行健康检查
cd /opt/yyc3-nas-ecs

# 检查API健康状态
curl http://localhost:6000/api/v2/health

# 应该返回：
# {"status": "ok", "version": "1.0.0"}

# 检查数据库连接
docker-compose exec postgres pg_isready -U DB_PASSWORD_PLACEHOLDER

# 应该返回：
# /var/run/postgresql:5432 - accepting connections

# 检查Redis连接
docker-compose exec redis redis-cli ping

# 应该返回：
# PONG
```

#### 步骤4：查看系统日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs api --tail=100

# 持续监控日志
docker-compose logs -f api
```

---

## 📋 系统管理指南

### 日常维护任务

#### 每日检查（5分钟）

1. **检查服务状态**
```bash
cd /opt/yyc3-nas-ecs
docker-compose ps
```
确保所有服务都在运行。

2. **查看系统监控**
- 访问 `https://monitor.0379.email`
- 查看CPU、内存、磁盘使用情况
- 注意是否有异常

3. **检查错误日志**
```bash
docker-compose logs api --tail=50 | grep -i error
```

#### 每周检查（15分钟）

1. **备份数据库**
```bash
# 手动备份数据库
docker-compose exec postgres pg_dump -U DB_PASSWORD_PLACEHOLDER DB_PASSWORD_PLACEHOLDER > backup_$(date +%Y%m%d).sql
```

2. **清理Docker缓存**
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune
```

3. **更新SSL证书**
```bash
# Let's Encrypt证书有效期为90天，建议每月更新一次
sudo certbot renew
sudo systemctl restart frps
```

#### 每月检查（30分钟）

1. **检查系统更新**
```bash
# 更新系统（Ubuntu）
sudo apt update
sudo apt upgrade -y

# 更新Docker镜像
docker-compose pull
docker-compose up -d
```

2. **检查备份完整性**
```bash
# 列出所有备份
ls -lh /opt/yyc3-nas-ecs/data/backups/

# 验证最近的备份文件
# （根据实际情况）
```

3. **审查安全日志**
```bash
# 查看认证日志
docker-compose logs api | grep -i "auth\|login"

# 检查异常登录
```

### 常用管理命令

#### 服务管理

```bash
# 进入项目目录
cd /opt/yyc3-nas-ecs

# 停止所有服务
docker-compose stop

# 启动所有服务
docker-compose start

# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart api
docker-compose restart postgres

# 停止并删除所有容器
docker-compose down

# 停止并删除所有容器和数据（慎用！）
docker-compose down -v
```

#### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs api

# 实时查看日志
docker-compose logs -f api

# 查看最近100行日志
docker-compose logs --tail=100 api

# 查看最近1小时的日志
docker-compose logs --since=1h api
```

#### 进入容器

```bash
# 进入API容器
docker-compose exec api bash

# 进入PostgreSQL容器
docker-compose exec postgres psql -U DB_PASSWORD_PLACEHOLDER

# 进入Redis容器
docker-compose exec redis redis-cli
```

#### 数据库管理

```bash
# 连接数据库
docker-compose exec postgres psql -U DB_PASSWORD_PLACEHOLDER

# 查看所有表
\dt

# 查看表结构
\d table_name

# 执行SQL查询
SELECT * FROM users LIMIT 10;

# 退出数据库
\q
```

### 性能优化建议

#### 1. 数据库优化

- 定期清理过期数据
- 创建必要的索引
- 配置适当的缓存大小

#### 2. 缓存优化

- 调整Redis内存配置
- 设置合适的缓存过期时间
- 监控缓存命中率

#### 3. 网络优化

- 使用CDN加速静态资源
- 启用HTTP/2
- 配置Gzip压缩

---

## ❓ 常见问题解答

### Q1：为什么我无法访问系统？

**可能原因和解决方法**：

1. **FRP客户端未连接**
   - 检查FRP客户端状态：`sudo systemctl status frpc`
   - 查看日志：`sudo tail -f /opt/yyc3-nas-ecs/logs/frpc.log`
   - 确认FRP服务器地址和端口正确

2. **防火墙阻止**
   - 检查NAS防火墙是否开放必要端口
   - 检查阿里云安全组规则是否正确配置

3. **DNS未解析**
   - 使用`ping 0379.email`检查域名是否解析到正确的IP
   - 等待DNS生效（可能需要几分钟到几小时）

4. **服务未启动**
   - 检查Docker服务状态：`docker-compose ps`
   - 查看服务日志：`docker-compose logs`

### Q2：忘记密码怎么办？

**解决方法**：

1. **忘记系统登录密码**
   - 需要重新设置用户密码
   - 执行数据库操作重置密码

2. **忘记FRP服务器密码**
   - SSH登录到ECS
   - 编辑配置文件：`sudo vi /etc/frp/frps.toml`
   - 修改密码后重启服务：`sudo systemctl restart frps`

3. **忘记数据库密码**
   - 编辑`.env`文件
   - 重启服务：`docker-compose restart postgres`

### Q3：系统运行很慢怎么办？

**解决方法**：

1. **检查资源使用**
   - 访问监控面板
   - 查看CPU、内存、磁盘使用率
   - 如果接近100%，考虑升级硬件

2. **清理磁盘空间**
```bash
# 清理Docker缓存
docker system prune -a

# 清理系统日志
sudo journalctl --vacuum-time=7d

# 清理旧备份
find /opt/yyc3-nas-ecs/data/backups/ -mtime +30 -delete
```

3. **优化数据库**
```bash
# 进入数据库
docker-compose exec postgres psql -U DB_PASSWORD_PLACEHOLDER

# 执行VACUUM清理
VACUUM ANALYZE;
```

### Q4：如何备份数据？

**完整备份步骤**：

```bash
# 1. 停止服务
cd /opt/yyc3-nas-ecs
docker-compose stop

# 2. 备份数据目录
tar -czf backup_$(date +%Y%m%d).tar.gz data/

# 3. 备份配置文件
tar -czf config_$(date +%Y%m%d).tar.gz .env frpc.toml

# 4. 重新启动服务
docker-compose start

# 5. 将备份文件复制到安全位置
```

### Q5：如何恢复数据？

**恢复步骤**：

```bash
# 1. 停止服务
cd /opt/yyc3-nas-ecs
docker-compose stop

# 2. 恢复数据目录
rm -rf data/
tar -xzf backup_20260211.tar.gz

# 3. 恢复配置文件
tar -xzf config_20260211.tar.gz

# 4. 重新启动服务
docker-compose start
```

### Q6：SSL证书过期怎么办？

**解决方法**：

```bash
# 1. SSH登录到ECS
ssh root@SERVER_IP_PLACEHOLDER

# 2. 更新证书
sudo certbot renew

# 3. 重启FRP服务
sudo systemctl restart frps

# 4. 验证证书
sudo certbot certificates
```

### Q7：如何升级系统？

**升级步骤**：

```bash
# 1. 备份数据（参考Q4）

# 2. 拉取最新代码
cd /opt/yyc3-nas-ecs
git pull origin main

# 3. 更新配置（如果有新配置）
# 根据新版本的说明更新.env等配置文件

# 4. 重建并启动服务
docker-compose down
docker-compose pull
docker-compose up -d

# 5. 验证升级
# 访问系统，检查所有功能正常
```

### Q8：如何查看服务日志？

**查看日志的方法**：

```bash
# 方法1：使用docker-compose
cd /opt/yyc3-nas-ecs
docker-compose logs api

# 方法2：查看日志文件
tail -f /opt/yyc3-nas-ecs/logs/api.log

# 方法3：进入容器查看
docker-compose exec api bash
cat /app/logs/api.log
```

### Q9：如何添加新用户？

**添加用户的步骤**：

1. 通过管理界面添加（如果有用户管理功能）
2. 或者直接操作数据库：

```bash
# 连接数据库
docker-compose exec postgres psql -U DB_PASSWORD_PLACEHOLDER

# 插入新用户（根据实际表结构）
INSERT INTO users (username, password, email, role, created_at)
VALUES ('newuser', 'hashed_password', 'newuser@example.com', 'user', NOW());

# 退出
\q
```

### Q10：为什么FRP连接失败？

**可能原因**：

1. **服务器和客户端密码不一致**
   - 检查服务器配置：`/etc/frp/frps.toml`
   - 检查客户端配置：`/opt/yyc3-nas-ecs/frpc.toml`
   - 确保`auth.token`完全一致

2. **网络不通**
   - 在NAS上测试连接：`telnet SERVER_IP_PLACEHOLDER 7001`
   - 检查防火墙规则

3. **FRP服务未运行**
   - 检查服务器状态：`sudo systemctl status frps`
   - 检查客户端状态：`sudo systemctl status frpc`

---

## 📞 获取技术支持

### 官方支持渠道

| 渠道 | 地址 | 说明 |
|------|------|------|
| 项目主页 | https://github.com/YYC-Cube/YYC3-NAS-ECS | 查看最新代码和文档 |
| 问题反馈 | https://github.com/YYC-Cube/YYC3-NAS-ECS/issues | 提交问题和建议 |
| 邮件支持 | admin@0379.email | 发送邮件咨询 |
| 官方文档 | /docs/ | 查看完整技术文档 |

### 提问时请提供以下信息

为了快速解决问题，请在提问时提供：

1. **系统环境**
   - 操作系统版本
   - 硬件配置（CPU、内存、磁盘）
   - Docker版本

2. **问题描述**
   - 遇到的具体问题
   - 问题发生的频率
   - 问题发生时在做什么

3. **错误信息**
   - 完整的错误日志
   - 截图或录屏（如果是界面问题）

4. **已尝试的解决方法**
   - 您已经尝试过哪些方法
   - 结果如何

### 紧急情况处理

如果遇到严重问题（如数据丢失、系统无法启动）：

1. **立即停止所有操作**
   - 不要继续尝试各种命令
   - 避免进一步损坏数据

2. **备份当前状态**
   - 如果可能，先备份所有日志
   - 备份当前配置

3. **联系专业技术人员**
   - 通过邮件或电话联系技术支持
   - 提供详细的错误日志

---

## 📊 附录：快速参考

### 服务端口速查表

| 服务 | 内部端口 | 外部域名 | 说明 |
|------|----------|----------|------|
| FRP服务器通信 | 7001 | - | FRP服务器和客户端通信 |
| FRP管理面板 | 7500 | - | FRP Web管理界面 |
| API主服务 | 6000 | api.0379.email | 系统核心API |
| 管理面板 | 6001 | admin.0379.email | 系统主界面 |
| LLM服务 | 6002 | llm.0379.email | AI服务 |
| 邮件服务 | 6003 | mail.0379.email | 邮箱管理 |
| NAS服务 | 6009 | nas.0379.email | 文件管理 |
| 监控服务 | 6006 | monitor.0379.email | 系统监控 |
| DDNS服务 | 6007 | ddns.0379.email | 动态域名 |
| PostgreSQL | 5432 | - | 数据库 |
| Redis | 6379 | - | 缓存 |

### 常用命令速查表

```bash
# ===== 服务管理 =====
docker-compose up -d        # 启动所有服务
docker-compose down        # 停止所有服务
docker-compose restart      # 重启所有服务
docker-compose ps         # 查看服务状态

# ===== 日志查看 =====
docker-compose logs        # 查看所有日志
docker-compose logs -f    # 实时查看日志
docker-compose logs api   # 查看特定服务日志

# ===== 进入容器 =====
docker-compose exec api bash    # 进入API容器
docker-compose exec postgres psql -U DB_PASSWORD_PLACEHOLDER  # 进入数据库

# ===== 数据库操作 =====
pg_dump -U DB_PASSWORD_PLACEHOLDER DB_PASSWORD_PLACEHOLDER > backup.sql  # 备份数据库
psql -U DB_PASSWORD_PLACEHOLDER DB_PASSWORD_PLACEHOLDER < backup.sql   # 恢复数据库

# ===== FRP管理 =====
sudo systemctl start frps   # 启动FRP服务器
sudo systemctl stop frps    # 停止FRP服务器
sudo systemctl status frps  # 查看FRP服务器状态
sudo systemctl start frpc   # 启动FRP客户端
sudo systemctl stop frpc    # 停止FRP客户端
sudo systemctl status frpc  # 查看FRP客户端状态

# ===== 系统检查 =====
docker ps               # 查看所有容器
docker images           # 查看所有镜像
df -h                  # 查看磁盘使用
free -h                # 查看内存使用
top                    # 查看CPU使用
```

### 配置文件位置速查表

| 配置文件 | 位置 | 说明 |
|---------|------|------|
| 环境变量 | /opt/yyc3-nas-ecs/.env | 系统主要配置 |
| FRP客户端配置 | /opt/yyc3-nas-ecs/frpc.toml | FRP客户端设置 |
| FRP服务器配置 | /etc/frp/frps.toml | FRP服务器设置 |
| Docker配置 | /opt/yyc3-nas-ecs/docker-compose.yml | 容器编排配置 |
| Nginx配置 | /opt/yyc3-nas-ecs/docker/nginx/ | Web服务器配置 |
| 系统日志 | /opt/yyc3-nas-ecs/logs/ | 所有服务日志 |
| 数据目录 | /opt/yyc3-nas-ecs/data/ | 数据库和文件数据 |
| 备份目录 | /opt/yyc3-nas-ecs/data/backups/ | 备份文件 |

---

## ✅ 部署检查清单

在您认为部署完成后，请逐项检查以下清单：

### 阿里云ECS部分

- [ ] ECS实例正常运行
- [ ] SSH可以正常连接
- [ ] FRP服务器已安装
- [ ] FRP服务器已启动（`systemctl status frps`）
- [ ] SSL证书已申请并有效
- [ ] 防火墙规则已配置
- [ ] FRP管理面板可以访问（`http://IP:7500`）
- [ ] 所有端口已开放

### 本地NAS部分

- [ ] Docker已安装
- [ ] Docker Compose已安装
- [ ] 项目代码已下载
- [ ] 环境变量已配置（`.env`）
- [ ] FRP客户端已配置（`frpc.toml`）
- [ ] 所有Docker服务已启动（`docker-compose ps`）
- [ ] FRP客户端已启动（`systemctl status frpc`）

### 功能验证部分

- [ ] 可以访问管理面板（`https://admin.0379.email`）
- [ ] 可以访问API服务（`https://api.0379.email`）
- [ ] 可以访问NAS服务（`https://nas.0379.email`）
- [ ] 可以访问邮件服务（`https://mail.0379.email`）
- [ ] 可以访问监控服务（`https://monitor.0379.email`）
- [ ] 可以访问DDNS服务（`https://ddns.0379.email`）
- [ ] 可以访问LLM服务（`https://llm.0379.email`）
- [ ] FRP管理面板显示所有隧道在线
- [ ] 可以登录系统
- [ ] 监控面板显示数据

### 备份和安全部分

- [ ] 已创建备份脚本
- [ ] 已测试备份功能
- [ ] 已设置定期备份计划
- [ ] 已更改所有默认密码
- [ ] 已配置防火墙规则
- [ ] 已设置监控告警

---

## 🎉 恭喜您完成部署！

如果所有检查项都已完成，说明您已经成功部署了YYC³ NAS-ECS系统！

### 接下来您可以：

1. **开始使用系统**
   - 登录管理面板：`https://admin.0379.email`
   - 探索各项功能

2. **配置个性化设置**
   - 设置监控告警阈值
   - 配置邮件服务
   - 设置用户权限

3. **开始日常维护**
   - 每日检查服务状态
   - 每周备份数据
   - 每月更新系统

4. **持续学习**
   - 阅读官方文档
   - 参加社区讨论
   - 分享使用经验

---

## 📜 文档版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| 1.0.0 | 2026-02-11 | YYC³ Team | 初始版本 |

---

<div align="center">

> **「YanYuCloudCube」**
>
> **言启象限 | 语枢未来**
>
> **Words Initiate Quadrants, Language Serves as Core for the Future**
>
> **万象归元于云枢 | 深栈智启新纪元**
>
> **All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence**

**版权所有 © 2026 YYC³ Team. 保留所有权利.**

</div>
