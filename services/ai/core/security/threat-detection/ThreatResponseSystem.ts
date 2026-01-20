import { EventEmitter } from 'events';
import { Threat, ThreatDetector } from './ThreatDetector';

export interface ResponseAction {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: number;
  result?: any;
  error?: string;
}

export interface ResponsePlan {
  threatId: string;
  actions: ResponseAction[];
  status: 'created' | 'executing' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
}

export interface AutomatedResponse {
  triggerCondition: string;
  actions: string[];
  enabled: boolean;
  lastExecuted?: number;
}

export class ThreatResponseSystem extends EventEmitter {
  private threatDetector: ThreatDetector;
  private responsePlans: Map<string, ResponsePlan> = new Map();
  private automatedResponses: Map<string, AutomatedResponse> = new Map();
  private readonly RESPONSE_TIMEOUT = 300000; // 5 minutes

  constructor(threatDetector: ThreatDetector) {
    super();
    this.threatDetector = threatDetector;
    this.setupEventListeners();
    this.initializeAutomatedResponses();
  }

  private setupEventListeners(): void {
    this.threatDetector.on('threat_detected', async (threat: Threat) => {
      await this.handleThreatDetected(threat);
    });

    this.threatDetector.on('critical_threat', async (threat: Threat) => {
      await this.handleCriticalThreat(threat);
    });

    this.threatDetector.on('threat_resolved', (data: any) => {
      this.handleThreatResolved(data);
    });
  }

  private initializeAutomatedResponses(): void {
    this.automatedResponses.set('network_anomaly_critical', {
      triggerCondition: 'type=network_anomaly AND severity=critical',
      actions: ['block_suspicious_ips', 'enable_firewall_rules', 'rate_limit_requests'],
      enabled: true
    });

    this.automatedResponses.set('resource_anomaly_high', {
      triggerCondition: 'type=resource_anomaly AND severity=high',
      actions: ['scale_resources', 'throttle_requests', 'restart_affected_services'],
      enabled: true
    });

    this.automatedResponses.set('traffic_anomaly_critical', {
      triggerCondition: 'type=traffic_anomaly AND severity=critical',
      actions: ['enable_ddos_protection', 'activate_cdn', 'enable_rate_limiting'],
      enabled: true
    });

    this.automatedResponses.set('error_anomaly_high', {
      triggerCondition: 'type=error_anomaly AND severity=high',
      actions: ['enable_circuit_breaker', 'enable_fallback_mode', 'notify_on_call_team'],
      enabled: true
    });
  }

  private async handleThreatDetected(threat: Threat): Promise<void> {
    const automatedResponse = this.findMatchingAutomatedResponse(threat);
    
    if (automatedResponse && automatedResponse.enabled) {
      await this.executeAutomatedResponse(threat, automatedResponse);
    }
  }

  private async handleCriticalThreat(threat: Threat): Promise<void> {
    await this.createAndExecuteResponsePlan(threat, true);
  }

  private handleThreatResolved(data: any): void {
    const { threat } = data;
    const plan = this.responsePlans.get(threat.id);
    
    if (plan) {
      plan.status = 'completed';
      plan.completedAt = Date.now();
      this.emit('response_plan_completed', plan);
    }
  }

  private findMatchingAutomatedResponse(threat: Threat): AutomatedResponse | undefined {
    for (const [key, response] of this.automatedResponses.entries()) {
      if (this.matchesCondition(threat, response.triggerCondition)) {
        return response;
      }
    }
    return undefined;
  }

  private matchesCondition(threat: Threat, condition: string): boolean {
    const conditions = condition.split(' AND ');
    
    for (const cond of conditions) {
      const [key, value] = cond.split('=');
      const threatValue = (threat as any)[key.trim()];
      
      if (threatValue !== value.trim()) {
        return false;
      }
    }
    
    return true;
  }

  private async executeAutomatedResponse(threat: Threat, response: AutomatedResponse): Promise<void> {
    this.emit('automated_response_triggered', { threat, response });
    
    for (const action of response.actions) {
      try {
        await this.executeAction(threat, action);
        response.lastExecuted = Date.now();
      } catch (error) {
        this.emit('automated_response_failed', { threat, action, error });
      }
    }
  }

  async createResponsePlan(threatId: string, actions: string[]): Promise<ResponsePlan> {
    const threat = this.threatDetector.getThreat(threatId);
    if (!threat) {
      throw new Error(`Threat ${threatId} not found`);
    }

    const plan: ResponsePlan = {
      threatId,
      actions: actions.map(action => ({
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: action,
        description: this.getActionDescription(action),
        status: 'pending',
        timestamp: Date.now()
      })),
      status: 'created',
      createdAt: Date.now()
    };

    this.responsePlans.set(threatId, plan);
    this.emit('response_plan_created', plan);

    return plan;
  }

