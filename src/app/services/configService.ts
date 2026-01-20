import { z } from 'zod';
import { logService } from './logService';
import { LogCategory, LogLevel } from '../types/logs';

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

export interface ConfigValue {
  value: string;
  isSecret: boolean;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'url';
}

export interface ConfigCategory {
  name: string;
  description: string;
  configs: Record<string, ConfigValue>;
}

export interface ConfigDiff {
  key: string;
  env1Value: string;
  env2Value: string;
  isDifferent: boolean;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: Array<{
    key: string;
    message: string;
  }>;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private currentEnvironment: Environment;
  private configs: Map<Environment, Record<string, string>>;

  private constructor() {
    this.currentEnvironment = this.detectEnvironment();
    this.configs = new Map();
    this.loadConfigs();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private detectEnvironment(): Environment {
    const nodeEnv = (import.meta.env?.NODE_ENV || process.env.NODE_ENV) || 'development';
    if (Object.values(Environment).includes(nodeEnv as Environment)) {
      return nodeEnv as Environment;
    }
    return Environment.DEVELOPMENT;
  }

  private loadConfigs(): void {
    const env = import.meta.env || { ...process.env };
    const config: Record<string, string> = {};

    Object.keys(env).forEach(key => {
      if (key.startsWith('VITE_')) {
        config[key] = env[key];
      }
    });

    this.configs.set(this.currentEnvironment, config);
  }

  public getEnvironment(): Environment {
    return this.currentEnvironment;
  }

  public setEnvironment(env: Environment): void {
    const previousEnv = this.currentEnvironment;
    this.currentEnvironment = env;
    this.loadConfigs();
    
    // Log environment change
    logService.addLog({
      category: LogCategory.SYSTEM,
      level: LogLevel.INFO,
      message: `环境切换成功`,
      details: {
        from: previousEnv,
        to: env
      },
      userId: 'system'
    });
  }

  public get(key: string, defaultValue?: string): string | undefined {
    const envConfig = this.configs.get(this.currentEnvironment);
    return envConfig?.[key] || defaultValue;
  }

  public getNumber(key: string, defaultValue?: number): number | undefined {
    const value = this.get(key);
    if (value === undefined) {
      return defaultValue;
    }
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  public getBoolean(key: string, defaultValue?: boolean): boolean | undefined {
    const value = this.get(key);
    if (value === undefined) {
      return defaultValue;
    }
    return value === 'true' || value === '1';
  }

  public getAll(): Record<string, string> {
    return this.configs.get(this.currentEnvironment) || {};
  }

  public set(key: string, value: string): void {
    const envConfig = this.configs.get(this.currentEnvironment);
    if (envConfig) {
      const oldValue = envConfig[key];
      envConfig[key] = value;
      
      // Log configuration change
      logService.addLog({
        category: LogCategory.SYSTEM,
        level: LogLevel.INFO,
        message: `Configuration changed: ${key}`,
        details: {
          key,
          oldValue,
          newValue: value,
          environment: this.currentEnvironment
        },
        userId: 'system' // Could be user ID if authenticated
      });
    }
  }

  public validate(): ConfigValidationResult {
    const errors: Array<{ key: string; message: string }> = [];
    const config = this.getAll();

    const requiredConfigs = [
      'VITE_API_BASE_URL',
      'VITE_AUTH_JWT_SECRET',
      'VITE_APP_ENV'
    ];

    requiredConfigs.forEach(key => {
      if (!config[key]) {
        errors.push({
          key,
          message: `${key} 是必需的配置项`
        });
      }
    });

    if (config['VITE_API_BASE_URL']) {
      try {
        new URL(config['VITE_API_BASE_URL']);
      } catch {
        errors.push({
          key: 'VITE_API_BASE_URL',
          message: 'VITE_API_BASE_URL 必须是有效的URL'
        });
      }
    }

    if (config['VITE_AUTH_JWT_SECRET'] && config['VITE_AUTH_JWT_SECRET'].length < 32) {
      errors.push({
        key: 'VITE_AUTH_JWT_SECRET',
        message: 'VITE_AUTH_JWT_SECRET 长度必须至少为32个字符'
      });
    }

    const isValid = errors.length === 0;
    
    // Log validation result
    logService.addLog({
      category: LogCategory.SYSTEM,
      level: isValid ? LogLevel.SUCCESS : LogLevel.ERROR,
      message: isValid ? '配置验证通过' : '配置验证失败',
      details: {
        errors: isValid ? [] : errors.map(e => e.message),
        environment: this.currentEnvironment,
        totalConfigs: Object.keys(config).length
      },
      userId: 'system'
    });

    return {
      isValid,
      errors
    };
  }

  public export(): string {
    const config = this.getAll();
    let output = `# YYC³ NAS-ECS - ${this.currentEnvironment.toUpperCase()} 环境配置\n`;
    output += `# 导出时间: ${new Date().toISOString()}\n\n`;

    const categories = this.getConfigCategories();
    categories.forEach(category => {
      output += `# ${category.description}\n`;
      Object.keys(category.configs).forEach(key => {
        const configValue = category.configs[key];
        const value = config[key] || '';
        output += `${key}=${configValue.isSecret ? '***' : value}\n`;
      });
      output += '\n';
    });

    return output;
  }

  public import(envJson: string): boolean {
    try {
      const imported = JSON.parse(envJson);
      if (imported.environment && imported.configs) {
        this.configs.set(imported.environment, imported.configs);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public compare(env1: Environment, env2: Environment): ConfigDiff[] {
    const config1 = this.configs.get(env1) || {};
    const config2 = this.configs.get(env2) || {};
    const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);
    const diffs: ConfigDiff[] = [];

    allKeys.forEach(key => {
      const value1 = config1[key] || '';
      const value2 = config2[key] || '';
      diffs.push({
        key,
        env1Value: value1,
        env2Value: value2,
        isDifferent: value1 !== value2
      });
    });

    return diffs;
  }

  public getConfigCategories(): ConfigCategory[] {
    return [
      {
        name: '应用配置',
        description: '应用程序基础配置',
        configs: {
          NODE_ENV: {
            value: this.get('NODE_ENV') || 'development',
            isSecret: false,
            description: 'Node.js运行环境',
            required: true,
            type: 'string'
          },
          VITE_APP_ENV: {
            value: this.get('VITE_APP_ENV') || 'development',
            isSecret: false,
            description: '应用环境标识',
            required: true,
            type: 'string'
          }
        }
      },
      {
        name: 'API配置',
        description: 'API服务相关配置',
        configs: {
          VITE_API_BASE_URL: {
            value: this.get('VITE_API_BASE_URL') || '',
            isSecret: false,
            description: 'API基础URL',
            required: true,
            type: 'url'
          },
          VITE_API_TIMEOUT: {
            value: this.get('VITE_API_TIMEOUT') || '30000',
            isSecret: false,
            description: 'API请求超时时间（毫秒）',
            required: false,
            type: 'number'
          },
          VITE_API_RATE_LIMIT: {
            value: this.get('VITE_API_RATE_LIMIT') || '100',
            isSecret: false,
            description: 'API速率限制',
            required: false,
            type: 'number'
          }
        }
      },
      {
        name: '认证配置',
        description: '用户认证相关配置',
        configs: {
          VITE_AUTH_JWT_SECRET: {
            value: this.get('VITE_AUTH_JWT_SECRET') || '',
            isSecret: true,
            description: 'JWT密钥',
            required: true,
            type: 'string'
          },
          VITE_AUTH_TOKEN_STORAGE: {
            value: this.get('VITE_AUTH_TOKEN_STORAGE') || 'localStorage',
            isSecret: false,
            description: 'Token存储方式',
            required: false,
            type: 'string'
          },
          VITE_AUTH_REFRESH_TOKEN_ENABLED: {
            value: this.get('VITE_AUTH_REFRESH_TOKEN_ENABLED') || 'true',
            isSecret: false,
            description: '是否启用Token刷新',
            required: false,
            type: 'boolean'
          }
        }
      },
      {
        name: '功能开关',
        description: '功能模块开关配置',
        configs: {
          VITE_ENABLE_MOCK_DATA: {
            value: this.get('VITE_ENABLE_MOCK_DATA') || 'false',
            isSecret: false,
            description: '是否启用模拟数据',
            required: false,
            type: 'boolean'
          },
          VITE_ENABLE_DEBUG: {
            value: this.get('VITE_ENABLE_DEBUG') || 'false',
            isSecret: false,
            description: '是否启用调试模式',
            required: false,
            type: 'boolean'
          },
          VITE_ENABLE_PERFORMANCE_MONITORING: {
            value: this.get('VITE_ENABLE_PERFORMANCE_MONITORING') || 'true',
            isSecret: false,
            description: '是否启用性能监控',
            required: false,
            type: 'boolean'
          },
          VITE_ENABLE_ERROR_TRACKING: {
            value: this.get('VITE_ENABLE_ERROR_TRACKING') || 'true',
            isSecret: false,
            description: '是否启用错误跟踪',
            required: false,
            type: 'boolean'
          }
        }
      },
      {
        name: '日志配置',
        description: '日志记录相关配置',
        configs: {
          VITE_LOG_LEVEL: {
            value: this.get('VITE_LOG_LEVEL') || 'info',
            isSecret: false,
            description: '日志级别',
            required: false,
            type: 'string'
          },
          VITE_LOG_TO_CONSOLE: {
            value: this.get('VITE_LOG_TO_CONSOLE') || 'true',
            isSecret: false,
            description: '是否输出到控制台',
            required: false,
            type: 'boolean'
          },
          VITE_LOG_TO_SERVER: {
            value: this.get('VITE_LOG_TO_SERVER') || 'false',
            isSecret: false,
            description: '是否输出到服务器',
            required: false,
            type: 'boolean'
          }
        }
      },
      {
        name: '性能配置',
        description: '性能优化相关配置',
        configs: {
          VITE_CACHE_ENABLED: {
            value: this.get('VITE_CACHE_ENABLED') || 'true',
            isSecret: false,
            description: '是否启用缓存',
            required: false,
            type: 'boolean'
          },
          VITE_CACHE_TTL: {
            value: this.get('VITE_CACHE_TTL') || '300000',
            isSecret: false,
            description: '缓存过期时间（毫秒）',
            required: false,
            type: 'number'
          },
          VITE_DEBOUNCE_DELAY: {
            value: this.get('VITE_DEBOUNCE_DELAY') || '300',
            isSecret: false,
            description: '防抖延迟（毫秒）',
            required: false,
            type: 'number'
          }
        }
      },
      {
        name: 'UI配置',
        description: '用户界面相关配置',
        configs: {
          VITE_THEME: {
            value: this.get('VITE_THEME') || 'default',
            isSecret: false,
            description: '主题',
            required: false,
            type: 'string'
          },
          VITE_LANGUAGE: {
            value: this.get('VITE_LANGUAGE') || 'zh-CN',
            isSecret: false,
            description: '语言',
            required: false,
            type: 'string'
          },
          VITE_TIMEZONE: {
            value: this.get('VITE_TIMEZONE') || 'Asia/Shanghai',
            isSecret: false,
            description: '时区',
            required: false,
            type: 'string'
          }
        }
      }
    ];
  }

  public isDevelopment(): boolean {
    return this.currentEnvironment === Environment.DEVELOPMENT;
  }

  public isStaging(): boolean {
    return this.currentEnvironment === Environment.STAGING;
  }

  public isProduction(): boolean {
    return this.currentEnvironment === Environment.PRODUCTION;
  }
}

export const configManager = ConfigManager.getInstance();
