# Mail Service 技术文档

> 📋 **文档版本**: v3.0.0 | **更新时间**: 2025-12-08 | **维护团队**: YYC3 AI Family

## 📖 服务概述

YYC3 Mail Service 是YYC3 AI Family平台的邮件服务组件，提供邮件发送、模板渲染、队列处理等核心邮件功能。

### 基本信息

- **服务名称**: YYC3 Mail Service
- **端口**: 6603 (生产) / 3003 (开发)
- **技术栈**: Node.js | Express.js | Nodemailer | Handlebars | Redis
- **主文件**: `server.js`
- **模板目录**: `html/`
- **队列目录**: `queue/`

## 🏗️ 核心功能

### 主要特性

- **多提供商支持**: SMTP、SendGrid、AWS SES、阿里云邮件推送
- **HTML模板引擎**: Handlebars模板渲染
- **邮件队列**: 异步批量发送处理
- **发送状态跟踪**: 实时发送状态监控
- **模板管理**: 动态模板创建和管理
- **批量发送**: 支持大规模邮件推送

### 支持的邮件提供商

| 提供商 | 类型 | 特点 | 状态 |
|--------|------|------|------|
| SMTP | 通用 | 兼容性好 | ✅ |
| SendGrid | API | 高可靠性 | ✅ |
| AWS SES | API | 成本效益高 | ✅ |
| 阿里云推送 | API | 国内优势 | ✅ |

### 关键端点

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/health` | GET | 服务健康检查 | ❌ |
| `/api/mail/send` | POST | 发送邮件 | ✅ |
| `/api/mail/template` | GET/POST | 模板管理 | ✅ |
| `/api/mail/queue` | GET | 队列状态 | ✅ |
| `/api/mail/status/:id` | GET | 发送状态 | ✅ |

## 📁 文件结构

```
mail/
├── 📄 server.js              # 主服务文件
├── 📄 package.json           # 依赖配置
├── 📄 .env.example           # 环境变量示例
├── 📁 html/                  # 邮件模板
│   ├── 📄 welcome.html       # 欢迎邮件模板
│   ├── 📄 notification.html  # 通知邮件模板
│   └── 📄 reset-password.html # 密码重置模板
├── 📁 queue/                 # 邮件队列
│   └── 📄 pending.json       # 待发送队列
├── 📁 logs/                  # 日志目录
└── 📄 server.js.backup       # 备份文件
```

## 🔧 配置说明

### 环境变量

```bash
# 服务端口
MAIL_PORT=3003

# SMTP配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# SendGrid配置
SENDGRID_API_KEY=your_sendgrid_key

# AWS SES配置
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1

# 阿里云邮件推送配置
ALIYUN_ACCESS_KEY=your_aliyun_key
ALIYUN_SECRET_KEY=your_aliyun_secret
ALIYUN_REGION=cn-hangzhou

# Redis配置（队列）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 默认发件人
DEFAULT_FROM=noreply@0379.email
DEFAULT_FROM_NAME=YYC3 AI Family

# 服务配置
API_SERVICE_URL=http://localhost:3000
ADMIN_SERVICE_URL=http://localhost:3001
LLM_SERVICE_URL=http://localhost:3002
```

## 🔌 API接口文档

### 发送邮件接口

#### 标准邮件发送
```http
POST /api/mail/send
Content-Type: application/json
Authorization: Bearer {token}

{
  "to": ["user@example.com"],
  "subject": "欢迎使用YYC3平台",
  "template": "welcome",
  "data": {
    "name": "张三",
    "app_name": "YYC3",
    "login_url": "https://app.0379.email/login"
  },
  "type": "html",
  "provider": "smtp"
}

Response:
{
  "success": true,
  "data": {
    "message_id": "msg_123456789",
    "status": "queued",
    "recipients": 1,
    "provider": "smtp",
    "queue_position": 1,
    "estimated_delivery": "2025-12-08T06:01:00.000Z"
  }
}
```

#### 批量邮件发送
```http
POST /api/mail/batch
Content-Type: application/json
Authorization: Bearer {token}

