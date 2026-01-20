import { EventEmitter } from 'events';
import { AnomalyDetectionEngine, AnomalyData, AnomalyDetectionResult } from './AnomalyDetectionEngine';

export interface Threat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'mitigating' | 'resolved' | 'false_positive';
  timestamp: number;
  source: string;
  details: Record<string, any>;
  affectedSystems: string[];
  mitigationActions: string[];
}

export interface ThreatIntelligence {
  indicators: string[];
  knownAttackPatterns: string[];
  threatFeeds: string[];
  lastUpdated: number;
}

export class ThreatDetector extends EventEmitter {
  private anomalyEngine: AnomalyDetectionEngine;
  private threats: Map<string, Threat> = new Map();
  private threatIntelligence: ThreatIntelligence;
  private readonly THREAT_RETENTION_DAYS = 90;

  constructor() {
    super();
    this.anomalyEngine = new AnomalyDetectionEngine();
    this.threatIntelligence = {
      indicators: [],
      knownAttackPatterns: [],
      threatFeeds: [],
      lastUpdated: Date.now()
    };
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.anomalyEngine.on('anomaly_detected', async (data) => {
      await this.handleAnomalyDetected(data);
    });

    this.anomalyEngine.on('detection_error', (data) => {
      this.emit('threat_detection_error', data);
    });
  }

  async detectThreat(data: AnomalyData): Promise<Threat | null> {
    try {
      const anomalyResult = await this.anomalyEngine.detectAnomaly(data);
      
      if (!anomalyResult.isAnomalous) {
        await this.anomalyEngine.updateBaseline(data);
        return null;
      }

      const threat = this.createThreat(data, anomalyResult);
      this.threats.set(threat.id, threat);
      
      this.emit('threat_detected', threat);
      
      if (threat.severity === 'high' || threat.severity === 'critical') {
        await this.triggerImmediateResponse(threat);
      }
      
      return threat;
    } catch (error) {
      this.emit('detection_error', { data, error });
      throw error;
    }
  }

  private async handleAnomalyDetected(data: any): Promise<void> {
    const { data: anomalyData, result } = data;
    
    if (result.isAnomalous) {
      const threat = this.createThreat(anomalyData, result);
      this.threats.set(threat.id, threat);
      this.emit('threat_detected', threat);
    }
  }

