/**
 * @file 环境配置管理测试
 * @description 测试环境配置管理的核心功能
 * @module __tests__/config/env.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { envConfig } from './env';

describe('EnvironmentConfig', () => {
  const originalConsoleLog = console.log;

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    vi.restoreAllMocks();
  });

  describe('环境检测逻辑', () => {
    it('应该正确检测development环境', () => {
      const currentEnv = envConfig.getCurrentEnvironment();
      expect(currentEnv.name).toBe('development');
    });

    it('应该正确获取staging环境配置', () => {
      const stagingEnv = envConfig.getEnvironment('staging');
      expect(stagingEnv).toBeDefined();
      expect(stagingEnv?.name).toBe('staging');
      expect(stagingEnv?.apiBaseUrl).toContain('staging');
    });

    it('应该正确获取production环境配置', () => {
      const productionEnv = envConfig.getEnvironment('production');
      expect(productionEnv).toBeDefined();
      expect(productionEnv?.name).toBe('production');
      expect(productionEnv?.apiBaseUrl).toContain('api.0379.email');
    });

    it('应该优先使用VITE_APP_ENV而不是MODE', () => {
      const currentEnv = envConfig.getCurrentEnvironment();
      expect(currentEnv.name).toBeDefined();
      expect(['development', 'staging', 'production']).toContain(currentEnv.name);
    });
  });

  describe('配置加载', () => {
    it('应该加载所有环境配置', () => {
      const allEnvs = envConfig.getAllEnvironments();
      expect(allEnvs).toBeDefined();
      expect(allEnvs).toHaveProperty('development');
      expect(allEnvs).toHaveProperty('staging');
      expect(allEnvs).toHaveProperty('production');
    });

    it('development环境应该有正确的API基础URL', () => {
      const devEnv = envConfig.getEnvironment('development');
      expect(devEnv?.apiBaseUrl).toBe('http://localhost:6000');
    });

    it('staging环境应该有正确的API基础URL', () => {
      const stagingEnv = envConfig.getEnvironment('staging');
      expect(stagingEnv?.apiBaseUrl).toBe('https://staging-api.0379.email');
    });

    it('production环境应该有正确的API基础URL', () => {
      const prodEnv = envConfig.getEnvironment('production');
      expect(prodEnv?.apiBaseUrl).toBe('https://api.0379.email');
    });
  });

  describe('环境切换', () => {
    it('应该能够切换到staging环境', () => {
      const result = envConfig.setEnvironment('staging');
      expect(result).toBe(true);
      expect(envConfig.getCurrentEnvironment().name).toBe('staging');
    });

    it('应该能够切换到production环境', () => {
      envConfig.setEnvironment('staging');
      const result = envConfig.setEnvironment('production');
      expect(result).toBe(true);
      expect(envConfig.getCurrentEnvironment().name).toBe('production');
    });

    it('应该能够切换回development环境', () => {
      envConfig.setEnvironment('production');
      const result = envConfig.setEnvironment('development');
      expect(result).toBe(true);
      expect(envConfig.getCurrentEnvironment().name).toBe('development');
    });

    it('切换环境时应该输出日志', () => {
      envConfig.setEnvironment('staging');
      expect(console.log).toHaveBeenCalledWith('Environment switched to: staging');
    });

    it('切换到不存在的环境应该返回false', () => {
      const result = envConfig.setEnvironment('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('环境判断方法', () => {
    it('isDevelopment应该正确判断development环境', () => {
      envConfig.setEnvironment('development');
      expect(envConfig.isDevelopment()).toBe(true);
      expect(envConfig.isStaging()).toBe(false);
      expect(envConfig.isProduction()).toBe(false);
    });

    it('isStaging应该正确判断staging环境', () => {
      envConfig.setEnvironment('staging');
      expect(envConfig.isDevelopment()).toBe(false);
      expect(envConfig.isStaging()).toBe(true);
      expect(envConfig.isProduction()).toBe(false);
    });

    it('isProduction应该正确判断production环境', () => {
      envConfig.setEnvironment('production');
      expect(envConfig.isDevelopment()).toBe(false);
      expect(envConfig.isStaging()).toBe(false);
      expect(envConfig.isProduction()).toBe(true);
    });
  });

  describe('Mock数据配置', () => {
    it('development环境应该支持Mock数据', () => {
      envConfig.setEnvironment('development');
      const shouldMock = envConfig.shouldUseMockData();
      expect(typeof shouldMock).toBe('boolean');
    });

    it('staging环境应该支持Mock数据配置', () => {
      envConfig.setEnvironment('staging');
      const shouldMock = envConfig.shouldUseMockData();
      expect(typeof shouldMock).toBe('boolean');
    });

    it('production环境应该支持Mock数据配置', () => {
      envConfig.setEnvironment('production');
      const shouldMock = envConfig.shouldUseMockData();
      expect(typeof shouldMock).toBe('boolean');
    });
  });

  describe('调试配置', () => {
    it('应该能够获取调试状态', () => {
      const isDebugEnabled = envConfig.isDebugEnabled();
      expect(typeof isDebugEnabled).toBe('boolean');
    });

    it('应该能够获取日志级别', () => {
      const logLevel = envConfig.getLogLevel();
      expect(['debug', 'info', 'warn', 'error']).toContain(logLevel);
    });

    it('development环境应该有debug日志级别', () => {
      envConfig.setEnvironment('development');
      const logLevel = envConfig.getLogLevel();
      expect(logLevel).toBe('debug');
    });

    it('staging环境应该有info日志级别', () => {
      envConfig.setEnvironment('staging');
      const logLevel = envConfig.getLogLevel();
      expect(logLevel).toBe('info');
    });

    it('production环境应该有error日志级别', () => {
      envConfig.setEnvironment('production');
      const logLevel = envConfig.getLogLevel();
      expect(logLevel).toBe('error');
    });
  });

  describe('API服务URL配置', () => {
    it('应该正确配置邮件API URL', () => {
      const devEnv = envConfig.getEnvironment('development');
      expect(devEnv?.mailApiUrl).toBe('http://localhost:6003');
    });

    it('应该正确配置LLM API URL', () => {
      const devEnv = envConfig.getEnvironment('development');
      expect(devEnv?.llmApiUrl).toBe('http://localhost:6002');
    });

    it('应该正确配置Redis API URL', () => {
      const devEnv = envConfig.getEnvironment('development');
      expect(devEnv?.redisApiUrl).toBe('http://localhost:6004');
    });

    it('应该正确配置DDNS API URL', () => {
      const devEnv = envConfig.getEnvironment('development');
      expect(devEnv?.ddnsApiUrl).toBe('http://localhost:6007');
    });

    it('应该正确配置FRP API URL', () => {
      const devEnv = envConfig.getEnvironment('development');
      expect(devEnv?.frpApiUrl).toBe('http://localhost:6006');
    });

    it('应该正确配置FRP Admin URL', () => {
      const devEnv = envConfig.getEnvironment('development');
      expect(devEnv?.frpAdminUrl).toBe('http://localhost:6001');
    });

    it('应该正确配置NAS API URL', () => {
      const devEnv = envConfig.getEnvironment('development');
      expect(devEnv?.nasApiUrl).toBe('http://localhost:6004');
    });

    it('应该正确配置WebSocket URL', () => {
      const devEnv = envConfig.getEnvironment('development');
      expect(devEnv?.wsUrl).toBe('ws://localhost:6000');
    });
  });

  describe('边界情况处理', () => {
    it('应该处理空字符串的环境名称', () => {
      const result = envConfig.setEnvironment('');
      expect(result).toBe(false);
    });

    it('应该处理大小写敏感的环境名称', () => {
      const result = envConfig.setEnvironment('Development');
      expect(result).toBe(false);
    });

    it('应该处理多次环境切换', () => {
      envConfig.setEnvironment('staging');
      expect(envConfig.getCurrentEnvironment().name).toBe('staging');

      envConfig.setEnvironment('production');
      expect(envConfig.getCurrentEnvironment().name).toBe('production');

      envConfig.setEnvironment('development');
      expect(envConfig.getCurrentEnvironment().name).toBe('development');
    });

    it('应该处理获取不存在的环境配置', () => {
      const nonExistentEnv = envConfig.getEnvironment('nonexistent');
      expect(nonExistentEnv).toBeUndefined();
    });
  });
});
