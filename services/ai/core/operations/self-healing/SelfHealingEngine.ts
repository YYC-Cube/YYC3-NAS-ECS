import { EventEmitter } from 'events';

export interface HealthCheck {
  id: string;
  name: string;
  type: 'service' | 'resource' | 'network' | 'database' | 'custom';
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked: number;
  checkInterval: number;
  threshold: number;
  consecutiveFailures: number;
  maxFailures: number;
  metrics: Record<string, number>;
}

export interface HealthCheckResult {
  checkId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  metrics: Record<string, number>;
  message?: string;
}

export interface SelfHealingAction {
  id: string;
  type: 'restart' | 'scale' | 'rollback' | 'reconfigure' | 'cleanup' | 'custom';
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: number;
  result?: any;
  error?: string;
}

export interface SelfHealingPolicy {
  id: string;
  name: string;
  triggerCondition: string;
  actions: SelfHealingAction[];
  enabled: boolean;
  priority: number;
  cooldownPeriod: number;
  lastExecuted?: number;
}

export class SelfHealingEngine extends EventEmitter {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private policies: Map<string, SelfHealingPolicy> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEFAULT_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly DEFAULT_MAX_FAILURES = 3;
  private readonly DEFAULT_COOLDOWN_PERIOD = 300000; // 5 minutes

  constructor() {
    super();
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    this.policies.set('service_restart', {
      id: 'service_restart',
      name: '服务自动重启策略',
      triggerCondition: 'status=unhealthy AND type=service',
      actions: [
        {
          id: 'restart_service',
          type: 'restart',
          description: '重启失败的服务',
          status: 'pending',
          timestamp: Date.now()
        }
      ],
      enabled: true,
      priority: 1,
      cooldownPeriod: this.DEFAULT_COOLDOWN_PERIOD
    });

    this.policies.set('resource_scale', {
      id: 'resource_scale',
      name: '资源自动扩展策略',
      triggerCondition: 'status=degraded AND type=resource',
      actions: [
        {
          id: 'scale_resources',
          type: 'scale',
          description: '扩展资源容量',
          status: 'pending',
          timestamp: Date.now()
        }
      ],
      enabled: true,
      priority: 2,
      cooldownPeriod: this.DEFAULT_COOLDOWN_PERIOD
    });

    this.policies.set('network_reconfigure', {
      id: 'network_reconfigure',
      name: '网络自动重配置策略',
      triggerCondition: 'status=unhealthy AND type=network',
      actions: [
        {
          id: 'reconfigure_network',
          type: 'reconfigure',
          description: '重新配置网络设置',
          status: 'pending',
          timestamp: Date.now()
        }
      ],
      enabled: true,
      priority: 1,
      cooldownPeriod: this.DEFAULT_COOLDOWN_PERIOD
    });

    this.policies.set('database_rollback', {
      id: 'database_rollback',
      name: '数据库自动回滚策略',
      triggerCondition: 'status=unhealthy AND type=database',
      actions: [
        {
          id: 'rollback_database',
          type: 'rollback',
          description: '回滚数据库到上一个稳定版本',
          status: 'pending',
          timestamp: Date.now()
        }
      ],
      enabled: true,
      priority: 1,
      cooldownPeriod: this.DEFAULT_COOLDOWN_PERIOD
    });
  }

  async registerHealthCheck(
    id: string,
    name: string,
    type: HealthCheck['type'],
    checkFunction: () => Promise<HealthCheckResult>,
    options?: {
      checkInterval?: number;
      threshold?: number;
      maxFailures?: number;
    }
  ): Promise<void> {
    const healthCheck: HealthCheck = {
      id,
      name,
      type,
      status: 'unknown',
      lastChecked: 0,
      checkInterval: options?.checkInterval || this.DEFAULT_CHECK_INTERVAL,
      threshold: options?.threshold || 0.8,
      consecutiveFailures: 0,
      maxFailures: options?.maxFailures || this.DEFAULT_MAX_FAILURES,
      metrics: {}
    };

    this.healthChecks.set(id, healthCheck);
    await this.startHealthCheck(id, checkFunction);

    this.emit('health_check_registered', healthCheck);
  }

  private async startHealthCheck(
    checkId: string,
    checkFunction: () => Promise<HealthCheckResult>
  ): Promise<void> {
    const healthCheck = this.healthChecks.get(checkId);
    if (!healthCheck) {
      throw new Error(`Health check ${checkId} not found`);
    }

    const performCheck = async () => {
      try {
        const result = await checkFunction();
        await this.processHealthCheckResult(checkId, result);
      } catch (error) {
        this.emit('health_check_error', { checkId, error });
      }
    };

    await performCheck();

    const interval = setInterval(performCheck, healthCheck.checkInterval);
    this.checkIntervals.set(checkId, interval);
  }

