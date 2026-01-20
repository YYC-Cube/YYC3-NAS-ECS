import { EventEmitter } from 'events';
import { SelfHealingEngine } from './self-healing/SelfHealingEngine';
import { PredictiveMaintenanceSystem } from './predictive-maintenance/PredictiveMaintenanceSystem';

export interface AutomationOpsConfig {
  enableSelfHealing?: boolean;
  enablePredictiveMaintenance?: boolean;
  healthCheckInterval?: number;
  predictionHorizon?: number;
  maintenanceWindow?: {
    start: number;
    end: number;
  };
}

export class AutomationOpsSystem extends EventEmitter {
  private selfHealingEngine: SelfHealingEngine;
  private predictiveMaintenanceSystem: PredictiveMaintenanceSystem;
  private config: AutomationOpsConfig;
  private isRunning: boolean = false;

  constructor(config: AutomationOpsConfig = {}) {
    super();
    this.config = {
      enableSelfHealing: true,
      enablePredictiveMaintenance: true,
      healthCheckInterval: 30000,
      predictionHorizon: 3600000,
      maintenanceWindow: {
        start: 0,
        end: 24
      },
      ...config
    };

    this.selfHealingEngine = new SelfHealingEngine();
    this.predictiveMaintenanceSystem = new PredictiveMaintenanceSystem();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.selfHealingEngine.on('health_check_failed', (data) => {
      this.emit('health_check_failed', data);
    });

    this.selfHealingEngine.on('self_healing_started', (data) => {
      this.emit('self_healing_started', data);
    });

    this.selfHealingEngine.on('self_healing_completed', (data) => {
      this.emit('self_healing_completed', data);
    });

    this.predictiveMaintenanceSystem.on('predictive_alert', (data) => {
      this.emit('predictive_alert', data);
    });

    this.predictiveMaintenanceSystem.on('maintenance_task_scheduled', (data) => {
      this.emit('maintenance_task_scheduled', data);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.emit('system_started', { timestamp: Date.now() });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.emit('system_stopped', { timestamp: Date.now() });
  }

  async registerHealthCheck(
    id: string,
    name: string,
    type: any,
    checkFunction: () => Promise<any>,
    options?: any
  ): Promise<void> {
    if (this.config.enableSelfHealing) {
      await this.selfHealingEngine.registerHealthCheck(id, name, type, checkFunction, options);
    }
  }

  async unregisterHealthCheck(checkId: string): Promise<void> {
    await this.selfHealingEngine.unregisterHealthCheck(checkId);
  }

  async recordMetric(metricName: string, value: number, metadata?: Record<string, any>): Promise<void> {
    if (this.config.enablePredictiveMaintenance) {
      await this.predictiveMaintenanceSystem.recordMetric(metricName, value, metadata);
    }
  }

  async predictMetric(metricName: string, timeHorizon?: number): Promise<any> {
    return await this.predictiveMaintenanceSystem.predictMetric(
      metricName,
      timeHorizon || this.config.predictionHorizon!
    );
  }

  async scheduleMaintenanceTask(task: any): Promise<any> {
    return await this.predictiveMaintenanceSystem.scheduleCustomMaintenanceTask(task);
  }

  async executeMaintenanceTask(taskId: string): Promise<void> {
    await this.predictiveMaintenanceSystem.executeMaintenanceTask(taskId);
  }

  getHealthChecks(): any[] {
    return this.selfHealingEngine.getAllHealthChecks();
  }

  getHealthCheck(checkId: string): any {
    return this.selfHealingEngine.getHealthCheck(checkId);
  }

  getHealthChecksByStatus(status: string): any[] {
    return this.selfHealingEngine.getHealthChecksByStatus(status as any);
  }

  getPredictions(metricName?: string): any[] {
    return this.predictiveMaintenanceSystem.getPredictions(metricName);
  }

  getMaintenanceTasks(filter?: any): any[] {
    return this.predictiveMaintenanceSystem.getMaintenanceTasks(filter);
  }

  getMetricHistory(metricName: string): any[] {
    return this.predictiveMaintenanceSystem.getMetricHistory(metricName);
  }

  getPolicies(): any[] {
    return this.selfHealingEngine.getAllPolicies();
  }

  getPolicy(policyId: string): any {
    return this.selfHealingEngine.getPolicy(policyId);
  }

  async enablePolicy(policyId: string): Promise<void> {
    await this.selfHealingEngine.enablePolicy(policyId);
  }

  async disablePolicy(policyId: string): Promise<void> {
    await this.selfHealingEngine.disablePolicy(policyId);
  }

  async addCustomPolicy(policy: any): Promise<void> {
    await this.selfHealingEngine.addCustomPolicy(policy);
  }

  async removePolicy(policyId: string): Promise<void> {
    await this.selfHealingEngine.removePolicy(policyId);
  }

  getModels(): any[] {
    return this.predictiveMaintenanceSystem.getModels();
  }

  async trainModel(modelName: string, metricName: string): Promise<void> {
    await this.predictiveMaintenanceSystem.trainModel(modelName, metricName);
  }

  getSystemStatus(): {
    isRunning: boolean;
    config: AutomationOpsConfig;
    selfHealingStatus: any;
    predictiveMaintenanceStatus: any;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      selfHealingStatus: this.selfHealingEngine.getSystemStatus(),
      predictiveMaintenanceStatus: this.predictiveMaintenanceSystem.getSystemStatus()
    };
  }

  getSelfHealingEngine(): SelfHealingEngine {
    return this.selfHealingEngine;
  }

  getPredictiveMaintenanceSystem(): PredictiveMaintenanceSystem {
    return this.predictiveMaintenanceSystem;
  }
}
