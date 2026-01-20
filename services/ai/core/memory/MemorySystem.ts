/**
 * @file 内存系统实现
 * @description 实现AI系统的内存管理功能，包括存储交互记录、学习记录、模式识别结果和性能评估数据
 * @module memory/MemorySystem
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 */

import { AutonomousAIConfig } from '../autonomous-ai-widget/types';
import { LearningRecord, PatternRecognitionResult, PerformanceEvaluation } from '../learning/types';
import { UserMessage, AIResponse } from '../autonomous-ai-widget/types';

/**
 * 内存系统 - 管理AI的记忆和数据存储
 */
export class MemorySystem {
  private config: AutonomousAIConfig;
  private interactionHistory: Array<{ user: UserMessage; ai: AIResponse; timestamp: string }> = [];
  private learningRecords: LearningRecord[] = [];
  private patterns: PatternRecognitionResult[] = [];
  private performanceEvaluations: PerformanceEvaluation[] = [];
  private cachedAnswers: Record<string, { answer: string; timestamp: string }> = {};
  private maxHistorySize: number = 1000;
  private maxLearningRecords: number = 5000;

  /**
   * 创建内存系统实例
   * @param config AI配置
   */
  constructor(config: AutonomousAIConfig) {
    this.config = config;
  }

  /**
   * 保存用户交互历史
   * @param userMessage 用户消息
   * @param aiResponse AI响应
   * @param timestamp 可选的时间戳，如果不提供则使用当前时间
   */
  async saveInteractionHistory(userMessage: UserMessage, aiResponse: AIResponse, timestamp?: string): Promise<void> {
    if (!this.config.enableMemory) return;

    const interaction = {
      user: userMessage,
      ai: aiResponse,
      timestamp: timestamp || new Date().toISOString(),
    };

    this.interactionHistory.push(interaction);

    // 限制历史记录大小
    if (this.interactionHistory.length > this.maxHistorySize) {
      this.interactionHistory.shift();
    }

    // 持久化存储（在实际实现中，这里应该保存到数据库或本地存储）
    await this.persistInteractionHistory(interaction);
  }

  /**
   * 获取用户交互历史
   * @param limit 返回的历史记录数量
   * @param offset 偏移量
   */
  async getInteractionHistory(limit: number = 50, offset: number = 0): Promise<Array<{ user: UserMessage; ai: AIResponse; timestamp: string }>> {
    if (!this.config.enableMemory) return [];

    // 从后往前获取最新的历史记录
    const startIndex = Math.max(0, this.interactionHistory.length - limit - offset);
    const endIndex = Math.max(0, this.interactionHistory.length - offset);
    
    return this.interactionHistory.slice(startIndex, endIndex).reverse();
  }

  /**
   * 保存学习记录
   * @param record 学习记录
   */
  async saveLearningRecord(record: LearningRecord): Promise<void> {
    if (!this.config.enableLearning) return;

    this.learningRecords.push(record);

    // 限制学习记录大小
    if (this.learningRecords.length > this.maxLearningRecords) {
      this.learningRecords.shift();
    }

    // 持久化存储
    await this.persistLearningRecord(record);
  }

  /**
   * 获取学习记录
   */
  async getLearningRecords(): Promise<LearningRecord[]> {
    if (!this.config.enableLearning) return [];

    return this.learningRecords;
  }

  /**
   * 获取特定查询的答案
   * @param query 查询内容
   */
  async getAnswersForQuery(query: string): Promise<string[]> {
    if (!this.config.enableMemory) return [];

    // 在交互历史中查找匹配的答案
    const matchingAnswers = this.interactionHistory
      .filter(interaction => 
        interaction.user.content.toLowerCase().includes(query.toLowerCase())
      )
      .map(interaction => interaction.ai.content)
      .slice(0, 5); // 返回最多5个匹配的答案

    return matchingAnswers;
  }