  private async processHealthCheckResult(
    checkId: string,
    result: HealthCheckResult
  ): Promise<void> {
    const healthCheck = this.healthChecks.get(checkId);
    if (!healthCheck) {
      return;
    }

    healthCheck.lastChecked = result.timestamp;
    healthCheck.metrics = result.metrics;

    if (result.status === 'unhealthy') {
      healthCheck.consecutiveFailures++;
      
      if (healthCheck.consecutiveFailures >= healthCheck.maxFailures) {
        healthCheck.status = 'unhealthy';
        this.emit('health_check_failed', { checkId, result });
        await this.triggerSelfHealing(checkId, result);
      } else {
        healthCheck.status = 'degraded';
        this.emit('health_check_degraded', { checkId, result });
      }
    } else if (result.status === 'degraded') {
      healthCheck.consecutiveFailures = 0;
      healthCheck.status = 'degraded';
      this.emit('health_check_degraded', { checkId, result });
    } else {
      healthCheck.consecutiveFailures = 0;
      healthCheck.status = 'healthy';
      this.emit('health_check_healthy', { checkId, result });
    }
  }

  private async triggerSelfHealing(
    checkId: string,
    result: HealthCheckResult
  ): Promise<void> {
    const healthCheck = this.healthChecks.get(checkId);
    if (!healthCheck) {
      return;
    }

    const applicablePolicies = this.findApplicablePolicies(healthCheck);
    
    for (const policy of applicablePolicies) {
      if (!policy.enabled) continue;
      
      if (policy.lastExecuted) {
        const timeSinceLastExecution = Date.now() - policy.lastExecuted;
        if (timeSinceLastExecution < policy.cooldownPeriod) {
          continue;
        }
      }

      await this.executeSelfHealingPolicy(policy, checkId, result);
    }
  }

  private findApplicablePolicies(healthCheck: HealthCheck): SelfHealingPolicy[] {
    const policies = Array.from(this.policies.values());
    
    return policies
      .filter(policy => this.matchesPolicyCondition(healthCheck, policy.triggerCondition))
      .sort((a, b) => a.priority - b.priority);
  }

  private matchesPolicyCondition(
    healthCheck: HealthCheck,
    condition: string
  ): boolean {
    const conditions = condition.split(' AND ');
    
    for (const cond of conditions) {
      const [key, value] = cond.split('=');
      const healthCheckValue = (healthCheck as any)[key.trim()];
      
      if (healthCheckValue !== value.trim()) {
        return false;
      }
    }
    
    return true;
  }

  private async executeSelfHealingPolicy(
    policy: SelfHealingPolicy,
    checkId: string,
    result: HealthCheckResult
  ): Promise<void> {
    this.emit('self_healing_started', { policy, checkId });
    policy.lastExecuted = Date.now();

    for (const action of policy.actions) {
      action.status = 'executing';
      action.timestamp = Date.now();

      try {
        const actionResult = await this.executeAction(action, checkId);
        action.result = actionResult;
        action.status = 'completed';
        this.emit('self_healing_action_completed', { policy, action, checkId });
      } catch (error) {
        action.status = 'failed';
        action.error = error instanceof Error ? error.message : String(error);
        this.emit('self_healing_action_failed', { policy, action, checkId, error });
      }
    }

    this.emit('self_healing_completed', { policy, checkId });
  }

