# YYC³ NAS-ECS 文档自动化检查系统

**文档编号**: YYC3-NAS-ECS-DOC-AUTO-001
**创建日期**: 2026-01-31
**版本**: 1.0.0
**作者**: YYC³ Team
**更新日期**: 2026-01-31

---

## 📋 概述

YYC³ NAS-ECS 文档自动化检查系统是一个完整的文档质量管理和问题跟踪解决方案，包括自动检查、问题跟踪和通知功能。

---

## 🎯 主要功能

### 1. 自动文档检查

- ✅ 文件存在性检查
- ✅ 链接有效性检查
- ✅ Markdown 格式检查
- ✅ 版本一致性检查
- ✅ 代码示例检查
- ✅ 文档元数据检查

### 2. 问题跟踪

- ✅ 集成 GitHub Issues
- ✅ 自动创建问题
- ✅ 问题分类和标签
- ✅ 问题状态跟踪
- ✅ 问题统计分析

### 3. 自动通知

- ✅ 邮件通知
- ✅ Slack 通知
- ✅ Discord 通知
- ✅ Microsoft Teams 通知
- ✅ 多渠道通知

---

## 📦 安装依赖

```bash
npm install --save-dev octokit nodemailer discord-webhook-node
```

---

## 🔧 配置

### 1. 环境变量配置

复制示例配置文件：

```bash
cp .env.docs.example .env.docs
```

编辑 `.env.docs` 文件，配置以下内容：

#### GitHub 配置

```env
GITHUB_OWNER=YYC3-Team
GITHUB_REPO=YYC3-NAS-ECS
GITHUB_TOKEN=your_github_token_here
```

**获取 GitHub Token**:
1. 访问 GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 选择 `repo` 权限
4. 生成并复制 token

#### Email 配置

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
EMAIL_FROM=noreply@yyc3.com
EMAIL_TO=team@yyc3.com,developer@yyc3.com
```

**Gmail 配置说明**:
1. 启用两步验证
2. 生成应用专用密码
3. 使用应用专用密码作为 `SMTP_PASS`

#### Slack 配置

```env
SLACK_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#docs-notifications
```

**获取 Slack Webhook URL**:
1. 访问 https://api.slack.com/messaging/webhooks
2. 创建 Incoming Webhook
3. 复制 Webhook URL

#### Discord 配置

```env
DISCORD_ENABLED=true
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

**获取 Discord Webhook URL**:
1. 在 Discord 服务器设置中创建 Webhook
2. 复制 Webhook URL

#### Microsoft Teams 配置

```env
TEAMS_ENABLED=true
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/WEBHOOK/URL
```

**获取 Teams Webhook URL**:
1. 在 Teams 频道中添加连接器
2. 选择 "Incoming Webhook"
3. 配置并复制 Webhook URL

---

## 🚀 使用方法

### 1. 基础检查

运行基础文档检查：

```bash
npm run docs:check
```

此命令会：
- 扫描所有文档文件
- 执行各项检查
- 生成检查报告
- 保存到 `docs/reviews/daily/` 目录

---

### 2. 集成检查

运行集成文档检查（包含问题跟踪和通知）：

```bash
npm run docs:check:integrated
```

此命令会：
- 执行基础检查
- 为错误创建 GitHub Issues
- 发送通知到配置的渠道
- 生成检查报告

---

### 3. 定时执行

#### 使用 Cron 定时执行

编辑 crontab：

```bash
crontab -e
```

添加以下内容（每天凌晨 2:00 执行）：

```cron
0 2 * * * cd /path/to/YYC3-NAS-ECS && npm run docs:check:integrated >> /var/log/docs-check.log 2>&1
```

#### 使用 GitHub Actions

创建 `.github/workflows/docs-check.yml`:

```yaml
name: Documentation Check

on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run documentation check
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          EMAIL_ENABLED: ${{ secrets.EMAIL_ENABLED }}
          SMTP_HOST: ${{ secrets.SMTP_HOST }}
          SMTP_PORT: ${{ secrets.SMTP_PORT }}
          SMTP_SECURE: ${{ secrets.SMTP_SECURE }}
          SMTP_USER: ${{ secrets.SMTP_USER }}
          SMTP_PASS: ${{ secrets.SMTP_PASS }}
          EMAIL_FROM: ${{ secrets.EMAIL_FROM }}
          EMAIL_TO: ${{ secrets.EMAIL_TO }}
          SLACK_ENABLED: ${{ secrets.SLACK_ENABLED }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_CHANNEL: ${{ secrets.SLACK_CHANNEL }}
          DISCORD_ENABLED: ${{ secrets.DISCORD_ENABLED }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
          TEAMS_ENABLED: ${{ secrets.TEAMS_ENABLED }}
          TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
        run: npm run docs:check:integrated
```

