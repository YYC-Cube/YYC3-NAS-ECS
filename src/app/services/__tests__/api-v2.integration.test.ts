import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '../api-v2';
import { LogService } from '../logService';
import { LogLevel, LogCategory } from '../../types/logs';

describe.skip('API模块集成测试', () => {
  let logService: LogService;

  beforeEach(() => {
    logService = new LogService();
    logService.clearLogs();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('系统监控API集成', () => {
    it('应该获取系统状态', async () => {
      const stats = await api.system.getStats();
      expect(stats).toBeDefined();
    });

    it('应该获取系统详细信息', async () => {
      const stats = await api.system.getDetailedStats();
      expect(stats).toBeDefined();
    });

    it('应该记录系统监控操作到日志', async () => {
      await api.system.getStats();

      const logs = logService.queryLogs({
        category: LogCategory.MONITORING
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('FRP管理API集成', () => {
    it('应该获取FRP配置列表', async () => {
      const configs = await api.frp.getConfigs();
      expect(Array.isArray(configs)).toBe(true);
    });

    it('应该更新FRP配置', async () => {
      const configs = await api.frp.getConfigs();
      if (configs.length > 0) {
        const updated = await api.frp.updateConfig({
          ...configs[0],
          name: '更新的FRP配置'
        });

        expect(updated).toBeDefined();
      }
    });

    it('应该记录FRP操作到日志', async () => {
      await api.frp.getConfigs();

      const logs = logService.queryLogs({
        category: LogCategory.FRP
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('DDNS管理API集成', () => {
    it('应该获取DDNS状态', async () => {
      const status = await api.ddns.getStatus();
      expect(status).toBeDefined();
    });

    it('应该更新DDNS配置', async () => {
      const updated = await api.ddns.updateConfig({
        provider: 'cloudflare',
        domain: 'test.example.com',
        token: 'test-token'
      });

      expect(updated).toBeDefined();
    });

    it('应该更新DDNS', async () => {
      await api.ddns.updateDDNS();
    });

    it('应该获取DDNS历史记录', async () => {
      const history = await api.ddns.getHistory(10);
      expect(Array.isArray(history)).toBe(true);
    });

    it('应该记录DDNS操作到日志', async () => {
      await api.ddns.getStatus();

      const logs = logService.queryLogs({
        category: LogCategory.DDNS
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('NAS管理API集成', () => {
    it('应该获取NAS状态', async () => {
      const status = await api.nas.getStatus();
      expect(status).toBeDefined();
    });

    it('应该获取存储列表', async () => {
      const volumes = await api.nas.getVolumes();
      expect(volumes).toBeDefined();
    });

    it('应该获取共享列表', async () => {
      const shares = await api.nas.getShares();
      expect(Array.isArray(shares)).toBe(true);
    });

    it('应该切换共享状态', async () => {
      const shares = await api.nas.getShares();
      if (shares.length > 0) {
        await api.nas.toggleShare(shares[0].id);
      }
    });

    it('应该记录NAS操作到日志', async () => {
      await api.nas.getStatus();

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('邮件服务API集成', () => {
    it('应该获取邮件列表', async () => {
      const emails = await api.mail.getEmails();
      expect(Array.isArray(emails)).toBe(true);
    });

    it('应该发送邮件', async () => {
      await api.mail.sendEmail('test@example.com', '测试主题', '测试内容');
    });

    it('应该记录邮件操作到日志', async () => {
      await api.mail.getEmails();

      const logs = logService.queryLogs({
        category: LogCategory.EMAIL
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('LLM服务API集成', () => {
    it('应该发送消息', async () => {
      const message = await api.llm.sendMessage('测试消息');
      expect(message).toBeDefined();
    });

    it('应该获取模型列表', async () => {
      const models = await api.llm.getModels();
      expect(models).toBeDefined();
      expect(Array.isArray(models.models)).toBe(true);
    });

    it('应该记录LLM操作到日志', async () => {
      await api.llm.sendMessage('测试消息');

      const logs = logService.queryLogs({
        category: LogCategory.LLM
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('日志服务API集成', () => {
    it('应该获取日志列表', async () => {
      const logs = await api.logs.getLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it('应该清除日志', async () => {
      await api.logs.clearLogs();
    });
  });

  describe('跨服务集成测试', () => {
    it('应该在合理时间内完成批量API请求', async () => {
      const startTime = Date.now();

      await Promise.all([
        api.system.getStats(),
        api.frp.getConfigs(),
        api.nas.getStatus()
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });

  describe('错误处理集成测试', () => {
    it('应该正确处理API请求失败', async () => {
      await expect(api.frp.getConfigs()).rejects.toThrow();
    });

    it('应该记录API错误到日志', async () => {
      try {
        await api.frp.getConfigs();
      } catch {
        const logs = logService.queryLogs({
          level: LogLevel.ERROR
        });

        expect(logs.length).toBeGreaterThan(0);
      }
    });
  });

  describe('性能集成测试', () => {
    it('应该在合理时间内完成批量API请求', async () => {
      const startTime = Date.now();

      await Promise.all([
        api.system.getStats(),
        api.frp.getConfigs(),
        api.nas.getStatus()
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });
});
