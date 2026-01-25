/**
 * @file SettingsService - 系统设置服务
 * @description 提供系统配置、主题切换、个性化设置等功能
 * @module services/settings
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import { 
  SystemSetting, SettingGroup, SettingCategory, SettingType,
  SystemConfig
} from '../types/settings';
import { logger } from '../utils/logger';

class SettingsService {
  private settings: SystemSetting[] = [];
  private config!: SystemConfig;
  private storageKey = 'yyc3-settings-data';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.loadFromStorage();
    this.ensureDefaultSettings();
    this.loadConfig();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load settings:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      logger.error('Failed to save settings:', error);
    }
  }

  private ensureDefaultSettings(): void {
    if (this.settings.length === 0) {
      const defaultSettings: SystemSetting[] = [
        {
          id: 'setting-001',
          key: 'system.name',
          label: '系统名称',
          description: '设置系统显示名称',
          category: SettingCategory.GENERAL,
          type: SettingType.STRING,
          value: 'YYC³ NAS-ECS',
          defaultValue: 'YYC³ NAS-ECS',
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-002',
          key: 'system.timezone',
          label: '时区',
          description: '设置系统时区',
          category: SettingCategory.GENERAL,
          type: SettingType.SELECT,
          value: 'Asia/Shanghai',
          defaultValue: 'Asia/Shanghai',
          options: [
            { label: '北京 (UTC+8)', value: 'Asia/Shanghai' },
            { label: '纽约 (UTC-5)', value: 'America/New_York' },
            { label: '伦敦 (UTC+0)', value: 'Europe/London' },
            { label: '东京 (UTC+9)', value: 'Asia/Tokyo' }
          ],
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-003',
          key: 'system.language',
          label: '语言',
          description: '设置系统语言',
          category: SettingCategory.GENERAL,
          type: SettingType.SELECT,
          value: 'zh-CN',
          defaultValue: 'zh-CN',
          options: [
            { label: '简体中文', value: 'zh-CN' },
            { label: 'English', value: 'en-US' },
            { label: '日本語', value: 'ja-JP' }
          ],
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-004',
          key: 'security.sessionTimeout',
          label: '会话超时时间',
          description: '设置用户会话超时时间（分钟）',
          category: SettingCategory.SECURITY,
          type: SettingType.NUMBER,
          value: 30,
          defaultValue: 30,
          min: 5,
          max: 1440,
          step: 5,
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-005',
          key: 'security.maxLoginAttempts',
          label: '最大登录尝试次数',
          description: '设置账户锁定前的最大登录尝试次数',
          category: SettingCategory.SECURITY,
          type: SettingType.NUMBER,
          value: 5,
          defaultValue: 5,
          min: 3,
          max: 10,
          step: 1,
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-006',
          key: 'security.passwordMinLength',
          label: '密码最小长度',
          description: '设置用户密码的最小长度',
          category: SettingCategory.SECURITY,
          type: SettingType.NUMBER,
          value: 8,
          defaultValue: 8,
          min: 6,
          max: 32,
          step: 1,
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-007',
          key: 'security.twoFactorAuth',
          label: '启用双因素认证',
          description: '启用双因素认证以提高账户安全性',
          category: SettingCategory.SECURITY,
          type: SettingType.BOOLEAN,
          value: false,
          defaultValue: false,
          required: false,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-008',
          key: 'notification.emailEnabled',
          label: '启用邮件通知',
          description: '启用邮件通知功能',
          category: SettingCategory.NOTIFICATION,
          type: SettingType.BOOLEAN,
          value: true,
          defaultValue: true,
          required: false,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-009',
          key: 'notification.emailSmtpHost',
          label: 'SMTP服务器',
          description: '设置SMTP服务器地址',
          category: SettingCategory.NOTIFICATION,
          type: SettingType.STRING,
          value: 'smtp.gmail.com',
          defaultValue: 'smtp.gmail.com',
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-010',
          key: 'notification.emailSmtpPort',
          label: 'SMTP端口',
          description: '设置SMTP服务器端口',
          category: SettingCategory.NOTIFICATION,
          type: SettingType.NUMBER,
          value: 587,
          defaultValue: 587,
          min: 1,
          max: 65535,
          step: 1,
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-011',
          key: 'notification.emailSmtpUsername',
          label: 'SMTP用户名',
          description: '设置SMTP服务器用户名',
          category: SettingCategory.NOTIFICATION,
          type: SettingType.STRING,
          value: '',
          defaultValue: '',
          required: true,
          sensitive: true,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-012',
          key: 'notification.emailSmtpPassword',
          label: 'SMTP密码',
          description: '设置SMTP服务器密码',
          category: SettingCategory.NOTIFICATION,
          type: SettingType.PASSWORD,
          value: '',
          defaultValue: '',
          required: true,
          sensitive: true,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-013',
          key: 'appearance.theme',
          label: '主题',
          description: '选择系统主题',
          category: SettingCategory.APPEARANCE,
          type: SettingType.SELECT,
          value: 'dark',
          defaultValue: 'dark',
          options: [
            { label: '浅色', value: 'light' },
            { label: '深色', value: 'dark' },
            { label: '自动', value: 'auto' }
          ],
          required: false,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-014',
          key: 'appearance.primaryColor',
          label: '主色调',
          description: '设置系统主色调',
          category: SettingCategory.APPEARANCE,
          type: SettingType.SELECT,
          value: '#3b82f6',
          defaultValue: '#3b82f6',
          options: [
            { label: '蓝色', value: '#3b82f6' },
            { label: '紫色', value: '#8b5cf6' },
            { label: '绿色', value: '#10b981' },
            { label: '橙色', value: '#f97316' }
          ],
          required: false,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-015',
          key: 'network.httpPort',
          label: 'HTTP端口',
          description: '设置HTTP服务端口',
          category: SettingCategory.NETWORK,
          type: SettingType.NUMBER,
          value: 3000,
          defaultValue: 3000,
          min: 1024,
          max: 65535,
          step: 1,
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-016',
          key: 'network.httpsPort',
          label: 'HTTPS端口',
          description: '设置HTTPS服务端口',
          category: SettingCategory.NETWORK,
          type: SettingType.NUMBER,
          value: 3443,
          defaultValue: 3443,
          min: 1024,
          max: 65535,
          step: 1,
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-017',
          key: 'storage.dataPath',
          label: '数据存储路径',
          description: '设置数据文件存储路径',
          category: SettingCategory.STORAGE,
          type: SettingType.STRING,
          value: '/data',
          defaultValue: '/data',
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-018',
          key: 'storage.backupPath',
          label: '备份存储路径',
          description: '设置备份文件存储路径',
          category: SettingCategory.STORAGE,
          type: SettingType.STRING,
          value: '/backups',
          defaultValue: '/backups',
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-019',
          key: 'performance.maxWorkers',
          label: '最大工作进程数',
          description: '设置最大工作进程数',
          category: SettingCategory.PERFORMANCE,
          type: SettingType.NUMBER,
          value: 4,
          defaultValue: 4,
          min: 1,
          max: 16,
          step: 1,
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-020',
          key: 'performance.cacheEnabled',
          label: '启用缓存',
          description: '启用系统缓存以提高性能',
          category: SettingCategory.PERFORMANCE,
          type: SettingType.BOOLEAN,
          value: true,
          defaultValue: true,
          required: false,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-021',
          key: 'logging.logLevel',
          label: '日志级别',
          description: '设置系统日志级别',
          category: SettingCategory.LOGGING,
          type: SettingType.SELECT,
          value: 'INFO',
          defaultValue: 'INFO',
          options: [
            { label: 'DEBUG', value: 'DEBUG' },
            { label: 'INFO', value: 'INFO' },
            { label: 'WARN', value: 'WARN' },
            { label: 'ERROR', value: 'ERROR' }
          ],
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-022',
          key: 'logging.logRetentionDays',
          label: '日志保留天数',
          description: '设置日志文件保留天数',
          category: SettingCategory.LOGGING,
          type: SettingType.NUMBER,
          value: 30,
          defaultValue: 30,
          min: 1,
          max: 365,
          step: 1,
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-023',
          key: 'backup.autoBackupEnabled',
          label: '启用自动备份',
          description: '启用系统自动备份功能',
          category: SettingCategory.BACKUP,
          type: SettingType.BOOLEAN,
          value: true,
          defaultValue: true,
          required: false,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-024',
          key: 'backup.backupSchedule',
          label: '备份计划',
          description: '设置自动备份计划（Cron表达式）',
          category: SettingCategory.BACKUP,
          type: SettingType.STRING,
          value: '0 2 * * *',
          defaultValue: '0 2 * * *',
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-025',
          key: 'api.apiEnabled',
          label: '启用API',
          description: '启用系统API接口',
          category: SettingCategory.API,
          type: SettingType.BOOLEAN,
          value: true,
          defaultValue: true,
          required: false,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        },
        {
          id: 'setting-026',
          key: 'api.apiRateLimit',
          label: 'API速率限制',
          description: '设置API请求速率限制（请求/分钟）',
          category: SettingCategory.API,
          type: SettingType.NUMBER,
          value: 60,
          defaultValue: 60,
          min: 1,
          max: 1000,
          step: 10,
          required: true,
          sensitive: false,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        }
      ];
      this.settings = defaultSettings;
      this.saveToStorage();
    }
  }

  private loadConfig(): void {
    this.config = {
      general: {
        systemName: this.getSettingValue('system.name'),
        systemDescription: 'YYC³ NAS-ECS 企业级智能管理平台',
        timezone: this.getSettingValue('system.timezone'),
        language: this.getSettingValue('system.language'),
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss'
      },
      security: {
        sessionTimeout: this.getSettingValue('security.sessionTimeout'),
        maxLoginAttempts: this.getSettingValue('security.maxLoginAttempts'),
        passwordMinLength: this.getSettingValue('security.passwordMinLength'),
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: false,
        twoFactorAuth: this.getSettingValue('security.twoFactorAuth'),
        ipWhitelist: []
      },
      notification: {
        emailEnabled: this.getSettingValue('notification.emailEnabled'),
        emailSmtpHost: this.getSettingValue('notification.emailSmtpHost'),
        emailSmtpPort: this.getSettingValue('notification.emailSmtpPort'),
        emailSmtpUsername: this.getSettingValue('notification.emailSmtpUsername'),
        emailSmtpPassword: this.getSettingValue('notification.emailSmtpPassword'),
        emailFromAddress: 'noreply@0379.email',
        webhookEnabled: false,
        webhookUrl: '',
        slackEnabled: false,
        slackWebhookUrl: ''
      },
      appearance: {
        theme: this.getSettingValue('appearance.theme'),
        primaryColor: this.getSettingValue('appearance.primaryColor'),
        fontSize: 'medium',
        density: 'comfortable',
        animations: true
      },
      network: {
        httpPort: this.getSettingValue('network.httpPort'),
        httpsPort: this.getSettingValue('network.httpsPort'),
        maxConnections: 1000,
        timeout: 30,
        proxyEnabled: false,
        proxyHost: '',
        proxyPort: 0
      },
      storage: {
        dataPath: this.getSettingValue('storage.dataPath'),
        logPath: '/logs',
        backupPath: this.getSettingValue('storage.backupPath'),
        tempPath: '/tmp',
        maxStorageSize: 10737418240,
        cleanupEnabled: true,
        cleanupDays: 7
      },
      performance: {
        maxWorkers: this.getSettingValue('performance.maxWorkers'),
        cacheEnabled: this.getSettingValue('performance.cacheEnabled'),
        cacheSize: 1073741824,
        cacheTtl: 3600,
        compressionEnabled: true,
        compressionLevel: 6
      },
      logging: {
        logLevel: this.getSettingValue('logging.logLevel'),
        logToFile: true,
        logToDatabase: true,
        maxLogSize: 104857600,
        logRetentionDays: this.getSettingValue('logging.logRetentionDays')
      },
      backup: {
        autoBackupEnabled: this.getSettingValue('backup.autoBackupEnabled'),
        backupSchedule: this.getSettingValue('backup.backupSchedule'),
        backupRetentionDays: 30,
        compressionEnabled: true,
        encryptionEnabled: false
      },
      api: {
        apiEnabled: this.getSettingValue('api.apiEnabled'),
        apiRateLimit: this.getSettingValue('api.apiRateLimit'),
        apiRateWindow: 60,
        corsEnabled: true,
        corsOrigins: ['*'],
        apiKeyRequired: true
      }
    };
  }

  getSettings(category?: SettingCategory): SystemSetting[] {
    if (category) {
      return this.settings.filter(s => s.category === category);
    }
    return [...this.settings];
  }

  getSettingById(id: string): SystemSetting | undefined {
    return this.settings.find(s => s.id === id);
  }

  getSettingByKey(key: string): SystemSetting | undefined {
    return this.settings.find(s => s.key === key);
  }

  getSettingValue(key: string): any {
    const setting = this.getSettingByKey(key);
    return setting ? setting.value : undefined;
  }

  updateSetting(id: string, value: any, updatedBy: string = 'current-user'): SystemSetting | null {
    const index = this.settings.findIndex(s => s.id === id);
    if (index === -1) {
      return null;
    }

    const setting = this.settings[index];
    
    if (setting.validation) {
      const validation = setting.validation(value);
      if (typeof validation === 'string') {
        throw new Error(validation);
      }
      if (!validation) {
        throw new Error('Invalid value');
      }
    }

    this.settings[index] = {
      ...setting,
      value,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    this.saveToStorage();
    this.loadConfig();
    return this.settings[index];
  }

  updateSettingByKey(key: string, value: any, updatedBy: string = 'current-user'): SystemSetting | null {
    const setting = this.getSettingByKey(key);
    if (!setting) {
      return null;
    }
    return this.updateSetting(setting.id, value, updatedBy);
  }

  resetSetting(id: string, updatedBy: string = 'current-user'): SystemSetting | null {
    const setting = this.getSettingById(id);
    if (!setting) {
      return null;
    }
    return this.updateSetting(id, setting.defaultValue, updatedBy);
  }

  resetAllSettings(updatedBy: string = 'current-user'): void {
    this.settings.forEach(setting => {
      this.updateSetting(setting.id, setting.defaultValue, updatedBy);
    });
  }

  getConfig(): SystemConfig {
    return { ...this.config };
  }

  getSettingGroups(): SettingGroup[] {
    const groups: SettingGroup[] = [
      {
        id: 'general',
        name: '基础设置',
        description: '系统基础配置',
        icon: 'Settings',
        category: SettingCategory.GENERAL,
        settings: this.getSettings(SettingCategory.GENERAL)
      },
      {
        id: 'security',
        name: '安全设置',
        description: '系统安全配置',
        icon: 'Shield',
        category: SettingCategory.SECURITY,
        settings: this.getSettings(SettingCategory.SECURITY)
      },
      {
        id: 'notification',
        name: '通知设置',
        description: '系统通知配置',
        icon: 'Bell',
        category: SettingCategory.NOTIFICATION,
        settings: this.getSettings(SettingCategory.NOTIFICATION)
      },
      {
        id: 'appearance',
        name: '外观设置',
        description: '系统外观配置',
        icon: 'Palette',
        category: SettingCategory.APPEARANCE,
        settings: this.getSettings(SettingCategory.APPEARANCE)
      },
      {
        id: 'network',
        name: '网络设置',
        description: '系统网络配置',
        icon: 'Network',
        category: SettingCategory.NETWORK,
        settings: this.getSettings(SettingCategory.NETWORK)
      },
      {
        id: 'storage',
        name: '存储设置',
        description: '系统存储配置',
        icon: 'HardDrive',
        category: SettingCategory.STORAGE,
        settings: this.getSettings(SettingCategory.STORAGE)
      },
      {
        id: 'performance',
        name: '性能设置',
        description: '系统性能配置',
        icon: 'Zap',
        category: SettingCategory.PERFORMANCE,
        settings: this.getSettings(SettingCategory.PERFORMANCE)
      },
      {
        id: 'logging',
        name: '日志设置',
        description: '系统日志配置',
        icon: 'FileText',
        category: SettingCategory.LOGGING,
        settings: this.getSettings(SettingCategory.LOGGING)
      },
      {
        id: 'backup',
        name: '备份设置',
        description: '系统备份配置',
        icon: 'Database',
        category: SettingCategory.BACKUP,
        settings: this.getSettings(SettingCategory.BACKUP)
      },
      {
        id: 'api',
        name: 'API设置',
        description: '系统API配置',
        icon: 'Code',
        category: SettingCategory.API,
        settings: this.getSettings(SettingCategory.API)
      }
    ];

    return groups;
  }

  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(settingsJson: string): void {
    try {
      const settings = JSON.parse(settingsJson);
      this.settings = settings;
      this.saveToStorage();
      this.loadConfig();
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  }
}

export const settingsService = new SettingsService();
