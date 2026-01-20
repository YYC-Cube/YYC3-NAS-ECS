/**
 * @file LearningSystem 单元测试
 * @description 测试学习系统的核心功能
 * @module __tests__/unit/core/LearningSystem.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-01
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LearningSystem } from '../../../core/learning/LearningSystem';
import { MemorySystem } from '../../../core/memory/MemorySystem';
import { AutonomousAIConfig } from '../../../core/autonomous-ai-widget/types';
import { LearningRecord, PatternRecognitionResult, PerformanceEvaluation } from '../../../core/learning/types';

describe('LearningSystem', () => {
  let learningSystem: LearningSystem;
  let mockMemory: MemorySystem;
  let config: AutonomousAIConfig;

  beforeEach(() => {
    config = {
      apiType: 'internal',
      enableLearning: true,
      enableMemory: true,
      enableToolUse: true,
      enableContextAwareness: true,
      businessContext: {
        industry: 'technology',
        domain: 'ai-assistant'
      },
      maxTokens: 1000,
      temperature: 0.7
    };

    mockMemory = {
      saveLearningRecord: vi.fn(),
      getLearningRecords: vi.fn(),
      savePatterns: vi.fn(),
      getPatterns: vi.fn(),
      savePerformanceEvaluation: vi.fn(),
      getPerformanceEvaluations: vi.fn(),
      getAnswersForQuery: vi.fn(),
      cacheAnswer: vi.fn()
    } as unknown as MemorySystem;

    learningSystem = new LearningSystem(config, mockMemory);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该成功初始化学习系统', () => {
      expect(learningSystem).toBeDefined();
    });

    it('应该正确设置配置', () => {
      expect(learningSystem).toBeDefined();
    });

    it('应该关联内存系统', () => {
      expect(learningSystem).toBeDefined();
    });
  });

  describe('记录交互', () => {
    it('应该成功记录用户交互', async () => {
      const record: Omit<LearningRecord, 'timestamp' | 'id'> = {
        userId: 'user123',
        sessionId: 'session456',
        userQuery: '测试问题',
        aiResponse: '测试回答',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
        toolUsage: []
      };

      await learningSystem.recordInteraction(record);

      expect(mockMemory.saveLearningRecord).toHaveBeenCalled();
    });

    it('应该为记录生成ID和时间戳', async () => {
      const record: Omit<LearningRecord, 'timestamp' | 'id'> = {
        userId: 'user123',
        sessionId: 'session456',
        userQuery: '测试问题',
        aiResponse: '测试回答',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
        toolUsage: []
      };

      await learningSystem.recordInteraction(record);

      const savedRecord = (mockMemory.saveLearningRecord as any).mock.calls[0][0];
      expect(savedRecord.id).toBeDefined();
      expect(savedRecord.timestamp).toBeDefined();
      expect(savedRecord.id).toMatch(/^learning-/);
    });

    it('应该在禁用学习时不记录', async () => {
      const disabledConfig = { ...config, enableLearning: false };
      const disabledSystem = new LearningSystem(disabledConfig, mockMemory);

      const record: Omit<LearningRecord, 'timestamp' | 'id'> = {
        userId: 'user123',
        sessionId: 'session456',
        userQuery: '测试问题',
        aiResponse: '测试回答',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
        toolUsage: []
      };

      await disabledSystem.recordInteraction(record);

      expect(mockMemory.saveLearningRecord).not.toHaveBeenCalled();
    });

    it('应该保存工具使用信息', async () => {
      const record: Omit<LearningRecord, 'timestamp' | 'id'> = {
        userId: 'user123',
        sessionId: 'session456',
        userQuery: '测试问题',
        aiResponse: '测试回答',
        accuracy: 0.9,
        responseTime: 500,
        userSatisfaction: 4,
        toolUsage: [
          {
            toolName: 'calculator',
            effectiveness: 0.95,
            executionTime: 100
          }
        ]
      };

      await learningSystem.recordInteraction(record);

      expect(mockMemory.saveLearningRecord).toHaveBeenCalled();
      const savedRecord = (mockMemory.saveLearningRecord as any).mock.calls[0][0];
      expect(savedRecord.toolUsage).toHaveLength(1);
      expect(savedRecord.toolUsage[0].toolName).toBe('calculator');
    });
  });

  describe('模式识别', () => {
    it('应该识别常见问题模式', async () => {
      const records: LearningRecord[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userId: 'user1',
          sessionId: 'session1',
          userQuery: '如何使用系统',
          aiResponse: '回答1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          userId: 'user2',
          sessionId: 'session2',
          userQuery: '如何使用系统',
          aiResponse: '回答2',
          accuracy: 0.85,
          responseTime: 450,
          userSatisfaction: 4,
          toolUsage: []
        },
        {
          id: '3',
          timestamp: new Date().toISOString(),
          userId: 'user3',
          sessionId: 'session3',
          userQuery: '如何使用系统',
          aiResponse: '回答3',
          accuracy: 0.88,
          responseTime: 480,
          userSatisfaction: 4,
          toolUsage: []
        }
      ];

      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const patterns = await learningSystem.recognizePatterns();

      expect(patterns.length).toBeGreaterThan(0);
      const commonQuestionsPattern = patterns.find(p => p.type === 'common_questions');
      expect(commonQuestionsPattern).toBeDefined();
      expect(commonQuestionsPattern?.patterns).toContainEqual(
        expect.objectContaining({ question: '如何使用系统', frequency: 3 })
      );
    });

    it('应该识别时间使用模式', async () => {
      const now = new Date();
      const records: LearningRecord[] = [
        {
          id: '1',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
          userId: 'user1',
          sessionId: 'session1',
          userQuery: '问题1',
          aiResponse: '回答1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        },
        {
          id: '2',
          timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).toISOString(),
          userId: 'user2',
          sessionId: 'session2',
          userQuery: '问题2',
          aiResponse: '回答2',
          accuracy: 0.85,
          responseTime: 450,
          userSatisfaction: 4,
          toolUsage: []
        }
      ];

      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const patterns = await learningSystem.recognizePatterns();

      const timePattern = patterns.find(p => p.type === 'usage_time');
      expect(timePattern).toBeDefined();
    });

    it('应该识别工具使用模式', async () => {
      const records: LearningRecord[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userId: 'user1',
          sessionId: 'session1',
          userQuery: '问题1',
          aiResponse: '回答1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: [
            { toolName: 'calculator', effectiveness: 0.95, executionTime: 100 }
          ]
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          userId: 'user2',
          sessionId: 'session2',
          userQuery: '问题2',
          aiResponse: '回答2',
          accuracy: 0.85,
          responseTime: 450,
          userSatisfaction: 4,
          toolUsage: [
            { toolName: 'calculator', effectiveness: 0.9, executionTime: 120 }
          ]
        }
      ];

      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const patterns = await learningSystem.recognizePatterns();

      const toolPattern = patterns.find(p => p.type === 'tool_usage');
      expect(toolPattern).toBeDefined();
      expect(toolPattern?.patterns).toContainEqual(
        expect.objectContaining({ toolName: 'calculator', frequency: 2 })
      );
    });

    it('应该在禁用学习时不识别模式', async () => {
      const disabledConfig = { ...config, enableLearning: false };
      const disabledSystem = new LearningSystem(disabledConfig, mockMemory);

      const patterns = await disabledSystem.recognizePatterns();

      expect(patterns).toHaveLength(0);
    });

    it('应该保存识别到的模式', async () => {
      const records: LearningRecord[] = [];
      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      await learningSystem.recognizePatterns();

      expect(mockMemory.savePatterns).toHaveBeenCalled();
    });
  });

  describe('性能评估', () => {
    it('应该计算准确率', async () => {
      const records: LearningRecord[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userId: 'user1',
          sessionId: 'session1',
          userQuery: '问题1',
          aiResponse: '回答1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          userId: 'user2',
          sessionId: 'session2',
          userQuery: '问题2',
          aiResponse: '回答2',
          accuracy: 0.7,
          responseTime: 450,
          userSatisfaction: 3,
          toolUsage: []
        }
      ];

      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const evaluation = await learningSystem.evaluatePerformance();

      expect(evaluation.accuracy).toBe(0.5); // 1/2 准确率 >= 0.8
    });

    it('应该计算平均响应时间', async () => {
      const records: LearningRecord[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userId: 'user1',
          sessionId: 'session1',
          userQuery: '问题1',
          aiResponse: '回答1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          userId: 'user2',
          sessionId: 'session2',
          userQuery: '问题2',
          aiResponse: '回答2',
          accuracy: 0.9,
          responseTime: 1000,
          userSatisfaction: 4,
          toolUsage: []
        }
      ];

      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const evaluation = await learningSystem.evaluatePerformance();

      expect(evaluation.responseTime).toBe(750); // (500 + 1000) / 2
    });

    it('应该计算用户满意度', async () => {
      const records: LearningRecord[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userId: 'user1',
          sessionId: 'session1',
          userQuery: '问题1',
          aiResponse: '回答1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          userId: 'user2',
          sessionId: 'session2',
          userQuery: '问题2',
          aiResponse: '回答2',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 2,
          toolUsage: []
        }
      ];

      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const evaluation = await learningSystem.evaluatePerformance();

      expect(evaluation.userSatisfaction).toBe(0.5); // 1/2 满意度 >= 3
    });

    it('应该计算工具使用效果', async () => {
      const records: LearningRecord[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userId: 'user1',
          sessionId: 'session1',
          userQuery: '问题1',
          aiResponse: '回答1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: [
            { toolName: 'calculator', effectiveness: 0.9, executionTime: 100 }
          ]
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          userId: 'user2',
          sessionId: 'session2',
          userQuery: '问题2',
          aiResponse: '回答2',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: [
            { toolName: 'search', effectiveness: 0.7, executionTime: 200 }
          ]
        }
      ];

      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const evaluation = await learningSystem.evaluatePerformance();

      expect(evaluation.toolUsageEffectiveness).toBe(0.5); // 1/2 有效
    });

    it('应该在禁用学习时返回默认评估', async () => {
      const disabledConfig = { ...config, enableLearning: false };
      const disabledSystem = new LearningSystem(disabledConfig, mockMemory);

      const evaluation = await disabledSystem.evaluatePerformance();

      expect(evaluation.accuracy).toBe(0);
      expect(evaluation.responseTime).toBe(0);
      expect(evaluation.userSatisfaction).toBe(0);
    });

    it('应该保存性能评估', async () => {
      const records: LearningRecord[] = [
        {
          id: 'record-1',
          timestamp: new Date().toISOString(),
          userQuery: 'test query',
          aiResponse: 'test response',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        }
      ];
      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      await learningSystem.evaluatePerformance();

      expect(mockMemory.savePerformanceEvaluation).toHaveBeenCalled();
    });
  });

  describe('学习策略更新', () => {
    it('应该在准确率低时启用上下文感知', async () => {
      const records: LearningRecord[] = [];
      (mockMemory.getLearningRecords as any).mockResolvedValue(records);
      (mockMemory.getAnswersForQuery as any).mockResolvedValue([]);

      const newConfig = { ...config, enableContextAwareness: false };
      const system = new LearningSystem(newConfig, mockMemory);

      await system.updateLearningStrategy();

      expect(system).toBeDefined();
    });

    it('应该在响应时间长时减少maxTokens', async () => {
      const records: LearningRecord[] = [];
      (mockMemory.getLearningRecords as any).mockResolvedValue(records);
      (mockMemory.getAnswersForQuery as any).mockResolvedValue([]);

      const newConfig = { ...config, maxTokens: 2000 };
      const system = new LearningSystem(newConfig, mockMemory);

      await system.updateLearningStrategy();

      expect(system).toBeDefined();
    });

    it('应该在用户满意度低时提高temperature', async () => {
      const records: LearningRecord[] = [];
      (mockMemory.getLearningRecords as any).mockResolvedValue(records);
      (mockMemory.getAnswersForQuery as any).mockResolvedValue([]);

      const newConfig = { ...config, temperature: 0.5 };
      const system = new LearningSystem(newConfig, mockMemory);

      await system.updateLearningStrategy();

      expect(system).toBeDefined();
    });

    it('应该缓存常见问题的答案', async () => {
      const records: LearningRecord[] = [
        {
          id: 'record-1',
          timestamp: new Date().toISOString(),
          userQuery: '如何使用AI助手',
          aiResponse: '答案1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        },
        {
          id: 'record-2',
          timestamp: new Date().toISOString(),
          userQuery: '如何使用AI助手',
          aiResponse: '答案2',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        },
        {
          id: 'record-3',
          timestamp: new Date().toISOString(),
          userQuery: '如何使用AI助手',
          aiResponse: '答案3',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        }
      ];
      (mockMemory.getLearningRecords as any).mockResolvedValue(records);
      (mockMemory.getAnswersForQuery as any).mockResolvedValue(['答案1']);
      (mockMemory.cacheAnswer as any).mockResolvedValue(undefined);

      await learningSystem.updateLearningStrategy();

      expect(mockMemory.cacheAnswer).toHaveBeenCalled();
    });

    it('应该在禁用学习时不更新策略', async () => {
      const disabledConfig = { ...config, enableLearning: false };
      const disabledSystem = new LearningSystem(disabledConfig, mockMemory);

      await disabledSystem.updateLearningStrategy();

      expect(mockMemory.getLearningRecords).not.toHaveBeenCalled();
    });
  });

  describe('获取学习记录', () => {
    it('应该返回所有学习记录', async () => {
      const records: LearningRecord[] = [];
      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const result = await learningSystem.getLearningRecords();

      expect(result).toEqual(records);
      expect(mockMemory.getLearningRecords).toHaveBeenCalled();
    });
  });

  describe('获取模式', () => {
    it('应该返回所有识别到的模式', async () => {
      const patterns: PatternRecognitionResult[] = [];
      (mockMemory.getPatterns as any).mockResolvedValue(patterns);

      const result = await learningSystem.getPatterns();

      expect(result).toEqual(patterns);
      expect(mockMemory.getPatterns).toHaveBeenCalled();
    });
  });

  describe('获取性能历史', () => {
    it('应该返回所有性能评估历史', async () => {
      const evaluations: PerformanceEvaluation[] = [];
      (mockMemory.getPerformanceEvaluations as any).mockResolvedValue(evaluations);

      const result = await learningSystem.getPerformanceHistory();

      expect(result).toEqual(evaluations);
      expect(mockMemory.getPerformanceEvaluations).toHaveBeenCalled();
    });
  });

  describe('获取当前进度', () => {
    it('应该返回当前学习进度', async () => {
      const records: LearningRecord[] = [];
      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const progress = await learningSystem.getCurrentProgress();

      expect(typeof progress).toBe('number');
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });
  });

  describe('获取指标', () => {
    it('应该返回学习系统指标', () => {
      const metrics = learningSystem.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.learningRecordsSize).toBeDefined();
      expect(metrics.patternsSize).toBeDefined();
      expect(metrics.performanceHistorySize).toBeDefined();
      expect(metrics.currentProgress).toBeDefined();
    });
  });

  describe('边界情况', () => {
    it('应该处理空记录列表', async () => {
      (mockMemory.getLearningRecords as any).mockResolvedValue([]);

      const patterns = await learningSystem.recognizePatterns();
      const evaluation = await learningSystem.evaluatePerformance();

      expect(patterns).toBeDefined();
      expect(evaluation).toBeDefined();
    });

    it('应该处理无工具使用的记录', async () => {
      const records: LearningRecord[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userId: 'user1',
          sessionId: 'session1',
          userQuery: '问题1',
          aiResponse: '回答1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        }
      ];

      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const evaluation = await learningSystem.evaluatePerformance();

      expect(evaluation.toolUsageEffectiveness).toBe(0);
    });

    it('应该处理旧记录（超过24小时）', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2);

      const records: LearningRecord[] = [
        {
          id: '1',
          timestamp: oldDate.toISOString(),
          userId: 'user1',
          sessionId: 'session1',
          userQuery: '问题1',
          aiResponse: '回答1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        }
      ];

      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const evaluation = await learningSystem.evaluatePerformance();

      expect(evaluation.accuracy).toBe(0.5);
    });

    it('应该处理无效的用户查询', async () => {
      const records: LearningRecord[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userId: 'user1',
          sessionId: 'session1',
          userQuery: '',
          aiResponse: '回答1',
          accuracy: 0.9,
          responseTime: 500,
          userSatisfaction: 4,
          toolUsage: []
        }
      ];

      (mockMemory.getLearningRecords as any).mockResolvedValue(records);

      const patterns = await learningSystem.recognizePatterns();

      expect(patterns).toBeDefined();
    });
  });
});
