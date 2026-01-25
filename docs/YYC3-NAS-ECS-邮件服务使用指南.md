# YYC³ NAS-ECS 邮件服务使用指南

**创建日期**: 2026-01-25  
**作者**: YYC³ Team  
**版本**: 1.0.0

---

## 📋 目录

1. [概述](#概述)
2. [快速开始](#快速开始)
3. [基础功能](#基础功能)
4. [高级功能](#高级功能)
5. [AI集成](#ai集成)
6. [性能优化](#性能优化)
7. [最佳实践](#最佳实践)

---

## 概述

YYC³ NAS-ECS邮件服务是一个功能强大的企业级邮件管理系统，提供邮件收发、管理、AI智能回复等全方位邮件处理能力。

### 主要特性

- **邮件收发**: 完整的邮件发送和接收功能
- **邮件管理**: 邮件分类、搜索、标签管理
- **AI智能**: AI自动回复、智能分类、内容分析
- **批量操作**: 批量删除、标记、归档
- **附件管理**: 支持多种附件格式和大小限制
- **安全加密**: 邮件传输加密和存储加密

---

## 快速开始

### 安装依赖

```bash
# 安装邮件服务相关依赖
npm install @react-email/render nodemailer @sendgrid/mail
```

### 基础配置

```typescript
// src/app/config/email.ts
export const emailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
  limits: {
    maxRecipients: 100,
    maxAttachments: 10,
    maxAttachmentSize: 25 * 1024 * 1024, // 25MB
  },
};
```

### 环境变量配置

```bash
# .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yyc3.com
EMAIL_REPLY_TO=support@yyc3.com
```

---

## 基础功能

### 1. 发送邮件

```typescript
// src/app/services/emailService.ts
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: emailConfig.smtp.auth,
    });
  }

  async sendEmail(params: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
  }) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        attachments: params.attachments,
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const emailService = new EmailService();
```

### 2. 使用邮件模板

```typescript
// src/app/templates/emailTemplate.tsx
import { render } from '@react-email/render';
import { Email } from './components/Email';

interface EmailTemplateProps {
  recipientName: string;
  subject: string;
  content: string;
  buttonText?: string;
  buttonLink?: string;
}

export async function generateEmailTemplate(props: EmailTemplateProps) {
  const emailHtml = await render(
    <Email
      recipientName={props.recipientName}
      subject={props.subject}
      content={props.content}
      buttonText={props.buttonText}
      buttonLink={props.buttonLink}
    />
  );

  return emailHtml;
}
```

### 3. 邮件模板组件

```typescript
// src/app/templates/components/Email.tsx
import * as React from 'react';

interface EmailProps {
  recipientName: string;
  subject: string;
  content: string;
  buttonText?: string;
  buttonLink?: string;
}

export const Email: React.FC<Readonly<EmailProps>> = ({
  recipientName,
  subject,
  content,
  buttonText,
  buttonLink,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ backgroundColor: '#f4f4f4', padding: '20px' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '30px' }}>
        <h1 style={{ color: '#333333', marginBottom: '20px' }}>
          {subject}
        </h1>
        <p style={{ color: '#666666', lineHeight: '1.6' }}>
          亲爱的 {recipientName}，
        </p>
        <p style={{ color: '#666666', lineHeight: '1.6' }}>
          {content}
        </p>
        {buttonText && buttonLink && (
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a
              href={buttonLink}
              style={{
                backgroundColor: '#2A6EBB',
                color: '#ffffff',
                padding: '12px 30px',
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block',
              }}
            >
              {buttonText}
            </a>
          </div>
        )}
        <p style={{ color: '#999999', fontSize: '12px', marginTop: '30px' }}>
          此邮件由YYC³ NAS-ECS系统自动发送，请勿直接回复。
        </p>
      </div>
    </div>
  </div>
);
```

### 4. 发送带附件的邮件

```typescript
// src/app/utils/emailAttachments.ts
import fs from 'fs';
import path from 'path';

export async function prepareAttachment(filePath: string) {
  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath);
    const filename = path.basename(fullPath);
    const contentType = getContentType(filename);

    return {
      filename,
      content,
      contentType,
    };
  } catch (error) {
    console.error('Failed to prepare attachment:', error);
    throw new Error(`Failed to prepare attachment: ${filePath}`);
  }
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.zip': 'application/zip',
    '.txt': 'text/plain',
  };

  return contentTypes[ext] || 'application/octet-stream';
}
```

### 5. 批量发送邮件

```typescript
// src/app/services/batchEmailService.ts
import { emailService } from './emailService';

export class BatchEmailService {
  async sendBulkEmails(params: {
    recipients: string[];
    subject: string;
    text?: string;
    html?: string;
    batchSize?: number;
    delayBetweenBatches?: number;
  }) {
    const {
      recipients,
      subject,
      text,
      html,
      batchSize = 50,
      delayBetweenBatches = 1000,
    } = params;

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ recipient: string; error: string }>,
    };

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(recipient =>
          emailService.sendEmail({
            to: recipient,
            subject,
            text,
            html,
          })
        )
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            recipient: batch[index],
            error: result.status === 'rejected' 
              ? result.reason.message 
              : result.value.error || 'Unknown error',
          });
        }
      });

      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return results;
  }
}

export const batchEmailService = new BatchEmailService();
```

---

## 高级功能

### 1. 邮件队列管理

```typescript
// src/app/services/emailQueue.ts
import { emailService } from './emailService';
import { logService } from './logService';
import { LogCategory, LogLevel } from '../types/logs';

interface QueuedEmail {
  id: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
  priority: 'high' | 'normal' | 'low';
  attempts: number;
  maxAttempts: number;
  nextAttempt: Date;
  createdAt: Date;
}

export class EmailQueue {
  private queue: Map<string, QueuedEmail> = new Map();
  private processing = false;
  private readonly MAX_QUEUE_SIZE = 1000;

  async enqueue(params: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
    priority?: 'high' | 'normal' | 'low';
  }): Promise<string> {
    const id = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.queue.size >= this.MAX_QUEUE_SIZE) {
      throw new Error('Email queue is full');
    }

    const queuedEmail: QueuedEmail = {
      id,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments,
      priority: params.priority || 'normal',
      attempts: 0,
      maxAttempts: 3,
      nextAttempt: new Date(),
      createdAt: new Date(),
    };

    this.queue.set(id, queuedEmail);

    logService.addLog({
      category: LogCategory.EMAIL,
      level: LogLevel.INFO,
      service: 'email-queue',
      message: `Email queued: ${params.subject}`,
      details: { emailId: id, recipient: params.to }
    });

    if (!this.processing) {
      this.processQueue();
    }

    return id;
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      const now = new Date();
      const readyEmails = Array.from(this.queue.values())
        .filter(email => email.nextAttempt <= now)
        .sort((a, b) => {
          const priorityOrder = { high: 0, normal: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

      for (const email of readyEmails.slice(0, 10)) {
        await this.sendQueuedEmail(email);
      }

      if (this.queue.size > 0) {
        setTimeout(() => this.processQueue(), 5000);
      } else {
        this.processing = false;
      }
    } catch (error) {
      logService.addLog({
        category: LogCategory.EMAIL,
        level: LogLevel.ERROR,
        service: 'email-queue',
        message: 'Error processing email queue',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      this.processing = false;
    }
  }

  private async sendQueuedEmail(email: QueuedEmail) {
    email.attempts++;

    try {
      const result = await emailService.sendEmail({
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        attachments: email.attachments,
      });

      if (result.success) {
        this.queue.delete(email.id);
        logService.addLog({
          category: LogCategory.EMAIL,
          level: LogLevel.INFO,
          service: 'email-queue',
          message: `Email sent successfully: ${email.subject}`,
          details: { emailId: email.id, messageId: result.messageId }
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      if (email.attempts >= email.maxAttempts) {
        this.queue.delete(email.id);
        logService.addLog({
          category: LogCategory.EMAIL,
          level: LogLevel.ERROR,
          service: 'email-queue',
          message: `Email failed after max attempts: ${email.subject}`,
          details: { 
            emailId: email.id, 
            attempts: email.attempts,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      } else {
        const delay = Math.pow(2, email.attempts) * 60000; // 指数退避
        email.nextAttempt = new Date(Date.now() + delay);
        logService.addLog({
          category: LogCategory.EMAIL,
          level: LogLevel.WARN,
          service: 'email-queue',
          message: `Email retry scheduled: ${email.subject}`,
          details: { 
            emailId: email.id, 
            attempt: email.attempts,
            nextAttempt: email.nextAttempt
          }
        });
      }
    }
  }

  getQueueStatus() {
    const emails = Array.from(this.queue.values());
    return {
      total: emails.length,
      byPriority: {
        high: emails.filter(e => e.priority === 'high').length,
        normal: emails.filter(e => e.priority === 'normal').length,
        low: emails.filter(e => e.priority === 'low').length,
      },
      byStatus: {
        pending: emails.filter(e => e.nextAttempt > new Date()).length,
        ready: emails.filter(e => e.nextAttempt <= new Date()).length,
      },
    };
  }
}

export const emailQueue = new EmailQueue();
```

### 2. 邮件追踪

```typescript
// src/app/services/emailTracking.ts
import { logService } from './logService';
import { LogCategory, LogLevel } from '../types/logs';

interface TrackingEvent {
  emailId: string;
  recipient: string;
  eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class EmailTracking {
  private static events: TrackingEvent[] = [];

  static async trackEvent(event: TrackingEvent) {
    this.events.push(event);

    logService.addLog({
      category: LogCategory.EMAIL,
      level: LogLevel.INFO,
      service: 'email-tracking',
      message: `Email tracking event: ${event.eventType}`,
      details: {
        emailId: event.emailId,
        recipient: event.recipient,
        eventType: event.eventType,
        ...event.metadata
      }
    });

    await this.sendToAnalytics(event);
  }

  private static async sendToAnalytics(event: TrackingEvent) {
    try {
      await fetch('/api/analytics/email-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send tracking event:', error);
    }
  }

  static generateTrackingPixel(emailId: string): string {
    const trackingUrl = `/api/email/track/${emailId}/pixel.gif`;
    return `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;" />`;
  }

  static generateTrackingLink(emailId: string, originalUrl: string): string {
    const trackingUrl = `/api/email/track/${emailId}/click?url=${encodeURIComponent(originalUrl)}`;
    return trackingUrl;
  }

  static getTrackingStats(emailId: string) {
    const events = this.events.filter(e => e.emailId === emailId);
    
    return {
      sent: events.filter(e => e.eventType === 'sent').length,
      delivered: events.filter(e => e.eventType === 'delivered').length,
      opened: events.filter(e => e.eventType === 'opened').length,
      clicked: events.filter(e => e.eventType === 'clicked').length,
      bounced: events.filter(e => e.eventType === 'bounced').length,
      complained: events.filter(e => e.eventType === 'complained').length,
    };
  }
}
```

### 3. 邮件验证

```typescript
// src/app/services/emailValidation.ts
export class EmailValidation {
  static validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      return { valid: false, error: '邮箱地址不能为空' };
    }

    if (!emailRegex.test(email)) {
      return { valid: false, error: '邮箱地址格式不正确' };
    }

    if (email.length > 254) {
      return { valid: false, error: '邮箱地址过长' };
    }

    const [localPart, domain] = email.split('@');
    
    if (localPart.length > 64) {
      return { valid: false, error: '邮箱用户名过长' };
    }

    if (domain.length > 255) {
      return { valid: false, error: '邮箱域名过长' };
    }

    return { valid: true };
  }

  static validateEmails(emails: string[]): {
    valid: string[];
    invalid: Array<{ email: string; error: string }>;
  } {
    const valid: string[] = [];
    const invalid: Array<{ email: string; error: string }> = [];

    emails.forEach(email => {
      const result = this.validateEmail(email);
      if (result.valid) {
        valid.push(email);
      } else {
        invalid.push({ email, error: result.error || 'Unknown error' });
      }
    });

    return { valid, invalid };
  }

  static async verifyEmailDomain(email: string): Promise<boolean> {
    const domain = email.split('@')[1];
    
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const data = await response.json();
      return data.Answer && data.Answer.length > 0;
    } catch (error) {
      console.error('Failed to verify email domain:', error);
      return false;
    }
  }
}
```

---

## AI集成

### 1. AI智能回复

```typescript
// src/app/services/aiEmailService.ts
import { emailService } from './emailService';
import { logService } from './logService';
import { LogCategory, LogLevel } from '../types/logs';

interface AIReplyRequest {
  originalEmail: {
    from: string;
    subject: string;
    content: string;
  };
  replyTone: 'professional' | 'friendly' | 'formal';
  includeSummary?: boolean;
}

export class AIEmailService {
  async generateAIReply(request: AIReplyRequest): Promise<{
    success: boolean;
    reply?: string;
    summary?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/ai/email-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        logService.addLog({
          category: LogCategory.EMAIL,
          level: LogLevel.INFO,
          service: 'ai-email',
          message: 'AI reply generated successfully',
          details: { 
            originalSubject: request.originalEmail.subject,
            replyTone: request.replyTone 
          }
        });

        return {
          success: true,
          reply: data.reply,
          summary: data.summary,
        };
      } else {
        throw new Error(data.error || 'Failed to generate AI reply');
      }
    } catch (error) {
      logService.addLog({
        category: LogCategory.EMAIL,
        level: LogLevel.ERROR,
        service: 'ai-email',
        message: 'Failed to generate AI reply',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          originalSubject: request.originalEmail.subject 
        }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendAIReply(params: {
    to: string;
    subject: string;
    originalContent: string;
    replyTone: 'professional' | 'friendly' | 'formal';
  }) {
    const { reply } = await this.generateAIReply({
      originalEmail: {
        from: params.to,
        subject: params.subject,
        content: params.originalContent,
      },
      replyTone: params.replyTone,
      includeSummary: true,
    });

    if (!reply) {
      throw new Error('Failed to generate AI reply');
    }

    return await emailService.sendEmail({
      to: params.to,
      subject: `Re: ${params.subject}`,
      html: reply,
    });
  }
}

export const aiEmailService = new AIEmailService();
```

### 2. AI邮件分类

```typescript
// src/app/services/aiEmailClassification.ts
export class AIEmailClassification {
  async classifyEmail(content: string): Promise<{
    category: string;
    priority: 'high' | 'normal' | 'low';
    confidence: number;
    tags: string[];
  }> {
    try {
      const response = await fetch('/api/ai/email-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      return {
        category: data.category,
        priority: data.priority,
        confidence: data.confidence,
        tags: data.tags || [],
      };
    } catch (error) {
      console.error('Failed to classify email:', error);
      return {
        category: 'inbox',
        priority: 'normal',
        confidence: 0,
        tags: [],
      };
    }
  }

  async batchClassifyEmails(emails: Array<{ id: string; content: string }>) {
    const classifications = await Promise.all(
      emails.map(async (email) => {
        const classification = await this.classifyEmail(email.content);
        return {
          emailId: email.id,
          ...classification,
        };
      })
    );

    return classifications;
  }
}
```

### 3. AI邮件摘要

```typescript
// src/app/services/aiEmailSummary.ts
export class AIEmailSummary {
  async generateSummary(content: string): Promise<{
    summary: string;
    keyPoints: string[];
    actionItems: string[];
  }> {
    try {
      const response = await fetch('/api/ai/email-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      return {
        summary: data.summary,
        keyPoints: data.keyPoints || [],
        actionItems: data.actionItems || [],
      };
    } catch (error) {
      console.error('Failed to generate email summary:', error);
      return {
        summary: content.substring(0, 200) + '...',
        keyPoints: [],
        actionItems: [],
      };
    }
  }

  async generateThreadSummary(thread: Array<{
    from: string;
    subject: string;
    content: string;
    timestamp: Date;
  }>) {
    const threadContent = thread
      .map(email => `From: ${email.from}\nSubject: ${email.subject}\n\n${email.content}`)
      .join('\n\n---\n\n');

    return await this.generateSummary(threadContent);
  }
}
```

---

## 性能优化

### 1. 邮件缓存

```typescript
// src/app/services/emailCache.ts
export class EmailCache {
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly DEFAULT_TTL = 300000; // 5分钟

  static get(key: string, ttl: number = this.DEFAULT_TTL): any | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  static invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  static clear(): void {
    this.cache.clear();
  }
}
```

### 2. 邮件预加载

```typescript
// src/app/hooks/useEmailPreload.ts
import { useEffect, useState } from 'react';
import { EmailCache } from '../services/emailCache';

export function useEmailPreload(emailIds: string[]) {
  const [loading, setLoading] = useState(false);
  const [preloaded, setPreloaded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadEmails = async () => {
      setLoading(true);
      const toPreload = emailIds.filter(id => !preloaded.has(id));

      await Promise.all(
        toPreload.map(async (id) => {
          const cached = EmailCache.get(`email:${id}`);
          if (!cached) {
            try {
              const response = await fetch(`/api/emails/${id}`);
              const data = await response.json();
              EmailCache.set(`email:${id}`, data);
            } catch (error) {
              console.error(`Failed to preload email ${id}:`, error);
            }
          }
        })
      );

      setPreloaded(new Set([...preloaded, ...toPreload]));
      setLoading(false);
    };

    preloadEmails();
  }, [emailIds]);

  return { loading, preloaded };
}
```

---

## 最佳实践

### 1. 邮件发送策略

```typescript
// src/app/utils/emailSendingStrategy.ts
export class EmailSendingStrategy {
  static async sendWithRetry(
    sendFn: () => Promise<any>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await sendFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          const waitTime = delay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError;
  }

  static async sendWithRateLimit(
    sendFn: () => Promise<any>,
    rateLimit: number = 10,
    timeWindow: number = 60000
  ): Promise<any> {
    const now = Date.now();
    const key = `rate_limit:${Math.floor(now / timeWindow)}`;
    
    const sentCount = parseInt(localStorage.getItem(key) || '0');
    
    if (sentCount >= rateLimit) {
      const waitTime = timeWindow - (now % timeWindow);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    const result = await sendFn();
    
    localStorage.setItem(key, (sentCount + 1).toString());
    
    return result;
  }
}
```

### 2. 邮件内容优化

```typescript
// src/app/utils/emailContentOptimizer.ts
export class EmailContentOptimizer {
  static optimizeHTML(html: string): string {
    let optimized = html;

    optimized = optimized.replace(/\s+/g, ' ');
    optimized = optimized.replace(/>\s+</g, '><');
    optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');

    return optimized;
  }

  static inlineCSS(html: string, css: string): string {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const bodyRegex = /<body[^>]*>([\s\S]*?)<\/body>/gi;

    return html.replace(styleRegex, '').replace(bodyRegex, (match, body) => {
      return `<body style="${css}">${body}</body>`;
    });
  }

  static generatePlainText(html: string): string {
    let text = html;

    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/\s+/g, ' ');
    text = text.trim();

    return text;
  }
}
```

---

## 总结

YYC³ NAS-ECS邮件服务提供了全面的邮件管理能力。通过本指南，您可以：

1. 快速集成邮件发送和接收功能
2. 使用邮件模板和批量发送
3. 实现邮件队列和追踪
4. 集成AI智能回复和分类
5. 优化邮件发送性能和内容

建议定期审查邮件发送策略，根据实际需求调整队列配置和AI功能，以确保邮件系统稳定高效运行。

---

*本使用指南由YYC³ Team编写，包含邮件服务的完整使用说明和代码示例。*
