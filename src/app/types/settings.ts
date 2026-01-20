export enum SettingCategory {
  GENERAL = 'GENERAL',
  SECURITY = 'SECURITY',
  NOTIFICATION = 'NOTIFICATION',
  APPEARANCE = 'APPEARANCE',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  PERFORMANCE = 'PERFORMANCE',
  LOGGING = 'LOGGING',
  BACKUP = 'BACKUP',
  API = 'API'
}

export enum SettingType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  PASSWORD = 'PASSWORD',
  JSON = 'JSON'
}

export interface SettingOption {
  label: string;
  value: string | number | boolean;
}

export interface SystemSetting {
  id: string;
  key: string;
  label: string;
  description: string;
  category: SettingCategory;
  type: SettingType;
  value: any;
  defaultValue: any;
  options?: SettingOption[];
  min?: number;
  max?: number;
  step?: number;
  required: boolean;
  sensitive: boolean;
  validation?: (value: any) => boolean | string;
  updatedAt: string;
  updatedBy: string;
}

export interface SettingGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SettingCategory;
  settings: SystemSetting[];
}

export interface SystemConfig {
  general: {
    systemName: string;
    systemDescription: string;
    timezone: string;
    language: string;
    dateFormat: string;
    timeFormat: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    twoFactorAuth: boolean;
    ipWhitelist: string[];
  };
  notification: {
    emailEnabled: boolean;
    emailSmtpHost: string;
    emailSmtpPort: number;
    emailSmtpUsername: string;
    emailSmtpPassword: string;
    emailFromAddress: string;
    webhookEnabled: boolean;
    webhookUrl: string;
    slackEnabled: boolean;
    slackWebhookUrl: string;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    fontSize: 'small' | 'medium' | 'large';
    density: 'comfortable' | 'compact';
    animations: boolean;
  };
  network: {
    httpPort: number;
    httpsPort: number;
    maxConnections: number;
    timeout: number;
    proxyEnabled: boolean;
    proxyHost: string;
    proxyPort: number;
  };
  storage: {
    dataPath: string;
    logPath: string;
    backupPath: string;
    tempPath: string;
    maxStorageSize: number;
    cleanupEnabled: boolean;
    cleanupDays: number;
  };
  performance: {
    maxWorkers: number;
    cacheEnabled: boolean;
    cacheSize: number;
    cacheTtl: number;
    compressionEnabled: boolean;
    compressionLevel: number;
  };
  logging: {
    logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    logToFile: boolean;
    logToDatabase: boolean;
    maxLogSize: number;
    logRetentionDays: number;
  };
  backup: {
    autoBackupEnabled: boolean;
    backupSchedule: string;
    backupRetentionDays: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
  };
  api: {
    apiEnabled: boolean;
    apiRateLimit: number;
    apiRateWindow: number;
    corsEnabled: boolean;
    corsOrigins: string[];
    apiKeyRequired: boolean;
  };
}
