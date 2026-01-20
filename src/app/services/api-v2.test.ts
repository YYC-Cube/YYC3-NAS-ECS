/**
 * @file API服务测试
 * @description 测试API服务的核心功能
 * @module __tests__/services/api-v2.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ApiClient,
  MockDataService,
  RealApiService,
  ApiServiceFactory,
  api
} from './api-v2';
import { envConfig } from '../config/env';

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    vi.stubEnv('VITE_APP_ENV', 'development');
    vi.stubEnv('VITE_ENABLE_MOCK_DATA', 'true');
    vi.stubEnv('VITE_ENABLE_DEBUG', 'true');
    vi.stubEnv('VITE_LOG_LEVEL', 'debug');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    apiClient = new ApiClient();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET请求', () => {
    it('应该成功发送GET请求', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('POST请求', () => {
    it('应该成功发送POST请求', async () => {
      const mockData = { success: true };
      const postData = { name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.post('/test', postData);
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理HTTP错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API request failed: 404 Not Found');
    });

    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });
  });

  describe('超时处理', () => {
    it('应该在超时后中止请求', async () => {
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 35000))
      );

      await expect(apiClient.get('/test')).rejects.toThrow();
    }, 40000);
  });
});

describe('MockDataService', () => {
  let mockService: MockDataService;

  beforeEach(() => {
    mockService = new MockDataService();
    vi.clearAllMocks();
  });

  describe('认证服务', () => {
    it('应该返回模拟用户数据', async () => {
      const user = await mockService.auth.login('testuser');
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username', 'testuser');
      expect(user).toHaveProperty('role');
    });
  });

  describe('系统统计', () => {
    it('应该返回模拟系统统计', async () => {
      const stats = await mockService.system.getStats();
      expect(stats).toHaveProperty('cpuUsage');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('diskUsage');
      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('timestamp');
    });
  });

  describe('FRP配置', () => {
    it('应该返回模拟FRP配置', async () => {
      const configs = await mockService.frp.getConfigs();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
      expect(configs[0]).toHaveProperty('id');
      expect(configs[0]).toHaveProperty('name');
      expect(configs[0]).toHaveProperty('type');
    });
  });

  describe('日志服务', () => {
    it('应该返回模拟日志', async () => {
      const logs = await mockService.logs.getLogs();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toHaveProperty('id');
      expect(logs[0]).toHaveProperty('level');
      expect(logs[0]).toHaveProperty('message');
    });
  });

  describe('邮件服务', () => {
    it('应该返回模拟邮件列表', async () => {
      const emails = await mockService.mail.getEmails('inbox');
      expect(Array.isArray(emails)).toBe(true);
      expect(emails.length).toBeGreaterThan(0);
      expect(emails[0]).toHaveProperty('id');
      expect(emails[0]).toHaveProperty('from');
      expect(emails[0]).toHaveProperty('subject');
    });

    it('应该发送模拟邮件', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      envConfig.setEnvironment('development');
      
      await mockService.mail.sendEmail('test@example.com', 'Test', 'Body');
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('LLM服务', () => {
    it('应该返回模拟LLM响应', async () => {
      const response = await mockService.llm.sendMessage('Hello');
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('role', 'assistant');
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('timestamp');
    });
  });

  describe('NAS服务', () => {
    it('应该返回模拟文件列表', async () => {
      const files = await mockService.nas.getFiles();
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toHaveProperty('id');
      expect(files[0]).toHaveProperty('name');
      expect(files[0]).toHaveProperty('type');
    });
  });
});

describe('RealApiService', () => {
  let realService: RealApiService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    realService = new RealApiService();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('认证服务', () => {
    it('应该调用真实的登录API', async () => {
      const mockUser = { id: '1', username: 'test', role: 'admin' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const user = await realService.auth.login('test');
      expect(user).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'test' }),
        })
      );
    });
  });

  describe('系统统计', () => {
    it('应该调用真实的系统统计API', async () => {
      const mockStats = { cpuUsage: 50, memoryUsage: 60 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const stats = await realService.system.getStats();
      expect(stats).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/system/stats'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
});

describe('ApiServiceFactory', () => {
  beforeEach(() => {
    ApiServiceFactory.resetInstance();
    vi.clearAllMocks();
  });

  describe('服务选择逻辑', () => {
    it('应该根据环境配置选择服务', () => {
      const service = ApiServiceFactory.getInstance();
      expect(service).toBeDefined();
    });

    it('应该返回单例实例', () => {
      const service1 = ApiServiceFactory.getInstance();
      const service2 = ApiServiceFactory.getInstance();
      expect(service1).toBe(service2);
    });

    it('重置后应该创建新实例', () => {
      const service1 = ApiServiceFactory.getInstance();
      ApiServiceFactory.resetInstance();
      const service2 = ApiServiceFactory.getInstance();
      expect(service1).not.toBe(service2);
    });
  });

  describe.skip('调试日志', () => {
    it('应该在调试模式下输出服务选择信息', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      ApiServiceFactory.resetInstance();
      const apiService = ApiServiceFactory.getInstance();
      
      const apiServiceCalls = consoleSpy.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes('[API Service]')
      );
      
      expect(apiServiceCalls.length).toBeGreaterThan(0);
      expect(apiServiceCalls[0][0]).toContain('[API Service] Using');
      consoleSpy.mockRestore();
    });

    it('应该正确检测调试模式', () => {
      expect(envConfig.isDebugEnabled()).toBe(true);
    });
  });
});

describe('API导出', () => {
  it('应该导出API服务实例', () => {
    expect(api).toBeDefined();
    expect(api).toHaveProperty('auth');
    expect(api).toHaveProperty('system');
    expect(api).toHaveProperty('frp');
    expect(api).toHaveProperty('logs');
    expect(api).toHaveProperty('mail');
    expect(api).toHaveProperty('llm');
    expect(api).toHaveProperty('nas');
  });
});
