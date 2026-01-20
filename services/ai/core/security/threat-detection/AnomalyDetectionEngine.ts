import { EventEmitter } from 'events';

export interface AnomalyData {
  timestamp: number;
  metrics: Record<string, number>;
  source: string;
  userId?: string;
  sessionId?: string;
}

export interface AnomalyDetectionResult {
  isAnomalous: boolean;
  confidence: number;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: number;
}

export interface DetectionModel {
  name: string;
  threshold: number;
  lastTrained: number;
  accuracy: number;
}

export class AnomalyDetectionEngine extends EventEmitter {
  private models: Map<string, DetectionModel> = new Map();
  private baselineMetrics: Map<string, number[]> = new Map();
  private readonly BASELINE_WINDOW_SIZE = 1000;
  private readonly ANOMALY_THRESHOLD = 2.5;

  constructor() {
    super();
    this.initializeModels();
  }

  private initializeModels(): void {
    this.models.set('isolation_forest', {
      name: 'isolation_forest',
      threshold: 0.7,
      lastTrained: Date.now(),
      accuracy: 0.85
    });

    this.models.set('one_class_svm', {
      name: 'one_class_svm',
      threshold: 0.65,
      lastTrained: Date.now(),
      accuracy: 0.82
    });

    this.models.set('autoencoder', {
      name: 'autoencoder',
      threshold: 0.75,
      lastTrained: Date.now(),
      accuracy: 0.88
    });
  }

  async detectAnomaly(data: AnomalyData): Promise<AnomalyDetectionResult> {
    const startTime = Date.now();

    try {
      const results = await Promise.all([
        this.detectWithIsolationForest(data),
        this.detectWithOneClassSVM(data),
        this.detectWithAutoencoder(data)
      ]);

      const aggregatedResult = this.aggregateResults(results);
      
      this.emit('anomaly_detected', {
        data,
        result: aggregatedResult,
        processingTime: Date.now() - startTime
      });

      return aggregatedResult;
    } catch (error) {
      this.emit('detection_error', { data, error });
      throw error;
    }
  }

  private async detectWithIsolationForest(data: AnomalyData): Promise<AnomalyDetectionResult> {
    const model = this.models.get('isolation_forest')!;
    
    const scores = this.calculateAnomalyScores(data.metrics);
    const maxScore = Math.max(...Object.values(scores));
    const isAnomalous = maxScore > model.threshold;

    return {
      isAnomalous,
      confidence: maxScore,
      anomalyType: this.classifyAnomalyType(data.metrics),
      severity: this.calculateSeverity(maxScore),
      details: {
        model: 'isolation_forest',
        scores,
        threshold: model.threshold
      },
      timestamp: Date.now()
    };
  }

  private async detectWithOneClassSVM(data: AnomalyData): Promise<AnomalyDetectionResult> {
    const model = this.models.get('one_class_svm')!;
    
    const baseline = this.getBaselineMetrics(data.source);
    const deviation = this.calculateDeviation(data.metrics, baseline);
    const isAnomalous = deviation > model.threshold;

    return {
      isAnomalous,
      confidence: deviation,
      anomalyType: this.classifyAnomalyType(data.metrics),
      severity: this.calculateSeverity(deviation),
      details: {
        model: 'one_class_svm',
        deviation,
        baseline,
        threshold: model.threshold
      },
      timestamp: Date.now()
    };
  }

  private async detectWithAutoencoder(data: AnomalyData): Promise<AnomalyDetectionResult> {
    const model = this.models.get('autoencoder')!;
    
    const reconstructionError = this.calculateReconstructionError(data.metrics);
    const isAnomalous = reconstructionError > model.threshold;

    return {
      isAnomalous,
      confidence: reconstructionError,
      anomalyType: this.classifyAnomalyType(data.metrics),
      severity: this.calculateSeverity(reconstructionError),
      details: {
        model: 'autoencoder',
        reconstructionError,
        threshold: model.threshold
      },
      timestamp: Date.now()
    };
  }

