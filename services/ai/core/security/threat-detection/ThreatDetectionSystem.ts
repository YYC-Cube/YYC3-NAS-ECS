import { EventEmitter } from 'events';
import { ThreatDetector } from './ThreatDetector';
import { ThreatResponseSystem } from './ThreatResponseSystem';
import { AnomalyDetectionEngine, AnomalyData } from './AnomalyDetectionEngine';

export interface ThreatDetectionSystemConfig {
  enableAutomatedResponse?: boolean;
  enableRealTimeDetection?: boolean;
  detectionInterval?: number;
  retentionDays?: number;
}

export class ThreatDetectionSystem extends EventEmitter {
  private threatDetector: ThreatDetector;
  private responseSystem: ThreatResponseSystem;
  private config: ThreatDetectionSystemConfig;
  private detectionInterval?: NodeJS.Timeout;

  constructor(config: ThreatDetectionSystemConfig = {}) {
    super();
    this.config = {
      enableAutomatedResponse: true,
      enableRealTimeDetection: true,
      detectionInterval: 5000,
      retentionDays: 90,
      ...config
    };

    this.threatDetector = new ThreatDetector();
    this.responseSystem = new ThreatResponseSystem(this.threatDetector);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.threatDetector.on('threat_detected', (threat) => {
      this.emit('threat_detected', threat);
    });

    this.threatDetector.on('critical_threat', (threat) => {
      this.emit('critical_threat', threat);
    });

    this.threatDetector.on('threat_resolved', (data) => {
      this.emit('threat_resolved', data);
    });

    this.responseSystem.on('response_plan_created', (plan) => {
      this.emit('response_plan_created', plan);
    });

    this.responseSystem.on('response_plan_completed', (plan) => {
      this.emit('response_plan_completed', plan);
    });

    this.responseSystem.on('automated_response_triggered', (data) => {
      this.emit('automated_response_triggered', data);
    });
  }

  async start(): Promise<void> {
    if (this.config.enableRealTimeDetection) {
      this.detectionInterval = setInterval(async () => {
        await this.performDetectionCycle();
      }, this.config.detectionInterval);
    }

    this.emit('system_started', { timestamp: Date.now() });
  }

  async stop(): Promise<void> {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = undefined;
    }

    this.emit('system_stopped', { timestamp: Date.now() });
  }

  private async performDetectionCycle(): Promise<void> {
    try {
      const metrics = await this.collectSystemMetrics();
      
      for (const metric of metrics) {
        await this.threatDetector.detectThreat(metric);
      }
    } catch (error) {
      this.emit('detection_cycle_error', error);
    }
  }

  private async collectSystemMetrics(): Promise<AnomalyData[]> {
    const metrics: AnomalyData[] = [];
    const timestamp = Date.now();

    metrics.push({
      timestamp,
      metrics: {
        cpu_usage: await this.getCPUUsage(),
        memory_usage: await this.getMemoryUsage(),
        disk_usage: await this.getDiskUsage(),
        network_in: await this.getNetworkIn(),
        network_out: await this.getNetworkOut(),
        request_count: await this.getRequestCount(),
        error_count: await this.getErrorCount(),
        response_time: await this.getResponseTime()
      },
      source: 'system_metrics',
      sessionId: `session-${timestamp}`
    });

    return metrics;
  }

  private async getCPUUsage(): Promise<number> {
    return Math.random() * 100;
  }

  private async getMemoryUsage(): Promise<number> {
    return Math.random() * 100;
  }

  private async getDiskUsage(): Promise<number> {
    return Math.random() * 100;
  }

  private async getNetworkIn(): Promise<number> {
    return Math.random() * 1000;
  }

  private async getNetworkOut(): Promise<number> {
    return Math.random() * 1000;
  }

  private async getRequestCount(): Promise<number> {
    return Math.floor(Math.random() * 1000);
  }

  private async getErrorCount(): Promise<number> {
    return Math.floor(Math.random() * 100);
  }

  private async getResponseTime(): Promise<number> {
    return Math.random() * 1000;
  }

  async detectThreat(data: AnomalyData): Promise<any> {
    return await this.threatDetector.detectThreat(data);
  }

  async updateThreatIntelligence(intelligence: any): Promise<void> {
    await this.threatDetector.updateThreatIntelligence(intelligence);
  }

  getThreats(filter?: any): any[] {
    return this.threatDetector.getThreats(filter);
  }

  getThreatStatistics(): any {
    return this.threatDetector.getThreatStatistics();
  }

  async createResponsePlan(threatId: string, actions: string[]): Promise<any> {
    return await this.responseSystem.createResponsePlan(threatId, actions);
  }

  async executeResponsePlan(threatId: string): Promise<void> {
    await this.responseSystem.executeResponsePlan(threatId);
  }

  getResponsePlans(): any[] {
    return this.responseSystem.getAllResponsePlans();
  }

  getAutomatedResponses(): any[] {
    return this.responseSystem.getAutomatedResponses();
  }

  async enableAutomatedResponse(key: string): Promise<void> {
    await this.responseSystem.enableAutomatedResponse(key);
  }

  async disableAutomatedResponse(key: string): Promise<void> {
    await this.responseSystem.disableAutomatedResponse(key);
  }

  async cleanupOldThreats(): Promise<number> {
    return await this.threatDetector.cleanupOldThreats();
  }

  getAnomalyEngine(): AnomalyDetectionEngine {
    return this.threatDetector.getAnomalyEngine();
  }

  getSystemStatus(): {
    isRunning: boolean;
    config: ThreatDetectionSystemConfig;
    threatCount: number;
    responsePlanCount: number;
    automatedResponseCount: number;
  } {
    return {
      isRunning: !!this.detectionInterval,
      config: this.config,
      threatCount: this.threatDetector.getThreats().length,
      responsePlanCount: this.responseSystem.getAllResponsePlans().length,
      automatedResponseCount: this.responseSystem.getAutomatedResponses().length
    };
  }
}
