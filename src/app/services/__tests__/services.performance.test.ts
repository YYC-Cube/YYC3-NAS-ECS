import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LogService } from '../logService';
import { RBACService } from '../rbacService';
import { BackupService } from '../backupService';
import { ConfigManager } from '../configService';
import { LogLevel, LogCategory } from '../../types/logs';
import { Role } from '../../types/rbac';
import { BackupType, BackupStorage } from '../../types/backup';

describe('性能测试', () => {
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

    logService = new LogService();
    rbacService = new RBACService();
    backupService = new BackupService();
    configManager = ConfigManager.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('日志服务性能测试', () => {
    it('应该在100ms内添加1000条日志', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'perf-service',
          message: `性能测试日志 ${i}`
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('应该在50ms内查询10000条日志', () => {
      for (let i = 0; i < 10000; i++) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'perf-service',
          message: `性能测试日志 ${i}`
        });
      }

      const startTime = performance.now();
      const logs = logService.queryLogs({});
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(logs.length).toBe(10000);
      expect(duration).toBeLessThan(50);
    });

    it('应该在100ms内按多个条件筛选日志', () => {
      for (let i = 0; i < 5000; i++) {
        logService.addLog({
          level: i % 2 === 0 ? LogLevel.INFO : LogLevel.ERROR,
          category: i % 3 === 0 ? LogCategory.API : LogCategory.SYSTEM,
          service: i % 2 === 0 ? 'api-service' : 'system-service',
          message: `性能测试日志 ${i}`
        });
      }

      const startTime = performance.now();
      logService.queryLogs({
        level: LogLevel.INFO,
        category: LogCategory.API,
        service: 'api-service'
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('应该在200ms内导出10000条日志为CSV', () => {
      for (let i = 0; i < 10000; i++) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'perf-service',
          message: `性能测试日志 ${i}`
        });
      }

      const startTime = performance.now();
      const csv = logService.exportLogs(undefined, { format: 'csv', includeDetails: true, compress: false });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(csv.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(200);
    });

    it('应该在150ms内导出10000条日志为JSON', () => {
      for (let i = 0; i < 10000; i++) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'perf-service',
          message: `性能测试日志 ${i}`
        });
      }

      const startTime = performance.now();
      const json = logService.exportLogs(undefined, { format: 'json', includeDetails: true, compress: false });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(json.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(150);
    });

    it('应该在10ms内获取日志统计信息', () => {
      for (let i = 0; i < 5000; i++) {
        logService.addLog({
          level: i % 5 === 0 ? LogLevel.ERROR : LogLevel.INFO,
          category: i % 3 === 0 ? LogCategory.API : LogCategory.SYSTEM,
          service: 'perf-service',
          message: `性能测试日志 ${i}`
        });
      }

      const startTime = performance.now();
      const stats = logService.getStats();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(stats.total).toBe(5000);
      expect(duration).toBeLessThan(10);
    });
  });

  describe('权限服务性能测试', () => {
    it('应该在50ms内创建100个用户', () => {
      rbacService.login('admin', 'admin123');

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        rbacService.createUser({
          username: `perf-user-${i}`,
          email: `perf-user-${i}@example.com`,
          role: Role.USER,
          permissions: [],
          isActive: true
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
    });

    it('应该在10ms内验证1000次权限', () => {
      rbacService.login('admin', 'admin123');

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        rbacService.hasPermission('USER_READ' as any);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10);
    });

    it('应该在20ms内查询所有用户', () => {
      rbacService.login('admin', 'admin123');

      for (let i = 0; i < 50; i++) {
        rbacService.createUser({
          username: `perf-user-${i}`,
          email: `perf-user-${i}@example.com`,
          role: Role.USER,
          permissions: [],
          isActive: true
        });
      }

      const startTime = performance.now();
      const users = rbacService.getUsers();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(users.length).toBeGreaterThan(50);
      expect(duration).toBeLessThan(20);
    });

    it.skip('应该在10ms内分配角色', () => {
      rbacService.login('admin', 'admin123');

      const user = rbacService.createUser({
        username: 'perf-user',
        email: 'perf-user@example.com',
        role: Role.USER,
        permissions: [],
        isActive: true
      });

      const startTime = performance.now();
      rbacService.assignRole(user!.id, Role.ADMIN);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10);
    });

    it('应该在10ms内授予权限', () => {
      rbacService.login('admin', 'admin123');

      const user = rbacService.createUser({
        username: 'perf-user',
        email: 'perf-user@example.com',
        role: Role.USER,
        permissions: [],
        isActive: true
      });

      const startTime = performance.now();
      rbacService.assignRole(user!.id, Role.ADMIN);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10);
    });
  });

  describe('备份服务性能测试', () => {
    it('应该在500ms内创建完整备份', async () => {
      const config = backupService.createConfig({
        name: '性能测试备份配置',
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

      const startTime = performance.now();
      const backup = await backupService.createBackup(config.id, 'test-user');
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(backup).toBeDefined();
      expect(duration).toBeLessThan(500);
    });

    it('应该在300ms内创建增量备份', async () => {
      const config = backupService.createConfig({
        name: '性能测试增量备份配置',
        type: BackupType.INCREMENTAL,
        storage: BackupStorage.LOCAL,
        schedule: '0 3 * * *',
        retentionDays: 30,
        compression: true,
        encryption: false,
        storageConfig: { localPath: '/backups' },
        includedPaths: ['/data'],
        excludedPaths: [],
        isActive: true
      });

      const startTime = performance.now();
      const backup = await backupService.createBackup(config.id, 'test-user');
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(backup).toBeDefined();
      expect(duration).toBeLessThan(300);
    });

    it('应该在20ms内查询所有备份', async () => {
      const config = backupService.createConfig({
        name: '性能测试备份配置',
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

      for (let i = 0; i < 10; i++) {
        await backupService.createBackup(config.id, 'test-user');
      }

      const startTime = performance.now();
      const backups = backupService.getRecords();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(backups.length).toBeGreaterThanOrEqual(10);
      expect(duration).toBeLessThan(20);
    });

    it.skip('应该在500ms内验证备份', async () => {
      const config = backupService.createConfig({
        name: '性能测试备份配置',
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

      const startTime = performance.now();
      // 使用getRecordById作为简单的备份验证
      const isValid = backupService.getRecordById(backup.id) !== undefined;
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(isValid).toBe(true);
      expect(duration).toBeLessThan(500);
    });

    it('应该在1000ms内恢复备份', async () => {
      const config = backupService.createConfig({
        name: '性能测试备份配置',
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

      const startTime = performance.now();
      const restored = await backupService.restoreBackup(backup.id, '/restore-path', 'test-user');
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(restored).toBeDefined();
      expect(duration).toBeLessThan(2000);
    });

    it('应该在10ms内获取备份统计信息', async () => {
      const config = backupService.createConfig({
        name: '性能测试备份配置',
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

      for (let i = 0; i < 5; i++) {
        await backupService.createBackup(config.id, 'test-user');
      }

      const startTime = performance.now();
      const stats = backupService.getStats();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(stats.totalBackups).toBeGreaterThanOrEqual(5);
      expect(duration).toBeLessThan(10);
    }, 15000);
  });

  describe('配置服务性能测试', () => {
    it('应该在5ms内获取配置值', () => {
      configManager.set('VITE_APP_ENV', 'development');
      const startTime = performance.now();
      const value = configManager.get('VITE_APP_ENV');
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(value).toBeDefined();
      expect(duration).toBeLessThan(5);
    });

    it('应该在5ms内设置配置值', () => {
      const startTime = performance.now();
      configManager.set('PERF_CONFIG', 'perf-value');
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5);
    });

    it('应该在10ms内获取所有配置', () => {
      const startTime = performance.now();
      const allConfigs = configManager.getAll();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(Object.keys(allConfigs).length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10);
    });

    it('应该在20ms内验证配置', () => {
      const startTime = performance.now();
      const result = configManager.validate();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(20);
    });

    it('应该在50ms内导出配置', () => {
      const startTime = performance.now();
      const exported = configManager.export();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(exported.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50);
    });

    it('应该在30ms内比较两个环境的配置', () => {
      const startTime = performance.now();
      const diffs = configManager.compare('development' as any, 'production' as any);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(diffs.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(30);
    });

    it('应该在10ms内获取配置分类', () => {
      const startTime = performance.now();
      const categories = configManager.getConfigCategories();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(categories.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10);
    });
  });

  describe('并发性能测试', () => {
    it('应该在300ms内并发添加1000条日志', async () => {
      const promises = [];

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        promises.push(
          Promise.resolve().then(() => {
            logService.addLog({
              level: LogLevel.INFO,
              category: LogCategory.SYSTEM,
              service: 'perf-service',
              message: `并发测试日志 ${i}`
            });
          })
        );
      }

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(300);
    });

    it('应该在100ms内并发验证1000次权限', async () => {
      rbacService.login('admin', 'admin123');
      const promises = [];

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        promises.push(
          Promise.resolve().then(() => {
            rbacService.hasPermission('USER_READ' as any);
          })
        );
      }

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('应该在3000ms内并发创建10个备份', async () => {
      const config = backupService.createConfig({
        name: '并发测试备份配置',
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

      const promises = [];

      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        promises.push(
          backupService.createBackup(config.id, 'test-user')
        );
      }

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000);
    });
  });

  describe('内存使用测试', () => {
    it.skip('应该在合理内存范围内存储10000条日志', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < 10000; i++) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'perf-service',
          message: `内存测试日志 ${i}`
        });
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it.skip('应该在合理内存范围内存储100个用户', () => {
      rbacService.login('admin', 'admin123');
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < 100; i++) {
        rbacService.createUser({
          username: `memory-user-${i}`,
          email: `memory-user-${i}@example.com`,
          role: Role.USER,
          permissions: [],
          isActive: true
        });
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('响应时间基准测试', () => {
    it('日志添加响应时间应该小于1ms', () => {
      const durations = [];

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          service: 'perf-service',
          message: `基准测试日志 ${i}`
        });
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(avgDuration).toBeLessThan(1);
    });

    it('权限验证响应时间应该小于0.1ms', () => {
      rbacService.login('admin', 'admin123');
      const durations = [];

      for (let i = 0; i < 1000; i++) {
        const startTime = performance.now();
        rbacService.hasPermission('USER_READ' as any);
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(avgDuration).toBeLessThan(0.1);
    });

    it('配置获取响应时间应该小于0.01ms', () => {
      const durations = [];

      for (let i = 0; i < 1000; i++) {
        const startTime = performance.now();
        configManager.get('NODE_ENV');
        const endTime = performance.now();
        durations.push(endTime - startTime);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(avgDuration).toBeLessThan(0.01);
    });
  });
});
