import { EventEmitter } from 'events';

export interface DataFlowOptions {
  useCache?: boolean;
  cacheResult?: boolean;
  cacheTTL?: number;
  transform?: (data: any) => Promise<any>;
  priority?: 'low' | 'normal' | 'high';
}

export interface DataFlowResult {
  success: boolean;
  flowId: string;
  duration: number;
  result?: any;
}

export interface DataFlowMetrics {
  flowId: string;
  sourceModule: string;
  targetModule: string;
  duration: number;
  dataSize: number;
  success: boolean;
}

export interface DataFlowErrorMetrics {
  flowId: string;
  sourceModule: string;
  targetModule: string;
  duration: number;
  error: string;
}

export class DataFlowError extends Error {
  constructor(message: string, public metadata: any) {
    super(message);
    this.name = 'DataFlowError';
  }
}

export class EventBus extends EventEmitter {
  async publish(topic: string, message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.emit(topic, message);
      resolve(message);
    });
  }

  subscribe(topic: string, handler: (message: any) => void): void {
    this.on(topic, handler);
  }

  unsubscribe(topic: string, handler: (message: any) => void): void {
    this.off(topic, handler);
  }
}

export class CacheManager {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  async set(key: string, data: any, ttl: number = 3600000): Promise<void> {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export class RetryManager {
  async execute<T>(
    fn: () => Promise<T>,
    options: { maxRetries?: number; backoffMs?: number } = {}
  ): Promise<T> {
    const { maxRetries = 3, backoffMs = 1000 } = options;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = backoffMs * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class MonitoringService {
  private dataFlowMetrics: DataFlowMetrics[] = [];
  private dataFlowErrors: DataFlowErrorMetrics[] = [];
  private cacheHits: Set<string> = new Set();
  private cacheMisses: Set<string> = new Set();

  recordDataFlow(metrics: DataFlowMetrics): void {
    this.dataFlowMetrics.push(metrics);
    
    if (this.dataFlowMetrics.length > 1000) {
      this.dataFlowMetrics = this.dataFlowMetrics.slice(-1000);
    }
  }

  recordDataFlowError(metrics: DataFlowErrorMetrics): void {
    this.dataFlowErrors.push(metrics);
    
    if (this.dataFlowErrors.length > 1000) {
      this.dataFlowErrors = this.dataFlowErrors.slice(-1000);
    }
  }

  recordCacheHit(flowId: string): void {
    this.cacheHits.add(flowId);
  }

  recordCacheMiss(flowId: string): void {
    this.cacheMisses.add(flowId);
  }

  getMetrics(): {
    totalFlows: number;
    successfulFlows: number;
    failedFlows: number;
    averageDuration: number;
    cacheHitRate: number;
  } {
    const totalFlows = this.dataFlowMetrics.length;
    const successfulFlows = this.dataFlowMetrics.filter(m => m.success).length;
    const failedFlows = this.dataFlowErrors.length;
    const averageDuration = totalFlows > 0
      ? this.dataFlowMetrics.reduce((sum, m) => sum + m.duration, 0) / totalFlows
      : 0;
    const cacheHitRate = this.cacheHits.size + this.cacheMisses.size > 0
      ? this.cacheHits.size / (this.cacheHits.size + this.cacheMisses.size)
      : 0;

    return {
      totalFlows,
      successfulFlows,
      failedFlows,
      averageDuration,
      cacheHitRate
    };
  }

  clear(): void {
    this.dataFlowMetrics = [];
    this.dataFlowErrors = [];
    this.cacheHits.clear();
    this.cacheMisses.clear();
  }
}

export class DataFlowManager {
  private eventBus: EventBus;
  private cacheManager: CacheManager;
  private retryManager: RetryManager;
  private monitoring: MonitoringService;

  constructor() {
    this.eventBus = new EventBus();
    this.cacheManager = new CacheManager();
    this.retryManager = new RetryManager();
    this.monitoring = new MonitoringService();
  }

  async sendData(
    sourceModule: string,
    targetModule: string,
    data: any,
    options: DataFlowOptions = {}
  ): Promise<DataFlowResult> {
    const startTime = Date.now();
    const flowId = this.generateFlowId();

    try {
      this.validateData(data);

      const transformedData = await this.transformData(data, options);

      const cached = await this.cacheManager.get(flowId);
      if (cached && options.useCache) {
        this.monitoring.recordCacheHit(flowId);
        return cached;
      }

      const result = await this.retryManager.execute(
        async () => {
          return await this.eventBus.publish(
            `${targetModule}.data.receive`,
            {
              sourceModule,
              flowId,
              data: transformedData,
              timestamp: new Date()
            }
          );
        },
        { maxRetries: 3, backoffMs: 1000 }
      );

      if (options.cacheResult) {
        await this.cacheManager.set(flowId, result, options.cacheTTL);
      }

      const duration = Date.now() - startTime;
      this.monitoring.recordDataFlow({
        flowId,
        sourceModule,
        targetModule,
        duration,
        dataSize: JSON.stringify(data).length,
        success: true
      });

      return {
        success: true,
        flowId,
        duration,
        result
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      this.monitoring.recordDataFlowError({
        flowId,
        sourceModule,
        targetModule,
        duration,
        error: (error as Error).message
      });

      throw new DataFlowError(
        `数据流转失败: ${(error as Error).message}`,
        { flowId, sourceModule, targetModule }
      );
    }
  }

  async broadcastData(
    sourceModule: string,
    targetModules: string[],
    data: any,
    options: DataFlowOptions = {}
  ): Promise<DataFlowResult[]> {
    const results = await Promise.allSettled(
      targetModules.map(targetModule =>
        this.sendData(sourceModule, targetModule, data, options)
      )
    );

    return results.map((result, index) => ({
      success: result.status === 'fulfilled',
      flowId: result.status === 'fulfilled' ? result.value.flowId : '',
      duration: result.status === 'fulfilled' ? result.value.duration : 0,
      result: result.status === 'fulfilled' ? result.value.result : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  async receiveData(
    sourceModule: string,
    flowId: string,
    data: any,
    handler: (data: any) => Promise<any>
  ): Promise<any> {
    try {
      return await handler(data);
    } catch (error) {
      throw new DataFlowError(
        `数据处理失败: ${(error as Error).message}`,
        { sourceModule, flowId }
      );
    }
  }

  private validateData(data: any): void {
    if (!data) {
      throw new Error('数据不能为空');
    }
  }

  private async transformData(
    data: any,
    options: DataFlowOptions
  ): Promise<any> {
    if (options.transform) {
      return await options.transform(data);
    }
    return data;
  }

  private generateFlowId(): string {
    return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  getMonitoringService(): MonitoringService {
    return this.monitoring;
  }

  getMetrics() {
    return this.monitoring.getMetrics();
  }

  async cleanup(): Promise<void> {
    await this.cacheManager.cleanup();
    this.monitoring.clear();
  }
}
