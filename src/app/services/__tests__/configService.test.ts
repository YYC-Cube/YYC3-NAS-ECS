import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager, Environment } from '../configService';
import { logService } from '../logService';
import { LogCategory, LogLevel } from '../../types/logs';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = ConfigManager.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('应该返回单例实例', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getEnvironment', () => {
    it('应该返回当前环境', () => {
      const env = configManager.getEnvironment();
      expect(Object.values(Environment)).toContain(env);
    });
  });

  describe('setEnvironment', () => {
    it('应该成功设置环境', () => {
      configManager.setEnvironment(Environment.PRODUCTION);
      expect(configManager.getEnvironment()).toBe(Environment.PRODUCTION);
    });

    it('应该成功切换到开发环境', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      expect(configManager.getEnvironment()).toBe(Environment.DEVELOPMENT);
    });

    it('应该成功切换到测试环境', () => {
      configManager.setEnvironment(Environment.STAGING);
      expect(configManager.getEnvironment()).toBe(Environment.STAGING);
    });
  });

  describe('get', () => {
    it('应该返回配置值', () => {
      const value = configManager.get('VITE_APP_ENV');
      expect(value).toBeDefined();
    });

    it('应该返回默认值当配置不存在时', () => {
      const value = configManager.get('NON_EXISTENT_KEY', 'default-value');
      expect(value).toBe('default-value');
    });

    it('应该返回undefined当配置不存在且没有默认值时', () => {
      const value = configManager.get('NON_EXISTENT_KEY');
      expect(value).toBeUndefined();
    });
  });

  describe('getNumber', () => {
    it('应该返回数字类型的配置值', () => {
      const value = configManager.getNumber('VITE_API_TIMEOUT');
      expect(typeof value).toBe('number');
    });

    it('应该返回默认数字值当配置不存在时', () => {
      const value = configManager.getNumber('NON_EXISTENT_KEY', 1000);
      expect(value).toBe(1000);
    });

    it('应该返回undefined当配置不是数字时', () => {
      const value = configManager.getNumber('VITE_API_BASE_URL');
      expect(value).toBeUndefined();
    });
  });

  describe('getBoolean', () => {
    it('应该返回布尔类型的配置值', () => {
      const value = configManager.getBoolean('VITE_ENABLE_DEBUG');
      expect(typeof value).toBe('boolean');
    });

    it('应该返回true当值为"true"时', () => {
      const value = configManager.getBoolean('VITE_ENABLE_DEBUG');
      expect(value).toBe(true);
    });

    it('应该返回false当值为"false"时', () => {
      configManager.set('VITE_TEST_CONFIG', 'false');
      const value = configManager.getBoolean('VITE_TEST_CONFIG');
      expect(value).toBe(false);
    });

    it('应该返回默认布尔值当配置不存在时', () => {
      const value = configManager.getBoolean('NON_EXISTENT_KEY', false);
      expect(value).toBe(false);
    });
  });

  describe('getAll', () => {
    it('应该返回所有配置', () => {
      const allConfigs = configManager.getAll();
      expect(Object.keys(allConfigs).length).toBeGreaterThan(0);
    });

    it('应该只返回VITE_开头的配置', () => {
      const allConfigs = configManager.getAll();
      Object.keys(allConfigs).forEach(key => {
        expect(key.startsWith('VITE_')).toBe(true);
      });
    });
  });

  describe('set', () => {
    it('应该成功设置配置值', () => {
      configManager.set('TEST_CONFIG', 'test-value');
      const value = configManager.get('TEST_CONFIG');
      expect(value).toBe('test-value');
    });
  });

  describe('validate', () => {
    it('应该验证配置并返回有效结果', () => {
      const result = configManager.validate();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
    });

    it('应该检测缺少必需配置项', () => {
      configManager.set('VITE_API_BASE_URL', '');
      const result = configManager.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该检测无效的URL格式', () => {
      configManager.set('VITE_API_BASE_URL', 'invalid-url');
      const result = configManager.validate();
      expect(result.isValid).toBe(false);
      const hasUrlError = result.errors.some(error => 
        error.key === 'VITE_API_BASE_URL' && error.message.includes('URL')
      );
      expect(hasUrlError).toBe(true);
    });

    it('应该检测过短的JWT密钥', () => {
      configManager.set('VITE_AUTH_JWT_SECRET', 'short');
      const result = configManager.validate();
      expect(result.isValid).toBe(false);
      const hasSecretError = result.errors.some(error => 
        error.key === 'VITE_AUTH_JWT_SECRET' && error.message.includes('32')
      );
      expect(hasSecretError).toBe(true);
    });
  });

  describe('export', () => {
    it('应该导出配置为字符串', () => {
      const exported = configManager.export();
      expect(typeof exported).toBe('string');
      expect(exported.length).toBeGreaterThan(0);
    });

    it('应该包含环境标识', () => {
      const exported = configManager.export();
      expect(exported).toContain('环境配置');
    });

    it('应该包含配置项', () => {
      const exported = configManager.export();
      expect(exported).toContain('VITE_API_BASE_URL');
    });

    it('应该隐藏敏感配置', () => {
      const exported = configManager.export();
      expect(exported).toContain('***');
    });
  });

  describe('import', () => {
    it('应该成功导入配置', () => {
      const importData = JSON.stringify({
        environment: Environment.DEVELOPMENT,
        configs: {
          'VITE_API_BASE_URL': 'http://localhost:6000',
          'VITE_API_TIMEOUT': '30000'
        }
      });

      const result = configManager.import(importData);
      expect(result).toBe(true);
    });

    it('应该返回false当导入数据无效时', () => {
      const result = configManager.import('invalid-json');
      expect(result).toBe(false);
    });

    it('应该返回false当导入数据格式不正确时', () => {
      const importData = JSON.stringify({
        invalid: 'data'
      });

      const result = configManager.import(importData);
      expect(result).toBe(false);
    });
  });

  describe('compare', () => {
    it('应该比较两个环境的配置', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.PRODUCTION);
      expect(Array.isArray(diffs)).toBe(true);
    });

    it('应该标记不同的配置项', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.PRODUCTION);
      const hasDiff = diffs.some(diff => diff.isDifferent);
      expect(hasDiff).toBe(true);
    });

    it('应该比较开发环境和测试环境的配置', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.STAGING);
      expect(Array.isArray(diffs)).toBe(true);
      expect(diffs.length).toBeGreaterThan(0);
    });

    it('应该包含所有配置键', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.PRODUCTION);
      expect(diffs.length).toBeGreaterThan(0);
      diffs.forEach(diff => {
        expect(diff).toHaveProperty('key');
        expect(diff).toHaveProperty('env1Value');
        expect(diff).toHaveProperty('env2Value');
        expect(diff).toHaveProperty('isDifferent');
      });
    });
  });

  describe('getConfigCategories', () => {
    it('应该返回配置分类', () => {
      const categories = configManager.getConfigCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('每个分类应该包含名称和描述', () => {
      const categories = configManager.getConfigCategories();
      categories.forEach(category => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('configs');
      });
    });

    it('应该包含应用配置分类', () => {
      const categories = configManager.getConfigCategories();
      const appConfig = categories.find(cat => cat.name === '应用配置');
      expect(appConfig).toBeDefined();
    });

    it('应该包含API配置分类', () => {
      const categories = configManager.getConfigCategories();
      const apiConfig = categories.find(cat => cat.name === 'API配置');
      expect(apiConfig).toBeDefined();
    });

    it('应该包含认证配置分类', () => {
      const categories = configManager.getConfigCategories();
      const authConfig = categories.find(cat => cat.name === '认证配置');
      expect(authConfig).toBeDefined();
    });

    it('应该包含功能开关分类', () => {
      const categories = configManager.getConfigCategories();
      const featureConfig = categories.find(cat => cat.name === '功能开关');
      expect(featureConfig).toBeDefined();
    });

    it('应该包含日志配置分类', () => {
      const categories = configManager.getConfigCategories();
      const logConfig = categories.find(cat => cat.name === '日志配置');
      expect(logConfig).toBeDefined();
    });

    it('应该包含性能配置分类', () => {
      const categories = configManager.getConfigCategories();
      const perfConfig = categories.find(cat => cat.name === '性能配置');
      expect(perfConfig).toBeDefined();
    });

    it('应该包含UI配置分类', () => {
      const categories = configManager.getConfigCategories();
      const uiConfig = categories.find(cat => cat.name === 'UI配置');
      expect(uiConfig).toBeDefined();
    });
  });

  describe('isDevelopment', () => {
    it('应该返回true在开发环境', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      expect(configManager.isDevelopment()).toBe(true);
    });

    it('应该返回false在非开发环境', () => {
      configManager.setEnvironment(Environment.PRODUCTION);
      expect(configManager.isDevelopment()).toBe(false);
    });
  });

  describe('isStaging', () => {
    it('应该返回true在测试环境', () => {
      configManager.setEnvironment(Environment.STAGING);
      expect(configManager.isStaging()).toBe(true);
    });

    it('应该返回false在非测试环境', () => {
      configManager.setEnvironment(Environment.PRODUCTION);
      expect(configManager.isStaging()).toBe(false);
    });
  });

  describe('isProduction', () => {
    it('应该返回true在生产环境', () => {
      configManager.setEnvironment(Environment.PRODUCTION);
      expect(configManager.isProduction()).toBe(true);
    });

    it('应该返回false在非生产环境', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      expect(configManager.isProduction()).toBe(false);
    });
  });

  describe('detectEnvironment', () => {
    it('应该正确检测开发环境', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      expect(configManager.getEnvironment()).toBe(Environment.DEVELOPMENT);
    });

    it('应该正确检测测试环境', () => {
      configManager.setEnvironment(Environment.STAGING);
      expect(configManager.getEnvironment()).toBe(Environment.STAGING);
    });

    it('应该正确检测生产环境', () => {
      configManager.setEnvironment(Environment.PRODUCTION);
      expect(configManager.getEnvironment()).toBe(Environment.PRODUCTION);
    });
  });

  describe('loadConfigs', () => {
    it('应该加载VITE_开头的配置', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      const allConfigs = configManager.getAll();
      Object.keys(allConfigs).forEach(key => {
        expect(key.startsWith('VITE_')).toBe(true);
      });
    });

    it('应该加载当前环境的配置', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      const devConfigs = configManager.getAll();
      expect(devConfigs).toBeDefined();
    });
  });

  describe('set', () => {
    it('应该成功设置配置值', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_CONFIG', 'test-value');
      const value = configManager.get('VITE_TEST_CONFIG');
      expect(value).toBe('test-value');
    });

    it('应该更新现有配置值', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_CONFIG', 'initial-value');
      configManager.set('VITE_TEST_CONFIG', 'updated-value');
      const value = configManager.get('VITE_TEST_CONFIG');
      expect(value).toBe('updated-value');
    });

    it('应该设置空字符串配置值', () => {
      configManager.set('VITE_TEST_EMPTY_CONFIG', '');
      const value = configManager.get('VITE_TEST_EMPTY_CONFIG', '');
      expect(value).toBe('');
    });

    it('应该设置特殊字符配置值', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      const specialValue = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      configManager.set('VITE_TEST_SPECIAL_CONFIG', specialValue);
      const value = configManager.get('VITE_TEST_SPECIAL_CONFIG');
      expect(value).toBe(specialValue);
    });
  });

  describe('getNumber', () => {
    it('应该返回数字类型的配置值', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      const value = configManager.getNumber('VITE_API_TIMEOUT');
      expect(typeof value).toBe('number');
    });

    it('应该返回默认数字值当配置不存在时', () => {
      const value = configManager.getNumber('NON_EXISTENT_KEY', 1000);
      expect(value).toBe(1000);
    });

    it('应该返回undefined当配置不是数字时', () => {
      const value = configManager.getNumber('VITE_API_BASE_URL');
      expect(value).toBeUndefined();
    });

    it('应该正确解析字符串数字', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_NUMBER_CONFIG', '12345');
      const value = configManager.getNumber('VITE_TEST_NUMBER_CONFIG');
      expect(value).toBe(12345);
    });

    it('应该正确解析浮点数字符串', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_FLOAT_CONFIG', '123.45');
      const value = configManager.getNumber('VITE_TEST_FLOAT_CONFIG');
      expect(value).toBe(123.45);
    });

    it('应该返回undefined当配置为NaN时', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_NAN_CONFIG', 'not-a-number');
      const value = configManager.getNumber('VITE_TEST_NAN_CONFIG', 0);
      expect(value).toBe(0);
    });
  });

  describe('getBoolean', () => {
    it('应该返回布尔类型的配置值', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      const value = configManager.getBoolean('VITE_ENABLE_DEBUG');
      expect(typeof value).toBe('boolean');
    });

    it('应该返回true当值为"true"时', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_BOOLEAN_CONFIG', 'true');
      const value = configManager.getBoolean('VITE_TEST_BOOLEAN_CONFIG');
      expect(value).toBe(true);
    });

    it('应该返回false当值为"false"时', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_BOOLEAN_CONFIG', 'false');
      const value = configManager.getBoolean('VITE_TEST_BOOLEAN_CONFIG');
      expect(value).toBe(false);
    });

    it('应该返回true当值为"1"时', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_BOOLEAN_CONFIG', '1');
      const value = configManager.getBoolean('VITE_TEST_BOOLEAN_CONFIG');
      expect(value).toBe(true);
    });

    it('应该返回false当值为"0"时', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_BOOLEAN_CONFIG', '0');
      const value = configManager.getBoolean('VITE_TEST_BOOLEAN_CONFIG');
      expect(value).toBe(false);
    });

    it('应该返回默认布尔值当配置不存在时', () => {
      const value = configManager.getBoolean('NON_EXISTENT_KEY', false);
      expect(value).toBe(false);
    });

    it('应该返回默认布尔值true', () => {
      const value = configManager.getBoolean('NON_EXISTENT_KEY', true);
      expect(value).toBe(true);
    });
  });

  describe('validate', () => {
    it('应该验证配置并返回有效结果', () => {
      configManager.set('VITE_API_BASE_URL', 'http://localhost:6000');
      configManager.set('VITE_AUTH_JWT_SECRET', 'a'.repeat(32));
      configManager.set('VITE_APP_ENV', 'development');
      const result = configManager.validate();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
    });

    it('应该检测缺少必需配置项', () => {
      configManager.set('VITE_API_BASE_URL', '');
      const result = configManager.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该检测无效的URL格式', () => {
      configManager.set('VITE_API_BASE_URL', 'invalid-url');
      const result = configManager.validate();
      expect(result.isValid).toBe(false);
      const hasUrlError = result.errors.some(error => 
        error.key === 'VITE_API_BASE_URL' && error.message.includes('URL')
      );
      expect(hasUrlError).toBe(true);
    });

    it('应该检测过短的JWT密钥', () => {
      configManager.set('VITE_AUTH_JWT_SECRET', 'short');
      const result = configManager.validate();
      expect(result.isValid).toBe(false);
      const hasSecretError = result.errors.some(error => 
        error.key === 'VITE_AUTH_JWT_SECRET' && error.message.includes('32')
      );
      expect(hasSecretError).toBe(true);
    });

    it('应该通过验证当所有必需配置都存在且有效时', () => {
      configManager.set('VITE_API_BASE_URL', 'http://localhost:6000');
      configManager.set('VITE_AUTH_JWT_SECRET', 'a'.repeat(32));
      configManager.set('VITE_APP_ENV', 'development');
      const result = configManager.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('应该检测多个配置错误', () => {
      configManager.set('VITE_API_BASE_URL', 'invalid-url');
      configManager.set('VITE_AUTH_JWT_SECRET', 'short');
      const result = configManager.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('export', () => {
    it('应该导出配置为字符串', () => {
      const exported = configManager.export();
      expect(typeof exported).toBe('string');
      expect(exported.length).toBeGreaterThan(0);
    });

    it('应该包含环境标识', () => {
      const exported = configManager.export();
      expect(exported).toContain('环境配置');
    });

    it('应该包含配置项', () => {
      const exported = configManager.export();
      expect(exported).toContain('VITE_API_BASE_URL');
    });

    it('应该隐藏敏感配置', () => {
      const exported = configManager.export();
      expect(exported).toContain('***');
    });

    it('应该包含导出时间', () => {
      const exported = configManager.export();
      expect(exported).toContain('导出时间');
    });

    it('应该包含当前环境名称', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      const exported = configManager.export();
      expect(exported).toContain('DEVELOPMENT');
    });

    it('应该包含配置分类描述', () => {
      const exported = configManager.export();
      expect(exported).toContain('应用程序基础配置');
      expect(exported).toContain('API服务相关配置');
    });
  });

  describe('import', () => {
    it('应该成功导入配置', () => {
      const importData = JSON.stringify({
        environment: Environment.DEVELOPMENT,
        configs: {
          'VITE_API_BASE_URL': 'http://localhost:6000',
          'VITE_API_TIMEOUT': '30000'
        }
      });

      const result = configManager.import(importData);
      expect(result).toBe(true);
    });

    it('应该返回false当导入数据无效时', () => {
      const result = configManager.import('invalid-json');
      expect(result).toBe(false);
    });

    it('应该返回false当导入数据格式不正确时', () => {
      const importData = JSON.stringify({
        invalid: 'data'
      });

      const result = configManager.import(importData);
      expect(result).toBe(false);
    });

    it('应该成功导入生产环境配置', () => {
      const importData = JSON.stringify({
        environment: Environment.PRODUCTION,
        configs: {
          'VITE_API_BASE_URL': 'https://api.example.com',
          'VITE_API_TIMEOUT': '60000'
        }
      });

      const result = configManager.import(importData);
      expect(result).toBe(true);
    });

    it('应该成功导入测试环境配置', () => {
      const importData = JSON.stringify({
        environment: Environment.STAGING,
        configs: {
          'VITE_API_BASE_URL': 'https://staging-api.example.com',
          'VITE_API_TIMEOUT': '45000'
        }
      });

      const result = configManager.import(importData);
      expect(result).toBe(true);
    });

    it('应该导入包含多个配置项的数据', () => {
      const importData = JSON.stringify({
        environment: Environment.DEVELOPMENT,
        configs: {
          'VITE_API_BASE_URL': 'http://localhost:6000',
          'VITE_API_TIMEOUT': '30000',
          'VITE_ENABLE_DEBUG': 'true',
          'VITE_LOG_LEVEL': 'debug'
        }
      });

      const result = configManager.import(importData);
      expect(result).toBe(true);
    });
  });

  describe('compare', () => {
    it('应该比较两个环境的配置', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.PRODUCTION);
      expect(Array.isArray(diffs)).toBe(true);
    });

    it('应该标记不同的配置项', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.PRODUCTION);
      const hasDiff = diffs.some(diff => diff.isDifferent);
      expect(hasDiff).toBe(true);
    });

    it('应该标记相同的配置项', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.DEVELOPMENT);
      const allSame = diffs.every(diff => !diff.isDifferent);
      expect(allSame).toBe(true);
    });

    it('应该包含所有配置键', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.PRODUCTION);
      expect(diffs.length).toBeGreaterThan(0);
      diffs.forEach(diff => {
        expect(diff).toHaveProperty('key');
        expect(diff).toHaveProperty('env1Value');
        expect(diff).toHaveProperty('env2Value');
        expect(diff).toHaveProperty('isDifferent');
      });
    });

    it('应该比较开发环境和测试环境', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.STAGING);
      expect(Array.isArray(diffs)).toBe(true);
      expect(diffs.length).toBeGreaterThan(0);
    });

    it('应该比较测试环境和生产环境', () => {
      const diffs = configManager.compare(Environment.STAGING, Environment.PRODUCTION);
      expect(Array.isArray(diffs)).toBe(true);
      expect(diffs.length).toBeGreaterThan(0);
    });
  });

  describe('getConfigCategories', () => {
    it('应该返回配置分类', () => {
      const categories = configManager.getConfigCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('每个分类应该包含名称和描述', () => {
      const categories = configManager.getConfigCategories();
      categories.forEach(category => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('configs');
      });
    });

    it('应该包含应用配置分类', () => {
      const categories = configManager.getConfigCategories();
      const appConfig = categories.find(cat => cat.name === '应用配置');
      expect(appConfig).toBeDefined();
    });

    it('应该包含API配置分类', () => {
      const categories = configManager.getConfigCategories();
      const apiConfig = categories.find(cat => cat.name === 'API配置');
      expect(apiConfig).toBeDefined();
    });

    it('应该包含认证配置分类', () => {
      const categories = configManager.getConfigCategories();
      const authConfig = categories.find(cat => cat.name === '认证配置');
      expect(authConfig).toBeDefined();
    });

    it('应该包含功能开关分类', () => {
      const categories = configManager.getConfigCategories();
      const featureConfig = categories.find(cat => cat.name === '功能开关');
      expect(featureConfig).toBeDefined();
    });

    it('应该包含日志配置分类', () => {
      const categories = configManager.getConfigCategories();
      const logConfig = categories.find(cat => cat.name === '日志配置');
      expect(logConfig).toBeDefined();
    });

    it('应该包含性能配置分类', () => {
      const categories = configManager.getConfigCategories();
      const perfConfig = categories.find(cat => cat.name === '性能配置');
      expect(perfConfig).toBeDefined();
    });

    it('应该包含UI配置分类', () => {
      const categories = configManager.getConfigCategories();
      const uiConfig = categories.find(cat => cat.name === 'UI配置');
      expect(uiConfig).toBeDefined();
    });

    it('每个配置项应该包含所有必需属性', () => {
      const categories = configManager.getConfigCategories();
      categories.forEach(category => {
        Object.values(category.configs).forEach(config => {
          expect(config).toHaveProperty('value');
          expect(config).toHaveProperty('isSecret');
          expect(config).toHaveProperty('description');
          expect(config).toHaveProperty('required');
          expect(config).toHaveProperty('type');
        });
      });
    });

    it('配置项类型应该有效', () => {
      const categories = configManager.getConfigCategories();
      const validTypes = ['string', 'number', 'boolean', 'url'];
      categories.forEach(category => {
        Object.values(category.configs).forEach(config => {
          expect(validTypes).toContain(config.type);
        });
      });
    });
  });

  describe('环境检测', () => {
    it('应该正确处理无效环境值', () => {
      const env = configManager.getEnvironment();
      expect(Object.values(Environment)).toContain(env);
    });
  });

  describe('配置值类型处理', () => {
    it('应该正确处理字符串类型配置', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_STRING_CONFIG', 'test-string');
      const value = configManager.get('VITE_TEST_STRING_CONFIG');
      expect(typeof value).toBe('string');
      expect(value).toBe('test-string');
    });

    it('应该正确处理数字字符串配置', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_NUMBER_STRING_CONFIG', '12345');
      const value = configManager.get('VITE_TEST_NUMBER_STRING_CONFIG');
      expect(value).toBe('12345');
    });

    it('应该正确处理布尔字符串配置', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_BOOLEAN_STRING_CONFIG', 'true');
      const value = configManager.get('VITE_TEST_BOOLEAN_STRING_CONFIG');
      expect(value).toBe('true');
    });
  });

  describe('配置边界情况', () => {
    it('应该处理空键名', () => {
      const value = configManager.get('', 'default');
      expect(value).toBe('default');
    });

    it('应该处理undefined键名', () => {
      const value = configManager.get(undefined as any, 'default');
      expect(value).toBe('default');
    });

    it('应该处理null键名', () => {
      const value = configManager.get(null as any, 'default');
      expect(value).toBe('default');
    });

    it('应该处理空值', () => {
      configManager.set('VITE_TEST_EMPTY_VALUE', '');
      const value = configManager.get('VITE_TEST_EMPTY_VALUE', '');
      expect(value).toBe('');
    });

    it('应该处理undefined值', () => {
      const value = configManager.get('NON_EXISTENT_KEY');
      expect(value).toBeUndefined();
    });
  });

  describe('import导出功能', () => {
    it('应该成功导入有效的JSON配置', () => {
      const importData = JSON.stringify({
        environment: Environment.DEVELOPMENT,
        configs: {
          'VITE_API_BASE_URL': 'http://localhost:6000',
          'VITE_API_TIMEOUT': '30000'
        }
      });

      const result = configManager.import(importData);
      expect(result).toBe(true);
    });

    it('应该拒绝无效的JSON', () => {
      const result = configManager.import('invalid-json');
      expect(result).toBe(false);
    });

    it('应该拒绝缺少必需字段的JSON', () => {
      const invalidData = JSON.stringify({
        environment: Environment.DEVELOPMENT
      });

      const result = configManager.import(invalidData);
      expect(result).toBe(false);
    });

    it('应该拒绝格式错误的JSON', () => {
      const invalidData = JSON.stringify({
        configs: {}
      });

      const result = configManager.import(invalidData);
      expect(result).toBe(false);
    });

    it('导入后应该能够获取导入的配置', () => {
      const importData = JSON.stringify({
        environment: Environment.DEVELOPMENT,
        configs: {
          'VITE_TEST_IMPORTED_CONFIG': 'imported-value'
        }
      });

      configManager.import(importData);
      const value = configManager.get('VITE_TEST_IMPORTED_CONFIG');
      expect(value).toBe('imported-value');
    });
  });

  describe('export导出功能', () => {
    it('应该导出有效的配置字符串', () => {
      const exported = configManager.export();
      expect(typeof exported).toBe('string');
      expect(exported.length).toBeGreaterThan(0);
    });

    it('导出应该包含环境标识', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      const exported = configManager.export();
      expect(exported).toContain('DEVELOPMENT');
    });

    it('导出应该包含时间戳', () => {
      const exported = configManager.export();
      expect(exported).toContain('导出时间');
    });

    it('导出应该包含配置项', () => {
      const exported = configManager.export();
      expect(exported).toContain('VITE_');
    });

    it('导出应该包含多个配置分类', () => {
      const exported = configManager.export();
      expect(exported).toContain('#');
      const sections = exported.split('#');
      expect(sections.length).toBeGreaterThan(5);
    });
  });

  describe('compare比较功能', () => {
    it('应该比较两个环境的配置', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.PRODUCTION);
      expect(Array.isArray(diffs)).toBe(true);
      expect(diffs.length).toBeGreaterThan(0);
    });

    it('应该标记不同的配置项', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.PRODUCTION);
      const hasDiff = diffs.some(diff => diff.isDifferent);
      expect(hasDiff).toBe(true);
    });

    it('应该包含所有配置键', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.PRODUCTION);
      const keys = diffs.map(diff => diff.key);
      expect(keys.length).toBeGreaterThan(0);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('每个差异应该包含所有必需属性', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.PRODUCTION);
      diffs.forEach(diff => {
        expect(diff).toHaveProperty('key');
        expect(diff).toHaveProperty('env1Value');
        expect(diff).toHaveProperty('env2Value');
        expect(diff).toHaveProperty('isDifferent');
      });
    });

    it('应该正确处理相同环境的比较', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.DEVELOPMENT);
      diffs.forEach(diff => {
        expect(diff.isDifferent).toBe(false);
        expect(diff.env1Value).toBe(diff.env2Value);
      });
    });
  });

  describe('环境切换', () => {
    it('切换环境后应该加载新环境配置', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      const devEnv = configManager.getEnvironment();

      configManager.setEnvironment(Environment.PRODUCTION);
      const prodEnv = configManager.getEnvironment();

      expect(devEnv).toBe(Environment.DEVELOPMENT);
      expect(prodEnv).toBe(Environment.PRODUCTION);
      expect(devEnv).not.toBe(prodEnv);
    });

    it('切换环境后应该记录日志', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.setEnvironment(Environment.PRODUCTION);

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM,
        service: 'config'
      });

      const envChangeLogs = logs.filter(log => 
        log.message.includes('环境切换成功')
      );
      expect(envChangeLogs.length).toBeGreaterThan(0);
    });

    it('应该支持多次环境切换', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      expect(configManager.isDevelopment()).toBe(true);

      configManager.setEnvironment(Environment.STAGING);
      expect(configManager.isStaging()).toBe(true);

      configManager.setEnvironment(Environment.PRODUCTION);
      expect(configManager.isProduction()).toBe(true);

      configManager.setEnvironment(Environment.DEVELOPMENT);
      expect(configManager.isDevelopment()).toBe(true);
    });
  });

  describe('配置更新', () => {
    it('更新配置后应该记录日志', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_CONFIG', 'initial-value');
      configManager.set('VITE_TEST_CONFIG', 'updated-value');

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM,
        service: 'config'
      });

      const updateLogs = logs.filter(log => 
        log.message.includes('Configuration changed')
      );
      expect(updateLogs.length).toBeGreaterThan(0);
    });

    it('应该正确记录配置变更详情', () => {
      configManager.setEnvironment(Environment.DEVELOPMENT);
      configManager.set('VITE_TEST_CONFIG', 'initial-value');
      configManager.set('VITE_TEST_CONFIG', 'updated-value');

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM,
        service: 'config'
      });

      const updateLogs = logs.filter(log => 
        log.message.includes('Configuration changed: VITE_TEST_CONFIG')
      );
      expect(updateLogs.length).toBeGreaterThan(0);
      
      const updateLog = updateLogs[updateLogs.length - 1];
      expect(updateLog).toBeDefined();
      expect(updateLog?.details).toHaveProperty('key', 'VITE_TEST_CONFIG');
    });
  });

  describe('配置验证', () => {
    it('验证通过时应该记录INFO日志', () => {
      configManager.set('VITE_API_BASE_URL', 'http://localhost:6000');
      configManager.set('VITE_AUTH_JWT_SECRET', 'a'.repeat(32));
      configManager.set('VITE_APP_ENV', 'development');

      configManager.validate();

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM,
        level: LogLevel.INFO,
        service: 'config'
      });

      const validationLogs = logs.filter(log => 
        log.message.includes('配置验证通过')
      );
      expect(validationLogs.length).toBeGreaterThan(0);
    });

    it('验证失败时应该记录ERROR日志', () => {
      configManager.set('VITE_API_BASE_URL', 'invalid-url');
      configManager.set('VITE_AUTH_JWT_SECRET', 'short');

      configManager.validate();

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM,
        level: LogLevel.ERROR,
        service: 'config'
      });

      const validationLogs = logs.filter(log => 
        log.message.includes('配置验证失败')
      );
      expect(validationLogs.length).toBeGreaterThan(0);
    });

    it('应该记录验证错误的详细信息', () => {
      configManager.set('VITE_API_BASE_URL', 'invalid-url');

      configManager.validate();

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM,
        service: 'config'
      });

      const validationLog = logs.find(log => 
        log.message.includes('配置验证失败')
      );
      expect(validationLog).toBeDefined();
      expect(validationLog?.details).toHaveProperty('errors');
      expect(Array.isArray(validationLog?.details?.errors)).toBe(true);
    });
  });

  describe('性能测试', () => {
    it('应该快速获取配置值', () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        configManager.get('VITE_API_BASE_URL');
      }
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('应该快速设置配置值', () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        configManager.set(`VITE_TEST_CONFIG_${i}`, `value-${i}`);
      }
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it('应该快速验证配置', () => {
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        configManager.validate();
      }
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('应该快速导出配置', () => {
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        configManager.export();
      }
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('并发测试', () => {
    it('应该正确处理并发读取', async () => {
      const promises = Array.from({ length: 100 }, () => 
        Promise.resolve(configManager.get('VITE_API_BASE_URL'))
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(100);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('应该正确处理并发写入', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve(configManager.set(`VITE_TEST_CONFIG_${i}`, `value-${i}`))
      );

      await Promise.all(promises);

      for (let i = 0; i < 100; i++) {
        const value = configManager.get(`VITE_TEST_CONFIG_${i}`);
        expect(value).toBe(`value-${i}`);
      }
    });

    it('应该正确处理并发混合操作', async () => {
      const promises = [];

      for (let i = 0; i < 50; i++) {
        promises.push(Promise.resolve(configManager.set(`VITE_TEST_CONFIG_${i}`, `value-${i}`)));
      }

      for (let i = 0; i < 50; i++) {
        promises.push(Promise.resolve(configManager.get('VITE_API_BASE_URL')));
      }

      await Promise.all(promises);
      expect(promises.length).toBe(100);
    });
  });

  describe('配置分类详细测试', () => {
    it('应用配置应该包含所有必需字段', () => {
      const categories = configManager.getConfigCategories();
      const appConfig = categories.find(cat => cat.name === '应用配置');
      
      expect(appConfig).toBeDefined();
      expect(appConfig?.configs).toHaveProperty('NODE_ENV');
      expect(appConfig?.configs).toHaveProperty('VITE_APP_ENV');
      
      Object.values(appConfig?.configs || {}).forEach(config => {
        expect(config).toHaveProperty('value');
        expect(config).toHaveProperty('isSecret');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('required');
        expect(config).toHaveProperty('type');
      });
    });

    it('API配置应该包含所有必需字段', () => {
      const categories = configManager.getConfigCategories();
      const apiConfig = categories.find(cat => cat.name === 'API配置');
      
      expect(apiConfig).toBeDefined();
      expect(apiConfig?.configs).toHaveProperty('VITE_API_BASE_URL');
      expect(apiConfig?.configs).toHaveProperty('VITE_API_TIMEOUT');
      expect(apiConfig?.configs).toHaveProperty('VITE_API_RATE_LIMIT');
    });

    it('认证配置应该包含所有必需字段', () => {
      const categories = configManager.getConfigCategories();
      const authConfig = categories.find(cat => cat.name === '认证配置');
      
      expect(authConfig).toBeDefined();
      expect(authConfig?.configs).toHaveProperty('VITE_AUTH_JWT_SECRET');
      expect(authConfig?.configs).toHaveProperty('VITE_AUTH_TOKEN_STORAGE');
      expect(authConfig?.configs).toHaveProperty('VITE_AUTH_REFRESH_TOKEN_ENABLED');
    });

    it('功能开关配置应该包含所有必需字段', () => {
      const categories = configManager.getConfigCategories();
      const featureConfig = categories.find(cat => cat.name === '功能开关');
      
      expect(featureConfig).toBeDefined();
      expect(featureConfig?.configs).toHaveProperty('VITE_ENABLE_MOCK_DATA');
      expect(featureConfig?.configs).toHaveProperty('VITE_ENABLE_DEBUG');
      expect(featureConfig?.configs).toHaveProperty('VITE_ENABLE_PERFORMANCE_MONITORING');
      expect(featureConfig?.configs).toHaveProperty('VITE_ENABLE_ERROR_TRACKING');
    });

    it('日志配置应该包含所有必需字段', () => {
      const categories = configManager.getConfigCategories();
      const logConfig = categories.find(cat => cat.name === '日志配置');
      
      expect(logConfig).toBeDefined();
      expect(logConfig?.configs).toHaveProperty('VITE_LOG_LEVEL');
      expect(logConfig?.configs).toHaveProperty('VITE_LOG_TO_CONSOLE');
      expect(logConfig?.configs).toHaveProperty('VITE_LOG_TO_SERVER');
    });

    it('性能配置应该包含所有必需字段', () => {
      const categories = configManager.getConfigCategories();
      const perfConfig = categories.find(cat => cat.name === '性能配置');
      
      expect(perfConfig).toBeDefined();
      expect(perfConfig?.configs).toHaveProperty('VITE_CACHE_ENABLED');
      expect(perfConfig?.configs).toHaveProperty('VITE_CACHE_TTL');
      expect(perfConfig?.configs).toHaveProperty('VITE_DEBOUNCE_DELAY');
    });

    it('UI配置应该包含所有必需字段', () => {
      const categories = configManager.getConfigCategories();
      const uiConfig = categories.find(cat => cat.name === 'UI配置');
      
      expect(uiConfig).toBeDefined();
      expect(uiConfig?.configs).toHaveProperty('VITE_THEME');
      expect(uiConfig?.configs).toHaveProperty('VITE_LANGUAGE');
      expect(uiConfig?.configs).toHaveProperty('VITE_TIMEZONE');
    });
  });

  describe('特殊字符和边界值测试', () => {
    it('应该处理包含特殊字符的配置值', () => {
      const specialValue = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      configManager.set('VITE_TEST_SPECIAL', specialValue);
      const value = configManager.get('VITE_TEST_SPECIAL');
      expect(value).toBe(specialValue);
    });

    it('应该处理Unicode字符', () => {
      const unicodeValue = '中文测试🎉🚀';
      configManager.set('VITE_TEST_UNICODE', unicodeValue);
      const value = configManager.get('VITE_TEST_UNICODE');
      expect(value).toBe(unicodeValue);
    });

    it('应该处理超长配置值', () => {
      const longValue = 'a'.repeat(10000);
      configManager.set('VITE_TEST_LONG', longValue);
      const value = configManager.get('VITE_TEST_LONG');
      expect(value).toBe(longValue);
    });

    it('应该处理数字边界值', () => {
      configManager.set('VITE_TEST_MAX_NUMBER', '999999999999');
      const maxValue = configManager.getNumber('VITE_TEST_MAX_NUMBER');
      expect(maxValue).toBe(999999999999);

      configManager.set('VITE_TEST_MIN_NUMBER', '-999999999999');
      const minValue = configManager.getNumber('VITE_TEST_MIN_NUMBER');
      expect(minValue).toBe(-999999999999);
    });

    it('应该处理浮点数', () => {
      configManager.set('VITE_TEST_FLOAT', '123.456');
      const value = configManager.getNumber('VITE_TEST_FLOAT');
      expect(value).toBe(123.456);
    });

    it('应该处理科学计数法', () => {
      configManager.set('VITE_TEST_SCI', '1.23e5');
      const value = configManager.getNumber('VITE_TEST_SCI');
      expect(value).toBe(123000);
    });
  });
});
