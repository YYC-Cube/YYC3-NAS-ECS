# YYC³ NAS-ECS 备份模块技术文档

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

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
- [高级使用示例](#高级使用示例)
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

### 高级使用示例

#### 1. 智能备份策略

根据文件变化率和重要性自动选择备份类型。

```typescript
import { backupService, BackupType, BackupStorage } from '@/services/backupService';

interface FileChangeInfo {
  path: string;
  lastModified: Date;
  size: number;
  changeRate: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

class SmartBackupStrategy {
  private changeHistory: Map<string, FileChangeInfo[]> = new Map();

  analyzeFileChanges(filePath: string): FileChangeInfo {
    const history = this.changeHistory.get(filePath) || [];
    const now = new Date();
    
    // 计算变化率
    const recentChanges = history.filter(h => 
      (now.getTime() - h.lastModified.getTime()) < 7 * 24 * 60 * 60 * 1000
    );
    const changeRate = recentChanges.length / 7;

    // 根据文件路径确定重要性
    let importance: FileChangeInfo['importance'] = 'medium';
    if (filePath.includes('/config/')) {
      importance = 'critical';
    } else if (filePath.includes('/data/')) {
      importance = 'high';
    } else if (filePath.includes('/logs/')) {
      importance = 'low';
    }

    const info: FileChangeInfo = {
      path: filePath,
      lastModified: now,
      size: this.getFileSize(filePath),
      changeRate,
      importance
    };

    history.push(info);
    this.changeHistory.set(filePath, history.slice(-30)); // 保留最近30条记录

    return info;
  }

  recommendBackupType(filePath: string): BackupType {
    const info = this.analyzeFileChanges(filePath);

    // 关键文件总是完整备份
    if (info.importance === 'critical') {
      return BackupType.FULL;
    }

    // 高变化率文件使用增量备份
    if (info.changeRate > 3) {
      return BackupType.INCREMENTAL;
    }

    // 中等变化率文件使用差异备份
    if (info.changeRate > 1) {
      return BackupType.DIFFERENTIAL;
    }

    // 低变化率文件使用完整备份
    return BackupType.FULL;
  }

  private getFileSize(filePath: string): number {
    // 实现获取文件大小的逻辑
    return 0;
  }
}

const smartStrategy = new SmartBackupStrategy();

// 使用示例 - 创建智能备份配置
const recommendedType = smartStrategy.recommendBackupType('/data/user.db');

const smartConfig = backupService.createConfig({
  name: '智能数据备份',
  type: recommendedType,
  storage: BackupStorage.LOCAL,
  schedule: '0 */6 * * *',
  retentionDays: 30,
  compression: true,
  encryption: true,
  storageConfig: {
    localPath: '/backups/smart'
  },
  includedPaths: ['/data', '/config'],
  excludedPaths: ['/tmp', '/cache'],
  isActive: true
});
```

#### 2. 多存储备份策略

同时将备份存储到多个位置，提高数据安全性。

```typescript
import { backupService, BackupType, BackupStorage } from '@/services/backupService';

interface MultiStorageBackup {
  primary: BackupConfig;
  secondary: BackupConfig;
  tertiary?: BackupConfig;
}

class MultiStorageBackupManager {
  async createMultiStorageBackup(
    name: string,
    paths: string[],
    createdBy: string
  ): Promise<BackupRecord[]> {
    const results: BackupRecord[] = [];

    // 创建本地备份（主存储）
    const localConfig = backupService.createConfig({
      name: `${name}-本地`,
      type: BackupType.FULL,
      storage: BackupStorage.LOCAL,
      schedule: '0 2 * * *',
      retentionDays: 7,
      compression: true,
      encryption: false,
      storageConfig: {
        localPath: '/backups/local'
      },
      includedPaths: paths,
      excludedPaths: ['/tmp'],
      isActive: true
    });

    const localBackup = await backupService.createBackup(
      localConfig.id,
      createdBy
    );
    results.push(localBackup);

    // 创建云备份（次存储）
    const cloudConfig = backupService.createConfig({
      name: `${name}-云存储`,
      type: BackupType.INCREMENTAL,
      storage: BackupStorage.ALIYUN_OSS,
      schedule: '0 3 * * *',
      retentionDays: 30,
      compression: true,
      encryption: true,
      storageConfig: {
        ossConfig: {
          bucket: 'my-backup-bucket',
          region: 'oss-cn-hangzhou',
          accessKey: 'your-access-key',
          secretKey: 'your-secret-key'
        }
      },
      includedPaths: paths,
      excludedPaths: ['/tmp', '/cache'],
      isActive: true
    });

    const cloudBackup = await backupService.createBackup(
      cloudConfig.id,
      createdBy
    );
    results.push(cloudBackup);

    // 创建远程备份（第三存储 - 可选）
    const remoteConfig = backupService.createConfig({
      name: `${name}-远程`,
      type: BackupType.DIFFERENTIAL,
      storage: BackupStorage.SFTP,
      schedule: '0 4 * * 0',
      retentionDays: 90,
      compression: true,
      encryption: true,
      storageConfig: {
        sftpConfig: {
          host: 'remote-backup.example.com',
          port: 22,
          username: 'backup',
          password: 'secure-password',
          privateKey: 'path-to-private-key'
        }
      },
      includedPaths: paths,
      excludedPaths: ['/tmp', '/cache', '/logs'],
      isActive: true
    });

    const remoteBackup = await backupService.createBackup(
      remoteConfig.id,
      createdBy
    );
    results.push(remoteBackup);

    return results;
  }

  async restoreFromBestSource(
    backupName: string,
    restorePath: string,
    createdBy: string
  ): Promise<RestoreRecord> {
    // 获取所有备份记录
    const records = backupService.getRecords();
    
    // 筛选指定名称的备份
    const matchingBackups = records.filter(r => 
      r.configName.includes(backupName)
    );

    // 按优先级排序：本地 > 云存储 > 远程
    const priorityOrder = [BackupStorage.LOCAL, BackupStorage.ALIYUN_OSS, BackupStorage.SFTP];
    matchingBackups.sort((a, b) => {
      const priorityA = priorityOrder.indexOf(a.storage);
      const priorityB = priorityOrder.indexOf(b.storage);
      return priorityA - priorityB;
    });

    // 尝试从最佳源恢复
    for (const backup of matchingBackups) {
      try {
        const restore = await backupService.restoreBackup(
          backup.id,
          restorePath,
          createdBy
        );
        console.log(`成功从 ${backup.storage} 恢复备份`);
        return restore;
      } catch (error) {
        console.error(`从 ${backup.storage} 恢复失败:`, error);
        continue;
      }
    }

    throw new Error('所有备份源均恢复失败');
  }
}

const multiStorageManager = new MultiStorageBackupManager();

// 使用示例 - 创建多存储备份
const backups = await multiStorageManager.createMultiStorageBackup(
  '系统数据',
  ['/data', '/config'],
  'admin'
);

console.log(`已创建 ${backups.length} 个备份`);

// 使用示例 - 从最佳源恢复
const restore = await multiStorageManager.restoreFromBestSource(
  '系统数据',
  '/restore',
  'admin'
);
```

#### 3. 备份性能监控

实时监控备份性能，及时发现和解决问题。

```typescript
import { backupService } from '@/services/backupService';

interface BackupPerformanceMetrics {
  backupId: string;
  configName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  throughput?: number;
  compressionRatio?: number;
  fileSize: number;
  compressedSize?: number;
  status: string;
  errors?: string[];
}

class BackupPerformanceMonitor {
  private metrics: BackupPerformanceMetrics[] = [];
  private monitoring: boolean = false;

  startMonitoring(configId: string, createdBy: string): void {
    const config = backupService.getConfigById(configId);
    if (!config) {
      throw new Error('备份配置不存在');
    }

    const metrics: BackupPerformanceMetrics = {
      backupId: '',
      configName: config.name,
      startTime: new Date(),
      fileSize: 0,
      status: 'in_progress'
    };

    this.metrics.push(metrics);

    // 开始备份并监控
    backupService.createBackup(configId, createdBy)
      .then(backup => {
        const metric = this.findMetric(backup.id);
        if (metric) {
          metric.endTime = new Date();
          metric.duration = metric.endTime.getTime() - metric.startTime.getTime();
          metric.throughput = metric.fileSize / (metric.duration / 1000);
          metric.compressedSize = backup.compressedSize;
          metric.compressionRatio = metric.compressedSize 
            ? metric.fileSize / metric.compressedSize 
            : 0;
          metric.status = backup.status;
        }
      })
      .catch(error => {
        const metric = this.findMetric('');
        if (metric) {
          metric.status = 'failed';
          metric.errors = [error.message];
        }
      });
  }

  private findMetric(backupId: string): BackupPerformanceMetrics | undefined {
    return this.metrics.find(m => m.backupId === backupId || m.backupId === '');
  }

  getPerformanceReport(days: number = 7): any {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentMetrics = this.metrics.filter(m => 
      m.startTime > cutoffDate
    );

    const totalBackups = recentMetrics.length;
    const successfulBackups = recentMetrics.filter(m => m.status === 'completed').length;
    const failedBackups = recentMetrics.filter(m => m.status === 'failed').length;

    const avgDuration = recentMetrics
      .filter(m => m.duration)
      .reduce((sum, m) => sum + (m.duration || 0), 0) / totalBackups;

    const avgThroughput = recentMetrics
      .filter(m => m.throughput)
      .reduce((sum, m) => sum + (m.throughput || 0), 0) / totalBackups;

    const avgCompressionRatio = recentMetrics
      .filter(m => m.compressionRatio)
      .reduce((sum, m) => sum + (m.compressionRatio || 0), 0) / totalBackups;

    return {
      period: `${days}天`,
      totalBackups,
      successfulBackups,
      failedBackups,
      successRate: (successfulBackups / totalBackups * 100).toFixed(2) + '%',
      avgDuration: (avgDuration / 1000).toFixed(2) + '秒',
      avgThroughput: (avgThroughput / 1024 / 1024).toFixed(2) + 'MB/s',
      avgCompressionRatio: avgCompressionRatio.toFixed(2) + 'x'
    };
  }

  identifySlowBackups(thresholdMs: number = 300000): BackupPerformanceMetrics[] {
    return this.metrics.filter(m => 
      m.duration && m.duration > thresholdMs && m.status === 'completed'
    );
  }

  identifyFailedBackups(): BackupPerformanceMetrics[] {
    return this.metrics.filter(m => m.status === 'failed');
  }
}

const performanceMonitor = new BackupPerformanceMonitor();

// 使用示例 - 监控备份性能
performanceMonitor.startMonitoring('config-001', 'admin');

// 获取性能报告
const report = performanceMonitor.getPerformanceReport(7);
console.log('备份性能报告:', report);

// 识别慢备份
const slowBackups = performanceMonitor.identifySlowBackups(300000);
console.log(`发现 ${slowBackups.length} 个慢备份`);

// 识别失败备份
const failedBackups = performanceMonitor.identifyFailedBackups();
console.log(`发现 ${failedBackups.length} 个失败备份`);
```

#### 4. 备份完整性验证

定期验证备份文件的完整性，确保数据可恢复。

```typescript
import { backupService } from '@/services/backupService';

interface VerificationResult {
  backupId: string;
  backupName: string;
  isValid: boolean;
  checksumMatch: boolean;
  fileCount: number;
  corruptedFiles: string[];
  verificationTime: Date;
  duration: number;
}

class BackupIntegrityVerifier {
  async verifyBackup(backupId: string): Promise<VerificationResult> {
    const backup = backupService.getRecordById(backupId);
    if (!backup) {
      throw new Error('备份不存在');
    }

    const startTime = Date.now();
    const result: VerificationResult = {
      backupId: backup.id,
      backupName: backup.configName,
      isValid: false,
      checksumMatch: false,
      fileCount: 0,
      corruptedFiles: [],
      verificationTime: new Date(),
      duration: 0
    };

    try {
      // 验证校验和
      const actualChecksum = await this.calculateChecksum(backup.storagePath);
      result.checksumMatch = actualChecksum === backup.checksum;

      if (!result.checksumMatch) {
        result.corruptedFiles.push('校验和不匹配');
      }

      // 验证文件完整性
      const files = await this.listFiles(backup.storagePath);
      result.fileCount = files.length;

      for (const file of files) {
        const fileChecksum = await this.calculateFileChecksum(file);
        const expectedChecksum = await this.getExpectedChecksum(file);

        if (fileChecksum !== expectedChecksum) {
          result.corruptedFiles.push(file);
        }
      }

      // 判断备份是否有效
      result.isValid = result.checksumMatch && result.corruptedFiles.length === 0;

    } catch (error) {
      result.corruptedFiles.push(`验证失败: ${error.message}`);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  async verifyAllBackups(days: number = 30): Promise<VerificationResult[]> {
    const records = backupService.getRecords();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentBackups = records.filter(r => 
      new Date(r.startTime) > cutoffDate && r.status === 'completed'
    );

    const results: VerificationResult[] = [];

    for (const backup of recentBackups) {
      try {
        const result = await this.verifyBackup(backup.id);
        results.push(result);
      } catch (error) {
        console.error(`验证备份 ${backup.id} 失败:`, error);
      }
    }

    return results;
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    // 实现计算文件校验和的逻辑
    return 'calculated-checksum';
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    // 实现计算单个文件校验和的逻辑
    return 'file-checksum';
  }

  private async getExpectedChecksum(filePath: string): Promise<string> {
    // 实现获取预期校验和的逻辑
    return 'expected-checksum';
  }

  private async listFiles(backupPath: string): Promise<string[]> {
    // 实现列出备份文件逻辑
    return [];
  }
}

const integrityVerifier = new BackupIntegrityVerifier();

// 使用示例 - 验证单个备份
const result = await integrityVerifier.verifyBackup('backup-001');
console.log(`备份 ${result.backupName} 验证结果:`, result.isValid ? '有效' : '无效');
if (!result.isValid) {
  console.log('问题文件:', result.corruptedFiles);
}

// 使用示例 - 验证所有备份
const allResults = await integrityVerifier.verifyAllBackups(30);
const validBackups = allResults.filter(r => r.isValid).length;
const invalidBackups = allResults.filter(r => !r.isValid).length;

console.log(`验证完成: ${validBackups} 个有效, ${invalidBackups} 个无效`);
```

#### 5. 自动化备份恢复测试

定期测试备份恢复流程，确保备份数据可用。

```typescript
import { backupService } from '@/services/backupService';

interface RestoreTestResult {
  backupId: string;
  backupName: string;
  testDate: Date;
  restorePath: string;
  success: boolean;
  duration: number;
  filesRestored: number;
  errors: string[];
  dataIntegrity: boolean;
}

class AutomatedRestoreTester {
  private testResults: RestoreTestResult[] = [];

  async testRestore(
    backupId: string,
    testPath: string = '/tmp/restore-test'
  ): Promise<RestoreTestResult> {
    const backup = backupService.getRecordById(backupId);
    if (!backup) {
      throw new Error('备份不存在');
    }

    const result: RestoreTestResult = {
      backupId: backup.id,
      backupName: backup.configName,
      testDate: new Date(),
      restorePath: testPath,
      success: false,
      duration: 0,
      filesRestored: 0,
      errors: [],
      dataIntegrity: false
    };

    const startTime = Date.now();

    try {
      // 执行恢复
      const restore = await backupService.restoreBackup(
        backupId,
        testPath,
        'automated-test'
      );

      result.filesRestored = restore.filesRestored;
      result.success = restore.status === 'completed';

      // 验证数据完整性
      result.dataIntegrity = await this.verifyDataIntegrity(
        backup.storagePath,
        testPath
      );

      // 清理测试数据
      await this.cleanupTestData(testPath);

    } catch (error) {
      result.errors.push(error.message);
      result.success = false;
    }

    result.duration = Date.now() - startTime;
    this.testResults.push(result);

    return result;
  }

  async runScheduledTests(configIds: string[]): Promise<RestoreTestResult[]> {
    const results: RestoreTestResult[] = [];

    for (const configId of configIds) {
      // 获取最新的成功备份
      const records = backupService.getRecords(configId);
      const latestBackup = records
        .filter(r => r.status === 'completed')
        .sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0];

      if (!latestBackup) {
        console.warn(`配置 ${configId} 没有可用的备份`);
        continue;
      }

      const testPath = `/tmp/restore-test-${Date.now()}`;
      const result = await this.testRestore(latestBackup.id, testPath);
      results.push(result);
    }

    return results;
  }

  getTestReport(days: number = 7): any {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentTests = this.testResults.filter(t => 
      t.testDate > cutoffDate
    );

    const totalTests = recentTests.length;
    const successfulTests = recentTests.filter(t => t.success).length;
    const failedTests = recentTests.filter(t => !t.success).length;

    const avgDuration = recentTests
      .reduce((sum, t) => sum + t.duration, 0) / totalTests;

    const integrityPassed = recentTests.filter(t => t.dataIntegrity).length;

    return {
      period: `${days}天`,
      totalTests,
      successfulTests,
      failedTests,
      successRate: (successfulTests / totalTests * 100).toFixed(2) + '%',
      avgDuration: (avgDuration / 1000).toFixed(2) + '秒',
      integrityPassRate: (integrityPassed / totalTests * 100).toFixed(2) + '%'
    };
  }

  private async verifyDataIntegrity(
    sourcePath: string,
    restorePath: string
  ): Promise<boolean> {
    // 实现数据完整性验证逻辑
    // 比较源文件和恢复文件的校验和
    return true;
  }

  private async cleanupTestData(path: string): Promise<void> {
    // 实现清理测试数据逻辑
  }
}

const restoreTester = new AutomatedRestoreTester();

// 使用示例 - 测试单个备份恢复
const testResult = await restoreTester.testRestore('backup-001');
console.log(`恢复测试结果: ${testResult.success ? '成功' : '失败'}`);
console.log(`文件数: ${testResult.filesRestored}`);
console.log(`数据完整性: ${testResult.dataIntegrity ? '通过' : '失败'}`);

// 使用示例 - 运行定期测试
const configIds = ['config-001', 'config-002', 'config-003'];
const testResults = await restoreTester.runScheduledTests(configIds);

console.log(`完成 ${testResults.length} 个恢复测试`);

// 获取测试报告
const report = restoreTester.getTestReport(7);
console.log('恢复测试报告:', report);
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

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
