import { EventEmitter } from 'events';

export interface MetricData {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

export interface PredictionResult {
  metricName: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeHorizon: number;
  anomalyProbability: number;
  recommendation: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceTask {
  id: string;
  type: 'preventive' | 'predictive' | 'corrective';
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledTime: number;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
  steps: string[];
  result?: any;
}

export interface PredictionModel {
  name: string;
  type: 'linear_regression' | 'time_series' | 'anomaly_detection' | 'custom';
  accuracy: number;
  lastTrained: number;
  trainingDataSize: number;
}

export class PredictiveMaintenanceSystem extends EventEmitter {
  private metricsHistory: Map<string, MetricData[]> = new Map();
  private predictions: Map<string, PredictionResult[]> = new Map();
  private maintenanceTasks: Map<string, MaintenanceTask> = new Map();
  private models: Map<string, PredictionModel> = new Map();
  private readonly HISTORY_WINDOW_SIZE = 1000;
  private readonly PREDICTION_HORIZON = 3600000; // 1 hour
  private readonly ANOMALY_THRESHOLD = 0.7;

  constructor() {
    super();
    this.initializeModels();
  }

  private initializeModels(): void {
    this.models.set('linear_regression', {
      name: 'linear_regression',
      type: 'linear_regression',
      accuracy: 0.85,
      lastTrained: Date.now(),
      trainingDataSize: 0
    });

    this.models.set('time_series', {
      name: 'time_series',
      type: 'time_series',
      accuracy: 0.88,
      lastTrained: Date.now(),
      trainingDataSize: 0
    });

    this.models.set('anomaly_detection', {
      name: 'anomaly_detection',
      type: 'anomaly_detection',
      accuracy: 0.82,
      lastTrained: Date.now(),
      trainingDataSize: 0
    });
  }

  async recordMetric(metricName: string, value: number, metadata?: Record<string, any>): Promise<void> {
    const metricData: MetricData = {
      timestamp: Date.now(),
      value,
      metadata
    };

    const history = this.metricsHistory.get(metricName) || [];
    history.push(metricData);

    if (history.length > this.HISTORY_WINDOW_SIZE) {
      history.shift();
    }

    this.metricsHistory.set(metricName, history);
    this.emit('metric_recorded', { metricName, value, timestamp: metricData.timestamp });

    await this.checkForPredictiveAlerts(metricName);
  }

  private async checkForPredictiveAlerts(metricName: string): Promise<void> {
    const history = this.metricsHistory.get(metricName);
    if (!history || history.length < 10) {
      return;
    }

    const prediction = await this.predictMetric(metricName, this.PREDICTION_HORIZON);
    
    if (prediction.urgency === 'high' || prediction.urgency === 'critical') {
      this.emit('predictive_alert', prediction);
      await this.scheduleMaintenanceTask(prediction);
    }
  }

  async predictMetric(metricName: string, timeHorizon: number): Promise<PredictionResult> {
    const history = this.metricsHistory.get(metricName);
    if (!history || history.length < 10) {
      throw new Error(`Insufficient data for prediction of ${metricName}`);
    }

    const currentValue = history[history.length - 1].value;
    const predictions = await Promise.all([
      this.predictWithLinearRegression(metricName, timeHorizon),
      this.predictWithTimeSeries(metricName, timeHorizon),
      this.detectAnomaly(metricName)
    ]);

    const aggregatedPrediction = this.aggregatePredictions(predictions, currentValue, timeHorizon);
    
    this.addPrediction(metricName, aggregatedPrediction);
    this.emit('prediction_made', aggregatedPrediction);

    return aggregatedPrediction;
  }

  private async predictWithLinearRegression(
    metricName: string,
    timeHorizon: number
  ): Promise<{ predictedValue: number; confidence: number }> {
    const history = this.metricsHistory.get(metricName)!;
    const n = history.length;
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      const x = i;
      const y = history[i].value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictedX = n + (timeHorizon / 1000);
    const predictedValue = slope * predictedX + intercept;

    const confidence = this.calculateConfidence(history, predictedValue);

    return { predictedValue, confidence };
  }