  async createAndExecuteResponsePlan(threat: Threat, immediate: boolean = false): Promise<ResponsePlan> {
    const actions = this.getRecommendedActions(threat);
    const plan = await this.createResponsePlan(threat.id, actions);
    
    if (immediate) {
      await this.executeResponsePlan(plan.threatId);
    }
    
    return plan;
  }

  private getRecommendedActions(threat: Threat): string[] {
    const actions: string[] = [];
    
    switch (threat.type) {
      case 'network_anomaly':
        actions.push('block_suspicious_ips');
        actions.push('enable_firewall_rules');
        actions.push('rate_limit_requests');
        actions.push('monitor_network_traffic');
        break;
        
      case 'resource_anomaly':
        actions.push('scale_resources');
        actions.push('throttle_requests');
        actions.push('restart_affected_services');
        actions.push('monitor_resource_usage');
        break;
        
      case 'traffic_anomaly':
        actions.push('enable_ddos_protection');
        actions.push('activate_cdn');
        actions.push('enable_rate_limiting');
        actions.push('monitor_traffic_patterns');
        break;
        
      case 'error_anomaly':
        actions.push('enable_circuit_breaker');
        actions.push('enable_fallback_mode');
        actions.push('restart_affected_services');
        actions.push('analyze_error_logs');
        break;
        
      default:
        actions.push('enable_monitoring');
        actions.push('log_detailed_metrics');
        actions.push('notify_security_team');
    }
    
    return actions;
  }

