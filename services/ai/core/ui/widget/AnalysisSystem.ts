/**
 * @file AnalysisSystem 分析系统
 * @description 五维闭环系统中的分析维度，负责数据收集、用户行为分析、性能分析、模式识别和预测分析
 * @module core/ui/widget/analysis
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 * @updated 2026-01-03
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { EventEmitter } from 'events';

export interface AnalysisConfig {
  enabled?: boolean;
  enableUserBehaviorAnalysis?: boolean;
  enablePerformanceAnalysis?: boolean;
  enablePatternRecognition?: boolean;
  enablePredictiveAnalysis?: boolean;
  dataRetentionDays?: number;
  samplingRate?: number;
  maxDataPoints?: number;
  enableRealTimeAnalysis?: boolean;
  analysisInterval?: number;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onPatternDetected?: (pattern: DetectedPattern) => void;
  onPredictionGenerated?: (prediction: Prediction) => void;
}

export interface AnalysisData {
  timestamp: number;
  type: 'user_behavior' | 'performance' | 'system' | 'custom';
  category: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  type: 'behavior' | 'performance' | 'pattern' | 'prediction';
  summary: string;
  insights: Insight[];
  metrics: Record<string, number>;
  confidence: number;
  recommendations: Recommendation[];
}

export interface Insight {
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  data: Record<string, any>;
}

export interface Recommendation {
  action: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImpact: string;
  implementation: string;
}

export interface DetectedPattern {
  id: string;
  type: string;
  name: string;
  description: string;
  confidence: number;
  frequency: number;
  occurrences: PatternOccurrence[];
  firstDetected: number;
  lastDetected: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
}

export interface PatternOccurrence {
  timestamp: number;
  context: Record<string, any>;
  data: Record<string, any>;
}

export interface Prediction {
  id: string;
  type: string;
  target: string;
  predictedValue: any;
  confidence: number;
  timeframe: string;
  factors: PredictionFactor[];
  generatedAt: number;
  validUntil: number;
}

export interface PredictionFactor {
  name: string;
  weight: number;
  value: any;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface UserBehaviorData {
  userId?: string;
  sessionId: string;
  action: string;
  target: string;
  duration?: number;
  context: Record<string, any>;
  timestamp: number;
}

export interface PerformanceData {
  metric: string;
  value: number;
  unit: string;
  threshold?: number;
  context: Record<string, any>;
  timestamp: number;
}

export interface AnalysisMetrics {
  totalDataPoints: number;
  analyzedDataPoints: number;
  patternsDetected: number;
  predictionsGenerated: number;
  averageAnalysisTime: number;
  lastAnalysisTime: number;
  dataRetentionRate: number;
}

export class AnalysisSystem extends EventEmitter {
  private config: Required<AnalysisConfig>;
  private dataStore: AnalysisData[];
  private analysisResults: AnalysisResult[];
  private detectedPatterns: DetectedPattern[];
  private predictions: Prediction[];
  private metrics: AnalysisMetrics;
  private enabled: boolean;
  private analysisIntervalId: NodeJS.Timeout | null;
  private realTimeAnalysisEnabled: boolean;
  private dataRetentionDays: number;
  private maxDataPoints: number;
  private samplingRate: number;
  private analysisHistory: Map<string, number[]>;

  constructor(config: AnalysisConfig = {}) {
    super();

    this.config = {
      enabled: true,
      enableUserBehaviorAnalysis: true,
      enablePerformanceAnalysis: true,
      enablePatternRecognition: true,
      enablePredictiveAnalysis: true,
      dataRetentionDays: 30,
      samplingRate: 1.0,
      maxDataPoints: 10000,
      enableRealTimeAnalysis: true,
      analysisInterval: 60000,
      onAnalysisComplete: undefined,
      onPatternDetected: undefined,
      onPredictionGenerated: undefined,
      ...config,
    };

    this.dataStore = [];
    this.analysisResults = [];
    this.detectedPatterns = [];
    this.predictions = [];
    this.analysisHistory = new Map();

    this.metrics = {
      totalDataPoints: 0,
      analyzedDataPoints: 0,
      patternsDetected: 0,
      predictionsGenerated: 0,
      averageAnalysisTime: 0,
      lastAnalysisTime: 0,
      dataRetentionRate: 1.0,
    };

    this.enabled = this.config.enabled;
    this.realTimeAnalysisEnabled = this.config.enableRealTimeAnalysis;
    this.dataRetentionDays = this.config.dataRetentionDays;
    this.maxDataPoints = this.config.maxDataPoints;
    this.samplingRate = this.config.samplingRate;
    this.analysisIntervalId = null;

    if (this.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    if (this.config.enableRealTimeAnalysis && this.config.analysisInterval > 0) {
      this.startPeriodicAnalysis();
    }

    this.emit('initialized');
  }

  public collectData(data: Omit<AnalysisData, 'timestamp'>): void {
    if (!this.enabled) {
      return;
    }

    if (Math.random() > this.samplingRate) {
      return;
    }

    const analysisData: AnalysisData = {
      timestamp: Date.now(),
      ...data,
    };

    this.dataStore.push(analysisData);
    this.metrics.totalDataPoints++;

    this.enforceDataLimits();
    this.cleanupOldData();

    if (this.realTimeAnalysisEnabled) {
      this.performRealTimeAnalysis(analysisData);
    }

    this.emit('data:collected', analysisData);
  }

  public collectUserBehavior(behavior: UserBehaviorData): void {
    if (!this.config.enableUserBehaviorAnalysis) {
      return;
    }

    this.collectData({
      type: 'user_behavior',
      category: behavior.action,
      data: {
        action: behavior.action,
        target: behavior.target,
        duration: behavior.duration,
        userId: behavior.userId,
        sessionId: behavior.sessionId,
      },
      metadata: behavior.context,
    });
  }

  public collectPerformance(metric: PerformanceData): void {
    if (!this.config.enablePerformanceAnalysis) {
      return;
    }

    this.collectData({
      type: 'performance',
      category: metric.metric,
      data: {
        metric: metric.metric,
        value: metric.value,
        unit: metric.unit,
        threshold: metric.threshold,
      },
      metadata: metric.context,
    });

    if (metric.threshold && metric.value > metric.threshold) {
      this.emit('performance:threshold:exceeded', {
        metric: metric.metric,
        value: metric.value,
        threshold: metric.threshold,
        context: metric.context,
      });
    }
  }

  public performAnalysis(types: Array<'behavior' | 'performance' | 'pattern' | 'prediction'> = ['behavior', 'performance', 'pattern', 'prediction']): AnalysisResult[] {
    if (!this.enabled) {
      return [];
    }

    const results: AnalysisResult[] = [];
    const startTime = Date.now();

    if (types.includes('behavior') && this.config.enableUserBehaviorAnalysis) {
      const behaviorResult = this.analyzeBehavior();
      if (behaviorResult) {
        results.push(behaviorResult);
      }
    }

    if (types.includes('performance') && this.config.enablePerformanceAnalysis) {
      const performanceResult = this.analyzePerformance();
      if (performanceResult) {
        results.push(performanceResult);
      }
    }

    if (types.includes('pattern') && this.config.enablePatternRecognition) {
      const patternResult = this.analyzePatterns();
      if (patternResult) {
        results.push(patternResult);
      }
    }

    if (types.includes('prediction') && this.config.enablePredictiveAnalysis) {
      const predictionResult = this.generatePredictions();
      if (predictionResult) {
        results.push(predictionResult);
      }
    }

    const analysisTime = Date.now() - startTime;
    this.updateAnalysisMetrics(analysisTime);

    results.forEach(result => {
      this.analysisResults.push(result);
      this.emit('analysis:complete', result);

      if (this.config.onAnalysisComplete) {
        this.config.onAnalysisComplete(result);
      }
    });

    return results;
  }

  private analyzeBehavior(): AnalysisResult | null {
    const behaviorData = this.dataStore.filter(d => d.type === 'user_behavior');

    if (behaviorData.length === 0) {
      return null;
    }

    const insights: Insight[] = [];
    const metrics: Record<string, number> = {};

    const actionCounts = new Map<string, number>();
    const actionDurations = new Map<string, number[]>();

    behaviorData.forEach(data => {
      const action = data.data.action;
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);

      if (data.data.duration) {
        if (!actionDurations.has(action)) {
          actionDurations.set(action, []);
        }
        actionDurations.get(action)!.push(data.data.duration);
      }
    });

    const totalActions = actionCounts.size;
    const mostFrequentAction = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    metrics.totalActions = behaviorData.length;
    metrics.uniqueActions = totalActions;
    metrics.mostFrequentActionCount = mostFrequentAction[1];

    if (actionDurations.size > 0) {
      const avgDurations: Record<string, number> = {};
      actionDurations.forEach((durations, action) => {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        avgDurations[action] = avg;
      });

      insights.push({
        category: 'user_behavior',
        title: '平均操作时长分析',
        description: `各操作的平均时长已计算完成`,
        severity: 'low',
        impact: '了解用户操作效率',
        data: avgDurations,
      });
    }

    if (mostFrequentAction[1] > behaviorData.length * 0.3) {
      insights.push({
        category: 'user_behavior',
        title: '高频操作检测',
        description: `操作 "${mostFrequentAction[0]}" 占比超过30%`,
        severity: 'medium',
        impact: '可能需要优化该操作流程',
        data: {
          action: mostFrequentAction[0],
          count: mostFrequentAction[1],
          percentage: (mostFrequentAction[1] / behaviorData.length * 100).toFixed(2),
        },
      });
    }

    return {
      id: `behavior-${Date.now()}`,
      timestamp: Date.now(),
      type: 'behavior',
      summary: `分析了 ${behaviorData.length} 条用户行为数据`,
      insights,
      metrics,
      confidence: 0.85,
      recommendations: this.generateBehaviorRecommendations(insights),
    };
  }

  private analyzePerformance(): AnalysisResult | null {
    const performanceData = this.dataStore.filter(d => d.type === 'performance');

    if (performanceData.length === 0) {
      return null;
    }

    const insights: Insight[] = [];
    const metrics: Record<string, number> = {};

    const metricValues = new Map<string, number[]>();

    performanceData.forEach(data => {
      const metric = data.data.metric;
      if (!metricValues.has(metric)) {
        metricValues.set(metric, []);
      }
      metricValues.get(metric)!.push(data.data.value);
    });

    metricValues.forEach((values, metric) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length);

      metrics[`${metric}_avg`] = avg;
      metrics[`${metric}_max`] = max;
      metrics[`${metric}_min`] = min;
      metrics[`${metric}_stddev`] = stdDev;

      const thresholdData = performanceData.find(d => d.data.metric === metric && d.data.threshold);
      if (thresholdData) {
        const threshold = thresholdData.data.threshold;
        const exceedCount = values.filter(v => v > threshold).length;
        const exceedRate = exceedCount / values.length;

        if (exceedRate > 0.1) {
          insights.push({
            category: 'performance',
            title: `性能指标 ${metric} 超标`,
            description: `${metric} 超过阈值的比例为 ${(exceedRate * 100).toFixed(2)}%`,
            severity: exceedRate > 0.3 ? 'high' : 'medium',
            impact: '可能影响用户体验',
            data: {
              metric,
              threshold,
              exceedCount,
              exceedRate,
              avg,
              max,
            },
          });
        }
      }

      if (stdDev > avg * 0.5) {
        insights.push({
          category: 'performance',
          title: `性能指标 ${metric} 波动较大`,
          description: `${metric} 的标准差较大，性能不稳定`,
          severity: 'medium',
          impact: '需要优化性能稳定性',
          data: {
            metric,
            avg,
            stdDev,
            variance: stdDev / avg,
          },
        });
      }
    });

    return {
      id: `performance-${Date.now()}`,
      timestamp: Date.now(),
      type: 'performance',
      summary: `分析了 ${performanceData.length} 条性能数据`,
      insights,
      metrics,
      confidence: 0.9,
      recommendations: this.generatePerformanceRecommendations(insights),
    };
  }

  private analyzePatterns(): AnalysisResult | null {
    if (!this.config.enablePatternRecognition) {
      return null;
    }

    const insights: Insight[] = [];
    const metrics: Record<string, number> = {};

    const behaviorData = this.dataStore.filter(d => d.type === 'user_behavior');
    const patterns = this.detectPatterns(behaviorData);

    patterns.forEach(pattern => {
      const existingPattern = this.detectedPatterns.find(p => p.type === pattern.type);

      if (existingPattern) {
        existingPattern.occurrences.push(...pattern.occurrences);
        existingPattern.lastDetected = pattern.lastDetected;
        existingPattern.frequency = existingPattern.occurrences.length;
        existingPattern.trend = this.calculateTrend(existingPattern.occurrences);
      } else {
        this.detectedPatterns.push(pattern);
        this.metrics.patternsDetected++;

        if (this.config.onPatternDetected) {
          this.config.onPatternDetected(pattern);
        }
      }
    });

    metrics.totalPatterns = this.detectedPatterns.length;
    metrics.newPatterns = patterns.length;

    if (patterns.length > 0) {
      insights.push({
        category: 'pattern',
        title: '检测到新的行为模式',
        description: `发现 ${patterns.length} 个新的行为模式`,
        severity: 'low',
        impact: '可用于优化用户体验',
        data: patterns.map(p => ({
          type: p.type,
          name: p.name,
          confidence: p.confidence,
          frequency: p.frequency,
        })),
      });
    }

    return {
      id: `pattern-${Date.now()}`,
      timestamp: Date.now(),
      type: 'pattern',
      summary: `模式识别完成，共检测到 ${this.detectedPatterns.length} 个模式`,
      insights,
      metrics,
      confidence: 0.8,
      recommendations: this.generatePatternRecommendations(this.detectedPatterns),
    };
  }

  private detectPatterns(data: AnalysisData[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    const actionSequences = new Map<string, number[]>();
    const timePatterns = new Map<string, number[]>();

    for (let i = 0; i < data.length - 1; i++) {
      const current = data[i];
      const next = data[i + 1];

      if (current.type === 'user_behavior' && next.type === 'user_behavior') {
        const sequence = `${current.data.action} -> ${next.data.action}`;
        const timeDiff = next.timestamp - current.timestamp;

        if (!actionSequences.has(sequence)) {
          actionSequences.set(sequence, []);
        }
        actionSequences.get(sequence)!.push(timeDiff);

        if (!timePatterns.has(current.data.action)) {
          timePatterns.set(current.data.action, []);
        }
        timePatterns.get(current.data.action)!.push(timeDiff);
      }
    }

    actionSequences.forEach((times, sequence) => {
      if (times.length >= 3) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const stdDev = Math.sqrt(times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length);
        const confidence = Math.max(0, 1 - stdDev / avgTime);

        if (confidence > 0.7) {
          patterns.push({
            id: `pattern-${sequence.replace(/\s+/g, '-')}`,
            type: 'action_sequence',
            name: `操作序列: ${sequence}`,
            description: `用户经常在 ${avgTime.toFixed(0)}ms 内执行此操作序列`,
            confidence,
            frequency: times.length,
            occurrences: times.map((t, idx) => ({
              timestamp: Date.now() - (times.length - idx) * 1000,
              context: { sequence },
              data: { timeDiff: t },
            })),
            firstDetected: Date.now() - times.length * 1000,
            lastDetected: Date.now(),
            trend: 'stable',
          });
        }
      }
    });

    return patterns;
  }

  private calculateTrend(occurrences: PatternOccurrence[]): 'increasing' | 'decreasing' | 'stable' | 'fluctuating' {
    if (occurrences.length < 3) {
      return 'stable';
    }

    const recentCount = occurrences.slice(-Math.floor(occurrences.length / 3)).length;
    const total = occurrences.length;
    const expectedCount = total / 3;

    if (recentCount > expectedCount * 1.5) {
      return 'increasing';
    } else if (recentCount < expectedCount * 0.5) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  private generatePredictions(): AnalysisResult | null {
    if (!this.config.enablePredictiveAnalysis) {
      return null;
    }

    const insights: Insight[] = [];
    const metrics: Record<string, number> = {};

    const behaviorPredictions = this.predictUserBehavior();
    const performancePredictions = this.predictPerformance();

    [...behaviorPredictions, ...performancePredictions].forEach(prediction => {
      this.predictions.push(prediction);
      this.metrics.predictionsGenerated++;

      if (this.config.onPredictionGenerated) {
        this.config.onPredictionGenerated(prediction);
      }
    });

    metrics.totalPredictions = this.predictions.length;
    metrics.newPredictions = behaviorPredictions.length + performancePredictions.length;

    if (behaviorPredictions.length > 0 || performancePredictions.length > 0) {
      insights.push({
        category: 'prediction',
        title: '生成新的预测',
        description: `基于历史数据生成了 ${behaviorPredictions.length + performancePredictions.length} 个预测`,
        severity: 'low',
        impact: '可用于提前优化系统',
        data: {
          behaviorPredictions: behaviorPredictions.length,
          performancePredictions: performancePredictions.length,
        },
      });
    }

    return {
      id: `prediction-${Date.now()}`,
      timestamp: Date.now(),
      type: 'prediction',
      summary: `预测分析完成，共生成 ${this.predictions.length} 个预测`,
      insights,
      metrics,
      confidence: 0.75,
      recommendations: this.generatePredictionRecommendations([...behaviorPredictions, ...performancePredictions]),
    };
  }

  private predictUserBehavior(): Prediction[] {
    const predictions: Prediction[] = [];
    const behaviorData = this.dataStore.filter(d => d.type === 'user_behavior');

    if (behaviorData.length < 10) {
      return predictions;
    }

    const actionCounts = new Map<string, number>();
    behaviorData.forEach(data => {
      actionCounts.set(data.data.action, (actionCounts.get(data.data.action) || 0) + 1);
    });

    const totalActions = behaviorData.length;
    const topActions = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topActions.forEach(([action, count]) => {
      const probability = count / totalActions;
      const confidence = Math.min(0.9, probability * 1.5);

      if (probability > 0.2) {
        predictions.push({
          id: `pred-behavior-${action}-${Date.now()}`,
          type: 'user_behavior',
          target: action,
          predictedValue: {
            action,
            probability,
            expectedCount: Math.round(probability * 100),
          },
          confidence,
          timeframe: 'next_hour',
          factors: [
            {
              name: '历史频率',
              weight: 0.7,
              value: probability,
              impact: 'positive',
            },
            {
              name: '最近趋势',
              weight: 0.3,
              value: this.calculateRecentTrend(action, behaviorData),
              impact: 'positive',
            },
          ],
          generatedAt: Date.now(),
          validUntil: Date.now() + 3600000,
        });
      }
    });

    return predictions;
  }

  private predictPerformance(): Prediction[] {
    const predictions: Prediction[] = [];
    const performanceData = this.dataStore.filter(d => d.type === 'performance');

    if (performanceData.length < 10) {
      return predictions;
    }

    const metricValues = new Map<string, number[]>();
    performanceData.forEach(data => {
      const metric = data.data.metric;
      if (!metricValues.has(metric)) {
        metricValues.set(metric, []);
      }
      metricValues.get(metric)!.push(data.data.value);
    });

    metricValues.forEach((values, metric) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const recentAvg = values.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, values.length);
      const trend = (recentAvg - avg) / avg;

      if (Math.abs(trend) > 0.1) {
        const predictedValue = avg * (1 + trend * 2);
        const confidence = Math.min(0.85, 0.5 + Math.abs(trend) * 2);

        predictions.push({
          id: `pred-perf-${metric}-${Date.now()}`,
          type: 'performance',
          target: metric,
          predictedValue: {
            metric,
            currentValue: recentAvg,
            predictedValue,
            trend: trend > 0 ? 'increasing' : 'decreasing',
          },
          confidence,
          timeframe: 'next_hour',
          factors: [
            {
              name: '历史平均值',
              weight: 0.5,
              value: avg,
              impact: 'neutral',
            },
            {
              name: '最近趋势',
              weight: 0.5,
              value: trend,
              impact: trend > 0 ? 'positive' : 'negative',
            },
          ],
          generatedAt: Date.now(),
          validUntil: Date.now() + 3600000,
        });
      }
    });

    return predictions;
  }

  private calculateRecentTrend(action: string, behaviorData: AnalysisData[]): number {
    const recentData = behaviorData.filter(d => d.data.action === action).slice(-10);
    if (recentData.length < 2) {
      return 0;
    }

    const recentCount = recentData.length;
    const totalRecent = behaviorData.slice(-100).length;
    const olderCount = behaviorData.filter(d => d.data.action === action && d.timestamp < recentData[0].timestamp).length;

    return (recentCount - olderCount) / olderCount;
  }

  private performRealTimeAnalysis(data: AnalysisData): void {
    if (data.type === 'performance' && data.data.threshold) {
      if (data.data.value > data.data.threshold) {
        this.emit('realtime:alert', {
          type: 'performance_threshold',
          metric: data.data.metric,
          value: data.data.value,
          threshold: data.data.threshold,
          timestamp: data.timestamp,
        });
      }
    }

    if (data.type === 'user_behavior') {
      const recentActions = this.dataStore
        .filter(d => d.type === 'user_behavior' && d.data.action === data.data.action)
        .slice(-5);

      if (recentActions.length >= 5) {
        const avgDuration = recentActions
          .filter(d => d.data.duration)
          .map(d => d.data.duration)
          .reduce((a, b) => a + b, 0) / recentActions.filter(d => d.data.duration).length;

        if (data.data.duration && data.data.duration > avgDuration * 2) {
          this.emit('realtime:alert', {
            type: 'behavior_anomaly',
            action: data.data.action,
            duration: data.data.duration,
            avgDuration,
            timestamp: data.timestamp,
          });
        }
      }
    }
  }

  private enforceDataLimits(): void {
    if (this.dataStore.length > this.maxDataPoints) {
      const excess = this.dataStore.length - this.maxDataPoints;
      this.dataStore.splice(0, excess);
    }
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (this.dataRetentionDays * 24 * 60 * 60 * 1000);
    const initialLength = this.dataStore.length;

    this.dataStore = this.dataStore.filter(d => d.timestamp > cutoffTime);
    this.analysisResults = this.analysisResults.filter(r => r.timestamp > cutoffTime);
    this.predictions = this.predictions.filter(p => p.validUntil > Date.now());

    const retentionRate = this.dataStore.length / initialLength;
    this.metrics.dataRetentionRate = retentionRate;
  }

  private startPeriodicAnalysis(): void {
    if (this.analysisIntervalId) {
      this.stopPeriodicAnalysis();
    }

    this.analysisIntervalId = setInterval(() => {
      this.performAnalysis();
    }, this.config.analysisInterval);
  }

  private stopPeriodicAnalysis(): void {
    if (this.analysisIntervalId) {
      clearInterval(this.analysisIntervalId);
      this.analysisIntervalId = null;
    }
  }

  private updateAnalysisMetrics(analysisTime: number): void {
    this.metrics.analyzedDataPoints += this.dataStore.length;
    this.metrics.lastAnalysisTime = analysisTime;

    const history = this.analysisHistory.get('analysis_time') || [];
    history.push(analysisTime);
    if (history.length > 100) {
      history.shift();
    }
    this.analysisHistory.set('analysis_time', history);

    this.metrics.averageAnalysisTime = history.reduce((a, b) => a + b, 0) / history.length;
  }

  private generateBehaviorRecommendations(insights: Insight[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    insights.forEach(insight => {
      if (insight.category === 'user_behavior' && insight.severity === 'medium') {
        recommendations.push({
          action: '优化高频操作',
          priority: 'medium',
          description: `为高频操作 "${insight.data.action}" 提供快捷方式或优化流程`,
          expectedImpact: '提升用户操作效率约20%',
          implementation: '添加快捷键、优化UI布局或提供批量操作功能',
        });
      }
    });

    return recommendations;
  }

  private generatePerformanceRecommendations(insights: Insight[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    insights.forEach(insight => {
      if (insight.category === 'performance' && insight.severity === 'high') {
        recommendations.push({
          action: `优化 ${insight.data.metric} 性能`,
          priority: 'high',
          description: `${insight.data.metric} 超过阈值的比例为 ${(insight.data.exceedRate * 100).toFixed(2)}%`,
          expectedImpact: '提升系统响应速度和用户体验',
          implementation: '分析性能瓶颈，优化算法或增加缓存',
        });
      }
    });

    return recommendations;
  }

  private generatePatternRecommendations(patterns: DetectedPattern[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    patterns.filter(p => p.confidence > 0.8).forEach(pattern => {
      if (pattern.type === 'action_sequence') {
        recommendations.push({
          action: '优化操作序列',
          priority: 'low',
          description: `用户经常执行操作序列 "${pattern.name}"`,
          expectedImpact: '减少用户操作步骤',
          implementation: '考虑将此序列合并为一个操作或提供自动化功能',
        });
      }
    });

    return recommendations;
  }

  private generatePredictionRecommendations(predictions: Prediction[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    predictions.filter(p => p.confidence > 0.7).forEach(prediction => {
      if (prediction.type === 'performance' && prediction.predictedValue.trend === 'increasing') {
        recommendations.push({
          action: '预防性能下降',
          priority: 'medium',
          description: `预测 ${prediction.target} 性能可能下降`,
          expectedImpact: '避免性能问题影响用户体验',
          implementation: '提前优化相关代码或增加资源',
        });
      }
    });

    return recommendations;
  }

  public getAnalysisResults(limit?: number): AnalysisResult[] {
    if (limit) {
      return this.analysisResults.slice(-limit);
    }
    return [...this.analysisResults];
  }

  public getDetectedPatterns(limit?: number): DetectedPattern[] {
    if (limit) {
      return this.detectedPatterns.slice(-limit);
    }
    return [...this.detectedPatterns];
  }

  public getPredictions(validOnly: boolean = true, limit?: number): Prediction[] {
    let predictions = [...this.predictions];

    if (validOnly) {
      predictions = predictions.filter(p => p.validUntil > Date.now());
    }

    if (limit) {
      predictions = predictions.slice(-limit);
    }

    return predictions;
  }

  public getMetrics(): AnalysisMetrics {
    return { ...this.metrics };
  }

  public getDataStoreStats(): { total: number; byType: Record<string, number>; byCategory: Record<string, number> } {
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    this.dataStore.forEach(data => {
      byType[data.type] = (byType[data.type] || 0) + 1;
      byCategory[data.category] = (byCategory[data.category] || 0) + 1;
    });

    return {
      total: this.dataStore.length,
      byType,
      byCategory,
    };
  }

  public clearData(olderThan?: number): void {
    if (olderThan) {
      this.dataStore = this.dataStore.filter(d => d.timestamp > olderThan);
      this.analysisResults = this.analysisResults.filter(r => r.timestamp > olderThan);
    } else {
      this.dataStore = [];
      this.analysisResults = [];
      this.detectedPatterns = [];
      this.predictions = [];
    }

    this.emit('data:cleared');
  }

  public exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        dataStore: this.dataStore,
        analysisResults: this.analysisResults,
        detectedPatterns: this.detectedPatterns,
        predictions: this.predictions,
        metrics: this.metrics,
      }, null, 2);
    } else {
      const headers = ['timestamp', 'type', 'category', 'data'];
      const rows = this.dataStore.map(d => [
        d.timestamp,
        d.type,
        d.category,
        JSON.stringify(d.data),
      ]);

      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (enabled && !this.analysisIntervalId && this.config.enableRealTimeAnalysis) {
      this.startPeriodicAnalysis();
    } else if (!enabled && this.analysisIntervalId) {
      this.stopPeriodicAnalysis();
    }

    this.emit('enabled:changed', enabled);
  }

  public setRealTimeAnalysis(enabled: boolean): void {
    this.realTimeAnalysisEnabled = enabled;

    if (enabled && this.config.analysisInterval > 0) {
      this.startPeriodicAnalysis();
    } else {
      this.stopPeriodicAnalysis();
    }

    this.emit('realtime:changed', enabled);
  }

  public updateConfig(config: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.analysisInterval !== undefined) {
      if (this.config.enableRealTimeAnalysis && this.config.analysisInterval > 0) {
        this.startPeriodicAnalysis();
      } else {
        this.stopPeriodicAnalysis();
      }
    }

    this.emit('config:updated', this.config);
  }

  public destroy(): void {
    this.stopPeriodicAnalysis();
    this.clearData();
    this.removeAllListeners();
    this.emit('destroyed');
  }
}