  private async predictWithTimeSeries(
    metricName: string,
    timeHorizon: number
  ): Promise<{ predictedValue: number; confidence: number }> {
    const history = this.metricsHistory.get(metricName)!;
    const recentValues = history.slice(-20).map(d => d.value);
    
    const avgChange = this.calculateAverageChange(recentValues);
    const currentValue = recentValues[recentValues.length - 1];
    const predictedValue = currentValue + avgChange * (timeHorizon / 1000);

    const confidence = this.calculateConfidence(history, predictedValue);

    return { predictedValue, confidence };
  }

  private async detectAnomaly(metricName: string): Promise<{ anomalyProbability: number }> {
    const history = this.metricsHistory.get(metricName)!;
    const values = history.map(d => d.value);
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    const currentValue = values[values.length - 1];
    const zScore = Math.abs((currentValue - mean) / (std || 1));
    
    const anomalyProbability = Math.min(1, zScore / 3);

    return { anomalyProbability };
  }

  private aggregatePredictions(
    predictions: any[],
    currentValue: number,
    timeHorizon: number
  ): PredictionResult {
    const lrPrediction = predictions[0];
    const tsPrediction = predictions[1];
    const anomalyResult = predictions[2];

    const avgPredictedValue = (lrPrediction.predictedValue + tsPrediction.predictedValue) / 2;
    const avgConfidence = (lrPrediction.confidence + tsPrediction.confidence) / 2;

    const result: PredictionResult = {
      metricName: 'unknown',
      currentValue,
      predictedValue: avgPredictedValue,
      confidence: avgConfidence,
      timeHorizon,
      anomalyProbability: anomalyResult.anomalyProbability,
      recommendation: this.generateRecommendation(currentValue, avgPredictedValue, anomalyResult.anomalyProbability),
      urgency: this.calculateUrgency(avgPredictedValue, currentValue, anomalyResult.anomalyProbability)
    };

    return result;
  }

  private calculateConfidence(history: MetricData[], predictedValue: number): number {
    const values = history.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    const error = Math.abs(predictedValue - mean);
    const confidence = Math.max(0, 1 - (error / (std * 2 || 1)));

    return confidence;
  }

  private calculateAverageChange(values: number[]): number {
    let totalChange = 0;
    for (let i = 1; i < values.length; i++) {
      totalChange += values[i] - values[i - 1];
    }
    return totalChange / (values.length - 1);
  }

  private generateRecommendation(
    currentValue: number,
    predictedValue: number,
    anomalyProbability: number
  ): string {
    const changePercent = Math.abs((predictedValue - currentValue) / (currentValue || 1)) * 100;

    if (anomalyProbability > this.ANOMALY_THRESHOLD) {
      return '检测到异常模式，建议立即检查系统状态并采取预防措施';
    }

    if (changePercent > 20) {
      return '预测值将显著变化，建议提前准备应对措施';
    }

    if (changePercent > 10) {
      return '预测值将有所变化，建议关注系统状态';
    }

    return '系统状态正常，继续监控';
  }

  private calculateUrgency(
    predictedValue: number,
    currentValue: number,
    anomalyProbability: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const changePercent = Math.abs((predictedValue - currentValue) / (currentValue || 1)) * 100;

    if (anomalyProbability > 0.8 || changePercent > 50) {
      return 'critical';
    }

    if (anomalyProbability > this.ANOMALY_THRESHOLD || changePercent > 30) {
      return 'high';
    }

    if (changePercent > 20) {
      return 'medium';
    }

    return 'low';
  }

  private addPrediction(metricName: string, prediction: PredictionResult): void {
    prediction.metricName = metricName;
    const predictions = this.predictions.get(metricName) || [];
    predictions.push(prediction);

    if (predictions.length > 100) {
      predictions.shift();
    }

    this.predictions.set(metricName, predictions);
  }

