import { ModuleConfig, ModuleMetrics } from '../integration/ModuleIntegrationInterface';

export interface PlatformConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  capabilities: PlatformCapabilities;
  modules: PlatformModule[];
  services: PlatformService[];
  integrations: PlatformIntegration[];
}

export interface PlatformCapabilities {
  ai: AICapabilities;
  compute: ComputeCapabilities;
  storage: StorageCapabilities;
  networking: NetworkingCapabilities;
  security: SecurityCapabilities;
  monitoring: MonitoringCapabilities;
}

export interface AICapabilities {
  models: string[];
  inference: boolean;
  training: boolean;
  fineTuning: boolean;
  deployment: boolean;
  scalability: boolean;
}

export interface ComputeCapabilities {
  cpu: number;
  memory: number;
  gpu?: number;
  tpu?: number;
  quantum?: boolean;
  distributed: boolean;
  autoScaling: boolean;
}

export interface StorageCapabilities {
  databases: string[];
  fileStorage: boolean;
  objectStorage: boolean;
  caching: boolean;
  backup: boolean;
  replication: boolean;
}

export interface NetworkingCapabilities {
  apiGateway: boolean;
  loadBalancing: boolean;
  cdn: boolean;
  websocket: boolean;
  grpc: boolean;
  messageQueue: boolean;
}

export interface SecurityCapabilities {
  authentication: boolean;
  authorization: boolean;
  encryption: boolean;
  audit: boolean;
  compliance: string[];
}

export interface MonitoringCapabilities {
  metrics: boolean;
  logging: boolean;
  tracing: boolean;
  alerting: boolean;
  dashboard: boolean;
}

export interface PlatformModule {
  id: string;
  name: string;
  type: ModuleType;
  version: string;
  status: ModuleStatus;
  dependencies: string[];
  config: ModuleConfig;
  metrics: ModuleMetrics;
  health: HealthStatus;
}

export type ModuleType = 
  | 'ai'
  | 'compute'
  | 'storage'
  | 'networking'
  | 'security'
  | 'monitoring'
  | 'integration'
  | 'custom';

export type ModuleStatus = 
  | 'initialized'
  | 'running'
  | 'stopped'
  | 'error'
  | 'degraded';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  metrics: Record<string, number>;
  issues: HealthIssue[];
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
}

export interface PlatformService {
  id: string;
  name: string;
  type: ServiceType;
  version: string;
  endpoint: string;
  status: ServiceStatus;
  config: ServiceConfig;
  metrics: ServiceMetrics;
}

export type ServiceType = 
  | 'api'
  | 'microservice'
  | 'function'
  | 'worker'
  | 'stream'
  | 'batch';

export type ServiceStatus = 
  | 'running'
  | 'stopped'
  | 'scaling'
  | 'error';

export interface ServiceConfig {
  replicas: number;
  resources: ResourceConfig;
  scaling: ScalingConfig;
  limits: LimitsConfig;
}

export interface ResourceConfig {
  cpu: string;
  memory: string;
  gpu?: string;
}

export interface ScalingConfig {
  minReplicas: number;
  maxReplicas: number;
  targetCPUUtilization?: number;
  targetMemoryUtilization?: number;
  customMetrics?: CustomMetric[];
}

export interface CustomMetric {
  name: string;
  target: number;
}

export interface LimitsConfig {
  maxCPU: string;
  maxMemory: string;
  maxGPU?: string;
}

export interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  latency: number;
  throughput: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  gpu?: number;
}

export interface PlatformIntegration {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  config: IntegrationConfig;
  metrics: IntegrationMetrics;
}

export type IntegrationType = 
  | 'database'
  | 'cache'
  | 'message_queue'
  | 'storage'
  | 'external_api'
  | 'webhook'
  | 'custom';

export type IntegrationStatus = 
  | 'connected'
  | 'disconnected'
  | 'error';

export interface IntegrationConfig {
  endpoint?: string;
  credentials?: Credentials;
  options?: Record<string, any>;
}

export interface Credentials {
  type: 'basic' | 'token' | 'oauth' | 'certificate';
  value: string;
  expiresAt?: Date;
}