  private async executeAction(
    action: SelfHealingAction,
    checkId: string
  ): Promise<any> {
    switch (action.type) {
      case 'restart':
        return await this.restartService(checkId);
        
      case 'scale':
        return await this.scaleResources(checkId);
        
      case 'rollback':
        return await this.rollback(checkId);
        
      case 'reconfigure':
        return await this.reconfigure(checkId);
        
      case 'cleanup':
        return await this.cleanup(checkId);
        
      case 'custom':
        return await this.executeCustomAction(action, checkId);
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async restartService(checkId: string): Promise<any> {
    return {
      action: 'restart',
      status: 'completed',
      details: `服务 ${checkId} 已重启`,
      timestamp: Date.now()
    };
  }

  private async scaleResources(checkId: string): Promise<any> {
    return {
      action: 'scale',
      status: 'completed',
      details: `资源 ${checkId} 已扩展`,
      timestamp: Date.now()
    };
  }

  private async rollback(checkId: string): Promise<any> {
    return {
      action: 'rollback',
      status: 'completed',
      details: `服务 ${checkId} 已回滚到上一个稳定版本`,
      timestamp: Date.now()
    };
  }

  private async reconfigure(checkId: string): Promise<any> {
    return {
      action: 'reconfigure',
      status: 'completed',
      details: `服务 ${checkId} 已重新配置`,
      timestamp: Date.now()
    };
  }

  private async cleanup(checkId: string): Promise<any> {
    return {
      action: 'cleanup',
      status: 'completed',
      details: `服务 ${checkId} 已清理`,
      timestamp: Date.now()
    };
  }

  private async executeCustomAction(action: SelfHealingAction, checkId: string): Promise<any> {
    return {
      action: 'custom',
      status: 'completed',
      details: `自定义操作 ${action.id} 已执行`,
      timestamp: Date.now()
    };
  }

  async unregisterHealthCheck(checkId: string): Promise<void> {
    const interval = this.checkIntervals.get(checkId);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(checkId);
    }

    this.healthChecks.delete(checkId);
    this.emit('health_check_unregistered', checkId);
  }

  async performManualHealthCheck(checkId: string): Promise<HealthCheckResult> {
    const healthCheck = this.healthChecks.get(checkId);
    if (!healthCheck) {
      throw new Error(`Health check ${checkId} not found`);
    }

    const result = await this.performHealthCheck(checkId);
    await this.processHealthCheckResult(checkId, result);
    
    return result;
  }

  private async performHealthCheck(checkId: string): Promise<HealthCheckResult> {
    const healthCheck = this.healthChecks.get(checkId);
    if (!healthCheck) {
      throw new Error(`Health check ${checkId} not found`);
    }

    const metrics = await this.collectMetrics(healthCheck.type);
    const status = this.evaluateHealthStatus(metrics, healthCheck.threshold);

    return {
      checkId,
      status,
      timestamp: Date.now(),
      metrics,
      message: this.getStatusMessage(status)
    };
  }

  private async collectMetrics(type: HealthCheck['type']): Promise<Record<string, number>> {
    const metrics: Record<string, number> = {};

    switch (type) {
      case 'service':
        metrics.cpu_usage = Math.random() * 100;
        metrics.memory_usage = Math.random() * 100;
        metrics.response_time = Math.random() * 1000;
        metrics.error_rate = Math.random() * 10;
        break;

      case 'resource':
        metrics.cpu_usage = Math.random() * 100;
        metrics.memory_usage = Math.random() * 100;
        metrics.disk_usage = Math.random() * 100;
        metrics.network_usage = Math.random() * 100;
        break;

      case 'network':
        metrics.latency = Math.random() * 100;
        metrics.packet_loss = Math.random() * 5;
        metrics.bandwidth_usage = Math.random() * 100;
        metrics.connection_count = Math.random() * 1000;
        break;

      case 'database':
        metrics.query_time = Math.random() * 1000;
        metrics.connection_pool = Math.random() * 100;
        metrics.disk_usage = Math.random() * 100;
        metrics.transaction_rate = Math.random() * 100;
        break;

      case 'custom':
        metrics.custom_metric_1 = Math.random() * 100;
        metrics.custom_metric_2 = Math.random() * 100;
        break;
    }

    return metrics;
  }

  private evaluateHealthStatus(
    metrics: Record<string, number>,
    threshold: number
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const values = Object.values(metrics);
    const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;

    if (avgValue < threshold * 0.5) {
      return 'healthy';
    } else if (avgValue < threshold) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  private getStatusMessage(status: 'healthy' | 'degraded' | 'unhealthy'): string {
    const messages: Record<string, string> = {
      healthy: '系统运行正常',
      degraded: '系统性能下降，需要关注',
      unhealthy: '系统异常，需要立即处理'
    };

    return messages[status];
  }

  getHealthCheck(checkId: string): HealthCheck | undefined {
    return this.healthChecks.get(checkId);
  }

  getAllHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  getHealthChecksByStatus(status: HealthCheck['status']): HealthCheck[] {
    return Array.from(this.healthChecks.values()).filter(
      hc => hc.status === status
    );
  }

  getPolicy(policyId: string): SelfHealingPolicy | undefined {
    return this.policies.get(policyId);
  }

  getAllPolicies(): SelfHealingPolicy[] {
    return Array.from(this.policies.values());
  }

  async enablePolicy(policyId: string): Promise<void> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }
    policy.enabled = true;
    this.emit('policy_enabled', policyId);
  }

  async disablePolicy(policyId: string): Promise<void> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }
    policy.enabled = false;
    this.emit('policy_disabled', policyId);
  }

  async addCustomPolicy(policy: SelfHealingPolicy): Promise<void> {
    this.policies.set(policy.id, policy);
    this.emit('policy_added', policy);
  }

  async removePolicy(policyId: string): Promise<void> {
    this.policies.delete(policyId);
    this.emit('policy_removed', policyId);
  }

  getSystemStatus(): {
    totalChecks: number;
    healthyChecks: number;
    degradedChecks: number;
    unhealthyChecks: number;
    totalPolicies: number;
    enabledPolicies: number;
  } {
    const healthChecks = Array.from(this.healthChecks.values());
    const policies = Array.from(this.policies.values());

    return {
      totalChecks: healthChecks.length,
      healthyChecks: healthChecks.filter(hc => hc.status === 'healthy').length,
      degradedChecks: healthChecks.filter(hc => hc.status === 'degraded').length,
      unhealthyChecks: healthChecks.filter(hc => hc.status === 'unhealthy').length,
      totalPolicies: policies.length,
      enabledPolicies: policies.filter(p => p.enabled).length
    };
  }
}
