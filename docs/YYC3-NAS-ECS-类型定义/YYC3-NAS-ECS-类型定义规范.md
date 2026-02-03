# YYC³ NAS-ECS 类型定义规范

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

- [命名规范](#命名规范)
- [文件组织规范](#文件组织规范)
- [注释规范](#注释规范)
- [类型定义规范](#类型定义规范)
- [版本管理规范](#版本管理规范)
- [类型检查规范](#类型检查规范)

---

## 🏷️ 命名规范

### 接口命名

#### 基本规则

- **格式**：PascalCase
- **语义**：描述性名称，清晰表达类型用途
- **后缀**：无特殊后缀要求，但可使用以下约定：
  - `DTO` - 数据传输对象
  - `VO` - 视图对象
  - `Entity` - 实体对象
  - `Config` - 配置对象
  - `Props` - 组件属性

#### 示例

```typescript
// ✅ 正确示例
export interface User { }
export interface UserSettings { }
export interface SystemStats { }
export interface ChatMessage { }
export interface CreateMessageDTO { }
export interface MessageVO { }
export interface WidgetConfig { }
export interface ChatMessageProps { }

// ❌ 错误示例
export interface user { }
export interface userSettings { }
export interface system_stats { }
export interface chat_message { }
export interface createMessageDto { }
```

### 类型别名命名

#### 基本规则

- **格式**：PascalCase
- **语义**：描述性名称，表达类型别名用途
- **后缀**：可选使用 `Type` 后缀

#### 示例

```typescript
// ✅ 正确示例
export type MessageStatus = 'sending' | 'sent' | 'delivered';
export type UserRole = 'admin' | 'user' | 'guest';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type LogLevelType = 'info' | 'warn' | 'error' | 'debug';

// ❌ 错误示例
export type messageStatus = 'sending' | 'sent' | 'delivered';
export type userRole = 'admin' | 'user' | 'guest';
export type themeMode = 'light' | 'dark' | 'auto';
```

### 枚举命名

#### 基本规则

- **格式**：PascalCase
- **语义**：描述性名称，表达枚举用途
- **成员**：PascalCase

#### 示例

```typescript
// ✅ 正确示例
export enum LogLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Debug = 'debug'
}

export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
  System = 'system'
}

// ❌ 错误示例
export enum logLevel { }
export enum messageRole { }
export enum LogLevel {
  info = 'info',
  warn = 'warn'
}
```

### 常量命名

#### 基本规则

- **格式**：UPPER_SNAKE_CASE
- **语义**：描述性名称，表达常量用途

#### 示例

```typescript
// ✅ 正确示例
export const MAX_MESSAGE_LENGTH = 5000;
export const DEFAULT_PAGE_SIZE = 20;
export const API_TIMEOUT = 30000;
export const SESSION_STORAGE_KEY = 'yyc3-chat-sessions';

// ❌ 错误示例
export const maxMessageLength = 5000;
export const defaultPageSize = 20;
export const apiTimeout = 30000;
export const session_storage_key = 'yyc3-chat-sessions';
```

### 泛型参数命名

#### 基本规则

- **格式**：单个大写字母或描述性PascalCase
- **常用**：T, U, V, K, V
- **描述性**：TEntity, TResponse, TRequest

#### 示例

```typescript
// ✅ 正确示例
export interface ApiResponse<T> { }
export interface PaginatedResponse<T> { }
export interface Repository<TEntity> { }
export interface Mapper<TSource, TDestination> { }

// ❌ 错误示例
export interface ApiResponse<t> { }
export interface PaginatedResponse<tentity> { }
export interface Repository<t_source> { }
```

### 属性命名

#### 基本规则

- **格式**：camelCase
- **语义**：描述性名称，清晰表达属性用途
- **布尔值**：使用 `is`, `has`, `should` 前缀

#### 示例

```typescript
// ✅ 正确示例
export interface User {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  hasPermission: boolean;
  shouldUpdate: boolean;
}

// ❌ 错误示例
export interface User {
  Id: string;
  UserName: string;
  Email: string;
  active: boolean;
  permission: boolean;
  update: boolean;
}
```

---

## 📁 文件组织规范

### 目录结构

#### 根目录结构

```
src/types/
├── index.ts              # 主类型导出文件
├── chat.ts               # 聊天相关类型
├── logs.ts               # 日志相关类型
├── settings.ts           # 设置相关类型
├── backup.ts             # 备份相关类型
├── rbac.ts               # 权限相关类型
├── help.ts               # 帮助相关类型
└── common.ts             # 通用类型
```

#### 模块目录结构

```
src/types/
├── index.ts
├── chat/
│   ├── index.ts          # 聊天类型主导出
│   ├── message.ts        # 消息相关类型
│   ├── session.ts        # 会话相关类型
│   └── attachment.ts     # 附件相关类型
├── system/
│   ├── index.ts          # 系统类型主导出
│   ├── stats.ts          # 统计相关类型
│   └── config.ts         # 配置相关类型
└── api/
    ├── index.ts          # API类型主导出
    ├── request.ts        # 请求相关类型
    └── response.ts       # 响应相关类型
```

### 文件命名

#### 基本规则

- **格式**：kebab-case.ts
- **语义**：描述性名称，清晰表达文件内容

#### 示例

```typescript
// ✅ 正确示例
user-settings.ts
chat-message.ts
log-entry.ts
api-response.ts
create-message-dto.ts

// ❌ 错误示例
userSettings.ts
chatMessage.ts
logEntry.ts
apiResponse.ts
createMessageDto.ts
```

### 文件内容组织

#### 导入顺序

```typescript
// 1. TypeScript标准库导入
import type { ... } from '...';

// 2. 第三方库导入
import type { ... } from '...';

// 3. 项目内部导入
import type { ... } from '@/types/...';

// 4. 相对路径导入
import type { ... } from './...';
```

#### 导出顺序

```typescript
// 1. 类型别名
export type ...;

// 2. 枚举
export enum ...;

// 3. 接口
export interface ...;

// 4. 常量
export const ...;

// 5. 类型守卫
export function is...(...): ... { }

// 6. 工具函数
export function create...(...): ... { }
```

---

## 📝 注释规范

### 文件头注释

#### 模板

```typescript
/**
 * @file [文件名称]
 * @description [文件功能描述]
 * @module types/[模块名]
 * @author YYC³
 * @version 1.0.0
 * @created [创建日期 YYYY-MM-DD]
 * @updated [更新日期 YYYY-MM-DD]
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */
```

#### 示例

```typescript
/**
 * @file 聊天类型定义
 * @description 定义AI聊天组件的类型接口
 * @module types/chat
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-25
 * @updated 2026-02-03
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */
```

### 接口注释

#### 模板

```typescript
/**
 * [接口功能描述]
 *
 * @description [详细说明]
 * @example [使用示例]
 *
 * @template T - [泛型参数说明]
 */
export interface InterfaceName<T> {
  /**
   * [属性说明]
   *
   * @description [详细说明]
   * @default [默认值]
   */
  propertyName: Type;

  /**
   * [可选属性说明]
   *
   * @description [详细说明]
   */
  optionalProperty?: Type;
}
```

#### 示例

```typescript
/**
 * 用户信息接口
 *
 * @description 定义用户的基本信息和角色权限
 *
 * @example
 * ```typescript
 * const user: User = {
 *   id: 'user-123',
 *   username: 'admin',
 *   role: 'admin',
 *   avatar: 'https://example.com/avatar.png'
 * };
 * ```
 */
export interface User {
  /**
   * 用户唯一标识符
   *
   * @description 使用UUID格式
   * @default 自动生成
   */
  id: string;

  /**
   * 用户名
   *
   * @description 用户登录名，唯一标识
   */
  username: string;

  /**
   * 用户角色
   *
   * @description 定义用户的权限级别
   * @default 'user'
   */
  role: 'admin' | 'user' | 'guest';

  /**
   * 用户头像URL
   *
   * @description 可选的用户头像图片地址
   */
  avatar?: string;
}
```

### 类型别名注释

#### 模板

```typescript
/**
 * [类型别名说明]
 *
 * @description [详细说明]
 * @example [使用示例]
 */
export type TypeName = Type1 | Type2 | Type3;
```

#### 示例

```typescript
/**
 * 消息状态类型
 *
 * @description 定义消息的发送和接收状态
 *
 * @example
 * ```typescript
 * const status: MessageStatus = 'sent';
 * ```
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';
```

### 枚举注释

#### 模板

```typescript
/**
 * [枚举说明]
 *
 * @description [详细说明]
 * @example [使用示例]
 */
export enum EnumName {
  /**
   * [枚举值说明]
   *
   * @description [详细说明]
   */
  Value1 = 'value1',

  /**
   * [枚举值说明]
   *
   * @description [详细说明]
   */
  Value2 = 'value2'
}
```

#### 示例

```typescript
/**
 * 日志级别枚举
 *
 * @description 定义系统日志的级别
 *
 * @example
 * ```typescript
 * const level: LogLevel = LogLevel.Info;
 * ```
 */
export enum LogLevel {
  /**
   * 信息级别
   *
   * @description 一般信息日志
   */
  Info = 'info',

  /**
   * 警告级别
   *
   * @description 警告信息日志
   */
  Warn = 'warn',

  /**
   * 错误级别
   *
   * @description 错误信息日志
   */
  Error = 'error',

  /**
   * 调试级别
   *
   * @description 调试信息日志
   */
  Debug = 'debug'
}
```

### 函数注释

#### 模板

```typescript
/**
 * [函数功能描述]
 *
 * @description [详细说明]
 *
 * @param paramName - [参数说明]
 * @returns [返回值说明]
 * @throws [可能抛出的错误]
 * @example [使用示例]
 */
export function functionName(paramName: ParamType): ReturnType {
  // 实现
}
```

#### 示例

```typescript
/**
 * 创建用户
 *
 * @description 根据用户数据创建新用户对象
 *
 * @param userData - 用户数据
 * @returns 用户对象
 * @throws {Error} 当用户数据无效时抛出错误
 *
 * @example
 * ```typescript
 * const user = createUser({
 *   username: 'admin',
 *   role: 'admin'
 * });
 * ```
 */
export function createUser(userData: Omit<User, 'id'>): User {
  return {
    id: generateId(),
    ...userData
  };
}
```

---

## 🔧 类型定义规范

### 接口定义规范

#### 基本接口

```typescript
// ✅ 推荐
export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// ❌ 不推荐
export interface User {
  id: string;
  username: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}
```

#### 泛型接口

```typescript
// ✅ 推荐
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ❌ 不推荐
export interface ApiResponse<T> {
  data: any;
  status: number;
  message?: string;
}
```

#### 继承接口

```typescript
// ✅ 推荐
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  username: string;
  role: UserRole;
}

export interface ChatSession extends BaseEntity {
  name: string;
  messages: ChatMessage[];
}

// ❌ 不推荐
export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  username: string;
  role: UserRole;
}

export interface ChatSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  messages: ChatMessage[];
}
```

### 类型别名定义规范

#### 联合类型

```typescript
// ✅ 推荐
export type MessageRole = 'user' | 'assistant' | 'system';
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type ThemeMode = 'light' | 'dark' | 'auto';

// ❌ 不推荐
export type MessageRole = 'user' | 'assistant' | 'system' | 'admin';
export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'trace';
```

#### 交叉类型

```typescript
// ✅ 推荐
export type UserWithSettings = User & UserSettings;
export type ChatSessionWithMessages = ChatSession & { messages: ChatMessage[] };

// ❌ 不推荐
export type UserWithSettings = User & any;
export type ChatSessionWithMessages = ChatSession & { messages: any[] };
```

#### 映射类型

```typescript
// ✅ 推荐
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// ❌ 不推荐
export type Partial<T> = {
  [P in keyof T]?: any;
};
```

### 枚举定义规范

#### 字符串枚举

```typescript
// ✅ 推荐
export enum LogLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Debug = 'debug'
}

// ❌ 不推荐
export enum LogLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Debug = 'debug',
  Trace = 'trace'
}
```

#### 数字枚举

```typescript
// ✅ 推荐
export enum HttpStatus {
  Ok = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404,
  InternalServerError = 500
}

// ❌ 不推荐
export enum HttpStatus {
  Ok = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404,
  InternalServerError = 500,
  ServiceUnavailable = 503
}
```

### 可选属性规范

#### 使用场景

```typescript
// ✅ 推荐 - 可选属性用于非必需数据
export interface User {
  id: string;
  username: string;
  avatar?: string;  // 可选
  bio?: string;     // 可选
}

export interface ChatMessage {
  id: string;
  content: string;
  attachments?: Attachment[];  // 可选
  metadata?: Record<string, any>;  // 可选
}

// ❌ 不推荐 - 必需属性不应设为可选
export interface User {
  id?: string;
  username?: string;
  role?: string;
}
```

### 默认值规范

#### 使用场景

```typescript
// ✅ 推荐 - 为可选属性提供默认值
export interface WidgetConfig {
  id: string;
  title: string;
  width: number;
  height: number;
  theme: 'light' | 'dark' | 'auto';
  animationEnabled: boolean;
}

export const defaultWidgetConfig: Partial<WidgetConfig> = {
  width: 800,
  height: 600,
  theme: 'auto',
  animationEnabled: true
};

// ❌ 不推荐 - 不提供默认值
export interface WidgetConfig {
  id: string;
  title: string;
  width: number;
  height: number;
  theme: 'light' | 'dark' | 'auto';
  animationEnabled: boolean;
}
```

---

## 📦 版本管理规范

### 版本号格式

#### 语义化版本

**格式**：MAJOR.MINOR.PATCH

- **MAJOR**：不兼容的API变更
- **MINOR**：向下兼容的功能新增
- **PATCH**：向下兼容的问题修复

```
1.0.0 -> 1.0.1 (修复bug)
1.0.1 -> 1.1.0 (新增功能)
1.1.0 -> 2.0.0 (重大变更)
```

### 版本标记

#### 使用 JSDoc 标记

```typescript
/**
 * @version 1.0.0
 * @deprecated 2.0.0
 * @replacement NewInterfaceName
 */
export interface OldInterface {
  // ...
}

/**
 * @version 2.0.0
 * @since 2.0.0
 */
export interface NewInterface {
  // ...
}
```

### 变更记录

#### 使用 @changelog 标记

```typescript
/**
 * @version 1.0.0
 * @changelog
 * - 初始版本
 * - 定义核心类型接口
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * @version 1.1.0
 * @changelog
 * - 新增 metadata 属性
 * - 新增 status 属性
 * - 新增 reactions 属性
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  reactions?: MessageReaction[];
}
```

---

## ✅ 类型检查规范

### TypeScript 配置

#### tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 类型检查命令

#### 运行类型检查

```bash
# 运行 TypeScript 类型检查
npm run type-check

# 预期结果：0个错误
```

### 类型安全最佳实践

#### 避免使用 any

```typescript
// ✅ 推荐 - 使用具体类型
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// ❌ 不推荐 - 使用 any
export interface ApiResponse {
  data: any;
  status: number;
  message?: string;
}
```

#### 使用类型守卫

```typescript
// ✅ 推荐 - 使用类型守卫
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.username === 'string';
}

function processUser(obj: any) {
  if (isUser(obj)) {
    console.log(obj.username);
  }
}

// ❌ 不推荐 - 不使用类型守卫
function processUser(obj: any) {
  console.log(obj.username);  // 可能运行时错误
}
```

#### 使用泛型约束

```typescript
// ✅ 推荐 - 使用泛型约束
export interface Repository<T extends BaseEntity> {
  findById(id: string): Promise<T>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// ❌ 不推荐 - 不使用泛型约束
export interface Repository<T> {
  findById(id: string): Promise<T>;
  findAll(): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}
```

---

## 📊 附录

### 类型定义检查清单

- [ ] 所有接口都有完整的注释
- [ ] 所有属性都有类型定义
- [ ] 所有可选属性都有默认值说明
- [ ] 命名规范符合标准
- [ ] 类型关系逻辑正确
- [ ] 无重复定义
- [ ] TypeScript编译无错误
- [ ] 无过度使用any类型
- [ ] 泛型使用正确
- [ ] 文档与代码一致

### 类型定义模板

```typescript
/**
 * @file [文件名称]
 * @description [文件功能描述]
 * @module types/[模块名]
 * @author YYC³
 * @version 1.0.0
 * @created [创建日期 YYYY-MM-DD]
 * @updated [更新日期 YYYY-MM-DD]
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

/**
 * [接口功能描述]
 *
 * @description [详细说明]
 * @example [使用示例]
 */
export interface InterfaceName {
  /**
   * [属性说明]
   *
   * @description [详细说明]
   * @default [默认值]
   */
  propertyName: Type;

  /**
   * [可选属性说明]
   *
   * @description [详细说明]
   */
  optionalProperty?: Type;
}

/**
 * [类型别名说明]
 *
 * @description [详细说明]
 * @example [使用示例]
 */
export type TypeName = Type1 | Type2 | Type3;

/**
 * [枚举说明]
 *
 * @description [详细说明]
 * @example [使用示例]
 */
export enum EnumName {
  /**
   * [枚举值说明]
   *
   * @description [详细说明]
   */
  Value1 = 'value1',

  /**
   * [枚举值说明]
   *
   * @description [详细说明]
   */
  Value2 = 'value2'
}
```

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
