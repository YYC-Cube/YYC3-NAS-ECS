# YYC³ NAS-ECS 权限管理模块技术文档

> **文件标识**: YYC3-NAS-ECS-权限管理模块技术文档
> **版本**: 1.0.0
> **创建日期**: 2026-01-20
> **作者**: YYC³ Team
> **模块**: 权限管理
> **状态**: ✅ 已完成

---

## 📋 目录

- [模块概述](#模块概述)
- [架构设计](#架构设计)
- [数据模型](#数据模型)
- [API接口](#api接口)
- [功能特性](#功能特性)
- [使用指南](#使用指南)
- [安全考虑](#安全考虑)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

---

## 模块概述

### 功能描述

YYC³ NAS-ECS 权限管理模块提供基于角色的访问控制（RBAC）功能，实现用户-角色-权限的三级权限体系。该模块遵循「五高五标五化」标准，确保系统安全性和可管理性。

### 核心特性

- ✅ **RBAC三级权限体系**: 用户-角色-权限的完整权限管理
- ✅ **细粒度权限控制**: 权限控制粒度精细到功能按钮级别
- ✅ **权限变更审计**: 记录所有权限相关操作，支持审计追踪
- ✅ **灵活的角色管理**: 支持角色创建、修改、删除和权限分配
- ✅ **用户生命周期管理**: 完整的用户创建、编辑、删除和状态管理
- ✅ **访问控制策略**: 支持基于条件的访问控制策略

### 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS
- **存储**: LocalStorage（前端持久化）
- **组件**: Lucide React Icons
- **通知**: Sonner Toast

---

## 架构设计

### 模块结构

```
src/app/
├── components/
│   └── rbac/
│       └── RBACManager.tsx       # 权限管理组件
├── services/
│   └── rbacService.ts            # 权限服务
└── types/
    └── rbac.ts                   # 权限类型定义
```

### 设计模式

1. **单例模式**: RBACService 采用单例模式，确保全局只有一个权限服务实例
2. **策略模式**: 支持多种访问控制策略
3. **观察者模式**: 权限变更时自动更新相关组件

### 权限模型

```
用户 (User)
  ↓ 拥有
角色 (Role)
  ↓ 关联
权限 (Permission)
  ↓ 受控于
访问控制策略 (AccessControlPolicy)
```

---

## 数据模型

### Role

角色枚举：

```typescript
enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',     // 超级管理员
  ADMIN = 'ADMIN',                 // 管理员
  MANAGER = 'MANAGER',             // 经理
  OPERATOR = 'OPERATOR',           // 操作员
  USER = 'USER',                   // 用户
  GUEST = 'GUEST'                  // 访客
}
```

### Permission

权限枚举：

```typescript
enum Permission {
  // 仪表盘
  DASHBOARD_VIEW = 'dashboard.view',
  DASHBOARD_EDIT = 'dashboard.edit',

  // 监控
  MONITORING_VIEW = 'monitoring.view',
  MONITORING_EDIT = 'monitoring.edit',
  MONITORING_ALERTS = 'monitoring.alerts',

  // 邮箱
  EMAIL_VIEW = 'email.view',
  EMAIL_SEND = 'email.send',
  EMAIL_DELETE = 'email.delete',
  EMAIL_MANAGE = 'email.manage',

  // FRP
  FRP_VIEW = 'frp.view',
  FRP_CREATE = 'frp.create',
  FRP_EDIT = 'frp.edit',
  FRP_DELETE = 'frp.delete',

  // LLM
  LLM_VIEW = 'llm.view',
  LLM_CHAT = 'llm.chat',
  LLM_MANAGE = 'llm.manage',

  // DDNS
  DDNS_VIEW = 'ddns.view',
  DDNS_EDIT = 'ddns.edit',

  // NAS
  NAS_VIEW = 'nas.view',
  NAS_EDIT = 'nas.edit',

  // API
  API_VIEW = 'api.view',
  API_EDIT = 'api.edit',

  // 日志
  LOGS_VIEW = 'logs.view',
  LOGS_EXPORT = 'logs.export',
  LOGS_DELETE = 'logs.delete',

  // 备份
  BACKUP_VIEW = 'backup.view',
  BACKUP_CREATE = 'backup.create',
  BACKUP_RESTORE = 'backup.restore',

  // 设置
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_EDIT = 'settings.edit',

  // 系统
  SYSTEM_VIEW = 'system.view'
}
```

### User

用户数据模型：

```typescript
interface User {
  id: string;                    // 用户ID
  username: string;               // 用户名
  email: string;                 // 邮箱
  role: Role;                    // 角色
  permissions: Permission[];      // 权限列表
  isActive: boolean;             // 是否激活
  createdAt: string;             // 创建时间
}
```

### RolePermissions

角色权限关联：

```typescript
interface RolePermissions {
  role: Role;                     // 角色
  permissions: Permission[];        // 权限列表
  description: string;            // 描述
}
```

### AccessControlPolicy

访问控制策略：

```typescript
interface AccessControlPolicy {
  id: string;                    // 策略ID
  name: string;                  // 策略名称
  description: string;           // 策略描述
  roles: Role[];                 // 适用角色
  permissions: Permission[];      // 权限列表
  conditions?: any;               // 访问条件
  isActive: boolean;             // 是否激活
}
```

### PermissionCheck

权限检查：

```typescript
interface PermissionCheck {
  permission: Permission;        // 要检查的权限
  resource?: string;             // 资源标识
  action?: string;               // 操作类型
  conditions?: any;             // 额外条件
}
```

### AuditLog

审计日志：

```typescript
interface AuditLog {
  id: string;                    // 日志ID
  userId: string;                // 用户ID
  username: string;              // 用户名
  action: string;                // 操作类型
  resource: string;              // 资源
  result: 'success' | 'failure'; // 结果
  details?: any;                 // 详细信息
  timestamp: string;             // 时间戳
}
```

---

## API接口

### RBACService

权限服务类，提供权限管理的核心功能。

#### 方法列表

##### login

用户登录。

```typescript
login(username: string, password: string): User | null
```

**参数**:
- `username`: 用户名
- `password`: 密码

**返回值**: 用户对象或null

**示例**:

```typescript
const user = rbacService.login('admin', 'password123');
if (user) {
  console.log('登录成功', user);
}
```

##### logout

用户登出。

```typescript
logout(): void
```

**示例**:

```typescript
rbacService.logout();
```

##### getCurrentUser

获取当前登录用户。

```typescript
getCurrentUser(): User | null
```

**返回值**: 当前用户或null

##### hasPermission

检查当前用户是否拥有指定权限。

```typescript
hasPermission(permission: Permission): boolean
```

**参数**:
- `permission`: 权限

**返回值**: 是否拥有权限

**示例**:

```typescript
if (rbacService.hasPermission(Permission.EMAIL_SEND)) {
  // 发送邮件
}
```

##### hasAnyPermission

检查当前用户是否拥有任一指定权限。

```typescript
hasAnyPermission(permissions: Permission[]): boolean
```

**参数**:
- `permissions`: 权限列表

**返回值**: 是否拥有任一权限

##### hasAllPermissions

检查当前用户是否拥有所有指定权限。

```typescript
hasAllPermissions(permissions: Permission[]): boolean
```

**参数**:
- `permissions`: 权限列表

**返回值**: 是否拥有所有权限

##### checkPermission

检查权限（支持条件）。

```typescript
checkPermission(check: PermissionCheck): boolean
```

**参数**:
- `check`: 权限检查对象

**返回值**: 是否拥有权限

##### getUsers

获取所有用户。

```typescript
getUsers(): User[]
```

**返回值**: 用户列表

##### getUserById

根据ID获取用户。

```typescript
getUserById(id: string): User | undefined
```

**参数**:
- `id`: 用户ID

**返回值**: 用户对象或undefined

##### createUser

创建用户。

```typescript
createUser(userData: Omit<User, 'id' | 'createdAt'>): User
```

**参数**:
- `userData`: 用户数据（不包含id和createdAt）

**返回值**: 创建的用户对象

**示例**:

```typescript
const newUser = rbacService.createUser({
  username: 'testuser',
  email: 'test@example.com',
  role: Role.USER,
  permissions: [Permission.DASHBOARD_VIEW, Permission.MONITORING_VIEW],
  isActive: true
});
```

##### updateUser

更新用户。

```typescript
updateUser(id: string, updates: Partial<User>): User | null
```

**参数**:
- `id`: 用户ID
- `updates`: 更新数据

**返回值**: 更新后的用户对象或null

##### deleteUser

删除用户。

```typescript
deleteUser(id: string): boolean
```

**参数**:
- `id`: 用户ID

**返回值**: 是否删除成功

##### assignRole

分配角色。

```typescript
assignRole(userId: string, role: Role): boolean
```

**参数**:
- `userId`: 用户ID
- `role`: 角色

**返回值**: 是否分配成功

##### getPolicies

获取所有访问控制策略。

```typescript
getPolicies(): AccessControlPolicy[]
```

**返回值**: 策略列表

##### getPolicyById

根据ID获取策略。

```typescript
getPolicyById(id: string): AccessControlPolicy | undefined
```

**参数**:
- `id`: 策略ID

**返回值**: 策略对象或undefined

##### createPolicy

创建策略。

```typescript
createPolicy(policy: Omit<AccessControlPolicy, 'id'>): AccessControlPolicy
```

**参数**:
- `policy`: 策略数据（不包含id）

**返回值**: 创建的策略对象

##### updatePolicy

更新策略。

```typescript
updatePolicy(id: string, updates: Partial<AccessControlPolicy>): AccessControlPolicy | null
```

**参数**:
- `id`: 策略ID
- `updates`: 更新数据

**返回值**: 更新后的策略对象或null

##### deletePolicy

删除策略。

```typescript
deletePolicy(id: string): boolean
```

**参数**:
- `id`: 策略ID

**返回值**: 是否删除成功

##### getAuditLogs

获取审计日志。

```typescript
getAuditLogs(limit?: number): AuditLog[]
```

**参数**:
- `limit`: 返回数量限制（可选）

**返回值**: 审计日志列表

##### getRolePermissions

获取角色权限映射。

```typescript
getRolePermissions(): RolePermissions[]
```

**返回值**: 角色权限列表

---

## 功能特性

### 1. 角色管理

#### 预定义角色

- **超级管理员**: 拥有所有权限
- **管理员**: 拥有大部分管理权限
- **经理**: 拥有部门管理权限
- **操作员**: 拥有基本操作权限
- **用户**: 拥有基本查看权限
- **访客**: 拥有有限查看权限

#### 角色权限映射

| 角色 | 权限数量 | 主要权限 |
|------|---------|---------|
| 超级管理员 | 全部 | 所有权限 |
| 管理员 | 30+ | 用户管理、配置管理、监控管理 |
| 经理 | 20+ | 部门管理、报表查看 |
| 操作员 | 15+ | 基本操作、查看权限 |
| 用户 | 10+ | 查看权限 |
| 访客 | 2 | 仪表盘查看、监控查看 |

### 2. 用户管理

#### 用户生命周期

1. **创建**: 添加新用户，分配角色和权限
2. **激活/禁用**: 控制用户访问权限
3. **编辑**: 修改用户信息
4. **删除**: 删除用户（需确认）
5. **角色变更**: 动态调整用户角色

#### 用户信息

- 用户名（唯一）
- 邮箱（唯一）
- 角色
- 权限列表
- 激活状态
- 创建时间

### 3. 权限检查

#### 权限级别

1. **模块级**: 控制整个模块的访问
2. **功能级**: 控制特定功能的访问
3. **操作级**: 控制特定操作的访问
4. **资源级**: 控制特定资源的访问

#### 权限检查方法

```typescript
// 检查单个权限
if (rbacService.hasPermission(Permission.EMAIL_SEND)) {
  // 发送邮件
}

// 检查任一权限
if (rbacService.hasAnyPermission([
  Permission.EMAIL_SEND,
  Permission.EMAIL_DELETE
])) {
  // 有发送或删除权限
}

// 检查所有权限
if (rbacService.hasAllPermissions([
  Permission.EMAIL_VIEW,
  Permission.EMAIL_SEND
])) {
  // 有查看和发送权限
}

// 检查权限（带条件）
if (rbacService.checkPermission({
  permission: Permission.EMAIL_SEND,
  resource: 'inbox',
  action: 'send'
})) {
  // 有发送邮件权限
}
```

### 4. 审计日志

#### 记录的操作

- 用户登录/登出
- 用户创建/修改/删除
- 角色分配
- 权限变更
- 策略创建/修改/删除

#### 审计日志信息

- 操作时间
- 操作用户
- 操作类型
- 操作资源
- 操作结果
- 详细信息

### 5. 访问控制策略

#### 策略类型

1. **时间限制**: 限制特定时间段的访问
2. **IP限制**: 限制特定IP的访问
3. **资源限制**: 限制特定资源的访问
4. **操作限制**: 限制特定操作的访问

#### 策略配置

```typescript
const policy: AccessControlPolicy = {
  id: 'policy-001',
  name: '工作时间访问策略',
  description: '只允许工作时间访问',
  roles: [Role.USER],
  permissions: [Permission.DASHBOARD_VIEW],
  conditions: {
    timeRange: {
      start: '09:00',
      end: '18:00',
      weekdays: [1, 2, 3, 4, 5]
    }
  },
  isActive: true
};
```

---

## 使用指南

### 基本使用

#### 1. 用户登录

```typescript
import { rbacService } from '@/services/rbacService';

const user = rbacService.login('admin', 'password123');
if (user) {
  console.log('登录成功', user);
} else {
  console.log('登录失败');
}
```

#### 2. 检查权限

```typescript
if (rbacService.hasPermission(Permission.EMAIL_SEND)) {
  // 执行发送邮件操作
} else {
  console.log('没有发送邮件权限');
}
```

#### 3. 创建用户

```typescript
const newUser = rbacService.createUser({
  username: 'testuser',
  email: 'test@example.com',
  role: Role.USER,
  permissions: [
    Permission.DASHBOARD_VIEW,
    Permission.MONITORING_VIEW
  ],
  isActive: true
});
```

#### 4. 分配角色

```typescript
rbacService.assignRole('user-001', Role.ADMIN);
```

#### 5. 获取审计日志

```typescript
const logs = rbacService.getAuditLogs(50);
logs.forEach(log => {
  console.log(`${log.timestamp} - ${log.username} - ${log.action}`);
});
```

### 在React组件中使用

```typescript
import React from 'react';
import { rbacService, Permission } from '@/services/rbacService';

export const EmailButton: React.FC = () => {
  const currentUser = rbacService.getCurrentUser();

  if (!currentUser) {
    return <div>请先登录</div>;
  }

  if (!rbacService.hasPermission(Permission.EMAIL_SEND)) {
    return <div>没有发送邮件权限</div>;
  }

  return (
    <button onClick={() => {
      // 发送邮件逻辑
    }}>
      发送邮件
    </button>
  );
};
```

### 权限保护路由

```typescript
import { Navigate } from 'react-router-dom';
import { rbacService, Permission } from '@/services/rbacService';

export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredPermission: Permission;
}> = ({ children, requiredPermission }) => {
  if (!rbacService.hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

// 使用
<ProtectedRoute requiredPermission={Permission.EMAIL_SEND}>
  <EmailComponent />
</ProtectedRoute>
```

---

## 安全考虑

### 1. 密码安全

- 使用bcrypt加密存储密码
- 强制使用强密码策略
- 定期要求用户更换密码

### 2. 会话管理

- 设置合理的会话超时时间
- 登出时清除会话
- 支持多设备登录管理

### 3. 权限最小化

- 遵循最小权限原则
- 只授予用户完成工作所需的最小权限
- 定期审查和撤销不必要的权限

### 4. 审计追踪

- 记录所有权限相关操作
- 不可篡改的审计日志
- 支持审计日志导出

### 5. 访问控制

- 支持IP白名单
- 支持时间限制
- 支持资源限制

---

## 最佳实践

### 1. 角色设计

- **角色数量适中**: 不要创建太多角色，保持管理简单
- **角色职责明确**: 每个角色应该有明确的职责范围
- **角色层级清晰**: 建立清晰的角色层级关系

### 2. 权限设计

- **权限粒度适中**: 不要太细也不要太粗
- **权限命名规范**: 使用统一的命名规范
- **权限分组管理**: 将相关权限分组管理

### 3. 用户管理

- **定期审查**: 定期审查用户权限
- **及时清理**: 及时清理离职或不再需要的用户
- **密码策略**: 强制使用强密码并定期更换

### 4. 审计日志

- **定期查看**: 定期查看审计日志
- **异常监控**: 监控异常操作
- **日志保留**: 合理设置日志保留期限

---

## 故障排除

### 常见问题

#### 1. 用户无法登录

**原因**: 用户名或密码错误，或用户已被禁用

**解决方案**:
- 检查用户名和密码是否正确
- 检查用户是否被禁用
- 重置用户密码

#### 2. 权限检查失败

**原因**: 用户没有相应权限，或权限未正确分配

**解决方案**:
- 检查用户角色和权限
- 重新分配角色或权限
- 检查访问控制策略

#### 3. 角色分配失败

**原因**: 角色不存在，或策略配置错误

**解决方案**:
- 检查角色是否存在
- 检查策略配置
- 查看审计日志了解详细错误

#### 4. 审计日志丢失

**原因**: LocalStorage已满或被清空

**解决方案**:
- 增加LocalStorage配额
- 定期导出审计日志
- 实现日志归档机制

---

## 更新日志

### v1.0.0 (2026-01-20)

- ✅ 初始版本发布
- ✅ 实现RBAC三级权限体系
- ✅ 实现用户管理功能
- ✅ 实现角色管理功能
- ✅ 实现权限检查功能
- ✅ 实现审计日志功能
- ✅ 实现访问控制策略

---

## 联系方式

如有问题或建议，请联系：

- **邮箱**: support@0379.email
- **工单**: 提交技术支持工单
- **文档**: 查看帮助中心

---

<div align="center">

> **「言启象限 | 语枢未来」**
> **「Words Initiate Quadrants, Language Serves as Core for the Future」**

</div>
