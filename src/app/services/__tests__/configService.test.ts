import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager, Environment } from '../configService';

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

    it('应该标记相同的配置项', () => {
      const diffs = configManager.compare(Environment.DEVELOPMENT, Environment.STAGING);
      const hasSame = diffs.some(diff => !diff.isDifferent);
      expect(hasSame).toBe(true);
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
});