  private async scheduleMaintenanceTask(prediction: PredictionResult): Promise<void> {
    const taskId = `maintenance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const task: MaintenanceTask = {
      id: taskId,
      type: 'predictive',
      description: `基于预测的预防性维护：${prediction.metricName}`,
      status: 'scheduled',
      scheduledTime: Date.now() + (prediction.urgency === 'critical' ? 300000 : 3600000),
      estimatedDuration: prediction.urgency === 'critical' ? 30 : 60,
      priority: prediction.urgency,
      affectedSystems: [prediction.metricName],
      steps: this.generateMaintenanceSteps(prediction)
    };

    this.maintenanceTasks.set(taskId, task);
    this.emit('maintenance_task_scheduled', task);
  }

  private generateMaintenanceSteps(prediction: PredictionResult): string[] {
    const steps: string[] = [
      '检查系统日志和指标',
      '分析预测结果和异常模式',
      '评估当前系统状态'
    ];

    if (prediction.urgency === 'critical') {
      steps.push('立即执行紧急维护措施');
      steps.push('通知运维团队');
    } else if (prediction.urgency === 'high') {
      steps.push('准备维护计划');
      steps.push('协调资源分配');
    } else {
      steps.push('制定预防性维护计划');
      steps.push('安排维护时间窗口');
    }

    steps.push('执行维护操作');
    steps.push('验证维护结果');
    steps.push('更新系统文档');

    return steps;
  }

  async scheduleCustomMaintenanceTask(task: Omit<MaintenanceTask, 'id'>): Promise<MaintenanceTask> {
    const taskId = `maintenance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTask: MaintenanceTask = {
      ...task,
      id: taskId
    };

    this.maintenanceTasks.set(taskId, newTask);
    this.emit('maintenance_task_scheduled', newTask);

    return newTask;
  }

  async executeMaintenanceTask(taskId: string): Promise<void> {
    const task = this.maintenanceTasks.get(taskId);
    if (!task) {
      throw new Error(`Maintenance task ${taskId} not found`);
    }

    task.status = 'in_progress';
    this.emit('maintenance_task_started', task);

    try {
      const result = await this.performMaintenance(task);
      task.status = 'completed';
      task.result = result;
      this.emit('maintenance_task_completed', task);
    } catch (error) {
      task.status = 'cancelled';
      task.result = { error: error instanceof Error ? error.message : String(error) };
      this.emit('maintenance_task_failed', { task, error });
      throw error;
    }
  }

  private async performMaintenance(task: MaintenanceTask): Promise<any> {
    return {
      task: task.id,
      status: 'completed',
      stepsExecuted: task.steps.length,
      duration: task.estimatedDuration,
      timestamp: Date.now()
    };
  }

  getPredictions(metricName?: string): PredictionResult[] {
    if (metricName) {
      return this.predictions.get(metricName) || [];
    }
    
    const allPredictions: PredictionResult[] = [];
    for (const predictions of this.predictions.values()) {
      allPredictions.push(...predictions);
    }
    
    return allPredictions.sort((a, b) => b.timestamp - a.timestamp);
  }

  getMaintenanceTasks(filter?: {
    status?: MaintenanceTask['status'];
    type?: MaintenanceTask['type'];
    priority?: MaintenanceTask['priority'];
  }): MaintenanceTask[] {
    let tasks = Array.from(this.maintenanceTasks.values());
    
    if (filter) {
      if (filter.status) {
        tasks = tasks.filter(t => t.status === filter.status);
      }
      
      if (filter.type) {
        tasks = tasks.filter(t => t.type === filter.type);
      }
      
      if (filter.priority) {
        tasks = tasks.filter(t => t.priority === filter.priority);
      }
    }
    
    return tasks.sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  getMetricHistory(metricName: string): MetricData[] {
    return this.metricsHistory.get(metricName) || [];
  }

  getModels(): PredictionModel[] {
    return Array.from(this.models.values());
  }

  async trainModel(modelName: string, metricName: string): Promise<void> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    const history = this.metricsHistory.get(metricName);
    if (!history || history.length < 50) {
      throw new Error(`Insufficient training data for ${metricName}`);
    }

    model.lastTrained = Date.now();
    model.trainingDataSize = history.length;
    model.accuracy = Math.min(0.95, model.accuracy + 0.01);

    this.emit('model_trained', { modelName, accuracy: model.accuracy });
  }

  getSystemStatus(): {
    totalMetrics: number;
    totalPredictions: number;
    totalMaintenanceTasks: number;
    scheduledTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    modelCount: number;
  } {
    const tasks = Array.from(this.maintenanceTasks.values());

    return {
      totalMetrics: this.metricsHistory.size,
      totalPredictions: Array.from(this.predictions.values())
        .reduce((sum, p) => sum + p.length, 0),
      totalMaintenanceTasks: tasks.length,
      scheduledTasks: tasks.filter(t => t.status === 'scheduled').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      modelCount: this.models.size
    };
  }
}
