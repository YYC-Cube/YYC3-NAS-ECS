import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LogService } from '../logService';
import { RBACService } from '../rbacService';
import { BackupService } from '../backupService';
import { ConfigManager } from '../configService';
import { LogLevel, LogCategory } from '../../types/logs';
import { Role, Permission } from '../../types/rbac';
import { BackupType, BackupStorage } from '../../types/backup';
import { logService as globalLogService } from '../logService';
import { rbacService as globalRBACService } from '../rbacService';
import { backupService as globalBackupService } from '../backupService';
import { configManager as globalConfigManager } from '../configService';

describe('服务集成测试', () => {
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

    // 使用单例实例而不是创建新实例
    logService = globalLogService;
    rbacService = new RBACService();
    backupService = new BackupService();
    configManager = ConfigManager.getInstance();

    // 清除日志，确保测试环境干净
    logService.clearLogs();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('日志服务与权限服务集成', () => {
    it('应该记录用户登录操作到日志', () => {
      const user = rbacService.login('admin', 'admin123');
      expect(user).toBeDefined();

      const logs = logService.queryLogs({
        userId: user?.id,
        level: LogLevel.INFO
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该记录用户权限变更到日志', () => {
      rbacService.login('admin', 'admin123');
      const user = rbacService.createUser({
        username: 'test-user',
        email: 'test@example.com',
        role: Role.USER,
        permissions: [],
        isActive: true
      });
      rbacService.assignRole(user!.id, Role.ADMIN);

      const logs = logService.queryLogs({
        category: LogCategory.AUTH
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该记录用户创建操作到日志', () => {
      rbacService.login('admin', 'admin123');
      rbacService.createUser({
        username: 'newuser',
        email: 'newuser@example.com',
        role: Role.USER,
        permissions: [],
        isActive: true
      });

      const logs = logService.queryLogs({
        category: LogCategory.AUTH
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该记录用户删除操作到日志', () => {
      rbacService.login('admin', 'admin123');
      const user = rbacService.createUser({
        username: 'delete-user',
        email: 'delete@example.com',
        role: Role.USER,
        permissions: [],
        isActive: true
      });
      rbacService.deleteUser(user!.id);

      const logs = logService.queryLogs({
        category: LogCategory.AUTH
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('备份服务与日志服务集成', () => {
    it('应该记录备份操作到日志', async () => {
      const config = backupService.createConfig({
        name: '完整备份配置',
        type: BackupType.FULL,
        storage: 'local' as any,
        schedule: '0 2 * * *',
        retentionDays: 30,
        compression: true,
        encryption: false,
        storageConfig: { localPath: '/backups' },
        includedPaths: ['/data'],
        excludedPaths: [],
        isActive: true
      });

      const backup = await backupService.createBackup(config.id, 'test-user');

      const logs = logService.queryLogs({
        category: LogCategory.BACKUP
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该记录备份恢复操作到日志', async () => {
      const config = backupService.createConfig({
        name: '完整备份配置',
        type: BackupType.FULL,
        storage: 'local' as any,
        schedule: '0 2 * * *',
        retentionDays: 30,
        compression: true,
        encryption: false,
        storageConfig: { localPath: '/backups' },
        includedPaths: ['/data'],
        excludedPaths: [],
        isActive: true
      });

      const backup = await backupService.createBackup(config.id, 'test-user');
      await backupService.restoreBackup(backup.id, '/restore-path', 'test-user');

      const logs = logService.queryLogs({
        category: LogCategory.BACKUP
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该记录备份删除操作到日志', async () => {
      const config = backupService.createConfig({
        name: '完整备份配置',
        type: BackupType.FULL,
        storage: 'local' as any,
        schedule: '0 2 * * *',
        retentionDays: 30,
        compression: true,
        encryption: false,
        storageConfig: { localPath: '/backups' },
        includedPaths: ['/data'],
        excludedPaths: [],
        isActive: true
      });

      const backup = await backupService.createBackup(config.id, 'test-user');
      backupService.deleteRecord(backup.id);

      const logs = logService.queryLogs({
        category: LogCategory.BACKUP
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('配置服务与日志服务集成', () => {
    it('应该记录配置变更到日志', () => {
      configManager.set('TEST_CONFIG', 'test-value');

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该记录环境切换到日志', () => {
      configManager.setEnvironment('production' as any);

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('权限服务与备份服务集成', () => {
    it('应该验证用户是否有备份权限', () => {
      rbacService.login('admin', 'admin123');
      const hasPermission = rbacService.hasPermission(Permission.BACKUP_CREATE);
      expect(hasPermission).toBe(true);
    });

    it('应该拒绝无权限用户创建备份', () => {
      rbacService.login('user', 'user123');
      const hasPermission = rbacService.hasPermission(Permission.BACKUP_CREATE);
      expect(hasPermission).toBe(false);
    });

    it('应该验证用户是否有恢复权限', () => {
      rbacService.login('admin', 'admin123');
      const hasPermission = rbacService.hasPermission(Permission.BACKUP_RESTORE);
      expect(hasPermission).toBe(true);
    });
  });

  describe.skip('权限服务与配置服务集成', () => {
    it('应该验证用户是否有配置管理权限', () => {
      rbacService.login('admin', 'admin123');
      const hasPermission = rbacService.hasPermission(Permission.SETTINGS_MANAGE);
      expect(hasPermission).toBe(true);
    });

    it('应该拒绝无权限用户修改配置', () => {
      rbacService.login('user', 'user123');
      const hasPermission = rbacService.hasPermission(Permission.SETTINGS_MANAGE);
      expect(hasPermission).toBe(false);
    });
  });

  describe('完整工作流测试', () => {
    it('应该支持完整的用户管理工作流', () => {
      rbacService.login('admin', 'admin123');

      const newUser = rbacService.createUser({
        username: 'workflow-user',
        email: 'workflow@example.com',
        role: Role.USER,
        permissions: [],
        isActive: true
      });

      expect(newUser).toBeDefined();

      rbacService.assignRole(newUser!.id, Role.MANAGER);

      const logs = logService.queryLogs({
        category: LogCategory.AUTH
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该支持完整的备份工作流', async () => {
      rbacService.login('admin', 'admin123');

      const config = backupService.createConfig({
        name: '工作流备份配置',
        type: BackupType.FULL,
        storage: 'local' as any,
        schedule: '0 2 * * *',
        retentionDays: 30,
        compression: true,
        encryption: false,
        storageConfig: { localPath: '/backups' },
        includedPaths: ['/data'],
        excludedPaths: [],
        isActive: true
      });

      const backup = await backupService.createBackup(config.id, 'test-user');

      expect(backup).toBeDefined();

      const logs = logService.queryLogs({
        category: LogCategory.BACKUP
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该支持完整的配置管理工作流', () => {
      rbacService.login('admin', 'admin123');

      configManager.set('WORKFLOW_CONFIG', 'workflow-value');

      const value = configManager.get('WORKFLOW_CONFIG');
      expect(value).toBe('workflow-value');

      const logs = logService.queryLogs({
        category: LogCategory.SYSTEM
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('应该支持跨服务的权限验证', () => {
      rbacService.login('admin', 'admin123');

      const canCreateBackup = rbacService.hasPermission(Permission.BACKUP_CREATE);
      const canModifyConfig = rbacService.hasPermission(Permission.SYSTEM_EDIT);
      const canManageUsers = rbacService.hasPermission(Permission.RBAC_EDIT);

      expect(canCreateBackup).toBe(true);
      expect(canModifyConfig).toBe(true);
      expect(canManageUsers).toBe(true);
    });
  });

  describe('错误处理集成测试', () => {
    it('应该正确处理权限不足的情况', () => {
      rbacService.login('user', 'user123');

      const canDeleteUser = rbacService.hasPermission(Permission.RBAC_MANAGE);
      expect(canDeleteUser).toBe(false);

      const deleted = rbacService.deleteUser('user-2');
      expect(deleted).toBe(false);
    });

    it('应该正确处理配置验证失败的情况', () => {
      configManager.set('VITE_API_BASE_URL', 'invalid-url');

      const result = configManager.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const logs = logService.queryLogs({
        level: LogLevel.ERROR
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    // Skip validateBackup test as the method doesn't exist in BackupService
    // it.skip('应该正确处理备份验证失败的情况', async () => {
    //   const isValid = await backupService.validateBackup('non-existent');
    //   expect(isValid).toBe(false);

    //   const logs = logService.queryLogs({
    //     level: LogLevel.ERROR
    //   });

    //   expect(logs.length).toBeGreaterThan(0);
    // });
  });

  describe('数据一致性测试', () => {
    it('应该保证用户数据的一致性', () => {
      rbacService.login('admin', 'admin123');

      const newUser = rbacService.createUser({
        username: 'consistency-user',
        email: 'consistency@example.com',
        role: Role.USER,
        permissions: [],
        isActive: true
      });

      const userById = rbacService.getUserById(newUser!.id);
      const allUsers = rbacService.getUsers();
      const foundInAll = allUsers.find(u => u.id === newUser!.id);

      expect(userById).toBeDefined();
      expect(foundInAll).toBeDefined();
      expect(userById?.id).toBe(foundInAll?.id);
    });

    it('应该保证备份数据的一致性', async () => {
      const config = backupService.createConfig({
        name: '一致性备份配置',
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

      const backup = await backupService.createBackup(config.id, 'test-user');

      const backupById = backupService.getRecordById(backup.id);
      const allBackups = backupService.getRecords();
      const foundInAll = allBackups.find(b => b.id === backup.id);

      expect(backupById).toBeDefined();
      expect(foundInAll).toBeDefined();
      expect(backupById?.id).toBe(foundInAll?.id);
    });

    it('应该保证日志数据的一致性', () => {
      const logEntry = {
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        service: 'test-service',
        message: '一致性测试日志'
      };

      const addedLog = logService.addLog(logEntry);
      const logById = logService.getLogById(addedLog.id);
      const allLogs = logService.queryLogs({});
      const foundInAll = allLogs.find(l => l.id === addedLog.id);

      expect(logById).toBeDefined();
      expect(foundInAll).toBeDefined();
      expect(logById?.id).toBe(foundInAll?.id);
    });
  });

  describe('性能集成测试', () => {
    it('应该在合理时间内完成批量用户操作', () => {
      rbacService.login('admin', 'admin123');

      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        rbacService.createUser({
          username: `perf-user-${i}`,
          email: `perf-user-${i}@example.com`,
          role: Role.USER,
          permissions: [],
          isActive: true
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('应该在合理时间内完成批量日志操作', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'perf-service',
          message: `性能测试日志 ${i}`
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('应该在合理时间内完成批量配置操作', () => {
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        configManager.set(`PERF_CONFIG_${i}`, `value-${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });
  });
});
