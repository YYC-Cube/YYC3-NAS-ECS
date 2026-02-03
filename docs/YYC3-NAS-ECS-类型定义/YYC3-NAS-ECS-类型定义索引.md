# YYC³ NAS-ECS 类型定义索引

> ***YanYuCloudCube***
> **标语**：言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> **标语**：万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

**创建日期**：2026-02-03
**作者**：YYC³ Team
**版本**：1.0.0
**更新日期**：2026-02-03

---

## 📋 目录

- [核心类型](#核心类型)
- [用户相关类型](#用户相关类型)
- [系统相关类型](#系统相关类型)
- [服务相关类型](#服务相关类型)
- [组件相关类型](#组件相关类型)
- [工具类型](#工具类型)
- [类型关系图谱](#类型关系图谱)

---

## 🎯 核心类型

### ApiResponse<T>

**文件**：`src/types/index.ts`

**描述**：统一的API响应格式

**泛型参数**：T - 响应数据类型

**属性**：
- `data: T` - 响应数据
- `status: number` - HTTP状态码
- `message?: string` - 响应消息

**使用场景**：所有API响应

---

## 👤 用户相关类型

### User

**文件**：`src/types/index.ts`

**描述**：用户基本信息和角色权限

**属性**：
- `id: string` - 用户唯一标识符
- `username: string` - 用户名
- `role: 'admin' | 'user' | 'guest'` - 用户角色
- `avatar?: string` - 用户头像URL

**使用场景**：用户管理、权限控制

### UserSettings

**文件**：`src/types/settings.ts`

**描述**：用户的个性化设置和偏好

**属性**：
- `theme: 'light' | 'dark' | 'auto'` - 主题设置
- `language: string` - 语言设置
- `notifications: boolean` - 通知设置
- `[key: string]: any` - 其他自定义设置

**使用场景**：用户设置、个性化配置

---

## 🖥️ 系统相关类型

### SystemStats

**文件**：`src/types/index.ts`

**描述**：系统资源使用情况和运行状态

**属性**：
- `cpuUsage: number` - CPU使用率（百分比）
- `memoryUsage: number` - 内存使用率（百分比）
- `diskUsage: number` - 磁盘使用率（百分比）
- `networkIn: number` - 网络入流量（KB/s）
- `networkOut: number` - 网络出流量（KB/s）
- `uptime: number` - 系统运行时间（秒）
- `timestamp: string` - 统计时间戳

**使用场景**：系统监控、性能分析

### LogEntry

**文件**：`src/types/logs.ts`

**描述**：系统日志条目

**属性**：
- `id: string` - 日志唯一标识符
- `level: 'info' | 'warn' | 'error' | 'debug'` - 日志级别
- `message: string` - 日志消息
- `source: string` - 日志来源
- `timestamp: string` - 日志时间戳
- `details?: string` - 日志详情
- `stackTrace?: string` - 堆栈跟踪

**使用场景**：日志查看、错误追踪

---

## 📧 服务相关类型

### AuthService

**文件**：`src/types/index.ts`

**描述**：认证服务接口

**方法**：
- `login(username: string): Promise<User>` - 用户登录
- `logout(): Promise<void>` - 用户登出

**使用场景**：用户认证、会话管理

### MailService

**文件**：`src/types/index.ts`

**描述**：邮件服务接口

**方法**：
- `getEmails(folder?: string, params?: any): Promise<Email[]>` - 获取邮件列表
- `sendEmail(to: string, subject: string, body: string): Promise<void>` - 发送邮件
- `saveDraft(draft: {...}): Promise<void>` - 保存草稿
- `scheduleEmail(email: {...}): Promise<void>` - 定时发送邮件
- `replyEmail(originalEmailId: string, ...): Promise<void>` - 回复邮件
- `forwardEmail(originalEmailId: string, ...): Promise<void>` - 转发邮件
- `markEmailRead(emailId: string, read: boolean): Promise<void>` - 标记邮件已读
- `markEmailUnread(emailId: string): Promise<void>` - 标记邮件未读
- `deleteEmail(emailId: string): Promise<void>` - 删除邮件
- `toggleStar(emailId: string): Promise<void>` - 切换邮件星标
- `archiveEmail(emailId: string): Promise<void>` - 归档邮件

**使用场景**：邮件管理、邮件操作

### LLMService

**文件**：`src/types/index.ts`

**描述**：大语言模型服务接口

**方法**：
- `sendMessage(message: string): Promise<LLMMessage>` - 发送消息
- `generate(prompt: string, model?: string, stream?: boolean): Promise<Response>` - 生成内容
- `getModels(): Promise<{...}>` - 获取模型列表
- `deleteModel(modelName: string): Promise<{...}>` - 删除模型
- `pullModel(modelName: string): Promise<Response>` - 拉取模型
- `chat(messages: Array<{...}>, model?: string, stream?: boolean): Promise<Response>` - 对话

**使用场景**：AI对话、内容生成

---

## 🧩 组件相关类型

### ChatMessage

**文件**：`src/app/types/chat.ts`

**描述**：聊天系统中的单条消息

**属性**：
- `id: string` - 消息唯一标识符
- `role: 'user' | 'assistant' | 'system'` - 消息发送者角色
- `content: string` - 消息内容
- `timestamp: number` - 消息时间戳
- `attachments?: Attachment[]` - 附件列表
- `metadata?: Record<string, any>` - 元数据
- `status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error'` - 消息状态
- `reactions?: MessageReaction[]` - 反应列表

**使用场景**：聊天组件、消息展示

### ChatSession

**文件**：`src/app/types/chat.ts`

**描述**：聊天系统中的一个会话

**属性**：
- `id: string` - 会话唯一标识符
- `name: string` - 会话名称
- `messages: ChatMessage[]` - 消息列表
- `createdAt: number` - 创建时间戳
- `updatedAt: number` - 更新时间戳
- `metadata?: Record<string, any>` - 元数据
- `model?: string` - 使用的AI模型
- `template?: SessionTemplate` - 会话模板

**使用场景**：会话管理、聊天历史

### WidgetConfig

**文件**：`src/app/lib/ai-integration/providers/AIWidgetProvider.tsx`

**描述**：AI浮窗组件的配置选项

**属性**：
- `id: string` - 组件唯一标识符
- `title: string` - 组件标题
- `width: number` - 组件宽度（像素）
- `height: number` - 组件高度（像素）
- `x: number` - X坐标（像素）
- `y: number` - Y坐标（像素）
- `minimized: boolean` - 最小化状态
- `maximized: boolean` - 最大化状态
- `theme: 'light' | 'dark' | 'auto'` - 主题模式
- `animationEnabled: boolean` - 动画启用状态
- `enableDrag: boolean` - 拖拽启用状态
- `enableResize: boolean` - 调整大小启用状态
- `enablePersistence: boolean` - 持久化启用状态
- `enableSync: boolean` - 同步启用状态
- `enableAccessibility: boolean` - 无障碍访问启用状态
- `enableSecurity: boolean` - 安全功能启用状态

**使用场景**：AI浮窗配置、组件初始化

---

## 🔧 工具类型

### Attachment

**文件**：`src/app/types/chat.ts`

**描述**：消息附件

**属性**：
- `id: string` - 附件唯一标识符
- `type: 'image' | 'audio' | 'video' | 'document' | 'code'` - 附件类型
- `name: string` - 附件名称
- `url: string` - 附件URL
- `size?: number` - 附件大小
- `mimeType?: string` - MIME类型
- `thumbnail?: string` - 缩略图URL

**使用场景**：消息附件、文件上传

### MessageReaction

**文件**：`src/app/types/chat.ts`

**描述**：消息反应

**属性**：
- `emoji: string` - 表情符号
- `count: number` - 反应数量
- `users: string[]` - 反应用户列表

**使用场景**：消息交互、用户反馈

---

## 🔗 类型关系图谱

### 核心关系

```
ApiResponse<T>
    ├── User
    ├── SystemStats
    ├── LogEntry
    ├── Email
    ├── FrpConfig
    ├── LLMMessage
    ├── NasFile
    ├── NasVolume
    └── NasShare
```

### 聊天类型关系

```
ChatSession
    ├── ChatMessage[]
    │   ├── Attachment[]
    │   └── MessageReaction[]
    ├── SessionTemplate
    └── metadata: Record<string, any>
```

### 服务接口关系

```
ApiService
    ├── AuthService
    │   └── User
    ├── SystemService
    │   └── SystemStats
    ├── LogsService
    │   └── LogEntry[]
    ├── MailService
    │   └── Email[]
    ├── LLMService
    │   └── LLMMessage
    └── NasService
        ├── NasFile[]
        ├── NasVolume[]
        └── NasShare[]
```

### 组件类型关系

```
AIWidgetProvider
    ├── WidgetConfig
    ├── ChatSession[]
    │   └── ChatMessage[]
    └── UserSettings
```

### 数据流关系

```
User
    ├── UserSettings
    ├── ChatSession[]
    │   └── ChatMessage[]
    ├── Email[]
    └── LogEntry[]
```

---

## 📊 类型使用统计

### 按模块分类

| 模块 | 类型数量 | 文件数量 |
|------|---------|---------|
| 核心类型 | 2 | 1 |
| 用户相关 | 2 | 2 |
| 系统相关 | 2 | 2 |
| 服务相关 | 6 | 1 |
| 组件相关 | 3 | 2 |
| 工具类型 | 2 | 1 |
| **总计** | **17** | **9** |

### 按类型分类

| 类型类别 | 数量 | 占比 |
|---------|------|------|
| 接口定义 | 12 | 70.6% |
| 类型别名 | 2 | 11.8% |
| 枚举定义 | 3 | 17.6% |
| **总计** | **17** | **100%** |

---

## 📝 类型定义最佳实践

### 1. 使用泛型提高复用性

```typescript
// ✅ 推荐
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// 使用
const userResponse: ApiResponse<User> = { ... };
const statsResponse: ApiResponse<SystemStats> = { ... };
```

### 2. 使用联合类型提高灵活性

```typescript
// ✅ 推荐
export type MessageRole = 'user' | 'assistant' | 'system';
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// 使用
const role: MessageRole = 'user';
const level: LogLevel = 'error';
```

### 3. 使用可选属性提高兼容性

```typescript
// ✅ 推荐
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: number;
  attachments?: Attachment[];  // 可选属性
  metadata?: Record<string, any>;  // 可选属性
}
```

### 4. 使用类型守卫提高安全性

```typescript
// ✅ 推荐
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.username === 'string';
}

// 使用
if (isUser(data)) {
  console.log(data.username);
}
```

### 5. 使用工具类型提高可读性

```typescript
// ✅ 推荐
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

// 使用
function updateUser(id: string, updates: Partial<User>): void {
  // ...
}
```

---

## 🔍 类型查找指南

### 按功能查找

- **用户管理** → User, UserSettings, AuthService
- **系统监控** → SystemStats, MonitoringService
- **日志管理** → LogEntry, LogsService
- **邮件管理** → Email, MailService
- **AI对话** → ChatMessage, ChatSession, LLMService
- **NAS管理** → NasFile, NasVolume, NasShare, NasService
- **组件配置** → WidgetConfig, UserSettings

### 按文件查找

- **`src/types/index.ts`** → 核心类型、服务接口
- **`src/types/chat.ts`** → 聊天相关类型
- **`src/types/logs.ts`** → 日志相关类型
- **`src/types/settings.ts`** → 设置相关类型
- **`src/types/backup.ts`** → 备份相关类型
- **`src/types/rbac.ts`** → 权限相关类型
- **`src/types/help.ts`** → 帮助相关类型

---

## 📚 相关文档

- [YYC³ NAS-ECS 类型定义闭环文档体系](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-类型定义/YYC3-NAS-ECS-类型定义闭环文档体系.md)
- [YYC³ NAS-ECS API完整文档](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-API完整文档.md)
- [YYC³团队智能应用开发标准规范](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-开发标准规范.md)
- [TypeScript错误解决最终报告](file:///Users/yanyu/Downloads/YYC3-NAS-ECS/docs/YYC3-NAS-ECS-TypeScript问题解决最终报告.md)

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
