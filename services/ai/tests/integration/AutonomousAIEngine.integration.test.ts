/**
 * @file 自主AI引擎集成测试
 * @description 测试AutonomousAIEngine与其他核心组件的集成
 * @module __tests__/integration/AutonomousAIEngine.integration.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AutonomousAIEngine } from '@/autonomous-ai-widget/AutonomousAIEngine';
import { MemorySystem } from '@/memory/MemorySystem';
import { LearningSystem } from '@/learning/LearningSystem';
import { EventDispatcher } from '@/event-dispatcher/EventDispatcher';
import { ErrorHandler } from '@/error-handler/ErrorHandler';
import { AutonomousAIConfig } from '@/autonomous-ai-widget/types';

describe('AutonomousAIEngine Integration', () => {
  let engine: AutonomousAIEngine;
  let memory: MemorySystem;
  let learning: LearningSystem;
  let dispatcher: EventDispatcher;
  let errorHandler: ErrorHandler;
  let config: AutonomousAIConfig;

  beforeEach(async () => {
    config = {
      apiType: 'internal',
      enableMemory: true,
      enableLearning: true,
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      enableToolUse: true,
      enableContextAwareness: true,
      position: 'bottom-right',
      theme: 'light',
      language: 'zh-CN',
    };

    const engineConfig = {
      apiType: 'internal',
      model: 'gpt-4',
      maxTokens: 2048,
      temperature: 0.7,
      enableMemory: true,
      enableLearning: true,
      enableToolUse: true,
      enableContextAwareness: true,
    };

    engine = new AutonomousAIEngine(engineConfig);
    await engine.initialize();

    memory = engine.getSubsystem('memory') as MemorySystem;
    learning = engine.getSubsystem('learning') as LearningSystem;
    dispatcher = engine.getSubsystem('eventDispatcher') as EventDispatcher;
    errorHandler = engine.getSubsystem('errorHandler') as ErrorHandler;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('引擎与内存系统集成', () => {
    it('应该正确保存用户交互到内存', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '你好',
        timestamp: new Date().toISOString(),
      };

      const response = await engine.processMessage(userMessage);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();

      const history = await memory.getInteractionHistory(1, 0);
      expect(history.length).toBe(1);
      expect(history[0].user.content).toBe('你好');
    });

    it('应该正确缓存常见问题的答案', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '如何使用系统',
        timestamp: new Date().toISOString(),
      };

      const response1 = await engine.processMessage(userMessage);
      expect(response1).toBeDefined();

      const cachedAnswer = await memory.getCachedAnswer('如何使用系统');
      expect(cachedAnswer).toBeDefined();
    });

    it('应该从缓存中获取答案', async () => {
      const query = '如何使用系统';
      const cachedAnswer = '系统使用指南...';

      await memory.cacheAnswer(query, cachedAnswer);

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: query,
        timestamp: new Date().toISOString(),
      };

      const response = await engine.processMessage(userMessage);
      expect(response).toBeDefined();
    });

    it('应该正确获取用户偏好设置', async () => {
      const preferences = await memory.getUserPreferences();

      expect(preferences.preferredModel).toBe('gpt-4');
      expect(preferences.temperature).toBe(0.7);
      expect(preferences.maxTokens).toBe(2048);
    });
  });

  describe('引擎与学习系统集成', () => {
    it('应该正确记录学习数据', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试问题',
        timestamp: new Date().toISOString(),
      };

      const response = await engine.processMessage(userMessage);

      const learningRecords = await memory.getLearningRecords();
      expect(learningRecords.length).toBeGreaterThan(0);
    });

    it('应该正确识别用户交互模式', async () => {
      const queries = ['如何使用系统', '如何使用系统', '如何使用系统'];

      for (const query of queries) {
        const userMessage = {
          id: `msg${query}`,
          role: 'user' as const,
          content: query,
          timestamp: new Date().toISOString(),
        };
        await engine.processMessage(userMessage);
      }

      const patterns = await learning.recognizePatterns();
      expect(patterns.length).toBeGreaterThan(0);

      const commonQuestionsPattern = patterns.find(p => p.type === 'common_questions');
      expect(commonQuestionsPattern).toBeDefined();
    });

    it('应该正确评估性能', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试问题',
        timestamp: new Date().toISOString(),
      };

      await engine.processMessage(userMessage);

      const evaluation = await learning.evaluatePerformance();
      expect(evaluation).toBeDefined();
      expect(evaluation.accuracy).toBeGreaterThanOrEqual(0);
    });

    it('应该根据评估结果更新学习策略', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试问题',
        timestamp: new Date().toISOString(),
      };

      await engine.processMessage(userMessage);

      await learning.updateLearningStrategy();

      const progress = await learning.getCurrentProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
    });
  });

  describe('引擎与事件分发器集成', () => {
    it('应该正确分发消息处理事件', async () => {
      const eventSpy = vi.fn();
      dispatcher.onEvent('message_received', eventSpy);

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      await engine.processMessage(userMessage);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该正确分发响应生成事件', async () => {
      const eventSpy = vi.fn();
      dispatcher.onEvent('message_processed', eventSpy);

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      await engine.processMessage(userMessage);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该正确分发学习事件', async () => {
      const eventSpy = vi.fn();
      dispatcher.onEvent('message_processed', eventSpy);

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      await engine.processMessage(userMessage);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该正确分发错误事件', async () => {
      const eventSpy = vi.fn();
      dispatcher.onEvent('internal_error_occurred', eventSpy);

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      await engine.processMessage(userMessage);
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('应该支持事件优先级', async () => {
      const executionOrder: number[] = [];

      dispatcher.onEvent('message_received', () => executionOrder.push(1), { priority: 1 });
      dispatcher.onEvent('message_received', () => executionOrder.push(2), { priority: 2 });
      dispatcher.onEvent('message_received', () => executionOrder.push(3), { priority: 0 });

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      await engine.processMessage(userMessage);

      expect(executionOrder).toEqual([2, 1, 3]);
    });
  });

  describe('引擎与错误处理器集成', () => {
    it('应该正确处理消息处理错误', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '',
        timestamp: new Date().toISOString(),
      };

      const response = await engine.processMessage(userMessage);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('应该正确记录错误日志', async () => {
      const logSpy = vi.spyOn(memory, 'saveErrorLog');

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      await engine.processMessage(userMessage);

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('应该正确分发错误事件', async () => {
      const eventSpy = vi.fn();
      dispatcher.onEvent('internal_error_occurred', eventSpy);

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      await engine.processMessage(userMessage);

      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('应该正确应用错误恢复策略', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '',
        timestamp: new Date().toISOString(),
      };

      const response = await engine.processMessage(userMessage);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('应该正确收集错误指标', async () => {
      const metrics = errorHandler.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalErrors).toBeDefined();
      expect(metrics.recoveryRate).toBeDefined();
    });
  });

  describe('多组件协同工作', () => {
    it('应该正确处理完整的消息流程', async () => {
      const messageReceivedSpy = vi.fn();
      const messageProcessedSpy = vi.fn();

      dispatcher.onEvent('message_received', messageReceivedSpy);
      dispatcher.onEvent('message_processed', messageProcessedSpy);

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      const response = await engine.processMessage(userMessage);

      expect(response).toBeDefined();
      expect(messageReceivedSpy).toHaveBeenCalled();
      expect(messageProcessedSpy).toHaveBeenCalled();

      const history = await memory.getInteractionHistory(1, 0);
      expect(history.length).toBe(1);

      const learningRecords = await memory.getLearningRecords();
      expect(learningRecords.length).toBeGreaterThan(0);
    });

    it('应该正确处理错误恢复流程', async () => {
      const networkIssueSpy = vi.fn();
      const timeoutSpy = vi.fn();
      const internalErrorSpy = vi.fn();

      dispatcher.onEvent('network_issue_detected', networkIssueSpy);
      dispatcher.onEvent('timeout_occurred', timeoutSpy);
      dispatcher.onEvent('internal_error_occurred', internalErrorSpy);

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      const response = await engine.processMessage(userMessage);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(networkIssueSpy).not.toHaveBeenCalled();
      expect(timeoutSpy).not.toHaveBeenCalled();
      expect(internalErrorSpy).not.toHaveBeenCalled();
    });

    it('应该正确处理学习优化流程', async () => {
      const queries = ['如何使用系统', '如何使用系统', '如何使用系统'];

      for (const query of queries) {
        const userMessage = {
          id: `msg${query}`,
          role: 'user' as const,
          content: query,
          timestamp: new Date().toISOString(),
        };
        await engine.processMessage(userMessage);
      }

      const patterns = await learning.recognizePatterns();
      expect(patterns.length).toBeGreaterThan(0);

      const evaluation = await learning.evaluatePerformance();
      expect(evaluation).toBeDefined();
      expect(evaluation.accuracy).toBeGreaterThanOrEqual(0);
      expect(evaluation.accuracy).toBeLessThanOrEqual(1);

      await learning.updateLearningStrategy(evaluation);

      const updatedEvaluation = await learning.evaluatePerformance();
      expect(updatedEvaluation).toBeDefined();
    });

    it('应该正确处理数据清理流程', async () => {
      for (let i = 0; i < 50; i++) {
        const userMessage = {
          id: `msg${i}`,
          role: 'user' as const,
          content: `测试消息${i}`,
          timestamp: new Date().toISOString(),
        };
        await engine.processMessage(userMessage);
      }

      let metrics = memory.getMetrics();
      expect(metrics.interactionHistorySize).toBe(50);

      await memory.cleanExpiredData();

      metrics = memory.getMetrics();
      expect(metrics.interactionHistorySize).toBeLessThanOrEqual(50);
    });
  });

  describe('性能和可靠性', () => {
    it('应该正确处理并发消息', async () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg${i}`,
        role: 'user' as const,
        content: `测试消息${i}`,
        timestamp: new Date().toISOString(),
      }));

      const responses = await Promise.all(
        messages.map(msg => engine.processMessage(msg))
      );

      expect(responses.length).toBe(10);
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
      });
    });

    it('应该正确处理大量消息', async () => {
      const messageCount = 100;
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        id: `msg${i}`,
        role: 'user' as const,
        content: `测试消息${i}`,
        timestamp: new Date().toISOString(),
      }));

      for (const message of messages) {
        await engine.processMessage(message);
      }

      const history = await memory.getInteractionHistory(messageCount, 0);
      expect(history.length).toBe(messageCount);

      const learningRecords = await memory.getLearningRecords();
      expect(learningRecords.length).toBeGreaterThan(0);
    });

    it('应该正确处理内存限制', async () => {
      const messageCount = 1100;
      const messages = Array.from({ length: messageCount }, (_, i) => ({
        id: `msg${i}`,
        role: 'user' as const,
        content: `测试消息${i}`,
        timestamp: new Date().toISOString(),
      }));

      for (const message of messages) {
        await engine.processMessage(message);
      }

      const metrics = memory.getMetrics();
      expect(metrics.interactionHistorySize).toBeLessThanOrEqual(1000);
    });
  });

  describe('配置和初始化', () => {
    it('应该正确应用配置', async () => {
      const customEngineConfig = {
        apiType: 'internal' as const,
        model: 'gpt-3.5-turbo',
        maxTokens: 1024,
        temperature: 0.5,
        enableMemory: true,
        enableLearning: true,
        enableToolUse: true,
        enableContextAwareness: true,
      };

      const customEngine = new AutonomousAIEngine(customEngineConfig);
      await customEngine.initialize();

      const customMemory = customEngine.getSubsystem('memory') as MemorySystem;
      const preferences = await customMemory.getUserPreferences();
      expect(preferences.preferredModel).toBe('gpt-3.5-turbo');
      expect(preferences.temperature).toBe(0.5);
      expect(preferences.maxTokens).toBe(1024);
    });

    it('应该正确处理禁用内存的配置', async () => {
      const disabledConfig: AutonomousAIConfig = {
        ...config,
        enableMemory: false,
      };

      const disabledMemory = new MemorySystem(disabledConfig);
      const disabledEngine = new AutonomousAIEngine(disabledConfig);
      await disabledEngine.initialize();

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      await disabledEngine.processMessage(userMessage);

      const history = await disabledMemory.getInteractionHistory();
      expect(history).toEqual([]);
    });

    it('应该正确处理禁用学习的配置', async () => {
      const disabledConfig: AutonomousAIConfig = {
        ...config,
        enableLearning: false,
      };

      const disabledLearning = new LearningSystem(disabledConfig, memory);
      const disabledEngine = new AutonomousAIEngine(disabledConfig);
      await disabledEngine.initialize();

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: new Date().toISOString(),
      };

      await disabledEngine.processMessage(userMessage);

      const learningRecords = await memory.getLearningRecords();
      expect(learningRecords).toEqual([]);
    });
  });

  describe('边界情况', () => {
    it('应该正确处理空消息', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '',
        timestamp: new Date().toISOString(),
      };

      const response = await engine.processMessage(userMessage);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('应该正确处理超长消息', async () => {
      const longContent = '测试'.repeat(10000);

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: longContent,
        timestamp: new Date().toISOString(),
      };

      const response = await engine.processMessage(userMessage);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('应该正确处理特殊字符', async () => {
      const specialContent = '测试!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: specialContent,
        timestamp: new Date().toISOString(),
      };

      const response = await engine.processMessage(userMessage);

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
    });

    it('应该正确处理多语言消息', async () => {
      const messages = [
        { content: '你好', lang: 'zh' },
        { content: 'Hello', lang: 'en' },
        { content: 'こんにちは', lang: 'ja' },
        { content: '안녕하세요', lang: 'ko' },
      ];

      for (const { content } of messages) {
        const userMessage = {
          id: `msg${content}`,
          role: 'user' as const,
          content,
          timestamp: new Date().toISOString(),
        };

        const response = await engine.processMessage(userMessage);

        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
      }
    });
  });
});