在 GitHub 仓库中配置 Secrets：
- `GITHUB_TOKEN`
- `EMAIL_ENABLED`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `EMAIL_TO`
- `SLACK_ENABLED`
- `SLACK_WEBHOOK_URL`
- `SLACK_CHANNEL`
- `DISCORD_ENABLED`
- `DISCORD_WEBHOOK_URL`
- `TEAMS_ENABLED`
- `TEAMS_WEBHOOK_URL`

---

## 📊 检查报告

### 报告位置

检查报告保存在 `docs/reviews/daily/` 目录下，文件名格式为：

```
daily-check-YYYY-MM-DD.md
```

### 报告内容

报告包含以下内容：
- 检查时间
- 检查文件数
- 各项检查结果
- 错误和警告详情
- 总结统计
- 后续行动建议

---

## 🏷️ 问题分类

### 严重性分级

| 级别 | 描述 | 处理时限 |
|------|------|----------|
| 严重（Critical） | 需要立即处理 | 24 小时 |
| 重要（High） | 需要尽快处理 | 72 小时 |
| 一般（Medium） | 需要计划处理 | 1 周 |
| 建议（Low） | 可以延后处理 | 2 周 |

### 问题类型

| 类型 | 描述 |
|------|------|
| 准确性（Accuracy） | 文档内容与实际情况不符 |
| 可读性（Readability） | 文档难以理解或阅读 |
| 完整性（Completeness） | 文档缺少必要内容 |
| 一致性（Consistency） | 文档内容不一致 |
| 实用性（Usability） | 文档实用性不足 |

---

## 🔔 通知配置

### 通知触发条件

- **严重问题**：立即通知所有渠道
- **重要问题**：通知邮件和 Slack
- **一般问题**：通知邮件
- **建议性意见**：通知邮件

### 通知渠道优先级

1. 邮件通知（所有问题）
2. Slack 通知（严重和重要问题）
3. Discord 通知（严重和重要问题）
4. Teams 通知（严重和重要问题）

---

## 📚 相关文档

- [文档问题分类体系](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-文档问题分类体系.md)
- [文档质量标准](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-文档质量标准.md)
- [文档定期审查机制](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-文档定期审查机制.md)
- [文档审查检查清单](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-文档审查检查清单.md)

---

## 🛠️ 故障排除

### 1. GitHub Token 无效

**问题**: `Error: Bad credentials`

**解决方案**:
1. 检查 GitHub Token 是否正确
2. 确认 Token 有 `repo` 权限
3. 确认 Token 未过期

---

### 2. Email 发送失败

**问题**: `Error: Invalid login`

**解决方案**:
1. 检查 SMTP 配置是否正确
2. 确认用户名和密码正确
3. 对于 Gmail，使用应用专用密码

---

### 3. Slack Webhook 失败

**问题**: `Error: Slack API error`

**解决方案**:
1. 检查 Webhook URL 是否正确
2. 确认 Webhook 未被删除
3. 确认频道存在且有权限

---

### 4. Discord Webhook 失败

**问题**: `Error: Discord API error`

**解决方案**:
1. 检查 Webhook URL 是否正确
2. 确认 Webhook 未被删除
3. 确认频道存在且有权限

---

## 🎯 最佳实践

### 1. 定期检查

- 每天自动运行检查
- 定期查看检查报告
- 及时处理发现的问题

### 2. 问题处理

- 按照严重性优先级处理
- 及时更新问题状态
- 验证问题解决效果

### 3. 文档维护

- 保持文档与代码同步
- 遵循文档质量标准
- 使用文档模板

---

## 📞 支持

如有问题或建议，请联系：

- Email: admin@0379.email
- GitHub Issues: https://github.com/YYC3-Team/YYC3-NAS-ECS/issues

---

<div align="center">

> **「YanYuCloudCube」**
> **「言启象限 | 语枢未来」**
> **「Words Initiate Quadrants, Language Serves as Core for the Future」**

</div>