  private createThreat(data: AnomalyData, result: AnomalyDetectionResult): Threat {
    const threatId = `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: threatId,
      type: result.anomalyType,
      severity: result.severity,
      status: 'detected',
      timestamp: result.timestamp,
      source: data.source,
      details: {
        anomalyData: data,
        detectionResult: result,
        confidence: result.confidence
      },
      affectedSystems: [data.source],
      mitigationActions: []
    };
  }

  private async triggerImmediateResponse(threat: Threat): Promise<void> {
    this.emit('critical_threat', threat);
    
    const immediateActions = this.getImmediateMitigationActions(threat);
    threat.mitigationActions.push(...immediateActions);
    threat.status = 'mitigating';
    
    this.emit('mitigation_started', { threat, actions: immediateActions });
  }

  private getImmediateMitigationActions(threat: Threat): string[] {
    const actions: string[] = [];
    
    switch (threat.type) {
      case 'network_anomaly':
        actions.push('block_suspicious_ips');
        actions.push('rate_limit_requests');
        actions.push('enable_firewall_rules');
        break;
        
      case 'resource_anomaly':
        actions.push('scale_resources');
        actions.push('throttle_requests');
        actions.push('restart_affected_services');
        break;
        
      case 'traffic_anomaly':
        actions.push('enable_ddos_protection');
        actions.push('activate_cdn');
        actions.push('enable_rate_limiting');
        break;
        
      case 'error_anomaly':
        actions.push('enable_circuit_breaker');
        actions.push('enable_fallback_mode');
        actions.push('notify_on_call_team');
        break;
        
      default:
        actions.push('enable_monitoring');
        actions.push('log_detailed_metrics');
        actions.push('notify_security_team');
    }
    
    return actions;
  }

  async updateThreatStatus(
    threatId: string,
    status: Threat['status'],
    notes?: string
  ): Promise<void> {
    const threat = this.threats.get(threatId);
    if (!threat) {
      throw new Error(`Threat ${threatId} not found`);
    }
    
    threat.status = status;
    
    if (notes) {
      threat.details.notes = notes;
    }
    
    this.emit('threat_status_updated', { threat, status, notes });
  }

  async addMitigationAction(threatId: string, action: string): Promise<void> {
    const threat = this.threats.get(threatId);
    if (!threat) {
      throw new Error(`Threat ${threatId} not found`);
    }
    
    threat.mitigationActions.push(action);
    this.emit('mitigation_action_added', { threat, action });
  }

  async resolveThreat(threatId: string, resolution: string): Promise<void> {
    await this.updateThreatStatus(threatId, 'resolved', resolution);
    const threat = this.threats.get(threatId)!;
    this.emit('threat_resolved', { threat, resolution });
  }

  async markAsFalsePositive(threatId: string, reason: string): Promise<void> {
    await this.updateThreatStatus(threatId, 'false_positive', reason);
    const threat = this.threats.get(threatId)!;
    this.emit('false_positive_marked', { threat, reason });
  }

  async updateThreatIntelligence(intelligence: Partial<ThreatIntelligence>): Promise<void> {
    this.threatIntelligence = {
      ...this.threatIntelligence,
      ...intelligence,
      lastUpdated: Date.now()
    };
    
    this.emit('intelligence_updated', this.threatIntelligence);
  }

  async checkThreatIntelligence(data: AnomalyData): Promise<boolean> {
    const { indicators, knownAttackPatterns } = this.threatIntelligence;
    
    for (const indicator of indicators) {
      if (JSON.stringify(data).includes(indicator)) {
        return true;
      }
    }
    
    for (const pattern of knownAttackPatterns) {
      if (this.matchesPattern(data, pattern)) {
        return true;
      }
    }
    
    return false;
  }

  private matchesPattern(data: AnomalyData, pattern: string): boolean {
    const dataString = JSON.stringify(data);
    const regex = new RegExp(pattern, 'i');
    return regex.test(dataString);
  }

  getThreat(threatId: string): Threat | undefined {
    return this.threats.get(threatId);
  }

  getThreats(filter?: {
    status?: Threat['status'];
    severity?: Threat['severity'];
    type?: string;
    startDate?: number;
    endDate?: number;
  }): Threat[] {
    let threats = Array.from(this.threats.values());
    
    if (filter) {
      if (filter.status) {
        threats = threats.filter(t => t.status === filter.status);
      }
      
      if (filter.severity) {
        threats = threats.filter(t => t.severity === filter.severity);
      }
      
      if (filter.type) {
        threats = threats.filter(t => t.type === filter.type);
      }
      
      if (filter.startDate) {
        threats = threats.filter(t => t.timestamp >= filter.startDate!);
      }
      
      if (filter.endDate) {
        threats = threats.filter(t => t.timestamp <= filter.endDate!);
      }
    }
    
    return threats.sort((a, b) => b.timestamp - a.timestamp);
  }

  getThreatStatistics(): {
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  } {
    const threats = Array.from(this.threats.values());
    
    return {
      total: threats.length,
      byStatus: this.groupBy(threats, 'status'),
      bySeverity: this.groupBy(threats, 'severity'),
      byType: this.groupBy(threats, 'type')
    };
  }

  private groupBy(threats: Threat[], key: keyof Threat): Record<string, number> {
    return threats.reduce((acc, threat) => {
      const value = threat[key] as string;
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  async cleanupOldThreats(): Promise<number> {
    const cutoffDate = Date.now() - (this.THREAT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    for (const [id, threat] of this.threats.entries()) {
      if (threat.timestamp < cutoffDate && threat.status === 'resolved') {
        this.threats.delete(id);
        cleanedCount++;
      }
    }
    
    this.emit('threats_cleaned', { count: cleanedCount });
    return cleanedCount;
  }

  getAnomalyEngine(): AnomalyDetectionEngine {
    return this.anomalyEngine;
  }

  getThreatIntelligence(): ThreatIntelligence {
    return this.threatIntelligence;
  }
}
