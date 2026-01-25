# YYC³ NAS-ECS 备份模块技术文档

> **文件标识**: YYC3-NAS-ECS-备份模块技术文档
> **版本**: 1.0.0
> **创建日期**: 2026-01-20
> **作者**: YYC³ Team
> **模块**: 备份管理
> **状态**: ✅ 已完成

---

## 📋 目录

- [模块概述](#模块概述)
- [架构设计](#架构设计)
- [数据模型](#数据模型)
- [API接口](#api接口)
- [功能特性](#功能特性)
- [使用指南](#使用指南)
- [性能优化](#性能优化)
- [安全考虑](#安全考虑)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

---

## 模块概述

### 功能描述

YYC³ NAS-ECS 备份模块提供完善的数据备份和恢复功能，支持定时备份、手动备份、多种备份类型和存储方式。该模块遵循「五高五标五化」标准，确保数据安全性和可恢复性。

### 核心特性

- ✅ **多种备份类型**: 支持完整备份、增量备份、差异备份
- ✅ **定时备份**: 支持Cron表达式配置自动备份计划
- ✅ **多种存储方式**: 支持本地存储、AWS S3、阿里云OSS、FTP、SFTP
- ✅ **数据加密**: 支持备份数据加密存储
- ✅ **数据压缩**: 支持备份数据压缩，节省存储空间
- ✅ **备份校验**: 支持备份文件校验，确保数据完整性
- ✅ **自动清理**: 支持自动清理过期备份
- ✅ **恢复管理**: 完整的备份恢复功能

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
│   └── backup/
│       └── BackupManager.tsx     # 备份管理组件
├── services/
│   └── backupService.ts           # 备份服务
└── types/
    └── backup.ts                  # 备份类型定义
```

### 设计模式

1. **单例模式**: BackupService 采用单例模式，确保全局只有一个备份服务实例
2. **策略模式**: 支持多种备份类型和存储方式
3. **工厂模式**: 根据配置创建不同类型的备份

### 备份流程

```
备份请求 → BackupService → 创建备份记录
    ↓
执行备份 → 压缩数据 → 加密数据（可选）
    ↓
存储备份 → 生成交验和 → 更新备份状态
    ↓
完成备份 → 记录统计信息
```

### 恢复流程

```
恢复请求 → BackupService → 创建恢复记录
    ↓
验证备份 → 解密数据（可选） → 解压数据
    ↓
恢复数据 → 验证完整性 → 更新恢复状态
    ↓
完成恢复 → 记录统计信息
```

---

## 数据模型

### BackupType

备份类型枚举：

```typescript
enum BackupType {
  FULL = 'FULL',                 // 完整备份
  INCREMENTAL = 'INCREMENTAL',     // 增量备份
  DIFFERENTIAL = 'DIFFERENTIAL'    // 差异备份
}
```

### BackupStatus

备份状态枚举：

```typescript
enum BackupStatus {
  PENDING = 'PENDING',           // 待处理
  IN_PROGRESS = 'IN_PROGRESS',   // 进行中
  COMPLETED = 'COMPLETED',       // 已完成
  FAILED = 'FAILED',             // 失败
  CANCELLED = 'CANCELLED'        // 已取消
}
```

### BackupStorage

备份存储方式枚举：

```typescript
enum BackupStorage {
  LOCAL = 'LOCAL',               // 本地存储
  S3 = 'S3',                     // AWS S3
  ALIYUN_OSS = 'ALIYUN_OSS',     // 阿里云OSS
  FTP = 'FTP',                   // FTP
  SFTP = 'SFTP'                  // SFTP
}
```

### BackupConfig

备份配置：

```typescript
interface BackupConfig {
  id: string;                    // 配置ID
  name: string;                  // 配置名称
  type: BackupType;             // 备份类型
  storage: BackupStorage;       // 存储方式
  schedule: string;             // 备份计划（Cron表达式）
  retentionDays: number;        // 保留天数
  compression: boolean;         // 是否压缩
  encryption: boolean;          // 是否加密
  storageConfig: {              // 存储配置
    localPath?: string;         // 本地路径
    s3Config?: {               // S3配置
      bucket: string;
      region: string;
      accessKey: string;
      secretKey: string;
    };
    ossConfig?: {               // OSS配置
      bucket: string;
      region: string;
      accessKey: string;
      secretKey: string;
    };
    ftpConfig?: {               // FTP配置
      host: string;
      port: number;
      username: string;
      password: string;
    };
    sftpConfig?: {              // SFTP配置
      host: string;
      port: number;
      username: string;
      password: string;
      privateKey?: string;
    };
  };
  includedPaths: string[];      // 包含路径
  excludedPaths: string[];      // 排除路径
  isActive: boolean;           // 是否激活
  lastBackup?: string;         // 最后备份时间
  createdAt: string;           // 创建时间
}
```

### BackupRecord

备份记录：

```typescript
interface BackupRecord {
  id: string;                    // 备份ID
  configId: string;             // 配置ID
  configName: string;           // 配置名称
  type: BackupType;            // 备份类型
  status: BackupStatus;        // 备份状态
  startTime: string;          // 开始时间
  endTime?: string;           // 结束时间
  size: number;               // 备份大小（字节）
  compressedSize?: number;     // 压缩后大小
  filesCount: number;         // 文件数量
  storage: BackupStorage;     // 存储方式
  storagePath: string;        // 存储路径
  checksum?: string;          // 校验和
  createdBy: string;          // 创建者
  errorMessage?: string;      // 错误信息
}
```

### RestoreRecord

恢复记录：

```typescript
interface RestoreRecord {
  id: string;                    // 恢复ID
  backupId: string;             // 备份ID
  backupName: string;           // 备份名称
  status: BackupStatus;        // 恢复状态
  startTime: string;          // 开始时间
  endTime?: string;           // 结束时间
  restorePath: string;        // 恢复路径
  filesRestored: number;     // 恢复文件数
  createdBy: string;          // 创建者
  errorMessage?: string;      // 错误信息
}
```

### BackupStats

备份统计：

```typescript
interface BackupStats {
  totalBackups: number;        // 总备份数
  totalSize: number;          // 总大小
  successfulBackups: number;   // 成功备份数
  failedBackups: number;      // 失败备份数
  lastBackupTime?: string;    // 最后备份时间
  storageUsage: {             // 存储使用情况
    used: number;            // 已使用
    total: number;           // 总量
    percentage: number;       // 使用率
  };
}
```

---

## API接口

### BackupService

备份服务类，提供备份管理的核心功能。

#### 方法列表

##### getConfigs

获取所有备份配置。

```typescript
getConfigs(): BackupConfig[]
```

**返回值**: 备份配置列表

##### getConfigById

根据ID获取备份配置。

```typescript
getConfigById(id: string): BackupConfig | undefined
```

**参数**:
- `id`: 配置ID

**返回值**: 备份配置对象或undefined

##### createConfig

创建备份配置。

```typescript
createConfig(config: Omit<BackupConfig, 'id' | 'createdAt'>): BackupConfig
```

**参数**:
- `config`: 备份配置数据（不包含id和createdAt）

**返回值**: 创建的备份配置对象

**示例**:

```typescript
const config = backupService.createConfig({
  name: '系统备份',
  type: BackupType.FULL,
  storage: BackupStorage.LOCAL,
  schedule: '0 2 * * *',
  retentionDays: 30,
  compression: true,
  encryption: false,
  storageConfig: {
    localPath: '/backups'
  },
  includedPaths: ['/data', '/config'],
  excludedPaths: ['/tmp'],
  isActive: true
});
```

##### updateConfig

更新备份配置。

```typescript
updateConfig(id: string, updates: Partial<BackupConfig>): BackupConfig | null
```

**参数**:
- `id`: 配置ID
- `updates`: 更新数据

**返回值**: 更新后的备份配置对象或null

##### deleteConfig

删除备份配置。

```typescript
deleteConfig(id: string): boolean
```

**参数**:
- `id`: 配置ID

**返回值**: 是否删除成功

##### createBackup

创建备份。

```typescript
createBackup(configId: string, createdBy: string): Promise<BackupRecord>
```

**参数**:
- `configId`: 配置ID
- `createdBy`: 创建者

**返回值**: 备份记录Promise

**示例**:

```typescript
try {
  const backup = await backupService.createBackup('config-001', 'admin');
  console.log('备份创建成功', backup);
} catch (error) {
  console.error('备份创建失败', error);
}
```

##### getRecords

获取备份记录。

```typescript
getRecords(configId?: string, limit?: number): BackupRecord[]
```

**参数**:
- `configId`: 配置ID（可选）
- `limit`: 返回数量限制（可选）

**返回值**: 备份记录列表

##### getRecordById

根据ID获取备份记录。

```typescript
getRecordById(id: string): BackupRecord | undefined
```

**参数**:
- `id`: 备份ID

**返回值**: 备份记录对象或undefined

##### restoreBackup

恢复备份。

```typescript
restoreBackup(backupId: string, restorePath: string, createdBy: string): Promise<RestoreRecord>
```

**参数**:
- `backupId`: 备份ID
- `restorePath`: 恢复路径
- `createdBy`: 创建者

**返回值**: 恢复记录Promise

**示例**:

```typescript
try {
  const restore = await backupService.restoreBackup('backup-001', '/restore', 'admin');
  console.log('备份恢复成功', restore);
} catch (error) {
  console.error('备份恢复失败', error);
}
```

##### getRestores

获取恢复记录。

```typescript
getRestores(backupId?: string, limit?: number): RestoreRecord[]
```

**参数**:
- `backupId`: 备份ID（可选）
- `limit`: 返回数量限制（可选）

**返回值**: 恢复记录列表

##### deleteRecord

删除备份记录。

```typescript
deleteRecord(id: string): boolean
```

**参数**:
- `id`: 备份ID

**返回值**: 是否删除成功

##### getStats

获取备份统计信息。

```typescript
getStats(): BackupStats
```

**返回值**: 备份统计信息

##### getNextBackupTime

获取下次备份时间。

```typescript
getNextBackupTime(configId: string): Date | null
```

**参数**:
- `configId`: 配置ID

**返回值**: 下次备份时间或null

##### cleanupOldBackups

清理过期备份。

```typescript
cleanupOldBackups(): number
```

**返回值**: 清理的备份数量

##### exportBackupConfig

导出备份配置。

```typescript
exportBackupConfig(configId: string): string
```

**参数**:
- `configId`: 配置ID

**返回值**: 配置JSON字符串

##### importBackupConfig

导入备份配置。

```typescript
importBackupConfig(configJson: string): BackupConfig
```

**参数**:
- `configJson`: 配置JSON字符串

**返回值**: 备份配置对象

---

## 功能特性

### 1. 备份类型

#### 完整备份 (FULL)

- **说明**: 备份所有选定的数据
- **优点**: 恢复简单，独立完整
- **缺点**: 备份时间长，占用空间大
- **适用场景**: 定期完整备份

#### 增量备份 (INCREMENTAL)

- **说明**: 只备份自上次备份后修改的数据
- **优点**: 备份速度快，节省空间
- **缺点**: 恢复需要多个备份文件
- **适用场景**: 频繁备份

#### 差异备份 (DIFFERENTIAL)

- **说明**: 备份自上次完整备份后修改的数据
- **优点**: 平衡备份速度和恢复复杂度
- **缺点**: 需要定期完整备份
- **适用场景**: 日常备份

### 2. 存储方式

#### 本地存储

- **说明**: 备份到本地磁盘
- **优点**: 速度快，无需网络
- **缺点**: 受限于本地存储空间
- **配置**:
  ```typescript
  storageConfig: {
    localPath: '/backups'
  }
  ```

#### AWS S3

- **说明**: 备份到亚马逊S3
- **优点**: 高可靠性，无限扩展
- **缺点**: 需要网络连接，产生费用
- **配置**:
  ```typescript
  storageConfig: {
    s3Config: {
      bucket: 'my-backup-bucket',
      region: 'us-east-1',
      accessKey: 'AKIAIOSFODNN7EXAMPLE',
      secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    }
  }
  ```

#### 阿里云OSS

- **说明**: 备份到阿里云对象存储
- **优点**: 国内访问快，价格优惠
- **缺点**: 需要网络连接，产生费用
- **配置**:
  ```typescript
  storageConfig: {
    ossConfig: {
      bucket: 'my-backup-bucket',
      region: 'oss-cn-hangzhou',
      accessKey: 'LTAI5t6xxxxxxxxxxxxx',
      secretKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
  }
  ```

#### FTP/SFTP

- **说明**: 备份到FTP/SFTP服务器
- **优点**: 灵活，可自建服务器
- **缺点**: 需要维护服务器
- **配置**:
  ```typescript
  storageConfig: {
    ftpConfig: {
      host: 'ftp.example.com',
      port: 21,
      username: 'backup',
      password: 'password123'
    }
  }
  ```

### 3. 备份计划

使用Cron表达式定义备份计划：

| Cron表达式 | 说明 |
|-----------|------|
| `0 2 * * *` | 每天凌晨2点 |
| `0 */6 * * *` | 每6小时 |
| `0 0 * * 0` | 每周日凌晨 |
| `0 0 1 * *` | 每月1号凌晨 |
| `0 2,14 * * *` | 每天凌晨2点和14点 |
| `*/30 * * * *` | 每30分钟 |

### 4. 数据压缩

- **压缩算法**: gzip
- **压缩级别**: 6（默认）
- **压缩率**: 约40-60%
- **性能影响**: 轻微增加备份时间

### 5. 数据加密

- **加密算法**: AES-256
- **加密模式**: CBC
- **密钥管理**: 使用配置的密钥
- **性能影响**: 中等增加备份时间

### 6. 备份校验

- **校验算法**: SHA-256
- **校验时机**: 备份完成后
- **校验内容**: 备份文件完整性
- **错误处理**: 校验失败时标记备份为失败

### 7. 自动清理

- **清理策略**: 基于保留天数
- **清理时机**: 手动触发或定时任务
- **清理范围**: 已完成的备份
- **安全保护**: 保留至少一个完整备份

---

## 使用指南

### 基本使用

#### 1. 创建备份配置

```typescript
import { backupService, BackupType, BackupStorage } from '@/services/backupService';

const config = backupService.createConfig({
  name: '系统完整备份',
  type: BackupType.FULL,
  storage: BackupStorage.LOCAL,
  schedule: '0 2 * * *',
  retentionDays: 30,
  compression: true,
  encryption: true,
  storageConfig: {
    localPath: '/backups'
  },
  includedPaths: ['/data', '/config', '/logs'],
  excludedPaths: ['/tmp', '/cache'],
  isActive: true
});
```

#### 2. 执行手动备份

```typescript
try {
  const backup = await backupService.createBackup(config.id, 'admin');
  console.log('备份创建成功', backup);
} catch (error) {
  console.error('备份创建失败', error);
}
```

#### 3. 恢复备份

```typescript
try {
  const restore = await backupService.restoreBackup(
    'backup-001',
    '/restore',
    'admin'
  );
  console.log('备份恢复成功', restore);
} catch (error) {
  console.error('备份恢复失败', error);
}
```

#### 4. 获取备份统计

```typescript
const stats = backupService.getStats();
console.log(`总备份数: ${stats.totalBackups}`);
console.log(`总大小: ${formatSize(stats.totalSize)}`);
console.log(`成功备份: ${stats.successfulBackups}`);
console.log(`失败备份: ${stats.failedBackups}`);
console.log(`存储使用率: ${stats.storageUsage.percentage}%`);
```

#### 5. 清理过期备份

```typescript
const count = backupService.cleanupOldBackups();
console.log(`已清理 ${count} 个过期备份`);
```

### 在React组件中使用

```typescript
import React, { useState, useEffect } from 'react';
import { backupService } from '@/services/backupService';

export const BackupManager: React.FC = () => {
  const [configs, setConfigs] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setConfigs(backupService.getConfigs());
    setStats(backupService.getStats());
  };

  const handleCreateBackup = async (configId: string) => {
    try {
      await backupService.createBackup(configId, 'current-user');
      alert('备份创建成功');
      loadData();
    } catch (error) {
      alert('备份创建失败');
    }
  };

  return (
    <div>
      <h2>备份管理</h2>
      <div>
        {configs.map(config => (
          <div key={config.id}>
            <h3>{config.name}</h3>
            <p>类型: {config.type}</p>
            <p>存储: {config.storage}</p>
            <p>计划: {config.schedule}</p>
            <button onClick={() => handleCreateBackup(config.id)}>
              立即备份
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 性能优化

### 1. 备份性能

- **并行处理**: 使用多线程处理文件
- **增量备份**: 只备份修改的文件
- **压缩优化**: 选择合适的压缩级别
- **网络优化**: 使用断点续传和并发上传

### 2. 存储优化

- **压缩存储**: 减少存储空间占用
- **去重**: 消除重复数据
- **分层存储**: 热数据本地存储，冷数据云存储

### 3. 恢复性能

- **并行恢复**: 多线程恢复文件
- **预加载**: 预加载常用数据
- **缓存**: 缓存恢复的文件

---

## 安全考虑

### 1. 数据加密

- 使用AES-256加密备份数据
- 加密密钥安全存储
- 支持密钥轮换

### 2. 访问控制

- 集成RBAC权限管理
- 只有授权用户可以执行备份和恢复
- 记录所有备份和恢复操作

### 3. 数据完整性

- 使用SHA-256校验和
- 备份完成后验证完整性
- 恢复前验证备份文件

### 4. 安全传输

- 使用HTTPS传输数据
- 支持SFTP加密传输
- 验证服务器证书

---

## 最佳实践

### 1. 备份策略

- **3-2-1原则**: 保留3份备份，2份在不同介质，1份异地
- **定期完整备份**: 每周至少一次完整备份
- **频繁增量备份**: 每天或每小时增量备份
- **异地备份**: 至少一份备份在异地

### 2. 备份测试

- **定期测试**: 每月测试一次恢复流程
- **验证数据**: 恢复后验证数据完整性
- **记录测试**: 记录测试结果和问题

### 3. 监控告警

- **监控备份状态**: 监控备份成功率和失败率
- **告警通知**: 备份失败时立即通知
- **容量监控**: 监控存储空间使用情况

### 4. 文档记录

- **备份策略文档**: 记录备份策略和计划
- **恢复流程文档**: 记录恢复流程和步骤
- **应急响应文档**: 记录应急响应流程

---

## 故障排除

### 常见问题

#### 1. 备份失败

**原因**: 存储空间不足、网络问题、权限问题

**解决方案**:
- 检查存储空间是否充足
- 检查网络连接是否正常
- 检查文件访问权限
- 查看错误日志了解详细原因

#### 2. 恢复失败

**原因**: 备份文件损坏、校验失败、权限问题

**解决方案**:
- 验证备份文件完整性
- 检查校验和是否匹配
- 检查目标路径权限
- 尝试使用其他备份文件

#### 3. 备份速度慢

**原因**: 网络带宽不足、磁盘IO瓶颈、文件数量过多

**解决方案**:
- 使用增量备份减少数据量
- 优化网络配置
- 使用SSD提高磁盘IO
- 排除不必要的文件

#### 4. 存储空间不足

**原因**: 备份文件过多、保留期过长

**解决方案**:
- 清理过期备份
- 减少保留天数
- 使用压缩减少文件大小
- 扩展存储容量

---

## 更新日志

### v1.0.0 (2026-01-20)

- ✅ 初始版本发布
- ✅ 实现完整备份、增量备份、差异备份
- ✅ 实现本地存储、S3、OSS、FTP、SFTP存储
- ✅ 实现数据压缩和加密
- ✅ 实现备份校验和自动清理
- ✅ 实现备份恢复功能
- ✅ 实现备份统计和监控

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
