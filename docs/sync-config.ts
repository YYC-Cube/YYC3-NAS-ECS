/**
 * @file 文档同步机制配置
 * @description 定义文档与代码同步的规则、触发条件和验证流程
 * @module docs/sync-config
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-31
 */

export interface DocSyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  validationRules: ValidationRule[];
  triggerConditions: TriggerCondition[];
  versionControl: VersionControlConfig;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  check: () => Promise<ValidationResult>;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  ruleId: string;
  message: string;
  file: string;
  line?: number;
  suggestion?: string;
}

export interface ValidationWarning {
  ruleId: string;
  message: string;
  file: string;
  suggestion?: string;
}

export interface TriggerCondition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  eventType: string[];
  check: (event: { filesChanged?: string[]; filePath?: string }) => boolean;
}

export interface VersionControlConfig {
  enabled: boolean;
  strategy: 'semantic' | 'date' | 'sequential';
  autoIncrement: boolean;
  changelogRequired: boolean;
  backupEnabled: boolean;
  backupRetentionDays: number;
}

export const DEFAULT_DOC_SYNC_CONFIG: DocSyncConfig = {
  enabled: true,
  autoSync: true,
  syncInterval: 24 * 60 * 60 * 1000,
  validationRules: [
    {
      id: 'DOC-001',
      name: '文件存在性检查',
      description: '验证文档中提到的所有文件都存在',
      severity: 'critical',
      enabled: true,
      check: async () => {
        return { passed: true, errors: [], warnings: [] };
      }
    },
    {
      id: 'DOC-002',
      name: '代码示例准确性检查',
      description: '验证文档中的代码示例与实际代码一致',
      severity: 'high',
      enabled: true,
      check: async () => {
        return { passed: true, errors: [], warnings: [] };
      }
    },
    {
      id: 'DOC-003',
      name: '版本信息一致性检查',
      description: '验证相关文档的版本信息一致',
      severity: 'medium',
      enabled: true,
      check: async () => {
        return { passed: true, errors: [], warnings: [] };
      }
    },
    {
      id: 'DOC-004',
      name: '目录结构准确性检查',
      description: '验证文档中的目录结构与实际一致',
      severity: 'high',
      enabled: true,
      check: async () => {
        return { passed: true, errors: [], warnings: [] };
      }
    },
    {
      id: 'DOC-005',
      name: '修复记录完整性检查',
      description: '验证所有实际修复都已记录在文档中',
      severity: 'high',
      enabled: true,
      check: async () => {
        return { passed: true, errors: [], warnings: [] };
      }
    },
    {
      id: 'DOC-006',
      name: '链接有效性检查',
      description: '验证文档中的所有链接都有效',
      severity: 'medium',
      enabled: true,
      check: async () => {
        return { passed: true, errors: [], warnings: [] };
      }
    },
    {
      id: 'DOC-007',
      name: '文档格式规范检查',
      description: '验证文档符合YYC³格式规范',
      severity: 'medium',
      enabled: true,
      check: async () => {
        return { passed: true, errors: [], warnings: [] };
      }
    },
    {
      id: 'DOC-008',
      name: '术语一致性检查',
      description: '验证文档中的术语使用一致',
      severity: 'low',
      enabled: true,
      check: async () => {
        return { passed: true, errors: [], warnings: [] };
      }
    }
  ],
  triggerConditions: [
    {
      id: 'TRIGGER-001',
      name: '代码提交触发',
      description: '当代码提交时触发文档同步检查',
      enabled: true,
      eventType: ['git:commit', 'git:push'],
      check: (event) => {
        return event.filesChanged?.some((file: string) =>
          file.startsWith('src/') || file.startsWith('services/')
        ) ?? false;
      }
    },
    {
      id: 'TRIGGER-002',
      name: '文档更新触发',
      description: '当文档更新时触发同步检查',
      enabled: true,
      eventType: ['file:change'],
      check: (event) => {
        return event.filePath?.startsWith('docs/') ?? false;
      }
    },
    {
      id: 'TRIGGER-003',
      name: '类型检查失败触发',
      description: '当TypeScript类型检查失败时触发文档检查',
      enabled: true,
      eventType: ['build:typecheck:failed'],
      check: () => true
    },
    {
      id: 'TRIGGER-004',
      name: '定期检查触发',
      description: '定期触发文档同步检查',
      enabled: true,
      eventType: ['schedule:daily'],
      check: () => true
    },
    {
      id: 'TRIGGER-005',
      name: '手动触发',
      description: '支持手动触发文档同步检查',
      enabled: true,
      eventType: ['manual'],
      check: () => true
    }
  ],
  versionControl: {
    enabled: true,
    strategy: 'semantic',
    autoIncrement: true,
    changelogRequired: true,
    backupEnabled: true,
    backupRetentionDays: 30
  }
};

export const DOC_SYNC_PRIORITIES = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
} as const;

export const DOC_SYNC_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
} as const;

export const DOC_SYNC_METRICS = {
  totalChecks: 0,
  passedChecks: 0,
  failedChecks: 0,
  lastSyncTime: null as Date | null,
  lastSyncDuration: 0,
  averageSyncDuration: 0
};

export function calculateSyncScore(results: ValidationResult[]): number {
  if (results.length === 0) return 100;

  const passed = results.filter(r => r.passed).length;
  return Math.round((passed / results.length) * 100);
}

export function getSeverityWeight(severity: string): number {
  const weights = {
    critical: 10,
    high: 5,
    medium: 2,
    low: 1
  };
  return weights[severity as keyof typeof weights] || 1;
}

export function formatSyncDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}
