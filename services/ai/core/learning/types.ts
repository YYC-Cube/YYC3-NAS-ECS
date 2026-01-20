/**
 * @file 学习系统类型定义
 * @description 定义学习系统的核心类型接口
 * @module learning/types
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 * @updated 2025-12-30
 * @copyright Copyright (c) 2025 YYC³
 * @license MIT
 */

import { UserMessage, AIResponse, LearningConfig, UserFeedback, LearningInsight, PerformanceMetric } from '../autonomous-ai-widget/types';

export type { UserMessage, AIResponse, LearningConfig, UserFeedback, LearningInsight, PerformanceMetric };

// 交互记录
export interface InteractionRecord {
  timestamp: Date;
  userMessage: UserMessage;
  aiResponse: AIResponse;
  context?: any;
  performance?: PerformanceMetric;
}

// 知识条目
export interface KnowledgeEntry {
  id: string;
  type: 'fact' | 'pattern' | 'preference' | 'rule';
  content: any;
  metadata: {
    source: string;
    confidence: number;
    timestamp: Date;
    lastUsed?: Date;
  };
}

// 学习记录
export interface LearningRecord {
  id: string;
  timestamp: string;
  userQuery?: string;
  accuracy?: number;
  responseTime?: number;
  userSatisfaction?: number;
  toolUsage?: Array<{ toolName: string; effectiveness: number }>;
}

// 性能评估
export interface PerformanceEvaluation {
  id: string;
  timestamp: string;
  accuracy: number;
  responseTime: number;
  userSatisfaction: number;
  toolUsageEffectiveness: number;
  learningProgress: number;
}

// 模式识别结果
export interface PatternRecognitionResult {
  id: string;
  type: string;
  patterns: Array<{ type: string; frequency: number } | { question: string; frequency: number } | { toolName: string; frequency: number } | { hour: number; frequency: number }>;
  confidence: number;
  detectedAt: string;
}

// 反馈分析结果
export interface FeedbackAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  keyThemes: string[];
  improvementAreas: string[];
  confidence: number;
}