export interface IntegrationMetrics {
  connectionCount: number;
  requestCount: number;
  errorCount: number;
  latency: number;
  lastUsed: Date;
}

export interface PlatformMetrics {
  modules: PlatformModuleMetrics;
  services: PlatformServiceMetrics;
  integrations: PlatformIntegrationMetrics;
  resources: PlatformResourceMetrics;
  performance: PlatformPerformanceMetrics;
}

export interface PlatformModuleMetrics {
  total: number;
  running: number;
  stopped: number;
  error: number;
  degraded: number;
}

export interface PlatformServiceMetrics {
  total: number;
  running: number;
  stopped: number;
  scaling: number;
  error: number;
}

export interface PlatformIntegrationMetrics {
  total: number;
  connected: number;
  disconnected: number;
  error: number;
}

export interface PlatformResourceMetrics {
  cpu: ResourceMetric;
  memory: ResourceMetric;
  gpu?: ResourceMetric;
  storage: ResourceMetric;
  network: ResourceMetric;
}

export interface ResourceMetric {
  used: number;
  total: number;
  percentage: number;
}

export interface PlatformPerformanceMetrics {
  latency: PerformanceMetric;
  throughput: PerformanceMetric;
  errorRate: PerformanceMetric;
  availability: PerformanceMetric;
}

export interface PerformanceMetric {
  current: number;
  average: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

export interface PlatformEvent {
  id: string;
  type: EventType;
  source: string;
  timestamp: Date;
  data: any;
  metadata?: EventMetadata;
}

export type EventType = 
  | 'module_status_change'
  | 'service_status_change'
  | 'integration_status_change'
  | 'health_check'
  | 'alert'
  | 'scaling_event'
  | 'deployment_event'
  | 'custom';

export interface EventMetadata {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  tags?: Record<string, string>;
}

export interface PlatformAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  status: AlertStatus;
  metadata?: AlertMetadata;
}

export type AlertType = 
  | 'module_down'
  | 'service_down'
  | 'integration_error'
  | 'resource_exhaustion'
  | 'performance_degradation'
  | 'security_breach'
  | 'custom';

export type AlertSeverity = 
  | 'info'
  | 'warning'
  | 'error'
  | 'critical';

export type AlertStatus = 
  | 'open'
  | 'acknowledged'
  | 'resolved'
  | 'suppressed';

export interface AlertMetadata {
  affectedResources: string[];
  relatedAlerts: string[];
  suggestedActions: string[];
}

export interface PlatformDeployment {
  id: string;
  version: string;
  status: DeploymentStatus;
  modules: DeploymentModule[];
  services: DeploymentService[];
  config: DeploymentConfig;
  metadata: DeploymentMetadata;
}

export type DeploymentStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'rolled_back';

export interface DeploymentModule {
  moduleId: string;
  version: string;
  status: 'deployed' | 'failed' | 'pending';
  timestamp: Date;
}

export interface DeploymentService {
  serviceId: string;
  version: string;
  status: 'deployed' | 'failed' | 'pending';
  timestamp: Date;
}

export interface DeploymentConfig {
  strategy: DeploymentStrategy;
  rollbackOnFailure: boolean;
  healthCheckEnabled: boolean;
  canaryPercentage?: number;
}

export type DeploymentStrategy = 
  | 'rolling'
  | 'blue_green'
  | 'canary'
  | 'recreate';

export interface DeploymentMetadata {
  deployedBy: string;
  deployedAt: Date;
  completedAt?: Date;
  duration?: number;
  changelog?: string;
}

export interface PlatformConfigManager {
  getConfig(): Promise<PlatformConfig>;
  updateConfig(config: Partial<PlatformConfig>): Promise<PlatformConfig>;
  validateConfig(config: PlatformConfig): Promise<boolean>;
  exportConfig(): Promise<string>;
  importConfig(config: string): Promise<PlatformConfig>;
}

export interface PlatformModuleManager {
  getModule(id: string): Promise<PlatformModule>;
  getModules(filter?: ModuleFilter): Promise<PlatformModule[]>;
  addModule(module: Omit<PlatformModule, 'id'>): Promise<PlatformModule>;
  updateModule(id: string, updates: Partial<PlatformModule>): Promise<PlatformModule>;
  removeModule(id: string): Promise<void>;
  startModule(id: string): Promise<void>;
  stopModule(id: string): Promise<void>;
  restartModule(id: string): Promise<void>;
  getModuleHealth(id: string): Promise<HealthStatus>;
}

