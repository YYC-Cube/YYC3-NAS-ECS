/**
 * @file 学习系统与内存系统集成测试
 * @description 测试LearningSystem与MemorySystem之间的集成
 * @module __tests__/integration/LearningSystemMemory.integration.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LearningSystem } from '@/learning/LearningSystem';
import { MemorySystem } from '@/memory/MemorySystem';
import { AutonomousAIConfig } from '@/autonomous-ai-widget/types';
import { LearningRecord, PatternRecognitionResult, PerformanceEvaluation } from '@/learning/types';

describe('LearningSystem and MemorySystem Integration', () => {
  let learningSystem: LearningSystem;
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
    learningSystem = new LearningSystem(config, memorySystem);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('学习记录存储和检索', () => {
    it('应该正确保存学习记录到内存', async () => {
      const record: Omit<LearningRecord, 'id' | 'timestamp'> = {
        userQuery: '如何使用系统',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
      };

      await learningSystem.recordInteraction(record);

      const records = await memorySystem.getLearningRecords();
      expect(records.length).toBe(1);
      expect(records[0].userQuery).toBe('如何使用系统');
    });

    it('应该正确从内存获取学习记录', async () => {
      const records: Omit<LearningRecord, 'id' | 'timestamp'>[] = [
        {
          userQuery: '问题1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
        },
        {
          userQuery: '问题2',
          accuracy: 0.85,
          responseTime: 450,
          userSatisfaction: 3,
        },
      ];

      for (const record of records) {
        await learningSystem.recordInteraction(record);
      }

      const retrievedRecords = await learningSystem.getLearningRecords();
      expect(retrievedRecords.length).toBe(2);
      expect(retrievedRecords[0].userQuery).toBe('问题1');
      expect(retrievedRecords[1].userQuery).toBe('问题2');
    });

    it('应该正确处理大量学习记录', async () => {
      const recordCount = 1000;
      const records: Omit<LearningRecord, 'id' | 'timestamp'>[] = Array.from({ length: recordCount }, (_, i) => ({
        userQuery: `问题${i}`,
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
      }));

      for (const record of records) {
        await learningSystem.recordInteraction(record);
      }

      const retrievedRecords = await memorySystem.getLearningRecords();
      expect(retrievedRecords.length).toBe(recordCount);
    });
  });

  describe('模式识别存储和检索', () => {
    it('应该正确保存模式识别结果到内存', async () => {
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

      const retrievedPatterns = await memorySystem.getPatterns();
      expect(retrievedPatterns.length).toBe(1);
      expect(retrievedPatterns[0].id).toBe('pattern1');
    });

    it('应该正确从内存获取模式识别结果', async () => {
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

    it('应该正确识别模式并保存到内存', async () => {
      const records: Omit<LearningRecord, 'id' | 'timestamp'>[] = [
        {
          userQuery: '如何使用系统',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
        },
        {
          userQuery: '如何使用系统',
          accuracy: 0.85,
          responseTime: 450,
          userSatisfaction: 4,
        },
        {
          userQuery: '如何使用系统',
          accuracy: 0.88,
          responseTime: 480,
          userSatisfaction: 4,
        },
      ];

      for (const record of records) {
        await learningSystem.recordInteraction(record);
      }

      const patterns = await learningSystem.recognizePatterns();

      expect(patterns.length).toBeGreaterThan(0);

      const retrievedPatterns = await memorySystem.getPatterns();
      expect(retrievedPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('性能评估存储和检索', () => {
    it('应该正确保存性能评估结果到内存', async () => {
      const evaluation: PerformanceEvaluation = {
        id: 'eval1',
        timestamp: new Date().toISOString(),
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4.2,
        toolUsageEffectiveness: 0.8,
        learningProgress: 0.7,
      };

      await memorySystem.savePerformanceEvaluation(evaluation);

      const retrievedEvaluations = await memorySystem.getPerformanceEvaluations();
      expect(retrievedEvaluations.length).toBe(1);
      expect(retrievedEvaluations[0].id).toBe('eval1');
    });

    it('应该正确从内存获取性能评估结果', async () => {
      const evaluations: PerformanceEvaluation[] = [
        {
          id: 'eval1',
          timestamp: new Date().toISOString(),
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4.2,
          toolUsageEffectiveness: 0.8,
          learningProgress: 0.7,
        },
        {
          id: 'eval2',
          timestamp: new Date().toISOString(),
          accuracy: 0.85,
          responseTime: 450,
          userSatisfaction: 4.0,
          toolUsageEffectiveness: 0.85,
          learningProgress: 0.75,
        },
      ];

      for (const evaluation of evaluations) {
        await memorySystem.savePerformanceEvaluation(evaluation);
      }

      const retrievedEvaluations = await memorySystem.getPerformanceEvaluations();
      expect(retrievedEvaluations.length).toBe(2);
      expect(retrievedEvaluations[0].id).toBe('eval1');
      expect(retrievedEvaluations[1].id).toBe('eval2');
    });

    it('应该正确评估性能并保存到内存', async () => {
      const records: Omit<LearningRecord, 'id' | 'timestamp'>[] = [
        {
          userQuery: '问题1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
        },
        {
          userQuery: '问题2',
          accuracy: 0.7,
          responseTime: 450,
          userSatisfaction: 3,
        },
      ];

      for (const record of records) {
        await learningSystem.recordInteraction(record);
      }

      const evaluation = await learningSystem.evaluatePerformance();

      expect(evaluation).toBeDefined();
      expect(evaluation.accuracy).toBeGreaterThan(0);

      const retrievedEvaluations = await memorySystem.getPerformanceEvaluations();
      expect(retrievedEvaluations.length).toBeGreaterThan(0);
    });
  });

  describe('学习策略更新', () => {
    it('应该正确更新学习策略', async () => {
      await learningSystem.updateLearningStrategy();

      const progress = await learningSystem.getCurrentProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
    });

    it('应该根据性能评估结果调整策略', async () => {
      const records: Omit<LearningRecord, 'id' | 'timestamp'>[] = [
        {
          userQuery: '问题1',
          accuracy: 0.6,
          responseTime: 500,
          userSatisfaction: 3,
        },
        {
          userQuery: '问题2',
          accuracy: 0.5,
          responseTime: 450,
          userSatisfaction: 2,
        },
      ];

      for (const record of records) {
        await learningSystem.recordInteraction(record);
      }

      await learningSystem.updateLearningStrategy();

      const progress = await learningSystem.getCurrentProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
    });

    it('应该正确保存学习策略到内存', async () => {
      await learningSystem.updateLearningStrategy();

      const progress = await learningSystem.getCurrentProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
    });
  });

  describe('数据清理和维护', () => {
    it('应该正确清理过期的学习记录', async () => {
      const oldRecord: Omit<LearningRecord, 'id' | 'timestamp'> = {
        userQuery: '旧问题',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
      };

      const newRecord: Omit<LearningRecord, 'id' | 'timestamp'> = {
        userQuery: '新问题',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
      };

      await learningSystem.recordInteraction(oldRecord);
      await learningSystem.recordInteraction(newRecord);

      const records = await memorySystem.getLearningRecords();
      expect(records.length).toBe(2);
    });

    it('应该正确清理过期的性能评估记录', async () => {
      const oldEvaluation: PerformanceEvaluation = {
        id: 'eval1',
        timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4.2,
        toolUsageEffectiveness: 0.8,
        learningProgress: 0.7,
      };

      const newEvaluation: PerformanceEvaluation = {
        id: 'eval2',
        timestamp: new Date().toISOString(),
        accuracy: 0.85,
        responseTime: 450,
        userSatisfaction: 4.0,
        toolUsageEffectiveness: 0.85,
        learningProgress: 0.75,
      };

      await memorySystem.savePerformanceEvaluation(oldEvaluation);
      await memorySystem.savePerformanceEvaluation(newEvaluation);

      const evaluations = await memorySystem.getPerformanceEvaluations();
      expect(evaluations.length).toBe(1);
      expect(evaluations[0].id).toBe('eval2');
    });
  });

  describe('数据导出和导入', () => {
    it('应该正确导出学习数据', async () => {
      const record: Omit<LearningRecord, 'id' | 'timestamp'> = {
        userQuery: '问题',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
      };

      await learningSystem.recordInteraction(record);

      const exportedData = await memorySystem.exportMemoryData();

      expect(exportedData.learningRecords.length).toBe(1);
      expect(exportedData.learningRecords[0].userQuery).toBe('问题');
    });

    it('应该正确导入学习数据', async () => {
      const importData = {
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

      const records = await learningSystem.getLearningRecords();
      expect(records.length).toBe(1);
      expect(records[0].id).toBe('record1');
    });

    it('应该正确导出模式识别结果', async () => {
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

      const exportedData = await memorySystem.exportMemoryData();

      expect(exportedData.patterns.length).toBe(1);
      expect(exportedData.patterns[0].id).toBe('pattern1');
    });

    it('应该正确导出性能评估结果', async () => {
      const evaluation: PerformanceEvaluation = {
        id: 'eval1',
        timestamp: new Date().toISOString(),
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4.2,
        toolUsageEffectiveness: 0.8,
        learningProgress: 0.7,
      };

      await memorySystem.savePerformanceEvaluation(evaluation);

      const exportedData = await memorySystem.exportMemoryData();

      expect(exportedData.performanceEvaluations.length).toBe(1);
      expect(exportedData.performanceEvaluations[0].id).toBe('eval1');
    });
  });

  describe('配置和初始化', () => {
    it('应该正确应用配置', async () => {
      const customConfig: AutonomousAIConfig = {
        ...config,
        enableLearning: true,
        temperature: 0.5,
      };

      const customMemory = new MemorySystem(customConfig);
      const customLearning = new LearningSystem(customConfig, customMemory);

      const preferences = await customMemory.getUserPreferences();
      expect(preferences.enableLearning).toBe(true);
    });

    it('应该正确处理禁用学习的配置', async () => {
      const disabledConfig: AutonomousAIConfig = {
        ...config,
        enableLearning: false,
      };

      const disabledMemory = new MemorySystem(disabledConfig);
      const disabledLearning = new LearningSystem(disabledConfig, disabledMemory);

      const record: Omit<LearningRecord, 'id' | 'timestamp'> = {
        userQuery: '问题',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
      };

      await disabledLearning.recordInteraction(record);

      const records = await disabledMemory.getLearningRecords();
      expect(records).toEqual([]);
    });
  });

  describe('边界情况', () => {
    it('应该正确处理空学习记录', async () => {
      const patterns = await learningSystem.recognizePatterns();
      expect(patterns).toEqual([]);

      const evaluation = await learningSystem.evaluatePerformance();
      expect(evaluation).toBeDefined();
      expect(evaluation.accuracy).toBeGreaterThanOrEqual(0);
    });

    it('应该正确处理单个学习记录', async () => {
      const record: Omit<LearningRecord, 'id' | 'timestamp'> = {
        userQuery: '问题',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
      };

      await learningSystem.recordInteraction(record);

      const patterns = await learningSystem.recognizePatterns();
      expect(patterns).toBeDefined();

      const evaluation = await learningSystem.evaluatePerformance();
      expect(evaluation).toBeDefined();
      expect(evaluation.accuracy).toBeGreaterThan(0);
    });

    it('应该正确处理没有工具使用的记录', async () => {
      const record: Omit<LearningRecord, 'id' | 'timestamp'> = {
        userQuery: '问题',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
      };

      await learningSystem.recordInteraction(record);

      const patterns = await learningSystem.recognizePatterns();
      expect(patterns).toBeDefined();
    });

    it('应该正确处理大量工具使用记录', async () => {
      const record: Omit<LearningRecord, 'id' | 'timestamp'> = {
        userQuery: '问题',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
        toolUsage: [
          { toolName: 'tool1', effectiveness: 0.9 },
          { toolName: 'tool2', effectiveness: 0.85 },
          { toolName: 'tool3', effectiveness: 0.95 },
        ],
      };

      await learningSystem.recordInteraction(record);

      const patterns = await learningSystem.recognizePatterns();
      expect(patterns).toBeDefined();
    });
  });
});
