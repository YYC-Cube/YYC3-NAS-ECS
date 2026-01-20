/**
 * @file 学习系统实现
 * @description 实现AI系统的自主学习能力，包括交互记录、模式识别和性能评估
 * @module learning/LearningSystem
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 */

import { AutonomousAIConfig } from '../autonomous-ai-widget/types';
import { LearningRecord, PatternRecognitionResult, PerformanceEvaluation } from './types';
import { MemorySystem } from '../memory/MemorySystem';

/**
 * 自主学习系统 - 实现AI的自主学习和进化能力
 */
export class LearningSystem {
  private config: AutonomousAIConfig;
  private memory: MemorySystem;
  private learningRecords: LearningRecord[] = [];
  private patterns: PatternRecognitionResult[] = [];
  private performanceHistory: PerformanceEvaluation[] = [];

  /**
   * 创建学习系统实例
   * @param config AI配置
   * @param memory 内存系统实例
   */
  constructor(config: AutonomousAIConfig, memory: MemorySystem) {
    this.config = config;
    this.memory = memory;
  }

  /**
   * 记录用户交互
   * @param record 学习记录
   */
  async recordInteraction(record: Omit<LearningRecord, 'timestamp' | 'id'>): Promise<void> {
    if (!this.config.enableLearning) return;

    const learningRecord: LearningRecord = {
      ...record,
      id: `learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.learningRecords.push(learningRecord);
    await this.memory.saveLearningRecord(learningRecord);
  }

  /**
   * 识别用户交互模式
   */
  async recognizePatterns(): Promise<PatternRecognitionResult[]> {
    if (!this.config.enableLearning) return [];

    const allRecords = await this.memory.getLearningRecords();
    
    // 实现模式识别算法
    const patterns: PatternRecognitionResult[] = [];
    
    // 1. 识别常见问题模式
    const commonQuestions = this.identifyCommonQuestions(allRecords);
    if (commonQuestions.length > 0) {
      patterns.push({
        id: `pattern-${Date.now()}-common-questions`,
        type: 'common_questions',
        patterns: commonQuestions,
        confidence: 0.9,
        detectedAt: new Date().toISOString(),
      });
    }

    // 2. 识别使用时间模式
    const timePatterns = this.identifyTimePatterns(allRecords);
    if (timePatterns.length > 0) {
      patterns.push({
        id: `pattern-${Date.now()}-time`,
        type: 'usage_time',
        patterns: timePatterns,
        confidence: 0.8,
        detectedAt: new Date().toISOString(),
      });
    }

    // 3. 识别工具使用模式
    const toolPatterns = this.identifyToolUsagePatterns(allRecords);
    if (toolPatterns.length > 0) {
      patterns.push({
        id: `pattern-${Date.now()}-tools`,
        type: 'tool_usage',
        patterns: toolPatterns,
        confidence: 0.85,
        detectedAt: new Date().toISOString(),
      });
    }

    this.patterns = [...this.patterns, ...patterns];
    await this.memory.savePatterns(patterns);
    
    return patterns;
  }

  /**
   * 评估AI性能
   */
  async evaluatePerformance(): Promise<PerformanceEvaluation> {
    if (!this.config.enableLearning) {
      return {
        id: `eval-${Date.now()}`,
        timestamp: new Date().toISOString(),
        accuracy: 0,
        responseTime: 0,
        userSatisfaction: 0,
        toolUsageEffectiveness: 0,
        learningProgress: 0,
      };
    }

    const allRecords = await this.memory.getLearningRecords();
    const recentRecords = allRecords.filter(record => {
      const recordTime = new Date(record.timestamp);
      const now = new Date();
      return (now.getTime() - recordTime.getTime()) < 24 * 60 * 60 * 1000; // 24小时内
    });

    if (recentRecords.length === 0) {
      return {
        id: `eval-${Date.now()}`,
        timestamp: new Date().toISOString(),
        accuracy: 0.5,
        responseTime: 1000,
        userSatisfaction: 0.5,
        toolUsageEffectiveness: 0.5,
        learningProgress: 0,
      };
    }

    // 计算准确率
    const accurateResponses = recentRecords.filter(record => record.accuracy >= 0.8).length;
    const accuracy = accurateResponses / recentRecords.length;

    // 计算平均响应时间
    const totalResponseTime = recentRecords.reduce((sum, record) => sum + (record.responseTime || 0), 0);
    const responseTime = totalResponseTime / recentRecords.length;

    // 计算用户满意度
    const satisfiedUsers = recentRecords.filter(record => record.userSatisfaction >= 3).length;
    const userSatisfaction = satisfiedUsers / recentRecords.length;

    // 计算工具使用效果
    const toolUsages = recentRecords.filter(record => record.toolUsage && record.toolUsage.length > 0);
    const effectiveToolUsages = toolUsages.filter(record => 
      record.toolUsage?.every(usage => usage.effectiveness >= 0.8)
    ).length;
    const toolUsageEffectiveness = toolUsages.length > 0 ? effectiveToolUsages / toolUsages.length : 0;

    // 计算学习进度
    const learningProgress = this.calculateLearningProgress(recentRecords);

    const evaluation: PerformanceEvaluation = {
      id: `eval-${Date.now()}`,
      timestamp: new Date().toISOString(),
      accuracy,
      responseTime,
      userSatisfaction,
      toolUsageEffectiveness,
      learningProgress,
    };

    this.performanceHistory.push(evaluation);
    await this.memory.savePerformanceEvaluation(evaluation);
    
    return evaluation;
  }

  /**
   * 更新学习策略
   */
  async updateLearningStrategy(): Promise<void> {
    if (!this.config.enableLearning) return;

    const latestEvaluation = await this.evaluatePerformance();
    const latestPatterns = await this.recognizePatterns();

    // 根据性能评估和模式识别结果调整学习策略
    if (latestEvaluation.accuracy < 0.7) {
      // 提高准确率的策略
      this.config.enableContextAwareness = true;
    }

    if (latestEvaluation.responseTime > 2000) {
      // 提高响应速度的策略
      this.config.maxTokens = Math.max(500, this.config.maxTokens - 250);
    }

    if (latestEvaluation.userSatisfaction < 0.6) {
      // 提高用户满意度的策略
      this.config.temperature = Math.min(0.9, this.config.temperature + 0.1);
    }

    // 根据识别到的模式调整系统行为
    for (const pattern of latestPatterns) {
      if (pattern.type === 'common_questions') {
        // 缓存常见问题的答案
        await this.cacheCommonQuestions(pattern.patterns);
      }
    }
  }

  /**
   * 获取学习记录
   */
  async getLearningRecords(): Promise<LearningRecord[]> {
    return await this.memory.getLearningRecords();
  }

  /**
   * 获取识别到的模式
   */
  async getPatterns(): Promise<PatternRecognitionResult[]> {
    return await this.memory.getPatterns();
  }

  /**
   * 获取性能评估历史
   */
  async getPerformanceHistory(): Promise<PerformanceEvaluation[]> {
    return await this.memory.getPerformanceEvaluations();
  }

  /**
   * 获取当前学习进度
   */
  async getCurrentProgress(): Promise<number> {
    const latestEvaluation = await this.evaluatePerformance();
    return latestEvaluation.learningProgress;
  }

  // 辅助方法
  private identifyCommonQuestions(records: LearningRecord[]): Array<{ question: string; frequency: number }> {
    const questionFrequency: Record<string, number> = {};
    
    for (const record of records) {
      if (record.userQuery) {
        const normalizedQuery = record.userQuery.toLowerCase().trim();
        questionFrequency[normalizedQuery] = (questionFrequency[normalizedQuery] || 0) + 1;
      }
    }
    
    return Object.entries(questionFrequency)
      .filter(([_, frequency]) => frequency >= 3) // 至少出现3次
      .map(([question, frequency]) => ({ question, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  private identifyTimePatterns(records: LearningRecord[]): Array<{ hour: number; frequency: number }> {
    const hourFrequency: Record<number, number> = {};
    
    for (const record of records) {
      const hour = new Date(record.timestamp).getHours();
      hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
    }
    
    return Object.entries(hourFrequency)
      .map(([hour, frequency]) => ({ hour: parseInt(hour), frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  private identifyToolUsagePatterns(records: LearningRecord[]): Array<{ toolName: string; frequency: number }> {
    const toolFrequency: Record<string, number> = {};
    
    for (const record of records) {
      if (record.toolUsage) {
        for (const toolUsage of record.toolUsage) {
          toolFrequency[toolUsage.toolName] = (toolFrequency[toolUsage.toolName] || 0) + 1;
        }
      }
    }
    
    return Object.entries(toolFrequency)
      .map(([toolName, frequency]) => ({ toolName, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  private calculateLearningProgress(records: LearningRecord[]): number {
    // 简单实现：基于交互次数和识别到的模式数量
    const baseProgress = Math.min(1, records.length / 100); // 最多100次交互
    const patterns = this.patterns.length;
    const patternProgress = Math.min(1, patterns / 20); // 最多20个模式
    
    return (baseProgress * 0.6 + patternProgress * 0.4);
  }

  private async cacheCommonQuestions(commonQuestions: Array<{ question: string; frequency: number }>): Promise<void> {
    // 实现常见问题缓存逻辑
    for (const { question } of commonQuestions) {
      const answers = await this.memory.getAnswersForQuery(question);
      if (answers.length > 0) {
        await this.memory.cacheAnswer(question, answers[0]);
      }
    }
  }

  /**
   * 获取学习系统指标
   */
  getMetrics(): {
    learningRecordsSize: number;
    patternsSize: number;
    performanceHistorySize: number;
    currentProgress: number;
  } {
    return {
      learningRecordsSize: this.learningRecords.length,
      patternsSize: this.patterns.length,
      performanceHistorySize: this.performanceHistory.length,
      currentProgress: 0,
    };
  }
}