  /**
   * 缓存答案
   * @param query 查询内容
   * @param answer 答案
   */
  async cacheAnswer(query: string, answer: string): Promise<void> {
    if (!this.config.enableMemory) return;

    this.cachedAnswers[query.toLowerCase()] = {
      answer,
      timestamp: new Date().toISOString(),
    };

    // 持久化缓存
    await this.persistCachedAnswers();
  }

  /**
   * 获取缓存的答案
   * @param query 查询内容
   */
  async getCachedAnswer(query: string): Promise<string | null> {
    if (!this.config.enableMemory) return null;

    const cached = this.cachedAnswers[query.toLowerCase()];
    if (cached) {
      // 检查缓存是否过期（24小时）
      const cacheTime = new Date(cached.timestamp);
      const now = new Date();
      if ((now.getTime() - cacheTime.getTime()) < 24 * 60 * 60 * 1000) {
        return cached.answer;
      } else {
        // 缓存过期，删除
        delete this.cachedAnswers[query.toLowerCase()];
        await this.persistCachedAnswers();
      }
    }

    return null;
  }

  /**
   * 保存模式识别结果
   * @param patterns 模式识别结果
   */
  async savePatterns(patterns: PatternRecognitionResult[]): Promise<void> {
    if (!this.config.enableLearning) return;

    this.patterns.push(...patterns);

    // 持久化存储
    await this.persistPatterns(patterns);
  }

  /**
   * 获取模式识别结果
   */
  async getPatterns(): Promise<PatternRecognitionResult[]> {
    if (!this.config.enableLearning) return [];

    return this.patterns;
  }

  /**
   * 保存性能评估结果
   * @param evaluation 性能评估结果
   */
  async savePerformanceEvaluation(evaluation: PerformanceEvaluation): Promise<void> {
    if (!this.config.enableLearning) return;

    this.performanceEvaluations.push(evaluation);

    // 限制性能评估记录大小（保留最近30天的记录）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.performanceEvaluations = this.performanceEvaluations.filter(evalRecord => 
      new Date(evalRecord.timestamp) > thirtyDaysAgo
    );

