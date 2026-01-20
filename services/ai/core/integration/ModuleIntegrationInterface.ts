export interface ModuleIntegrationInterface {
  moduleType: string;
  version: string;
  capabilities: string[];
  
  initialize(config: ModuleConfig): Promise<InitializationResult>;
  
  sendData(targetModule: string, data: any): Promise<DataTransferResult>;
  receiveData(sourceModule: string, data: any): Promise<DataProcessingResult>;
  
  syncState(targetModule: string): Promise<StateSyncResult>;
  
  publishEvent(event: ModuleEvent): Promise<void>;
  subscribeEvent(eventType: string, handler: EventHandler): Promise<void>;
  
  healthCheck(): Promise<HealthCheckResult>;
  
  shutdown(): Promise<ShutdownResult>;
}

export interface ModuleConfig {
  name: string;
  version: string;
  dependencies: string[];
  configuration?: Record<string, any>;
  settings?: Record<string, any>;
  performance?: PerformanceConfig;
}

export interface PerformanceConfig {
  maxResponseTime: number;
  maxConcurrentRequests: number;
  cacheEnabled: boolean;
  monitoringEnabled: boolean;
}

export interface InitializationResult {
  success: boolean;
  message: string;
  initializedAt: Date;
}

export interface DataTransferResult {
  success: boolean;
  targetModule: string;
  transferredBytes: number;
  transferTime: number;
}

export interface DataProcessingResult {
  success: boolean;
  processedData: any;
  processingTime: number;
  metadata?: {
    sourceModule: string;
    processedAt: Date;
  };
}

export interface StateSyncResult {
  success: boolean;
  targetModule: string;
  syncedState: any;
  syncTime: number;
  syncedAt: Date;
}

export interface ModuleEvent {
  type: string;
  source: string;
  data: any;
  timestamp: Date;
}

export type EventHandler = (event: ModuleEvent) => Promise<void>;

export interface HealthCheckResult {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'not_initialized';
  moduleType?: string;
  version?: string;
  checkedAt?: Date;
  metrics: Record<string, number>;
  lastCheck: Date;
}

export interface ShutdownResult {
  success: boolean;
  message: string;
  shutdownAt: Date;
}

export interface ModuleMetrics {
  moduleType: string;
  version: string;
  initialized: boolean;
  dependencies: string[];
  dataTransfers: number;
  dataReceived: number;
  stateSyncs: number;
  eventsPublished: number;
  eventsSubscribed: number;
  lastActivity: Date;
}

export enum ModuleStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export abstract class BaseModule implements ModuleIntegrationInterface {
  protected config: ModuleConfig;
  protected initialized: boolean = false;
  protected eventHandlers: Map<string, EventHandler[]> = new Map();
  protected dependencies: Map<string, ModuleIntegrationInterface> = new Map();
  protected metrics: ModuleMetrics;
  protected status: ModuleStatus = ModuleStatus.UNINITIALIZED;

  constructor(config: ModuleConfig) {
    this.config = config;
    this.metrics = {
      moduleType: '',
      version: '',
      initialized: false,
      dependencies: [],
      dataTransfers: 0,
      dataReceived: 0,
      stateSyncs: 0,
      eventsPublished: 0,
      eventsSubscribed: 0,
      lastActivity: new Date()
    };
  }

  abstract get moduleType(): string;
  abstract get version(): string;
  abstract get capabilities(): string[];

  async initialize(config: ModuleConfig): Promise<InitializationResult> {
    try {
      this.status = ModuleStatus.INITIALIZING;
      this.config = config;
      
      await this.validateDependencies();
      await this.initializeInternal();
      
      this.initialized = true;
      this.status = ModuleStatus.INITIALIZED;
      this.metrics.moduleType = this.moduleType;
      this.metrics.version = this.version;
      this.metrics.initialized = true;
      this.metrics.dependencies = config.dependencies;
      this.metrics.lastActivity = new Date();
      
      return {
        success: true,
        message: `${this.moduleType} 模块初始化成功`,
        initializedAt: new Date()
      };
    } catch (error) {
      this.status = ModuleStatus.ERROR;
      return {
        success: false,
        message: `${this.moduleType} 模块初始化失败: ${error.message}`,
        initializedAt: new Date()
      };
    }
  }

  protected abstract initializeInternal(): Promise<void>;

  async sendData(targetModule: string, data: any): Promise<DataTransferResult> {
    const startTime = Date.now();
    
    if (!this.initialized) {
      throw new Error('模块未初始化');
    }
    
    try {
      const target = this.dependencies.get(targetModule);
      if (!target) {
        throw new Error('目标模块不存在');
      }
      
      const result = await target.receiveData(this.config.name, data);
      this.metrics.dataTransfers++;
      this.metrics.lastActivity = new Date();
      
      return {
        success: true,
        targetModule,
        transferredBytes: JSON.stringify(data).length,
        transferTime: Date.now() - startTime
      };
    } catch (error) {
      throw error;
    }
  }

