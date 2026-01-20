/**
 * @file 环境配置管理模块
 * @description 管理多环境配置，提供统一的配置访问接口
 * @module config
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 */

interface Environment {
  name: string;
  apiBaseUrl: string;
  mailApiUrl: string;
  llmApiUrl: string;
  redisApiUrl: string;
  ddnsApiUrl: string;
  frpApiUrl: string;
  frpAdminUrl: string;
  nasApiUrl: string;
  wsUrl: string;
  enableMockData: boolean;
  enableDebug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

class EnvironmentConfig {
  private currentEnv: Environment;
  private environments: Record<string, Environment>;

  constructor() {
    this.environments = this.loadEnvironments();
    this.currentEnv = this.detectEnvironment();
  }

  private loadEnvironments(): Record<string, Environment> {
    return {
      development: {
        name: 'development',
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:6000',
        mailApiUrl: import.meta.env.VITE_MAIL_API_URL || 'http://localhost:6003',
        llmApiUrl: import.meta.env.VITE_LLM_API_URL || 'http://localhost:6002',
        redisApiUrl: import.meta.env.VITE_REDIS_API_URL || 'http://localhost:6004',
        ddnsApiUrl: import.meta.env.VITE_DDNS_API_URL || 'http://localhost:6007',
        frpApiUrl: import.meta.env.VITE_FRP_API_URL || 'http://localhost:6006',
        frpAdminUrl: import.meta.env.VITE_FRP_ADMIN_URL || 'http://localhost:6001',
        nasApiUrl: import.meta.env.VITE_NAS_API_URL || 'http://localhost:6004',
        wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:6000',
        enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
        enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
        logLevel: (import.meta.env.VITE_LOG_LEVEL as any) || 'debug',
      },
      staging: {
        name: 'staging',
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://staging-api.0379.email',
        mailApiUrl: import.meta.env.VITE_MAIL_API_URL || 'https://staging-mail.0379.email',
        llmApiUrl: import.meta.env.VITE_LLM_API_URL || 'https://staging-llm.0379.email',
        redisApiUrl: import.meta.env.VITE_REDIS_API_URL || 'https://staging-redis.0379.email',
        ddnsApiUrl: import.meta.env.VITE_DDNS_API_URL || 'https://staging-ddns.0379.email',
        frpApiUrl: import.meta.env.VITE_FRP_API_URL || 'https://staging-frp.0379.email',
        frpAdminUrl: import.meta.env.VITE_FRP_ADMIN_URL || 'https://staging-frp-admin.0379.email',
        nasApiUrl: import.meta.env.VITE_NAS_API_URL || 'https://staging-nas.0379.email',
        wsUrl: import.meta.env.VITE_WS_URL || 'wss://staging-api.0379.email',
        enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
        enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
        logLevel: (import.meta.env.VITE_LOG_LEVEL as any) || 'info',
      },
      production: {
        name: 'production',
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.0379.email',
        mailApiUrl: import.meta.env.VITE_MAIL_API_URL || 'https://mail.0379.email',
        llmApiUrl: import.meta.env.VITE_LLM_API_URL || 'https://llm.0379.email',
        redisApiUrl: import.meta.env.VITE_REDIS_API_URL || 'https://redis.0379.email',
        ddnsApiUrl: import.meta.env.VITE_DDNS_API_URL || 'https://ddns.0379.email',
        frpApiUrl: import.meta.env.VITE_FRP_API_URL || 'https://frp.0379.email',
        frpAdminUrl: import.meta.env.VITE_FRP_ADMIN_URL || 'https://frp-admin.0379.email',
        nasApiUrl: import.meta.env.VITE_NAS_API_URL || 'https://nas.0379.email',
        wsUrl: import.meta.env.VITE_WS_URL || 'wss://api.0379.email',
        enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
        enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
        logLevel: (import.meta.env.VITE_LOG_LEVEL as any) || 'error',
      },
    };
  }

  private detectEnvironment(): Environment {
    const envName = import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development';
    return this.environments[envName] || this.environments.development;
  }

  public getCurrentEnvironment(): Environment {
    return this.currentEnv;
  }

  public getEnvironment(name: string): Environment | undefined {
    return this.environments[name];
  }

  public setEnvironment(name: string): boolean {
    if (this.environments[name]) {
      this.currentEnv = this.environments[name];
      console.log(`Environment switched to: ${name}`);
      return true;
    }
    return false;
  }

  public getAllEnvironments(): Record<string, Environment> {
    return this.environments;
  }

  public isDevelopment(): boolean {
    return this.currentEnv.name === 'development';
  }

  public isStaging(): boolean {
    return this.currentEnv.name === 'staging';
  }

  public isProduction(): boolean {
    return this.currentEnv.name === 'production';
  }

  public shouldUseMockData(): boolean {
    return this.currentEnv.enableMockData;
  }

  public isDebugEnabled(): boolean {
    return this.currentEnv.enableDebug;
  }

  public getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
    return this.currentEnv.logLevel;
  }

  public reload(): void {
    this.environments = this.loadEnvironments();
    this.currentEnv = this.detectEnvironment();
  }
}

export const envConfig = new EnvironmentConfig();

export default envConfig;