export interface ModuleFilter {
  type?: ModuleType;
  status?: ModuleStatus;
  version?: string;
  tags?: string[];
}

export interface PlatformServiceManager {
  getService(id: string): Promise<PlatformService>;
  getServices(filter?: ServiceFilter): Promise<PlatformService[]>;
  addService(service: Omit<PlatformService, 'id'>): Promise<PlatformService>;
  updateService(id: string, updates: Partial<PlatformService>): Promise<PlatformService>;
  removeService(id: string): Promise<void>;
  scaleService(id: string, replicas: number): Promise<void>;
  getServiceMetrics(id: string): Promise<ServiceMetrics>;
}

export interface ServiceFilter {
  type?: ServiceType;
  status?: ServiceStatus;
  version?: string;
  tags?: string[];
}

export interface PlatformIntegrationManager {
  getIntegration(id: string): Promise<PlatformIntegration>;
  getIntegrations(filter?: IntegrationFilter): Promise<PlatformIntegration[]>;
  addIntegration(integration: Omit<PlatformIntegration, 'id'>): Promise<PlatformIntegration>;
  updateIntegration(id: string, updates: Partial<PlatformIntegration>): Promise<PlatformIntegration>;
  removeIntegration(id: string): Promise<void>;
  testIntegration(id: string): Promise<boolean>;
  getIntegrationMetrics(id: string): Promise<IntegrationMetrics>;
}

export interface IntegrationFilter {
  type?: IntegrationType;
  status?: IntegrationStatus;
  tags?: string[];
}

export interface PlatformMetricsManager {
  getMetrics(): Promise<PlatformMetrics>;
  getModuleMetrics(moduleId: string): Promise<ModuleMetrics>;
  getServiceMetrics(serviceId: string): Promise<ServiceMetrics>;
  getIntegrationMetrics(integrationId: string): Promise<IntegrationMetrics>;
  getResourceMetrics(): Promise<PlatformResourceMetrics>;
  getPerformanceMetrics(): Promise<PlatformPerformanceMetrics>;
}

export interface PlatformEventManager {
  publishEvent(event: Omit<PlatformEvent, 'id'>): Promise<PlatformEvent>;
  subscribeEvent(eventType: EventType, handler: EventHandler): Promise<void>;
  unsubscribeEvent(eventType: EventType, handler: EventHandler): Promise<void>;
  getEvents(filter?: EventFilter): Promise<PlatformEvent[]>;
}

export type EventHandler = (event: PlatformEvent) => Promise<void>;

export interface EventFilter {
  type?: EventType;
  source?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}

export interface PlatformAlertManager {
  getAlert(id: string): Promise<PlatformAlert>;
  getAlerts(filter?: AlertFilter): Promise<PlatformAlert[]>;
  acknowledgeAlert(id: string): Promise<void>;
  resolveAlert(id: string): Promise<void>;
  suppressAlert(id: string, duration: number): Promise<void>;
  createAlert(alert: Omit<PlatformAlert, 'id'>): Promise<PlatformAlert>;
  updateAlert(id: string, updates: Partial<PlatformAlert>): Promise<PlatformAlert>;
}

export interface AlertFilter {
  type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  source?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface PlatformDeploymentManager {
  getDeployment(id: string): Promise<PlatformDeployment>;
  getDeployments(filter?: DeploymentFilter): Promise<PlatformDeployment[]>;
  createDeployment(deployment: Omit<PlatformDeployment, 'id'>): Promise<PlatformDeployment>;
  deploy(config: DeploymentConfig): Promise<PlatformDeployment>;
  rollback(id: string): Promise<PlatformDeployment>;
  getDeploymentStatus(id: string): Promise<DeploymentStatus>;
}

export interface DeploymentFilter {
  status?: DeploymentStatus;
  version?: string;
  deployedBy?: string;
  startTime?: Date;
  endTime?: Date;
}