    // 持久化存储
    await this.persistPerformanceEvaluation(evaluation);
  }

  /**
   * 获取性能评估历史
   */
  async getPerformanceEvaluations(): Promise<PerformanceEvaluation[]> {
    if (!this.config.enableLearning) return [];

    return this.performanceEvaluations;
  }

  /**
   * 清理过期数据
   */
  async cleanExpiredData(): Promise<void> {
    if (!this.config.enableMemory) return;

    // 清理过期的缓存答案
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setTime(twentyFourHoursAgo.getTime() - 24 * 60 * 60 * 1000);

    for (const [query, cache] of Object.entries(this.cachedAnswers)) {
      if (new Date(cache.timestamp) < twentyFourHoursAgo) {
        delete this.cachedAnswers[query];
      }
    }

    // 清理过期的交互历史（保留最近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.interactionHistory = this.interactionHistory.filter(interaction => 
      new Date(interaction.timestamp) > thirtyDaysAgo
    );

    // 持久化清理结果
    await this.persistCachedAnswers();
  }

  /**
   * 导出内存数据
   */
  async exportMemoryData(): Promise<{
    interactionHistory: Array<{ user: UserMessage; ai: AIResponse; timestamp: string }>;
    learningRecords: LearningRecord[];
    patterns: PatternRecognitionResult[];
    performanceEvaluations: PerformanceEvaluation[];
    cachedAnswers: Record<string, { answer: string; timestamp: string }>;
  }> {
    return {
      interactionHistory: this.interactionHistory,
      learningRecords: this.learningRecords,
      patterns: this.patterns,
      performanceEvaluations: this.performanceEvaluations,
      cachedAnswers: this.cachedAnswers,
    };
  }

  /**
   * 导入内存数据
   * @param data 内存数据
   */
  async importMemoryData(data: {
    interactionHistory?: Array<{ user: UserMessage; ai: AIResponse; timestamp: string }>;
    learningRecords?: LearningRecord[];
    patterns?: PatternRecognitionResult[];
    performanceEvaluations?: PerformanceEvaluation[];
    cachedAnswers?: Record<string, { answer: string; timestamp: string }>;
  }): Promise<void> {
    if (data.interactionHistory) {
      this.interactionHistory = [...this.interactionHistory, ...data.interactionHistory];
      // 限制大小
      if (this.interactionHistory.length > this.maxHistorySize) {
        this.interactionHistory = this.interactionHistory.slice(-this.maxHistorySize);
      }
    }

    if (data.learningRecords) {
      this.learningRecords = [...this.learningRecords, ...data.learningRecords];
      // 限制大小
      if (this.learningRecords.length > this.maxLearningRecords) {
        this.learningRecords = this.learningRecords.slice(-this.maxLearningRecords);
      }
    }

    if (data.patterns) {
      this.patterns = [...this.patterns, ...data.patterns];
    }

    if (data.performanceEvaluations) {
      this.performanceEvaluations = [...this.performanceEvaluations, ...data.performanceEvaluations];
    }

    if (data.cachedAnswers) {
      this.cachedAnswers = { ...this.cachedAnswers, ...data.cachedAnswers };
    }

    // 持久化导入的数据
    await this.persistAllData();
  }

  /**
   * 清除所有内存数据
   */
  async clearAllData(): Promise<void> {
    this.interactionHistory = [];
    this.learningRecords = [];
    this.patterns = [];
    this.performanceEvaluations = [];
    this.cachedAnswers = {};

    // 持久化清除操作
    await this.persistAllData();
  }

  // 持久化存储方法（在实际实现中，这些方法应该连接到数据库或本地存储）
  private async persistInteractionHistory(interaction: { user: UserMessage; ai: AIResponse; timestamp: string }): Promise<void> {
    // 模拟持久化存储
    console.log('Persisting interaction history:', interaction.timestamp);
  }

  private async persistLearningRecord(record: LearningRecord): Promise<void> {
    // 模拟持久化存储
    console.log('Persisting learning record:', record.id);
  }

  private async persistCachedAnswers(): Promise<void> {
    // 模拟持久化存储
    console.log('Persisting cached answers');
  }

  private async persistPatterns(patterns: PatternRecognitionResult[]): Promise<void> {
    // 模拟持久化存储
    console.log('Persisting patterns:', patterns.length);
  }

  private async persistPerformanceEvaluation(evaluation: PerformanceEvaluation): Promise<void> {
    // 模拟持久化存储
    console.log('Persisting performance evaluation:', evaluation.id);
  }

  private async persistAllData(): Promise<void> {
    // 模拟持久化存储所有数据
    console.log('Persisting all memory data');
  }

  /**
   * 获取内存系统指标
   */
  getMetrics(): {
    interactionHistorySize: number;
    learningRecordsSize: number;
    patternsSize: number;
    performanceEvaluationsSize: number;
    cachedAnswersSize: number;
  } {
    return {
      interactionHistorySize: this.interactionHistory.length,
      learningRecordsSize: this.learningRecords.length,
      patternsSize: this.patterns.length,
      performanceEvaluationsSize: this.performanceEvaluations.length,
      cachedAnswersSize: Object.keys(this.cachedAnswers).length,
    };
  }

  /**
   * 获取用户偏好设置
   */
  async getUserPreferences(): Promise<{
    preferredLanguage?: string;
    preferredModel?: string;
    temperature?: number;
    maxTokens?: number;
    enableMemory?: boolean;
    enableLearning?: boolean;
  }> {
    return {
      preferredLanguage: this.config.preferredLanguage,
      preferredModel: this.config.modelName,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      enableMemory: this.config.enableMemory,
      enableLearning: this.config.enableLearning,
    };
  }

  /**
   * 保存错误日志
   * @param errorLog 错误日志
   */
  async saveErrorLog(errorLog: {
    type: string;
    field?: string;
    message: string;
    context: Record<string, any>;
    timestamp: number;
  }): Promise<void> {
    if (!this.config.enableMemory) return;

    console.log('Saving error log:', errorLog);
  }
}