  async receiveData(sourceModule: string, data: any): Promise<DataProcessingResult> {
    const startTime = Date.now();
    
    try {
      const processedData = await this.processData(data);
      this.metrics.dataReceived++;
      this.metrics.lastActivity = new Date();
      
      return {
        success: true,
        processedData,
        processingTime: Date.now() - startTime,
        metadata: {
          sourceModule,
          processedAt: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        processedData: null,
        processingTime: Date.now() - startTime,
        metadata: {
          sourceModule,
          processedAt: new Date()
        }
      };
    }
  }

  protected abstract processData(data: any): Promise<any>;

  async syncState(targetModule: string): Promise<StateSyncResult> {
    const startTime = Date.now();
    
    try {
      const target = this.dependencies.get(targetModule);
      if (!target) {
        throw new Error(`目标模块 ${targetModule} 未找到`);
      }
      
      const currentState = await this.getCurrentState();
      const result = await target.receiveData(this.config.name, currentState);
      this.metrics.stateSyncs++;
      this.metrics.lastActivity = new Date();
      
      return {
        success: true,
        targetModule,
        syncedState: result.processedData,
        syncTime: Date.now() - startTime,
        syncedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        targetModule,
        syncedState: null,
        syncTime: Date.now() - startTime,
        syncedAt: new Date()
      };
    }
  }

  protected abstract getCurrentState(): Promise<any>;

  async publishEvent(event: ModuleEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    
    await Promise.all(handlers.map(handler => handler(event)));
    
    this.metrics.eventsPublished++;
    this.metrics.lastActivity = new Date();
  }

  async subscribeEvent(eventType: string, handler: EventHandler): Promise<void> {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
    this.metrics.eventsSubscribed++;
    this.metrics.lastActivity = new Date();
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const metrics = await this.getHealthMetrics();
    
    const status = this.determineHealthStatus(metrics);
    
    const healthy = this.initialized && status === 'healthy';
    
    return {
      healthy,
      status: healthy ? 'healthy' : 'not_initialized',
      moduleType: this.moduleType,
      version: this.version,
      checkedAt: new Date(),
      metrics,
      lastCheck: new Date()
    };
  }

  protected async getHealthMetrics(): Promise<Record<string, number>> {
    return {
      responseTime: 100,
      dataTransfer: this.metrics.dataTransfers,
      dataProcessing: this.metrics.dataReceived,
      stateSync: this.metrics.stateSyncs,
      eventsPublished: this.metrics.eventsPublished,
      eventsSubscribed: this.metrics.eventsSubscribed
    };
  }

  protected determineHealthStatus(metrics: Record<string, number>): 'healthy' | 'degraded' | 'unhealthy' {
    const maxResponseTime = this.config.performance?.maxResponseTime || 1000;
    const currentResponseTime = metrics.responseTime || 0;
    
    if (currentResponseTime > maxResponseTime * 2) {
      return 'unhealthy';
    } else if (currentResponseTime > maxResponseTime) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  async shutdown(): Promise<ShutdownResult> {
    try {
      this.status = ModuleStatus.STOPPING;
      await this.shutdownInternal();
      
      this.eventHandlers.clear();
      this.dependencies.clear();
      this.initialized = false;
      this.status = ModuleStatus.STOPPED;
      this.metrics.initialized = false;
      
      return {
        success: true,
        message: `${this.moduleType} 模块关闭成功`,
        shutdownAt: new Date()
      };
    } catch (error) {
      this.status = ModuleStatus.ERROR;
      return {
        success: false,
        message: `${this.moduleType} 模块关闭失败: ${error.message}`,
        shutdownAt: new Date()
      };
    }
  }

  protected abstract shutdownInternal(): Promise<void>;

  protected async validateDependencies(): Promise<void> {
    for (const depId of this.config.dependencies) {
      if (!this.dependencies.has(depId)) {
        throw new Error(`依赖模块 ${depId} 未注册`);
      }
    }
  }

  registerDependency(module: ModuleIntegrationInterface): void {
    this.dependencies.set(module.moduleType, module);
  }

  unregisterDependency(moduleType: string): void {
    this.dependencies.delete(moduleType);
  }

  addDependency(moduleType: string, module: ModuleIntegrationInterface): void {
    this.dependencies.set(moduleType, module);
    this.metrics.dependencies = Array.from(this.dependencies.keys());
    this.metrics.lastActivity = new Date();
  }

  removeDependency(moduleType: string): void {
    this.dependencies.delete(moduleType);
    this.metrics.dependencies = Array.from(this.dependencies.keys());
    this.metrics.lastActivity = new Date();
  }

  getMetrics(): ModuleMetrics {
    return { ...this.metrics };
  }

  getStatus(): ModuleStatus {
    return this.status;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
