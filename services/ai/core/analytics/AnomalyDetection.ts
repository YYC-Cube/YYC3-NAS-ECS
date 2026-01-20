import {
  AnomalyMonitoring,
  AnomalyReport,
  OutlierDetector,
  PatternAnalyzer,
  AlertManager,
  AnomalyData
} from './types';

export interface AnomalyDetectionConfig {
  zScoreThreshold: number;
  iqrMultiplier: number;
  minDataPoints: number;
  windowSize: number;
}

export class AnomalyDetection {
  private outlierDetector: OutlierDetector;
  private patternAnalyzer: PatternAnalyzer;
  private alertManager: AlertManager;
  private config: AnomalyDetectionConfig;
  private historicalData: Map<string, number[]> = new Map();

  constructor(config: Partial<AnomalyDetectionConfig> = {}) {
    this.outlierDetector = new OutlierDetector();
    this.patternAnalyzer = new PatternAnalyzer();
    this.alertManager = new AlertManager();
    this.config = {
      zScoreThreshold: 3,
      iqrMultiplier: 1.5,
      minDataPoints: 30,
      windowSize: 100,
      ...config
    };
  }

  async monitorBusinessOperations(): Promise<AnomalyMonitoring> {
    return {
      monitoring: {
        realTime: true,
        multiDimensional: true,
        adaptiveThresholds: true
      },
      detection: {
        statisticalOutliers: true,
        patternDeviations: true,
        trendAnomalies: true
      },
      response: {
        automatedAlerts: true,
        rootCauseAnalysis: true,
        correctiveActions: true
      }
    };
  }

  async detectOperationalAnomalies(metrics: any[]): Promise<AnomalyReport> {
    const anomalies: AnomalyData[] = [];

    for (const metric of metrics) {
      const key = `${metric.moduleName}-${metric.metricType}`;
      const value = metric.value;

      if (!this.historicalData.has(key)) {
        this.historicalData.set(key, []);
      }

      const history = this.historicalData.get(key)!;
      history.push(value);

      if (history.length > this.config.windowSize) {
        history.shift();
      }

      if (history.length >= this.config.minDataPoints) {
        const detectedAnomalies = await this.detectAnomalies(key, history, metric);
        anomalies.push(...detectedAnomalies);
      }
    }

    const severity = this.assessOverallSeverity(anomalies);
    const impact = this.estimateOverallImpact(anomalies);

    return {
      timestamp: new Date(),
      anomalies,
      severity,
      impact,
      recommendations: await this.generateAnomalyResponse(anomalies, severity, impact),
      escalation: await this.determineEscalationPath(severity, impact)
    };
  }

  private async detectAnomalies(key: string, history: number[], currentMetric: any): Promise<AnomalyData[]> {
    const anomalies: AnomalyData[] = [];
    const currentValue = currentMetric.value;

    const zScore = this.calculateZScore(history, currentValue);
    const isOutlier = Math.abs(zScore) > this.config.zScoreThreshold;

    if (isOutlier) {
      anomalies.push({
        id: this.generateId(),
        type: 'statistical_outlier',
        severity: this.getSeverityFromZScore(Math.abs(zScore)),
        timestamp: new Date(),
        description: `检测到异常值: ${currentValue} (Z-score: ${zScore.toFixed(2)})`,
        metrics: { [key]: currentValue, zScore },
        impact: this.getImpactFromZScore(Math.abs(zScore))
      });
    }

    const iqrAnomalies = this.detectIQRAnomalies(history, currentValue, currentMetric);
    anomalies.push(...iqrAnomalies);

    const trendAnomalies = await this.detectTrendAnomalies(history, currentMetric);
    anomalies.push(...trendAnomalies);

    return anomalies;
  }

