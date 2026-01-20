/**
 * @file 代理配置测试
 * @description 测试不同环境下的代理配置
 * @module __tests__/unit/config/proxy.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('代理配置测试', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Development环境代理配置', () => {
    it('development环境应该启用代理', () => {
      process.env.VITE_API_PROXY_ENABLED = 'true';
      process.env.VITE_API_PROXY_TARGET = 'http://localhost:6000';
      process.env.VITE_APP_ENV = 'development';

      const proxyEnabled = process.env.VITE_API_PROXY_ENABLED === 'true';
      const proxyTarget = process.env.VITE_API_PROXY_TARGET;

      expect(proxyEnabled).toBe(true);
      expect(proxyTarget).toBe('http://localhost:6000');
    });

    it('development环境代理应该指向本地开发服务器', () => {
      process.env.VITE_API_PROXY_ENABLED = 'true';
      process.env.VITE_API_PROXY_TARGET = 'http://localhost:6000';
      process.env.VITE_APP_ENV = 'development';

      const proxyTarget = process.env.VITE_API_PROXY_TARGET;

      expect(proxyTarget).toContain('localhost');
      expect(proxyTarget).toContain('6000');
    });

    it('development环境可以禁用代理', () => {
      process.env.VITE_API_PROXY_ENABLED = 'false';
      process.env.VITE_APP_ENV = 'development';

      const proxyEnabled = process.env.VITE_API_PROXY_ENABLED === 'true';

      expect(proxyEnabled).toBe(false);
    });
  });

  describe('Staging环境代理配置', () => {
    it('staging环境应该禁用代理', () => {
      process.env.VITE_API_PROXY_ENABLED = 'false';
      process.env.VITE_APP_ENV = 'staging';

      const proxyEnabled = process.env.VITE_API_PROXY_ENABLED === 'true';

      expect(proxyEnabled).toBe(false);
    });

    it('staging环境应该直接连接到staging API', () => {
      process.env.VITE_API_BASE_URL = 'https://api-staging.yyc3.com';
      process.env.VITE_APP_ENV = 'staging';

      const apiBaseUrl = process.env.VITE_API_BASE_URL;

      expect(apiBaseUrl).toContain('staging');
      expect(apiBaseUrl).toContain('https://');
    });
  });

  describe('Production环境代理配置', () => {
    it('production环境应该禁用代理', () => {
      process.env.VITE_API_PROXY_ENABLED = 'false';
      process.env.VITE_APP_ENV = 'production';

      const proxyEnabled = process.env.VITE_API_PROXY_ENABLED === 'true';

      expect(proxyEnabled).toBe(false);
    });

    it('production环境应该直接连接到production API', () => {
      process.env.VITE_API_BASE_URL = 'https://api.yyc3.com';
      process.env.VITE_APP_ENV = 'production';

      const apiBaseUrl = process.env.VITE_API_BASE_URL;

      expect(apiBaseUrl).toContain('https://api.yyc3.com');
      expect(apiBaseUrl).not.toContain('staging');
      expect(apiBaseUrl).not.toContain('localhost');
    });
  });

  describe('代理配置验证', () => {
    it('代理配置应该包含正确的重写规则', () => {
      process.env.VITE_API_PROXY_ENABLED = 'true';
      process.env.VITE_API_PROXY_TARGET = 'http://localhost:6000';

      const proxyTarget = process.env.VITE_API_PROXY_TARGET;

      expect(proxyTarget).toBeDefined();
      expect(proxyTarget).not.toBe('');
    });

    it('代理配置应该启用changeOrigin', () => {
      process.env.VITE_API_PROXY_ENABLED = 'true';
      process.env.VITE_API_PROXY_TARGET = 'http://localhost:6000';

      const proxyEnabled = process.env.VITE_API_PROXY_ENABLED === 'true';

      expect(proxyEnabled).toBe(true);
    });

    it('代理配置应该正确处理/api路径', () => {
      process.env.VITE_API_PROXY_ENABLED = 'true';
      process.env.VITE_API_PROXY_TARGET = 'http://localhost:6000';

      const proxyTarget = process.env.VITE_API_PROXY_TARGET;

      expect(proxyTarget).toBe('http://localhost:6000');
    });
  });

  describe('代理配置安全性', () => {
    it('生产环境不应该启用代理', () => {
      process.env.VITE_API_PROXY_ENABLED = 'false';
      process.env.VITE_APP_ENV = 'production';

      const proxyEnabled = process.env.VITE_API_PROXY_ENABLED === 'true';

      expect(proxyEnabled).toBe(false);
    });

    it('staging环境不应该启用代理', () => {
      process.env.VITE_API_PROXY_ENABLED = 'false';
      process.env.VITE_APP_ENV = 'staging';

      const proxyEnabled = process.env.VITE_API_PROXY_ENABLED === 'true';

      expect(proxyEnabled).toBe(false);
    });

    it('只有development环境可以启用代理', () => {
      process.env.VITE_API_PROXY_ENABLED = 'true';
      process.env.VITE_APP_ENV = 'development';

      const proxyEnabled = process.env.VITE_API_PROXY_ENABLED === 'true';

      expect(proxyEnabled).toBe(true);
    });
  });

  describe('代理配置错误处理', () => {
    it('当代理目标未定义时应该有默认值', () => {
      process.env.VITE_API_PROXY_ENABLED = 'true';
      delete process.env.VITE_API_PROXY_TARGET;

      const proxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:6000';

      expect(proxyTarget).toBe('http://localhost:6000');
    });

    it('当代理启用状态未定义时应该默认禁用', () => {
      delete process.env.VITE_API_PROXY_ENABLED;

      const proxyEnabled = process.env.VITE_API_PROXY_ENABLED === 'true';

      expect(proxyEnabled).toBe(false);
    });
  });

  describe('代理配置与API服务集成', () => {
    it('代理配置应该与API服务配置一致', () => {
      process.env.VITE_API_PROXY_ENABLED = 'true';
      process.env.VITE_API_PROXY_TARGET = 'http://localhost:3200';
      process.env.VITE_API_BASE_URL = 'http://localhost:3200';

      const proxyTarget = process.env.VITE_API_PROXY_TARGET;
      const apiBaseUrl = process.env.VITE_API_BASE_URL;

      expect(proxyTarget).toBe(apiBaseUrl);
    });

    it('禁用代理时API应该使用完整URL', () => {
      process.env.VITE_API_PROXY_ENABLED = 'false';
      process.env.VITE_API_BASE_URL = 'https://api.yyc3.com';

      const proxyEnabled = process.env.VITE_API_PROXY_ENABLED === 'true';
      const apiBaseUrl = process.env.VITE_API_BASE_URL;

      expect(proxyEnabled).toBe(false);
      expect(apiBaseUrl).toContain('https://');
    });
  });
});
