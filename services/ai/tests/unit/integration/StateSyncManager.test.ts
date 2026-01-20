/**
 * @file 状态同步管理器测试
 * @description 测试StateSyncManager及其组件的功能
 * @module tests/unit/integration/StateSyncManager.test.ts
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-01-07
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  StateSyncManager,
  StateSyncConfig,
  SyncMode,
  SyncResult,
  SyncStatus,
  ConflictResolutionStrategy,
  StateSnapshot
} from '@/integration/StateSyncManager';

describe('StateSyncManager', () => {
  let manager: StateSyncManager;
  let config: StateSyncConfig;

  beforeEach(() => {
    config = {
      enableAutoSync: true,
      syncInterval: 1000,
      conflictResolution: ConflictResolutionStrategy.LAST_WRITE_WINS,
      enableHistory: true,
      maxHistorySize: 100,
      enableCompression: false
    };
    manager = new StateSyncManager(config);
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  describe('initialize', () => {
    it('应该成功初始化管理器', async () => {
      await expect(manager.initialize()).resolves.not.toThrow();
    });

    it('应该初始化所有组件', async () => {
      await manager.initialize();

      const stateStore = (manager as any).stateStore;
      const conflictResolver = (manager as any).conflictResolver;
      const syncScheduler = (manager as any).syncScheduler;

      expect(stateStore).toBeDefined();
      expect(conflictResolver).toBeDefined();
      expect(syncScheduler).toBeDefined();
    });

    it('应该启动自动同步调度器', async () => {
      await manager.initialize();

      const syncScheduler = (manager as any).syncScheduler;
      expect(syncScheduler.isRunning()).toBe(true);
    });
  });

  describe('registerModule', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该成功注册模块', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'test' })),
        setState: vi.fn()
      };

      await expect(manager.registerModule('test-module', mockModule)).resolves.not.toThrow();
    });

    it('应该为注册的模块创建状态存储', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'test' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);

      const state = await manager.getModuleState('test-module');
      expect(state).toEqual({ value: 'test' });
    });

    it('应该拒绝重复注册相同模块', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'test' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);

      await expect(manager.registerModule('test-module', mockModule)).rejects.toThrow();
    });
  });

  describe('unregisterModule', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该成功注销模块', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'test' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);
      await expect(manager.unregisterModule('test-module')).resolves.not.toThrow();
    });

    it('应该清除模块的状态存储', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'test' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);
      await manager.unregisterModule('test-module');

      const state = await manager.getModuleState('test-module');
      expect(state).toBeNull();
    });

    it('应该处理不存在的模块', async () => {
      await expect(manager.unregisterModule('non-existent')).resolves.not.toThrow();
    });
  });

  describe('sync', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该成功同步两个模块的状态', async () => {
      const sourceModule = {
        getState: vi.fn(() => ({ value: 'source' })),
        setState: vi.fn()
      };

      const targetModule = {
        getState: vi.fn(() => ({ value: 'target' })),
        setState: vi.fn()
      };

      await manager.registerModule('source', sourceModule);
      await manager.registerModule('target', targetModule);

      const result = await manager.sync('source', 'target');

      expect(result.success).toBe(true);
      expect(result.status).toBe(SyncStatus.COMPLETED);
      expect(targetModule.setState).toHaveBeenCalledWith({ value: 'source' });
    });

    it('应该处理同步冲突', async () => {
      const sourceModule = {
        getState: vi.fn(() => ({ value: 'source', version: 2 })),
        setState: vi.fn()
      };

      const targetModule = {
        getState: vi.fn(() => ({ value: 'target', version: 3 })),
        setState: vi.fn()
      };

      await manager.registerModule('source', sourceModule);
      await manager.registerModule('target', targetModule);

      const result = await manager.sync('source', 'target');

      expect(result.success).toBe(true);
      expect(result.conflictDetected).toBe(true);
    });

    it('应该使用LAST_WRITE_WINS策略解决冲突', async () => {
      const sourceModule = {
        getState: vi.fn(() => ({ value: 'source', version: 2 })),
        setState: vi.fn()
      };

      const targetModule = {
        getState: vi.fn(() => ({ value: 'target', version: 3 })),
        setState: vi.fn()
      };

      await manager.registerModule('source', sourceModule);
      await manager.registerModule('target', targetModule);

      await manager.sync('source', 'target');

      expect(targetModule.setState).toHaveBeenCalledWith({ value: 'target', version: 3 });
    });

    it('应该使用FIRST_WRITE_WINS策略解决冲突', async () => {
      const managerWithFirstWrite = new StateSyncManager({
        ...config,
        conflictResolution: ConflictResolutionStrategy.FIRST_WRITE_WINS
      });

      await managerWithFirstWrite.initialize();

      const sourceModule = {
        getState: vi.fn(() => ({ value: 'source', version: 2 })),
        setState: vi.fn()
      };

      const targetModule = {
        getState: vi.fn(() => ({ value: 'target', version: 3 })),
        setState: vi.fn()
      };

      await managerWithFirstWrite.registerModule('source', sourceModule);
      await managerWithFirstWrite.registerModule('target', targetModule);

      await managerWithFirstWrite.sync('source', 'target');

      expect(targetModule.setState).toHaveBeenCalledWith({ value: 'source', version: 2 });

      await managerWithFirstWrite.shutdown();
    });

    it('应该记录同步历史', async () => {
      const sourceModule = {
        getState: vi.fn(() => ({ value: 'source' })),
        setState: vi.fn()
      };

      const targetModule = {
        getState: vi.fn(() => ({ value: 'target' })),
        setState: vi.fn()
      };

      await manager.registerModule('source', sourceModule);
      await manager.registerModule('target', targetModule);

      await manager.sync('source', 'target');

      const history = await manager.getSyncHistory('source', 'target');
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('syncAll', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该同步所有注册的模块', async () => {
      const modules = ['module1', 'module2', 'module3'].map(name => ({
        getState: vi.fn(() => ({ value: name })),
        setState: vi.fn()
      }));

      for (let i = 0; i < modules.length; i++) {
        await manager.registerModule(`module${i + 1}`, modules[i]);
      }

      const results = await manager.syncAll();

      expect(results.length).toBe(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('应该返回所有同步结果', async () => {
      const modules = ['module1', 'module2'].map(name => ({
        getState: vi.fn(() => ({ value: name })),
        setState: vi.fn()
      }));

      for (let i = 0; i < modules.length; i++) {
        await manager.registerModule(`module${i + 1}`, modules[i]);
      }

      const results = await manager.syncAll();

      expect(results).toHaveLength(2);
      expect(results[0].sourceModule).toBeDefined();
      expect(results[0].targetModule).toBeDefined();
    });
  });

  describe('getModuleState', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该返回模块的当前状态', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'test' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);

      const state = await manager.getModuleState('test-module');

      expect(state).toEqual({ value: 'test' });
    });

    it('应该为不存在的模块返回null', async () => {
      const state = await manager.getModuleState('non-existent');

      expect(state).toBeNull();
    });
  });

  describe('setModuleState', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该成功设置模块状态', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'old' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);

      await expect(manager.setModuleState('test-module', { value: 'new' })).resolves.not.toThrow();
      expect(mockModule.setState).toHaveBeenCalledWith({ value: 'new' });
    });

    it('应该更新状态存储', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'old' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);
      await manager.setModuleState('test-module', { value: 'new' });

      const state = await manager.getModuleState('test-module');
      expect(state).toEqual({ value: 'new' });
    });
  });

  describe('createSnapshot', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该创建所有模块的状态快照', async () => {
      const modules = ['module1', 'module2'].map(name => ({
        getState: vi.fn(() => ({ value: name })),
        setState: vi.fn()
      }));

      for (let i = 0; i < modules.length; i++) {
        await manager.registerModule(`module${i + 1}`, modules[i]);
      }

      const snapshot = await manager.createSnapshot();

      expect(snapshot).toBeDefined();
      expect(snapshot.modules).toBeDefined();
      expect(Object.keys(snapshot.modules).length).toBe(2);
      expect(snapshot.timestamp).toBeInstanceOf(Date);
    });

    it('应该包含所有模块的状态', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'test' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);

      const snapshot = await manager.createSnapshot();

      expect(snapshot.modules['test-module']).toEqual({ value: 'test' });
    });
  });

  describe('restoreSnapshot', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该成功恢复快照', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'current' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);

      const snapshot: StateSnapshot = {
        modules: {
          'test-module': { value: 'restored' }
        },
        timestamp: new Date()
      };

      await expect(manager.restoreSnapshot(snapshot)).resolves.not.toThrow();
      expect(mockModule.setState).toHaveBeenCalledWith({ value: 'restored' });
    });

    it('应该更新所有模块的状态', async () => {
      const modules = ['module1', 'module2'].map(name => ({
        getState: vi.fn(() => ({ value: 'current' })),
        setState: vi.fn()
      }));

      for (let i = 0; i < modules.length; i++) {
        await manager.registerModule(`module${i + 1}`, modules[i]);
      }

      const snapshot: StateSnapshot = {
        modules: {
          'module1': { value: 'restored1' },
          'module2': { value: 'restored2' }
        },
        timestamp: new Date()
      };

      await manager.restoreSnapshot(snapshot);

      expect(modules[0].setState).toHaveBeenCalledWith({ value: 'restored1' });
      expect(modules[1].setState).toHaveBeenCalledWith({ value: 'restored2' });
    });
  });

  describe('getSyncHistory', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该返回同步历史', async () => {
      const sourceModule = {
        getState: vi.fn(() => ({ value: 'source' })),
        setState: vi.fn()
      };

      const targetModule = {
        getState: vi.fn(() => ({ value: 'target' })),
        setState: vi.fn()
      };

      await manager.registerModule('source', sourceModule);
      await manager.registerModule('target', targetModule);

      await manager.sync('source', 'target');
      await manager.sync('source', 'target');

      const history = await manager.getSyncHistory('source', 'target');

      expect(history.length).toBe(2);
      expect(history[0].sourceModule).toBe('source');
      expect(history[0].targetModule).toBe('target');
    });

    it('应该限制历史记录数量', async () => {
      const managerWithSmallHistory = new StateSyncManager({
        ...config,
        maxHistorySize: 2
      });

      await managerWithSmallHistory.initialize();

      const sourceModule = {
        getState: vi.fn(() => ({ value: 'source' })),
        setState: vi.fn()
      };

      const targetModule = {
        getState: vi.fn(() => ({ value: 'target' })),
        setState: vi.fn()
      };

      await managerWithSmallHistory.registerModule('source', sourceModule);
      await managerWithSmallHistory.registerModule('target', targetModule);

      for (let i = 0; i < 5; i++) {
        await managerWithSmallHistory.sync('source', 'target');
      }

      const history = await managerWithSmallHistory.getSyncHistory('source', 'target');

      expect(history.length).toBeLessThanOrEqual(2);

      await managerWithSmallHistory.shutdown();
    });
  });

  describe('getMetrics', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该返回所有指标', async () => {
      const sourceModule = {
        getState: vi.fn(() => ({ value: 'source' })),
        setState: vi.fn()
      };

      const targetModule = {
        getState: vi.fn(() => ({ value: 'target' })),
        setState: vi.fn()
      };

      await manager.registerModule('source', sourceModule);
      await manager.registerModule('target', targetModule);

      await manager.sync('source', 'target');

      const metrics = await manager.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalSyncs).toBe(1);
      expect(metrics.successfulSyncs).toBe(1);
      expect(metrics.failedSyncs).toBe(0);
    });

    it('应该包含模块统计信息', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'test' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);

      const metrics = await manager.getMetrics();

      expect(metrics.registeredModules).toBe(1);
    });
  });

  describe('resetMetrics', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该重置所有指标', async () => {
      const sourceModule = {
        getState: vi.fn(() => ({ value: 'source' })),
        setState: vi.fn()
      };

      const targetModule = {
        getState: vi.fn(() => ({ value: 'target' })),
        setState: vi.fn()
      };

      await manager.registerModule('source', sourceModule);
      await manager.registerModule('target', targetModule);

      await manager.sync('source', 'target');
      await manager.resetMetrics();

      const metrics = await manager.getMetrics();

      expect(metrics.totalSyncs).toBe(0);
      expect(metrics.successfulSyncs).toBe(0);
      expect(metrics.failedSyncs).toBe(0);
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it('应该成功关闭管理器', async () => {
      await expect(manager.shutdown()).resolves.not.toThrow();
    });

    it('应该停止自动同步调度器', async () => {
      await manager.shutdown();

      const syncScheduler = (manager as any).syncScheduler;
      expect(syncScheduler.isRunning()).toBe(false);
    });

    it('应该清除所有注册的模块', async () => {
      const mockModule = {
        getState: vi.fn(() => ({ value: 'test' })),
        setState: vi.fn()
      };

      await manager.registerModule('test-module', mockModule);
      await manager.shutdown();

      const state = await manager.getModuleState('test-module');
      expect(state).toBeNull();
    });
  });
});
