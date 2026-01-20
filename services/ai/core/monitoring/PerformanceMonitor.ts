import { AnomalyDetection, AnomalyDetectionConfig } from '../analytics/AnomalyDetection';

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  metricType: 'cpu' | 'memory' | 'response_time' | 'throughput' | 'error_rate' | 'custom';
  moduleName: string;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metricType: PerformanceMetric['metricType'];
  moduleName?: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';
  threshold: number;
  duration: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldown: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertRule['severity'];
  message: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'acknowledged';
  metrics: PerformanceMetric[];
  metadata?: Record<string, any>;
}

export interface AlertNotification {
  alertId: string;
  channel: 'email' | 'slack' | 'webhook' | 'sms';
  recipient: string;
  message: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed';
}

export interface MonitoringConfig {
  retentionPeriod: number;
  maxMetrics: number;
  maxAlerts: number;
  enableAutoResolution: boolean;
  checkInterval: number;
  enableAnomalyDetection: boolean;
  anomalyDetectionConfig?: Partial<AnomalyDetectionConfig>;
  notificationChannels: {
    email?: { enabled: boolean; recipients: string[]; smtpConfig?: SMTPConfig };
    slack?: { enabled: boolean; webhook: string };
    webhook?: { enabled: boolean; url: string };
    sms?: { enabled: boolean; recipients: string[] };
  };
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private notifications: AlertNotification[] = [];
  private config: MonitoringConfig;
  private checkTimer?: NodeJS.Timeout;
  private alertCooldowns: Map<string, number> = new Map();
  private anomalyDetection?: AnomalyDetection;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      retentionPeriod: 24 * 60 * 60 * 1000,
      maxMetrics: 10000,
      maxAlerts: 1000,
      enableAutoResolution: true,
      checkInterval: 60000,
      enableAnomalyDetection: false,
      notificationChannels: {
        email: { enabled: false, recipients: [] },
        slack: { enabled: false, webhook: '' },
        webhook: { enabled: false, url: '' },
        sms: { enabled: false, recipients: [] }
      },
      ...config
    };

    if (this.config.enableAnomalyDetection) {
      this.anomalyDetection = new AnomalyDetection(this.config.anomalyDetectionConfig);
    }
  }

  async initialize(): Promise<void> {
    this.startMonitoring();
    this.loadDefaultAlertRules();
  }

  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): PerformanceMetric {
    const fullMetric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: new Date(),
      ...metric
    };

    const key = `${metric.moduleName}-${metric.metricType}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;
    metrics.push(fullMetric);

    if (metrics.length > this.config.maxMetrics) {
      metrics.shift();
    }

    return fullMetric;
  }

  async recordMetricAsync(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<PerformanceMetric> {
    return this.recordMetric(metric);
  }

  getMetrics(
    moduleName?: string,
    metricType?: PerformanceMetric['metricType'],
    startTime?: Date,
    endTime?: Date
  ): PerformanceMetric[] {
    let result: PerformanceMetric[] = [];

    for (const [key, metrics] of this.metrics.entries()) {
      const lastDashIndex = key.lastIndexOf('-');
      const modName = key.substring(0, lastDashIndex);
      const type = key.substring(lastDashIndex + 1);

      if (moduleName && moduleName !== '*' && modName !== moduleName) continue;
      if (metricType && type !== metricType) continue;

      result = result.concat(metrics);
    }

    if (startTime) {
      result = result.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      result = result.filter(m => m.timestamp <= endTime);
    }

    return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getMetricsByType(metricType: PerformanceMetric['metricType']): PerformanceMetric[] {
    return this.getMetrics(undefined, metricType);
  }

  getMetricStats(
    moduleName: string,
    metricType: PerformanceMetric['metricType'],
    timeWindow: number = 60000
  ): {
    current: number;
    min: number;
    max: number;
    avg: number;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const metrics = this.getMetrics(moduleName, metricType);
    const now = Date.now();
    const recentMetrics = metrics.filter(
      m => now - m.timestamp.getTime() <= timeWindow
    );

    if (recentMetrics.length === 0) {
      return {
        current: 0,
        min: 0,
        max: 0,
        avg: 0,
        count: 0,
        trend: 'stable'
      };
    }

    const values = recentMetrics.map(m => m.value);
    const current = values[0];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (values.length >= 3) {
      const recent = values.slice(0, Math.min(5, values.length));
      const slope = (recent[recent.length - 1] - recent[0]) / recent.length;
      if (slope > 0.1) trend = 'increasing';
      else if (slope < -0.1) trend = 'decreasing';
    }

    return {
      current,
      min,
      max,
      avg,
      count: recentMetrics.length,
      trend
    };
  }

  addAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const fullRule: AlertRule = {
      id: this.generateId(),
      ...rule
    };

    this.alertRules.set(fullRule.id, fullRule);
    return fullRule;
  }

  removeAlertRule(ruleId: string): boolean {
    return this.alertRules.delete(ruleId);
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  getAlerts(
    severity?: AlertRule['severity'],
    status?: Alert['status'],
    startTime?: Date,
    endTime?: Date
  ): Alert[] {
    let result = Array.from(this.alerts.values());

    if (severity) {
      result = result.filter(a => a.severity === severity);
    }

    if (status) {
      result = result.filter(a => a.status === status);
    }

    if (startTime) {
      result = result.filter(a => a.triggeredAt >= startTime);
    }

    if (endTime) {
      result = result.filter(a => a.triggeredAt <= endTime);
    }

    return result.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  getActiveAlerts(): Alert[] {
    return this.getAlerts(undefined, 'active');
  }

  getAlertHistory(): Alert[] {
    return this.getAlerts();
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    return true;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    return true;
  }

  getNotifications(): AlertNotification[] {
    return this.notifications;
  }

  private startMonitoring(): void {
    this.checkTimer = setInterval(() => {
      this.checkAlertRules();
    }, this.config.checkInterval);
  }

  private async checkAlertRules(): Promise<void> {
    const now = Date.now();

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const lastCooldown = this.alertCooldowns.get(rule.id) || 0;
      if (now - lastCooldown < rule.cooldown) continue;

      const shouldAlert = this.evaluateAlertRule(rule);
      if (shouldAlert) {
        await this.triggerAlert(rule);
        this.alertCooldowns.set(rule.id, now);
      }
    }

    if (this.anomalyDetection && this.config.enableAnomalyDetection) {
      await this.checkAnomalies();
    }
  }

  private async checkAnomalies(): Promise<void> {
    const allMetrics: any[] = [];
    for (const [key, metrics] of this.metrics.entries()) {
      const lastDashIndex = key.lastIndexOf('-');
      const moduleName = key.substring(0, lastDashIndex);
      const metricType = key.substring(lastDashIndex + 1);
      
      const recentMetrics = metrics.slice(-10);
      allMetrics.push(...recentMetrics.map(m => ({
        ...m,
        moduleName,
        metricType
      })));
    }

    if (allMetrics.length === 0) return;

    try {
      const anomalyReport = await this.anomalyDetection!.detectOperationalAnomalies(allMetrics);
      
      for (const anomaly of anomalyReport.anomalies) {
        await this.createAnomalyAlert(anomaly, anomalyReport);
      }
    } catch (error) {
      console.error('异常检测失败:', error);
    }
  }

  private async createAnomalyAlert(anomaly: any, report: any): Promise<void> {
    const alert: Alert = {
      id: this.generateId(),
      ruleId: 'anomaly-detection',
      ruleName: '异常检测告警',
      severity: anomaly.severity === 'critical' ? 'critical' : 
                 anomaly.severity === 'high' ? 'critical' : 
                 anomaly.severity === 'medium' ? 'warning' : 'info',
      message: anomaly.description,
      triggeredAt: anomaly.timestamp,
      status: 'active',
      metrics: [],
      metadata: {
        anomalyType: anomaly.type,
        anomalyId: anomaly.id,
        impact: anomaly.impact,
        recommendations: report.recommendations
      }
    };

    this.alerts.set(alert.id, alert);

    if (this.alerts.size > this.config.maxAlerts) {
      const oldest = Array.from(this.alerts.values())
        .sort((a, b) => a.triggeredAt.getTime() - b.triggeredAt.getTime())[0];
      this.alerts.delete(oldest.id);
    }

    await this.sendNotifications(alert);
  }

  private evaluateAlertRule(rule: AlertRule): boolean {
    const stats = this.getMetricStats(
      rule.moduleName || '*',
      rule.metricType,
      rule.duration
    );

    if (stats.count === 0) return false;

    switch (rule.condition) {
      case 'greater_than':
        return stats.current > rule.threshold;
      case 'less_than':
        return stats.current < rule.threshold;
      case 'equals':
        return stats.current === rule.threshold;
      case 'not_equals':
        return stats.current !== rule.threshold;
      case 'percentage_change':
        const change = ((stats.current - stats.avg) / stats.avg) * 100;
        return Math.abs(change) > rule.threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule): Promise<void> {
    const stats = this.getMetricStats(
      rule.moduleName || '*',
      rule.metricType,
      rule.duration
    );

    const metrics = this.getMetrics(
      rule.moduleName,
      rule.metricType,
      new Date(Date.now() - rule.duration),
      new Date()
    );

    const alert: Alert = {
      id: this.generateId(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, stats),
      triggeredAt: new Date(),
      status: 'active',
      metrics
    };

    this.alerts.set(alert.id, alert);

    if (this.alerts.size > this.config.maxAlerts) {
      const oldest = Array.from(this.alerts.values())
        .sort((a, b) => a.triggeredAt.getTime() - b.triggeredAt.getTime())[0];
      this.alerts.delete(oldest.id);
    }

    await this.sendNotifications(alert);
  }

  private generateAlertMessage(rule: AlertRule, stats: any): string {
    return `${rule.description}. 当前值: ${stats.current}, 阈值: ${rule.threshold}, 趋势: ${stats.trend}`;
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    const channels = this.config.notificationChannels;

    if (channels.email?.enabled && channels.email.smtpConfig) {
      for (const recipient of channels.email.recipients) {
        try {
          await this.sendEmailNotification(recipient, alert);
          this.notifications.push({
            alertId: alert.id,
            channel: 'email',
            recipient,
            message: alert.message,
            sentAt: new Date(),
            status: 'sent'
          });
        } catch (error) {
          this.notifications.push({
            alertId: alert.id,
            channel: 'email',
            recipient,
            message: alert.message,
            sentAt: new Date(),
            status: 'failed'
          });
        }
      }
    }

    if (channels.slack?.enabled) {
      try {
        await this.sendSlackNotification(channels.slack.webhook, alert);
        this.notifications.push({
          alertId: alert.id,
          channel: 'slack',
          recipient: channels.slack.webhook,
          message: alert.message,
          sentAt: new Date(),
          status: 'sent'
        });
      } catch (error) {
        this.notifications.push({
          alertId: alert.id,
          channel: 'slack',
          recipient: channels.slack.webhook,
          message: alert.message,
          sentAt: new Date(),
          status: 'failed'
        });
      }
    }

    if (channels.webhook?.enabled) {
      try {
        await this.sendWebhookNotification(channels.webhook.url, alert);
        this.notifications.push({
          alertId: alert.id,
          channel: 'webhook',
          recipient: channels.webhook.url,
          message: alert.message,
          sentAt: new Date(),
          status: 'sent'
        });
      } catch (error) {
        this.notifications.push({
          alertId: alert.id,
          channel: 'webhook',
          recipient: channels.webhook.url,
          message: alert.message,
          sentAt: new Date(),
          status: 'failed'
        });
      }
    }
  }

  private async sendEmailNotification(recipient: string, alert: Alert): Promise<void> {
    const smtpConfig = this.config.notificationChannels.email?.smtpConfig;
    if (!smtpConfig) {
      throw new Error('SMTP配置未设置');
    }

    const emailContent = {
      from: smtpConfig.from,
      to: recipient,
      subject: `[${alert.severity.toUpperCase()}] ${alert.ruleName}`,
      text: alert.message,
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .alert-box { padding: 20px; border-radius: 5px; margin-bottom: 20px; }
              .critical { background-color: #fee; border: 2px solid #f00; }
              .warning { background-color: #ffd; border: 2px solid #fa0; }
              .info { background-color: #eef; border: 2px solid #00f; }
              .details { margin-top: 20px; padding: 10px; background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <div class="alert-box ${alert.severity}">
              <h2>${alert.ruleName}</h2>
              <p><strong>严重程度:</strong> ${alert.severity}</p>
              <p><strong>触发时间:</strong> ${alert.triggeredAt.toLocaleString('zh-CN')}</p>
              <p><strong>消息:</strong> ${alert.message}</p>
              <div class="details">
                <h3>相关指标:</h3>
                <ul>
                  ${alert.metrics.map(m => `<li>${m.metricType}: ${m.value} ${m.unit} (${m.moduleName})</li>`).join('')}
                </ul>
              </div>
            </div>
          </body>
        </html>
      `
    };

    console.log(`发送邮件通知到 ${recipient}:`, emailContent);
  }

  private async sendSlackNotification(webhook: string, alert: Alert): Promise<void> {
    const slackMessage = {
      text: `[${alert.severity.toUpperCase()}] ${alert.ruleName}`,
      attachments: [
        {
          color: alert.severity === 'critical' ? '#ff0000' : alert.severity === 'warning' ? '#ffaa00' : '#0000ff',
          fields: [
            {
              title: '严重程度',
              value: alert.severity,
              short: true
            },
            {
              title: '触发时间',
              value: alert.triggeredAt.toLocaleString('zh-CN'),
              short: true
            },
            {
              title: '消息',
              value: alert.message,
              short: false
            },
            {
              title: '相关指标',
              value: alert.metrics.map(m => `${m.metricType}: ${m.value} ${m.unit}`).join('\n'),
              short: false
            }
          ]
        }
      ]
    };

    console.log(`发送Slack通知到 ${webhook}:`, slackMessage);
  }

  private async sendWebhookNotification(url: string, alert: Alert): Promise<void> {
    const webhookPayload = {
      alertId: alert.id,
      ruleId: alert.ruleId,
      ruleName: alert.ruleName,
      severity: alert.severity,
      message: alert.message,
      triggeredAt: alert.triggeredAt.toISOString(),
      status: alert.status,
      metrics: alert.metrics.map(m => ({
        id: m.id,
        metricType: m.metricType,
        moduleName: m.moduleName,
        value: m.value,
        unit: m.unit,
        timestamp: m.timestamp.toISOString()
      }))
    };

    console.log(`发送Webhook通知到 ${url}:`, webhookPayload);
  }

  private loadDefaultAlertRules(): void {
    this.addAlertRule({
      name: '高CPU使用率',
      description: 'CPU使用率超过80%',
      metricType: 'cpu',
      condition: 'greater_than',
      threshold: 80,
      duration: 300000,
      severity: 'warning',
      enabled: true,
      cooldown: 600000
    });

    this.addAlertRule({
      name: '内存使用率过高',
      description: '内存使用率超过90%',
      metricType: 'memory',
      condition: 'greater_than',
      threshold: 90,
      duration: 300000,
      severity: 'critical',
      enabled: true,
      cooldown: 600000
    });

    this.addAlertRule({
      name: '响应时间过长',
      description: '响应时间超过5秒',
      metricType: 'response_time',
      condition: 'greater_than',
      threshold: 5000,
      duration: 300000,
      severity: 'warning',
      enabled: true,
      cooldown: 600000
    });

    this.addAlertRule({
      name: '错误率过高',
      description: '错误率超过5%',
      metricType: 'error_rate',
      condition: 'greater_than',
      threshold: 5,
      duration: 300000,
      severity: 'critical',
      enabled: true,
      cooldown: 600000
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown(): Promise<void> {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
  }
}