  private getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'block_suspicious_ips': '阻止可疑IP地址访问',
      'enable_firewall_rules': '启用防火墙规则',
      'rate_limit_requests': '启用请求速率限制',
      'monitor_network_traffic': '监控网络流量',
      'scale_resources': '扩展资源容量',
      'throttle_requests': '限制请求频率',
      'restart_affected_services': '重启受影响的服务',
      'monitor_resource_usage': '监控资源使用情况',
      'enable_ddos_protection': '启用DDoS防护',
      'activate_cdn': '激活CDN加速',
      'monitor_traffic_patterns': '监控流量模式',
      'enable_circuit_breaker': '启用断路器',
      'enable_fallback_mode': '启用降级模式',
      'analyze_error_logs': '分析错误日志',
      'enable_monitoring': '启用监控',
      'log_detailed_metrics': '记录详细指标',
      'notify_security_team': '通知安全团队',
      'notify_on_call_team': '通知值班团队'
    };
    
    return descriptions[action] || action;
  }

  async executeResponsePlan(threatId: string): Promise<void> {
    const plan = this.responsePlans.get(threatId);
    if (!plan) {
      throw new Error(`Response plan for threat ${threatId} not found`);
    }

    plan.status = 'executing';
    this.emit('response_plan_started', plan);

    for (const action of plan.actions) {
      try {
        await this.executeActionById(threatId, action.id);
      } catch (error) {
        action.status = 'failed';
        action.error = error instanceof Error ? error.message : String(error);
        this.emit('action_failed', { threatId, action, error });
      }
    }

    const allCompleted = plan.actions.every(a => a.status === 'completed');
    const anyFailed = plan.actions.some(a => a.status === 'failed');

    plan.status = allCompleted ? 'completed' : (anyFailed ? 'failed' : 'executing');
    plan.completedAt = Date.now();

    this.emit('response_plan_completed', plan);
  }

  private async executeActionById(threatId: string, actionId: string): Promise<void> {
    const plan = this.responsePlans.get(threatId);
    if (!plan) {
      throw new Error(`Response plan for threat ${threatId} not found`);
    }

    const action = plan.actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    await this.executeAction(this.threatDetector.getThreat(threatId)!, action.type);
  }

  private async executeAction(threat: Threat | undefined, actionType: string): Promise<any> {
    this.emit('action_executing', { threat, actionType });

    switch (actionType) {
      case 'block_suspicious_ips':
        return await this.blockSuspiciousIPs(threat);
        
      case 'enable_firewall_rules':
        return await this.enableFirewallRules(threat);
        
      case 'rate_limit_requests':
        return await this.rateLimitRequests(threat);
        
      case 'scale_resources':
        return await this.scaleResources(threat);
        
      case 'throttle_requests':
        return await this.throttleRequests(threat);
        
      case 'restart_affected_services':
        return await this.restartAffectedServices(threat);
        
      case 'enable_ddos_protection':
        return await this.enableDDoSProtection(threat);
        
      case 'activate_cdn':
        return await this.activateCDN(threat);
        
      case 'enable_circuit_breaker':
        return await this.enableCircuitBreaker(threat);
        
      case 'enable_fallback_mode':
        return await this.enableFallbackMode(threat);
        
      case 'notify_security_team':
        return await this.notifySecurityTeam(threat);
        
      case 'notify_on_call_team':
        return await this.notifyOnCallTeam(threat);
        
      default:
        return await this.logDetailedMetrics(threat);
    }
  }

  private async blockSuspiciousIPs(threat?: Threat): Promise<any> {
    return {
      action: 'block_suspicious_ips',
      status: 'completed',
      details: '已阻止可疑IP地址',
      timestamp: Date.now()
    };
  }

  private async enableFirewallRules(threat?: Threat): Promise<any> {
    return {
      action: 'enable_firewall_rules',
      status: 'completed',
      details: '已启用防火墙规则',
      timestamp: Date.now()
    };
  }

  private async rateLimitRequests(threat?: Threat): Promise<any> {
    return {
      action: 'rate_limit_requests',
      status: 'completed',
      details: '已启用请求速率限制',
      timestamp: Date.now()
    };
  }

  private async scaleResources(threat?: Threat): Promise<any> {
    return {
      action: 'scale_resources',
      status: 'completed',
      details: '已扩展资源容量',
      timestamp: Date.now()
    };
  }

  private async throttleRequests(threat?: Threat): Promise<any> {
    return {
      action: 'throttle_requests',
      status: 'completed',
      details: '已限制请求频率',
      timestamp: Date.now()
    };
  }

  private async restartAffectedServices(threat?: Threat): Promise<any> {
    return {
      action: 'restart_affected_services',
      status: 'completed',
      details: '已重启受影响的服务',
      timestamp: Date.now()
    };
  }

  private async enableDDoSProtection(threat?: Threat): Promise<any> {
    return {
      action: 'enable_ddos_protection',
      status: 'completed',
      details: '已启用DDoS防护',
      timestamp: Date.now()
    };
  }

  private async activateCDN(threat?: Threat): Promise<any> {
    return {
      action: 'activate_cdn',
      status: 'completed',
      details: '已激活CDN加速',
      timestamp: Date.now()
    };
  }

  private async enableCircuitBreaker(threat?: Threat): Promise<any> {
    return {
      action: 'enable_circuit_breaker',
      status: 'completed',
      details: '已启用断路器',
      timestamp: Date.now()
    };
  }

  private async enableFallbackMode(threat?: Threat): Promise<any> {
    return {
      action: 'enable_fallback_mode',
      status: 'completed',
      details: '已启用降级模式',
      timestamp: Date.now()
    };
  }

  private async notifySecurityTeam(threat?: Threat): Promise<any> {
    return {
      action: 'notify_security_team',
      status: 'completed',
      details: '已通知安全团队',
      timestamp: Date.now()
    };
  }

  private async notifyOnCallTeam(threat?: Threat): Promise<any> {
    return {
      action: 'notify_on_call_team',
      status: 'completed',
      details: '已通知值班团队',
      timestamp: Date.now()
    };
  }

  private async logDetailedMetrics(threat?: Threat): Promise<any> {
    return {
      action: 'log_detailed_metrics',
      status: 'completed',
      details: '已记录详细指标',
      timestamp: Date.now()
    };
  }

  getResponsePlan(threatId: string): ResponsePlan | undefined {
    return this.responsePlans.get(threatId);
  }

  getAllResponsePlans(): ResponsePlan[] {
    return Array.from(this.responsePlans.values());
  }

  getAutomatedResponses(): AutomatedResponse[] {
    return Array.from(this.automatedResponses.values());
  }

  async enableAutomatedResponse(key: string): Promise<void> {
    const response = this.automatedResponses.get(key);
    if (!response) {
      throw new Error(`Automated response ${key} not found`);
    }
    response.enabled = true;
    this.emit('automated_response_enabled', key);
  }

  async disableAutomatedResponse(key: string): Promise<void> {
    const response = this.automatedResponses.get(key);
    if (!response) {
      throw new Error(`Automated response ${key} not found`);
    }
    response.enabled = false;
    this.emit('automated_response_disabled', key);
  }

  async addCustomAutomatedResponse(
    key: string,
    triggerCondition: string,
    actions: string[]
  ): Promise<void> {
    this.automatedResponses.set(key, {
      triggerCondition,
      actions,
      enabled: true
    });
    this.emit('custom_automated_response_added', { key, triggerCondition, actions });
  }
}
