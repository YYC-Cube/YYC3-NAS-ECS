// src/learning/LearningSystem.ts
  import { EventEmitter } from 'events';

  // 核心类型定义
  export interface LearningConfig {
    engine: any; // AutonomousAIEngine实例
    toolRegistry: any; // ToolRegistry实例
    storagePath?: string;
    learningRate?: number;
  }

  export interface InteractionData {
    type: 'message' | 'tool_execution' | 'user_action';
    timestamp: Date;
    userId?: string;
    context: Record<string, any>;
    result: any;
    metrics?: Record<string, any>;
  }

  export interface LearningInsight {
    id: string;
    type: 'pattern' | 'recommendation' | 'anomaly';
    confidence: number;
    data: any;
    timestamp: Date;
  }

  export interface LearningReport {
    timestamp: Date;
    totalInteractions: number;
    insights: LearningInsight[];
    recommendations: string[];
    metrics: Record<string, any>;
  }

  /**
   * LearningSystem
   * 学习系统，收集数据、分析模式、生成洞察
   */
  export class LearningSystem extends EventEmitter {
    private config: LearningConfig;
    private interactions: InteractionData[] = [];
    private insights: LearningInsight[] = [];
    private isLearning = false;

    constructor(config: LearningConfig) {
      super();
      this.config = config;
      this.initialize();
    }

    /**
     * 初始化学习系统
     */
    private initialize(): void {
      // 设置事件监听
      this.config.engine.on('message:processed', this.handleMessageProcessed.bind(this))
      this.config.toolRegistry.on('tool:executed', this.handleToolExecuted.bind(this));

      // 启动定期学习
      this.startPeriodicLearning();
    }

    /**
     * 记录交互数据
     */
    recordInteraction(data: InteractionData): void {
      this.interactions.push(data);
      this.emit('interaction:recorded', data);

      // 保持最近N条记录（简化版：实际应该持久化到数据库）
      if (this.interactions.length > 1000) {
        this.interactions.shift();
      }
    }

    /**
     * 处理消息已处理事件
     */
    private handleMessageProcessed(data: any): void {
      this.recordInteraction({
        type: 'message',
        timestamp: new Date(),
        userId: data.message?.source,
        context: {
          messageType: data.message?.type,
          processingTime: data.response?.processingTime
        },
        result: data.response,
        metrics: {
          success: data.response?.success,
          errorType: data.response?.error?.name
        }
      });
    }

    /**
     * 处理工具已执行事件
     */
    private handleToolExecuted(data: any): void {
      this.recordInteraction({
        type: 'tool_execution',
        timestamp: new Date(),
        userId: data.userId,
        context: {
          toolId: data.toolId,
          parameters: data.parameters
        },
        result: data.result,
        metrics: {
          success: data.result?.success,
          executionTime: data.result?.executionTime
        }
      });
    }

    /**
     * 开始定期学习
     */
    private startPeriodicLearning(): void {
      // 每5分钟执行一次学习
      setInterval(() => {
        this.learn();
      }, 5 * 60 * 1000);
    }

    /**
     * 执行学习
     */
    async learn(): Promise<void> {
      if (this.isLearning) return;

      this.isLearning = true;
      this.emit('learning:started');

      try {
        // 1. 分析模式
        const patterns = await this.analyzePatterns();

        // 2. 检测异常
        const anomalies = await this.detectAnomalies();

        // 3. 生成推荐
        const recommendations = await this.generateRecommendations();

        // 4. 生成洞察
        const newInsights: LearningInsight[] = [
          ...patterns.map(p => ({ ...p, id: this.generateId(), timestamp: new Date() }) as LearningInsight),
          ...anomalies.map(a => ({ ...a, id: this.generateId(), timestamp: new Date() }) as LearningInsight),
          ...recommendations.map(r => ({ ...r, id: this.generateId(), timestamp: new Date() }) as LearningInsight)
        ];

        // 5. 存储洞察
        this.insights.push(...newInsights);

        // 6. 触发事件
        this.emit('learning:completed', { insights: newInsights });

      } catch (error) {
        console.error('Learning failed:', error);
        this.emit('learning:failed', { error });
      } finally {
        this.isLearning = false;
      }
    }

    /**
     * 分析模式
     */
    private async analyzePatterns(): Promise<Partial<LearningInsight>[]> {
      const patterns: Partial<LearningInsight>[] = [];

      // 1. 分析工具使用频率
      const toolUsage = new Map<string, number>();
      this.interactions
        .filter(i => i.type === 'tool_execution')
        .forEach(i => {
          const toolId = i.context.toolId;
          toolUsage.set(toolId, (toolUsage.get(toolId) || 0) + 1);
        });

      // 找出最常用的工具
      const sortedTools = Array.from(toolUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      if (sortedTools.length > 0) {
        patterns.push({
          type: 'pattern',
          confidence: 0.8,
          data: {
            patternType: 'tool_usage',
            message: 'Most used tools',
            tools: sortedTools.map(([toolId, count]) => ({ toolId, count }))
          }
        });
      }

      // 2. 分析消息类型频率
      const messageTypeUsage = new Map<string, number>();
      this.interactions
        .filter(i => i.type === 'message')
        .forEach(i => {
          const messageType = i.context.messageType;
          messageTypeUsage.set(messageType, (messageTypeUsage.get(messageType) || 0) +
1);
        });

      const sortedMessageTypes = Array.from(messageTypeUsage.entries())
        .sort((a, b) => b[1] - a[1]);

      if (sortedMessageTypes.length > 0) {
        patterns.push({
          type: 'pattern',
          confidence: 0.7,
          data: {
            patternType: 'message_usage',
            message: 'Most common message types',
            messageTypes: sortedMessageTypes.map(([type, count]) => ({ type, count }))
          }
        });
      }

      return patterns;
    }

    /**
     * 检测异常
     */
    private async detectAnomalies(): Promise<Partial<LearningInsight>[]> {
      const anomalies: Partial<LearningInsight>[] = [];

      // 1. 检测高频错误
      const errorCounts = new Map<string, number>();
      this.interactions
        .filter(i => !i.metrics?.success)
        .forEach(i => {
          const errorType = i.metrics?.errorType || 'unknown';
          errorCounts.set(errorType, (errorCounts.get(errorType) || 0) + 1);
        });

      Array.from(errorCounts.entries()).forEach(([errorType, count]) => {
        if (count > 5) { // 阈值：5次以上
          anomalies.push({
            type: 'anomaly',
            confidence: 0.9,
            data: {
              anomalyType: 'high_error_frequency',
              message: `High frequency of ${errorType} errors`,
              errorType,
              count
            }
          });
        }
      });

      // 2. 检测异常执行时间
      const executionTimes = this.interactions
        .filter(i => i.type === 'tool_execution' && i.metrics?.executionTime)
        .map(i => i.metrics!.executionTime!);

      if (executionTimes.length > 0) {
        const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.
length;
        const stdDev = Math.sqrt(
          executionTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) /
executionTimes.length
        );

        const slowExecutions = this.interactions
          .filter(i =>
            i.type === 'tool_execution' &&
            i.metrics?.executionTime &&
            i.metrics.executionTime! > avgTime + 2 * stdDev
          );

        if (slowExecutions.length > 0) {
          anomalies.push({
            type: 'anomaly',
            confidence: 0.8,
            data: {
              anomalyType: 'slow_execution',
              message: 'Some tools are executing unusually slowly',
              slowExecutions: slowExecutions.length,
              avgTime,
              stdDev
            }
          });
        }
      }

      return anomalies;
    }

    /**
     * 生成推荐
     */
    private async generateRecommendations(): Promise<Partial<LearningInsight>[]> {
      const recommendations: Partial<LearningInsight>[] = [];

      // 1. 基于错误推荐的修复
      const errors = this.interactions.filter(i => !i.metrics?.success);
      if (errors.length > 10) {
        recommendations.push({
          type: 'recommendation',
          confidence: 0.7,
          data: {
            recommendationType: 'error_handling',
            message: 'Consider implementing better error handling',
            errorRate: errors.length / this.interactions.length
          }
        });
      }

      // 2. 基于工具使用推荐的优化
      const toolExecutions = this.interactions.filter(i => i.type === 'tool_execution');
      if (toolExecutions.length > 0) {
        const avgExecutionTime = toolExecutions.reduce((sum, i) =>
          sum + (i.metrics?.executionTime || 0), 0) / toolExecutions.length;

        if (avgExecutionTime > 1000) { // 阈值：1秒
          recommendations.push({
            type: 'recommendation',
            confidence: 0.6,
            data: {
              recommendationType: 'performance_optimization',
              message: 'Some tools are slow, consider optimization',
              avgExecutionTime
            }
          });
        }
      }

      return recommendations;
    }

    /**
     * 生成学习报告
     */
    generateReport(): LearningReport {
      return {
        timestamp: new Date(),
        totalInteractions: this.interactions.length,
        insights: this.insights.slice(-10), // 最近10个洞察
        recommendations: this.insights
          .filter(i => i.type === 'recommendation')
          .map(i => i.data.message),
        metrics: {
          messageCount: this.interactions.filter(i => i.type === 'message').length,
          toolExecutionCount: this.interactions.filter(i => i.type ===
'tool_execution').length,
          successRate: this.interactions.filter(i => i.metrics?.success).length / this.
interactions.length
        }
      };
    }

    /**
     * 获取洞察
     */
    getInsights(type?: LearningInsight['type']): LearningInsight[] {
      if (type) {
        return this.insights.filter(i => i.type === type);
      }
      return this.insights;
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
      return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