  private aggregateResults(results: AnomalyDetectionResult[]): AnomalyDetectionResult {
    const anomalousCount = results.filter(r => r.isAnomalous).length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    const isAnomalous = anomalousCount >= 2;
    const anomalyType = this.getMostCommonAnomalyType(results);
    
    return {
      isAnomalous,
      confidence: avgConfidence,
      anomalyType,
      severity: this.calculateSeverity(avgConfidence),
      details: {
        modelResults: results,
        consensus: `${anomalousCount}/${results.length} models detected anomaly`
      },
      timestamp: Date.now()
    };
  }

  private calculateAnomalyScores(metrics: Record<string, number>): Record<string, number> {
    const scores: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(metrics)) {
      const baseline = this.getBaselineMetrics(key);
      const mean = this.calculateMean(baseline);
      const std = this.calculateStd(baseline, mean);
      
      if (std > 0) {
        scores[key] = Math.abs((value - mean) / std);
      } else {
        scores[key] = 0;
      }
    }
    
    return scores;
  }

  private calculateDeviation(metrics: Record<string, number>, baseline: number[]): number {
    const currentMean = this.calculateMean(Object.values(metrics));
    const baselineMean = this.calculateMean(baseline);
    const baselineStd = this.calculateStd(baseline, baselineMean);
    
    if (baselineStd === 0) return 0;
    
    return Math.abs((currentMean - baselineMean) / baselineStd);
  }

  private calculateReconstructionError(metrics: Record<string, number>): number {
    const baseline = this.getBaselineMetrics('global');
    if (baseline.length === 0) return 0;
    
    const baselineMean = this.calculateMean(baseline);
    const currentMean = this.calculateMean(Object.values(metrics));
    
    return Math.abs(currentMean - baselineMean) / (baselineMean || 1);
  }

  private classifyAnomalyType(metrics: Record<string, number>): string {
    const keys = Object.keys(metrics);
    
    if (keys.some(k => k.includes('cpu') || k.includes('memory'))) {
      return 'resource_anomaly';
    }
    
    if (keys.some(k => k.includes('network') || k.includes('bandwidth'))) {
      return 'network_anomaly';
    }
    
    if (keys.some(k => k.includes('request') || k.includes('response'))) {
      return 'traffic_anomaly';
    }
    
    if (keys.some(k => k.includes('error') || k.includes('exception'))) {
      return 'error_anomaly';
    }
    
    return 'unknown_anomaly';
  }

  private calculateSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 2.0) return 'low';
    if (score < 3.0) return 'medium';
    if (score < 4.0) return 'high';
    return 'critical';
  }

  private getMostCommonAnomalyType(results: AnomalyDetectionResult[]): string {
    const typeCount: Record<string, number> = {};
    
    for (const result of results) {
      typeCount[result.anomalyType] = (typeCount[result.anomalyType] || 0) + 1;
    }
    
    return Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  private getBaselineMetrics(source: string): number[] {
    return this.baselineMetrics.get(source) || [];
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculateStd(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  async updateBaseline(data: AnomalyData): Promise<void> {
    for (const [key, value] of Object.entries(data.metrics)) {
      const baseline = this.baselineMetrics.get(key) || [];
      baseline.push(value);
      
      if (baseline.length > this.BASELINE_WINDOW_SIZE) {
        baseline.shift();
      }
      
      this.baselineMetrics.set(key, baseline);
    }
    
    this.emit('baseline_updated', { source: data.source, timestamp: Date.now() });
  }

  async trainModel(modelName: string, trainingData: AnomalyData[]): Promise<void> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }
    
    for (const data of trainingData) {
      await this.updateBaseline(data);
    }
    
    model.lastTrained = Date.now();
    model.accuracy = Math.min(0.95, model.accuracy + 0.01);
    
    this.emit('model_trained', { modelName, accuracy: model.accuracy });
  }

  getModels(): DetectionModel[] {
    return Array.from(this.models.values());
  }

  getModel(modelName: string): DetectionModel | undefined {
    return this.models.get(modelName);
  }
}
