/**
 * @file 模块集成接口测试
 * @description 测试ModuleIntegrationInterface和BaseModule的功能
 * @module tests/unit/integration/ModuleIntegrationInterface.test.ts
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-01-07
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ModuleIntegrationInterface,
  BaseModule,
  ModuleConfig,
  InitializationResult,
  DataTransferResult,
  DataProcessingResult,
  StateSyncResult,
  ModuleEvent,
  EventHandler,
  HealthCheckResult,
  ShutdownResult,
  ModuleStatus
} from '@/integration/ModuleIntegrationInterface';

class TestModule extends BaseModule {
  constructor(config: ModuleConfig) {
    super(config);
  }

  get moduleType(): string {
    return 'TestModule';
  }

  get version(): string {
    return '1.0.0';
  }

  get capabilities(): string[] {
    return ['test', 'demo'];
  }

  protected async initializeInternal(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  protected async validateDependencies(): Promise<void> {
    if (!this.config.dependencies) {
      return;
    }
    for (const dep of this.config.dependencies) {
      if (!this.dependencies.has(dep)) {
        throw new Error(`依赖模块 ${dep} 未找到`);
      }
    }
  }

  async receiveData(sourceModule: string, data: any): Promise<DataProcessingResult> {
    this.metrics.dataReceived++;
    this.metrics.lastActivity = new Date();
    
    return {
      success: true,
      processedData: data,
      processingTime: 10,
      metadata: {
        sourceModule,
        processedAt: new Date()
      }
    };
  }

  protected async getCurrentState(): Promise<any> {
    return {
      initialized: this.initialized,
      status: this.status,
      metrics: this.getMetrics()
    };
  }

  protected async shutdownInternal(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

describe('ModuleIntegrationInterface', () => {
  let module: TestModule;
  let config: ModuleConfig;

  beforeEach(() => {
    config = {
      name: 'test-module',
      version: '1.0.0',
      dependencies: []
    };
    module = new TestModule(config);
  });

  describe('initialize', () => {
    it('应该成功初始化模块', async () => {
      const result = await module.initialize(config);

      expect(result.success).toBe(true);
      expect(result.message).toContain('初始化成功');
      expect(result.initializedAt).toBeInstanceOf(Date);
    });

    it('应该设置初始化状态', async () => {
      await module.initialize(config);

      expect((module as any).initialized).toBe(true);
    });

    it('应该处理依赖验证失败', async () => {
      const configWithDeps: ModuleConfig = {
        ...config,
        dependencies: ['non-existent-module']
      };

      const result = await module.initialize(configWithDeps);

      expect(result.success).toBe(false);
      expect(result.message).toContain('初始化失败');
    });

    it('应该支持自定义配置', async () => {
      const customConfig: ModuleConfig = {
        ...config,
        settings: {
          timeout: 5000,
          maxRetries: 3
        }
      };

      const result = await module.initialize(customConfig);

      expect(result.success).toBe(true);
      expect((module as any).config.settings).toEqual(customConfig.settings);
    });
  });

  describe('sendData', () => {
    let targetModule: TestModule;

    beforeEach(async () => {
      await module.initialize(config);
      targetModule = new TestModule({ name: 'target-module', version: '1.0.0', dependencies: [] });
      await targetModule.initialize({ name: 'target-module', version: '1.0.0', dependencies: [] });

      module.addDependency('target-module', targetModule);
    });

    it('应该成功发送数据到目标模块', async () => {
      const testData = { message: 'test' };

      const result = await module.sendData('target-module', testData);

      expect(result.success).toBe(true);
      expect(result.targetModule).toBe('target-module');
      expect(result.transferTime).toBeGreaterThanOrEqual(0);
    });

    it('应该处理未初始化的模块', async () => {
      const uninitializedModule = new TestModule({ name: 'uninit', version: '1.0.0', dependencies: [] });

      await expect(
        uninitializedModule.sendData('target-module', { data: 'test' })
      ).rejects.toThrow('模块未初始化');
    });

    it('应该处理不存在的目标模块', async () => {
      await expect(
        module.sendData('non-existent', { data: 'test' })
      ).rejects.toThrow('目标模块不存在');
    });

    it('应该记录传输指标', async () => {
      const testData = { message: 'test' };

      await module.sendData('target-module', testData);

      const metrics = module.getMetrics();
      expect(metrics.dataTransfers).toBe(1);
    });
  });

  describe('receiveData', () => {
    beforeEach(async () => {
      await module.initialize(config);
    });

    it('应该成功接收和处理数据', async () => {
      const sourceModule = 'source-module';
      const testData = { message: 'test' };

      const result = await module.receiveData(sourceModule, testData);

      expect(result.success).toBe(true);
      expect(result.processedData).toEqual(testData);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.sourceModule).toBe(sourceModule);
    });

    it('应该记录处理指标', async () => {
      await module.receiveData('source', { data: 'test' });

      const metrics = module.getMetrics();
      expect(metrics.dataReceived).toBe(1);
    });
  });

  describe('syncState', () => {
    let targetModule: TestModule;

    beforeEach(async () => {
      await module.initialize(config);
      targetModule = new TestModule({ name: 'target-module', version: '1.0.0', dependencies: [] });
      await targetModule.initialize({ name: 'target-module', version: '1.0.0', dependencies: [] });

      module.addDependency('target-module', targetModule);
    });

    it('应该成功同步状态', async () => {
      const result = await module.syncState('target-module');

      expect(result.success).toBe(true);
      expect(result.targetModule).toBe('target-module');
      expect(result.syncedAt).toBeInstanceOf(Date);
    });

    it('应该记录同步指标', async () => {
      await module.syncState('target-module');

      const metrics = module.getMetrics();
      expect(metrics.stateSyncs).toBe(1);
    });
  });

  describe('publishEvent', () => {
    beforeEach(async () => {
      await module.initialize(config);
    });

    it('应该成功发布事件', async () => {
      const event: ModuleEvent = {
        type: 'test-event',
        source: 'TestModule',
        data: { message: 'test' },
        timestamp: new Date()
      };

      await expect(module.publishEvent(event)).resolves.not.toThrow();
    });

    it('应该通知所有订阅者', async () => {
      const handler = vi.fn();
      await module.subscribeEvent('test-event', handler);

      const event: ModuleEvent = {
        type: 'test-event',
        source: 'TestModule',
        data: { message: 'test' },
        timestamp: new Date()
      };

      await module.publishEvent(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('应该记录事件指标', async () => {
      const event: ModuleEvent = {
        type: 'test-event',
        source: 'TestModule',
        data: { message: 'test' },
        timestamp: new Date()
      };

      await module.publishEvent(event);

      const metrics = module.getMetrics();
      expect(metrics.eventsPublished).toBe(1);
    });
  });

  describe('subscribeEvent', () => {
    beforeEach(async () => {
      await module.initialize(config);
    });

    it('应该成功订阅事件', async () => {
      const handler = vi.fn();

      await expect(module.subscribeEvent('test-event', handler)).resolves.not.toThrow();
    });

    it('应该为同一事件类型添加多个处理器', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      await module.subscribeEvent('test-event', handler1);
      await module.subscribeEvent('test-event', handler2);

      const event: ModuleEvent = {
        type: 'test-event',
        source: 'TestModule',
        data: { message: 'test' },
        timestamp: new Date()
      };

      await module.publishEvent(event);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    beforeEach(async () => {
      await module.initialize(config);
    });

    it('应该返回健康状态', async () => {
      const result = await module.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.moduleType).toBe('TestModule');
      expect(result.version).toBe('1.0.0');
      expect(result.checkedAt).toBeInstanceOf(Date);
      expect(result.metrics).toBeDefined();
    });

    it('应该包含性能指标', async () => {
      const targetModule = new TestModule({ name: 'test', version: '1.0.0', dependencies: [] });
      await targetModule.initialize({ name: 'test', version: '1.0.0', dependencies: [] });
      module.addDependency('test', targetModule);
      
      await module.sendData('test', { data: 'test' });
      await module.receiveData('source', { data: 'test' });

      const result = await module.healthCheck();

      expect(result.metrics).toBeDefined();
      expect(result.metrics.dataTransfer).toBeDefined();
      expect(result.metrics.dataProcessing).toBeDefined();
    });

    it('未初始化时应该返回不健康状态', async () => {
      const uninitializedModule = new TestModule({ name: 'uninit', version: '1.0.0', dependencies: [] });

      const result = await uninitializedModule.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.status).toBe('not_initialized');
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await module.initialize(config);
    });

    it('应该成功关闭模块', async () => {
      const result = await module.shutdown();

      expect(result.success).toBe(true);
      expect(result.message).toContain('关闭成功');
      expect(result.shutdownAt).toBeInstanceOf(Date);
    });

    it('应该清除所有事件处理器', async () => {
      await module.subscribeEvent('test-event', vi.fn());
      await module.shutdown();

      const handlers = (module as any).eventHandlers;
      expect(handlers.size).toBe(0);
    });

    it('应该清除所有依赖', async () => {
      const targetModule = new TestModule({ name: 'target', version: '1.0.0', dependencies: [] });
      await targetModule.initialize({ name: 'target', version: '1.0.0', dependencies: [] });
      module.addDependency('target', targetModule);

      await module.shutdown();

      const dependencies = (module as any).dependencies;
      expect(dependencies.size).toBe(0);
    });

    it('应该重置初始化状态', async () => {
      await module.shutdown();

      expect((module as any).initialized).toBe(false);
    });
  });

  describe('addDependency', () => {
    it('应该成功添加依赖', () => {
      const depModule = new TestModule({ name: 'dep', version: '1.0.0', dependencies: [] });

      module.addDependency('dep', depModule);

      expect((module as any).dependencies.has('dep')).toBe(true);
    });

    it('应该覆盖已存在的依赖', () => {
      const depModule1 = new TestModule({ name: 'dep', version: '1.0.0', dependencies: [] });
      const depModule2 = new TestModule({ name: 'dep', version: '2.0.0', dependencies: [] });

      module.addDependency('dep', depModule1);
      module.addDependency('dep', depModule2);

      expect((module as any).dependencies.get('dep')).toBe(depModule2);
    });
  });

  describe('removeDependency', () => {
    it('应该成功移除依赖', () => {
      const depModule = new TestModule({ name: 'dep', version: '1.0.0', dependencies: [] });
      module.addDependency('dep', depModule);

      module.removeDependency('dep');

      expect((module as any).dependencies.has('dep')).toBe(false);
    });

    it('移除不存在的依赖不应该报错', () => {
      expect(() => module.removeDependency('non-existent')).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    beforeEach(async () => {
      await module.initialize(config);
    });

    it('应该返回所有指标', async () => {
      const targetModule = new TestModule({ name: 'test', version: '1.0.0', dependencies: [] });
      await targetModule.initialize({ name: 'test', version: '1.0.0', dependencies: [] });
      module.addDependency('test', targetModule);
      
      await module.sendData('test', { data: 'test' });
      await module.receiveData('source', { data: 'test' });

      const metrics = module.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.dataTransfers).toBeDefined();
      expect(metrics.dataReceived).toBeDefined();
    });

    it('应该包含模块信息', async () => {
      const metrics = module.getMetrics();

      expect(metrics.moduleType).toBe('TestModule');
      expect(metrics.version).toBe('1.0.0');
    });
  });
});