  private calculateZScore(history: number[], value: number): number {
    const mean = history.reduce((sum, val) => sum + val, 0) / history.length;
    const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  private detectIQRAnomalies(history: number[], value: number, metric: any): AnomalyData[] {
    const anomalies: AnomalyData[] = [];
    const sorted = [...history].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - this.config.iqrMultiplier * iqr;
    const upperBound = q3 + this.config.iqrMultiplier * iqr;

    if (value < lowerBound || value > upperBound) {
      anomalies.push({
        id: this.generateId(),
        type: 'iqr_outlier',
        severity: value < lowerBound ? 'medium' : 'high',
        timestamp: new Date(),
        description: `IQR检测异常: ${value} (范围: ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`,
        metrics: { value, lowerBound, upperBound },
        impact: value < lowerBound ? 'low' : 'medium'
      });
    }

    return anomalies;
  }

  private async detectTrendAnomalies(history: number[], metric: any): Promise<AnomalyData[]> {
    const anomalies: AnomalyData[] = [];
    const recent = history.slice(-10);
    const older = history.slice(0, -10);

    if (older.length < 10) return anomalies;

    const recentMean = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderMean = older.reduce((sum, val) => sum + val, 0) / older.length;
    const percentChange = ((recentMean - olderMean) / olderMean) * 100;

    if (Math.abs(percentChange) > 50) {
      anomalies.push({
        id: this.generateId(),
        type: 'trend_anomaly',
        severity: Math.abs(percentChange) > 100 ? 'high' : 'medium',
        timestamp: new Date(),
        description: `趋势异常检测: ${percentChange.toFixed(2)}% 变化`,
        metrics: { recentMean, olderMean, percentChange },
        impact: Math.abs(percentChange) > 100 ? 'high' : 'medium'
      });
    }

    return anomalies;
  }

  private getSeverityFromZScore(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > 5) return 'critical';
    if (zScore > 4) return 'high';
    if (zScore > 3) return 'medium';
    return 'low';
  }

  private getImpactFromZScore(zScore: number): string {
    if (zScore > 5) return 'critical';
    if (zScore > 4) return 'high';
    if (zScore > 3) return 'medium';
    return 'low';
  }

  private assessOverallSeverity(anomalies: AnomalyData[]): string {
    if (anomalies.length === 0) return 'none';

    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const highCount = anomalies.filter(a => a.severity === 'high').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (anomalies.length > 5) return 'medium';
    return 'low';
  }

  private estimateOverallImpact(anomalies: AnomalyData[]): string {
    if (anomalies.length === 0) return 'none';

    const criticalImpacts = anomalies.filter(a => a.impact === 'critical').length;
    const highImpacts = anomalies.filter(a => a.impact === 'high').length;

    if (criticalImpacts > 0) return 'critical';
    if (highImpacts > 2) return 'high';
    if (anomalies.length > 5) return 'medium';
    return 'low';
  }

  private async generateAnomalyResponse(anomalies: AnomalyData[], severity: string, impact: string): Promise<string[]> {
    const recommendations: string[] = [];

    if (severity === 'critical' || severity === 'high') {
      recommendations.push('立即检查系统状态');
      recommendations.push('通知运维团队');
    }

    if (anomalies.some(a => a.type === 'statistical_outlier')) {
      recommendations.push('分析异常值的根本原因');
    }

    if (anomalies.some(a => a.type === 'trend_anomaly')) {
      recommendations.push('监控趋势变化，评估长期影响');
    }

    if (anomalies.length > 5) {
      recommendations.push('考虑增加监控频率');
    }

    await this.alertManager.sendAlert({ anomalies, severity, impact });
    return recommendations;
  }

  private async determineEscalationPath(severity: string, impact: string): Promise<any> {
    return {
      level: severity,
      notify: severity === 'critical' || severity === 'high',
      autoResolve: severity === 'low' || severity === 'none',
      escalateTo: severity === 'critical' ? 'senior_engineer' : 'on_call'
    };
  }

  private generateId(): string {
    return `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
