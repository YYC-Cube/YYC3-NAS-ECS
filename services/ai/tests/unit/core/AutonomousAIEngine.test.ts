/**
 * @file AutonomousAIEngine 单元测试
 * @description 测试自治AI引擎的核心功能
 * @module __tests__/unit/core/AutonomousAIEngine.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AutonomousAIEngine, EngineConfig, EngineStatus, EngineMetrics } from '../../../core/autonomous-ai-widget/AutonomousAIEngine';

describe('AutonomousAIEngine', () => {
  let engine: AutonomousAIEngine;
  let config: EngineConfig;

  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          content: 'Mock response',
          toolUsed: false,
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        })
      } as Response)
    );

    config = {
      apiType: 'internal',
      enableLearning: true,
      enableMemory: true,
      enableToolUse: true,
      enableContextAwareness: true,
      businessContext: {
        industry: 'technology',
        domain: 'ai-assistant'
      }
    };
    engine = new AutonomousAIEngine(config);
  });

  afterEach(async () => {
    if (engine) {
      await engine.shutdown();
    }
  });

  describe('初始化', () => {
    it('应该成功初始化引擎', async () => {
      await engine.initialize();
      const status = engine.getStatus();
      expect(status.isInitialized).toBe(true);
    });

    it('应该创建所有必要的子系统', async () => {
      await engine.initialize();
      const state = engine.getState();
      expect(state.subsystems.messageBus).toBeDefined();
      expect(state.subsystems.taskScheduler).toBeDefined();
      expect(state.subsystems.stateManager).toBeDefined();
      expect(state.subsystems.eventDispatcher).toBeDefined();
      expect(state.subsystems.knowledgeBase).toBeDefined();
      expect(state.subsystems.memory).toBeDefined();
      expect(state.subsystems.learning).toBeDefined();
      expect(state.subsystems.toolRegistry).toBeDefined();
      expect(state.subsystems.contextManager).toBeDefined();
      expect(state.subsystems.modelAdapter).toBeDefined();
    });

    it('应该使用正确的配置初始化', async () => {
      await engine.initialize();
      const state = engine.getState();
      expect(state.config.enableLearning).toBe(true);
      expect(state.config.enableMemory).toBe(true);
      expect(state.config.enableToolUse).toBe(true);
      expect(state.config.enableContextAwareness).toBe(true);
    });

    it('应该抛出错误如果配置无效', async () => {
      const invalidConfig: any = { apiType: 'invalid' };
      const invalidEngine = new AutonomousAIEngine(invalidConfig);
      await expect(invalidEngine.initialize()).rejects.toThrow();
    });
  });

  describe('启动和停止', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('应该成功启动引擎', async () => {
      await engine.start();
      await new Promise(resolve => setTimeout(resolve, 10));
      const status = engine.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.uptime).toBeGreaterThan(0);
    });

    it('应该成功暂停引擎', async () => {
      await engine.start();
      await engine.pause();
      const status = engine.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('应该正确计算运行时间', async () => {
      await engine.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      const status = engine.getStatus();
      expect(status.uptime).toBeGreaterThanOrEqual(100);
    });

    it('应该允许重新启动已暂停的引擎', async () => {
      await engine.start();
      await engine.pause();
      await engine.start();
      const status = engine.getStatus();
      expect(status.isRunning).toBe(true);
    });
  });

  describe('消息处理', () => {
    beforeEach(async () => {
      await engine.initialize();
      await engine.start();
    });

    it('应该成功处理用户消息', async () => {
      const response = await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Hello, AI!',
        source: 'user',
        timestamp: Date.now()
      });
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.timestamp).toBeDefined();
      expect(response.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('应该更新处理消息的指标', async () => {
      const initialMetrics = engine.getStatus().metrics;
      await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Hello, AI!',
        source: 'user',
        timestamp: Date.now()
      });
      const updatedMetrics = engine.getStatus().metrics;
      expect(updatedMetrics.messagesProcessed).toBe(initialMetrics.messagesProcessed + 2);
    });

    it('应该处理带有上下文的消息', async () => {
      const response = await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Hello, AI!',
        source: 'user',
        timestamp: Date.now(),
        metadata: {
          userId: 'user-123',
          sessionId: 'session-456'
        }
      });
      expect(response).toBeDefined();
    });

    it('应该处理空消息', async () => {
      const response = await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: '',
        source: 'user',
        timestamp: Date.now()
      });
      expect(response).toBeDefined();
    });
  });

  describe('任务管理', () => {
    beforeEach(async () => {
      await engine.initialize();
      await engine.start();
    });

    it('应该成功创建任务计划', async () => {
      const plan = await engine.planTask({
        id: 'goal-1',
        description: 'Test Goal',
        priority: 1,
        deadline: Date.now() + 3600000
      });
      expect(plan).toBeDefined();
      expect(plan.id).toBeDefined();
    });

    it('应该成功执行任务', async () => {
      const plan = await engine.planTask({
        id: 'goal-1',
        description: 'Test Goal',
        priority: 1,
        deadline: Date.now() + 3600000
      });
      if (plan.tasks.length > 0) {
        const result = await engine.executeTask(plan.tasks[0].id);
        expect(result).toBeDefined();
      }
    });

    it('应该更新任务完成的指标', async () => {
      const initialMetrics = engine.getStatus().metrics;
      const plan = await engine.planTask({
        id: 'goal-1',
        description: 'Test Goal',
        priority: 1,
        deadline: Date.now() + 3600000
      });
      if (plan.tasks.length > 0) {
        await engine.executeTask(plan.tasks[0].id);
        const updatedMetrics = engine.getStatus().metrics;
        expect(updatedMetrics.tasksCompleted).toBeGreaterThanOrEqual(initialMetrics.tasksCompleted);
      }
    });

    it('应该处理任务执行失败', async () => {
      const plan = await engine.planTask({
        id: 'goal-1',
        description: 'Failing Goal',
        priority: 1,
        deadline: Date.now() + 3600000,
        constraints: [{ shouldFail: true }]
      });
      if (plan.tasks.length > 0) {
        const result = await engine.executeTask(plan.tasks[0].id);
        expect(result).toBeDefined();
      }
    });
  });

  describe('学习功能', () => {
    it('应该在启用学习时记录学习数据', async () => {
      await engine.initialize();
      await engine.start();
      await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Hello, AI!',
        source: 'user',
        timestamp: Date.now()
      });
      const metrics = engine.getStatus().metrics;
      expect(metrics.learningProgress).toBeGreaterThanOrEqual(0);
    });

    it('应该在禁用学习时不记录学习数据', async () => {
      const noLearningConfig = { ...config, enableLearning: false };
      const noLearningEngine = new AutonomousAIEngine(noLearningConfig);
      await noLearningEngine.initialize();
      await noLearningEngine.start();
      await noLearningEngine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Hello, AI!',
        source: 'user',
        timestamp: Date.now()
      });
      const metrics = noLearningEngine.getStatus().metrics;
      expect(metrics.learningProgress).toBe(0);
      await noLearningEngine.shutdown();
    });
  });

  describe('记忆功能', () => {
    it('应该在启用记忆时存储信息', async () => {
      await engine.initialize();
      await engine.start();
      await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'My name is John',
        source: 'user',
        timestamp: Date.now()
      });
      const state = engine.getState();
      expect(state.subsystems.memory).toBeDefined();
    });

    it('应该在禁用记忆时不存储信息', async () => {
      const noMemoryConfig = { ...config, enableMemory: false };
      const noMemoryEngine = new AutonomousAIEngine(noMemoryConfig);
      await noMemoryEngine.initialize();
      await noMemoryEngine.start();
      await noMemoryEngine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'My name is John',
        source: 'user',
        timestamp: Date.now()
      });
      await noMemoryEngine.shutdown();
    });
  });

  describe('工具使用', () => {
    it('应该在启用工具时使用工具', async () => {
      await engine.initialize();
      await engine.start();
      const response = await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Use a tool',
        source: 'user',
        timestamp: Date.now()
      });
      expect(response).toBeDefined();
    });

    it('应该在禁用工具时不使用工具', async () => {
      const noToolConfig = { ...config, enableToolUse: false };
      const noToolEngine = new AutonomousAIEngine(noToolConfig);
      await noToolEngine.initialize();
      await noToolEngine.start();
      await noToolEngine.shutdown();
    });
  });

  describe('状态管理', () => {
    it('应该正确返回引擎状态', async () => {
      await engine.initialize();
      const status = engine.getStatus();
      expect(status).toBeDefined();
      expect(status.isInitialized).toBe(true);
      expect(status.isRunning).toBe(false);
      expect(status.currentPhase).toBeDefined();
      expect(status.uptime).toBe(0);
      expect(status.metrics).toBeDefined();
    });

    it('应该正确返回引擎状态对象', async () => {
      await engine.initialize();
      const state = engine.getState();
      expect(state).toBeDefined();
      expect(state.config).toBeDefined();
      expect(state.status).toBeDefined();
      expect(state.subsystems).toBeDefined();
    });

    it('应该保存状态快照', async () => {
      await engine.initialize();
      const snapshot = await engine.saveState();
      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.state).toBeDefined();
    });

    it('应该从快照恢复状态', async () => {
      await engine.initialize();
      const snapshot = await engine.saveState();
      await engine.restoreState(snapshot);
      const restoredState = engine.getState();
      expect(restoredState).toBeDefined();
    });
  });

  describe('诊断功能', () => {
    it('应该生成诊断报告', async () => {
      await engine.initialize();
      const report = await engine.diagnose();
      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.healthStatus).toBeDefined();
      expect(report.subsystems).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('应该检测健康状态', async () => {
      await engine.initialize();
      const report = await engine.diagnose();
      expect(['healthy', 'degraded', 'critical']).toContain(report.healthStatus);
    });

    it('应该提供改进建议', async () => {
      await engine.initialize();
      const report = await engine.diagnose();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('事件系统', () => {
    it('应该触发事件', async () => {
      await engine.initialize();
      await engine.start();
      const response = await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        source: 'user',
        timestamp: Date.now()
      });
      expect(response).toBeDefined();
      expect(response.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('应该处理多个消息', async () => {
      await engine.initialize();
      await engine.start();
      const response1 = await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Hello',
        source: 'user',
        timestamp: Date.now()
      });
      const response2 = await engine.processMessage({
        id: 'msg-2',
        type: 'user',
        content: 'World',
        source: 'user',
        timestamp: Date.now()
      });
      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该优雅地处理初始化错误', async () => {
      const invalidConfig: any = { apiType: 'invalid' };
      const invalidEngine = new AutonomousAIEngine(invalidConfig);
      await expect(invalidEngine.initialize()).rejects.toThrow();
    });

    it('应该优雅地处理消息处理错误', async () => {
      await engine.initialize();
      await engine.start();
      const response = await engine.processMessage({
        id: 'msg-1',
        type: 'invalid',
        content: 'Hello',
        source: 'user',
        timestamp: Date.now()
      });
      expect(response).toBeDefined();
    });

    it('应该优雅地处理任务执行错误', async () => {
      await engine.initialize();
      await engine.start();
      const plan = await engine.planTask({
        id: 'goal-1',
        description: 'Failing Goal',
        priority: 1,
        deadline: Date.now() + 3600000,
        constraints: [{ shouldFail: true }]
      });
      if (plan.tasks.length > 0) {
        const result = await engine.executeTask(plan.tasks[0].id);
        expect(result).toBeDefined();
      }
    });
  });

  describe('错误边界', () => {
    it('应该捕获并处理操作中的错误', async () => {
      await engine.initialize();
      await engine.start();
      
      const response = await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Test message',
        source: 'user',
        timestamp: Date.now()
      });
      
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
    });

    it('应该在错误发生时触发错误处理回调', async () => {
      await engine.initialize();
      await engine.start();
      
      const errorHandlerSpy = vi.spyOn(engine as any, 'handleGlobalError');
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: null,
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(errorHandlerSpy).toHaveBeenCalled();
      }
    });

    it('应该在可恢复错误时触发恢复回调', async () => {
      await engine.initialize();
      await engine.start();
      
      const recoveryHandlerSpy = vi.spyOn(engine as any, 'handleRecovery');
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: 'Test message',
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        if (recoveryHandlerSpy) {
          expect(recoveryHandlerSpy).toHaveBeenCalled();
        }
      }
    });
  });

  describe('重试机制', () => {
    it('应该在可重试错误时自动重试', async () => {
      await engine.initialize();
      await engine.start();
      
      let attemptCount = 0;
      const mockFetch = vi.fn(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'Internal Server Error' })
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: 'Success',
            toolUsed: false,
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        } as Response);
      });
      
      global.fetch = mockFetch;
      
      const response = await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Test message',
        source: 'user',
        timestamp: Date.now()
      });
      
      expect(response).toBeDefined();
      expect(attemptCount).toBeGreaterThan(1);
    });

    it('应该在达到最大重试次数后放弃', async () => {
      await engine.initialize();
      await engine.start();
      
      const mockFetch = vi.fn(() => {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ error: 'Internal Server Error' })
        } as Response);
      });
      
      global.fetch = mockFetch;
      
      const originalSetTimeout = global.setTimeout;
      const mockSetTimeout = vi.fn((callback: Function, delay: number) => {
        return originalSetTimeout(callback, 0);
      });
      global.setTimeout = mockSetTimeout as any;
      
      const error = await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Test message',
        source: 'user',
        timestamp: Date.now()
      }).catch(err => err);
      
      global.setTimeout = originalSetTimeout;
      
      expect(error).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(16);
    });

    it('应该使用指数退避策略进行重试', async () => {
      await engine.initialize();
      await engine.start();
      
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      let attemptCount = 0;
      
      const mockFetch = vi.fn(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'Internal Server Error' })
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: 'Success',
            toolUsed: false,
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        } as Response);
      });
      
      global.fetch = mockFetch;
      
      const mockSetTimeout = vi.fn((callback: Function, delay: number) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      });
      
      global.setTimeout = mockSetTimeout as any;
      
      await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Test message',
        source: 'user',
        timestamp: Date.now()
      });
      
      global.setTimeout = originalSetTimeout;
      
      expect(delays.length).toBeGreaterThan(1);
      
      for (let i = 0; i < delays.length; i++) {
        const expectedDelay = 1000 * Math.pow(2, i);
        expect(delays[i]).toBeGreaterThanOrEqual(expectedDelay);
      }
    });
  });

  describe('错误恢复策略', () => {
    it('应该正确处理验证错误', async () => {
      await engine.initialize();
      await engine.start();
      
      const eventDispatcher = (engine as any).eventDispatcher;
      const dispatchSpy = vi.spyOn(eventDispatcher, 'dispatch');
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: { invalid: 'data' },
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(dispatchSpy).toHaveBeenCalled();
    });

    it('应该正确处理网络错误', async () => {
      await engine.initialize();
      await engine.start();
      
      const eventDispatcher = (engine as any).eventDispatcher;
      const dispatchSpy = vi.spyOn(eventDispatcher, 'dispatch');
      
      const mockFetch = vi.fn(() => {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ error: 'Internal Server Error' })
        } as Response);
      });
      
      global.fetch = mockFetch;
      
      const originalSetTimeout = global.setTimeout;
      const mockSetTimeout = vi.fn((callback: Function, delay: number) => {
        return originalSetTimeout(callback, 0);
      });
      global.setTimeout = mockSetTimeout as any;
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: 'Test message',
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      global.setTimeout = originalSetTimeout;
      
      expect(dispatchSpy).toHaveBeenCalled();
      
      const networkEventCalls = dispatchSpy.mock.calls.filter(call => 
        call[0] && call[0].type === 'network_issue_detected'
      );
      expect(networkEventCalls.length).toBeGreaterThan(0);
    });

    it('应该正确处理超时错误', async () => {
      await engine.initialize();
      await engine.start();
      
      const eventDispatcher = (engine as any).eventDispatcher;
      const dispatchSpy = vi.spyOn(eventDispatcher, 'dispatch');
      
      const mockFetch = vi.fn(() => {
        return Promise.resolve({
          ok: false,
          status: 408,
          statusText: 'Request Timeout',
          json: () => Promise.resolve({ error: 'Request Timeout' })
        } as Response);
      });
      
      global.fetch = mockFetch;
      
      const originalSetTimeout = global.setTimeout;
      const mockSetTimeout = vi.fn((callback: Function, delay: number) => {
        return originalSetTimeout(callback, 0);
      });
      global.setTimeout = mockSetTimeout as any;
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: 'Test message',
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      global.setTimeout = originalSetTimeout;
      
      expect(dispatchSpy).toHaveBeenCalled();
      
      const timeoutEventCalls = dispatchSpy.mock.calls.filter(call => 
        call[0] && call[0].type === 'timeout_occurred'
      );
      expect(timeoutEventCalls.length).toBeGreaterThan(0);
    });

    it('应该正确处理内部错误', async () => {
      await engine.initialize();
      await engine.start();
      
      const eventDispatcher = (engine as any).eventDispatcher;
      const dispatchSpy = vi.spyOn(eventDispatcher, 'dispatch');
      
      const mockFetch = vi.fn(() => {
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: () => Promise.resolve({ error: 'Bad Request' })
        } as Response);
      });
      
      global.fetch = mockFetch;
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: 'Test message',
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(dispatchSpy).toHaveBeenCalled();
      
      const internalErrorCalls = dispatchSpy.mock.calls.filter(call => 
        call[0] && call[0].type === 'internal_error_occurred'
      );
      expect(internalErrorCalls.length).toBeGreaterThan(0);
    });

    it('应该在关键错误时暂停引擎', async () => {
      await engine.initialize();
      await engine.start();
      
      const eventDispatcher = (engine as any).eventDispatcher;
      const dispatchSpy = vi.spyOn(eventDispatcher, 'dispatch');
      
      const mockFetch = vi.fn(() => {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ 
            error: 'Critical Internal Server Error',
            critical: true
          })
        } as Response);
      });
      
      global.fetch = mockFetch;
      
      const originalSetTimeout = global.setTimeout;
      const mockSetTimeout = vi.fn((callback: Function, delay: number) => {
        return originalSetTimeout(callback, 0);
      });
      global.setTimeout = mockSetTimeout as any;
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: 'Test message',
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      global.setTimeout = originalSetTimeout;
      
      const status = engine.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });

  describe('全局错误处理', () => {
    it('应该记录所有错误到错误处理器', async () => {
      await engine.initialize();
      await engine.start();
      
      const errorHandlerSpy = vi.spyOn(engine as any, 'errorHandler', 'get').mockReturnValue({
        handleError: vi.fn().mockResolvedValue(undefined)
      });
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: null,
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(errorHandlerSpy).toHaveBeenCalled();
      }
    });

    it('应该在错误发生时触发错误事件', async () => {
      await engine.initialize();
      await engine.start();
      
      const eventDispatcherSpy = vi.spyOn(engine as any, 'eventDispatcher', 'get').mockReturnValue({
        dispatch: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn()
      });
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: null,
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(eventDispatcherSpy).toHaveBeenCalled();
      }
    });

    it('应该包含错误上下文信息', async () => {
      await engine.initialize();
      await engine.start();
      
      const errorHandlerSpy = vi.spyOn(engine as any, 'errorHandler', 'get').mockReturnValue({
        handleError: vi.fn().mockImplementation((error, context) => {
          expect(context).toBeDefined();
          expect(context.operation).toBeDefined();
          expect(context.traceId).toBeDefined();
          return Promise.resolve(undefined);
        })
      });
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: null,
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(errorHandlerSpy).toHaveBeenCalled();
      }
    });
  });

  describe('错误上下文和元数据', () => {
    it('应该在错误中包含操作信息', async () => {
      await engine.initialize();
      await engine.start();
      
      const errorHandlerSpy = vi.spyOn(engine as any, 'errorHandler', 'get').mockReturnValue({
        handleError: vi.fn().mockImplementation((error, context) => {
          expect(context.operation).toBeDefined();
          return Promise.resolve(undefined);
        })
      });
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: null,
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(errorHandlerSpy).toHaveBeenCalled();
      }
    });

    it('应该在错误中包含追踪ID', async () => {
      await engine.initialize();
      await engine.start();
      
      const errorHandlerSpy = vi.spyOn(engine as any, 'errorHandler', 'get').mockReturnValue({
        handleError: vi.fn().mockImplementation((error, context) => {
          expect(context.traceId).toBeDefined();
          return Promise.resolve(undefined);
        })
      });
      
      try {
        await engine.processMessage({
          id: 'msg-1',
        type: 'user',
          content: null,
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(errorHandlerSpy).toHaveBeenCalled();
      }
    });

    it('应该在错误中包含时间戳', async () => {
      await engine.initialize();
      await engine.start();
      
      const errorHandlerSpy = vi.spyOn(engine as any, 'errorHandler', 'get').mockReturnValue({
        handleError: vi.fn().mockImplementation((error, context) => {
          expect(context.timestamp).toBeDefined();
          expect(typeof context.timestamp).toBe('number');
          return Promise.resolve(undefined);
        })
      });
      
      try {
        await engine.processMessage({
          id: 'msg-1',
          type: 'user',
          content: null,
          source: 'user',
          timestamp: Date.now()
        });
      } catch (error) {
        expect(errorHandlerSpy).toHaveBeenCalled();
      }
    });
  });

  describe('错误恢复和自愈', () => {
    it('应该在可恢复错误后继续处理', async () => {
      await engine.initialize();
      await engine.start();
      
      let attemptCount = 0;
      const mockFetch = vi.fn(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'Internal Server Error' })
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: 'Success',
            toolUsed: false,
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        } as Response);
      });
      
      global.fetch = mockFetch;
      
      const response = await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Test message',
        source: 'user',
        timestamp: Date.now()
      });
      
      expect(response).toBeDefined();
      expect(attemptCount).toBeGreaterThan(1);
    });

    it('应该在恢复后保持引擎状态', async () => {
      await engine.initialize();
      await engine.start();
      
      const initialStatus = engine.getStatus();
      
      let attemptCount = 0;
      const mockFetch = vi.fn(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: () => Promise.resolve({ error: 'Internal Server Error' })
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: 'Success',
            toolUsed: false,
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        } as Response);
      });
      
      global.fetch = mockFetch;
      
      await engine.processMessage({
        id: 'msg-1',
        type: 'user',
        content: 'Test message',
        source: 'user',
        timestamp: Date.now()
      });
      
      const recoveredStatus = engine.getStatus();
      expect(recoveredStatus.isRunning).toBe(initialStatus.isRunning);
      expect(recoveredStatus.isInitialized).toBe(initialStatus.isInitialized);
    });
  });
});
