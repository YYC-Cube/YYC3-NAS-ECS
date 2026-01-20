/**
 * @file 内存系统测试
 * @description 测试内存系统的各项功能
 * @module __tests__/unit/core/MemorySystem.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemorySystem } from '../../../core/memory/MemorySystem';
import { AutonomousAIConfig } from '../../../core/autonomous-ai-widget/types';
import { LearningRecord, PatternRecognitionResult, PerformanceEvaluation } from '../../../core/learning/types';

describe('MemorySystem', () => {
  let memorySystem: MemorySystem;
  let config: AutonomousAIConfig;

  beforeEach(() => {
    config = {
      enableMemory: true,
      enableLearning: true,
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      preferredLanguage: 'zh-CN',
    };
    memorySystem = new MemorySystem(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该正确初始化内存系统', () => {
      expect(memorySystem).toBeDefined();
      expect(memorySystem.getMetrics().interactionHistorySize).toBe(0);
      expect(memorySystem.getMetrics().learningRecordsSize).toBe(0);
    });

    it('应该正确应用配置', async () => {
      const preferences = await memorySystem.getUserPreferences();
      expect(preferences.enableMemory).toBe(true);
      expect(preferences.enableLearning).toBe(true);
      expect(preferences.preferredModel).toBe('gpt-4');
    });
  });

  describe('交互历史管理', () => {
    it('应该成功保存交互历史', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '你好',
        timestamp: new Date().toISOString(),
      };

      const aiResponse = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '你好！有什么可以帮助你的吗？',
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);

      const metrics = memorySystem.getMetrics();
      expect(metrics.interactionHistorySize).toBe(1);
    });

    it('应该成功获取交互历史', async () => {
      const userMessage1 = {
        id: 'msg1',
        role: 'user' as const,
        content: '问题1',
        timestamp: new Date().toISOString(),
      };

      const aiResponse1 = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '回答1',
        timestamp: new Date().toISOString(),
      };

      const userMessage2 = {
        id: 'msg2',
        role: 'user' as const,
        content: '问题2',
        timestamp: new Date().toISOString(),
      };

      const aiResponse2 = {
        id: 'resp2',
        role: 'assistant' as const,
        content: '回答2',
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(userMessage1, aiResponse1);
      await memorySystem.saveInteractionHistory(userMessage2, aiResponse2);

      const history = await memorySystem.getInteractionHistory(10, 0);
      expect(history.length).toBe(2);
      expect(history[0].user.content).toBe('问题2');
      expect(history[1].user.content).toBe('问题1');
    });

    it('应该正确限制交互历史数量', async () => {
      for (let i = 0; i < 1050; i++) {
        await memorySystem.saveInteractionHistory(
          {
            id: `msg${i}`,
            role: 'user' as const,
            content: `问题${i}`,
            timestamp: new Date().toISOString(),
          },
          {
            id: `resp${i}`,
            role: 'assistant' as const,
            content: `回答${i}`,
            timestamp: new Date().toISOString(),
          }
        );
      }

      const metrics = memorySystem.getMetrics();
      expect(metrics.interactionHistorySize).toBe(1000);
    });

    it('当内存禁用时不应该保存交互历史', async () => {
      const disabledConfig = { ...config, enableMemory: false };
      const disabledMemory = new MemorySystem(disabledConfig);

      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '你好',
        timestamp: new Date().toISOString(),
      };

      const aiResponse = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '你好！',
        timestamp: new Date().toISOString(),
      };

      await disabledMemory.saveInteractionHistory(userMessage, aiResponse);

      const metrics = disabledMemory.getMetrics();
      expect(metrics.interactionHistorySize).toBe(0);
    });

    it('应该支持分页获取交互历史', async () => {
      for (let i = 0; i < 20; i++) {
        await memorySystem.saveInteractionHistory(
          {
            id: `msg${i}`,
            role: 'user' as const,
            content: `问题${i}`,
            timestamp: new Date().toISOString(),
          },
          {
            id: `resp${i}`,
            role: 'assistant' as const,
            content: `回答${i}`,
            timestamp: new Date().toISOString(),
          }
        );
      }

      const page1 = await memorySystem.getInteractionHistory(10, 0);
      const page2 = await memorySystem.getInteractionHistory(10, 10);

      expect(page1.length).toBe(10);
      expect(page2.length).toBe(10);
      expect(page1[0].user.content).toBe('问题19');
      expect(page2[0].user.content).toBe('问题9');
    });
  });

  describe('学习记录管理', () => {
    it('应该成功保存学习记录', async () => {
      const record: LearningRecord = {
        id: 'record1',
        timestamp: new Date().toISOString(),
        userId: 'user1',
        sessionId: 'session1',
        userQuery: '如何使用系统',
        aiResponse: '系统使用指南...',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
        toolUsage: [],
      };

      await memorySystem.saveLearningRecord(record);

      const metrics = memorySystem.getMetrics();
      expect(metrics.learningRecordsSize).toBe(1);
    });

    it('应该成功获取学习记录', async () => {
      const record1: LearningRecord = {
        id: 'record1',
        timestamp: new Date().toISOString(),
        userId: 'user1',
        sessionId: 'session1',
        userQuery: '问题1',
        aiResponse: '回答1',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
        toolUsage: [],
      };

      const record2: LearningRecord = {
        id: 'record2',
        timestamp: new Date().toISOString(),
        userId: 'user2',
        sessionId: 'session2',
        userQuery: '问题2',
        aiResponse: '回答2',
        accuracy: 0.85,
        responseTime: 450,
        userSatisfaction: 3,
        toolUsage: [],
      };

      await memorySystem.saveLearningRecord(record1);
      await memorySystem.saveLearningRecord(record2);

      const records = await memorySystem.getLearningRecords();
      expect(records.length).toBe(2);
      expect(records[0].id).toBe('record1');
      expect(records[1].id).toBe('record2');
    });

    it('应该正确限制学习记录数量', async () => {
      for (let i = 0; i < 5050; i++) {
        const record: LearningRecord = {
          id: `record${i}`,
          timestamp: new Date().toISOString(),
          userId: `user${i}`,
          sessionId: `session${i}`,
          userQuery: `问题${i}`,
          aiResponse: `回答${i}`,
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: [],
        };
        await memorySystem.saveLearningRecord(record);
      }

      const metrics = memorySystem.getMetrics();
      expect(metrics.learningRecordsSize).toBe(5000);
    });

    it('当学习禁用时不应该保存学习记录', async () => {
      const disabledConfig = { ...config, enableLearning: false };
      const disabledMemory = new MemorySystem(disabledConfig);

      const record: LearningRecord = {
        id: 'record1',
        timestamp: new Date().toISOString(),
        userId: 'user1',
        sessionId: 'session1',
        userQuery: '问题',
        aiResponse: '回答',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
        toolUsage: [],
      };

      await disabledMemory.saveLearningRecord(record);

      const metrics = disabledMemory.getMetrics();
      expect(metrics.learningRecordsSize).toBe(0);
    });
  });

  describe('答案缓存管理', () => {
    it('应该成功缓存答案', async () => {
      await memorySystem.cacheAnswer('如何使用系统', '系统使用指南...');

      const cachedAnswer = await memorySystem.getCachedAnswer('如何使用系统');
      expect(cachedAnswer).toBe('系统使用指南...');
    });

    it('应该返回null当缓存不存在时', async () => {
      const cachedAnswer = await memorySystem.getCachedAnswer('不存在的问题');
      expect(cachedAnswer).toBeNull();
    });

    it('应该正确处理大小写不敏感的查询', async () => {
      await memorySystem.cacheAnswer('如何使用系统', '系统使用指南...');

      const cachedAnswer1 = await memorySystem.getCachedAnswer('如何使用系统');
      const cachedAnswer2 = await memorySystem.getCachedAnswer('如何使用系统'.toUpperCase());
      const cachedAnswer3 = await memorySystem.getCachedAnswer('如何使用系统'.toLowerCase());

      expect(cachedAnswer1).toBe('系统使用指南...');
      expect(cachedAnswer2).toBe('系统使用指南...');
      expect(cachedAnswer3).toBe('系统使用指南...');
    });

    it('应该正确处理缓存过期', async () => {
      await memorySystem.cacheAnswer('问题', '答案');

      const metrics1 = memorySystem.getMetrics();
      expect(metrics1.cachedAnswersSize).toBe(1);

      const cachedAnswer = await memorySystem.getCachedAnswer('问题');
      expect(cachedAnswer).toBe('答案');

      await memorySystem.cleanExpiredData();

      const metrics2 = memorySystem.getMetrics();
      expect(metrics2.cachedAnswersSize).toBe(1);

      const cachedAnswer2 = await memorySystem.getCachedAnswer('问题');
      expect(cachedAnswer2).toBe('答案');
    });

    it('当内存禁用时不应该缓存答案', async () => {
      const disabledConfig = { ...config, enableMemory: false };
      const disabledMemory = new MemorySystem(disabledConfig);

      await disabledMemory.cacheAnswer('问题', '答案');

      const cachedAnswer = await disabledMemory.getCachedAnswer('问题');
      expect(cachedAnswer).toBeNull();
    });
  });

  describe('模式识别结果管理', () => {
    it('应该成功保存模式识别结果', async () => {
      const patterns: PatternRecognitionResult[] = [
        {
          id: 'pattern1',
          type: 'common_questions',
          patterns: [
            { question: '如何使用系统', frequency: 10 },
          ],
          confidence: 0.9,
          detectedAt: new Date().toISOString(),
        },
      ];

      await memorySystem.savePatterns(patterns);

      const metrics = memorySystem.getMetrics();
      expect(metrics.patternsSize).toBe(1);
    });

    it('应该成功获取模式识别结果', async () => {
      const patterns: PatternRecognitionResult[] = [
        {
          id: 'pattern1',
          type: 'common_questions',
          patterns: [
            { question: '如何使用系统', frequency: 10 },
          ],
          confidence: 0.9,
          detectedAt: new Date().toISOString(),
        },
        {
          id: 'pattern2',
          type: 'usage_time',
          patterns: [
            { time: 'morning', frequency: 5 },
          ],
          confidence: 0.8,
          detectedAt: new Date().toISOString(),
        },
      ];

      await memorySystem.savePatterns(patterns);

      const retrievedPatterns = await memorySystem.getPatterns();
      expect(retrievedPatterns.length).toBe(2);
      expect(retrievedPatterns[0].type).toBe('common_questions');
      expect(retrievedPatterns[1].type).toBe('usage_time');
    });

    it('当学习禁用时不应该保存模式', async () => {
      const disabledConfig = { ...config, enableLearning: false };
      const disabledMemory = new MemorySystem(disabledConfig);

      const patterns: PatternRecognitionResult[] = [
        {
          id: 'pattern1',
          type: 'common_questions',
          patterns: [],
          confidence: 0.9,
          detectedAt: new Date().toISOString(),
        },
      ];

      await disabledMemory.savePatterns(patterns);

      const metrics = disabledMemory.getMetrics();
      expect(metrics.patternsSize).toBe(0);
    });
  });

  describe('性能评估管理', () => {
    it('应该成功保存性能评估结果', async () => {
      const evaluation: PerformanceEvaluation = {
        id: 'eval1',
        timestamp: new Date().toISOString(),
        accuracy: 0.9,
        avgResponseTime: 500,
        userSatisfaction: 4.2,
        totalInteractions: 100,
        improvementSuggestions: [],
      };

      await memorySystem.savePerformanceEvaluation(evaluation);

      const metrics = memorySystem.getMetrics();
      expect(metrics.performanceEvaluationsSize).toBe(1);
    });

    it('应该成功获取性能评估历史', async () => {
      const evaluation1: PerformanceEvaluation = {
        id: 'eval1',
        timestamp: new Date().toISOString(),
        accuracy: 0.9,
        avgResponseTime: 500,
        userSatisfaction: 4.2,
        totalInteractions: 100,
        improvementSuggestions: [],
      };

      const evaluation2: PerformanceEvaluation = {
        id: 'eval2',
        timestamp: new Date().toISOString(),
        accuracy: 0.85,
        avgResponseTime: 450,
        userSatisfaction: 4.0,
        totalInteractions: 80,
        improvementSuggestions: [],
      };

      await memorySystem.savePerformanceEvaluation(evaluation1);
      await memorySystem.savePerformanceEvaluation(evaluation2);

      const evaluations = await memorySystem.getPerformanceEvaluations();
      expect(evaluations.length).toBe(2);
      expect(evaluations[0].id).toBe('eval1');
      expect(evaluations[1].id).toBe('eval2');
    });

    it('应该清理超过30天的性能评估记录', async () => {
      const oldEvaluation: PerformanceEvaluation = {
        id: 'eval1',
        timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        accuracy: 0.9,
        avgResponseTime: 500,
        userSatisfaction: 4.2,
        totalInteractions: 100,
        improvementSuggestions: [],
      };

      const newEvaluation: PerformanceEvaluation = {
        id: 'eval2',
        timestamp: new Date().toISOString(),
        accuracy: 0.85,
        avgResponseTime: 450,
        userSatisfaction: 4.0,
        totalInteractions: 80,
        improvementSuggestions: [],
      };

      await memorySystem.savePerformanceEvaluation(oldEvaluation);
      await memorySystem.savePerformanceEvaluation(newEvaluation);

      const evaluations = await memorySystem.getPerformanceEvaluations();
      expect(evaluations.length).toBe(1);
      expect(evaluations[0].id).toBe('eval2');
    });

    it('当学习禁用时不应该保存性能评估', async () => {
      const disabledConfig = { ...config, enableLearning: false };
      const disabledMemory = new MemorySystem(disabledConfig);

      const evaluation: PerformanceEvaluation = {
        id: 'eval1',
        timestamp: new Date().toISOString(),
        accuracy: 0.9,
        avgResponseTime: 500,
        userSatisfaction: 4.2,
        totalInteractions: 100,
        improvementSuggestions: [],
      };

      await disabledMemory.savePerformanceEvaluation(evaluation);

      const metrics = disabledMemory.getMetrics();
      expect(metrics.performanceEvaluationsSize).toBe(0);
    });
  });

  describe('数据清理', () => {
    it('应该成功清理过期的缓存答案', async () => {
      await memorySystem.cacheAnswer('问题1', '答案1');
      await memorySystem.cacheAnswer('问题2', '答案2');

      let metrics = memorySystem.getMetrics();
      expect(metrics.cachedAnswersSize).toBe(2);

      await memorySystem.cleanExpiredData();

      metrics = memorySystem.getMetrics();
      expect(metrics.cachedAnswersSize).toBe(2);
    });

    it('应该成功清理过期的交互历史', async () => {
      const oldInteraction = {
        user: {
          id: 'msg1',
          role: 'user' as const,
          content: '旧问题',
          timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        },
        ai: {
          id: 'resp1',
          role: 'assistant' as const,
          content: '旧回答',
          timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        },
        timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const newInteraction = {
        user: {
          id: 'msg2',
          role: 'user' as const,
          content: '新问题',
          timestamp: new Date().toISOString(),
        },
        ai: {
          id: 'resp2',
          role: 'assistant' as const,
          content: '新回答',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(oldInteraction.user, oldInteraction.ai, oldInteraction.timestamp);
      await memorySystem.saveInteractionHistory(newInteraction.user, newInteraction.ai, newInteraction.timestamp);

      let metrics = memorySystem.getMetrics();
      expect(metrics.interactionHistorySize).toBe(2);

      await memorySystem.cleanExpiredData();

      metrics = memorySystem.getMetrics();
      expect(metrics.interactionHistorySize).toBe(1);
    });

    it('当内存禁用时不应该清理数据', async () => {
      const disabledConfig = { ...config, enableMemory: false };
      const disabledMemory = new MemorySystem(disabledConfig);

      await disabledMemory.cacheAnswer('问题', '答案');
      await disabledMemory.cleanExpiredData();

      const metrics = disabledMemory.getMetrics();
      expect(metrics.cachedAnswersSize).toBe(0);
    });
  });

  describe('数据导出和导入', () => {
    it('应该成功导出所有内存数据', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '问题',
        timestamp: new Date().toISOString(),
      };

      const aiResponse = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '回答',
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      await memorySystem.cacheAnswer('问题', '答案');

      const exportedData = await memorySystem.exportMemoryData();

      expect(exportedData.interactionHistory.length).toBe(1);
      expect(exportedData.cachedAnswers['问题']).toBeDefined();
    });

    it('应该成功导入内存数据', async () => {
      const importData = {
        interactionHistory: [
          {
            user: {
              id: 'msg1',
              role: 'user' as const,
              content: '导入的问题',
              timestamp: new Date().toISOString(),
            },
            ai: {
              id: 'resp1',
              role: 'assistant' as const,
              content: '导入的回答',
              timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          },
        ],
        learningRecords: [
          {
            id: 'record1',
            timestamp: new Date().toISOString(),
            userId: 'user1',
            sessionId: 'session1',
            userQuery: '导入的问题',
            aiResponse: '导入的回答',
            accuracy: 0.9,
            responseTime: 500,
            userSatisfaction: 4,
            toolUsage: [],
          },
        ],
      };

      await memorySystem.importMemoryData(importData);

      const metrics = memorySystem.getMetrics();
      expect(metrics.interactionHistorySize).toBe(1);
      expect(metrics.learningRecordsSize).toBe(1);
    });

    it('应该正确限制导入的数据大小', async () => {
      const largeInteractionHistory: any[] = [];
      for (let i = 0; i < 1500; i++) {
        largeInteractionHistory.push({
          user: {
            id: `msg${i}`,
            role: 'user' as const,
            content: `问题${i}`,
            timestamp: new Date().toISOString(),
          },
          ai: {
            id: `resp${i}`,
            role: 'assistant' as const,
            content: `回答${i}`,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
      }

      await memorySystem.importMemoryData({ interactionHistory: largeInteractionHistory });

      const metrics = memorySystem.getMetrics();
      expect(metrics.interactionHistorySize).toBe(1000);
    });

    it('应该正确合并导入的数据', async () => {
      const existingMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '现有问题',
        timestamp: new Date().toISOString(),
      };

      const existingResponse = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '现有回答',
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(existingMessage, existingResponse);

      const importData = {
        interactionHistory: [
          {
            user: {
              id: 'msg2',
              role: 'user' as const,
              content: '导入的问题',
              timestamp: new Date().toISOString(),
            },
            ai: {
              id: 'resp2',
              role: 'assistant' as const,
              content: '导入的回答',
              timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await memorySystem.importMemoryData(importData);

      const metrics = memorySystem.getMetrics();
      expect(metrics.interactionHistorySize).toBe(2);
    });
  });

  describe('数据清除', () => {
    it('应该成功清除所有数据', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '问题',
        timestamp: new Date().toISOString(),
      };

      const aiResponse = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '回答',
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      await memorySystem.cacheAnswer('问题', '答案');

      let metrics = memorySystem.getMetrics();
      expect(metrics.interactionHistorySize).toBe(1);
      expect(metrics.cachedAnswersSize).toBe(1);

      await memorySystem.clearAllData();

      metrics = memorySystem.getMetrics();
      expect(metrics.interactionHistorySize).toBe(0);
      expect(metrics.learningRecordsSize).toBe(0);
      expect(metrics.patternsSize).toBe(0);
      expect(metrics.performanceEvaluationsSize).toBe(0);
      expect(metrics.cachedAnswersSize).toBe(0);
    });
  });

  describe('内存指标', () => {
    it('应该正确返回内存指标', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '问题',
        timestamp: new Date().toISOString(),
      };

      const aiResponse = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '回答',
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);
      await memorySystem.cacheAnswer('问题', '答案');

      const metrics = memorySystem.getMetrics();

      expect(metrics.interactionHistorySize).toBe(1);
      expect(metrics.learningRecordsSize).toBe(0);
      expect(metrics.patternsSize).toBe(0);
      expect(metrics.performanceEvaluationsSize).toBe(0);
      expect(metrics.cachedAnswersSize).toBe(1);
    });
  });

  describe('用户偏好设置', () => {
    it('应该正确返回用户偏好设置', async () => {
      const preferences = await memorySystem.getUserPreferences();

      expect(preferences.preferredLanguage).toBe('zh-CN');
      expect(preferences.preferredModel).toBe('gpt-4');
      expect(preferences.temperature).toBe(0.7);
      expect(preferences.maxTokens).toBe(2048);
      expect(preferences.enableMemory).toBe(true);
      expect(preferences.enableLearning).toBe(true);
    });

    it('应该反映配置中的设置', async () => {
      const customConfig = {
        ...config,
        preferredLanguage: 'en-US',
        modelName: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 1024,
      };

      const customMemory = new MemorySystem(customConfig);
      const preferences = await customMemory.getUserPreferences();

      expect(preferences.preferredLanguage).toBe('en-US');
      expect(preferences.preferredModel).toBe('gpt-3.5-turbo');
      expect(preferences.temperature).toBe(0.5);
      expect(preferences.maxTokens).toBe(1024);
    });
  });

  describe('错误日志', () => {
    it('应该成功保存错误日志', async () => {
      const errorLog = {
        type: 'validation_error',
        field: 'email',
        message: '邮箱格式不正确',
        context: { email: 'invalid-email' },
        timestamp: Date.now(),
      };

      await memorySystem.saveErrorLog(errorLog);

      expect(true).toBe(true);
    });

    it('当内存禁用时不应该保存错误日志', async () => {
      const disabledConfig = { ...config, enableMemory: false };
      const disabledMemory = new MemorySystem(disabledConfig);

      const errorLog = {
        type: 'validation_error',
        field: 'email',
        message: '邮箱格式不正确',
        context: { email: 'invalid-email' },
        timestamp: Date.now(),
      };

      await disabledMemory.saveErrorLog(errorLog);

      expect(true).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该正确处理空交互历史', async () => {
      const history = await memorySystem.getInteractionHistory();
      expect(history).toEqual([]);
    });

    it('应该正确处理空学习记录', async () => {
      const records = await memorySystem.getLearningRecords();
      expect(records).toEqual([]);
    });

    it('应该正确处理空模式', async () => {
      const patterns = await memorySystem.getPatterns();
      expect(patterns).toEqual([]);
    });

    it('应该正确处理空性能评估', async () => {
      const evaluations = await memorySystem.getPerformanceEvaluations();
      expect(evaluations).toEqual([]);
    });

    it('应该正确处理导入空数据', async () => {
      await memorySystem.importMemoryData({});

      const metrics = memorySystem.getMetrics();
      expect(metrics.interactionHistorySize).toBe(0);
      expect(metrics.learningRecordsSize).toBe(0);
    });

    it('应该正确处理获取不存在的缓存答案', async () => {
      const cachedAnswer = await memorySystem.getCachedAnswer('不存在的问题');
      expect(cachedAnswer).toBeNull();
    });

    it('应该正确处理获取不匹配的答案', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '如何使用系统',
        timestamp: new Date().toISOString(),
      };

      const aiResponse = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '系统使用指南...',
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);

      const answers = await memorySystem.getAnswersForQuery('完全不相关的问题');
      expect(answers).toEqual([]);
    });

    it('应该正确处理获取匹配的答案', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '如何使用系统',
        timestamp: new Date().toISOString(),
      };

      const aiResponse = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '系统使用指南...',
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);

      const answers = await memorySystem.getAnswersForQuery('如何使用');
      expect(answers.length).toBeGreaterThan(0);
      expect(answers[0]).toBe('系统使用指南...');
    });

    it('应该正确处理limit为0的情况', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '问题',
        timestamp: new Date().toISOString(),
      };

      const aiResponse = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '回答',
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);

      const history = await memorySystem.getInteractionHistory(0);
      expect(history).toEqual([]);
    });

    it('应该正确处理offset超过历史记录数量的情况', async () => {
      const userMessage = {
        id: 'msg1',
        role: 'user' as const,
        content: '问题',
        timestamp: new Date().toISOString(),
      };

      const aiResponse = {
        id: 'resp1',
        role: 'assistant' as const,
        content: '回答',
        timestamp: new Date().toISOString(),
      };

      await memorySystem.saveInteractionHistory(userMessage, aiResponse);

      const history = await memorySystem.getInteractionHistory(10, 100);
      expect(history).toEqual([]);
    });
  });
});