{
  "to": ["user1@example.com", "user2@example.com", "user3@example.com"],
  "subject": "YYC3平台更新通知",
  "content": {
    "html": "<h1>平台更新</h1><p>YYC3平台已更新...</p>",
    "text": "平台更新\nYYC3平台已更新..."
  },
  "schedule": "2025-12-08T08:00:00.000Z",
  "provider": "sendgrid"
}

Response:
{
  "success": true,
  "data": {
    "batch_id": "batch_123456",
    "total_recipients": 3,
    "status": "scheduled",
    "scheduled_time": "2025-12-08T08:00:00.000Z",
    "estimated_cost": 0.003
  }
}
```

### 模板管理接口

#### 创建邮件模板
```http
POST /api/mail/template
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "monthly-report",
  "subject": "{{month}}月度报告 - {{company}}",
  "html": "<h1>{{company}}月度报告</h1><p>亲爱的{{name}}，以下是您的{{month}}月度报告...</p>",
  "text": "{{company}}月度报告\n亲爱的{{name}}，以下是您的{{month}}月度报告...",
  "variables": ["name", "company", "month", "report_data"]
}

Response:
{
  "success": true,
  "data": {
    "template_id": "tpl_789",
    "name": "monthly-report",
    "created_at": "2025-12-08T06:00:00.000Z",
    "preview_url": "/api/mail/template/monthly-report/preview"
  }
}
```

## 📧 邮件模板系统

### Handlebars模板引擎

```html
<!-- 欢迎邮件模板 (html/welcome.html) -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>欢迎使用{{app_name}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>欢迎来到{{app_name}}</h1>
        </div>
        <div class="content">
            <p>亲爱的{{name}}，</p>
            <p>感谢您注册{{app_name}}！您的账户已经创建成功。</p>
            <p>点击下方按钮开始使用：</p>
            <p><a href="{{login_url}}" class="button">立即登录</a></p>
            <p>如果您有任何问题，请联系我们的客服团队。</p>
            <p>祝好！<br>{{app_name}}团队</p>
        </div>
    </div>
</body>
</html>
```

### 模板数据验证

```javascript
function validateTemplateData(templateName, data) {
  const requiredVariables = {
    'welcome': ['name', 'app_name', 'login_url'],
    'reset-password': ['name', 'reset_url', 'expiry_hours'],
    'notification': ['title', 'content', 'action_url']
  };

  const required = requiredVariables[templateName] || [];
  const missing = required.filter(key => !data[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required template variables: ${missing.join(', ')}`);
  }

  return true;
}
```

## 📮 邮件队列系统

### Redis队列实现

```javascript
class MailQueue {
  constructor(redisClient) {
    this.redis = redisClient;
    this.queues = {
      high: 'mail:queue:high',
      normal: 'mail:queue:normal',
      low: 'mail:queue:low'
    };
  }

  async addToQueue(mailData, priority = 'normal') {
    const queueKey = this.queues[priority];
    const mailItem = {
      id: this.generateId(),
      ...mailData,
      attempts: 0,
      created_at: new Date().toISOString(),
      status: 'queued'
    };

    await this.redis.lpush(queueKey, JSON.stringify(mailItem));
    return mailItem.id;
  }

  async processQueue() {
    for (const priority of ['high', 'normal', 'low']) {
      const queueKey = this.queues[priority];
      const mailData = await this.redis.brpop(queueKey, 1);

      if (mailData) {
        const mailItem = JSON.parse(mailData[1]);
        await this.sendMail(mailItem);
      }
    }
  }

  async sendMail(mailItem) {
    try {
      mailItem.attempts++;
      const result = await this.mailProvider.send(mailItem);

      await this.updateMailStatus(mailItem.id, 'sent', result);
      await this.logSuccess(mailItem, result);
    } catch (error) {
      if (mailItem.attempts < 3) {
        await this.retryMail(mailItem);
      } else {
        await this.updateMailStatus(mailItem.id, 'failed', error.message);
        await this.logFailure(mailItem, error);
      }
    }
  }
}
```

## 📊 监控与统计

### 邮件发送指标

```javascript
const mailMetrics = {
  totalSent: 0,
  totalFailed: 0,
  totalQueued: 0,
  providerStats: {
    smtp: { sent: 0, failed: 0 },
    sendgrid: { sent: 0, failed: 0 },
    ses: { sent: 0, failed: 0 }
  },
  dailyStats: {},
  templateStats: {}
};

function updateMetrics(template, provider, status) {
  mailMetrics.totalSent += status === 'sent' ? 1 : 0;
  mailMetrics.totalFailed += status === 'failed' ? 1 : 0;

  if (!mailMetrics.providerStats[provider]) {
    mailMetrics.providerStats[provider] = { sent: 0, failed: 0 };
  }

  mailMetrics.providerStats[provider][status]++;

  if (!mailMetrics.templateStats[template]) {
    mailMetrics.templateStats[template] = 0;
  }

  mailMetrics.templateStats[template]++;
}
```

### 健康检查

访问 `/health` 端点获取服务状态：

```json
{
  "status": "ok",
  "service": "yyc3-mail-service",
  "port": 6603,
  "timestamp": "2025-12-08T06:00:00.000Z",
  "uptime": 86400,
  "version": "3.0.0",
  "queue_status": {
    high: 0,
    normal: 5,
    low: 12
  },
  "providers": {
    smtp: "connected",
    sendgrid: "available",
    ses: "available"
  }
}
```

## 🔒 安全特性

### 邮件内容过滤

```javascript
function sanitizeContent(content) {
  const forbiddenPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];

  let sanitized = content;
  forbiddenPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized;
}
```

### 发送频率限制

```javascript
const rateLimiter = {
  windows: {},

  checkLimit(email, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const window = Math.floor(now / windowMs);

    if (!this.windows[email]) {
      this.windows[email] = {};
    }

    if (!this.windows[email][window]) {
      this.windows[email][window] = 0;
    }

    this.windows[email][window]++;

    return this.windows[email][window] <= limit;
  }
};
```

## 🚀 部署指南

### 开发环境启动

```bash
cd /Users/yanyu/www/yyc3-22/app/mail
npm install
cp .env.example .env
# 编辑 .env 文件配置邮件服务商信息
npm start
```

### 生产环境部署

```bash
# 使用 PM2 管理进程
pm2 start server.js --name "yyc3-mail-service" --port 6603

# 或使用 Docker
docker build -t yyc3-mail-service .
docker run -p 6603:6603 yyc3-mail-service
```

## 🧪 测试

### 单元测试示例

```javascript
const request = require('supertest');
const app = require('./server');

describe('Mail Service', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });

  test('POST /api/mail/send with valid data', async () => {
    const response = await request(app)
      .post('/api/mail/send')
      .send({
        to: ['test@example.com'],
        subject: 'Test Email',
        content: 'This is a test email'
      })
      .expect(200);

    expect(response.body.data).toHaveProperty('message_id');
  });
});
```

## 🔗 相关链接

- **主服务文档**: `[../TECHNICAL_DOCUMENTATION.md](../TECHNICAL_DOCUMENTATION.md)`
- **API参考文档**: `[../API_REFERENCE.md](../API_REFERENCE.md)`
- **Nodemailer文档**: https://nodemailer.com
- **SendGrid文档**: https://sendgrid.com/docs
- **API服务**: `../api/`
- **管理后台**: `../admin/`
- **LLM服务**: `../llm/`

## 📞 技术支持

- **问题反馈**: <dev@0379.email>
- **服务监控**: `https://monitor.0379.email`
- **在线文档**: `https://docs.0379.email`

---

<div align="center">

**[⬆️ 回到顶部](#mail-service-技术文档)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 📧

</div>