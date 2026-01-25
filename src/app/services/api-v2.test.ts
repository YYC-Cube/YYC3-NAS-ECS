/**
 * @file API服务测试
 * @description 测试API服务的核心功能
 * @module __tests__/services/api-v2.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
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
  let mockFetch: any;

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

    it('应该更新FRP配置', async () => {
      const config = {
        id: 'frp-1',
        name: 'Updated Service',
        type: 'tcp' as const,
        localIp: '127.0.0.1',
        localPort: 8080,
        remotePort: 6000,
        status: 'running' as const
      };
      const result = await mockService.frp.updateConfig(config);
      expect(result).toEqual(config);
    });

    it('应该启动FRP客户端', async () => {
      const result = await mockService.frp.startClient();
      expect(result).toBeUndefined();
    });

    it('应该停止FRP客户端', async () => {
      const result = await mockService.frp.stopClient();
      expect(result).toBeUndefined();
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

    it('应该清除日志', async () => {
      const result = await mockService.logs.clearLogs();
      expect(result).toBeUndefined();
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
      envConfig.setEnvironment('development');

      const result = await mockService.mail.sendEmail('test@example.com', 'Test', 'Body');

      expect(result).toBeUndefined();
    });

    it('应该回复邮件', async () => {
      const result = await mockService.mail.replyEmail('email-1', 'recipient@example.com', 'Re: Test', 'Reply body');
      expect(result).toBeUndefined();
    });

    it('应该转发邮件', async () => {
      const result = await mockService.mail.forwardEmail('email-1', 'forward@example.com', 'Fwd: Test', 'Forward body');
      expect(result).toBeUndefined();
    });

    it('应该标记邮件为已读', async () => {
      const result = await mockService.mail.markEmailRead('email-1');
      expect(result).toBeUndefined();
    });

    it('应该标记邮件为未读', async () => {
      const result = await mockService.mail.markEmailUnread('email-1');
      expect(result).toBeUndefined();
    });

    it('应该删除邮件', async () => {
      const result = await mockService.mail.deleteEmail('email-1');
      expect(result).toBeUndefined();
    });

    it('应该保存草稿', async () => {
      const draft = {
        to: ['test@example.com'],
        cc: [],
        bcc: [],
        subject: 'Draft',
        body: 'Draft body',
        attachments: [],
        priority: 'normal'
      };
      const result = await mockService.mail.saveDraft(draft);
      expect(result).toBeUndefined();
    });

    it('应该计划发送邮件', async () => {
      const email = {
        to: ['test@example.com'],
        cc: [],
        bcc: [],
        subject: 'Scheduled',
        body: 'Scheduled body',
        attachments: [],
        priority: 'normal',
        scheduledTime: new Date(Date.now() + 3600000).toISOString()
      };
      const result = await mockService.mail.scheduleEmail(email);
      expect(result).toBeUndefined();
    });

    it('应该切换邮件星标', async () => {
      const result = await mockService.mail.toggleStar('email-1');
      expect(result).toBeUndefined();
    });

    it('应该归档邮件', async () => {
      const result = await mockService.mail.archiveEmail('email-1');
      expect(result).toBeUndefined();
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

    it('应该生成LLM响应', async () => {
      const response = await mockService.llm.generate('Test prompt', 'qwen:7b', true);
      expect(response).toBeInstanceOf(Response);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('response');
    });

    it('应该返回模型列表', async () => {
      const models = await mockService.llm.getModels();
      expect(models).toHaveProperty('models');
      expect(Array.isArray(models.models)).toBe(true);
      expect(models.models.length).toBeGreaterThan(0);
      expect(models.models[0]).toHaveProperty('name');
      expect(models.models[0]).toHaveProperty('size');
      expect(models.models[0]).toHaveProperty('modified_at');
    });

    it('应该删除模型', async () => {
      const result = await mockService.llm.deleteModel('qwen:7b');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
    });

    it('应该拉取模型', async () => {
      const response = await mockService.llm.pullModel('qwen:7b');
      expect(response).toBeInstanceOf(Response);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('status');
    });

    it('应该进行对话', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      const response = await mockService.llm.chat(messages, 'qwen:7b', true);
      expect(response).toBeInstanceOf(Response);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('content');
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

    it('应该返回NAS状态', async () => {
      const status = await mockService.nas.getStatus();
      expect(status).toHaveProperty('success', true);
      expect(status.data).toHaveProperty('system');
      expect(status.data).toHaveProperty('volumes');
      expect(status.data).toHaveProperty('services');
    });

    it('应该返回卷列表', async () => {
      const volumes = await mockService.nas.getVolumes();
      expect(volumes).toHaveProperty('success', true);
      expect(Array.isArray(volumes.data)).toBe(true);
      expect(volumes.data.length).toBeGreaterThan(0);
    });

    it('应该返回共享列表', async () => {
      const shares = await mockService.nas.getShares();
      expect(Array.isArray(shares)).toBe(true);
      expect(shares.length).toBeGreaterThan(0);
      expect(shares[0]).toHaveProperty('id');
      expect(shares[0]).toHaveProperty('name');
      expect(shares[0]).toHaveProperty('path');
    });

    it('应该启动服务', async () => {
      const result = await mockService.nas.startService();
      expect(result).toBeUndefined();
    });

    it('应该停止服务', async () => {
      const result = await mockService.nas.stopService();
      expect(result).toBeUndefined();
    });

    it('应该切换共享', async () => {
      const result = await mockService.nas.toggleShare('share-1');
      expect(result).toBeUndefined();
    });
  });

  describe('DDNS服务', () => {
    it('应该返回DDNS状态', async () => {
      const status = await mockService.ddns.getStatus();
      expect(status).toHaveProperty('success', true);
      expect(status.data).toHaveProperty('running');
      expect(status.data).toHaveProperty('enabled');
      expect(status.data).toHaveProperty('provider');
      expect(status.data).toHaveProperty('domain');
    });

    it('应该更新DDNS配置', async () => {
      const config = {
        provider: 'aliyun',
        domain: 'test.0379.email'
      };
      const result = await mockService.ddns.updateConfig(config);
      expect(result).toHaveProperty('success', true);
      expect(result.data).toEqual(config);
    });

    it('应该更新DDNS', async () => {
      const result = await mockService.ddns.updateDDNS();
      expect(result).toBeUndefined();
    });

    it('应该返回DDNS历史', async () => {
      const history = await mockService.ddns.getHistory(10);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('id');
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('oldIP');
      expect(history[0]).toHaveProperty('newIP');
    });
  });

  describe('监控服务', () => {
    it('应该返回监控统计', async () => {
      const stats = await mockService.monitoring.getStats();
      expect(stats).toHaveProperty('success', true);
      expect(stats.data).toHaveProperty('cpu');
      expect(stats.data).toHaveProperty('memory');
      expect(stats.data).toHaveProperty('disk');
      expect(stats.data).toHaveProperty('network');
    });

    it('应该返回进程列表', async () => {
      const processes = await mockService.monitoring.getProcesses(20, 'cpu');
      expect(processes).toHaveProperty('success', true);
      expect(processes.data).toHaveProperty('processes');
      expect(Array.isArray(processes.data.processes)).toBe(true);
      expect(processes.data.total).toBe(20);
    });
  });
});

describe('RealApiService', () => {
  let realService: RealApiService;
  let mockFetch: any;

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

    it('应该调用真实的登出API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.auth.logout();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
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

    it('应该调用详细的系统统计API', async () => {
      const mockStats = {
        cpu: { usage: 12.5, cores: 4 },
        memory: { usage: 45.3, total: 16, used: 7.25 },
        disk: { usage: 35.5, total: 1000, used: 355 },
        network: { in: 1024, out: 512 },
        system: { uptime: '15天 3小时 45分钟', hostname: 'nas-0379' }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const stats = await realService.system.getDetailedStats();
      expect(stats).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/monitoring/stats'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('FRP服务', () => {
    it('应该调用FRP状态API', async () => {
      const mockStatus = {
        success: true,
        data: {
          client: {
            running: true,
            connected: true,
            serverAddr: '8.152.195.33',
            serverPort: 7001,
            proxyCount: 5,
            uptime: '15天 3小时 45分钟'
          },
          proxies: [],
          timestamp: new Date().toISOString()
        }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const status = await realService.frp.getStatus();
      expect(status).toEqual(mockStatus);
    });

    it('应该调用FRP配置API', async () => {
      const mockConfigs = [
        { id: 'frp-1', name: 'Service 1', type: 'tcp' }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigs,
      });

      const configs = await realService.frp.getConfigs();
      expect(configs).toEqual(mockConfigs);
    });

    it('应该调用FRP更新配置API', async () => {
      const mockConfig = { id: 'frp-1', name: 'Updated' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const config = await realService.frp.updateConfig(mockConfig as any);
      expect(config).toEqual(mockConfig);
    });

    it('应该调用FRP启动客户端API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.frp.startClient();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/frp/client/start'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('应该调用FRP停止客户端API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.frp.stopClient();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/frp/client/stop'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('DDNS服务', () => {
    it('应该调用DDNS状态API', async () => {
      const mockStatus = {
        success: true,
        data: {
          running: true,
          enabled: true,
          provider: 'aliyun',
          domain: 'ddns.0379.email'
        }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const status = await realService.ddns.getStatus();
      expect(status).toEqual(mockStatus);
    });

    it('应该调用DDNS更新配置API', async () => {
      const mockConfig = { provider: 'aliyun', domain: 'test.0379.email' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockConfig }),
      });

      const result = await realService.ddns.updateConfig(mockConfig);
      expect(result).toEqual({ success: true, data: mockConfig });
    });

    it('应该调用DDNS更新API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.ddns.updateDDNS();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/ddns/update'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('应该调用DDNS历史API', async () => {
      const mockHistory = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          oldIP: '8.152.195.32',
          newIP: '8.152.195.33',
          status: 'success'
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const history = await realService.ddns.getHistory(10);
      expect(history).toEqual(mockHistory);
    });
  });

  describe('NAS服务', () => {
    it('应该调用NAS状态API', async () => {
      const mockStatus = {
        success: true,
        data: {
          system: {
            uptime: '15天 3小时 45分钟',
            cpuUsage: 25.5,
            memoryUsage: 45.2,
            temperature: '45°C'
          },
          volumes: [],
          services: []
        }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const status = await realService.nas.getStatus();
      expect(status).toEqual(mockStatus);
    });

    it('应该调用NAS卷列表API', async () => {
      const mockVolumes = {
        success: true,
        data: [
          {
            id: 'vol-1',
            name: 'Data Volume 1',
            type: 'ext4',
            capacity: '2 TB',
            used: '800 GB',
            available: '1.2 TB',
            usagePercent: 40,
            status: 'healthy'
          }
        ]
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVolumes,
      });

      const volumes = await realService.nas.getVolumes();
      expect(volumes).toEqual(mockVolumes);
    });

    it('应该调用NAS文件列表API', async () => {
      const mockFiles = [
        { id: 'file-1', name: 'File 1.txt', type: 'file' }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFiles,
      });

      const files = await realService.nas.getFiles('parent-1');
      expect(files).toEqual(mockFiles);
    });

    it('应该调用NAS共享列表API', async () => {
      const mockShares = [
        {
          id: 'share-1',
          name: 'Documents',
          path: '/data/documents',
          permissions: 'read-write'
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockShares,
      });

      const shares = await realService.nas.getShares();
      expect(shares).toEqual(mockShares);
    });

    it('应该调用NAS启动服务API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.nas.startService();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/nas/service/start'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('应该调用NAS停止服务API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.nas.stopService();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/nas/service/stop'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('应该调用NAS切换共享API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.nas.toggleShare('share-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/nas/shares/share-1/toggle'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('监控服务', () => {
    it('应该调用监控统计API', async () => {
      const mockStats = {
        success: true,
        data: {
          cpu: { usage: 25.5, cores: 8 },
          memory: { total: 32768, used: 14800, available: 17968, percent: 45.2 },
          disk: { total: 6291456, used: 3276800, available: 3014656, percent: 52.1 },
          network: { bytesSent: 1073741824, bytesRecv: 2147483648 },
          loadAverage: [0.5, 0.8, 1.2],
          uptime: 1298400
        }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const stats = await realService.monitoring.getStats();
      expect(stats).toEqual(mockStats);
    });

    it('应该调用进程列表API', async () => {
      const mockProcesses = {
        success: true,
        data: {
          processes: [
            { pid: 1000, name: 'nginx', cpu_percent: 5.2, memory_percent: 2.1 }
          ],
          total: 20
        }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProcesses,
      });

      const processes = await realService.monitoring.getProcesses(20, 'cpu');
      expect(processes).toEqual(mockProcesses);
    });
  });

  describe('日志服务', () => {
    it('应该调用日志列表API', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          level: 'info',
          message: 'System event',
          source: 'System',
          timestamp: new Date().toISOString()
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogs,
      });

      const logs = await realService.logs.getLogs();
      expect(logs).toEqual(mockLogs);
    });

    it('应该调用清除日志API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.logs.clearLogs();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/logs'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('邮件服务', () => {
    it('应该调用邮件列表API', async () => {
      const mockEmails = [
        {
          id: 'email-1',
          from: 'user@example.com',
          to: 'me@admin.com',
          subject: 'Test',
          body: 'Test body',
          timestamp: new Date().toISOString(),
          read: false,
          folder: 'inbox'
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmails,
      });

      const emails = await realService.mail.getEmails('inbox');
      expect(emails).toEqual(mockEmails);
    });

    it('应该调用发送邮件API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.mail.sendEmail('test@example.com', 'Test', 'Body');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/mail/send'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            to: 'test@example.com',
            subject: 'Test',
            body: 'Body',
            cc: undefined,
            bcc: undefined,
            attachments: undefined
          })
        })
      );
    });

    it('应该调用回复邮件API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.mail.replyEmail('email-1', 'recipient@example.com', 'Re: Test', 'Reply body');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/mail/reply'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            original_email_id: 'email-1',
            to: 'recipient@example.com',
            subject: 'Re: Test',
            body: 'Reply body'
          })
        })
      );
    });

    it('应该调用转发邮件API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.mail.forwardEmail('email-1', 'forward@example.com', 'Fwd: Test', 'Forward body');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/mail/forward'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            original_email_id: 'email-1',
            to: 'forward@example.com',
            subject: 'Fwd: Test',
            body: 'Forward body'
          })
        })
      );
    });

    it('应该调用标记已读API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.mail.markEmailRead('email-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/mail/emails/email-1/read'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('应该调用标记未读API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.mail.markEmailUnread('email-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/mail/emails/email-1/unread'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('应该调用删除邮件API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.mail.deleteEmail('email-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/mail/emails/email-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('应该调用保存草稿API', async () => {
      const draft = {
        to: ['test@example.com'],
        cc: [],
        bcc: [],
        subject: 'Draft',
        body: 'Draft body',
        attachments: [],
        priority: 'normal'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.mail.saveDraft(draft);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/mail/drafts'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(draft)
        })
      );
    });

    it('应该调用计划邮件API', async () => {
      const email = {
        to: ['test@example.com'],
        cc: [],
        bcc: [],
        subject: 'Scheduled',
        body: 'Scheduled body',
        attachments: [],
        priority: 'normal',
        scheduledTime: new Date(Date.now() + 3600000).toISOString()
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.mail.scheduleEmail(email);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/mail/schedule'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(email)
        })
      );
    });

    it('应该调用归档邮件API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.mail.archiveEmail('email-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/mail/emails/email-1/archive'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('应该调用切换星标API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await realService.mail.toggleStar('email-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/mail/emails/email-1/star'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('LLM服务', () => {
    it('应该调用发送消息API', async () => {
      const mockMessage = {
        id: '1',
        role: 'assistant',
        content: 'Response',
        timestamp: new Date().toISOString()
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMessage,
      });

      const message = await realService.llm.sendMessage('Hello');
      expect(message).toEqual(mockMessage);
    });

    it('应该调用生成API', async () => {
      const mockResponse = {
        success: true,
        response: 'Generated response'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await realService.llm.generate('Test prompt', 'qwen:7b', true);
      expect(response).toEqual(mockResponse);
    });

    it('应该调用模型列表API', async () => {
      const mockModels = {
        models: [
          { name: 'qwen:7b', size: '4.7GB', modified_at: '2025-01-20T10:30:00Z' }
        ]
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModels,
      });

      const models = await realService.llm.getModels();
      expect(models).toEqual(mockModels);
    });

    it('应该调用删除模型API', async () => {
      const mockResult = {
        success: true,
        message: 'Model deleted successfully'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      });

      const result = await realService.llm.deleteModel('qwen:7b');
      expect(result).toEqual(mockResult);
    });

    it('应该调用拉取模型API', async () => {
      const mockResponse = {
        success: true,
        status: 'Pulling model...'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await realService.llm.pullModel('qwen:7b');
      expect(response).toEqual(mockResponse);
    });

    it('应该调用对话API', async () => {
      const mockResponse = {
        success: true,
        content: 'Chat response'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const messages = [
        { role: 'user', content: 'Hello' }
      ];
      const response = await realService.llm.chat(messages, 'qwen:7b', true);
      expect(response).toEqual(mockResponse);
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
      ApiServiceFactory.getInstance();

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

describe('边界情况测试', () => {
  let apiClient: ApiClient;
  let mockFetch: any;

  beforeEach(() => {
    apiClient = new ApiClient();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('空数据处理', () => {
    it('应该处理空响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await apiClient.get('/test');
      expect(result).toEqual({});
    });

    it('应该处理空数组响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await apiClient.get('/test');
      expect(result).toEqual([]);
    });

    it('应该处理null响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const result = await apiClient.get('/test');
      expect(result).toBeNull();
    });
  });

  describe('无效输入处理', () => {
    it('应该处理空字符串路径', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await apiClient.get('');
      expect(result).toBeDefined();
    });

    it('应该处理特殊字符路径', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await apiClient.get('/test/path?param=value&special=!@#$%');
      expect(result).toBeDefined();
    });

    it('应该处理大请求数据', async () => {
      const largeData = Array(10000).fill({ key: 'value' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await apiClient.post('/test', largeData);
      expect(result).toBeDefined();
    });
  });

  describe('网络错误处理', () => {
    it('应该处理连接超时', async () => {
      mockFetch.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 35000)
        )
      );

      await expect(apiClient.get('/test')).rejects.toThrow();
    }, 40000);

    it('应该处理网络中断', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network request failed');
    });

    it('应该处理服务器无响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API request failed: 503 Service Unavailable');
    });

    it('应该处理网关超时', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 504,
        statusText: 'Gateway Timeout',
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API request failed: 504 Gateway Timeout');
    });
  });

  describe('HTTP状态码处理', () => {
    it('应该处理400 Bad Request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API request failed: 400 Bad Request');
    });

    it('应该处理401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API request failed: 401 Unauthorized');
    });

    it('应该处理403 Forbidden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API request failed: 403 Forbidden');
    });

    it('应该处理404 Not Found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API request failed: 404 Not Found');
    });

    it('应该处理409 Conflict', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API request failed: 409 Conflict');
    });

    it('应该处理429 Too Many Requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API request failed: 429 Too Many Requests');
    });

    it('应该处理500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API request failed: 500 Internal Server Error');
    });
  });

  describe('数据验证', () => {
    it('应该验证响应数据结构', async () => {
      const mockData = { id: 1, name: 'Test', value: 123 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('value');
      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
      expect(typeof result.value).toBe('number');
    });

    it('应该处理嵌套数据结构', async () => {
      const mockData = {
        user: {
          id: 1,
          profile: {
            name: 'Test',
            settings: {
              theme: 'dark',
              notifications: true
            }
          }
        }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');
      expect(result.user.profile.settings.theme).toBe('dark');
    });

    it('应该处理数组数据', async () => {
      const mockData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.get('/test');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });
  });
});

describe('并发请求测试', () => {
  let apiClient: ApiClient;
  let mockFetch: any;

  beforeEach(() => {
    apiClient = new ApiClient();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该处理多个并发GET请求', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 3 }) });

    const results = await Promise.all([
      apiClient.get('/test1'),
      apiClient.get('/test2'),
      apiClient.get('/test3')
    ]);

    expect(results.length).toBe(3);
    expect(results[0].id).toBe(1);
    expect(results[1].id).toBe(2);
    expect(results[2].id).toBe(3);
  });

  it('应该处理多个并发POST请求', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    const results = await Promise.all([
      apiClient.post('/test1', { data: 1 }),
      apiClient.post('/test2', { data: 2 }),
      apiClient.post('/test3', { data: 3 })
    ]);

    expect(results.length).toBe(3);
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });

  it('应该正确处理并发请求中的错误', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 3 }) });

    const results = await Promise.allSettled([
      apiClient.get('/test1'),
      apiClient.get('/test2'),
      apiClient.get('/test3')
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(results[2].status).toBe('fulfilled');
  });
});

describe('性能测试', () => {
  let apiClient: ApiClient;
  let mockFetch: any;

  beforeEach(() => {
    apiClient = new ApiClient();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该在合理时间内完成单个请求', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const startTime = Date.now();
    await apiClient.get('/test');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000);
  });

  it('应该在合理时间内完成批量请求', async () => {
    for (let i = 0; i < 10; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: i }),
      });
    }

    const startTime = Date.now();
    const requests = Array.from({ length: 10 }, (_, i) => 
      apiClient.get(`/test${i}`)
    );
    await Promise.all(requests);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000);
  });

  it('应该正确处理大量数据请求', async () => {
    const largeData = Array(10000).fill({ key: 'value' });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => largeData,
    });

    const startTime = Date.now();
    const result = await apiClient.get('/test');
    const endTime = Date.now();

    expect(result.length).toBe(10000);
    expect(endTime - startTime).toBeLessThan(5000);
  });
});

describe('MockDataService高级测试', () => {
  let mockService: MockDataService;

  beforeEach(() => {
    mockService = new MockDataService();
    vi.clearAllMocks();
  });

  describe('数据一致性', () => {
    it('应该生成一致的系统统计数据', async () => {
      const stats1 = await mockService.system.getStats();
      const stats2 = await mockService.system.getStats();

      expect(stats1).toHaveProperty('cpuUsage');
      expect(stats2).toHaveProperty('cpuUsage');
      expect(typeof stats1.cpuUsage).toBe('number');
      expect(typeof stats2.cpuUsage).toBe('number');
    });

    it('应该生成一致的FRP配置', async () => {
      const configs1 = await mockService.frp.getConfigs();
      const configs2 = await mockService.frp.getConfigs();

      expect(Array.isArray(configs1)).toBe(true);
      expect(Array.isArray(configs2)).toBe(true);
      expect(configs1.length).toBe(configs2.length);
    });
  });

  describe('数据范围验证', () => {
    it('应该生成有效的CPU使用率', async () => {
      const stats = await mockService.system.getStats();
      expect(stats.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(stats.cpuUsage).toBeLessThanOrEqual(100);
    });

    it('应该生成有效的内存使用率', async () => {
      const stats = await mockService.system.getStats();
      expect(stats.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(stats.memoryUsage).toBeLessThanOrEqual(100);
    });

    it('应该生成有效的磁盘使用率', async () => {
      const stats = await mockService.system.getStats();
      expect(stats.diskUsage).toBeGreaterThanOrEqual(0);
      expect(stats.diskUsage).toBeLessThanOrEqual(100);
    });
  });

  describe('延迟模拟', () => {
    it('应该在合理时间内返回系统统计', async () => {
      const startTime = Date.now();
      await mockService.system.getStats();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(200);
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('应该在合理时间内返回FRP配置', async () => {
      const startTime = Date.now();
      await mockService.frp.getConfigs();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});

describe('RealApiService高级测试', () => {
  let realService: RealApiService;
  let mockFetch: any;

  beforeEach(() => {
    realService = new RealApiService();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('请求头验证', () => {
    it('应该包含正确的Content-Type头', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await realService.system.getStats();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('应该包含正确的请求方法', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await realService.system.getStats();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
  });

  describe('URL构建', () => {
    it('应该正确构建API URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await realService.system.getDetailedStats();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/monitoring/stats'),
        expect.any(Object)
      );
    });

    it('应该正确构建FRP配置URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await realService.frp.getConfigs();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/frp/configs'),
        expect.any(Object)
      );
    });
  });

  describe('错误恢复', () => {
    it('应该在错误后继续处理后续请求', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      await expect(realService.system.getStats()).rejects.toThrow();
      const result = await realService.system.getStats();

      expect(result).toEqual({ success: true });
    });
  });
});
