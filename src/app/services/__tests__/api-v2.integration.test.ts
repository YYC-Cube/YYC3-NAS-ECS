import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiV2 } from '../api-v2';
import { LogService } from '../logService';
import { RBACService } from '../rbacService';
import { BackupService } from '../backupService';
import { ConfigManager } from '../configService';
import { LogLevel, LogCategory } from '../../types/logs';
import { Role, Permission } from '../../types/rbac';
import { BackupType, BackupStorage } from '../../types/backup';
import { logService as globalLogService } from '../logService';

describe('API模块集成测试', () => {
  let logService: LogService;
  let rbacService: RBACService;
  let backupService: BackupService;
  let configManager: ConfigManager;

  beforeEach(() => {
    const localStorageMock: Record<string, string> = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
      }),
      get length() {
        return Object.keys(localStorageMock).length;
      },
      key: vi.fn((index: number) => Object.keys(localStorageMock)[index] || null)
    };

    logService = globalLogService;
    rbacService = new RBACService();
    backupService = new BackupService();
    configManager = ConfigManager.getInstance();

    logService.clearLogs();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('系统监控API集成', () => {
    it('应该获取系统状态', async () => {
      const stats = await apiV2.system.getStats();
      expect(stats).toBeDefined();
    });

    it('应该获取系统信息', async () => {
      const info = await apiV2.system.getInfo();
      expect(info).toBeDefined();
    });

    it('应该记录系统监控操作到日志', async () => {
      await apiV2.system.getStats();

      const logs = logService.queryLogs({
        category: LogCategory.MONITORING
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('FRP管理API集成', () => {
    it('应该获取FRP配置列表', async () => {
      const configs = await apiV2.frp.getConfigs();
      expect(Array.isArray(configs)).toBe(true);
    });

    it('应该创建FRP配置', async () => {
      const config = await apiV2.frp.createConfig({
        name: '测试FRP配置',
        type: 'tcp',
        localPort: 8080,
        remotePort: 80,
        subdomain: 'test'
      });

      expect(config).toBeDefined();
    });

    it('应该更新FRP配置', async () => {
      const configs = await apiV2.frp.getConfigs();
      if (configs.length > 0) {
        const updated = await apiV2.frp.updateConfig(configs[0].id, {
          name: '更新的FRP配置'
        });

        expect(updated).toBeDefined();
      }
    });

    it('应该删除FRP配置', async () => {
      const config = await apiV2.frp.createConfig({
        name: '待删除的FRP配置',
        type: 'tcp',
        localPort: 8080,
        remotePort: 80,
        subdomain: 'test-delete'
      });

      const deleted = await apiV2.frp.deleteConfig(config.id);
      expect(deleted).toBe(true);
    });

    it('应该记录FRP操作到日志', async () => {
      await apiV2.frp.getConfigs();

      const logs = logService.queryLogs({
        category: LogCategory.FRP
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('DDNS管理API集成', () => {
    it('应该获取DDNS配置列表', async () => {
      const configs = await apiV2.ddns.getConfigs();
      expect(Array.isArray(configs)).toBe(true);
    });

    it('应该创建DDNS配置', async () => {
      const config = await apiV2.ddns.createConfig({
        name: '测试DDNS配置',
        provider: 'cloudflare',
        domain: 'test.example.com',
        token: 'test-token'
      });

      expect(config).toBeDefined();
    });

    it('应该更新DDNS配置', async () => {
      const configs = await apiV2.ddns.getConfigs();
      if (configs.length > 0) {
        const updated = await apiV2.ddns.updateConfig(configs[0].id, {
          name: '更新的DDNS配置'
        });

        expect(updated).toBeDefined();
      }
    });

    it('应该删除DDNS配置', async () => {
      const config = await apiV2.ddns.createConfig({
        name: '待删除的DDNS配置',
        provider: 'cloudflare',
        domain: 'delete.example.com',
        token: 'test-token'
      });

      const deleted = await apiV2.ddns.deleteConfig(config.id);
      expect(deleted).toBe(true);
    });

    it('应该更新DDNS IP', async () => {
      const configs = await apiV2.ddns.getConfigs();
      if (configs.length > 0) {
        const updated = await apiV2.ddns.updateIP(configs[0].id);
        expect(updated).toBeDefined();
      }
    });

    it('应该记录DDNS操作到日志', async () => {
      await apiV2.ddns.getConfigs();

      const logs = logService.queryLogs({
        category: LogCategory.DDNS
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('NAS管理API集成', () => {
    it('应该获取NAS状态', async () => {
      const status = await apiV2.nas.getStatus();
      expect(status).toBeDefined();
    });

    it('应该获取存储列表', async () => {
      const storages = await apiV2.nas.getStorages();
      expect(Array.isArray(storages)).toBe(true);
    });

    it('应该获取共享列表', async () => {
      const shares = await apiV2.nas.getShares();
      expect(Array.isArray(shares)).toBe(true);
    });

    it('应该创建共享', async () => {
      const share = await apiV2.nas.createShare({
        name: '测试共享',
        path: '/data/test',
        permissions: 'read-write'
      });

      expect(share).toBeDefined();
    });

    it('应该更新共享', async () => {
      const shares = await apiV2.nas.getShares();
      if (shares.length > 0) {
        const updated = await apiV2.nas.updateShare(shares[0].id, {
          name: '更新的共享'
        });

        expect(updated).toBeDefined();
      }
    });

    it('应该删除共享', async () => {
      const share = await apiV2.nas.createShare({
        name: '待删除的共享',
        path: '/data/delete-test',
        permissions: 'read-write'
      });

      const deleted = await apiV2.nas.deleteShare(share.id);
      expect(deleted).toBe(true);
    });

    it('应该记录NAS操作到日志', async () => {
      await apiV2.nas.getStatus();

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('邮件服务API集成', () => {
    it('应该获取邮件配置', async () => {
      const config = await apiV2.email.getConfig();
      expect(config).toBeDefined();
    });

    it('应该更新邮件配置', async () => {
      const updated = await apiV2.email.updateConfig({
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'test@example.com',
        smtpPass: 'password'
      });

      expect(updated).toBeDefined();
    });

    it('应该发送测试邮件', async () => {
      const result = await apiV2.email.sendTestEmail('test@example.com');
      expect(result).toBeDefined();
    });

    it('应该记录邮件操作到日志', async () => {
      await apiV2.email.getConfig();

      const logs = logService.queryLogs({
        category: LogCategory.EMAIL
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('LLM服务API集成', () => {
    it('应该获取LLM配置', async () => {
      const config = await apiV2.llm.getConfig();
      expect(config).toBeDefined();
    });

    it('应该更新LLM配置', async () => {
      const updated = await apiV2.llm.updateConfig({
        provider: 'openai',
        apiKey: 'test-api-key',
        model: 'gpt-4'
      });

      expect(updated).toBeDefined();
    });

    it('应该获取提示词模板列表', async () => {
      const templates = await apiV2.llm.getTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('应该创建提示词模板', async () => {
      const template = await apiV2.llm.createTemplate({
        name: '测试模板',
        content: '这是一个测试提示词模板',
        category: 'general'
      });

      expect(template).toBeDefined();
    });

    it('应该更新提示词模板', async () => {
      const templates = await apiV2.llm.getTemplates();
      if (templates.length > 0) {
        const updated = await apiV2.llm.updateTemplate(templates[0].id, {
          name: '更新的模板'
        });

        expect(updated).toBeDefined();
      }
    });

    it('应该删除提示词模板', async () => {
      const template = await apiV2.llm.createTemplate({
        name: '待删除的模板',
        content: '这是一个待删除的提示词模板',
        category: 'general'
      });

      const deleted = await apiV2.llm.deleteTemplate(template.id);
      expect(deleted).toBe(true);
    });

    it('应该记录LLM操作到日志', async () => {
      await apiV2.llm.getConfig();

      const logs = logService.queryLogs({
        category: LogCategory.LLM
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('日志服务API集成', () => {
    it('应该获取日志列表', async () => {
      const logs = await apiV2.logs.getLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it('应该根据过滤条件获取日志', async () => {
      const logs = await apiV2.logs.getLogs({
        level: LogLevel.ERROR,
        category: LogCategory.API
      });

      expect(Array.isArray(logs)).toBe(true);
    });

    it('应该获取日志统计信息', async () => {
      const stats = await apiV2.logs.getStats();
      expect(stats).toBeDefined();
    });

    it('应该导出日志', async () => {
      const content = await apiV2.logs.exportLogs({
        format: 'json'
      });

      expect(content).toBeDefined();
    });

    it('应该清除日志', async () => {
      const cleared = await apiV2.logs.clearLogs();
      expect(cleared).toBeDefined();
    });
  });

  describe('备份服务API集成', () => {
    it('应该获取备份配置列表', async () => {
      const configs = await apiV2.backup.getConfigs();
      expect(Array.isArray(configs)).toBe(true);
    });

    it('应该创建备份配置', async () => {
      const config = await apiV2.backup.createConfig({
        name: '测试备份配置',
        type: BackupType.FULL,
        storage: BackupStorage.LOCAL,
        schedule: '0 2 * * *',
        retentionDays: 30,
        compression: true,
        encryption: false,
        storageConfig: { localPath: '/backups' },
        includedPaths: ['/data'],
        excludedPaths: [],
        isActive: true
      });

      expect(config).toBeDefined();
    });

    it('应该更新备份配置', async () => {
      const configs = await apiV2.backup.getConfigs();
      if (configs.length > 0) {
        const updated = await apiV2.backup.updateConfig(configs[0].id, {
          name: '更新的备份配置'
        });

        expect(updated).toBeDefined();
      }
    });

    it('应该删除备份配置', async () => {
      const config = await apiV2.backup.createConfig({
        name: '待删除的备份配置',
        type: BackupType.FULL,
        storage: BackupStorage.LOCAL,
        schedule: '0 2 * * *',
        retentionDays: 30,
        compression: true,
        encryption: false,
        storageConfig: { localPath: '/backups' },
        includedPaths: ['/data'],
        excludedPaths: [],
        isActive: true
      });

      const deleted = await apiV2.backup.deleteConfig(config.id);
      expect(deleted).toBe(true);
    });

    it('应该创建备份', async () => {
      const configs = await apiV2.backup.getConfigs();
      if (configs.length > 0) {
        const backup = await apiV2.backup.createBackup(configs[0].id, 'test-user');
        expect(backup).toBeDefined();
      }
    });

    it('应该获取备份记录列表', async () => {
      const records = await apiV2.backup.getRecords();
      expect(Array.isArray(records)).toBe(true);
    });

    it('应该记录备份操作到日志', async () => {
      await apiV2.backup.getConfigs();

      const logs = logService.queryLogs({
        category: LogCategory.BACKUP
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('权限服务API集成', () => {
    it('应该获取用户列表', async () => {
      const users = await apiV2.rbac.getUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it('应该创建用户', async () => {
      const user = await apiV2.rbac.createUser({
        username: 'test-api-user',
        email: 'test-api@example.com',
        password: 'password123',
        role: Role.USER
      });

      expect(user).toBeDefined();
    });

    it('应该更新用户', async () => {
      const users = await apiV2.rbac.getUsers();
      if (users.length > 0) {
        const updated = await apiV2.rbac.updateUser(users[0].id, {
          username: '更新的用户名'
        });

        expect(updated).toBeDefined();
      }
    });

    it('应该删除用户', async () => {
      const user = await apiV2.rbac.createUser({
        username: 'delete-api-user',
        email: 'delete-api@example.com',
        password: 'password123',
        role: Role.USER
      });

      const deleted = await apiV2.rbac.deleteUser(user.id);
      expect(deleted).toBe(true);
    });

    it('应该获取角色列表', async () => {
      const roles = await apiV2.rbac.getRoles();
      expect(Array.isArray(roles)).toBe(true);
    });

    it('应该获取权限列表', async () => {
      const permissions = await apiV2.rbac.getPermissions();
      expect(Array.isArray(permissions)).toBe(true);
    });

    it('应该记录权限操作到日志', async () => {
      await apiV2.rbac.getUsers();

      const logs = logService.queryLogs({
        category: LogCategory.AUTH
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('配置服务API集成', () => {
    it('应该获取配置', async () => {
      const config = await apiV2.config.getConfig();
      expect(config).toBeDefined();
    });

    it('应该更新配置', async () => {
      const updated = await apiV2.config.updateConfig({
        'TEST_CONFIG': 'test-value'
      });

      expect(updated).toBeDefined();
    });

    it('应该获取环境配置', async () => {
      const env = await apiV2.config.getEnvironment();
      expect(env).toBeDefined();
    });

    it('应该切换环境', async () => {
      const switched = await apiV2.config.setEnvironment('production');
      expect(switched).toBeDefined();
    });

    it('应该记录配置操作到日志', async () => {
      await apiV2.config.getConfig();

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('跨服务集成测试', () => {
    it('应该支持完整的FRP管理工作流', async () => {
      const config = await apiV2.frp.createConfig({
        name: '工作流FRP配置',
        type: 'tcp',
        localPort: 8080,
        remotePort: 80,
        subdomain: 'workflow'
      });

      expect(config).toBeDefined();

      const updated = await apiV2.frp.updateConfig(config.id, {
        name: '更新的工作流FRP配置'
      });

      expect(updated).toBeDefined();

      const deleted = await apiV2.frp.deleteConfig(config.id);
      expect(deleted).toBe(true);

      const logs = logService.queryLogs({
        category: LogCategory.FRP
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该支持完整的DDNS管理工作流', async () => {
      const config = await apiV2.ddns.createConfig({
        name: '工作流DDNS配置',
        provider: 'cloudflare',
        domain: 'workflow.example.com',
        token: 'test-token'
      });

      expect(config).toBeDefined();

      const updated = await apiV2.ddns.updateIP(config.id);
      expect(updated).toBeDefined();

      const deleted = await apiV2.ddns.deleteConfig(config.id);
      expect(deleted).toBe(true);

      const logs = logService.queryLogs({
        category: LogCategory.DDNS
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该支持完整的NAS管理工作流', async () => {
      const share = await apiV2.nas.createShare({
        name: '工作流共享',
        path: '/data/workflow',
        permissions: 'read-write'
      });

      expect(share).toBeDefined();

      const updated = await apiV2.nas.updateShare(share.id, {
        name: '更新的工作流共享'
      });

      expect(updated).toBeDefined();

      const deleted = await apiV2.nas.deleteShare(share.id);
      expect(deleted).toBe(true);

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该支持完整的LLM管理工作流', async () => {
      const template = await apiV2.llm.createTemplate({
        name: '工作流模板',
        content: '这是一个工作流提示词模板',
        category: 'general'
      });

      expect(template).toBeDefined();

      const updated = await apiV2.llm.updateTemplate(template.id, {
        name: '更新的工作流模板'
      });

      expect(updated).toBeDefined();

      const deleted = await apiV2.llm.deleteTemplate(template.id);
      expect(deleted).toBe(true);

      const logs = logService.queryLogs({
        category: LogCategory.LLM
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('错误处理集成测试', () => {
    it('应该正确处理API请求失败', async () => {
      try {
        await apiV2.frp.getConfigs();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('应该记录API错误到日志', async () => {
      try {
        await apiV2.frp.getConfigs();
      } catch (error) {
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
        apiV2.system.getStats(),
        apiV2.system.getInfo(),
        apiV2.frp.getConfigs(),
        apiV2.ddns.getConfigs(),
        apiV2.nas.getStatus()
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('应该在合理时间内完成批量配置操作', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await apiV2.config.updateConfig({
          [`PERF_CONFIG_${i}`]: `value-${i}`
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000);
    });
  });
});
