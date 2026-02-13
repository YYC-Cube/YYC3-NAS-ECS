# YYC³ NAS-ECS 环境变量配置指导文档

> **文档版本**: 1.0.0  
> **创建日期**: 2026-02-09  
> **作者**: YYC³ Team  
> **最后更新**: 2026-02-09

---

## 📋 目录

1. [环境变量文件结构](#环境变量文件结构)
2. [变量分类说明](#变量分类说明)
3. [未填写变量指导](#未填写变量指导)
4. [安全最佳实践](#安全最佳实践)
5. [常见问题解答](#常见问题解答)

---

## 环境变量文件结构

### 文件层次关系

```
YYC3-NAS-ECS/
├── .env.example                    # 主环境变量模板（根级别）
├── .env                            # 主环境变量（本地开发）
├── .env.development                # 开发环境
├── .env.staging                    # 预发布环境
├── .env.production                 # 生产环境
├── .env.local                      # 本地覆盖配置
├── .env.ports                      # 端口配置
├── .env.docs.example               # 文档生成配置
├── api/
│   ├── .env.example                # API服务环境变量模板
│   └── .env                        # API服务环境变量
├── config/
│   ├── .env.base                   # 基础配置
│   ├── .env.development            # 开发环境配置
│   └── .env.production             # 生产环境配置
├── config/services/
│   ├── .env.example                # 服务配置模板
│   ├── .env                        # 服务配置
│   └── .env.local                  # 本地服务配置
├── services/
│   ├── ai/.env.example             # AI服务配置
│   ├── ddns/.env.local             # DDNS服务配置
│   ├── frp/.env.local              # FRP服务配置
│   ├── llm/.env.example            # LLM服务配置
│   ├── mail/.env.example           # 邮件服务配置
│   └── redis/
│       ├── .env.example            # Redis配置模板
│       ├── .env                    # Redis配置
│       ├── .env.local              # Redis本地配置
│       ├── api/.env.example        # Redis API配置
│       └── config/.env.example     # Redis配置文件
└── deploy/
    └── staging/.env.staging.template # 预发布环境模板
```

### 文件用途说明

| 文件路径 | 用途 | 是否提交到Git |
|---------|------|--------------|
| `.env.example` | 主环境变量模板，包含所有配置项 | ✅ 是 |
| `.env` | 本地开发环境变量 | ❌ 否 |
| `.env.development` | 开发环境配置 | ❌ 否 |
| `.env.staging` | 预发布环境配置 | ❌ 否 |
| `.env.production` | 生产环境配置 | ❌ 否 |
| `.env.local` | 本地覆盖配置（优先级最高） | ❌ 否 |
| `.env.ports` | 端口映射配置 | ❌ 否 |
| `api/.env.example` | API服务模板 | ✅ 是 |
| `api/.env` | API服务配置 | ❌ 否 |
| `services/redis/.env.example` | Redis模板 | ✅ 是 |
| `services/redis/.env.local` | Redis本地配置 | ❌ 否 |

---

## 变量分类说明

### 1. 基础设施配置

#### 数据库配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `POSTGRES_USER` | `DB_PASSWORD_PLACEHOLDER` | PostgreSQL用户名 | ✅ 是 |
| `POSTGRES_PASSWORD` | `DB_PASSWORD_PLACEHOLDER` | PostgreSQL密码 | ✅ 是 |
| `POSTGRES_DB` | `DB_PASSWORD_PLACEHOLDER` | PostgreSQL数据库名 | ✅ 是 |
| `POSTGRES_PORT` | `5432` | PostgreSQL端口 | ✅ 是 |

#### Redis配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `REDIS_URL` | `redis://redis:6379/0` | Redis连接URL | ✅ 是 |
| `REDIS_PASSWORD` | `redis_yyc3` | Redis密码 | ✅ 是 |
| `REDIS_PORT` | `6379` | Redis端口 | ✅ 是 |
| `REDIS_DEV_PORT` | `6381` | 开发环境Redis端口 | ✅ 是 |
| `REDIS_PROD_PORT` | `6380` | 生产环境Redis端口 | ✅ 是 |

#### 消息队列配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `KAFKA_BROKER` | `kafka:9092` | Kafka代理地址 | ⚠️ 可选 |

### 2. 网络和域名配置

#### DDNS配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `NAS_DOMAIN` | `ddns.0379.email` | NAS域名 | ✅ 是 |
| `NAS_SERVER_IP` | `SERVER_IP_PLACEHOLDER` | ECS服务器IP | ✅ 是 |
| `NAS_LOCAL_IP` | `192.168.3.45` | 本地NAS IP | ✅ 是 |
| `NAS_SERVER_NAME` | `yyc3-33` | 服务器名称 | ✅ 是 |

#### 阿里云DDNS配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `ALIYUN_ACCESS_KEY_ID` | - | 阿里云AccessKey ID | ✅ 是 |
| `ALIYUN_ACCESS_KEY_SECRET` | - | 阿里云AccessKey Secret | ✅ 是 |
| `ALIYUN_REGION_ID` | `cn-beijing` | 阿里云区域ID | ✅ 是 |
| `ALIYUN_DOMAIN` | `0379.email` | 域名 | ✅ 是 |
| `ALIYUN_SUB_DOMAIN` | `ddns` | 子域名 | ✅ 是 |
| `ALIYUN_TTL` | `600` | DNS TTL（秒） | ✅ 是 |

### 3. 服务端口配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `API_PORT` | `3200` | API服务端口 | ✅ 是 |
| `API_WS_PORT` | `8443` | API WebSocket端口 | ✅ 是 |
| `PROMETHEUS_PORT` | `9090` | Prometheus端口 | ✅ 是 |
| `GRAFANA_PORT` | `3000` | Grafana端口 | ✅ 是 |
| `NGINX_PORT` | `80` | Nginx HTTP端口 | ✅ 是 |

### 4. 安全配置

#### JWT和密钥配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `JWT_SECRET_KEY` | - | JWT密钥 | ✅ 是 |
| `SESSION_SECRET` | - | 会话密钥 | ✅ 是 |
| `SECRET_KEY` | - | 应用密钥 | ✅ 是 |

#### 密码策略配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `PASSWORD_MIN_LENGTH` | `8` | 密码最小长度 | ✅ 是 |
| `PASSWORD_REQUIRE_UPPERCASE` | `true` | 要求大写字母 | ✅ 是 |
| `PASSWORD_REQUIRE_LOWERCASE` | `true` | 要求小写字母 | ✅ 是 |
| `PASSWORD_REQUIRE_NUMBER` | `true` | 要求数字 | ✅ 是 |
| `PASSWORD_REQUIRE_SPECIAL` | `true` | 要求特殊字符 | ✅ 是 |

#### 会话安全配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `SESSION_SECURE` | `true` | 启用安全会话 | ✅ 是 |
| `SESSION_HTTP_ONLY` | `true` | HTTP Only Cookie | ✅ 是 |
| `SESSION_SAME_SITE` | `lax` | SameSite策略 | ✅ 是 |

#### 速率限制配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `RATE_LIMIT_WINDOW` | `15` | 速率限制窗口（秒） | ✅ 是 |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | 最大请求数 | ✅ 是 |

### 5. AI服务配置

#### OpenAI配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `OPENAI_API_KEY` | - | OpenAI API密钥 | ⚠️ 可选 |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI API地址 | ⚠️ 可选 |
| `LLM_MODEL` | `gpt-4-turbo-preview` | LLM模型名称 | ⚠️ 可选 |
| `MAX_TOKENS` | `4000` | 最大Token数 | ⚠️ 可选 |
| `TEMPERATURE` | `0.7` | 温度参数 | ⚠️ 可选 |

#### 本地LLM配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `LOCAL_LLM_URL` | `http://localhost:11434/v1` | 本地LLM地址 | ⚠️ 可选 |
| `LOCAL_LLM_MODEL` | `deepseek-r1:7b` | 本地LLM模型 | ⚠️ 可选 |

### 6. 邮件服务配置

#### IMAP配置（接收邮件）

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `MAIL_SERVER` | `imap.gmail.com` | IMAP服务器 | ✅ 是 |
| `MAIL_PORT` | `993` | IMAP端口 | ✅ 是 |
| `MAIL_USER` | `admin@0379.email` | 邮箱用户名 | ✅ 是 |
| `MAIL_PASSWORD` | - | 邮箱密码或应用专用密码 | ✅ 是 |

#### SMTP配置（发送邮件）

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `SMTP_SERVER` | `smtp.gmail.com` | SMTP服务器 | ✅ 是 |
| `SMTP_PORT` | `587` | SMTP端口 | ✅ 是 |
| `SMTP_USER` | `admin@0379.email` | SMTP用户名 | ✅ 是 |
| `SMTP_PASSWORD` | - | SMTP密码或应用专用密码 | ✅ 是 |

### 7. 监控和告警配置

#### 监控配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `MONITOR_ENABLED` | `true` | 启用监控 | ✅ 是 |
| `MONITOR_CHECK_INTERVAL` | `1800` | 监控检查间隔（秒） | ✅ 是 |
| `HEALTH_CHECK_INTERVAL` | `60` | 健康检查间隔（秒） | ✅ 是 |
| `HEALTH_CHECK_TIMEOUT` | `30` | 健康检查超时（秒） | ✅ 是 |

#### 告警配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `ALERT_ENABLED` | `true` | 启用告警 | ✅ 是 |
| `ALERT_EMAIL` | `admin@0379.email` | 告警邮箱 | ✅ 是 |
| `ALERT_WEBHOOK_URL` | - | 告警Webhook URL | ⚠️ 可选 |

#### 告警阈值配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `MONITOR_ALERT_THRESHOLD_CPU` | `90` | CPU告警阈值（%） | ✅ 是 |
| `MONITOR_ALERT_THRESHOLD_MEM` | `90` | 内存告警阈值（%） | ✅ 是 |
| `MONITOR_ALERT_THRESHOLD_DISK` | `90` | 磁盘告警阈值（%） | ✅ 是 |

### 8. 通知配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `NOTIFICATION_ENABLED` | `false` | 启用通知 | ✅ 是 |
| `NOTIFICATION_TYPE` | - | 通知类型（email/telegram/slack） | ⚠️ 可选 |
| `NOTIFICATION_EMAIL` | `admin@0379.email` | 通知邮箱 | ⚠️ 可选 |
| `NOTIFICATION_TELEGRAM_BOT_TOKEN` | - | Telegram Bot Token | ⚠️ 可选 |
| `NOTIFICATION_TELEGRAM_CHAT_ID` | - | Telegram Chat ID | ⚠️ 可选 |

### 9. 备份配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `BACKUP_ENABLED` | `true` | 启用备份 | ✅ 是 |
| `BACKUP_SCHEDULE` | `0 2 * * *` | 备份计划（Cron表达式） | ✅ 是 |
| `BACKUP_RETENTION_DAYS` | `7` | 备份保留天数 | ✅ 是 |
| `BACKUP_STORAGE_TYPE` | `local` | 备份存储类型 | ✅ 是 |
| `BACKUP_LOCAL_PATH` | `/opt/nas-ecs/backup` | 本地备份路径 | ✅ 是 |

#### S3备份配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `BACKUP_S3_BUCKET` | `yyc3-backup-0379` | S3存储桶名称 | ⚠️ 可选 |
| `BACKUP_S3_REGION` | `cn-beijing` | S3区域 | ⚠️ 可选 |
| `BACKUP_S3_ACCESS_KEY` | - | S3访问密钥 | ⚠️ 可选 |
| `BACKUP_S3_SECRET_KEY` | - | S3密钥 | ⚠️ 可选 |

### 10. 性能优化配置

#### 缓存配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `CACHE_ENABLED` | `true` | 启用缓存 | ✅ 是 |
| `CACHE_TTL` | `3600` | 缓存TTL（秒） | ✅ 是 |
| `CACHE_MAX_SIZE` | `1000` | 最大缓存条目数 | ✅ 是 |

#### 连接池配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `DB_POOL_MIN` | `2` | 数据库最小连接数 | ✅ 是 |
| `DB_POOL_MAX` | `10` | 数据库最大连接数 | ✅ 是 |
| `REDIS_POOL_SIZE` | `10` | Redis连接池大小 | ✅ 是 |

### 11. 路径配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `NAS_BASE_DIR` | `/opt/yyc3` | NAS基础目录 | ✅ 是 |
| `NAS_SCRIPTS_DIR` | `/opt/nas-ecs/scripts` | 脚本目录 | ✅ 是 |
| `NAS_DDNS_DIR` | `/opt/nas-ecs/ddns` | DDNS目录 | ✅ 是 |
| `NAS_WEB_DIR` | `/opt/nas-ecs/web/nas` | Web目录 | ✅ 是 |
| `NAS_LOGS_DIR` | `/opt/nas-ecs/logs` | 日志目录 | ✅ 是 |
| `NAS_REPORTS_DIR` | `/opt/nas-ecs/reports` | 报告目录 | ✅ 是 |
| `NAS_RUN_DIR` | `/opt/nas-ecs/run` | 运行目录 | ✅ 是 |
| `NAS_BACKUP_DIR` | `/opt/nas-ecs/backup` | 备份目录 | ✅ 是 |

### 12. 系统服务配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `SYSTEMD_SERVICE_DIR` | `/etc/systemd/system` | Systemd服务目录 | ✅ 是 |
| `DDNS_SERVICE` | `yyc3-ddns.service` | DDNS服务名称 | ✅ 是 |
| `DDNS_TIMER` | `yyc3-ddns.timer` | DDNS定时器名称 | ✅ 是 |
| `MONITOR_SERVICE` | `nas-monitor.service` | 监控服务名称 | ✅ 是 |
| `MONITOR_TIMER` | `nas-monitor.timer` | 监控定时器名称 | ✅ 是 |
| `REPORT_SERVICE` | `nas-daily-report.service` | 报告服务名称 | ✅ 是 |
| `REPORT_TIMER` | `nas-daily-report.timer` | 报告定时器名称 | ✅ 是 |

### 13. 开发工具配置

| 变量名 | 默认值 | 说明 | 是否必须 |
|-------|--------|------|---------|
| `DEBUG` | `true` | 调试模式 | ⚠️ 可选 |
| `HOT_RELOAD` | `true` | 热重载 | ⚠️ 可选 |
| `SOURCE_MAPS` | `true` | 源码映射 | ⚠️ 可选 |
| `LOG_LEVEL` | `debug` | 日志级别 | ✅ 是 |
| `NODE_ENV` | `development` | Node环境 | ✅ 是 |

---

## 未填写变量指导

### 1. 阿里云AccessKey配置

#### ALIYUN_ACCESS_KEY_ID

**变量值示例**: `your-aliyun-access-key-id`

**释义**: 阿里云访问密钥ID，用于调用阿里云API服务（如DDNS、OSS等）

**获取途径**:
1. 登录阿里云控制台：https://console.aliyun.com/
2. 点击右上角头像 → 访问控制
3. 选择"人员管理" → "用户"
4. 创建新用户或选择现有用户
5. 点击"创建AccessKey"
6. 保存AccessKey ID和AccessKey Secret

**安全建议**:
- ✅ 使用RAM子账号，不要使用主账号
- ✅ 为AccessKey设置最小权限策略
- ✅ 定期轮换AccessKey（建议每90天）
- ✅ 启用MFA多因素认证
- ❌ 不要将AccessKey提交到代码仓库

**权限策略示例**:
```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "alidns:AddDomainRecord",
        "alidns:UpdateDomainRecord",
        "alidns:DescribeDomainRecords",
        "alidns:DescribeSubDomainRecords"
      ],
      "Resource": [
        "acs:alidns:*:*:domain/0379.email"
      ]
    }
  ]
}
```

#### ALIYUN_ACCESS_KEY_SECRET

**变量值示例**: `your-aliyun-access-key-secret`

**释义**: 阿里云访问密钥Secret，与AccessKey ID配合使用

**获取途径**: 与AccessKey ID同时生成，创建时一次性显示

**安全建议**:
- ✅ 立即保存到安全的地方（密码管理器）
- ✅ 使用环境变量或密钥管理服务存储
- ❌ 不要在日志中打印
- ❌ 不要在代码中硬编码

---

### 2. JWT密钥配置

#### JWT_SECRET_KEY

**变量值示例**: `YYC3_JWT_SECRET_KEY_2026_02_09_SECURE_RANDOM_STRING_64_CHARS_LONG`

**释义**: JWT（JSON Web Token）签名密钥，用于验证用户身份和会话管理

**获取途径**:

**方法1: 使用openssl生成（推荐）**
```bash
openssl rand -base64 64
```

**方法2: 使用Node.js生成**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**方法3: 使用Python生成**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

**安全建议**:
- ✅ 使用至少64字符的随机字符串
- ✅ 包含大小写字母、数字和特殊字符
- ✅ 每个环境使用不同的密钥
- ❌ 不要使用简单密码或常用词
- ❌ 不要在不同环境共享密钥

---

### 3. 会话密钥配置

#### SESSION_SECRET

**变量值示例**: `YYC3_SESSION_SECRET_2026_02_09_SECURE_RANDOM_STRING_64_CHARS_LONG_FOR_SESSION_MANAGEMENT`

**释义**: 会话管理密钥，用于加密和验证用户会话Cookie

**获取途径**: 与JWT_SECRET_KEY相同，使用随机生成工具

**安全建议**:
- ✅ 使用至少64字符的随机字符串
- ✅ 与JWT_SECRET_KEY使用不同的密钥
- ✅ 定期轮换（建议每180天）
- ❌ 不要在URL中暴露

---

### 4. 邮件服务密码配置

#### MAIL_PASSWORD / SMTP_PASSWORD

**变量值示例**: `abcd efgh ijkl mnop`（Gmail应用专用密码，16字符，空格分隔）

**释义**: 邮箱应用专用密码，用于IMAP和SMTP认证

**获取途径（以Gmail为例）**:

1. **启用两步验证**:
   - 访问 https://myaccount.google.com/security
   - 启用"两步验证"

2. **生成应用专用密码**:
   - 访问 https://myaccount.google.com/apppasswords
   - 选择"邮件"和"其他（自定义名称）"
   - 输入名称（如：YYC3-NAS-ECS）
   - 点击"生成"
   - 复制16位密码（格式：xxxx xxxx xxxx xxxx）

**获取途径（以QQ邮箱为例）**:

1. **开启SMTP服务**:
   - 访问 https://mail.qq.com/
   - 设置 → 账户
   - 开启"POP3/SMTP服务"
   - 发送短信验证
   - 获取授权码

**安全建议**:
- ✅ 使用应用专用密码，不要使用账户密码
- ✅ 为每个应用生成不同的专用密码
- ✅ 定期更换应用专用密码
- ❌ 不要在代码中硬编码
- ❌ 不要在日志中记录

**其他邮箱服务商配置**:

| 邮箱服务商 | IMAP服务器 | SMTP服务器 | 端口 |
|-----------|-----------|-----------|------|
| Gmail | imap.gmail.com | smtp.gmail.com | 993/587 |
| QQ邮箱 | imap.qq.com | smtp.qq.com | 993/587 |
| 163邮箱 | imap.163.com | smtp.163.com | 993/465 |
| Outlook | outlook.office365.com | smtp-mail.outlook.com | 993/587 |

---

### 5. OpenAI API密钥配置

#### OPENAI_API_KEY

**变量值示例**: `sk-proj-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

**释义**: OpenAI API访问密钥，用于调用GPT、DALL-E等AI服务

**获取途径**:

1. **注册OpenAI账户**:
   - 访问 https://platform.openai.com/
   - 注册并登录

2. **创建API密钥**:
   - 访问 https://platform.openai.com/api-keys
   - 点击"Create new secret key"
   - 输入密钥名称（可选）
   - 点击"Create secret key"
   - 复制密钥（仅显示一次）

**安全建议**:
- ✅ 立即保存到安全的地方
- ✅ 设置使用限额和预算告警
- ✅ 定期检查API使用情况
- ❌ 不要在前端代码中使用
- ❌ 不要在公共仓库中暴露

**计费说明**:
- GPT-4: $0.03/1K tokens（输入）+ $0.06/1K tokens（输出）
- GPT-4 Turbo: $0.01/1K tokens（输入）+ $0.03/1K tokens（输出）
- GPT-3.5 Turbo: $0.0005/1K tokens（输入）+ $0.0015/1K tokens（输出）

---

### 6. Telegram Bot配置

#### NOTIFICATION_TELEGRAM_BOT_TOKEN

**变量值示例**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

**释义**: Telegram Bot API令牌，用于通过Bot发送通知消息

**获取途径**:

1. **创建Telegram Bot**:
   - 在Telegram中搜索 @BotFather
   - 发送 `/newbot` 命令
   - 按提示设置Bot名称和用户名
   - 获取Bot Token（格式：`数字:字母数字串`）

2. **获取Chat ID**:
   - 向你的Bot发送任意消息
   - 访问 https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   - 在返回结果中找到 `"chat":{"id":数字}`
   - 该数字就是Chat ID

**安全建议**:
- ✅ 限制Bot的权限和功能
- ✅ 设置Bot为私有（仅授权用户可访问）
- ✅ 定期检查Bot的使用日志
- ❌ 不要在公开渠道分享Bot Token

#### NOTIFICATION_TELEGRAM_CHAT_ID

**变量值示例**: `123456789` 或 `-1001234567890`

**释义**: Telegram聊天ID，指定接收通知的聊天对象

**获取途径**: 见上方"获取Chat ID"步骤

**说明**:
- 个人聊天ID: 正数（如：`123456789`）
- 群组/频道ID: 负数（如：`-1001234567890`）

---

### 7. S3备份配置

#### BACKUP_S3_ACCESS_KEY / BACKUP_S3_SECRET_KEY

**变量值示例**: 
- Access Key: `your-aliyun-access-key-id`
- Secret Key: `your-aliyun-access-key-secret`

**释义**: 对象存储服务访问密钥，用于备份文件上传

**获取途径（阿里云OSS）**:

1. **创建OSS存储桶**:
   - 访问 https://oss.console.aliyun.com/
   - 创建Bucket（如：`yyc3-backup-0379`）
   - 选择区域（如：`cn-beijing`）

2. **创建RAM用户**:
   - 访问 https://ram.console.aliyun.com/
   - 创建RAM用户
   - 创建AccessKey

3. **授权权限**:
   - 为RAM用户添加OSS权限策略
   - 推荐策略：`AliyunOSSFullAccess`（生产环境建议使用自定义策略限制到特定Bucket）

**权限策略示例**:
```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "oss:PutObject",
        "oss:GetObject",
        "oss:DeleteObject",
        "oss:ListObjects"
      ],
      "Resource": [
        "acs:oss:*:*:yyc3-backup-0379/*"
      ]
    }
  ]
}
```

**安全建议**:
- ✅ 使用独立的RAM用户
- ✅ 限制权限到特定Bucket
- ✅ 启用Bucket版本控制
- ✅ 启用Bucket加密
- ❌ 不要使用主账号AccessKey

---

### 8. 数据库密码配置

#### POSTGRES_PASSWORD

**变量值示例**: `Yyc3_P0stgr3s_P@ssw0rd_2026_Secure_64_Chars`

**释义**: PostgreSQL数据库密码

**获取途径**: 使用密码生成工具

**生成方法**:
```bash
# 使用openssl
openssl rand -base64 32

# 使用pwgen
pwgen -s 32 1

# 使用Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**安全建议**:
- ✅ 使用至少32字符的强密码
- ✅ 包含大小写字母、数字和特殊字符
- ✅ 每个环境使用不同的密码
- ✅ 定期轮换（建议每180天）
- ❌ 不要使用默认密码
- ❌ 不要在代码中硬编码

---

### 9. Redis密码配置

#### REDIS_PASSWORD

**变量值示例**: `Yyc3_R3dis_P@ssw0rd_2026_Secure_32_Chars`

**释义**: Redis缓存服务密码

**获取途径**: 与POSTGRES_PASSWORD相同

**安全建议**:
- ✅ 使用至少32字符的强密码
- ✅ 在redis.conf中配置requirepass
- ✅ 禁用危险命令（FLUSHALL、CONFIG等）
- ✅ 启用TLS加密（生产环境）
- ❌ 不要使用默认密码

**Redis配置示例**:
```conf
# redis.conf
requirepass Yyc3_R3dis_P@ssw0rd_2026_Secure_32_Chars
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command CONFIG ""
```

---

### 10. Webhook URL配置

#### ALERT_WEBHOOK_URL

**变量值示例**: `https://webhook.0379.email/alert`

**释义**: 告警通知Webhook地址，用于接收系统告警信息

**获取途径**: 需要自行搭建或使用第三方Webhook服务

**可选方案**:

1. **自建Webhook服务**:
   - 使用Node.js/Python搭建简单的HTTP服务
   - 接收POST请求并转发到通知渠道

2. **使用第三方服务**:
   - Server酱: https://sct.ftqq.com/
   - Bark: https://github.com/Finb/Bark
   - 钉钉/企业微信机器人

**示例代码（Node.js）**:
```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/alert', (req, res) => {
  const { level, message, timestamp } = req.body;
  console.log(`[${level}] ${message} at ${timestamp}`);
  // 转发到Telegram、邮件等
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

---

## 安全最佳实践

### 1. 环境变量管理

#### ✅ 推荐做法

- **使用.env.example模板**: 将所有配置项的示例值提交到Git
- **本地.env文件**: 添加到.gitignore，不提交到版本控制
- **分层配置**: 使用.env.base、.env.development、.env.production等分层管理
- **密钥管理服务**: 生产环境使用AWS Secrets Manager、阿里云KMS等

#### ❌ 避免做法

- 不要在代码中硬编码密钥和密码
- 不要在日志中打印敏感信息
- 不要在URL中传递敏感参数
- 不要使用默认密码或弱密码

### 2. 密钥生成和轮换

#### 密钥生成工具

```bash
# JWT密钥
openssl rand -base64 64

# 数据库密码
pwgen -s 32 1

# API密钥
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

#### 密钥轮换策略

- **JWT_SECRET_KEY**: 每90天轮换一次
- **SESSION_SECRET**: 每180天轮换一次
- **数据库密码**: 每180天轮换一次
- **API密钥**: 每90天轮换一次
- **AccessKey**: 每90天轮换一次

### 3. 权限最小化原则

- **RAM用户**: 仅授予必要的权限
- **数据库用户**: 仅授予必要的数据库权限
- **API密钥**: 设置IP白名单和使用限额
- **防火墙规则**: 仅开放必要的端口

### 4. 监控和审计

- **访问日志**: 记录所有API访问和操作
- **异常检测**: 监控异常访问模式
- **定期审计**: 定期检查权限和配置
- **告警机制**: 配置安全事件告警

---

## 常见问题解答

### Q1: 如何快速生成所有必需的密钥和密码？

**A**: 使用以下脚本一键生成：

```bash
#!/bin/bash
# generate-secrets.sh

echo "生成JWT_SECRET_KEY:"
openssl rand -base64 64

echo "生成SESSION_SECRET:"
openssl rand -base64 64

echo "生成POSTGRES_PASSWORD:"
pwgen -s 32 1

echo "生成REDIS_PASSWORD:"
pwgen -s 32 1

echo "生成API密钥:"
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Q2: 如何在不同环境使用不同的配置？

**A**: 使用分层配置文件：

```bash
# 基础配置
source .env.base

# 环境特定配置
if [ "$NODE_ENV" = "production" ]; then
  source .env.production
elif [ "$NODE_ENV" = "staging" ]; then
  source .env.staging
else
  source .env.development
fi

# 本地覆盖（优先级最高）
if [ -f .env.local ]; then
  source .env.local
fi
```

### Q3: 如何验证环境变量是否正确加载？

**A**: 使用以下命令检查：

```bash
# 检查特定变量
echo $JWT_SECRET_KEY

# 检查所有环境变量
env | grep -E "^(JWT|SESSION|POSTGRES|REDIS|ALIYUN)"

# 使用脚本验证
node -e "console.log('JWT:', process.env.JWT_SECRET_KEY ? 'OK' : 'MISSING')"
```

### Q4: 如何安全地共享配置给团队成员？

**A**: 推荐以下方式：

1. **使用密钥管理服务**: AWS Secrets Manager、阿里云KMS
2. **使用加密配置文件**: 使用ansible-vault、sops等工具加密
3. **使用环境变量注入**: CI/CD流水线中注入环境变量
4. **使用配置管理工具**: Consul、etcd等

### Q5: 如何处理敏感信息的日志记录？

**A**: 使用日志脱敏：

```javascript
// 日志脱敏示例
function sanitizeLog(data) {
  const sensitiveKeys = ['password', 'secret', 'token', 'key'];
  const sanitized = { ...data };
  
  sensitiveKeys.forEach(key => {
    if (sanitized[key]) {
      sanitized[key] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

console.log('User data:', sanitizeLog(userData));
```

### Q6: 如何在Docker中使用环境变量？

**A**: 使用docker-compose.yml配置：

```yaml
version: '3.8'
services:
  api:
    image: yyc3-nas-ecs:latest
    env_file:
      - .env
      - .env.production
    environment:
      - NODE_ENV=production
    ports:
      - "3200:3200"
```

### Q7: 如何在Kubernetes中使用环境变量？

**A**: 使用Secret和ConfigMap：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: yyc3-secrets
type: Opaque
stringData:
  JWT_SECRET_KEY: your-jwt-secret-key
  POSTGRES_PASSWORD: your-postgres-password

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: yyc3-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: yyc3-api
spec:
  template:
    spec:
      containers:
      - name: api
        envFrom:
        - secretRef:
            name: yyc3-secrets
        - configMapRef:
            name: yyc3-config
```

---

## 附录

### A. 快速配置检查清单

- [ ] 复制.env.example为.env
- [ ] 配置阿里云AccessKey（DDNS功能）
- [ ] 配置JWT_SECRET_KEY
- [ ] 配置SESSION_SECRET
- [ ] 配置数据库密码
- [ ] 配置Redis密码
- [ ] 配置邮件服务密码
- [ ] 配置Telegram Bot（如需通知）
- [ ] 配置S3备份密钥（如需云备份）
- [ ] 配置OpenAI API Key（如需AI功能）
- [ ] 验证所有环境变量已正确加载
- [ ] 测试各个服务连接
- [ ] 配置监控和告警
- [ ] 配置自动备份

### B. 配置文件优先级

1. `.env.local`（最高优先级，本地覆盖）
2. `.env.production` / `.env.development` / `.env.staging`（环境特定）
3. `.env`（默认配置）
4. `.env.base`（基础配置）
5. `.env.example`（模板，仅参考）

### C. 相关文档链接

- [阿里云DDNS API文档](https://help.aliyun.com/document_detail/29735.html)
- [OpenAI API文档](https://platform.openai.com/docs/api-reference)
- [PostgreSQL官方文档](https://www.postgresql.org/docs/)
- [Redis官方文档](https://redis.io/documentation)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [Kubernetes文档](https://kubernetes.io/docs/)

---

<div align="center">

> **「***YanYuCloudCube***」**
> **「***<admin@0379.email>***」**
> **「***Words Initiate Quadrants, Language Serves as Core for the Future***」**
> **「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」**

</div>
